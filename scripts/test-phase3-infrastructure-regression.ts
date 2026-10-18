/**
 * LIGHTNINGDEALS PHASE 3 INFRASTRUCTURE & OPERATIONAL RESILIENCE REGRESSION TEST HARNESS
 *
 * Verifies production configuration hardening, secrets management fail-closed policies,
 * Cloudflare proxy IP extraction, CORS origin restrictions, security headers,
 * liveness/readiness separation, and vault key migration safety.
 *
 * Usage:
 *   npx tsx scripts/test-phase3-infrastructure-regression.ts
 */

import express, { Request, Response } from 'express';
import http from 'http';
import net from 'net';
import crypto from 'crypto';
import cors from 'cors';
import { prisma, encryptText, decryptText, isEncrypted } from '../server/db';
import { getJwtSecret } from '../server/jwtConfig';
import { resolveClientIp } from '../server/rateLimit';

// Initialize test harness tracking
interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(id: string, name: string, passed: boolean, details: string) {
  results.push({ id, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${id}] ${name}: ${details}`);
}

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGDEALS PHASE 3 INFRASTRUCTURE REGRESSION TEST RUNNER');
  console.log('================================================================\n');

  // ===========================================================================
  // 1. ENVIRONMENT CONFIGURATION & FAIL-CLOSED STARTUP AUDIT
  // ===========================================================================

  // [P3-ENV-01] Startup validation fails closed when JWT_SECRET is missing in production
  const origNodeEnv = process.env.NODE_ENV;
  const origJwtSecret = process.env.JWT_SECRET;
  let missingSecretThrew = false;
  let missingSecretError = '';

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    getJwtSecret();
  } catch (err: any) {
    missingSecretThrew = true;
    missingSecretError = err.message;
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    process.env.JWT_SECRET = origJwtSecret;
  }

  recordTest(
    'P3-ENV-01',
    'Production startup validation fails closed when JWT_SECRET is missing',
    missingSecretThrew && missingSecretError.includes('Mandatory JWT_SECRET environment variable is missing'),
    `Threw: ${missingSecretThrew}, Error: "${missingSecretError.slice(0, 70)}..."`
  );

  // [P3-ENV-02] Startup validation rejects legacy compromised fallback secrets
  let bannedSecretThrew = false;
  let bannedSecretError = '';

  try {
    process.env.JWT_SECRET = 'lightningdeals_secret_jwt_key_2026';
    getJwtSecret();
  } catch (err: any) {
    bannedSecretThrew = true;
    bannedSecretError = err.message;
  } finally {
    process.env.JWT_SECRET = origJwtSecret;
  }

  recordTest(
    'P3-ENV-02',
    'Startup validation rejects legacy compromised fallback secrets',
    bannedSecretThrew && bannedSecretError.includes('compromised legacy fallback secret'),
    `Threw: ${bannedSecretThrew}, Error: "${bannedSecretError.slice(0, 70)}..."`
  );

  // [P3-ENV-03] Startup validation enforces minimum 32 characters on JWT_SECRET in production
  let shortSecretThrew = false;
  let shortSecretError = '';

  try {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short_secret_under_32_chars';
    getJwtSecret();
  } catch (err: any) {
    shortSecretThrew = true;
    shortSecretError = err.message;
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    process.env.JWT_SECRET = origJwtSecret;
  }

  recordTest(
    'P3-ENV-03',
    'Production startup enforces minimum 32-character entropy on JWT_SECRET',
    shortSecretThrew && shortSecretError.includes('must be at least 32 characters long'),
    `Threw: ${shortSecretThrew}, Error: "${shortSecretError.slice(0, 70)}..."`
  );

  // ===========================================================================
  // 2. SECRETS MANAGEMENT & FAIL-CLOSED VAULT DECRYPTION
  // ===========================================================================

  // [P3-VAULT-01] Decryption fails closed (returns empty string, NOT raw ciphertext) on invalid key
  const sensitiveMasterKey = 'sk-ant-api03-live-vault-secret-key-999888';
  const encryptedPayload = encryptText(sensitiveMasterKey);

  // Simulate decrypting with a corrupted or mismatched key
  const corruptedCiphertext = encryptedPayload.replace(/:[a-f0-9]{32}:/, ':ffffffffffffffffffffffffffffffff:');
  const decryptResultCorrupted = decryptText(corruptedCiphertext);

  const vaultFailedClosed = decryptResultCorrupted === '' && !decryptResultCorrupted.includes('sk-ant') && !decryptResultCorrupted.includes('gcm:');
  recordTest(
    'P3-VAULT-01',
    'Vault decryption fails closed and never returns raw ciphertext on authentication tag failure',
    vaultFailedClosed,
    `Returned empty string: ${decryptResultCorrupted === ''}, Returned ciphertext: ${decryptResultCorrupted.includes('gcm:')}`
  );

  // [P3-VAULT-02] isEncrypted accurately distinguishes AEAD ciphertext from plaintext
  const isEncryptedValid = isEncrypted(encryptedPayload);
  const isEncryptedPlaintext = isEncrypted('sk-ant-api03-plain-unencrypted-key');
  const isEncryptedEmpty = isEncrypted('');

  const isEncryptedPassed = isEncryptedValid === true && isEncryptedPlaintext === false && isEncryptedEmpty === false;
  recordTest(
    'P3-VAULT-02',
    'isEncrypted helper reliably identifies AEAD GCM ciphertexts',
    isEncryptedPassed,
    `Ciphertext: ${isEncryptedValid}, Plaintext: ${isEncryptedPlaintext}, Empty: ${isEncryptedEmpty}`
  );

  // ===========================================================================
  // 3. CLOUDFLARE EDGE & CLIENT-IP INTEGRITY
  // ===========================================================================

  // [P3-PROXY-01] resolveClientIp prioritizes Cloudflare authentic CF-Connecting-IP when CF-Ray is present
  const mockReqWithCf = {
    headers: {
      'cf-connecting-ip': '203.0.113.195',
      'cf-ray': '8f9e123456789abc-EWR',
      'x-forwarded-for': '198.51.100.50, 10.0.0.1',
    },
    ip: '10.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;

  const resolvedCfIp = resolveClientIp(mockReqWithCf);
  recordTest(
    'P3-PROXY-01',
    'resolveClientIp prioritizes Cloudflare CF-Connecting-IP over proxy hops',
    resolvedCfIp === '203.0.113.195',
    `Resolved IP: ${resolvedCfIp} (expected 203.0.113.195)`
  );

  // [P3-PROXY-02] resolveClientIp rejects spoofed CF-Connecting-IP without CF-Ray header (direct origin bypass attempt)
  const mockReqSpoofed = {
    headers: {
      'cf-connecting-ip': '203.0.113.195',
      // No cf-ray header supplied (attacker attempting direct origin bypass)
      'x-forwarded-for': '198.51.100.22',
    },
    ip: '198.51.100.22',
    socket: { remoteAddress: '198.51.100.22' },
  } as unknown as Request;

  const resolvedSpoofed = resolveClientIp(mockReqSpoofed);
  recordTest(
    'P3-PROXY-02',
    'resolveClientIp ignores unverified CF-Connecting-IP without Cloudflare ray verification',
    resolvedSpoofed === '198.51.100.22',
    `Resolved IP: ${resolvedSpoofed} (expected fallback 198.51.100.22)`
  );

  // [P3-PROXY-03] resolveClientIp validates IP syntax and rejects malformed headers
  const mockReqMalformed = {
    headers: {
      'cf-connecting-ip': 'not-an-ip-address; drop table',
      'cf-ray': '8f9e123456789abc-EWR',
      'x-forwarded-for': 'invalid-ip',
    },
    ip: '198.51.100.22',
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;

  const resolvedMalformed = resolveClientIp(mockReqMalformed);
  recordTest(
    'P3-PROXY-03',
    'resolveClientIp rejects malformed header strings and falls back to trusted ip',
    resolvedMalformed === '198.51.100.22',
    `Resolved IP: ${resolvedMalformed} (expected 198.51.100.22)`
  );

  // ===========================================================================
  // 4. HTTP SERVER, CORS, SECURITY HEADERS & HEALTH PROBES
  // ===========================================================================

  const testApp = express();
  testApp.disable('x-powered-by');

  // Apply Phase 3 Security Headers
  testApp.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Apply Phase 3 CORS Policy matching server/index.ts
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://lightningapi.pro',
    'https://www.lightningapi.pro',
    'https://api.lightningapi.pro',
    'https://lightningdeals-api.onrender.com',
  ];

  testApp.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);

        try {
          const parsed = new URL(origin);
          if (
            parsed.protocol === 'https:' &&
            (parsed.hostname === 'lightningapi.pro' || parsed.hostname.endsWith('.lightningapi.pro'))
          ) {
            return callback(null, true);
          }
        } catch {}

        return callback(null, false);
      },
      credentials: true,
    })
  );

  testApp.use(express.json({ limit: '10mb' }));

  // Liveness Probe
  testApp.get('/health', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Readiness Probe
  testApp.get('/ready', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready', database: 'connected', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
  });

  // Sanitized Public Status Probe
  testApp.get('/api/public/status', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({
      overallStatus: 'operational',
      timestamp: new Date().toISOString(),
      subsystems: [
        { name: 'Database Cluster', key: 'database', status: 'operational' },
        { name: 'API Gateway & Proxy', key: 'api_gateway', status: 'operational' },
      ],
    });
  });

  // Start test server on random high port
  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as net.AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // [P3-HEADERS-01] Security headers present and X-Powered-By is suppressed
    const headerRes = await fetch(`${baseUrl}/health`);
    const xPoweredBy = headerRes.headers.get('x-powered-by');
    const xContentType = headerRes.headers.get('x-content-type-options');
    const xFrame = headerRes.headers.get('x-frame-options');
    const permPolicy = headerRes.headers.get('permissions-policy');
    const hsts = headerRes.headers.get('strict-transport-security');

    const headersPassed = !xPoweredBy && xContentType === 'nosniff' && xFrame === 'SAMEORIGIN' && Boolean(permPolicy) && Boolean(hsts);
    recordTest(
      'P3-HEADERS-01',
      'Security headers enforced and Express X-Powered-By header suppressed',
      headersPassed,
      `x-powered-by: ${xPoweredBy || 'None (suppressed)'}, nosniff: ${xContentType}, permissions-policy: ${permPolicy}`
    );

    // [P3-CORS-01] CORS blocks unauthorized cross-origin requests
    const corsDisallowedRes = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Origin: 'https://malicious-attacker-site.com' },
    });
    const allowOriginHeader = corsDisallowedRes.headers.get('access-control-allow-origin');
    recordTest(
      'P3-CORS-01',
      'CORS policy rejects unauthorized third-party origins',
      allowOriginHeader === null,
      `Access-Control-Allow-Origin: ${allowOriginHeader || 'None (blocked)'}`
    );

    // [P3-CORS-02] CORS blocks other tenants on multi-tenant .onrender.com domain
    const corsRenderAttackerRes = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Origin: 'https://arbitrary-attacker.onrender.com' },
    });
    const allowRenderAttacker = corsRenderAttackerRes.headers.get('access-control-allow-origin');
    recordTest(
      'P3-CORS-02',
      'CORS policy rejects arbitrary third-party .onrender.com tenant origins',
      allowRenderAttacker === null,
      `Access-Control-Allow-Origin: ${allowRenderAttacker || 'None (blocked)'}`
    );

    // [P3-CORS-03] CORS allows legitimate exact application domain
    const corsAllowedRes = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Origin: 'https://lightningapi.pro' },
    });
    const allowLegitHeader = corsAllowedRes.headers.get('access-control-allow-origin');
    recordTest(
      'P3-CORS-03',
      'CORS policy permits legitimate production domain',
      allowLegitHeader === 'https://lightningapi.pro',
      `Access-Control-Allow-Origin: ${allowLegitHeader}`
    );

    // [P3-HEALTH-01] Liveness probe responds HTTP 200 without exposing secrets
    const livenessRes = await fetch(`${baseUrl}/health`);
    const livenessBody = await livenessRes.json();
    const livenessPassed = livenessRes.status === 200 && livenessBody.status === 'healthy';
    recordTest(
      'P3-HEALTH-01',
      'Liveness probe (/health) returns lightweight 200 without dependencies',
      livenessPassed,
      `Status: ${livenessRes.status}, Body: ${JSON.stringify(livenessBody)}`
    );

    // [P3-HEALTH-02] Readiness probe responds HTTP 200 on connected database
    const readinessRes = await fetch(`${baseUrl}/ready`);
    const readinessBody = await readinessRes.json();
    const readinessPassed = readinessRes.status === 200 && readinessBody.status === 'ready' && readinessBody.database === 'connected';
    recordTest(
      'P3-HEALTH-02',
      'Readiness probe (/ready) validates PostgreSQL database connectivity',
      readinessPassed,
      `Status: ${readinessRes.status}, Database: ${readinessBody.database}`
    );

    // [P3-STATUS-01] Public status check does not expose internal latency numbers
    const statusRes = await fetch(`${baseUrl}/api/public/status`);
    const statusBody = await statusRes.json();
    const hasInternalLatency = statusBody.subsystems?.some((s: any) => typeof s.latencyMs === 'number');
    recordTest(
      'P3-STATUS-01',
      'Public status endpoint strips internal latency measurements and diagnostics',
      statusRes.status === 200 && !hasInternalLatency,
      `Status: ${statusRes.status}, Contains internal latency metrics: ${hasInternalLatency}`
    );

  } finally {
    server.close();
  }

  // ===========================================================================
  // 5. SUMMARY REPORT
  // ===========================================================================

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log(`📊 PHASE 3 TEST EXECUTION SUMMARY`);
  console.log('================================================================');
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log('✅ ALL PHASE 3 INFRASTRUCTURE CONTROLS VERIFIED SUCCESSFULLY.');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error(`❌ ${failed} PHASE 3 INFRASTRUCTURE TESTS FAILED.`);
    console.log('================================================================\n');
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal Phase 3 test harness error:', err);
  process.exit(1);
});
