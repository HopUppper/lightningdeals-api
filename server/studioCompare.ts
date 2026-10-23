/**
 * server/studioCompare.ts
 *
 * Side-by-Side Model Comparison Engine for LightningAPI AI Chat Studio.
 *
 * Capabilities:
 * 1. Parallel execution across 2 to 3 authorized models
 * 2. Independent error and timeout handling per model (partial failure tolerance)
 * 3. Authoritative model registry validation
 * 4. Token quota reservation & accounting per model
 * 5. Multi-tenant customer security & rate limiting
 * 6. Preserves verified model identity (no fake models or synthetic answers)
 */

import { MODEL_CAPABILITY_REGISTRY, ModelCapabilityProfile } from './studioCapabilities';
import { prisma, decryptText } from './db';
import { buildProviderRequest } from './providerAdapter';
import { sanitizeErrorMessage, sanitizeModelResponse, getFriendlyModelName } from './gateway';
import { VERIFIED_STUDIO_MODELS } from './studio';
import { isModelAuthorizedForKey } from './studioEntitlement';
import { reserveCustomerQuota, releaseReservation, settleReservation, isRollingPlan } from './accounting/tokenReservation';

export interface ModelComparisonRequest {
  userId: string;
  isPaidCustomer: boolean;
  apiKeyId?: string;
  prompt: string;
  modelIds: string[];
  conversationId?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface SingleModelComparisonResult {
  modelId: string;
  displayName: string;
  provider: string;
  tier: 'trial' | 'paid';
  status: 'success' | 'failed';
  text?: string;
  error?: string;
  latencyMs: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  multiplier: number;
}

export interface ModelComparisonResponse {
  success: boolean;
  prompt: string;
  comparisons: SingleModelComparisonResult[];
  totalTokensBilled: number;
  error?: string;
}

const MAX_COMPARE_MODELS = 3;
const MIN_COMPARE_MODELS = 2;
const COMPARE_TIMEOUT_MS = 25000;

export async function executeModelComparison(
  req: ModelComparisonRequest
): Promise<ModelComparisonResponse> {
  const { userId, isPaidCustomer, apiKeyId, prompt, modelIds, temperature = 0.2, systemPrompt } = req;

  // 1. Validate inputs
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return { success: false, prompt: '', comparisons: [], totalTokensBilled: 0, error: 'Prompt is required for model comparison.' };
  }

  if (!Array.isArray(modelIds) || modelIds.length < MIN_COMPARE_MODELS) {
    return {
      success: false,
      prompt,
      comparisons: [],
      totalTokensBilled: 0,
      error: `Comparison requires at least ${MIN_COMPARE_MODELS} models to evaluate.`,
    };
  }

  // Bound concurrency to max 3
  const targetModelIds = Array.from(new Set(modelIds.map((m) => m.toLowerCase().trim()))).slice(0, MAX_COMPARE_MODELS);

