import { prisma } from '../server/db';

async function fixVendorStatus() {
  console.log('⚡ Updating VendorProvider status in database...');
  
  const updated = await prisma.vendorProvider.updateMany({
    where: {
      availableTokens: { gt: 0 },
    },
    data: {
      status: 'healthy',
    },
  });

  console.log(`Updated ${updated.count} vendor providers with available balance to "healthy".`);

  const vendors = await prisma.vendorProvider.findMany();
  for (const v of vendors) {
    console.log(`- Vendor ${v.name}: status="${v.status}", availableTokens=${v.availableTokens.toString()}`);
  }
}

fixVendorStatus().finally(() => prisma.$disconnect());
