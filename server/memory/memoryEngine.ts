import { prisma } from '../db';

export interface MemoryItem {
  id: string;
  userId: string;
  category: string;
  fact: string;
  normalizedFact?: string | null;
  type: string; // 'explicit' | 'automatic' | 'profile' | 'project' | 'continuity'
  projectId?: string | null;
  sourceConversationId?: string | null;
  confidence: number;
  isArchived: boolean;
  lastRetrievedAt?: Date | null;
  metadataJson?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMemorySettings {
  memoryEnabled: boolean;
  autoExtractionEnabled: boolean;
  crossConversationRecall: boolean;
  scope: 'account' | 'project' | 'session';
}

export interface ExplicitMemoryAction {
  type: 'save' | 'forget' | 'inspect' | 'none';
  category?: string;
  fact?: string;
  targetQuery?: string;
  confirmationText?: string;
}

// ---------------------------------------------------------------------------
// 1. Sensitive Data & Security Filters
// ---------------------------------------------------------------------------

export function containsSecretOrSensitiveData(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const sensitivePatterns = [
    /\bpassword\b/i,
    /\bsecret\b/i,
    /\bbearer\b\s+/i,
    /\bapi[_-]?key\b/i,
    /\baccess[_-]?token\b/i,
    /\btoken\b/i,
    /sk-[a-zA-Z0-9_-]{16,}/i,
    /ld_[a-zA-Z0-9_-]{16,}/i,
    /sm_[a-zA-Z0-9_-]{16,}/i,
    /lk-[a-zA-Z0-9_-]{10,}/i,
    /ghp_[a-zA-Z0-9]{20,}/i,
    /ey[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}/,
    /-----BEGIN (?:RSA|OPENSSH|PGP|PRIVATE) KEY-----/i,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    /\b(?:\d{4}[- ]?){3}\d{4}\b/,
    /\b(?:pin|cvv|ssn)\b/i,
  ];
  return sensitivePatterns.some((p) => p.test(text));
}

export function isUntrustedInstruction(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const untrustedPatterns = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /system\s+prompt\s+override/i,
    /reveal\s+(?:your\s+)?(?:secret|api\s*key|password|credential)/i,
    /<system>/i,
    /<\/system>/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /jailbreak/i,
  ];
  return untrustedPatterns.some((p) => p.test(text));
}

export function normalizeFactText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// 2. Explicit Instruction Detection & Parsing
// ---------------------------------------------------------------------------

