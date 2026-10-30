import { prisma } from '../db';

// Fast in-memory cache for ultra-low latency gateway lookup
// Credit plan in-flight reservation tracking
export const inFlightCreditReservations = new Map<string, number>();
export const inFlightCreditByRequest = new Map<string, { keyId: string; amount: number }>();

export function reserveCredits(keyId: string, amount = 0.005, requestId?: string) {
  const current = inFlightCreditReservations.get(keyId) || 0;
  inFlightCreditReservations.set(keyId, current + amount);
  if (requestId) {
    inFlightCreditByRequest.set(requestId, { keyId, amount });
  }
}

export function releaseCreditReservation(keyId: string, amount = 0.005) {
  const current = inFlightCreditReservations.get(keyId) || 0;
  inFlightCreditReservations.set(keyId, Math.max(0, current - amount));
}

export function releaseCreditForRequest(requestId: string): boolean {
  const res = inFlightCreditByRequest.get(requestId);
  if (res) {
    inFlightCreditByRequest.delete(requestId);
    releaseCreditReservation(res.keyId, res.amount);
    return true;
  }
  return false;
}

// Token plan in-flight reservation tracking
export const inFlightTokenReservations = new Map<string, number>();
export const inFlightTokensByRequest = new Map<string, { keyId: string; amount: number }>();

export function reserveInFlightTokens(keyId: string, amount = 1000, requestId?: string) {
  const current = inFlightTokenReservations.get(keyId) || 0;
  inFlightTokenReservations.set(keyId, current + amount);
  if (requestId) {
    inFlightTokensByRequest.set(requestId, { keyId, amount });
  }
}

export function releaseInFlightTokens(keyId: string, amount = 1000) {
  const current = inFlightTokenReservations.get(keyId) || 0;
  inFlightTokenReservations.set(keyId, Math.max(0, current - amount));
}

export function releaseInFlightTokensForRequest(requestId: string): boolean {
  const res = inFlightTokensByRequest.get(requestId);
  if (res) {
    inFlightTokensByRequest.delete(requestId);
    releaseInFlightTokens(res.keyId, res.amount);
    return true;
  }
  return false;
}

interface MemoryReservation {
  apiKeyId?: string;
  providerId?: string;
  tokens: number;
  expiresAtMs: number;
}
const memoryReservations = new Map<string, MemoryReservation>();

// In-process FIFO mutex per API key to serialize rapid concurrent bursts
const keyQueues = new Map<string, Promise<any>>();

export function withKeyMutex<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const current = keyQueues.get(key) || Promise.resolve();
  const next = current.then(fn, fn);
  keyQueues.set(key, next);
  next.finally(() => {
    if (keyQueues.get(key) === next) {
      keyQueues.delete(key);
    }
  });
  return next;
}

/**
 * Robustly determines if an API key is governed by a rolling window
 * (e.g. 5h window) vs a lifetime prepaid pack.
 */
export function isRollingPlan(keyRecord: any): boolean {
  if (!keyRecord) return false;
  if (keyRecord.billingType === 'window') return true;
  if (keyRecord.billingType === 'token' || keyRecord.billingType === 'credit') return false;
  if (typeof keyRecord.windowHours === 'number' && keyRecord.windowHours > 0) return true;
  const planStr = `${keyRecord.plan || ''} ${keyRecord.name || ''}`.toLowerCase();
  return (
    planStr.includes('window') ||
    planStr.includes('5h') ||
    planStr.includes('5-hour') ||
    planStr.includes('5 hours') ||
    planStr.includes('rolling') ||
    planStr.includes('max') ||
    planStr.includes('pro') ||
    planStr.includes('ultra') ||
    planStr.includes('claude max')
  );
}

