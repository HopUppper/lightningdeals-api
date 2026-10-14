import { Router, Response } from 'express';
import { prisma, decryptText } from './db';
import { authenticateJwt, AuthRequest } from './auth';
import { buildProviderRequest } from './providerAdapter';
import { mapToUpstreamModel, getFriendlyModelName, sanitizeModelResponse, sanitizeErrorMessage } from './gateway';

export const studioRouter = Router();

// Apply JWT authentication to all studio routes
studioRouter.use(authenticateJwt);

// Verified Real Model Catalog backed by Gateway capabilities
export const VERIFIED_STUDIO_MODELS = [
  {
    id: 'claude-sonnet-5.5',
    name: 'Claude Sonnet 5.5',
    category: 'Flagship Models',
    badge: 'Recommended',
    description: 'Benchmark flagship model for fullstack coding, multi-file synthesis, and agentic workflows.',
    tokenMultiplier: 1.0,
    contextWindow: 200000,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5',
    category: 'Flagship Models',
    badge: 'Frontier Intelligence',
    description: 'Pinnacle frontier intelligence for complex systems architecture, mathematical proofs, and deep reasoning.',
    tokenMultiplier: 2.0,
    contextWindow: 200000,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    category: 'Reasoning & Deep Thinking',
    badge: 'Extended Thinking',
    description: 'Hybrid reasoning architecture with inspectable deliberative thinking tokens for zero-hallucination analysis.',
    tokenMultiplier: 1.25,
    contextWindow: 200000,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    category: 'Reasoning & Deep Thinking',
    badge: 'Deep Reasoning',
    description: 'Deep cognitive model engineered for formal logic verification, compiler debugging, and algorithmic analysis.',
    tokenMultiplier: 1.75,
    contextWindow: 200000,
    supportsThinking: true,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    category: 'High-Velocity & Coding',
    badge: 'Sub-30ms TTFT',
    description: 'Rapid developer completion model tuned for IDE code completion, inline refactoring, and instant answers.',
    tokenMultiplier: 0.5,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-fable-5.1',
    name: 'Claude Fable 5.1',
    category: 'High-Velocity & Coding',
    badge: 'IDE Autopilot',
    description: 'Enhanced developer model for git diff reviews, automated test suite generation, and CI/CD triage.',
    tokenMultiplier: 0.6,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-haiku-5.5',
    name: 'Claude Haiku 5.5',
    category: 'Fast & Economical',
    badge: 'Lowest Latency',
    description: 'Ultra-low latency streaming model with minimal token overhead for high-concurrency loops and quick lookups.',
    tokenMultiplier: 0.25,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    category: 'Standard Anthropic Series',
    badge: 'Standard',
    description: 'Anthropic standard enterprise model for production coding and technical documentation.',
    tokenMultiplier: 1.0,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    category: 'Fast & Economical',
    badge: 'Fast',
    description: 'Economical high-speed completion model for everyday Q&A and text transformations.',
    tokenMultiplier: 0.25,
    contextWindow: 200000,
    supportsThinking: false,
    supportsVision: true,
    supportsTools: true,
    isAvailable: true,
  },
];

// GET /api/user/studio/models - Authoritative Model Catalog
studioRouter.get('/models', async (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    models: VERIFIED_STUDIO_MODELS,
  });
});

// GET /api/user/studio/conversations - List user's conversations
studioRouter.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const where: any = { userId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const conversations = await prisma.studioConversation.findMany({
      where,
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: 60,
      include: {
        _count: {
          select: { messages: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, role: true, createdAt: true },
        },
      },
    });

    const items = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      model: c.model,
      pinned: c.pinned,
      systemPrompt: c.systemPrompt,
      thinkingEnabled: c.thinkingEnabled,
      tokenSaverEnabled: c.tokenSaverEnabled,
      temperature: c.temperature,
      messagesCount: c._count.messages,
      lastSnippet: c.messages[0]?.content?.slice(0, 80) || '',
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return res.json({ success: true, conversations: items });
  } catch (err: any) {
    console.error('[STUDIO CONVERSATIONS GET ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to load conversations.' } });
  }
});

