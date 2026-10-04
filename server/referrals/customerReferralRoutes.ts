import { Router, Request, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../auth';
import { ReferralEngine } from './referralEngine';
import { extractClientIp } from '../geoService';

export const customerReferralRouter = Router();

// 1. GET /api/user/referrals/overview — Customer Referral Dashboard
customerReferralRouter.get('/overview', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const overview = await ReferralEngine.getCustomerReferralOverview(userId);
    res.json({ success: true, ...overview });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 2. GET /api/referrals/validate/:code — Public Validation for Referral Link Clicks
customerReferralRouter.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const result = await ReferralEngine.resolveReferralCode(code);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 3. POST /api/referrals/click — Public Referral Click Tracking
customerReferralRouter.post('/click', async (req: Request, res: Response) => {
  try {
    const { code, landingPage } = req.body;
    const ipAddress = extractClientIp(req);
    const userAgent = req.headers['user-agent'];

    const result = await ReferralEngine.recordReferralClick({
      code,
      ipAddress,
      userAgent,
      landingPage,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 4. POST /api/user/referrals/claim — Customer Claims Referral Code
customerReferralRouter.post('/claim', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: { message: 'Referral code is required.' } });
    }

    const ipAddress = extractClientIp(req);
    const userAgent = req.headers['user-agent'];

    const result = await ReferralEngine.attributeReferral({
      customerId: req.user!.id,
      referralCode: code,
      source: 'MANUAL_CODE',
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return res.status(400).json({ error: { message: result.message } });
    }

    res.json({ success: true, message: result.message, referral: result.referral });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});
