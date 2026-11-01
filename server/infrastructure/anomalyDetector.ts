import { prisma } from '../db';

export interface AnomalyCheckResult {
  hasAnomaly: boolean;
  type?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metricValue?: number;
  thresholdValue?: number;
  actionTaken?: string;
  message?: string;
}

// In-memory sliding windows for anomaly detection
interface KeyTrafficWindow {
  requestTimestamps: number[];
  tokensBurned: number[];
  errorCount: number;
  totalCount: number;
}
const keyWindows = new Map<string, KeyTrafficWindow>();

interface IpAuthWindow {
  authFailureTimestamps: number[];
}
const ipAuthWindows = new Map<string, IpAuthWindow>();

// Configurable thresholds
export const ANOMALY_THRESHOLDS = {
  VELOCITY_REQ_PER_MIN: 120,          // Max requests per minute per key
  BURN_RATE_TOKENS_5MIN: 500000,      // Max tokens in 5 minutes per key
  AUTH_FAILURES_2MIN: 10,             // Max auth failures in 2 minutes per IP
  ERROR_RATE_PERCENT: 50,             // Error rate percentage threshold
  ERROR_RATE_MIN_REQUESTS: 15,        // Minimum requests to evaluate error percentage
  OVERSIZED_TOKEN_LIMIT: 800000,      // Single request oversized token limit
};

/**
 * Tracks and checks incoming API requests for multi-dimensional anomalies
 */
export async function evaluateRequestAnomalies(params: {
  apiKeyId: string;
  userId?: string;
  ipAddress?: string;
  modelId: string;
  requestedTokens?: number;
}): Promise<AnomalyCheckResult> {
  const { apiKeyId, userId, ipAddress, modelId, requestedTokens = 1000 } = params;
  const now = Date.now();

  let win = keyWindows.get(apiKeyId);
  if (!win) {
    win = {
      requestTimestamps: [],
      tokensBurned: [],
      errorCount: 0,
      totalCount: 0,
    };
    keyWindows.set(apiKeyId, win);
  }

  // Record this request
  win.requestTimestamps.push(now);
  win.tokensBurned.push(requestedTokens);
  win.totalCount++;

  // Prune window (keep last 5 minutes)
  const cutoff5m = now - 5 * 60 * 1000;
  const cutoff1m = now - 60 * 1000;

  // Filter timestamps for 1m velocity
  const reqsLastMinute = win.requestTimestamps.filter((t) => t >= cutoff1m).length;
  if (reqsLastMinute > ANOMALY_THRESHOLDS.VELOCITY_REQ_PER_MIN) {
    const incident = await persistIncident({
      anomalyType: 'REQUEST_SPIKE',
      severity: reqsLastMinute > 250 ? 'HIGH' : 'MEDIUM',
      apiKeyId,
      userId,
      ipAddress,
      modelId,
      metricValue: reqsLastMinute,
      thresholdValue: ANOMALY_THRESHOLDS.VELOCITY_REQ_PER_MIN,
      actionTaken: 'THROTTLED',
      detailsJson: JSON.stringify({ reqsLastMinute, modelId }),
    });

    return {
      hasAnomaly: true,
      type: 'REQUEST_SPIKE',
      severity: incident.severity as any,
      metricValue: reqsLastMinute,
      thresholdValue: ANOMALY_THRESHOLDS.VELOCITY_REQ_PER_MIN,
      actionTaken: 'THROTTLED',
      message: `Request velocity anomaly detected (${reqsLastMinute} req/min exceeds threshold of ${ANOMALY_THRESHOLDS.VELOCITY_REQ_PER_MIN}).`,
    };
  }

  // Check 5m token burn rate
  let tokensIn5m = 0;
  for (let i = 0; i < win.requestTimestamps.length; i++) {
    if (win.requestTimestamps[i] >= cutoff5m) {
      tokensIn5m += win.tokensBurned[i] || 0;
    }
  }

  if (tokensIn5m > ANOMALY_THRESHOLDS.BURN_RATE_TOKENS_5MIN) {
    await persistIncident({
      anomalyType: 'BURN_RATE_SURGE',
      severity: tokensIn5m > 2000000 ? 'CRITICAL' : 'HIGH',
      apiKeyId,
      userId,
      ipAddress,
      modelId,
      metricValue: tokensIn5m,
      thresholdValue: ANOMALY_THRESHOLDS.BURN_RATE_TOKENS_5MIN,
      actionTaken: 'LOGGED',
      detailsJson: JSON.stringify({ tokensIn5m, modelId }),
    });

    return {
      hasAnomaly: true,
      type: 'BURN_RATE_SURGE',
      severity: 'HIGH',
      metricValue: tokensIn5m,
      thresholdValue: ANOMALY_THRESHOLDS.BURN_RATE_TOKENS_5MIN,
      actionTaken: 'LOGGED',
      message: `Abnormal token burn rate detected (${tokensIn5m} tokens in 5m exceeds threshold of ${ANOMALY_THRESHOLDS.BURN_RATE_TOKENS_5MIN}).`,
    };
  }

  // Check oversized request
  if (requestedTokens > ANOMALY_THRESHOLDS.OVERSIZED_TOKEN_LIMIT) {
    await persistIncident({
      anomalyType: 'OVERSIZED_PAYLOAD',
      severity: 'LOW',
      apiKeyId,
      userId,
      ipAddress,
      modelId,
      metricValue: requestedTokens,
      thresholdValue: ANOMALY_THRESHOLDS.OVERSIZED_TOKEN_LIMIT,
      actionTaken: 'LOGGED',
      detailsJson: JSON.stringify({ requestedTokens, modelId }),
    });
  }

  return { hasAnomaly: false };
}

