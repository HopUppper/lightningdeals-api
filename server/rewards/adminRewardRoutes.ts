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
    const { rewardPercentage, maxEligiblePurchaseAmount, maxRewardPerTransaction, isActive } = req.body;
    const updated = await updateRewardSettings(
      {
        rewardPercentage: rewardPercentage !== undefined ? Number(rewardPercentage) : undefined,
        maxEligiblePurchaseAmount:
          maxEligiblePurchaseAmount !== undefined ? Number(maxEligiblePurchaseAmount) : undefined,
        maxRewardPerTransaction:
          maxRewardPerTransaction !== undefined ? Number(maxRewardPerTransaction) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
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