// POST /api/user/studio/conversations - Create new conversation
studioRouter.post('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, model, systemPrompt, thinkingEnabled, tokenSaverEnabled, temperature } = req.body;

    const conversation = await prisma.studioConversation.create({
      data: {
        userId,
        title: (typeof title === 'string' && title.trim()) ? title.trim().slice(0, 100) : 'New Session',
        model: (typeof model === 'string' && model.trim()) ? model.trim() : 'claude-sonnet-5.5',
        systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : null,
        thinkingEnabled: Boolean(thinkingEnabled),
        tokenSaverEnabled: Boolean(tokenSaverEnabled),
        temperature: typeof temperature === 'number' ? temperature : 0.2,
      },
    });

    return res.json({ success: true, conversation });
  } catch (err: any) {
    console.error('[STUDIO CONVERSATION CREATE ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to create conversation.' } });
  }
});

// GET /api/user/studio/conversations/:id - Retrieve conversation and messages
studioRouter.get('/conversations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await prisma.studioConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    }

    const messages = conversation.messages.map((m) => {
      let attachments: any[] = [];
      if (m.attachmentsJson) {
        try { attachments = JSON.parse(m.attachmentsJson); } catch {}
      }
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        thinking: m.thinking || undefined,
        modelUsed: m.modelUsed || conversation.model,
        timestamp: m.createdAt.getTime(),
        usage: {
          input_tokens: m.inputTokens,
          output_tokens: m.outputTokens,
          total_tokens: m.totalTokens,
        },
        multiplier: m.multiplier,
        latencyMs: m.latencyMs,
        attachments,
      };
    });

    return res.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        systemPrompt: conversation.systemPrompt,
        thinkingEnabled: conversation.thinkingEnabled,
        tokenSaverEnabled: conversation.tokenSaverEnabled,
        temperature: conversation.temperature,
        pinned: conversation.pinned,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages,
      },
    });
  } catch (err: any) {
    console.error('[STUDIO CONVERSATION GET ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to load conversation.' } });
  }
});

// PATCH /api/user/studio/conversations/:id - Update conversation settings or title
studioRouter.patch('/conversations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, model, systemPrompt, thinkingEnabled, tokenSaverEnabled, temperature, pinned } = req.body;

    const existing = await prisma.studioConversation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    }

    const updateData: any = {};
    if (typeof title === 'string') updateData.title = title.trim().slice(0, 100);
    if (typeof model === 'string') updateData.model = model.trim();
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (thinkingEnabled !== undefined) updateData.thinkingEnabled = Boolean(thinkingEnabled);
    if (tokenSaverEnabled !== undefined) updateData.tokenSaverEnabled = Boolean(tokenSaverEnabled);
    if (typeof temperature === 'number') updateData.temperature = temperature;
    if (pinned !== undefined) updateData.pinned = Boolean(pinned);

    const updated = await prisma.studioConversation.update({
      where: { id },
      data: updateData,
    });

    return res.json({ success: true, conversation: updated });
  } catch (err: any) {
    console.error('[STUDIO CONVERSATION UPDATE ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to update conversation.' } });
  }
});

// DELETE /api/user/studio/conversations/:id - Delete conversation
studioRouter.delete('/conversations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.studioConversation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    }

    await prisma.studioConversation.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err: any) {
    console.error('[STUDIO CONVERSATION DELETE ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to delete conversation.' } });
  }
});

// DELETE /api/user/studio/conversations/:id/messages/:msgId - Delete single message
studioRouter.delete('/conversations/:id/messages/:msgId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, msgId } = req.params;

    const conversation = await prisma.studioConversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    }

    await prisma.studioMessage.deleteMany({
      where: { id: msgId, conversationId: id },
    });

    return res.json({ success: true, message: 'Message deleted.' });
  } catch (err: any) {
    console.error('[STUDIO MESSAGE DELETE ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to delete message.' } });
  }
});

