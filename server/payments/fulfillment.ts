import crypto from 'crypto';
import { prisma, encryptText } from '../db';
import { getPlanByIdAsync } from './plans';
import { recordSecurityLog } from '../authSecurity';
import { awardOrderCredits } from '../rewards/rewardService';
import { activateOrRenewSubscription } from '../subscriptions/subscriptionEngine';
import { InventoryService } from '../inventory/inventoryService';
import { dispatchNotification } from '../notifications';
import { recordAuditEvent } from '../auditLogger';
import { ReferralEngine } from '../referrals/referralEngine';

export interface FulfillmentResult {
  success: boolean;
  orderId: string;
  internalOrderId: string;
  planId: string;
  tokenAllowance: string;
  apiKeyId?: string;
  displayKey?: string;
  rawKeySecret?: string;
  inventoryItemId?: string;
  subscriptionId?: string;
  isRenewal?: boolean;
  fulfillmentStatus?: string;
  alreadyFulfilled?: boolean;
  error?: string;
}

// Generate high-entropy customer production API key
function generateCustomerApiKey(): { rawKeySecret: string; keyPrefix: string; keyHash: string; displayKey: string } {
  const keyPrefix = 'ld_live_';
  const randomEntropy = crypto.randomBytes(24).toString('hex'); // 48 chars
  const rawKeySecret = `${keyPrefix}${randomEntropy}`;
  const keyHash = crypto.createHash('sha256').update(rawKeySecret).digest('hex');
  const displayKey = `${keyPrefix}${randomEntropy.substring(0, 6)}...${randomEntropy.substring(randomEntropy.length - 4)}`;
  return { rawKeySecret, keyPrefix, keyHash, displayKey };
}

/**
 * ============================================================================
 * ⚡ UNIVERSAL FULFILLMENT ENGINE — LIGHTNINGAPI.PRO
 * ============================================================================
 * Coordinates automatic key provisioning, inventory credential assignment,
 * subscription activation & extension, retry limits, and admin manual queues.
 */
