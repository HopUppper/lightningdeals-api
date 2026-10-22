import { prisma } from './db';
import { calculateCustomerRollingWindow, CustomerRollingWindowMetrics } from './accounting/customerAccounting';
import {
  reserveTokens,
  reserveCustomerQuota,
  releaseReservation,
  settleReservation,
  getActiveCustomerReservations,
  isRollingPlan,
} from './accounting/tokenReservation';

export {
  reserveCustomerQuota,
  settleReservation,
  releaseReservation,
  getActiveCustomerReservations,
  isRollingPlan,
};

/**
 * Authoritative customer rolling window & quota metrics.
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

export async function reserveTokensForRequest(keyId: string, estimatedTokens: number, requestId?: string): Promise<boolean> {
  const reqId = requestId || `req_legacy_${keyId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const res = await reserveCustomerQuota({ apiKeyId: keyId, requestId: reqId, estimatedTokens });
  return res.success;
}

export async function releaseReservedTokens(keyId: string, estimatedTokens: number, requestId?: string): Promise<void> {
  if (requestId) {
    await releaseReservation(requestId);
  }
}

export async function getActiveReservedTokens(keyId: string): Promise<number> {
  return getActiveCustomerReservations(keyId);
}
