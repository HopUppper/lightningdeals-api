import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db';
import { authenticateJwt, AuthRequest } from '../auth';
import { getAllActivePlansAsync, getPlanByIdAsync } from './plans';
import { getPaymentProvider } from './index';
import { fulfillOrder } from './fulfillment';
import { recordSecurityLog } from '../authSecurity';
import { validateCoupon, recordCouponUsage } from '../couponService';

export const checkoutRouter = Router();

// 1. GET /api/checkout/plans — Authoritative Active Server-Side Plans (DB backed + fallback)
checkoutRouter.get('/plans', async (req: Request, res: Response) => {
  try {
    // Explicitly prevent browser/proxy caching so updates in admin panel reflect immediately
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const plansList = await getAllActivePlansAsync();
    const plans = plansList.map((p) => ({
      id: p.id,
      slug: p.slug || p.id,
      name: p.name,
      displayName: p.displayName,
      tokenAllowance: p.tokenAllowance.toString(),
      tokenDisplay: p.tokenDisplay,
      windowHours: p.windowHours,
      validityDays: p.validityDays,
      priceInr: p.priceInr,
      originalPriceInr: p.originalPriceInr,
      currency: p.currency,
      tagline: p.tagline,
      badge: p.badge,
      features: p.features,
      featured: p.featured,
    }));
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 2. POST /api/checkout/validate-coupon — Realtime Server-Side Coupon Verification
checkoutRouter.post('/validate-coupon', async (req: Request, res: Response) => {
  const { code, planId } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: { type: 'invalid_request', message: 'Coupon code is required.' } });
  }

  let priceInr = 4999;
  if (planId) {
    const plan = await getPlanByIdAsync(planId);
    if (plan) {
      priceInr = plan.priceInr;
    }
  }

  const userId = (req as any).user?.id;
  const result = await validateCoupon(code, priceInr, userId, planId);

  if (!result.valid) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    coupon: result.coupon,
    discountAmountInr: result.discountAmountInr,
    finalAmountInr: result.finalAmountInr,
  });
});