  // 2. Resolve Active API Key for User
  let keyRecord: any = null;
  if (apiKeyId) {
    keyRecord = await prisma.apiKey.findFirst({
      where: { id: apiKeyId, userId, status: 'active' },
      include: { provider: true },
    });
  }
  if (!keyRecord) {
    keyRecord = await prisma.apiKey.findFirst({
      where: { userId, status: 'active', tokensRemaining: { gt: 0n } },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  if (!keyRecord) {
    keyRecord = await prisma.apiKey.findFirst({
      where: { userId, status: 'active' },
      include: { provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!keyRecord) {
    return {
      success: false,
      prompt,
      comparisons: [],
      totalTokensBilled: 0,
      error: 'No active API key found for this account.',
    };
  }

  // 3. Resolve Vendor Provider
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

  const masterKey = vendor?.masterApiKeyEncrypted ? decryptText(vendor.masterApiKeyEncrypted) : '';

  // 4. Reserve quota for comparison (each model call estimated)
  const estPerModel = Math.max(100, Math.ceil(prompt.length / 3.8)) + 512;
  const totalReservation = estPerModel * targetModelIds.length;
  const compareRequestId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const quota = await reserveCustomerQuota({
    apiKeyId: keyRecord.id,
    requestId: compareRequestId,
    estimatedTokens: totalReservation,
  });

  if (!quota.success) {
    return {
      success: false,
      prompt,
      comparisons: [],
      totalTokensBilled: 0,
      error: quota.message || 'Insufficient token balance for parallel model comparison.',
    };
  }

  let totalBilledTokens = 0;

  try {
    // 5. Execute parallel requests with independent error boundaries
    const comparisonPromises = targetModelIds.map(async (modelId): Promise<SingleModelComparisonResult> => {
      const startTime = Date.now();
      const meta = MODEL_CAPABILITY_REGISTRY[modelId] || {
        id: modelId,
        displayName: modelId,
        provider: 'custom',
        tier: 'paid',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        capabilities: {} as any,
      };

      const friendlyName = meta.displayName || getFriendlyModelName(modelId);
      const studioModelMeta = VERIFIED_STUDIO_MODELS.find((m) => m.id === modelId);
      const multiplier = studioModelMeta?.tokenMultiplier || 1.0;

      // Authorization check for this model
      const auth = isModelAuthorizedForKey(modelId, keyRecord, isPaidCustomer);
      if (!auth.allowed) {
        return {
          modelId,
          displayName: friendlyName,
          provider: meta.provider,
          tier: meta.tier,
          status: 'failed',
          error: auth.message || `Model not permitted on this account.`,
          latencyMs: Date.now() - startTime,
          multiplier,
        };
      }

      if (!vendor || !masterKey) {
        return {
          modelId,
          displayName: friendlyName,
          provider: meta.provider,
          tier: meta.tier,
          status: 'failed',
          error: 'AI Gateway credentials not ready for comparison.',
          latencyMs: Date.now() - startTime,
          multiplier,
        };
      }

      // Build non-streaming prompt request
      const payload: any = {
        messages: [{ role: 'user', content: prompt.trim() }],
        max_tokens: Math.min(2048, meta.maxOutputTokens || 2048),
        stream: false,
        temperature,
      };
      if (systemPrompt && systemPrompt.trim()) {
        payload.system = systemPrompt.trim();
      }

      const prep = buildProviderRequest(vendor, masterKey, modelId, payload);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);

      try {
        const resp = await fetch(prep.url, {
          method: 'POST',
          headers: prep.headers,
          body: JSON.stringify(prep.body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          return {
            modelId,
            displayName: friendlyName,
            provider: meta.provider,
            tier: meta.tier,
            status: 'failed',
            error: sanitizeErrorMessage(errText || `HTTP ${resp.status}`),
            latencyMs: Date.now() - startTime,
            multiplier,
          };
        }

        const data: any = await resp.json();
        let extractedText = '';

        if (Array.isArray(data.content)) {
          extractedText = data.content
            .filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('\n');
        } else if (data.choices && data.choices[0]?.message?.content) {
          extractedText = data.choices[0].message.content;
        }

        const cleanText = sanitizeModelResponse(extractedText, friendlyName);
        const inTokens = data.usage?.input_tokens || Math.max(1, Math.ceil(prompt.length / 4));
        const outTokens = data.usage?.output_tokens || Math.max(1, Math.ceil(cleanText.length / 4));
        const modelTotal = inTokens + outTokens;

        totalBilledTokens += Math.ceil(modelTotal * multiplier);

        return {
          modelId,
          displayName: friendlyName,
          provider: meta.provider,
          tier: meta.tier,
          status: 'success',
          text: cleanText,
          latencyMs: Date.now() - startTime,
          usage: {
            inputTokens: inTokens,
            outputTokens: outTokens,
            totalTokens: modelTotal,
          },
          multiplier,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        return {
          modelId,
          displayName: friendlyName,
          provider: meta.provider,
          tier: meta.tier,
          status: 'failed',
          error: sanitizeErrorMessage(err.name === 'AbortError' ? 'Comparison timed out (25s limit).' : err.message),
          latencyMs: Date.now() - startTime,
          multiplier,
        };
      }
    });

    const results = await Promise.all(comparisonPromises);

    // Settle reservation
    await settleReservation(compareRequestId);

    // Update tokens remaining in key
    if (totalBilledTokens > 0) {
      const isRolling = isRollingPlan(keyRecord);
      const billedBigInt = BigInt(totalBilledTokens);
      const remainingAfter = isRolling
        ? keyRecord.tokensRemaining
        : (keyRecord.tokensRemaining > billedBigInt ? keyRecord.tokensRemaining - billedBigInt : 0n);

      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: {
          tokensUsed: { increment: billedBigInt },
          tokensRemaining: remainingAfter,
          totalRequests: { increment: targetModelIds.length },
          lastUsedAt: new Date(),
        },
      }).catch((e) => console.error('[COMPARE KEY UPDATE ERROR]', e));
    }

    return {
      success: true,
      prompt,
      comparisons: results,
      totalTokensBilled: totalBilledTokens,
    };
  } catch (err: any) {
    await releaseReservation(compareRequestId);
    return {
      success: false,
      prompt,
      comparisons: [],
      totalTokensBilled: 0,
      error: sanitizeErrorMessage(err.message || 'Model comparison failed.'),
    };
  }
}
