import { Router, Response } from 'express';
import { prisma } from './db';
import { authenticateJwt, requireAdmin, AuthRequest } from './auth';
import { adminManualFulfill, retryOrderFulfillment } from './payments/fulfillment';
import { InventoryService } from './inventory/inventoryService';
import { AutomationEngine } from './automation/jobs';
import { recordAuditEvent } from './auditLogger';
import { getSubscriptionStatus } from './subscriptions/subscriptionEngine';

export const adminFulfillmentRouter = Router();

// Protect all admin fulfillment routes with JWT and Admin Role
adminFulfillmentRouter.use(authenticateJwt, requireAdmin);

/**
 * 1. GET /api/admin/fulfillment/queue — Dedicated ⚡ FULFILLMENT Queue with SLA Aging
 */
adminFulfillmentRouter.get('/queue', async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'PENDING_AND_ACTIVE', channel, search } = req.query;

    const where: any = {};

    if (status === 'PENDING_AND_ACTIVE') {
      where.fulfillmentStatus = {
        in: ['FULFILLMENT_PENDING', 'FULFILLMENT_PROCESSING', 'PROCESSING', 'MANUAL_REVIEW', 'RETRY_REQUIRED', 'FULFILLMENT_FAILED'],
      };
    } else if (status !== 'ALL') {
      where.fulfillmentStatus = status;
    }

    if (channel) {
      where.paymentGateway = channel.toString().toUpperCase();
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { internalOrderId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { planName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const now = Date.now();

    // Map orders with SLA aging metrics
    const mapped = orders.map((order) => {
      const waitTimeRef = order.paidAt ? order.paidAt.getTime() : order.createdAt.getTime();
      const waitingMinutes = Math.max(0, Math.floor((now - waitTimeRef) / (60 * 1000)));

      // Configurable SLA thresholds: Green < 15m, Yellow 15-60m, Red > 60m
      let slaColor: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
      if (waitingMinutes > 60) {
        slaColor = 'RED';
      } else if (waitingMinutes >= 15) {
        slaColor = 'YELLOW';
      }

      return {
        id: order.id,
        internalOrderId: order.internalOrderId,
        customer: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        },
        product: {
          planId: order.planId,
          planName: order.planName,
        },
        amountInr: order.amountInr,
        paidAmountInr: order.paidAmountInr,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentGateway: order.paymentGateway,
        slaPriority: order.slaPriority,
        fulfillmentAttempts: order.fulfillmentAttempts,
        fulfillmentNotes: order.fulfillmentNotes,
        failureReason: order.failureReason,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        fulfilledAt: order.fulfilledAt,
        waitingMinutes,
        slaColor,
      };
    });

    res.json({
      success: true,
      count: mapped.length,
      orders: mapped,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * 2. POST /api/admin/fulfillment/:orderId/fulfill — Mark as Fulfilled Manually
 */
adminFulfillmentRouter.post('/:orderId/fulfill', async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { notes, inventoryItemId } = req.body;
    const adminId = req.user!.id;

    const result = await adminManualFulfill({
      orderId,
      adminId,
      notes,
      inventoryItemId,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * 3. POST /api/admin/fulfillment/:orderId/processing — Mark as Processing
 */
adminFulfillmentRouter.post('/:orderId/processing', async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: 'FULFILLMENT_PROCESSING',
        fulfillmentNotes: notes ? notes : undefined,
      },
    });

    await recordAuditEvent({
      eventType: 'ORDER_FULFILLMENT_PROCESSING',
      severity: 'INFO',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      resourceType: 'ORDER',
      resourceId: orderId,
      action: 'UPDATE_FULFILLMENT_STATUS',
      result: 'SUCCESS',
      metadata: { notes },
    });

    res.json({ success: true, order });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * 4. POST /api/admin/fulfillment/:orderId/fail — Mark as Failed
 */
adminFulfillmentRouter.post('/:orderId/fail', async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: 'FULFILLMENT_FAILED',
        failureReason: reason || 'Manually marked as failed by admin.',
      },
    });

    await recordAuditEvent({
      eventType: 'ORDER_FULFILLMENT_FAILED_ADMIN',
      severity: 'WARNING',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      resourceType: 'ORDER',
      resourceId: orderId,
      action: 'FAIL_FULFILLMENT',
      result: 'FAILED',
      failureReason: reason,
    });

    res.json({ success: true, order });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * 5. POST /api/admin/fulfillment/:orderId/manual-review — Flag for Manual Review
 */
adminFulfillmentRouter.post('/:orderId/manual-review', async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: 'MANUAL_REVIEW',
        fulfillmentNotes: notes || undefined,
        slaPriority: 'URGENT',
      },
    });

    await recordAuditEvent({
      eventType: 'ORDER_FLAGGED_MANUAL_REVIEW',
      severity: 'HIGH',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      resourceType: 'ORDER',
      resourceId: orderId,
      action: 'FLAG_MANUAL_REVIEW',
      result: 'WARNING',
      metadata: { notes },
    });

    res.json({ success: true, order });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * 6. POST /api/admin/fulfillment/:orderId/retry — Retry Automatic Fulfillment
 */
adminFulfillmentRouter.post('/:orderId/retry', async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found.' } });
    }

    const result = await retryOrderFulfillment(order.internalOrderId, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * 7. GET /api/admin/subscriptions — Subscriptions List
 */
adminFulfillmentRouter.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { planName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: { select: { id: true, internalOrderId: true, amountInr: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const now = new Date();
    const mapped = subscriptions.map((sub) => {
      const liveStatus = getSubscriptionStatus(sub.expiryTime, sub.status, now);
      const daysRemaining = Math.max(0, Math.ceil((sub.expiryTime.getTime() - now.getTime()) / (24 * 3600 * 1000)));

      return {
        ...sub,
        status: liveStatus,
        daysRemaining,
      };
    });

    res.json({ success: true, count: mapped.length, subscriptions: mapped });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * 8. GET /api/admin/subscriptions/metrics — Real Database Overview Figures
 */
adminFulfillmentRouter.get('/subscriptions/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const now = new Date();

    const [
      fulfilledToday,
      fulfillmentPending,
      fulfillmentFailed,
      fulfillmentManualReview,
      activeSubs,
      expiringSubs,
      expiredSubs,
      lowStockAlerts,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          fulfillmentStatus: 'FULFILLED',
          fulfilledAt: { gte: startOfToday },
        },
      }),
      prisma.order.count({
        where: { fulfillmentStatus: { in: ['FULFILLMENT_PENDING', 'PENDING'] } },
      }),
      prisma.order.count({
        where: { fulfillmentStatus: { in: ['FULFILLMENT_FAILED', 'FAILED'] } },
      }),
      prisma.order.count({
        where: { fulfillmentStatus: 'MANUAL_REVIEW' },
      }),
      prisma.subscription.count({
        where: { status: 'ACTIVE', expiryTime: { gt: now } },
      }),
      prisma.subscription.count({
        where: {
          status: { in: ['ACTIVE', 'EXPIRING'] },
          expiryTime: { gt: now, lte: sevenDaysFromNow },
        },
      }),
      prisma.subscription.count({
        where: {
          OR: [{ status: 'EXPIRED' }, { expiryTime: { lte: now } }],
        },
      }),
      InventoryService.getLowStockAlerts(),
    ]);

    res.json({
      success: true,
      fulfillment: {
        completedToday: fulfilledToday,
        pending: fulfillmentPending,
        failed: fulfillmentFailed,
        manualReview: fulfillmentManualReview,
      },
      subscriptions: {
        active: activeSubs,
        expiringIn7Days: expiringSubs,
        expired: expiredSubs,
      },
      lowStock: lowStockAlerts,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * 9. GET /api/admin/inventory — Inventory Items Management
 */
adminFulfillmentRouter.get('/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.query;
    const where: any = {};
    if (planId) where.planId = planId.toString();

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true, displayName: true, lowStockThreshold: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const lowStock = await InventoryService.getLowStockAlerts();

    res.json({ success: true, count: items.length, items, lowStock });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * 10. POST /api/admin/inventory/add — Add Inventory Item
 */
adminFulfillmentRouter.post('/inventory/add', async (req: AuthRequest, res: Response) => {
  try {
    const { planId, secretData, displayValue, sku, notes } = req.body;
    if (!planId || !secretData) {
      return res.status(400).json({ error: { message: 'planId and secretData are required.' } });
    }

    const item = await InventoryService.addInventoryItem(
      { planId, secretData, displayValue, sku, notes },
      req.user!.id
    );

    res.json({ success: true, item });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * 11. POST /api/admin/inventory/bulk-add — Bulk Add Inventory Items
 */
adminFulfillmentRouter.post('/inventory/bulk-add', async (req: AuthRequest, res: Response) => {
  try {
    const { planId, items } = req.body;
    if (!planId || !Array.isArray(items)) {
      return res.status(400).json({ error: { message: 'planId and items array are required.' } });
    }

    const created = await InventoryService.addBulkInventoryItems(planId, items, req.user!.id);
    res.json({ success: true, count: created.length, items: created });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * 12. POST /api/admin/automation/run — Trigger Automation Jobs on Demand
 */
adminFulfillmentRouter.post('/automation/run', async (req: AuthRequest, res: Response) => {
  try {
    const results = await AutomationEngine.runAllJobs();

    await recordAuditEvent({
      eventType: 'AUTOMATION_JOBS_MANUAL_RUN',
      severity: 'INFO',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      resourceType: 'SYSTEM',
      action: 'RUN_AUTOMATION_JOBS',
      result: 'SUCCESS',
      metadata: results,
    });

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * 13. GET /api/admin/products/fulfillment-config — Product Fulfillment Settings
 */
adminFulfillmentRouter.get('/products/fulfillment-config', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, products: plans });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * 14. PUT /api/admin/products/:planId/fulfillment-config — Update Product Fulfillment Settings
 */
adminFulfillmentRouter.put('/products/:planId/fulfillment-config', async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.params;
    const {
      fulfillmentType,
      isSubscription,
      durationDays,
      renewalDurationDays,
      autoFulfillEnabled,
      manualFulfillEnabled,
      requiresInventory,
      lowStockThreshold,
      activationInstructions,
      trackExpiry,
      renewalRemindersEnabled,
    } = req.body;

    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(fulfillmentType && { fulfillmentType }),
        ...(typeof isSubscription === 'boolean' && { isSubscription }),
        ...(durationDays && { durationDays: Number(durationDays) }),
        ...(renewalDurationDays && { renewalDurationDays: Number(renewalDurationDays) }),
        ...(typeof autoFulfillEnabled === 'boolean' && { autoFulfillEnabled }),
        ...(typeof manualFulfillEnabled === 'boolean' && { manualFulfillEnabled }),
        ...(typeof requiresInventory === 'boolean' && { requiresInventory }),
        ...(lowStockThreshold && { lowStockThreshold: Number(lowStockThreshold) }),
        ...(activationInstructions !== undefined && { activationInstructions }),
        ...(typeof trackExpiry === 'boolean' && { trackExpiry }),
        ...(typeof renewalRemindersEnabled === 'boolean' && { renewalRemindersEnabled }),
      },
    });

    await recordAuditEvent({
      eventType: 'PRODUCT_FULFILLMENT_CONFIG_UPDATED',
      severity: 'INFO',
      actorType: 'ADMIN',
      adminId: req.user!.id,
      resourceType: 'PLAN',
      resourceId: planId,
      action: 'UPDATE_FULFILLMENT_CONFIG',
      result: 'SUCCESS',
      metadata: { planId, fulfillmentType, autoFulfillEnabled, requiresInventory },
    });

    res.json({ success: true, plan: updated });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});
