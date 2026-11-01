import { prisma } from '../db';

export interface CallMetricItem {
  timestamp: number;
  statusCode: number;
  latencyMs: number;
  isSuccess: boolean;
  isRateLimit: boolean;
  isTimeout: boolean;
  errorCategory?: string;
}

export interface ProviderModelHealth {
  providerSlug: string;
  modelId: string;
  windowMinutes: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  timeoutRequests: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  errorCategories: Record<string, number>;
  lastRecordedAt: Date;
}

// Rolling in-memory window of metrics per `providerSlug:modelId`
const metricWindows = new Map<string, CallMetricItem[]>();
const WINDOW_DURATION_MS = 5 * 60 * 1000; // 5 minute rolling window

function getMetricKey(providerSlug: string, modelId: string): string {
  return `${(providerSlug || 'unknown').toLowerCase().trim()}:${(modelId || 'all').toLowerCase().trim()}`;
}

/**
 * Records an individual upstream request metric into the rolling window
 */
export function recordProviderCallMetric(params: {
  providerSlug: string;
  modelId: string;
  statusCode: number;
  latencyMs: number;
  errorCategory?: string;
}): void {
  const { providerSlug, modelId, statusCode, latencyMs, errorCategory } = params;
  const key = getMetricKey(providerSlug, modelId);

  const isSuccess = statusCode >= 200 && statusCode < 400;
  const isRateLimit = statusCode === 429;
  const isTimeout = statusCode === 504 || errorCategory === 'timeout';

  let window = metricWindows.get(key);
  if (!window) {
    window = [];
    metricWindows.set(key, window);
  }

  const now = Date.now();
  window.push({
    timestamp: now,
    statusCode,
    latencyMs: Math.max(1, latencyMs),
    isSuccess,
    isRateLimit,
    isTimeout,
    errorCategory: errorCategory || (isRateLimit ? '429_rate_limit' : !isSuccess ? `http_${statusCode}` : undefined),
  });

  // Prune metrics older than 5 minutes
  const cutoff = now - WINDOW_DURATION_MS;
  while (window.length > 0 && window[0].timestamp < cutoff) {
    window.shift();
  }
}

/**
 * Calculates real-time health intelligence for a specific provider and model
 */
export function getProviderModelHealth(providerSlug: string, modelId: string): ProviderModelHealth {
  const key = getMetricKey(providerSlug, modelId);
  const rawItems = metricWindows.get(key) || [];
  const now = Date.now();
  const cutoff = now - WINDOW_DURATION_MS;
  const items = rawItems.filter((i) => i.timestamp >= cutoff);

  const totalRequests = items.length;
  if (totalRequests === 0) {
    return {
      providerSlug,
      modelId,
      windowMinutes: 5,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      timeoutRequests: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      successRate: 100.0,
      errorCategories: {},
      lastRecordedAt: new Date(),
    };
  }

  let successfulRequests = 0;
  let failedRequests = 0;
  let rateLimitedRequests = 0;
  let timeoutRequests = 0;
  let latencySum = 0;
  const latencies: number[] = [];
  const errorCategories: Record<string, number> = {};

  for (const item of items) {
    latencySum += item.latencyMs;
    latencies.push(item.latencyMs);

    if (item.isSuccess) {
      successfulRequests++;
    } else {
      failedRequests++;
      if (item.isRateLimit) rateLimitedRequests++;
      if (item.isTimeout) timeoutRequests++;

      const cat = item.errorCategory || 'unclassified_error';
      errorCategories[cat] = (errorCategories[cat] || 0) + 1;
    }
  }

  latencies.sort((a, b) => a - b);
  const p50Idx = Math.floor(latencies.length * 0.5);
  const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));

  const avgLatencyMs = Math.round(latencySum / totalRequests);
  const p50LatencyMs = latencies[p50Idx] || 0;
  const p95LatencyMs = latencies[p95Idx] || 0;
  const successRate = Math.round((successfulRequests / totalRequests) * 1000) / 10;

  return {
    providerSlug,
    modelId,
    windowMinutes: 5,
    totalRequests,
    successfulRequests,
    failedRequests,
    rateLimitedRequests,
    timeoutRequests,
    avgLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    successRate,
    errorCategories,
    lastRecordedAt: new Date(),
  };
}

/**
 * Returns overall infrastructure health across all tracked providers & models
 */
export function getInfrastructureHealthOverview(): ProviderModelHealth[] {
  const result: ProviderModelHealth[] = [];
  for (const key of metricWindows.keys()) {
    const parts = key.split(':');
    const providerSlug = parts[0];
    const modelId = parts.slice(1).join(':');
    result.push(getProviderModelHealth(providerSlug, modelId));
  }
  return result;
}

/**
 * Persists a point-in-time snapshot of provider health to the database
 */
export async function persistHealthSnapshots(): Promise<void> {
  const overview = getInfrastructureHealthOverview();
  const records = overview.filter((o) => o.totalRequests > 0).map((h) => ({
    providerSlug: h.providerSlug,
    modelId: h.modelId,
    windowMinutes: h.windowMinutes,
    totalRequests: h.totalRequests,
    successfulRequests: h.successfulRequests,
    failedRequests: h.failedRequests,
    rateLimitedRequests: h.rateLimitedRequests,
    timeoutRequests: h.timeoutRequests,
    avgLatencyMs: h.avgLatencyMs,
    p95LatencyMs: h.p95LatencyMs,
    successRate: h.successRate,
    recordedAt: new Date(),
  }));

  if (records.length > 0) {
    await prisma.providerHealthSnapshot.createMany({ data: records }).catch((e) => {
      console.error('[HealthSnapshot] Error saving snapshots:', e.message);
    });
  }
}
