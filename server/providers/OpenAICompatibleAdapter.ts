import { prisma } from '../db';
import { safeDiscoveryFetch } from './SafeDiscoveryClient';
import {
  ProviderAdapter,
  DiscoveredCapacity,
  RateLimitMetadata,
  UsageExtractionResult,
} from './types';

export class OpenAICompatibleAdapter implements ProviderAdapter {
  id = 'openai-compatible';
  protocol = 'openai-compatible';
  supportsOfficialQuotaApi = false; // Standard OpenAI does not expose quota on chat API
  supportsRateLimitHeaders = true;

  /**
   * Constructs the authoritative models catalogue discovery URL based on provider configuration and billing mode.
   * Handles trailing slashes, existing /v1 path segments, and preserves /token prefixes without duplication.
   */
  buildModelsUrl(provider: any, billingType?: string): string {
    let rawBase: string;
    if (billingType === 'token') {
      rawBase = provider?.tokenPackBaseUrl || provider?.baseUrl || 'https://api.openai.com';
    } else if (billingType === 'credit') {
      rawBase = provider?.apiCreditBaseUrl || provider?.baseUrl || 'https://api.openai.com';
    } else {
      rawBase = provider?.apiCreditBaseUrl || provider?.baseUrl || 'https://api.openai.com';
    }
    const cleanBase = String(rawBase).replace(/\/+$/, '');
    return cleanBase.endsWith('/models')
      ? cleanBase
      : cleanBase.endsWith('/v1')
        ? `${cleanBase}/models`
        : `${cleanBase}/v1/models`;
  }

  /**
   * Discovers capacity for an OpenAI-compatible provider.
   * Tests connection using standard /v1/models and inspects response headers.
   */
  async discoverCapacity(provider: any, decryptedMasterKey: string, billingType?: string): Promise<DiscoveredCapacity> {
    const now = new Date();
    const windowHours = provider.windowHours || 5;
    const windowMs = windowHours * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - windowMs);

    const modelsUrl = this.buildModelsUrl(provider, billingType || provider?.billingType || provider?.billingModel);


    let rateLimitsFromProbe: RateLimitMetadata | null = null;
    let probeError: string | null = null;
    let modelsCount = 0;

    // 1. Authenticated test to official /v1/models
    try {
      const probeRes = await safeDiscoveryFetch(modelsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${decryptedMasterKey}`,
        },
        timeoutMs: 5000,
      });

      rateLimitsFromProbe = this.extractRateLimits(probeRes.headers);

      if (probeRes.statusCode === 200) {
        try {
          const body = probeRes.json();
          if (Array.isArray(body?.data)) {
            modelsCount = body.data.length;
          }
        } catch {
          // Ignore parse error
        }
      } else if (probeRes.statusCode === 401) {
        probeError = 'Authentication failed: Invalid upstream API key.';
      } else if (probeRes.statusCode === 429) {
        probeError = 'Rate limited by upstream provider.';
      } else {
        probeError = `HTTP ${probeRes.statusCode} from upstream /v1/models.`;
      }
    } catch (err: any) {
      probeError = err.message || 'Failed to connect to provider /v1/models.';
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

    // 3. If rate limits were obtained from probe
    if (rateLimitsFromProbe && rateLimitsFromProbe.limitTokens) {
      const limit = rateLimitsFromProbe.limitTokens;
      const remaining = rateLimitsFromProbe.remainingTokens !== undefined
        ? rateLimitsFromProbe.remainingTokens
        : Math.max(0, limit - consumedInWindow);

      const resetAt = rateLimitsFromProbe.resetAt || null;
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
          rateLimits: rateLimitsFromProbe,
          modelsCount,
          probeError,
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
          modelsCount,
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
        modelsCount,
        consumedInWindow,
        lifetimeConsumed,
        probeError,
      },
    };
  }

  /**
   * Extracts OpenAI standard rate-limit headers from response.
   */
  extractRateLimits(headers: Headers | Record<string, string | string[] | undefined>): RateLimitMetadata | null {
    const getHeader = (name: string): string | undefined => {
      if (headers instanceof Headers) {
        return headers.get(name) || undefined;
      }
      const val = headers[name] || headers[name.toLowerCase()];
      return Array.isArray(val) ? val[0] : val;
    };

    const limitStr = getHeader('x-ratelimit-limit-tokens');
    const remainingStr = getHeader('x-ratelimit-remaining-tokens');
    const resetStr = getHeader('x-ratelimit-reset-tokens');
    const reqLimitStr = getHeader('x-ratelimit-limit-requests');
    const reqRemainingStr = getHeader('x-ratelimit-remaining-requests');

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
      // Format can be "6m0s", "15ms", "2s", or ISO timestamp
      let resetMs: number | null = null;
      if (resetStr.includes('m') || resetStr.includes('s') || resetStr.includes('h')) {
        let totalMs = 0;
        const hMatch = resetStr.match(/(\d+)h/);
        const mMatch = resetStr.match(/(\d+)m/);
        const sMatch = resetStr.match(/(\d+)s/);
        const msMatch = resetStr.match(/(\d+)ms/);
        if (hMatch) totalMs += parseInt(hMatch[1], 10) * 3600000;
        if (mMatch) totalMs += parseInt(mMatch[1], 10) * 60000;
        if (sMatch && !msMatch) totalMs += parseInt(sMatch[1], 10) * 1000;
        if (msMatch) totalMs += parseInt(msMatch[1], 10);
        resetMs = Date.now() + totalMs;
      } else {
        const parsed = new Date(resetStr);
        if (!isNaN(parsed.getTime())) resetMs = parsed.getTime();
      }

      if (resetMs) {
        metadata.resetAt = new Date(resetMs);
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
   * Extracts token usage from OpenAI chat completion response body.
   */
  extractUsage(responseBody: any, _defaultModel = 'gpt-4o'): UsageExtractionResult {
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
    const inputTokens = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
    const outputTokens = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
    
    // Cached tokens details
    const cachedTokens = usage.prompt_tokens_details?.cached_tokens ?? 0;
    // Reasoning tokens details (o1 / o3)
    const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? 0;

    const totalTokens = typeof usage.total_tokens === 'number'
      ? usage.total_tokens
      : inputTokens + outputTokens;

    return {
      inputTokens,
      outputTokens,
      cachedTokens,
      reasoningTokens,
      totalTokens,
      isEstimated: false,
      usageSource: 'PROVIDER_REPORTED',
    };
  }

  /**
   * Extracts usage chunk from OpenAI SSE stream.
   */
  extractStreamUsage(sseChunk: string): Partial<UsageExtractionResult> | null {
    if (!sseChunk || typeof sseChunk !== 'string') return null;

    const lines = sseChunk.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.usage) {
          const u = parsed.usage;
          const inputTokens = typeof u.prompt_tokens === 'number' ? u.prompt_tokens : 0;
          const outputTokens = typeof u.completion_tokens === 'number' ? u.completion_tokens : 0;
          const cachedTokens = u.prompt_tokens_details?.cached_tokens ?? 0;
          const reasoningTokens = u.completion_tokens_details?.reasoning_tokens ?? 0;
          const totalTokens = typeof u.total_tokens === 'number' ? u.total_tokens : inputTokens + outputTokens;

          return {
            inputTokens,
            outputTokens,
            cachedTokens,
            reasoningTokens,
            totalTokens,
            isEstimated: false,
            usageSource: 'PROVIDER_REPORTED',
          };
        }
      } catch {
        // Not a JSON chunk
      }
    }

    return null;
  }
}
