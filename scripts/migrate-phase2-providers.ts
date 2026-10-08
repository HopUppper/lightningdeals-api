import { prisma } from '../server/db';

async function migratePhase2() {
  console.log('=================================================================');
  console.log('⚡ LIGHTNINGAPI — PHASE 2: PROVIDER ASSOCIATION MIGRATION');
  console.log('=================================================================\n');

  try {
    // 1. Add nullable providerId column to ApiKey with ON DELETE RESTRICT
    console.log('1. Applying non-destructive DDL migration...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "providerId" TEXT REFERENCES "VendorProvider"("id") ON DELETE RESTRICT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ApiKey_providerId_idx" ON "ApiKey"("providerId");
    `);
    console.log('✓ ApiKey.providerId column and index created/verified.');

    // 2. Locate ScaleMax provider
    console.log('\n2. Resolving ScaleMax VendorProvider...');
    const scaleMax = await prisma.vendorProvider.findFirst({
      where: { name: 'ScaleMax' },
    });

    if (!scaleMax) {
      throw new Error('FATAL: ScaleMax vendor provider record not found in database!');
    }
    console.log(`✓ Found ScaleMax provider: ID = ${scaleMax.id} | Status = ${scaleMax.status}`);

    // 3. Count keys before backfill
    const totalKeysBefore = await prisma.apiKey.count();
    const unassociatedBefore = await prisma.apiKey.count({
      where: { providerId: null },
    });
    console.log(`\n3. Pre-migration state:`);
    console.log(`   - Total ApiKeys: ${totalKeysBefore}`);
    console.log(`   - Keys with NULL providerId: ${unassociatedBefore}`);

    // 4. Backfill all existing keys to ScaleMax
    console.log('\n4. Backfilling existing keys to ScaleMax...');
    const updateResult = await prisma.apiKey.updateMany({
      where: { providerId: null },
      data: { providerId: scaleMax.id },
    });
    console.log(`✓ Successfully associated ${updateResult.count} keys with ScaleMax.`);

    // 5. Ensure SystemSetting default_provider_id is configured
    console.log('\n5. Setting SystemSetting default_provider_id...');
    const defaultSetting = await prisma.systemSetting.upsert({
      where: { key: 'default_provider_id' },
      update: { value: scaleMax.id },
      create: {
        key: 'default_provider_id',
        value: scaleMax.id,
      },
    });
    console.log(`✓ default_provider_id authoritative setting configured: ${defaultSetting.value}`);

    // 6. Comprehensive Verification
    console.log('\n=================================================================');
    console.log('🔍 PHASE 2 VERIFICATION AUDIT');
    console.log('=================================================================');

    const totalApiKeys = await prisma.apiKey.count();
    const keysWithProvider = await prisma.apiKey.count({
      where: { providerId: { not: null } },
    });
    const keysWithoutProvider = await prisma.apiKey.count({
      where: { providerId: null },
    });
    const scaleMaxKeys = await prisma.apiKey.count({
      where: { providerId: scaleMax.id },
    });
    const opusMaxKeys = await prisma.apiKey.count({
      where: { provider: { name: 'Opus Max' } },
    });

    // Check for orphaned keys (providerId set to non-existent vendor)
    const allProviders = await prisma.vendorProvider.findMany({ select: { id: true, name: true } });
    const providerIds = new Set(allProviders.map(p => p.id));
    const allKeys = await prisma.apiKey.findMany({ select: { id: true, providerId: true } });
    const orphanedKeys = allKeys.filter(k => k.providerId && !providerIds.has(k.providerId)).length;

    // Check historical ApiRequest providerId integrity
    const totalApiRequests = await prisma.apiRequest.count();
    const requestsWithScaleMax = await prisma.apiRequest.count({
      where: { providerId: scaleMax.id },
    });
    const requestsWithNullProvider = await prisma.apiRequest.count({
      where: { providerId: null },
    });

    console.log(`Total ApiKeys                   : ${totalApiKeys}`);
    console.log(`Keys with providerId            : ${keysWithProvider}`);
    console.log(`Keys without providerId (NULL)  : ${keysWithoutProvider}`);
    console.log(`ScaleMax-associated keys        : ${scaleMaxKeys}`);
    console.log(`Opus Max-associated keys        : ${opusMaxKeys}`);
    console.log(`Orphaned keys                   : ${orphanedKeys}`);
    console.log(`Total VendorProviders           : ${allProviders.length}`);
    for (const p of allProviders) {
      console.log(`  - [${p.id}] ${p.name}`);
    }
    console.log(`\nHistorical ApiRequest Integrity :`);
    console.log(`  - Total ApiRequests           : ${totalApiRequests}`);
    console.log(`  - With ScaleMax providerId    : ${requestsWithScaleMax}`);
    console.log(`  - With NULL providerId        : ${requestsWithNullProvider}`);

    if (keysWithoutProvider === 0 && orphanedKeys === 0 && scaleMaxKeys === totalApiKeys) {
      console.log('\n✅ PHASE 2 MIGRATION & VERIFICATION SUCCESSFUL (100% COMPLIANCE)');
    } else {
      console.error('\n❌ WARNING: Migration anomaly detected!');
    }
    console.log('=================================================================\n');

  } catch (err: any) {
    console.error('Phase 2 Migration Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

migratePhase2();
