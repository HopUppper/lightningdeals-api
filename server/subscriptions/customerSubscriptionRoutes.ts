import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateJwt, AuthRequest } from '../auth';
import { OrderEngine } from '../orders/orderEngine';
import { getSubscriptionStatus, resolveCustomerEntitlements } from './subscriptionEngine';
import { reconcileSubscriptionCycle } from './quotaReconciliationService';

export const customerSubscriptionRouter = Router();

// Protect all customer routes with JWT authentication
customerSubscriptionRouter.use(authenticateJwt);

/**
 * GET /api/user/subscriptions — Authoritative unified customer entitlement endpoint
 * Strictly isolated to req.user!.id
 * Resolves both Subscription records (Path A) and manually provisioned ApiKeys (Path B).
 * Returns:
 * - success: boolean
 * - hasActivePlan: boolean
 * - activeSubscription: primary active plan object (for legacy & UserPlan.tsx)
 * - activeEntitlements: all active plans array
 * - subscriptions: full subscription history array (for UserSubscriptions.tsx)
 * - pastSubscriptions: expired/cancelled subscriptions
 * - summary: aggregated totals (credits USD, token packs, rolling pools)
 */
customerSubscriptionRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entitlementsResult = await resolveCustomerEntitlements(userId);
    res.json(entitlementsResult);
  } catch (err: any) {
    console.error('[customerSubscriptionRouter] Error resolving entitlements:', err);
    res.status(500).json({ error: { message: err.message || 'Failed to resolve entitlements.' } });
  }
});

/**
 * GET /api/user/subscriptions/active — Alias returning active entitlements
 */
customerSubscriptionRouter.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entitlementsResult = await resolveCustomerEntitlements(userId);
    res.json({
      success: true,
      hasActivePlan: entitlementsResult.hasActivePlan,
      activeSubscription: entitlementsResult.activeSubscription,
      activeEntitlements: entitlementsResult.activeEntitlements,
      summary: entitlementsResult.summary,
    });
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
            creditBalanceUsd: true,
            billingType: true,
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

    // Authoritative 5-hour cycle and balance reconciliation
    const cycleMetrics = await reconcileSubscriptionCycle(sub.id, now);

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
        billingPeriod: sub.billingPeriod || (sub.durationDays >= 365 ? 'yearly' : 'monthly'),
        billingClassification: cycleMetrics?.billingClassification || 'ROLLING_WINDOW',
        currentPeriodStart: sub.activationTime,
        currentPeriodEnd: sub.expiryTime,
        status: liveStatus,
        daysRemaining,
        quotaLimit: cycleMetrics ? cycleMetrics.quotaLimit : sub.quotaLimit.toString(),
        currentUsage: cycleMetrics ? cycleMetrics.currentCycleUsage : sub.currentUsage.toString(),
        currentCycleUsage: cycleMetrics ? cycleMetrics.currentCycleUsage : sub.currentUsage.toString(),
        tokensRemaining: cycleMetrics ? cycleMetrics.availableQuota : Math.max(0n, sub.quotaLimit - sub.currentUsage).toString(),
        availableQuota: cycleMetrics ? cycleMetrics.availableQuota : Math.max(0n, sub.quotaLimit - sub.currentUsage).toString(),
        nextResetTime: cycleMetrics ? cycleMetrics.nextResetTime : sub.nextResetTime,
        nextResetIso: cycleMetrics ? cycleMetrics.nextResetIso : sub.nextResetTime.toISOString(),
        secondsUntilReset: cycleMetrics ? cycleMetrics.secondsUntilReset : Math.max(0, Math.floor((sub.nextResetTime.getTime() - now.getTime()) / 1000)),
        usagePercentage: cycleMetrics ? cycleMetrics.usagePercentage : 0,
        availablePercentage: cycleMetrics ? cycleMetrics.availablePercentage : 100,
        previousCycleUsage: cycleMetrics ? cycleMetrics.previousCycleUsage : '0',
        lifetimeTokensUsed: cycleMetrics ? cycleMetrics.lifetimeTokensUsed : (sub.apiKey?.tokensUsed || 0n).toString(),
        apiKey: sub.apiKey
          ? {
              ...sub.apiKey,
              tokensRemaining: cycleMetrics ? cycleMetrics.availableQuota : sub.apiKey.tokensRemaining.toString(),
              tokensUsed: cycleMetrics ? cycleMetrics.currentCycleUsage : sub.apiKey.tokensUsed.toString(),
              currentCycleUsage: cycleMetrics ? cycleMetrics.currentCycleUsage : sub.apiKey.tokensUsed.toString(),
              lifetimeTokensUsed: cycleMetrics ? cycleMetrics.lifetimeTokensUsed : sub.apiKey.tokensUsed.toString(),
              creditBalanceUsd: Number(sub.apiKey.creditBalanceUsd || 0),
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
