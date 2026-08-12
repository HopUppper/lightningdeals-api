import { prisma, decryptText } from '../server/db';

async function testVendorConnection() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { name: 'ScaleMax' } });
  if (!vendor) {
    console.error('ScaleMax vendor not found');
    return;
  }

  const masterKey = decryptText(vendor.masterApiKeyEncrypted);
  console.log(`Testing vendor ID: ${vendor.id}`);
  console.log(`Base URL: ${vendor.baseUrl}`);
  console.log(`Master Key Prefix: ${masterKey ? masterKey.slice(0, 12) : 'NONE'}...`);

  try {
    const res = await fetch(`${vendor.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': masterKey || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Ping' }],
      }),
    });

    console.log(`HTTP Status: ${res.status}`);
    const data = await res.text();
    console.log(`Response Body: ${data.slice(0, 300)}`);

    if (res.ok) {
      await prisma.vendorProvider.update({
        where: { id: vendor.id },
        data: { status: 'healthy' },
      });
      console.log('✅ Updated status to "healthy" in database!');
    }
  } catch (err: any) {
    console.error(`Connection Error:`, err);
  }
}

testVendorConnection().catch(console.error);
