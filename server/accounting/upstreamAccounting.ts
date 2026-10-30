import { prisma } from '../db';
import { getActiveMasterReservations } from './tokenReservation';
import { DiscoverySource, DiscoveryStatus, DiscoveryConfidence } from '../providers/types';

export interface UpstreamMasterMetrics {
  providerId: string;
  providerName: string;
  capacityModel: 'lifetime_prepaid' | 'rolling_window' | 'credit';
  billingModel?: string;
  windowHours: number;
  upstreamLimit: number | null;
  upstreamConsumedLifetime: number;
  upstreamConsumedWindow: number;
  upstreamRemainingTokens: number;
  activeMasterReservations: number;
  effectiveAvailableTokens: number;
  discoverySource: DiscoverySource;
  discoveryStatus: DiscoveryStatus;
  discoveryConfidence: DiscoveryConfidence;
  discoveredResetAt: Date | null;
  discoveredResetSeconds: number | null;
  lastDiscoveredAt: Date | null;
  warningThresholdTokens: number;
  criticalThresholdTokens: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DEPLETED' | 'NOT_CONFIGURED';
}

/**
 * Layer A: Upstream Master Provider Capacity Accounting.
 * Reports authoritative upstream capacity with explicit source, confidence, and freshness.
 * Never guesses or invents fallback values.
 */
