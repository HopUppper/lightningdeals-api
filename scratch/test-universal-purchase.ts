import { prisma } from '../server/db';
import {
  createUniversalPurchase,
  updateUniversalPurchaseAmount,
  updateUniversalPurchaseStatus,
  getCustomerRewardsSummary,
  getGlobalCreditLedger,
  getAdminCustomerProfileDetails,
} from '../server/rewards/rewardService';

async function runTestSuite() {
  console.log('⚡ Starting Master Universal Purchase & WhatsApp Rewards Automated Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail !== undefined ? detail : '');
      failed++;
    }
  }

  // Clean or create customer@gmail.com
  const testEmail = 'customer@gmail.com';
  let testUser = await prisma.user.findUnique({ where: { email: testEmail } });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'John Doe',
        phone: '+919876543210',
        passwordHash: 'hashed_pw_test',
        role: 'user',
        status: 'active',
        availableCredits: 700, // Initial balance of ₹700 per Prompt Section 41
        lifetimeCreditsEarned: 700,
        lifetimeCreditsRedeemed: 0,
      },
    });
  } else {
    // Reset test user to initial state: balance = ₹700
    await prisma.purchase.deleteMany({ where: { userId: testUser.id } });
    await prisma.creditTransaction.deleteMany({ where: { userId: testUser.id } });
    await prisma.notification.deleteMany({ where: { userId: testUser.id } });

    testUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        availableCredits: 700,
        lifetimeCreditsEarned: 700,
        lifetimeCreditsRedeemed: 0,
      },
    });
  }

  console.log(`Initial Customer State: ${testUser.email} with availableCredits = ₹${testUser.availableCredits}\n`);

  // ==========================================
  // TEST 1: Section 41 Final Acceptance Test
  // ==========================================
  console.log('--- TEST 1: Final Master Prompt Acceptance Scenario ---');
  const uniqueRef1 = `WH-TEST-${Date.now()}`;
  const purchase1 = await createUniversalPurchase({
    userId: testUser.id,
    productName: 'LinkedIn Premium',
    description: 'LinkedIn Premium purchased',
    amountPaid: 3500,
    channel: 'WHATSAPP',
    status: 'COMPLETED',
    referenceId: uniqueRef1,
    notes: 'UPI payment verified from WhatsApp chat',
    createdBy: 'ADMIN_TEST',
  });

  assert(purchase1.success === true, 'Purchase 1 created successfully');
  assert(purchase1.creditsAwarded === 350, 'Credits awarded is exactly ₹350 (10% of ₹3,500)', purchase1.creditsAwarded);
  assert(purchase1.newBalance === 1050, 'Customer balance updated from ₹700 to ₹1,050', purchase1.newBalance);

  // Verify database record
  const dbUserAfter1 = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(dbUserAfter1?.availableCredits === 1050, 'User.availableCredits in DB is 1050', dbUserAfter1?.availableCredits);

  // Verify Customer Rewards Summary (Section 12)
  const summary1 = await getCustomerRewardsSummary(testUser.id);
  assert(summary1.availableCredits === 1050, 'Summary availableCredits is 1050', summary1.availableCredits);
  assert(summary1.purchases.length >= 1, 'Purchases list includes newly created purchase');
  assert(summary1.purchases[0].productName === 'LinkedIn Premium', 'Purchases list has LinkedIn Premium');
  assert(summary1.purchases[0].channel === 'WHATSAPP', 'Purchase channel is WHATSAPP');
  assert(summary1.purchases[0].creditsEarned === 350, 'Purchase creditsEarned is 350');

  // Verify Credit Ledger (Section 13)
  const ledger1 = await getGlobalCreditLedger({ search: testEmail });
  assert(ledger1.transactions.length >= 1, 'Ledger returns transaction for customer');
  const tx1 = ledger1.transactions[0];
  assert(tx1.type === 'PURCHASE_REWARD', 'Transaction type is PURCHASE_REWARD');
  assert(tx1.amount === 350, 'Transaction amount is +350');
  assert(tx1.balanceAfter === 1050, 'Transaction balanceAfter is 1050');
  assert(tx1.purchase?.channel === 'WHATSAPP', 'Transaction channel is WHATSAPP');

  // Verify Notification (Section 34)
  const notif1 = await prisma.notification.findFirst({
    where: { userId: testUser.id },
    orderBy: { createdAt: 'desc' },
  });
  assert(notif1 !== null, 'Notification created for customer');
  assert(notif1?.message.includes('₹350'), 'Notification message mentions ₹350 credits', notif1?.message);
  assert(notif1?.message.includes('₹1,050'), 'Notification message mentions new balance ₹1,050', notif1?.message);

  // Verify Audit Log (Section 35)
  const audit1 = await prisma.auditEvent.findFirst({
    where: { customerId: testUser.id, eventType: 'PURCHASE_CREATED' },
    orderBy: { timestamp: 'desc' },
  });
  assert(audit1 !== null, 'Audit log created for purchase');
  assert(audit1?.metadata?.includes('LinkedIn Premium'), 'Audit metadata contains product name');

  console.log('\n--- TEST 2: Transaction Cap & Multi-Purchase Unlimited Accumulation ---');
  // Customer buys Adobe for ₹8,000 on WhatsApp -> earns max ₹500 (not ₹800)
  const purchase2 = await createUniversalPurchase({
    userId: testUser.id,
    productName: 'Adobe Creative Cloud',
    amountPaid: 8000,
    channel: 'WHATSAPP',
    status: 'COMPLETED',
    referenceId: `WH-ADOBE-${Date.now()}`,
  });
  assert(purchase2.creditsAwarded === 500, 'Max ₹500 per transaction cap applied on ₹8,000 purchase', purchase2.creditsAwarded);
  assert(purchase2.newBalance === 1550, 'Balance accumulated to ₹1,550 past ₹500 without restriction', purchase2.newBalance);

  console.log('\n--- TEST 3: Duplicate Protection & Idempotency (Section 19 & 32) ---');
  // Attempting to submit purchase1 again with same referenceId
  const dupAttempt = await createUniversalPurchase({
    userId: testUser.id,
    productName: 'LinkedIn Premium Duplicate',
    amountPaid: 3500,
    channel: 'WHATSAPP',
    status: 'COMPLETED',
    referenceId: uniqueRef1,
  });
  assert(dupAttempt.isDuplicate === true, 'Duplicate reference detected');
  assert(dupAttempt.newBalance === 1550, 'Balance NOT incremented on duplicate');

  console.log('\n--- TEST 4: Purchase Amount Editing with Audit Ledger History (Section 20) ---');
  // Admin edits LinkedIn Premium from ₹3,500 to ₹4,000
  // Should reverse original ₹350, calculate new ₹400, award new ₹400 -> Net delta +₹50
  const editResult = await updateUniversalPurchaseAmount({
    purchaseId: purchase1.purchase.id,
    newAmount: 4000,
    reason: 'Customer added 1 extra month',
    adminUserId: 'ADMIN_TEST',
  });
  assert(editResult.success === true, 'Amount edited successfully');
  assert(editResult.oldCredits === 350, 'Original credits ₹350 identified');
  assert(editResult.newCredits === 400, 'New credits ₹400 calculated');
  assert(editResult.netCreditDelta === 50, 'Net delta is +₹50');
  assert(editResult.newBalance === 1600, 'New customer balance is ₹1,600 (₹1,550 + ₹50)', editResult.newBalance);

  // Check ledger has reversal and new award
  const ledgerAfterEdit = await getGlobalCreditLedger({ search: testEmail, limit: 10 });
  const hasReversal = ledgerAfterEdit.transactions.some((t) => t.type === 'REFUND_REVERSAL' && t.amount === -350);
  const hasNewAward = ledgerAfterEdit.transactions.some((t) => t.type === 'PURCHASE_REWARD' && t.amount === 400);
  assert(hasReversal, 'Ledger contains -₹350 REFUND_REVERSAL for adjustment');
  assert(hasNewAward, 'Ledger contains +₹400 PURCHASE_REWARD for adjustment');

  console.log('\n--- TEST 5: Purchase Status Management & Refund Reversal (Section 18 & 21) ---');
  // Mark Adobe purchase (credits: ₹500) as REFUNDED
  const refundResult = await updateUniversalPurchaseStatus({
    purchaseId: purchase2.purchase.id,
    status: 'REFUNDED',
    reason: 'Customer requested refund via WhatsApp',
    adminUserId: 'ADMIN_TEST',
  });
  assert(refundResult.success === true, 'Status marked as REFUNDED');
  assert(refundResult.newBalance === 1100, 'Customer balance reduced by ₹500 to ₹1,100', refundResult.newBalance);

  console.log('\n--- TEST 6: Customer Profile Breakdown by Channel (Section 14) ---');
  const profile = await getAdminCustomerProfileDetails(testUser.id);
  assert(profile.customer.email === testEmail, 'Profile retrieved for customer');
  assert(profile.stats.availableCredits === 1100, 'Profile availableCredits is 1100', profile.stats.availableCredits);
  assert(profile.stats.whatsappPurchases >= 2, 'Profile correctly counts WhatsApp purchases', profile.stats.whatsappPurchases);
  assert(profile.stats.whatsappPurchaseValue >= 12000, 'Profile correctly aggregates WhatsApp purchase value', profile.stats.whatsappPurchaseValue);

  console.log('\n==========================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