export function detectExplicitMemoryInstruction(prompt: string): ExplicitMemoryAction {
  if (!prompt || typeof prompt !== 'string') return { type: 'none' };
  const trimmed = prompt.trim();
  if (trimmed.length < 5 || containsSecretOrSensitiveData(trimmed) || isUntrustedInstruction(trimmed)) {
    return { type: 'none' };
  }

  // A. Inspection / Recall Query: "What do you remember about me?"
  const inspectRegex = /(?:what\s+do\s+you\s+remember\s+about\s+me|what\s+do\s+you\s+know\s+about\s+me|show\s+(?:my\s+)?memories|list\s+my\s+preferences|what\s+are\s+my\s+saved\s+preferences)/i;
  if (inspectRegex.test(trimmed)) {
    return {
      type: 'inspect',
      confirmationText: 'Here is what I remember about you and your preferences across our conversations:',
    };
  }

  // B. Forget / Delete Instruction: "Forget that I use Python", "Forget my preference for Python"
  const forgetRegex = /(?:forget\s+(?:that\s+i|about|my\s+preference\s+for|what\s+i\s+told\s+you\s+about)|remove\s+(?:my\s+)?preference\s+for|clear\s+(?:what\s+you\s+remember\s+about|my\s+memory\s+about))\s+([a-zA-Z0-9\+\#\.\s\,\-]{2,60})/i;
  const forgetMatch = forgetRegex.exec(trimmed);
  if (forgetMatch && forgetMatch[1]) {
    let target = forgetMatch[1].trim().replace(/[\.\,\;]+$/, '');
    target = target.replace(/^(?:prefer|like|use|prefer to use|am using)\s+/i, '').trim();
    return {
      type: 'forget',
      targetQuery: target,
      confirmationText: `Got it — I have forgotten that preference for "${target}".`,
    };
  }

  // C. Explicit Save Instructions:
  // "Remember that I prefer TypeScript", "Always use TypeScript", "From now on, always..."
  const savePatterns = [
    {
      regex: /(?:please\s+)?(?:remember\s+that\s+|remember:\s*|keep\s+in\s+mind\s+that\s+|don\'?t\s+forget\s+that\s+)(.+)/i,
      category: 'Preferences',
    },
    {
      regex: /(?:from\s+now\s+on|going\s+forward|for\s+all\s+(?:future\s+)?(?:chats|projects|code))\s*,\s*(?:always\s+)?(.+)/i,
      category: 'Preferences',
    },
    {
      regex: /(?:always\s+use|never\s+use|default\s+to)\s+([a-zA-Z0-9\+\#\.\s\,\-]{3,80})/i,
      category: 'Preferences',
    },
    {
      regex: /(?:save\s+this\s+as\s+my\s+preferred\s+)(writing\s+style|tech\s+stack|language|framework|style):\s*(.+)/i,
      category: 'Preferences',
    },
  ];

  for (const p of savePatterns) {
    const match = p.regex.exec(trimmed);
    if (match) {
      let fact = (match[2] || match[1] || '').trim().replace(/[\.\,\;]+$/, '');
      if (fact.length >= 3 && fact.length <= 500 && !containsSecretOrSensitiveData(fact)) {
        // Classify category intelligently
        let category = p.category;
        const norm = fact.toLowerCase();
        if (norm.includes('react') || norm.includes('vue') || norm.includes('node') || norm.includes('typescript') || norm.includes('python') || norm.includes('postgres') || norm.includes('stack')) {
          category = 'Tech Stack';
        } else if (norm.includes('style') || norm.includes('concise') || norm.includes('tone') || norm.includes('explanation')) {
          category = 'Working Style';
        }

        return {
          type: 'save',
          category,
          fact,
          confirmationText: `Got it — I'll remember that "${fact}" in future conversations.`,
        };
      }
    }
  }

  return { type: 'none' };
}

// ---------------------------------------------------------------------------
// 3. User Memory Settings Management
// ---------------------------------------------------------------------------

export async function getUserMemorySettings(userId: string): Promise<UserMemorySettings> {
  try {
    const settings = await (prisma as any).userMemorySettings.findUnique({
      where: { userId },
    });
    if (settings) {
      return {
        memoryEnabled: settings.memoryEnabled !== false,
        autoExtractionEnabled: settings.autoExtractionEnabled !== false,
        crossConversationRecall: settings.crossConversationRecall !== false,
        scope: (settings.scope as any) || 'account',
      };
    }
  } catch (e) {
    console.error('[MEMORY ENGINE] Error fetching user memory settings:', e);
  }
  // Default fallback
  return {
    memoryEnabled: true,
    autoExtractionEnabled: true,
    crossConversationRecall: true,
    scope: 'account',
  };
}

export async function updateUserMemorySettings(
  userId: string,
  updates: Partial<UserMemorySettings>
): Promise<UserMemorySettings> {
  const current = await getUserMemorySettings(userId);
  const next = { ...current, ...updates };

  await (prisma as any).userMemorySettings.upsert({
    where: { userId },
    create: {
      userId,
      memoryEnabled: next.memoryEnabled,
      autoExtractionEnabled: next.autoExtractionEnabled,
      crossConversationRecall: next.crossConversationRecall,
      scope: next.scope,
    },
    update: {
      memoryEnabled: next.memoryEnabled,
      autoExtractionEnabled: next.autoExtractionEnabled,
      crossConversationRecall: next.crossConversationRecall,
      scope: next.scope,
    },
  });

  return next;
}

// ---------------------------------------------------------------------------
// 4. Persistence, Consolidation & Deduplication
// ---------------------------------------------------------------------------

export async function saveOrUpdateMemory(params: {
  userId: string;
  category: string;
  fact: string;
  type?: 'explicit' | 'automatic' | 'profile' | 'project' | 'continuity';
  projectId?: string | null;
  sourceConversationId?: string | null;
  confidence?: number;
}): Promise<MemoryItem> {
  const {
    userId,
    category,
    fact,
    type = 'automatic',
    projectId = null,
    sourceConversationId = null,
    confidence = 1.0,
  } = params;

  const trimmedFact = fact.trim().slice(0, 1000);
  const normalized = normalizeFactText(trimmedFact);

  // Check for an existing memory in the same category or with significant overlap
  const existing = await prisma.studioMemory.findFirst({
    where: {
      userId,
      isArchived: false,
      projectId: projectId || null,
      OR: [
        { category, normalizedFact: { contains: normalized } },
        { category, fact: { contains: trimmedFact, mode: 'insensitive' } },
        { normalizedFact: normalized },
      ],
    },
  });

  let memoryRecord: any;

  if (existing) {
    // Update existing record: higher confidence or explicit command reinforces it
    const shouldUpgradeType = type === 'explicit' && existing.type !== 'explicit';
    memoryRecord = await prisma.studioMemory.update({
      where: { id: existing.id },
      data: {
        fact: trimmedFact,
        normalizedFact: normalized,
        category: category || existing.category,
        type: shouldUpgradeType ? 'explicit' : existing.type,
        confidence: Math.min(1.0, (existing.confidence || 0.8) + 0.1),
        sourceConversationId: sourceConversationId || existing.sourceConversationId,
        updatedAt: new Date(),
      },
    });

    // Record audit activity
    await (prisma as any).memoryActivity.create({
      data: {
        userId,
        action: 'updated',
        memoryId: memoryRecord.id,
        category: memoryRecord.category,
        factSnippet: memoryRecord.fact.slice(0, 150),
        details: `Consolidated / reinforced preference (${type}).`,
      },
    }).catch(() => {});
  } else {
    // Check maximum memory count (bounded to 100 per user for safety)
    const count = await prisma.studioMemory.count({
      where: { userId, isArchived: false, category: { not: 'Skill' } },
    });
    if (count >= 100) {
      // Archive oldest automatic memory with lowest confidence
      const oldest = await prisma.studioMemory.findFirst({
        where: { userId, isArchived: false, type: 'automatic', category: { not: 'Skill' } },
        orderBy: [{ confidence: 'asc' }, { updatedAt: 'asc' }],
      });
      if (oldest) {
        await prisma.studioMemory.update({
          where: { id: oldest.id },
          data: { isArchived: true },
        });
      }
    }

    memoryRecord = await prisma.studioMemory.create({
      data: {
        userId,
        category,
        fact: trimmedFact,
        normalizedFact: normalized,
        type,
        projectId: projectId || null,
        sourceConversationId,
        confidence,
        isArchived: false,
      },
    });

    // Record audit activity
    await (prisma as any).memoryActivity.create({
      data: {
        userId,
        action: 'created',
        memoryId: memoryRecord.id,
        category: memoryRecord.category,
        factSnippet: memoryRecord.fact.slice(0, 150),
        details: `Saved new ${type} memory.`,
      },
    }).catch(() => {});
  }

  return memoryRecord as MemoryItem;
}

export async function forgetMatchingMemories(userId: string, targetQuery: string): Promise<number> {
  const normQuery = normalizeFactText(targetQuery);
  if (!normQuery) return 0;

  const matches = await prisma.studioMemory.findMany({
    where: {
      userId,
      isArchived: false,
      category: { not: 'Skill' },
      OR: [
        { normalizedFact: { contains: normQuery } },
        { fact: { contains: targetQuery, mode: 'insensitive' } },
        { category: { contains: targetQuery, mode: 'insensitive' } },
      ],
    },
  });

  if (matches.length === 0) return 0;

  for (const m of matches) {
    await prisma.studioMemory.update({
      where: { id: m.id },
      data: { isArchived: true },
    });

    await (prisma as any).memoryActivity.create({
      data: {
        userId,
        action: 'deleted',
        memoryId: m.id,
        category: m.category,
        factSnippet: m.fact.slice(0, 150),
        details: `Deactivated via forget command matching "${targetQuery}".`,
      },
    }).catch(() => {});
  }

  return matches.length;
}

// ---------------------------------------------------------------------------
// 5. Automatic Non-Blocking Background Extraction Engine
// ---------------------------------------------------------------------------

export async function extractMemoriesAsync(params: {
  userId: string;
  userPrompt: string;
  assistantReply?: string;
  conversationId?: string;
  projectId?: string;
}): Promise<void> {
  const { userId, userPrompt, assistantReply, conversationId, projectId } = params;
  if (!userPrompt || typeof userPrompt !== 'string') return;

  const trimmed = userPrompt.trim();
  if (trimmed.length < 8 || trimmed.length > 5000) return;
  if (containsSecretOrSensitiveData(trimmed) || isUntrustedInstruction(trimmed)) return;

  // Filter out ephemeral queries (pure math, translations, transient QA)
  const isPureMath = /^(?:what\s+is\s+)?[\d\s\+\-\*\/\%\^\(\)\.\=]+$/i.test(trimmed);
  const isWeatherOrTime = /(?:weather|time|what day|temperature in|clock)/i.test(trimmed);
  const isGenericGreeting = /^(?:hi|hello|hey|greetings|good morning|thanks|thank you|ok|okay)[\!\.]*$/i.test(trimmed);
  if (isPureMath || isWeatherOrTime || isGenericGreeting) return;

  // Check user settings
  const settings = await getUserMemorySettings(userId);
  if (!settings.memoryEnabled || !settings.autoExtractionEnabled) return;

  // First check if user gave an explicit command
  const explicitAction = detectExplicitMemoryInstruction(trimmed);
  if (explicitAction.type === 'save' && explicitAction.fact) {
    await saveOrUpdateMemory({
      userId,
      category: explicitAction.category || 'Preferences',
      fact: explicitAction.fact,
      type: 'explicit',
      projectId,
      sourceConversationId: conversationId,
      confidence: 1.0,
    });
    return;
  } else if (explicitAction.type === 'forget' && explicitAction.targetQuery) {
    await forgetMatchingMemories(userId, explicitAction.targetQuery);
    return;
  }

  // Automatic heuristic extraction for durable preferences
  const extractionRules = [
    {
      regex: /(?:i\s+(?:am\s+)?primarily\s+work\s+with|our\s+tech\s+stack\s+is|my\s+stack\s+is|we\s+use|i\s+build\s+with)\s+([a-zA-Z0-9\+\#\.\s\,\-]{3,90})/i,
      category: 'Tech Stack',
      prefix: 'Primary stack is',
    },
    {
      regex: /(?:i\s+prefer|i\s+like\s+to\s+use|prefer\s+using|always\s+use|default\s+to)\s+([a-zA-Z0-9\+\#\.\s\,\-]{3,60})/i,
      category: 'Preferences',
      prefix: 'User prefers',
    },
    {
      regex: /(?:i\s+code\s+in|i\s+write\s+in|my\s+main\s+language\s+is|i\s+am\s+a)\s+([a-zA-Z0-9\+\#\.\s\,\-]{3,50}\s+(?:developer|engineer|programmer|specialist))/i,
      category: 'About Me',
      prefix: 'User role',
    },
    {
      regex: /(?:keep\s+answers|responses\s+should\s+be|give\s+me\s+answers\s+that\s+are)\s+(concise|detailed|bulleted|step[- ]by[- ]step|production[- ]ready|minimal|academic)/i,
      category: 'Working Style',
      prefix: 'Prefers response style',
    },
    {
      regex: /(?:for\s+this\s+project|in\s+this\s+project|this\s+repo\s+uses)\s*,\s*(?:we\s+are\s+using|we\s+use|it\s+uses)\s+([a-zA-Z0-9\+\#\.\s\,\-]{3,80})/i,
      category: 'Projects',
      prefix: 'Project technology',
    },
  ];

  for (const rule of extractionRules) {
    const match = rule.regex.exec(trimmed);
    if (match && match[1]) {
      const captured = match[1].trim().replace(/[\.\,\;]+$/, '');
      if (captured.length >= 3 && captured.length <= 100 && !containsSecretOrSensitiveData(captured)) {
        const fact = `${rule.prefix}: ${captured}`;
        await saveOrUpdateMemory({
          userId,
          category: rule.category,
          fact,
          type: 'automatic',
          projectId: rule.category === 'Projects' ? projectId : null,
          sourceConversationId: conversationId,
          confidence: 0.85,
        });
        break; // Extract at most one top durable fact per turn
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Intelligent Scoped Relevance Retrieval & Context Assembly
// ---------------------------------------------------------------------------

export interface MemoryRetrievalResult {
  memories: MemoryItem[];
  formattedContext: string | null;
  usedCount: number;
  explicitCount: number;
}

export async function retrieveRelevantMemories(params: {
  userId: string;
  projectId?: string | null;
  prompt: string;
  limit?: number;
  maxTokensBudget?: number;
}): Promise<MemoryRetrievalResult> {
  const { userId, projectId = null, prompt, limit = 5, maxTokensBudget = 350 } = params;

  const emptyResult: MemoryRetrievalResult = {
    memories: [],
    formattedContext: null,
    usedCount: 0,
    explicitCount: 0,
  };

  if (!userId || !prompt) return emptyResult;

  // Check user memory settings
  const settings = await getUserMemorySettings(userId);
  if (!settings.memoryEnabled) return emptyResult;

  // If prompt is a pure arithmetic calculation (e.g. "what is 15% of 800"), return 0 memories
  const isPureMath = /^(?:what\s+is\s+)?[\d\s\+\-\*\/\%\^\(\)\.\=]+$/i.test(prompt.trim());
  if (isPureMath) {
    return emptyResult;
  }

  // Build query scope:
  // If user scope is 'project', only fetch project memories.
  // Otherwise fetch global memories (projectId is null) AND project memories if projectId is supplied.
  const scopeConditions: any[] = [];
  if (settings.scope === 'project' && projectId) {
    scopeConditions.push({ projectId });
  } else {
    scopeConditions.push({ projectId: null });
    if (projectId) {
      scopeConditions.push({ projectId });
    }
  }

  // Fetch candidate active memories for this user
  const candidates = await prisma.studioMemory.findMany({
    where: {
      userId,
      isArchived: false,
      category: { not: 'Skill' },
      OR: scopeConditions,
    },
    take: 30,
    orderBy: { updatedAt: 'desc' },
  });

  if (candidates.length === 0) return emptyResult;

  // Extract query keywords from prompt
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'for', 'with', 'in', 'on', 'at', 'by', 'of',
    'can', 'you', 'please', 'help', 'me', 'how', 'do', 'i', 'my', 'we', 'our', 'what', 'which', 'who', 'when', 'where',
  ]);
  const promptTokens = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  // Relevance ranking algorithm
  const scored = candidates.map((m) => {
    let score = 0;
    const norm = (m.normalizedFact || m.fact).toLowerCase();
    const cat = m.category.toLowerCase();

    // Explicit memories get a guaranteed high baseline
    if (m.type === 'explicit') {
      score += 10;
    } else {
      score += 3;
    }

    // Token matching
    let tokenMatches = 0;
    for (const token of promptTokens) {
      if (norm.includes(token) || cat.includes(token)) {
        score += 5;
        tokenMatches++;
      }
    }

    // Project-specific priority when in a project
    if (projectId && m.projectId === projectId) {
      score += 8;
    }

    // High confidence boost
    score += (m.confidence || 0.8) * 3;

    return { memory: m, score, tokenMatches };
  });

  // Filter: Keep candidates that have either:
  // 1. Explicit memory status
  // 2. Token match with the prompt
  // 3. Project association
  const substantiveKeywords = [
    'code', 'app', 'system', 'build', 'create', 'make', 'write', 'test', 'design',
    'service', 'api', 'model', 'data', 'database', 'backend', 'frontend', 'ui',
    'component', 'function', 'file', 'script', 'project', 'architecture', 'stack',
    'language', 'framework', 'style', 'preference', 'deploy', 'query', 'schema'
  ];

  const relevant = scored
    .filter((s) => {
      if (promptTokens.length === 0) return false;
      if (s.tokenMatches > 0) return true;
      if (projectId && s.memory.projectId === projectId) return true;
      const isSubstantive = promptTokens.some((t) => substantiveKeywords.includes(t));
      return s.memory.type === 'explicit' && isSubstantive;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.memory as unknown as MemoryItem);

  if (relevant.length === 0) return emptyResult;

  // Assemble bounded context (approx 4 chars per token)
  const maxChars = maxTokensBudget * 4;
  let accumulatedChars = 0;
  const boundedMemories: MemoryItem[] = [];

  for (const m of relevant) {
    const line = `- [${m.category}]${m.type === 'explicit' ? ' (explicit)' : ''}: ${m.fact}`;
    if (accumulatedChars + line.length > maxChars && boundedMemories.length > 0) break;
    boundedMemories.push(m);
    accumulatedChars += line.length;
  }

  // Format context directive
  const lines = boundedMemories.map(
    (m) => `- [${m.category}]${m.type === 'explicit' ? ' (explicit)' : ''}: ${m.fact}`
  );

  const formattedContext = `[PERSISTENT LONG-TERM MEMORY & USER PERSONALISATION]:
The following are verified preferences, learning objectives, and facts persisted for this user across conversations:
${lines.join('\n')}
(Directive: You have full access to persistent cross-conversation long-term memory for this user. When the user asks you to remember something or discusses their preferences, apply them naturally. NEVER tell the user that you cannot remember across future conversations or ask them to remind you in future chats.)`;

  // Update lastRetrievedAt asynchronously
  const retrievedIds = boundedMemories.map((m) => m.id);
  prisma.studioMemory.updateMany({
    where: { id: { in: retrievedIds } },
    data: { lastRetrievedAt: new Date() },
  }).catch(() => {});

  const explicitCount = boundedMemories.filter((m) => m.type === 'explicit').length;

  return {
    memories: boundedMemories,
    formattedContext,
    usedCount: boundedMemories.length,
    explicitCount,
  };
}

// ---------------------------------------------------------------------------
// 7. CRUD APIs for Customer Dashboard & Studio
// ---------------------------------------------------------------------------

export async function listUserMemories(userId: string, projectId?: string | null): Promise<MemoryItem[]> {
  const where: any = {
    userId,
    isArchived: false,
    category: { not: 'Skill' },
  };

  if (projectId) {
    where.OR = [{ projectId: null }, { projectId }];
  }

  const memories = await prisma.studioMemory.findMany({
    where,
    orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
  });

  return memories as unknown as MemoryItem[];
}

export async function updateUserMemory(
  userId: string,
  memoryId: string,
  updates: { category?: string; fact?: string }
): Promise<MemoryItem | null> {
  const existing = await prisma.studioMemory.findFirst({
    where: { id: memoryId, userId },
  });
  if (!existing) return null;

  const newFact = updates.fact && updates.fact.trim() ? updates.fact.trim() : existing.fact;
  const newCat = updates.category && updates.category.trim() ? updates.category.trim() : existing.category;

  const updated = await prisma.studioMemory.update({
    where: { id: memoryId },
    data: {
      fact: newFact,
      normalizedFact: normalizeFactText(newFact),
      category: newCat,
      type: 'explicit', // manual edits become explicit
      updatedAt: new Date(),
    },
  });

  await (prisma as any).memoryActivity.create({
    data: {
      userId,
      action: 'updated',
      memoryId,
      category: newCat,
      factSnippet: newFact.slice(0, 150),
      details: 'User manually edited memory in Context Manager.',
    },
  }).catch(() => {});

  return updated as unknown as MemoryItem;
}

export async function deleteUserMemory(userId: string, memoryId: string): Promise<boolean> {
  const existing = await prisma.studioMemory.findFirst({
    where: { id: memoryId, userId },
  });
  if (!existing) return false;

  await prisma.studioMemory.delete({
    where: { id: memoryId },
  });

  await (prisma as any).memoryActivity.create({
    data: {
      userId,
      action: 'deleted',
      memoryId,
      category: existing.category,
      factSnippet: existing.fact.slice(0, 150),
      details: 'User manually deleted memory.',
    },
  }).catch(() => {});

  return true;
}

export async function clearAllUserMemories(userId: string): Promise<number> {
  const count = await prisma.studioMemory.count({
    where: { userId, category: { not: 'Skill' } },
  });

  await prisma.studioMemory.deleteMany({
    where: { userId, category: { not: 'Skill' } },
  });

  await (prisma as any).memoryActivity.create({
    data: {
      userId,
      action: 'cleared',
      details: `User cleared all ${count} stored memories.`,
    },
  }).catch(() => {});

  return count;
}

export async function getMemoryActivity(userId: string, limit = 20) {
  try {
    return await (prisma as any).memoryActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch {
    return [];
  }
}