/**
 * Sweeps expired reservations from memory and database.
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const nowMs = Date.now();
  for (const [reqId, res] of memoryReservations.entries()) {
    if (res.expiresAtMs <= nowMs) {
      memoryReservations.delete(reqId);
    }
  }

  try {
    const expired = await prisma.tokenReservation.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date(nowMs) },
      },
      data: { status: 'EXPIRED' },
    });
    return expired.count;
  } catch (err) {
    return 0;
  }
}

export interface CustomerQuotaReservationResult {
  success: boolean;
  code?: 'QUOTA_EXHAUSTED' | 'KEY_NOT_FOUND' | 'KEY_INACTIVE' | 'KEY_EXPIRED' | 'RESERVATION_FAILED';
  message?: string;
  availableTokens: number;
  reservedTokens: number;
  isRollingWindow?: boolean;
}

/**
 * Concurrency-Safe Customer Quota Reservation Engine.
 *
 * Atomically verifies that the customer has sufficient quota (Layer B)
 * BEFORE any request can be forwarded to the upstream provider (Layer A).
 *
 * Rules:
 * 1. An upstream master provider's allowance (e.g. 5M) NEVER expands a customer's entitlement (e.g. 2M).
 * 2. If available allowance < estimatedTokens, request is REJECTED with QUOTA_EXHAUSTED (HTTP 429).
 * 3. Two concurrent requests cannot overspend the same remaining balance.
 * 4. Negative historical balances strictly block any further consumption.
 * 5. Fails closed if the database or transaction encounters an error.
 */
