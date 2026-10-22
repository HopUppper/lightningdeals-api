import { prisma } from '../db';
import { decryptText } from '../db';
import { AnthropicAdapter } from './AnthropicAdapter';
import { OpenAICompatibleAdapter } from './OpenAICompatibleAdapter';
import { CustomHttpAdapter } from './CustomHttpAdapter';
import {
  ProviderAdapter,
  DiscoveredCapacity,
  UsageExtractionResult,
} from './types';

export class ProviderDiscoveryRegistry {
  private static adapters: Map<string, ProviderAdapter> = new Map([
    ['anthropic', new AnthropicAdapter()],
    ['openai-compatible', new OpenAICompatibleAdapter()],
    ['openai', new OpenAICompatibleAdapter()],
    ['custom_http', new CustomHttpAdapter()],
  ]);

  static getAdapter(protocolOrType?: string): ProviderAdapter {
    const key = (protocolOrType || 'anthropic').toLowerCase();
    return this.adapters.get(key) || this.adapters.get('custom_http')!;
  }

  /**
   * Performs an authoritative, SSRF-safe capability and capacity discovery for a provider.
   * Updates provider database records with verified metrics, source, and confidence.
   */
  static async discoverProvider(providerId: string): Promise<DiscoveredCapacity> {
    const provider = await prisma.vendorProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error(`Vendor provider with ID "${providerId}" not found.`);
    }

    if (provider.status === 'disabled') {
      return {
        limitTokens: null,
        consumedTokens: Number(provider.consumedTokens),
        remainingTokens: 0,
        resetAt: null,
        resetSeconds: null,
        source: 'NOT_DISCOVERED',
        status: 'UNAVAILABLE',
        confidence: 'UNKNOWN',
        lastDiscoveredAt: new Date(),
        error: 'Provider is currently disabled.',
      };
    }

    const decryptedKey = decryptText(provider.masterApiKeyEncrypted);
    if (!decryptedKey) {
      const result: DiscoveredCapacity = {
        limitTokens: null,
        consumedTokens: Number(provider.consumedTokens),
        remainingTokens: 0,
        resetAt: null,
        resetSeconds: null,
        source: 'NOT_DISCOVERED',
        status: 'UNAVAILABLE',
        confidence: 'UNKNOWN',
        lastDiscoveredAt: new Date(),
        error: 'No master API key configured for this provider.',
      };

      await prisma.vendorProvider.update({
        where: { id: providerId },
        data: {
          discoveryStatus: result.status,
          discoverySource: result.source,
          discoveryConfidence: result.confidence,
          discoveryError: result.error,
          lastDiscoveredAt: result.lastDiscoveredAt,
        },
      });

      return result;
    }

    const adapter = this.getAdapter(provider.protocol || provider.providerType);
    let discovery: DiscoveredCapacity;

    try {
      discovery = await adapter.discoverCapacity(provider, decryptedKey);
    } catch (err: any) {
      discovery = {
        limitTokens: null,
        consumedTokens: Number(provider.consumedTokens),
        remainingTokens: null,
        resetAt: null,
        resetSeconds: null,
        source: 'NOT_DISCOVERED',
        status: 'UNAVAILABLE',
        confidence: 'UNKNOWN',
        lastDiscoveredAt: new Date(),
        error: err.message || 'Capability discovery request failed.',
      };
    }

    // Persist discovered fields into database
    await prisma.vendorProvider.update({
      where: { id: providerId },
      data: {
        discoveredLimitTokens: discovery.limitTokens !== null ? BigInt(discovery.limitTokens) : null,
        discoveredConsumedTokens: discovery.consumedTokens !== null ? BigInt(discovery.consumedTokens) : null,
        discoveredRemainingTokens: discovery.remainingTokens !== null ? BigInt(discovery.remainingTokens) : null,
        discoveredResetAt: discovery.resetAt,
        discoverySource: discovery.source,
        discoveryStatus: discovery.status,
        discoveryConfidence: discovery.confidence,
        discoveryError: discovery.error || null,
        discoveryDetailsJson: discovery.metadata ? JSON.stringify(discovery.metadata) : null,
        lastDiscoveredAt: discovery.lastDiscoveredAt,
        // Update availableTokens if verified or calculated
        ...(discovery.remainingTokens !== null && {
          availableTokens: BigInt(discovery.remainingTokens),
        }),
      },
    });

    return discovery;
  }

  /**
   * Helper to extract usage and record rate-limit headers from live gateway requests.
   */
  static recordLiveResponseHeaders(
    providerId: string,
    protocol: string,
    headers: Headers | Record<string, string | string[] | undefined>
  ) {
    const adapter = this.getAdapter(protocol);
    const rateLimits = adapter.extractRateLimits(headers);
    if (!rateLimits) return;

    // Async update to avoid blocking client response
    prisma.vendorProvider.findUnique({
      where: { id: providerId },
      select: { discoveryDetailsJson: true },
    }).then((p) => {
      if (!p) return;
      let details: Record<string, any> = {};
      try {
        if (p.discoveryDetailsJson) details = JSON.parse(p.discoveryDetailsJson);
      } catch {}

      details.rateLimits = rateLimits;
      details.rateLimitsTimestamp = new Date().toISOString();

      return prisma.vendorProvider.update({
        where: { id: providerId },
        data: {
          discoveryDetailsJson: JSON.stringify(details),
          ...(rateLimits.limitTokens && {
            discoveredLimitTokens: BigInt(rateLimits.limitTokens),
            discoverySource: 'RATE_LIMIT_HEADERS',
            discoveryStatus: 'VERIFIED',
            discoveryConfidence: 'HIGH',
            lastDiscoveredAt: new Date(),
          }),
          ...(rateLimits.remainingTokens !== undefined && {
            discoveredRemainingTokens: BigInt(rateLimits.remainingTokens),
            availableTokens: BigInt(rateLimits.remainingTokens),
          }),
          ...(rateLimits.resetAt && {
            discoveredResetAt: rateLimits.resetAt,
          }),
        },
      });
    }).catch((err) => {
      console.error(`Failed to update live rate limits for provider ${providerId}:`, err);
    });
  }
}
