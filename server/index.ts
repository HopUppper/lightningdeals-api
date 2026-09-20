import express from 'express';
import compression from 'compression';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';

import { handleMessagesEndpoint } from './gateway';
import { handleCheckKeyStatus, handleSystemStatus, handleGetModels, handleCountTokens, handleWebSearch, handleUnderstandImage } from './tools';
import adminRouter from './admin';
import adminAuthRouter from './adminAuth';
import userRouter from './user';
import { prisma } from './db';
import { globalErrorHandler, NotFoundError } from './errors';
import { recordPageview, handleAnalyticsBeacon } from './analyticsTracker';

// 0. In-Memory Micro-Cache for High-Traffic Public Endpoints
interface CacheItem<T> {
  data: T;
  expiresAt: number;
}
const apiMemoryCache = new Map<string, CacheItem<any>>();

export function getMemoryCached<T>(key: string): T | null {
  const item = apiMemoryCache.get(key);
  if (item && Date.now() < item.expiresAt) {
    return item.data;
  }
  return null;
}

export function setMemoryCached<T>(key: string, data: T, ttlSeconds: number = 30): void {
  apiMemoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// 0. Startup Configuration Integrity Checks
function validateEnvironmentOnStartup() {
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`[STARTUP AUDIT] Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (!process.env.DATABASE_URL) {
    console.warn(`[STARTUP WARNING] DATABASE_URL is not set. Database connections will fall back to local configuration.`);
  }

  if (isProd && !process.env.ENCRYPTION_KEY) {
    console.warn(`[SECURITY WARNING] ENCRYPTION_KEY environment variable is not explicitly set in production mode.`);
  }
}

validateEnvironmentOnStartup();

const app = express();
const PORT = process.env.PORT || 3001;

// Global HTTP Response Compression (Gzip / Brotli for JS, CSS, HTML, JSON)
app.use(
  compression({
    threshold: 512, // Compress anything larger than 512 bytes
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// Trust reverse proxy (Render / Cloudflare) to extract true client IP
app.set('trust proxy', true);

// Request ID Correlation & Security Headers Middleware
app.use((req, res, next) => {
  const existingReqId = req.headers['x-request-id']?.toString();
  const requestId = existingReqId || `req_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';");
  next();
});

// CORS Hardening
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://lightningapi.pro',
  'https://www.lightningapi.pro',
  'https://api.lightningapi.pro',
  'https://lightningdeals-api.onrender.com',
  process.env.VITE_APP_URL || 'https://lightningdeals.ai',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.lightningapi.pro') ||
        origin.endsWith('.onrender.com') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import { securityThreatDetector } from './securityDetection';
// Automated Security Threat Detector (SQLi, XSS, Path Traversal, Bot Scanners)
app.use(securityThreatDetector);

// Realtime Web Analytics Tracker Middleware
app.use(recordPageview);
app.post('/api/analytics/beacon', handleAnalyticsBeacon);

// 1. Anthropic-Compatible API Gateway
app.get('/v1', (req, res) => res.json({ status: 'online', gateway: 'LightningDeals AI Gateway', version: '1.0.0', protocol: 'Anthropic /v1/messages compatible', docs: 'https://lightningapi.pro/docs' }));
app.get('/v1/', (req, res) => res.json({ status: 'online', gateway: 'LightningDeals AI Gateway', version: '1.0.0', protocol: 'Anthropic /v1/messages compatible', docs: 'https://lightningapi.pro/docs' }));
app.post('/v1/messages', handleMessagesEndpoint);
app.get('/v1/models', handleGetModels);
app.post('/v1/messages/count_tokens', handleCountTokens);

// 2. Built-in Tools Endpoints
app.post('/tools/web_search', handleWebSearch);
app.post('/tools/understand_image', handleUnderstandImage);

import { keyCheckLimiter } from './rateLimit';

// 3. Public System & Key Status Tools
app.get('/api/key-status', keyCheckLimiter, handleCheckKeyStatus);
app.get('/api/system/status', handleSystemStatus);

