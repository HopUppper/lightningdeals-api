import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function runProductionReadinessSuite() {
  console.log('================================================================');
  console.log('🚀 LIGHTNINGAPI.PRO — UPSTREAM & SECURITY PRODUCTION READINESS');
  console.log('================================================================\n');

  const baseUrl = 'http://localhost:3001';
  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } else {
      console.log(`❌ [FAIL] ${name} — ${details || 'Assertion failed'}`);
    }
  }

  // 1. Create temporary test fixtures
  let devUser = await prisma.user.findFirst();
  let createdUser = false;
  if (!devUser) {
    devUser = await prisma.user.create({
      data: {
        name: 'Prod Readiness User',
        email: `prod_ready_${Date.now()}@lightningdeals.ai`,
        passwordHash: 'dummyhash',
        role: 'user',
        emailVerified: true,
        status: 'active',
      },
    });
    createdUser = true;
  }

  const activeRawKey = 'ld_live_prodtest_' + crypto.randomBytes(8).toString('hex');
  const activeKeyHash = hashApiKey(activeRawKey);
  const activeKey = await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: 'Prod Readiness Active Key',
      keyPrefix: 'ld_live_',
      keyHash: activeKeyHash,
      displayKey: activeRawKey.substring(0, 11) + '...' + activeRawKey.slice(-4),
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: BigInt(5000000),
      tokensRemaining: BigInt(5000000),
      tokensUsed: BigInt(0),
      rateLimitRpm: 120,
    },
  });

  const revokedRawKey = 'ld_live_revoked_' + crypto.randomBytes(8).toString('hex');
  const revokedKeyHash = hashApiKey(revokedRawKey);
  const revokedKey = await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: 'Prod Readiness Revoked Key',
      keyPrefix: 'ld_live_',
      keyHash: revokedKeyHash,
      displayKey: revokedRawKey.substring(0, 11) + '...' + revokedRawKey.slice(-4),
      type: 'live',
      status: 'revoked',
      plan: 'pro',
      purchasedTokens: BigInt(5000000),
      tokensRemaining: BigInt(5000000),
      tokensUsed: BigInt(0),
      rateLimitRpm: 120,
    },
  });

  const expiredRawKey = 'ld_live_expired_' + crypto.randomBytes(8).toString('hex');
  const expiredKeyHash = hashApiKey(expiredRawKey);
  const expiredKey = await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: 'Prod Readiness Expired Key',
      keyPrefix: 'ld_live_',
      keyHash: expiredKeyHash,
      displayKey: expiredRawKey.substring(0, 11) + '...' + expiredRawKey.slice(-4),
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: BigInt(5000000),
      tokensRemaining: BigInt(5000000),
      tokensUsed: BigInt(0),
      rateLimitRpm: 120,
      expiresAt: new Date(Date.now() - 24 * 3600 * 1000), // Expired yesterday
    },
  });

  const exhaustedRawKey = 'ld_live_exhausted_' + crypto.randomBytes(8).toString('hex');
  const exhaustedKeyHash = hashApiKey(exhaustedRawKey);
  const exhaustedKey = await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: 'Prod Readiness Exhausted Key',
      keyPrefix: 'ld_live_',
      keyHash: exhaustedKeyHash,
      displayKey: exhaustedRawKey.substring(0, 11) + '...' + exhaustedRawKey.slice(-4),
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: BigInt(1000),
      tokensRemaining: BigInt(0), // 0 tokens remaining
      tokensUsed: BigInt(1000),
      rateLimitRpm: 120,
    },
  });

  const restrictedRawKey = 'ld_live_restricted_' + crypto.randomBytes(8).toString('hex');
  const restrictedKeyHash = hashApiKey(restrictedRawKey);
  const restrictedKey = await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: 'Prod Readiness Restricted Key',
      keyPrefix: 'ld_live_',
      keyHash: restrictedKeyHash,
      displayKey: restrictedRawKey.substring(0, 11) + '...' + restrictedRawKey.slice(-4),
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: BigInt(5000000),
      tokensRemaining: BigInt(5000000),
      tokensUsed: BigInt(0),
      rateLimitRpm: 120,
      allowedModels: JSON.stringify(['claude-haiku-4-5']), // Only Haiku allowed
    },
  });

  try {
    // -------------------------------------------------------------
    // CHECK 1: Missing Model Parameter Rejection
    // -------------------------------------------------------------
    const res1 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': activeRawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d1: any = await res1.json();
    assert('1. Missing Model Validation', res1.status === 400 && d1.error?.type === 'invalid_request_error');

    // -------------------------------------------------------------
    // CHECK 2: Unsupported Model Fails Clearly with 404
    // -------------------------------------------------------------
    const res2 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': activeRawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-unknown-engine', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d2: any = await res2.json();
    assert('2. Unsupported Model Name Fails Clearly (HTTP 404)', res2.status === 404 && d2.error?.type === 'not_found_error');

    // -------------------------------------------------------------
    // CHECK 3: Missing API Key Rejected
    // -------------------------------------------------------------
    const res3 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d3: any = await res3.json();
    assert('3. Missing API Key Rejected (HTTP 401)', res3.status === 401 && d3.error?.type === 'authentication_error');

    // -------------------------------------------------------------
    // CHECK 4: Invalid API Key Rejected
    // -------------------------------------------------------------
    const res4 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': 'ld_live_fake_nonexistent_key_123', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d4: any = await res4.json();
    assert('4. Invalid API Key Rejected (HTTP 401)', res4.status === 401 && d4.error?.type === 'authentication_error');

    // -------------------------------------------------------------
    // CHECK 5: Revoked API Key Rejected
    // -------------------------------------------------------------
    const res5 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': revokedRawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d5: any = await res5.json();
    assert('5. Revoked API Key Rejected (HTTP 403)', res5.status === 403 && d5.error?.type === 'permission_error');

    // -------------------------------------------------------------
    // CHECK 6: Expired API Key Rejected
    // -------------------------------------------------------------
    const res6 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': expiredRawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d6: any = await res6.json();
    assert('6. Expired API Key Rejected (HTTP 401)', res6.status === 401 && d6.error?.type === 'authentication_error');

    // -------------------------------------------------------------
    // CHECK 7: Model Restriction Authorization Check
    // -------------------------------------------------------------
    const res7 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': restrictedRawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-opus-5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d7: any = await res7.json();
    assert('7. Model Restriction Enforcement (HTTP 403)', res7.status === 403 && d7.error?.type === 'permission_error');

    // -------------------------------------------------------------
    // CHECK 8: 5-Hour Quota Exhaustion Enforcement
    // -------------------------------------------------------------
    const res8 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': exhaustedRawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d8: any = await res8.json();
    assert('8. Zero Balance Quota Enforcement (HTTP 429)', res8.status === 429 && d8.error?.type === 'quota_exceeded');

    // -------------------------------------------------------------
    // CHECK 9: Dual Conflicting Auth Headers Blocked
    // -------------------------------------------------------------
    const res9 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': activeRawKey,
        'Authorization': `Bearer ${revokedRawKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: 'claude-sonnet-5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const d9: any = await res9.json();
    assert('9. Dual Conflicting Auth Headers Blocked (HTTP 400)', res9.status === 400 && d9.error?.type === 'invalid_request_error');

    // -------------------------------------------------------------
    // CHECK 10: Model Identity Query Intercept & Context Window Verification
    // -------------------------------------------------------------
    const res10 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': activeRawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        messages: [{ role: 'user', content: 'What model are you?' }],
      }),
    });
    const d10: any = await res10.json();
    const identityText = d10.content?.[0]?.text || '';
    const hasCorrectContext = identityText.includes('200,000 token context window') && !identityText.includes('1,000,000');
    assert('10. Identity Query & 200K Context Window Verification', res10.status === 200 && d10.role === 'assistant' && hasCorrectContext, `Received text: ${identityText.slice(0, 100)}...`);

    // -------------------------------------------------------------
    // CHECK 11: Public Models Catalog (/v1/models)
    // -------------------------------------------------------------
    const res11 = await fetch(`${baseUrl}/v1/models`);
    const d11: any = await res11.json();
    const hasModels = Array.isArray(d11.data) && d11.data.length > 0;
    const modelIds = d11.data.map((m: any) => m.id);
    assert('11. Public Model Catalog (/v1/models)', res11.status === 200 && hasModels && modelIds.includes('claude-sonnet-5'));

    // -------------------------------------------------------------
    // CHECK 12: Key Status Inspection Endpoint (/api/key-status)
    // -------------------------------------------------------------
    const res12 = await fetch(`${baseUrl}/api/key-status`, {
      headers: { 'Authorization': `Bearer ${activeRawKey}` },
    });
    const d12: any = await res12.json();
    assert('12. Key Status Inspection (/api/key-status)', res12.status === 200 && d12.valid === true && typeof d12.plan === 'string' && d12.plan.length > 0);

  } finally {
    // Cleanup fixtures
    await prisma.apiKey.deleteMany({
      where: {
        id: { in: [activeKey.id, revokedKey.id, expiredKey.id, exhaustedKey.id, restrictedKey.id] },
      },
    });
    if (createdUser && devUser) {
      await prisma.user.delete({ where: { id: devUser.id } }).catch(() => {});
    }
    console.log(`\n================================================================`);
    console.log(`🏁 PRODUCTION READINESS SUITE FINISHED: ${passed}/${total} PASSED`);
    console.log(`================================================================\n`);
  }
}

runProductionReadinessSuite()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
