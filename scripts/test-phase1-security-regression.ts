import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../server/db';
import adminAuthRouter from '../server/adminAuth';
import adminRouter from '../server/admin';
import userRouter from '../server/user';
import { getJwtSecret } from '../server/jwtConfig';
import { hashPasswordScrypt } from '../server/auth';
import { hashSecret } from '../server/authSecurity';

/**
 * PHASE 1 CRITICAL SECURITY REGRESSION SUITE
 * 
 * Verifies that:
 * 1. Old seeded credentials (sidhjain9002@gmail.com / love9002) no longer authenticate.
 * 2. Backdoor in user login (auto-creating admin for sidhjain9002) is removed.
 * 3. Tokens signed with reported fallback secrets are rejected (401).
 * 4. Forged role/email claims without DB backing fail authorization (401/403).
 * 5. Expired, malformed, and revoked tokens are rejected.
 * 6. Unknown admin email login returns 401 (not 500!) and matches invalid password response.
 * 7. Rate limiter cannot be bypassed by spoofing X-Forwarded-For.
 * 8. Legitimate authentication works for securely provisioned accounts.
 * 9. Password changes and session revocations immediately invalidate existing tokens.
 * 10. User registration succeeds without ReferralEngine reference crash.
 */

interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function recordTest(id: string, name: string, passed: boolean, details: string) {
  const status = passed ? 'PASS' : 'FAIL';
  results.push({ id, name, status, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${id}] ${name}: ${details}`);
}

async function main() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGDEALS PHASE 1 SECURITY REGRESSION TEST RUNNER');
  console.log('================================================================\n');

  // Explicitly set isolated synthetic test JWT secret for test suite
  process.env.JWT_SECRET = 'test_phase1_isolated_synthetic_jwt_secret_key_1234567890!';
  const testJwtSecret = getJwtSecret();

  // Create isolated express test application
  const app = express();
  app.use(express.json());
  app.set('trust proxy', 1);

  app.use('/api/admin/auth', adminAuthRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/user', userRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testSuffix = Date.now();
  const testAdminEmail = `phase1_admin_${testSuffix}@lightningapi.test`;
  const testAdminPassword = 'Phase1#SecurePassword2026!';
  const testCustomerEmail = `phase1_customer_${testSuffix}@lightningapi.test`;
  const testCustomerPassword = 'Phase1#CustPass2026!';

  let testAdminUser: any = null;
  let testCustomerUser: any = null;

  try {
    // -------------------------------------------------------------------------
    // Setup synthetic test accounts
    // -------------------------------------------------------------------------
    testAdminUser = await prisma.user.create({
      data: {
        name: 'Phase 1 Synthetic Admin',
        email: testAdminEmail,
        passwordHash: hashPasswordScrypt(testAdminPassword),
        role: 'admin',
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordChangedAt: new Date(),
      },
    });

    testCustomerUser = await prisma.user.create({
      data: {
        name: 'Phase 1 Synthetic Customer',
        email: testCustomerEmail,
        passwordHash: hashPasswordScrypt(testCustomerPassword),
        role: 'user',
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordChangedAt: new Date(),
      },
    });

    // -------------------------------------------------------------------------
    // TEST 1: Old seeded credentials (F1)
    // -------------------------------------------------------------------------
    await prisma.user.updateMany({
      where: { email: { in: ['sidhjain9002@gmail.com', 'sidhjain9802@gmail.com'] } },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const resSeedAdmin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'sidhjain9002@gmail.com', password: 'love9002' }),
    });
    recordTest(
      'F1-01',
      'Old seeded credentials rejected on admin login',
      resSeedAdmin.status === 401,
      `Status: ${resSeedAdmin.status} (expected 401 Unauthorized)`
    );

    // Also check secondary seed account
    const resSeedAdmin2 = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'sidhjain9802@gmail.com', password: 'love9002' }),
    });
    recordTest(
      'F1-02',
      'Secondary seeded credentials rejected on admin login',
      resSeedAdmin2.status === 401,
      `Status: ${resSeedAdmin2.status} (expected 401 Unauthorized)`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Backdoor in user login removed (F1)
    // -------------------------------------------------------------------------
    const resUserBackdoor = await fetch(`${baseUrl}/api/user/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'sidhjain9002@gmail.com', password: 'love9002' }),
    });
    recordTest(
      'F1-03',
      'Backdoor admin auto-creation on user login removed',
      resUserBackdoor.status === 401,
      `Status: ${resUserBackdoor.status} (expected 401 Unauthorized)`
    );

    // -------------------------------------------------------------------------
    // TEST 3: JWT Fallback Secret 1 (F2 - lightningdeals_secret_jwt_key_2026)
    // -------------------------------------------------------------------------
    const forgedToken1 = jwt.sign(
      { id: testAdminUser.id, email: testAdminUser.email, role: 'admin' },
      'lightningdeals_secret_jwt_key_2026',
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const resFallback1 = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${forgedToken1}` },
    });
    recordTest(
      'F2-01',
      'Token signed with lightningdeals_secret_jwt_key_2026 rejected',
      resFallback1.status === 401,
      `Status: ${resFallback1.status} (expected 401 Invalid Token)`
    );

    // -------------------------------------------------------------------------
    // TEST 4: JWT Fallback Secret 2 (F2 - apexscale-jwt-secret-key-production-2026)
    // -------------------------------------------------------------------------
    const forgedToken2 = jwt.sign(
      { id: testAdminUser.id, email: testAdminUser.email, role: 'admin' },
      'apexscale-jwt-secret-key-production-2026',
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const resFallback2 = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${forgedToken2}` },
    });
    recordTest(
      'F2-02',
      'Token signed with apexscale-jwt-secret-key-production-2026 rejected',
      resFallback2.status === 401,
      `Status: ${resFallback2.status} (expected 401 Invalid Token)`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Forged ID / Non-existent UUID with valid secret
    // -------------------------------------------------------------------------
    const forgedTokenFakeId = jwt.sign(
      { id: '00000000-0000-0000-0000-000000000000', email: testAdminUser.email, role: 'admin' },
      testJwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const resFakeId = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${forgedTokenFakeId}` },
    });
    recordTest(
      'F2-03',
      'Forged token with non-existent id rejected (no email fallback)',
      resFakeId.status === 401 || resFakeId.status === 403,
      `Status: ${resFakeId.status} (expected 401/403)`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Privilege Escalation Prevention (Customer Token -> Admin Route)
    // -------------------------------------------------------------------------
    const customerToken = jwt.sign(
      { id: testCustomerUser.id, email: testCustomerUser.email, role: 'user' },
      testJwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const resCustOnAdmin = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    recordTest(
      'F2-04',
      'Customer token rejected on admin control endpoints',
      resCustOnAdmin.status === 403,
      `Status: ${resCustOnAdmin.status} (expected 403 Forbidden)`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Expired Token Rejection
    // -------------------------------------------------------------------------
    const expiredToken = jwt.sign(
      { id: testAdminUser.id, email: testAdminUser.email, role: 'admin' },
      testJwtSecret,
      { algorithm: 'HS256', expiresIn: -10 }
    );
    const resExpired = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    recordTest(
      'F2-05',
      'Expired token rejected',
      resExpired.status === 401,
      `Status: ${resExpired.status} (expected 401)`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Malformed Token Rejection
    // -------------------------------------------------------------------------
    const resMalformed = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' },
    });
    recordTest(
      'F2-06',
      'Malformed token string rejected',
      resMalformed.status === 401,
      `Status: ${resMalformed.status} (expected 401)`
    );

    // -------------------------------------------------------------------------
    // TEST 8B: Token Missing iat Claim Rejected (F2-07)
    // -------------------------------------------------------------------------
    const forgedTokenNoIat = jwt.sign(
      { id: testAdminUser.id, email: testAdminUser.email, role: 'admin' },
      testJwtSecret,
      { algorithm: 'HS256', noTimestamp: true }
    );
    const resNoIat = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${forgedTokenNoIat}` },
    });
    recordTest(
      'F2-07',
      'Token with missing or non-numeric iat claim rejected',
      resNoIat.status === 401,
      `Status: ${resNoIat.status} (expected 401)`
    );

    // -------------------------------------------------------------------------
    // TEST 8C: Token Issued Prior to SECURITY_EPOCH Rejected (F2-08)
    // -------------------------------------------------------------------------
    process.env.SECURITY_EPOCH = new Date(Date.now() + 60000).toISOString();
    const tokenPreEpoch = jwt.sign(
      { id: testAdminUser.id, email: testAdminUser.email, role: 'admin' },
      testJwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    const resPreEpoch = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${tokenPreEpoch}` },
    });
    recordTest(
      'F2-08',
      'Token issued prior to SECURITY_EPOCH rejected',
      resPreEpoch.status === 401,
      `Status: ${resPreEpoch.status} (expected 401)`
    );
    delete process.env.SECURITY_EPOCH;

    // -------------------------------------------------------------------------
    // TEST 9: Unknown Admin Email Login (F3 - SYSTEM_UNAUTH FK bug)
    // -------------------------------------------------------------------------
    const resUnknownAdmin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'totally_nonexistent_admin_12345@example.com', password: 'randomPassword!' }),
    });
    const unknownBody = await resUnknownAdmin.json();
    recordTest(
      'F3-01',
      'Unknown admin email returns 401 (not 500 crash)',
      resUnknownAdmin.status === 401 && unknownBody?.error?.type === 'authentication_failed',
      `Status: ${resUnknownAdmin.status}, Error Type: ${unknownBody?.error?.type}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Known Admin Email with Wrong Password
    // -------------------------------------------------------------------------
    const resWrongPass = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'WrongPassword999!' }),
    });
    const wrongPassBody = await resWrongPass.json();
    recordTest(
      'F3-02',
      'Wrong password returns identical 401 authentication_failed response',
      resWrongPass.status === 401 && wrongPassBody?.error?.type === 'authentication_failed',
      `Status: ${resWrongPass.status}, Error Type: ${wrongPassBody?.error?.type}`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Rate Limiter Spoofed X-Forwarded-For Bypass Prevention (F4)
    // -------------------------------------------------------------------------
    const rateLimitTargetEmail = `ratelimit_target_${testSuffix}@lightningapi.test`;
    let gotThrottled = false;
    // Attempt 8 rapid failed logins targeting the same test account with rotating spoofed X-Forwarded-For
    for (let i = 0; i < 8; i++) {
      const spoofedIp = `198.51.100.${i + 1}`;
      const resRate = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': spoofedIp,
        },
        body: JSON.stringify({ email: rateLimitTargetEmail, password: 'WrongPassword999!' }),
      });
      if (resRate.status === 429) {
        gotThrottled = true;
        break;
      }
    }
    recordTest(
      'F4-01',
      'Rate limiter throttles brute force despite rotating X-Forwarded-For headers',
      gotThrottled,
      `Throttled with 429: ${gotThrottled}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Legitimate Admin Login & Session Creation
    // -------------------------------------------------------------------------
    const resValidLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: testAdminPassword }),
    });
    const loginData = await resValidLogin.json();
    const validAdminToken = loginData?.token;
    recordTest(
      'AUTH-01',
      'Legitimate admin login succeeds with 200 and issues token',
      resValidLogin.status === 200 && Boolean(validAdminToken),
      `Status: ${resValidLogin.status}, Token issued: ${Boolean(validAdminToken)}`
    );

    // -------------------------------------------------------------------------
    // TEST 13: Admin Session Revocation via DB
    // -------------------------------------------------------------------------
    const tokenHash = hashSecret(validAdminToken);
    const sessionRecord = await prisma.userSession.findFirst({
      where: { userId: testAdminUser.id, sessionTokenHash: tokenHash },
    });
    const sessionCreated = Boolean(sessionRecord);

    if (sessionRecord) {
      await prisma.userSession.update({
        where: { id: sessionRecord.id },
        data: { isRevoked: true },
      });
    }

    const resAfterRevoke = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${validAdminToken}` },
    });
    recordTest(
      'AUTH-02',
      'Server-side admin session revocation invalidates token immediately',
      sessionCreated && resAfterRevoke.status === 401,
      `Session created: ${sessionCreated}, Status after revocation: ${resAfterRevoke.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 14: Token Invalidation upon Password Change
    // -------------------------------------------------------------------------
    const freshLoginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: testAdminPassword }),
    });
    const freshToken = (await freshLoginRes.json())?.token;

    // Simulate password change
    await prisma.user.update({
      where: { id: testAdminUser.id },
      data: { passwordChangedAt: new Date(Date.now() + 2000) },
    });

    const resAfterPassChange = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    recordTest(
      'AUTH-03',
      'Tokens issued before password change are rejected (session_invalidated)',
      resAfterPassChange.status === 401,
      `Status after password change: ${resAfterPassChange.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 15: Registration Flow (F5 - ReferralEngine is defined)
    // -------------------------------------------------------------------------
    const regEmail = `phase1_reg_${testSuffix}@lightningapi.test`;
    const resReg = await fetch(`${baseUrl}/api/user/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Register Test User',
        email: regEmail,
        password: 'RegisterPass2026!#Strong',
      }),
    });
    const regBody = await resReg.json();
    // In test environment without real SMTP, registration returns 201, 200, or 502 (email_send_failed),
    // but MUST NEVER return 500 "ReferralEngine is not defined"!
    const notReferralError = regBody?.error?.type !== 'internal_error' && !JSON.stringify(regBody).includes('ReferralEngine is not defined');
    recordTest(
      'F5-01',
      'User registration does not crash on ReferralEngine reference',
      notReferralError,
      `Status: ${resReg.status}, Response: ${JSON.stringify(regBody).substring(0, 100)}`
    );

  } catch (err: any) {
    console.error('❌ Test execution error:', err);
  } finally {
    // Cleanup synthetic test records
    if (testAdminUser) {
      await prisma.userSession.deleteMany({ where: { userId: testAdminUser.id } });
      await prisma.adminLog.deleteMany({ where: { adminUserId: testAdminUser.id } });
      await prisma.user.delete({ where: { id: testAdminUser.id } }).catch(() => {});
    }
    if (testCustomerUser) {
      await prisma.userSession.deleteMany({ where: { userId: testCustomerUser.id } });
      await prisma.user.delete({ where: { id: testCustomerUser.id } }).catch(() => {});
    }

    server.close();
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n================================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`❌ REGRESSION DETECTED: ${failedCount} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('✅ ALL PHASE 1 SECURITY CONTROLS VERIFIED SUCCESSFULLY.');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