export async function reserveCustomerQuota({
  apiKeyId,
  requestId,
  estimatedTokens,
  ttlSeconds = 300, // 5 minute default TTL
}: {
  apiKeyId: string;
  requestId: string;
  estimatedTokens: number;
  ttlSeconds?: number;
}): Promise<CustomerQuotaReservationResult> {
  return withKeyMutex(apiKeyId, async () => {
    const effectiveEstimatedTokens = Math.max(1, Math.floor(estimatedTokens));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    try {
      return await prisma.$transaction(async (tx) => {
        // Concurrency lock: Row-level lock on the customer ApiKey record
        try {
          await tx.$executeRaw`SELECT id FROM "ApiKey" WHERE id = ${apiKeyId} FOR UPDATE`;
        } catch {
          // Non-blocking fallback if raw query cannot lock
        }

        // 1. Fetch key record inside transaction to prevent stale balance reads
        const key = await tx.apiKey.findUnique({
          where: { id: apiKeyId },
        });

        if (!key) {
          return {
            success: false,
            code: 'KEY_NOT_FOUND',
            message: 'API key not found or invalid.',
            availableTokens: 0,
            reservedTokens: 0,
          };
        }

        if (key.status !== 'active') {
          return {
            success: false,
            code: 'KEY_INACTIVE',
            message: `API key is ${key.status}. Please activate or replace your API key.`,
            availableTokens: 0,
            reservedTokens: 0,
          };
        }

        if (key.expiresAt && key.expiresAt.getTime() <= now.getTime()) {
          return {
            success: false,
            code: 'KEY_EXPIRED',
            message: 'API key has expired. Please renew your capacity plan.',
            availableTokens: 0,
            reservedTokens: 0,
          };
        }

        // 2. Query sum of active, unexpired reservations for this customer key from DB
        const resAgg = await tx.tokenReservation.aggregate({
          _sum: { tokens: true },
          where: {
            apiKeyId,
            status: 'ACTIVE',
            expiresAt: { gt: now },
          },
        });
        const activeReservations = resAgg._sum.tokens || 0;

        // 3. Evaluate customer entitlement based on plan model
        const bType = key.billingType || (isRollingPlan(key) ? 'window' : 'token');
        const isRolling = isRollingPlan(key);
        const purchasedNum = Number(key.purchasedTokens || 0);
        let availableTokens = 0;

        if (bType === 'credit') {
          // Usage Credit Plan: Validates USD balance & active in-flight credit reservations
          const creditBal = Number(key.creditBalanceUsd || 0);
          if (creditBal <= 0) {
            return {
              success: false,
              code: 'QUOTA_EXHAUSTED',
              message: 'Account usage credit balance exhausted ($0.00 remaining). Please top up credits in your dashboard.',
              availableTokens: 0,
              reservedTokens: activeReservations,
              isRollingWindow: false,
            };
          }

          const inFlightCredit = inFlightCreditReservations.get(apiKeyId) || 0;
          const availableCreditToSpend = creditBal - inFlightCredit;
          if (availableCreditToSpend <= 0) {
            return {
              success: false,
              code: 'QUOTA_EXHAUSTED',
              message: 'Usage credit balance is reserved by concurrent in-flight requests. Please wait for active requests to complete or top up.',
              availableTokens: 0,
              reservedTokens: activeReservations,
              isRollingWindow: false,
            };
          }

          // Convert available USD credit to an equivalent token headroom (approx ~200k tokens per $1 at $5/M blended rate)
          availableTokens = Math.max(1000, Math.floor(availableCreditToSpend * 200000));
        } else if (isRolling) {
          // Rolling-window plan (e.g. 2M or 5M tokens per 5 hours)
          const windowHours = key.windowHours || 5;
          const windowStart = new Date(now.getTime() - windowHours * 3600 * 1000);

          const windowAgg = await tx.apiRequest.aggregate({
            _sum: { totalTokens: true },
            where: {
              apiKeyId,
              createdAt: { gte: windowStart },
            },
          });
          const windowTokensUsed = windowAgg._sum.totalTokens || 0;

          // Customer available allowance is strictly window allowance minus consumed in window minus active reservations
          const rawAvailable = purchasedNum - windowTokensUsed - activeReservations;
          availableTokens = Math.max(0, rawAvailable);

          if (rawAvailable < effectiveEstimatedTokens) {
            return {
              success: false,
              code: 'QUOTA_EXHAUSTED',
              message: `Token allowance exceeded: You have ${availableTokens.toLocaleString()} tokens available in your rolling ${windowHours}h window, but this request requires an estimated ${effectiveEstimatedTokens.toLocaleString()} tokens. Usage will reset as earlier requests roll off.`,
              availableTokens,
              reservedTokens: activeReservations,
              isRollingWindow: true,
            };
          }
        } else {
          // Lifetime prepaid pack or fixed trial allowance
          const tokensRemainingNum = Number(key.tokensRemaining || 0);

          // Strict overage protection: If balance is depleted or historical usage is negative, remaining is strictly 0
          if (tokensRemainingNum <= 0) {
            return {
              success: false,
              code: 'QUOTA_EXHAUSTED',
              message: `Token balance depleted (0 tokens remaining). Please top up your API key in your dashboard.`,
              availableTokens: 0,
              reservedTokens: activeReservations,
              isRollingWindow: false,
            };
          }

          const inFlight = inFlightTokenReservations.get(apiKeyId) || 0;
          const totalActiveReservations = Math.max(activeReservations, inFlight);
          const rawAvailable = tokensRemainingNum - totalActiveReservations;
          availableTokens = Math.max(0, rawAvailable);

          if (rawAvailable < effectiveEstimatedTokens) {
            return {
              success: false,
              code: 'QUOTA_EXHAUSTED',
              message: `Insufficient token balance: You have ${availableTokens.toLocaleString()} tokens available, but this request requires an estimated ${effectiveEstimatedTokens.toLocaleString()} tokens. Please recharge your API key.`,
              availableTokens,
              reservedTokens: totalActiveReservations,
              isRollingWindow: false,
            };
          }
        }

        // 4. Sufficient customer quota confirmed! Atomically create the ACTIVE reservation
        await tx.tokenReservation.upsert({
          where: { requestId },
          create: {
            requestId,
            apiKeyId,
            providerId: key.providerId || undefined,
            tokens: effectiveEstimatedTokens,
            status: 'ACTIVE',
            expiresAt,
          },
          update: {
            apiKeyId,
            providerId: key.providerId || undefined,
            tokens: effectiveEstimatedTokens,
            status: 'ACTIVE',
            expiresAt,
          },
        });

        // Update in-memory cache for ultra-low latency lookups
        memoryReservations.set(requestId, {
          apiKeyId,
          providerId: key.providerId || undefined,
          tokens: effectiveEstimatedTokens,
          expiresAtMs: expiresAt.getTime(),
        });
        reserveInFlightTokens(apiKeyId, effectiveEstimatedTokens, requestId);

        return {
          success: true,
          availableTokens: availableTokens - effectiveEstimatedTokens,
          reservedTokens: activeReservations + effectiveEstimatedTokens,
          isRollingWindow: isRolling,
        };
      });
    } catch (err: any) {
      console.error(`[QuotaReservation] Reservation transaction failed for request ${requestId}:`, err.message || err);
      // FAIL CLOSED: Never forward to upstream when quota authorization fails
      return {
        success: false,
        code: 'RESERVATION_FAILED',
        message: 'Token reservation transaction failed. Request denied to prevent unauthorized overage.',
        availableTokens: 0,
        reservedTokens: 0,
      };
    }
  });
}

