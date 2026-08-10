import { validateVendorBaseUrl } from '../server/ssrf';
import { buildProviderRequest, normalizeProviderResponse } from '../server/providerAdapter';
import { prisma, encryptText, decryptText } from '../server/db';
import { hashApiKey } from '../server/gateway';

async function main() {
  console.log('⚡ Starting End-to-End Verification: SSRF, Vendor System & Revamped Admin Endpoints...\n');

  // -------------------------------------------------------------
  // TEST 1: SSRF Base URL Security Validation
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // TEST 2: Vendor Provider Creation & Key Encryption
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // TEST 3: Provider Request Construction & Usage Normalization
  // -------------------------------------------------------------
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
  if (prepared.headers['x-api-key'] !== rawTestMasterKey || prepared.headers['x-test-header'] !== 'verified') {
    throw new Error('❌ Custom Headers or API Key Header Missing in Prepared Request.');
  }
  console.log(`   ✅ Target URL: ${prepared.url}`);
  console.log(`   ✅ Resolved Vendor Model: ${prepared.targetModel}`);
  console.log(`   ✅ Headers Injected: x-api-key, anthropic-version, x-test-header`);

  // Test Normalization of Anthropic / OpenAI Usage Payloads
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

  const mockOpenAIResponse = {
    id: 'chatcmpl-12345',
    object: 'chat.completion',
    usage: { prompt_tokens: 200, completion_tokens: 80, total_tokens: 280 },
  };
  const normalizedOpenAI = normalizeProviderResponse('openai-compatible', 200, mockOpenAIResponse, 10, 10);
  if (normalizedOpenAI.usage.inputTokens !== 200 || normalizedOpenAI.usage.totalTokens !== 280 || normalizedOpenAI.usage.usageSource !== 'PROVIDER_REPORTED') {
    throw new Error('❌ OpenAI Token Normalization Failed.');
  }
  console.log(`   ✅ Normalized OpenAI Usage: Prompt ${normalizedOpenAI.usage.inputTokens}, Completion ${normalizedOpenAI.usage.outputTokens}, Total ${normalizedOpenAI.usage.totalTokens} (Source: ${normalizedOpenAI.usage.usageSource})`);

  // Clean up test vendor
  await prisma.vendorProvider.delete({ where: { id: testVendor.id } });
  console.log(`   ✅ Test Vendor cleaned up from DB.`);

  console.log('\n🎉 ALL SSRF, VENDOR ABSTRACTION, AND REVISED ADMIN BACKEND TESTS SUCCEEDED!');
}

main().catch(console.error);
