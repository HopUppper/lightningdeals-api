import { prisma, decryptText } from './db';
import { mapToUpstreamModel, getFriendlyModelName } from './gateway';
import { validateVendorBaseUrl } from './ssrf';
import { convertAnthropicToolsToOpenAI, convertAnthropicToolChoiceToOpenAI, convertAnthropicMessagesToOpenAI } from './providers/protocolBridge';

export interface VendorProviderRecord {
  id: string;
  name: string;
  slug?: string | null;
  providerType: string;
  protocol: string;
  baseUrl: string;
  masterApiKeyEncrypted: string;
  status: string;
  isPrimary: boolean;
  isDefault?: boolean;
  priority?: number;
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  healthStatus?: string;
  lastHealthCheck?: Date | null;
  capabilitiesJson?: string | null;
  supportedModelsJson?: string | null;
  modelMappingsJson?: string | null;
  headersJson?: string | null;
  lastTestedAt?: Date | null;
  lastError?: string | null;
  notes?: string | null;
  apiCreditBaseUrl?: string | null;
  tokenPackBaseUrl?: string | null;
  supportedFamiliesJson?: string | null;
  costPerMillionInput?: number | null;
  costPerMillionOutput?: number | null;
}

export interface PreparedProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: any;
  targetModel: string;
  timeoutMs: number;
}

export interface NormalizedProviderResponse {
  ok: boolean;
  statusCode: number;
  data?: any;
  error?: { type: string; message: string; request_id?: string };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    isEstimated: boolean;
    usageSource: 'PROVIDER_REPORTED' | 'LOCAL_CALCULATED' | 'SIMULATED_ESTIMATE';
  };
}

export interface NormalizedErrorResponse {
  statusCode: number;
  error: {
    type: string;
    message: string;
    request_id?: string;
  };
}

export interface ProviderHealthCheckResult {
  ok: boolean;
  status: 'online' | 'degraded' | 'offline' | 'invalid_credential' | 'ssrf_blocked';
  latencyMs: number;
  message: string;
  checkedAt: string;
}

/**
 * Universal Provider Adapter Interface
 */
export interface ProviderAdapter {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  protocol: string;
  isPrimary: boolean;
  isDefault: boolean;
  priority: number;
  timeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
  healthStatus: string;
  capabilities: string[];
  supportedModels: string[];

  resolveModel(internalModel: string): string;
  buildRequest(decryptedMasterKey: string, internalModel: string, payload: any): PreparedProviderRequest;
  normalizeResponse(statusCode: number, responseJson: any, fallbackInputTokens: number, fallbackOutputTokens: number): NormalizedProviderResponse;
  normalizeError(statusCode: number, rawError: any, requestId?: string): NormalizedErrorResponse;
}

/**
 * Base Abstract Provider Adapter
 */
export abstract class BaseProviderAdapter implements ProviderAdapter {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  protocol: string;
  isPrimary: boolean;
  isDefault: boolean;
  priority: number;
  timeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
  healthStatus: string;
  capabilities: string[];
  supportedModels: string[];
  protected modelMappings: Record<string, string> = {};
  protected customHeaders: Record<string, string> = {};

