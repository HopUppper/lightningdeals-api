import { prisma } from '../db';
import { invalidateRollingWindowCache } from '../accounting/customerAccounting';

export type BillingClassification = 'ROLLING_WINDOW' | 'API_CREDITS' | 'CONSUMABLE_TOKENS';

export interface SubscriptionBalanceMetrics {
  subscriptionId: string | null;
  apiKeyId: string | null;
  billingClassification: BillingClassification;
  billingType: 'window' | 'credit' | 'token';
  planId: string;
  planName: string;
  planCategory: string;
  status: string;
  quotaLimit: string;
  currentCycleUsage: string;
  availableQuota: string;
  usagePercentage: number;
  availablePercentage: number;
  currentCycleStart: Date;
  currentCycleEnd: Date;
  lastResetTime: Date;
  nextResetTime: Date;
  nextResetIso: string;
  secondsUntilReset: number;
  previousCycleUsage: string;
  lifetimeTokensUsed: string;
  creditBalanceUsd: number;
  totalCreditsUsedUsd: number;
  isExpired: boolean;
  daysRemaining: number;
}

/**
 * Determine the explicit billing classification across LightningAPI's 6 billing architectures:
 * 1. claude_max_rolling: 5-hour rolling cycle (ROLLING_WINDOW)
 * 2. openai_max_rolling: 5-hour rolling cycle (ROLLING_WINDOW)
 * 3. claude_openai_credits: USD credit balance (API_CREDITS)
 * 4. openai_tokens: Consumable tokens, non-expiring (CONSUMABLE_TOKENS)
 * 5. claude_tokens: Consumable tokens, non-expiring (CONSUMABLE_TOKENS)
 * 6. local_models_tokens: Consumable tokens, non-expiring (CONSUMABLE_TOKENS)
 */
export function determineBillingClassification(
  item: {
    billingType?: string | null;
    planCategory?: string | null;
    planId?: string | null;
    planName?: string | null;
    quotaWindowHours?: number | null;
    quotaLimit?: bigint | number | null;
  },
  planEntity?: {
    planType?: string | null;
    planCategory?: string | null;
    windowHours?: number | null;
  } | null
): {
  classification: BillingClassification;
  billingType: 'window' | 'credit' | 'token';
  planCategory: string;
} {
  const pCategory = (item.planCategory || planEntity?.planCategory || '').toLowerCase();
  const rawBillingType = (item.billingType || planEntity?.planType || '').toLowerCase();
  const planName = (item.planName || item.planId || '').toLowerCase();

  // 1. Credit wallet
  if (
    rawBillingType === 'credit' ||
    pCategory === 'claude_openai_credits' ||
    pCategory.includes('credit') ||
    planName.includes('credit') ||
    planName.includes('wallet')
  ) {
    return {
      classification: 'API_CREDITS',
      billingType: 'credit',
      planCategory: pCategory || 'claude_openai_credits',
    };
  }

  // 2. Consumable token packs
  if (
    rawBillingType === 'token' ||
    pCategory === 'openai_tokens' ||
    pCategory === 'claude_tokens' ||
    pCategory === 'local_models_tokens' ||
    pCategory.includes('token') ||
    planName.includes('token pack') ||
    planName.includes('consumable') ||
    (item.quotaWindowHours === 0 && !rawBillingType.includes('window'))
  ) {
    let resolvedCategory = pCategory;
    if (!resolvedCategory || resolvedCategory === 'window') {
      if (planName.includes('openai') || planName.includes('gpt')) {
        resolvedCategory = 'openai_tokens';
      } else if (planName.includes('local') || planName.includes('deepseek') || planName.includes('qwen')) {
        resolvedCategory = 'local_models_tokens';
      } else {
        resolvedCategory = 'claude_tokens';
      }
    }
    return {
      classification: 'CONSUMABLE_TOKENS',
      billingType: 'token',
      planCategory: resolvedCategory,
    };
  }

  // 3. Rolling Window (Claude Max / OpenAI Max 5-hour rolling)
  return {
    classification: 'ROLLING_WINDOW',
    billingType: 'window',
    planCategory: pCategory || 'claude_max_rolling',
  };
}

