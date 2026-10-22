export type DiscoverySource =
  | 'OFFICIAL_QUOTA_API'
  | 'RATE_LIMIT_HEADERS'
  | 'LOCALLY_TRACKED'
  | 'ADMIN_CONFIGURED_UNVERIFIED'
  | 'NOT_DISCOVERED';

export type DiscoveryStatus =
  | 'VERIFIED'
  | 'LOCALLY_TRACKED'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export type DiscoveryConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface DiscoveredCapacity {
  limitTokens: number | null;
  consumedTokens: number | null;
  remainingTokens: number | null;
  resetAt: Date | null;
  resetSeconds: number | null;
  source: DiscoverySource;
  status: DiscoveryStatus;
  confidence: DiscoveryConfidence;
  lastDiscoveredAt: Date;
  error?: string | null;
  metadata?: Record<string, any>;
}

export interface UsageExtractionResult {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  isEstimated: boolean;
  usageSource: 'PROVIDER_REPORTED' | 'LOCAL_CALCULATED' | 'SIMULATED_ESTIMATE';
}

export interface RateLimitMetadata {
  limitTokens?: number;
  remainingTokens?: number;
  resetAt?: Date;
  limitRequests?: number;
  remainingRequests?: number;
}

export interface ProviderAdapter {
  id: string;
  protocol: string;
  supportsOfficialQuotaApi: boolean;
  supportsRateLimitHeaders: boolean;
  discoverCapacity(provider: any, decryptedMasterKey: string): Promise<DiscoveredCapacity>;
  extractRateLimits(headers: Headers | Record<string, string | string[] | undefined>): RateLimitMetadata | null;
  extractUsage(responseBody: any, defaultModel?: string): UsageExtractionResult;
  extractStreamUsage(sseChunk: string): Partial<UsageExtractionResult> | null;
}
