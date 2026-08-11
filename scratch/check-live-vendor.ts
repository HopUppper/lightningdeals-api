import { prisma, decryptText } from '../server/db';

async function checkLiveVendor() {
  const vendors = await prisma.vendorProvider.findMany();
  console.log('--- LIVE SUPABASE VENDORS ---');
  console.log(`Total Vendors: ${vendors.length}`);
  
  for (const v of vendors) {
    const decKey = v.masterApiKeyEncrypted ? decryptText(v.masterApiKeyEncrypted) : '';
    const maskedKey = decKey ? (decKey.slice(0, 10) + '...' + decKey.slice(-4)) : 'NONE (EMPTY)';
    console.log(`- Vendor ID: ${v.id}`);
    console.log(`  Name: ${v.name}`);
    console.log(`  Base URL: ${v.baseUrl}`);
    console.log(`  Status: ${v.status}`);
    console.log(`  Is Primary: ${v.isPrimary}`);
    console.log(`  Master Key: ${maskedKey}`);
    console.log(`  Available Tokens: ${v.availableTokens.toString()}`);
  }
}

checkLiveVendor().catch(console.error);
