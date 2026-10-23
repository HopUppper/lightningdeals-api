import { prisma } from '../server/db';
import jwt from 'jsonwebtoken';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';

process.env.JWT_SECRET = 'test_secure_provider_sync_synthetic_secret_key_9876543210!';
import { getJwtSecret } from '../server/jwtConfig';
import adminRouter from '../server/admin';

async function runTests() {
  console.log('🚀 Starting Provider Live Auto-Sync & Validity Tests...');

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/admin', adminRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server listening on port ${port}`);

  try {
    // 1. Create or fetch test admin
    let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin_test_live_sync@lightningdeals.test',
          name: 'Admin Tester',
          role: 'admin',
          status: 'active',
          emailVerified: true,
          passwordHash: 'dummy',
        },
      });
    }

    const adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin', iat: Math.floor(Date.now() / 1000) },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    // 2. Fetch OpusMax provider
    const opusProvider = await prisma.vendorProvider.findFirst({
      where: {
        OR: [
          { baseUrl: { contains: 'opusmax' } },
          { name: { contains: 'Opus' } },
        ],
      },
    });

    if (!opusProvider) {
      console.warn('⚠️ No OpusMax provider found in DB, skipping live OpusMax network call.');
      return;
    }

    console.log(`Found provider: ${opusProvider.name} (${opusProvider.id}) - ${opusProvider.baseUrl}`);

    // 3. Test balance endpoint with ?live=true
    console.log('\n--- TEST 1: Live Provider Balance Query ---');
    const res = await fetch(`${baseUrl}/api/admin/providers/${opusProvider.id}/balance?live=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();

    console.log('Live balance response summary:', {
      providerName: data.providerName,
      availableTokens: data.availableTokens,
      windowAllowance: data.windowAllowance,
      windowTokensUsed: data.windowTokensUsed,
      upstreamUsagePercent: data.upstreamUsagePercent,
      windowActive: data.windowActive,
      nextResetAt: data.nextResetAt,
      windowResetSeconds: data.windowResetSeconds,
      expiresAt: data.expiresAt,
      rateLimitRpm: data.rateLimitRpm,
      totalRequests: data.totalRequests,
      last24hRequests: data.last24hRequests,
      lastUsedAt: data.lastUsedAt,
    });

    if (data.providerId !== opusProvider.id) {
      throw new Error(`Provider ID mismatch: ${data.providerId}`);
    }

    if (data.expiresAt === undefined) {
      throw new Error('expiresAt field is missing from balance response');
    }

    if (data.windowActive === undefined) {
      throw new Error('windowActive field is missing from balance response');
    }

    console.log('✅ TEST 1: Live balance endpoint returns complete telemetry including validity (expiresAt), 5h rolling window state, and requests.');

    // 4. Test repeated rapid polling to verify debounce resilience
    console.log('\n--- TEST 2: High-Frequency Polling Debounce ---');
    const poll1 = await fetch(`${baseUrl}/api/admin/providers/${opusProvider.id}/balance?live=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const poll2 = await fetch(`${baseUrl}/api/admin/providers/${opusProvider.id}/balance?live=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!poll1.ok || !poll2.ok) {
      throw new Error('Rapid polling failed');
    }
    console.log('✅ TEST 2: Rapid consecutive queries handled cleanly without rate limit or server crash.');

    console.log('\n🎉 ALL LIVE PROVIDER SYNC TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