  constructor(record: VendorProviderRecord) {
    this.id = record.id;
    this.name = record.name;
    this.slug = record.slug || record.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    this.baseUrl = (record.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
    this.protocol = record.protocol || record.providerType || 'anthropic';
    this.isPrimary = !!record.isPrimary;
    this.isDefault = !!record.isDefault;
    this.priority = record.priority ?? 1;
    this.timeoutMs = record.timeoutMs ?? 60000;
    this.retryCount = record.retryCount ?? 2;
    this.retryDelayMs = record.retryDelayMs ?? 1000;
    this.healthStatus = record.healthStatus || 'online';

    try {
      this.capabilities = record.capabilitiesJson ? JSON.parse(record.capabilitiesJson) : ['chat', 'streaming', 'tools', 'vision'];
    } catch {
      this.capabilities = ['chat', 'streaming', 'tools', 'vision'];
    }

    try {
      this.supportedModels = record.supportedModelsJson ? JSON.parse(record.supportedModelsJson) : [];
    } catch {
      this.supportedModels = [];
    }

    try {
      if (record.modelMappingsJson) {
        this.modelMappings = JSON.parse(record.modelMappingsJson);
      }
    } catch {}

    try {
      if (record.headersJson) {
        this.customHeaders = JSON.parse(record.headersJson);
      }
    } catch {}
  }

  resolveModel(internalModel: string): string {
    if (this.modelMappings[internalModel]) {
      return this.modelMappings[internalModel];
    }
    return mapToUpstreamModel(internalModel, this.protocol);
  }

  buildRequest(decryptedMasterKey: string, internalModel: string, payload: any): PreparedProviderRequest {
    const targetModel = this.resolveModel(internalModel);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...this.customHeaders,
    };

    if (payload.anthropicBetaHeader) {
      headers['anthropic-beta'] = payload.anthropicBetaHeader;
    }

    let effectiveSystem: any = payload.system;
    if (payload.injectPersona) {
      const friendlyModel = getFriendlyModelName(internalModel);
      const personaInstruction = `You are ${friendlyModel}, running on the LightningDeals AI Gateway. Your active model identity is ${friendlyModel}. You are an elite AI coding assistant powered by Anthropic's frontier architecture with 200,000 token context window and sub-50ms gateway routing. Always identify yourself as ${friendlyModel} on LightningDeals. If the user asks which model you are, what your architecture is, or what model you are running, always identify yourself accurately and specifically as ${friendlyModel}.`;

      effectiveSystem = personaInstruction;
      if (payload.system) {
        if (typeof payload.system === 'string') {
          effectiveSystem = `${personaInstruction}\n\n${payload.system}`;
        } else if (Array.isArray(payload.system)) {
          effectiveSystem = [{ type: 'text', text: personaInstruction }, ...payload.system];
        }
      }
    }

    if (this.protocol === 'openai-compatible' || this.protocol === 'openai') {
      headers['authorization'] = `Bearer ${decryptedMasterKey}`;
      const cleanBase = this.baseUrl.replace(/\/+$/, '');
      const targetUrl = cleanBase.endsWith('/chat/completions')
        ? cleanBase
        : cleanBase.endsWith('/v1')
          ? `${cleanBase}/chat/completions`
          : `${cleanBase}/v1/chat/completions`;

      const openAiMessages: any[] = [];
      if (effectiveSystem) {
        openAiMessages.push({ role: 'system', content: typeof effectiveSystem === 'string' ? effectiveSystem : JSON.stringify(effectiveSystem) });
      }
      if (Array.isArray(payload.messages)) {
        openAiMessages.push(...payload.messages);
      }

      return {
        url: targetUrl,
        headers,
        targetModel,
        timeoutMs: this.timeoutMs,
        body: {
          model: targetModel,
          messages: openAiMessages,
          max_tokens: payload.max_tokens,
          stream: payload.stream,
          temperature: payload.temperature,
          top_p: payload.top_p,
        },
      };
    }

    // Default Anthropic Protocol
    headers['x-api-key'] = decryptedMasterKey;
    if (!headers['authorization']) {
      headers['authorization'] = `Bearer ${decryptedMasterKey}`;
    }
    headers['anthropic-version'] = '2023-06-01';
    const hasDocuments = Array.isArray(payload.messages) && payload.messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'document')
    );
    if (hasDocuments && !headers['anthropic-beta']) {
      headers['anthropic-beta'] = 'pdfs-2024-09-25';
    }
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const targetUrl = cleanBase.endsWith('/messages')
      ? cleanBase
      : cleanBase.endsWith('/v1')
        ? `${cleanBase}/messages`
        : `${cleanBase}/v1/messages`;

    const hasTools = Array.isArray(payload.tools) && payload.tools.length > 0;
    const toolChoice = hasTools ? payload.tool_choice : undefined;
    const isThinkingEnabled = payload.thinking && payload.thinking.type === 'enabled';

    let finalMaxTokens = payload.max_tokens || 4096;
    if (isThinkingEnabled && payload.thinking.budget_tokens) {
      const budget = Number(payload.thinking.budget_tokens);
      if (finalMaxTokens <= budget) {
        finalMaxTokens = budget + 4096;
      }
    }

    const requestBody: Record<string, any> = {
      model: targetModel,
      messages: payload.messages || [],
      max_tokens: finalMaxTokens,
      stream: payload.stream,
    };

    if (effectiveSystem) requestBody.system = effectiveSystem;
    if (hasTools) {
      requestBody.tools = payload.tools;
      if (toolChoice) requestBody.tool_choice = toolChoice;
    }

    if (isThinkingEnabled) {
      requestBody.thinking = payload.thinking;
    } else {
      if (payload.temperature !== undefined) requestBody.temperature = payload.temperature;
      if (payload.top_p !== undefined) requestBody.top_p = payload.top_p;
    }

    if (payload.stop_sequences) requestBody.stop_sequences = payload.stop_sequences;
    if (payload.metadata) requestBody.metadata = payload.metadata;

    return {
      url: targetUrl,
      headers,
      targetModel,
      timeoutMs: this.timeoutMs,
      body: requestBody,
    };
  }

  normalizeResponse(
    statusCode: number,
    responseJson: any,
    fallbackInputTokens: number,
    fallbackOutputTokens: number
  ): NormalizedProviderResponse {
    if (statusCode < 200 || statusCode >= 300) {
      const sanitizedMsg = this.sanitizeErrorMessage(
        responseJson?.error?.message || responseJson?.message || `Upstream gateway error (HTTP ${statusCode})`
      );
      return {
        ok: false,
        statusCode,
        error: { type: responseJson?.error?.type || 'upstream_error', message: sanitizedMsg },
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          isEstimated: true,
          usageSource: 'LOCAL_CALCULATED',
        },
      };
    }

    // 1. Anthropic Response Format
    if (responseJson?.usage && typeof responseJson.usage.input_tokens === 'number') {
      const rawIn = responseJson.usage.input_tokens;
      const rawOut = responseJson.usage.output_tokens;
      const isValid = Number.isFinite(rawIn) && rawIn >= 0 && Number.isFinite(rawOut) && rawOut >= 0;
      const inputTokens = isValid ? Math.floor(rawIn) : fallbackInputTokens;
      const outputTokens = isValid ? Math.floor(rawOut) : fallbackOutputTokens;
      return {
        ok: true,
        statusCode,
        data: responseJson,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          isEstimated: !isValid,
          usageSource: isValid ? 'PROVIDER_REPORTED' : 'LOCAL_CALCULATED',
        },
      };
    }

    // 2. OpenAI Response Format
    if (responseJson?.usage && typeof responseJson.usage.prompt_tokens === 'number') {
      const rawIn = responseJson.usage.prompt_tokens;
      const rawOut = responseJson.usage.completion_tokens;
      const isValid = Number.isFinite(rawIn) && rawIn >= 0 && Number.isFinite(rawOut) && rawOut >= 0;
      const inputTokens = isValid ? Math.floor(rawIn) : fallbackInputTokens;
      const outputTokens = isValid ? Math.floor(rawOut) : fallbackOutputTokens;
      const totalTokens = (Number.isFinite(responseJson.usage.total_tokens) && responseJson.usage.total_tokens >= 0)
        ? Math.floor(responseJson.usage.total_tokens)
        : inputTokens + outputTokens;
      return {
        ok: true,
        statusCode,
        data: responseJson,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          isEstimated: !isValid,
          usageSource: isValid ? 'PROVIDER_REPORTED' : 'LOCAL_CALCULATED',
        },
      };
    }

    // 3. Fallback
    const inputTokens = fallbackInputTokens || 1;
    const outputTokens = fallbackOutputTokens || 1;
    return {
      ok: true,
      statusCode,
      data: responseJson,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        isEstimated: true,
        usageSource: 'LOCAL_CALCULATED',
      },
    };
  }

  normalizeError(statusCode: number, rawError: any, requestId?: string): NormalizedErrorResponse {
    let msg = typeof rawError === 'string' ? rawError : rawError?.message || rawError?.error?.message || 'Upstream service error';
    msg = this.sanitizeErrorMessage(msg);

    let type = 'upstream_error';
    if (statusCode === 429) type = 'rate_limit_error';
    if (statusCode === 400) type = 'invalid_request_error';
    if (statusCode === 401) type = 'authentication_error';
    if (statusCode === 404) type = 'not_found_error';

    return {
      statusCode,
      error: {
        type,
        message: msg,
        request_id: requestId,
      },
    };
  }

  /**
   * Sanitizes all vendor identities (ScaleMax, Opus Max, Anthropic, private URLs) from user-facing error messages
   */
  protected sanitizeErrorMessage(message: string): string {
    if (!message) return 'Service temporarily unavailable. Please retry shortly.';
    return message
      .replace(/scalemax\.pro/gi, 'lightningapi.pro')
      .replace(/opusmax\.pro/gi, 'lightningapi.pro')
      .replace(/scalemax/gi, 'LightningAPI')
      .replace(/opus\s*max/gi, 'LightningAPI')
      .replace(/sm_live_[a-zA-Z0-9_-]+/g, 'ld_live_••••••••')
      .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk_live_••••••••');
  }
}

