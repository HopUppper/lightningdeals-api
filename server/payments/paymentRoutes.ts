import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db';
import { authenticateJwt, AuthRequest } from '../auth';
import { getAllActivePlansAsync, getPlanByIdAsync } from './plans';
import { getPaymentProvider } from './index';
import { fulfillOrder } from './fulfillment';
import { recordSecurityLog } from '../authSecurity';
import { validateCoupon, recordCouponUsage } from '../couponService';
import { redeemCredits } from '../rewards/rewardService';
import { OrderEngine } from '../orders/orderEngine';

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
  const { planId, couponCode, redeemCredits } = req.body;

  if (!planId || typeof planId !== 'string') {
    return res.status(400).json({ error: { type: 'invalid_request', message: 'Plan ID is required.' } });
  }

  try {
    const result = await OrderEngine.createWebsiteOrder({
      userId: req.user!.id,
      planId,
      couponCode,
      redeemCredits,
      customerPhone: req.body.phone,
      req,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: { type: 'order_creation_failed', message: err.message } });
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

    const eventId = verification.gatewayPaymentId ? `verify_evt_${verification.gatewayPaymentId}` : `verify_tx_${internalOrderId}_${Date.now()}`;

    // Process through authoritative Universal Order Engine
    const result = await OrderEngine.processPaymentEvent({
      provider: provider.name,
      eventId,
      eventType: 'payment.captured',
      internalOrderId,
      gatewayOrderId,
      gatewayPaymentId: verification.gatewayPaymentId,
      paidAmount: verification.paidAmount || order.amountInr,
      rawPayload: payload || {},
      signature: gatewaySignature,
      source: 'DIRECT_VERIFY',
      req,
    });

    if (!result.success || result.paymentStatus !== 'CAPTURED') {
      return res.status(500).json({
        success: false,
        error: result.failureReason || 'Payment capture failed.',
      });
    }

    res.json({
      success: true,
      message: 'Payment verified and API Key provisioned successfully!',
      fulfillment: result.fulfillment,
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
    const result = await OrderEngine.verifyAndProcessPayUCallback(req, 'REDIRECT_CALLBACK');

    if (result.success && result.paymentStatus === 'CAPTURED') {
      return res.redirect(`${appUrl}/dashboard/orders?order_id=${internalOrderId}&payment=success&key_revealed=true`);
    } else {
      const reason = encodeURIComponent(result.failureReason || body.error_Message || 'Payment cancelled');
      return res.redirect(`${appUrl}/dashboard/orders?order_id=${internalOrderId}&payment=failed&error=${reason}`);
    }
  } catch (err: any) {
    console.error('PayU callback handling error:', err);
    return res.redirect(`${appUrl}/dashboard/orders?order_id=${internalOrderId}&payment=failed&error=${encodeURIComponent(err.message || 'system_error')}`);
  }
});

// 6. POST /api/webhooks/payment & /api/webhooks/payu — Server Webhooks (Idempotent Single Source of Truth)
export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    const result = await OrderEngine.verifyAndProcessPayUCallback(req, 'WEBHOOK');
    res.status(200).json({ status: 'SUCCESS', ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
