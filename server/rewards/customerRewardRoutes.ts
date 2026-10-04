import { Router, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../auth';
import {
  getCustomerRewardsSummary,
  calculateReward,
  getRewardSettings,
} from './rewardService';
import { prisma } from '../db';

export const customerRewardsRouter = Router();

/**
 * GET /api/user/rewards/summary
 * Full rewards dashboard data for customer portal
 */
customerRewardsRouter.get('/summary', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const summary = await getCustomerRewardsSummary(userId);
    res.json({ success: true, ...summary });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/user/rewards/balance
 * Fast balance lookup for checkout modal / nav header
 */
customerRewardsRouter.get('/balance', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        availableCredits: true,
        lifetimeCreditsEarned: true,
        lifetimeCreditsRedeemed: true,
      },
    });

    const settings = await getRewardSettings();

    res.json({
      success: true,
      availableCredits: user?.availableCredits || 0,
      lifetimeCreditsEarned: user?.lifetimeCreditsEarned || 0,
      lifetimeCreditsRedeemed: user?.lifetimeCreditsRedeemed || 0,
      rewardPercentage: settings.rewardPercentage,
      maxEligiblePurchaseAmount: settings.maxEligiblePurchaseAmount,
      maxRewardPerTransaction: settings.maxRewardPerTransaction,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * POST /api/user/rewards/calculate
 * Estimate rewards for a given purchase amount
 */
customerRewardsRouter.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const { purchaseAmount } = req.body;
    const calculation = await calculateReward(Number(purchaseAmount) || 0);
    res.json({ success: true, calculation });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/user/rewards/rules
 * Public reward settings explanation for landing page & calculator
 */
customerRewardsRouter.get('/rules', async (req, res) => {
  try {
    const settings = await getRewardSettings();
    const isPromoTimeValid = !settings.promoEndsAt || new Date(settings.promoEndsAt) > new Date();
    const isPromoActive = Boolean(settings.promoActive) && isPromoTimeValid;

    res.json({
      success: true,
      rules: {
        rewardPercentage: settings.rewardPercentage,
        maxEligiblePurchaseAmount: settings.maxEligiblePurchaseAmount,
        maxRewardPerTransaction: settings.maxRewardPerTransaction,
        currency: settings.currency,
        isActive: settings.isActive,
        // Promotional Offer
        promoActive: isPromoActive,
        promoMultiplier: settings.promoMultiplier,
        promoMinPurchaseAmount: settings.promoMinPurchaseAmount,
        promoMaxCredits: settings.promoMaxCredits,
        promoTitle: settings.promoTitle,
        promoSubtitle: settings.promoSubtitle,
        promoBadge: settings.promoBadge,
        promoShowPopup: settings.promoShowPopup,
        promoShowBanner: settings.promoShowBanner,
        promoEndsAt: settings.promoEndsAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

/**
 * GET /api/user/rewards/active-offer (also /api/rewards/active-offer)
 * Public active flash offer details for promotional modal & announcement banners
 */
customerRewardsRouter.get('/active-offer', async (req, res) => {
  try {
    const settings = await getRewardSettings();
    const isPromoTimeValid = !settings.promoEndsAt || new Date(settings.promoEndsAt) > new Date();
    const isPromoActive = Boolean(settings.promoActive) && isPromoTimeValid;

    res.json({
      success: true,
      active: isPromoActive,
      offer: isPromoActive
        ? {
            title: settings.promoTitle,
            subtitle: settings.promoSubtitle,
            badge: settings.promoBadge,
            multiplier: settings.promoMultiplier,
            minPurchaseAmount: settings.promoMinPurchaseAmount,
            maxCredits: settings.promoMaxCredits,
            showPopup: settings.promoShowPopup,
            showBanner: settings.promoShowBanner,
            endsAt: settings.promoEndsAt,
            baseRewardPercentage: settings.rewardPercentage,
            currency: settings.currency,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});