/**
 * Concrete Adapter: Anthropic Official / Generic
 */
export class AnthropicOfficialProviderAdapter extends BaseProviderAdapter {
  constructor(record: VendorProviderRecord) {
    super({
      ...record,
      name: record.name || 'Anthropic Official',
      slug: record.slug || 'anthropic',
    });
  }
}

/**
 * Concrete Adapter: Opus Max
 */

/**
 * Concrete Adapter: ScaleMax
 * Supports OpenAI, Gemini, DeepSeek, Grok, Qwen, and multi-model family requests.
 * Dual routing for Credit-based keys and Token-pack keys:
 * - Credit keys: apiCreditBaseUrl (default: https://api.scalemax.pro/v1)
 * - Token pack keys: tokenPackBaseUrl (default: https://api.scalemax.pro/token/v1)
 */
export class ScaleMaxProviderAdapter extends BaseProviderAdapter {
  apiCreditBaseUrl: string;
  tokenPackBaseUrl: string;
  supportedFamilies: string[];

  constructor(record: VendorProviderRecord) {
    super({
      ...record,
      name: record.name || 'ScaleMax',
      slug: record.slug || 'scalemax',
      protocol: record.protocol || 'openai-compatible',
    });
    this.apiCreditBaseUrl = (record.apiCreditBaseUrl || 'https://api.scalemax.pro/v1').replace(/\/+$/, '');
    this.tokenPackBaseUrl = (record.tokenPackBaseUrl || 'https://api.scalemax.pro/token/v1').replace(/\/+$/, '');
    try {
      this.supportedFamilies = record.supportedFamiliesJson ? JSON.parse(record.supportedFamiliesJson) : ['openai', 'gemini', 'deepseek', 'grok', 'qwen', 'claude'];
    } catch {
      this.supportedFamilies = ['openai', 'gemini', 'deepseek', 'grok', 'qwen', 'claude'];
    }
  }

