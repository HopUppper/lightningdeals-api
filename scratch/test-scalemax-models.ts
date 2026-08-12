import { prisma, decryptText } from '../server/db';

async function testModels() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { name: 'ScaleMax' } });
  if (!vendor) {
    console.error('ScaleMax vendor not found');
    return;
  }

  const masterKey = decryptText(vendor.masterApiKeyEncrypted);
  console.log(`Base URL: ${vendor.baseUrl}`);
  console.log(`Master Key Prefix: ${masterKey.slice(0, 15)}...`);

  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-opus-4-8',
    'claude-fable-5',
    'claude-sonnet-5',
    'claude-3-opus-20240229',
  ];

  for (const model of modelsToTest) {
    console.log(`\n--- Testing Model: ${model} ---`);
    const startTime = Date.now();
    try {
      const res = await fetch(`${vendor.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': masterKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      const duration = Date.now() - startTime;
      console.log(`Status: ${res.status} ${res.statusText} (${duration}ms)`);
      const text = await res.text();
      console.log(`Response: ${text.slice(0, 300)}`);
    } catch (err: any) {
      console.error(`Error:`, err.message);
    }
  }
}

testModels().finally(() => prisma.$disconnect());
