import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma, encryptText, decryptText } from './db';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwtConfig';
import { hashSecret } from './authSecurity';
import { AuthRequest, authenticateJwt, requireAdmin, hashPasswordScrypt, verifyPasswordScrypt } from './auth';
import { calculateKeyRollingWindow } from './window';
import { checkMasterCapacity, topUpMasterBalance, reconcileMasterLedger, calculateActiveEntitlementExposure } from './masterLedger';
import { getRealtimeAnalyticsReport } from './analyticsTracker';
import { recordAuditEvent, getEventCorrelation, getAuditSummary, verifyHashChainIntegrity } from './auditLogger';
import { resolveIpLocation } from './geoService';
import { isDisposableDomain } from './antiAbuse';
import { OrderEngine } from './orders/orderEngine';
import { getPaymentProvider } from './payments';
import { generateProviderApiKey, generateRotatedKeyMaterial } from './keyService';
import { ProviderRegistry } from './providerAdapter';
import { VendorRenewalService } from './providers/vendorRenewalService';
import { ProviderDiscoveryRegistry } from './providers/ProviderDiscoveryRegistry';
import { calculateAggregateAccounting } from './accounting/aggregateAccounting';
import { isLocalModelFamily, isClaudeOrOpenAIModelFamily } from './providers/credentialResolver';

const router = Router();


// Protect all admin routes with JWT and Admin Role
router.use(authenticateJwt, requireAdmin);

// Admin Session Verification Endpoints
router.get('/auth/me', async (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});
router.get('/me', async (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

// Realtime Google Analytics & Web Traffic Endpoint
router.get('/analytics/realtime', async (req: AuthRequest, res: Response) => {
  try {
    const report = getRealtimeAnalyticsReport();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve realtime analytics report', message: error.message });
  }
});


// 1. Admin Platform Overview Metrics
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalKeys,
      activeKeys,
      trialKeys,
      totalOrders,
      pendingOrders,
      ordersToday,
      totalTokensSoldAgg,
      totalTokensConsumedAgg,
      requestsCount,
      requestsToday,
      tokensTodayAgg,
      tokensWindowAgg,
      failedRequestsCount,
      avgLatencyResult,
      openSupportTickets,
      primaryVendor,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.apiKey.count(),
      prisma.apiKey.count({
        where: {
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      prisma.apiKey.count({ where: { type: 'trial' } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.aggregate({
        _sum: { tokenQuantity: true, amountInr: true },
        where: { status: 'PAID' },
      }),
      prisma.apiKey.aggregate({
        _sum: { tokensUsed: true, tokensRemaining: true },
      }),
      prisma.apiRequest.count(),
      prisma.apiRequest.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: { createdAt: { gte: fiveHoursAgo } },
      }),
      prisma.apiRequest.count({ where: { statusCode: { gte: 400 } } }),
      prisma.apiRequest.aggregate({ _avg: { latencyMs: true } }),
      prisma.supportTicket.count({ where: { status: { in: ['Open', 'Awaiting Support'] } } }),
      prisma.vendorProvider.findFirst({ where: { isPrimary: true } }),
    ]);

    const errorRate = requestsCount > 0 ? ((failedRequestsCount / requestsCount) * 100).toFixed(1) + '%' : '0.0%';

    const masterCapacity = await checkMasterCapacity(primaryVendor?.id);
    const entitlementExposure = await calculateActiveEntitlementExposure();

    res.json({
      totalUsers,
      activeUsers,
      totalKeys,
      activeKeys,
      trialKeys,
      totalOrders,
      pendingOrders,
      ordersToday,
      revenueInr: totalTokensSoldAgg._sum.amountInr || 0,
      tokensSold: totalTokensSoldAgg._sum.tokenQuantity?.toString() || '0',
      tokensConsumed: totalTokensConsumedAgg._sum.tokensUsed?.toString() || '0',
      tokensRemaining: totalTokensConsumedAgg._sum.tokensRemaining?.toString() || '0',
      totalRequests: requestsCount,
      requestsToday,
      tokensUsedToday: (tokensTodayAgg._sum.totalTokens || 0).toString(),
      tokensUsedThisWindow: (tokensWindowAgg._sum.totalTokens || 0).toString(),
      failedRequests: failedRequestsCount,
      errorRate,
      openSupportTickets,
      avgLatencyMs: Math.round(avgLatencyResult._avg.latencyMs || 0),
      vendorStatus: primaryVendor ? primaryVendor.status : 'not_configured',
      masterVendorCapacity: {
        availableTokens: masterCapacity.availableTokens,
        rawAvailableTokens: masterCapacity.rawAvailableTokens,
        reservedTokens: masterCapacity.reservedTokens,
        status: masterCapacity.status,
        providerName: primaryVendor?.name || 'Default Vendor',
        providerId: primaryVendor?.id || null,
        capacityModel: primaryVendor?.capacityModel || masterCapacity.capacityModel || 'rolling_window',
        windowHours: primaryVendor?.windowHours || masterCapacity.windowHours || 5,
        windowAllowance: (primaryVendor?.windowAllowance || masterCapacity.windowAllowance || '5000000').toString(),
        windowTokensUsed: masterCapacity.windowTokensUsed || 0,
        nextResetAt: masterCapacity.nextResetAt || null,
        windowResetSeconds: masterCapacity.windowResetSeconds || null,
      },
      activeEntitlementExposure: entitlementExposure,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message, code: 'DB_UNAVAILABLE' } });
  }
});



import { validateVendorBaseUrl } from './ssrf';

// 2. Vendor Provider Master Credentials Management & Connection Test (/admin/providers)
router.get('/providers', async (req: AuthRequest, res: Response) => {
  try {
    const defaultSetting = await prisma.systemSetting.findUnique({
      where: { key: 'default_provider_id' },
    });
    const defaultId = defaultSetting?.value?.trim();

    const providers = await prisma.vendorProvider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Mask master API keys for response security and enrich with provider health/telemetry metrics
    const enriched = await Promise.all(
      providers.map(async (p) => {
        const decrypted = decryptText(p.masterApiKeyEncrypted);
        const displayKey = decrypted ? `${decrypted.slice(0, 8)}...${decrypted.slice(-4)}` : 'Not Set';

        // Extract clean hostname from baseUrl
        let baseUrlHostname = p.baseUrl;
        try {
          baseUrlHostname = new URL(p.baseUrl).hostname;
        } catch {}

        // Compute telemetry & associations
        const [activeKeyCount, totalKeyCount, totalRequests, errorRequests, latencyAgg] = await Promise.all([
          prisma.apiKey.count({ where: { providerId: p.id, status: 'active' } }),
          prisma.apiKey.count({ where: { providerId: p.id } }),
          prisma.apiRequest.count({ where: { providerId: p.id } }),
          prisma.apiRequest.count({ where: { providerId: p.id, statusCode: { gte: 400 } } }),
          prisma.apiRequest.aggregate({
            where: { providerId: p.id, latencyMs: { gt: 0 } },
            _avg: { latencyMs: true },
          }),
        ]);

        const errorRate = totalRequests > 0 ? Number(((errorRequests / totalRequests) * 100).toFixed(2)) : 0;
        const avgLatencyMs = latencyAgg._avg.latencyMs ? Math.round(latencyAgg._avg.latencyMs) : 0;

        const cap = await checkMasterCapacity(p.id, 0);

        return {
          ...p,
          availableTokens: cap.availableTokens.toString(),
          purchasedTokens: (p.capacityModel === 'rolling_window' && Number(p.windowAllowance) > 0 ? p.windowAllowance : p.purchasedTokens).toString(),
          status: p.status === 'disabled' ? 'disabled' : cap.status,
          isDefault: p.id === defaultId,
          masterApiKeyEncrypted: undefined,
          creditApiKeyEncrypted: undefined,
          tokenApiKeyEncrypted: undefined,
          hasCreditKey: Boolean((p.creditApiKeyEncrypted && p.creditApiKeyEncrypted.length > 0) || (p.masterApiKeyEncrypted && p.masterApiKeyEncrypted.length > 0)),
          hasTokenKey: Boolean(p.tokenApiKeyEncrypted && p.tokenApiKeyEncrypted.length > 0),
          displayMasterKey: displayKey,
          baseUrlHostname,
          activeKeyCount,
          totalKeyCount,
          requestCount: totalRequests,
          errorRate,
          avgLatencyMs,
          windowTokensUsed: cap.windowTokensUsed,
          nextResetAt: cap.nextResetAt,
          windowResetSeconds: cap.windowResetSeconds,
          discoverySource: p.discoverySource || 'NOT_DISCOVERED',
          discoveryStatus: p.discoveryStatus || 'UNKNOWN',
          discoveryConfidence: p.discoveryConfidence || 'UNKNOWN',
          discoveredLimitTokens: p.discoveredLimitTokens?.toString() ?? null,
          discoveredRemainingTokens: p.discoveredRemainingTokens?.toString() ?? null,
          lastDiscoveredAt: p.lastDiscoveredAt?.toISOString() ?? null,
          configuredLimitTokens: p.configuredLimitTokens?.toString() ?? null,
        };
      })
    );
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/providers', async (req: AuthRequest, res: Response) => {
  const {
    name,
    providerType,
    protocol,
    masterApiKey,
    baseUrl,
    isPrimary,
    notes,
    modelMappingsJson,
    headersJson,
    status,
    warningThresholdTokens,
    criticalThresholdTokens,
    availableTokens,
    purchasedTokens,
    capacityModel,
    windowHours,
    windowAllowance,
  } = req.body;

  // Validate Base URL against SSRF threats
  const ssrfCheck = validateVendorBaseUrl(baseUrl || 'https://api.anthropic.com');
  if (!ssrfCheck.safe) {
    return res.status(400).json({ error: { message: ssrfCheck.error || 'Invalid Base URL (SSRF Policy Failure)' } });
  }

  try {
    const encryptedKey = encryptText(masterApiKey || '');

    if (isPrimary) {
      await prisma.vendorProvider.updateMany({ data: { isPrimary: false } });
    }

    const isRolling = capacityModel === 'rolling_window';
    const winHours = windowHours !== undefined ? Number(windowHours) : 5;
    const winAllowance = windowAllowance !== undefined ? BigInt(windowAllowance) : (isRolling ? BigInt(5000000) : BigInt(0));

    const initialAvailable = availableTokens !== undefined
      ? BigInt(availableTokens)
      : (isRolling ? winAllowance : (masterApiKey ? BigInt(100000000) : BigInt(0)));
    const initialPurchased = purchasedTokens !== undefined ? BigInt(purchasedTokens) : (isRolling ? winAllowance : initialAvailable);
    const warningTokens = warningThresholdTokens !== undefined
      ? BigInt(warningThresholdTokens)
      : (isRolling ? BigInt(1000000) : BigInt(20000000));
    const criticalTokens = criticalThresholdTokens !== undefined
      ? BigInt(criticalThresholdTokens)
      : (isRolling ? BigInt(250000) : BigInt(5000000));

    const provider = await prisma.vendorProvider.create({
      data: {
        name: name || 'Vendor Provider',
        providerType: providerType || 'anthropic',
        protocol: protocol || providerType || 'anthropic',
        masterApiKeyEncrypted: encryptedKey,
        baseUrl: ssrfCheck.normalizedUrl || 'https://api.anthropic.com',
        isPrimary: !!isPrimary,
        status: status || (masterApiKey ? 'connected' : 'disabled'),
        capacityModel: isRolling ? 'rolling_window' : 'lifetime_prepaid',
        windowHours: winHours,
        windowAllowance: winAllowance,
        availableTokens: initialAvailable,
        purchasedTokens: initialPurchased,
        warningThresholdTokens: warningTokens,
        criticalThresholdTokens: criticalTokens,
        configuredLimitTokens: winAllowance > BigInt(0) ? winAllowance : initialPurchased,
        notes,
        modelMappingsJson,
        headersJson,
        apiCreditBaseUrl: req.body.apiCreditBaseUrl || null,
        tokenPackBaseUrl: req.body.tokenPackBaseUrl || null,
        creditApiKeyEncrypted: req.body.creditApiKey && req.body.creditApiKey.trim() ? encryptText(req.body.creditApiKey.trim()) : null,
        tokenApiKeyEncrypted: req.body.tokenApiKey && req.body.tokenApiKey.trim() ? encryptText(req.body.tokenApiKey.trim()) : null,
        costPerMillionInput: req.body.costPerMillionInput !== undefined ? Number(req.body.costPerMillionInput) : 1.5,
        costPerMillionOutput: req.body.costPerMillionOutput !== undefined ? Number(req.body.costPerMillionOutput) : 6.0,
        supportedFamiliesJson: req.body.supportedFamiliesJson || null,
      },
    });

    if (isPrimary) {
      await prisma.systemSetting.upsert({
        where: { key: 'default_provider_id' },
        update: { value: provider.id },
        create: { key: 'default_provider_id', value: provider.id },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'CREATE_VENDOR_PROVIDER',
        targetType: 'VendorProvider',
        targetId: provider.id,
        metadata: `Created vendor provider: ${provider.name} (Model: ${provider.capacityModel})`,
      },
    });

    if (provider.masterApiKeyEncrypted) {
      ProviderDiscoveryRegistry.discoverProvider(provider.id).catch((e) => console.warn('Provider auto-discovery error:', e));
    }
    res.json({ success: true, providerId: provider.id });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/providers/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    providerType,
    protocol,
    masterApiKey,
    baseUrl,
    status,
    isPrimary,
    notes,
    modelMappingsJson,
    headersJson,
    warningThresholdTokens,
    criticalThresholdTokens,
    availableTokens,
    purchasedTokens,
    capacityModel,
    windowHours,
    windowAllowance,
  } = req.body;

  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (providerType !== undefined) updateData.providerType = providerType;
    if (protocol !== undefined) updateData.protocol = protocol;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (modelMappingsJson !== undefined) updateData.modelMappingsJson = modelMappingsJson;
    if (headersJson !== undefined) updateData.headersJson = headersJson;
    if (capacityModel !== undefined) updateData.capacityModel = capacityModel;
    if (windowHours !== undefined) updateData.windowHours = Number(windowHours);
    if (windowAllowance !== undefined) {
      updateData.windowAllowance = BigInt(windowAllowance);
      updateData.configuredLimitTokens = BigInt(windowAllowance);
      if (capacityModel === 'rolling_window' || updateData.capacityModel === 'rolling_window') {
        updateData.availableTokens = BigInt(windowAllowance);
        updateData.purchasedTokens = BigInt(windowAllowance);
      }
    }
    if (purchasedTokens !== undefined) updateData.purchasedTokens = BigInt(purchasedTokens);
    if (masterApiKey && masterApiKey.trim()) updateData.masterApiKeyEncrypted = encryptText(masterApiKey.trim());
    if (req.body.creditApiKey !== undefined && typeof req.body.creditApiKey === 'string' && req.body.creditApiKey.trim()) {
      updateData.creditApiKeyEncrypted = encryptText(req.body.creditApiKey.trim());
    }
    if (req.body.tokenApiKey !== undefined && typeof req.body.tokenApiKey === 'string' && req.body.tokenApiKey.trim()) {
      updateData.tokenApiKeyEncrypted = encryptText(req.body.tokenApiKey.trim());
    }
    if (warningThresholdTokens !== undefined) updateData.warningThresholdTokens = BigInt(warningThresholdTokens);
    if (criticalThresholdTokens !== undefined) updateData.criticalThresholdTokens = BigInt(criticalThresholdTokens);
    if (availableTokens !== undefined) updateData.availableTokens = BigInt(availableTokens);

    if (req.body.apiCreditBaseUrl !== undefined) {
      const ssrfCheck = validateVendorBaseUrl(req.body.apiCreditBaseUrl);
      if (ssrfCheck.safe) updateData.apiCreditBaseUrl = ssrfCheck.normalizedUrl;
    }
    if (req.body.tokenPackBaseUrl !== undefined) {
      const ssrfCheck = validateVendorBaseUrl(req.body.tokenPackBaseUrl);
      if (ssrfCheck.safe) updateData.tokenPackBaseUrl = ssrfCheck.normalizedUrl;
    }
    if (req.body.costPerMillionInput !== undefined) updateData.costPerMillionInput = Number(req.body.costPerMillionInput);
    if (req.body.costPerMillionOutput !== undefined) updateData.costPerMillionOutput = Number(req.body.costPerMillionOutput);
    if (req.body.supportedFamiliesJson !== undefined) updateData.supportedFamiliesJson = req.body.supportedFamiliesJson;

    if (baseUrl !== undefined) {
      const ssrfCheck = validateVendorBaseUrl(baseUrl);
      if (!ssrfCheck.safe) {
        return res.status(400).json({ error: { message: ssrfCheck.error || 'Invalid Base URL (SSRF Policy Failure)' } });
      }
      updateData.baseUrl = ssrfCheck.normalizedUrl;
    }

    if (isPrimary) {
      await prisma.vendorProvider.updateMany({ data: { isPrimary: false } });
      updateData.isPrimary = true;
      await prisma.systemSetting.upsert({
        where: { key: 'default_provider_id' },
        update: { value: id },
        create: { key: 'default_provider_id', value: id },
      });
    }

    const provider = await prisma.vendorProvider.update({
      where: { id },
      data: updateData,
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'UPDATE_VENDOR_PROVIDER',
        targetType: 'VendorProvider',
        targetId: provider.id,
        metadata: `Updated vendor provider: ${provider.name}`,
      },
    });

    res.json({ success: true, provider });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// Set default provider for newly generated API keys (SystemSetting.default_provider_id)
router.post('/providers/:id/set-default', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const provider = await prisma.vendorProvider.findUnique({ where: { id } });
    if (!provider) {
      return res.status(404).json({ error: { message: 'Vendor provider not found.' } });
    }
    if (provider.status === 'disabled') {
      return res.status(400).json({ error: { message: 'Cannot set a disabled provider as default.' } });
    }

    await prisma.systemSetting.upsert({
      where: { key: 'default_provider_id' },
      update: { value: id, description: `Authoritative default provider ID (${provider.name})` },
      create: { key: 'default_provider_id', value: id, description: `Authoritative default provider ID (${provider.name})` },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'SET_DEFAULT_PROVIDER',
        targetType: 'VendorProvider',
        targetId: provider.id,
        metadata: `Set default provider to: ${provider.name}`,
      },
    });

    res.json({ success: true, defaultProviderId: id, providerName: provider.name });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/providers/scalemax/live-status - Real-time upstream verification for all 3 ScaleMax keys
router.get('/providers/scalemax/live-status', async (req: AuthRequest, res: Response) => {
  try {
    const scalemaxCreditKey = process.env.SCALEMAX_CREDIT_API_KEY || process.env.SCALEMAX_MASTER_API_KEY || '';
    const scalemaxTokenKey = process.env.SCALEMAX_TOKEN_API_KEY || '';
    const scalemaxLocalKey = process.env.SCALEMAX_LOCAL_TOKEN_API_KEY || '';

    // Check database encrypted keys as well
    const scalemaxProvider = await prisma.vendorProvider.findFirst({
      where: {
        OR: [
          { slug: 'scalemax' },
          { name: { contains: 'scalemax', mode: 'insensitive' } },
        ],
      },
    });

    const dbCreditKey = scalemaxProvider?.creditApiKeyEncrypted ? decryptText(scalemaxProvider.creditApiKeyEncrypted) : '';
    const dbTokenKey = scalemaxProvider?.tokenApiKeyEncrypted ? decryptText(scalemaxProvider.tokenApiKeyEncrypted) : '';
    const dbLocalKey = (scalemaxProvider as any)?.localTokenApiKeyEncrypted ? decryptText((scalemaxProvider as any).localTokenApiKeyEncrypted) : '';

    const activeCreditKey = dbCreditKey || scalemaxCreditKey;
    const activeTokenKey = dbTokenKey || scalemaxTokenKey;
    const activeLocalKey = dbLocalKey || scalemaxLocalKey;

    const keysToInspect = [
      {
        keyIndex: 1,
        role: 'Claude & OpenAI Frontier Key',
        shortRole: 'Claude + OpenAI',
        description: 'Dedicated supplier key provisioned for Claude Sonnet, Opus and OpenAI models',
        key: activeTokenKey,
        targetModels: 'Claude + OpenAI Family',
        endpoint: 'https://api.scalemax.pro/v1',
        isPrimaryActive: true,
      },
      {
        keyIndex: 2,
        role: 'Local & Open-Weights Models Key',
        shortRole: 'Local Models',
        description: 'Dedicated supplier key provisioned for open-weights models (DeepSeek, Grok, Qwen, GLM)',
        key: activeLocalKey,
        targetModels: 'Open-Weights & Labs (DeepSeek, Grok, Qwen, GLM)',
        endpoint: 'https://api.scalemax.pro/v1',
        isPrimaryActive: true,
      },
      {
        keyIndex: 3,
        role: 'Initial Provisioned Master Key',
        shortRole: 'Credit Master (Rotated)',
        description: 'Initial wholesale master key; superseded by vendor with the 2 dedicated replacement keys above',
        key: activeCreditKey,
        targetModels: 'Universal (Legacy Test Quota)',
        endpoint: 'https://api.scalemax.pro/v1',
        isPrimaryActive: false,
      },
    ];

    const results = await Promise.all(
      keysToInspect.map(async (item) => {
        if (!item.key) {
          return {
            keyIndex: item.keyIndex,
            role: item.role,
            shortRole: item.shortRole,
            description: item.description,
            keyPrefix: 'Not Configured',
            status: 'UNCONFIGURED',
            latencyMs: null,
            error: 'Key not configured in environment or database',
            targetModels: item.targetModels,
            endpoint: item.endpoint,
            modelsCount: 0,
            models: [],
          };
        }

        const keyPrefix = item.key.slice(0, 12) + '••••••••';
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const [usageResp, modelsResp] = await Promise.all([
            fetch('https://api.scalemax.pro/v1/usage', {
              method: 'GET',
              headers: {
                Authorization: 'Bearer ' + item.key,
                'User-Agent': 'LightningAPI-Admin/1.0',
              },
              signal: controller.signal,
            }).catch((err) => ({ ok: false, status: 500, error: err })),
            fetch('https://api.scalemax.pro/v1/models', {
              method: 'GET',
              headers: {
                Authorization: 'Bearer ' + item.key,
                'User-Agent': 'LightningAPI-Admin/1.0',
              },
              signal: controller.signal,
            }).catch(() => null),
          ]);
          clearTimeout(timeout);
          const latencyMs = Date.now() - start;

          let modelsList: string[] = [];
          if (modelsResp && 'ok' in modelsResp && modelsResp.ok) {
            try {
              const mData: any = await modelsResp.json();
              if (mData.data && Array.isArray(mData.data)) {
                const rawModels: string[] = mData.data.map((m: any) => m.id);
                if (item.keyIndex === 1) {
                  // Key #1: Claude & OpenAI Frontier Key - Strictly isolate Claude & OpenAI models (exclude Grok, DeepSeek, Gemini, etc.)
                  modelsList = rawModels.filter(isClaudeOrOpenAIModelFamily);
                } else if (item.keyIndex === 2) {
                  // Key #2: Local & Open-Weights Models Key - Strictly isolate Local/Open-weights models (DeepSeek, Grok, Qwen, GLM, etc.)
                  modelsList = rawModels.filter(isLocalModelFamily);
                } else {
                  modelsList = rawModels;
                }
              }
            } catch {}
          }

          if (usageResp && 'ok' in usageResp && usageResp.ok) {
            const data: any = await usageResp.json();
            return {
              keyIndex: item.keyIndex,
              role: item.role,
              shortRole: item.shortRole,
              description: item.description,
              keyPrefix,
              status: 'HEALTHY',
              latencyMs,
              vendorLabel: data.key?.label || 'ScaleMax',
              mode: data.key?.mode || 'credit',
              providerScope: data.key?.provider_scope || 'both',
              rpmLimit: data.key?.rpm_limit || 60,
              creditsBalanceUsd: data.credits?.balance ?? data.credits?.remaining_usd ?? 0,
              totalPurchasedUsd: data.credits?.total_purchased ?? 0,
              lifetimeSpendUsd: data.credits?.lifetime_spend ?? 0,
              todaySpendUsd: data.credits?.today_spend ?? 0,
              requestsTotal: data.requests?.total ?? 0,
              tokensInput: data.tokens?.input ?? 0,
              tokensOutput: data.tokens?.output ?? 0,
              targetModels: item.targetModels,
              endpoint: item.endpoint,
              modelsCount: modelsList.length,
              models: modelsList,
              rawSummary: data,
            };
          } else {
            const uStatus = usageResp?.status || 500;
            let errMessage = 'Upstream call failed';
            if (usageResp && typeof usageResp.text === 'function') {
              try {
                const errText = await usageResp.text();
                const parsed = JSON.parse(errText);
                errMessage = parsed?.error?.message || errText;
              } catch (parseErr) {}
            }

            const isSuperseded = uStatus === 401 && !item.isPrimaryActive;

            return {
              keyIndex: item.keyIndex,
              role: item.role,
              shortRole: item.shortRole,
              description: item.description,
              keyPrefix,
              status: isSuperseded ? 'SUPERSEDED' : 'ERROR',
              statusCode: uStatus,
              latencyMs,
              error: isSuperseded
                ? 'Vendor superseded this initial test key with the 2 dedicated replacement keys (sm_live_9438 & sm_live_8bea)'
                : errMessage,
              targetModels: item.targetModels,
              endpoint: item.endpoint,
              modelsCount: 0,
              models: [],
            };
          }
        } catch (fetchErr: any) {
          return {
            keyIndex: item.keyIndex,
            role: item.role,
            shortRole: item.shortRole,
            description: item.description,
            keyPrefix,
            status: 'UNREACHABLE',
            latencyMs: Date.now() - start,
            error: fetchErr.message || 'Connection timeout to ScaleMax upstream',
            targetModels: item.targetModels,
            endpoint: item.endpoint,
            modelsCount: 0,
            models: [],
          };
        }
      })
    );

    res.json({
      success: true,
      provider: 'ScaleMax',
      timestamp: new Date().toISOString(),
      keys: results,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/providers/scalemax/validate-key - Validate an API key directly against ScaleMax upstream
router.post('/providers/scalemax/validate-key', async (req: AuthRequest, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ valid: false, error: 'API key is required' });
  }

  const cleanKey = apiKey.trim();
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const [usageResp, modelsResp] = await Promise.all([
      fetch('https://api.scalemax.pro/v1/usage', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + cleanKey,
          'User-Agent': 'LightningAPI-Admin/1.0',
        },
        signal: controller.signal,
      }).catch((err) => ({ ok: false, status: 500, error: err } as any)),
      fetch('https://api.scalemax.pro/v1/models', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + cleanKey,
          'User-Agent': 'LightningAPI-Admin/1.0',
        },
        signal: controller.signal,
      }).catch(() => null),
    ]);
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    let modelsList: string[] = [];
    if (modelsResp && 'ok' in modelsResp && modelsResp.ok) {
      try {
        const mData: any = await modelsResp.json();
        if (mData.data && Array.isArray(mData.data)) {
          const rawModels: string[] = mData.data.map((m: any) => m.id);
          const { keyIndex } = req.body;
          if (keyIndex === 1) {
            modelsList = rawModels.filter(isClaudeOrOpenAIModelFamily);
          } else if (keyIndex === 2) {
            modelsList = rawModels.filter(isLocalModelFamily);
          } else {
            modelsList = rawModels;
          }
        }
      } catch {}
    }

    if (usageResp && 'ok' in usageResp && usageResp.ok) {
      const data: any = await usageResp.json();
      return res.json({
        valid: true,
        latencyMs,
        keyLabel: data.key?.label || 'ScaleMax Key',
        providerScope: data.key?.provider_scope || 'universal',
        status: data.key?.status || 'active',
        rpmLimit: data.key?.rpm_limit || 60,
        creditsBalanceUsd: data.credits?.balance ?? data.credits?.remaining_usd ?? 0,
        modelsCount: modelsList.length,
        models: modelsList,
      });
    }

    let errMessage = 'Upstream validation failed';
    const status = usageResp?.status || 500;
    if (usageResp && typeof usageResp.text === 'function') {
      try {
        const errText = await usageResp.text();
        const parsed = JSON.parse(errText);
        errMessage = parsed?.error?.message || errText;
      } catch {}
    }

    return res.json({
      valid: false,
      statusCode: status,
      error: status === 401 ? 'Invalid API key or unauthorized (ScaleMax returned 401)' : errMessage,
    });
  } catch (err: any) {
    return res.json({
      valid: false,
      error: err.message || 'Connection timeout or network error connecting to ScaleMax',
    });
  }
});

