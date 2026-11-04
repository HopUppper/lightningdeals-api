import { prisma } from '../db';
import { getActiveCustomerReservations, isRollingPlan } from './tokenReservation';
import { computeCycleBoundaries } from '../subscriptions/quotaReconciliationService';

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

// In-memory window aggregation cache (5s TTL to prevent DB hammering under high request volume)
const WINDOW_AGG_CACHE_TTL_MS = 5000;
interface CachedWindowUsage {
  windowTokensUsed: number;
  cachedAt: number;
  nextResetAt: string | null;
  windowResetSeconds: number | null;
  rolloffSchedule: Array<{ tokens: number; rollsOffAt: string; secondsUntil: number }>;
}
const windowUsageCache = new Map<string, CachedWindowUsage>();

export function invalidateRollingWindowCache(keyId?: string): void {
  if (keyId) {
    windowUsageCache.delete(keyId);
  } else {
    windowUsageCache.clear();
  }
}

/**
 * Layer B: Customer Entitlements & Rolling-Window Accounting.
 * Enforces an independent, strict rolling 5-hour window for each customer API key:
 * [now - 5 hours, now].
 * Remaining allowance = max(0, purchasedTokens - windowTokensUsed - activeReservations).
 */
export async function calculateCustomerRollingWindow(
  keyRecord: any,
  overrideWindowHours?: number,
  options: { bypassCache?: boolean; lightMode?: boolean } = {}
): Promise<CustomerRollingWindowMetrics> {
  const nowMs = Date.now();
  const windowHours = overrideWindowHours || keyRecord.windowHours || 5;
  const windowMs = windowHours * 60 * 60 * 1000;
  const windowStart = new Date(nowMs - windowMs);

  // 1. Authoritative Rolling Window Plan Determination
  const isRollingWindow = isRollingPlan(keyRecord);

  // Short-circuit non-rolling plans immediately (Zero DB queries for consumable token packs)
  if (!isRollingWindow) {
    const activeReservations = await getActiveCustomerReservations(keyRecord.id);
    const purchasedNum = Number(keyRecord.purchasedTokens || 0);
    const lifetimeTokensUsed = Number(keyRecord.tokensUsed || 0);
    const walletRemaining = keyRecord.tokensRemaining !== undefined && keyRecord.tokensRemaining !== null
      ? Math.max(0, Number(keyRecord.tokensRemaining))
      : Math.max(0, purchasedNum - lifetimeTokensUsed);
    const remainingWindowAllowance = Math.max(0, walletRemaining - activeReservations);
    const consumptionPercent = purchasedNum > 0
      ? Math.min(100, Math.round(((purchasedNum - remainingWindowAllowance) / purchasedNum) * 1000) / 10)
      : 0;

    return {
      apiKeyId: keyRecord.id,
      keyPrefix: keyRecord.keyPrefix || (keyRecord.key ? keyRecord.key.substring(0, 10) + '...' : 'unknown'),
      plan: keyRecord.plan || 'Prepaid',
      isRollingWindow: false,
      windowHours,
      windowAllowance: purchasedNum,
      windowTokensUsed: 0,
      activeReservations,
      remainingWindowAllowance,
      lifetimeTokensUsed,
      consumptionPercent,
      windowActive: false,
      nextResetAt: null,
      windowResetSeconds: null,
      effectiveFirstUse: keyRecord.firstUsedAt || keyRecord.lastUsedAt || null,
      rolloffSchedule: [],
    };
  }

  // 2. Rolling Window Plans: Compute authoritative fixed cycle boundaries [cycleStart, cycleEnd)
  let linkedSub: { activationTime: Date; quotaWindowHours: number } | null = null;
  try {
    linkedSub = await prisma.subscription.findFirst({
      where: {
        apiKeyId: keyRecord.id,
        status: { in: ['ACTIVE', 'EXPIRING', 'active'] },
      },
      select: { activationTime: true, quotaWindowHours: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {}

  const anchorTime = linkedSub?.activationTime || keyRecord.createdAt || new Date(nowMs);
  const effectiveWindowHours = overrideWindowHours || linkedSub?.quotaWindowHours || keyRecord.windowHours || 5;
  const boundaries = computeCycleBoundaries(anchorTime, effectiveWindowHours, new Date(nowMs));
  const cycleStart = boundaries.currentCycleStart;
  const cycleEnd = boundaries.currentCycleEnd;

  // Check 5-second in-memory cache strictly valid within the current cycle
  const cached = windowUsageCache.get(keyRecord.id);
  let windowTokensUsed = 0;
  let nextResetAt: string | null = boundaries.currentCycleEnd.toISOString();
  let windowResetSeconds: number | null = boundaries.secondsUntilReset;
  let rolloffSchedule: Array<{ tokens: number; rollsOffAt: string; secondsUntil: number }> = [];

  const isCacheValid = !options.bypassCache &&
                       cached &&
                       cached.cachedAt >= cycleStart.getTime() &&
                       (nowMs - cached.cachedAt < WINDOW_AGG_CACHE_TTL_MS);

  if (isCacheValid && cached) {
    windowTokensUsed = cached.windowTokensUsed;
    nextResetAt = cached.nextResetAt || boundaries.currentCycleEnd.toISOString();
    windowResetSeconds = cached.windowResetSeconds !== null
      ? Math.max(0, cached.windowResetSeconds - Math.floor((nowMs - cached.cachedAt) / 1000))
      : boundaries.secondsUntilReset;
    rolloffSchedule = cached.rolloffSchedule;
  } else {
    // Single-pass aggregation strictly bounded to current cycle [cycleStart, cycleEnd)
    const [windowUsageAgg, requestsInWindow] = await Promise.all([
      prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: {
          apiKeyId: keyRecord.id,
          createdAt: { gte: cycleStart, lt: cycleEnd },
        },
      }),
      options.lightMode
        ? Promise.resolve([])
        : prisma.apiRequest.findMany({
            where: {
              apiKeyId: keyRecord.id,
              createdAt: { gte: cycleStart, lt: cycleEnd },
            },
            select: {
              totalTokens: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
            take: 50, // Bounded index-backed fetch
          }),
    ]);

    windowTokensUsed = windowUsageAgg._sum.totalTokens || 0;
    nextResetAt = boundaries.currentCycleEnd.toISOString();
    windowResetSeconds = boundaries.secondsUntilReset;

    if (requestsInWindow.length > 0) {
      for (const req of requestsInWindow) {
        rolloffSchedule.push({
          tokens: req.totalTokens,
          rollsOffAt: boundaries.currentCycleEnd.toISOString(),
          secondsUntil: boundaries.secondsUntilReset,
        });
      }
    }

    // Cache the window calculation for 5s
    windowUsageCache.set(keyRecord.id, {
      windowTokensUsed,
      cachedAt: nowMs,
      nextResetAt,
      windowResetSeconds,
      rolloffSchedule,
    });
  }

  const lifetimeTokensUsed = Number(keyRecord.tokensUsed || 0);
  const purchasedNum = Number(keyRecord.purchasedTokens || 0);

  // 3. Active in-flight concurrent reservations
  const activeReservations = await getActiveCustomerReservations(keyRecord.id);

  // 4. Calculate remaining allowance
  const remainingWindowAllowance = Math.max(0, purchasedNum - windowTokensUsed - activeReservations);

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