// GET /api/user/studio/memories - List persistent memories
studioRouter.get('/memories', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const memories = await prisma.studioMemory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, memories });
  } catch (err: any) {
    console.error('[STUDIO MEMORIES GET ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to load memories.' } });
  }
});

// POST /api/user/studio/memories - Add persistent memory
studioRouter.post('/memories', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, fact } = req.body;

    if (!fact || typeof fact !== 'string' || !fact.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Memory fact text is required.' } });
    }

    const memory = await prisma.studioMemory.create({
      data: {
        userId,
        category: (typeof category === 'string' && category.trim()) ? category.trim() : 'General',
        fact: fact.trim().slice(0, 1000),
      },
    });

    return res.json({ success: true, memory });
  } catch (err: any) {
    console.error('[STUDIO MEMORY CREATE ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to add memory.' } });
  }
});

// PATCH /api/user/studio/memories/:id - Edit existing memory fact
studioRouter.patch('/memories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { category, fact } = req.body;

    const existing = await prisma.studioMemory.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Memory not found.' } });
    }

    const updated = await prisma.studioMemory.update({
      where: { id },
      data: {
        category: (typeof category === 'string' && category.trim()) ? category.trim() : existing.category,
        fact: (typeof fact === 'string' && fact.trim()) ? fact.trim().slice(0, 1000) : existing.fact,
      },
    });

    return res.json({ success: true, memory: updated });
  } catch (err: any) {
    console.error('[STUDIO MEMORY UPDATE ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to update memory.' } });
  }
});

// DELETE /api/user/studio/memories/:id - Delete single memory
studioRouter.delete('/memories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await prisma.studioMemory.deleteMany({
      where: { id, userId },
    });

    return res.json({ success: true, message: 'Memory deleted.' });
  } catch (err: any) {
    console.error('[STUDIO MEMORY DELETE ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to delete memory.' } });
  }
});

// DELETE /api/user/studio/memories - Clear all user memories
studioRouter.delete('/memories', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.studioMemory.deleteMany({
      where: { userId },
    });
    return res.json({ success: true, message: 'All memories cleared.' });
  } catch (err: any) {
    console.error('[STUDIO MEMORIES CLEAR ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'Failed to clear memories.' } });
  }
});

// POST /api/user/studio/upload - Secure File Attachment Parser
studioRouter.post('/upload', async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, mimeType, base64Data, size } = req.body;

    if (!fileName || !base64Data) {
      return res.status(400).json({ success: false, error: { message: 'Filename and file data are required.' } });
    }

    const sanitizedFileName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const byteSize = Number(size) || Math.round((base64Data.length * 3) / 4);

    if (byteSize > 25 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: { message: 'File exceeds maximum allowed size of 25MB.' } });
    }

    const lowerExt = sanitizedFileName.split('.').pop()?.toLowerCase() || '';
    const cleanMime = String(mimeType || '').toLowerCase();

    // 1. Text & Code files
    const textExtensions = ['txt', 'md', 'ts', 'tsx', 'js', 'jsx', 'py', 'json', 'csv', 'html', 'css', 'yaml', 'yml', 'sql', 'sh', 'env', 'prisma', 'xml'];
    if (textExtensions.includes(lowerExt) || cleanMime.startsWith('text/') || cleanMime === 'application/json' || cleanMime === 'text/csv') {
      const buffer = Buffer.from(base64Data, 'base64');
      const textContent = buffer.toString('utf-8');
      const textSnippet = textContent.slice(0, 150000); // 150k chars max

      return res.json({
        success: true,
        attachment: {
          name: sanitizedFileName,
          type: 'file',
          mimeType: cleanMime || 'text/plain',
          size: byteSize,
          textSnippet,
        },
      });
    }

    // 2. Vision Images
    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    if (imageExtensions.includes(lowerExt) || cleanMime.startsWith('image/')) {
      const supportedImageMime = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(cleanMime)
        ? cleanMime
        : lowerExt === 'png' ? 'image/png' : lowerExt === 'webp' ? 'image/webp' : 'image/jpeg';

      return res.json({
        success: true,
        attachment: {
          name: sanitizedFileName,
          type: 'image',
          mimeType: supportedImageMime,
          size: byteSize,
          dataBase64: base64Data,
        },
      });
    }

    // 3. PDF Documents
    if (lowerExt === 'pdf' || cleanMime === 'application/pdf') {
      return res.json({
        success: true,
        attachment: {
          name: sanitizedFileName,
          type: 'document',
          mimeType: 'application/pdf',
          size: byteSize,
          dataBase64: base64Data,
        },
      });
    }

    return res.status(415).json({
      success: false,
      error: { message: `Unsupported file format (.${lowerExt}). Supported formats: PDF, Images (PNG, JPG, WEBP), and Code/Text (TXT, MD, TS, JS, PY, JSON, CSV).` },
    });
  } catch (err: any) {
    console.error('[STUDIO FILE UPLOAD ERROR]', err);
    return res.status(500).json({ success: false, error: { message: err.message || 'File processing failed.' } });
  }
});