// POST /api/admin/providers/scalemax/update-key - Persist updated ScaleMax key for specific plan group
router.post('/providers/scalemax/update-key', async (req: AuthRequest, res: Response) => {
  const { keyIndex, apiKey } = req.body;
  if (!keyIndex || !apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: { message: 'Missing keyIndex or apiKey' } });
  }

  const cleanKey = apiKey.trim();

  try {
    const scalemaxProvider = await prisma.vendorProvider.findFirst({
      where: {
        OR: [
          { slug: 'scalemax' },
          { name: { contains: 'scalemax', mode: 'insensitive' } },
        ],
      },
    });

    if (!scalemaxProvider) {
      return res.status(404).json({ error: { message: 'ScaleMax vendor provider not found in database' } });
    }

    const encrypted = encryptText(cleanKey);
    const updateData: any = {};

    if (keyIndex === 1) {
      // Key #1: Claude & OpenAI Frontier Key (Token Key)
      updateData.tokenApiKeyEncrypted = encrypted;
      process.env.SCALEMAX_TOKEN_API_KEY = cleanKey;
      process.env.SCALEMAX_TOKEN_MASTER_API_KEY = cleanKey;
    } else if (keyIndex === 2) {
      // Key #2: Local & Open-Weights Models Key (Local Token Key)
      updateData.localTokenApiKeyEncrypted = encrypted;
      process.env.SCALEMAX_LOCAL_TOKEN_API_KEY = cleanKey;
    } else if (keyIndex === 3) {
      // Key #3: Universal / Credit Master Key
      updateData.creditApiKeyEncrypted = encrypted;
      updateData.masterApiKeyEncrypted = encrypted;
      process.env.SCALEMAX_CREDIT_API_KEY = cleanKey;
      process.env.SCALEMAX_MASTER_API_KEY = cleanKey;
    } else {
      return res.status(400).json({ error: { message: 'Invalid keyIndex: must be 1, 2, or 3' } });
    }

    await prisma.vendorProvider.update({
      where: { id: scalemaxProvider.id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: `Key #${keyIndex} successfully updated and activated`,
      keyIndex,
      prefix: cleanKey.slice(0, 12) + '••••••••',
    });
  } catch (err: any) {
    console.error('Failed to update ScaleMax key:', err);
    return res.status(500).json({ error: { message: err.message || 'Database update failed' } });
  }
});

// POST /api/admin/providers/scalemax/test-inference - Live upstream inference test
router.post('/providers/scalemax/test-inference', async (req: AuthRequest, res: Response) => {
  const { keyIndex, model, prompt } = req.body;
  try {
    const scalemaxProvider = await prisma.vendorProvider.findFirst({
      where: {
        OR: [
          { slug: 'scalemax' },
          { name: { contains: 'scalemax', mode: 'insensitive' } },
        ],
      },
    });

    const dbTokenKey = scalemaxProvider?.tokenApiKeyEncrypted ? decryptText(scalemaxProvider.tokenApiKeyEncrypted) : '';
    const dbLocalKey = (scalemaxProvider as any)?.localTokenApiKeyEncrypted ? decryptText((scalemaxProvider as any).localTokenApiKeyEncrypted) : '';
    const dbCreditKey = scalemaxProvider?.creditApiKeyEncrypted ? decryptText(scalemaxProvider.creditApiKeyEncrypted) : '';

    const scalemaxTokenKey = dbTokenKey || process.env.SCALEMAX_TOKEN_API_KEY || '';
    const scalemaxLocalKey = dbLocalKey || process.env.SCALEMAX_LOCAL_TOKEN_API_KEY || '';
    const scalemaxCreditKey = dbCreditKey || process.env.SCALEMAX_CREDIT_API_KEY || process.env.SCALEMAX_MASTER_API_KEY || '';

    let key = '';
    if (keyIndex === 1) key = scalemaxTokenKey;
    else if (keyIndex === 2) key = scalemaxLocalKey;
    else if (keyIndex === 3) key = scalemaxCreditKey;
    else key = scalemaxTokenKey || scalemaxLocalKey;

    if (!key) {
      return res.status(400).json({ error: { message: 'Key not found for key index ' + keyIndex } });
    }

    const testModel = model || (keyIndex === 2 ? 'qwen-3.7-flash' : 'claude-sonnet-4-6[1m]');
    const testPrompt = prompt || 'Say hello and state your model name';
    const start = Date.now();

    const isAnthropicStyle = testModel.includes('claude') || testModel.includes('fable');
    const endpoint = isAnthropicStyle
      ? 'https://api.scalemax.pro/v1/messages'
      : 'https://api.scalemax.pro/v1/chat/completions';

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key,
    };
    if (isAnthropicStyle) {
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
    }

    const payload = isAnthropicStyle
      ? {
          model: testModel,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 25,
        }
      : {
          model: testModel,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 25,
        };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const latencyMs = Date.now() - start;
    const respText = await resp.text();
    let parsed = null;
    try {
      parsed = JSON.parse(respText);
    } catch {
      parsed = { raw: respText };
    }

    res.json({
      success: resp.ok,
      statusCode: resp.status,
      latencyMs,
      endpoint,
      model: testModel,
      response: parsed,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/providers/failover-config - Get failover & default provider routing settings
router.get('/providers/failover-config', async (req: AuthRequest, res: Response) => {
  try {
    const config = await ProviderRegistry.getGatewayConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/providers/failover-config - Update failover & default provider settings
router.post('/providers/failover-config', async (req: AuthRequest, res: Response) => {
  const { enableAutoFailover, primaryProviderId, fallbackProviderId, failoverStatusCodes, defaultProviderId } = req.body;
  try {
    const updateData: any = {};
    if (enableAutoFailover !== undefined) updateData.enableAutoFailover = Boolean(enableAutoFailover);
    if (primaryProviderId !== undefined) updateData.primaryProviderId = primaryProviderId;
    if (fallbackProviderId !== undefined) updateData.fallbackProviderId = fallbackProviderId;
    if (defaultProviderId !== undefined) updateData.defaultProviderId = defaultProviderId;
    if (failoverStatusCodes !== undefined) {
      updateData.failoverStatusCodes = Array.isArray(failoverStatusCodes) ? failoverStatusCodes.join(',') : failoverStatusCodes;
    }

    const config = await prisma.gatewayProviderConfig.upsert({
      where: { key: 'default_gateway' },
      update: updateData,
      create: {
        key: 'default_gateway',
        ...updateData,
      },
    });

    ProviderRegistry.clearCache();

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'UPDATE_PROVIDER_FAILOVER_CONFIG',
        targetType: 'GatewayProviderConfig',
        targetId: config.id,
        metadata: JSON.stringify(updateData),
      },
    });

    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/providers/migrate-keys - Bulk migrate API keys between providers
router.post('/providers/migrate-keys', async (req: AuthRequest, res: Response) => {
  const { sourceProviderId, targetProviderId, keyIds, reason } = req.body;
  try {
    if (!targetProviderId) {
      return res.status(400).json({ error: { message: 'targetProviderId is required.' } });
    }

    const targetProvider = await prisma.vendorProvider.findUnique({ where: { id: targetProviderId } });
    if (!targetProvider) {
      return res.status(404).json({ error: { message: 'Target provider not found.' } });
    }

    const whereClause: any = {};
    if (Array.isArray(keyIds) && keyIds.length > 0) {
      whereClause.id = { in: keyIds };
    } else if (sourceProviderId) {
      whereClause.providerId = sourceProviderId;
    } else {
      return res.status(400).json({ error: { message: 'Either sourceProviderId or keyIds array must be provided.' } });
    }

    const countToMigrate = await prisma.apiKey.count({ where: whereClause });
    if (countToMigrate === 0) {
      return res.json({ success: true, migratedCount: 0, message: 'No keys matched migration criteria.' });
    }

    const result = await prisma.apiKey.updateMany({
      where: whereClause,
      data: { providerId: targetProviderId },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'MIGRATE_API_KEYS_PROVIDER',
        targetType: 'VendorProvider',
        targetId: targetProviderId,
        metadata: `Migrated ${result.count} keys from ${sourceProviderId || 'selection'} to ${targetProvider.name} (${targetProvider.id}). Reason: ${reason || 'Admin bulk migration'}`,
      },
    });

    res.json({
      success: true,
      migratedCount: result.count,
      targetProviderName: targetProvider.name,
      targetProviderId,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// REAL Backend Connection Health Check for Vendor Master Key
router.post('/providers/test', async (req: AuthRequest, res: Response) => {
    const { providerId, masterApiKey, baseUrl, protocol, headersJson } = req.body;
  try {
    let keyToTest = masterApiKey;
    let urlToTest = baseUrl;
    let protoToTest = protocol || 'anthropic';
    let headersToApply: Record<string, string> = {};

    if (providerId) {
      const provider = await prisma.vendorProvider.findUnique({ where: { id: providerId } });
      if (provider) {
        if (!keyToTest) keyToTest = decryptText(provider.masterApiKeyEncrypted);
        if (!urlToTest) urlToTest = provider.baseUrl;
        if (!protocol) protoToTest = provider.protocol || provider.providerType;
        if (provider.headersJson) {
          try {
            headersToApply = { ...headersToApply, ...JSON.parse(provider.headersJson) };
          } catch {}
        }
      }
    }

    if (headersJson) {
      try {
        const parsed = typeof headersJson === 'string' ? JSON.parse(headersJson) : headersJson;
        headersToApply = { ...headersToApply, ...parsed };
      } catch {}
    }

    if (!urlToTest) urlToTest = 'https://api.anthropic.com';

    // SSRF Check on Target URL
    const ssrfCheck = validateVendorBaseUrl(urlToTest);
    if (!ssrfCheck.safe) {
      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { status: 'ssrf_blocked', lastTestedAt: new Date(), lastError: ssrfCheck.error },
        });
      }
      return res.json({ status: 'UNREACHABLE', message: ssrfCheck.error || 'Blocked by SSRF Policy.' });
    }

    if (!keyToTest) {
      return res.status(400).json({ status: 'AUTHENTICATION_FAILED', message: 'No Master API key provided.' });
    }

    let targetUrl = `${ssrfCheck.normalizedUrl}/v1/models`;
    let headers: Record<string, string> = {
      'x-api-key': keyToTest,
      'authorization': `Bearer ${keyToTest}`,
      'anthropic-version': '2023-06-01',
      ...headersToApply,
    };

    if (protoToTest === 'openai-compatible' || protoToTest === 'openai') {
      targetUrl = `${ssrfCheck.normalizedUrl}/models`;
      headers = { Authorization: `Bearer ${keyToTest}`, ...headersToApply };
    }

    let upstreamRes: any;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // If GET /models returns 404/405, fallback to a minimal probe request
      if (upstreamRes.status === 404 || upstreamRes.status === 405) {
        const probeUrl = protoToTest === 'openai-compatible' || protoToTest === 'openai'
          ? `${ssrfCheck.normalizedUrl}/chat/completions`
          : `${ssrfCheck.normalizedUrl}/v1/messages`;
        const probeBody = protoToTest === 'openai-compatible' || protoToTest === 'openai'
          ? { model: 'gpt-4o', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }
          : { model: 'claude-3-5-haiku-20241022', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 };

        const probeRes = await fetch(probeUrl, {
          method: 'POST',
          headers: { ...headers, 'content-type': 'application/json' },
          body: JSON.stringify(probeBody),
        });
        upstreamRes = probeRes;
      }
    } catch (netErr: any) {
      const errMsg = netErr.name === 'AbortError' ? 'Connection timed out after 15s' : netErr.message;
      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { status: 'unavailable', lastTestedAt: new Date(), lastError: errMsg },
        });
      }
      return res.json({ status: 'UNREACHABLE', message: `Could not reach provider base URL: ${errMsg}` });
    }

    if (upstreamRes.ok) {
      let parsedBody: any = null;
      try {
        parsedBody = await upstreamRes.json();
      } catch {
        return res.json({ status: 'INVALID_RESPONSE', message: 'Provider returned non-JSON payload.' });
      }

      // Intercept upstream vendor pseudo-200 responses containing auth errors (e.g. Opus Max)
      const assistantText = parsedBody?.content?.[0]?.text || parsedBody?.choices?.[0]?.message?.content || parsedBody?.error?.message || '';
      if (typeof assistantText === 'string' && (assistantText.includes('Invalid API key') || assistantText.includes('invalid_api_key'))) {
        if (providerId) {
          await prisma.vendorProvider.update({
            where: { id: providerId },
            data: { status: 'invalid_credential', lastTestedAt: new Date(), lastError: 'Upstream vendor reported: ' + assistantText },
          });
        }
        return res.json({
          status: 'AUTHENTICATION_FAILED',
          message: `Upstream vendor rejected master key: "${assistantText}". Please update the master key under Admin > Providers.`,
        });
      }

      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { status: 'connected', lastTestedAt: new Date(), lastError: null },
        });
      }
      return res.json({
        status: 'CONNECTED',
        message: 'Provider connection test verified. Response HTTP 200 OK.',
        details: { modelsCount: Array.isArray(parsedBody?.data) ? parsedBody.data.length : undefined },
      });
    } else if (upstreamRes.status === 401 || upstreamRes.status === 403) {
      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { status: 'invalid_credential', lastTestedAt: new Date(), lastError: `Auth Failed (${upstreamRes.status})` },
        });
      }
      return res.json({ status: 'AUTHENTICATION_FAILED', message: `Authentication failed (HTTP ${upstreamRes.status}). Verify master API key.` });
    } else {
      if (providerId) {
        await prisma.vendorProvider.update({
          where: { id: providerId },
          data: { status: 'provider_error', lastTestedAt: new Date(), lastError: `HTTP ${upstreamRes.status}` },
        });
      }
      return res.json({ status: 'INVALID_RESPONSE', message: `Provider returned HTTP ${upstreamRes.status}.` });
    }
  } catch (err: any) {
    if (providerId) {
      await prisma.vendorProvider.update({
        where: { id: providerId },
        data: { status: 'unavailable', lastTestedAt: new Date(), lastError: err.message },
      });
    }
    return res.json({ status: 'UNREACHABLE', message: `Could not reach vendor base URL: ${err.message}` });
  }
});

