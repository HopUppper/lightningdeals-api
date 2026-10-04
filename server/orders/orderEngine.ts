import crypto from 'crypto';
import { Request } from 'express';
import { prisma } from '../db';
import { getPaymentProvider } from '../payments';
import { getPlanByIdAsync } from '../payments/plans';
import { fulfillOrder } from '../payments/fulfillment';
import { validateCoupon, recordCouponUsage } from '../couponService';
import {
  calculateReward,
  awardOrderCredits,
  redeemCredits,
  reverseOrderCredits,
} from '../rewards/rewardService';
import { recordAuditEvent } from '../auditLogger';
import { recordSecurityLog } from '../authSecurity';
import { InventoryService } from '../inventory/inventoryService';

export interface CreateWebsiteOrderParams {
  userId: string;
  planId: string;
  couponCode?: string;
  redeemCredits?: number;
  customerPhone?: string;
  subscriptionId?: string;
  req?: Request;
}

export interface CreateExternalOrderParams {
  customerIdentifier: string; // email, phone, or userId
  productName: string;
  amountPaid: number;
  channel?: 'WEBSITE' | 'WHATSAPP' | 'MANUAL' | 'CRM' | 'OTHER';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  referenceId?: string;
  notes?: string;
  description?: string;
  purchaseDate?: Date;
  status?: 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED';
  planId?: string;
  autoFulfill?: boolean;
  createdBy?: string;
}

export interface ProcessPaymentEventParams {
  provider: string;
  eventId: string;
  eventType: string; // 'payment.captured' | 'payment.failed'
  internalOrderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  paidAmount: number;
  rawPayload: Record<string, any>;
  signature?: string;
  source: 'WEBHOOK' | 'REDIRECT_CALLBACK' | 'DIRECT_VERIFY' | 'ADMIN_RECONCILE';
  req?: Request;
}

/**
 * ============================================================================
 * UNIVERSAL ORDER ENGINE — LIGHTNINGAPI.PRO
 * ============================================================================
 * Single authoritative service orchestrating the complete lifecycle:
 * PAYMENT -> VERIFIED -> ORDER CREATED/UPDATED -> ORDER COMPLETED ->
 * FULFILLMENT -> LIGHTNING REWARD -> CUSTOMER UPDATE -> NOTIFICATION -> AUDIT LOG
 */