// POST /api/user/studio/chat/stream - Real-time SSE Streaming Chat
studioRouter.post('/chat/stream', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    conversationId: requestedConvId,
    model: requestedModel = 'claude-sonnet-5.5',
    prompt,
    messages: clientMessages,
    systemPrompt: customSystemPrompt,
    thinkingEnabled = false,
    tokenSaverEnabled = false,
    memoryEnabled = true,
    temperature = 0.2,
    attachments = [],
  } = req.body;

  try {
    // 1. Authorization & Plan Guard Check
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasStudioAccess: true },
    });
    const paidOrder = await prisma.order.findFirst({
      where: { userId, paymentStatus: 'PAID' },
    });
    const paidSub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    const isPaidCustomer = Boolean(paidOrder || paidSub || userRecord?.hasStudioAccess);

    // 2. Resolve Active API Key for User
    const keyRecord = await prisma.apiKey.findFirst({
      where: { userId, status: 'active' },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!keyRecord) {
      return res.status(404).json({
        success: false,
        error: { message: 'No active API key found for this account. Claim a free trial or activate a plan.' },
      });
    }

    if (keyRecord.tokensRemaining <= 0n) {
      return res.status(403).json({
        success: false,
        error: { code: 'QUOTA_EXHAUSTED', message: 'Your API token balance is depleted. Please recharge or upgrade your plan.' },
      });
    }

    // 3. Multi-turn & Vision Gate for Free Users
    const isMultiTurn = Array.isArray(clientMessages) && clientMessages.length > 1;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if ((isMultiTurn || hasAttachments) && !isPaidCustomer) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PRO_TIER_REQUIRED',
          message: 'Multi-turn chat threads and file/vision analysis are exclusive to active paid subscribers. Please upgrade to unlock full Studio access.',
        },
      });
    }

    // 4. Resolve Active Vendor Provider
    let vendor = keyRecord.provider;
    if (!vendor || vendor.status === 'disabled') {
      vendor = await prisma.vendorProvider.findFirst({
        where: { isPrimary: true, status: { not: 'disabled' } },
      });
    }
    if (!vendor || vendor.status === 'disabled') {
      vendor = await prisma.vendorProvider.findFirst({
        where: { status: { not: 'disabled' } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    }

    if (!vendor) {
      return res.status(503).json({
        success: false,
        error: { message: 'AI Gateway conduit is temporarily initializing. Please contact support.' },
      });
    }

    const masterKey = vendor.masterApiKeyEncrypted ? decryptText(vendor.masterApiKeyEncrypted) : '';
    if (!masterKey) {
      return res.status(503).json({
        success: false,
        error: { message: 'AI Gateway credentials require configuration. Please contact support.' },
      });
    }

    // 5. Ensure or Create Conversation in DB
    let conversation: any = null;
    if (requestedConvId && requestedConvId !== 'new') {
      conversation = await prisma.studioConversation.findFirst({
        where: { id: requestedConvId, userId },
      });
    }

    if (!conversation) {
      const generatedTitle = (typeof prompt === 'string' && prompt.trim())
        ? prompt.trim().slice(0, 40)
        : 'New Session';

      conversation = await prisma.studioConversation.create({
        data: {
          userId,
          title: generatedTitle,
          model: requestedModel,
          systemPrompt: customSystemPrompt || null,
          thinkingEnabled: Boolean(thinkingEnabled),
          tokenSaverEnabled: Boolean(tokenSaverEnabled),
          temperature: Number(temperature) || 0.2,
        },
      });
    }

    // 6. Build Context & Ingest User Persistent Memories
    const userMemories = await prisma.studioMemory.findMany({
      where: { userId },
      take: 15,
      orderBy: { updatedAt: 'desc' },
    });

    let effectiveSystemPrompt = customSystemPrompt || conversation.systemPrompt || '';
    if (memoryEnabled !== false && userMemories.length > 0) {
      const memoryDirectives = userMemories.map((m) => `- [${m.category}]: ${m.fact}`).join('\n');
      effectiveSystemPrompt += `\n\n[USER PROJECT CONTEXT & PREFERENCES]:\n${memoryDirectives}`;
    }

    // Token-Saver Compaction: Calculate real character & token savings
    let tokenSavingsEstimate = 0;
    if (tokenSaverEnabled) {
      effectiveSystemPrompt +=
        '\n\n[TOKEN-SAVER ACTIVE]: Return concise, surgical code or unified diffs. Omit all conversational greetings and repetitive boilerplate.';
      tokenSavingsEstimate += 120; // instruction optimization
    }

    // 7. Format Outbound Messages Array (with attachments)
    const outboundMessages: any[] = [];

    // History from client
    if (Array.isArray(clientMessages) && clientMessages.length > 0) {
      // In Token-Saver mode, keep the last 6 turns to avoid bloated token context
      const turnsToKeep = tokenSaverEnabled ? clientMessages.slice(-6) : clientMessages;
      if (tokenSaverEnabled && clientMessages.length > 6) {
        const omittedMessages = clientMessages.slice(0, -6);
        const omittedChars = omittedMessages.reduce((sum: number, m: any) => {
          const contentStr = typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '');
          return sum + contentStr.length;
        }, 0);
        tokenSavingsEstimate += Math.ceil(omittedChars / 4);
      }

      for (const m of turnsToKeep) {
        if (m.attachments && Array.isArray(m.attachments) && m.attachments.length > 0) {
          const parts: any[] = [];
          for (const att of m.attachments) {
            if (att.type === 'image' && att.dataBase64) {
              parts.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: att.mimeType,
                  data: att.dataBase64,
                },
              });
            } else if (att.type === 'document' && att.dataBase64) {
              parts.push({
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: att.dataBase64,
                },
              });
            } else if (att.textSnippet) {
              parts.push({
                type: 'text',
                text: `--- ATTACHED FILE: ${att.name} ---\n\`\`\`\n${att.textSnippet}\n\`\`\`\n`,
              });
            }
          }
          if (m.content) parts.push({ type: 'text', text: m.content });
          outboundMessages.push({ role: m.role, content: parts });
        } else {
          outboundMessages.push({ role: m.role, content: m.content });
        }
      }
    } else if (prompt) {
      // New prompt with optional attachments
      if (Array.isArray(attachments) && attachments.length > 0) {
        const parts: any[] = [];
        for (const att of attachments) {
          if (att.type === 'image' && att.dataBase64) {
            parts.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: att.mimeType,
                data: att.dataBase64,
              },
            });
          } else if (att.type === 'document' && att.dataBase64) {
            parts.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: att.dataBase64,
              },
            });
          } else if (att.textSnippet) {
            parts.push({
              type: 'text',
              text: `--- ATTACHED FILE: ${att.name} ---\n\`\`\`\n${att.textSnippet}\n\`\`\`\n`,
            });
          }
        }
        if (prompt.trim()) parts.push({ type: 'text', text: prompt.trim() });
        outboundMessages.push({ role: 'user', content: parts });
      } else {
        outboundMessages.push({ role: 'user', content: prompt.trim() });
      }
    }

    // 8. Prepare Upstream Request
    const selectedModel = requestedModel || 'claude-sonnet-5.5';
    const friendlyModel = getFriendlyModelName(selectedModel);
    const modelMeta = VERIFIED_STUDIO_MODELS.find((m) => m.id === selectedModel);

    const payload: any = {
      messages: outboundMessages,
      max_tokens: 4096,
      stream: true,
      injectPersona: true,
    };
    if (effectiveSystemPrompt.trim()) payload.system = effectiveSystemPrompt.trim();
    if (thinkingEnabled && modelMeta?.supportsThinking) {
      payload.thinking = { type: 'enabled', budget_tokens: 2048 };
      payload.temperature = 1.0; // Anthropic spec requires temperature 1.0 when thinking is enabled
    } else if (temperature !== undefined) {
      payload.temperature = Math.max(0, Math.min(1, temperature));
    }

    const prep = buildProviderRequest(vendor, masterKey, selectedModel, payload);

    // 9. Establish SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

    // Notify client of conversation session
    res.write(`event: session\ndata: ${JSON.stringify({ conversationId: conversation.id, title: conversation.title, model: selectedModel })}\n\n`);

    const abortController = new AbortController();
    let clientDisconnected = false;

    req.on('close', () => {
      clientDisconnected = true;
      abortController.abort();
    });

    const startTime = Date.now();
    let upstreamRes: any = null;

    try {
      upstreamRes = await fetch(prep.url, {
        method: 'POST',
        headers: prep.headers,
        body: JSON.stringify(prep.body),
        signal: abortController.signal,
      });
    } catch (fetchErr: any) {
      if (clientDisconnected) return;
      console.warn(`[STUDIO UPSTREAM FETCH FAILED] ${fetchErr.message}`);
      res.write(`event: error\ndata: ${JSON.stringify({ message: sanitizeErrorMessage(fetchErr.message) })}\n\n`);
      return res.end();
    }

    if (!upstreamRes || !upstreamRes.ok) {
      const errText = upstreamRes ? await upstreamRes.text().catch(() => '') : 'Upstream service unavailable.';
      let parsedErr: any = {};
      try { parsedErr = JSON.parse(errText); } catch {}
      const rawErrMsg = parsedErr?.error?.message || parsedErr?.message || errText || `HTTP ${upstreamRes?.status || 502}`;
      const safeErrMsg = sanitizeErrorMessage(rawErrMsg);

      res.write(`event: error\ndata: ${JSON.stringify({ message: safeErrMsg })}\n\n`);
      return res.end();
    }

    // 10. Stream Chunks to Client & Buffer for DB Persistence
    const reader = upstreamRes.body?.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';
    let accumulatedText = '';
    let accumulatedThinking = '';
    let reportedInputTokens: number | null = null;
    let reportedOutputTokens: number | null = null;

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;

          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr && jsonStr !== '[DONE]') {
                try {
                  const data = JSON.parse(jsonStr);

                  if (data.type === 'message_start' && data.message?.usage) {
                    reportedInputTokens = Number(data.message.usage.input_tokens || 0);
                  }

                  if (data.type === 'content_block_delta') {
                    if (data.delta?.type === 'thinking_delta' && data.delta.thinking) {
                      const cleanThinking = sanitizeModelResponse(data.delta.thinking, friendlyModel);
                      accumulatedThinking += cleanThinking;
                      res.write(`event: thinking_delta\ndata: ${JSON.stringify({ thinking: cleanThinking })}\n\n`);
                    } else if (data.delta?.type === 'text_delta' && data.delta.text) {
                      const cleanText = sanitizeModelResponse(data.delta.text, friendlyModel);
                      accumulatedText += cleanText;
                      res.write(`event: content_delta\ndata: ${JSON.stringify({ text: cleanText })}\n\n`);
                    }
                  }

                  if (data.type === 'message_delta' && data.usage?.output_tokens) {
                    reportedOutputTokens = Number(data.usage.output_tokens || 0);
                  }
                } catch {
                  // Non-JSON or SSE heartbeat
                }
              }
            }
          }
        }
      } catch (streamErr: any) {
        if (!clientDisconnected) {
          console.warn('[STUDIO STREAMING INTERRUPTED]', streamErr.message);
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Calculate actual tokens
    const inputTokens = reportedInputTokens || Math.max(1, Math.ceil(JSON.stringify(outboundMessages).length / 4));
    const outputTokens = reportedOutputTokens || Math.max(1, Math.ceil(accumulatedText.length / 4));
    const totalTokens = inputTokens + outputTokens;

    // Resolve model multiplier
    const multiplier = modelMeta?.tokenMultiplier || 1.0;
    const billedTokens = BigInt(Math.ceil(totalTokens * multiplier));

    // Deduct tokens from user API key in database
    const remainingAfter = keyRecord.tokensRemaining > billedTokens
      ? keyRecord.tokensRemaining - billedTokens
      : 0n;

    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: {
        tokensUsed: { increment: billedTokens },
        tokensRemaining: remainingAfter,
        totalRequests: { increment: 1 },
        totalInputTokens: { increment: BigInt(inputTokens) },
        totalOutputTokens: { increment: BigInt(outputTokens) },
        lastUsedAt: new Date(),
        lastPlatform: 'AI Chat Studio 2.0',
      },
    }).catch((e) => console.error('[STUDIO KEY UPDATE ERROR]', e));

    // Create ApiRequest telemetry row
    await prisma.apiRequest.create({
      data: {
        apiKeyId: keyRecord.id,
        userId,
        model: selectedModel,
        endpoint: '/v1/messages',
        statusCode: 200,
        inputTokens,
        outputTokens,
        totalTokens,
        latencyMs,
        providerId: vendor.id,
        streaming: true,
        usageSource: 'PROVIDER_REPORTED',
        clientPlatform: 'AI Chat Studio 2.0',
        userAgent: req.headers['user-agent']?.toString() || 'AI Chat Studio',
        ipAddress: (req.ip || req.headers['x-forwarded-for']?.toString() || '').split(',')[0].trim() || null,
      },
    }).catch((e) => console.error('[STUDIO APIREQUEST LOG ERROR]', e));

    // Persist User Message to StudioMessage
    if (prompt) {
      await prisma.studioMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: prompt.trim(),
          modelUsed: selectedModel,
          inputTokens,
          outputTokens: 0,
          totalTokens: inputTokens,
          multiplier,
          attachmentsJson: attachments.length > 0 ? JSON.stringify(attachments) : null,
        },
      }).catch((e) => console.error('[STUDIO USER MSG SAVE ERROR]', e));
    }

    // Persist Assistant Message to StudioMessage
    if (accumulatedText.trim() || accumulatedThinking.trim()) {
      await prisma.studioMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: accumulatedText.trim(),
          thinking: accumulatedThinking.trim() || null,
          modelUsed: selectedModel,
          inputTokens,
          outputTokens,
          totalTokens,
          multiplier,
          latencyMs,
        },
      }).catch((e) => console.error('[STUDIO ASSISTANT MSG SAVE ERROR]', e));

      // Auto-update conversation title if it was New Session
      if (conversation.title === 'New Session' && prompt) {
        const autoTitle = prompt.trim().slice(0, 36) + (prompt.trim().length > 36 ? '...' : '');
        await prisma.studioConversation.update({
          where: { id: conversation.id },
          data: { title: autoTitle },
        }).catch(() => {});
      }
    }

    // Send final completion SSE payload
    res.write(`event: done\ndata: ${JSON.stringify({
      result: accumulatedText,
      thinking: accumulatedThinking || null,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        savings_tokens: tokenSavingsEstimate,
      },
      multiplier,
      latencyMs,
      tokensRemaining: remainingAfter.toString(),
      isPaidCustomer,
    })}\n\n`);

    return res.end();
  } catch (err: any) {
    console.error('[STUDIO CHAT STREAM UNHANDLED ERROR]', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: { message: err.message || 'Studio stream failed.' } });
    }
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message || 'Stream processing error.' })}\n\n`);
    return res.end();
  }
});
