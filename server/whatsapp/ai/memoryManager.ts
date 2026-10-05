import { prisma } from '../../db';
import { AgentContext } from './types';

export class MemoryManager {
  /**
   * Loads full conversation context, memory, and customer profile
   */
  static async loadContext(conversationId: string): Promise<AgentContext> {
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        aiState: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    let shortTermMemory: Record<string, any> = {};
    let longTermMemory: Record<string, any> = {};

    if (conversation.aiState?.shortTermMemory) {
      try {
        shortTermMemory = JSON.parse(conversation.aiState.shortTermMemory);
      } catch {
        shortTermMemory = {};
      }
    }

    if (conversation.aiState?.longTermMemory) {
      try {
        longTermMemory = JSON.parse(conversation.aiState.longTermMemory);
      } catch {
        longTermMemory = {};
      }
    }

    // Format recent messages chronologically
    const recentMessages = [...conversation.messages]
      .reverse()
      .map((msg) => ({
        role: (msg.sentBy === 'CUSTOMER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.createdAt,
      }));

    return {
      conversationId: conversation.id,
      whatsappNumber: conversation.whatsappNumber,
      customerName: conversation.customerName || conversation.customer?.name || null,
      customerId: conversation.customerId || null,
      customerEmail: conversation.customer?.email || null,
      currentOrderId: conversation.currentOrderId || null,
      currentProductId: conversation.currentProductId || null,
      currentState: conversation.currentState,
      status: conversation.status,
      isHumanTakeover: conversation.isHumanTakeover || conversation.status === 'HUMAN_HANDOFF',
      shortTermMemory,
      longTermMemory,
      conversationSummary: conversation.aiState?.summary || undefined,
      recentMessages,
    };
  }

  /**
   * Updates state, memory, and intent in AIConversationState
   */
  static async saveContextUpdate(
    conversationId: string,
    updates: {
      shortTermUpdates?: Record<string, any>;
      longTermUpdates?: Record<string, any>;
      summary?: string;
      language?: string;
      intent?: string;
      intentConfidence?: number;
      currentProductId?: string | null;
      currentProductName?: string | null;
      currentOrderId?: string | null;
      status?: string;
      currentState?: string;
    }
  ): Promise<void> {
    const existingAiState = await prisma.aIConversationState.findUnique({
      where: { conversationId },
    });

    let currentShort: Record<string, any> = {};
    let currentLong: Record<string, any> = {};

    if (existingAiState?.shortTermMemory) {
      try {
        currentShort = JSON.parse(existingAiState.shortTermMemory);
      } catch {}
    }
    if (existingAiState?.longTermMemory) {
      try {
        currentLong = JSON.parse(existingAiState.longTermMemory);
      } catch {}
    }

    const mergedShort = { ...currentShort, ...(updates.shortTermUpdates || {}) };
    const mergedLong = { ...currentLong, ...(updates.longTermUpdates || {}) };

    await prisma.aIConversationState.upsert({
      where: { conversationId },
      create: {
        conversationId,
        shortTermMemory: JSON.stringify(mergedShort),
        longTermMemory: JSON.stringify(mergedLong),
        summary: updates.summary || null,
        language: updates.language || 'en',
        lastIntent: updates.intent || null,
        intentConfidence: updates.intentConfidence || 0.9,
      },
      update: {
        shortTermMemory: JSON.stringify(mergedShort),
        longTermMemory: JSON.stringify(mergedLong),
        ...(updates.summary && { summary: updates.summary }),
        ...(updates.language && { language: updates.language }),
        ...(updates.intent && { lastIntent: updates.intent }),
        ...(updates.intentConfidence !== undefined && { intentConfidence: updates.intentConfidence }),
      },
    });

    // Update parent WhatsAppConversation if state/product/order changed
    const convUpdate: Record<string, any> = {};
    if (updates.currentProductId !== undefined) convUpdate.currentProductId = updates.currentProductId;
    if (updates.currentProductName !== undefined) convUpdate.currentProductName = updates.currentProductName;
    if (updates.currentOrderId !== undefined) convUpdate.currentOrderId = updates.currentOrderId;
    if (updates.status) convUpdate.status = updates.status;
    if (updates.currentState) convUpdate.currentState = updates.currentState;

    if (Object.keys(convUpdate).length > 0) {
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: convUpdate,
      });
    }
  }
}
