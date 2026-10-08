import { prisma } from '../server/db';
import {
  getDefaultProviderId,
  resolveProviderForNewKey,
  determineKeyPrefix,
  generateProviderApiKey,
  generateRotatedKeyMaterial,
} from '../server/keyService';

async function runPhase3Tests() {
  console.log('=================================================================');
  console.log('⚡ LIGHTNINGAPI — PHASE 3 KEY GENERATION & PROVIDER ASSIGNMENT TESTS');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Record initial database baseline
  const initialKeyCount = await prisma.apiKey.count();
  const initialReqCount = await prisma.apiRequest.count();
  const initialLedgerCount = await prisma.masterTokenLedger.count();
  console.log(`Pre-test Database Baseline:`);
  console.log(`  - Total ApiKeys: ${initialKeyCount}`);
  console.log(`  - Total ApiRequests: ${initialReqCount}`);
  console.log(`  - Total MasterTokenLedger: ${initialLedgerCount}\n`);

  const createdTestKeyIds: string[] = [];
  let testOpusProviderId: string | null = null;
  let originalDefaultSetting: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Default Provider Resolution (ScaleMax)
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Default Provider Resolution ---');
    const defaultSetting = await prisma.systemSetting.findUnique({
      where: { key: 'default_provider_id' },
    });
    originalDefaultSetting = defaultSetting?.value || null;

    const scaleMax = await prisma.vendorProvider.findFirst({
      where: { name: 'ScaleMax' },
    });
    assert(Boolean(scaleMax), 'ScaleMax provider exists in database');
    assert(Boolean(originalDefaultSetting), 'SystemSetting default_provider_id is configured');
    assert(originalDefaultSetting === scaleMax?.id, 'default_provider_id points to ScaleMax');

    const resolvedDefaultId = await getDefaultProviderId();
    assert(resolvedDefaultId === scaleMax?.id, 'getDefaultProviderId() resolves to ScaleMax');

    // -------------------------------------------------------------------------
    // TEST 2: ScaleMax Key Generation (Production & Trial)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: ScaleMax Key Generation (ld_live_ / ld_trial_) ---');
    const scaleMaxLive = await generateProviderApiKey({ isTrial: false });
    assert(scaleMaxLive.providerId === scaleMax?.id, 'ScaleMax live key bound to ScaleMax providerId');
    assert(scaleMaxLive.keyPrefix === 'ld_live_', 'ScaleMax live key uses ld_live_ prefix');
    assert(scaleMaxLive.rawKeySecret.startsWith('ld_live_'), 'Raw secret starts with ld_live_');
    assert(scaleMaxLive.rawKeySecret.length === 'ld_live_'.length + 48, 'Raw secret has 48 hex chars entropy (192 bits)');
    assert(scaleMaxLive.displayKey.startsWith('ld_live_'), 'Display key starts with ld_live_');

    const scaleMaxTrial = await generateProviderApiKey({ isTrial: true });
    assert(scaleMaxTrial.providerId === scaleMax?.id, 'ScaleMax trial key bound to ScaleMax providerId');
    assert(scaleMaxTrial.keyPrefix === 'ld_trial_', 'ScaleMax trial key uses ld_trial_ prefix');
    assert(scaleMaxTrial.rawKeySecret.startsWith('ld_trial_'), 'Raw secret starts with ld_trial_');

    // -------------------------------------------------------------------------
    // TEST 3: Opus Max Provider Setup & Key Generation (sk_live_ / sk_trial_)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Opus Max Key Generation (sk_live_ / sk_trial_) ---');
    // Create an isolated test Opus Max vendor provider
    const testOpus = await prisma.vendorProvider.create({
      data: {
        name: 'Opus Max (Test Provider)',
        providerType: 'anthropic',
        protocol: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        status: 'connected',
        isPrimary: false,
      },
    });
    testOpusProviderId = testOpus.id;
    console.log(`  (Created test Opus Max provider: ${testOpus.id})`);

    const opusLive = await generateProviderApiKey({ providerId: testOpus.id, isTrial: false });
    assert(opusLive.providerId === testOpus.id, 'Opus Max live key bound to Opus providerId');
    assert(opusLive.keyPrefix === 'sk_live_', 'Opus Max live key uses sk_live_ prefix');
    assert(opusLive.rawKeySecret.startsWith('sk_live_'), 'Opus raw secret starts with sk_live_');
    assert(opusLive.rawKeySecret.length === 'sk_live_'.length + 48, 'Opus raw secret has 48 hex chars entropy');
    assert(opusLive.displayKey.startsWith('sk_live_'), 'Opus display key starts with sk_live_');

    const opusTrial = await generateProviderApiKey({ providerId: testOpus.id, isTrial: true });
    assert(opusTrial.providerId === testOpus.id, 'Opus Max trial key bound to Opus providerId');
    assert(opusTrial.keyPrefix === 'sk_trial_', 'Opus Max trial key uses sk_trial_ prefix');
    assert(opusTrial.rawKeySecret.startsWith('sk_trial_'), 'Opus trial raw secret starts with sk_trial_');

    // -------------------------------------------------------------------------
    // TEST 4: Explicit Admin Selection Overrides Default
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Explicit Admin Provider Selection ---');
    // System default is ScaleMax, but admin explicitly requests Opus Max
    const explicitOpus = await generateProviderApiKey({ providerId: testOpus.id, isTrial: false });
    assert(explicitOpus.providerId === testOpus.id, 'Explicit Opus Max request overrides ScaleMax default');
    assert(explicitOpus.keyPrefix === 'sk_live_', 'Explicit Opus Max generates sk_live_');

    // Explicitly request ScaleMax
    const explicitScaleMax = await generateProviderApiKey({ providerId: scaleMax?.id, isTrial: false });
    assert(explicitScaleMax.providerId === scaleMax?.id, 'Explicit ScaleMax request succeeds');
    assert(explicitScaleMax.keyPrefix === 'ld_live_', 'Explicit ScaleMax generates ld_live_');

    // -------------------------------------------------------------------------
    // TEST 5: Switching Default Provider & Verification That Existing Keys Are NOT Migrated
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Switching Default Provider Does NOT Migrate Existing Keys ---');
    // Save snapshot of all existing key providerIds
    const existingKeysSnapshot = await prisma.apiKey.findMany({
      select: { id: true, providerId: true },
    });

    // Temporarily switch default to test Opus Max
    await prisma.systemSetting.update({
      where: { key: 'default_provider_id' },
      data: { value: testOpus.id },
    });

    // Verify resolveProviderForNewKey now picks testOpus as default
    const newDefaultKey = await generateProviderApiKey({ isTrial: false });
    assert(newDefaultKey.providerId === testOpus.id, 'New key generated under new default uses Opus Max');
    assert(newDefaultKey.keyPrefix === 'sk_live_', 'New key under new default has sk_live_ prefix');

    // Verify existing keys are completely unaffected
    const existingKeysAfterSwitch = await prisma.apiKey.findMany({
      select: { id: true, providerId: true },
    });
    let anyChanged = false;
    for (const snap of existingKeysSnapshot) {
      const current = existingKeysAfterSwitch.find((k) => k.id === snap.id);
      if (current?.providerId !== snap.providerId) {
        anyChanged = true;
        break;
      }
    }
    assert(!anyChanged, 'Zero existing keys were altered when default provider changed');

    // Switch default BACK to ScaleMax
    if (scaleMax) {
      await prisma.systemSetting.update({
        where: { key: 'default_provider_id' },
        data: { value: scaleMax.id },
      });
      console.log('  (Restored default_provider_id to ScaleMax)');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Safety Validations (Invalid & Disabled Providers)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Validation & Error Handling ---');
    let nonExistentRejected = false;
    try {
      await generateProviderApiKey({ providerId: '00000000-0000-0000-0000-000000000000' });
    } catch (e: any) {
      nonExistentRejected = true;
      assert(e.message.includes('does not exist'), 'Non-existent provider throws descriptive error');
    }
    assert(nonExistentRejected, 'Non-existent providerId was rejected safely');

    // Disable test provider and try to request it
    await prisma.vendorProvider.update({
      where: { id: testOpus.id },
      data: { status: 'disabled' },
    });

    let disabledRejected = false;
    try {
      await generateProviderApiKey({ providerId: testOpus.id });
    } catch (e: any) {
      disabledRejected = true;
      assert(e.message.includes('disabled'), 'Disabled provider throws descriptive error');
    }
    assert(disabledRejected, 'Disabled providerId was rejected safely');

    // -------------------------------------------------------------------------
    // TEST 7: Database Persistence & Key Creation Paths
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Database Persistence with Non-Null ProviderId ---');
    // Test creating an actual ApiKey in DB using the key material
    const testKeyMaterial = await generateProviderApiKey({ isTrial: false });
    const createdKey = await prisma.apiKey.create({
      data: {
        providerId: testKeyMaterial.providerId,
        keyPrefix: testKeyMaterial.keyPrefix,
        keyHash: testKeyMaterial.keyHash,
        displayKey: testKeyMaterial.displayKey,
        keyEncrypted: 'test-encrypted',
        name: 'Phase 3 Verification Key',
        type: 'production',
        status: 'active',
        purchasedTokens: BigInt(20000000),
        tokensUsed: BigInt(0),
        tokensRemaining: BigInt(20000000),
        rateLimitRpm: 60,
      },
    });
    createdTestKeyIds.push(createdKey.id);

    assert(Boolean(createdKey.id), 'Test key successfully persisted to DB');
    assert(createdKey.providerId === scaleMax?.id, 'Persisted key has correct non-null providerId');
    assert(createdKey.keyPrefix === 'ld_live_', 'Persisted key has ld_live_ prefix');

    // -------------------------------------------------------------------------
    // TEST 8: Key Rotation Material Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Key Rotation Material Preservation ---');
    // Rotate ScaleMax key
    const rotatedScaleMax = await generateRotatedKeyMaterial({
      id: createdKey.id,
      providerId: createdKey.providerId,
      keyPrefix: createdKey.keyPrefix,
      type: createdKey.type,
    });
    assert(rotatedScaleMax.keyPrefix === 'ld_live_', 'Rotated ScaleMax key retains ld_live_ prefix');
    assert(rotatedScaleMax.rawKeySecret.startsWith('ld_live_'), 'Rotated ScaleMax secret starts with ld_live_');
    assert(rotatedScaleMax.rawKeySecret !== testKeyMaterial.rawKeySecret, 'Rotated ScaleMax secret has new distinct entropy');

    // Rotate Opus Max key (hypothetical existing key)
    const rotatedOpus = await generateRotatedKeyMaterial({
      id: 'mock-opus-id',
      providerId: testOpus.id,
      keyPrefix: 'sk_live_',
      type: 'production',
    });
    assert(rotatedOpus.keyPrefix === 'sk_live_', 'Rotated Opus Max key retains sk_live_ prefix');
    assert(rotatedOpus.rawKeySecret.startsWith('sk_live_'), 'Rotated Opus Max secret starts with sk_live_');

    // -------------------------------------------------------------------------
    // TEST 9: Final Database Audit & Integrity Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Database Integrity Audit ---');
    // Clean up test keys created during this test
    if (createdTestKeyIds.length > 0) {
      await prisma.apiKey.deleteMany({
        where: { id: { in: createdTestKeyIds } },
      });
      console.log(`  (Cleaned up ${createdTestKeyIds.length} test keys)`);
    }

    // Clean up test Opus provider
    if (testOpusProviderId) {
      await prisma.vendorProvider.delete({
        where: { id: testOpusProviderId },
      });
      console.log(`  (Cleaned up test Opus provider)`);
    }

    const finalKeyCount = await prisma.apiKey.count();
    const finalReqCount = await prisma.apiRequest.count();
    const finalLedgerCount = await prisma.masterTokenLedger.count();
    const nullProviderCount = await prisma.apiKey.count({ where: { providerId: null } });

    assert(finalKeyCount === initialKeyCount, `Total ApiKey count intact (${finalKeyCount} == ${initialKeyCount})`);
    assert(finalReqCount === initialReqCount, `Total ApiRequest count intact (${finalReqCount} == ${initialReqCount})`);
    assert(finalLedgerCount === initialLedgerCount, `MasterTokenLedger intact (${finalLedgerCount} == ${initialLedgerCount})`);
    assert(nullProviderCount === 0, 'Zero keys in database have providerId = NULL');

  } catch (err: any) {
    console.error('UNEXPECTED EXCEPTION IN TESTS:', err);
    failed++;
  } finally {
    // Safety cleanup in case of crash
    try {
      if (createdTestKeyIds.length > 0) {
        await prisma.apiKey.deleteMany({ where: { id: { in: createdTestKeyIds } } });
      }
      if (testOpusProviderId) {
        await prisma.vendorProvider.delete({ where: { id: testOpusProviderId } }).catch(() => {});
      }
      if (originalDefaultSetting) {
        await prisma.systemSetting.upsert({
          where: { key: 'default_provider_id' },
          update: { value: originalDefaultSetting },
          create: { key: 'default_provider_id', value: originalDefaultSetting },
        }).catch(() => {});
      }
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr);
    }
  }

  console.log('\n=================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
