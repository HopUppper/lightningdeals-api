import { prisma } from '../db';
import { getActiveCustomerReservations } from './tokenReservation';

export interface CustomerRollingWindowMetrics {
  apiKeyId: string;
  keyPrefix: string;
  plan: string;
  isRollingWindow: boolean;
  windowHours: number;
  windowAllowance: number;
  windowTokensUsed: number;
  activeReservations: number;
  remainingWindowAllowance: number;
  lifetimeTokensUsed: number;
  consumptionPercent: number;
  windowActive: boolean;
  nextResetAt: string | null;
  windowResetSeconds: number | null;
  effectiveFirstUse: Date | null;
  rolloffSchedule: Array<{ tokens: number; rollsOffAt: string; secondsUntil: number }>;
}

/**
 * Layer B: Customer Entitlements & Rolling-Window Accounting.
 * Enforces an independent, strict rolling 5-hour window for each customer API key:
 * [now - 5 hours, now].
 * Remaining allowance = max(0, purchasedTokens - windowTokensUsed - activeReservations).
 */
export async function calculateCustomerRollingWindow(
  keyRecord: any,
  overrideWindowHours?: number
): Promise<CustomerRollingWindowMetrics> {
  const nowMs = Date.now();
  const windowHours = overrideWindowHours || keyRecord.windowHours || 5;
  const windowMs = windowHours * 60 * 60 * 1000;
  const windowStart = new Date(nowMs - windowMs);

  // 1. Determine if this key is governed by a rolling window
  // Rolling plans include "pro", "max", "ultra", or any plan where windowHours is configured
  const planLower = (keyRecord.plan || '').toLowerCase();
  const isRollingWindow = keyRecord.windowHours > 0 ||
    planLower.includes('max') ||
    planLower.includes('pro') ||
    planLower.includes('ultra') ||
    planLower.includes('rolling') ||
    planLower.includes('claude');

  // 2. Query aggregate usage strictly within [now - 5h, now]
  const [windowUsageAgg, lifetimeUsageAgg, requestsInWindow] = await Promise.all([
    prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        apiKeyId: keyRecord.id,
        createdAt: { gte: windowStart },
      },
    }),
    prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        apiKeyId: keyRecord.id,
      },
    }),
    prisma.apiRequest.findMany({
      where: {
        apiKeyId: keyRecord.id,
        createdAt: { gte: windowStart },
      },
      select: {
        totalTokens: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const windowTokensUsed = windowUsageAgg._sum.totalTokens || 0;
  const lifetimeTokensUsed = lifetimeUsageAgg._sum.totalTokens || Number(keyRecord.tokensUsed || 0);
  const purchasedNum = Number(keyRecord.purchasedTokens || 0);

  // 3. Active in-flight concurrent reservations
  const activeReservations = await getActiveCustomerReservations(keyRecord.id);

  // 4. Calculate remaining allowance
  let remainingWindowAllowance: number;
  if (isRollingWindow) {
    // For rolling window plans, remaining allowance is strictly window-based
    remainingWindowAllowance = Math.max(0, purchasedNum - windowTokensUsed - activeReservations);
  } else {
    // For lifetime prepaid packs, remaining allowance is decremented from purchased
    const walletRemaining = keyRecord.tokensRemaining !== undefined && keyRecord.tokensRemaining !== null
      ? Math.max(0, Number(keyRecord.tokensRemaining))
      : Math.max(0, purchasedNum - lifetimeTokensUsed);
    remainingWindowAllowance = Math.max(0, walletRemaining - activeReservations);
  }

  // 5. Roll-off schedule and next reset calculation
  let nextResetAt: string | null = null;
  let windowResetSeconds: number | null = null;
  const rolloffSchedule: Array<{ tokens: number; rollsOffAt: string; secondsUntil: number }> = [];

  if (requestsInWindow.length > 0) {
    const oldest = requestsInWindow[0];
    const oldestMs = new Date(oldest.createdAt).getTime();
    const rollOffMs = oldestMs + windowMs;
    nextResetAt = new Date(rollOffMs).toISOString();
    windowResetSeconds = Math.max(0, Math.floor((rollOffMs - nowMs) / 1000));

    // Map each request's roll-off
    for (const req of requestsInWindow) {
      const rMs = new Date(req.createdAt).getTime() + windowMs;
      rolloffSchedule.push({
        tokens: req.totalTokens,
        rollsOffAt: new Date(rMs).toISOString(),
        secondsUntil: Math.max(0, Math.floor((rMs - nowMs) / 1000)),
      });
    }
  }

  const consumptionPercent = purchasedNum > 0
    ? Math.min(100, Math.round(((purchasedNum - remainingWindowAllowance) / purchasedNum) * 1000) / 10)
    : 0;

  const windowActive = windowTokensUsed > 0 || (keyRecord.totalRequests || 0) > 0;

  return {
    apiKeyId: keyRecord.id,
    keyPrefix: keyRecord.keyPrefix || (keyRecord.key ? keyRecord.key.substring(0, 10) + '...' : 'unknown'),
    plan: keyRecord.plan || 'Prepaid',
    isRollingWindow,
    windowHours,
    windowAllowance: purchasedNum,
    windowTokensUsed,
    activeReservations,
    remainingWindowAllowance,
    lifetimeTokensUsed,
    consumptionPercent,
    windowActive,
    nextResetAt,
    windowResetSeconds,
    effectiveFirstUse: keyRecord.firstUsedAt || keyRecord.lastUsedAt || null,
    rolloffSchedule,
  };
}