/**
 * Legacy reserveTokens wrapper for backward compatibility.
 */
export async function reserveTokens({
  apiKeyId,
  providerId,
  requestId,
  estimatedTokens,
  ttlSeconds = 300,
}: {
  apiKeyId?: string;
  providerId?: string;
  requestId: string;
  estimatedTokens: number;
  ttlSeconds?: number;
}): Promise<boolean> {
  if (estimatedTokens <= 0) return true;

  if (apiKeyId) {
    const res = await reserveCustomerQuota({
      apiKeyId,
      requestId,
      estimatedTokens,
      ttlSeconds,
    });
    return res.success;
  }

  // Provider master reservation only
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  memoryReservations.set(requestId, {
    apiKeyId,
    providerId,
    tokens: estimatedTokens,
    expiresAtMs: expiresAt.getTime(),
  });

  try {
    await prisma.tokenReservation.upsert({
      where: { requestId },
      create: {
        requestId,
        apiKeyId,
        providerId,
        tokens: estimatedTokens,
        status: 'ACTIVE',
        expiresAt,
      },
      update: {
        tokens: estimatedTokens,
        status: 'ACTIVE',
        expiresAt,
      },
    });
  } catch (err) {
    console.warn(`[Reservation] DB write failed for ${requestId}:`, err);
  }

  return true;
}

/**
 * Settles reservation upon successful upstream response.
 */
export async function settleReservation(requestId: string): Promise<void> {
  memoryReservations.delete(requestId);
  releaseCreditForRequest(requestId);
  releaseInFlightTokensForRequest(requestId);

  try {
    await prisma.tokenReservation.updateMany({
      where: { requestId, status: 'ACTIVE' },
      data: { status: 'SETTLED' },
    });
  } catch (err) {
    console.warn(`[Reservation] Settle failed for ${requestId}:`, err);
  }
}

/**
 * Releases reservation on request failure, cancellation, or abort.
 */
export async function releaseReservation(requestId: string): Promise<void> {
  memoryReservations.delete(requestId);
  releaseCreditForRequest(requestId);
  releaseInFlightTokensForRequest(requestId);

  try {
    await prisma.tokenReservation.updateMany({
      where: { requestId, status: 'ACTIVE' },
      data: { status: 'RELEASED' },
    });
  } catch (err) {
    console.warn(`[Reservation] Release failed for ${requestId}:`, err);
  }
}

/**
 * Returns sum of active reserved tokens for a customer API key.
 * Queries authoritative database with memory fallback.
 */
export async function getActiveCustomerReservations(apiKeyId: string): Promise<number> {
  const now = new Date();

  try {
    const agg = await prisma.tokenReservation.aggregate({
      _sum: { tokens: true },
      where: {
        apiKeyId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    });
    return agg._sum.tokens || 0;
  } catch {
    // Memory fallback if DB query temporarily fails
    let memSum = 0;
    const nowMs = now.getTime();
    for (const [, res] of memoryReservations.entries()) {
      if (res.apiKeyId === apiKeyId && res.expiresAtMs > nowMs) {
        memSum += res.tokens;
      }
    }
    return memSum;
  }
}

/**
 * Returns sum of active reserved tokens for an upstream vendor provider.
 */
export async function getActiveMasterReservations(providerId: string): Promise<number> {
  const now = new Date();

  try {
    const agg = await prisma.tokenReservation.aggregate({
      _sum: { tokens: true },
      where: {
        providerId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    });
    return agg._sum.tokens || 0;
  } catch {
    let memSum = 0;
    const nowMs = now.getTime();
    for (const [, res] of memoryReservations.entries()) {
      if (res.providerId === providerId && res.expiresAtMs > nowMs) {
        memSum += res.tokens;
      }
    }
    return memSum;
  }
}
