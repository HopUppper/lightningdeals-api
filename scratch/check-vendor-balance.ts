import { prisma, decryptText } from '../server/db';

async function checkVendorBalance() {
  console.log('⚡ Querying ScaleMax vendor API for master key token balance...\n');

  // Find ScaleMax vendor specifically
  const vendors = await prisma.vendorProvider.findMany();
  console.log(`Found ${vendors.length} vendors:`);
  for (const v of vendors) {
    const hasKey = Boolean(v.masterApiKeyEncrypted && v.masterApiKeyEncrypted.length > 10);
    console.log(`  - ${v.name} | ${v.baseUrl} | hasKey: ${hasKey} | isPrimary: ${v.isPrimary} | status: ${v.status}`);
  }

  const vendor = vendors.find(v => v.baseUrl.includes('scalemax')) || vendors.find(v => v.masterApiKeyEncrypted && v.masterApiKeyEncrypted.length > 10);

  if (!vendor) {
    console.error('\nNo ScaleMax vendor found. Available vendors listed above.');
    return;
  }

  console.log(`\nUsing vendor: ${vendor.name} (${vendor.baseUrl})`);

  const masterKey = decryptText(vendor.masterApiKeyEncrypted);
  if (!masterKey) {
    console.error('Master key decryption failed.');
    return;
  }
  console.log(`Master Key: ${masterKey.substring(0, 12)}...${masterKey.substring(masterKey.length - 4)}\n`);

  const baseUrl = vendor.baseUrl.replace(/\/$/, '');

  // Try common balance/credits endpoints
  const endpoints = [
    '/v1/balance',
    '/v1/credits',
    '/v1/usage',
    '/v1/account',
    '/v1/account/balance',
    '/api/balance',
    '/api/credits',
    '/balance',
    '/credits',
    '/v1/billing/credits',
    '/v1/key/balance',
    '/v1/key/info',
    '/v1/info',
  ];

  for (const path of endpoints) {
    const url = `${baseUrl}${path}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${masterKey}`,
          'x-api-key': masterKey,
          'Content-Type': 'application/json',
        },
      });

      const status = res.status;
      if (status === 404 || status === 405) {
        console.log(`  ${path} → ${status} (not found)`);
        continue;
      }

      const body = await res.text();
      console.log(`  ${path} → ${status}`);
      try {
        const json = JSON.parse(body);
        console.log(`    ${JSON.stringify(json, null, 2)}`);
      } catch {
        console.log(`    ${body.substring(0, 300)}`);
      }
    } catch (err: any) {
      console.log(`  ${path} → ERROR: ${err.message}`);
    }
  }

  // Test a minimal real request to see usage headers
  console.log('\n--- Testing /v1/messages for usage/balance response headers ---');
  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${masterKey}`,
        'x-api-key': masterKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Say hi' }],
      }),
    });

    console.log(`  /v1/messages → ${res.status}`);

    // Print ALL response headers (balance might be in headers)
    console.log('  Response Headers:');
    res.headers.forEach((v, k) => {
      console.log(`    ${k}: ${v}`);
    });

    const body = await res.text();
    try {
      const json = JSON.parse(body);
      console.log(`  Response: ${JSON.stringify(json, null, 2)}`);
    } catch {
      console.log(`  Response: ${body.substring(0, 500)}`);
    }
  } catch (err: any) {
    console.log(`  /v1/messages → ERROR: ${err.message}`);
  }
}

checkVendorBalance().finally(() => prisma.$disconnect());
