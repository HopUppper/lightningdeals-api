import { prisma } from '../db';
import {
  ProviderAdapter,
  DiscoveredCapacity,
  RateLimitMetadata,
  UsageExtractionResult,
} from './types';

export class AnthropicAdapter implements ProviderAdapter {
  id = 'anthropic';
  protocol = 'anthropic';
  supportsOfficialQuotaApi = false; // Anthropic does not have a public /v1/credits endpoint
  supportsRateLimitHeaders = true;

  /**
   * Discovers capacity for an Anthropic provider.
   * Priority:
   * 1. Recent rate-limit headers recorded from live API traffic.
   * 2. Local accounting based on verified request logs.
   * 3. Admin-configured limit, clearly labeled as ADMIN_CONFIGURED_UNVERIFIED.
   * Never guesses or probes random non-existent endpoints.
   */
  async discoverCapacity(provider: any, _decryptedMasterKey: string): Promise<DiscoveredCapacity> {
    const now = new Date();
    const windowHours = provider.windowHours || 5;
    const windowMs = windowHours * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - windowMs);

    // 1. Check for recent rate-limit headers in metadata
    let storedRateLimits: RateLimitMetadata | null = null;
    if (provider.discoveryDetailsJson) {
      try {
        const parsed = JSON.parse(provider.discoveryDetailsJson);
        if (parsed.rateLimits && parsed.rateLimitsTimestamp) {
          const ageMs = now.getTime() - new Date(parsed.rateLimitsTimestamp).getTime();
          // Consider rate limits valid if recorded within the last 15 minutes
          if (ageMs <= 15 * 60 * 1000) {
            storedRateLimits = parsed.rateLimits;
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
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

    // Query lifetime usage
    const lifetimeUsage = await prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        providerId: provider.id,
      },
    });
    const lifetimeConsumed = lifetimeUsage._sum.totalTokens || 0;

    // 3. Determine limit and remaining tokens
    if (storedRateLimits && storedRateLimits.limitTokens) {
      const limit = storedRateLimits.limitTokens;
      const remaining = storedRateLimits.remainingTokens !== undefined
        ? storedRateLimits.remainingTokens
        : Math.max(0, limit - consumedInWindow);

      const resetAt = storedRateLimits.resetAt || null;
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
          rateLimits: storedRateLimits,
          rateLimitsTimestamp: now.toISOString(),
          lifetimeConsumed,
        },
      };
    }

    // 4. Admin configured limit
    const configuredLimit = Number(provider.configuredLimitTokens || provider.windowAllowance || provider.purchasedTokens || 0);

    if (configuredLimit > 0) {
      const remaining = Math.max(0, configuredLimit - consumedInWindow);

      // Find oldest request in window for roll-off
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
        status: 'LOCALLY_TRACKED',
        confidence: 'LOW',
        lastDiscoveredAt: now,
        metadata: {
          windowHours,
          consumedInWindow,
          lifetimeConsumed,
          note: 'Anthropic does not offer a public balance API; capacity is tracked locally against admin-configured quota.',
        },
      };
    }

    // 5. No configured limit and no headers: locally tracked pure consumption
    return {
      limitTokens: null,
      consumedTokens: consumedInWindow,
      remainingTokens: null,
      resetAt: null,
      resetSeconds: null,
      source: 'LOCALLY_TRACKED',
      status: 'LOCALLY_TRACKED',
      confidence: 'MEDIUM',
      lastDiscoveredAt: now,
      metadata: {
        consumedInWindow,
        lifetimeConsumed,
        note: 'Locally tracked requests. No upstream limit configured or discovered yet.',
      },
    };
  }

  /**
   * Extracts Anthropic rate-limit headers from response.
   */
  extractRateLimits(headers: Headers | Record<string, string | string[] | undefined>): RateLimitMetadata | null {
    const getHeader = (name: string): string | undefined => {
      if (headers instanceof Headers) {
        return headers.get(name) || undefined;
      }
      const val = headers[name] || headers[name.toLowerCase()];
      return Array.isArray(val) ? val[0] : val;
    };

    const limitStr = getHeader('anthropic-ratelimit-tokens-limit');
    const remainingStr = getHeader('anthropic-ratelimit-tokens-remaining');
    const resetStr = getHeader('anthropic-ratelimit-tokens-reset');
    const reqLimitStr = getHeader('anthropic-ratelimit-requests-limit');
    const reqRemainingStr = getHeader('anthropic-ratelimit-requests-remaining');

    if (!limitStr && !remainingStr && !resetStr) {
      return null;
    }

    const metadata: RateLimitMetadata = {};

    if (limitStr) {
      const num = parseInt(limitStr, 10);
      if (!isNaN(num) && num > 0) metadata.limitTokens = num;
    }

    if (remainingStr) {
      const num = parseInt(remainingStr, 10);
      if (!isNaN(num) && num >= 0) metadata.remainingTokens = num;
    }

    if (resetStr) {
      const parsedDate = new Date(resetStr);
      if (!isNaN(parsedDate.getTime())) {
        metadata.resetAt = parsedDate;
      }
    }

    if (reqLimitStr) {
      const num = parseInt(reqLimitStr, 10);
      if (!isNaN(num)) metadata.limitRequests = num;
    }

    if (reqRemainingStr) {
      const num = parseInt(reqRemainingStr, 10);
      if (!isNaN(num)) metadata.remainingRequests = num;
    }

    return metadata;
  }

  /**
   * Extracts token usage from a non-streaming Anthropic response body.
   */
  extractUsage(responseBody: any, defaultModel = 'claude-3-5-sonnet'): UsageExtractionResult {
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

    const usage = responseBody.usage || {};
    const inputTokens = typeof usage.input_tokens === 'number' ? usage.input_tokens : 0;
    const outputTokens = typeof usage.output_tokens === 'number' ? usage.output_tokens : 0;
    const cacheCreation = typeof usage.cache_creation_input_tokens === 'number' ? usage.cache_creation_input_tokens : 0;
    const cacheRead = typeof usage.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : 0;
    const cachedTokens = cacheCreation + cacheRead;

    const totalTokens = inputTokens + outputTokens + cachedTokens;

    return {
      inputTokens,
      outputTokens,
      cachedTokens,
      reasoningTokens: 0,
      totalTokens,
      isEstimated: false,
      usageSource: 'PROVIDER_REPORTED',
    };
  }

  /**
   * Extracts token usage fragments from Anthropic SSE stream chunks.
   */
  extractStreamUsage(sseChunk: string): Partial<UsageExtractionResult> | null {
    if (!sseChunk || typeof sseChunk !== 'string') return null;

    const result: Partial<UsageExtractionResult> = {};
    let found = false;

    const lines = sseChunk.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);

        // Anthropic message_start contains initial input tokens and cache metrics
        if (parsed.type === 'message_start' && parsed.message?.usage) {
          const u = parsed.message.usage;
          if (typeof u.input_tokens === 'number') {
            result.inputTokens = u.input_tokens;
            found = true;
          }
          const cCreate = typeof u.cache_creation_input_tokens === 'number' ? u.cache_creation_input_tokens : 0;
          const cRead = typeof u.cache_read_input_tokens === 'number' ? u.cache_read_input_tokens : 0;
          if (cCreate + cRead > 0) {
            result.cachedTokens = cCreate + cRead;
            found = true;
          }
        }

        // Anthropic message_delta contains output tokens
        if (parsed.type === 'message_delta' && parsed.usage) {
          const u = parsed.usage;
          if (typeof u.output_tokens === 'number') {
            result.outputTokens = u.output_tokens;
            found = true;
          }
        }
      } catch {
        // Not a JSON chunk
      }
    }

    return found ? result : null;
  }
}
