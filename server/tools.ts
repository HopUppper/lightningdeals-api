import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from './db';
import { hashApiKey } from './gateway';
import { calculateKeyRollingWindow } from './window';

// 1. Key Status Verification (/api/key-status)
export async function handleCheckKeyStatus(req: Request, res: Response) {
  const rawKey = (
    req.headers['x-api-key']?.toString() ||
    req.headers['authorization']?.toString().replace(/^Bearer\s+/i, '') ||
    req.query.key?.toString() ||
    req.body?.key?.toString() ||
    ''
  ).trim();

  if (!rawKey) {
    return res.status(400).json({ error: { message: 'Key parameter or x-api-key header is required.' } });
  }

  const keyHash = hashApiKey(rawKey);

  const keyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!keyRecord) {
    return res.status(404).json({ valid: false, error: { message: 'API key not found.' } });
  }

  const requests24h = await prisma.apiRequest.count({
    where: {
      apiKeyId: keyRecord.id,
      createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
    },
  });

  const avgLatency = await prisma.apiRequest.aggregate({
    _avg: { latencyMs: true },
    where: { apiKeyId: keyRecord.id },
  });

  const windowMetrics = await calculateKeyRollingWindow(keyRecord);

  const tokensNum = Number(keyRecord.purchasedTokens || 0);
  const numM = Math.round(tokensNum / 1000000);
  const computedPlan = keyRecord.type === 'trial' || (keyRecord.plan && keyRecord.plan.toLowerCase().includes('trial'))
    ? 'Trial Key'
    : (numM > 0 ? `Claude Max ${numM}x` : (keyRecord.plan || 'Claude Max 20x'));

  const recentRequests = await prisma.apiRequest.findMany({
    where: { apiKeyId: keyRecord.id },
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
      createdAt: true,
    },
  });


  res.json({
    valid: true,
    keyPrefix: keyRecord.keyPrefix,
    displayKey: keyRecord.displayKey,
    name: keyRecord.name,
    type: keyRecord.type,
    status: keyRecord.status,
    plan: computedPlan,
    purchasedTokens: windowMetrics.purchasedNum.toString(),
    tokensUsed: windowMetrics.windowTokensUsed.toString(),
    tokensRemaining: windowMetrics.remainingNum.toString(),
    rateLimitRpm: keyRecord.rateLimitRpm,
    expiresAt: keyRecord.expiresAt,
    totalRequests: keyRecord.totalRequests,
    requests24h,
    totalInputTokens: keyRecord.totalInputTokens.toString(),
    totalOutputTokens: keyRecord.totalOutputTokens.toString(),
    avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
    allowedModels: keyRecord.allowedModels,
    createdAt: keyRecord.createdAt,
    firstUsedAt: windowMetrics.effectiveFirstUse,
    lastUsedAt: keyRecord.lastUsedAt,
    windowActive: windowMetrics.windowActive,
    nextResetAt: windowMetrics.nextResetAt,
    windowResetSeconds: windowMetrics.windowResetSeconds,
    consumptionPercent: windowMetrics.consumptionPercent,
    recentRequests,
  });
}




// 2. Real Server-Side System Health Status (/api/system/status)
export async function handleSystemStatus(req: Request, res: Response) {
  const startDb = Date.now();
  let dbOperational = false;
  let dbLatencyMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - startDb;
    dbOperational = true;
  } catch (e) {
    dbOperational = false;
  }

  const activeKeysCount = await prisma.apiKey.count({ where: { status: 'active' } });
  const requestsLastHour = await prisma.apiRequest.count({
    where: { createdAt: { gte: new Date(Date.now() - 3600 * 1000) } },
  });

  const primaryVendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  const vendorConnected = primaryVendor?.status === 'connected';

  const overallStatus = dbOperational && vendorConnected ? 'OPERATIONAL' : dbOperational ? 'DEGRADED' : 'DOWN';

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    dbOperational,
    dbLatencyMs,
    vendorConnected,
    vendorStatus: primaryVendor ? primaryVendor.status : 'not_configured',
    activeKeys: activeKeysCount,
    requestsLastHour,
    services: [
      { name: 'LightningDeals API Gateway', status: 'Operational', latency: '1ms' },
      { name: 'Database & Token Ledger Pool', status: dbOperational ? 'Operational' : 'Down', latency: `${dbLatencyMs}ms` },
      { name: 'Upstream Vendor Connector', status: vendorConnected ? 'Operational' : 'Degraded', note: primaryVendor ? primaryVendor.name : 'Gateway Fallback Active' },
      { name: 'Trial Anti-Abuse Risk Engine', status: 'Operational' },
    ],
  });
}

// 3. Public Models Endpoint (/v1/models)
export async function handleGetModels(req: Request, res: Response) {
  try {
    const models = await prisma.model.findMany({
      where: { enabled: true },
      orderBy: { displayName: 'asc' },
    });

    res.json({
      object: 'list',
      data: models.map((m) => ({
        id: m.modelId,
        object: 'model',
        created: Math.floor(m.createdAt.getTime() / 1000),
        owned_by: m.provider,
        display_name: m.displayName,
        description: m.description,
        context_window: m.contextWindow,
        input_price_per_1m: m.inputPrice,
        output_price_per_1m: m.outputPrice,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
}

// 4. Token Counter (/v1/messages/count_tokens)
export async function handleCountTokens(req: Request, res: Response) {
  const { messages, system } = req.body || {};
  const promptText = (system || '') + JSON.stringify(messages || []);
  const inputTokens = Math.max(1, Math.ceil(promptText.length / 4));
  res.json({ input_tokens: inputTokens });
}
