import { prisma } from '../server/db';

async function testPersistence() {
  console.log('--- DB PERSISTENCE DIAGNOSTIC ---');

  // 1. Count users, keys, vendors before creation
  const userCountBefore = await prisma.user.count();
  const keyCountBefore = await prisma.apiKey.count();
  const vendorCountBefore = await prisma.vendorProvider.count();

  console.log(`Before: Users=${userCountBefore}, Keys=${keyCountBefore}, Vendors=${vendorCountBefore}`);

  // 2. Create test customer
  const testEmail = `test_persistence_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      name: 'Persistence Test Customer',
      email: testEmail,
      passwordHash: 'dummy',
      role: 'user',
    },
  });

  // 3. Create test key for customer
  const key = await prisma.apiKey.create({
    data: {
      userId: user.id,
      keyPrefix: 'ld_live_',
      keyHash: `hash_${Date.now()}`,
      displayKey: 'ld_live_test...1234',
      name: 'Persistence Test Key',
      type: 'production',
      purchasedTokens: BigInt(20000000),
      tokensRemaining: BigInt(20000000),
    },
  });

  console.log(`Created User ID=${user.id}, Key ID=${key.id}`);

  // 4. Query DB again to verify persistence
  const fetchedUser = await prisma.user.findUnique({ where: { id: user.id } });
  const fetchedKey = await prisma.apiKey.findUnique({ where: { id: key.id } });

  console.log(`Query User found: ${!!fetchedUser}, Key found: ${!!fetchedKey}`);

  // Clean up test records
  await prisma.apiKey.delete({ where: { id: key.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('--- TEST FINISHED CLEANLY ---');
}

testPersistence().catch(console.error);
