import { prisma } from '../db';
import { safeDiscoveryFetch } from './SafeDiscoveryClient';
import {
  ProviderAdapter,
  DiscoveredCapacity,
  RateLimitMetadata,
  UsageExtractionResult,
} from './types';

export class LotusAiAdapter implements ProviderAdapter {
  id = 'lotusai';
  protocol = 'openai-compatible';
  supportsOfficialQuotaApi = true;
  supportsRateLimitHeaders = true;

  /**
   * Official LotusAI upstream API base URL
   */
  getBaseUrl(provider?: any): string {
    const raw = provider?.baseUrl || 'https://api.lotusai.pro/v1';
    return String(raw).replace(/\/+$/, '');
  }

  /**
   * Build the models discovery URL
   */
  buildModelsUrl(provider?: any): string {
    const base = this.getBaseUrl(provider);
    return base.endsWith('/models')
      ? base
      : base.endsWith('/v1')
        ? `${base}/models`
        : `${base}/v1/models`;
  }

  /**
   * Discovers capacity for LotusAI using official key-status or /v1/models probe
   */
  async discoverCapacity(provider: any, decryptedMasterKey: string): Promise<DiscoveredCapacity> {
    const now = new Date();
    const windowHours = provider.windowHours || 5;
    const windowMs = windowHours * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - windowMs);

    let rateLimitsFromProbe: RateLimitMetadata | null = null;
    let quotaFromApi: { limit?: number; consumed?: number; remaining?: number; resetAt?: Date; resetSeconds?: number } | null = null;
    let probeError: string | null = null;

    // 1. Probe official /api/key-status endpoint if master key is available
    if (decryptedMasterKey && decryptedMasterKey.startsWith('sk-lotus-')) {
      try {
        const keyStatusUrl = `https://api.lotusai.pro/api/key-status?key=${encodeURIComponent(decryptedMasterKey)}`;
        const res = await safeDiscoveryFetch(keyStatusUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${decryptedMasterKey}`,
            Accept: 'application/json',
          },
          timeoutMs: 6000,
        });

        if (res.statusCode === 200) {
          const body = res.json();
          if (body && body.status !== 'error') {
            const limit = Number(body.allowanceTokens || body.limitTokens || body.quota || 0) || null;
            const consumed = Number(body.tokensUsed || body.consumedTokens || body.used || 0) || null;
            const remaining = limit !== null && consumed !== null ? Math.max(0, limit - consumed) : null;
            const resetSec = Number(body.resetSeconds || body.resetInSeconds || 0) || null;
            const resetAt = resetSec ? new Date(now.getTime() + resetSec * 1000) : null;

            quotaFromApi = {
              limit: limit || undefined,
              consumed: consumed || undefined,
              remaining: remaining || undefined,
              resetSeconds: resetSec || undefined,
              resetAt: resetAt || undefined,
            };
          }
        }
      } catch (err: any) {
        // Fall back to /v1/models probe
      }
    }

    // 2. Fallback probe to /v1/models
    if (!quotaFromApi) {
      try {
        const modelsUrl = this.buildModelsUrl(provider);
        const probeRes = await safeDiscoveryFetch(modelsUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${decryptedMasterKey}`,
          },
          timeoutMs: 5000,
        });

        rateLimitsFromProbe = this.extractRateLimits(probeRes.headers);

