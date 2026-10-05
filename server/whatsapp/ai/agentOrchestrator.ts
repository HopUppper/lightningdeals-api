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

STRICT COMMERCIAL POLICIES:
1. ZERO PRICE LEAKAGE: NEVER invent or reveal supplier costs, base prices, or internal margins under any circumstances. All quotes are customized and confirmed by the admin team unless pre-approved in the customer account.
2. PAYMENT VERIFICATION: NEVER mark an order completed or promise delivery solely because a customer says "I paid". Always verify via backend check.
3. CONSULTATIVE SALES: Ask thoughtful questions about the customer's work (developer, content creator, agency) to recommend the exact right tool (Cursor Pro, Canva Pro, Claude Max, Adobe CC).
4. REPLACEMENT GUARANTEE: Highlight our 100% replacement and uptime guarantee with 15-30 minute resolution.

RELEVANT KNOWLEDGE:
${knowledgeSummary || 'Standard wholesale rates, 100% uptime replacement guarantee, PayU payment gateway.'}

TRAINING EXAMPLES:
${examplesSummary || 'Respond helpful and concisely in user language.'}`;

    // 6. Build Message History for LLM
    const messages: LLMMessage[] = [
      ...context.recentMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: cleanText },
    ];

    // 7. Invoke AI Provider
    const agentResponse: AgentResponse = await AIProvider.generateResponse({
      messages,
      systemPrompt,
      context,
    });

    const finalReplyText = agentResponse.messageText;

    // 8. Send WhatsApp Outbound Message
    await WhatsAppClient.sendTextMessage({
      to: whatsappNumber,
      text: finalReplyText,
    });

    // 9. Save Bot Message in WhatsAppMessage
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
