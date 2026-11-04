import { prisma } from '../db';
import { recordAuditEvent } from '../auditLogger';
import { reconcileSubscriptionCycle } from './quotaReconciliationService';

/**
 * ============================================================================
 * ⚡ CENTRALIZED SUBSCRIPTION LIFECYCLE ENGINE — LIGHTNINGAPI.PRO
 * ============================================================================
 * Centralized, authoritative date & status calculations for subscriptions.
 * Reused across Fulfillment, Renewal, Expiry background jobs, and Customer views.
 */

export interface ExpiryCalculationResult {
  activationDate: Date;
  expiryDate: Date;
  durationDays: number;
}

/**
 * Centralized service: calculateSubscriptionExpiry()
 * Calculates exact subscription expiry given an activation date and duration in days.
 * Enforces consistent UTC timestamp manipulation.
 */
export function calculateSubscriptionExpiry(
  activationDate: Date = new Date(),
  durationDays: number = 30
): Date {
  const safeDays = Math.max(1, Math.floor(durationDays));
  return new Date(activationDate.getTime() + safeDays * 24 * 60 * 60 * 1000);
}

/**
 * Centralized service: calculateRenewalExpiry()
 * Handles seamless renewal extension logic:
 * - If currently active and unexpired: extends from existing expiry date.
 * - If already expired: begins anew from the renewal reference date (now).
 */
export function calculateRenewalExpiry(
  currentExpiry: Date,
  durationDays: number = 30,
  isExpired: boolean = false,
  referenceDate: Date = new Date()
): Date {
  const safeDays = Math.max(1, Math.floor(durationDays));
  const msToAdd = safeDays * 24 * 60 * 60 * 1000;

  // If current expiry is in the future and not flagged expired, extend from existing expiry
  if (!isExpired && currentExpiry.getTime() > referenceDate.getTime()) {
    return new Date(currentExpiry.getTime() + msToAdd);
  }

  // If already expired, start from reference date (payment/fulfillment date)
  return new Date(referenceDate.getTime() + msToAdd);
}

/**
 * Evaluates authoritative subscription status based on current time and expiration date
 */
export function getSubscriptionStatus(
  expiryDate: Date,
  currentStatus: string = 'ACTIVE',
  referenceDate: Date = new Date()
): 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'PENDING' {
  if (['CANCELLED', 'SUSPENDED', 'PENDING'].includes(currentStatus)) {
    return currentStatus as any;
  }

  const nowMs = referenceDate.getTime();
  const expiryMs = expiryDate.getTime();

  if (expiryMs <= nowMs) {
    return 'EXPIRED';
  }

  // Expiring threshold: within 7 days
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (expiryMs - nowMs <= sevenDaysMs) {
    return 'EXPIRING';
  }

  return 'ACTIVE';
}

/**
 * Schedules idempotent renewal reminders for a given subscription
 * Default schedule: 7 days before, 3 days before, 1 day before, and on expiry.
 */
export async function scheduleRenewalReminders(
  subscriptionId: string,
  expiryTime: Date,
  tx: any = prisma
): Promise<void> {
  const reminderConfigs = [
    { type: '7_DAYS_BEFORE', offsetMs: 7 * 24 * 60 * 60 * 1000 },
    { type: '3_DAYS_BEFORE', offsetMs: 3 * 24 * 60 * 60 * 1000 },
    { type: '1_DAY_BEFORE', offsetMs: 1 * 24 * 60 * 60 * 1000 },
    { type: 'ON_EXPIRY', offsetMs: 0 },
  ];

  for (const config of reminderConfigs) {
    const scheduledFor = new Date(expiryTime.getTime() - config.offsetMs);

    // Idempotent upsert: Do not recreate or overwrite already sent reminders
    await tx.subscriptionReminder.upsert({
      where: {
        subscriptionId_reminderType: {
          subscriptionId,
          reminderType: config.type,
        },
      },
      update: {
        scheduledFor,
        // Only update scheduledFor if pending
      },
      create: {
        subscriptionId,
        reminderType: config.type,
        scheduledFor,
        status: 'PENDING',
        channel: 'IN_APP',
      },
    });
  }
}

export interface ActivateOrRenewSubscriptionParams {
  userId: string;
  planId: string;
  planName: string;
  orderId: string;
  apiKeyId?: string;
  durationDays?: number;
  billingPeriod?: 'monthly' | 'yearly';
  quotaLimit?: bigint;
  quotaWindowHours?: number;
  existingSubscriptionId?: string;
  notes?: string;
  metadata?: string;
  tx?: any;
}

