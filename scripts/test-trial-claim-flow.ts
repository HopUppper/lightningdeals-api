import { prisma } from '../server/db';
import jwt from 'jsonwebtoken';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';

// Configure high-entropy JWT secret for tests
process.env.JWT_SECRET = 'test_secure_trial_synthetic_jwt_secret_key_9876543210!';
import { getJwtSecret } from '../server/jwtConfig';
import userRouter from '../server/user';

async function runTests() {
  console.log('🚀 Starting Free Trial Flow & Pause Verification Tests...');

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/user', userRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server listening on port ${port}`);

  try {
    // Setup test customer user
    const testEmail = `trial_test_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Trial Tester',
        role: 'user',
        status: 'active',
        emailVerified: true,
        passwordHash: 'dummy',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, iat: Math.floor(Date.now() / 1000) },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    // -------------------------------------------------------------
    // TEST 1: Free Trial ENABLED (trials_disabled = false)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Free Trial Enabled State ---');
    await prisma.systemSetting.upsert({
      where: { key: 'trials_disabled' },
      update: { value: 'false' },
      create: { key: 'trials_disabled', value: 'false' },
    });

    // 1A. Unauthenticated status check
    const publicRes = await fetch(`${baseUrl}/api/user/trial/status`);
    const publicData = await publicRes.json();
    console.log('1A. Unauthenticated status:', publicData);
    if (publicData.isPaused !== false || publicData.canClaim !== true || publicData.status !== 'ACTIVE_AVAILABLE') {
      throw new Error(`Public status mismatch when enabled: ${JSON.stringify(publicData)}`);
    }
    console.log('✅ 1A: Public status correctly reports trials are active and available.');

    // 1B. Authenticated status check for new user
    const authRes = await fetch(`${baseUrl}/api/user/trial/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authData = await authRes.json();
    console.log('1B. Authenticated status (new user):', authData);
    if (authData.isPaused !== false || authData.canClaim !== true || authData.isEligible !== true || authData.hasClaimed !== false) {
      throw new Error(`Authenticated status mismatch: ${JSON.stringify(authData)}`);
    }
    console.log('✅ 1B: Authenticated status correctly reports user can claim trial (canClaim: true, isEligible: true).');

    // -------------------------------------------------------------
    // TEST 2: Free Trial PAUSED (trials_disabled = true)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Free Trial Paused State ---');
    await prisma.systemSetting.upsert({
      where: { key: 'trials_disabled' },
      update: { value: 'true' },
      create: { key: 'trials_disabled', value: 'true' },
    });

    // 2A. Unauthenticated status check when paused
    const publicPausedRes = await fetch(`${baseUrl}/api/user/trial/status`);
    const publicPausedData = await publicPausedRes.json();
    console.log('2A. Unauthenticated status (paused):', publicPausedData);
    if (publicPausedData.isPaused !== true || publicPausedData.canClaim !== false || publicPausedData.status !== 'PAUSED') {
      throw new Error(`Public status mismatch when paused: ${JSON.stringify(publicPausedData)}`);
    }
    console.log('✅ 2A: Public status correctly reports trials are PAUSED for all customers.');

    // 2B. Authenticated status check when paused
    const authPausedRes = await fetch(`${baseUrl}/api/user/trial/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authPausedData = await authPausedRes.json();
    console.log('2B. Authenticated status (paused):', authPausedData);
    if (authPausedData.isPaused !== true || authPausedData.canClaim !== false || authPausedData.status !== 'PAUSED') {
      throw new Error(`Authenticated status mismatch when paused: ${JSON.stringify(authPausedData)}`);
    }
    console.log('✅ 2B: Authenticated status correctly reports trials are PAUSED.');

    // 2C. Claim attempt while paused must be rejected with 403 and paused error message
    const claimPausedRes = await fetch(`${baseUrl}/api/user/trial/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const claimPausedData = await claimPausedRes.json();
    console.log('2C. Claim response while paused:', claimPausedData);
    if (claimPausedRes.status !== 403 || !claimPausedData.isPaused || !claimPausedData.error?.message?.includes('paused')) {
      throw new Error(`Claim while paused should be rejected with 403 and paused message: ${JSON.stringify(claimPausedData)}`);
    }
    console.log('✅ 2C: Claim attempt while paused is safely rejected with maintenance notice.');

    // -------------------------------------------------------------
    // TEST 3: Resume Free Trial & Successfully Claim Key
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Resume Trial and Claim Key ---');
    await prisma.systemSetting.upsert({
      where: { key: 'trials_disabled' },
      update: { value: 'false' },
      create: { key: 'trials_disabled', value: 'false' },
    });

    const claimRes = await fetch(`${baseUrl}/api/user/trial/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Forwarded-For': '198.51.100.99', // distinct IP
      },
    });
    const claimData = await claimRes.json();
    console.log('3A. Claim response:', {
      success: claimData.success,
      keyPresent: !!claimData.key,
      rawKeySecretPresent: !!claimData.rawKeySecret,
      trialObject: claimData.trial ? { apiKeyDisplay: claimData.trial.apiKeyDisplay, quotaDisplay: claimData.trial.quotaDisplay } : null,
    });

    if (!claimData.success || !claimData.key || !claimData.trial?.rawKeySecret) {
      throw new Error(`Trial claim failed: ${JSON.stringify(claimData)}`);
    }
    console.log('✅ 3A: Free trial successfully claimed! Key and trial object returned.');

    // 3B. Status check after claiming
    const afterClaimRes = await fetch(`${baseUrl}/api/user/trial/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const afterClaimData = await afterClaimRes.json();
    console.log('3B. Status after claim:', afterClaimData);
    if (afterClaimData.canClaim !== false || afterClaimData.hasClaimed !== true || afterClaimData.status !== 'ACTIVE') {
      throw new Error(`Status after claim mismatch: ${JSON.stringify(afterClaimData)}`);
    }
    console.log('✅ 3B: Status correctly reflects active trial (canClaim: false, hasClaimed: true, status: ACTIVE).');

    // 3C. Second claim attempt should be rejected (prevent duplicate)
    const duplicateClaimRes = await fetch(`${baseUrl}/api/user/trial/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Forwarded-For': '198.51.100.99',
      },
    });
    const duplicateData = await duplicateClaimRes.json();
    if (duplicateClaimRes.status !== 400 || !duplicateData.error?.message?.includes('already claimed')) {
      throw new Error(`Duplicate claim was not blocked: ${JSON.stringify(duplicateData)}`);
    }
    console.log('✅ 3C: Duplicate claim prevented as expected.');

    // Cleanup test records
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.trialClaim.deleteMany({ where: { userId: user.id } });
    await prisma.apiKey.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Verified.');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