export async function fulfillOrder(internalOrderId: string): Promise<FulfillmentResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { internalOrderId },
      include: { user: true },
    });

    if (!order) {
      return { success: false, orderId: '', internalOrderId, planId: '', tokenAllowance: '0', error: 'Internal order not found.' };
    }

    // 1. Idempotency: One Order = One Fulfillment
    if (order.fulfillmentStatus === 'FULFILLED') {
      let displayKey = '';
      if (order.fulfilledApiKeyId) {
        const existingKey = await prisma.apiKey.findUnique({ where: { id: order.fulfilledApiKeyId } });
        displayKey = existingKey?.displayKey || '';
      }

      return {
        success: true,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: order.tokenQuantity.toString(),
        apiKeyId: order.fulfilledApiKeyId || undefined,
        displayKey,
        fulfillmentStatus: 'FULFILLED',
        alreadyFulfilled: true,
      };
    }

    // 2. Concurrency Lock: Transition to FULFILLMENT_PROCESSING atomically
    const lockUpdate = await prisma.order.updateMany({
      where: {
        id: order.id,
        fulfillmentStatus: { notIn: ['FULFILLED', 'FULFILLMENT_PROCESSING', 'PROCESSING'] },
      },
      data: {
        fulfillmentStatus: 'FULFILLMENT_PROCESSING',
        lastFulfillmentAttemptAt: new Date(),
        fulfillmentAttempts: { increment: 1 },
      },
    });

    if (lockUpdate.count === 0 && order.fulfillmentStatus !== 'FULFILLMENT_PROCESSING' && order.fulfillmentStatus !== 'PROCESSING') {
      const freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
      if (freshOrder?.fulfillmentStatus === 'FULFILLED') {
        const existingKey = freshOrder.fulfilledApiKeyId
          ? await prisma.apiKey.findUnique({ where: { id: freshOrder.fulfilledApiKeyId } })
          : null;

        return {
          success: true,
          orderId: order.id,
          internalOrderId: order.internalOrderId,
          planId: order.planId,
          tokenAllowance: order.tokenQuantity.toString(),
          apiKeyId: freshOrder.fulfilledApiKeyId || undefined,
          displayKey: existingKey?.displayKey || '',
          fulfillmentStatus: 'FULFILLED',
          alreadyFulfilled: true,
        };
      }
    }

    // 3. Verify Payment Status (Must be CAPTURED or AUTHORIZED)
    if (order.paymentStatus !== 'CAPTURED' && order.paymentStatus !== 'AUTHORIZED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { fulfillmentStatus: 'FULFILLMENT_PENDING' },
      });
      return {
        success: false,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: order.tokenQuantity.toString(),
        fulfillmentStatus: 'FULFILLMENT_PENDING',
        error: `Cannot fulfill order in payment status '${order.paymentStatus}'. Payment must be verified and captured.`,
      };
    }

    // 4. Server-Side Plan & Price Verification (DB-backed async lookup)
    const plan = await getPlanByIdAsync(order.planId);
    if (!plan) {
      const isMaxRetries = (order.fulfillmentAttempts || 0) >= 3;
      const failureStatus = isMaxRetries ? 'MANUAL_REVIEW' : 'FULFILLMENT_FAILED';

      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: failureStatus,
          failureReason: `Authoritative plan '${order.planId}' is disabled or not found.${isMaxRetries ? ' (Escalated to Manual Review after max retries)' : ''}`,
          ...(isMaxRetries && { slaPriority: 'URGENT' }),
        },
      });
      return {
        success: false,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: '0',
        fulfillmentStatus: failureStatus,
        error: `Plan '${order.planId}' is invalid or disabled.`,
      };
    }

    // 5. Verify Amount Integrity
    const expectedAmount = Math.max(0, plan.priceInr - (order.discountAmountInr || 0) - (order.creditsRedeemed || 0));
    if (order.paidAmountInr !== null && order.paidAmountInr !== undefined && order.paidAmountInr < expectedAmount) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'VERIFICATION_FAILED',
          fulfillmentStatus: 'MANUAL_REVIEW',
          failureReason: `Paid amount (₹${order.paidAmountInr}) is less than required plan price (₹${expectedAmount}).`,
        },
      });
      return {
        success: false,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: '0',
        fulfillmentStatus: 'MANUAL_REVIEW',
        error: `Payment amount mismatch. Expected ₹${expectedAmount}, received ₹${order.paidAmountInr}. Flagged for manual review.`,
      };
    }

    // 6. Branch Fulfillment by Product Fulfillment Type
    const fulfillmentType = (plan as any).fulfillmentType || 'AUTOMATIC';

    // MANUAL FULFILLMENT: Put in Admin Fulfillment Queue without failing payment
    if (fulfillmentType === 'MANUAL' || (plan as any).autoFulfillEnabled === false) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: 'FULFILLMENT_PENDING',
          fulfillmentChannel: 'MANUAL',
          status: 'PAID',
        },
      });

      await dispatchNotification({
        event: 'FULFILLMENT_STARTED',
        userId: order.userId,
        title: `Order Received: ${plan.displayName}`,
        message: `Your payment was received. Our team is provisioning your ${plan.name} access.`,
        type: 'info',
      });

      return {
        success: true,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: plan.id,
        tokenAllowance: order.tokenQuantity.toString(),
        fulfillmentStatus: 'FULFILLMENT_PENDING',
        alreadyFulfilled: false,
      };
    }

    // INVENTORY REQUIREMENT: Check and allocate inventory item
    let assignedInventoryItem: any = null;
    if ((plan as any).requiresInventory) {
      assignedInventoryItem = await InventoryService.assignInventoryItem(plan.id, order.id, order.userId);
      if (!assignedInventoryItem) {
        // Out of stock -> Do not fail payment, transition to MANUAL_REVIEW
        await prisma.order.update({
          where: { id: order.id },
          data: {
            fulfillmentStatus: 'MANUAL_REVIEW',
            failureReason: 'Out of stock - waiting for inventory restock',
            slaPriority: 'URGENT',
          },
        });

        await recordAuditEvent({
          eventType: 'INVENTORY_OUT_OF_STOCK',
          severity: 'HIGH',
          actorType: 'SYSTEM',
          customerId: order.userId,
          resourceType: 'ORDER',
          resourceId: order.id,
          action: 'ASSIGN_INVENTORY',
          result: 'FAILED',
          metadata: { planId: plan.id, internalOrderId },
        });

        return {
          success: false,
          orderId: order.id,
          internalOrderId: order.internalOrderId,
          planId: plan.id,
          tokenAllowance: '0',
          fulfillmentStatus: 'MANUAL_REVIEW',
          error: `Item is currently out of stock. Order flagged for manual review and fulfillment.`,
        };
      }
    }

    // 7. AUTOMATIC FULFILLMENT PROVISIONING: API Key + Token Ledger + Subscription
    const { rawKeySecret, keyPrefix, keyHash, displayKey } = generateCustomerApiKey();
    const tokenAllowanceBigInt = plan.tokenAllowance;
    const durationDays = (plan as any).durationDays || plan.validityDays || 30;

    let createdApiKey: any = null;

    // Check if API key is needed (Prepaid / AI gateway tokens)
    if (tokenAllowanceBigInt > 0n || plan.windowHours > 0) {
      createdApiKey = await prisma.apiKey.create({
        data: {
          userId: order.userId,
          keyPrefix,
          keyHash,
          displayKey,
          keyEncrypted: encryptText(rawKeySecret),
          name: `Claude Max ${plan.name} (${order.internalOrderId.substring(0, 8)})`,
          type: 'production',
          status: 'active',
          purchasedTokens: tokenAllowanceBigInt,
          tokensUsed: 0n,
          tokensRemaining: tokenAllowanceBigInt,
          plan: plan.name,
          rateLimitRpm: plan.rateLimitRpm || 100,
          maxConcurrency: 5,
        },
      });

      await prisma.tokenLedger.create({
        data: {
          userId: order.userId,
          apiKeyId: createdApiKey.id,
          amount: tokenAllowanceBigInt,
          balanceAfter: tokenAllowanceBigInt,
          type: 'PURCHASE',
          reference: order.internalOrderId,
          notes: `Automated fulfillment for ${plan.displayName}`,
        },
      });
    }

    // 8. SUBSCRIPTION LIFECYCLE: Activate New or Extend Existing Subscription
    let subscriptionResult: any = null;
    if ((plan as any).isSubscription !== false) {
      subscriptionResult = await activateOrRenewSubscription({
        userId: order.userId,
        planId: plan.id,
        planName: plan.name,
        orderId: order.id,
        apiKeyId: createdApiKey?.id,
        durationDays,
        existingSubscriptionId: order.subscriptionId || undefined,
        notes: `Fulfilled via ${order.internalOrderId}`,
      });
    }

    // 9. Update Order to FULFILLED state
    await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: 'FULFILLED',
        fulfilledApiKeyId: createdApiKey?.id || null,
        fulfillmentChannel: (plan as any).requiresInventory ? 'INVENTORY' : 'API_KEY',
        fulfilledAt: new Date(),
        tokensCredited: true,
        status: 'PAID',
      },
    });

    // 10. Dispatch Customer Notification
    await dispatchNotification({
      event: subscriptionResult?.isRenewal ? 'RENEWAL_SUCCESSFUL' : 'SUBSCRIPTION_ACTIVATED',
      userId: order.userId,
      title: subscriptionResult?.isRenewal
        ? `⚡ Subscription Renewed: ${plan.displayName}`
        : `⚡ Subscription Activated: ${plan.displayName}`,
      message: subscriptionResult?.isRenewal
        ? `Your ${plan.name} subscription has been extended until ${subscriptionResult.newExpiry.toLocaleDateString()}.`
        : `Your ${plan.name} plan is now active until ${subscriptionResult?.newExpiry?.toLocaleDateString() || 'next month'}.`,
      type: 'success',
      metadata: {
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        displayKey,
        subscriptionId: subscriptionResult?.subscription?.id,
      },
    });

    // 11. Authoritative Server-Side Lightning Credits Awarding (10% back, up to ₹500/transaction)
    try {
      const purchaseAmount = order.paidAmountInr ?? order.amountInr;
      await awardOrderCredits({
        userId: order.userId,
        orderId: order.id,
        purchaseAmount,
      });

      // 11b. Process Referral Reward for Referrer if Customer was Referred
      await ReferralEngine.processOrderReferralQualification({
        orderId: order.id,
        userId: order.userId,
        amountPaid: purchaseAmount,
        channel: 'WEBSITE',
      });
    } catch (rewardErr: any) {
      console.error('[REWARD ISSUANCE ERROR]', rewardErr.message);
    }

    await recordSecurityLog({
      userId: order.userId,
      email: order.user.email,
      eventType: 'ORDER_FULFILLED_API_KEY_CREATED',
      metadata: {
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: plan.id,
        apiKeyId: createdApiKey?.id,
        subscriptionId: subscriptionResult?.subscription?.id,
      },
    });

    return {
      success: true,
      orderId: order.id,
      internalOrderId: order.internalOrderId,
      planId: plan.id,
      tokenAllowance: tokenAllowanceBigInt.toString(),
      apiKeyId: createdApiKey?.id,
      displayKey,
      rawKeySecret,
      inventoryItemId: assignedInventoryItem?.id,
      subscriptionId: subscriptionResult?.subscription?.id,
      isRenewal: subscriptionResult?.isRenewal || false,
      fulfillmentStatus: 'FULFILLED',
      alreadyFulfilled: false,
    };
  } catch (err: any) {
    console.error('[FULFILLMENT ERROR]', err.message);

    try {
      await prisma.order.update({
        where: { internalOrderId },
        data: {
          fulfillmentStatus: 'FULFILLMENT_FAILED',
          failureReason: `Fulfillment exception: ${err.message}`,
        },
      });
    } catch {}

    return {
      success: false,
      orderId: '',
      internalOrderId,
      planId: '',
      tokenAllowance: '0',
      fulfillmentStatus: 'FULFILLMENT_FAILED',
      error: `Fulfillment error: ${err.message}`,
    };
  }
}