// 3. GET /api/checkout/provider-health — Real Payment Provider Health Status
checkoutRouter.get('/provider-health', async (req: Request, res: Response) => {
  try {
    const provider = getPaymentProvider();
    const health = await provider.getHealthStatus();
    res.json({ success: true, provider: health });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 4. POST /api/checkout/create-order — Create Internal Order & Gateway Order (With Coupon Support)
checkoutRouter.post('/create-order', authenticateJwt, async (req: AuthRequest, res: Response) => {
  const { planId, couponCode } = req.body;

  if (!planId || typeof planId !== 'string') {
    return res.status(400).json({ error: { type: 'invalid_request', message: 'Plan ID is required.' } });
  }

  // Authoritative Server-Side Plan Lookup
  const plan = await getPlanByIdAsync(planId);
  if (!plan) {
    return res.status(400).json({ error: { type: 'invalid_plan', message: 'The selected plan is unavailable or invalid.' } });
  }

  const user = req.user!;
  let payableAmountInr = plan.priceInr;
  let discountAmountInr = 0;
  let appliedCouponId: string | null = null;
  let verifiedCouponCode: string | null = null;

  // Authoritative Server-Side Coupon Verification
  if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
    const couponValidation = await validateCoupon(couponCode, plan.priceInr, user.id, plan.id);
    if (couponValidation.valid && couponValidation.coupon) {
      discountAmountInr = couponValidation.discountAmountInr;
      payableAmountInr = couponValidation.finalAmountInr;
      appliedCouponId = couponValidation.coupon.id;
      verifiedCouponCode = couponValidation.coupon.code;
    }
  }

  const internalOrderId = `LD-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  try {
    // 1. Create Internal Order Record in DB
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
        discountAmountInr: discountAmountInr,
        couponCode: verifiedCouponCode,
        currency: plan.currency,
        paymentStatus: 'CREATED',
        fulfillmentStatus: 'NOT_FULFILLED',
        paymentGateway: getPaymentProvider().name,
      },
    });

    // 2. Create Gateway Order via Abstraction Layer with payableAmountInr
    const provider = getPaymentProvider();
    const gatewayResult = await provider.createOrder({
      internalOrderId: order.internalOrderId,
      amountInr: payableAmountInr,
      currency: plan.currency,
      planId: plan.id,
      planName: plan.name,
      customerEmail: user.email,
      customerName: user.name,
    });

    if (!gatewayResult.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', failureReason: gatewayResult.error },
      });
      return res.status(502).json({ error: { type: 'gateway_error', message: gatewayResult.error || 'Failed to initialize payment order.' } });
    }

    // Update internal order with gateway order ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PENDING',
        gatewayOrderId: gatewayResult.gatewayOrderId,
      },
    });

    // If coupon was applied, record usage tracking
    if (appliedCouponId) {
      await recordCouponUsage({
        couponId: appliedCouponId,
        userId: user.id,
        orderId: order.id,
        discountAmount: discountAmountInr,
        finalAmount: payableAmountInr,
      });
    }

    await recordSecurityLog({
      userId: user.id,
      email: user.email,
      req,
      eventType: 'ORDER_CREATED',
      metadata: {
        internalOrderId: order.internalOrderId,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        planId: plan.id,
        amountInr: payableAmountInr,
        originalAmountInr: plan.priceInr,
        discountAmountInr,
        couponCode: verifiedCouponCode,
      },
    });

    res.status(201).json({
      success: true,
      order: {
        internalOrderId: order.internalOrderId,
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
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 4. POST /api/checkout/verify — Verify Payment & Fulfill API Key
checkoutRouter.post('/verify', authenticateJwt, async (req: AuthRequest, res: Response) => {
  const { internalOrderId, gatewayOrderId, gatewayPaymentId, gatewaySignature, payload } = req.body;

  if (!internalOrderId || !gatewayOrderId) {
    return res.status(400).json({ error: { type: 'invalid_request', message: 'Internal Order ID and Gateway Order ID are required.' } });
  }

  try {
    const order = await prisma.order.findUnique({ where: { internalOrderId } });
    if (!order) {
      return res.status(404).json({ error: { type: 'order_not_found', message: 'Order not found.' } });
    }

    // IDOR Protection: User can only verify their own order
    if (order.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: { type: 'forbidden', message: 'Access denied.' } });
    }

    // Verify Payment Signature & Gateway Status
    const provider = getPaymentProvider();
    const verification = await provider.verifyPayment({
      internalOrderId,
      gatewayOrderId,
      gatewayPaymentId: gatewayPaymentId || `pay_${crypto.randomBytes(8).toString('hex')}`,
      gatewaySignature,
      payload: { ...payload, amount: order.amountInr },
    });

    if (!verification.isVerified) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'VERIFICATION_FAILED',
          failureReason: verification.failureReason || 'Payment verification failed.',
        },
      });
      return res.status(400).json({ error: { type: 'verification_failed', message: verification.failureReason || 'Payment verification failed.' } });
    }

    // Update order payment status to CAPTURED
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'CAPTURED',
        paidAmountInr: verification.paidAmount || order.amountInr,
        gatewayPaymentId: verification.gatewayPaymentId,
        gatewaySignature: gatewaySignature || null,
        paidAt: new Date(),
      },
    });

    // Execute Atomic Fulfillment
    const fulfillment = await fulfillOrder(order.internalOrderId);

    if (!fulfillment.success) {
      return res.status(500).json({
        success: false,
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FAILED',
        error: fulfillment.error || 'Payment received but key creation failed. Fulfillment queued for retry.',
      });
    }

    res.json({
      success: true,
      message: 'Payment verified and API Key provisioned successfully!',
      fulfillment: {
        orderId: fulfillment.orderId,
        internalOrderId: fulfillment.internalOrderId,
        planId: fulfillment.planId,
        tokenAllowance: fulfillment.tokenAllowance,
        displayKey: fulfillment.displayKey,
        rawKeySecret: fulfillment.rawKeySecret,
        alreadyFulfilled: fulfillment.alreadyFulfilled,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 5. POST /api/checkout/payu/response — PayU Redirection Callback (surl / furl)
checkoutRouter.all('/payu/response', async (req: Request, res: Response) => {
  const body = req.body || {};
  const query = req.query || {};
  const internalOrderId = body.txnid || body.udf3 || query.txnid?.toString();

  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://lightningapi.pro').replace(/\/$/, '');

  if (!internalOrderId) {
    return res.redirect(`${appUrl}/dashboard/orders?payment=failed&error=missing_transaction_id`);
  }

  try {
    const order = await prisma.order.findUnique({ where: { internalOrderId } });
    if (!order) {
      return res.redirect(`${appUrl}/dashboard/orders?payment=failed&error=order_not_found`);
    }

    const provider = getPaymentProvider();
    const verification = await provider.verifyPayment({
      internalOrderId,
      gatewayOrderId: internalOrderId,
      gatewayPaymentId: body.mihpayid || body.payuMoneyId || `payu_${Date.now()}`,
      payload: body,
    });

    if (verification.isVerified) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'CAPTURED',
          paidAmountInr: verification.paidAmount || order.amountInr,
          gatewayPaymentId: verification.gatewayPaymentId,
          paidAt: new Date(),
        },
      });

      const fulfillment = await fulfillOrder(order.internalOrderId);

      // Redirect to orders dashboard with key revealed parameter
      return res.redirect(`${appUrl}/dashboard/orders?order_id=${order.internalOrderId}&payment=success&key_revealed=true`);
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          failureReason: verification.failureReason || body.error_Message || 'PayU transaction cancelled or failed.',
        },
      });

      const reason = encodeURIComponent(verification.failureReason || body.error_Message || 'Payment cancelled');
      return res.redirect(`${appUrl}/dashboard/orders?order_id=${order.internalOrderId}&payment=failed&error=${reason}`);
    }
  } catch (err: any) {
    console.error('PayU callback handling error:', err);
    return res.redirect(`${appUrl}/dashboard/orders?order_id=${internalOrderId}&payment=failed&error=system_error`);
  }
});

// 5. POST /api/webhooks/payment — Generic Webhook Architecture (Signature Verified & Idempotent)
export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    const provider = getPaymentProvider();
    const webhookResult = await provider.verifyWebhook(req);

    if (!webhookResult.isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature or event.' });
    }

    const eventId = webhookResult.rawEventId || `evt_${crypto.randomBytes(8).toString('hex')}`;

    // Webhook Idempotency Check
    const existingEvent = await prisma.paymentEvent.findUnique({ where: { eventId } });
    if (existingEvent) {
      return res.status(200).json({ status: 'ALREADY_PROCESSED', message: 'Webhook event already processed.' });
    }

    // Store Event in DB
    await prisma.paymentEvent.create({
      data: {
        eventId,
        provider: provider.name,
        eventType: webhookResult.eventType,
        gatewayOrderId: webhookResult.gatewayOrderId,
        gatewayPaymentId: webhookResult.gatewayPaymentId,
      },
    });

    if (webhookResult.eventType === 'payment.captured' && webhookResult.internalOrderId) {
      const order = await prisma.order.findUnique({ where: { internalOrderId: webhookResult.internalOrderId } });
      if (order && order.fulfillmentStatus !== 'FULFILLED') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'CAPTURED',
            paidAmountInr: webhookResult.paidAmount || order.amountInr,
            gatewayPaymentId: webhookResult.gatewayPaymentId,
            paidAt: new Date(),
          },
        });
        await fulfillOrder(order.internalOrderId);
      }
    }

    res.status(200).json({ status: 'SUCCESS', message: 'Webhook processed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
