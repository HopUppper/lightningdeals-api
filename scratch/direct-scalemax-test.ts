import { prisma, decryptText } from '../server/db';

async function directTest() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
  if (!vendor) return;

  const key = decryptText(vendor.masterApiKeyEncrypted);

  console.log('============================================================');
  console.log('DIRECT REQUEST TO SCALEMAX (0% CODE FROM YOUR WEBSITE INVOLVED)');
  console.log('============================================================');
  console.log(`Target URL: ${vendor.baseUrl}/v1/messages`);
  console.log(`Master API Key: ${key.slice(0, 10)}...${key.slice(-4)}`);
  console.log('\nSending HTTP POST request directly from Node.js net socket...');

  const startTime = Date.now();
  const res = await fetch(`${vendor.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hello' }],
    }),
  });

  const duration = Date.now() - startTime;
  const bodyText = await res.text();

  console.log('\n--- RAW RESPONSE DIRECT FROM SCALEMAX SERVER ---');
  console.log(`HTTP Status Code : ${res.status} ${res.statusText}`);
  console.log(`Round-trip Latency: ${duration} ms`);
  console.log(`Response Headers  :`, Object.fromEntries(res.headers.entries()));
  console.log(`Raw Response Body :`, bodyText);
  console.log('============================================================');
}

directTest().catch(console.error);
