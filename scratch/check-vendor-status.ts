import { prisma } from '../server/db';

async function checkVendorStatus() {
  const vendors = await prisma.vendorProvider.findMany();
  console.log('--- Current Vendor Providers in DB ---');
  for (const v of vendors) {
    console.log({
      id: v.id,
      name: v.name,
      status: v.status,
      availableTokens: v.availableTokens.toString(),
      purchasedTokens: v.purchasedTokens.toString(),
      consumedTokens: v.consumedTokens.toString(),
      warningThresholdTokens: v.warningThresholdTokens.toString(),
      criticalThresholdTokens: v.criticalThresholdTokens.toString(),
    });
  }
}

checkVendorStatus().catch(console.error);