/**
 * Deterministically compute the authoritative cycle boundaries based on subscription activation anchor
 * and window hours duration.
 *
 * Given activationTime (T0) and windowMs:
 * cycleIndex = Math.floor(max(0, referenceDate - T0) / windowMs)
 * currentCycleStart = T0 + cycleIndex * windowMs
 * currentCycleEnd = currentCycleStart + windowMs
 * secondsUntilReset = max(0, Math.floor((currentCycleEnd - referenceDate) / 1000))
 */
export function computeCycleBoundaries(
  activationTime: Date,
  windowHours: number = 5,
  referenceDate: Date = new Date()
): {
  cycleIndex: number;
  currentCycleStart: Date;
  currentCycleEnd: Date;
  previousCycleStart: Date;
  previousCycleEnd: Date;
  secondsUntilReset: number;
} {
  const safeWindowHours = Math.max(1, windowHours || 5);
  const windowMs = safeWindowHours * 60 * 60 * 1000;
  const anchorMs = activationTime.getTime();
  const refMs = referenceDate.getTime();

  const elapsedMs = Math.max(0, refMs - anchorMs);
  const cycleIndex = Math.floor(elapsedMs / windowMs);

  const currentCycleStartMs = anchorMs + cycleIndex * windowMs;
  const currentCycleEndMs = currentCycleStartMs + windowMs;
  const previousCycleStartMs = currentCycleStartMs - windowMs;
  const previousCycleEndMs = currentCycleStartMs;

  const secondsUntilReset = Math.max(0, Math.floor((currentCycleEndMs - refMs) / 1000));

  return {
    cycleIndex,
    currentCycleStart: new Date(currentCycleStartMs),
    currentCycleEnd: new Date(currentCycleEndMs),
    previousCycleStart: new Date(previousCycleStartMs),
    previousCycleEnd: new Date(previousCycleEndMs),
    secondsUntilReset,
  };
}

/**
 * Reconcile a subscription's 5-hour cycle, synchronizing the database record, API key balance,
 * and returning the authoritative balance metrics.
 *
 * Idempotent, safe under concurrency and server restarts.
 */
