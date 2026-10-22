/**
 * scripts/test-token-quota-enforcement.ts
 *
 * CRITICAL SECURITY & REGRESSION TEST SUITE:
 * Authoritative Customer Token Quota Enforcement (P0 Incident Reproduction & Verification)
 *
 * Test Groups:
 * 1. Incident Reproduction: Customer 2M Quota vs Vendor 5M Master Capacity
 * 2. Concurrency Safety: Atomic Reservations & Race Condition Prevention
 * 3. Lifecycle Integrity: Atomic Settlement & Immediate Release on Failure/Abort
 * 4. Overage Clamping: Historical Negative Balance Protection & Dashboard Visibility
 * 5. Fail-Closed Resilience: Safe Failure on DB/Transaction Disruption
 * 6. Entitlement State Checks: Suspended, Revoked, and Expired Key Enforcement
 * 7. Multi-Key & Customer Isolation: No Cross-Key or Cross-Customer Leaks
 * 8. Plan Model Distinctions: Rolling 5h Window vs Prepaid Lifetime Wallet
 */

import assert from 'assert';
import crypto from 'crypto';
import { prisma } from '../server/db';
import {
  reserveCustomerQuota,
  settleReservation,
  releaseReservation,
  getActiveCustomerReservations,
  isRollingPlan,
} from '../server/accounting/tokenReservation';
import { calculateCustomerRollingWindow } from '../server/accounting/customerAccounting';
import { calculateKeyRollingWindow } from '../server/window';
import { resolveStudioEntitlement } from '../server/studioEntitlement';

