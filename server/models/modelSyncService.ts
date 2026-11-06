import { prisma } from '../db';
import { decryptText } from '../crypto';

export interface ModelSyncResult {
  success: boolean;
  syncHistoryId?: string;
  trigger: 'SCHEDULED' | 'MANUAL_ADMIN';
  durationMs: number;
  modelsDiscovered: number;
  modelsAdded: number;
  modelsUpdated: number;
  modelsUnavailable: number;
  priceChangesCount: number;
  error?: string;
  timestamp: string;
}

export interface DiscoveredModel {
  upstreamId: string;
  canonicalId: string;
  displayName: string;
  family: string;
  provider: string;
  protocol: 'anthropic' | 'openai-compatible' | 'images' | 'videos' | 'embeddings';
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supplierCostInput: number;
  supplierCostOutput: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsEffort: boolean;
  supportsImageGeneration: boolean;
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportedInputModalities: string;
  supportedOutputModalities: string;
  source: 'scalemax_authenticated_api' | 'scalemax_catalogue_page' | 'scalemax_dashboard_page';
}

// Concurrency lock & tracking
let isSyncInProgress = false;
let syncSchedulerTimer: NodeJS.Timeout | null = null;
let lastSyncTimestamp: string | null = null;
let lastSyncModelCount = 0;

/**
 * Normalise family, provider, and protocol from model ID
 */
export function canonicalizeModelId(rawId: string): string {
  let id = (rawId || '').replace(/\[1m\]$/i, '').trim().toLowerCase();
  
  const knownAliases: Record<string, string> = {
    'deepseek-v4-1-flash': 'deepseek-v4.1-flash',
    'fable-5-1': 'fable-5.1',
    'glm-5-1': 'glm-5.1',
    'glm-5-2-v2': 'glm-5.2-v2',
    'glm-5-3-flash': 'glm-5.3-flash',
    'glm-5-3-v2': 'glm-5.3-v2',
    'gpt-5-6-luna': 'gpt-5.6-luna',
    'gpt-5-6-sol': 'gpt-5.6-sol',
    'gpt-5-6-terra': 'gpt-5.6-terra',
    'gpt-6-1-sol': 'gpt-6.1-sol',
    'gpt-6-1-terra': 'gpt-6.1-terra',
    'grok-4-6': 'grok-4.6',
    'grok-4-7': 'grok-4.7',
    'grok-imagine-video-1-5': 'grok-imagine-video-1.5',
    'kimi-k2-6': 'kimi-k2.6',
    'kimi-k2-7-code': 'kimi-k2.7-code',
    'minimax-m2-5': 'minimax-m2.5',
    'minimax-m2-7': 'minimax-m2.7',
    'muse-spark-1-2': 'muse-spark-1.2',
    'muse-spark-1-3-contributor': 'muse-spark-1.3-contributor',
    'qwen-3-7-flash': 'qwen-3.7-flash',
    'qwen-3-7-max': 'qwen-3.7-max',
    'qwen-3-8-27b': 'qwen-3.8-27b',
    'qwen3-8-flash': 'qwen-3.8-flash',
    'qwen3.8-flash': 'qwen-3.8-flash',
    'qwen3-8-max': 'qwen-3.8-max',
    'qwen3.8-max': 'qwen-3.8-max',
    'claude-haiku-5-5': 'claude-haiku-5.5',
    'claude-opus-5-5': 'claude-opus-5.5',
    'claude-sonnet-5-5': 'claude-sonnet-5.5',
    'gemini-3-1-flash-image': 'gemini-3.1-flash-image',
    'gemini-3-5-flash-lite': 'gemini-3.5-flash-lite',
    'gemini-3-8-flash': 'gemini-3.8-flash',
  };

  if (knownAliases[id]) return knownAliases[id];

  // Pattern normalization: hyphen between version numbers (e.g. -v4-1- -> -v4.1-)
  id = id.replace(/-(v\d+)-(\d+)-/g, '-$1.$2-');
  id = id.replace(/-(\d+)-(\d+)(-[a-z]|$)/g, '-$1.$2$3');

  return id;
}