/**
 * Retries a failed or retry-required fulfillment with exponential backoff & max attempt limit.
 * Moves to MANUAL_REVIEW if attempts exceed maxRetries.
 */
export async function retryOrderFulfillment(internalOrderId: string, adminId?: string, maxRetries: number = 3) {
  const order = await prisma.order.findUnique({
    where: { internalOrderId },
  });

  if (!order) {
    throw new Error(`Order ${internalOrderId} not found.`);
  }

  if (order.fulfillmentStatus === 'FULFILLED') {
    return { success: true, message: 'Order is already fulfilled.' };
  }

  if (order.fulfillmentAttempts >= maxRetries) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: 'MANUAL_REVIEW',
        failureReason: `Exceeded maximum retry attempts (${maxRetries}). Escalated for manual review.`,
        slaPriority: 'URGENT',
      },
    });

    await recordAuditEvent({
      eventType: 'FULFILLMENT_ESCALATED_MANUAL_REVIEW',
      severity: 'HIGH',
      actorType: adminId ? 'ADMIN' : 'SYSTEM',
      adminId,
      customerId: order.userId,
      resourceType: 'ORDER',
      resourceId: order.id,
      action: 'RETRY_FULFILLMENT',
      result: 'WARNING',
      metadata: { attempts: order.fulfillmentAttempts, internalOrderId },
    });

    return {
      success: false,
      status: 'MANUAL_REVIEW',
      message: `Max retries (${maxRetries}) reached. Order moved to Manual Review queue.`,
    };
  }

  const res = await fulfillOrder(internalOrderId);

  // If this attempt failed and reached maxRetries, escalate to MANUAL_REVIEW
  const fresh = await prisma.order.findUnique({ where: { id: order.id } });
  if (fresh && fresh.fulfillmentStatus === 'FULFILLMENT_FAILED' && fresh.fulfillmentAttempts >= maxRetries) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: 'MANUAL_REVIEW',
        failureReason: `${fresh.failureReason || 'Fulfillment failed'}. Escalated after reaching ${fresh.fulfillmentAttempts} attempts.`,
        slaPriority: 'URGENT',
      },
    });

    await recordAuditEvent({
      eventType: 'FULFILLMENT_ESCALATED_MANUAL_REVIEW',
      severity: 'HIGH',
      actorType: adminId ? 'ADMIN' : 'SYSTEM',
      adminId,
      customerId: order.userId,
      resourceType: 'ORDER',
      resourceId: order.id,
      action: 'RETRY_FULFILLMENT',
      result: 'WARNING',
      metadata: { attempts: fresh.fulfillmentAttempts, internalOrderId },
    });

    return {
      success: false,
      status: 'MANUAL_REVIEW',
      message: `Max retries (${maxRetries}) reached. Order moved to Manual Review queue.`,
    };
  }

  return res;
}

