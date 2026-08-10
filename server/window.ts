import { prisma } from './db';

// In-memory concurrent token reservation map: keyId -> reservedTokens
const activeReservations = new Map<string, number>();

export async function calculateKeyRollingWindow(keyRecord: any) {
  const nowMs = Date.now();
  const windowMs = 5 * 60 * 60 * 1000; // 5 hours in ms
  const windowStartMs = nowMs - windowMs;

  // Query sum of tokens for requests strictly within [currentTime - 5 hours, currentTime]
  const currentWindowUsage = await prisma.apiRequest.aggregate({
    _sum: { totalTokens: true },
    where: {
      apiKeyId: keyRecord.id,
      createdAt: { gte: new Date(windowStartMs) },
    },
  });

  const windowTokensUsed = currentWindowUsage._sum.totalTokens || 0;
  const windowActive = windowTokensUsed > 0 || keyRecord.totalRequests > 0;

  // Earliest request in the current 5-hour rolling window determines next token roll-off
  let nextResetAt: string | null = null;
  let windowResetSeconds: number | null = null;

  if (windowTokensUsed > 0) {
    const oldestRequestInWindow = await prisma.apiRequest.findFirst({
      where: {
        apiKeyId: keyRecord.id,
        createdAt: { gte: new Date(windowStartMs) },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (oldestRequestInWindow) {
      const oldestMs = new Date(oldestRequestInWindow.createdAt).getTime();
      const rollOffMs = oldestMs + windowMs;
      nextResetAt = new Date(rollOffMs).toISOString();
      windowResetSeconds = Math.max(0, Math.floor((rollOffMs - nowMs) / 1000));
    }
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
    effectiveFirstUse: keyRecord.firstUsedAt || keyRecord.lastUsedAt || null,
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
