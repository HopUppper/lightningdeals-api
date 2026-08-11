import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanPresetData() {
  console.log('⚡ Cleaning all preset/fake data from production database...\n');

  // 1. Find and remove fake "Rahul Developer" user and all their data
  const fakeUsers = await prisma.user.findMany({
    where: {
      email: { in: ['dev@lightningdeals.ai'] },
    },
  });

  for (const user of fakeUsers) {
    console.log(`Found preset user: ${user.name} (${user.email})`);

    // Delete their API request logs
    const keys = await prisma.apiKey.findMany({ where: { userId: user.id } });
    for (const key of keys) {
      const reqCount = await prisma.apiRequest.deleteMany({ where: { apiKeyId: key.id } });
      const ledgerCount = await prisma.tokenLedger.deleteMany({ where: { apiKeyId: key.id } });
      console.log(`  Deleted ${reqCount.count} API requests and ${ledgerCount.count} ledger entries for key: ${key.displayKey}`);
    }

    // Delete their API keys
    const keyCount = await prisma.apiKey.deleteMany({ where: { userId: user.id } });
    console.log(`  Deleted ${keyCount.count} API keys for ${user.name}`);

    // Delete trial claims
    const trialCount = await prisma.trialClaim.deleteMany({ where: { userId: user.id } });
    console.log(`  Deleted ${trialCount.count} trial claims`);

    // Delete orders
    const orderCount = await prisma.order.deleteMany({ where: { userId: user.id } });
    console.log(`  Deleted ${orderCount.count} orders`);

    // Delete support tickets
    const ticketCount = await prisma.supportTicket.deleteMany({ where: { userId: user.id } });
    console.log(`  Deleted ${ticketCount.count} support tickets`);

    // Delete the user record itself
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`  ✅ Deleted preset user: ${user.name} (${user.email})\n`);
  }

  // 2. Remove any "Custom Test Provider" leftover records
  const testProviders = await prisma.vendorProvider.deleteMany({
    where: {
      OR: [
        { name: { contains: 'Custom Test Provider' } },
        { name: { contains: 'Audit' } },
        { name: { contains: 'Exhausted' } },
        { name: { contains: 'Limited' } },
        { name: { contains: 'Reconciliation' } },
      ],
    },
  });
  console.log(`Deleted ${testProviders.count} test vendor provider records`);

  // 3. Show remaining clean state
  const remainingUsers = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
  const remainingKeys = await prisma.apiKey.count();
  const remainingProviders = await prisma.vendorProvider.findMany({ select: { name: true, availableTokens: true, status: true } });

  console.log('\n══════════════════════════════════════');
  console.log('CLEAN DATABASE STATE:');
  console.log('══════════════════════════════════════');
  console.log(`Users: ${remainingUsers.length}`);
  for (const u of remainingUsers) {
    console.log(`  - ${u.name} (${u.email}) [${u.role}]`);
  }
  console.log(`API Keys: ${remainingKeys}`);
  console.log(`Vendor Providers: ${remainingProviders.length}`);
  for (const p of remainingProviders) {
    console.log(`  - ${p.name}: ${p.availableTokens.toString()} tokens, status: ${p.status}`);
  }
  console.log('══════════════════════════════════════\n');
}

cleanPresetData()
  .catch((e) => {
    console.error('Error cleaning preset data:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
