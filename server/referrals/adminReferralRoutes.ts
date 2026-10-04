import { Router, Response } from 'express';
import { authenticateJwt, requireAdmin, AuthRequest } from '../auth';
import { ReferralEngine } from './referralEngine';

export const adminReferralRouter = Router();

adminReferralRouter.use(authenticateJwt, requireAdmin);

// 1. GET /api/admin/referrals — Paginated List with Search and Filters
adminReferralRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status, riskStatus, rewardStatus, startDate, endDate } = req.query;
    const result = await ReferralEngine.getAdminReferrals({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      riskStatus: riskStatus ? String(riskStatus) : undefined,
      rewardStatus: rewardStatus ? String(rewardStatus) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 2. GET /api/admin/referrals/analytics — Conversion Funnel and Metrics
adminReferralRouter.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await ReferralEngine.getAdminAnalytics();
    res.json({ success: true, ...analytics });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 3. GET /api/admin/referrals/settings — Current Configuration
adminReferralRouter.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await ReferralEngine.getSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 4. PUT /api/admin/referrals/settings — Update Configuration
adminReferralRouter.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const adminUserId = req.user!.id;
    const updated = await ReferralEngine.updateSettings(req.body, adminUserId);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 5. POST /api/admin/referrals/:id/action — Perform Admin Action
adminReferralRouter.post('/:id/action', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const adminUserId = req.user!.id;

    if (!action || !['APPROVE', 'DISQUALIFY', 'MARK_REVIEW', 'ADD_NOTE', 'REVERSE_REWARD'].includes(action)) {
      return res.status(400).json({ error: { message: 'Valid action is required.' } });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: { message: 'Reason is required for audit logs.' } });
    }

    const result = await ReferralEngine.adminAction({
      referralId: id,
      action,
      reason,
      adminUserId,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 6. GET /api/admin/referrals/export — CSV Export
adminReferralRouter.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const result = await ReferralEngine.getAdminReferrals({ limit: 1000 });
    const items = result.items;

    const headers = [
      'Referral ID',
      'Referral Code',
      'Status',
      'Risk Status',
      'Referrer Name',
      'Referrer Email',
      'Referred Name',
      'Referred Email',
      'Qualifying Order ID',
      'Order Amount (INR)',
      'Reward Credits Earned',
      'Reward Status',
      'Created Date',
    ];

    const rows = items.map((r: any) => [
      `"${r.id}"`,
      `"${r.referralCode}"`,
      `"${r.status}"`,
      `"${r.riskStatus}"`,
      `"${r.referrer?.name || ''}"`,
      `"${r.referrer?.email || ''}"`,
      `"${r.referredUser?.name || ''}"`,
      `"${r.referredUser?.email || ''}"`,
      `"${r.qualifyingOrder?.internalOrderId || ''}"`,
      r.qualifyingOrder?.paidAmountInr ?? r.qualifyingOrder?.amountInr ?? 0,
      r.rewardCreditsEarned,
      `"${r.rewardStatus}"`,
      `"${new Date(r.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=lightningdeals_referrals_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});
