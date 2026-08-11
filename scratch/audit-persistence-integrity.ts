import { prisma, encryptText, decryptText } from '../server/db';
import crypto from 'crypto';

async function auditPersistenceIntegrity() {
  console.log('⚡ Starting Complete Database Data Persistence & Integrity Audit...\n');
  let passCount = 0;
  let failCount = 0;

  function report(name: string, passed: boolean, detail?: string) {
    if (passed) {
      passCount++;
      console.log(`✅ [PASS] ${name}${detail ? ` - ${detail}` : ''}`);
    } else {
      failCount++;
      console.error(`❌ [FAIL] ${name}${detail ? ` - ${detail}` : ''}`);
    }
  }

  try {
    // 1. Customer Account Database Persistence Test
    const testEmail = `audit_cust_${Date.now()}@lightningdeals.ai`;
    const passwordHash = crypto.createHash('sha256').update('testpass123').digest('hex');

    const createdCustomer = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: 'Audit Persistent Customer',
          email: testEmail,
          passwordHash,
          role: 'user',
          status: 'active',
        },
      });

      await tx.adminLog.create({
        data: {
          adminUserId: user.id,
          action: 'CREATE_CUSTOMER',
          targetType: 'User',
          targetId: user.id,
          metadata: `Created customer account ${user.name} (${user.email})`,
        },
      });

      return user;
    });

    report('Customer DB Transaction & Insert', !!createdCustomer.id, `Created user ${createdCustomer.id}`);

    // Direct Read-After-Write Database Verification
    const dbCustomer = await prisma.user.findUnique({ where: { id: createdCustomer.id } });
    report('Customer Read-After-Write Persistence', dbCustomer?.email === testEmail, `Verified email ${dbCustomer?.email} in SQLite DB`);

    // 2. API Key Persistence & Gateway Functionality Test
    const rawKey = 'ld_live_' + crypto.randomBytes(18).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const displayKey = `${rawKey.slice(0, 11)}...${rawKey.slice(-4)}`;

    const createdKey = await prisma.$transaction(async (tx) => {
      const key = await tx.apiKey.create({
        data: {
          userId: createdCustomer.id,
          keyPrefix: 'ld_live_',
          keyHash,
          displayKey,
          name: 'Audit Persistence Test Key',
          type: 'production',
          status: 'active',
          purchasedTokens: BigInt(20000000),
          tokensUsed: BigInt(0),
          tokensRemaining: BigInt(20000000),
          rateLimitRpm: 60,
          plan: 'Claude Max 20x',
        },
      });

      await tx.tokenLedger.create({
        data: {
          apiKeyId: key.id,
          userId: createdCustomer.id,
          amount: BigInt(20000000),
          balanceAfter: BigInt(20000000),
          type: 'PURCHASE',
          reference: 'AUDIT-INIT',
          notes: 'Test key token allocation',
        },
      });

      return key;
    });

    report('API Key DB Transaction & Creation', !!createdKey.id, `Created key ${createdKey.displayKey}`);

    // Key Rotation Persistence Test
    const rotatedRawKey = 'ld_live_' + crypto.randomBytes(18).toString('hex');
    const rotatedKeyHash = crypto.createHash('sha256').update(rotatedRawKey).digest('hex');
    const rotatedDisplayKey = `${rotatedRawKey.slice(0, 11)}...${rotatedRawKey.slice(-4)}`;

    const rotatedKey = await prisma.apiKey.update({
      where: { id: createdKey.id },
      data: {
        keyHash: rotatedKeyHash,
        displayKey: rotatedDisplayKey,
      },
    });

    report('API Key Rotation DB Update', rotatedKey.keyHash === rotatedKeyHash, `Rotated hash updated in DB (${rotatedDisplayKey})`);

    // Verify Rotated Key via Database Query
    const dbKey = await prisma.apiKey.findUnique({ where: { keyHash: rotatedKeyHash } });
    report('API Key Read-After-Write Verification', dbKey?.id === createdKey.id, `Found key record by rotated hash`);

    // 3. Vendor Provider Master Key Encryption & Base URL Persistence Test
    const testBaseUrl = 'https://api.anthropic.com';
    const testMasterKey = 'sk-ant-api03-test-master-key-persistence-audit';

    const provider = await prisma.vendorProvider.create({
      data: {
        name: 'Audit Test Vendor Provider',
        providerType: 'anthropic',
        protocol: 'anthropic',
        masterApiKeyEncrypted: encryptText(testMasterKey),
        baseUrl: testBaseUrl,
        isPrimary: false,
        status: 'connected',
      },
    });

    report('Vendor Provider DB Creation', !!provider.id, `Created provider ${provider.name}`);

    // Direct Read-After-Write & Encryption Check
    const dbProvider = await prisma.vendorProvider.findUnique({ where: { id: provider.id } });
    const decryptedKey = decryptText(dbProvider?.masterApiKeyEncrypted || '');
    report('Master API Key Server-Side Encryption', decryptedKey === testMasterKey && !dbProvider?.masterApiKeyEncrypted.includes(testMasterKey), `Master key stored encrypted in DB and safely decrypted server-side`);

    // 4. Plan Persistence Test
    const planName = `Audit Plan ${Date.now()}`;
    const createdPlan = await prisma.plan.create({
      data: {
        name: planName,
        displayName: `${planName} (40M / 5h)`,
        tokenAllowance: BigInt(40000000),
        windowHours: 5,
        validityDays: 30,
        rateLimitRpm: 100,
        description: 'Persistent audit test plan',
      },
    });

    report('Plan DB Creation', !!createdPlan.id, `Created plan ${createdPlan.displayName}`);

    const updatedPlan = await prisma.plan.update({
      where: { id: createdPlan.id },
      data: { rateLimitRpm: 120 },
    });
    report('Plan DB Update Persistence', updatedPlan.rateLimitRpm === 120, `Updated rateLimitRpm to 120 in DB`);

    // 5. Cleanup Test Records
    await prisma.plan.delete({ where: { id: createdPlan.id } });
    await prisma.vendorProvider.delete({ where: { id: provider.id } });
    await prisma.apiKey.delete({ where: { id: createdKey.id } });
    await prisma.user.delete({ where: { id: createdCustomer.id } });
    report('Audit Clean-up', true, 'Temporary test records cleaned up safely');

    // 6. Audit Log System Persistence Check
    const logsCount = await prisma.adminLog.count();
    report('Admin Audit Log System', logsCount > 0, `Found ${logsCount} persistent audit entries in DB`);

    console.log('\n==================================================');
    console.log(`PERSISTENCE AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('==================================================\n');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Audit execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditPersistenceIntegrity();
