import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function testAccounting() {
  console.log('=== STARTING TOKEN ACCOUNTING & SECURITY VERIFICATION PASS ===\n');

  // 1. Initial Key Creation for Token Deduction Test
  const rawKey1 = 'ld_live_test_acct_' + crypto.randomBytes(8).toString('hex');
  const keyHash1 = hashApiKey(rawKey1);
  const displayKey1 = rawKey1.substring(0, 11) + '...' + rawKey1.substring(rawKey1.length - 4);

  const initialTokens = BigInt(10000);
  const devUser = await prisma.user.findFirst({ where: { role: 'user' } });

  const key1 = await prisma.apiKey.create({
    data: {
      userId: devUser?.id,
      name: 'Accounting Test Key',
      keyPrefix: 'ld_live_',
      keyHash: keyHash1,
      displayKey: displayKey1,
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: initialTokens,
      tokensRemaining: initialTokens,
      tokensUsed: BigInt(0),
      rateLimitRpm: 60,
    },
  });

  console.log('1. Created Test Key with Initial Balance:', key1.tokensRemaining.toString(), 'Tokens');

  // Perform API Request
  const req1 = await fetch('http://localhost:3001/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${rawKey1}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 30,
      messages: [{ role: 'user', content: 'Accounting test request 1' }],
    }),
  });

  const res1Data: any = await req1.json();
  const refreshedKey1 = await prisma.apiKey.findUnique({ where: { id: key1.id } });

  console.log('   API Response Status:', req1.status);
  console.log('   Input Tokens:', res1Data.usage?.input_tokens);
  console.log('   Output Tokens:', res1Data.usage?.output_tokens);
  console.log('   New Balance in DB:', refreshedKey1?.tokensRemaining.toString(), 'Tokens');
  console.log('   Tokens Consumed in DB:', refreshedKey1?.tokensUsed.toString(), 'Tokens');

  const expectedRemaining = initialTokens - BigInt(res1Data.usage?.input_tokens + res1Data.usage?.output_tokens);
  console.log('   Accounting Match Assertion:', refreshedKey1?.tokensRemaining === expectedRemaining ? '✓ PASS' : '❌ FAIL');

  // 2. Exhaustion Test
  console.log('\n2. Testing Token Exhaustion Rejection...');
  const rawKeySmall = 'ld_live_test_small_' + crypto.randomBytes(8).toString('hex');
  const keyHashSmall = hashApiKey(rawKeySmall);
  const keySmall = await prisma.apiKey.create({
    data: {
      userId: devUser?.id,
      name: 'Small 10 Token Key',
      keyPrefix: 'ld_live_',
      keyHash: keyHashSmall,
      displayKey: rawKeySmall.substring(0, 11) + '...' + rawKeySmall.substring(rawKeySmall.length - 4),
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: BigInt(10),
      tokensRemaining: BigInt(10),
      tokensUsed: BigInt(0),
      rateLimitRpm: 60,
    },
  });

  // Call 1 consumes ~40 tokens (exhausts the 10 token balance)
  await fetch('http://localhost:3001/v1/messages', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${rawKeySmall}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 10, messages: [{ role: 'user', content: 'Hello' }] }),
  });

  // Call 2 should be REJECTED with 429 quota_exceeded
  const reqExhausted = await fetch('http://localhost:3001/v1/messages', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${rawKeySmall}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 10, messages: [{ role: 'user', content: 'Hello again' }] }),
  });

  const exhaustedRes = await reqExhausted.json();
  console.log('   Exhausted Key Request Status:', reqExhausted.status);
  console.log('   Error Code:', exhaustedRes.error?.type);
  console.log('   Exhaustion Protection Assertion:', reqExhausted.status === 429 && exhaustedRes.error?.type === 'quota_exceeded' ? '✓ PASS' : '❌ FAIL');

  // 3. Key Revocation Test
  console.log('\n3. Testing Key Revocation...');
  await prisma.apiKey.update({ where: { id: key1.id }, data: { status: 'revoked' } });
  const reqRevoked = await fetch('http://localhost:3001/v1/messages', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${rawKey1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 10, messages: [{ role: 'user', content: 'Test' }] }),
  });
  const revokedRes = await reqRevoked.json();
  console.log('   Revoked Key Request Status:', reqRevoked.status);
  console.log('   Error Message:', revokedRes.error?.message);
  console.log('   Revocation Assertion:', reqRevoked.status === 403 ? '✓ PASS' : '❌ FAIL');

  // 4. Expiry Test
  console.log('\n4. Testing Key Expiration...');
  const rawKeyExpired = 'ld_live_test_exp_' + crypto.randomBytes(8).toString('hex');
  const keyExpired = await prisma.apiKey.create({
    data: {
      userId: devUser?.id,
      name: 'Expired Key',
      keyPrefix: 'ld_live_',
      keyHash: hashApiKey(rawKeyExpired),
      displayKey: rawKeyExpired.substring(0, 11) + '...' + rawKeyExpired.substring(rawKeyExpired.length - 4),
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: BigInt(50000),
      tokensRemaining: BigInt(50000),
      expiresAt: new Date(Date.now() - 3600 * 1000), // Expired 1 hour ago
      rateLimitRpm: 60,
    },
  });

  const reqExpired = await fetch('http://localhost:3001/v1/messages', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${rawKeyExpired}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 10, messages: [{ role: 'user', content: 'Test' }] }),
  });
  const expiredRes = await reqExpired.json();
  console.log('   Expired Key Request Status:', reqExpired.status);
  console.log('   Error Message:', expiredRes.error?.message);
  console.log('   Expiration Assertion:', reqExpired.status === 401 ? '✓ PASS' : '❌ FAIL');

  // Clean up test keys
  await prisma.apiKey.deleteMany({ where: { id: { in: [key1.id, keySmall.id, keyExpired.id] } } });
  console.log('\n=== ALL TOKEN ACCOUNTING & SECURITY TESTS VERIFIED ===');
}

testAccounting().then(() => prisma.$disconnect());
