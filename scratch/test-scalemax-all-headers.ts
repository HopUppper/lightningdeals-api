import { prisma, decryptText } from '../server/db';

async function testAllScaleMaxCombos() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  if (!vendor) return;

  const key = decryptText(vendor.masterApiKeyEncrypted);
  console.log(`Deep-Testing ScaleMax (${vendor.baseUrl})...\n`);

  const models = [
    'claude-3-opus-20240229',
    'claude-opus-4.8',
    'claude-opus-4.7',
    'claude-opus-4.5',
    'opus',
    'claude-3-5-sonnet-20241022',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-haiku-20241022',
  ];

  for (const m of models) {
    try {
      const res = await fetch(`${vendor.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: m,
          max_tokens: 20,
          messages: [{ role: 'user', content: 'hello' }],
        }),
      });

      const bodyText = await res.text();
      console.log(`Model [${m.padEnd(26)}] -> Status ${res.status}: ${bodyText.slice(0, 120)}`);
    } catch (e: any) {
      console.log(`Model [${m.padEnd(26)}] -> Fetch Error: ${e.message}`);
    }
  }
}

testAllScaleMaxCombos().catch(console.error);
