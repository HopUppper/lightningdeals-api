import { prisma, decryptText } from '../server/db';

async function testScaleMaxModels() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  if (!vendor) return;

  const key = decryptText(vendor.masterApiKeyEncrypted);
  console.log(`Testing ScaleMax Model Names (${vendor.baseUrl})...`);

  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-latest',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
  ];

  for (const m of modelsToTest) {
    const res = await fetch(`${vendor.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: m,
        max_tokens: 100,
        stream: true,
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });
    console.log(`Model [${m}] -> Status: ${res.status}`);
    const text = await res.text();
    if (res.status !== 200) {
      console.log(`  Error:`, text);
    } else {
      console.log(`  Success (first 100 chars):`, text.slice(0, 100));
    }
  }
}

testScaleMaxModels().catch(console.error);