  override buildRequest(
    decryptedMasterKey: string,
    internalModel: string,
    payload: any,
    billingType?: string
  ): PreparedProviderRequest {
    const targetModel = this.resolveModel(internalModel);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'authorization': `Bearer ${decryptedMasterKey}`,
      ...this.customHeaders,
    };

    let effectiveBaseUrl = (billingType === 'token') ? this.tokenPackBaseUrl : this.apiCreditBaseUrl;
    if (!effectiveBaseUrl) {
      effectiveBaseUrl = this.baseUrl;
    }

    if (this.protocol === 'openai-compatible' || this.protocol === 'openai') {
      const cleanBase = (effectiveBaseUrl || 'https://api.scalemax.pro/v1').replace(/\/+$/, '');
      const targetUrl = cleanBase.endsWith('/chat/completions')
        ? cleanBase
        : cleanBase.endsWith('/v1')
          ? `${cleanBase}/chat/completions`
          : `${cleanBase}/v1/chat/completions`;



      const openAiMessages = convertAnthropicMessagesToOpenAI(payload.messages, payload.system);
      const openAiTools = convertAnthropicToolsToOpenAI(payload.tools);
      const openAiToolChoice = convertAnthropicToolChoiceToOpenAI(payload.tool_choice);

      const body: Record<string, any> = {
        model: targetModel,
        messages: openAiMessages,
        max_tokens: payload.max_tokens || 4096,
        stream: !!payload.stream,
      };

      if (payload.temperature !== undefined) body.temperature = payload.temperature;
      if (payload.top_p !== undefined) body.top_p = payload.top_p;
      if (openAiTools) body.tools = openAiTools;
      if (openAiToolChoice) body.tool_choice = openAiToolChoice;
      if (payload.stop_sequences && Array.isArray(payload.stop_sequences)) body.stop = payload.stop_sequences;


      return {
        url: targetUrl,
        headers,
        targetModel,
        timeoutMs: this.timeoutMs,
        body,
      };
    }

