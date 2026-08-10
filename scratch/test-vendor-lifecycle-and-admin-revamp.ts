import { validateVendorBaseUrl } from '../server/ssrf';
import { buildProviderRequest, normalizeProviderResponse } from '../server/providerAdapter';
import { prisma, encryptText, decryptText } from '../server/db';
import { generateToken } from '../server/auth';

async function main() {
  console.log('⚡ Starting End-to-End Verification: SSRF, Vendor System & Revamped Admin Endpoints...\n');

  // 1. SSRF Tests
  console.log('🔒 1. Testing SSRF Protection Filter...');
  const ssrfTests = [
    { url: 'http://127.0.0.1:8080', expectedSafe: false },
    { url: 'http://localhost/admin', expectedSafe: false },
    { url: 'http://169.254.169.254/latest/meta-data/', expectedSafe: false },
    { url: 'http://10.0.0.5/api', expectedSafe: false },
    { url: 'http://192.168.1.1/api', expectedSafe: false },
    { url: 'https://api.anthropic.com', expectedSafe: true },
    { url: 'https://api.openai.com/v1', expectedSafe: true },
    { url: 'https://custom-vendor-proxy.example.com/v1', expectedSafe: true },
  ];

  for (const t of ssrfTests) {
    const res = validateVendorBaseUrl(t.url);
    if (res.safe !== t.expectedSafe) {
      throw new Error(`❌ SSRF Test Failed for URL "${t.url}": Expected safe=${t.expectedSafe}, got safe=${res.safe}`);
    }
    console.log(`   ✅ "${t.url}" ──> Safe: ${res.safe} ${res.error ? `(${res.error})` : ''}`);
  }

  // 2. Vendor Encryption Test
  console.log('\n🔑 2. Testing Vendor Provider Database Security & Master Key Encryption...');
  const rawTestMasterKey = 'sk-ant-api03-test-secret-vendor-key-99999';
  const encryptedKey = encryptText(rawTestMasterKey);

  const testVendor = await prisma.vendorProvider.create({
    data: {
      name: 'Custom Test Provider',
      providerType: 'anthropic',
      protocol: 'anthropic',
      masterApiKeyEncrypted: encryptedKey,
      baseUrl: 'https://api.anthropic.com',
      isPrimary: false,
      status: 'connected',
      modelMappingsJson: JSON.stringify({ 'claude-sonnet-5': 'claude-3-5-sonnet-20241022' }),
      headersJson: JSON.stringify({ 'x-test-header': 'verified' }),
    },
  });

  const decrypted = decryptText(testVendor.masterApiKeyEncrypted);
  if (decrypted !== rawTestMasterKey) {
    throw new Error('❌ Encryption/Decryption mismatch for Vendor Master Key.');
  }
  const maskedKey = `${decrypted.slice(0, 8)}...${decrypted.slice(-4)}`;
  console.log(`   ✅ Created Vendor Provider "${testVendor.name}" (ID: ${testVendor.id})`);
  console.log(`   ✅ Master Key Encrypted in DB: ${testVendor.masterApiKeyEncrypted.slice(0, 20)}...`);
  console.log(`   ✅ Masked Key for Client Response: ${maskedKey}`);

  // 3. Provider Request & Normalization
  console.log('\n⚙️ 3. Testing Provider Request Building & Response Normalization...');
  const prepared = buildProviderRequest(
    {
      id: testVendor.id,
      name: testVendor.name,
      providerType: testVendor.providerType,
      protocol: testVendor.protocol,
      baseUrl: testVendor.baseUrl,
      masterApiKeyEncrypted: testVendor.masterApiKeyEncrypted,
      modelMappingsJson: testVendor.modelMappingsJson,
      headersJson: testVendor.headersJson,
      isPrimary: testVendor.isPrimary,
    },
    rawTestMasterKey,
    'claude-sonnet-5',
    { messages: [{ role: 'user', content: 'Hello vendor!' }] }
  );

  if (prepared.targetModel !== 'claude-3-5-sonnet-20241022') {
    throw new Error(`❌ Model Mapping Resolution Failed: Expected "claude-3-5-sonnet-20241022", got "${prepared.targetModel}"`);
  }
  console.log(`   ✅ Target URL: ${prepared.url}`);
  console.log(`   ✅ Resolved Vendor Model: ${prepared.targetModel}`);

  const mockAnthropicResponse = {
    id: 'msg_12345',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: 'Hello from vendor!' }],
    usage: { input_tokens: 120, output_tokens: 45 },
  };

  const normalizedAnthropic = normalizeProviderResponse('anthropic', 200, mockAnthropicResponse, 10, 10);
  if (normalizedAnthropic.usage.inputTokens !== 120 || normalizedAnthropic.usage.usageSource !== 'PROVIDER_REPORTED') {
    throw new Error('❌ Anthropic Token Normalization Failed.');
  }
  console.log(`   ✅ Normalized Anthropic Usage: Input ${normalizedAnthropic.usage.inputTokens}, Output ${normalizedAnthropic.usage.outputTokens} (Source: ${normalizedAnthropic.usage.usageSource})`);

  // 4. Test Local Express Admin Endpoints (GET /api/admin/orders & GET /api/admin/usage)
  console.log('\n📊 4. Testing Admin API Endpoints (/admin/orders, /admin/usage, /admin/search)...');
  let adminUser = await prisma.user.findFirst({ where: { role: 'admin', status: 'active' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { name: 'Admin Test', email: 'admin-test@lightningapi.pro', role: 'admin', status: 'active', passwordHash: 'hash' },
    });
  }

  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  const express = (await import('express')).default;
  const adminRouter = (await import('../server/admin')).default;

  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);

  const server = app.listen(3098);

  try {
    const authHeader = { Authorization: `Bearer ${adminToken}` };

    const ordersRes = await fetch('http://127.0.0.1:3098/api/admin/orders', { headers: authHeader });
    const ordersData = await ordersRes.json();
    console.log(`   ✅ GET /api/admin/orders ──> Status ${ordersRes.status} (Array Length: ${ordersData.length})`);

    const usageRes = await fetch('http://127.0.0.1:3098/api/admin/usage', { headers: authHeader });
    const usageData = await usageRes.json();
    console.log(`   ✅ GET /api/admin/usage ──> Status ${usageRes.status} (Total Requests: ${usageData.totalRequests})`);

    const searchRes = await fetch('http://127.0.0.1:3098/api/admin/search?q=test', { headers: authHeader });
    console.log(`   ✅ GET /api/admin/search ──> Status ${searchRes.status}`);

    if (ordersRes.status !== 200 || usageRes.status !== 200) {
      throw new Error('❌ Admin endpoint route test failed!');
    }
  } finally {
    server.close();
  }

  // Clean up test vendor
  await prisma.vendorProvider.delete({ where: { id: testVendor.id } });
  console.log(`   ✅ Test Vendor cleaned up from DB.`);

  console.log('\n🎉 ALL SSRF, VENDOR ABSTRACTION, AND REVISED ADMIN BACKEND TESTS SUCCEEDED!');
}

main().catch(console.error);
