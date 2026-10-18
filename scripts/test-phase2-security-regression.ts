import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma, encryptText } from '../server/db';
import userRouter from '../server/user';
import { customerSubscriptionRouter } from '../server/subscriptions/customerSubscriptionRoutes';
import { studioRouter } from '../server/studio';
import { handlePayUOrderRedirect } from '../server/payments/paymentRoutes';
import { handleMessagesEndpoint, sanitizeErrorMessage, recordApiUsage } from '../server/gateway';
import { recordAuditEvent, verifyHashChainIntegrity } from '../server/auditLogger';
import { getJwtSecret } from '../server/jwtConfig';

/**
 * PHASE 2 COMPREHENSIVE SECURITY REGRESSION TEST SUITE
 * 
 * Verifies all Phase 2 backend security hardening controls:
 * 1. Multi-tenant isolation & IDOR prevention across customer resources (keys, subscriptions, orders, studio).
 * 2. API key masking and data minimization on all customer listing endpoints.
 * 3. Initial key provision flow safety (raw secret returned once, encrypted vault data omitted).
 * 4. Reflected XSS neutralization in PayU order redirect templates.
 * 5. Upstream AI Gateway error sanitization (scrubbing supplier keys, URLs, and internal branding).
 * 6. Gateway parameter and model input validation.
 * 7. Gateway atomic token deduction under concurrent execution.
 * 8. Tamper-evident cryptographic audit log hash-chain verification and mutation detection.
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
  console.log('⚡ LIGHTNINGDEALS PHASE 2 SECURITY REGRESSION TEST RUNNER');
  console.log('================================================================\n');

  // Set test JWT secret
  process.env.JWT_SECRET = 'test_phase2_isolated_synthetic_jwt_secret_key_1234567890!';
  const testJwtSecret = getJwtSecret();

  // Create isolated express test application
  const app = express();
  app.use(express.json());
  app.set('trust proxy', 1);

  // Mount routers
  app.use('/api/user/subscriptions', customerSubscriptionRouter);
  app.use('/api/user/studio', studioRouter);
  app.use('/api/user', userRouter);
  app.use('/api', userRouter);
  app.get('/pay/:orderId', handlePayUOrderRedirect);
  app.post('/v1/messages', handleMessagesEndpoint);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------------------
    // Synthetic Setup: Create Customer A and Customer B
    // -------------------------------------------------------------------------
    const nowEpoch = Math.floor(Date.now() / 1000);

    const userA = await prisma.user.upsert({
      where: { email: 'customer_a_test_phase2@lightningapi.test' },
      update: { status: 'active', emailVerified: true },
      create: {
        email: 'customer_a_test_phase2@lightningapi.test',
        name: 'Customer A (Security Test)',
        passwordHash: 'scrypt:test:hash',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    });

    const userB = await prisma.user.upsert({
      where: { email: 'customer_b_test_phase2@lightningapi.test' },
      update: { status: 'active', emailVerified: true },
      create: {
        email: 'customer_b_test_phase2@lightningapi.test',
        name: 'Customer B (Security Test)',
        passwordHash: 'scrypt:test:hash',
        role: 'user',
        status: 'active',
        emailVerified: true,
      },
    });

    // Clean up any stale records from previous aborted test runs
    await prisma.subscription.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.order.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.studioConversation.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.apiKey.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });

    const tokenA = jwt.sign(
      { id: userA.id, email: userA.email, role: 'user', iat: nowEpoch },
      testJwtSecret,
      { expiresIn: '2h' }
    );

    const tokenB = jwt.sign(
      { id: userB.id, email: userB.email, role: 'user', iat: nowEpoch },
      testJwtSecret,
      { expiresIn: '2h' }
    );

    // Create synthetic API key owned by Customer B with unique hash
    const rawKeySecretB = `test_raw_key_secret_user_b_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const keyB = await prisma.apiKey.create({
      data: {
        userId: userB.id,
        keyPrefix: 'ld_live_user_b',
        keyHash: crypto.createHash('sha256').update(rawKeySecretB).digest('hex'),
        displayKey: 'ld_live_user_b...9999',
        keyEncrypted: encryptText(rawKeySecretB),
        name: "User B's Private Key",
        purchasedTokens: BigInt(5000000),
        tokensRemaining: BigInt(5000000),
        plan: 'Claude Max 20x',
      },
    });

    // Create synthetic Subscription owned by Customer B
    const subB = await prisma.subscription.create({
      data: {
        userId: userB.id,
        planId: 'claude-max-20x',
        planName: 'Claude Max 20x',
        status: 'ACTIVE',
        activationTime: new Date(),
        expiryTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        durationDays: 30,
        quotaLimit: BigInt(20000000),
        currentUsage: BigInt(0),
        quotaWindowHours: 5,
        apiKeyId: keyB.id,
        nextResetTime: new Date(Date.now() + 5 * 3600 * 1000),
      },
    });

    // Create synthetic Order owned by Customer B
    const orderB = await prisma.order.create({
      data: {
        userId: userB.id,
        internalOrderId: `ORD-TEST-B-${Date.now()}`,
        planId: 'claude-max-20x',
        planName: 'Claude Max 20x',
        tokenQuantity: BigInt(20000000),
        amountInr: 4999,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'FULFILLED',
        currency: 'INR',
        subscriptionId: subB.id,
      },
    });

    // Create synthetic Conversation owned by Customer B
    const convB = await prisma.studioConversation.create({
      data: {
        userId: userB.id,
        title: "Customer B Confidential Conversation",
        model: 'claude-3-7-sonnet-20250219',
      },
    });

    // =========================================================================
    // 1. IDOR PROTECTION VERIFICATION
    // =========================================================================

    // [P2-IDOR-01] Customer A lists keys -> should NOT see Customer B's key
    const resKeysA = await fetch(`${baseUrl}/api/user/keys`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const keysAData = await resKeysA.json();
    const customerBKeyInA = (keysAData.keys || []).some((k: any) => k.id === keyB.id);
    recordTest(
      'P2-IDOR-01',
      "Customer A cannot view Customer B's API keys",
      resKeysA.status === 200 && !customerBKeyInA,
      `Status: ${resKeysA.status}, Customer B key visible: ${customerBKeyInA}`
    );

    // [P2-IDOR-02] Customer A attempts to delete Customer B's key
    const resDelKey = await fetch(`${baseUrl}/api/user/keys/${keyB.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'P2-IDOR-02',
      "Customer A cannot delete Customer B's API key",
      resDelKey.status === 404 || resDelKey.status === 403,
      `Status: ${resDelKey.status} (expected 404/403)`
    );

    // [P2-IDOR-03] Customer A attempts to retrieve Customer B's subscription details
    const resSubB = await fetch(`${baseUrl}/api/user/subscriptions/${subB.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'P2-IDOR-03',
      "Customer A cannot view Customer B's subscription details",
      resSubB.status === 404 || resSubB.status === 403,
      `Status: ${resSubB.status} (expected 404/403)`
    );

    // [P2-IDOR-04] Customer A lists orders -> should NOT contain Customer B's order
    const resOrdersA = await fetch(`${baseUrl}/api/user/orders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const ordersAData = await resOrdersA.json();
    const customerBOrderInA = (ordersAData.orders || []).some((o: any) => o.id === orderB.id || o.internalOrderId === orderB.internalOrderId);
    recordTest(
      'P2-IDOR-04',
      "Customer A cannot view Customer B's purchase orders",
      resOrdersA.status === 200 && !customerBOrderInA,
      `Status: ${resOrdersA.status}, Customer B order visible: ${customerBOrderInA}`
    );

    // [P2-IDOR-05] Customer A attempts to access Customer B's studio conversation
    const resConvB = await fetch(`${baseUrl}/api/user/studio/conversations/${convB.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest(
      'P2-IDOR-05',
      "Customer A cannot access Customer B's studio conversation",
      resConvB.status === 404 || resConvB.status === 403,
      `Status: ${resConvB.status} (expected 404/403)`
    );

    // =========================================================================
    // 2. SECRET MASKING & DATA MINIMIZATION VERIFICATION
    // =========================================================================

    // [P2-MASK-01] GET /api/user/keys masks raw keys
    const resKeysB = await fetch(`${baseUrl}/api/user/keys`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const keysBData = await resKeysB.json();
    const inspectedKeyB = (keysBData.keys || []).find((k: any) => k.id === keyB.id);
    const hasSecretKeyInList = inspectedKeyB && 'secretKey' in inspectedKeyB;
    const hasEncryptedInList = inspectedKeyB && 'keyEncrypted' in inspectedKeyB;
    const hasValidDisplayKey = inspectedKeyB && typeof inspectedKeyB.displayKey === 'string' && inspectedKeyB.displayKey.includes('...');
    recordTest(
      'P2-MASK-01',
      "GET /api/user/keys masks API keys (displayKey only, secretKey omitted)",
      !hasSecretKeyInList && !hasEncryptedInList && hasValidDisplayKey,
      `secretKey present: ${hasSecretKeyInList}, keyEncrypted present: ${hasEncryptedInList}, displayKey: ${inspectedKeyB?.displayKey}`
    );

    // [P2-MASK-02] GET /api/user/subscriptions does not leak apiKeySecret
    const resSubsB = await fetch(`${baseUrl}/api/user/subscriptions`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const subsBData = await resSubsB.json();
    const hasApiKeySecretInSub = subsBData.activeSubscription && 'apiKeySecret' in subsBData.activeSubscription;
    recordTest(
      'P2-MASK-02',
      "GET /api/user/subscriptions does not leak apiKeySecret",
      !hasApiKeySecretInSub,
      `apiKeySecret present: ${hasApiKeySecretInSub}`
    );

    // [P2-MASK-03] GET /api/user/orders does not leak secretKey
    const resOrdersB = await fetch(`${baseUrl}/api/user/orders`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const ordersBData = await resOrdersB.json();
    const inspectedOrderB = (ordersBData.orders || []).find((o: any) => o.id === orderB.id);
    const hasSecretKeyInOrder = inspectedOrderB && 'secretKey' in inspectedOrderB;
    recordTest(
      'P2-MASK-03',
      "GET /api/user/orders does not leak secretKey",
      !hasSecretKeyInOrder,
      `secretKey present in order: ${hasSecretKeyInOrder}`
    );

    // [P2-KEY-01] POST /api/user/keys exposes raw key secret ONCE and omits keyEncrypted
    const resCreateKey = await fetch(`${baseUrl}/api/user/keys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'New Test Key Customer A' }),
    });
    const createKeyData = await resCreateKey.json();
    const createdKey = createKeyData.key;
    const hasSecretOnCreation = createdKey && typeof createdKey.secretKey === 'string' && (createdKey.secretKey.startsWith('ld_live_') || createdKey.secretKey.startsWith('sk_live_'));
    const hasEncryptedOnCreation = createdKey && 'keyEncrypted' in createdKey;
    recordTest(
      'P2-KEY-01',
      "POST /api/user/keys returns secretKey once and omits keyEncrypted",
      resCreateKey.status === 201 && hasSecretOnCreation && !hasEncryptedOnCreation,
      `Status: ${resCreateKey.status}, secretKey returned: ${hasSecretOnCreation}, keyEncrypted omitted: ${!hasEncryptedOnCreation}`
    );

    // =========================================================================
    // 3. REFLECTED XSS NEUTRALIZATION VERIFICATION
    // =========================================================================

    // [P2-XSS-01] PayU redirect parameter sanitization
    const xssPayload = '<script>alert(1)</script>';
    const resXss = await fetch(`${baseUrl}/pay/${encodeURIComponent(xssPayload)}`);
    const xssHtml = await resXss.text();
    const rawScriptPresent = xssHtml.includes('<script>alert(1)</script>');
    const escapedScriptPresent = xssHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;');
    recordTest(
      'P2-XSS-01',
      "Reflected XSS in /pay/:orderId is neutralized via HTML entity encoding",
      !rawScriptPresent && escapedScriptPresent,
      `Raw script present: ${rawScriptPresent}, Escaped script present: ${escapedScriptPresent}`
    );

    // =========================================================================
    // 4. AI GATEWAY ERROR SANITIZATION & INPUT VALIDATION
    // =========================================================================

    // [P2-GATEWAY-01] sanitizeErrorMessage scrubs supplier credentials and hostnames
    const leakedErrorMessage = 'Error connecting to vendor: sk-ant-api03-abcdef1234567890 at https://api.scalemax.pro/v1. Internal ScaleMax error.';
    const scrubbedMessage = sanitizeErrorMessage(leakedErrorMessage);
    const containsRawSecret = scrubbedMessage.includes('abcdef1234567890');
    const containsSupplierUrl = scrubbedMessage.includes('scalemax.pro');
    const containsSupplierBranding = scrubbedMessage.includes('ScaleMax');
    recordTest(
      'P2-GATEWAY-01',
      "Upstream error sanitization scrubs master keys, URLs, and supplier branding",
      !containsRawSecret && !containsSupplierUrl && !containsSupplierBranding,
      `Scrubbed output: "${scrubbedMessage}"`
    );

    // [P2-GATEWAY-02] Input validation on model and max_tokens
    const validTestKey = createdKey.secretKey;
    const resInvalidModel = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': validTestKey,
      },
      body: JSON.stringify({
        model: 'malicious-unsupported-model-v999',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });
    const resInvalidTokens = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': validTestKey,
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet',
        max_tokens: -50,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });
    recordTest(
      'P2-GATEWAY-02',
      "Gateway rejects unsupported model names and invalid max_tokens parameters",
      resInvalidModel.status === 404 && resInvalidTokens.status === 400,
      `Invalid model status: ${resInvalidModel.status} (404), Invalid max_tokens status: ${resInvalidTokens.status} (400)`
    );

    // =========================================================================
    // 5. ATOMIC TOKEN DEDUCTION & CONCURRENCY VERIFICATION
    // =========================================================================

    // [P2-CONCURRENCY-01] Concurrent executions of recordApiUsage do not suffer lost updates
    const initialBalance = BigInt(1000000);
    const concurrentKey = await prisma.apiKey.create({
      data: {
        userId: userA.id,
        keyPrefix: 'ld_live_concurrent',
        keyHash: crypto.createHash('sha256').update(`test_concurrent_key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`).digest('hex'),
        displayKey: 'ld_live_concurrent...1111',
        name: 'Concurrent Test Key',
        purchasedTokens: initialBalance,
        tokensRemaining: initialBalance,
        tokensUsed: BigInt(0),
        plan: 'Claude Max 20x',
      },
    });

    const deductions = [1000, 2000, 3000, 4000, 5000];
    const totalExpectedUsed = deductions.reduce((a, b) => a + b, 0);

    await Promise.all(
      deductions.map((tokens) =>
        recordApiUsage({
          keyRecord: concurrentKey,
          model: 'claude-3-7-sonnet-20250219',
          inputTokens: tokens / 2,
          outputTokens: tokens / 2,
          totalTokens: tokens,
          latencyMs: 150,
          streaming: false,
          usageSource: 'CONCURRENCY_TEST',
        })
      )
    );

    const refreshedConcurrentKey = await prisma.apiKey.findUnique({
      where: { id: concurrentKey.id },
    });

    const actualUsed = Number(refreshedConcurrentKey?.tokensUsed || 0);
    const actualRemaining = Number(refreshedConcurrentKey?.tokensRemaining || 0);
    const expectedRemaining = Number(initialBalance) - totalExpectedUsed;

    const atomicDeductionPassed = actualUsed === totalExpectedUsed && actualRemaining === expectedRemaining;
    recordTest(
      'P2-CONCURRENCY-01',
      "Atomic token deduction prevents lost updates during concurrent requests",
      atomicDeductionPassed,
      `Expected used: ${totalExpectedUsed}, Actual used: ${actualUsed}, Expected remaining: ${expectedRemaining}, Actual remaining: ${actualRemaining}`
    );

    // =========================================================================
    // 6. CRYPTOGRAPHIC AUDIT LOG HASH-CHAIN VERIFICATION
    // =========================================================================

    // [P2-AUDIT-01] Rapid concurrent audit events produce an unbroken, valid hash chain
    // Dispatch 5 rapid audit events with unique run nonce
    const auditRunNonce = `RUN_${Date.now()}`;
    await Promise.all([
      recordAuditEvent({ eventType: `TEST_CHAIN_EVENT_1_${auditRunNonce}`, actorType: 'CUSTOMER', actorId: userA.id }),
      recordAuditEvent({ eventType: `TEST_CHAIN_EVENT_2_${auditRunNonce}`, actorType: 'CUSTOMER', actorId: userA.id }),
      recordAuditEvent({ eventType: `TEST_CHAIN_EVENT_3_${auditRunNonce}`, actorType: 'CUSTOMER', actorId: userA.id }),
      recordAuditEvent({ eventType: `TEST_CHAIN_EVENT_4_${auditRunNonce}`, actorType: 'CUSTOMER', actorId: userA.id }),
      recordAuditEvent({ eventType: `TEST_CHAIN_EVENT_5_${auditRunNonce}`, actorType: 'CUSTOMER', actorId: userA.id }),
    ]);

    const postLogIntegrity = await verifyHashChainIntegrity(20);
    recordTest(
      'P2-AUDIT-01',
      "Audit logging maintains unbroken SHA-256 hash chain under rapid concurrent calls",
      postLogIntegrity.isTamperFree && postLogIntegrity.checkedCount >= 5,
      `Tamper-free: ${postLogIntegrity.isTamperFree}, Total verified events: ${postLogIntegrity.checkedCount}`
    );

    // [P2-AUDIT-02] Direct database tamper detection
    // Mutate an event to verify tamper detection catches unauthorized changes
    const testTamperEvent = await prisma.auditEvent.findFirst({
      where: { eventType: `TEST_CHAIN_EVENT_3_${auditRunNonce}` },
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
    });

    if (testTamperEvent) {
      await prisma.auditEvent.update({
        where: { id: testTamperEvent.id },
        data: { result: 'BLOCKED' }, // Tamper with event result without recomputing hash
      });

      const tamperResult = await verifyHashChainIntegrity(20);
      const tamperDetected = !tamperResult.isTamperFree;

      // Restore original state
      await prisma.auditEvent.update({
        where: { id: testTamperEvent.id },
        data: { result: 'SUCCESS' },
      });

      recordTest(
        'P2-AUDIT-02',
        "Audit log integrity checker detects unauthorized database field modification",
        tamperDetected,
        `Tamper detected: ${tamperDetected}, Broken at event: ${tamperResult.brokenAtEventId}`
      );
    } else {
      recordTest('P2-AUDIT-02', "Audit log tamper detection", false, "Test event not found");
    }

    // Clean up test data
    await prisma.apiKey.deleteMany({ where: { id: { in: [keyB.id, concurrentKey.id, createdKey?.id].filter(Boolean) } } });
    await prisma.studioConversation.deleteMany({ where: { id: convB.id } });
    await prisma.subscription.deleteMany({ where: { id: subB.id } });
    await prisma.order.deleteMany({ where: { id: orderB.id } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });

  } finally {
    server.close();
  }

  // ---------------------------------------------------------------------------
  // Summary Reporting
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log('✅ ALL PHASE 2 SECURITY CONTROLS VERIFIED SUCCESSFULLY.');
    process.exit(0);
  } else {
    console.error(`❌ ${failed} PHASE 2 SECURITY TESTS FAILED.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