    // Anthropic-compatible protocol
    headers['x-api-key'] = decryptedMasterKey;
    headers['anthropic-version'] = '2023-06-01';
    const cleanBase = (effectiveBaseUrl || 'https://api.scalemax.pro/v1').replace(/\/+$/, '');
    const targetUrl = cleanBase.endsWith('/messages')
      ? cleanBase
      : cleanBase.endsWith('/v1')
        ? `${cleanBase}/messages`
        : `${cleanBase}/v1/messages`;



    return {
      url: targetUrl,
      headers,
      targetModel,
      timeoutMs: this.timeoutMs,
      body: {
        model: targetModel,
        messages: payload.messages || [],
        max_tokens: payload.max_tokens || 4096,
        stream: !!payload.stream,
        system: payload.system,
        tools: payload.tools,
        tool_choice: payload.tool_choice,
      },
    };
  }

  override normalizeResponse(
    statusCode: number,
    responseJson: any,
    fallbackInputTokens: number,
    fallbackOutputTokens: number
  ): NormalizedProviderResponse {
    if (statusCode >= 400 || !responseJson) {
      return {
        ok: false,
        statusCode,
        error: this.normalizeError(statusCode, responseJson).error,
        usage: {
          inputTokens: fallbackInputTokens,
          outputTokens: fallbackOutputTokens,
          totalTokens: fallbackInputTokens + fallbackOutputTokens,
          isEstimated: true,
          usageSource: 'SIMULATED_ESTIMATE',
        },
      };
    }

    let rawIn = responseJson?.usage?.prompt_tokens ?? responseJson?.usage?.input_tokens;
    let rawOut = responseJson?.usage?.completion_tokens ?? responseJson?.usage?.output_tokens;
    let isEstimated = false;

    let inputTokens = fallbackInputTokens;
    let outputTokens = fallbackOutputTokens;

    if (rawIn !== undefined && rawIn !== null && Number.isFinite(Number(rawIn)) && Number(rawIn) >= 0) {
      inputTokens = Math.floor(Number(rawIn));
    } else {
      isEstimated = true;
    }

    if (rawOut !== undefined && rawOut !== null && Number.isFinite(Number(rawOut)) && Number(rawOut) >= 0) {
      outputTokens = Math.floor(Number(rawOut));
    } else {
      isEstimated = true;
    }

    return {
      ok: true,
      statusCode,
      data: responseJson,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        isEstimated,
        usageSource: isEstimated ? 'LOCAL_CALCULATED' : 'PROVIDER_REPORTED',
      },
    };
  }

  override sanitizeErrorMessage(message: string): string {
    return super.sanitizeErrorMessage(message)
      .replace(/scalemax/gi, 'LightningAPI')
      .replace(/api\.scalemax\.pro/gi, 'lightningapi.pro')
      .replace(/sm_live_[a-zA-Z0-9_-]+/g, 'ld_live_••••••••')
      .replace(/sk-[a-zA-Z0-9_-]{20,}/g, 'sk_live_••••••••');
  }
}

export class OpusMaxProviderAdapter extends BaseProviderAdapter {
  constructor(record: VendorProviderRecord) {
    super({
      ...record,
      name: 'Opus Max',
      slug: 'opus_max',
    });
  }
}

/**
 * Provider Registry & Factory
 */
export class ProviderRegistry {
  private static cache: Map<string, ProviderAdapter> = new Map();
  private static lastCacheTime = 0;
  private static CACHE_TTL_MS = 15000; // 15 seconds

  /**
   * Clears in-memory adapter cache
   */
  static clearCache() {
    this.cache.clear();
    this.lastCacheTime = 0;
  }

