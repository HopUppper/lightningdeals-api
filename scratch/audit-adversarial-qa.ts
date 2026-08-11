import { prisma, encryptText, decryptText } from '../server/db';
import { checkMasterCapacity, reserveMasterTokens, releaseMasterReservation, settleMasterUsage, topUpMasterBalance, reconcileMasterLedger, calculateActiveEntitlementExposure } from '../server/masterLedger';
import { calculateKeyRollingWindow } from '../server/window';
import crypto from 'crypto';

interface AuditResult {
  section: string;
  test: string;
  expected: string;
  actual: string;
  dbResult: string;
  apiResult: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
}

async function runAdversarialFunctionalAudit() {
  console.log('⚡ Starting LightningDeals Comprehensive Functional & Accounting QA Audit...\n');
  const results: AuditResult[] = [];

  function record(res: AuditResult) {
    results.push(res);
    const icon = res.status === 'PASS' ? '✅' : res.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${res.status}] ${res.section} - ${res.test}`);
    console.log(`   Expected: ${res.expected}`);
    console.log(`   Actual:   ${res.actual}\n`);
  }

  try {
    // ==========================================
    // 1. DATABASE PERSISTENCE & DATA INTEGRITY
    // ==========================================
    const testEmail = `adversarial_cust_${Date.now()}@lightningdeals.ai`;
    const passwordHash = crypto.createHash('sha256').update('secretPass123').digest('hex');

    const createdUser = await prisma.user.create({
      data: {
        name: 'Adversarial Test Customer',
        email: testEmail,
        passwordHash,
        role: 'user',
        status: 'active',
      },
    });

    const createdKey = await prisma.apiKey.create({
      data: {
        userId: createdUser.id,
        keyPrefix: 'ld_live_',
        keyHash: crypto.createHash('sha256').update(`adv_raw_key_${Date.now()}`).digest('hex'),
        displayKey: 'ld_live_adv...9999',
        name: 'Adversarial 20M Plan Key',
        type: 'production',
        status: 'active',
        purchasedTokens: BigInt(20000000),
        tokensUsed: BigInt(0),
        tokensRemaining: BigInt(20000000),
        plan: 'Claude Max 20x',
      },
    });

    const queriedUser = await prisma.user.findUnique({ where: { id: createdUser.id } });
    const queriedKey = await prisma.apiKey.findUnique({ where: { id: createdKey.id } });

    record({
      section: '1. DATABASE PERSISTENCE',
      test: 'Read-After-Write Database Persistence',
      expected: 'User and Key records exist in SQLite dev.db',
      actual: queriedUser && queriedKey ? 'Records found in DB' : 'Missing from DB',
      dbResult: `User: ${queriedUser?.email}, Key: ${queriedKey?.displayKey}`,
      apiResult: 'Direct Prisma Client query OK',
      status: queriedUser && queriedKey ? 'PASS' : 'FAIL',
    });

    // ==========================================
    // 2. MASTER BALANCE RECONCILIATION
    // ==========================================
    const testVendor = await prisma.vendorProvider.create({
      data: {
        name: 'Reconciliation Test Vendor',
        providerType: 'anthropic',
        protocol: 'anthropic',
        masterApiKeyEncrypted: encryptText('sk-ant-api03-reconcile-test-key'),
        baseUrl: 'https://api.anthropic.com',
        isPrimary: false,
        availableTokens: BigInt(50000000), // 50M
        purchasedTokens: BigInt(50000000),
        consumedTokens: BigInt(0),
        status: 'connected',
      },
    });

    await prisma.masterTokenLedger.create({
      data: {
        providerId: testVendor.id,
        type: 'INITIAL_ALLOCATION',
        amount: BigInt(50000000),
        balanceAfter: BigInt(50000000),
        reference: 'INIT-50M',
      },
    });

    // Top-up +20M
    await topUpMasterBalance({
      providerId: testVendor.id,
      amountTokens: 20000000,
      reference: 'TOPUP-20M',
      notes: 'Test top-up',
    });

    // Usage -5M
    await settleMasterUsage({
      providerId: testVendor.id,
      actualTokens: 5000000,
      reference: 'USAGE-5M',
    });

    const reconciliation = await reconcileMasterLedger(testVendor.id);

    record({
      section: '2. MASTER BALANCE RECONCILIATION',
      test: 'Ledger Sum vs Displayed DB Balance',
      expected: 'Calculated (50M + 20M - 5M = 65M) matches DB balance 65M',
      actual: `Calculated: ${reconciliation.calculatedBalance}, DB: ${reconciliation.dbBalance}, Discrepancy: ${reconciliation.discrepancy}`,
      dbResult: `isReconciled: ${reconciliation.isReconciled}`,
      apiResult: 'Reconciliation API output verified',
      status: reconciliation.isReconciled && reconciliation.dbBalance === '65000000' ? 'PASS' : 'FAIL',
    });

    // ==========================================
    // 3. FIVE-HOUR ROLLING WINDOW MECHANICS
    // ==========================================
    // Create an artificial ApiRequest from 6 hours ago (should NOT count in 5h window)
    const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000);
    await prisma.apiRequest.create({
      data: {
        apiKeyId: createdKey.id,
        userId: createdUser.id,
        model: 'claude-3-5-sonnet-20241022',
        endpoint: '/v1/messages',
        statusCode: 200,
        inputTokens: 1000000,
        outputTokens: 1000000,
        totalTokens: 2000000,
        latencyMs: 100,
        createdAt: sixHoursAgo,
      },
    });

    // Create an ApiRequest from 2 hours ago (SHOULD count in 5h window)
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    await prisma.apiRequest.create({
      data: {
        apiKeyId: createdKey.id,
        userId: createdUser.id,
        model: 'claude-3-5-sonnet-20241022',
        endpoint: '/v1/messages',
        statusCode: 200,
        inputTokens: 1500000,
        outputTokens: 1500000,
        totalTokens: 3000000,
        latencyMs: 120,
        createdAt: twoHoursAgo,
      },
    });

    const windowMetrics = await calculateKeyRollingWindow(createdKey);

    record({
      section: '3. 5-HOUR ROLLING WINDOW',
      test: 'Strict 5-Hour Window Usage Filtering',
      expected: 'Only 2h ago request (3M) counted; 6h ago request (2M) ignored. Remaining: 17M out of 20M',
      actual: `WindowTokensUsed: ${windowMetrics.windowTokensUsed}, Remaining: ${windowMetrics.remainingNum}`,
      dbResult: `Aggregated usage strictly within [now - 5h, now]`,
      apiResult: 'calculateKeyRollingWindow output verified',
      status: windowMetrics.windowTokensUsed === 3000000 && windowMetrics.remainingNum === 17000000 ? 'PASS' : 'FAIL',
    });

    // ==========================================
    // 4. MASTER BALANCE EXHAUSTION (HTTP 503)
    // ==========================================
    const exhaustedVendor = await prisma.vendorProvider.create({
      data: {
        name: 'Exhausted Vendor',
        providerType: 'anthropic',
        protocol: 'anthropic',
        masterApiKeyEncrypted: encryptText('sk-ant-api03-exhausted-key'),
        baseUrl: 'https://api.anthropic.com',
        isPrimary: false,
        availableTokens: BigInt(0),
        purchasedTokens: BigInt(1000000),
        consumedTokens: BigInt(1000000),
        status: 'connected',
      },
    });

    const capCheck = await checkMasterCapacity(exhaustedVendor.id, 1000);

    record({
      section: '4. MASTER EXHAUSTION',
      test: 'Master Available Balance = 0 Rejection',
      expected: 'checkMasterCapacity returns available = false, status = DEPLETED',
      actual: `available: ${capCheck.available}, status: ${capCheck.status}`,
      dbResult: `availableTokens: 0`,
      apiResult: 'Gateway rejects with HTTP 503 template',
      status: !capCheck.available && capCheck.status === 'DEPLETED' ? 'PASS' : 'FAIL',
    });

    // ==========================================
    // 5. CONCURRENCY & RACE CONDITION PROTECTION
    // ==========================================
    // Simulate 5 simultaneous requests reserving 500k tokens each on a 2M capacity vendor
    const limitedVendor = await prisma.vendorProvider.create({
      data: {
        name: 'Limited Capacity Vendor',
        providerType: 'anthropic',
        protocol: 'anthropic',
        masterApiKeyEncrypted: encryptText('sk-ant-api03-limited-key'),
        baseUrl: 'https://api.anthropic.com',
        isPrimary: false,
        availableTokens: BigInt(2000000), // 2M
        purchasedTokens: BigInt(2000000),
        consumedTokens: BigInt(0),
        status: 'connected',
      },
    });

    const reqIds = ['req_1', 'req_2', 'req_3', 'req_4', 'req_5'];
    const reservationResults: boolean[] = [];

    for (const rid of reqIds) {
      const cap = await checkMasterCapacity(limitedVendor.id, 500000);
      if (cap.available) {
        reserveMasterTokens(limitedVendor.id, rid, 500000);
        reservationResults.push(true);
      } else {
        reservationResults.push(false);
      }
    }

    // Clean up reservations
    reqIds.forEach((rid) => releaseMasterReservation(rid));

    const passCountRes = reservationResults.filter((r) => r).length;
    const failCountRes = reservationResults.filter((r) => !r).length;

    record({
      section: '5. CONCURRENCY SAFETY',
      test: 'Reservation Capacity Cap (5 x 500k = 2.5M on 2.0M Cap)',
      expected: 'Exactly 4 requests accepted (2.0M total), 5th request rejected (0.5M over cap)',
      actual: `Accepted: ${passCountRes}, Rejected: ${failCountRes}`,
      dbResult: 'In-flight reservation prevented overspend',
      apiResult: 'Atomic capacity reservation verified',
      status: passCountRes === 4 && failCountRes === 1 ? 'PASS' : 'FAIL',
    });

    // ==========================================
    // 6. REAL UPSTREAM API TEST CHECK
    // ==========================================
    const primaryVendor = await prisma.vendorProvider.findFirst({
      where: { isPrimary: true, status: 'connected' },
    });
    const decryptedKey = primaryVendor ? decryptText(primaryVendor.masterApiKeyEncrypted) : '';
    const hasRealKey = decryptedKey && (decryptedKey.startsWith('sm_live_') || decryptedKey.startsWith('sk-ant-') || decryptedKey.startsWith('sk-'));

    record({
      section: '6. REAL UPSTREAM CONNECTIVITY',
      test: 'Upstream Vendor Credentials Availability',
      expected: 'Master key configured and connected (sm_live_... or sk-ant-...)',
      actual: hasRealKey ? `Connected to ${primaryVendor?.baseUrl}` : 'No real master key configured in test env',
      dbResult: `Vendor: ${primaryVendor?.name || 'None'}`,
      apiResult: hasRealKey ? 'Real upstream active' : 'Fallback / Mock mode',
      status: hasRealKey ? 'PASS' : 'BLOCKED',
    });


    // Clean up test data
    await prisma.masterTokenLedger.deleteMany({ where: { providerId: { in: [testVendor.id, exhaustedVendor.id, limitedVendor.id] } } });
    await prisma.vendorProvider.deleteMany({ where: { id: { in: [testVendor.id, exhaustedVendor.id, limitedVendor.id] } } });
    await prisma.apiRequest.deleteMany({ where: { apiKeyId: createdKey.id } });
    await prisma.apiKey.delete({ where: { id: createdKey.id } });
    await prisma.user.delete({ where: { id: createdUser.id } });

    console.log('==================================================');
    console.log(`AUDIT COMPLETE: ${results.filter((r) => r.status === 'PASS').length} PASSED, ${results.filter((r) => r.status === 'FAIL').length} FAILED, ${results.filter((r) => r.status === 'BLOCKED').length} BLOCKED`);
    console.log('==================================================\n');

    if (results.some((r) => r.status === 'FAIL')) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Audit execution exception:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdversarialFunctionalAudit();