function inferModelFamily(modelId: string): {
  family: string;
  provider: string;
  protocol: 'anthropic' | 'openai-compatible' | 'images' | 'videos' | 'embeddings';
} {
  const lower = modelId.toLowerCase();

  if (
    lower.startsWith('claude') ||
    lower.includes('sonnet') ||
    lower.includes('opus') ||
    lower.includes('haiku') ||
    lower.includes('fable')
  ) {
    return { family: 'claude', provider: 'Anthropic', protocol: 'anthropic' };
  }
  if (lower.startsWith('gpt') || lower.startsWith('o1') || lower.startsWith('o3') || lower.startsWith('chatgpt')) {
    if (lower.includes('image')) return { family: 'image_generation', provider: 'OpenAI', protocol: 'images' };
    return { family: 'openai', provider: 'OpenAI', protocol: 'openai-compatible' };
  }
  if (lower.startsWith('gemini')) {
    if (lower.includes('image')) return { family: 'image_generation', provider: 'Google', protocol: 'images' };
    return { family: 'gemini', provider: 'Google', protocol: 'openai-compatible' };
  }
  if (lower.startsWith('deepseek')) {
    return { family: 'deepseek', provider: 'DeepSeek', protocol: 'openai-compatible' };
  }
  if (lower.startsWith('grok')) {
    if (lower.includes('video')) return { family: 'video_generation', provider: 'xAI', protocol: 'videos' };
    if (lower.includes('image')) return { family: 'image_generation', provider: 'xAI', protocol: 'images' };
    return { family: 'grok', provider: 'xAI', protocol: 'openai-compatible' };
  }
  if (lower.startsWith('qwen')) {
    return { family: 'qwen', provider: 'Alibaba', protocol: 'openai-compatible' };
  }
  if (lower.startsWith('glm')) {
    return { family: 'glm', provider: 'Zhipu AI', protocol: 'openai-compatible' };
  }
  if (lower.startsWith('kimi')) {
    return { family: 'kimi', provider: 'Moonshot', protocol: 'openai-compatible' };
  }
  if (lower.startsWith('minimax')) {
    return { family: 'minimax', provider: 'MiniMax', protocol: 'openai-compatible' };
  }
  if (lower.includes('dall-e') || lower.includes('imagen') || lower.includes('midjourney') || lower.includes('flux')) {
    return { family: 'image_generation', provider: 'LightningAPI', protocol: 'images' };
  }
  if (lower.includes('sora') || lower.includes('kling') || lower.includes('runway') || lower.includes('veo')) {
    return { family: 'video_generation', provider: 'LightningAPI', protocol: 'videos' };
  }
  if (lower.includes('embedding')) {
    return { family: 'embeddings', provider: 'OpenAI', protocol: 'embeddings' };
  }

  return { family: 'more_models', provider: 'LightningAPI', protocol: 'openai-compatible' };
}

/**
 * Fetch ScaleMax models from authenticated API (if key available)
 */
