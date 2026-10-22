import { prisma } from './db';
import { calculateCustomerRollingWindow, CustomerRollingWindowMetrics } from './accounting/customerAccounting';
import {
  reserveTokens,
  releaseReservation,
  settleReservation,
  getActiveCustomerReservations,
} from './accounting/tokenReservation';

/**
 * Backward-compatible wrapper around calculateCustomerRollingWindow.
 * Returns the exact fields expected by existing gateway, admin, user, and tool callers,
 * while fixing the bug where rolling window plans permanently depleted tokensRemaining.
 */
export async function calculateKeyRollingWindow(keyRecord: any) {
  const metrics = await calculateCustomerRollingWindow(keyRecord);
  const nowMs = Date.now();
  const windowMs = (metrics.windowHours || 5) * 60 * 60 * 1000;
  const windowStartMs = nowMs - windowMs;

  return {
    windowActive: metrics.windowActive,
    windowStartMs,
    nextResetAt: metrics.nextResetAt,
    windowResetSeconds: metrics.windowResetSeconds,
    windowTokensUsed: metrics.windowTokensUsed,
    purchasedNum: metrics.windowAllowance,
    remainingNum: metrics.remainingWindowAllowance,
    consumptionPercent: metrics.consumptionPercent,
    effectiveFirstUse: metrics.effectiveFirstUse,
    isRollingWindow: metrics.isRollingWindow,
    lifetimeTokensUsed: metrics.lifetimeTokensUsed,
    activeReservations: metrics.activeReservations,
    rolloffSchedule: metrics.rolloffSchedule,
  };
}

export function reserveTokensForRequest(keyId: string, estimatedTokens: number, requestId?: string): boolean {
  const reqId = requestId || `req_legacy_${keyId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  reserveTokens({ apiKeyId: keyId, requestId: reqId, estimatedTokens });
  return true;
}

export function releaseReservedTokens(keyId: string, estimatedTokens: number, requestId?: string) {
  if (requestId) {
    releaseReservation(requestId);
  }
}

export async function getActiveReservedTokens(keyId: string): Promise<number> {
  return getActiveCustomerReservations(keyId);
}
