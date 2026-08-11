import { prisma, decryptText } from '../server/db';

async function testScaleMaxOpus() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  if (!vendor) return console.log('No vendor found');

  const key = decryptText(vendor.masterApiKeyEncrypted);
  console.log(`Testing ScaleMax (${vendor.baseUrl}) with key ${key.slice(0, 12)}...`);

  // Test 1: claude-3-5-sonnet-20241022
  console.log('\n--- TEST 1: claude-3-5-sonnet-20241022 ---');
  const res1 = await fetch(`${vendor.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  });
  console.log(`Sonnet Status: ${res1.status}`);
  console.log(`Sonnet Response:`, await res1.text());

  // Test 2: claude-3-opus-20240229
  console.log('\n--- TEST 2: claude-3-opus-20240229 ---');
  const res2 = await fetch(`${vendor.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  });
  console.log(`Opus Status: ${res2.status}`);
  console.log(`Opus Response:`, await res2.text());
}

testScaleMaxOpus().catch(console.error);
