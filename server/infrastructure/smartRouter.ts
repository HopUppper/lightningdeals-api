import { prisma } from '../db';
import { resolveProviderCredential, isLocalModelFamily } from '../providers/credentialResolver';
import { canonicalizeModelId } from '../models/modelSyncService';
import { detectModelFamily } from '../gateway';
import { isCircuitOpen, buildBreakerKey, CircuitState } from './circuitBreaker';
import { getProviderModelHealth } from './providerHealth';

export interface RouteResolution {
  success: boolean;
  routedProvider?: any;
  effectiveModel?: string;
  originalModel?: string;
  providerSlug?: string;
  billingType?: 'credit' | 'token';
  billingArchitecture?: string;
  protocol?: 'anthropic' | 'openai-compatible' | 'images' | 'videos';
  timeoutMs?: number;
  breakerKey?: string;
  circuitState?: CircuitState;
  isSubstituted?: boolean;
  error?: {
    status: number;
    type: string;
    message: string;
    code?: string;
  };
}

/**
 * Resolves the billing architecture from the API key record
 */
export function resolveBillingArchitecture(keyRecord: any): string {
  if (!keyRecord) return 'claude_openai_credits';

  if (keyRecord.planCategory) {
    return keyRecord.planCategory;
  }

  const bType = keyRecord.billingType;
  if (bType === 'window') {
    const scope = (keyRecord.providerScope || '').toLowerCase();
    const planName = (keyRecord.plan || keyRecord.name || '').toLowerCase();
    if (scope.includes('lotus') || scope.includes('openai') || planName.includes('openai')) {
      return 'openai_max_rolling';
    }
    return 'claude_max_rolling';
  }
  if (bType === 'credit') {
    return 'claude_openai_credits';
  }
  if (bType === 'token') {
    const scope = (keyRecord.providerScope || '').toLowerCase();
    if (scope.includes('openai')) return 'openai_tokens';
    if (scope.includes('local') || scope.includes('open-weights')) return 'local_models_tokens';
    return 'claude_tokens';
  }

  return 'claude_openai_credits';
}

// High-performance in-memory model & provider caching (60s TTL)
interface CachedModelEntry {
  modelRecord: any;
  cachedAt: number;
}
const modelLookupCache = new Map<string, CachedModelEntry>();
const MODEL_CACHE_TTL_MS = 60000;

interface CachedProviderEntry {
  provider: any;
  cachedAt: number;
}
const providerLookupCache = new Map<string, CachedProviderEntry>();
const PROVIDER_CACHE_TTL_MS = 60000;

async function getCachedVendorProvider(query: { slug?: string; id?: string; isPrimary?: boolean }) {
  const cacheKey = query.slug ? `slug:${query.slug}` : query.id ? `id:${query.id}` : 'primary';
  const cached = providerLookupCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < PROVIDER_CACHE_TTL_MS) {
    return cached.provider;
  }

  let provider: any = null;
  if (query.slug) {
    provider = await prisma.vendorProvider.findFirst({
      where: { slug: query.slug, status: { not: 'disabled' } },
    });
  } else if (query.id) {
    provider = await prisma.vendorProvider.findUnique({
      where: { id: query.id },
    });
  } else if (query.isPrimary) {
    provider = await prisma.vendorProvider.findFirst({
      where: { isPrimary: true, status: { not: 'disabled' } },
    });
  }

  if (provider) {
    providerLookupCache.set(cacheKey, { provider, cachedAt: now });
  }
  return provider;
}

/**
 * Determines adaptive timeout in milliseconds based on model modality and family.
 */
export function determineAdaptiveTimeoutMs(model: string, isStreaming = false, hasThinking = false): number {
  const m = (model || '').toLowerCase();

  // Thinking/Reasoning models require extended reasoning budgets
  if (hasThinking || m.includes('thinking') || m.includes('o1') || m.includes('o3') || m.includes('r1')) {
    return 180000; // 3 minutes max for thinking models
  }

  // Large frontier models on streaming
  if (isStreaming) {
    return 120000; // 2 minutes for streaming
  }

  // Standard interactive requests
  return 60000; // 60 seconds
}

/**
 * Central Provider-Aware Routing Engine
 */
