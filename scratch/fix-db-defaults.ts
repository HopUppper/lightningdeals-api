import { prisma } from '../server/db';

async function fixDbDefaults() {
  console.log('⚡ Auditing and resetting unconfigured VendorProvider records in database...\n');

  // Remove old test providers
  await prisma.vendorProvider.deleteMany({
    where: { name: { contains: 'Custom Test Provider' } },
  });

  const remaining = await prisma.vendorProvider.findMany();
  for (const p of remaining) {
    const hasKey = Boolean(p.masterApiKeyEncrypted && p.masterApiKeyEncrypted.length > 0);
    const ledgerCount = await prisma.masterTokenLedger.count({ where: { providerId: p.id } });

    if (!hasKey || ledgerCount === 0) {
      await prisma.vendorProvider.update({
        where: { id: p.id },
        data: {
          availableTokens: BigInt(0),
          purchasedTokens: BigInt(0),
          consumedTokens: BigInt(0),
          reservedTokens: BigInt(0),
          status: hasKey ? 'connected' : 'disabled',
        },
      });
      console.log(`Reset provider ${p.name}: availableTokens set to 0, status: ${hasKey ? 'connected' : 'disabled'}`);
    }
  }

  console.log('\n✅ Database reset & cleanup complete!');
}

fixDbDefaults().finally(() => prisma.$disconnect());

