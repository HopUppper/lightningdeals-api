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

// 7. GET /pay/:orderId & /api/checkout/pay/:orderId — Realtime PayU Gateway Auto-Submission Page
export async function handlePayUOrderRedirect(req: Request, res: Response) {
  const orderIdParam = req.params.orderId;
  if (!orderIdParam) {
    return res.status(400).send('Order ID is required.');
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { internalOrderId: orderIdParam },
          { id: orderIdParam },
        ],
      },
      include: { user: true },
    });

    if (!order) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Not Found — Lightning Deals</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; }
            h1 { font-size: 20px; margin: 0 0 12px; color: #ef4444; }
            p { color: #a3a3a3; font-size: 14px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Order Not Found</h1>
            <p>We could not locate order <strong>${orderIdParam}</strong>. Please check your order details or contact our team on WhatsApp.</p>
          </div>
        </body>
        </html>
      `);
    }

    // If order already paid
    if (['PAID', 'CAPTURED'].includes(order.paymentStatus) || order.status === 'PAID') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Payment Completed — Lightning Deals</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; }
            .badge { display: inline-block; background: #10b98120; color: #10b981; border: 1px solid #10b98140; padding: 6px 14px; border-radius: 999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            p { color: #a3a3a3; font-size: 14px; line-height: 1.5; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">✓ Payment Already Verified</div>
            <h1>Order #${order.internalOrderId}</h1>
            <p>Your payment for <strong>${order.planName}</strong> (₹${order.amountInr.toLocaleString('en-IN')}) has already been confirmed. Access details have been delivered to your WhatsApp chat!</p>
          </div>
        </body>
        </html>
      `);
    }

    // If order cancelled
    if (order.status === 'CANCELLED' || order.paymentStatus === 'CANCELLED') {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Cancelled — Lightning Deals</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; }
            h1 { font-size: 20px; margin: 0 0 12px; color: #f59e0b; }
            p { color: #a3a3a3; font-size: 14px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Order Cancelled</h1>
            <p>Order <strong>${order.internalOrderId}</strong> has been cancelled. Please request a new quote on WhatsApp to purchase.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Generate PayU params
    const provider = getPaymentProvider();
    const gatewayResult = await provider.createOrder({
      internalOrderId: order.internalOrderId,
      amountInr: order.amountInr,
      currency: order.currency,
      planId: order.planId,
      planName: order.planName,
      customerEmail: order.user?.email || 'customer@lightningapi.pro',
      customerName: order.user?.name || 'Valued Customer',
      customerPhone: order.user?.phone || '9876543210',
    });

    if (!gatewayResult.success || !gatewayResult.metadata) {
      return res.status(500).send('Failed to initialize payment gateway.');
    }

    const m = gatewayResult.metadata;
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Connecting to PayU... — Lightning Deals</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .spinner { width: 36px; height: 36px; border: 3px solid #7c3aed30; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          h1 { font-size: 18px; margin: 0 0 8px; font-weight: 600; }
          p { color: #a3a3a3; font-size: 13px; margin: 0 0 24px; line-height: 1.5; }
          .btn { background: #7c3aed; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; width: 100%; }
        </style>
      </head>
      <body onload="document.getElementById('payuForm').submit()">
        <div class="card">
          <div class="spinner"></div>
          <h1>Connecting to Secure Payment...</h1>
          <p>Please wait while we transfer you to PayU to complete payment of <strong>₹${order.amountInr.toLocaleString('en-IN')}</strong> for <strong>${order.planName}</strong>.</p>
          <form id="payuForm" method="POST" action="${m.action}">
            <input type="hidden" name="key" value="${m.key}" />
            <input type="hidden" name="txnid" value="${m.txnid}" />
            <input type="hidden" name="amount" value="${m.amount}" />
            <input type="hidden" name="productinfo" value="${m.productinfo}" />
            <input type="hidden" name="firstname" value="${m.firstname}" />
            <input type="hidden" name="email" value="${m.email}" />
            <input type="hidden" name="phone" value="${m.phone}" />
            <input type="hidden" name="surl" value="${m.surl}" />
            <input type="hidden" name="furl" value="${m.furl}" />
            <input type="hidden" name="hash" value="${m.hash}" />
            <input type="hidden" name="udf1" value="${m.udf1 || ''}" />
            <input type="hidden" name="udf2" value="${m.udf2 || ''}" />
            <input type="hidden" name="udf3" value="${m.udf3 || ''}" />
            <button type="submit" class="btn">Click Here to Pay Now</button>
          </form>
        </div>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[PAYU REDIRECT ERROR]', err);
    return res.status(500).send(`Payment initialization error: ${err.message}`);
  }
}

checkoutRouter.get('/pay/:orderId', handlePayUOrderRedirect);

