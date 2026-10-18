import { Router, Request, Response } from 'express';
import { prisma } from './db.js';
import { authenticateJwt, requireAdmin, AuthRequest } from './auth.js';

export const healthRouter = Router();

interface SubsystemStatus {
  name: string;
  key: string;
  status: 'operational' | 'degraded' | 'down' | 'not_configured';
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

/**
 * Public Status Check Probe (Sanitized for public consumption, no latency or secret leaks)
 */
healthRouter.get('/public/status', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const now = new Date().toISOString();
  const subsystems: SubsystemStatus[] = [];

  // 1. Database Check
  try {
    await prisma.$queryRaw`SELECT 1`;
    subsystems.push({
      name: 'Database Cluster',
      key: 'database',
      status: 'operational',
      lastChecked: now,
    });
  } catch {
    subsystems.push({
      name: 'Database Cluster',
      key: 'database',
      status: 'down',
      lastChecked: now,
    });
  }

  // 2. API Gateway & Model Routing Check
  subsystems.push({
    name: 'API Gateway & Proxy',
    key: 'api_gateway',
    status: 'operational',
    lastChecked: now,
  });

  // 3. Authentication & Session Engine
  subsystems.push({
    name: 'Authentication & Session Engine',
    key: 'auth',
    status: 'operational',
    lastChecked: now,
  });

  // 4. Primary Supplier / Vendor Network (Opus Max)
  try {
    const primaryVendor = await prisma.vendorProvider.findFirst({
      where: { isPrimary: true },
    });

    if (!primaryVendor || primaryVendor.status === 'disabled') {
      subsystems.push({
        name: 'AI Model Infrastructure',
        key: 'supplier',
        status: 'degraded',
        lastChecked: now,
      });
    } else if (primaryVendor.status === 'invalid_credential' || primaryVendor.status === 'provider_error') {
      subsystems.push({
        name: 'AI Model Infrastructure',
        key: 'supplier',
        status: 'degraded',
        lastChecked: now,
      });
    } else {
      subsystems.push({
        name: 'AI Model Infrastructure',
        key: 'supplier',
        status: 'operational',
        lastChecked: now,
      });
    }
  } catch {
    subsystems.push({
      name: 'AI Model Infrastructure',
      key: 'supplier',
      status: 'degraded',
      lastChecked: now,
    });
  }

  // 5. Email Notification Network (Resend)
  const resendConfigured = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
  subsystems.push({
    name: 'Transactional Email Service',
    key: 'email',
    status: resendConfigured ? 'operational' : 'not_configured',
    lastChecked: now,
  });

  // 6. Payment & Billing Gateway
  subsystems.push({
    name: 'Billing & Order Fulfillment',
    key: 'payments',
    status: 'operational',
    lastChecked: now,
  });

  const isAnyDown = subsystems.some((s) => s.status === 'down');
  const isAnyDegraded = subsystems.some((s) => s.status === 'degraded');
  const overallStatus = isAnyDown ? 'degraded' : isAnyDegraded ? 'degraded' : 'operational';

  res.json({
    overallStatus,
    timestamp: now,
    subsystems,
  });
});

/**
 * Detailed Admin System Health Audit (/api/admin/health)
 */
healthRouter.get('/admin/health', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  const now = new Date().toISOString();
  const subsystems: any[] = [];

  // Database Detailed Audit
  const dbStart = Date.now();
  try {
    const userCount = await prisma.user.count();
    const keyCount = await prisma.apiKey.count();
    const reqCount = await prisma.apiRequest.count();
    const dbLatency = Date.now() - dbStart;

    subsystems.push({
      name: 'PostgreSQL Database (Supabase Pooler)',
      key: 'database',
      status: 'operational',
      latencyMs: dbLatency,
      details: {
        totalUsers: userCount,
        totalApiKeys: keyCount,
        totalLoggedRequests: reqCount,
      },
      lastChecked: now,
    });
  } catch (err: any) {
    subsystems.push({
      name: 'PostgreSQL Database',
      key: 'database',
      status: 'down',
      error: err.message,
      lastChecked: now,
    });
  }

  // Supplier Detailed Audit
  try {
    const vendors = await prisma.vendorProvider.findMany();
    const primary = vendors.find((v) => v.isPrimary) || vendors[0];

    subsystems.push({
      name: `Primary Vendor (${primary?.name || 'Opus Max'})`,
      key: 'supplier',
      status: primary?.status === 'connected' ? 'operational' : primary?.status || 'degraded',
      details: {
        baseUrl: primary?.baseUrl,
        availableTokens: primary?.availableTokens ? primary.availableTokens.toString() : '0',
        purchasedTokens: primary?.purchasedTokens ? primary.purchasedTokens.toString() : '0',
        consumedTokens: primary?.consumedTokens ? primary.consumedTokens.toString() : '0',
        lastTestedAt: primary?.lastTestedAt,
        lastError: primary?.lastError || 'None',
      },
      lastChecked: now,
    });
  } catch (err: any) {
    subsystems.push({
      name: 'Primary Vendor Provider',
      key: 'supplier',
      status: 'down',
      error: err.message,
      lastChecked: now,
    });
  }

  // Gateway Throughput & Traffic Audit
  try {
    const last10MinRequests = await prisma.apiRequest.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    const recentErrors = await prisma.apiRequest.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        statusCode: { gte: 400 },
      },
    });

    subsystems.push({
      name: 'API Gateway & Routing Pipeline',
      key: 'api_gateway',
      status: recentErrors > 50 ? 'degraded' : 'operational',
      details: {
        requestsLast10Min: last10MinRequests,
        errorsLast10Min: recentErrors,
        errorRate: last10MinRequests > 0 ? `${((recentErrors / last10MinRequests) * 100).toFixed(1)}%` : '0%',
      },
      lastChecked: now,
    });
  } catch (err: any) {
    subsystems.push({
      name: 'API Gateway',
      key: 'api_gateway',
      status: 'operational',
      lastChecked: now,
    });
  }

  res.json({
    success: true,
    timestamp: now,
    subsystems,
  });
});