export async function reconcileSubscriptionCycle(
  subscriptionId: string,
  referenceDate: Date = new Date()
): Promise<SubscriptionBalanceMetrics | null> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      apiKey: true,
      order: true,
    },
  });

  if (!sub) return null;

  const now = referenceDate;
  const planInfo = sub.planId ? await prisma.plan.findFirst({ where: { id: sub.planId } }) : null;
  const { classification, billingType, planCategory } = determineBillingClassification(sub, planInfo);

  const quotaLimitBig = sub.quotaLimit || 0n;
  const key = sub.apiKey;
  const msRemaining = sub.expiryTime.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  const isExpired = sub.status === 'EXPIRED' || daysRemaining === 0 || sub.expiryTime < now;

  // Case A: Credit Wallets
  if (classification === 'API_CREDITS') {
    const creditBalanceUsd = key?.creditBalanceUsd ? Number(key.creditBalanceUsd) : 0;
    const totalCreditsUsedUsd = key?.totalCreditsUsedUsd ? Number(key.totalCreditsUsedUsd) : 0;

    return {
      subscriptionId: sub.id,
      apiKeyId: key?.id || null,
      billingClassification: 'API_CREDITS',
      billingType: 'credit',
      planId: sub.planId,
      planName: sub.planName,
      planCategory,
      status: sub.status,
      quotaLimit: '0',
      currentCycleUsage: '0',
      availableQuota: '0',
      usagePercentage: 0,
      availablePercentage: 100,
      currentCycleStart: sub.activationTime,
      currentCycleEnd: sub.expiryTime,
      lastResetTime: sub.activationTime,
      nextResetTime: sub.expiryTime,
      nextResetIso: sub.expiryTime.toISOString(),
      secondsUntilReset: Math.max(0, Math.floor(msRemaining / 1000)),
      previousCycleUsage: '0',
      lifetimeTokensUsed: (key?.tokensUsed || 0n).toString(),
      creditBalanceUsd,
      totalCreditsUsedUsd,
      isExpired,
      daysRemaining,
    };
  }

  // Case B: Consumable Token Packs (Non-replenishing)
  if (classification === 'CONSUMABLE_TOKENS') {
    const lifetimeTokensUsed = (key?.tokensUsed || 0n).toString();
    const purchasedTokens = (key?.purchasedTokens || quotaLimitBig).toString();
    const tokensRemaining = (key?.tokensRemaining || 0n).toString();
    const pNum = Number(purchasedTokens);
    const rNum = Number(tokensRemaining);
    const uNum = Math.max(0, pNum - rNum);
    const usagePct = pNum > 0 ? Math.min(100, Math.round((uNum / pNum) * 10000) / 100) : 0;

    return {
      subscriptionId: sub.id,
      apiKeyId: key?.id || null,
      billingClassification: 'CONSUMABLE_TOKENS',
      billingType: 'token',
      planId: sub.planId,
      planName: sub.planName,
      planCategory,
      status: sub.status,
      quotaLimit: purchasedTokens,
      currentCycleUsage: uNum.toString(),
      availableQuota: tokensRemaining,
      usagePercentage: usagePct,
      availablePercentage: Math.max(0, 100 - usagePct),
      currentCycleStart: sub.activationTime,
      currentCycleEnd: sub.expiryTime,
      lastResetTime: sub.activationTime,
      nextResetTime: sub.expiryTime,
      nextResetIso: sub.expiryTime.toISOString(),
      secondsUntilReset: Math.max(0, Math.floor(msRemaining / 1000)),
      previousCycleUsage: '0',
      lifetimeTokensUsed,
      creditBalanceUsd: 0,
      totalCreditsUsedUsd: 0,
      isExpired,
      daysRemaining,
    };
  }

  // Case C: ROLLING_WINDOW (5-hour rolling plans)
  const windowHours = sub.quotaWindowHours || 5;
  const boundaries = computeCycleBoundaries(sub.activationTime, windowHours, now);

  // 1. Query Current Cycle Usage strictly inside [currentCycleStart, currentCycleEnd)
  const currentUsageAgg = key?.id
    ? await prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: {
          apiKeyId: key.id,
          createdAt: {
            gte: boundaries.currentCycleStart,
            lt: boundaries.currentCycleEnd,
          },
        },
      })
    : { _sum: { totalTokens: 0 } };

  const currentCycleTokens = currentUsageAgg._sum.totalTokens || 0;
  const currentCycleTokensBig = BigInt(currentCycleTokens);

  // 2. Query Previous Cycle Usage inside [previousCycleStart, previousCycleEnd)
  const prevUsageAgg = key?.id
    ? await prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: {
          apiKeyId: key.id,
          createdAt: {
            gte: boundaries.previousCycleStart,
            lt: boundaries.previousCycleEnd,
          },
        },
      })
    : { _sum: { totalTokens: 0 } };

  const previousCycleTokens = prevUsageAgg._sum.totalTokens || 0;

  // 3. Compute available quota and usage percentages
  const availableQuotaBig = quotaLimitBig > currentCycleTokensBig ? quotaLimitBig - currentCycleTokensBig : 0n;
  const qLimitNum = Number(quotaLimitBig);
  const usagePercentage = qLimitNum > 0
    ? Math.min(100, Math.round((currentCycleTokens / qLimitNum) * 10000) / 100)
    : 0;
  const availablePercentage = Math.max(0, Math.round((100 - usagePercentage) * 100) / 100);

  // 4. Check if the database subscription record or API key needs cycle advancement
  const dbNeedsReset = sub.nextResetTime.getTime() !== boundaries.currentCycleEnd.getTime() ||
                       sub.currentUsage !== currentCycleTokensBig;

  if (dbNeedsReset) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextResetTime: boundaries.currentCycleEnd,
            currentUsage: currentCycleTokensBig,
          },
        });

        if (key?.id) {
          await tx.apiKey.update({
            where: { id: key.id },
            data: {
              tokensRemaining: availableQuotaBig,
            },
          });
        }
      });

      // Invalidate in-memory rolling window cache
      if (key?.id) {
        invalidateRollingWindowCache(key.id);
      }

      // Structured privacy-safe diagnostic audit log
      console.log(`[QUOTA_RECONCILIATION] Transitioned cycle for sub=${sub.id.slice(0, 8)}... plan=${sub.planName}: ` +
        `cycleIndex=${boundaries.cycleIndex} currentUsage=${currentCycleTokens} available=${availableQuotaBig.toString()} ` +
        `nextReset=${boundaries.currentCycleEnd.toISOString()}`);
    } catch (updateErr: any) {
      console.warn(`[QUOTA_RECONCILIATION] Non-fatal concurrent update collision for sub=${sub.id}: ${updateErr.message}`);
    }
  }

  return {
    subscriptionId: sub.id,
    apiKeyId: key?.id || null,
    billingClassification: 'ROLLING_WINDOW',
    billingType: 'window',
    planId: sub.planId,
    planName: sub.planName,
    planCategory,
    status: isExpired ? 'EXPIRED' : sub.status,
    quotaLimit: quotaLimitBig.toString(),
    currentCycleUsage: currentCycleTokensBig.toString(),
    availableQuota: availableQuotaBig.toString(),
    usagePercentage,
    availablePercentage,
    currentCycleStart: boundaries.currentCycleStart,
    currentCycleEnd: boundaries.currentCycleEnd,
    lastResetTime: boundaries.currentCycleStart,
    nextResetTime: boundaries.currentCycleEnd,
    nextResetIso: boundaries.currentCycleEnd.toISOString(),
    secondsUntilReset: boundaries.secondsUntilReset,
    previousCycleUsage: previousCycleTokens.toString(),
    lifetimeTokensUsed: (key?.tokensUsed || 0n).toString(),
    creditBalanceUsd: 0,
    totalCreditsUsedUsd: 0,
    isExpired,
    daysRemaining,
  };
}