export async function resolveIntelligentRoute(params: {
  keyRecord: any;
  requestedModel: string;
  isStreaming?: boolean;
  hasThinking?: boolean;
  modelRecord?: any;
}): Promise<RouteResolution> {
  const { keyRecord, requestedModel, isStreaming = false, hasThinking = false } = params;

  if (!requestedModel || typeof requestedModel !== 'string') {
    return {
      success: false,
      error: {
        status: 400,
        type: 'invalid_request_error',
        message: 'Missing or invalid required field: model.',
      },
    };
  }

  // 1. Central Model Registry Validation (with In-Memory Caching)
  let modelRecord = params.modelRecord;
  const norm = requestedModel.toLowerCase().trim();
  const canonical = canonicalizeModelId(norm);

  if (!modelRecord) {
    const cached = modelLookupCache.get(norm) || modelLookupCache.get(canonical);
    const now = Date.now();
    if (cached && now - cached.cachedAt < MODEL_CACHE_TTL_MS) {
      modelRecord = cached.modelRecord;
    } else {
      try {
        modelRecord = await prisma.model.findFirst({
          where: {
            OR: [
              { modelId: norm },
              { upstreamModelId: norm },
              { modelId: canonical },
              { upstreamModelId: canonical },
              { modelId: requestedModel },
              { upstreamModelId: requestedModel },
              { displayName: { equals: requestedModel, mode: 'insensitive' } },
            ],
          },
        });
        if (modelRecord) {
          modelLookupCache.set(norm, { modelRecord, cachedAt: now });
          modelLookupCache.set(canonical, { modelRecord, cachedAt: now });
        }
      } catch (e) {}
    }
  }

  if (modelRecord) {
    if (modelRecord.validationStatus === 'PENDING_VALIDATION' || modelRecord.validationStatus === 'DISCOVERED') {
      return {
        success: false,
        error: {
          status: 400,
          type: 'invalid_request_error',
          message: `Model '${requestedModel}' is pending administrative capability validation and is not yet active for production traffic.`,
        },
      };
    }
    if (modelRecord.validationStatus === 'DISABLED') {
      return {
        success: false,
        error: {
          status: 400,
          type: 'invalid_request_error',
          message: `Model '${requestedModel}' is currently disabled by administrator.`,
        },
      };
    }
    if (modelRecord.validationStatus === 'REMOVED_UPSTREAM' || modelRecord.validationStatus === 'TEMPORARILY_UNAVAILABLE' || modelRecord.availabilityStatus === 'unavailable') {
      return {
        success: false,
        error: {
          status: 400,
          type: 'invalid_request_error',
          message: `Model '${requestedModel}' has been removed upstream or is temporarily unavailable.`,
        },
      };
    }
    if (modelRecord.enabled === false) {
      return {
        success: false,
        error: {
          status: 400,
          type: 'invalid_request_error',
          message: `Model '${requestedModel}' is currently disabled by administrator.`,
        },
      };
    }
  }

  const canonicalModelId = modelRecord?.modelId || canonical;
  const upstreamModelId = modelRecord?.upstreamModelId || canonicalModelId;

  // 2. Billing Architecture & Entitlement Verification
  const billingArchitecture = resolveBillingArchitecture(keyRecord);
  const rawModelFamily = modelRecord?.family || detectModelFamily(requestedModel);
  const modelFamily = (rawModelFamily.toLowerCase() === 'anthropic' || rawModelFamily.toLowerCase() === 'claude')
    ? 'claude'
    : rawModelFamily.toLowerCase();

  // 2a. Strict Plan-to-Model Family Entitlement Verification
  if (billingArchitecture === 'claude_openai_credits') {
    if (isLocalModelFamily(canonicalModelId) && !['claude', 'openai'].includes(modelFamily)) {
      return {
        success: false,
        error: {
          status: 403,
          type: 'permission_error',
          code: 'model_not_in_credit_plan',
          message: `Model '${requestedModel}' is an open-weights/local model and is not available on API Usage Credits. API Usage Credits support Claude and OpenAI models. To use ${requestedModel}, please activate a Local Models Token Pack.`,
        },
      };
    }
  }

  if (keyRecord?.allowedModelFamilies && keyRecord.allowedModelFamilies !== 'all') {
    let allowedFamilies: string[] = [];
    try {
      allowedFamilies = JSON.parse(keyRecord.allowedModelFamilies);
    } catch {
      allowedFamilies = [keyRecord.allowedModelFamilies];
    }
    if (Array.isArray(allowedFamilies) && allowedFamilies.length > 0 && !allowedFamilies.includes('all')) {
      const isAllowed = allowedFamilies.some(f => {
        const normF = f.toLowerCase();
        if (normF === 'claude' || normF === 'anthropic') {
          return modelFamily === 'claude';
        }
        return normF === modelFamily || (normF === 'local' && isLocalModelFamily(canonicalModelId));
      });
      if (!isAllowed) {
        return {
          success: false,
          error: {
            status: 403,
            type: 'permission_error',
            code: 'model_family_not_allowed',
            message: `Model '${requestedModel}' belongs to the '${modelFamily}' family and is not authorized for this API key. This key is provisioned for: ${allowedFamilies.join(', ')}.`,
          },
        };
      }
    }
  }

  // 3. Resolve Target Provider based on customer key billing architecture
  let targetProvider: any = null;

  // Strict 5-Hour Rolling Plan Isolation:
  // Rolling plan keys (claude_max_rolling / window) strictly only work with OpusMax 5-hour rolling Claude models.
  // If a model is provisioned via ScaleMax or non-rolling providers, reject with 403 Forbidden!
  const isRollingClaudeKey = billingArchitecture === 'claude_max_rolling' || keyRecord?.billingType === 'window';
  if (isRollingClaudeKey && (modelRecord?.providerSlug === 'scalemax' || (modelRecord?.provider && modelRecord.provider.toLowerCase().includes('scalemax')))) {
    return {
      success: false,
      error: {
        status: 403,
        type: 'permission_error',
        code: 'model_not_in_rolling_plan',
        message: `Model '${requestedModel}' is not included in the 5-Hour Rolling Plan. The 5-Hour Rolling Plan key only provides access to 5-Hour Rolling Claude models.`,
      },
    };
  }

  // Strict Billing Architecture Provider Routing:
  // - API Credit keys (claude_openai_credits / credit) route strictly to ScaleMax
  // - Token pack keys (claude_tokens, openai_tokens, local_models_tokens / token) route strictly to ScaleMax
  // - OpenAI Rolling Window keys (openai_max_rolling) route strictly to LotusAI
  // - Claude Rolling Window keys (claude_max_rolling / window) route strictly to OpusMax
  if (billingArchitecture === 'claude_openai_credits' || keyRecord?.billingType === 'credit') {
    targetProvider = await getCachedVendorProvider({ slug: 'scalemax' });
  } else if (
    billingArchitecture === 'openai_tokens' ||
    billingArchitecture === 'claude_tokens' ||
    billingArchitecture === 'local_models_tokens' ||
    keyRecord?.billingType === 'token'
  ) {
    targetProvider = await getCachedVendorProvider({ slug: 'scalemax' });
  } else if (billingArchitecture === 'openai_max_rolling') {
    targetProvider = await getCachedVendorProvider({ slug: 'lotusai' });
  } else if (billingArchitecture === 'claude_max_rolling' || keyRecord?.billingType === 'window') {
    targetProvider = await getCachedVendorProvider({ slug: 'opus_max' });
  }

  // Fallback to key explicit provider, model record provider, or primary vendor
  if (!targetProvider && keyRecord?.providerId) {
    targetProvider = await getCachedVendorProvider({ id: keyRecord.providerId });
  }
  if (!targetProvider && modelRecord?.providerId) {
    targetProvider = await getCachedVendorProvider({ id: modelRecord.providerId });
  }
  if (!targetProvider && modelRecord?.providerSlug) {
    targetProvider = await getCachedVendorProvider({ slug: modelRecord.providerSlug });
  }
  if (!targetProvider) {
    targetProvider = await getCachedVendorProvider({ isPrimary: true });
  }

  if (!targetProvider) {
    return {
      success: false,
      error: {
        status: 503,
        type: 'service_unavailable',
        message: 'No available upstream provider configured for this model route. Please contact LightningAPI support.',
        code: 'NO_PROVIDER_AVAILABLE',
      },
    };
  }

  const effectiveProviderSlug = targetProvider.slug || 'unknown';
  const breakerKey = buildBreakerKey(effectiveProviderSlug, upstreamModelId);

  // 4. Circuit Breaker Check
  const breakerCheck = isCircuitOpen(breakerKey);
  if (breakerCheck.isOpen) {
    return {
      success: false,
      breakerKey,
      circuitState: 'OPEN',
      error: {
        status: 503,
        type: 'service_unavailable',
        message: `Upstream endpoint for model '${requestedModel}' is temporarily paused due to upstream circuit breaker protection. Please retry in ${breakerCheck.retryAfterSeconds || 30}s.`,
        code: 'CIRCUIT_BREAKER_OPEN',
      },
    };
  }

  // 5. Provider Credential Check (Ensures credentials exist without cross-billing leaks)
  const credResolution = resolveProviderCredential(targetProvider, keyRecord, canonicalModelId);
  if (!credResolution.success) {
    const err = credResolution.failure.error;
    return {
      success: false,
      error: err,
    };
  }

  // 6. Adaptive Timeout Calculation
  const timeoutMs = determineAdaptiveTimeoutMs(canonicalModelId, isStreaming, hasThinking);

  return {
    success: true,
    routedProvider: targetProvider,
    effectiveModel: upstreamModelId,
    originalModel: requestedModel,
    providerSlug: effectiveProviderSlug,
    billingType: credResolution.credential.billingType,
    billingArchitecture,
    protocol: targetProvider.slug === 'scalemax'
      ? (targetProvider.protocol || 'openai-compatible')
      : ((modelRecord?.protocol as any) || (modelFamily === 'claude' ? 'anthropic' : 'openai-compatible')),
    timeoutMs,
    breakerKey,
    circuitState: breakerCheck.state,
    isSubstituted: false, // Default: Exact model routing
  };
}