/**
 * Records an authentication failure from an IP address to detect brute force key spraying
 */
export async function recordAuthFailure(ipAddress: string, providedKeySnippet?: string): Promise<AnomalyCheckResult> {
  const now = Date.now();
  let win = ipAuthWindows.get(ipAddress);
  if (!win) {
    win = { authFailureTimestamps: [] };
    ipAuthWindows.set(ipAddress, win);
  }

  win.authFailureTimestamps.push(now);

  const cutoff2m = now - 2 * 60 * 1000;
  const recentFailures = win.authFailureTimestamps.filter((t) => t >= cutoff2m).length;

  if (recentFailures >= ANOMALY_THRESHOLDS.AUTH_FAILURES_2MIN) {
    await persistIncident({
      anomalyType: 'AUTH_SPRAY',
      severity: recentFailures >= 25 ? 'CRITICAL' : 'HIGH',
      ipAddress,
      metricValue: recentFailures,
      thresholdValue: ANOMALY_THRESHOLDS.AUTH_FAILURES_2MIN,
      actionTaken: 'THROTTLED',
      detailsJson: JSON.stringify({ recentFailures, providedKeySnippet }),
    });

    return {
      hasAnomaly: true,
      type: 'AUTH_SPRAY',
      severity: 'HIGH',
      metricValue: recentFailures,
      thresholdValue: ANOMALY_THRESHOLDS.AUTH_FAILURES_2MIN,
      actionTaken: 'THROTTLED',
      message: `Multiple authentication failures detected from IP (${recentFailures} failures in 2m).`,
    };
  }

  return { hasAnomaly: false };
}

/**
 * Persists an anomaly incident to the database
 */
async function persistIncident(data: {
  anomalyType: string;
  severity: string;
  apiKeyId?: string;
  userId?: string;
  ipAddress?: string;
  providerSlug?: string;
  modelId?: string;
  metricValue?: number;
  thresholdValue?: number;
  actionTaken?: string;
  detailsJson?: string;
}) {
  try {
    return await prisma.anomalyIncident.create({
      data: {
        anomalyType: data.anomalyType,
        severity: data.severity,
        apiKeyId: data.apiKeyId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        providerSlug: data.providerSlug,
        modelId: data.modelId,
        metricValue: data.metricValue,
        thresholdValue: data.thresholdValue,
        actionTaken: data.actionTaken || 'LOGGED',
        status: 'DETECTED',
        detailsJson: data.detailsJson,
      },
    });
  } catch (e: any) {
    console.error('[AnomalyDetector] Failed to persist incident:', e.message);
    return { severity: data.severity };
  }
}

/**
 * Resolves an anomaly incident (Admin action)
 */
export async function resolveAnomaly(id: string, adminUserId: string): Promise<boolean> {
  try {
    await prisma.anomalyIncident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: adminUserId,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves recent anomaly incidents for the admin dashboard
 */
export async function getRecentAnomalies(take = 50) {
  try {
    return await prisma.anomalyIncident.findMany({
      take,
      orderBy: { detectedAt: 'desc' },
    });
  } catch {
    return [];
  }
}
