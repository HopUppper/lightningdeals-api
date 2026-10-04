import { prisma } from '../db';
import { fulfillOrder, retryOrderFulfillment } from '../payments/fulfillment';
import { dispatchNotification } from '../notifications';
import { InventoryService } from '../inventory/inventoryService';
import { recordAuditEvent } from '../auditLogger';

/**
 * ============================================================================
 * ⚡ AUTOMATION ENGINE & SCHEDULED JOBS — LIGHTNINGAPI.PRO
 * ============================================================================
 * Idempotent, failure-tolerant background lifecycle routines.
 */

export class AutomationEngine {
  /**
   * 1. PROCESS PENDING FULFILLMENTS
   * Retries eligible orders that are in FULFILLMENT_PENDING or RETRY_REQUIRED with CAPTURED payment
   */
  static async processPendingFulfillments() {
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: { in: ['CAPTURED', 'PAID'] },
        fulfillmentStatus: { in: ['FULFILLMENT_PENDING', 'RETRY_REQUIRED'] },
        fulfillmentAttempts: { lt: 3 },
      },
      take: 20,
    });

    const results = [];
    for (const order of orders) {
      try {
        const res = await retryOrderFulfillment(order.internalOrderId);
        results.push({ internalOrderId: order.internalOrderId, success: res.success });
      } catch (err: any) {
        console.error(`[AUTOMATION] Failed pending fulfillment for ${order.internalOrderId}:`, err.message);
        results.push({ internalOrderId: order.internalOrderId, success: false, error: err.message });
      }
    }

    return { processed: results.length, results };
  }

  /**
   * 2. PROCESS SUBSCRIPTION EXPIRY
   * Transitions active/expiring subscriptions to EXPIRED once expiryTime is passed
   */
  static async processSubscriptionExpiry() {
    const now = new Date();

    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING'] },
        expiryTime: { lte: now },
      },
      include: { user: true },
      take: 50,
    });

    let expiredCount = 0;
    for (const sub of expiredSubs) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });

      // Dispatch expiration notification
      await dispatchNotification({
        event: 'SUBSCRIPTION_EXPIRED',
        userId: sub.userId,
        title: `Subscription Expired: ${sub.planName}`,
        message: `Your ${sub.planName} subscription has expired. Click Renew in your dashboard to reactivate anytime.`,
        type: 'warning',
        metadata: { subscriptionId: sub.id, planId: sub.planId },
      });

      await recordAuditEvent({
        eventType: 'SUBSCRIPTION_EXPIRED',
        severity: 'INFO',
        actorType: 'SYSTEM',
        customerId: sub.userId,
        resourceType: 'SUBSCRIPTION',
        resourceId: sub.id,
        action: 'EXPIRE_SUBSCRIPTION',
        result: 'SUCCESS',
        metadata: { planId: sub.planId, expiryTime: sub.expiryTime },
      });

      expiredCount++;
    }

    return { processed: expiredCount };
  }

  /**
   * 3. SEND RENEWAL REMINDERS
   * Processes pending reminders scheduled up to now
   */
  static async sendRenewalReminders() {
    const now = new Date();

    const pendingReminders = await prisma.subscriptionReminder.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: now },
      },
      include: {
        subscription: {
          include: { user: true },
        },
      },
      take: 50,
    });

    let sentCount = 0;
    for (const reminder of pendingReminders) {
      const sub = reminder.subscription;

      // If subscription was already cancelled or superseded, cancel reminder
      if (['CANCELLED', 'SUSPENDED'].includes(sub.status)) {
        await prisma.subscriptionReminder.update({
          where: { id: reminder.id },
          data: { status: 'CANCELLED' },
        });
        continue;
      }

      // Format reminder message
      let title = `Reminder: ${sub.planName} Expiring Soon`;
      let message = `Your ${sub.planName} subscription expires on ${sub.expiryTime.toLocaleDateString()}. Renew now to maintain uninterrupted access.`;

      if (reminder.reminderType === 'ON_EXPIRY') {
        title = `${sub.planName} Expired Today`;
        message = `Your ${sub.planName} subscription has expired today. Renew now to restore full access.`;
      } else if (reminder.reminderType === '1_DAY_BEFORE') {
        title = `Final Notice: ${sub.planName} Expires Tomorrow`;
        message = `Your ${sub.planName} subscription expires in 24 hours. Renew today to avoid interruption.`;
      }

      const dispatchRes = await dispatchNotification({
        event: reminder.reminderType === 'ON_EXPIRY' ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_EXPIRING',
        userId: sub.userId,
        title,
        message,
        type: reminder.reminderType === 'ON_EXPIRY' ? 'warning' : 'info',
        metadata: { subscriptionId: sub.id, reminderType: reminder.reminderType },
      });

      if (dispatchRes.dispatched) {
        await prisma.subscriptionReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'SENT',
            sentAt: now,
          },
        });

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { remindersSentCount: { increment: 1 } },
        });

        sentCount++;
      }
    }

    return { processed: sentCount };
  }

  /**
   * 4. UPDATE SUBSCRIPTION STATUSES (ACTIVE -> EXPIRING)
   * Flags active subscriptions within 7 days of expiry as EXPIRING
   */
  static async updateSubscriptionStatuses() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        expiryTime: {
          gt: now,
          lte: sevenDaysFromNow,
        },
      },
      data: {
        status: 'EXPIRING',
      },
    });

    return { updated: updated.count };
  }

  /**
   * 5. CHECK LOW STOCK
   * Returns current low stock status across all inventory products
   */
  static async checkLowStock() {
    return await InventoryService.getLowStockAlerts();
  }

  /**
   * Run all lifecycle automation routines in one sequence
   */
  static async runAllJobs() {
    const [pendingFulfillments, expiry, reminders, statusUpdates, lowStock] = await Promise.all([
      this.processPendingFulfillments(),
      this.processSubscriptionExpiry(),
      this.sendRenewalReminders(),
      this.updateSubscriptionStatuses(),
      this.checkLowStock(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      pendingFulfillments,
      expiry,
      reminders,
      statusUpdates,
      lowStock,
    };
  }
}
