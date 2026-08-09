import { prisma } from './db';

// In-memory concurrent token reservation map: keyId -> reservedTokens
const activeReservations = new Map<string, number>();

export async function calculateKeyRollingWindow(keyRecord: any) {
  const nowMs = Date.now();
  const effectiveFirstUse = keyRecord.firstUsedAt || (keyRecord.totalRequests > 0 ? keyRecord.lastUsedAt : null);

  let windowActive = false;
  let windowStartMs: number | null = null;
  let nextResetAt: string | null = null;
  let windowResetSeconds: number | null = null;
  let windowTokensUsed = 0;

  if (effectiveFirstUse && keyRecord.totalRequests > 0) {
    windowActive = true;
    const anchorMs = new Date(effectiveFirstUse).getTime();
    const windowMs = 5 * 60 * 60 * 1000; // 5 hours in ms
    const elapsedMs = Math.max(0, nowMs - anchorMs);
    const windowIndex = Math.floor(elapsedMs / windowMs);
    windowStartMs = anchorMs + windowIndex * windowMs;
    const nextResetMs = anchorMs + (windowIndex + 1) * windowMs;
    nextResetAt = new Date(nextResetMs).toISOString();
    windowResetSeconds = Math.max(0, Math.floor((nextResetMs - nowMs) / 1000));

    const currentWindowUsage = await prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        apiKeyId: keyRecord.id,
        createdAt: { gte: new Date(windowStartMs) },
      },
    });
    windowTokensUsed = currentWindowUsage._sum.totalTokens || 0;
  }

  const purchasedNum = Number(keyRecord.purchasedTokens || 0);
  const remainingNum = Math.max(0, purchasedNum - windowTokensUsed);
  const consumptionPercent = purchasedNum > 0 ? Math.min(100, Math.round((windowTokensUsed / purchasedNum) * 1000) / 10) : 0;

  return {
    windowActive,
    windowStartMs,
    nextResetAt,
    windowResetSeconds,
    windowTokensUsed,
    purchasedNum,
    remainingNum,
    consumptionPercent,
    effectiveFirstUse,
  };
}

export function reserveTokensForRequest(keyId: string, estimatedTokens: number): boolean {
  const currentReserved = activeReservations.get(keyId) || 0;
  activeReservations.set(keyId, currentReserved + estimatedTokens);
  return true;
}

export function releaseReservedTokens(keyId: string, estimatedTokens: number) {
  const currentReserved = activeReservations.get(keyId) || 0;
  const newReserved = Math.max(0, currentReserved - estimatedTokens);
  if (newReserved === 0) {
    activeReservations.delete(keyId);
  } else {
    activeReservations.set(keyId, newReserved);
  }
}

export function getActiveReservedTokens(keyId: string): number {
  return activeReservations.get(keyId) || 0;
}