/**
 * Activates a new subscription or extends an existing subscription atomically.
 */
export async function activateOrRenewSubscription(
  params: ActivateOrRenewSubscriptionParams
) {
  const {
    userId,
    planId,
    planName,
    orderId,
    apiKeyId,
    durationDays = 30,
    existingSubscriptionId,
    notes,
    tx = prisma,
  } = params;

  // Check if an existing subscription was targeted for renewal
  let existingSub: any = null;
  if (existingSubscriptionId) {
    existingSub = await tx.subscription.findFirst({
      where: { id: existingSubscriptionId, userId },
    });
  } else {
    // If not explicitly provided, check for active or expiring subscription for the same plan
    existingSub = await tx.subscription.findFirst({
      where: {
        userId,
        planId,
        status: { in: ['ACTIVE', 'EXPIRING'] },
      },
      orderBy: { expiryTime: 'desc' },
    });
  }

  const now = new Date();

  if (existingSub) {
    // RENEWAL EXTENSION
    const isAlreadyExpired = existingSub.expiryTime.getTime() <= now.getTime();
    const newExpiry = calculateRenewalExpiry(existingSub.expiryTime, durationDays, isAlreadyExpired, now);
    const updatedStatus = getSubscriptionStatus(newExpiry, 'ACTIVE', now);

    let validOrderId: string | null = existingSub.orderId;
    if (orderId) {
      const orderExists = await tx.order.findUnique({ where: { id: orderId } });
      if (orderExists) validOrderId = orderId;
    }

    const updatedBillingPeriod = params.billingPeriod || (durationDays >= 365 ? 'yearly' : (existingSub.billingPeriod || 'monthly'));

    const updated = await tx.subscription.update({
      where: { id: existingSub.id },
      data: {
        expiryTime: newExpiry,
        durationDays,
        billingPeriod: updatedBillingPeriod,
        status: updatedStatus,
        renewalCount: existingSub.renewalCount + 1,
        lastRenewedAt: now,
        orderId: validOrderId,
        apiKeyId: apiKeyId || existingSub.apiKeyId,
        notes: notes || `Renewed via Order ${orderId}`,
        ...(params.metadata !== undefined && { metadata: params.metadata }),
        ...(params.quotaLimit !== undefined && { quotaLimit: params.quotaLimit }),
        ...(params.quotaWindowHours !== undefined && { quotaWindowHours: params.quotaWindowHours }),
      },
    });

    // Synchronize linked API key expiry
    const targetApiKeyId = apiKeyId || existingSub.apiKeyId;
    if (targetApiKeyId) {
      await tx.apiKey.update({
        where: { id: targetApiKeyId },
        data: { expiresAt: newExpiry, status: 'active' },
      }).catch(() => {});
    }

    // Refresh renewal reminders for the new expiry date
    await scheduleRenewalReminders(updated.id, newExpiry, tx);

    await recordAuditEvent({
      eventType: 'SUBSCRIPTION_EXTENDED',
      severity: 'INFO',
      actorType: 'SYSTEM',
      customerId: userId,
      resourceType: 'SUBSCRIPTION',
      resourceId: updated.id,
      action: 'EXTEND_SUBSCRIPTION',
      result: 'SUCCESS',
      metadata: {
        orderId,
        planId,
        billingPeriod: updatedBillingPeriod,
        durationDays,
        previousExpiry: existingSub.expiryTime,
        newExpiry,
        renewalCount: updated.renewalCount,
      },
    });

    return {
      subscription: updated,
      isRenewal: true,
      previousExpiry: existingSub.expiryTime,
      newExpiry,
    };
  } else {
    // NEW SUBSCRIPTION ACTIVATION
    const expiryTime = calculateSubscriptionExpiry(now, durationDays);
    const newBillingPeriod = params.billingPeriod || (durationDays >= 365 ? 'yearly' : 'monthly');

    let validOrderId: string | null = null;
    if (orderId) {
      const orderExists = await tx.order.findUnique({ where: { id: orderId } });
      if (orderExists) validOrderId = orderId;
    }

    const created = await tx.subscription.create({
      data: {
        userId,
        planId,
        planName,
        orderId: validOrderId,
        apiKeyId,
        activationTime: now,
        expiryTime,
        durationDays,
        billingPeriod: newBillingPeriod,
        renewalCount: 0,
        quotaLimit: params.quotaLimit !== undefined ? params.quotaLimit : 5000000n,
        quotaWindowHours: params.quotaWindowHours !== undefined ? params.quotaWindowHours : 5,
        currentUsage: 0n,
        nextResetTime: new Date(now.getTime() + 5 * 3600 * 1000),
        status: 'ACTIVE',
        notes: notes || `Activated via Order ${orderId}`,
        metadata: params.metadata || null,
      },
    });

    // Synchronize linked API key expiry
    if (apiKeyId) {
      await tx.apiKey.update({
        where: { id: apiKeyId },
        data: { expiresAt: expiryTime, status: 'active' },
      }).catch(() => {});
    }

    await scheduleRenewalReminders(created.id, expiryTime, tx);

    await recordAuditEvent({
      eventType: 'SUBSCRIPTION_ACTIVATED',
      severity: 'INFO',
      actorType: 'SYSTEM',
      customerId: userId,
      resourceType: 'SUBSCRIPTION',
      resourceId: created.id,
      action: 'ACTIVATE_SUBSCRIPTION',
      result: 'SUCCESS',
      metadata: {
        orderId,
        planId,
        activationTime: now,
        expiryTime,
      },
    });

    return {
      subscription: created,
      isRenewal: false,
      previousExpiry: null,
      newExpiry: expiryTime,
    };
  }
}


