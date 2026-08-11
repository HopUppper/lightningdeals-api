import { prisma, encryptText, decryptText } from '../server/db';
import { checkMasterCapacity, reserveMasterTokens, releaseMasterReservation, settleMasterUsage, topUpMasterBalance, reconcileMasterLedger, calculateActiveEntitlementExposure } from '../server/masterLedger';
import crypto from 'crypto';

async function auditMasterVendorAccounting() {
  console.log('⚡ Starting Master Vendor Balance, Entitlement & Upstream Control System Audit...\n');
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
    // 1. Setup Test Provider & Encrypted Master Key (sm_live_ format)
    const masterKeySecret = 'sm_live_vendor_master_key_audit_2026_x89f4102';
    const encryptedMasterKey = encryptText(masterKeySecret);


    const testVendor = await prisma.vendorProvider.create({
      data: {
        name: 'Master Accounting Audit Vendor',
        providerType: 'anthropic',
        protocol: 'anthropic',
        masterApiKeyEncrypted: encryptedMasterKey,
        baseUrl: 'https://api.anthropic.com',
        isPrimary: false,
        availableTokens: BigInt(100000000), // 100M initial
        purchasedTokens: BigInt(100000000),
        consumedTokens: BigInt(0),
        status: 'connected',
      },
    });

    report('Master Vendor Key Security & Encryption', decryptText(testVendor.masterApiKeyEncrypted) === masterKeySecret, 'Master key encrypted at rest via AES-256-CBC');

    // Record initial allocation in MasterTokenLedger
    await prisma.masterTokenLedger.create({
      data: {
        providerId: testVendor.id,
        type: 'INITIAL_ALLOCATION',
        amount: BigInt(100000000),
        balanceAfter: BigInt(100000000),
        reference: 'INIT-ALLOC-100M',
        notes: 'Initial master vendor prepaid allocation',
      },
    });

    // 2. Customer Plan Entitlement vs Master Balance Isolation Test
    const customerUser = await prisma.user.create({
      data: {
        name: 'Entitlement Customer A',
        email: `entitlement_cust_${Date.now()}@lightningdeals.ai`,
        passwordHash: 'hash123',
        role: 'user',
      },
    });

    const customerKey = await prisma.apiKey.create({
      data: {
        userId: customerUser.id,
        keyPrefix: 'ld_live_',
        keyHash: crypto.createHash('sha256').update(`test_raw_key_${Date.now()}`).digest('hex'),
        displayKey: 'ld_live_test...1234',
        name: 'Customer A 5M Plan Key',
        type: 'production',
        status: 'active',
        purchasedTokens: BigInt(5000000), // 5M per 5-hour window entitlement
        tokensUsed: BigInt(0),
        tokensRemaining: BigInt(5000000),
        plan: 'Claude Max 5x',
      },
    });

    // Re-query Master Vendor Provider Balance
    const vendorAfterPlanAssignment = await prisma.vendorProvider.findUnique({ where: { id: testVendor.id } });
    report('Plan Entitlement Isolation', vendorAfterPlanAssignment?.availableTokens.toString() === '100000000', 'Creating 5M customer plan deducted 0 tokens from Master Vendor Balance');

    // 3. Request Fulfillment & Dual Atomic Settlement Test
    const requestTokens = 2000000; // 2M request
    await settleMasterUsage({
      providerId: testVendor.id,
      apiKeyId: customerKey.id,
      userId: customerUser.id,
      actualTokens: requestTokens,
      reference: 'REQ-claude-sonnet-5',
      notes: 'Customer A 2M token request completion',
    });

    const vendorAfterUsage = await prisma.vendorProvider.findUnique({ where: { id: testVendor.id } });
    report('Master Token Settlement', vendorAfterUsage?.availableTokens.toString() === '98000000' && vendorAfterUsage?.consumedTokens.toString() === '2000000', 'Master available balance reduced by 2M (98M remaining)');

    const usageLedgerEntry = await prisma.masterTokenLedger.findFirst({
      where: { providerId: testVendor.id, type: 'CUSTOMER_USAGE' },
    });
    report('Master Token Immutable Ledger Entry', usageLedgerEntry?.amount.toString() === '-2000000' && usageLedgerEntry?.balanceAfter.toString() === '98000000', 'MasterTokenLedger recorded -2M CUSTOMER_USAGE transaction');

    // 4. Master Balance Exhaustion & 503 Capacity Check Test
    // Deplete vendor balance via ADJUSTMENT ledger entry so ledger remains 100% in sync
    await prisma.$transaction([
      prisma.vendorProvider.update({
        where: { id: testVendor.id },
        data: { availableTokens: BigInt(0) },
      }),
      prisma.masterTokenLedger.create({
        data: {
          providerId: testVendor.id,
          type: 'ADJUSTMENT',
          amount: BigInt(-98000000),
          balanceAfter: BigInt(0),
          reference: 'AUDIT-DEPLETE-TEST',
          notes: 'Temporary audit depletion test',
        },
      }),
    ]);

    const capacityCheckDepleted = await checkMasterCapacity(testVendor.id, 5000);
    report('Master Balance Depletion Capacity Check', !capacityCheckDepleted.available && capacityCheckDepleted.status === 'DEPLETED', 'Gateway capacity check correctly rejected when Master balance is 0');


    // 5. Master Top-Up System Test
    const topUpResult = await topUpMasterBalance({
      providerId: testVendor.id,
      amountTokens: 150000000, // +150M top-up
      reference: 'UPI-REF-902184-AUDIT',
      notes: 'Prepaid supplier top-up audit test',
    });

    report('Top-Up System Execution', topUpResult.updatedProvider.availableTokens.toString() === '150000000' && topUpResult.updatedProvider.purchasedTokens.toString() === '250000000', 'Added +150M top-up. New Available: 150M, Total Purchased: 250M');

    const topUpLedgerEntry = await prisma.masterTokenLedger.findFirst({
      where: { providerId: testVendor.id, type: 'TOP_UP' },
    });
    report('Top-Up Immutable Ledger Logging', topUpLedgerEntry?.reference === 'UPI-REF-902184-AUDIT' && topUpLedgerEntry?.amount.toString() === '150000000', 'MasterTokenLedger recorded TOP_UP entry with payment reference');

    // 6. Capacity Exposure Calculation Test
    const exposure = await calculateActiveEntitlementExposure();
    report('Active Entitlement Exposure Metrics', Number(exposure.active5hWindowAllowance) >= 5000000, `Calculated active 5h window entitlement exposure: ${exposure.active5hWindowAllowance}`);

    // 7. Ledger Reconciliation Test
    const reconciliation = await reconcileMasterLedger(testVendor.id);
    report('Master Token Ledger Reconciliation', reconciliation.isReconciled && reconciliation.discrepancy === '0', `Reconciled ${reconciliation.transactionCount} transactions against DB balance: ${reconciliation.dbBalance}`);

    // 8. Clean Up Test Audit Records
    await prisma.masterTokenLedger.deleteMany({ where: { providerId: testVendor.id } });
    await prisma.vendorProvider.delete({ where: { id: testVendor.id } });
    await prisma.apiKey.delete({ where: { id: customerKey.id } });
    await prisma.user.delete({ where: { id: customerUser.id } });
    report('Audit Test Clean-Up', true, 'Temporary test records deleted safely');

    console.log('\n==================================================');
    console.log(`MASTER VENDOR ACCOUNTING AUDIT: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('==================================================\n');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Master Vendor Accounting Audit execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditMasterVendorAccounting();
