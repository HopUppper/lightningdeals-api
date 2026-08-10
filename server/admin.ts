import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma, encryptText, decryptText } from './db';
import { AuthRequest, authenticateJwt, requireAdmin } from './auth';
import { calculateKeyRollingWindow } from './window';

const router = Router();

// Protect all admin routes with JWT and Admin Role
router.use(authenticateJwt, requireAdmin);


// 1. Admin Platform Overview Metrics
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const totalKeys = await prisma.apiKey.count();
    const activeKeys = await prisma.apiKey.count({ where: { status: 'active' } });
    const trialKeys = await prisma.apiKey.count({ where: { type: 'trial' } });

    const totalOrders = await prisma.order.count({ where: { status: 'PAID' } });
    const totalTokensSoldAgg = await prisma.order.aggregate({
      _sum: { tokenQuantity: true, amountInr: true },
      where: { status: 'PAID' },
    });

    const totalTokensConsumedAgg = await prisma.apiKey.aggregate({
      _sum: { tokensUsed: true, tokensRemaining: true },
    });

    const requestsCount = await prisma.apiRequest.count();
    const failedRequestsCount = await prisma.apiRequest.count({
      where: { statusCode: { gte: 400 } },
    });

    const errorRate = requestsCount > 0 ? ((failedRequestsCount / requestsCount) * 100).toFixed(1) + '%' : '0.0%';

    const avgLatencyResult = await prisma.apiRequest.aggregate({
      _avg: { latencyMs: true },
    });

    const primaryVendor = await prisma.vendorProvider.findFirst({
      where: { isPrimary: true },
    });

    res.json({
      totalUsers,
      activeUsers,
      totalKeys,
      activeKeys,
      trialKeys,
      totalOrders,
      revenueInr: totalTokensSoldAgg._sum.amountInr || 0,
      tokensSold: totalTokensSoldAgg._sum.tokenQuantity?.toString() || '0',
      tokensConsumed: totalTokensConsumedAgg._sum.tokensUsed?.toString() || '0',
      tokensRemaining: totalTokensConsumedAgg._sum.tokensRemaining?.toString() || '0',
      totalRequests: requestsCount,
      failedRequests: failedRequestsCount,
      errorRate,
      avgLatencyMs: Math.round(avgLatencyResult._avg.latencyMs || 0),
      vendorStatus: primaryVendor ? primaryVendor.status : 'not_configured',
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 2. Vendor Provider Master Credentials Management & Connection Test (/admin/providers)
router.get('/providers', async (req: AuthRequest, res: Response) => {
  try {
    const providers = await prisma.vendorProvider.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Mask master API keys for response security
    const masked = providers.map((p) => {
      const decrypted = decryptText(p.masterApiKeyEncrypted);
      const displayKey = decrypted ? `${decrypted.slice(0, 8)}...${decrypted.slice(-4)}` : 'Not Set';
      return {
        ...p,
        masterApiKeyEncrypted: undefined,
        displayMasterKey: displayKey,
      };
    });
    res.json(masked);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/providers', async (req: AuthRequest, res: Response) => {
  const { name, providerType, masterApiKey, baseUrl, isPrimary, notes } = req.body;
  try {
    const encryptedKey = encryptText(masterApiKey || '');

    if (isPrimary) {
      await prisma.vendorProvider.updateMany({ data: { isPrimary: false } });
    }

    const provider = await prisma.vendorProvider.create({
      data: {
        name: name || 'Vendor Provider',
        providerType: providerType || 'anthropic',
        masterApiKeyEncrypted: encryptedKey,
        baseUrl: baseUrl || 'https://api.anthropic.com',
        isPrimary: !!isPrimary,
        status: masterApiKey ? 'connected' : 'disabled',
        notes,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'CREATE_VENDOR_PROVIDER',
        targetType: 'VendorProvider',
        targetId: provider.id,
        metadata: `Created vendor provider: ${provider.name}`,
      },
    });

    res.json({ success: true, providerId: provider.id });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/providers/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, providerType, masterApiKey, baseUrl, status, isPrimary, notes } = req.body;
  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (providerType !== undefined) updateData.providerType = providerType;
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (masterApiKey) updateData.masterApiKeyEncrypted = encryptText(masterApiKey);

    if (isPrimary) {
      await prisma.vendorProvider.updateMany({ data: { isPrimary: false } });
      updateData.isPrimary = true;
    }

    const provider = await prisma.vendorProvider.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, provider });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// REAL Backend Connection Health Check for Vendor Master Key
router.post('/providers/test', async (req: AuthRequest, res: Response) => {
  const { providerId, masterApiKey, baseUrl } = req.body;
  try {
    let keyToTest = masterApiKey;
    let urlToTest = baseUrl;

    if (providerId) {
      const provider = await prisma.vendorProvider.findUnique({ where: { id: providerId } });
      if (provider) {
        if (!keyToTest) keyToTest = decryptText(provider.masterApiKeyEncrypted);
        if (!urlToTest) urlToTest = provider.baseUrl;
      }
    }

    if (!keyToTest) {
      return res.status(400).json({ status: 'invalid_credential', message: 'No Master API key provided.' });
    }

    const targetUrl = `${(urlToTest || 'https://api.anthropic.com').replace(/\/$/, '')}/v1/models`;

    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-api-key': keyToTest,
        'anthropic-version': '2023-06-01',
      },
    });

    if (upstreamRes.ok) {
      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { status: 'connected', lastTestedAt: new Date(), lastError: null },
        });
      }
      return res.json({ status: 'connected', message: 'Vendor connection test successful. Response HTTP 200 OK.' });
    } else if (upstreamRes.status === 401 || upstreamRes.status === 403) {
      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { status: 'invalid_credential', lastTestedAt: new Date(), lastError: 'Auth Failed (401/403)' },
        });
      }
      return res.json({ status: 'invalid_credential', message: `Authentication failed (HTTP ${upstreamRes.status}). Check master API key.` });
    } else {
      return res.json({ status: 'provider_unavailable', message: `Provider returned HTTP ${upstreamRes.status}.` });
    }
  } catch (err: any) {
    return res.json({ status: 'configuration_error', message: `Could not reach vendor base URL: ${err.message}` });
  }
});

