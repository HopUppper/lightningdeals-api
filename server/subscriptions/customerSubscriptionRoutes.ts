import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateJwt, AuthRequest } from '../auth';
import { OrderEngine } from '../orders/orderEngine';
import { getSubscriptionStatus } from './subscriptionEngine';

export const customerSubscriptionRouter = Router();

// Protect all customer routes with JWT authentication
customerSubscriptionRouter.use(authenticateJwt);

/**
 * GET /api/user/subscriptions — List current customer's subscriptions
 * Strictly isolated to req.user!.id
 */
customerSubscriptionRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            id: true,
            internalOrderId: true,
            amountInr: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        apiKey: {
          select: {
            id: true,
            displayKey: true,
            name: true,
            status: true,
            tokensRemaining: true,
            purchasedTokens: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const formatted = subscriptions.map((sub) => {
      const liveStatus = getSubscriptionStatus(sub.expiryTime, sub.status, now);
      const msRemaining = sub.expiryTime.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

      return {
        id: sub.id,
        planId: sub.planId,
        planName: sub.planName,
        status: liveStatus,
        rawStatus: sub.status,
        activationTime: sub.activationTime,
        expiryTime: sub.expiryTime,
        durationDays: sub.durationDays,
        daysRemaining,
        renewalCount: sub.renewalCount,
        lastRenewedAt: sub.lastRenewedAt,
        isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
        isExpired: daysRemaining === 0,
        apiKey: sub.apiKey
          ? {
              id: sub.apiKey.id,
              displayKey: sub.apiKey.displayKey,
              name: sub.apiKey.name,
              tokensRemaining: sub.apiKey.tokensRemaining.toString(),
            }
          : null,
        order: sub.order,
      };
    });

    res.json({ success: true, subscriptions: formatted });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/user/subscriptions/:id — Get details of a single subscription
 * Strictly isolated: Customer A cannot view Customer B's subscription
 */
customerSubscriptionRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const sub = await prisma.subscription.findFirst({
      where: { id, userId },
      include: {
        order: true,
        apiKey: {
          select: {
            id: true,
            displayKey: true,
            name: true,
            status: true,
            tokensRemaining: true,
            tokensUsed: true,
          },
        },
      },
    });

    if (!sub) {
      return res.status(404).json({ error: { message: 'Subscription not found or unauthorized.' } });
    }

    const now = new Date();
    const liveStatus = getSubscriptionStatus(sub.expiryTime, sub.status, now);
    const msRemaining = sub.expiryTime.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    // Fetch related renewal orders for this subscription
    const relatedOrders = await prisma.order.findMany({
      where: {
        userId,
        OR: [{ id: sub.orderId || '' }, { subscriptionId: sub.id }],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      subscription: {
        ...sub,
        status: liveStatus,
        daysRemaining,
        apiKey: sub.apiKey
          ? {
              ...sub.apiKey,
              tokensRemaining: sub.apiKey.tokensRemaining.toString(),
              tokensUsed: sub.apiKey.tokensUsed.toString(),
            }
          : null,
        history: relatedOrders,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * POST /api/user/subscriptions/:id/renew — Initiate renewal order via Universal Order Engine
 * Links renewal order to existing subscription and invokes PayU flow
 */
customerSubscriptionRouter.post('/:id/renew', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { couponCode, redeemCredits, customerPhone } = req.body;

    const sub = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!sub) {
      return res.status(404).json({ error: { message: 'Subscription not found or unauthorized.' } });
    }

    // Call Universal Order Engine with linked subscriptionId
    const orderResult = await OrderEngine.createWebsiteOrder({
      userId,
      planId: sub.planId,
      couponCode,
      redeemCredits,
      customerPhone,
      subscriptionId: sub.id,
      req,
    });

    res.json({
      success: true,
      message: 'Renewal order initialized.',
      order: orderResult.order,
      fulfillment: (orderResult as any).fulfillment || null,
    });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});
