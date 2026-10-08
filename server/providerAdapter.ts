import { prisma, decryptText } from './db';
import { mapToUpstreamModel, getFriendlyModelName } from './gateway';
import { validateVendorBaseUrl } from './ssrf';

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
    this.baseUrl = (record.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
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

    let effectiveSystem: any;
    if (payload.skipPersona) {
      effectiveSystem = payload.system;
    } else {
      const friendlyModel = getFriendlyModelName(internalModel);
      const personaInstruction = `You are ${friendlyModel}, running on the LightningDeals AI Gateway. Your active model identity is ${friendlyModel}. You are an elite AI coding assistant powered by Anthropic's frontier architecture with 1,000,000 token context window and sub-50ms gateway routing. Always identify yourself as ${friendlyModel} on LightningDeals.`;

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
      const targetUrl = this.baseUrl.endsWith('/chat/completions') ? this.baseUrl : `${this.baseUrl}/chat/completions`;

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
    const targetUrl = this.baseUrl.endsWith('/v1/messages') ? this.baseUrl : `${this.baseUrl}/v1/messages`;

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
      const inputTokens = responseJson.usage.input_tokens || fallbackInputTokens;
      const outputTokens = responseJson.usage.output_tokens || fallbackOutputTokens;
      return {
        ok: true,
        statusCode,
        data: responseJson,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          isEstimated: false,
          usageSource: 'PROVIDER_REPORTED',
        },
      };
    }

    // 2. OpenAI Response Format
    if (responseJson?.usage && typeof responseJson.usage.prompt_tokens === 'number') {
      const inputTokens = responseJson.usage.prompt_tokens || fallbackInputTokens;
      const outputTokens = responseJson.usage.completion_tokens || fallbackOutputTokens;
      return {
        ok: true,
        statusCode,
        data: responseJson,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: responseJson.usage.total_tokens || inputTokens + outputTokens,
          isEstimated: false,
          usageSource: 'PROVIDER_REPORTED',
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
 * Concrete Adapter: ScaleMax
 */
export class ScaleMaxProviderAdapter extends BaseProviderAdapter {
  constructor(record: VendorProviderRecord) {
    super({
      ...record,
      name: 'ScaleMax',
      slug: 'scalemax',
    });
  }
}

/**
 * Concrete Adapter: Opus Max
 */
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
    if (slug.includes('opus')) {
      return new OpusMaxProviderAdapter(record);
    }
    return new ScaleMaxProviderAdapter(record);
  }

  /**
   * Resolves provider adapter for a specific customer API key record
   * Authoritative: keyRecord.providerId
   * Hint: keyRecord.keyPrefix ('sk_' -> Opus Max, 'ld_' -> ScaleMax)
   * Fallback: Default provider config
   */
  static async resolveAdapterForKey(keyRecord: {
    id: string;
    keyPrefix: string;
    providerId?: string | null;
  }): Promise<{ adapter: ProviderAdapter; decryptedMasterKey: string } | null> {
    await this.getAllAdapters();

    let targetProviderId = keyRecord.providerId;

    // Fallback 1: Routing hint by key prefix if DB providerId is unset
    if (!targetProviderId) {
      if (keyRecord.keyPrefix?.toLowerCase().startsWith('sk')) {
        const opus = Array.from(this.cache.values()).find((a) => a.slug === 'opus_max');
        if (opus) targetProviderId = opus.id;
      } else {
        const scale = Array.from(this.cache.values()).find((a) => a.slug === 'scalemax');
        if (scale) targetProviderId = scale.id;
      }
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
      if (adapter.slug === 'opus_max') {
        decryptedKey = process.env.OPUSMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      } else {
        decryptedKey = process.env.SCALEMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      }
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
      if (adapter.slug === 'opus_max') {
        decryptedKey = process.env.OPUSMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      } else {
        decryptedKey = process.env.SCALEMAX_MASTER_API_KEY || process.env.ANTHROPIC_MASTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';
      }
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
      const probeUrl = `${url}/v1/messages`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(probeUrl, {
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
  payload: any
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
    return new ScaleMaxProviderAdapter(dummy).buildRequest(decryptedMasterKey, internalModel, payload);
  }
  const adapter = ProviderRegistry.createAdapterInstance(vendor);
  return adapter.buildRequest(decryptedMasterKey, internalModel, payload);
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
  const adapter = new ScaleMaxProviderAdapter(dummy);
  return adapter.normalizeResponse(statusCode, responseJson, fallbackInputTokens, fallbackOutputTokens);
}