/**
 * Reconcile quota for a standalone or subscription-linked API key.
 * If the key has an active subscription, delegates to reconcileSubscriptionCycle.
 * Otherwise handles key-native billing types.
 */
export async function calculateKeyQuota(
  keyRecord: any,
  referenceDate: Date = new Date()
): Promise<SubscriptionBalanceMetrics> {
  // If key is attached to a subscription, reconcile via subscription
  const sub = await prisma.subscription.findFirst({
    where: {
      apiKeyId: keyRecord.id,
      status: { in: ['ACTIVE', 'EXPIRING', 'active'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (sub) {
    const subMetrics = await reconcileSubscriptionCycle(sub.id, referenceDate);
    if (subMetrics) return subMetrics;
  }

  const now = referenceDate;
  const isCredit = keyRecord.billingType === 'credit';
  const isToken = keyRecord.billingType === 'token';
  const isWindow = !isCredit && !isToken;

  const msRemaining = keyRecord.expiresAt ? new Date(keyRecord.expiresAt).getTime() - now.getTime() : 30 * 24 * 3600 * 1000;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  const isExpired = Boolean(keyRecord.expiresAt && new Date(keyRecord.expiresAt) < now);

  if (isCredit) {
    const creditBal = Number(keyRecord.creditBalanceUsd || 0);
    const creditsUsed = Number(keyRecord.totalCreditsUsedUsd || 0);
    return {
      subscriptionId: null,
      apiKeyId: keyRecord.id,
      billingClassification: 'API_CREDITS',
      billingType: 'credit',
      planId: keyRecord.plan || 'credit_wallet',
      planName: keyRecord.name || 'API Usage Credits',
      planCategory: 'claude_openai_credits',
      status: keyRecord.status,
      quotaLimit: '0',
      currentCycleUsage: '0',
      availableQuota: '0',
      usagePercentage: 0,
      availablePercentage: 100,
      currentCycleStart: keyRecord.createdAt,
      currentCycleEnd: keyRecord.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      lastResetTime: keyRecord.createdAt,
      nextResetTime: keyRecord.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      nextResetIso: (keyRecord.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000)).toISOString(),
      secondsUntilReset: Math.max(0, Math.floor(msRemaining / 1000)),
      previousCycleUsage: '0',
      lifetimeTokensUsed: (keyRecord.tokensUsed || 0n).toString(),
      creditBalanceUsd: creditBal,
      totalCreditsUsedUsd: creditsUsed,
      isExpired,
      daysRemaining,
    };
  }

  if (isToken) {
    const purchased = (keyRecord.purchasedTokens || 0n).toString();
    const remaining = (keyRecord.tokensRemaining || 0n).toString();
    const used = (keyRecord.tokensUsed || 0n).toString();
    const pNum = Number(purchased);
    const uNum = Number(used);
    const usagePct = pNum > 0 ? Math.min(100, Math.round((uNum / pNum) * 10000) / 100) : 0;

    return {
      subscriptionId: null,
      apiKeyId: keyRecord.id,
      billingClassification: 'CONSUMABLE_TOKENS',
      billingType: 'token',
      planId: keyRecord.plan || 'token_pack',
      planName: keyRecord.name || 'Consumable Token Pack',
      planCategory: 'claude_tokens',
      status: keyRecord.status,
      quotaLimit: purchased,
      currentCycleUsage: used,
      availableQuota: remaining,
      usagePercentage: usagePct,
      availablePercentage: Math.max(0, 100 - usagePct),
      currentCycleStart: keyRecord.createdAt,
      currentCycleEnd: keyRecord.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      lastResetTime: keyRecord.createdAt,
      nextResetTime: keyRecord.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      nextResetIso: (keyRecord.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000)).toISOString(),
      secondsUntilReset: Math.max(0, Math.floor(msRemaining / 1000)),
      previousCycleUsage: '0',
      lifetimeTokensUsed: used,
      creditBalanceUsd: 0,
      totalCreditsUsedUsd: 0,
      isExpired,
      daysRemaining,
    };
  }

  // Standalone rolling window key (e.g. trial key without formal subscription row)
  const windowHours = 5;
  const boundaries = computeCycleBoundaries(keyRecord.createdAt, windowHours, now);

  const usageAgg = await prisma.apiRequest.aggregate({
    _sum: { totalTokens: true },
    where: {
      apiKeyId: keyRecord.id,
      createdAt: {
        gte: boundaries.currentCycleStart,
        lt: boundaries.currentCycleEnd,
      },
    },
  });

  const currentUsage = usageAgg._sum.totalTokens || 0;
  const currentUsageBig = BigInt(currentUsage);
  const purchasedBig = keyRecord.purchasedTokens || 2000000n;
  const availableBig = purchasedBig > currentUsageBig ? purchasedBig - currentUsageBig : 0n;

  const pNum = Number(purchasedBig);
  const usagePercentage = pNum > 0 ? Math.min(100, Math.round((currentUsage / pNum) * 10000) / 100) : 0;

  return {
    subscriptionId: null,
    apiKeyId: keyRecord.id,
    billingClassification: 'ROLLING_WINDOW',
    billingType: 'window',
    planId: keyRecord.plan || 'rolling_window',
    planName: keyRecord.name || 'Claude Max Rolling',
    planCategory: 'claude_max_rolling',
    status: keyRecord.status,
    quotaLimit: purchasedBig.toString(),
    currentCycleUsage: currentUsageBig.toString(),
    availableQuota: availableBig.toString(),
    usagePercentage,
    availablePercentage: Math.max(0, 100 - usagePercentage),
    currentCycleStart: boundaries.currentCycleStart,
    currentCycleEnd: boundaries.currentCycleEnd,
    lastResetTime: boundaries.currentCycleStart,
    nextResetTime: boundaries.currentCycleEnd,
    nextResetIso: boundaries.currentCycleEnd.toISOString(),
    secondsUntilReset: boundaries.secondsUntilReset,
    previousCycleUsage: '0',
    lifetimeTokensUsed: (keyRecord.tokensUsed || 0n).toString(),
    creditBalanceUsd: 0,
    totalCreditsUsedUsd: 0,
    isExpired,
    daysRemaining,
  };
}

/**
 * Background sweeper to advance expired rolling window cycles across all active subscriptions.
 * Can be run every 60 seconds as an independent safety net.
 */
export async function sweepExpiredSubscriptionCycles(): Promise<{ reconciledCount: number }> {
  const now = new Date();
  try {
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING', 'active'] },
        nextResetTime: { lte: now },
      },
      select: { id: true },
      take: 50,
    });

    let reconciledCount = 0;
    for (const sub of expiredSubs) {
      await reconcileSubscriptionCycle(sub.id, now);
      reconciledCount++;
    }

    return { reconciledCount };
  } catch (err: any) {
    console.error('[sweepExpiredSubscriptionCycles] Error during cycle sweep:', err.message);
    return { reconciledCount: 0 };
  }
}