// 3. Token Package Pricing Configuration (/admin/pricing)
router.get('/pricing', async (req: AuthRequest, res: Response) => {
  try {
    const packages = await prisma.tokenPackage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json(packages);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/pricing', async (req: AuthRequest, res: Response) => {
  const { tokenAmount, priceInr, displayName, description, featured, enabled } = req.body;
  try {
    const pkg = await prisma.tokenPackage.create({
      data: {
        tokenAmount: BigInt(tokenAmount),
        priceInr: Number(priceInr),
        displayName,
        description,
        featured: !!featured,
        enabled: enabled !== undefined ? !!enabled : true,
      },
    });
    res.json(pkg);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/pricing/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { tokenAmount, priceInr, displayName, description, featured, enabled } = req.body;
  try {
    const updateData: any = {};
    if (tokenAmount !== undefined) updateData.tokenAmount = BigInt(tokenAmount);
    if (priceInr !== undefined) updateData.priceInr = Number(priceInr);
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (featured !== undefined) updateData.featured = featured;
    if (enabled !== undefined) updateData.enabled = enabled;

    const pkg = await prisma.tokenPackage.update({
      where: { id },
      data: updateData,
    });
    res.json(pkg);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.delete('/pricing/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.tokenPackage.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 4. API Key Management (/admin/keys)
// 3b. Admin Plan Management (/admin/plans)
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { tokenAllowance: 'asc' } });
    const formatted = plans.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      tokenAllowance: p.tokenAllowance.toString(),
      windowHours: p.windowHours,
      validityDays: p.validityDays,
      rateLimitRpm: p.rateLimitRpm,
      status: p.status,
      description: p.description,
      createdAt: p.createdAt,
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/plans', async (req: AuthRequest, res: Response) => {
  const { name, displayName, tokenAllowance, windowHours, validityDays, rateLimitRpm, description } = req.body;
  try {
    const plan = await prisma.plan.create({
      data: {
        name,
        displayName: displayName || `${name} (${Math.round(Number(tokenAllowance || 0) / 1000000)}M / ${windowHours || 5}h)`,
        tokenAllowance: BigInt(tokenAllowance || 20000000),
        windowHours: Number(windowHours || 5),
        validityDays: Number(validityDays || 30),
        rateLimitRpm: Number(rateLimitRpm || 60),
        status: 'active',
        description,
      },
    });
    res.json({ success: true, plan: { ...plan, tokenAllowance: plan.tokenAllowance.toString() } });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/plans/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, displayName, tokenAllowance, windowHours, validityDays, rateLimitRpm, status, description } = req.body;
  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (displayName) updateData.displayName = displayName;
    if (tokenAllowance) updateData.tokenAllowance = BigInt(tokenAllowance);
    if (windowHours) updateData.windowHours = Number(windowHours);
    if (validityDays) updateData.validityDays = Number(validityDays);
    if (rateLimitRpm) updateData.rateLimitRpm = Number(rateLimitRpm);
    if (status) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });
    res.json({ success: true, plan: { ...plan, tokenAllowance: plan.tokenAllowance.toString() } });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.delete('/plans/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.plan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.get('/keys', async (req: AuthRequest, res: Response) => {
  const { filter, search } = req.query;
  try {
    let where: any = {};
    if (filter === 'active') where.status = 'active';
    if (filter === 'suspended') where.status = 'suspended';
    if (filter === 'trial') where.type = 'trial';
    if (filter === 'production') where.type = 'production';

    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { displayKey: { contains: String(search) } },
        { user: { email: { contains: String(search) } } },
      ];
    }

    const keys = await prisma.apiKey.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const result = await Promise.all(
      keys.map(async (k) => {
        const tokensNum = Number(k.purchasedTokens || 0);
        const numM = Math.round(tokensNum / 1000000);
        const computedPlan = k.type === 'trial' || (k.plan && k.plan.toLowerCase().includes('trial'))
          ? 'Trial Key'
          : (numM > 0 ? `Claude Max ${numM}x` : (k.plan || 'Claude Max 20x'));

        const windowMetrics = await calculateKeyRollingWindow(k);

        return {
          id: k.id,
          name: k.name,
          displayKey: k.displayKey,
          customer: k.user ? `${k.user.name} (${k.user.email})` : 'Unassigned',
          type: k.type,
          status: k.status,
          plan: computedPlan,
          purchasedTokens: windowMetrics.purchasedNum.toString(),
          tokensUsed: windowMetrics.windowTokensUsed.toString(),
          tokensRemaining: windowMetrics.remainingNum.toString(),
          rateLimitRpm: k.rateLimitRpm,
          expiresAt: k.expiresAt,
          totalRequests: k.totalRequests,
          createdAt: k.createdAt,
          firstUsedAt: windowMetrics.effectiveFirstUse,
          lastUsedAt: k.lastUsedAt,
          windowActive: windowMetrics.windowActive,
          nextResetAt: windowMetrics.nextResetAt,
          windowResetSeconds: windowMetrics.windowResetSeconds,
          consumptionPercent: windowMetrics.consumptionPercent,
        };
      })
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.get('/keys/:id/usage', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const key = await prisma.apiKey.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!key) return res.status(404).json({ error: { message: 'API Key not found.' } });

    const requests = await prisma.apiRequest.findMany({
      where: { apiKeyId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        model: true,
        endpoint: true,
        statusCode: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        latencyMs: true,
        streaming: true,
        createdAt: true,
      },
    });

    const windowMetrics = await calculateKeyRollingWindow(key);

    res.json({
      key: {
        id: key.id,
        name: key.name,
        displayKey: key.displayKey,
        customer: key.user ? `${key.user.name} (${key.user.email})` : 'Unassigned',
        status: key.status,
        purchasedTokens: windowMetrics.purchasedNum.toString(),
        tokensUsed: windowMetrics.windowTokensUsed.toString(),
        tokensRemaining: windowMetrics.remainingNum.toString(),
        totalRequests: key.totalRequests,
        totalInputTokens: key.totalInputTokens.toString(),
        totalOutputTokens: key.totalOutputTokens.toString(),
      },
      usage: requests,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});



router.post('/keys', async (req: AuthRequest, res: Response) => {
  const { name, userId, tokenLimit, rateLimitRpm, expiryDays, plan, isTrial } = req.body;
  try {
    const rawKey = (isTrial ? 'ld_trial_' : 'ld_live_') + crypto.randomBytes(18).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const displayKey = `${rawKey.slice(0, 11)}...${rawKey.slice(-4)}`;

    let expiresAt: Date | null = null;
    if (expiryDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    const initialTokens = BigInt(tokenLimit || (isTrial ? 1000000 : 20000000));
    const numM = Math.round(Number(initialTokens) / 1000000);
    const defaultPlan = isTrial ? 'Trial Key' : `Claude Max ${numM}x`;
    const finalPlan = plan || defaultPlan;

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: userId || null,
        keyPrefix: isTrial ? 'ld_trial_' : 'ld_live_',
        keyHash,
        displayKey,
        name: name || (isTrial ? 'Free Trial Key' : `Claude Max ${numM}x Key`),
        type: isTrial ? 'trial' : 'production',
        status: 'active',
        purchasedTokens: initialTokens,
        tokensUsed: BigInt(0),
        tokensRemaining: initialTokens,
        rateLimitRpm: Number(rateLimitRpm || 60),
        expiresAt,
        plan: finalPlan,
      },
    });

    await prisma.tokenLedger.create({
      data: {
        apiKeyId: apiKey.id,
        userId: userId || null,
        amount: initialTokens,
        balanceAfter: initialTokens,
        type: isTrial ? 'TRIAL_GRANT' : 'PURCHASE',
        reference: 'ADMIN-KEY-GEN',
        notes: `Admin created ${isTrial ? 'trial' : 'production'} key`,
      },
    });

    res.json({
      id: apiKey.id,
      rawKey,
      displayKey: apiKey.displayKey,
      name: apiKey.name,
      purchasedTokens: apiKey.purchasedTokens.toString(),
      tokensRemaining: apiKey.tokensRemaining.toString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/keys/trial', async (req: AuthRequest, res: Response) => {
  const { customerName, customerEmail, tokenAllowance, expiryDays, rateLimitRpm } = req.body;
  try {
    const rawKey = 'ld_trial_' + crypto.randomBytes(18).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const displayKey = `${rawKey.slice(0, 11)}...${rawKey.slice(-4)}`;

    let expiresAt: Date | null = null;
    if (expiryDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    const initialTokens = BigInt(tokenAllowance || 1000000);

    const apiKey = await prisma.apiKey.create({
      data: {
        keyPrefix: 'ld_trial_',
        keyHash,
        displayKey,
        name: customerName ? `${customerName} (Trial)` : 'Free Trial Key',
        type: 'trial',
        status: 'active',
        purchasedTokens: initialTokens,
        tokensUsed: BigInt(0),
        tokensRemaining: initialTokens,
        rateLimitRpm: Number(rateLimitRpm || 30),
        expiresAt,
        plan: 'Trial Key',
      },
    });

    await prisma.tokenLedger.create({
      data: {
        apiKeyId: apiKey.id,
        amount: initialTokens,
        balanceAfter: initialTokens,
        type: 'TRIAL_GRANT',
        reference: 'ADMIN-TRIAL-GEN',
        notes: `Dedicated trial key for ${customerEmail || customerName || 'customer'}`,
      },
    });

    res.json({
      id: apiKey.id,
      rawKey,
      displayKey: apiKey.displayKey,
      name: apiKey.name,
      purchasedTokens: apiKey.purchasedTokens.toString(),
      tokensRemaining: apiKey.tokensRemaining.toString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});


router.put('/keys/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, addTokens, rateLimitRpm, expiryDays } = req.body;
  try {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return res.status(404).json({ error: { message: 'Key not found.' } });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (rateLimitRpm) updateData.rateLimitRpm = Number(rateLimitRpm);

    if (expiryDays) {
      const exp = new Date();
      exp.setDate(exp.getDate() + Number(expiryDays));
      updateData.expiresAt = exp;
    }

    if (addTokens) {
      const tokensToAdd = BigInt(addTokens);
      updateData.purchasedTokens = key.purchasedTokens + tokensToAdd;
      updateData.tokensRemaining = key.tokensRemaining + tokensToAdd;

      await prisma.tokenLedger.create({
        data: {
          apiKeyId: key.id,
          userId: key.userId,
          amount: tokensToAdd,
          balanceAfter: key.tokensRemaining + tokensToAdd,
          type: 'ADMIN_ADJUSTMENT',
          reference: 'ADMIN-TOPUP',
          notes: 'Admin added tokens',
        },
      });
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.delete('/keys/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 5. Customer Account Management (/admin/customers)
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        apiKeys: true,
        orders: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = users.map((u) => {
      let totalPurchased = BigInt(0);
      let totalUsed = BigInt(0);
      let totalRemaining = BigInt(0);

      u.apiKeys.forEach((k) => {
        totalPurchased += k.purchasedTokens;
        totalUsed += k.tokensUsed;
        totalRemaining += k.tokensRemaining;
      });

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        keyCount: u.apiKeys.length,
        orderCount: u.orders.length,
        purchasedTokens: totalPurchased.toString(),
        tokensUsed: totalUsed.toString(),
        tokensRemaining: totalRemaining.toString(),
        createdAt: u.createdAt,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 6. Security & Audit Logs (/admin/security, /admin/logs)
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.adminLog.findMany({
      include: { adminUser: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.get('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.apiRequest.findMany({
      include: { apiKey: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/emergency/status
router.get('/emergency/status', async (req: Request, res: Response) => {
  try {
    const globalKillswitch = await prisma.systemSetting.findUnique({ where: { key: 'global_api_disabled' } });
    const trialKillswitch = await prisma.systemSetting.findUnique({ where: { key: 'trials_disabled' } });

    res.json({
      globalApiDisabled: globalKillswitch?.value === 'true',
      trialsDisabled: trialKillswitch?.value === 'true',
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});


// GET /api/admin/leads - Manage quote leads
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PUT /api/admin/leads/:id - Update lead status
router.put('/leads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.lead.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/tickets - List all customer support tickets
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/tickets/:id - Get ticket details and messages
router.get('/tickets/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: {
          include: { sender: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: { message: 'Support ticket not found.' } });
    }

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/tickets/:id/messages - Admin reply to ticket
router.post('/tickets/:id/messages', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: { message: 'Message content cannot be empty.' } });
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: { message: 'Support ticket not found.' } });
    }

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: req.user!.id,
        senderRole: 'admin',
        content: String(content).trim(),
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'Awaiting Customer', updatedAt: new Date() },
    });

    res.status(201).json(msg);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PUT /api/admin/tickets/:id/status - Update ticket status
router.put('/tickets/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/search - Global admin search across customers, keys, orders, requests, tickets
router.get('/search', async (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.json({ customers: [], keys: [], orders: [], requests: [], tickets: [] });
  }

  try {
    const [customers, keys, orders, requests, tickets] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true, role: true, status: true },
      }),
      prisma.apiKey.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { displayKey: { contains: query } },
            { keyPrefix: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, name: true, displayKey: true, status: true, tokensRemaining: true },
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { paymentReference: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, amountInr: true, status: true, createdAt: true },
      }),
      prisma.apiRequest.findMany({
        where: {
          OR: [
            { requestId: { contains: query } },
            { model: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, requestId: true, model: true, statusCode: true, createdAt: true },
      }),
      prisma.supportTicket.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { subject: { contains: query } },
          ],
        },
        take: 5,
        select: { id: true, subject: true, status: true, category: true },
      }),
    ]);

    const sanitizedKeys = keys.map((k) => ({ ...k, tokensRemaining: k.tokensRemaining.toString() }));

    res.json({ customers, keys: sanitizedKeys, orders, requests, tickets });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});



router.post('/emergency/toggle-global-api', async (req: AuthRequest, res: Response) => {
  const { disabled } = req.body;
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'global_api_disabled' },
      update: { value: disabled ? 'true' : 'false' },
      create: { key: 'global_api_disabled', value: disabled ? 'true' : 'false' },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'EMERGENCY_GLOBAL_API_TOGGLE',
        targetType: 'SystemSetting',
        metadata: `Set global_api_disabled = ${disabled}`,
      },
    });

    res.json({ success: true, globalApiDisabled: !!disabled });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

export default router;