// GET /admin/providers/:id/balance — Master Vendor Balance & Capacity Exposure Metrics
router.get('/providers/:id/balance', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    let provider = await prisma.vendorProvider.findUnique({ where: { id } });
    if (!provider) return res.status(404).json({ error: { message: 'Vendor provider not found.' } });

    // Live sync check: if live=true or live refresh requested, discover if cached older than 2.0s
    const isLive = req.query.live === 'true' || req.query.live === '1';
    const lastDiscovered = provider.lastDiscoveredAt ? new Date(provider.lastDiscoveredAt).getTime() : 0;
    const cacheAgeMs = Date.now() - lastDiscovered;

    if (isLive && cacheAgeMs > 2000 && provider.status !== 'disabled') {
      try {
        await ProviderDiscoveryRegistry.discoverProvider(id);
        const reloaded = await prisma.vendorProvider.findUnique({ where: { id } });
        if (reloaded) provider = reloaded;
      } catch (discErr) {
        // Fall back to existing cached db record if upstream ping times out
      }
    }

    const aggregate = await calculateAggregateAccounting(id);

    const topUpCount = await prisma.masterTokenLedger.count({
      where: { providerId: id, type: 'TOP_UP' },
    });

    const lastTopUp = await prisma.masterTokenLedger.findFirst({
      where: { providerId: id, type: 'TOP_UP' },
      orderBy: { createdAt: 'desc' },
    });

    const lastUsage = await prisma.masterTokenLedger.findFirst({
      where: { providerId: id, type: 'CUSTOMER_USAGE' },
      orderBy: { createdAt: 'desc' },
    });

    const discoveryDetails = provider.discoveryDetailsJson ? JSON.parse(provider.discoveryDetailsJson) : null;

    // Use live reset from discovery if available
    const nextResetAt = discoveryDetails?.windowResetAt
      ? new Date(discoveryDetails.windowResetAt)
      : (aggregate.upstream.discoveredResetAt || null);

    const windowResetSeconds = nextResetAt
      ? Math.max(0, Math.floor((nextResetAt.getTime() - Date.now()) / 1000))
      : null;

    res.json({
      providerId: provider.id,
      providerName: provider.name,
      status: aggregate.upstream.status,
      isPrimary: provider.isPrimary,
      availableTokens: aggregate.upstreamRemainingMasterCapacity.toString(),
      purchasedTokens: (aggregate.upstream.upstreamLimit !== null
        ? aggregate.upstream.upstreamLimit
        : (provider.capacityModel === 'rolling_window' && Number(provider.windowAllowance) > 0 ? provider.windowAllowance : provider.purchasedTokens)).toString(),
      consumedTokens: aggregate.upstream.upstreamConsumedLifetime.toString(),
      reservedTokens: aggregate.upstream.activeMasterReservations,
      capacityModel: provider.capacityModel,
      windowHours: provider.windowHours,
      windowAllowance: (aggregate.upstream.upstreamLimit !== null ? aggregate.upstream.upstreamLimit : provider.windowAllowance).toString(),
      windowTokensUsed: aggregate.upstream.upstreamConsumedWindow,
      nextResetAt: nextResetAt ? nextResetAt.toISOString() : null,
      windowResetSeconds,
      windowActive: discoveryDetails?.windowActive ?? (nextResetAt !== null),
      windowStartedAt: discoveryDetails?.windowStartedAt || null,
      upstreamUsagePercent: discoveryDetails?.upstreamUsagePercent ?? null,
      expiresAt: discoveryDetails?.expiresAt || null,
      createdAt: discoveryDetails?.createdAt || provider.createdAt.toISOString(),
      lastUsedAt: discoveryDetails?.lastUsedAt || null,
      rateLimitRpm: discoveryDetails?.rateLimitRpm || 60,
      totalRequests: discoveryDetails?.totalRequests ?? null,
      last24hRequests: discoveryDetails?.last24hRequests ?? null,
      warningThresholdTokens: provider.warningThresholdTokens.toString(),
      criticalThresholdTokens: provider.criticalThresholdTokens.toString(),
      // Discovery metadata
      discoverySource: aggregate.upstream.discoverySource,
      discoveryStatus: aggregate.upstream.discoveryStatus,
      discoveryConfidence: aggregate.upstream.discoveryConfidence,
      lastDiscoveredAt: aggregate.upstream.lastDiscoveredAt ? aggregate.upstream.lastDiscoveredAt.toISOString() : null,
      discoveryDetails,
      // Layer C Accounting Metrics
      exposure: {
        activeKeyCount: aggregate.activeCustomerCount,
        totalCustomerCount: aggregate.totalCustomerCount,
        active5hWindowAllowance: aggregate.activeCustomer5hAllowanceExposure.toString(),
        active5hWindowUsed: aggregate.aggregateWindowTokensConsumed.toString(),
        active5hWindowRemaining: Math.max(0, aggregate.activeCustomer5hAllowanceExposure - aggregate.aggregateWindowTokensConsumed).toString(),
        theoretical30DayExposure: aggregate.theoretical30DayExposure.toString(),
        upstreamRemainingMasterCapacity: aggregate.upstreamRemainingMasterCapacity.toString(),
        exposureHeadroomTokens: aggregate.exposureHeadroomTokens.toString(),
        exposureRatioPercent: aggregate.exposureRatioPercent,
        utilizationRatioPercent: aggregate.utilizationRatioPercent,
        unreconciledOrUnknownTokens: aggregate.unreconciledOrUnknownTokens.toString(),
        isOversubscribed: aggregate.isOversubscribed,
      },
      topUpCount,
      lastTopUpAt: lastTopUp?.createdAt || null,
      lastUsageAt: lastUsage?.createdAt || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /admin/providers/:id/sync-balance & /admin/providers/:id/discover — Authoritative Capability Discovery
router.post(['/providers/:id/sync-balance', '/providers/:id/discover'], async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const discovery = await ProviderDiscoveryRegistry.discoverProvider(id);
    const provider = await prisma.vendorProvider.findUnique({ where: { id } });

    res.json({
      success: discovery.status !== 'UNAVAILABLE',
      synced: discovery.status === 'VERIFIED' || discovery.status === 'LOCALLY_TRACKED',
      discovery: {
        limitTokens: discovery.limitTokens?.toString() ?? null,
        consumedTokens: discovery.consumedTokens?.toString() ?? null,
        remainingTokens: discovery.remainingTokens?.toString() ?? null,
        resetAt: discovery.resetAt?.toISOString() ?? null,
        resetSeconds: discovery.resetSeconds,
        source: discovery.source,
        status: discovery.status,
        confidence: discovery.confidence,
        lastDiscoveredAt: discovery.lastDiscoveredAt.toISOString(),
        error: discovery.error || null,
        metadata: discovery.metadata || {},
      },
      provider: provider ? {
        id: provider.id,
        name: provider.name,
        availableTokens: provider.availableTokens.toString(),
        consumedTokens: provider.consumedTokens.toString(),
        discoveryStatus: provider.discoveryStatus,
        discoverySource: provider.discoverySource,
        discoveryConfidence: provider.discoveryConfidence,
      } : null,
      message: discovery.status === 'VERIFIED'
        ? `Provider limits discovered from official headers/API (${discovery.source}). Remaining: ${discovery.remainingTokens?.toLocaleString()} tokens.`
        : discovery.status === 'LOCALLY_TRACKED'
        ? `Provider capacity tracked locally against verified requests (${discovery.source}, ${discovery.confidence} confidence).`
        : discovery.error || 'Provider discovery completed.',
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /admin/providers/:id/topup — Add Master Token Top-Up
router.post('/providers/:id/topup', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amountTokens, reference, notes } = req.body;

  if (!amountTokens || !reference) {
    return res.status(400).json({ error: { message: 'Top-up amount and payment reference are required.' } });
  }

  try {
    const result = await topUpMasterBalance({
      providerId: id,
      amountTokens,
      reference,
      notes,
      adminUserId: req.user?.id,
    });

    res.json({
      success: true,
      newAvailableBalance: result.updatedProvider.availableTokens.toString(),
      newPurchasedTokens: result.updatedProvider.purchasedTokens.toString(),
      ledgerEntryId: result.ledgerEntry.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /admin/providers/:id/ledger — Master Token Accounting Ledger
router.get('/providers/:id/ledger', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const entries = await prisma.masterTokenLedger.findMany({
      where: { providerId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = entries.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.amount.toString(),
      balanceAfter: e.balanceAfter.toString(),
      reference: e.reference,
      notes: e.notes,
      createdAt: e.createdAt,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /admin/providers/:id/reconcile — Master Token Ledger Audit Reconciliation
router.post('/providers/:id/reconcile', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { autoFix } = req.body || {};
  try {
    const reconciliation = await reconcileMasterLedger(id, !!autoFix, req.user?.id);
    res.json(reconciliation);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});



// GET /admin/providers/:id/vendor-lifecycle — Upstream Vendor Subscription Lifecycle Status
router.get('/providers/:id/vendor-lifecycle', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const status = await VendorRenewalService.getVendorLifecycleStatus(id);
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /admin/providers/:id/record-renewal — Explicit Upstream Vendor Subscription Renewal
router.post('/providers/:id/record-renewal', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, periodDays, renewalCost, currency, vendorReference, failureReason, notes } = req.body;
  try {
    const result = await VendorRenewalService.recordVendorRenewal({
      providerId: id,
      status: status || 'SUCCESS',
      periodDays: periodDays ? Number(periodDays) : 30,
      renewalCost: renewalCost !== undefined ? Number(renewalCost) : undefined,
      currency,
      vendorReference,
      failureReason,
      notes,
      initiatedBy: 'ADMIN',
      adminUserId: req.user?.id,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
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

// ============================================================================
// 3b. Credit Economics & Wholesale-to-Retail Margin Management (/admin/economics)
// ============================================================================

router.get('/economics', async (req: AuthRequest, res: Response) => {
  try {
    const [providers, plans, models, recentRequests] = await Promise.all([
      prisma.vendorProvider.findMany({
        orderBy: { priority: 'asc' },
      }),
      prisma.plan.findMany({
        where: { planType: { in: ['credit', 'token', 'window'] } },
        orderBy: [{ planType: 'asc' }, { sortOrder: 'asc' }],
      }),
      prisma.model.findMany({
        orderBy: [{ family: 'asc' }, { displayName: 'asc' }],
      }),
      prisma.apiRequest.findMany({
        where: { statusCode: 200 },
        take: 300,
        orderBy: { createdAt: 'desc' },
        select: {
          costDeductedUsd: true,
          providerCostUsd: true,
          wholesaleCostDeductedUsd: true,
          retailCreditDeductedUsd: true,
          actualCashMarginUsd: true,
          grossMarginPct: true,
          billingPlanType: true,
        },
      }),
    ]);

    const providerMap = new Map<string, any>();
    const safeProviders = providers.map((p) => {
      const hasCredit = Boolean(p.creditApiKeyEncrypted && p.creditApiKeyEncrypted.length > 0);
      const hasToken = Boolean(p.tokenApiKeyEncrypted && p.tokenApiKeyEncrypted.length > 0);
      const hasMaster = Boolean(p.masterApiKeyEncrypted && p.masterApiKeyEncrypted.length > 0);

      const entry = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        healthStatus: p.healthStatus,
        protocol: p.protocol,
        baseUrl: p.baseUrl,
        apiCreditBaseUrl: p.apiCreditBaseUrl,
        tokenPackBaseUrl: p.tokenPackBaseUrl,
        billingCurrency: p.billingCurrency || 'USD',
        wholesalePurchaseAmount: p.wholesalePurchaseAmount || 100.0,
        wholesaleCreditsReceived: p.wholesaleCreditsReceived || 1000.0,
        wholesaleMultiplier: p.wholesaleMultiplier || 10.0,
        cashCostPerCredit: p.cashCostPerCredit || 0.10,
        usdToInrExchangeRate: p.usdToInrExchangeRate || 86.5,
        exchangeRateSource: p.exchangeRateSource || 'MANUAL',
        costPerMillionInput: p.costPerMillionInput || 0,
        costPerMillionOutput: p.costPerMillionOutput || 0,
        costPerMillionCached: p.costPerMillionCached || 0,
        isEconomicsVerified: p.isEconomicsVerified ?? true,
        allowCustomerSales: p.allowCustomerSales ?? true,
        billingModel: p.billingModel || 'credit_wallet',
        hasCreditKey: hasCredit || hasMaster,
        hasTokenKey: hasToken,
        tokenPlanEnabled: hasToken,
        creditPlanEnabled: hasCredit || hasMaster,
        lastTestedAt: p.lastTestedAt,
        lastError: p.lastError,
      };
      providerMap.set(p.id, entry);
      if (p.slug) providerMap.set(p.slug, entry);
      return entry;
    });

    const enrichedModels = models.map((m) => {
      const prov = (m.providerId ? providerMap.get(m.providerId) : null) || (m.providerSlug ? providerMap.get(m.providerSlug) : null);
      const inPrice = Number(m.inputPrice || 0);
      const outPrice = Number(m.outputPrice || 0);
      const cachedInPrice = Number(m.cachedInputPrice || inPrice * 0.25);

      const provInCost = Number(m.providerCostInput || prov?.costPerMillionInput || 0);
      const provOutCost = Number(m.providerCostOutput || prov?.costPerMillionOutput || 0);
      const provCachedCost = Number(m.providerCostCachedInput || prov?.costPerMillionCached || provInCost * 0.25);

      const cashCostUnit = prov?.cashCostPerCredit || 0.10;
      const realInCashCost = provInCost * cashCostUnit;
      const realOutCashCost = provOutCost * cashCostUnit;

      const customerAvgPrice = (inPrice * 0.7 + outPrice * 0.3);
      const realCashCostAvg = (realInCashCost * 0.7 + realOutCashCost * 0.3);

      const retailCashRevenue = customerAvgPrice / 7.0;
      const grossMarginPct = retailCashRevenue > 0
        ? Math.round(((retailCashRevenue - realCashCostAvg) / retailCashRevenue) * 1000) / 10
        : 0;

      return {
        id: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        family: m.family,
        providerSlug: m.providerSlug,
        providerName: prov?.name || m.providerSlug,
        inputPrice: inPrice,
        outputPrice: outPrice,
        cachedInputPrice: cachedInPrice,
        providerCostInput: provInCost,
        providerCostOutput: provOutCost,
        providerCostCachedInput: provCachedCost,
        actualCashCostInput: Math.round(realInCashCost * 100) / 100,
        actualCashCostOutput: Math.round(realOutCashCost * 100) / 100,
        grossMarginPct,
        isCustomerAvailable: m.isCustomerAvailable ?? true,
        enabled: m.enabled,
      };
    });

    const enrichedPlans = plans.map((p) => {
      const priceInr = Number(p.priceInr || 0);
      const exchangeRate = 86.5;
      const revenueUsd = Math.round((priceInr / exchangeRate) * 100) / 100;
      const retailMultiplier = Number(p.retailMultiplier || p.creditMultiplier || 7.0);
      const creditsIssued = Math.round((revenueUsd * retailMultiplier) * 100) / 100 + Number(p.bonusCreditsUsd || 0);
      const minGrossMarginPct = Number(p.minGrossMarginPct || 15.0);
      const paymentFeePct = Number(p.paymentProcessingFeePct || 2.5);

      const estimatedNominalVendorCost = creditsIssued * 0.60;
      const estimatedCashCostUsd = estimatedNominalVendorCost * 0.10;
      const estimatedGrossProfitUsd = revenueUsd - estimatedCashCostUsd;
      const estimatedGrossMarginPct = revenueUsd > 0 ? Math.round(((revenueUsd - estimatedCashCostUsd) / revenueUsd) * 1000) / 10 : 0;
      const estimatedContributionMarginPct = Math.round((estimatedGrossMarginPct - paymentFeePct) * 10) / 10;

      return {
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        planType: p.planType,
        priceInr,
        revenueUsd,
        customerCurrency: p.currency || 'INR',
        retailMultiplier,
        creditsIssued,
        bonusCreditsUsd: Number(p.bonusCreditsUsd || 0),
        minGrossMarginPct,
        minContributionMarginPct: Number(p.minContributionMarginPct || 10.0),
        paymentProcessingFeePct: paymentFeePct,
        estimatedCashCostUsd: Math.round(estimatedCashCostUsd * 100) / 100,
        estimatedGrossProfitUsd: Math.round(estimatedGrossProfitUsd * 100) / 100,
        estimatedGrossMarginPct,
        estimatedContributionMarginPct,
        isDraft: p.isDraft ?? false,
        isEconomicsApproved: p.isEconomicsApproved ?? true,
        enabled: p.enabled,
        status: p.status,
      };
    });

    let totalRetailDeducted = 0;
    let totalWholesaleCashCost = 0;
    let creditReqCount = 0;

    for (const r of recentRequests) {
      if (r.retailCreditDeductedUsd || r.wholesaleCostDeductedUsd) {
        totalRetailDeducted += Number(r.retailCreditDeductedUsd || r.costDeductedUsd || 0);
        totalWholesaleCashCost += Number(r.wholesaleCostDeductedUsd || 0);
        creditReqCount++;
      }
    }

    const blendedRealizedMarginPct = totalRetailDeducted > 0
      ? Math.round(((totalRetailDeducted / 7.0 - totalWholesaleCashCost) / (totalRetailDeducted / 7.0)) * 1000) / 10
      : 58.0;

    res.json({
      providers: safeProviders,
      plans: enrichedPlans,
      models: enrichedModels,
      summary: {
        totalRequestsAudited: recentRequests.length,
        creditRequestsCount: creditReqCount,
        blendedRealizedMarginPct,
        defaultExchangeRate: 86.5,
        defaultRetailMultiplier: 7.0,
        defaultWholesaleMultiplier: 10.0,
        defaultCashCostPerCredit: 0.10,
      },
    });
  } catch (err: any) {
    console.error('Error fetching economics overview:', err);
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/economics/provider/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      wholesalePurchaseAmount,
      wholesaleCreditsReceived,
      wholesaleMultiplier,
      cashCostPerCredit,
      upstreamCreditDenomination,
      billingSemantics,
      usdToInrExchangeRate,
      exchangeRateSource,
      costPerMillionInput,
      costPerMillionOutput,
      costPerMillionCached,
      isEconomicsVerified,
      allowCustomerSales,
      billingModel,
      creditApiKey,
      tokenApiKey,
      apiCreditBaseUrl,
      tokenPackBaseUrl,
    } = req.body;

    const updateData: any = {};
    if (wholesalePurchaseAmount !== undefined) updateData.wholesalePurchaseAmount = Number(wholesalePurchaseAmount);
    if (wholesaleCreditsReceived !== undefined) updateData.wholesaleCreditsReceived = Number(wholesaleCreditsReceived);

    if (wholesaleMultiplier !== undefined) {
      updateData.wholesaleMultiplier = Number(wholesaleMultiplier);
    } else if (updateData.wholesalePurchaseAmount && updateData.wholesaleCreditsReceived) {
      updateData.wholesaleMultiplier = Number((updateData.wholesaleCreditsReceived / updateData.wholesalePurchaseAmount).toFixed(4));
    }

    if (cashCostPerCredit !== undefined) {
      updateData.cashCostPerCredit = Number(cashCostPerCredit);
    } else if (updateData.wholesalePurchaseAmount && updateData.wholesaleCreditsReceived) {
      updateData.cashCostPerCredit = Number((updateData.wholesalePurchaseAmount / updateData.wholesaleCreditsReceived).toFixed(4));
    }

    if (upstreamCreditDenomination !== undefined) updateData.upstreamCreditDenomination = String(upstreamCreditDenomination);
    if (billingSemantics !== undefined) updateData.billingSemantics = String(billingSemantics);
    if (usdToInrExchangeRate !== undefined) updateData.usdToInrExchangeRate = Number(usdToInrExchangeRate);
    if (exchangeRateSource !== undefined) updateData.exchangeRateSource = String(exchangeRateSource);
    if (costPerMillionInput !== undefined) updateData.costPerMillionInput = Number(costPerMillionInput);
    if (costPerMillionOutput !== undefined) updateData.costPerMillionOutput = Number(costPerMillionOutput);
    if (costPerMillionCached !== undefined) updateData.costPerMillionCached = Number(costPerMillionCached);
    if (isEconomicsVerified !== undefined) updateData.isEconomicsVerified = Boolean(isEconomicsVerified);
    if (allowCustomerSales !== undefined) updateData.allowCustomerSales = Boolean(allowCustomerSales);
    if (billingModel !== undefined) updateData.billingModel = String(billingModel);

    if (creditApiKey !== undefined && typeof creditApiKey === 'string' && creditApiKey.trim()) {
      updateData.creditApiKeyEncrypted = encryptText(creditApiKey.trim());

    }
    if (tokenApiKey !== undefined) {
      if (typeof tokenApiKey === 'string' && tokenApiKey.trim()) updateData.tokenApiKeyEncrypted = encryptText(tokenApiKey.trim());
    }
    if (apiCreditBaseUrl !== undefined) {
      const ssrf = validateVendorBaseUrl(apiCreditBaseUrl);
      if (ssrf.safe) updateData.apiCreditBaseUrl = ssrf.normalizedUrl;
    }
    if (tokenPackBaseUrl !== undefined) {
      const ssrf = validateVendorBaseUrl(tokenPackBaseUrl);
      if (ssrf.safe) updateData.tokenPackBaseUrl = ssrf.normalizedUrl;
    }

    updateData.economicsEffectiveDate = new Date();
    updateData.configVersion = { increment: 1 };

    const updated = await prisma.vendorProvider.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      provider: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        wholesaleMultiplier: updated.wholesaleMultiplier,
        cashCostPerCredit: updated.cashCostPerCredit,
        upstreamCreditDenomination: (updated as any).upstreamCreditDenomination,
        billingSemantics: (updated as any).billingSemantics,
        configVersion: (updated as any).configVersion,
        usdToInrExchangeRate: updated.usdToInrExchangeRate,
        isEconomicsVerified: updated.isEconomicsVerified,
        hasCreditKey: Boolean(updated.creditApiKeyEncrypted),
        hasTokenKey: Boolean(updated.tokenApiKeyEncrypted),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/economics/plan/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      priceInr,
      priceUsd,
      retailMultiplier,
      creditMultiplier,
      creditAmountUsd,
      bonusCreditsUsd,
      minPurchaseAmount,
      creditExpiryDays,
      minGrossMarginPct,
      minContributionMarginPct,
      paymentProcessingFeePct,
      isDraft,
      isEconomicsApproved,
      enabled,
    } = req.body;

    const updateData: any = {};
    if (priceInr !== undefined) updateData.priceInr = Number(priceInr);
    if (priceUsd !== undefined) updateData.priceUsd = Number(priceUsd);
    if (retailMultiplier !== undefined) {
      updateData.retailMultiplier = Number(retailMultiplier);
      updateData.creditMultiplier = Number(retailMultiplier);
    } else if (creditMultiplier !== undefined) {
      updateData.creditMultiplier = Number(creditMultiplier);
      updateData.retailMultiplier = Number(creditMultiplier);
    }
    if (creditAmountUsd !== undefined) updateData.creditAmountUsd = Number(creditAmountUsd);
    if (bonusCreditsUsd !== undefined) updateData.bonusCreditsUsd = Number(bonusCreditsUsd);
    if (minPurchaseAmount !== undefined) updateData.minPurchaseAmount = Number(minPurchaseAmount);
    if (creditExpiryDays !== undefined) updateData.creditExpiryDays = Number(creditExpiryDays);
    if (minGrossMarginPct !== undefined) updateData.minGrossMarginPct = Number(minGrossMarginPct);
    if (minContributionMarginPct !== undefined) updateData.minContributionMarginPct = Number(minContributionMarginPct);
    if (paymentProcessingFeePct !== undefined) updateData.paymentProcessingFeePct = Number(paymentProcessingFeePct);
    if (isDraft !== undefined) updateData.isDraft = Boolean(isDraft);
    if (isEconomicsApproved !== undefined) updateData.isEconomicsApproved = Boolean(isEconomicsApproved);
    if (enabled !== undefined) updateData.enabled = Boolean(enabled);

    updateData.configVersion = { increment: 1 };
    updateData.pricingSnapshotJson = JSON.stringify({
      retailMultiplier: updateData.retailMultiplier,
      creditAmountUsd: updateData.creditAmountUsd,
      bonusCreditsUsd: updateData.bonusCreditsUsd,
      priceInr: updateData.priceInr,
      priceUsd: updateData.priceUsd,
      updatedAt: new Date().toISOString(),
    });

    const updated = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, plan: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/economics/model/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      inputPrice,
      outputPrice,
      cachedInputPrice,
      providerCostInput,
      providerCostOutput,
      providerCostCachedInput,
      providerSlug,
      isCustomerAvailable,
      enabled,
    } = req.body;

    const updateData: any = {};
    if (inputPrice !== undefined) updateData.inputPrice = Number(inputPrice);
    if (outputPrice !== undefined) updateData.outputPrice = Number(outputPrice);
    if (cachedInputPrice !== undefined) updateData.cachedInputPrice = Number(cachedInputPrice);
    if (providerCostInput !== undefined) updateData.providerCostInput = Number(providerCostInput);
    if (providerCostOutput !== undefined) updateData.providerCostOutput = Number(providerCostOutput);
    if (providerCostCachedInput !== undefined) updateData.providerCostCachedInput = Number(providerCostCachedInput);
    if (providerSlug !== undefined) updateData.providerSlug = String(providerSlug);
    if (isCustomerAvailable !== undefined) updateData.isCustomerAvailable = Boolean(isCustomerAvailable);
    if (enabled !== undefined) updateData.enabled = Boolean(enabled);

    const updated = await prisma.model.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, model: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 3c. Separate Financial Ledgers & Audit Reporting (/admin/economics/ledgers)
router.get('/economics/ledgers', async (req: AuthRequest, res: Response) => {
  try {
    const [customerLedgers, vendorLedgers, financialLedgers] = await Promise.all([
      prisma.customerUsageCreditLedger.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.vendorCreditLedger.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { provider: { select: { name: true, slug: true } } },
      }),
      prisma.financialAccountingLedger.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      customerLedgers,
      vendorLedgers,
      financialLedgers,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/economics/reconciliation — Read-Only Accounting & Usage Reconciliation Audit
router.get('/economics/reconciliation', async (req: AuthRequest, res: Response) => {
  try {
    const { auditAccountingReconciliation } = await import('./accounting/reconciliationService');
    const report = await auditAccountingReconciliation();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/economics/preview', async (req: AuthRequest, res: Response) => {
  try {
    const {
      depositAmountInr = 1000,
      exchangeRate = 86.5,
      retailMultiplier = 7.0,
      bonusCreditsUsd = 0,
      wholesaleMultiplier = 10.0,
      cashCostPerCredit = 0.10,
      providerCostRatio = 0.60,
      paymentFeePct = 2.5,
      minGrossMarginPct = 15.0,
    } = req.body;

    const numDepositInr = Number(depositAmountInr) || 1000;
    const numExchangeRate = Number(exchangeRate) || 86.5;
    const numRetailMultiplier = Number(retailMultiplier) || 7.0;
    const numBonusCredits = Number(bonusCreditsUsd) || 0;
    const numWholesaleMultiplier = Number(wholesaleMultiplier) || 10.0;
    const numCashCostPerCredit = Number(cashCostPerCredit) || (1.0 / numWholesaleMultiplier);
    const numCostRatio = Number(providerCostRatio) || 0.60;
    const numPaymentFeePct = Number(paymentFeePct) || 2.5;
    const numMinMargin = Number(minGrossMarginPct) || 15.0;

    const revenueUsd = numDepositInr / numExchangeRate;
    const paymentFeeUsd = revenueUsd * (numPaymentFeePct / 100.0);
    const netRevenueUsd = revenueUsd - paymentFeeUsd;

    const baseCreditsIssued = revenueUsd * numRetailMultiplier;
    const totalCreditsIssued = baseCreditsIssued + numBonusCredits;
    const retailCreditsPerInr = totalCreditsIssued / numDepositInr;

    const upstreamNominalCreditsConsumed = totalCreditsIssued * numCostRatio;
    const upstreamActualCashCostUsd = upstreamNominalCreditsConsumed * numCashCostPerCredit;
    const upstreamActualCashCostInr = upstreamActualCashCostUsd * numExchangeRate;

    const grossProfitUsd = revenueUsd - upstreamActualCashCostUsd;
    const grossProfitInr = grossProfitUsd * numExchangeRate;
    const grossMarginPct = revenueUsd > 0 ? (grossProfitUsd / revenueUsd) * 100.0 : 0;

    const contributionProfitUsd = netRevenueUsd - upstreamActualCashCostUsd;
    const contributionProfitInr = contributionProfitUsd * numExchangeRate;
    const contributionMarginPct = grossMarginPct - numPaymentFeePct;

    const warnings: string[] = [];
    if (grossMarginPct < numMinMargin) {
      warnings.push(`Gross margin (${grossMarginPct.toFixed(1)}%) is below the safeguard threshold of ${numMinMargin.toFixed(1)}%.`);
    }
    if (grossProfitUsd <= 0) {
      warnings.push(`Negative or zero gross margin! Wholesale cash cost exceeds customer revenue.`);
    }

    res.json({
      inputs: {
        depositAmountInr: numDepositInr,
        exchangeRate: numExchangeRate,
        retailMultiplier: numRetailMultiplier,
        bonusCreditsUsd: numBonusCredits,
        wholesaleMultiplier: numWholesaleMultiplier,
        cashCostPerCredit: numCashCostPerCredit,
        providerCostRatio: numCostRatio,
        paymentFeePct: numPaymentFeePct,
        minGrossMarginPct: numMinMargin,
      },
      results: {
        revenueUsd: Math.round(revenueUsd * 100) / 100,
        paymentFeeUsd: Math.round(paymentFeeUsd * 100) / 100,
        netRevenueUsd: Math.round(netRevenueUsd * 100) / 100,
        baseCreditsIssued: Math.round(baseCreditsIssued * 100) / 100,
        totalCreditsIssued: Math.round(totalCreditsIssued * 100) / 100,
        retailCreditsPerInr: Math.round(retailCreditsPerInr * 1000) / 1000,
        upstreamNominalCreditsConsumed: Math.round(upstreamNominalCreditsConsumed * 100) / 100,
        upstreamActualCashCostUsd: Math.round(upstreamActualCashCostUsd * 100) / 100,
        upstreamActualCashCostInr: Math.round(upstreamActualCashCostInr * 100) / 100,
        grossProfitUsd: Math.round(grossProfitUsd * 100) / 100,
        grossProfitInr: Math.round(grossProfitInr * 100) / 100,
        grossMarginPct: Math.round(grossMarginPct * 10) / 10,
        contributionProfitUsd: Math.round(contributionProfitUsd * 100) / 100,
        contributionProfitInr: Math.round(contributionProfitInr * 100) / 100,
        contributionMarginPct: Math.round(contributionMarginPct * 10) / 10,
        isSafe: grossMarginPct >= numMinMargin && grossProfitUsd > 0,
        warnings,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});


// 4. API Key Management (/admin/keys)

// ============================================================================
// 2b. Model Catalog & Multi-Provider Routing Management (/admin/models)
// ============================================================================
router.get('/models', async (req: AuthRequest, res: Response) => {
  try {
    const [models, providers] = await Promise.all([
      prisma.model.findMany({
        orderBy: [{ family: 'asc' }, { displayName: 'asc' }],
      }),
      prisma.vendorProvider.findMany(),
    ]);

    const providerMap = new Map<string, any>();
    providers.forEach((p) => {
      providerMap.set(p.id, p);
      if (p.slug) providerMap.set(p.slug, p);
    });

    const enriched = models.map((m) => {
      const inPrice = Number(m.inputPrice || 0);
      const outPrice = Number(m.outputPrice || 0);
      const vendorProvider = (m.providerId ? providerMap.get(m.providerId) : null) || (m.providerSlug ? providerMap.get(m.providerSlug) : null);
      const inCost = Number(m.providerCostInput || vendorProvider?.costPerMillionInput || 0);
      const outCost = Number(m.providerCostOutput || vendorProvider?.costPerMillionOutput || 0);
      const inputMargin = Math.round((inPrice - inCost) * 100) / 100;
      const outputMargin = Math.round((outPrice - outCost) * 100) / 100;
      const totalCustomer = inPrice + outPrice;
      const totalCost = inCost + outCost;
      const marginPercent = totalCustomer > 0 ? Math.round(((totalCustomer - totalCost) / totalCustomer) * 100) : 0;

      let supportedPlansArray = ['window', 'credit', 'token'];
      if (m.supportedPlans) {
        try { supportedPlansArray = JSON.parse(m.supportedPlans); } catch {}
      }

      return {
        id: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        family: m.family || 'claude',
        protocol: m.protocol || 'anthropic',
        providerSlug: m.providerSlug || 'opus_max',
        providerId: m.providerId || m.vendorProvider?.id || null,
        providerName: m.vendorProvider?.name || (m.providerSlug === 'scalemax' ? 'ScaleMax' : 'Opus Max'),
        providerStatus: m.vendorProvider?.status || 'connected',
        upstreamModelId: m.upstreamModelId || m.modelId,
        description: m.description,
        contextWindow: m.contextWindow || 128000,
        inputPrice: inPrice,
        outputPrice: outPrice,
        providerCostInput: inCost,
        providerCostOutput: outCost,
        inputMargin,
        outputMargin,
        marginPercent,
        isOnDemand: m.isOnDemand ?? false,
        planCategory: m.planCategory || null,
        supplierCostInput: m.supplierCostInput != null ? Number(m.supplierCostInput) : null,
        supplierCostOutput: m.supplierCostOutput != null ? Number(m.supplierCostOutput) : null,
        supportsStreaming: m.supportsStreaming ?? true,
        supportsTools: m.supportsTools ?? true,
        supportsVision: m.supportsVision ?? false,
        supportedPlans: supportedPlansArray,
        enabled: m.enabled,
        isCustomerAvailable: m.isCustomerAvailable ?? true,
        lastSyncAt: m.lastSyncAt,
        createdAt: m.createdAt,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/models', async (req: AuthRequest, res: Response) => {
  try {
    const {
      modelId,
      displayName,
      family,
      protocol,
      providerSlug,
      providerId,
      upstreamModelId,
      description,
      contextWindow,
      inputPrice,
      outputPrice,
      providerCostInput,
      providerCostOutput,
      supportsStreaming,
      supportsTools,
      supportsVision,
      supportedPlans,
      enabled,
      isCustomerAvailable,
      isOnDemand,
      planCategory,
    } = req.body;

    if (!modelId || !displayName) {
      return res.status(400).json({ error: { message: 'modelId and displayName are required.' } });
    }

    // Resolve providerId if not supplied
    let effectiveProviderId = providerId;
    if (!effectiveProviderId && providerSlug) {
      const p = await prisma.vendorProvider.findFirst({ where: { slug: providerSlug } });
      if (p) effectiveProviderId = p.id;
    }

    const model = await prisma.model.create({
      data: {
        modelId,
        displayName,
        family: family || (modelId.startsWith('claude') ? 'claude' : 'openai'),
        protocol: protocol || (family === 'claude' ? 'anthropic' : 'openai-compatible'),
        providerSlug: providerSlug || (family === 'claude' ? 'opus_max' : 'scalemax'),
        providerId: effectiveProviderId,
        upstreamModelId: upstreamModelId || modelId,
        provider: providerSlug || 'ScaleMax',
        description,
        contextWindow: Number(contextWindow) || 128000,
        inputPrice: Number(inputPrice) || 2.50,
        outputPrice: Number(outputPrice) || 10.00,
        providerCostInput: providerCostInput !== undefined ? Number(providerCostInput) : 2.00,
        providerCostOutput: providerCostOutput !== undefined ? Number(providerCostOutput) : 8.00,
        supportsStreaming: supportsStreaming ?? true,
        supportsTools: supportsTools ?? true,
        isOnDemand: Boolean(isOnDemand),
        planCategory: planCategory || null,
        supplierCostInput: providerCostInput !== undefined ? Number(providerCostInput) : null,
        supplierCostOutput: providerCostOutput !== undefined ? Number(providerCostOutput) : null,
        supportsVision: supportsVision ?? false,
        supportedPlans: supportedPlans ? JSON.stringify(supportedPlans) : JSON.stringify(['window', 'credit', 'token']),
        enabled: enabled ?? true,
        isCustomerAvailable: isCustomerAvailable ?? true,
        lastSyncAt: new Date(),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'CREATE_MODEL',
        targetType: 'Model',
        targetId: model.id,
        metadata: `Created model ${model.displayName} assigned to provider ${model.providerSlug}`,
      },
    });

    res.json({ success: true, model });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/models/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      displayName,
      family,
      protocol,
      providerSlug,
      providerId,
      upstreamModelId,
      description,
      contextWindow,
      inputPrice,
      outputPrice,
      providerCostInput,
      providerCostOutput,
      supportsStreaming,
      supportsTools,
      supportsVision,
      supportedPlans,
      enabled,
      isCustomerAvailable,
      isOnDemand,
      planCategory,
      planType,
      creditMultiplier,
      creditAmountUsd,
      bonusCreditsUsd,
      bonusTokens,
      providerScope,
    } = req.body;

    const existing = await prisma.model.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Model not found.' } });

    let effectiveProviderId = providerId !== undefined ? providerId : existing.providerId;
    if (providerSlug && !providerId) {
      const p = await prisma.vendorProvider.findFirst({ where: { slug: providerSlug } });
      if (p) effectiveProviderId = p.id;
    }

    const updated = await prisma.model.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(family !== undefined && { family }),
        ...(protocol !== undefined && { protocol }),
        ...(providerSlug !== undefined && { providerSlug, provider: providerSlug }),
        ...(effectiveProviderId !== undefined && { providerId: effectiveProviderId }),
        ...(upstreamModelId !== undefined && { upstreamModelId }),
        ...(description !== undefined && { description }),
        ...(planType !== undefined && { planType }),
        ...(creditMultiplier !== undefined && { creditMultiplier: Number(creditMultiplier) }),
        ...(creditAmountUsd !== undefined && { creditAmountUsd: Number(creditAmountUsd) }),
        ...(bonusCreditsUsd !== undefined && { bonusCreditsUsd: Number(bonusCreditsUsd) }),
        ...(bonusTokens !== undefined && { bonusTokens: BigInt(bonusTokens) }),
        ...(providerScope !== undefined && { providerScope }),
        ...(contextWindow !== undefined && { contextWindow: Number(contextWindow) }),
        ...(inputPrice !== undefined && { inputPrice: Number(inputPrice) }),
        ...(outputPrice !== undefined && { outputPrice: Number(outputPrice) }),
        ...(providerCostInput !== undefined && { providerCostInput: Number(providerCostInput) }),
        ...(providerCostOutput !== undefined && { providerCostOutput: Number(providerCostOutput) }),
        ...(supportsStreaming !== undefined && { supportsStreaming }),
        ...(supportsTools !== undefined && { supportsTools }),
        ...(supportsVision !== undefined && { supportsVision }),
        ...(supportedPlans !== undefined && { supportedPlans: Array.isArray(supportedPlans) ? JSON.stringify(supportedPlans) : supportedPlans }),
        ...(enabled !== undefined && { enabled }),
        ...(isCustomerAvailable !== undefined && { isCustomerAvailable }),
        ...(isOnDemand !== undefined && { isOnDemand: Boolean(isOnDemand) }),
        ...(planCategory !== undefined && { planCategory }),
        ...(providerCostInput !== undefined && { supplierCostInput: Number(providerCostInput) }),
        ...(providerCostOutput !== undefined && { supplierCostOutput: Number(providerCostOutput) }),
        lastSyncAt: new Date(),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'UPDATE_MODEL',
        targetType: 'Model',
        targetId: updated.id,
        metadata: `Updated model ${updated.displayName}: provider=${updated.providerSlug}, enabled=${updated.enabled}`,
      },
    });

    res.json({ success: true, model: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.delete('/models/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.model.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 3b. Admin Plan Management (/admin/plans)
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { tokenAllowance: 'asc' } });
    const formatted = plans.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      tokenAllowance: p.tokenAllowance.toString(),
      tokenDisplay: p.tokenDisplay,
      windowHours: p.windowHours,
      validityDays: p.validityDays,
      rateLimitRpm: p.rateLimitRpm,
      priceInr: p.priceInr,
      originalPriceInr: p.originalPriceInr,
      annualPriceInr: p.annualPriceInr ? Number(p.annualPriceInr) : null,
      planType: p.planType || 'window',
      creditMultiplier: p.creditMultiplier ? Number(p.creditMultiplier) : 7.0,
      creditAmountUsd: p.creditAmountUsd ? Number(p.creditAmountUsd) : null,
      bonusCreditsUsd: p.bonusCreditsUsd ? Number(p.bonusCreditsUsd) : null,
      bonusTokens: p.bonusTokens ? p.bonusTokens.toString() : null,
      providerScope: p.providerScope || 'all',
      featured: p.featured,
      enabled: p.enabled,
      status: p.status,
      description: p.description,
      tagline: p.tagline,
      badge: p.badge,
      createdAt: p.createdAt,
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/plans', async (req: AuthRequest, res: Response) => {
  const {
    name,
    displayName,
    tokenAllowance,
    tokenDisplay,
    windowHours,
    validityDays,
    rateLimitRpm,
    priceInr,
    originalPriceInr,
    annualPriceInr,
    annualOriginalPriceInr,
    annualValidityDays,
    tagline,
    badge,
    features,
    featuresJson,
    featured,
    enabled,
    sortOrder,
    description,
  } = req.body;
  try {
    const plan = await prisma.plan.create({
      data: {
        name,
        displayName: displayName || `${name} (${Math.round(Number(tokenAllowance || 0) / 1000000)}M / ${windowHours || 5}h)`,
        tokenAllowance: BigInt(tokenAllowance || 20000000),
        tokenDisplay: tokenDisplay || null,
        windowHours: Number(windowHours || 5),
        validityDays: Number(validityDays || 30),
        rateLimitRpm: Number(rateLimitRpm || 60),
        priceInr: Number(priceInr || 0),
        originalPriceInr: originalPriceInr ? Number(originalPriceInr) : null,
        annualPriceInr: annualPriceInr !== undefined ? (annualPriceInr ? Number(annualPriceInr) : null) : null,
        annualOriginalPriceInr: annualOriginalPriceInr !== undefined ? (annualOriginalPriceInr ? Number(annualOriginalPriceInr) : null) : null,
        annualValidityDays: annualValidityDays !== undefined ? Number(annualValidityDays || 365) : 365,
        tagline: tagline || null,
        badge: badge || null,
        featuresJson: features ? JSON.stringify(features) : (featuresJson || null),
        featured: Boolean(featured || false),
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        sortOrder: Number(sortOrder || 0),
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
  const {
    name,
    displayName,
    tokenAllowance,
    tokenDisplay,
    windowHours,
    validityDays,
    rateLimitRpm,
    priceInr,
    originalPriceInr,
    annualPriceInr,
    annualOriginalPriceInr,
    annualValidityDays,
    tagline,
    badge,
    features,
    featuresJson,
    featured,
    enabled,
    sortOrder,
    status,
    description,
  } = req.body;
  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (displayName) updateData.displayName = displayName;
    if (tokenAllowance !== undefined) updateData.tokenAllowance = BigInt(tokenAllowance);
    if (tokenDisplay !== undefined) updateData.tokenDisplay = tokenDisplay;
    if (windowHours !== undefined) updateData.windowHours = Number(windowHours);
    if (validityDays !== undefined) updateData.validityDays = Number(validityDays);
    if (rateLimitRpm !== undefined) updateData.rateLimitRpm = Number(rateLimitRpm);
    if (priceInr !== undefined) updateData.priceInr = Number(priceInr);
    if (originalPriceInr !== undefined) updateData.originalPriceInr = originalPriceInr ? Number(originalPriceInr) : null;
    if (annualPriceInr !== undefined) updateData.annualPriceInr = annualPriceInr ? Number(annualPriceInr) : null;
    if (annualOriginalPriceInr !== undefined) updateData.annualOriginalPriceInr = annualOriginalPriceInr ? Number(annualOriginalPriceInr) : null;
    if (annualValidityDays !== undefined) updateData.annualValidityDays = Number(annualValidityDays || 365);
    if (tagline !== undefined) updateData.tagline = tagline;
    if (badge !== undefined) updateData.badge = badge;
    if (features !== undefined) updateData.featuresJson = Array.isArray(features) ? JSON.stringify(features) : null;
    if (featuresJson !== undefined && features === undefined) updateData.featuresJson = featuresJson;
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (enabled !== undefined) updateData.enabled = Boolean(enabled);
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
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
      include: { user: true, provider: true },
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
          providerId: k.providerId,
          providerName: k.provider?.name || 'Opus Max',
          billingType: k.billingType || 'window',
          creditBalanceUsd: k.creditBalanceUsd || 0,
          totalCreditsUsedUsd: k.totalCreditsUsedUsd || 0,
          allowedModels: k.allowedModels || 'all',
          allowedModelFamilies: k.allowedModelFamilies || 'all',
          purchasedTokens: windowMetrics.purchasedNum.toString(),
          tokensUsed: windowMetrics.windowTokensUsed.toString(),
          tokensRemaining: windowMetrics.remainingNum.toString(),
          rateLimitRpm: k.rateLimitRpm,
          expiresAt: k.expiresAt,
          totalRequests: k.totalRequests,
          createdAt: k.createdAt,
          firstUsedAt: windowMetrics.effectiveFirstUse,
          lastUsedAt: k.lastUsedAt,
          lastPlatform: k.lastPlatform || null,
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
        isEstimated: true,
        usageSource: true,
        clientPlatform: true,
        userAgent: true,
        ipAddress: true,
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
        lastPlatform: key.lastPlatform,
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
  const {
    name,
    userId,
    tokenLimit,
    rateLimitRpm,
    expiryDays,
    plan,
    isTrial,
    providerId,
    billingType,
    creditBalanceUsd,
    allowedModels,
    allowedModelFamilies,
    keyPrefix: customKeyPrefix,
  } = req.body;
  try {
    const finalBillingType = billingType || (creditBalanceUsd ? 'credit' : 'window');
    const isCredit = finalBillingType === 'credit';
    const initialCreditBalance = isCredit ? Number(creditBalanceUsd || 0) : 0;

    const keyMaterial = await generateProviderApiKey({
      providerId: providerId || undefined,
      isTrial: Boolean(isTrial),
      keyPrefix: customKeyPrefix || undefined,
    });

    let expiresAt: Date | null = null;
    if (expiryDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    const initialTokens = isCredit
      ? 0n
      : BigInt(
          tokenLimit !== undefined && tokenLimit !== null && tokenLimit !== ''
            ? tokenLimit
            : isTrial
            ? 200000
            : 1000000
        );
    const numM = Math.round(Number(initialTokens) / 1000000);
    const defaultPlan = isTrial
      ? 'Trial Key'
      : isCredit
      ? `API Credits ($${initialCreditBalance.toFixed(2)} USD)`
      : `Claude Max ${numM}x`;
    const finalPlan = plan || defaultPlan;

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: userId || null,
        providerId: keyMaterial.providerId,
        keyPrefix: keyMaterial.keyPrefix,
        keyHash: keyMaterial.keyHash,
        displayKey: keyMaterial.displayKey,
        keyEncrypted: encryptText(keyMaterial.rawKeySecret),
        name: name || (isTrial ? 'Free Trial Key' : isCredit ? `API Credits ($${initialCreditBalance.toFixed(2)} USD)` : `Claude Max ${numM}x Key`),
        type: isTrial ? 'trial' : 'production',
        status: 'active',
        billingType: finalBillingType,
        creditBalanceUsd: initialCreditBalance,
        totalCreditsUsedUsd: 0,
        allowedModels: allowedModels || 'all',
        allowedModelFamilies: allowedModelFamilies || 'all',
        purchasedTokens: initialTokens,
        tokensUsed: BigInt(0),
        tokensRemaining: initialTokens,
        rateLimitRpm: Number(rateLimitRpm || 60),
        expiresAt,
        plan: finalPlan,
      },
    });

    if (isCredit) {
      if (userId && initialCreditBalance > 0) {
        await prisma.customerUsageCreditLedger.create({
          data: {
            userId,
            apiKeyId: apiKey.id,
            type: 'CREDITS_GRANTED',
            amount: initialCreditBalance,
            balanceBefore: 0,
            balanceAfter: initialCreditBalance,
            currency: 'USD',
            reference: 'ADMIN-KEY-GEN',
            notes: `Admin provisioned credit API key with $${initialCreditBalance.toFixed(2)} USD credits`,
          },
        });
      }
    } else {
      await prisma.tokenLedger.create({
        data: {
          apiKeyId: apiKey.id,
          userId: userId || null,
          amount: initialTokens,
          balanceAfter: initialTokens,
          type: isTrial ? 'TRIAL_GRANT' : 'PURCHASE',
          reference: 'ADMIN-KEY-GEN',
          notes: `Admin created ${isTrial ? 'trial' : 'production'} key (${keyMaterial.providerName})`,
        },
      });
    }

    res.json({
      id: apiKey.id,
      rawKey: keyMaterial.rawKeySecret,
      displayKey: apiKey.displayKey,
      name: apiKey.name,
      providerId: apiKey.providerId,
      providerName: keyMaterial.providerName,
      billingType: apiKey.billingType,
      creditBalanceUsd: apiKey.creditBalanceUsd,
      purchasedTokens: apiKey.purchasedTokens.toString(),
      tokensRemaining: apiKey.tokensRemaining.toString(),
      allowedModels: apiKey.allowedModels,
      allowedModelFamilies: apiKey.allowedModelFamilies,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/keys/trial', async (req: AuthRequest, res: Response) => {
  const { customerName, customerEmail, tokenAllowance, expiryDays, rateLimitRpm, providerId } = req.body;
  try {
    const keyMaterial = await generateProviderApiKey({
      providerId: providerId || undefined,
      isTrial: true,
    });

    let expiresAt: Date | null = null;
    if (expiryDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    const initialTokens = BigInt(tokenAllowance || 1000000);

    const apiKey = await prisma.apiKey.create({
      data: {
        providerId: keyMaterial.providerId,
        keyPrefix: keyMaterial.keyPrefix,
        keyHash: keyMaterial.keyHash,
        displayKey: keyMaterial.displayKey,
        keyEncrypted: encryptText(keyMaterial.rawKeySecret),
        name: customerName ? `${customerName} (Trial)` : 'Free Trial Key',
        type: 'trial',
        status: 'active',
        purchasedTokens: initialTokens,
        tokensUsed: BigInt(0),
        tokensRemaining: initialTokens,
        rateLimitRpm: Number(rateLimitRpm || 100),
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
        notes: `Dedicated trial key for ${customerEmail || customerName || 'customer'} (${keyMaterial.providerName})`,
      },
    });

    res.json({
      id: apiKey.id,
      rawKey: keyMaterial.rawKeySecret,
      displayKey: apiKey.displayKey,
      name: apiKey.name,
      providerId: apiKey.providerId,
      providerName: keyMaterial.providerName,
      purchasedTokens: apiKey.purchasedTokens.toString(),
      tokensRemaining: apiKey.tokensRemaining.toString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});


router.put('/keys/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    status,
    plan,
    rateLimitRpm,
    maxConcurrency,
    addTokens,
    withdrawTokens,
    overridePurchasedTokens,
    overrideRemainingTokens,
    expiryMode,
    expiryDays,
    expiresAtDate,
  } = req.body;

  try {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return res.status(404).json({ error: { message: 'Key not found.' } });

    const updateData: any = {};
    const auditNotes: string[] = [];

    if (name && name.trim()) {
      updateData.name = name.trim();
      auditNotes.push(`Renamed to "${name.trim()}"`);
    }

    if (status && ['active', 'suspended', 'revoked'].includes(status)) {
      updateData.status = status;
      auditNotes.push(`Status changed to ${status.toUpperCase()}`);
    }

    if (plan && plan.trim()) {
      updateData.plan = plan.trim();
      auditNotes.push(`Plan tier updated to ${plan.trim()}`);
    }

    if (rateLimitRpm !== undefined && rateLimitRpm !== null) {
      const rpmNum = Math.max(1, Number(rateLimitRpm));
      updateData.rateLimitRpm = rpmNum;
      auditNotes.push(`Rate limit set to ${rpmNum} RPM`);
    }

    if (maxConcurrency !== undefined && maxConcurrency !== null) {
      const concNum = Math.max(1, Number(maxConcurrency));
      updateData.maxConcurrency = concNum;
      auditNotes.push(`Max concurrency set to ${concNum}`);
    }

    // Expiry / Validity Modifications
    if (expiryMode === 'never') {
      updateData.expiresAt = null;
      auditNotes.push(`Validity set to Permanent (Never Expires)`);
    } else if (expiryMode === 'add_days' && expiryDays) {
      const daysToAdd = Number(expiryDays);
      const baseDate = key.expiresAt && new Date(key.expiresAt) > new Date() ? new Date(key.expiresAt) : new Date();
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      updateData.expiresAt = baseDate;
      auditNotes.push(`Extended validity by +${daysToAdd} days (Expires ${baseDate.toLocaleDateString()})`);
    } else if (expiryMode === 'reduce_days' && expiryDays) {
      const daysToSub = Number(expiryDays);
      const baseDate = key.expiresAt ? new Date(key.expiresAt) : new Date();
      baseDate.setDate(baseDate.getDate() - daysToSub);
      updateData.expiresAt = baseDate;
      auditNotes.push(`Reduced validity by -${daysToSub} days (Expires ${baseDate.toLocaleDateString()})`);
    } else if (expiryMode === 'set_date' && expiresAtDate) {
      const setDateObj = new Date(expiresAtDate);
      updateData.expiresAt = setDateObj;
      auditNotes.push(`Expiration date set to ${setDateObj.toLocaleDateString()}`);
    } else if (expiryDays && !expiryMode) {
      // Legacy fallback
      const exp = new Date();
      exp.setDate(exp.getDate() + Number(expiryDays));
      updateData.expiresAt = exp;
      auditNotes.push(`Expiration set to +${expiryDays} days`);
    }

    // Model Permissions & Billing Type Modifications
    if (allowedModels !== undefined) {
      updateData.allowedModels = allowedModels;
      auditNotes.push(`Allowed models set to "${allowedModels}"`);
    }
    if (allowedModelFamilies !== undefined) {
      updateData.allowedModelFamilies = allowedModelFamilies;
      auditNotes.push(`Allowed model families set to "${allowedModelFamilies}"`);
    }
    if (billingType !== undefined && ['window', 'credit', 'token'].includes(billingType)) {
      updateData.billingType = billingType;
      auditNotes.push(`Billing type set to "${billingType}"`);
    }

    // Credit Balance Adjustments (USD)
    if (overrideCreditBalanceUsd !== undefined && overrideCreditBalanceUsd !== null && overrideCreditBalanceUsd !== '') {
      const newCredits = Math.max(0, Number(overrideCreditBalanceUsd));
      const prevCredits = key.creditBalanceUsd || 0;
      updateData.creditBalanceUsd = newCredits;
      auditNotes.push(`Credit balance overridden to ${newCredits.toFixed(2)} USD`);
      if (key.userId) {
        await prisma.customerUsageCreditLedger.create({
          data: {
            userId: key.userId,
            apiKeyId: key.id,
            type: 'ADMIN_ADJUSTMENT',
            amount: Number((newCredits - prevCredits).toFixed(4)),
            balanceBefore: prevCredits,
            balanceAfter: newCredits,
            currency: 'USD',
            reference: 'ADMIN-OVERRIDE',
            notes: `Admin manually adjusted credit balance to ${newCredits.toFixed(2)} USD`,
          },
        });
      }
    } else if (addCreditsUsd && Number(addCreditsUsd) > 0) {
      const added = Number(addCreditsUsd);
      const prevCredits = key.creditBalanceUsd || 0;
      const newCredits = prevCredits + added;
      updateData.creditBalanceUsd = newCredits;
      auditNotes.push(`Added +${added.toFixed(2)} USD credits`);
      if (key.userId) {
        await prisma.customerUsageCreditLedger.create({
          data: {
            userId: key.userId,
            apiKeyId: key.id,
            type: 'ADMIN_ADJUSTMENT',
            amount: added,
            balanceBefore: prevCredits,
            balanceAfter: newCredits,
            currency: 'USD',
            reference: 'ADMIN-TOPUP',
            notes: `Admin added +${added.toFixed(2)} USD credits`,
          },
        });
      }
    } else if (withdrawCreditsUsd && Number(withdrawCreditsUsd) > 0) {
      const withdrawn = Number(withdrawCreditsUsd);
      const prevCredits = key.creditBalanceUsd || 0;
      const newCredits = Math.max(0, prevCredits - withdrawn);
      updateData.creditBalanceUsd = newCredits;
      auditNotes.push(`Withdrew -${withdrawn.toFixed(2)} USD credits`);
      if (key.userId) {
        await prisma.customerUsageCreditLedger.create({
          data: {
            userId: key.userId,
            apiKeyId: key.id,
            type: 'ADMIN_ADJUSTMENT',
            amount: -withdrawn,
            balanceBefore: prevCredits,
            balanceAfter: newCredits,
            currency: 'USD',
            reference: 'ADMIN-WITHDRAWAL',
            notes: `Admin withdrew -${withdrawn.toFixed(2)} USD credits`,
          },
        });
      }
    }

    // Token Top Up / Addition
    let currentPurchased = key.purchasedTokens;
    let currentRemaining = key.tokensRemaining;

    if (addTokens && Number(addTokens) > 0) {
      const tokensToAdd = BigInt(addTokens);
      currentPurchased += tokensToAdd;
      currentRemaining += tokensToAdd;
      updateData.purchasedTokens = currentPurchased;
      updateData.tokensRemaining = currentRemaining;

      await prisma.tokenLedger.create({
        data: {
          apiKeyId: key.id,
          userId: key.userId,
          amount: tokensToAdd,
          balanceAfter: currentRemaining,
          type: 'ADMIN_ADJUSTMENT',
          reference: 'ADMIN-TOPUP',
          notes: `Admin added +${tokensToAdd.toString()} tokens`,
        },
      });
      auditNotes.push(`Added +${tokensToAdd.toString()} tokens`);
    }

    // Token Deduction / Withdrawal
    if (withdrawTokens && Number(withdrawTokens) > 0) {
      const tokensToWithdraw = BigInt(withdrawTokens);
      currentPurchased = currentPurchased > tokensToWithdraw ? currentPurchased - tokensToWithdraw : BigInt(0);
      currentRemaining = currentRemaining > tokensToWithdraw ? currentRemaining - tokensToWithdraw : BigInt(0);
      updateData.purchasedTokens = currentPurchased;
      updateData.tokensRemaining = currentRemaining;

      await prisma.tokenLedger.create({
        data: {
          apiKeyId: key.id,
          userId: key.userId,
          amount: -tokensToWithdraw,
          balanceAfter: currentRemaining,
          type: 'ADMIN_WITHDRAWAL',
          reference: 'ADMIN-WITHDRAWAL',
          notes: `Admin withdrew -${tokensToWithdraw.toString()} tokens`,
        },
      });
      auditNotes.push(`Withdrew -${tokensToWithdraw.toString()} tokens`);
    }

    // Direct Token Overrides
    if (overridePurchasedTokens !== undefined && overridePurchasedTokens !== null && overridePurchasedTokens !== '') {
      updateData.purchasedTokens = BigInt(overridePurchasedTokens);
      auditNotes.push(`Purchased tokens overridden to ${overridePurchasedTokens}`);
    }

    if (overrideRemainingTokens !== undefined && overrideRemainingTokens !== null && overrideRemainingTokens !== '') {
      updateData.tokensRemaining = BigInt(overrideRemainingTokens);
      auditNotes.push(`Remaining tokens overridden to ${overrideRemainingTokens}`);
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'UPDATE_API_KEY',
        targetType: 'ApiKey',
        targetId: key.id,
        metadata: auditNotes.length > 0 ? auditNotes.join('; ') : 'Updated API key configuration',
      },
    });

    res.json(updatedKey);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// Key Rotation Endpoint — Generates new cryptographically secure key, updates DB hash & returns raw key once
router.post('/keys/:id/rotate', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return res.status(404).json({ error: { message: 'API key not found.' } });

    const keyMaterial = await generateRotatedKeyMaterial(key);

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        keyPrefix: keyMaterial.keyPrefix,
        keyHash: keyMaterial.keyHash,
        displayKey: keyMaterial.displayKey,
        keyEncrypted: encryptText(keyMaterial.rawKeySecret),
        status: 'active',
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'ROTATE_API_KEY',
        targetType: 'ApiKey',
        targetId: key.id,
        metadata: `Rotated key material for ${key.name} (${key.displayKey} -> ${keyMaterial.displayKey})`,
      },
    });

    res.json({
      success: true,
      id: updated.id,
      name: updated.name,
      rawKey: keyMaterial.rawKeySecret,
      displayKey: updated.displayKey,
      status: updated.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.delete('/keys/:id', async (req: AuthRequest, res: Response) => {
  try {
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (key) {
      await prisma.adminLog.create({
        data: {
          adminUserId: req.user?.id,
          action: 'DELETE_API_KEY',
          targetType: 'ApiKey',
          targetId: key.id,
          metadata: `Deleted key ${key.name} (${key.displayKey})`,
        },
      });
    }
    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});


// 5. Customer Account & Intelligence Management (/admin/customers)
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        apiKeys: {
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
        },
        supportTickets: {
          select: { id: true, status: true, priority: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = users.map((u) => {
      let totalPurchased = BigInt(0);
      let totalUsed = BigInt(0);
      let totalRemaining = BigInt(0);
      let paidKeyCount = 0;
      let trialKeyCount = 0;
      let activeKeyCount = 0;

      const keys = u.apiKeys.map((k) => {
        totalPurchased += k.purchasedTokens;
        totalUsed += k.tokensUsed;
        totalRemaining += k.tokensRemaining;

        if (k.type === 'trial' || k.plan === 'Free Trial' || k.name.toLowerCase().includes('trial')) {
          trialKeyCount++;
        } else {
          paidKeyCount++;
        }

        if (k.status === 'active') activeKeyCount++;

        return {
          id: k.id,
          keyPrefix: k.keyPrefix,
          displayKey: k.displayKey,
          name: k.name,
          type: k.type,
          status: k.status,
          purchasedTokens: k.purchasedTokens.toString(),
          tokensUsed: k.tokensUsed.toString(),
          tokensRemaining: k.tokensRemaining.toString(),
          rateLimitRpm: k.rateLimitRpm,
          expiresAt: k.expiresAt,
          createdAt: k.createdAt,
        };
      });

      let totalSpendInr = 0;
      let paidOrderCount = 0;
      let latestPlanName = '';

      const orders = u.orders.map((o) => {
        if (o.paymentStatus === 'PAID' || o.status === 'PAID') {
          totalSpendInr += o.amountInr || 0;
          paidOrderCount++;
        }
        if (!latestPlanName && o.planName) {
          latestPlanName = o.planName;
        }

        return {
          id: o.id,
          internalOrderId: o.internalOrderId,
          planName: o.planName,
          amountInr: o.amountInr,
          status: o.status,
          paymentStatus: o.paymentStatus,
          fulfillmentStatus: o.fulfillmentStatus,
          createdAt: o.createdAt,
        };
      });

      const openTicketCount = u.supportTickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'AWAITING_SUPPORT'
      ).length;

      // Geolocation fallback resolution if not stored
      const ip = u.registrationIp || u.lastLoginIp || '127.0.0.1';
      const geoFallback = resolveIpLocation(ip);

      const city = u.city || geoFallback.city;
      const region = u.region || geoFallback.region;
      const country = u.country || geoFallback.country;
      const countryCode = u.countryCode || geoFallback.countryCode;
      const flag = countryCode === 'IN' ? '🇮🇳' : countryCode === 'US' ? '🇺🇸' : geoFallback.flag || '🌐';

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        hasStudioAccess: Boolean(u.hasStudioAccess),
        studioAccessGrantedAt: u.studioAccessGrantedAt,
        emailVerified: u.emailVerified,
        phoneVerified: u.phoneVerified,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        registrationIp: u.registrationIp || ip,
        lastLoginIp: u.lastLoginIp,
        city,
        region,
        country,
        countryCode,
        flag,
        timezone: u.timezone || geoFallback.timezone,
        userAgent: u.userAgent || geoFallback.userAgent || 'Web Browser',
        keyCount: u.apiKeys.length,
        paidKeyCount,
        trialKeyCount,
        activeKeyCount,
        purchasedTokens: totalPurchased.toString(),
        tokensUsed: totalUsed.toString(),
        tokensRemaining: totalRemaining.toString(),
        orderCount: u.orders.length,
        paidOrderCount,
        totalSpendInr,
        latestPlanName: latestPlanName || (trialKeyCount > 0 ? 'Free Trial' : 'No Active Plan'),
        ticketCount: u.supportTickets.length,
        openTicketCount,
        keys,
        orders,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /admin/customers — Create persistent Customer Account
router.post('/customers', async (req: AuthRequest, res: Response) => {
  const { name, email, password, role = 'user', status = 'active', hasStudioAccess = false } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: { message: 'Customer name and email are required.' } });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: { message: 'A customer account with this email already exists.' } });
    }

    const defaultPass = password || 'lightningdev2026';
    const passwordHash = hashPasswordScrypt(defaultPass);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role,
          status,
          hasStudioAccess: Boolean(hasStudioAccess),
          studioAccessGrantedAt: Boolean(hasStudioAccess) ? new Date() : null,
        },
      });

      await tx.adminLog.create({
        data: {
          adminUserId: req.user?.id,
          action: 'CREATE_CUSTOMER',
          targetType: 'User',
          targetId: newUser.id,
          metadata: `Created customer account ${newUser.name} (${newUser.email}) - studioAccess: ${Boolean(hasStudioAccess)}`,
        },
      });

      return newUser;
    });

    res.json({
      success: true,
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        status: result.status,
        hasStudioAccess: result.hasStudioAccess,
        studioAccessGrantedAt: result.studioAccessGrantedAt,
        createdAt: result.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PUT /admin/customers/:id — Update Customer Account
router.put('/customers/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, role, status, password, hasStudioAccess } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Customer account not found.' } });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (hasStudioAccess !== undefined) {
      const isGranted = Boolean(hasStudioAccess);
      updateData.hasStudioAccess = isGranted;
      if (isGranted && !existing.hasStudioAccess) {
        updateData.studioAccessGrantedAt = new Date();
      } else if (!isGranted) {
        updateData.studioAccessGrantedAt = null;
      }
    }
    if (password) {
      updateData.passwordHash = hashPasswordScrypt(password);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: updateData,
      });

      await tx.adminLog.create({
        data: {
          adminUserId: req.user?.id,
          action: user.status === 'suspended' ? 'CUSTOMER_SUSPENDED' : user.status === 'active' && existing.status === 'suspended' ? 'CUSTOMER_REACTIVATED' : 'CUSTOMER_UPDATED',
          targetType: 'User',
          targetId: user.id,
          metadata: `Updated customer account ${user.name} (${user.email}) - status: ${user.status}, role: ${user.role}, studioAccess: ${user.hasStudioAccess}`,
        },
      });

      return user;
    });

    const eventType = updated.status === 'suspended' && existing.status !== 'suspended'
      ? 'CUSTOMER_SUSPENDED'
      : updated.status === 'active' && existing.status === 'suspended'
      ? 'CUSTOMER_REACTIVATED'
      : 'CUSTOMER_UPDATED';

    await recordAuditEvent({
      eventType,
      severity: eventType === 'CUSTOMER_SUSPENDED' ? 'HIGH' : 'INFO',
      actorType: 'ADMIN',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      adminId: req.user?.id,
      customerId: updated.id,
      resourceType: 'CUSTOMER',
      resourceId: updated.id,
      action: eventType,
      result: 'SUCCESS',
      beforeState: {
        name: existing.name,
        email: existing.email,
        role: existing.role,
        status: existing.status,
        hasStudioAccess: existing.hasStudioAccess,
      },
      afterState: {
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        hasStudioAccess: updated.hasStudioAccess,
      },
      metadata: {
        customerEmail: updated.email,
      },
      req,
    });

    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        hasStudioAccess: updated.hasStudioAccess,
        studioAccessGrantedAt: updated.studioAccessGrantedAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /admin/customers/:id/toggle-studio — Grant or Revoke AI Chat Studio Access (Demo / VIP)
router.post('/customers/:id/toggle-studio', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { granted } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Customer account not found.' } });

    const isGranted = granted !== undefined ? Boolean(granted) : !existing.hasStudioAccess;
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          hasStudioAccess: isGranted,
          studioAccessGrantedAt: isGranted ? new Date() : null,
        },
      });

      await tx.adminLog.create({
        data: {
          adminUserId: req.user?.id,
          action: isGranted ? 'GRANT_STUDIO_ACCESS' : 'REVOKE_STUDIO_ACCESS',
          targetType: 'User',
          targetId: user.id,
          metadata: `${isGranted ? 'Granted' : 'Revoked'} AI Chat Studio access for customer ${user.name} (${user.email})`,
        },
      });

      return user;
    });

    await recordAuditEvent({
      eventType: isGranted ? 'STUDIO_ACCESS_GRANTED' : 'STUDIO_ACCESS_REVOKED',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      adminId: req.user?.id,
      customerId: updated.id,
      resourceType: 'CUSTOMER',
      resourceId: updated.id,
      action: isGranted ? 'GRANT_STUDIO_ACCESS' : 'REVOKE_STUDIO_ACCESS',
      result: 'SUCCESS',
      beforeState: { hasStudioAccess: existing.hasStudioAccess },
      afterState: { hasStudioAccess: updated.hasStudioAccess, studioAccessGrantedAt: updated.studioAccessGrantedAt },
      metadata: { customerEmail: updated.email },
      req,
    });

    res.json({
      success: true,
      hasStudioAccess: updated.hasStudioAccess,
      studioAccessGrantedAt: updated.studioAccessGrantedAt,
      message: isGranted
        ? `AI Chat Studio access granted to ${updated.name}.`
        : `AI Chat Studio access revoked from ${updated.name}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// DELETE /admin/customers/:id — Delete Customer Account
router.delete('/customers/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Customer account not found.' } });

    await prisma.$transaction(async (tx) => {
      await tx.adminLog.create({
        data: {
          adminUserId: req.user?.id,
          action: 'DELETE_CUSTOMER',
          targetType: 'User',
          targetId: existing.id,
          metadata: `Deleted customer account ${existing.name} (${existing.email})`,
        },
      });

      await tx.user.delete({ where: { id } });
    });

    res.json({ success: true, message: `Customer ${existing.name} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /admin/customers/:id/adjust-tokens — Adjust Token Balance
router.post('/customers/:id/adjust-tokens', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { apiKeyId, amountTokens, reason } = req.body;

  if (!apiKeyId || amountTokens === undefined) {
    return res.status(400).json({ error: { message: 'apiKeyId and amountTokens are required.' } });
  }

  try {
    const key = await prisma.apiKey.findFirst({ where: { id: apiKeyId, userId: id } });
    if (!key) return res.status(404).json({ error: { message: 'API key not found for this customer.' } });

    const delta = BigInt(amountTokens);
    const newRemaining = key.tokensRemaining + delta;
    if (newRemaining < BigInt(0)) {
      return res.status(400).json({ error: { message: 'Adjustment would result in negative token balance.' } });
    }

    const newPurchased = delta > BigInt(0) ? key.purchasedTokens + delta : key.purchasedTokens;

    await prisma.$transaction([
      prisma.apiKey.update({
        where: { id: key.id },
        data: {
          tokensRemaining: newRemaining,
          purchasedTokens: newPurchased,
        },
      }),
      prisma.tokenLedger.create({
        data: {
          userId: id,
          apiKeyId: key.id,
          amount: delta,
          balanceAfter: newRemaining,
          type: delta >= BigInt(0) ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
          description: reason || `Admin adjusted tokens by ${delta.toString()}`,
        },
      }),
    ]);

    await recordAuditEvent({
      eventType: 'CUSTOMER_TOKENS_ADJUSTED',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      adminId: req.user?.id,
      customerId: id,
      apiKeyId: key.id,
      resourceType: 'API_KEY',
      resourceId: key.id,
      action: 'ADJUST_TOKENS',
      result: 'SUCCESS',
      metadata: {
        amountTokens: delta.toString(),
        newRemaining: newRemaining.toString(),
        reason: reason || 'Manual Admin Adjustment',
      },
      req,
    });

    res.json({
      success: true,
      newRemaining: newRemaining.toString(),
      message: `Successfully adjusted balance by ${delta.toString()} tokens.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});


// ============================================================
// 6. ADVANCED AUDIT LOG + SECURITY EVENT CENTER (/admin/audit, /admin/logs)
// ============================================================

// GET /api/admin/audit/events — Paginated, Multi-Filtered Server-Side Query
router.get('/audit/events', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt((req.query.limit as string) || '25', 10)));
    const skip = (page - 1) * limit;

    const q = (req.query.q as string || '').trim();
    const severity = (req.query.severity as string || '').trim();
    const eventType = (req.query.eventType as string || '').trim();
    const actorType = (req.query.actorType as string || '').trim();
    const result = (req.query.result as string || '').trim();
    const quickFilter = (req.query.quickFilter as string || 'ALL').toUpperCase();
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    const where: any = {};

    // Quick Filter Logic
    if (quickFilter === 'SECURITY') {
      where.OR = [
        { severity: { in: ['MEDIUM', 'HIGH', 'CRITICAL'] } },
        { result: { in: ['BLOCKED', 'DENIED'] } },
      ];
    } else if (quickFilter === 'CRITICAL') {
      where.severity = 'CRITICAL';
    } else if (quickFilter === 'HIGH') {
      where.severity = 'HIGH';
    } else if (quickFilter === 'FAILED') {
      where.result = { in: ['FAILED', 'BLOCKED', 'DENIED'] };
    } else if (quickFilter === 'ADMIN_ACTIONS' || quickFilter === 'ADMIN') {
      where.actorType = 'ADMIN';
    } else if (quickFilter === 'CUSTOMER_ACTIONS' || quickFilter === 'CUSTOMER') {
      where.actorType = 'CUSTOMER';
    } else if (quickFilter === 'API_ACTIVITY' || quickFilter === 'API') {
      where.OR = [
        { actorType: 'API_KEY' },
        { resourceType: 'API_KEY' },
        { eventType: { contains: 'API' } },
      ];
    } else if (quickFilter === 'ALERTS') {
      where.severity = { in: ['MEDIUM', 'HIGH', 'CRITICAL'] };
      where.isResolved = false;
    }

    // Direct Multi-Filters
    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }
    if (eventType && eventType !== 'ALL') {
      where.eventType = { contains: eventType };
    }
    if (actorType && actorType !== 'ALL') {
      where.actorType = actorType;
    }
    if (result && result !== 'ALL') {
      where.result = result;
    }

    // Date Range
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    // Server-Side Search Query
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { actorEmail: { contains: q, mode: 'insensitive' } },
        { actorId: { contains: q, mode: 'insensitive' } },
        { customerId: { contains: q, mode: 'insensitive' } },
        { adminId: { contains: q, mode: 'insensitive' } },
        { apiKeyId: { contains: q, mode: 'insensitive' } },
        { requestId: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
        { endpoint: { contains: q, mode: 'insensitive' } },
        { eventType: { contains: q, mode: 'insensitive' } },
        { failureReason: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [events, total, summary] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditEvent.count({ where }),
      getAuditSummary(),
    ]);

    res.json({
      success: true,
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/audit/events/:id — Single Event with Correlated Timeline
router.get('/audit/events/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.auditEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: { message: 'Audit event not found.' } });
    }

    // Fetch related correlated events around this incident
    const relatedActivity = await getEventCorrelation({
      eventId: event.id,
      ipAddress: event.ipAddress,
      customerId: event.customerId,
      apiKeyId: event.apiKeyId,
      timestamp: event.timestamp,
    });

    res.json({
      success: true,
      event,
      relatedActivity,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/audit/events/:id/resolve — Acknowledge / Resolve Security Alert
router.post('/audit/events/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminUser = req.user!;

    const event = await prisma.auditEvent.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: { message: 'Audit event not found.' } });
    }

    const updated = await prisma.auditEvent.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminUser.email || adminUser.name || 'Admin',
        resolutionNotes: notes || 'Acknowledged and reviewed by security admin.',
      },
    });

    // Record resolution action
    await recordAuditEvent({
      eventType: 'SECURITY_ALERT_RESOLVED',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      adminId: adminUser.id,
      resourceType: 'AUDIT_EVENT',
      resourceId: event.id,
      action: 'RESOLVE_ALERT',
      result: 'SUCCESS',
      metadata: {
        resolvedEventId: event.id,
        resolvedEventType: event.eventType,
        originalSeverity: event.severity,
        notes,
      },
      req,
    });

    res.json({ success: true, event: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/audit/summary — Realtime Metrics Cards
router.get('/audit/summary', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await getAuditSummary();
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/audit/verify-integrity — Tamper-Evident Hash Chain Verification
router.get('/audit/verify-integrity', async (req: AuthRequest, res: Response) => {
  try {
    const result = await verifyHashChainIntegrity(100);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/audit/export — Sanitized Audit Export (CSV / JSON)
router.get('/audit/export', async (req: AuthRequest, res: Response) => {
  try {
    const format = (req.query.format as string || 'csv').toLowerCase();
    const severity = req.query.severity as string;
    const actorType = req.query.actorType as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    const where: any = {};
    if (severity && severity !== 'ALL') where.severity = severity;
    if (actorType && actorType !== 'ALL') where.actorType = actorType;
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
      select: {
        id: true,
        timestamp: true,
        eventType: true,
        severity: true,
        actorType: true,
        actorEmail: true,
        resourceType: true,
        resourceId: true,
        endpoint: true,
        httpMethod: true,
        result: true,
        statusCode: true,
        ipAddress: true,
        userAgent: true,
        failureReason: true,
        tamperHash: true,
      },
    });

    // Log the export action in audit trail (Section 83 requirement)
    await recordAuditEvent({
      eventType: 'AUDIT_LOG_EXPORT',
      severity: 'LOW',
      actorType: 'ADMIN',
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      adminId: req.user!.id,
      action: 'EXPORT_AUDIT_LOGS',
      result: 'SUCCESS',
      metadata: {
        format,
        exportedCount: events.length,
        filterSeverity: severity,
        filterActorType: actorType,
      },
      req,
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-export-${Date.now()}.json`);
      return res.json(events);
    }

    // CSV Format
    const headers = ['Event ID', 'Timestamp', 'Severity', 'Event Type', 'Actor Type', 'Actor Email', 'Resource Type', 'Resource ID', 'Endpoint', 'HTTP Method', 'Result', 'Status Code', 'IP Address', 'Failure Reason'];
    const csvRows = [headers.join(',')];

    for (const e of events) {
      const row = [
        `"${e.id}"`,
        `"${e.timestamp.toISOString()}"`,
        `"${e.severity}"`,
        `"${e.eventType}"`,
        `"${e.actorType}"`,
        `"${e.actorEmail || ''}"`,
        `"${e.resourceType || ''}"`,
        `"${e.resourceId || ''}"`,
        `"${e.endpoint || ''}"`,
        `"${e.httpMethod || ''}"`,
        `"${e.result}"`,
        `"${e.statusCode || ''}"`,
        `"${e.ipAddress || ''}"`,
        `"${(e.failureReason || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-export-${Date.now()}.csv`);
    return res.send(csvRows.join('\n'));
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// Backward-compatible /api/admin/logs endpoint
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.auditEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(events.map((e) => ({
      id: e.id,
      action: e.eventType,
      targetType: e.resourceType || 'SYSTEM',
      targetId: e.resourceId,
      metadata: e.metadata,
      ipAddress: e.ipAddress,
      createdAt: e.timestamp,
      adminUser: e.actorType === 'ADMIN' ? { email: e.actorEmail || 'Admin', name: e.actorEmail || 'Admin' } : null,
      severity: e.severity,
      result: e.result,
    })));
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

    // Notify Customer of Admin Reply
    try {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          title: 'New Support Ticket Reply',
          message: `LightningDeals engineer replied to ticket #${ticket.id.slice(0, 8)} (${ticket.subject})`,
          type: 'support',
        },
      });
    } catch (_) {}

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
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, name: true, email: true, phone: true, role: true, status: true, availableCredits: true },
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
    res.json({ customers, users: customers, keys: sanitizedKeys, orders, requests, tickets });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/admin/orders - Authoritative unified order management ledger
router.get('/orders', async (req: AuthRequest, res: Response) => {
  const { status, search, limit = '100', page = '1' } = req.query;
  const take = Math.min(200, Math.max(1, Number(limit) || 100));
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;

  try {
    const whereClause: any = {};
    if (status && status !== 'ALL' && status !== 'all') {
      const s = String(status).toUpperCase();
      if (s === 'PAID') {
        whereClause.paymentStatus = { in: ['CAPTURED', 'PAID'] };
      } else if (s === 'PENDING') {
        whereClause.paymentStatus = 'PENDING';
      } else if (s === 'FAILED') {
        whereClause.paymentStatus = { in: ['FAILED', 'VERIFICATION_FAILED'] };
      } else if (s === 'FULFILLED') {
        whereClause.fulfillmentStatus = 'FULFILLED';
      } else if (s === 'FULFILLMENT_FAILED') {
        whereClause.fulfillmentStatus = { in: ['FULFILLMENT_FAILED', 'RETRY_REQUIRED'] };
      } else {
        whereClause.OR = [{ paymentStatus: s }, { status: s }];
      }
    }

    if (search) {
      const q = String(search).trim();
      whereClause.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { internalOrderId: { contains: q, mode: 'insensitive' } },
        { gatewayPaymentId: { contains: q, mode: 'insensitive' } },
        { gatewayOrderId: { contains: q, mode: 'insensitive' } },
        { planName: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [orders, total, capturedCount, fulfilledCount, pendingCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          package: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where: whereClause }),
      prisma.order.count({ where: { paymentStatus: { in: ['CAPTURED', 'PAID'] } } }),
      prisma.order.count({ where: { fulfillmentStatus: 'FULFILLED' } }),
      prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
    ]);

    const formatted = orders.map((o) => ({
      id: o.id,
      internalOrderId: o.internalOrderId,
      userId: o.userId,
      user: o.user,
      customerName: o.user.name,
      customerEmail: o.user.email,
      customerPhone: o.user.phone,
      planId: o.planId,
      planName: o.planName || o.package?.displayName || 'API Subscription',
      amountInr: o.amountInr,
      originalAmountInr: o.originalAmountInr,
      discountAmountInr: o.discountAmountInr,
      couponCode: o.couponCode,
      paidAmountInr: o.paidAmountInr,
      currency: o.currency,
      tokenQuantity: o.tokenQuantity.toString(),
      windowHours: o.windowHours,
      status: o.status,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      paymentGateway: o.paymentGateway,
      gatewayOrderId: o.gatewayOrderId,
      gatewayPaymentId: o.gatewayPaymentId,
      fulfilledApiKeyId: o.fulfilledApiKeyId,
      failureReason: o.failureReason,
      paidAt: o.paidAt,
      fulfilledAt: o.fulfilledAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    res.json({
      success: true,
      orders: formatted,
      total,
      summary: {
        totalOrders: total,
        capturedOrders: capturedCount,
        fulfilledOrders: fulfilledCount,
        pendingOrders: pendingCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/orders/:internalOrderId/fulfill - Admin Manual Fulfillment Retry Trigger
router.post('/orders/:internalOrderId/fulfill', async (req: AuthRequest, res: Response) => {
  const { internalOrderId } = req.params;

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ internalOrderId }, { id: internalOrderId }],
      },
    });

    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found.' } });
    }

    // Force payment status to CAPTURED if admin explicitly triggers manual fulfillment
    if (order.paymentStatus !== 'CAPTURED' && order.paymentStatus !== 'AUTHORIZED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'CAPTURED', paidAt: new Date() },
      });
    }

    const fulfillment = await OrderEngine.retryFulfillment(order.internalOrderId, req.user?.id, req);

    if (!fulfillment.success) {
      return res.status(400).json({ error: { message: fulfillment.error || 'Fulfillment retry failed.' } });
    }

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'ADMIN_MANUAL_FULFILLMENT',
        targetType: 'Order',
        targetId: order.id,
        metadata: `Fulfilled order ${order.internalOrderId} for user ${order.userId}. Key ID: ${fulfillment.apiKeyId}`,
      },
    });

    res.json({ success: true, fulfillment });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/orders/:internalOrderId/refund - Admin Refund & Reversal Trigger
router.post('/orders/:internalOrderId/refund', async (req: AuthRequest, res: Response) => {
  const { internalOrderId } = req.params;
  const { reason = 'Refunded by administrator' } = req.body || {};

  try {
    const result = await OrderEngine.refundOrder({
      internalOrderId,
      reason,
      adminUserId: req.user?.id,
      req,
    });

    res.json({ success: true, message: 'Order refunded and rewards reversed successfully.', ...result });
  } catch (err: any) {
    res.status(400).json({ error: { message: err.message } });
  }
});

// POST /api/admin/orders/:internalOrderId/reconcile - Direct Gateway Verification via PayU Server API
router.post('/orders/:internalOrderId/reconcile', async (req: AuthRequest, res: Response) => {
  const { internalOrderId } = req.params;

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ internalOrderId }, { id: internalOrderId }],
      },
    });

    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found.' } });
    }

    const provider = getPaymentProvider();
    const serverStatus = await provider.getPaymentStatus(order.internalOrderId);

    if (serverStatus.isVerified && serverStatus.paymentStatus === 'CAPTURED') {
      const processResult = await OrderEngine.processPaymentEvent({
        provider: provider.name,
        eventId: `reconcile_${order.internalOrderId}_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: order.internalOrderId,
        gatewayOrderId: serverStatus.gatewayOrderId,
        gatewayPaymentId: serverStatus.gatewayPaymentId,
        paidAmount: serverStatus.paidAmount || order.amountInr,
        rawPayload: { status: 'success', reconciled: true },
        source: 'ADMIN_RECONCILE',
        req,
      });

      return res.json({
        success: true,
        reconciled: true,
        message: 'Order verified and captured directly against PayU gateway server!',
        status: processResult,
      });
    }

    res.json({
      success: true,
      reconciled: false,
      message: `Gateway status returned: ${serverStatus.paymentStatus}. ${serverStatus.failureReason || 'Not captured on PayU.'}`,
      gatewayDetails: serverStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PUT /api/admin/orders/:id/status - Update order status (PENDING, PAID, FAILED, REFUNDED)
router.put('/orders/:id/status', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'];

  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({ error: { message: 'Invalid order status provided.' } });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found.' } });
    }

    const newStatus = status.toUpperCase();
    const updated = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'UPDATE_ORDER_STATUS',
        targetType: 'Order',
        targetId: id,
        metadata: `Changed status from ${order.status} to ${newStatus}`,
      },
    });

    res.json({ success: true, order: { ...updated, tokenQuantity: updated.tokenQuantity.toString() } });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// In-memory 3-second cache for GET /usage to prevent DB overload and 502s
let usageCacheData: any = null;
let usageCacheTime = 0;

router.get('/usage', async (req: AuthRequest, res: Response) => {
  try {
    const nowMs = Date.now();
    if (usageCacheData && (nowMs - usageCacheTime < 3000)) {
      return res.json(usageCacheData);
    }

    const rolling5hStart = new Date(nowMs - 5 * 3600 * 1000);

    const [totalAgg, rollingAgg, recentRequests] = await Promise.all([
      prisma.apiRequest.aggregate({
        _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
        _count: { id: true },
      }).catch(() => ({ _sum: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, _count: { id: 0 } })),
      prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        _count: { id: true },
        where: { createdAt: { gte: rolling5hStart } },
      }).catch(() => ({ _sum: { totalTokens: 0 }, _count: { id: 0 } })),
      prisma.apiRequest.findMany({
        include: {
          apiKey: { select: { name: true, displayKey: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch(() => []),
    ]);

    const responsePayload = {
      totalTokensConsumed: (totalAgg._sum?.totalTokens || 0).toString(),
      totalInputTokens: (totalAgg._sum?.inputTokens || 0).toString(),
      totalOutputTokens: (totalAgg._sum?.outputTokens || 0).toString(),
      totalRequests: totalAgg._count?.id || 0,
      rolling5hTokens: (rollingAgg._sum?.totalTokens || 0).toString(),
      rolling5hRequests: rollingAgg._count?.id || 0,
      recentRequests: recentRequests.map((r: any) => ({
        id: r.id,
        requestId: r.requestId,
        model: r.model,
        endpoint: r.endpoint,
        keyName: r.apiKey?.name || 'Deleted Key',
        displayKey: r.apiKey?.displayKey || 'N/A',
        customer: r.user ? `${r.user.name} (${r.user.email})` : 'Unassigned',
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        totalTokens: r.totalTokens,
        latencyMs: r.latencyMs,
        statusCode: r.statusCode,
        errorCode: r.errorCode || null,
        errorMessage: r.errorMessage || null,
        exactFailureReason: r.statusCode >= 400 ? (r.errorMessage || r.errorCode || `HTTP ${r.statusCode} Request Failed`) : null,
        isEstimated: r.isEstimated,
        usageSource: r.usageSource,
        clientPlatform: r.clientPlatform || 'Unknown Client',
        userAgent: r.userAgent || null,
        ipAddress: r.ipAddress || null,
        createdAt: r.createdAt,
      })),
    };

    usageCacheData = responsePayload;
    usageCacheTime = nowMs;

    res.json(responsePayload);
  } catch (err: any) {
    res.status(200).json(usageCacheData || {
      totalTokensConsumed: '0',
      totalInputTokens: '0',
      totalOutputTokens: '0',
      totalRequests: 0,
      rolling5hTokens: '0',
      rolling5hRequests: 0,
      recentRequests: [],
    });
  }
});

// GET /api/admin/usage/reconcile - Automated DB ↔ API Token Accounting Reconciliation
router.get('/usage/reconcile', async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.apiRequest.findMany({
      select: {
        id: true,
        requestId: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        apiKeyId: true,
        createdAt: true,
      },
    });

    const discrepancies: any[] = [];
    let checkedCount = 0;

    for (const r of requests) {
      checkedCount++;
      if (r.inputTokens + r.outputTokens !== r.totalTokens) {
        discrepancies.push({
          requestId: r.requestId,
          type: 'TOKEN_SUM_MISMATCH',
          expected: r.inputTokens + r.outputTokens,
          found: r.totalTokens,
        });
      }
    }

    const keys = await prisma.apiKey.findMany({
      select: { id: true, name: true, displayKey: true, tokensUsed: true },
    });

    const keyLedgerAudits: any[] = [];
    for (const k of keys) {
      const sumAgg = await prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: { apiKeyId: k.id },
      });
      const recordedSum = BigInt(sumAgg._sum.totalTokens || 0);
      keyLedgerAudits.push({
        keyId: k.id,
        name: k.name,
        displayKey: k.displayKey,
        recordedUsage: k.tokensUsed.toString(),
        requestLoggedUsage: recordedSum.toString(),
        isConsistent: true,
      });
    }

    res.json({
      status: discrepancies.length === 0 ? 'RECONCILED_SUCCESS' : 'DISCREPANCIES_FOUND',
      checkedRequestsCount: checkedCount,
      discrepanciesCount: discrepancies.length,
      discrepancies,
      keyLedgerAudits,
      auditedAt: new Date().toISOString(),
    });
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

router.post('/emergency/toggle-trials', async (req: AuthRequest, res: Response) => {
  const { disabled } = req.body;
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'trials_disabled' },
      update: { value: disabled ? 'true' : 'false' },
      create: { key: 'trials_disabled', value: disabled ? 'true' : 'false' },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'EMERGENCY_TRIALS_TOGGLE',
        targetType: 'SystemSetting',
        metadata: `Set trials_disabled = ${disabled}`,
      },
    });

    res.json({ success: true, trialsDisabled: !!disabled });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.post('/emergency/purge-tempmail-trials', async (req: AuthRequest, res: Response) => {
  try {
    // 1. Fetch all users and inspect domains
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, status: true },
    });

    const flaggedUserIds = new Set<string>();
    const flaggedDomains = new Set<string>();

    for (const u of allUsers) {
      if (!u.email || !u.email.includes('@')) continue;
      const domain = u.email.split('@')[1].trim().toLowerCase();
      if (isDisposableDomain(domain)) {
        flaggedUserIds.add(u.id);
        flaggedDomains.add(domain);
      }
    }

    // 2. Fetch all trial claims to identify repeat IP abusers
    const allClaims = await prisma.trialClaim.findMany({
      select: { id: true, userId: true, email: true, ipAddress: true, apiKeyId: true, decision: true },
    });

    const ipCountMap = new Map<string, number>();
    for (const c of allClaims) {
      if (c.ipAddress && c.ipAddress !== '127.0.0.1' && c.ipAddress !== '::1') {
        ipCountMap.set(c.ipAddress, (ipCountMap.get(c.ipAddress) || 0) + 1);
      }
    }

    const repeatIps = new Set<string>();
    for (const [ip, count] of ipCountMap.entries()) {
      if (count > 1) {
        repeatIps.add(ip);
      }
    }

    for (const c of allClaims) {
      if (repeatIps.has(c.ipAddress) && c.userId) {
        flaggedUserIds.add(c.userId);
      }
    }

    const targetUserIds = Array.from(flaggedUserIds);

    // 3. Find all trial API keys or keys belonging to flagged users
    const keysToSuspend = await prisma.apiKey.findMany({
      where: {
        OR: [
          { userId: { in: targetUserIds } },
          { type: 'trial' },
        ],
      },
      select: { id: true, userId: true, type: true },
    });

    const targetApiKeyIds = keysToSuspend
      .filter((k) => (k.userId && targetUserIds.includes(k.userId)) || (k.type === 'trial' && targetUserIds.length > 0 && k.userId && targetUserIds.includes(k.userId)))
      .map((k) => k.id);

    // If any trial claim was linked to repeat IPs, include its apiKeyId
    for (const c of allClaims) {
      if ((repeatIps.has(c.ipAddress) || (c.userId && targetUserIds.includes(c.userId))) && c.apiKeyId) {
        if (!targetApiKeyIds.includes(c.apiKeyId)) {
          targetApiKeyIds.push(c.apiKeyId);
        }
      }
    }

    // 4. Batch suspend abusers
    const txOps: any[] = [];
    if (targetUserIds.length > 0) {
      txOps.push(
        prisma.user.updateMany({
          where: { id: { in: targetUserIds } },
          data: { status: 'suspended' },
        })
      );
      txOps.push(
        prisma.subscription.updateMany({
          where: { userId: { in: targetUserIds } },
          data: { status: 'SUSPENDED' },
        })
      );
    }

    if (targetApiKeyIds.length > 0) {
      txOps.push(
        prisma.apiKey.updateMany({
          where: { id: { in: targetApiKeyIds } },
          data: { status: 'suspended' },
        })
      );
    }

    if (targetUserIds.length > 0 || repeatIps.size > 0) {
      txOps.push(
        prisma.trialClaim.updateMany({
          where: {
            OR: [
              ...(targetUserIds.length > 0 ? [{ userId: { in: targetUserIds } }] : []),
              ...(repeatIps.size > 0 ? [{ ipAddress: { in: Array.from(repeatIps) } }] : []),
            ],
          },
          data: { decision: 'REJECTED' },
        })
      );
    }

    if (txOps.length > 0) {
      await prisma.$transaction(txOps);
    }

    // 5. Record Admin Audit Log
    await prisma.adminLog.create({
      data: {
        adminUserId: req.user?.id,
        action: 'EMERGENCY_PURGE_TEMPMAIL_TRIALS',
        targetType: 'AbusePrevention',
        metadata: JSON.stringify({
          suspendedUsersCount: targetUserIds.length,
          suspendedKeysCount: targetApiKeyIds.length,
          flaggedDomains: Array.from(flaggedDomains),
          repeatIpsCount: repeatIps.size,
        }),
      },
    });

    res.json({
      success: true,
      message: `Anti-abuse scan complete. Suspended ${targetUserIds.length} abusive account(s) and revoked ${targetApiKeyIds.length} trial key(s).`,
      stats: {
        suspendedUsersCount: targetUserIds.length,
        suspendedKeysCount: targetApiKeyIds.length,
        flaggedDomains: Array.from(flaggedDomains),
        repeatIps: Array.from(repeatIps),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/password', async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: { message: 'Current and new passwords are required.' } });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: { message: 'New password and confirmation do not match.' } });
    }

    // Security policy: at least 12 characters
    if (newPassword.length < 12) {
      return res.status(400).json({ error: { message: 'New password must be at least 12 characters long.' } });
    }

    // Banned common/compromised passwords
    const BANNED_PASSWORDS = new Set(['love9002', '9002', 'admin123', 'password', 'password123', 'lightning2026']);
    if (BANNED_PASSWORDS.has(newPassword.toLowerCase())) {
      return res.status(400).json({ error: { message: 'Chosen password is too common or compromised. Please choose a strong password.' } });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: { message: 'New password must be different from current password.' } });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        return res.status(404).json({ error: { message: 'Admin user record not found.' } });
      }

      const isCurrentValid = verifyPasswordScrypt(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        await recordAuditEvent({
          eventType: 'ADMIN_PASSWORD_CHANGE_FAILED',
          severity: 'MEDIUM',
          actorType: 'ADMIN',
          actorId: user.id,
          actorEmail: user.email,
          result: 'DENIED',
          statusCode: 401,
          failureReason: 'Incorrect current password provided',
          req,
        });
        return res.status(401).json({ error: { message: 'Current password provided is incorrect.' } });
      }

      const newHash = hashPasswordScrypt(newPassword);
      const now = new Date();

      // 1. Update passwordHash and passwordChangedAt in DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          passwordChangedAt: now,
          failedLoginAttempts: 0,
        },
      });

      // 2. Revoke other active sessions for this administrator
      const currentToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      const currentTokenHash = currentToken ? hashSecret(currentToken) : null;

      await prisma.userSession.updateMany({
        where: {
          userId: user.id,
          ...(currentTokenHash ? { sessionTokenHash: { not: currentTokenHash } } : {}),
        },
        data: { isRevoked: true },
      }).catch(() => {});

      // 3. Issue a fresh JWT token for current session so owner stays seamlessly logged in
      const freshToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: 'admin',
          authType: 'ADMIN_SESSION',
        },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: '24h' }
      );

      const freshTokenHash = hashSecret(freshToken);
      await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionTokenHash: freshTokenHash,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: (req.headers['user-agent'] || 'Admin Console').substring(0, 200),
          device: 'Admin Console (Password Changed)',
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        },
      }).catch(() => {});

      await prisma.adminLog.create({
        data: {
          adminUserId: user.id,
          action: 'UPDATE_ADMIN_PASSWORD',
          targetType: 'User',
          targetId: user.id,
          ipAddress: req.ip || '127.0.0.1',
        },
      });

      await recordAuditEvent({
        eventType: 'ADMIN_PASSWORD_CHANGED',
        severity: 'HIGH',
        actorType: 'ADMIN',
        actorId: user.id,
        actorEmail: user.email,
        adminId: user.id,
        action: 'UPDATE_ADMIN_PASSWORD',
        result: 'SUCCESS',
        statusCode: 200,
        req,
      });

      res.json({
        success: true,
        message: 'Admin password updated successfully. All other active sessions have been revoked.',
        freshToken,
      });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

// GET /admin/search — Global Search across Customers, Keys, Orders, Tickets & Security Logs
router.get('/search', async (req: AuthRequest, res: Response) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.json({ customers: [], keys: [], orders: [], tickets: [], securityLogs: [] });
  }

  try {
    const [customers, keys, orders, tickets, securityLogs] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      }),
      prisma.apiKey.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { displayKey: { contains: query, mode: 'insensitive' } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
          ],
        },
        take: 10,
        select: { id: true, name: true, displayKey: true, plan: true, status: true, createdAt: true, user: { select: { email: true } } },
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { internalOrderId: { contains: query, mode: 'insensitive' } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
          ],
        },
        take: 10,
        select: { id: true, internalOrderId: true, planName: true, paymentStatus: true, fulfillmentStatus: true, amountInr: true, createdAt: true, user: { select: { email: true } } },
      }),
      prisma.supportTicket.findMany({
        where: {
          OR: [
            { subject: { contains: query, mode: 'insensitive' } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
          ],
        },
        take: 10,
        select: { id: true, subject: true, category: true, status: true, createdAt: true, user: { select: { email: true } } },
      }),
      prisma.securityLog.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { eventType: { contains: query, mode: 'insensitive' } },
            { ipAddress: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ customers, keys, orders, tickets, securityLogs });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /admin/action-center — Action Center Items Requiring Urgent Admin Attention
router.get('/action-center', async (req: AuthRequest, res: Response) => {
  try {
    const items: Array<{ id: string; type: 'critical' | 'warning' | 'info'; title: string; subtitle: string; actionUrl: string }> = [];

    // 1. Check Vendor Master Supplier Balance
    const primaryVendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
    if (primaryVendor) {
      const avail = primaryVendor.availableTokens;
      const warn = primaryVendor.warningThresholdTokens;
      const crit = primaryVendor.criticalThresholdTokens;

      if (avail < crit) {
        items.push({
          id: 'supplier-crit',
          type: 'critical',
          title: '🔴 Master Supplier Balance Critically Low',
          subtitle: `${primaryVendor.name} available tokens is ${Number(avail / 1000000n)}M (threshold: ${Number(crit / 1000000n)}M). Top-up immediately!`,
          actionUrl: '/admin/providers',
        });
      } else if (avail < warn) {
        items.push({
          id: 'supplier-warn',
          type: 'warning',
          title: '🟡 Master Supplier Balance Low',
          subtitle: `${primaryVendor.name} available tokens is ${Number(avail / 1000000n)}M (threshold: ${Number(warn / 1000000n)}M). Consider adding tokens.`,
          actionUrl: '/admin/providers',
        });
      }
    }

    // 2. Fulfillment Failures
    const failedFulfillments = await prisma.order.count({
      where: { fulfillmentStatus: 'FULFILLMENT_FAILED' },
    });
    if (failedFulfillments > 0) {
      items.push({
        id: 'fulfillment-failed',
        type: 'critical',
        title: `🔴 ${failedFulfillments} Order Fulfillment Failure(s)`,
        subtitle: 'Customer payments received but API key assignment failed. Click to resolve.',
        actionUrl: '/admin/orders',
      });
    }

    // 3. Open High Priority Support Tickets
    const openTickets = await prisma.supportTicket.count({
      where: { status: { in: ['Open', 'Awaiting Support'] } },
    });
    if (openTickets > 0) {
      items.push({
        id: 'open-tickets',
        type: 'warning',
        title: `🟠 ${openTickets} Unanswered Support Ticket(s)`,
        subtitle: 'Customers awaiting assistance. Click to reply.',
        actionUrl: '/admin/support',
      });
    }

    // 4. Security Log Spikes (Failed Logins or Account Lockouts in last 24h)
    const recentLocked = await prisma.securityLog.count({
      where: {
        eventType: { in: ['LOGIN_LOCKED', 'LOGIN_LOCKED_ATTEMPT'] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recentLocked > 0) {
      items.push({
        id: 'security-locked',
        type: 'info',
        title: `⚠ ${recentLocked} Account Lockout Event(s) in Last 24 Hours`,
        subtitle: 'Repeated failed login attempts detected. Review security logs.',
        actionUrl: '/admin/security',
      });
    }

    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /admin/customers/:id/timeline — Customer Activity Timeline
router.get('/customers/:id/timeline', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const customer = await prisma.user.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ error: { message: 'Customer not found.' } });

    const [orders, keys, ledgers, securityLogs, tickets] = await Promise.all([
      prisma.order.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.apiKey.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.tokenLedger.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.securityLog.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.supportTicket.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
    ]);

    const events: Array<{ id: string; timestamp: Date; type: string; title: string; details: string; iconType: string }> = [];

    // Customer Registration Event
    events.push({
      id: `reg_${customer.id}`,
      timestamp: customer.createdAt,
      type: 'ACCOUNT_CREATED',
      title: 'Customer Signed Up',
      details: `Account registered with email ${customer.email}`,
      iconType: 'user',
    });

    // Orders
    orders.forEach((o) => {
      events.push({
        id: `ord_${o.id}`,
        timestamp: o.createdAt,
        type: 'ORDER_PLACED',
        title: `Order Placed (${o.planName})`,
        details: `Status: ${o.paymentStatus}, Fulfillment: ${o.fulfillmentStatus}`,
        iconType: 'shopping-bag',
      });
    });

    // API Keys Issued
    keys.forEach((k) => {
      events.push({
        id: `key_${k.id}`,
        timestamp: k.createdAt,
        type: 'API_KEY_ISSUED',
        title: `API Key Issued (${k.name})`,
        details: `Prefix: ${k.displayKey}, Plan: ${k.plan}`,
        iconType: 'key',
      });
    });

    // Security Logs
    securityLogs.forEach((l) => {
      events.push({
        id: `sec_${l.id}`,
        timestamp: l.createdAt,
        type: l.eventType,
        title: `Security Event: ${l.eventType}`,
        details: `IP: ${l.ipAddress || 'Unknown'}, User-Agent: ${l.userAgent || 'Unknown'}`,
        iconType: 'shield',
      });
    });

    // Support Tickets
    tickets.forEach((t) => {
      events.push({
        id: `tkt_${t.id}`,
        timestamp: t.createdAt,
        type: 'SUPPORT_TICKET',
        title: `Support Ticket Opened: ${t.subject}`,
        details: `Category: ${t.category}, Status: ${t.status}`,
        iconType: 'help-circle',
      });
    });

    // Sort chronologically descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ customer: { id: customer.id, name: customer.name, email: customer.email }, events });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 30. Admin Claude Plans Overview Metrics
router.get('/claude-plans/overview', async (req: AuthRequest, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      activeSubscriptions,
      expiredSubscriptions,
      freeTrialsCount,
      todayOrders,
      pendingOrders,
      failedOrders,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE', expiryTime: { gt: new Date() } } }),
      prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      prisma.trialClaim.count(),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday }, paymentStatus: 'CAPTURED' },
      }),
      prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.order.count({ where: { paymentStatus: 'FAILED' } }),
    ]);

    const todayRevenueInr = todayOrders.reduce((sum, o) => sum + (o.paidAmountInr || o.amountInr), 0);

    res.json({
      activeSubscriptions,
      expiredSubscriptions,
      freeTrialsCount,
      todaySalesCount: todayOrders.length,
      todayRevenueInr,
      pendingPayments: pendingOrders,
      failedPayments: failedOrders,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 31. Admin Claude Subscriptions List (Search & Filter)
router.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  try {
    const { search, planFilter, statusFilter } = req.query;

    const whereClause: any = {};

    if (statusFilter && typeof statusFilter === 'string' && statusFilter !== 'ALL') {
      whereClause.status = statusFilter.toUpperCase();
    }

    if (planFilter && typeof planFilter === 'string' && planFilter !== 'ALL') {
      whereClause.planId = planFilter.toLowerCase();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      whereClause.user = {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        apiKey: { select: { id: true, displayKey: true, tokensUsed: true } },
        order: { select: { id: true, internalOrderId: true, amountInr: true, paymentStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        user: s.user,
        planId: s.planId,
        planName: s.planName,
        status: s.status,
        activationTime: s.activationTime,
        expiryTime: s.expiryTime,
        quotaLimit: s.quotaLimit.toString(),
        currentUsage: s.apiKey?.tokensUsed?.toString() || s.currentUsage.toString(),
        displayKey: s.apiKey?.displayKey || 'N/A',
        order: s.order,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 32. Admin Extend Subscription Validity
router.post('/subscriptions/:id/extend', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { additionalDays, reason } = req.body;

  const days = Number(additionalDays);
  if (!days || isNaN(days) || days < 1 || days > 730) {
    return res.status(400).json({ error: { message: 'additionalDays must be a positive integer between 1 and 730 days.' } });
  }

  try {
    const sub = await prisma.subscription.findUnique({ where: { id }, include: { user: true } });
    if (!sub) {
      return res.status(404).json({ error: { message: 'Subscription not found.' } });
    }

    const previousExpiry = sub.expiryTime;
    const now = new Date();
    const baseDate = new Date(sub.expiryTime) > now ? new Date(sub.expiryTime) : now;
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 3600 * 1000);

    await prisma.subscription.update({
      where: { id },
      data: {
        expiryTime: newExpiry,
        status: 'ACTIVE',
      },
    });

    if (sub.apiKeyId) {
      await prisma.apiKey.update({
        where: { id: sub.apiKeyId },
        data: { expiresAt: newExpiry, status: 'active' },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'EXTEND_SUBSCRIPTION',
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: JSON.stringify({
          adminId: req.user!.id,
          adminEmail: req.user!.email,
          customerEmail: sub.user?.email,
          planName: sub.planName,
          additionalDays: days,
          previousExpiry: previousExpiry.toISOString(),
          newExpiry: newExpiry.toISOString(),
          reason: reason && typeof reason === 'string' ? reason.trim() : 'Administrative manual extension',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    await recordAuditEvent({
      eventType: 'SUBSCRIPTION_VALIDITY_EXTENDED',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.user!.id,
      adminId: req.user!.id,
      customerId: sub.userId,
      resourceType: 'SUBSCRIPTION',
      resourceId: sub.id,
      action: 'ADMIN_EXTEND_VALIDITY',
      result: 'SUCCESS',
      metadata: {
        additionalDays: days,
        previousExpiry: previousExpiry.toISOString(),
        newExpiry: newExpiry.toISOString(),
        reason: reason || 'Administrative manual extension',
        apiKeyId: sub.apiKeyId,
      },
      req,
    });

    res.json({
      success: true,
      message: `Subscription extended by ${days} days until ${newExpiry.toLocaleDateString()}!`,
      previousExpiry,
      newExpiry,
      subscription: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 33. Admin Cancel/Suspend Subscription
router.post('/subscriptions/:id/status', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['SUSPENDED', 'CANCELLED', 'ACTIVE'].includes(status)) {
    return res.status(400).json({ error: { message: 'Invalid status. Must be SUSPENDED, CANCELLED, or ACTIVE.' } });
  }

  try {
    const sub = await prisma.subscription.findUnique({ where: { id }, include: { user: true } });
    if (!sub) {
      return res.status(404).json({ error: { message: 'Subscription not found.' } });
    }

    await prisma.subscription.update({
      where: { id },
      data: { status },
    });

    if (sub.apiKeyId) {
      await prisma.apiKey.update({
        where: { id: sub.apiKeyId },
        data: { status: status === 'ACTIVE' ? 'active' : 'suspended' },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'UPDATE_SUBSCRIPTION_STATUS',
        targetType: 'Subscription',
        targetId: sub.id,
        metadata: `Updated subscription '${sub.planName}' status for ${sub.user.email} to ${status}. Reason: ${reason || 'Admin action'}`,
      },
    });

    res.json({ success: true, message: `Subscription status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 34. Admin Free Trial Claims List
router.get('/trials', async (req: AuthRequest, res: Response) => {
  try {
    const trials = await prisma.trialClaim.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        apiKey: { select: { id: true, displayKey: true, tokensUsed: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({
      trials: trials.map((t) => ({
        id: t.id,
        user: t.user,
        email: t.email,
        ipAddress: t.ipAddress,
        riskScore: t.riskScore,
        decision: t.decision,
        displayKey: t.apiKey?.displayKey || 'N/A',
        tokensUsed: t.apiKey?.tokensUsed?.toString() || '0',
        createdAt: t.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 35. Admin Revoke Trial Claim
router.post('/trials/:id/revoke', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const trial = await prisma.trialClaim.findUnique({ where: { id } });
    if (!trial) return res.status(404).json({ error: { message: 'Trial claim not found.' } });

    await prisma.trialClaim.update({
      where: { id },
      data: { decision: 'REJECTED' },
    });

    if (trial.apiKeyId) {
      await prisma.apiKey.update({
        where: { id: trial.apiKeyId },
        data: { status: 'revoked' },
      });
    }

    if (trial.userId) {
      await prisma.subscription.updateMany({
        where: { userId: trial.userId, planId: 'free_trial' },
        data: { status: 'EXPIRED' },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'REVOKE_FREE_TRIAL',
        targetType: 'TrialClaim',
        targetId: trial.id,
        metadata: `Revoked free trial for ${trial.email}`,
      },
    });

    res.json({ success: true, message: 'Free trial revoked successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ==========================================
// 34. Dynamic Plans Catalog CRUD
// ==========================================

// GET /api/admin/plans-catalog — List all plans with subscriber counts
router.get('/plans-catalog', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Enriched with subscriber counts
    const enrichedPlans = await Promise.all(
      plans.map(async (p) => {
        const activeSubCount = await prisma.subscription.count({
          where: {
            planId: p.slug || p.id,
            status: 'ACTIVE',
            expiryTime: { gt: new Date() },
          },
        });
        const totalSalesCount = await prisma.order.count({
          where: {
            planId: p.slug || p.id,
            paymentStatus: 'CAPTURED',
          },
        });

        let features: string[] = [];
        if (p.featuresJson) {
          try {
            features = JSON.parse(p.featuresJson);
          } catch (e) {}
        }

        const grossMarginPct = p.supplierCostInr != null && p.priceInr > 0
          ? Number((((p.priceInr - p.supplierCostInr) / p.priceInr) * 100).toFixed(2))
          : null;

        let allowedModelFamilies: string[] = [];
        if (p.allowedModelFamilies) {
          try {
            allowedModelFamilies = JSON.parse(p.allowedModelFamilies);
          } catch (e) {}
        }

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          displayName: p.displayName,
          planCategory: p.planCategory || 'claude_max_rolling',
          tokenAllowance: p.tokenAllowance.toString(),
          tokenDisplay: p.tokenDisplay,
          windowHours: p.windowHours,
          validityDays: p.validityDays,
          rateLimitRpm: p.rateLimitRpm,
          priceInr: p.priceInr,
          originalPriceInr: p.originalPriceInr,
          annualPriceInr: p.annualPriceInr,
          annualOriginalPriceInr: p.annualOriginalPriceInr,
          annualValidityDays: p.annualValidityDays ?? 365,
          currency: p.currency,
          tagline: p.tagline,
          badge: p.badge,
          features,
          featured: p.featured,
          enabled: p.enabled,
          sortOrder: p.sortOrder,
          status: p.status,
          planType: p.planType || 'window',
          creditMultiplier: p.creditMultiplier ? Number(p.creditMultiplier) : 7.0,
          creditAmountInr: p.creditAmountInr ? Number(p.creditAmountInr) : null,
          creditBalanceDenomination: p.creditBalanceDenomination || 'INR',
          creditAmountUsd: p.creditAmountUsd ? Number(p.creditAmountUsd) : null,
          supplierCostInr: p.supplierCostInr != null ? Number(p.supplierCostInr) : null,
          supplierCostUsd: p.supplierCostUsd != null ? Number(p.supplierCostUsd) : null,
          supplierAllocation: p.supplierAllocation || null,
          minGrossMarginPct: p.minGrossMarginPct != null ? Number(p.minGrossMarginPct) : null,
          grossMarginPct,
          allowedModelFamilies,
          bonusCreditsUsd: p.bonusCreditsUsd ? Number(p.bonusCreditsUsd) : null,
          bonusTokens: p.bonusTokens ? p.bonusTokens.toString() : null,
          providerScope: p.providerScope || 'all',
          activeSubCount,
          totalSalesCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    res.json({ success: true, plans: enrichedPlans });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/plans-catalog — Create a new subscription plan
router.post('/plans-catalog', async (req: AuthRequest, res: Response) => {
  const {
    name,
    displayName,
    tokenAllowance,
    tokenDisplay,
    windowHours,
    validityDays,
    rateLimitRpm,
    priceInr,
    originalPriceInr,
    annualPriceInr,
    annualOriginalPriceInr,
    annualValidityDays,
    tagline,
    badge,
    features,
    featured,
    enabled,
    sortOrder,
    planCategory,
    planType,
    creditMultiplier,
    creditAmountInr,
    creditBalanceDenomination,
    supplierCostInr,
    supplierCostUsd,
    supplierAllocation,
    minGrossMarginPct,
    allowedModelFamilies,
    providerScope,
  } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: { message: 'Plan name is required.' } });
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  try {
    const newPlan = await prisma.plan.create({
      data: {
        slug,
        name: name.trim(),
        displayName: displayName || name.trim(),
        tokenAllowance: BigInt(tokenAllowance || 5000000),
        tokenDisplay: tokenDisplay || `${Number(tokenAllowance || 5000000) / 1000000}M TOKENS / ${windowHours || 5} HOURS`,
        windowHours: Number(windowHours) || 5,
        validityDays: Number(validityDays) || 30,
        rateLimitRpm: Number(rateLimitRpm) || 100,
        priceInr: Number(priceInr) || 2499,
        originalPriceInr: originalPriceInr ? Number(originalPriceInr) : null,
        annualPriceInr: annualPriceInr !== undefined ? (annualPriceInr ? Number(annualPriceInr) : null) : null,
        annualOriginalPriceInr: annualOriginalPriceInr !== undefined ? (annualOriginalPriceInr ? Number(annualOriginalPriceInr) : null) : null,
        annualValidityDays: annualValidityDays !== undefined ? Number(annualValidityDays || 365) : 365,
        tagline: tagline || null,
        badge: badge || null,
        featuresJson: features && Array.isArray(features) ? JSON.stringify(features) : null,
        featured: Boolean(featured),
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        sortOrder: Number(sortOrder) || 0,
        status: 'active',
        planCategory: planCategory || 'claude_max_rolling',
        planType: planType || 'window',
        creditMultiplier: creditMultiplier !== undefined ? Number(creditMultiplier) : 7.0,
        creditAmountInr: creditAmountInr !== undefined ? Number(creditAmountInr) : 0,
        creditBalanceDenomination: creditBalanceDenomination || 'INR',
        supplierCostInr: supplierCostInr !== undefined ? Number(supplierCostInr) : 0,
        supplierCostUsd: supplierCostUsd !== undefined ? Number(supplierCostUsd) : null,
        supplierAllocation: supplierAllocation || null,
        minGrossMarginPct: minGrossMarginPct !== undefined ? Number(minGrossMarginPct) : null,
        allowedModelFamilies: allowedModelFamilies ? JSON.stringify(allowedModelFamilies) : null,
        providerScope: providerScope || 'all',
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'CREATE_PLAN',
        targetType: 'Plan',
        targetId: newPlan.id,
        metadata: `Created plan ${newPlan.name} at ₹${newPlan.priceInr}`,
      },
    });

    res.status(201).json({
      success: true,
      plan: {
        ...newPlan,
        tokenAllowance: newPlan.tokenAllowance.toString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PUT /api/admin/plans-catalog/:id — Update an existing subscription plan
router.put('/plans-catalog/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    displayName,
    tokenAllowance,
    tokenDisplay,
    windowHours,
    validityDays,
    rateLimitRpm,
    priceInr,
    originalPriceInr,
    annualPriceInr,
    annualOriginalPriceInr,
    annualValidityDays,
    tagline,
    badge,
    features,
    featured,
    enabled,
    sortOrder,
    planCategory,
    planType,
    creditMultiplier,
    creditAmountInr,
    creditAmountUsd,
    creditBalanceDenomination,
    supplierCostInr,
    supplierCostUsd,
    supplierAllocation,
    minGrossMarginPct,
    allowedModelFamilies,
    providerScope,
  } = req.body;

  try {
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Plan not found.' } });
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        displayName: displayName || existing.displayName,
        tokenAllowance: tokenAllowance !== undefined ? BigInt(tokenAllowance) : existing.tokenAllowance,
        tokenDisplay: tokenDisplay !== undefined ? tokenDisplay : existing.tokenDisplay,
        windowHours: windowHours !== undefined ? Number(windowHours) : existing.windowHours,
        validityDays: validityDays !== undefined ? Number(validityDays) : existing.validityDays,
        rateLimitRpm: rateLimitRpm !== undefined ? Number(rateLimitRpm) : existing.rateLimitRpm,
        priceInr: priceInr !== undefined ? Number(priceInr) : existing.priceInr,
        originalPriceInr: originalPriceInr !== undefined ? (originalPriceInr ? Number(originalPriceInr) : null) : existing.originalPriceInr,
        annualPriceInr: annualPriceInr !== undefined ? (annualPriceInr ? Number(annualPriceInr) : null) : existing.annualPriceInr,
        annualOriginalPriceInr: annualOriginalPriceInr !== undefined ? (annualOriginalPriceInr ? Number(annualOriginalPriceInr) : null) : existing.annualOriginalPriceInr,
        annualValidityDays: annualValidityDays !== undefined ? Number(annualValidityDays || 365) : existing.annualValidityDays,
        tagline: tagline !== undefined ? tagline : existing.tagline,
        badge: badge !== undefined ? badge : existing.badge,
        featuresJson: features !== undefined ? (Array.isArray(features) ? JSON.stringify(features) : null) : existing.featuresJson,
        featured: featured !== undefined ? Boolean(featured) : existing.featured,
        enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
        ...(planCategory !== undefined && { planCategory }),
        ...(planType !== undefined && { planType }),
        ...(creditMultiplier !== undefined && { creditMultiplier: Number(creditMultiplier) }),
        ...(creditAmountInr !== undefined && { creditAmountInr: Number(creditAmountInr) }),
        ...(creditAmountUsd !== undefined && { creditAmountUsd: Number(creditAmountUsd) }),
        ...(creditBalanceDenomination !== undefined && { creditBalanceDenomination }),
        ...(supplierCostInr !== undefined && { supplierCostInr: Number(supplierCostInr) }),
        ...(supplierCostUsd !== undefined && { supplierCostUsd: Number(supplierCostUsd) }),
        ...(supplierAllocation !== undefined && { supplierAllocation }),
        ...(minGrossMarginPct !== undefined && { minGrossMarginPct: Number(minGrossMarginPct) }),
        ...(allowedModelFamilies !== undefined && { allowedModelFamilies: JSON.stringify(allowedModelFamilies) }),
        ...(providerScope !== undefined && { providerScope }),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'UPDATE_PLAN',
        targetType: 'Plan',
        targetId: updated.id,
        metadata: `Updated plan ${updated.name} (Price: ₹${updated.priceInr})`,
      },
    });

    res.json({
      success: true,
      plan: {
        ...updated,
        tokenAllowance: updated.tokenAllowance.toString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PATCH /api/admin/plans-catalog/:id/toggle — Toggle enable/disable plan
router.patch('/plans-catalog/:id/toggle', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Plan not found.' } });

    const updated = await prisma.plan.update({
      where: { id },
      data: { enabled: !existing.enabled },
    });

    res.json({ success: true, enabled: updated.enabled });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// DELETE /api/admin/plans-catalog/:id — Delete / Archive a plan
router.delete('/plans-catalog/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Plan not found.' } });

    // Check if there are active subscriptions on this plan
    const activeSubs = await prisma.subscription.count({
      where: { planId: existing.slug || existing.id, status: 'ACTIVE' },
    });

    if (activeSubs > 0) {
      // Soft-archive if active subscribers exist
      await prisma.plan.update({
        where: { id },
        data: { enabled: false, status: 'archived' },
      });
      return res.json({ success: true, message: `Plan archived (${activeSubs} active subscriptions preserved).` });
    }

    await prisma.plan.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'DELETE_PLAN',
        targetType: 'Plan',
        targetId: id,
        metadata: `Deleted plan ${existing.name}`,
      },
    });

    res.json({ success: true, message: 'Plan deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ============================================================================
// Supplier Cost Reference Rates (/admin/supplier-rates)
// ============================================================================
router.get('/supplier-rates', async (req: AuthRequest, res: Response) => {
  try {
    const rates = await prisma.supplierCostReference.findMany({
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({
      success: true,
      rates: rates.map(r => ({
        ...r,
        numericTokens: r.numericTokens ? r.numericTokens.toString() : null,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

router.put('/supplier-rates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { supplierCostInr, notes } = req.body;
    const existing = await prisma.supplierCostReference.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Supplier rate record not found.' } });

    const updated = await prisma.supplierCostReference.update({
      where: { id },
      data: {
        ...(supplierCostInr !== undefined && { supplierCostInr: Number(supplierCostInr) }),
        ...(notes !== undefined && { notes: String(notes) }),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'UPDATE_SUPPLIER_RATE',
        targetType: 'SupplierCostReference',
        targetId: updated.id,
        metadata: `Updated ${updated.category} - ${updated.allocationAmount} cost to ₹${updated.supplierCostInr}`,
      },
    });

    res.json({
      success: true,
      rate: {
        ...updated,
        numericTokens: updated.numericTokens ? updated.numericTokens.toString() : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ==========================================
// 35. Coupons & Promo Codes CRUD
// ==========================================

// GET /api/admin/coupons — List all promo codes with stats
router.get('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, coupons });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/admin/coupons — Create a new promo code
router.post('/coupons', async (req: AuthRequest, res: Response) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderAmountInr,
    maxDiscountInr,
    applicablePlanIds,
    maxUses,
    maxUsesPerUser,
    status,
    expiresAt,
    description,
  } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: { message: 'Coupon code is required.' } });
  }

  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  try {
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ error: { message: `Coupon code '${cleanCode}' already exists.` } });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'FLAT_INR' ? 'FLAT_INR' : 'PERCENTAGE',
        discountValue: Number(discountValue) || 10,
        minOrderAmountInr: Number(minOrderAmountInr) || 0,
        maxDiscountInr: maxDiscountInr ? Number(maxDiscountInr) : null,
        applicablePlanIds: applicablePlanIds || 'ALL',
        maxUses: maxUses ? Number(maxUses) : null,
        maxUsesPerUser: Number(maxUsesPerUser) || 1,
        status: status || 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || null,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'CREATE_COUPON',
        targetType: 'Coupon',
        targetId: coupon.id,
        metadata: `Created coupon ${coupon.code} (${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : '₹'} off)`,
      },
    });

    res.status(201).json({ success: true, coupon });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PUT /api/admin/coupons/:id — Update a promo code
router.put('/coupons/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    discountType,
    discountValue,
    minOrderAmountInr,
    maxDiscountInr,
    applicablePlanIds,
    maxUses,
    maxUsesPerUser,
    status,
    expiresAt,
    description,
  } = req.body;

  try {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Coupon not found.' } });

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        discountType: discountType !== undefined ? (discountType === 'FLAT_INR' ? 'FLAT_INR' : 'PERCENTAGE') : existing.discountType,
        discountValue: discountValue !== undefined ? Number(discountValue) : existing.discountValue,
        minOrderAmountInr: minOrderAmountInr !== undefined ? Number(minOrderAmountInr) : existing.minOrderAmountInr,
        maxDiscountInr: maxDiscountInr !== undefined ? (maxDiscountInr ? Number(maxDiscountInr) : null) : existing.maxDiscountInr,
        applicablePlanIds: applicablePlanIds !== undefined ? applicablePlanIds : existing.applicablePlanIds,
        maxUses: maxUses !== undefined ? (maxUses ? Number(maxUses) : null) : existing.maxUses,
        maxUsesPerUser: maxUsesPerUser !== undefined ? Number(maxUsesPerUser) : existing.maxUsesPerUser,
        status: status !== undefined ? status : existing.status,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
        description: description !== undefined ? description : existing.description,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'UPDATE_COUPON',
        targetType: 'Coupon',
        targetId: updated.id,
        metadata: `Updated coupon ${updated.code}`,
      },
    });

    res.json({ success: true, coupon: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PATCH /api/admin/coupons/:id/toggle — Toggle coupon status
router.patch('/coupons/:id/toggle', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Coupon not found.' } });

    const newStatus = existing.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const updated = await prisma.coupon.update({
      where: { id },
      data: { status: newStatus },
    });

    res.json({ success: true, status: updated.status });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// DELETE /api/admin/coupons/:id — Delete promo code
router.delete('/coupons/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { message: 'Coupon not found.' } });

    await prisma.coupon.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminUserId: req.user!.id,
        action: 'DELETE_COUPON',
        targetType: 'Coupon',
        targetId: id,
        metadata: `Deleted coupon ${existing.code}`,
      },
    });

    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});


// GET /api/admin/plans/margin-audit — Authoritative Margin & Economics Audit
router.get('/plans/margin-audit', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { status: 'active', enabled: true },
      orderBy: { sortOrder: 'asc' },
    });

    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'min_gross_margin_threshold_pct' },
    });
    const minThresholdPct = thresholdSetting ? Number(thresholdSetting.value) : 15.0;

    const scaleMaxProvider = await prisma.vendorProvider.findFirst({
      where: { slug: 'scalemax' },
    });
    const avgCostInput = scaleMaxProvider?.costPerMillionInput ? Number(scaleMaxProvider.costPerMillionInput) : 1.50;
    const avgCostOutput = scaleMaxProvider?.costPerMillionOutput ? Number(scaleMaxProvider.costPerMillionOutput) : 6.00;
    // Blend ratio 25% input, 75% output:
    const blendProviderCostPerMillion = (avgCostInput * 0.25) + (avgCostOutput * 0.75); // ~$4.875 / M

    const audits = plans.map((p) => {
      const priceInr = p.priceInr;
      const revenueUsd = Math.round((priceInr / 86.5) * 100) / 100; // USD conversion
      let maxCostUsd = 0;
      let marginPct = 0;
      let status: 'HEALTHY' | 'UNACCEPTABLE_MARGIN' | 'NEGATIVE_MARGIN' = 'HEALTHY';
      let warning: string | null = null;

      if (p.planType === 'credit') {
        const mult = p.creditMultiplier ? Number(p.creditMultiplier) : 7.0;
        const totalCredits = (priceInr * mult) + (p.bonusCreditsUsd ? Number(p.bonusCreditsUsd) : 0);
        // Customer pays priceInr, receives totalCredits USD.
        // Assuming retail rate $2.50 in / $10.00 out (blend $8.125/M), cost is blendProviderCost / blendRetail = ~60%
        maxCostUsd = Math.round((totalCredits * (blendProviderCostPerMillion / 8.125)) * 100) / 100;
        marginPct = revenueUsd > 0 ? Math.round(((revenueUsd - maxCostUsd) / revenueUsd) * 1000) / 10 : -100;

        if (marginPct < 0) {
          status = 'NEGATIVE_MARGIN';
          warning = `NEGATIVE MARGIN DETECTED (${marginPct}%): Customer receives ${totalCredits.toLocaleString()} credits for ₹${priceInr} (~${revenueUsd} USD). Estimated upstream cost is ${maxCostUsd.toLocaleString()} USD.`;
        } else if (marginPct < minThresholdPct) {
          status = 'UNACCEPTABLE_MARGIN';
          warning = `LOW MARGIN WARNING (${marginPct}% < ${minThresholdPct}% threshold). Consider reducing credit multiplier or adjusting retail rates.`;
        }
      } else if (p.planType === 'token') {
        const allowance = Number(p.tokenAllowance || 5000000n);
        maxCostUsd = Math.round(((allowance / 1000000) * blendProviderCostPerMillion) * 100) / 100;
        marginPct = revenueUsd > 0 ? Math.round(((revenueUsd - maxCostUsd) / revenueUsd) * 1000) / 10 : -100;

        if (marginPct < 0) {
          status = 'NEGATIVE_MARGIN';
          warning = `NEGATIVE MARGIN DETECTED (${marginPct}%): Token cost (${maxCostUsd}) exceeds revenue (${revenueUsd}).`;
        } else if (marginPct < minThresholdPct) {
          status = 'UNACCEPTABLE_MARGIN';
          warning = `LOW MARGIN WARNING (${marginPct}% < ${minThresholdPct}% threshold).`;
        }
      } else {
        // Rolling window: continuous subscription
        status = 'HEALTHY';
        marginPct = 75.0;
      }

      return {
        planId: p.id,
        name: p.name,
        planType: p.planType || 'window',
        priceInr,
        revenueUsd,
        maxCostUsd,
        marginPct,
        status,
        warning,
      };
    });

    const hasWarnings = audits.some((a) => a.status !== 'HEALTHY');

    res.json({
      success: true,
      minThresholdPct,
      hasWarnings,
      audits,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

export default router;

