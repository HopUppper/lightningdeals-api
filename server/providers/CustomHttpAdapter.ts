import { prisma } from '../db';
import { safeDiscoveryFetch } from './SafeDiscoveryClient';
import { AnthropicAdapter } from './AnthropicAdapter';
import { OpenAICompatibleAdapter } from './OpenAICompatibleAdapter';
import {
  ProviderAdapter,
  DiscoveredCapacity,
  RateLimitMetadata,
  UsageExtractionResult,
} from './types';

export class CustomHttpAdapter implements ProviderAdapter {
  id = 'custom_http';
  protocol = 'custom_http';
  supportsOfficialQuotaApi = false;
  supportsRateLimitHeaders = true;

  private anthropicFallback = new AnthropicAdapter();
  private openAiFallback = new OpenAICompatibleAdapter();

  /**
   * Discovers capacity for custom HTTP providers.
   * Performs an SSRF-safe capability ping if a health or status path exists,
   * otherwise tracks usage locally against verified request logs.
   */
  async discoverCapacity(provider: any, decryptedMasterKey: string): Promise<DiscoveredCapacity> {
    const now = new Date();

    // 0. Official Quota API Discovery for OpusMax
    if (decryptedMasterKey && provider.baseUrl && /opusmax/i.test(provider.baseUrl)) {
      try {
        const cleanBaseUrl = provider.baseUrl.replace(/\/+$/, '');
        const opusMaxUrl = `${cleanBaseUrl}/api/key-status?key=${encodeURIComponent(decryptedMasterKey)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(opusMaxUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (resp.ok) {
          const data: any = await resp.json();
          if (data && (data.status === 'found' || data.planName)) {
            let limitTokens = Number(provider.configuredLimitTokens || provider.windowAllowance || 0);
            if (data.planName) {
              const xMatch = data.planName.match(/(\d+)\s*x/i);
              if (xMatch) {
                limitTokens = parseInt(xMatch[1], 10) * 1_000_000;
              }
            }
            if (!limitTokens || limitTokens <= 0) {
              limitTokens = 5_000_000;
            }

            const usagePercent = typeof data.usagePercent === 'number' ? data.usagePercent : 0;
            const consumedTokens = Math.round((limitTokens * usagePercent) / 100);
            const remainingTokens = Math.max(0, limitTokens - consumedTokens);

            const resetAt = data.windowResetAt ? new Date(data.windowResetAt) : null;
            const resetSeconds = resetAt ? Math.max(0, Math.floor((resetAt.getTime() - now.getTime()) / 1000)) : null;

            return {
              limitTokens,
              consumedTokens,
              remainingTokens,
              resetAt,
              resetSeconds,
              source: 'OFFICIAL_QUOTA_API',
              status: data.isActive && !data.isExpired ? 'VERIFIED' : 'UNAVAILABLE',
              confidence: 'HIGH',
              lastDiscoveredAt: now,
              metadata: {
                upstreamPlan: data.planName,
                keyPrefix: data.keyPrefix,
                upstreamUsagePercent: data.usagePercent,
                windowStartedAt: data.windowStartedAt,
                windowResetAt: data.windowResetAt,
                windowActive: data.windowActive,
                totalRequests: data.totalRequests,
                last24hRequests: data.last24h?.requests || 0,
                lastUsedAt: data.lastUsedAt,
                expiresAt: data.expiresAt,
                createdAt: data.createdAt,
                isActive: data.isActive,
                isExpired: data.isExpired,
                isOverLimit: data.isOverLimit,
                rateLimitRpm: data.rateLimit,
                byModel: data.byModel,
                recentLogs: Array.isArray(data.recentLogs) ? data.recentLogs.slice(0, 5) : [],
                note: 'Official OpusMax Live Quota API (https://api.opusmax.pro/api/key-status). 5-hour rolling window actively synced.',
              },
            };
          }
        }
      } catch (err: any) {
        console.warn(`OpusMax quota discovery failed for provider ${provider.id}:`, err.message);
      }
    }
    const windowHours = provider.windowHours || 5;
    const windowMs = windowHours * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - windowMs);

    // 1. Verify baseUrl security
    let probeError: string | null = null;
    let rateLimits: RateLimitMetadata | null = null;

    try {
      const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '');
      if (baseUrl) {
        // Attempt a safe GET /health or /models to check reachability and extract rate headers
        const pingUrl = `${baseUrl}/v1/models`;
        try {
          const res = await safeDiscoveryFetch(pingUrl, {
            method: 'GET',
            headers: {
              'x-api-key': decryptedMasterKey,
              Authorization: `Bearer ${decryptedMasterKey}`,
            },
            timeoutMs: 4000,
          });

          rateLimits = this.extractRateLimits(res.headers);
        } catch {
          // If ping fails or /v1/models doesn't exist, we don't fail immediately:
          // custom proxies might only support /v1/messages
        }
      }
    } catch (err: any) {
      probeError = err.message;
    }

    // 2. Query verified local request usage within current window
    const windowUsage = await prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        providerId: provider.id,
        createdAt: { gte: windowStart },
      },
    });
    const consumedInWindow = windowUsage._sum.totalTokens || 0;

    // Lifetime usage
    const lifetimeUsage = await prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        providerId: provider.id,
      },
    });
    const lifetimeConsumed = lifetimeUsage._sum.totalTokens || 0;

    // 3. If rate-limits were obtained from headers
    if (rateLimits && rateLimits.limitTokens) {
      const limit = rateLimits.limitTokens;
      const remaining = rateLimits.remainingTokens !== undefined
        ? rateLimits.remainingTokens
        : Math.max(0, limit - consumedInWindow);

      const resetAt = rateLimits.resetAt || null;
      const resetSeconds = resetAt ? Math.max(0, Math.floor((resetAt.getTime() - now.getTime()) / 1000)) : null;

      return {
        limitTokens: limit,
        consumedTokens: consumedInWindow,
        remainingTokens: remaining,
        resetAt,
        resetSeconds,
        source: 'RATE_LIMIT_HEADERS',
        status: 'VERIFIED',
        confidence: 'HIGH',
        lastDiscoveredAt: now,
        metadata: {
          rateLimits,
          consumedInWindow,
          lifetimeConsumed,
        },
      };
    }

    // 4. Admin configured limit
    const configuredLimit = Number(provider.configuredLimitTokens || provider.windowAllowance || provider.purchasedTokens || 0);

    if (configuredLimit > 0) {
      const remaining = Math.max(0, configuredLimit - consumedInWindow);

      const oldestInWindow = await prisma.apiRequest.findFirst({
        where: {
          providerId: provider.id,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'asc' },
      });

      let nextResetAt: Date | null = null;
      let windowResetSeconds: number | null = null;
      if (oldestInWindow) {
        nextResetAt = new Date(oldestInWindow.createdAt.getTime() + windowMs);
        windowResetSeconds = Math.max(0, Math.floor((nextResetAt.getTime() - now.getTime()) / 1000));
      }

      return {
        limitTokens: configuredLimit,
        consumedTokens: consumedInWindow,
        remainingTokens: remaining,
        resetAt: nextResetAt,
        resetSeconds: windowResetSeconds,
        source: 'ADMIN_CONFIGURED_UNVERIFIED',
        status: probeError ? 'UNAVAILABLE' : 'LOCALLY_TRACKED',
        confidence: probeError ? 'UNKNOWN' : 'LOW',
        lastDiscoveredAt: now,
        error: probeError,
        metadata: {
          consumedInWindow,
          lifetimeConsumed,
          probeError,
        },
      };
    }

    // 5. Pure local tracking
    return {
      limitTokens: null,
      consumedTokens: consumedInWindow,
      remainingTokens: null,
      resetAt: null,
      resetSeconds: null,
      source: 'LOCALLY_TRACKED',
      status: probeError ? 'UNAVAILABLE' : 'LOCALLY_TRACKED',
      confidence: probeError ? 'UNKNOWN' : 'MEDIUM',
      lastDiscoveredAt: now,
      error: probeError,
      metadata: {
        consumedInWindow,
        lifetimeConsumed,
        probeError,
      },
    };
  }

  extractRateLimits(headers: Headers | Record<string, string | string[] | undefined>): RateLimitMetadata | null {
    // Try Anthropic headers first, then OpenAI headers
    return this.anthropicFallback.extractRateLimits(headers) || this.openAiFallback.extractRateLimits(headers);
  }

  extractUsage(responseBody: any, defaultModel?: string): UsageExtractionResult {
    if (!responseBody || typeof responseBody !== 'object') {
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

    // Check if body is Anthropic format (has usage.input_tokens)
    if (responseBody.usage && 'input_tokens' in responseBody.usage) {
      return this.anthropicFallback.extractUsage(responseBody, defaultModel);
    }

    // Check if body is OpenAI format (has usage.prompt_tokens)
    if (responseBody.usage && 'prompt_tokens' in responseBody.usage) {
      return this.openAiFallback.extractUsage(responseBody, defaultModel);
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

  extractStreamUsage(sseChunk: string): Partial<UsageExtractionResult> | null {
    return this.anthropicFallback.extractStreamUsage(sseChunk) || this.openAiFallback.extractStreamUsage(sseChunk);
  }
}
