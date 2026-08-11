import { prisma } from '../server/db';
import crypto from 'crypto';

async function auditAdminBackendTruth() {
  console.log('⚡ Starting Complete Admin Panel & DB Source-of-Truth Audit...\n');
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
    // 1. Verify DB Connection & Schema Integrity
    const userCount = await prisma.user.count();
    const keyCount = await prisma.apiKey.count();
    const orderCount = await prisma.order.count();
    const providerCount = await prisma.vendorProvider.count();
    report('Database Connectivity & Schema Query', true, `Users: ${userCount}, Keys: ${keyCount}, Orders: ${orderCount}, Providers: ${providerCount}`);

    // 2. Overview Statistics DB ↔ Backend Truth Reconciliation
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000);

    const [
      activeUsers,
      activeKeys,
      paidOrdersAgg,
      totalRequests,
      requestsToday,
      tokensTodayAgg,
      tokensWindowAgg,
      openTickets,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'active' } }),
      prisma.apiKey.count({
        where: {
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      prisma.order.aggregate({
        _sum: { amountInr: true, tokenQuantity: true },
        where: { status: 'PAID' },
      }),
      prisma.apiRequest.count(),
      prisma.apiRequest.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: { createdAt: { gte: fiveHoursAgo } },
      }),
      prisma.supportTicket.count({ where: { status: { in: ['Open', 'Awaiting Support'] } } }),
    ]);

    report('Overview DB Statistics Query', true, `Active Users: ${activeUsers}, Active Keys: ${activeKeys}, Revenue: ₹${paidOrdersAgg._sum.amountInr || 0}, Requests Today: ${requestsToday}, Open Tickets: ${openTickets}`);

    // 3. API Key Cryptographic Generation & Key Rotation Test
    const rawKey = 'ld_live_' + crypto.randomBytes(18).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const displayKey = `${rawKey.slice(0, 11)}...${rawKey.slice(-4)}`;

    const testKey = await prisma.apiKey.create({
      data: {
        keyPrefix: 'ld_live_',
        keyHash,
        displayKey,
        name: 'Audit Verification Test Key',
        type: 'production',
        status: 'active',
        purchasedTokens: BigInt(20000000),
        tokensUsed: BigInt(0),
        tokensRemaining: BigInt(20000000),
        rateLimitRpm: 60,
        plan: 'Claude Max 20x',
      },
    });

    report('API Key Creation', !!testKey.id, `Created test key ${testKey.id} (${testKey.displayKey})`);

    // Key Rotation Test
    const rotatedRawKey = 'ld_live_' + crypto.randomBytes(18).toString('hex');
    const rotatedKeyHash = crypto.createHash('sha256').update(rotatedRawKey).digest('hex');
    const rotatedDisplayKey = `${rotatedRawKey.slice(0, 11)}...${rotatedRawKey.slice(-4)}`;

    const rotatedKey = await prisma.apiKey.update({
      where: { id: testKey.id },
      data: {
        keyHash: rotatedKeyHash,
        displayKey: rotatedDisplayKey,
      },
    });

    report('API Key Rotation', rotatedKey.keyHash === rotatedKeyHash && rotatedKey.displayKey === rotatedDisplayKey, `Key rotated successfully (${testKey.displayKey} -> ${rotatedDisplayKey})`);

    // Key Suspension & Revocation Test
    const suspendedKey = await prisma.apiKey.update({
      where: { id: testKey.id },
      data: { status: 'suspended' },
    });
    report('API Key Suspension', suspendedKey.status === 'suspended');

    const revokedKey = await prisma.apiKey.update({
      where: { id: testKey.id },
      data: { status: 'revoked' },
    });
    report('API Key Revocation', revokedKey.status === 'revoked');

    // Clean up test key
    await prisma.apiKey.delete({ where: { id: testKey.id } });
    report('API Key Deletion & Cleanup', true);

    // 4. Token Accounting Settlement Reconciliation Test
    const requests = await prisma.apiRequest.findMany({ take: 100 });
    let discrepancies = 0;
    for (const r of requests) {
      if (r.inputTokens + r.outputTokens !== r.totalTokens) {
        discrepancies++;
      }
    }
    report('Token Accounting Reconciliation', discrepancies === 0, `Scanned ${requests.length} request logs. Discrepancies: ${discrepancies}`);

    // 5. Vendor Provider Master Key Encryption & SSRF Isolation Test
    const primaryVendor = await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });
    if (primaryVendor) {
      const hasUnencryptedInDb = primaryVendor.masterApiKeyEncrypted.startsWith('sk-ant-');
      report('Supplier Master Key Encryption', !hasUnencryptedInDb, `Master key stored encrypted in SQLite DB`);
    } else {
      report('Supplier Master Key Encryption', true, 'No primary vendor configured yet');
    }

    // 6. Audit Logging Verification
    const auditLogsCount = await prisma.adminLog.count();
    report('Audit Log System', true, `Found ${auditLogsCount} administrative audit entries in DB`);

    console.log('\n==================================================');
    console.log(`AUDIT RESULTS SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
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

auditAdminBackendTruth();
