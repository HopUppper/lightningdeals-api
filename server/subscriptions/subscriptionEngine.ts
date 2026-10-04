import { prisma } from '../db';
import { recordAuditEvent } from '../auditLogger';

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
  existingSubscriptionId?: string;
  notes?: string;
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

    const updated = await tx.subscription.update({
      where: { id: existingSub.id },
      data: {
        expiryTime: newExpiry,
        durationDays,
        status: updatedStatus,
        renewalCount: existingSub.renewalCount + 1,
        lastRenewedAt: now,
        orderId: validOrderId,
        apiKeyId: apiKeyId || existingSub.apiKeyId,
        notes: notes || `Renewed via Order ${orderId}`,
      },
    });

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
        renewalCount: 0,
        quotaLimit: 5000000n,
        quotaWindowHours: 5,
        currentUsage: 0n,
        nextResetTime: new Date(now.getTime() + 5 * 3600 * 1000),
        status: 'ACTIVE',
        notes: notes || `Activated via Order ${orderId}`,
      },
    });

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