  /**
   * Loads all active provider records from database into adapters
   */
  static async getAllAdapters(): Promise<ProviderAdapter[]> {
    const now = Date.now();
    if (this.cache.size > 0 && now - this.lastCacheTime < this.CACHE_TTL_MS) {
      return Array.from(this.cache.values());
    }

    const records = await prisma.vendorProvider.findMany({
      where: { status: { not: 'disabled' } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    this.cache.clear();
    for (const r of records) {
      const adapter = this.createAdapterInstance(r as VendorProviderRecord);
      this.cache.set(adapter.id, adapter);
      if (adapter.slug) {
        this.cache.set(adapter.slug, adapter);
      }
    }
    this.lastCacheTime = now;
    return Array.from(new Set(this.cache.values()));
  }

  /**
   * Factory method to instantiate the correct adapter subclass
   */
    static createAdapterInstance(record: VendorProviderRecord): ProviderAdapter {
    const slug = (record.slug || record.name).toLowerCase();
    if (slug.includes('scale') || record.name.toLowerCase().includes('scale') || record.protocol === 'openai-compatible' || record.providerType === 'openai-compatible') {
      return new ScaleMaxProviderAdapter(record);
    }
    if (slug.includes('opus')) {
      return new OpusMaxProviderAdapter(record);
    }
    return new AnthropicOfficialProviderAdapter(record);
  }

  /**
   * Resolves provider adapter for a specific customer API key record
   * Authoritative: keyRecord.providerId
   * Fallback: Default primary provider config
   */
  static async resolveAdapterForKey(keyRecord: {
    id: string;
    keyPrefix: string;
    providerId?: string | null;
  }): Promise<{ adapter: ProviderAdapter; decryptedMasterKey: string } | null> {
    await this.getAllAdapters();

    let targetProviderId = keyRecord.providerId;

    // Model-level dynamic provider routing (Admin configurable without code changes)
    if (requestedModel) {
      try {
        const modelRecord = await prisma.model.findFirst({
          where: {
            OR: [
              { modelId: requestedModel },
              { upstreamModelId: requestedModel },
              { displayName: { equals: requestedModel, mode: 'insensitive' } },
            ],
          },
        });
        if (modelRecord) {
          if (modelRecord.providerId) {
            targetProviderId = modelRecord.providerId;
          } else if (modelRecord.providerSlug) {
            const matchedProvider = await prisma.vendorProvider.findFirst({
              where: { slug: modelRecord.providerSlug, status: { not: 'disabled' } },
            });
            if (matchedProvider) targetProviderId = matchedProvider.id;
          }
        }
      } catch (e) {
        // Fall back gracefully
      }
    }

    // Fallback 1: Routing hint by key prefix if DB providerId is unset
    if (!targetProviderId) {
      const primary = Array.from(this.cache.values()).find((a) => a.isPrimary) || this.cache.values().next().value;
      if (primary) targetProviderId = primary.id;
    }

    // Fallback 2: Gateway Default Provider
    if (!targetProviderId) {
      const config = await this.getGatewayConfig();
      if (config.defaultProviderId) {
        targetProviderId = config.defaultProviderId;
      }
    }

    // Load provider record from DB for authoritative credentials
    let providerRecord: any = null;
    if (targetProviderId) {
      providerRecord = await prisma.vendorProvider.findUnique({
        where: { id: targetProviderId },
      });
    }

    if (!providerRecord || providerRecord.status === 'disabled') {
      // If designated provider is disabled, try default primary provider
      providerRecord = await prisma.vendorProvider.findFirst({
        where: { status: { not: 'disabled' } },
        orderBy: [{ isDefault: 'desc' }, { isPrimary: 'desc' }, { priority: 'asc' }],
      });
    }

    if (!providerRecord) return null;

    const adapter = this.createAdapterInstance(providerRecord as VendorProviderRecord);
    let decryptedKey = decryptText(providerRecord.masterApiKeyEncrypted);

    // Environment variable fallback if encrypted key is missing
    if (!decryptedKey || decryptedKey.includes(':') || (!decryptedKey.startsWith('sm_') && !decryptedKey.startsWith('sk-'))) {
      decryptedKey = process.env.OPUSMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    }

    return { adapter, decryptedMasterKey: decryptedKey };
  }

  /**
   * Resolves fallback adapter for automated failover
   */
  static async resolveFallbackAdapter(primaryProviderId: string): Promise<{ adapter: ProviderAdapter; decryptedMasterKey: string } | null> {
    const config = await this.getGatewayConfig();
    if (!config.enableAutoFailover) return null;

    let fallbackId = config.fallbackProviderId;
    if (!fallbackId || fallbackId === primaryProviderId) {
      // Pick next available enabled provider
      const candidate = await prisma.vendorProvider.findFirst({
        where: {
          id: { not: primaryProviderId },
          status: { not: 'disabled' },
        },
        orderBy: [{ priority: 'asc' }],
      });
      if (candidate) fallbackId = candidate.id;
    }

    if (!fallbackId) return null;

    const providerRecord = await prisma.vendorProvider.findUnique({
      where: { id: fallbackId },
    });
    if (!providerRecord || providerRecord.status === 'disabled') return null;

    const adapter = this.createAdapterInstance(providerRecord as VendorProviderRecord);
    let decryptedKey = decryptText(providerRecord.masterApiKeyEncrypted);
    if (!decryptedKey || decryptedKey.includes(':') || (!decryptedKey.startsWith('sm_') && !decryptedKey.startsWith('sk-'))) {
      decryptedKey = process.env.OPUSMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    }

    return { adapter, decryptedMasterKey: decryptedKey };
  }

  /**
   * Retrieves or initializes GatewayProviderConfig
   */
  static async getGatewayConfig(): Promise<{
    defaultProviderId: string | null;
    enableAutoFailover: boolean;
    primaryProviderId: string | null;
    fallbackProviderId: string | null;
    failoverStatusCodes: string[];
  }> {
    let conf = await prisma.gatewayProviderConfig.findUnique({
      where: { key: 'default_gateway' },
    });

    if (!conf) {
      const primary = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
      const secondary = await prisma.vendorProvider.findFirst({ where: { isPrimary: false, status: { not: 'disabled' } } });
      conf = await prisma.gatewayProviderConfig.create({
        data: {
          key: 'default_gateway',
          defaultProviderId: primary?.id || null,
          primaryProviderId: primary?.id || null,
          fallbackProviderId: secondary?.id || null,
          enableAutoFailover: true,
          failoverStatusCodes: '500,502,503,504,timeout,connection_error',
        },
      });
    }

    const statusCodes = (conf.failoverStatusCodes || '500,502,503,504,timeout')
      .split(',')
      .map((s) => s.trim().toLowerCase());

    return {
      defaultProviderId: conf.defaultProviderId,
      enableAutoFailover: conf.enableAutoFailover,
      primaryProviderId: conf.primaryProviderId,
      fallbackProviderId: conf.fallbackProviderId,
      failoverStatusCodes: statusCodes,
    };
  }

  /**
   * Performs real, safe connection health probe against a provider
   */
  static async testConnection(options: {
    providerId?: string;
    baseUrl?: string;
    masterApiKey?: string;
    protocol?: string;
  }): Promise<ProviderHealthCheckResult> {
    const startTime = Date.now();
    let url = options.baseUrl;
    let key = options.masterApiKey;
    let proto = options.protocol || 'anthropic';
    let providerId = options.providerId;

    if (providerId) {
      const p = await prisma.vendorProvider.findUnique({ where: { id: providerId } });
      if (p) {
        if (!url) url = p.baseUrl;
        if (!key) key = decryptText(p.masterApiKeyEncrypted);
        if (!options.protocol) proto = p.protocol || p.providerType;
      }
    }

    if (!url) url = 'https://api.anthropic.com';
    url = url.replace(/\/$/, '');

    // 1. SSRF Safety check
    const ssrf = validateVendorBaseUrl(url);
    if (!ssrf.safe) {
      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { healthStatus: 'offline', status: 'ssrf_blocked', lastTestedAt: new Date(), lastError: ssrf.error },
        });
      }
      return {
        ok: false,
        status: 'ssrf_blocked',
        latencyMs: Date.now() - startTime,
        message: ssrf.error || 'Blocked by SSRF Policy.',
        checkedAt: new Date().toISOString(),
      };
    }

    if (!key) {
      return {
        ok: false,
        status: 'invalid_credential',
        latencyMs: 0,
        message: 'No Master API credential provided.',
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let res: Response;

      if (proto === 'openai-compatible' || proto === 'openai') {
        const probeUrl = url.endsWith('/models') ? url : url.endsWith('/v1') ? `${url}/models` : `${url}/v1/models`;
        try {
          res = await fetch(probeUrl, {
            method: 'GET',
            headers: {
              'authorization': `Bearer ${key}`,
            },
            signal: controller.signal,
          });
        } catch {
          // Fallback to chat completions probe
          const chatUrl = url.endsWith('/chat/completions') ? url : `${url}/chat/completions`;
          res = await fetch(chatUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'ping' }],
            }),
            signal: controller.signal,
          });
        }
      } else {
        const cleanUrl = url.replace(/\/+$/, '');
        const probeUrl = cleanUrl.endsWith('/messages')
          ? cleanUrl
          : cleanUrl.endsWith('/v1')
            ? `${cleanUrl}/messages`
            : `${cleanUrl}/v1/messages`;
        res = await fetch(probeUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'authorization': `Bearer ${key}`,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'ping' }],
          }),
          signal: controller.signal,
        });
      }

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (res.ok || res.status === 200) {
        if (providerId) {
          await prisma.vendorProvider.update({
            where: { id: providerId },
            data: { healthStatus: 'online', status: 'connected', lastTestedAt: new Date(), lastError: null },
          });
        }
        return {
          ok: true,
          status: 'online',
          latencyMs,
          message: `Connected successfully (${latencyMs}ms)`,
          checkedAt: new Date().toISOString(),
        };
      } else if (res.status === 401 || res.status === 403) {
        if (providerId) {
          await prisma.vendorProvider.update({
            where: { id: providerId },
            data: { healthStatus: 'offline', status: 'invalid_credential', lastTestedAt: new Date(), lastError: `HTTP ${res.status} Authentication Failed` },
          });
        }
        return {
          ok: false,
          status: 'invalid_credential',
          latencyMs,
          message: `HTTP ${res.status}: Master API key rejected by upstream provider.`,
          checkedAt: new Date().toISOString(),
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${res.status} upstream status`;
        if (providerId) {
          await prisma.vendorProvider.update({
            where: { id: providerId },
            data: { healthStatus: 'degraded', lastTestedAt: new Date(), lastError: errMsg },
          });
        }
        return {
          ok: false,
          status: 'degraded',
          latencyMs,
          message: errMsg,
          checkedAt: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = err.name === 'AbortError';
      const status = isTimeout ? 'degraded' : 'offline';
      const msg = isTimeout ? 'Connection timed out after 12s' : (err.message || 'Network error');

      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { healthStatus: status, status: isTimeout ? 'timeout' : 'provider_error', lastTestedAt: new Date(), lastError: msg },
        });
      }

      return {
        ok: false,
        status,
        latencyMs,
        message: msg,
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

// Backwards compatibility wrappers
export function resolveVendorModel(vendor: VendorProviderRecord | null, internalModel: string): string {
  if (!vendor) return mapToUpstreamModel(internalModel);
  const adapter = ProviderRegistry.createAdapterInstance(vendor);
  return adapter.resolveModel(internalModel);
}

export function buildProviderRequest(
  vendor: VendorProviderRecord | null,
  decryptedMasterKey: string,
  internalModel: string,
  payload: any,
  billingType?: string
): PreparedProviderRequest {
  if (!vendor) {
    const dummy: VendorProviderRecord = {
      id: 'default',
      name: 'Default',
      providerType: 'anthropic',
      protocol: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      masterApiKeyEncrypted: '',
      status: 'connected',
      isPrimary: true,
    };
    return new OpusMaxProviderAdapter(dummy).buildRequest(decryptedMasterKey, internalModel, payload);
  }
  const adapter = ProviderRegistry.createAdapterInstance(vendor);
  return (adapter as any).buildRequest(decryptedMasterKey, internalModel, payload, billingType);
}

export function normalizeProviderResponse(
  protocol: string,
  statusCode: number,
  responseJson: any,
  fallbackInputTokens: number,
  fallbackOutputTokens: number
): NormalizedProviderResponse {
  const dummy: VendorProviderRecord = {
    id: 'default',
    name: 'Default',
    providerType: protocol,
    protocol,
    baseUrl: 'https://api.anthropic.com',
    masterApiKeyEncrypted: '',
    status: 'connected',
    isPrimary: true,
  };
  const adapter = new OpusMaxProviderAdapter(dummy);
  return adapter.normalizeResponse(statusCode, responseJson, fallbackInputTokens, fallbackOutputTokens);
}
