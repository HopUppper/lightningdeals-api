import { prisma, decryptText } from '../server/db';

async function checkVendorKey() {
  const vendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } }) || await prisma.vendorProvider.findFirst();
  if (!vendor) {
    console.log('❌ No vendor provider found in DB!');
    return;
  }

  const decKey = decryptText(vendor.masterApiKeyEncrypted);
  console.log(`Vendor Name: ${vendor.name}`);
  console.log(`Base URL: ${vendor.baseUrl}`);
  console.log(`Status in DB: ${vendor.status}`);
  console.log(`Available Tokens: ${vendor.availableTokens.toString()}`);
  console.log(`Decrypted Master Key Length: ${decKey ? decKey.length : 0}`);
  console.log(`Decrypted Master Key Prefix: ${decKey ? decKey.slice(0, 15) : 'NONE'}`);
}

checkVendorKey().finally(() => prisma.$disconnect());