/**
 * Admin Action: Manually mark an order as FULFILLED with custom notes or assigned inventory
 */
export async function adminManualFulfill(params: {
  orderId: string;
  adminId: string;
  notes?: string;
  inventoryItemId?: string;
}) {
  const { orderId, adminId, notes, inventoryItemId } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  const plan = await getPlanByIdAsync(order.planId);
  const now = new Date();

  // If inventory item specified, mark it ASSIGNED
  if (inventoryItemId) {
    await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        status: 'ASSIGNED',
        assignedOrderId: order.id,
        assignedUserId: order.userId,
        usedAt: now,
      },
    });
  }

  // Activate or extend subscription
  let subResult: any = null;
  if (plan && (plan as any).isSubscription !== false) {
    subResult = await activateOrRenewSubscription({
      userId: order.userId,
      planId: plan.id,
      planName: plan.name,
      orderId: order.id,
      durationDays: (plan as any).durationDays || plan.validityDays || 30,
      existingSubscriptionId: order.subscriptionId || undefined,
      notes: `Admin manual fulfillment: ${notes || 'Manually fulfilled'}`,
    });
  }

  // Update order to FULFILLED
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      fulfillmentStatus: 'FULFILLED',
      fulfillmentNotes: notes || order.fulfillmentNotes,
      fulfilledAt: now,
      status: 'PAID',
    },
  });

  // Award credits if not yet credited
  try {
    const purchaseAmount = order.paidAmountInr ?? order.amountInr;
    await awardOrderCredits({
      userId: order.userId,
      orderId: order.id,
      purchaseAmount,
    });
  } catch {}

  // Dispatch customer notification
  await dispatchNotification({
    event: 'FULFILLMENT_COMPLETED',
    userId: order.userId,
    title: `Order Fulfilled: ${plan?.displayName || order.planName}`,
    message: `Your order ${order.internalOrderId} has been fulfilled.`,
    type: 'success',
  });

  await recordAuditEvent({
    eventType: 'ORDER_MANUALLY_FULFILLED',
    severity: 'INFO',
    actorType: 'ADMIN',
    adminId,
    customerId: order.userId,
    resourceType: 'ORDER',
    resourceId: order.id,
    action: 'ADMIN_MANUAL_FULFILL',
    result: 'SUCCESS',
    metadata: { notes, inventoryItemId, subscriptionId: subResult?.subscription?.id },
  });

  return { success: true, order: updatedOrder, subscription: subResult?.subscription };
}