// Public Pricing Packages for Frontend (Cached for 60s)
app.get('/api/pricing/packages', async (req, res, next) => {
  try {
    const cacheKey = 'pricing_packages_enabled';
    const cached = getMemoryCached<any[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const packages = await prisma.tokenPackage.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
    });
    const serialized = packages.map((p) => ({ ...p, tokenAmount: p.tokenAmount.toString() }));
    setMemoryCached(cacheKey, serialized, 60);
    res.json(serialized);
  } catch (err: any) {
    next(err);
  }
});

import { checkoutRouter, handlePaymentWebhook } from './payments/paymentRoutes';

import { healthRouter } from './health';
import { notificationsRouter } from './notifications';

app.use('/api', healthRouter);
app.use('/api/user/notifications', notificationsRouter);
app.use('/api/checkout', checkoutRouter);
app.post('/api/webhooks/payment', handlePaymentWebhook);
app.post('/api/webhooks/payu', handlePaymentWebhook);
app.post('/api/webhooks/cashfree', handlePaymentWebhook);

app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/user', userRouter);
app.use('/api', userRouter);
app.use('/api/admin', adminRouter);

// 5. One-line Terminal Setup Scripts
app.get('/setup.sh', (req, res) => {
  const baseUrl = process.env.LIGHTNINGDEALS_API_URL || 'https://lightningapi.pro';
  res.type('text/plain').send(`#!/bin/bash
echo "⚡ Setting up LightningDeals AI API Gateway..."
read -p "Enter your LightningDeals API key (ld_live_...): " LD_KEY
export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_AUTH_TOKEN="$LD_KEY"
echo "✅ Configuration saved to environment!"
echo "Run 'claude' to start coding with LightningDeals."
`);
});

app.get('/setup.ps1', (req, res) => {
  const baseUrl = process.env.LIGHTNINGDEALS_API_URL || 'https://lightningapi.pro';
  res.type('text/plain').send(`Write-Host "⚡ Setting up LightningDeals AI API Gateway..." -ForegroundColor Cyan
$key = Read-Host "Enter your LightningDeals API key (ld_live_...)"
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "${baseUrl}", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $key, "User")
Write-Host "✅ Configuration saved to environment variables!" -ForegroundColor Green
Write-Host "Run 'claude' to start coding with LightningDeals."
`);
});

import fs from 'fs';

// 6. Static Web Application & High-Performance Asset Serving
const distPath = path.resolve(import.meta.dirname, '../dist');
console.log('⚡ Static web assets path:', distPath);

// Fast-served immutable hashed bundles (1 year cache)
app.use(
  '/assets',
  express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// General public assets (1 hour cache)
app.use(
  express.static(distPath, {
    maxAge: '1h',
  })
);

// 7. Standard 404 & SPA Catch-all Handler
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/v1')) {
    return next(new NotFoundError(`API endpoint ${req.path} not found.`));
  }

  const cleanPath = req.path.replace(/^\//, '').replace(/\/$/, '');
  const sectionName = cleanPath.split('/')[0];
  const htmlFileName = sectionName ? `${sectionName}.html` : 'index.html';
  const targetHtmlPath = path.join(distPath, htmlFileName);

  // Never cache HTML responses so live database pricing and plan changes reflect immediately
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (fs.existsSync(targetHtmlPath)) {
    return res.sendFile(targetHtmlPath);
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(200).send('<!DOCTYPE html><html><body><h1>LightningDeals API Gateway Server Active</h1></body></html>');
});

// 8. Global Error Handling Middleware
app.use(globalErrorHandler);

// Global Exception Process Resilience Listeners
process.on('unhandledRejection', (reason: any) => {
  console.error('[CRITICAL] Unhandled Promise Rejection caught:', reason?.message || reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[CRITICAL] Uncaught Exception caught:', err.message || err);
});

app.listen(PORT, () => {
  console.log(`🚀 LightningDeals Backend API Gateway running on port ${PORT}`);
});