export async function getUpstreamMasterAccounting(providerId?: string): Promise<UpstreamMasterMetrics> {
  const provider = providerId
    ? await prisma.vendorProvider.findUnique({ where: { id: providerId } })
    : await prisma.vendorProvider.findFirst({ where: { isPrimary: true } }) ||
      await prisma.vendorProvider.findFirst({ where: { isDefault: true } }) ||
      await prisma.vendorProvider.findFirst();

  if (!provider) {
    return {
      providerId: 'none',
      providerName: 'No Provider Configured',
      capacityModel: 'lifetime_prepaid',
      windowHours: 5,
      upstreamLimit: null,
      upstreamConsumedLifetime: 0,
      upstreamConsumedWindow: 0,
      upstreamRemainingTokens: 0,
      activeMasterReservations: 0,
      effectiveAvailableTokens: 0,
      discoverySource: 'NOT_DISCOVERED',
      discoveryStatus: 'UNAVAILABLE',
      discoveryConfidence: 'UNKNOWN',
      discoveredResetAt: null,
      discoveredResetSeconds: null,
      lastDiscoveredAt: null,
      warningThresholdTokens: 20000000,
      criticalThresholdTokens: 5000000,
      status: 'NOT_CONFIGURED',
    };
  }

  const now = new Date();
  const windowHours = provider.windowHours || 5;
  const windowMs = windowHours * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);

  // 1. Query verified usage from ApiRequest
  const [windowUsageAgg, lifetimeUsageAgg] = await Promise.all([
    prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        providerId: provider.id,
        createdAt: { gte: windowStart },
      },
    }),
    prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        providerId: provider.id,
      },
    }),
  ]);

  const consumedInWindow = windowUsageAgg._sum.totalTokens || 0;
  const consumedLifetime = lifetimeUsageAgg._sum.totalTokens || Number(provider.consumedTokens || 0);

  // 2. Read authoritative or discovered limit
  let limitTokens: number | null = null;
  let remainingTokens = 0;
  let source: DiscoverySource = (provider.discoverySource as DiscoverySource) || 'NOT_DISCOVERED';
  let discStatus: DiscoveryStatus = (provider.discoveryStatus as DiscoveryStatus) || 'UNKNOWN';
  let confidence: DiscoveryConfidence = (provider.discoveryConfidence as DiscoveryConfidence) || 'UNKNOWN';

  if (provider.discoveredLimitTokens && Number(provider.discoveredLimitTokens) > 0) {
    limitTokens = Number(provider.discoveredLimitTokens);
    if (provider.discoveredRemainingTokens !== null && provider.discoveredRemainingTokens !== undefined) {
      remainingTokens = Number(provider.discoveredRemainingTokens);
    } else {
      remainingTokens = Math.max(0, limitTokens - consumedInWindow);
    }
  } else if (provider.configuredLimitTokens && Number(provider.configuredLimitTokens) > 0) {
    limitTokens = Number(provider.configuredLimitTokens);
    remainingTokens = Math.max(0, limitTokens - consumedInWindow);
    source = 'ADMIN_CONFIGURED_UNVERIFIED';
    discStatus = 'LOCALLY_TRACKED';
    confidence = 'LOW';
  } else if (Number(provider.windowAllowance || 0) > 0) {
    limitTokens = Number(provider.windowAllowance);
    remainingTokens = Math.max(0, limitTokens - consumedInWindow);
    source = 'ADMIN_CONFIGURED_UNVERIFIED';
    discStatus = 'LOCALLY_TRACKED';
    confidence = 'LOW';
  } else if (Number(provider.purchasedTokens || 0) > 0) {
    limitTokens = Number(provider.purchasedTokens);
    remainingTokens = Math.max(0, limitTokens - consumedLifetime);
    source = 'ADMIN_CONFIGURED_UNVERIFIED';
    discStatus = 'LOCALLY_TRACKED';
    confidence = 'LOW';
  } else {
    // No limit configured
    limitTokens = null;
    remainingTokens = Math.max(0, Number(provider.availableTokens || 0));
    source = 'LOCALLY_TRACKED';
    discStatus = 'LOCALLY_TRACKED';
    confidence = 'MEDIUM';
  }

  // 3. Active reservations
  const activeMasterReservations = await getActiveMasterReservations(provider.id);
  const effectiveAvailableTokens = Math.max(0, remainingTokens - activeMasterReservations);

  // 4. Reset calculation
  let resetAt = provider.discoveredResetAt || null;
  let resetSeconds: number | null = null;

  if (resetAt) {
    resetSeconds = Math.max(0, Math.floor((resetAt.getTime() - now.getTime()) / 1000));
  } else if (consumedInWindow > 0 && (provider.capacityModel === 'rolling_window' || Number(provider.windowAllowance) > 0)) {
    const oldestInWindow = await prisma.apiRequest.findFirst({
      where: {
        providerId: provider.id,
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (oldestInWindow) {
      resetAt = new Date(oldestInWindow.createdAt.getTime() + windowMs);
      resetSeconds = Math.max(0, Math.floor((resetAt.getTime() - now.getTime()) / 1000));
    }
  }

  // 5. System Health Status
  const baseLimit = limitTokens || Number(provider.windowAllowance || 5000000);
  const criticalThresh = Math.min(Number(provider.criticalThresholdTokens || 5000000), Math.max(1000, Math.round(baseLimit * 0.05)));
  const warningThresh = Math.min(Number(provider.warningThresholdTokens || 20000000), Math.max(2000, Math.round(baseLimit * 0.2)));

  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DEPLETED' | 'NOT_CONFIGURED' = 'HEALTHY';
  if (provider.status === 'disabled' || (!provider.masterApiKeyEncrypted && !provider.creditApiKeyEncrypted && !provider.tokenApiKeyEncrypted)) {
    status = 'NOT_CONFIGURED';
  } else if (effectiveAvailableTokens <= 0) {
    status = 'DEPLETED';
  } else if (effectiveAvailableTokens <= criticalThresh) {
    status = 'CRITICAL';
  } else if (effectiveAvailableTokens <= warningThresh) {
    status = 'WARNING';
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    capacityModel: (provider.capacityModel as any) || 'rolling_window',
    billingModel: provider.billingModel || 'rolling_window',
    windowHours,
    upstreamLimit: limitTokens,
    upstreamConsumedLifetime: consumedLifetime,
    upstreamConsumedWindow: consumedInWindow,
    upstreamRemainingTokens: remainingTokens,
    activeMasterReservations,
    effectiveAvailableTokens,
    discoverySource: source,
    discoveryStatus: discStatus,
    discoveryConfidence: confidence,
    discoveredResetAt: resetAt,
    discoveredResetSeconds: resetSeconds,
    lastDiscoveredAt: provider.lastDiscoveredAt || null,
    warningThresholdTokens: warningThresh,
    criticalThresholdTokens: criticalThresh,
    status,
  };
}
