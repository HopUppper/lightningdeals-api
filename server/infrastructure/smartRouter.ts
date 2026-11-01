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

/**
 * Determines adaptive timeout in milliseconds based on model modality and family
 */
export function determineAdaptiveTimeoutMs(model: string, isStreaming = false, hasThinking = false): number {
  const m = (model || '').toLowerCase();

  // Thinking/Reasoning models require extended timeouts
  if (hasThinking || m.includes('thinking') || m.includes('o1') || m.includes('o3') || m.includes('r1')) {
    return 180000; // 3 minutes
  }

  // Large frontier models on streaming
  if (isStreaming && (m.includes('opus') || m.includes('sonnet') || m.includes('argon'))) {
    return 120000; // 2 minutes
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

  // 1. Central Model Registry Validation
  let modelRecord = params.modelRecord;
  const norm = requestedModel.toLowerCase().trim();
  const canonical = canonicalizeModelId(norm);

  if (!modelRecord) {
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
    } catch (e) {}
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
  const modelFamily = modelRecord?.family || detectModelFamily(requestedModel);

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
      const isAllowed = allowedFamilies.some(f => f.toLowerCase() === modelFamily.toLowerCase() || (f.toLowerCase() === 'local' && isLocalModelFamily(canonicalModelId)));
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

  // 3. Resolve Target Provider
  let targetProviderSlug = modelRecord?.providerSlug;
  let targetProvider: any = null;

  if (modelRecord?.providerId) {
    targetProvider = await prisma.vendorProvider.findUnique({ where: { id: modelRecord.providerId } });
  }
  if (!targetProvider && targetProviderSlug) {
    targetProvider = await prisma.vendorProvider.findFirst({
      where: {
        OR: [{ slug: targetProviderSlug }, { name: { contains: targetProviderSlug, mode: 'insensitive' } }],
        status: { not: 'disabled' },
      },
    });
  }
  if (!targetProvider && keyRecord?.providerId) {
    targetProvider = await prisma.vendorProvider.findUnique({ where: { id: keyRecord.providerId } });
  }
  if (!targetProvider) {
    targetProvider = await prisma.vendorProvider.findFirst({
      where: { isPrimary: true, status: { not: 'disabled' } },
    });
  }
  if (!targetProvider) {
    targetProvider = await prisma.vendorProvider.findFirst({
      where: { OR: [{ slug: 'opus_max' }, { name: { contains: 'Opus', mode: 'insensitive' } }], status: { not: 'disabled' } },
    });
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
    protocol: (modelRecord?.protocol as any) || (modelRecord?.family === 'claude' ? 'anthropic' : 'openai-compatible'),
    timeoutMs,
    breakerKey,
    circuitState: breakerCheck.state,
    isSubstituted: false, // Default: Exact model routing
  };
}
