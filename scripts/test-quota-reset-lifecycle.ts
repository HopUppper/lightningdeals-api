/**
 * ⚡ LIGHTNINGAPI — AUTOMATED REGRESSION SUITE: 5-HOUR QUOTA RESET LIFECYCLE
 *
 * Verifies Phase 9 Tests 1 through 8:
 * - Test 1: Normal usage (2M limit, 443K tokens -> 1.557M available, 22.15% used)
 * - Test 2: Five-hour boundary transition (clock advances to cycle end -> 0 current usage, 2M available, 0% used, next reset in 5h)
 * - Test 3: The exact customer scenario (previous cycle 443K, cycle expired 47s ago, countdown ~04:59:13 -> 0 used, 2M available, 0% used)
 * - Test 4: Delayed reset execution (scheduler executes 30m after boundary -> correct cycle established, no lost quota)
 * - Test 5: Concurrent requests (simultaneous requests at cycle boundary -> 1 transition, consistent state)
 * - Test 6: Historical usage preservation (previous cycle 443K preserved in ApiRequest, excluded from current cycle)
 * - Test 7: Dashboard/API consistency (resolveCustomerEntitlements, calculateCustomerRollingWindow, calculateKeyQuota agree)
 * - Test 8: Other billing architectures (credit wallets and token packs never receive 5h resets)
 *
 * Strict Rule 4: Sandbox isolation with test-...@test.internal, 100% clean teardown in finally block.
 */

import { prisma } from '../server/db';
import {
  computeCycleBoundaries,
  reconcileSubscriptionCycle,
  calculateKeyQuota,
  determineBillingClassification,
} from '../server/subscriptions/quotaReconciliationService';
import { resolveCustomerEntitlements } from '../server/subscriptions/subscriptionEngine';
import { calculateCustomerRollingWindow } from '../server/accounting/customerAccounting';

interface SandboxState {
  userIds: string[];
  keyIds: string[];
  subIds: string[];
  requestIds: string[];
}

const sandbox: SandboxState = {
  userIds: [],
  keyIds: [],
  subIds: [],
  requestIds: [],
};

