import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateJwt, AuthRequest } from '../auth';
import { recordAuditEvent } from '../auditLogger';
import { KnowledgeService } from './ai/knowledgeService';
import { AIProvider } from './ai/aiProvider';
import { MemoryManager } from './ai/memoryManager';
import { WhatsAppClient } from './whatsappClient';

export const adminAIRouter = Router();

// Strict Admin-only middleware
const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

adminAIRouter.use(authenticateJwt, requireAdmin);

/**
 * 1. AI CONFIGURATION & MODEL MANAGEMENT
 */
adminAIRouter.get('/config', async (req: AuthRequest, res: Response) => {
  try {
    let config = await prisma.aIConfiguration.findUnique({
      where: { key: 'default' },
    });

    if (!config) {
      config = await prisma.aIConfiguration.create({
        data: {
          key: 'default',
          modelProvider: 'auto',
          modelName: 'claude-3-5-sonnet-20241022',
          temperature: 0.3,
          handoffThreshold: 0.6,
          enabled: true,
        },
      });
    }

    const availableKeys = {
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      hasGeminiKey: Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
    };

    return res.json({ config, availableKeys });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.post('/config', async (req: AuthRequest, res: Response) => {
  try {
    const { modelProvider, modelName, temperature, handoffThreshold, enabled, autoNegotiationEnabled } = req.body;

    const updated = await prisma.aIConfiguration.upsert({
      where: { key: 'default' },
      create: {
        key: 'default',
        modelProvider: modelProvider || 'auto',
        modelName: modelName || 'claude-3-5-sonnet-20241022',
        temperature: temperature !== undefined ? Number(temperature) : 0.3,
        handoffThreshold: handoffThreshold !== undefined ? Number(handoffThreshold) : 0.6,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        autoNegotiationEnabled: Boolean(autoNegotiationEnabled),
      },
      update: {
        ...(modelProvider && { modelProvider }),
        ...(modelName && { modelName }),
        ...(temperature !== undefined && { temperature: Number(temperature) }),
        ...(handoffThreshold !== undefined && { handoffThreshold: Number(handoffThreshold) }),
        ...(enabled !== undefined && { enabled: Boolean(enabled) }),
        ...(autoNegotiationEnabled !== undefined && { autoNegotiationEnabled: Boolean(autoNegotiationEnabled) }),
      },
    });

    await recordAuditEvent({
      eventType: 'AI_CONFIGURATION_UPDATED',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      description: `AI Agent configuration updated: provider=${updated.modelProvider}, model=${updated.modelName}`,
      metadata: req.body,
    });

    return res.json({ success: true, config: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 2. KNOWLEDGE BASE (RAG) CRUD
 */
adminAIRouter.get('/knowledge', async (req: AuthRequest, res: Response) => {
  try {
    await KnowledgeService.seedDefaultsIfNeeded();
    const { category, search } = req.query;

    const where: any = {};
    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } },
        { keywords: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const items = await prisma.aIKnowledge.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({ items, count: items.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.post('/knowledge', async (req: AuthRequest, res: Response) => {
  try {
    const { category, title, content, keywords, tags, priority, enabled } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required.' });
    }

    const item = await prisma.aIKnowledge.create({
      data: {
        category: category.toUpperCase(),
        title: title.trim(),
        content: content.trim(),
        keywords: keywords?.trim() || null,
        tags: tags?.trim() || null,
        priority: priority !== undefined ? Number(priority) : 0,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
      },
    });

    await recordAuditEvent({
      eventType: 'AI_KNOWLEDGE_CREATED',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      description: `New AI Knowledge article added: "${item.title}" (${item.category})`,
      metadata: { id: item.id },
    });

    return res.status(201).json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.put('/knowledge/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { category, title, content, keywords, tags, priority, enabled } = req.body;

    const item = await prisma.aIKnowledge.update({
      where: { id },
      data: {
        ...(category && { category: category.toUpperCase() }),
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(keywords !== undefined && { keywords }),
        ...(tags !== undefined && { tags }),
        ...(priority !== undefined && { priority: Number(priority) }),
        ...(enabled !== undefined && { enabled: Boolean(enabled) }),
      },
    });

    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.delete('/knowledge/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.aIKnowledge.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. TEACH BOT / TRAINING EXAMPLES CRUD
 */
adminAIRouter.get('/training', async (req: AuthRequest, res: Response) => {
  try {
    await KnowledgeService.seedDefaultsIfNeeded();
    const { intent, language, search } = req.query;

    const where: any = {};
    if (intent && typeof intent === 'string' && intent !== 'ALL') {
      where.expectedIntent = intent;
    }
    if (language && typeof language === 'string' && language !== 'ALL') {
      where.language = language;
    }
    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { inputText: { contains: search.trim(), mode: 'insensitive' } },
        { preferredResponse: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const examples = await prisma.aITrainingExample.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ examples, count: examples.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.post('/training', async (req: AuthRequest, res: Response) => {
  try {
    const { inputText, expectedIntent, preferredResponse, productId, language, tags, enabled } = req.body;

    if (!inputText || !preferredResponse) {
      return res.status(400).json({ error: 'inputText and preferredResponse are required.' });
    }

    const example = await prisma.aITrainingExample.create({
      data: {
        inputText: inputText.trim(),
        expectedIntent: expectedIntent || 'GENERAL',
        preferredResponse: preferredResponse.trim(),
        productId: productId || null,
        language: language || 'hinglish',
        tags: tags || null,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        createdBy: req.user!.id,
      },
    });

    await recordAuditEvent({
      eventType: 'AI_BOT_TAUGHT',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      description: `Bot taught new response for: "${example.inputText}"`,
      metadata: { id: example.id },
    });

    return res.status(201).json({ success: true, example });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.put('/training/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { inputText, expectedIntent, preferredResponse, productId, language, tags, enabled } = req.body;

    const updated = await prisma.aITrainingExample.update({
      where: { id },
      data: {
        ...(inputText && { inputText: inputText.trim() }),
        ...(expectedIntent && { expectedIntent }),
        ...(preferredResponse && { preferredResponse: preferredResponse.trim() }),
        ...(productId !== undefined && { productId }),
        ...(language && { language }),
        ...(tags !== undefined && { tags }),
        ...(enabled !== undefined && { enabled: Boolean(enabled) }),
      },
    });

    return res.json({ success: true, example: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.delete('/training/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.aITrainingExample.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 4. FEEDBACK & RATINGS REVIEW
 */
adminAIRouter.get('/feedback', async (req: AuthRequest, res: Response) => {
  try {
    const feedbacks = await prisma.aIFeedback.findMany({
      include: {
        conversation: {
          select: { id: true, whatsappNumber: true, customerName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ feedbacks, count: feedbacks.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.patch('/feedback/:id/review', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewed, correctedResponse } = req.body;

    const updated = await prisma.aIFeedback.update({
      where: { id },
      data: {
        reviewed: reviewed !== undefined ? Boolean(reviewed) : true,
        ...(correctedResponse && { correctedResponse }),
      },
    });

    return res.json({ success: true, feedback: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 5. ADMIN TAKEOVER & RELEASE CHAT
 */
adminAIRouter.post('/conversations/:id/takeover', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Admin manual takeover' } = req.body;

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        isHumanTakeover: true,
        takeoverReason: reason,
        takenOverAt: new Date(),
        assignedAdminId: req.user!.id,
        status: 'HUMAN_HANDOFF',
        currentState: 'HUMAN_HANDOFF',
      },
    });

    // Notify customer in chat that an admin took over
    const takeoverNotice = `👤 *Admin Support Active*\n\nAn admin team member has joined this conversation. How may we assist you? ⚡`;
    await WhatsAppClient.sendTextMessage({ to: updated.whatsappNumber, text: takeoverNotice });

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: id,
        direction: 'OUTBOUND',
        messageType: 'SYSTEM_NOTE',
        content: takeoverNotice,
        sentBy: 'ADMIN',
        senderId: req.user!.id,
      },
    });

    await recordAuditEvent({
      eventType: 'AI_CHAT_TAKEOVER',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      description: `Admin ${req.user!.name} took over WhatsApp conversation ${id}`,
      metadata: { conversationId: id, reason },
    });

    return res.json({ success: true, conversation: updated, isHumanTakeover: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminAIRouter.post('/conversations/:id/release', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        isHumanTakeover: false,
        takeoverReason: null,
        takenOverAt: null,
        status: 'ACTIVE',
        currentState: 'START',
      },
    });

    const releaseNotice = `⚡ *AI Assistant Resumed*\n\nAutomated assistance has been resumed. Feel free to ask about products, orders, or custom deals! ⚡`;
    await WhatsAppClient.sendTextMessage({ to: updated.whatsappNumber, text: releaseNotice });

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: id,
        direction: 'OUTBOUND',
        messageType: 'SYSTEM_NOTE',
        content: releaseNotice,
        sentBy: 'ADMIN',
        senderId: req.user!.id,
      },
    });

    await recordAuditEvent({
      eventType: 'AI_CHAT_RELEASED',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      description: `Admin released WhatsApp conversation ${id} back to AI Agent`,
      metadata: { conversationId: id },
    });

    return res.json({ success: true, conversation: updated, isHumanTakeover: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 6. AI ANALYTICS & METRICS
 */
adminAIRouter.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalConversations,
      humanTakeoverCount,
      aiActiveCount,
      totalToolExecutions,
      toolExecutionsByTool,
      feedbacks,
    ] = await Promise.all([
      prisma.whatsAppConversation.count(),
      prisma.whatsAppConversation.count({ where: { isHumanTakeover: true } }),
      prisma.whatsAppConversation.count({ where: { isHumanTakeover: false } }),
      prisma.aIToolExecution.count(),
      prisma.aIToolExecution.groupBy({
        by: ['toolName'],
        _count: { id: true },
      }),
      prisma.aIFeedback.findMany({ select: { rating: true } }),
    ]);

    const avgRating =
      feedbacks.length > 0
        ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
        : 5.0;

    return res.json({
      totalConversations,
      humanTakeoverCount,
      aiActiveCount,
      aiAutomationRate: totalConversations > 0 ? Math.round((aiActiveCount / totalConversations) * 100) : 100,
      totalToolExecutions,
      toolBreakdown: toolExecutionsByTool.map((t) => ({ tool: t.toolName, count: t._count.id })),
      averageCustomerSatisfaction: Math.round(avgRating * 10) / 10,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 7. INTERACTIVE AI TEST SIMULATOR
 * Test AI responses in real-time from the Admin Console without sending real WhatsApp messages
 */
adminAIRouter.post('/simulate', async (req: AuthRequest, res: Response) => {
  try {
    const { text, conversationId, simulatedEmail } = req.body;
    if (!text) return res.status(400).json({ error: 'Text query is required.' });

    // Mock or existing context
    let context: any;
    if (conversationId) {
      context = await MemoryManager.loadContext(conversationId);
    } else {
      context = {
        conversationId: 'simulated_conv_id',
        whatsappNumber: '919876543210',
        customerName: 'Test Simulation Customer',
        customerId: null,
        currentState: 'START',
        status: 'ACTIVE',
        isHumanTakeover: false,
        recentMessages: [],
      };
    }

    if (simulatedEmail) {
      const u = await prisma.user.findUnique({ where: { email: simulatedEmail } });
      if (u) {
        context.customerId = u.id;
        context.customerName = u.name;
        context.customerEmail = u.email;
      }
    }

    const resp = await AIProvider.generateLocalSemanticResponse(text, context);
    return res.json({
      success: true,
      input: text,
      response: resp,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