async function fetchScaleMaxOperationalModels(creditKey: string): Promise<DiscoveredModel[]> {
  if (!creditKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://api.scalemax.pro/v1/models', {
      headers: {
        Authorization: `Bearer ${creditKey}`,
        'User-Agent': 'LightningAPI-Model-Synchronizer/2.0',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[ModelSync] ScaleMax operational API returned HTTP ${res.status}`);
      return [];
    }

    const data: any = await res.json();
    if (!data || !Array.isArray(data.data)) {
      return [];
    }

    const models: DiscoveredModel[] = [];

    for (const item of data.data) {
      if (!item.id) continue;
      const upstreamId = item.id;
      const canonicalId = canonicalizeModelId(upstreamId);
      const { family, provider, protocol } = inferModelFamily(canonicalId);

      const caps = item.capabilities || {};
      const pricing = item.pricing || {};

      const supportsVision = Boolean(caps.vision);
      const supportsTools = Boolean(caps.tools || caps.tool_choice || caps.native_tool_calls);
      const supportsStreaming = caps.streaming !== false;
      const supportsReasoning = Boolean(caps.reasoning || caps.reasoning_effort);
      const supportsEffort = Boolean(caps.effort);

      const supplierCostInput = typeof pricing.input_per_million === 'number' ? pricing.input_per_million : 0;
      const supplierCostOutput = typeof pricing.output_per_million === 'number' ? pricing.output_per_million : 0;

      models.push({
        upstreamId,
        canonicalId,
        displayName: (item.display_name || canonicalId).replace(/ScaleMax/gi, 'Lightning').replace(/OpusMax/gi, 'Lightning').replace(/LotusAI/gi, 'Lightning').trim(),
        family,
        provider,
        protocol,
        description: (item.tagline || `${item.display_name || canonicalId} frontier AI model via LightningAPI enterprise network.`).replace(/Available\s+through\s+(?:ScaleMax|OpusMax|LotusAI|OpenPipe)/gi, '').replace(/\b(?:ScaleMax|OpusMax|LotusAI|OpenPipe)\b/gi, 'LightningAPI').trim(),
        contextWindow: Number(item.context_window) || 128000,
        maxOutputTokens: Number(item.max_output_tokens || item.max_tokens) || 65536,
        supplierCostInput,
        supplierCostOutput,
        supportsStreaming,
        supportsTools,
        supportsVision,
        supportsReasoning,
        supportsEffort,
        supportsImageGeneration: protocol === 'images',
        supportsVideo: protocol === 'videos',
        supportsAudio: false,
        supportedInputModalities: supportsVision ? 'text,image' : 'text',
        supportedOutputModalities: 'text',
        source: 'scalemax_authenticated_api',
      });
    }

    return models;
  } catch (err: any) {
    console.warn('[ModelSync] Notice: Operational API query bypassed:', err.message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch and extract models from BOTH ScaleMax public endpoints:
 * 1. https://scalemax.pro/models
 * 2. https://dashboard.scalemax.pro/models
 */
async function fetchScaleMaxPublicCatalogs(): Promise<DiscoveredModel[]> {
  const modelsMap = new Map<string, DiscoveredModel>();

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const [res1, res2] = await Promise.allSettled([
    fetch('https://scalemax.pro/models', { headers }),
    fetch('https://dashboard.scalemax.pro/models', { headers }),
  ]);

  // 1. Process scalemax.pro/models
  if (res1.status === 'fulfilled' && res1.value.ok) {
    try {
      const html = await res1.value.text();
      const articleRegex = /<article[^>]*(?:id|data-model-anchor)="model-([^"]+)"[\s\S]*?<\/article>/gi;

      for (const match of html.matchAll(articleRegex)) {
        const cardHtml = match[0];
        const upstreamId = match[1];
        const canonicalId = canonicalizeModelId(upstreamId);

        const nameMatch =
          cardHtml.match(/<h4[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
          cardHtml.match(/<h4[^>]*>([^<]+)<\/h4>/i) ||
          cardHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i);
        const displayName = nameMatch ? nameMatch[1].trim() : canonicalId;

        const badgeMatches = [
          ...cardHtml.matchAll(/<span[^>]*class="[^"]*rounded-full[^"]*"[^>]*>([^<]+)<\/span>/gi),
        ];
        const badges = badgeMatches.map((b) => b[1].trim());

        const contextMatch = cardHtml.match(/<dt[^>]*>Context<\/dt>[\s\S]*?<dd[^>]*>([^<]+)<\/dd>/i);
        let contextWindow = 128000;
        if (contextMatch) {
          const numStr = contextMatch[1].replace(/[^0-9]/g, '');
          if (numStr) contextWindow = parseInt(numStr, 10);
        }

        const inputMatch = cardHtml.match(/<dt[^>]*>Input\s*\/\s*1M<\/dt>[\s\S]*?<dd[^>]*>([^<]+)<\/dd>/i);
        let supplierCostInput = 0;
        if (inputMatch) {
          const matchNum = inputMatch[1].match(/\$([0-9.]+)/);
          if (matchNum) supplierCostInput = parseFloat(matchNum[1]);
        }

        const outputMatch = cardHtml.match(/<dt[^>]*>Output\s*\/\s*1M<\/dt>[\s\S]*?<dd[^>]*>([^<]+)<\/dd>/i);
        let supplierCostOutput = 0;
        if (outputMatch) {
          const matchNum = outputMatch[1].match(/\$([0-9.]+)/);
          if (matchNum) supplierCostOutput = parseFloat(matchNum[1]);
        }

        const { family, provider, protocol } = inferModelFamily(canonicalId);
        const supportsVision = badges.some((b) => /image|vision/i.test(b));
        const supportsTools = badges.some((b) => /tools/i.test(b));
        const supportsReasoning = badges.some((b) => /reasoning/i.test(b));

        modelsMap.set(canonicalId, {
          upstreamId,
          canonicalId,
          displayName,
          family,
          provider,
          protocol,
          description: `${displayName} high-performance AI model via LightningAPI network.`,
          contextWindow,
          maxOutputTokens: 65536,
          supplierCostInput,
          supplierCostOutput,
          supportsStreaming: true,
          supportsTools,
          supportsVision,
          supportsReasoning,
          supportsEffort: false,
          supportsImageGeneration: protocol === 'images',
          supportsVideo: protocol === 'videos',
          supportsAudio: false,
          supportedInputModalities: supportsVision ? 'text,image' : 'text',
          supportedOutputModalities: 'text',
          source: 'scalemax_catalogue_page',
        });
      }
    } catch (e: any) {
      console.warn('[ModelSync] Error parsing scalemax.pro/models:', e.message);
    }
  }

  // 2. Process dashboard.scalemax.pro/models
  if (res2.status === 'fulfilled' && res2.value.ok) {
    try {
      const html = await res2.value.text();
      const dashArticleRegex = /<article[^>]*(?:data-model-anchor|id)="model-([^"]+)"[\s\S]*?<\/article>/gi;

      for (const match of html.matchAll(dashArticleRegex)) {
        const cardHtml = match[0];
        const upstreamId = match[1];
        const canonicalId = canonicalizeModelId(upstreamId);

        const nameMatch =
          cardHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i) ||
          cardHtml.match(/<h4[^>]*>([^<]+)<\/h4>/i) ||
          cardHtml.match(/<a[^>]*class="[^"]*hover:underline[^"]*"[^>]*>([^<]+)<\/a>/i);
        const displayName = nameMatch ? nameMatch[1].trim() : canonicalId;

        const { family, provider, protocol } = inferModelFamily(canonicalId);

        if (!modelsMap.has(canonicalId)) {
          modelsMap.set(canonicalId, {
            upstreamId,
            canonicalId,
            displayName,
            family,
            provider,
            protocol,
            description: `${displayName} high-performance AI model via LightningAPI network.`,
            contextWindow: 128000,
            maxOutputTokens: 65536,
            supplierCostInput: 1.0,
            supplierCostOutput: 3.0,
            supportsStreaming: true,
            supportsTools: true,
            supportsVision: false,
            supportsReasoning: false,
            supportsEffort: false,
            supportsImageGeneration: protocol === 'images',
            supportsVideo: protocol === 'videos',
            supportsAudio: false,
            supportedInputModalities: 'text',
            supportedOutputModalities: 'text',
            source: 'scalemax_dashboard_page',
          });
        } else {
          // If already discovered, enhance displayName if cleaner
          const existing = modelsMap.get(canonicalId)!;
          if (displayName && displayName !== canonicalId && existing.displayName === canonicalId) {
            existing.displayName = displayName;
          }
        }
      }
    } catch (e: any) {
      console.warn('[ModelSync] Error parsing dashboard.scalemax.pro/models:', e.message);
    }
  }

  // Hard guarantee: Ensure Gemini 4 Argon is always present with full fidelity
  if (!modelsMap.has('gemini-4-argon')) {
    modelsMap.set('gemini-4-argon', {
      upstreamId: 'gemini-4-argon',
      canonicalId: 'gemini-4-argon',
      displayName: 'Gemini 4 Argon',
      family: 'gemini',
      provider: 'Google',
      protocol: 'openai-compatible',
      description:
        "Google's flagship 1M-token frontier reasoning model with native tool calling, deep multimodal vision, and ultra-high generation fidelity via LightningAPI.",
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      supplierCostInput: 8.0,
      supplierCostOutput: 40.0,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: true,
      supportsEffort: false,
      supportsImageGeneration: false,
      supportsVideo: false,
      supportsAudio: false,
      supportedInputModalities: 'text,image',
      supportedOutputModalities: 'text',
      source: 'scalemax_catalogue_page',
    });
  }

  return Array.from(modelsMap.values());
}

/**
 * Ingest, deduplicate and merge models across operational API and both public catalogues
 */
async function discoverAllUpstreamModels(creditKey: string): Promise<DiscoveredModel[]> {
  console.log('[ModelSync] Discovering live models from ScaleMax endpoints...');
  const [apiModels, publicModels] = await Promise.all([
    fetchScaleMaxOperationalModels(creditKey),
    fetchScaleMaxPublicCatalogs(),
  ]);

  console.log(
    `[ModelSync] Discovered: ${apiModels.length} API models, ${publicModels.length} Public Catalogue models.`
  );

  const map = new Map<string, DiscoveredModel>();

  // Public catalog models (covers scalemax.pro/models and dashboard.scalemax.pro/models)
  for (const m of publicModels) {
    map.set(m.canonicalId, m);
  }

  // Operational API models augment with live token specs
  for (const m of apiModels) {
    if (!map.has(m.canonicalId)) {
      map.set(m.canonicalId, m);
    } else {
      const existing = map.get(m.canonicalId)!;
      if (m.supplierCostInput > 0) existing.supplierCostInput = m.supplierCostInput;
      if (m.supplierCostOutput > 0) existing.supplierCostOutput = m.supplierCostOutput;
      if (m.contextWindow > 0) existing.contextWindow = m.contextWindow;
    }
  }

  // Deduplicate by canonicalId and strictly exclude any Claude 3 family models
  const finalUnique = new Map<string, DiscoveredModel>();
  for (const model of map.values()) {
    const lowerId = model.canonicalId.toLowerCase();
    const lowerName = model.displayName.toLowerCase();
    const isClaude3 =
      lowerId.startsWith('claude-3') ||
      lowerId.includes('claude-3') ||
      lowerName.includes('claude 3') ||
      lowerName.includes('claude-3') ||
      lowerId.includes('3-5-sonnet') ||
      lowerId.includes('3-5-haiku') ||
      lowerId.includes('3-7-sonnet') ||
      lowerId.includes('3-opus');

    if (isClaude3) continue;

    if (!finalUnique.has(model.canonicalId)) {
      finalUnique.set(model.canonicalId, model);
    }
  }

  return Array.from(finalUnique.values());
}

/**
 * Core Orchestrator: Execute a real-time synchronisation cycle
 */
export async function executeModelSync(
  trigger: 'SCHEDULED' | 'MANUAL_ADMIN' = 'SCHEDULED'
): Promise<ModelSyncResult> {
  if (isSyncInProgress) {
    return {
      success: false,
      trigger,
      durationMs: 0,
      modelsDiscovered: lastSyncModelCount,
      modelsAdded: 0,
      modelsUpdated: 0,
      modelsUnavailable: 0,
      priceChangesCount: 0,
      error: 'Model synchronization is currently running in another process.',
      timestamp: new Date().toISOString(),
    };
  }

  isSyncInProgress = true;
  const startTime = Date.now();

  let syncHistoryRecord: any = null;
  try {
    syncHistoryRecord = await prisma.modelSyncHistory.create({
      data: {
        syncTrigger: trigger,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  } catch (err: any) {
    console.error('[ModelSync] Notice: ModelSyncHistory logging bypassed:', err.message);
  }

  let modelsDiscovered = 0;
  let modelsAdded = 0;
  let modelsUpdated = 0;
  let modelsUnavailable = 0;
  let priceChangesCount = 0;

  try {
    // 1. Resolve ScaleMax provider credentials (optional fallback)
    let activeCreditKey = process.env.SCALEMAX_CREDIT_API_KEY || process.env.SCALEMAX_MASTER_API_KEY || '';

    try {
      const scalemaxProvider = await prisma.vendorProvider.findFirst({
        where: {
          OR: [{ slug: 'scalemax' }, { name: { contains: 'scalemax', mode: 'insensitive' } }],
        },
      });
      if (scalemaxProvider?.creditApiKeyEncrypted && !activeCreditKey) {
        activeCreditKey = decryptText(scalemaxProvider.creditApiKeyEncrypted);
      }
    } catch {}

    // 2. Discover models across public catalogues and operational API
    const discoveredModels = await discoverAllUpstreamModels(activeCreditKey);
    modelsDiscovered = discoveredModels.length;

    if (modelsDiscovered === 0) {
      throw new Error('Upstream model discovery returned 0 models. Sync aborted to prevent catalogue wiping.');
    }

    // 3. Fetch existing models from database and ensure Claude 3 family models are purged/disabled
    await prisma.model.updateMany({
      where: {
        OR: [
          { modelId: { startsWith: 'claude-3' } },
          { modelId: { contains: 'claude-3' } },
          { displayName: { contains: 'claude 3', mode: 'insensitive' } },
          { modelId: { contains: '3-5-sonnet' } },
          { modelId: { contains: '3-5-haiku' } },
          { modelId: { contains: '3-7-sonnet' } },
          { modelId: { contains: '3-opus' } },
        ],
      },
      data: {
        enabled: false,
        validationStatus: 'DISABLED',
        isCustomerAvailable: false,
      },
    }).catch(() => {});

    const existingDbModels = await prisma.model.findMany();
    const dbModelMap = new Map<string, any>();
    for (const m of existingDbModels) {
      dbModelMap.set(m.modelId, m);
      if (m.upstreamModelId) dbModelMap.set(m.upstreamModelId, m);
    }

    const discoveredIdsSet = new Set<string>();

    // 4. Ingest discovered models directly as ACTIVE, ENABLED, and CUSTOMER AVAILABLE
    for (const disc of discoveredModels) {
      discoveredIdsSet.add(disc.canonicalId);
      discoveredIdsSet.add(disc.upstreamId);

      const existing = dbModelMap.get(disc.canonicalId) || dbModelMap.get(disc.upstreamId);

      const suggestedInputPrice =
        disc.supplierCostInput > 0
          ? Math.max(0.5, Math.round(disc.supplierCostInput * 1.35 * 100) / 100)
          : 2.5;
      const suggestedOutputPrice =
        disc.supplierCostOutput > 0
          ? Math.max(1.5, Math.round(disc.supplierCostOutput * 1.35 * 100) / 100)
          : 10.0;

      if (!existing) {
        // --- NEW MODEL DISCOVERED (e.g. Gemini 4 Argon) ---
        // Automatically make ACTIVE, ENABLED, and CUSTOMER AVAILABLE immediately
        await prisma.model.create({
          data: {
            modelId: disc.canonicalId,
            upstreamModelId: disc.upstreamId,
            displayName: disc.displayName,
            family: disc.family,
            provider: disc.provider,
            providerSlug: 'scalemax',
            protocol: disc.protocol,
            description: disc.description,
            contextWindow: disc.contextWindow,
            maxOutputTokens: disc.maxOutputTokens,
            validationStatus: 'ACTIVE', // Automatically active and visible
            availabilityStatus: 'available',
            enabled: true, // Automatically enabled
            isCustomerAvailable: true, // Immediate customer visibility
            supplierCostInput: disc.supplierCostInput,
            supplierCostOutput: disc.supplierCostOutput,
            inputPrice: suggestedInputPrice,
            outputPrice: suggestedOutputPrice,
            supportsStreaming: disc.supportsStreaming,
            supportsTools: disc.supportsTools,
            supportsVision: disc.supportsVision,
            supportsImageInput: disc.supportsVision,
            supportsReasoning: disc.supportsReasoning,
            supportsImageGeneration: disc.supportsImageGeneration,
            supportsVideo: disc.supportsVideo,
            supportsAudio: disc.supportsAudio,
            supportedInputModalities: disc.supportedInputModalities,
            supportedOutputModalities: disc.supportedOutputModalities,
            metadataSource: disc.source,
            firstDiscoveredAt: new Date(),
            lastSyncAt: new Date(),
            lastMetadataUpdateAt: new Date(),
          },
        });

        modelsAdded++;
      } else {
        // --- EXISTING MODEL REFRESH ---
        const updates: any = {
          lastSyncAt: new Date(),
        };

        // If previously disabled or stuck in PENDING_VALIDATION, activate it now!
        if (
          !existing.enabled ||
          existing.validationStatus === 'PENDING_VALIDATION' ||
          !existing.isCustomerAvailable
        ) {
          updates.enabled = true;
          updates.validationStatus = 'ACTIVE';
          updates.availabilityStatus = 'available';
          updates.isCustomerAvailable = true;
        }

        if (disc.contextWindow > 0 && existing.contextWindow !== disc.contextWindow) {
          updates.contextWindow = disc.contextWindow;
        }
        if (disc.displayName && existing.displayName === existing.modelId) {
          updates.displayName = disc.displayName;
        }
        if (disc.supportsVision && !existing.supportsVision) {
          updates.supportsVision = true;
          updates.supportsImageInput = true;
        }
        if (disc.supportsTools && !existing.supportsTools) {
          updates.supportsTools = true;
        }
        if (disc.supportsReasoning && !existing.supportsReasoning) {
          updates.supportsReasoning = true;
        }
        if (disc.supplierCostInput > 0) {
          updates.supplierCostInput = disc.supplierCostInput;
        }
        if (disc.supplierCostOutput > 0) {
          updates.supplierCostOutput = disc.supplierCostOutput;
        }

        await prisma.model.update({
          where: { id: existing.id },
          data: updates,
        });

        modelsUpdated++;
      }
    }

    const durationMs = Date.now() - startTime;
    lastSyncTimestamp = new Date().toISOString();
    lastSyncModelCount = modelsDiscovered;

    console.log(
      `[ModelSync] Synchronization complete in ${durationMs}ms: ${modelsDiscovered} discovered, ${modelsAdded} added, ${modelsUpdated} updated.`
    );

    if (syncHistoryRecord) {
      await prisma.modelSyncHistory
        .update({
          where: { id: syncHistoryRecord.id },
          data: {
            status: 'SUCCESS',
            modelsDiscovered,
            modelsAdded,
            modelsUpdated,
            modelsUnavailable,
            durationMs,
            completedAt: new Date(),
          },
        })
        .catch(() => {});
    }

    return {
      success: true,
      syncHistoryId: syncHistoryRecord?.id,
      trigger,
      durationMs,
      modelsDiscovered,
      modelsAdded,
      modelsUpdated,
      modelsUnavailable,
      priceChangesCount,
      timestamp: lastSyncTimestamp,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[ModelSync] Error during execution:', err.message);

    if (syncHistoryRecord) {
      await prisma.modelSyncHistory
        .update({
          where: { id: syncHistoryRecord.id },
          data: {
            status: 'FAILED',
            error: err.message,
            durationMs,
            completedAt: new Date(),
          },
        })
        .catch(() => {});
    }

    return {
      success: false,
      syncHistoryId: syncHistoryRecord?.id,
      trigger,
      durationMs,
      modelsDiscovered,
      modelsAdded,
      modelsUpdated,
      modelsUnavailable,
      priceChangesCount,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Get current synchronization status
 */
export function getModelSyncStatus() {
  return {
    isSyncInProgress,
    lastSyncTimestamp,
    lastSyncModelCount,
    isSchedulerRunning: !!syncSchedulerTimer,
  };
}

/**
 * Start Background Synchronizer Schedule (Runs immediately + every intervalMinutes)
 */
export function startModelSyncScheduler(intervalMinutes: number = 10): void {
  if (syncSchedulerTimer) {
    clearInterval(syncSchedulerTimer);
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  console.log(`[ModelSync] Real-time synchronizer active (interval: ${intervalMinutes}m).`);

  // Initial trigger 2 seconds after boot
  setTimeout(() => {
    executeModelSync('SCHEDULED').catch((err) => {
      console.warn('[ModelSync] Initial boot sync notice:', err.message);
    });
  }, 2000);

  syncSchedulerTimer = setInterval(() => {
    executeModelSync('SCHEDULED').catch((err) => {
      console.warn('[ModelSync] Recurring scheduled sync notice:', err.message);
    });
  }, intervalMs);
}

/**
 * Stop Background Synchronizer
 */
export function stopModelSyncScheduler(): void {
  if (syncSchedulerTimer) {
    clearInterval(syncSchedulerTimer);
    syncSchedulerTimer = null;
  }
}
