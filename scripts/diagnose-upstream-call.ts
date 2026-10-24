import { prisma, decryptText } from '../server/db';
import { buildProviderRequest } from '../server/providerAdapter';

async function test() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  console.log('Vendor:', vendor?.name, vendor?.baseUrl);
  if (!vendor || !vendor.masterApiKeyEncrypted) {
    console.error('No primary vendor found!');
    return;
  }
  const masterKey = decryptText(vendor.masterApiKeyEncrypted);
  console.log('Key length:', masterKey?.length);
  const prep = buildProviderRequest(vendor, masterKey, 'claude-sonnet-5.5', {
    messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
    max_tokens: 50,
  });
  console.log('URL:', prep.url);
  const startTime = Date.now();
  const res = await fetch(prep.url, { method: 'POST', headers: prep.headers, body: JSON.stringify(prep.body) });
  const elapsed = Date.now() - startTime;
  console.log('Status:', res.status, 'Elapsed:', elapsed, 'ms');
  const data = await res.json();
  console.log('Response:', JSON.stringify(data).slice(0, 300));
}

test().catch(console.error);