async function cleanup() {
  console.log('\n🧹 [CLEANUP] Cleaning up test sandbox artifacts...');
  try {
    if (sandbox.requestIds.length > 0) {
      await prisma.apiRequest.deleteMany({ where: { id: { in: sandbox.requestIds } } });
    }
    if (sandbox.subIds.length > 0) {
      await prisma.subscription.deleteMany({ where: { id: { in: sandbox.subIds } } });
    }
    if (sandbox.keyIds.length > 0) {
      await prisma.apiKey.deleteMany({ where: { id: { in: sandbox.keyIds } } });
    }
    if (sandbox.userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: sandbox.userIds } } });
    }
    console.log('✅ [CLEANUP] All test sandbox artifacts cleanly destroyed. Zero customer impact.');
  } catch (err: any) {
    console.error('⚠️ [CLEANUP ERROR]:', err.message);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('======================================================================');
  console.log('🚀 RUNNING 5-HOUR QUOTA RESET LIFECYCLE REGRESSION SUITE');
  console.log('======================================================================\n');

  try {
    // Setup isolated test customer
    const testUser = await prisma.user.create({
      data: {
        email: `test-quota-${Date.now()}@test.internal`,
        passwordHash: 'test-hash',
        name: 'Test Customer Quota Lifecycle',
        role: 'user',
        emailVerified: true,
      },
    });
    sandbox.userIds.push(testUser.id);

    // Setup linked API Key (2M tokens for Claude Max 2x)
    const allowance2M = 2000000n;
    const testKey = await prisma.apiKey.create({
      data: {
        userId: testUser.id,
        keyPrefix: 'ld_live_',
        keyHash: `test_hash_${Date.now()}_${Math.random()}`,
        displayKey: 'ld_live_test...1234',
        name: 'Claude Max 2x Test Key',
        plan: 'Claude Max 2x',
        billingType: 'window',
        purchasedTokens: allowance2M,
        tokensUsed: 0n,
        tokensRemaining: allowance2M,
        status: 'active',
      },
    });
    sandbox.keyIds.push(testKey.id);

    // Anchor time: T0 = 5 hours ago
    const now = new Date();
    const t0 = new Date(now.getTime() - 5 * 3600 * 1000); // 5 hours ago
    const initialNextReset = new Date(t0.getTime() + 5 * 3600 * 1000); // exactly now

    const testSub = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        planId: 'claude_max_2x',
        planName: 'Claude Max 2x',
        apiKeyId: testKey.id,
        activationTime: t0,
        expiryTime: new Date(t0.getTime() + 30 * 24 * 3600 * 1000),
        quotaLimit: allowance2M,
        quotaWindowHours: 5,
        currentUsage: 0n,
        nextResetTime: initialNextReset,
        status: 'ACTIVE',
      },
    });
    sandbox.subIds.push(testSub.id);

    console.log(`[SETUP] Test user, key, and subscription created (sub=${testSub.id.slice(0, 8)}...)`);

    // -------------------------------------------------------------------------
    // TEST 1 — Normal usage in first cycle
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Normal Usage Within Cycle ---');
    // Record 443,000 tokens of usage inside Cycle 0 (e.g. at T0 + 2 hours)
    const cycle0Time = new Date(t0.getTime() + 2 * 3600 * 1000);
    const req1 = await prisma.apiRequest.create({
      data: {
        apiKeyId: testKey.id,
        userId: testUser.id,
        model: 'claude-sonnet-5.5',
        endpoint: '/v1/messages',
        statusCode: 200,
        totalTokens: 443000,
        inputTokens: 300000,
        outputTokens: 143000,
        createdAt: cycle0Time,
      },
    });
    sandbox.requestIds.push(req1.id);

    // Evaluate quota at T0 + 2.5 hours (inside cycle 0)
    const test1Ref = new Date(t0.getTime() + 2.5 * 3600 * 1000);
    const test1Metrics = await reconcileSubscriptionCycle(testSub.id, test1Ref);
    if (!test1Metrics) throw new Error('reconcileSubscriptionCycle returned null');

    assert(test1Metrics.currentCycleUsage === '443000', 'Current cycle usage is 443,000 tokens');
    assert(test1Metrics.availableQuota === '1557000', 'Available quota is 1,557,000 tokens (2M - 443K)');
    assert(Math.abs(test1Metrics.usagePercentage - 22.15) < 0.1, `Usage percentage is ~22.15% (actual: ${test1Metrics.usagePercentage}%)`);

    // -------------------------------------------------------------------------
    // TEST 2 — Five-hour boundary transition
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Five-Hour Boundary Transition ---');
    // Advance test clock to exact end of current cycle (T0 + 5h)
    const boundaryTime = new Date(t0.getTime() + 5 * 3600 * 1000 + 1000); // 1 second into new cycle
    const test2Metrics = await reconcileSubscriptionCycle(testSub.id, boundaryTime);
    if (!test2Metrics) throw new Error('reconcileSubscriptionCycle returned null');

    assert(test2Metrics.currentCycleUsage === '0', 'New cycle currentCycleUsage resets to 0');
    assert(test2Metrics.availableQuota === '2000000', 'New cycle availableQuota restores full 2,000,000');
    assert(test2Metrics.usagePercentage === 0, 'New cycle usagePercentage resets to 0%');
    assert(test2Metrics.availablePercentage === 100, 'New cycle availablePercentage is 100%');
    assert(test2Metrics.previousCycleUsage === '443000', 'Previous cycle usage correctly preserved as 443,000');
    assert(test2Metrics.nextResetTime.getTime() === t0.getTime() + 10 * 3600 * 1000, 'Next reset time advanced by 5 hours');

    // -------------------------------------------------------------------------
    // TEST 3 — The Exact Customer Scenario (Cycle expired, 47s into new cycle)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Exact Customer Scenario (47 seconds into new cycle) ---');
    // Clock at T0 + 5h + 47s:
    // Countdown should display ~04:59:13, usage = 0, available = 2M, 0%
    const customerScenarioTime = new Date(t0.getTime() + 5 * 3600 * 1000 + 47 * 1000);
    const test3Metrics = await reconcileSubscriptionCycle(testSub.id, customerScenarioTime);
    if (!test3Metrics) throw new Error('reconcileSubscriptionCycle returned null');

    assert(test3Metrics.currentCycleUsage === '0', 'Customer scenario: current cycle usage is 0 (NOT 443K!)');
    assert(test3Metrics.availableQuota === '2000000', 'Customer scenario: available quota is 2,000,000 (NOT 1.557M!)');
    assert(test3Metrics.usagePercentage === 0, 'Customer scenario: usage percentage is 0% (NOT 22%!)');
    assert(test3Metrics.availablePercentage === 100, 'Customer scenario: available percentage is 100%');

    // Expected seconds until next reset = 5 * 3600 - 47 = 17953 seconds (~04:59:13)
    const expectedRemainingSec = 5 * 3600 - 47;
    assert(test3Metrics.secondsUntilReset === expectedRemainingSec, `Seconds until reset is exactly ${expectedRemainingSec} (~04:59:13)`);
    const h = Math.floor(test3Metrics.secondsUntilReset / 3600).toString().padStart(2, '0');
    const m = Math.floor((test3Metrics.secondsUntilReset % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(test3Metrics.secondsUntilReset % 60).toString().padStart(2, '0');
    assert(`${h}:${m}:${s}` === '04:59:13', `Countdown timer renders exactly 04:59:13`);

    // -------------------------------------------------------------------------
    // TEST 4 — Delayed Reset Execution
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Delayed Reset Execution (Scheduler runs 45m late) ---');
    const delayedTime = new Date(t0.getTime() + 5 * 3600 * 1000 + 45 * 60 * 1000); // 45m past boundary
    const test4Metrics = await reconcileSubscriptionCycle(testSub.id, delayedTime);
    if (!test4Metrics) throw new Error('reconcileSubscriptionCycle returned null');

    assert(test4Metrics.currentCycleUsage === '0', 'Delayed run correctly identifies cycle and usage = 0');
    assert(test4Metrics.availableQuota === '2000000', 'Delayed run retains full 2,000,000 quota');
    assert(test4Metrics.secondsUntilReset === (5 * 3600 - 45 * 60), 'Countdown correctly reflects elapsed 45m (04:15:00)');

    // -------------------------------------------------------------------------
    // TEST 5 — Concurrent Requests at Cycle Boundary
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Concurrent Requests at Cycle Boundary ---');
    const concurrentBoundary = new Date(t0.getTime() + 5 * 3600 * 1000 + 10 * 1000);
    const concurrentResults = await Promise.all([
      reconcileSubscriptionCycle(testSub.id, concurrentBoundary),
      reconcileSubscriptionCycle(testSub.id, concurrentBoundary),
      reconcileSubscriptionCycle(testSub.id, concurrentBoundary),
      reconcileSubscriptionCycle(testSub.id, concurrentBoundary),
      reconcileSubscriptionCycle(testSub.id, concurrentBoundary),
    ]);

    for (let i = 0; i < concurrentResults.length; i++) {
      const res = concurrentResults[i];
      assert(res !== null, `Concurrent call ${i + 1} succeeded`);
      assert(res?.availableQuota === '2000000', `Concurrent call ${i + 1} sees consistent 2,000,000 available`);
      assert(res?.currentCycleUsage === '0', `Concurrent call ${i + 1} sees 0 usage`);
    }

    // -------------------------------------------------------------------------
    // TEST 6 — Historical Usage Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Historical Usage Preservation ---');
    // Query raw DB records: req1 must still exist with 443,000 tokens
    const rawReq = await prisma.apiRequest.findUnique({ where: { id: req1.id } });
    assert(rawReq !== null && rawReq.totalTokens === 443000, 'ApiRequest record with 443,000 tokens is intact in database');

    const totalKeyRequests = await prisma.apiRequest.count({ where: { apiKeyId: testKey.id } });
    assert(totalKeyRequests === 1, 'Historical request count preserved');

    // -------------------------------------------------------------------------
    // TEST 7 — Dashboard / API Consistency
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Dashboard / API Consistency Across Surfaces ---');
    // resolveCustomerEntitlements
    const entitlements = await resolveCustomerEntitlements(testUser.id);
    const activeSubEnt = entitlements.activeSubscription;

    assert(activeSubEnt !== null, 'resolveCustomerEntitlements returned active subscription');
    assert(activeSubEnt?.currentUsage === '0', `Dashboard activeSub.currentUsage is 0 (actual: ${activeSubEnt?.currentUsage})`);
    assert(activeSubEnt?.tokensRemaining === '2000000', `Dashboard activeSub.tokensRemaining is 2,000,000 (actual: ${activeSubEnt?.tokensRemaining})`);
    assert(activeSubEnt?.quotaLimit === '2000000', `Dashboard activeSub.quotaLimit is 2,000,000`);

    // calculateCustomerRollingWindow (used by Gateway)
    const rollingMetrics = await calculateCustomerRollingWindow(testKey);
    assert(rollingMetrics.windowTokensUsed === 0, `Gateway rolling windowTokensUsed is 0`);
    assert(rollingMetrics.remainingWindowAllowance === 2000000, `Gateway rolling remainingWindowAllowance is 2,000,000`);

    // calculateKeyQuota (used by Key Management & Tools)
    const keyQuota = await calculateKeyQuota(testKey);
    assert(keyQuota.currentCycleUsage === '0', `KeyQuota currentCycleUsage is 0`);
    assert(keyQuota.availableQuota === '2000000', `KeyQuota availableQuota is 2,000,000`);

    // -------------------------------------------------------------------------
    // TEST 8 — Other Billing Architectures (Credit Wallets & Token Packs)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Other Billing Architectures Isolation ---');
    // 1. Credit wallet key
    const creditKey = await prisma.apiKey.create({
      data: {
        userId: testUser.id,
        keyPrefix: 'ld_live_',
        keyHash: `test_credit_hash_${Date.now()}`,
        displayKey: 'ld_live_credit...5678',
        name: 'API Credits Test Key',
        billingType: 'credit',
        creditBalanceUsd: 15.50,
        totalCreditsUsedUsd: 4.50,
        status: 'active',
      },
    });
    sandbox.keyIds.push(creditKey.id);

    const creditKeyQuota = await calculateKeyQuota(creditKey);
    assert(creditKeyQuota.billingClassification === 'API_CREDITS', 'Credit plan classified as API_CREDITS');
    assert(creditKeyQuota.creditBalanceUsd === 15.50, 'Credit balance maintained ($15.50)');
    assert(creditKeyQuota.quotaLimit === '0', 'Credit plans do NOT receive rolling token quota limit');

    // 2. Consumable token pack key
    const tokenPackKey = await prisma.apiKey.create({
      data: {
        userId: testUser.id,
        keyPrefix: 'ld_live_',
        keyHash: `test_token_hash_${Date.now()}`,
        displayKey: 'ld_live_token...9999',
        name: 'Consumable 10M Token Pack',
        plan: 'Consumable Token Pack',
        billingType: 'token',
        purchasedTokens: 10000000n,
        tokensUsed: 2500000n,
        tokensRemaining: 7500000n,
        status: 'active',
      },
    });
    sandbox.keyIds.push(tokenPackKey.id);

    const tokenPackQuota = await calculateKeyQuota(tokenPackKey);
    assert(tokenPackQuota.billingClassification === 'CONSUMABLE_TOKENS', 'Token pack classified as CONSUMABLE_TOKENS');
    assert(tokenPackQuota.quotaLimit === '10000000', 'Token pack quotaLimit matches purchased');
    assert(tokenPackQuota.availableQuota === '7500000', 'Token pack availableQuota is purchased - consumed');
    assert(tokenPackQuota.currentCycleUsage === '2500000', 'Token pack does NOT reset to 0');

    console.log('\n======================================================================');
    console.log('🎉 ALL 8 QUOTA RESET LIFECYCLE TESTS PASSED PERFECTLY!');
    console.log('======================================================================\n');
  } finally {
    await cleanup();
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  });