async function main() {
  console.log('===============================================================');
  console.log('🔒 STARTING AUTHORITATIVE TOKEN ALLOCATION ENFORCEMENT TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`  ▶ ${name} ... `);
    try {
      await fn();
      passed++;
      console.log('✅ PASS');
    } catch (err: any) {
      failed++;
      console.log('❌ FAIL');
      console.error(`    Error: ${err.message}`);
    }
  }

  // Cleanup helper for test keys and reservations
  const testApiKeyIds: string[] = [];
  const testRequestIds: string[] = [];

  // Helper to create isolated test key
  async function createTestKey(data: {
    name: string;
    plan: string;
    purchasedTokens: bigint;
    tokensRemaining: bigint;
    tokensUsed?: bigint;
    windowHours?: number;
    status?: string;
    expiresAt?: Date | null;
  }) {
    // Find or create a test user
    let user = await prisma.user.findFirst({ where: { email: 'quota-test-system@lightningapi.pro' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'quota-test-system@lightningapi.pro',
          passwordHash: 'dummy-hash',
          name: 'Quota Test System User',
          role: 'user',
        },
      });
    }

    const rawKey = 'ld_' + crypto.randomBytes(24).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const displayKey = rawKey.substring(0, 7) + '...' + rawKey.substring(rawKey.length - 4);

    const apiKey = await prisma.apiKey.create({
      data: {
        user: { connect: { id: user.id } },
        keyHash,
        keyPrefix: rawKey.substring(0, 10),
        displayKey,
        name: data.name,
        plan: data.plan,
        purchasedTokens: data.purchasedTokens,
        tokensRemaining: data.tokensRemaining,
        tokensUsed: data.tokensUsed || 0n,
        status: data.status || 'active',
        expiresAt: data.expiresAt || null,
        allowedModels: 'all',
      },
    });

    testApiKeyIds.push(apiKey.id);
    return { apiKey, user, rawKey };
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 1: Direct Incident Reproduction (Customer 2M vs Master 5M)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 1: Direct Incident Reproduction (Customer 2M vs Master 5M) ---');

    await test('Customer 2M rolling key with 5M master vendor blocks when 2M limit reached', async () => {
      // 1. Create customer key with 2M allowance on rolling 5h window
      const { apiKey, user } = await createTestKey({
        name: 'Repro 2M Customer Key',
        plan: '2M Tokens / 5h Window',
        purchasedTokens: 2_000_000n,
        tokensRemaining: 2_000_000n,
        tokensUsed: 2_000_000n,
        windowHours: 5,
      });

      // 2. Simulate 2,000,000 tokens already consumed within the last 5 hours in ApiRequest table
      const req1Id = `repro_req_${Date.now()}_1`;
      testRequestIds.push(req1Id);
      await prisma.apiRequest.create({
        data: {
          apiKeyId: apiKey.id,
          userId: user.id,
          model: 'claude-3-5-sonnet-20241022',
          endpoint: '/v1/messages',
          statusCode: 200,
          inputTokens: 1_000_000,
          outputTokens: 1_000_000,
          totalTokens: 2_000_000,
          latencyMs: 1500,
          streaming: false,
          usageSource: 'PROVIDER_REPORTED',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        },
      });

      // 3. Verify calculateKeyRollingWindow reports exactly 0 effective remaining
      const windowMetrics = await calculateKeyRollingWindow(apiKey);
      assert.strictEqual(windowMetrics.windowTokensUsed, 2_000_000, 'Window usage must be 2M');
      assert.strictEqual(windowMetrics.remainingNum, 0, 'Effective remaining must be 0');

      // 4. Attempt a new reservation for 1,500 tokens
      const req2Id = `repro_req_${Date.now()}_2`;
      testRequestIds.push(req2Id);
      const resResult = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: req2Id,
        estimatedTokens: 1500,
      });

      // 5. Quota MUST be rejected, regardless of upstream provider capacity
      assert.strictEqual(resResult.success, false, 'Reservation must fail when customer quota is exhausted');
      assert.strictEqual(resResult.code, 'QUOTA_EXHAUSTED', 'Error code must be QUOTA_EXHAUSTED');
      assert.strictEqual(resResult.availableTokens, 0, 'Available tokens must be 0');
    });

    await test('Customer 2M key with 1.99M used rejects request exceeding remaining 10k tokens', async () => {
      const { apiKey, user } = await createTestKey({
        name: 'Repro 2M Boundary Key',
        plan: '2M Tokens / 5h Window',
        purchasedTokens: 2_000_000n,
        tokensRemaining: 2_000_000n,
        tokensUsed: 1_990_000n,
        windowHours: 5,
      });

      await prisma.apiRequest.create({
        data: {
          apiKeyId: apiKey.id,
          userId: user.id,
          model: 'claude-3-5-sonnet-20241022',
          endpoint: '/v1/messages',
          statusCode: 200,
          inputTokens: 1_000_000,
          outputTokens: 990_000,
          totalTokens: 1_990_000,
          latencyMs: 1500,
          streaming: false,
          usageSource: 'PROVIDER_REPORTED',
          createdAt: new Date(Date.now() - 20 * 60 * 1000),
        },
      });

      // Request requiring 15,000 tokens should fail (only 10,000 available)
      const reqId = `boundary_req_${Date.now()}`;
      testRequestIds.push(reqId);
      const res = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: reqId,
        estimatedTokens: 15000,
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, 'QUOTA_EXHAUSTED');
      assert.strictEqual(res.availableTokens, 10_000);

      // But a request requiring 5,000 tokens should succeed
      const reqId2 = `boundary_req_${Date.now()}_ok`;
      testRequestIds.push(reqId2);
      const res2 = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: reqId2,
        estimatedTokens: 5000,
      });

      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.availableTokens, 5000);

      // Clean up reservation
      await releaseReservation(reqId2);
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 2: Concurrency & Atomic Race Condition Safety
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 2: Concurrency & Atomic Race Condition Safety ---');

    await test('Two simultaneous requests arriving at quota boundary: exactly one succeeds', async () => {
      // Key with exactly 10,000 tokens remaining
      const { apiKey } = await createTestKey({
        name: 'Concurrent Test Key',
        plan: 'Starter Prepaid Pack',
        purchasedTokens: 10_000n,
        tokensRemaining: 10_000n,
        tokensUsed: 0n,
      });

      const reqA = `concurrent_${Date.now()}_A`;
      const reqB = `concurrent_${Date.now()}_B`;
      testRequestIds.push(reqA, reqB);

      // Dispatch two simultaneous reservation requests of 6,000 tokens each
      const [resA, resB] = await Promise.all([
        reserveCustomerQuota({
          apiKeyId: apiKey.id,
          requestId: reqA,
          estimatedTokens: 6000,
        }),
        reserveCustomerQuota({
          apiKeyId: apiKey.id,
          requestId: reqB,
          estimatedTokens: 6000,
        }),
      ]);

      const successCount = (resA.success ? 1 : 0) + (resB.success ? 1 : 0);
      const failCount = (!resA.success ? 1 : 0) + (!resB.success ? 1 : 0);

      assert.strictEqual(successCount, 1, 'Exactly one concurrent request must succeed');
      assert.strictEqual(failCount, 1, 'The competing concurrent request must be rejected');

      // Verify DB active reservations is strictly 6,000
      const activeReservations = await getActiveCustomerReservations(apiKey.id);
      assert.strictEqual(activeReservations, 6000, 'Active reservations must equal exactly 6,000');

      // Clean up
      await releaseReservation(reqA);
      await releaseReservation(reqB);
    });

    await test('High-concurrency burst: 10 requests of 2k tokens against 10k allowance grants exactly 5', async () => {
      const { apiKey } = await createTestKey({
        name: 'Burst Test Key',
        plan: 'Burst Pack',
        purchasedTokens: 10_000n,
        tokensRemaining: 10_000n,
        tokensUsed: 0n,
      });

      const burstRequests = Array.from({ length: 10 }, (_, i) => `burst_${Date.now()}_${i}`);
      burstRequests.forEach((r) => testRequestIds.push(r));

      const results = await Promise.all(
        burstRequests.map((reqId) =>
          reserveCustomerQuota({
            apiKeyId: apiKey.id,
            requestId: reqId,
            estimatedTokens: 2000,
          })
        )
      );

      const successful = results.filter((r) => r.success);
      const rejected = results.filter((r) => !r.success);

      assert.strictEqual(successful.length, 5, 'Exactly 5 requests of 2k must succeed (10k total)');
      assert.strictEqual(rejected.length, 5, 'Remaining 5 requests must be rejected with QUOTA_EXHAUSTED');

      const totalReserved = await getActiveCustomerReservations(apiKey.id);
      assert.strictEqual(totalReserved, 10_000, 'Total reserved must exactly equal 10,000');

      // Release all
      await Promise.all(burstRequests.map((r) => releaseReservation(r)));
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 3: Lifecycle Integrity (Settle & Release)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 3: Lifecycle Integrity (Settle & Release) ---');

    await test('Settled reservation transitions to SETTLED and releases capacity lock', async () => {
      const { apiKey } = await createTestKey({
        name: 'Settle Test Key',
        plan: 'Prepaid Wallet',
        purchasedTokens: 50_000n,
        tokensRemaining: 50_000n,
      });

      const reqId = `settle_test_${Date.now()}`;
      testRequestIds.push(reqId);

      const res = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: reqId,
        estimatedTokens: 15000,
      });
      assert.strictEqual(res.success, true);

      // Verify active reservation exists
      let active = await getActiveCustomerReservations(apiKey.id);
      assert.strictEqual(active, 15000);

      // Settle
      await settleReservation(reqId);

      // Active reservation should now be 0
      active = await getActiveCustomerReservations(apiKey.id);
      assert.strictEqual(active, 0);

      const row = await prisma.tokenReservation.findUnique({ where: { requestId: reqId } });
      assert.strictEqual(row?.status, 'SETTLED');
    });

    await test('Released reservation transitions to RELEASED and restores available tokens', async () => {
      const { apiKey } = await createTestKey({
        name: 'Release Test Key',
        plan: 'Prepaid Wallet',
        purchasedTokens: 20_000n,
        tokensRemaining: 20_000n,
      });

      const reqId = `release_test_${Date.now()}`;
      testRequestIds.push(reqId);

      await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: reqId,
        estimatedTokens: 18000,
      });

      // Subsequent 5k request must fail (only 2k left after reservation)
      const reqId2 = `release_compete_${Date.now()}`;
      testRequestIds.push(reqId2);
      const compBefore = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: reqId2,
        estimatedTokens: 5000,
      });
      assert.strictEqual(compBefore.success, false);

      // Release first request (e.g. client aborted stream)
      await releaseReservation(reqId);

      // Now the 5k request must succeed!
      const compAfter = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: reqId2,
        estimatedTokens: 5000,
      });
      assert.strictEqual(compAfter.success, true);

      await releaseReservation(reqId2);
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 4: Negative Balance Protection & Clamping
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 4: Negative Balance Protection & Clamping ---');

    await test('Key with historical negative balance (-2.28M) is strictly blocked and clamped to 0', async () => {
      const { apiKey } = await createTestKey({
        name: 'Historical Overallocated Key',
        plan: '2M Tokens Prepaid',
        purchasedTokens: 2_000_000n,
        tokensRemaining: -2_280_000n, // Historical negative balance from incident
        tokensUsed: 4_280_000n,
      });

      // Verify reserveCustomerQuota blocks immediately
      const reqId = `neg_test_${Date.now()}`;
      testRequestIds.push(reqId);
      const res = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: reqId,
        estimatedTokens: 100,
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, 'QUOTA_EXHAUSTED');
      assert.strictEqual(res.availableTokens, 0, 'Available tokens must be clamped to 0, never negative');

      // Verify calculateCustomerRollingWindow clamps remaining allowance to 0
      const metrics = await calculateCustomerRollingWindow(apiKey);
      assert.strictEqual(metrics.remainingWindowAllowance, 0, 'Remaining allowance must be clamped to 0');

      // Verify calculateKeyRollingWindow clamps remainingNum to 0
      const windowMetrics = await calculateKeyRollingWindow(apiKey);
      assert.strictEqual(windowMetrics.remainingNum, 0);

      // Verify Studio Entitlement marks quota as exhausted and disables chat
      const entitlement = await resolveStudioEntitlement(apiKey.userId, apiKey.id);
      assert.strictEqual(entitlement.activeKey?.isQuotaExhausted, true);
      assert.strictEqual(entitlement.canChat, false);
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 5: Fail-Closed Resilience
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 5: Fail-Closed Resilience ---');

    await test('Reservation for non-existent key fails closed', async () => {
      const res = await reserveCustomerQuota({
        apiKeyId: 'non-existent-key-uuid-12345',
        requestId: `nonexist_${Date.now()}`,
        estimatedTokens: 500,
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, 'KEY_NOT_FOUND');
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 6: Inactive, Revoked, and Expired Key Enforcement
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 6: Inactive, Revoked, and Expired Key Enforcement ---');

    await test('Suspended/revoked key is rejected before upstream reservation', async () => {
      const { apiKey } = await createTestKey({
        name: 'Suspended Key',
        plan: '2M Window Plan',
        purchasedTokens: 2_000_000n,
        tokensRemaining: 2_000_000n,
        status: 'suspended',
      });

      const res = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: `suspended_${Date.now()}`,
        estimatedTokens: 500,
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, 'KEY_INACTIVE');
    });

    await test('Expired key (expiresAt in past) is rejected before upstream reservation', async () => {
      const { apiKey } = await createTestKey({
        name: 'Expired Key',
        plan: '2M Window Plan',
        purchasedTokens: 2_000_000n,
        tokensRemaining: 2_000_000n,
        status: 'active',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      });

      const res = await reserveCustomerQuota({
        apiKeyId: apiKey.id,
        requestId: `expired_${Date.now()}`,
        estimatedTokens: 500,
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, 'KEY_EXPIRED');
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 7: Multi-Key & Customer Isolation
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 7: Multi-Key & Customer Isolation ---');

    await test('Exhausting Key A does not deplete Key B of same customer or other customer', async () => {
      const { apiKey: keyA } = await createTestKey({
        name: 'Customer Key A',
        plan: 'Prepaid 10k',
        purchasedTokens: 10_000n,
        tokensRemaining: 0n, // Exhausted
      });

      const { apiKey: keyB } = await createTestKey({
        name: 'Customer Key B',
        plan: 'Prepaid 20k',
        purchasedTokens: 20_000n,
        tokensRemaining: 20_000n, // Healthy
      });

      // Key A must fail
      const reqA = `iso_${Date.now()}_A`;
      testRequestIds.push(reqA);
      const resA = await reserveCustomerQuota({
        apiKeyId: keyA.id,
        requestId: reqA,
        estimatedTokens: 1000,
      });
      assert.strictEqual(resA.success, false);
      assert.strictEqual(resA.code, 'QUOTA_EXHAUSTED');

      // Key B must succeed
      const reqB = `iso_${Date.now()}_B`;
      testRequestIds.push(reqB);
      const resB = await reserveCustomerQuota({
        apiKeyId: keyB.id,
        requestId: reqB,
        estimatedTokens: 1000,
      });
      assert.strictEqual(resB.success, true);

      await releaseReservation(reqB);
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST GROUP 8: Rolling Window Pattern Recognition
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n--- GROUP 8: Rolling Window Pattern Recognition ---');

    await test('isRollingPlan correctly identifies all variations of rolling plans', async () => {
      const rollingCases = [
        { plan: '2M Tokens / 5h Window', name: 'Key 1', windowHours: 0 },
        { plan: 'Claude Pro (5h Rolling)', name: 'Key 2', windowHours: 0 },
        { plan: 'Opus Max Window', name: 'Key 3', windowHours: 0 },
        { plan: 'Claude Ultra 5-Hour', name: 'Key 4', windowHours: 0 },
        { plan: 'Custom Plan', name: 'Rolling Key', windowHours: 0 },
        { plan: 'Standard', name: 'Key 6', windowHours: 5 },
      ];

      for (const c of rollingCases) {
        assert.strictEqual(isRollingPlan(c), true, `Plan "${c.plan}" / "${c.name}" should be rolling`);
      }

      const prepaidCases = [
        { plan: 'Starter Pack', name: 'Key 1', windowHours: 0 },
        { plan: '5M Tokens Lifetime Prepaid', name: 'Key 2', windowHours: 0 },
        { plan: 'Pay As You Go', name: 'Key 3', windowHours: 0 },
      ];

      for (const c of prepaidCases) {
        assert.strictEqual(isRollingPlan(c), false, `Plan "${c.plan}" should NOT be rolling`);
      }
    });

  } finally {
    // Clean up test data from DB
    console.log('\n--- Cleaning up temporary test keys & reservations ---');
    try {
      if (testRequestIds.length > 0) {
        await prisma.tokenReservation.deleteMany({
          where: { requestId: { in: testRequestIds } },
        });
      }
      if (testApiKeyIds.length > 0) {
        await prisma.apiRequest.deleteMany({
          where: { apiKeyId: { in: testApiKeyIds } },
        });
        await prisma.apiKey.deleteMany({
          where: { id: { in: testApiKeyIds } },
        });
      }
      console.log('Cleanup completed successfully.');
    } catch (cleanupErr: any) {
      console.warn('Warning during cleanup:', cleanupErr.message);
    }
  }

  console.log('\n===============================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
