import { Router, Response } from 'express';
import { authenticateJwt, requireAdmin, AuthRequest } from '../auth';
import {
  getAdminRewardsOverview,
  getGlobalCreditLedger,
  getRewardSettings,
  updateRewardSettings,
  getAdminCustomerCreditDetails,
  adjustCustomerCredits,
  reverseOrderCredits,
  createUniversalPurchase,
  updateUniversalPurchaseAmount,
  updateUniversalPurchaseStatus,
  getUniversalPurchases,
  searchCustomersForPurchase,
  getAvailableProductsCatalog,
} from './rewardService';
import { prisma } from '../db';
import { recordAuditEvent } from '../auditLogger';

export const adminRewardsRouter = Router();

// Apply admin authentication to all routes
adminRewardsRouter.use(authenticateJwt, requireAdmin);

/**
 * GET /api/admin/rewards/overview
 * KPI metrics, total liability, monthly stats, and recent ledger activity
 */
adminRewardsRouter.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const overview = await getAdminRewardsOverview();
    res.json({ success: true, ...overview });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/rewards/ledger
 * Full chronological ledger with pagination, type filter, and search
 */
adminRewardsRouter.get('/ledger', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, type, search } = req.query;
    const ledger = await getGlobalCreditLedger({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type: type ? String(type) : undefined,
      search: search ? String(search) : undefined,
    });

    res.json({ success: true, ...ledger });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/rewards/settings
 * Current reward configuration
 */
adminRewardsRouter.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getRewardSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * PUT /api/admin/rewards/settings
 * Update reward percentage, max eligible purchase, max reward per transaction
 */
adminRewardsRouter.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const {
      rewardPercentage,
      maxEligiblePurchaseAmount,
      maxRewardPerTransaction,
      isActive,
      currency,
      promoActive,
      promoMultiplier,
      promoMinPurchaseAmount,
      promoMaxCredits,
      promoTitle,
      promoSubtitle,
      promoBadge,
      promoShowPopup,
      promoShowBanner,
      promoEndsAt,
    } = req.body;

    const updated = await updateRewardSettings(
      {
        rewardPercentage: rewardPercentage !== undefined ? Number(rewardPercentage) : undefined,
        maxEligiblePurchaseAmount:
          maxEligiblePurchaseAmount !== undefined ? Number(maxEligiblePurchaseAmount) : undefined,
        maxRewardPerTransaction:
          maxRewardPerTransaction !== undefined ? Number(maxRewardPerTransaction) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        currency: currency !== undefined ? String(currency) : undefined,
        promoActive: promoActive !== undefined ? Boolean(promoActive) : undefined,
        promoMultiplier: promoMultiplier !== undefined ? Number(promoMultiplier) : undefined,
        promoMinPurchaseAmount:
          promoMinPurchaseAmount !== undefined ? Number(promoMinPurchaseAmount) : undefined,
        promoMaxCredits: promoMaxCredits !== undefined ? Number(promoMaxCredits) : undefined,
        promoTitle: promoTitle !== undefined ? String(promoTitle) : undefined,
        promoSubtitle: promoSubtitle !== undefined ? String(promoSubtitle) : undefined,
        promoBadge: promoBadge !== undefined ? String(promoBadge) : undefined,
        promoShowPopup: promoShowPopup !== undefined ? Boolean(promoShowPopup) : undefined,
        promoShowBanner: promoShowBanner !== undefined ? Boolean(promoShowBanner) : undefined,
        promoEndsAt: promoEndsAt !== undefined ? promoEndsAt : undefined,
      },
      req.user?.id
    );

    res.json({ success: true, settings: updated, message: 'Reward settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/rewards/customers/:userId
 * Customer detailed rewards profile & full transaction history
 */
adminRewardsRouter.get('/customers/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const details = await getAdminCustomerCreditDetails(userId);
    res.json({ success: true, ...details });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * POST /api/admin/rewards/adjust
 * Manual credit or debit with mandatory reason
 */
adminRewardsRouter.post('/adjust', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: { message: 'Customer userId is required.' } });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ error: { message: 'Valid numerical amount is required.' } });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        error: { message: 'A mandatory audit reason is required for any manual credit adjustment.' },
      });
    }

    const result = await adjustCustomerCredits({
      userId,
      amount: Number(amount),
      reason: reason.trim(),
      adminUserId: req.user!.id,
    });

    await recordAuditEvent({
      eventType: Number(amount) > 0 ? 'MANUAL_CREDIT_GRANTED' : 'MANUAL_CREDIT_DEDUCTED',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: req.user?.id,
      adminId: req.user?.id,
      customerId: userId,
      action: 'ADJUST_CREDITS',
      result: 'SUCCESS',
      resourceType: 'USER',
      resourceId: userId,
      metadata: JSON.stringify({ amount, reason, transactionId: result.transactionId }),
    });

    res.json({
      success: true,
      message: `Successfully adjusted credits by ₹${Number(amount).toLocaleString()}.`,
      result,
    });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * POST /api/admin/rewards/reverse-order
 * Reverse earned credits and/or restore redeemed credits for a refunded order
 */