        if (probeRes.statusCode !== 200) {
          if (probeRes.statusCode === 401) {
            probeError = 'Authentication failed: Invalid LotusAI upstream API key.';
          } else if (probeRes.statusCode === 429) {
            probeError = 'Rate limited by LotusAI upstream.';
          } else {
            probeError = `HTTP ${probeRes.statusCode} from LotusAI /v1/models.`;
          }
        }
      } catch (err: any) {
        probeError = err.message || 'Failed to connect to LotusAI /v1/models.';
      }
    }

    // 3. Local database consumption tracking in 5-hour rolling window
    const windowUsage = await prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        providerId: provider.id,
        createdAt: { gte: windowStart },
      },
    });
    const consumedInWindow = Number(windowUsage._sum.totalTokens || 0);

    const configuredAllowance = Number(provider.windowAllowance || provider.configuredLimitTokens || 25000000n);

    const limitTokens = quotaFromApi?.limit ?? rateLimitsFromProbe?.limitTokens ?? configuredAllowance;
    const consumedTokens = quotaFromApi?.consumed ?? consumedInWindow;
    const remainingTokens = quotaFromApi?.remaining ?? rateLimitsFromProbe?.remainingTokens ?? Math.max(0, limitTokens - consumedTokens);
    const resetAt = quotaFromApi?.resetAt ?? rateLimitsFromProbe?.resetAt ?? new Date(now.getTime() + windowMs);
    const resetSeconds = quotaFromApi?.resetSeconds ?? (resetAt ? Math.max(0, Math.round((resetAt.getTime() - now.getTime()) / 1000)) : windowHours * 3600);

    const source = quotaFromApi
      ? 'OFFICIAL_QUOTA_API'
      : rateLimitsFromProbe
        ? 'RATE_LIMIT_HEADERS'
        : 'LOCALLY_TRACKED';

    const status = probeError
      ? 'UNAVAILABLE'
      : quotaFromApi
        ? 'VERIFIED'
        : 'LOCALLY_TRACKED';

    const confidence = quotaFromApi
      ? 'HIGH'
      : rateLimitsFromProbe
        ? 'MEDIUM'
        : 'LOW';

    return {
      limitTokens,
      consumedTokens,
      remainingTokens,
      resetAt,
      resetSeconds,
      source,
      status,
      confidence,
      lastDiscoveredAt: now,
      error: probeError,
      metadata: {
        providerSlug: 'lotusai',
        protocol: 'openai-compatible',
        supportedApis: ['chat/completions', 'responses', 'models', 'key-status'],
        windowHours,
        consumedInWindow,
      },
    };
  }

  /**
   * Extract rate limit metadata from HTTP response headers
   */
  extractRateLimits(headers: Headers | Record<string, string | string[] | undefined>): RateLimitMetadata | null {
    const getHeader = (name: string): string | undefined => {
      if (!headers) return undefined;
      if (typeof (headers as any).get === 'function') {
        return (headers as Headers).get(name) || undefined;
      }
      const record = headers as Record<string, string | string[] | undefined>;
      const val = record[name.toLowerCase()] || record[name];
      if (Array.isArray(val)) return val[0];
      return val;
    };

    const limitTokens = getHeader('x-ratelimit-limit-tokens');
    const remainingTokens = getHeader('x-ratelimit-remaining-tokens');
    const resetTokens = getHeader('x-ratelimit-reset-tokens');
    const limitRequests = getHeader('x-ratelimit-limit-requests');
    const remainingRequests = getHeader('x-ratelimit-remaining-requests');

    if (!limitTokens && !remainingTokens && !limitRequests) {
      return null;
    }

    let resetAt: Date | undefined;
    if (resetTokens) {
      const match = resetTokens.match(/(\d+(\.\d+)?)(ms|s|m|h)/);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[3];
        let ms = val;
        if (unit === 's') ms *= 1000;
        else if (unit === 'm') ms *= 60000;
        else if (unit === 'h') ms *= 3600000;
        resetAt = new Date(Date.now() + ms);
      }
    }

    return {
      limitTokens: limitTokens ? parseInt(limitTokens, 10) : undefined,
      remainingTokens: remainingTokens ? parseInt(remainingTokens, 10) : undefined,
      resetAt,
      limitRequests: limitRequests ? parseInt(limitRequests, 10) : undefined,
      remainingRequests: remainingRequests ? parseInt(remainingRequests, 10) : undefined,
    };
  }

  /**
   * Extract token usage from LotusAI completion or responses API response body
   */
  extractUsage(responseBody: any, defaultModel?: string): UsageExtractionResult {
    if (!responseBody || typeof responseBody !== 'object') {
      return {
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        reasoningTokens: 0,
        totalTokens: 0,
        isEstimated: true,
        usageSource: 'SIMULATED_ESTIMATE',
      };
    }

    const usage = responseBody.usage || {};
    const promptTokens = Number(usage.prompt_tokens || usage.input_tokens || 0);
    const completionTokens = Number(usage.completion_tokens || usage.output_tokens || 0);
    const totalTokens = Number(usage.total_tokens || promptTokens + completionTokens || 0);

    const cachedTokens = Number(
      usage.prompt_tokens_details?.cached_tokens ||
      usage.input_tokens_details?.cached_tokens ||
      0
    );

    const reasoningTokens = Number(
      usage.completion_tokens_details?.reasoning_tokens ||
      usage.output_tokens_details?.reasoning_tokens ||
      0
    );

    if (promptTokens > 0 || completionTokens > 0) {
      return {
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        cachedTokens,
        reasoningTokens,
        totalTokens,
        isEstimated: false,
        usageSource: 'PROVIDER_REPORTED',
      };
    }

    return {
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      isEstimated: true,
      usageSource: 'LOCAL_CALCULATED',
    };
  }

  /**
   * Extract streaming usage from an SSE chunk
   */
  extractStreamUsage(sseChunk: string): Partial<UsageExtractionResult> | null {
    if (!sseChunk || !sseChunk.includes('usage')) return null;

    try {
      const lines = sseChunk.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:') && !trimmed.includes('[DONE]')) {
          const jsonStr = trimmed.slice(5).trim();
          const parsed = JSON.parse(jsonStr);
          if (parsed.usage) {
            return {
              inputTokens: Number(parsed.usage.prompt_tokens || parsed.usage.input_tokens || 0),
              outputTokens: Number(parsed.usage.completion_tokens || parsed.usage.output_tokens || 0),
              totalTokens: Number(parsed.usage.total_tokens || 0),
              cachedTokens: Number(parsed.usage.prompt_tokens_details?.cached_tokens || 0),
              reasoningTokens: Number(parsed.usage.completion_tokens_details?.reasoning_tokens || 0),
              isEstimated: false,
              usageSource: 'PROVIDER_REPORTED',
            };
          }
        }
      }
    } catch {
      // Chunk does not contain complete JSON usage
    }

    return null;
  }
}
