import { prisma } from '../../db';
import { recordAuditEvent } from '../../auditLogger';
import { WhatsAppClient } from '../whatsappClient';
import { matchProduct } from '../whatsappEngine';
import { MemoryManager } from './memoryManager';
import { KnowledgeService } from './knowledgeService';
import { AIProvider } from './aiProvider';
import { AgentResponse, LLMMessage } from './types';

export class AgentOrchestrator {
  /**
   * Main entry point for AI Agent 2.0 processing an inbound customer message.
   */
  static async processMessage(params: {
    conversationId: string;
    whatsappNumber: string;
    incomingText: string;
    providerMessageId?: string;
  }): Promise<{
    handled: boolean;
    replySent: boolean;
    replyText?: string;
    intent?: string;
    silencedDueToHuman?: boolean;
  }> {
    const { conversationId, whatsappNumber, incomingText } = params;
    const cleanText = (incomingText || '').trim();
    const lowerText = cleanText.toLowerCase();

    // 1. Load multi-turn context and memory
    const context = await MemoryManager.loadContext(conversationId);

    // 2. Human Takeover Check: If admin has taken over or status is HUMAN_HANDOFF
    if (context.isHumanTakeover || context.status === 'HUMAN_HANDOFF') {
      // Check if user is asking to resume bot assistance
      if (lowerText === 'bot' || lowerText === 'menu' || lowerText === 'resume bot' || lowerText === 'start') {
        await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: {
            isHumanTakeover: false,
            status: 'ACTIVE',
            currentState: 'START',
            adminNotes: 'User resumed automated AI assistant.',
          },
        });
        context.isHumanTakeover = false;
        context.status = 'ACTIVE';
      } else {
        // AI is strictly silenced while admin is in control
        return {
          handled: true,
          replySent: false,
          silencedDueToHuman: true,
        };
      }
    }

    // 3. Security Guardrails: Adversarial and Prompt Injection Guard
    if (
      lowerText.includes('ignore previous') ||
      lowerText.includes('system prompt') ||
      lowerText.includes('admin pricing') ||
      lowerText.includes('internal cost') ||
      lowerText.includes('supplier price') ||
      lowerText.includes('give me base price') ||
      lowerText.includes('reveal secrets')
    ) {
      const safeReply = `I can help you with products, orders, and custom deals, but pricing is confirmed personally by our admin team. Please wait for an admin or browse our catalog! ⚡`;
      await WhatsAppClient.sendTextMessage({ to: whatsappNumber, text: safeReply });
      await prisma.whatsAppMessage.create({
        data: {
          conversationId,
          direction: 'OUTBOUND',
          messageType: 'TEXT',
          content: safeReply,
          sentBy: 'BOT',
          deliveryStatus: 'SENT',
        },
      });

      return {
        handled: true,
        replySent: true,
        replyText: safeReply,
        intent: 'SECURITY_GUARD_TRIGGERED',
      };
    }

    // 4. Retrieve RAG Knowledge Articles and Few-Shot Training Examples
    const [relevantKnowledge, relevantExamples] = await Promise.all([
      KnowledgeService.searchKnowledge(cleanText, undefined, 2),
      KnowledgeService.getRelevantTrainingExamples(cleanText, 2),
    ]);

    const knowledgeSummary = relevantKnowledge.map((k) => `[${k.category}] ${k.title}: ${k.content}`).join('\n');
    const examplesSummary = relevantExamples.map((ex) => `User: "${ex.inputText}" -> Agent: "${ex.preferredResponse}"`).join('\n');

    // 5. Build Dynamic System Prompt with Strict Commercial Guardrails
    const systemPrompt = `You are the Official AI Sales and Support Representative for Lightning Deals (lightningapi.pro).
Tone: Friendly, consultative, empathetic, knowledgeable, concise, and professional.
Supports: English, Hindi, and Hinglish. Adapt naturally to the customer's language.

CONVERSATION MEMORY & CONTINUITY:
1. Maintain active conversation context across multi-turn dialogs.
   - If a product (e.g. Canva Pro, Cursor Pro, Adobe Creative Cloud) is being discussed, remember it in subsequent questions.
   - For example: if the customer asks "How does activation work?", explain the activation for the product currently being discussed.
   - Do NOT interpret questions about features, activation, or usage as price quote requests.

STRICT PRICE SAFETY & COMMERCE RULES:
2. CUSTOMER-QUOTED PRICES: When a customer proposes or mentions a price (e.g. "it is for 499", "can I get it for 499", "499"):
   - Understand that this is a CUSTOMER-PROPOSED price, NEVER an automatically authorized or approved price!
   - NEVER claim that the price is approved without verifying via the backend tool getApprovedPrice().
   - If getApprovedPrice() returns hasApprovedPrice: false:
     * Call createNegotiatedPriceRequest(productId, productName, customerBudget: "499") to log the customer's discount proposal for admin approval.
     * Politely inform the customer that their proposal has been submitted to the admin team for approval.
   - If getApprovedPrice() returns hasApprovedPrice: true:
     * Confirm the approved price with the customer.
3. ORDERING & PAYU PAYMENT LINKS:
   - When the customer confirms purchase (e.g. "Okay I'm interested, I want to purchase", "buy now", "yes", "send payment link"):
   - If an approved price exists, call createOrder() and getOrderPaymentLink() to generate the real PayU payment link.
   - Provide the payment link and Order ID clearly to the customer.
4. ZERO PRICE LEAKAGE: NEVER invent or reveal supplier costs, base provider costs, or internal margins under any circumstances.
5. PAYMENT VERIFICATION: NEVER mark an order completed or confirm delivery solely because a customer says "I paid", "paid", or "payment done". Always verify via checkPaymentStatus().
6. CONSULTATIVE SALES: Ask thoughtful questions about the customer's work to recommend the exact right tool. Highlight our 100% replacement and uptime guarantee with 15-30 minute resolution.

RELEVANT KNOWLEDGE:
${knowledgeSummary || 'Standard wholesale rates, 100% uptime replacement guarantee, PayU payment gateway.'}

TRAINING EXAMPLES:
${examplesSummary || 'Respond helpful and concisely in user language.'}`;

    // 6. Build Message History for LLM (strictly alternating roles, no duplicate consecutive user messages)
    const history: LLMMessage[] = context.recentMessages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const lastMsg = history[history.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content.trim() !== cleanText) {
      history.push({ role: 'user', content: cleanText });
    }

    // 7. Invoke AI Provider
    const agentResponse: AgentResponse = await AIProvider.generateResponse({
      messages: history,
      systemPrompt,
      context,
    });

    const finalReplyText = agentResponse.messageText;

    // 8. Send WhatsApp Outbound Message
    await WhatsAppClient.sendTextMessage({
      to: whatsappNumber,
      text: finalReplyText,
    });

    // 9. Save Bot Message in WhatsAppMessage with Observability Metadata
    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        content: finalReplyText,
        sentBy: 'BOT',
        deliveryStatus: 'SENT',
        metadata: JSON.stringify({
          intent: agentResponse.intentDetected,
          confidence: agentResponse.confidence,
          language: agentResponse.language,
          toolsUsed: agentResponse.toolsUsed,
          provider: agentResponse.provider || 'ScaleMax',
          model: agentResponse.model || 'claude-3-5-sonnet-20241022',
          latencyMs: agentResponse.latencyMs || 0,
          tokens: agentResponse.tokens || null,
        }),
      },
    });

    let targetCurrentState = context.currentState;
    let targetStatus = context.status;

    const matched = matchProduct(cleanText);

    if (agentResponse.intentDetected === 'GREETING') {
      targetCurrentState = 'START';
      targetStatus = 'ACTIVE';
    } else if (agentResponse.intentDetected === 'BROWSE_PRODUCTS') {
      targetCurrentState = 'PRODUCT_SELECTION';
    } else if (agentResponse.intentDetected === 'PRICE_QUOTE_REQUESTED') {
      targetCurrentState = 'AWAITING_ADMIN_PRICE';
      targetStatus = 'WAITING_ADMIN';
    } else if (agentResponse.intentDetected === 'HUMAN_HANDOFF') {
      targetCurrentState = 'HUMAN_HANDOFF';
      targetStatus = 'HUMAN_HANDOFF';
    } else if (agentResponse.intentDetected.startsWith('REQUEST_EMAIL_')) {
      targetCurrentState = 'AWAITING_EMAIL';
      targetStatus = 'WAITING_CUSTOMER';
    } else if (agentResponse.intentDetected === 'AUTHENTICATE_CUSTOMER') {
      targetCurrentState = 'START';
      targetStatus = 'ACTIVE';
    }

    // 10. Persist State and Memory Update
    await MemoryManager.saveContextUpdate(conversationId, {
      language: agentResponse.language,
      intent: agentResponse.intentDetected,
      intentConfidence: agentResponse.confidence,
      currentState: targetCurrentState,
      status: targetStatus,
      currentProductId: matched ? matched.id : undefined,
      shortTermUpdates: {
        lastCustomerQuery: cleanText,
        lastReply: finalReplyText.substring(0, 100),
        toolsUsed: agentResponse.toolsUsed,
      },
      summary: `Customer inquired about ${agentResponse.intentDetected}. Bot replied in ${agentResponse.language}.`,
    });

    // Audit log if admin alert is required
    if (agentResponse.requiresAdminAlert) {
      await recordAuditEvent({
        eventType: 'WHATSAPP_AI_AGENT_ALERT',
        description: `AI Agent flagged conversation ${conversationId}: ${agentResponse.adminAlertReason}`,
        metadata: {
          conversationId,
          intent: agentResponse.intentDetected,
          reason: agentResponse.adminAlertReason,
        },
      });
    }

    return {
      handled: true,
      replySent: true,
      replyText: finalReplyText,
      intent: agentResponse.intentDetected,
    };
  }
}