export class OrderEngine {
  /**
   * 1. CREATE WEBSITE ORDER (From Checkout Flow)
   * Handles plan validation, coupon deduction, credit redemption, internal order ID generation,
   * gateway order creation, and ₹0-payable immediate fulfillment.
   */
  static async createWebsiteOrder(params: CreateWebsiteOrderParams) {
    const { userId, planId, couponCode, redeemCredits: requestedRedeemCredits, customerPhone, subscriptionId, req } = params;

    // 1. Authoritative Plan Lookup
    const plan = await getPlanByIdAsync(planId);
    if (!plan) {
      throw new Error(`The selected plan '${planId}' is unavailable or inactive.`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error(`Customer account '${userId}' not found.`);
    }

    let payableAmountInr = plan.priceInr;
    let discountAmountInr = 0;
    let appliedCouponId: string | null = null;
    let verifiedCouponCode: string | null = null;

    // 2. Authoritative Coupon Verification
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const couponValidation = await validateCoupon(couponCode, plan.priceInr, user.id, plan.id);
      if (couponValidation.valid && couponValidation.coupon) {
        discountAmountInr = couponValidation.discountAmountInr;
        payableAmountInr = couponValidation.finalAmountInr;
        appliedCouponId = couponValidation.coupon.id;
        verifiedCouponCode = couponValidation.coupon.code;
      }
    }

    // 3. Authoritative Lightning Credits Redemption
    let creditsToRedeem = 0;
    if (requestedRedeemCredits && Number(requestedRedeemCredits) > 0) {
      const userBalance = user.availableCredits || 0;
      const requested = Math.round(Number(requestedRedeemCredits) * 100) / 100;
      if (requested > userBalance) {
        throw new Error(
          `Requested credit redemption (₹${requested.toLocaleString()}) exceeds your available balance (₹${userBalance.toLocaleString()}).`
        );
      }
      creditsToRedeem = Math.min(requested, payableAmountInr);
      payableAmountInr = Math.max(0, Math.round((payableAmountInr - creditsToRedeem) * 100) / 100);
    }

    const internalOrderId = `LD-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 4. Create Internal Order Record
    const order = await prisma.order.create({
      data: {
        internalOrderId,
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        tokenQuantity: plan.tokenAllowance,
        windowHours: plan.windowHours,
        amountInr: payableAmountInr,
        originalAmountInr: plan.priceInr,
        discountAmountInr,
        couponCode: verifiedCouponCode,
        creditsRedeemed: creditsToRedeem,
        currency: plan.currency,
        subscriptionId: subscriptionId || null,
        paymentStatus: payableAmountInr === 0 ? 'CAPTURED' : 'CREATED',
        fulfillmentStatus: 'NOT_FULFILLED',
        paymentGateway: payableAmountInr === 0 ? 'LIGHTNING_CREDITS' : getPaymentProvider().name,
      },
    });

    // 5. Atomically Deduct Credits if Applied
    if (creditsToRedeem > 0) {
      await redeemCredits({
        userId: user.id,
        orderId: order.id,
        amountToRedeem: creditsToRedeem,
      });
    }

    // 6. Record Coupon Usage
    if (appliedCouponId) {
      await recordCouponUsage({
        couponId: appliedCouponId,
        userId: user.id,
        orderId: order.id,
        discountAmount: discountAmountInr,
        finalAmount: payableAmountInr,
      });
    }

    // 7. Instant Fulfillment if Entire Order was Covered by Credits (₹0 Payable)
    if (payableAmountInr === 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paidAmountInr: 0,
          paidAt: new Date(),
          status: 'PAID',
        },
      });

      const fulfillment = await fulfillOrder(order.internalOrderId);

      await recordAuditEvent({
        eventType: 'ORDER_PAID_WITH_CREDITS',
        severity: 'INFO',
        actorType: 'CUSTOMER',
        actorId: user.id,
        actorEmail: user.email,
        customerId: user.id,
        resourceType: 'ORDER',
        resourceId: order.id,
        action: 'ORDER_FULFILLED_ZERO_PAYABLE',
        result: 'SUCCESS',
        metadata: {
          internalOrderId: order.internalOrderId,
          planId: plan.id,
          creditsRedeemed: creditsToRedeem,
          fulfillmentSuccess: fulfillment.success,
        },
        req,
      });

      return {
        order: {
          id: order.id,
          internalOrderId: order.internalOrderId,
          planId: plan.id,
          amountInr: 0,
          originalAmountInr: plan.priceInr,
          discountAmountInr,
          creditsRedeemed: creditsToRedeem,
          paymentStatus: 'CAPTURED',
          zeroAmountPaid: true,
        },
        fulfillment,
      };
    }

    // 8. Sanitize phone
    let rawPhone = (customerPhone || user.phone || '').toString().trim();
    let sanitizedPhone = rawPhone.replace(/\D/g, '');
    if (sanitizedPhone.length === 12 && sanitizedPhone.startsWith('91')) {
      sanitizedPhone = sanitizedPhone.slice(2);
    }
    if (sanitizedPhone.length > 10) {
      sanitizedPhone = sanitizedPhone.slice(-10);
    }
    if (sanitizedPhone && /^[6-9]\d{9}$/.test(sanitizedPhone) && !user.phone) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: sanitizedPhone },
        });
      } catch {}
    }

    // 9. Create Gateway Order via Provider (PayU)
    const provider = getPaymentProvider();
    const gatewayResult = await provider.createOrder({
      internalOrderId: order.internalOrderId,
      amountInr: payableAmountInr,
      currency: plan.currency,
      planId: plan.id,
      planName: plan.name,
      customerEmail: user.email,
      customerName: user.name,
      customerPhone: sanitizedPhone || undefined,
    });

    if (!gatewayResult.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', failureReason: gatewayResult.error },
      });
      throw new Error(gatewayResult.error || 'Failed to initialize payment gateway order.');
    }

    // Update order with gateway order ID and set paymentStatus PENDING
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PENDING',
        gatewayOrderId: gatewayResult.gatewayOrderId,
      },
    });

    await recordAuditEvent({
      eventType: 'ORDER_CREATED',
      severity: 'INFO',
      actorType: 'CUSTOMER',
      actorId: user.id,
      actorEmail: user.email,
      customerId: user.id,
      resourceType: 'ORDER',
      resourceId: order.id,
      action: 'INITIATE_PAYMENT',
      result: 'SUCCESS',
      metadata: {
        internalOrderId: order.internalOrderId,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        planId: plan.id,
        amountInr: payableAmountInr,
        creditsRedeemed: creditsToRedeem,
      },
      req,
    });

    return {
      order: {
        internalOrderId: updatedOrder.internalOrderId,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        planId: plan.id,
        planName: plan.name,
        amountInr: payableAmountInr,
        originalAmountInr: plan.priceInr,
        discountAmountInr,
        couponCode: verifiedCouponCode,
        currency: plan.currency,
        checkoutUrl: gatewayResult.checkoutUrl,
        metadata: gatewayResult.metadata,
      },
    };
  }

  /**
   * 2. CREATE EXTERNAL ORDER (WhatsApp / Manual / CRM Integration)
   * Ingests orders and purchases from outside the web checkout.
   * Enforces customer linking, purchase tracking, and optional key provisioning.
   */
  static async createExternalOrder(params: CreateExternalOrderParams) {
    const {
      customerIdentifier,
      productName,
      amountPaid,
      channel = 'WHATSAPP',
      customerName,
      customerPhone,
      customerEmail,
      referenceId,
      notes,
      description,
      purchaseDate = new Date(),
      status = 'COMPLETED',
      planId,
      autoFulfill = false,
      createdBy = 'SYSTEM',
    } = params;

    const identifier = customerIdentifier.trim();
    if (!identifier) {
      throw new Error('Customer identifier (email, phone, or userId) is required.');
    }
    if (!productName || !productName.trim()) {
      throw new Error('Product name is required.');
    }
    const cleanAmount = Number(amountPaid);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      throw new Error('Valid positive amount is required.');
    }

    // 1. Resolve or Create User
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { phone: { equals: identifier } },
          { id: { equals: identifier } },
        ],
      },
    });

    if (!user) {
      // Auto-provision user account for external buyers if valid email provided
      const targetEmail = (customerEmail || (identifier.includes('@') ? identifier : '')).trim().toLowerCase();
      if (!targetEmail) {
        throw new Error(
          `Customer '${identifier}' not found. External purchases require a registered customer email or user ID to assign Lightning Credits.`
        );
      }

      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: customerName?.trim() || identifier.split('@')[0],
          phone: customerPhone?.trim() || (identifier.match(/^\+?\d{10,12}$/) ? identifier : null),
          passwordHash: crypto.randomBytes(32).toString('hex'), // Temporary random hash, user resets via forgot password
          emailVerified: true,
          status: 'active',
        },
      });
    }

    const internalOrderId = referenceId?.trim() || `LD-${channel.toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 2. Check Idempotency by referenceId
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        referenceId: internalOrderId,
      },
    });

    if (existingPurchase) {
      return {
        success: true,
        isDuplicate: true,
        purchase: existingPurchase,
        message: 'Order with this reference ID already exists.',
      };
    }

    // 3. Create Order and Purchase records atomically
    return await prisma.$transaction(async (tx) => {
      // Find associated plan if planId supplied
      let planRecord = planId ? await tx.plan.findUnique({ where: { id: planId } }) : null;
      if (!planRecord && planId) {
        planRecord = await tx.plan.findFirst({ where: { name: { equals: planId, mode: 'insensitive' } } });
      }

      const order = await tx.order.create({
        data: {
          internalOrderId,
          userId: user.id,
          planId: planRecord?.id || 'external_plan',
          planName: planRecord?.name || productName,
          tokenQuantity: planRecord?.tokenAllowance || 5000000n,
          windowHours: planRecord?.windowHours || 5,
          amountInr: cleanAmount,
          paidAmountInr: status === 'COMPLETED' ? cleanAmount : null,
          currency: 'INR',
          paymentStatus: status === 'COMPLETED' ? 'CAPTURED' : 'PENDING',
          fulfillmentStatus: 'NOT_FULFILLED',
          paymentGateway: channel.toUpperCase(),
          paidAt: status === 'COMPLETED' ? new Date() : null,
          status: status === 'COMPLETED' ? 'PAID' : 'PENDING',
        },
      });

      // Calculate Lightning Credits
      let creditsEarned = 0;
      if (status === 'COMPLETED') {
        const rewardCalc = await calculateReward(cleanAmount);
        creditsEarned = rewardCalc.rewardCredits;
      }

      const purchase = await tx.purchase.create({
        data: {
          userId: user.id,
          orderId: order.id,
          productName,
          description: description || `${productName} via ${channel}`,
          amountPaid: cleanAmount,
          channel: channel.toUpperCase(),
          purchaseDate,
          status: status.toUpperCase(),
          creditsEarned,
          referenceId: internalOrderId,
          notes,
          createdBy,
        },
      });

      // Award Lightning Credits if COMPLETED and creditsEarned > 0
      if (status === 'COMPLETED' && creditsEarned > 0) {
        const currentBalance = user.availableCredits || 0;
        const balanceAfter = Math.round((currentBalance + creditsEarned) * 100) / 100;
        const newLifetimeEarned = Math.round(((user.lifetimeCreditsEarned || 0) + creditsEarned) * 100) / 100;

        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            orderId: order.id,
            purchaseId: purchase.id,
            channel: channel.toUpperCase(),
            referenceId: internalOrderId,
            type: 'PURCHASE_REWARD',
            amount: creditsEarned,
            balanceBefore: currentBalance,
            balanceAfter,
            description: `${productName} (${channel}) - 10% Lightning Credits earned`,
            status: 'COMPLETED',
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            availableCredits: balanceAfter,
            lifetimeCreditsEarned: newLifetimeEarned,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { creditsEarned },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            title: '⚡ Lightning Credits Earned!',
            message: `You earned ₹${creditsEarned.toLocaleString()} Lightning Credits from your ${channel} purchase!`,
            type: 'success',
          },
        });
      }

      // Record Audit Event
      await recordAuditEvent({
        eventType: 'EXTERNAL_ORDER_INGESTED',
        severity: 'INFO',
        actorType: 'SYSTEM',
        customerId: user.id,
        resourceType: 'ORDER',
        resourceId: order.id,
        action: 'INGEST_EXTERNAL_ORDER',
        result: 'SUCCESS',
        metadata: {
          channel,
          productName,
          amountPaid: cleanAmount,
          internalOrderId,
          creditsEarned,
          createdBy,
        },
      });

      // Auto-fulfill API Key if requested and status is COMPLETED
      let fulfillmentResult = null;
      if (autoFulfill && status === 'COMPLETED') {
        fulfillmentResult = await fulfillOrder(order.internalOrderId);
      }

      return {
        success: true,
        isDuplicate: false,
        order,
        purchase,
        creditsAwarded: creditsEarned,
        fulfillment: fulfillmentResult,
      };
    });
  }

  /**
   * 3. PROCESS PAYMENT EVENT (Strictly Idempotent Single Source of Truth)
   * Coordinates PayU webhooks and browser redirect callbacks.
   * If arriving 1, 2, 5, or 10 times, guarantees exactly one fulfillment and reward.
   */
  static async processPaymentEvent(params: ProcessPaymentEventParams) {
    const {
      provider,
      eventId,
      eventType,
      internalOrderId,
      gatewayOrderId,
      gatewayPaymentId,
      paidAmount,
      rawPayload,
      signature,
      source,
      req,
    } = params;

    // 1. Check Existing Event Idempotency
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return {
        success: true,
        alreadyProcessed: true,
        status: 'ALREADY_PROCESSED',
        eventId,
        message: 'Payment event was previously processed.',
      };
    }

    // 2. Fetch Order
    const order = await prisma.order.findUnique({
      where: { internalOrderId },
      include: { user: true },
    });

    if (!order) {
      throw new Error(`Order '${internalOrderId}' not found in database.`);
    }

    // 3. Check Order State Idempotency:
    // If order is already CAPTURED and FULFILLED, log event and return cleanly
    if (order.paymentStatus === 'CAPTURED' && order.fulfillmentStatus === 'FULFILLED') {
      try {
        await prisma.paymentEvent.create({
          data: {
            eventId,
            provider,
            eventType,
            gatewayOrderId,
            gatewayPaymentId,
            payloadHash: crypto.createHash('sha256').update(JSON.stringify(rawPayload)).digest('hex'),
          },
        });
      } catch {}

      return {
        success: true,
        alreadyProcessed: true,
        order,
        message: 'Order already captured and fulfilled.',
      };
    }

    // 4. Record Payment Event in Database
    try {
      await prisma.paymentEvent.create({
        data: {
          eventId,
          provider,
          eventType,
          gatewayOrderId,
          gatewayPaymentId,
          payloadHash: crypto.createHash('sha256').update(JSON.stringify(rawPayload)).digest('hex'),
        },
      });
    } catch (e: any) {
      // If unique eventId collision occurs right now, another worker processed it
      if (e.code === 'P2002') {
        return {
          success: true,
          alreadyProcessed: true,
          status: 'ALREADY_PROCESSED',
        };
      }
    }

    const isSuccess = eventType === 'payment.captured' || rawPayload.status === 'success' || rawPayload.status === 'captured';

    // 5. Handle Payment Success
    if (isSuccess) {
      const verifiedAmount = paidAmount > 0 ? paidAmount : order.amountInr;

      // Update Order to CAPTURED
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'CAPTURED',
          paidAmountInr: verifiedAmount,
          gatewayPaymentId: gatewayPaymentId || order.gatewayPaymentId,
          gatewaySignature: signature || null,
          paidAt: new Date(),
          status: 'PAID',
        },
      });

      // 6. Decoupled Safe Fulfillment
      // Even if API key creation fails or experiences transient issue, payment stays CAPTURED
      let fulfillmentResult: any = null;
      try {
        fulfillmentResult = await fulfillOrder(order.internalOrderId);
      } catch (fulErr: any) {
        console.error(`[ORDER ENGINE] Fulfillment error for ${internalOrderId}:`, fulErr.message);
        await prisma.order.update({
          where: { id: order.id },
          data: {
            fulfillmentStatus: 'RETRY_REQUIRED',
            failureReason: `Fulfillment error: ${fulErr.message}`,
          },
        });

        await recordAuditEvent({
          eventType: 'ORDER_FULFILLMENT_FAILED',
          severity: 'HIGH',
          actorType: 'SYSTEM',
          customerId: order.userId,
          resourceType: 'ORDER',
          resourceId: order.id,
          action: 'AUTOMATED_FULFILLMENT',
          result: 'FAILED',
          failureReason: fulErr.message,
          metadata: {
            internalOrderId,
            source,
            gatewayPaymentId,
          },
          req,
        });
      }

      // 7. Synchronize Universal Purchase Record
      try {
        let purchase = await prisma.purchase.findFirst({
          where: {
            OR: [{ orderId: order.id }, { referenceId: order.internalOrderId }],
          },
        });

        if (!purchase) {
          purchase = await prisma.purchase.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              productName: order.planName || 'API Subscription',
              description: `Website purchase - ${order.planName}`,
              amountPaid: verifiedAmount,
              channel: 'WEBSITE',
              status: 'COMPLETED',
              creditsEarned: order.creditsEarned || 0,
              creditsRedeemed: order.creditsRedeemed || 0,
              referenceId: order.internalOrderId,
              createdBy: source,
            },
          });
        } else if (purchase.status !== 'COMPLETED') {
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              status: 'COMPLETED',
              amountPaid: verifiedAmount,
            },
          });
        }
      } catch (purchErr: any) {
        console.error(`[ORDER ENGINE] Purchase sync error:`, purchErr.message);
      }

      // 8. Record Completion Audit Event
      await recordAuditEvent({
        eventType: 'PAYMENT_VERIFIED_AND_CAPTURED',
        severity: 'INFO',
        actorType: 'PAYMENT_PROVIDER',
        actorId: provider,
        customerId: order.userId,
        resourceType: 'ORDER',
        resourceId: order.id,
        action: 'CAPTURE_PAYMENT',
        result: 'SUCCESS',
        metadata: {
          internalOrderId,
          gatewayPaymentId,
          verifiedAmount,
          source,
          fulfillmentSuccess: fulfillmentResult?.success ?? false,
        },
        req,
      });

      return {
        success: true,
        alreadyProcessed: false,
        paymentStatus: 'CAPTURED',
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        fulfillment: fulfillmentResult,
      };
    } else {
      // 9. Handle Payment Failure
      const failureReason = rawPayload.error_Message || rawPayload.unmappedstatus || 'Transaction failed or cancelled on gateway.';

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'FAILED',
          failureReason,
        },
      });

      await recordAuditEvent({
        eventType: 'PAYMENT_FAILED',
        severity: 'MEDIUM',
        actorType: 'PAYMENT_PROVIDER',
        actorId: provider,
        customerId: order.userId,
        resourceType: 'ORDER',
        resourceId: order.id,
        action: 'PAYMENT_ATTEMPT',
        result: 'FAILED',
        failureReason,
        metadata: {
          internalOrderId,
          gatewayPaymentId,
          source,
        },
        req,
      });

      return {
        success: false,
        paymentStatus: 'FAILED',
        failureReason,
        internalOrderId,
      };
    }
  }

  /**
   * 4. VERIFY AND PROCESS PAYU CALLBACK / WEBHOOK
   * Normalizes incoming PayU request from browser redirect (surl/furl) or server webhook,
   * performs cryptographic SHA-512 reverse hash verification with fallback to verify_payment API,
   * and routes through processPaymentEvent.
   */
  static async verifyAndProcessPayUCallback(req: Request, source: 'REDIRECT_CALLBACK' | 'WEBHOOK') {
    const body = req.body || {};
    const query = req.query || {};

    const internalOrderId = body.txnid || body.udf3 || query.txnid?.toString();
    const gatewayPaymentId = body.mihpayid || body.payuMoneyId || '';
    const rawStatus = (body.status || query.status || '').toString().toLowerCase();

    if (!internalOrderId) {
      throw new Error('Missing transaction identifier (txnid) in PayU callback.');
    }

    const provider = getPaymentProvider();

    // 1. Verify Payment via PayU Adapter (Reverse Hash + verify_payment API fallback)
    const verification = await provider.verifyPayment({
      internalOrderId,
      gatewayOrderId: internalOrderId,
      gatewayPaymentId: gatewayPaymentId || `payu_${Date.now()}`,
      payload: body,
    });

    const eventId = gatewayPaymentId ? `payu_evt_${gatewayPaymentId}` : `payu_tx_${internalOrderId}_${Date.now()}`;
    const eventType = verification.isVerified ? 'payment.captured' : 'payment.failed';
    const paidAmount = verification.paidAmount || Number(body.amount || 0);

    return await this.processPaymentEvent({
      provider: 'PAYU',
      eventId,
      eventType,
      internalOrderId,
      gatewayOrderId: internalOrderId,
      gatewayPaymentId: verification.gatewayPaymentId || gatewayPaymentId,
      paidAmount,
      rawPayload: body,
      source,
      req,
    });
  }

  /**
   * 5. REFUND ORDER & REVERSE CREDITS
   * Reverses order status, claws back awarded Lightning Credits,
   * restores redeemed credits, and revokes/suspends API key.
   */
  static async refundOrder(params: {
    internalOrderId: string;
    reason: string;
    adminUserId?: string;
    req?: Request;
  }) {
    const { internalOrderId, reason, adminUserId, req } = params;

    const order = await prisma.order.findUnique({
      where: { internalOrderId },
      include: { user: true },
    });

    if (!order) {
      throw new Error(`Order '${internalOrderId}' not found.`);
    }

    // 1. Reverse Lightning Credits (Clawback earned + restore redeemed)
    const rewardReversal = await reverseOrderCredits({
      orderId: order.id,
      reason,
      adminUserId,
    });

    // 2. Revoke / Suspend ApiKey if provisioned
    if (order.fulfilledApiKeyId) {
      await prisma.apiKey.update({
        where: { id: order.fulfilledApiKeyId },
        data: { status: 'revoked' },
      });
    }

    // 3. Expire Subscriptions
    await prisma.subscription.updateMany({
      where: { orderId: order.id },
      data: { status: 'CANCELLED' },
    });

    // 3b. Release Assigned Inventory Items if Any
    try {
      const assignedItems = await prisma.inventoryItem.findMany({
        where: { assignedOrderId: order.id },
      });
      for (const item of assignedItems) {
        await InventoryService.releaseInventoryItem(item.id, `Order refund: ${reason}`);
      }
    } catch (invErr: any) {
      console.error('[INVENTORY RELEASE ERROR]', invErr.message);
    }

    // 4. Update Order Status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
        failureReason: `Refunded: ${reason}`,
      },
    });

    // 5. Update Universal Purchase Status
    await prisma.purchase.updateMany({
      where: { orderId: order.id },
      data: { status: 'REFUNDED' },
    });

    // 6. Audit Trail
    await recordAuditEvent({
      eventType: 'ORDER_REFUNDED',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: adminUserId,
      customerId: order.userId,
      resourceType: 'ORDER',
      resourceId: order.id,
      action: 'PROCESS_REFUND',
      result: 'SUCCESS',
      metadata: {
        internalOrderId,
        reason,
        rewardReversal,
      },
      req,
    });

    return {
      success: true,
      order: updatedOrder,
      rewardReversal,
    };
  }

  /**
   * 6. RETRY FULFILLMENT (Manual Admin Action or Safe Recovery)
   */
  static async retryFulfillment(internalOrderId: string, adminUserId?: string, req?: Request) {
    const order = await prisma.order.findUnique({
      where: { internalOrderId },
    });

    if (!order) {
      throw new Error(`Order '${internalOrderId}' not found.`);
    }

    if (order.paymentStatus !== 'CAPTURED' && order.paymentStatus !== 'AUTHORIZED') {
      throw new Error(`Cannot fulfill order in payment status '${order.paymentStatus}'. Payment must be captured.`);
    }

    const fulfillment = await fulfillOrder(order.internalOrderId);

    if (fulfillment.success) {
      await recordAuditEvent({
        eventType: 'ORDER_FULFILLMENT_RETRIED',
        severity: 'INFO',
        actorType: adminUserId ? 'ADMIN' : 'SYSTEM',
        actorId: adminUserId,
        customerId: order.userId,
        resourceType: 'ORDER',
        resourceId: order.id,
        action: 'RETRY_FULFILLMENT',
        result: 'SUCCESS',
        metadata: {
          internalOrderId,
          apiKeyId: fulfillment.apiKeyId,
        },
        req,
      });
    }

    return fulfillment;
  }
}