adminRewardsRouter.post('/reverse-order', async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: { message: 'orderId is required.' } });
    }

    const result = await reverseOrderCredits({
      orderId,
      reason: reason || 'Admin order reversal',
      adminUserId: req.user?.id,
    });

    await recordAuditEvent({
      eventType: 'ORDER_REWARDS_REVERSED',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: req.user?.id,
      adminId: req.user?.id,
      action: 'REVERSE_ORDER_REWARDS',
      result: 'SUCCESS',
      resourceType: 'ORDER',
      resourceId: orderId,
      metadata: JSON.stringify(result),
    });

    res.json({
      success: true,
      message: 'Order reward reversal processed successfully.',
      result,
    });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/rewards/purchases
 * Universal Purchases list with pagination and multi-dimensional filters
 */
adminRewardsRouter.get('/purchases', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, channel, status, search, userId } = req.query;
    const data = await getUniversalPurchases({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      channel: channel ? String(channel) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      userId: userId ? String(userId) : undefined,
    });
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * POST /api/admin/rewards/purchases
 * Fast "+ Record Purchase" creation from WhatsApp, Manual, etc.
 */
adminRewardsRouter.post('/purchases', async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      productName,
      description,
      amountPaid,
      channel,
      purchaseDate,
      status,
      referenceId,
      notes,
    } = req.body;

    const result = await createUniversalPurchase({
      userId,
      productName,
      description,
      amountPaid: Number(amountPaid),
      channel,
      purchaseDate,
      status,
      referenceId,
      notes,
      createdBy: req.user?.id || 'ADMIN',
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * PUT /api/admin/rewards/purchases/:purchaseId/amount
 * Edit purchase amount with authoritative reward reversal & recalculation
 */
adminRewardsRouter.put('/purchases/:purchaseId/amount', async (req: AuthRequest, res: Response) => {
  try {
    const { purchaseId } = req.params;
    const { newAmount, reason } = req.body;

    if (newAmount === undefined || isNaN(Number(newAmount))) {
      return res.status(400).json({ error: { message: 'Valid numerical newAmount is required.' } });
    }

    const result = await updateUniversalPurchaseAmount({
      purchaseId,
      newAmount: Number(newAmount),
      reason,
      adminUserId: req.user?.id,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * PUT /api/admin/rewards/purchases/:purchaseId/status
 * Update status (COMPLETED, REFUNDED, CANCELLED) with automatic credit handling
 */
adminRewardsRouter.put('/purchases/:purchaseId/status', async (req: AuthRequest, res: Response) => {
  try {
    const { purchaseId } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ error: { message: 'Status is required.' } });
    }

    const result = await updateUniversalPurchaseStatus({
      purchaseId,
      status,
      reason,
      adminUserId: req.user?.id,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/rewards/customers-search
 * Fast customer lookup by email, name, phone, or ID
 */
adminRewardsRouter.get('/customers-search', async (req: AuthRequest, res: Response) => {
  try {
    const q = String(req.query.q || '');
    const users = await searchCustomersForPurchase(q);
    res.json({ success: true, users, customers: users });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/rewards/customer-profile/:userId
 * Complete customer profile with all channel breakdown & quick actions
 */
adminRewardsRouter.get('/customer-profile/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const details = await getAdminCustomerCreditDetails(userId);
    res.json({ success: true, ...details });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/admin/rewards/products-catalog
 * Available products for auto-complete dropdown
 */
adminRewardsRouter.get('/products-catalog', async (req: AuthRequest, res: Response) => {
  try {
    const catalog = await getAvailableProductsCatalog();
    res.json({ success: true, ...catalog });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