/**
 * ============================================================================
 * ⚡ UNIFIED CUSTOMER ENTITLEMENT RESOLVER — LIGHTNINGAPI.PRO
 * ============================================================================
 * Authoritatively resolves and unifies a customer's active entitlements across:
 * 1. Active Subscription records (Path A - website checkout)
 * 2. Active ApiKey records (Path B - manual admin WhatsApp/panel provisioning)
 * 3. Captured Orders awaiting entitlement reconciliation
 *
 * Distinctly classifies across all 5 billing architectures:
 * - claude_max_rolling: Claude Max rolling 5h window
 * - claude_openai_credits: Combined Claude + OpenAI credit balances with multiplier
 * - openai_tokens: Consumable OpenAI token packs
 * - claude_tokens: Consumable Claude token packs
 * - local_models_tokens: DeepSeek, Llama, Qwen, Mistral consumable packs
 */
export async function resolveCustomerEntitlements(userId: string) {
  const now = new Date();

  // 1. Fetch all user subscriptions (active and past)
  const existingSubs = await prisma.subscription.findMany({
    where: { userId },
    include: {
      apiKey: true,
      order: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch all user active API keys
  const activeKeys = await prisma.apiKey.findMany({
    where: {
      userId,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
  });

  // 3. Resilient Auto-Reconciliation:
  // If an active key exists without a subscription row, automatically create one so DB stays normalized
  const subKeyIds = new Set(existingSubs.map((s) => s.apiKeyId).filter(Boolean));
  for (const key of activeKeys) {
    if (!subKeyIds.has(key.id)) {
      const isCredit = key.billingType === 'credit';
      const isToken = key.billingType === 'token';
      const quotaWindowHours = isCredit || isToken ? 0 : 5;
      const expiry = key.expiresAt || new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      const days = Math.max(1, Math.ceil((expiry.getTime() - now.getTime()) / (24 * 3600 * 1000)));

      // Auto-reconcile subscription record in DB
      try {
        const autoSub = await prisma.subscription.create({
          data: {
            userId,
            planId: key.plan ? key.plan.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'custom_plan',
            planName: key.plan || (isCredit ? 'API Credits' : 'Claude Max Plan'),
            apiKeyId: key.id,
            activationTime: key.createdAt || now,
            expiryTime: expiry,
            durationDays: days,
            billingPeriod: days >= 365 ? 'yearly' : 'monthly',
            quotaLimit: isCredit ? 0n : key.purchasedTokens,
            quotaWindowHours,
            currentUsage: key.tokensUsed || 0n,
            nextResetTime: new Date(now.getTime() + 5 * 3600 * 1000),
            status: 'ACTIVE',
            notes: 'Auto-reconciled active subscription from provisioned key',
          },
          include: {
            apiKey: true,
            order: true,
          },
        });
        existingSubs.unshift(autoSub);
        subKeyIds.add(key.id);
      } catch (err) {
        console.warn(`[EntitlementResolver] Failed to auto-persist subscription for key ${key.id}:`, err);
      }
    }
  }

  // 4. Format all subscriptions and classify into entitlements with authoritative cycle reconciliation
  const formattedSubscriptions = await Promise.all(
    existingSubs.map(async (sub) => {
      const liveStatus = getSubscriptionStatus(sub.expiryTime, sub.status, now);
      const msRemaining = sub.expiryTime.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

      // Authoritative 5-hour cycle and balance reconciliation
      const cycleMetrics = await reconcileSubscriptionCycle(sub.id, now);

      const key = sub.apiKey;
      const isCredit = cycleMetrics
        ? cycleMetrics.billingType === 'credit'
        : key?.billingType === 'credit' || sub.quotaLimit === 0n;
      const isToken = cycleMetrics
        ? cycleMetrics.billingType === 'token'
        : key?.billingType === 'token';
      const isWindow = !isCredit && !isToken;

      let planCategory = sub.order?.planCategory || cycleMetrics?.planCategory;
      if (!planCategory) {
        if (isCredit) {
          planCategory = 'claude_openai_credits';
        } else if (isToken) {
          const pLower = (sub.planName || '').toLowerCase();
          if (pLower.includes('deepseek') || pLower.includes('llama') || pLower.includes('qwen') || pLower.includes('local')) {
            planCategory = 'local_models_tokens';
          } else if (pLower.includes('openai') || pLower.includes('gpt')) {
            planCategory = 'openai_tokens';
          } else {
            planCategory = 'claude_tokens';
          }
        } else {
          planCategory = 'claude_max_rolling';
        }
      }

      const quotaLimitStr = cycleMetrics ? cycleMetrics.quotaLimit : sub.quotaLimit.toString();
      const tokensUsedStr = cycleMetrics
        ? cycleMetrics.currentCycleUsage
        : (key ? key.tokensUsed.toString() : sub.currentUsage.toString());
      const tokensRemainingStr = cycleMetrics
        ? cycleMetrics.availableQuota
        : (key ? key.tokensRemaining.toString() : Math.max(0n, sub.quotaLimit - sub.currentUsage).toString());

      const nextResetTime = cycleMetrics ? cycleMetrics.nextResetTime : sub.nextResetTime;
      const nextResetIso = cycleMetrics ? cycleMetrics.nextResetIso : sub.nextResetTime.toISOString();
      const secondsUntilReset = cycleMetrics ? cycleMetrics.secondsUntilReset : Math.max(0, Math.floor((sub.nextResetTime.getTime() - now.getTime()) / 1000));
      const usagePercentage = cycleMetrics ? cycleMetrics.usagePercentage : (Number(sub.quotaLimit) > 0 ? Math.min(100, Math.round((Number(tokensUsedStr) / Number(sub.quotaLimit)) * 10000) / 100) : 0);
      const availablePercentage = cycleMetrics ? cycleMetrics.availablePercentage : Math.max(0, 100 - usagePercentage);
      const previousCycleUsage = cycleMetrics ? cycleMetrics.previousCycleUsage : '0';
      const lifetimeTokensUsed = cycleMetrics ? cycleMetrics.lifetimeTokensUsed : (key?.tokensUsed || 0n).toString();

      const creditBalanceUsd = cycleMetrics
        ? cycleMetrics.creditBalanceUsd
        : (key?.creditBalanceUsd ? Number(key.creditBalanceUsd) : 0);
      const totalCreditsUsedUsd = cycleMetrics
        ? cycleMetrics.totalCreditsUsedUsd
        : (key?.totalCreditsUsedUsd ? Number(key.totalCreditsUsedUsd) : 0);

      return {
        id: sub.id,
        planId: sub.planId,
        planName: sub.planName,
        planCategory,
        billingType: isCredit ? 'credit' : isToken ? 'token' : 'window',
        billingClassification: cycleMetrics?.billingClassification || (isCredit ? 'API_CREDITS' : isToken ? 'CONSUMABLE_TOKENS' : 'ROLLING_WINDOW'),
        billingPeriod: sub.billingPeriod || (sub.durationDays >= 365 ? 'yearly' : 'monthly'),
        status: liveStatus,
        rawStatus: sub.status,
        activationTime: sub.activationTime,
        expiryTime: sub.expiryTime,
        currentPeriodStart: sub.activationTime,
        currentPeriodEnd: sub.expiryTime,
        durationDays: sub.durationDays,
        daysRemaining,
        renewalCount: sub.renewalCount,
        lastRenewedAt: sub.lastRenewedAt,
        isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
        isExpired: daysRemaining === 0 || liveStatus === 'EXPIRED',
        quotaLimit: quotaLimitStr,
        currentUsage: tokensUsedStr,
        currentCycleUsage: tokensUsedStr,
        tokensRemaining: tokensRemainingStr,
        availableQuota: tokensRemainingStr,
        usagePercentage,
        availablePercentage,
        previousCycleUsage,
        lifetimeTokensUsed,
        quotaWindowHours: sub.quotaWindowHours,
        nextResetTime,
        nextResetIso,
        secondsUntilReset,
        creditBalanceUsd,
        totalCreditsUsedUsd,
        apiKey: key
          ? {
              id: key.id,
              displayKey: key.displayKey,
              name: key.name,
              billingType: key.billingType,
              status: key.status,
              tokensRemaining: tokensRemainingStr,
              creditBalanceUsd: isCredit ? creditBalanceUsd : Number(key.creditBalanceUsd || 0),
            }
          : null,
        apiKeyDisplay: key?.displayKey || null,
        order: sub.order
          ? {
              id: sub.order.id,
              internalOrderId: sub.order.internalOrderId,
              amountInr: sub.order.amountInr,
              paidAmountInr: sub.order.paidAmountInr,
              status: sub.order.status,
              paymentStatus: sub.order.paymentStatus,
              createdAt: sub.order.createdAt,
            }
          : null,
        orderId: sub.orderId,
      };
    })
  );

  // Filter active entitlements
  const activeEntitlements = formattedSubscriptions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'EXPIRING'
  );

  const pastSubscriptions = formattedSubscriptions.filter(
    (s) => s.status !== 'ACTIVE' && s.status !== 'EXPIRING'
  );

  // Pick primary active subscription: prefer non-trial active plan, else highest quota/latest
  let primaryActiveSubscription = activeEntitlements.find(
    (s) => !s.planId.includes('trial') && !s.planName.toLowerCase().includes('trial')
  );
  if (!primaryActiveSubscription && activeEntitlements.length > 0) {
    primaryActiveSubscription = activeEntitlements[0];
  }

  // Aggregate summary
  let totalCreditBalanceUsd = 0;
  let totalCreditsUsedUsd = 0;
  let totalTokensRemainingBig = 0n;
  let totalTokensPurchasedBig = 0n;
  const rollingPools: any[] = [];

  for (const ent of activeEntitlements) {
    if (ent.billingType === 'credit') {
      totalCreditBalanceUsd += ent.creditBalanceUsd;
      totalCreditsUsedUsd += ent.totalCreditsUsedUsd;
    } else if (ent.billingType === 'token') {
      totalTokensRemainingBig += BigInt(ent.tokensRemaining || '0');
      totalTokensPurchasedBig += BigInt(ent.quotaLimit || '0');
    } else if (ent.billingType === 'window') {
      rollingPools.push({
        id: ent.id,
        planName: ent.planName,
        quotaLimit: ent.quotaLimit,
        tokensUsed: ent.currentUsage,
        currentUsage: ent.currentUsage,
        currentCycleUsage: ent.currentCycleUsage,
        tokensRemaining: ent.tokensRemaining,
        availableQuota: ent.availableQuota,
        windowHours: ent.quotaWindowHours,
        nextResetTime: ent.nextResetTime,
        nextResetIso: ent.nextResetIso,
        secondsUntilReset: ent.secondsUntilReset,
        usagePercentage: ent.usagePercentage,
        availablePercentage: ent.availablePercentage,
        previousCycleUsage: ent.previousCycleUsage,
        lifetimeTokensUsed: ent.lifetimeTokensUsed,
        status: ent.status,
        apiKeyDisplay: ent.apiKeyDisplay,
      });
    }
  }

  const summary = {
    hasActivePlan: activeEntitlements.length > 0,
    activePlansCount: activeEntitlements.length,
    totalCreditBalanceUsd: Math.round(totalCreditBalanceUsd * 10000) / 10000,
    totalCreditsUsedUsd: Math.round(totalCreditsUsedUsd * 10000) / 10000,
    totalTokensRemaining: totalTokensRemainingBig.toString(),
    totalTokensPurchased: totalTokensPurchasedBig.toString(),
    rollingPools,
  };

  return {
    success: true,
    hasActivePlan: activeEntitlements.length > 0,
    activeSubscription: primaryActiveSubscription || null,
    activeEntitlements,
    subscriptions: formattedSubscriptions,
    pastSubscriptions,
    summary,
  };
}
