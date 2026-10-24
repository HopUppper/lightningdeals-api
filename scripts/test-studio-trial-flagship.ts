/**
 * scripts/test-studio-trial-flagship.ts
 *
 * Comprehensive Automated Regression Test Suite for:
 * 1. AI Chat Studio Flagship Access for Eligible Trial Keys
 * 2. Multi-turn chat & document analysis entitlement
 * 3. Model entitlement vs Studio access separation (Opus tier gating)
 * 4. ApiKey.allowedModels whitelist validation
 * 5. Quota exhaustion (tokensRemaining <= 0) and Key expiration enforcement
 * 6. Customer isolation & IDOR protection
 * 7. /entitlement and /models API metadata
 * 8. Homepage & Dashboard UI routing and navigation
 */

import assert from 'assert';
import {
  resolveStudioEntitlement,
  isModelAuthorizedForKey,
  parseAllowedModels,
  PAID_ONLY_STUDIO_MODELS,
  DEFAULT_TRIAL_STUDIO_MODELS,
  ALL_STUDIO_MODELS,
} from '../server/studioEntitlement';
import { prisma } from '../server/db';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('===============================================================');
  console.log('⚡ STARTING STUDIO TRIAL & FLAGSHIP INTEGRATION TEST SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function runTest(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        return (res as any).then(() => {
          passedTests++;
          console.log(`  ✅ [PASS] ${name}`);
        }).catch((err: any) => {
          console.error(`  ❌ [FAIL] ${name}:`, err.message);
          throw err;
        });
      }
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // ── TEST 1: Model Entitlement Separation Logic ───────────────────────────────
  console.log('--- TEST GROUP 1: Model Entitlement Separation Logic ---');

  await runTest('Trial key permits Sonnet 5.5, Sonnet 3.7, Haiku 5.5', () => {
    const trialKey = {
      id: 'key_trial_1',
      type: 'trial',
      plan: 'Free Trial',
      allowedModels: 'all',
      tokensRemaining: 200000n,
    };
    const resSonnet = isModelAuthorizedForKey('claude-sonnet-5.5', trialKey, false);
    assert.strictEqual(resSonnet.allowed, true, 'Sonnet 5.5 should be allowed for trial');

    const resHaiku = isModelAuthorizedForKey('claude-haiku-5.5', trialKey, false);
    assert.strictEqual(resHaiku.allowed, true, 'Haiku 5.5 should be allowed for trial');

    const resSonnet37 = isModelAuthorizedForKey('claude-3-7-sonnet-20250219', trialKey, false);
    assert.strictEqual(resSonnet37.allowed, true, 'Sonnet 3.7 should be allowed for trial');
  });

  await runTest('Trial key blocks Opus frontier models with PRO_TIER_REQUIRED', () => {
    const trialKey = {
      id: 'key_trial_2',
      type: 'trial',
      plan: 'Free Trial',
      allowedModels: 'all',
      tokensRemaining: 200000n,
    };
    const resOpus = isModelAuthorizedForKey('claude-opus-5.5', trialKey, false);
    assert.strictEqual(resOpus.allowed, false, 'Opus 5.5 must be blocked for trial');
    assert.strictEqual(resOpus.code, 'PRO_TIER_REQUIRED', 'Error code must be PRO_TIER_REQUIRED');

    const resOpus5 = isModelAuthorizedForKey('claude-opus-5', trialKey, false);
    assert.strictEqual(resOpus5.allowed, false, 'Opus 5 must be blocked for trial');
  });

  await runTest('Paid customer can access Opus frontier models', () => {
    const paidKey = {
      id: 'key_paid_1',
      type: 'production',
      plan: 'ScaleMax 50M',
      allowedModels: 'all',
      tokensRemaining: 50000000n,
    };
    const resOpus = isModelAuthorizedForKey('claude-opus-5.5', paidKey, true);
    assert.strictEqual(resOpus.allowed, true, 'Paid customer must be authorized for Opus');
  });

  // ── TEST 2: Specific allowedModels Whitelisting ──────────────────────────────
  console.log('\n--- TEST GROUP 2: ApiKey.allowedModels Whitelist Enforcement ---');

  await runTest('Key with restricted allowedModels allows only whitelisted model', () => {
    const restrictedKey = {
      id: 'key_restricted_1',
      type: 'production',
      plan: 'Developer',
      allowedModels: JSON.stringify(['claude-haiku-5.5']),
      tokensRemaining: 1000000n,
    };
    const resHaiku = isModelAuthorizedForKey('claude-haiku-5.5', restrictedKey, true);
    assert.strictEqual(resHaiku.allowed, true, 'Whitelisted Haiku must be allowed');

    const resSonnet = isModelAuthorizedForKey('claude-sonnet-5.5', restrictedKey, true);
    assert.strictEqual(resSonnet.allowed, false, 'Non-whitelisted Sonnet must be blocked');
    assert.strictEqual(resSonnet.code, 'MODEL_NOT_AUTHORIZED', 'Code must be MODEL_NOT_AUTHORIZED');
  });

  await runTest('parseAllowedModels handles various formats (all, JSON array, CSV)', () => {
    assert.strictEqual(parseAllowedModels('all'), 'all');
    assert.strictEqual(parseAllowedModels('*'), 'all');
    assert.strictEqual(parseAllowedModels('["*"]'), 'all');
    assert.deepStrictEqual(parseAllowedModels('["claude-sonnet-5.5"]'), ['claude-sonnet-5.5']);
    assert.deepStrictEqual(parseAllowedModels('claude-sonnet-5.5, claude-haiku-5.5'), ['claude-sonnet-5.5', 'claude-haiku-5.5']);
  });

  // ── TEST 3: Entitlement Resolution & Lifecycle ───────────────────────────────
  console.log('\n--- TEST GROUP 3: Database User Entitlement Resolution ---');

  // Create mock test users and keys in SQLite/Postgres DB
  const testUserIdTrial = `test_user_trial_${Date.now()}`;
  const testUserIdPaid = `test_user_paid_${Date.now()}`;
  const testUserIdKeyless = `test_user_keyless_${Date.now()}`;

  try {
    // Setup test users
    await prisma.user.createMany({
      data: [
        { id: testUserIdTrial, email: `${testUserIdTrial}@example.com`, name: 'Trial User', passwordHash: 'hash', emailVerified: true },
        { id: testUserIdPaid, email: `${testUserIdPaid}@example.com`, name: 'Paid User', passwordHash: 'hash', emailVerified: true, hasStudioAccess: true },
        { id: testUserIdKeyless, email: `${testUserIdKeyless}@example.com`, name: 'Keyless User', passwordHash: 'hash', emailVerified: true },
      ],
    });

    // Create an active trial key for testUserIdTrial
    const trialKey = await prisma.apiKey.create({
      data: {
        userId: testUserIdTrial,
        keyPrefix: 'ld_trial_',
        keyHash: `hash_${Date.now()}_trial`,
        displayKey: 'ld_trial_abc...123',
        name: 'Free Trial Key (24h)',
        type: 'trial',
        status: 'active',
        plan: 'Free Trial',
        purchasedTokens: 200000n,
        tokensUsed: 1000n,
        tokensRemaining: 199000n,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000), // expires tomorrow
      },
    });

    await runTest('Trial user with valid active key resolves hasAccess=true and canChat=true', async () => {
      const ent = await resolveStudioEntitlement(testUserIdTrial);
      assert.strictEqual(ent.hasAccess, true, 'Trial user must have Studio access');
      assert.strictEqual(ent.tier, 'trial', 'Tier must be trial');
      assert.strictEqual(ent.canChat, true, 'canChat must be true');
      assert.strictEqual(ent.canUploadDocuments, true, 'canUploadDocuments must be true');
      assert.strictEqual(ent.canMultiTurn, true, 'canMultiTurn must be true');
      assert.strictEqual(ent.rejectionReason, undefined, 'Rejection reason must be undefined');
      assert.strictEqual(ent.activeKey?.id, trialKey.id);
      assert.strictEqual(ent.allowedModels.includes('claude-sonnet-5.5'), true);
      assert.strictEqual(ent.allowedModels.includes('claude-opus-5.5'), false, 'Trial allowedModels must not include Opus');
    });

    await runTest('Paid customer resolves tier=paid and full model access', async () => {
      // Create a paid key
      await prisma.apiKey.create({
        data: {
          userId: testUserIdPaid,
          keyPrefix: 'ld_live_',
          keyHash: `hash_${Date.now()}_paid`,
          displayKey: 'ld_live_paid...888',
          name: 'Pro Capacity Key',
          type: 'production',
          status: 'active',
          plan: 'ScaleMax 100M',
          purchasedTokens: 100000000n,
          tokensRemaining: 95000000n,
        },
      });

      const ent = await resolveStudioEntitlement(testUserIdPaid);
      assert.strictEqual(ent.hasAccess, true);
      assert.strictEqual(ent.isPaidCustomer, true);
      assert.strictEqual(ent.tier, 'paid');
      assert.strictEqual(ent.canChat, true);
      assert.strictEqual(ent.allowedModels.includes('claude-opus-5.5'), true, 'Paid allowedModels must include Opus');
    });

    await runTest('User without keys resolves hasAccess=false with informative NO_KEY code', async () => {
      const ent = await resolveStudioEntitlement(testUserIdKeyless);
      assert.strictEqual(ent.canChat, false);
      assert.strictEqual(ent.rejectionReason?.code, 'NO_KEY');
    });

    await runTest('Key with 0 remaining tokens resolves QUOTA_EXHAUSTED', async () => {
      // Deplete trial key
      await prisma.apiKey.update({
        where: { id: trialKey.id },
        data: { tokensRemaining: 0n },
      });

      const ent = await resolveStudioEntitlement(testUserIdTrial);
      assert.strictEqual(ent.canChat, false, 'canChat must be false when quota is exhausted');
      assert.strictEqual(ent.rejectionReason?.code, 'QUOTA_EXHAUSTED');
      assert.strictEqual(ent.activeKey?.isQuotaExhausted, true);
    });

    await runTest('Key past expiration resolves KEY_EXPIRED', async () => {
      // Set expiry to yesterday and restore tokens
      await prisma.apiKey.update({
        where: { id: trialKey.id },
        data: {
          tokensRemaining: 200000n,
          expiresAt: new Date(Date.now() - 24 * 3600 * 1000), // yesterday
        },
      });

      const ent = await resolveStudioEntitlement(testUserIdTrial);
      assert.strictEqual(ent.canChat, false, 'canChat must be false when key is expired');
      assert.strictEqual(ent.rejectionReason?.code, 'KEY_EXPIRED');
      assert.strictEqual(ent.activeKey?.isExpired, true);
    });

    await runTest('Customer isolation (IDOR): User A cannot resolve User B key', async () => {
      const ent = await resolveStudioEntitlement(testUserIdKeyless, trialKey.id);
      // Key should not be assigned to testUserIdKeyless because it belongs to testUserIdTrial
      assert.strictEqual(ent.activeKey, null, 'Foreign user key must not be resolved');
      assert.strictEqual(ent.canChat, false);
    });

  } finally {
    // Cleanup test data
    await prisma.apiKey.deleteMany({
      where: { userId: { in: [testUserIdTrial, testUserIdPaid, testUserIdKeyless] } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [testUserIdTrial, testUserIdPaid, testUserIdKeyless] } },
    }).catch(() => {});
  }

  // ── TEST 4: Frontend UI & Routing Integrity ─────────────────────────────────
  console.log('\n--- TEST GROUP 4: Frontend Flagship Navigation & Component Verification ---');

  await runTest('App.tsx contains StudioFlagshipSection in LandingPage', () => {
    const appContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    assert.strictEqual(appContent.includes('<StudioFlagshipSection />'), true, 'LandingPage must include <StudioFlagshipSection />');
    assert.strictEqual(appContent.includes('import { StudioFlagshipSection }'), true, 'App.tsx must import StudioFlagshipSection');
  });

  await runTest('App.tsx registers /studio and /chat redirects to /dashboard/studio', () => {
    const appContent = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    assert.strictEqual(appContent.includes('path="/studio" element={<Navigate to="/dashboard/studio" replace />}'), true);
    assert.strictEqual(appContent.includes('path="/chat" element={<Navigate to="/dashboard/studio" replace />}'), true);
  });

  await runTest('UserDashboardLayout removes PRO badge from AI Chat Studio nav item', () => {
    const layoutContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/dashboard/UserDashboardLayout.tsx'), 'utf8');
    assert.strictEqual(
      layoutContent.includes("{ name: 'AI Chat Studio', path: '/dashboard/studio', icon: Bot }"),
      true,
      'UserDashboardLayout must not have badge: PRO on AI Chat Studio'
    );
    assert.strictEqual(
      layoutContent.includes("{ name: 'AI Chat Studio', path: '/dashboard/studio', icon: Bot, badge: 'PRO' }"),
      false,
      'badge: PRO must be removed'
    );
  });

  await runTest('UserOverview renders the Flagship AI Chat Studio hero card', () => {
    const overviewContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/dashboard/UserOverview.tsx'), 'utf8');
    assert.strictEqual(overviewContent.includes('Flagship Workspace'), true, 'UserOverview must include Flagship Workspace badge');
    assert.strictEqual(overviewContent.includes('AI Chat Studio'), true, 'UserOverview must include AI Chat Studio title');
    assert.strictEqual(overviewContent.includes('to="/dashboard/studio"'), true, 'UserOverview must link to /dashboard/studio');
  });

  await runTest('UserChatStudio allows multi-turn conversations and does not block >= 2 messages', () => {
    const studioContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/dashboard/UserChatStudio.tsx'), 'utf8');
    assert.strictEqual(
      studioContent.includes('activeThread.messages.length >= 2 && !isPaidCustomer'),
      false,
      'UserChatStudio must not block conversations at 2 messages'
    );
    assert.strictEqual(
      studioContent.includes('attachments.length > 0 && !isPaidCustomer'),
      false,
      'UserChatStudio must not block attachments based purely on !isPaidCustomer'
    );
  });

  await runTest('UserAuthGuard and LoginPage preserve and honor redirect query parameter', () => {
    const guardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/UserAuthGuard.tsx'), 'utf8');
    assert.strictEqual(guardContent.includes('redirect='), true, 'UserAuthGuard must append redirect parameter');

    const loginContent = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/LoginPage.tsx'), 'utf8');
    assert.strictEqual(loginContent.includes('redirectParam'), true, 'LoginPage must read and navigate to redirectParam');
  });

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
