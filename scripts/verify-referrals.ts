import crypto from 'crypto';
import { prisma } from '../server/db';
import { ReferralEngine } from '../server/referrals/referralEngine';
import { OrderEngine } from '../server/orders/orderEngine';
import { calculateReward } from '../server/rewards/rewardService';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  ✅ PASS: ${name}${details ? ` (${details})` : ''}`);
  } else {
    results.push({ name, passed: false, error: details || 'Assertion failed' });
    console.error(`  ❌ FAIL: ${name}${details ? ` (${details})` : ''}`);
  }
}

async function runReferralTestSuite() {
  console.log('============================================================');
  console.log('⚡ LIGHTNINGAPI.PRO — REFERRAL SYSTEM VERIFICATION SUITE');
  console.log('============================================================\n');

  const testSuffix = Date.now().toString().slice(-6);

  try {
    // 0. Clean Test Users Setup
    console.log('--- 1. REFERRAL CODE & IDENTITY GENERATION ---');
    const userA = await prisma.user.create({
      data: {
        email: `test_ref_a_${testSuffix}@example.com`,
        name: `Referrer User A ${testSuffix}`,
        passwordHash: 'dummy_hash_scrypt_test',
        emailVerified: true,
        status: 'active',
        availableCredits: 0,
        lifetimeCreditsEarned: 0,
      },
    });

    const codeA = await ReferralEngine.getOrCreateUserReferralCode(userA.id);
    assert(Boolean(codeA) && codeA.length >= 6, 'Unique referral code generated for customer', `Code: ${codeA}`);

    // Verify resolveReferralCode
    const resolveCheck = await ReferralEngine.resolveReferralCode(codeA);
    assert(resolveCheck.valid === true, 'Public resolveReferralCode succeeds for valid code');
    assert((resolveCheck as any).referrerFirstName.includes('Referrer'), 'Public resolve returns privacy-safe first name');

    // Invalid code check
    const invalidCheck = await ReferralEngine.resolveReferralCode('INVALID_NON_EXISTENT_999');
    assert(invalidCheck.valid === false, 'Public resolve fails cleanly for invalid code');

    // 1. Click Attribution Tracking
    console.log('\n--- 2. REFERRAL LINK CLICK TRACKING ---');
    const clickTrack = await ReferralEngine.recordReferralClick({
      code: codeA,
      ipAddress: '198.51.100.1',
      userAgent: 'Mozilla/5.0 Test Browser',
      landingPage: '/?ref=' + codeA,
    });
    assert(clickTrack.success === true, 'Referral click recorded in database');

    // 2. Anti-Abuse: Self-Referral Prevention
    console.log('\n--- 3. ANTI-ABUSE & FRAUD PREVENTION ---');
    const selfRefCheck = await ReferralEngine.attributeReferral({
      customerId: userA.id,
      referralCode: codeA,
    });
    assert(selfRefCheck.success === false && selfRefCheck.reason === 'SELF_REFERRAL_BLOCKED', 'Self-referral by same account ID blocked');

    // Self-referral by normalized email match
    const userASimilar = await prisma.user.create({
      data: {
        email: `TEST_REF_A_${testSuffix}@EXAMPLE.COM`,
        name: `Uppercase Variant ${testSuffix}`,
        passwordHash: 'dummy_hash',
        emailVerified: true,
        status: 'active',
      },
    });
    const emailMatchCheck = await ReferralEngine.attributeReferral({
      customerId: userASimilar.id,
      referralCode: codeA,
    });
    assert(emailMatchCheck.success === false, 'Self-referral by matching normalized email blocked');

    // 3. Normal Attribution Flow (Person B registers with A's code)
    console.log('\n--- 4. REGISTRATION & ATTRIBUTION FLOW ---');
    const userB = await prisma.user.create({
      data: {
        email: `test_ref_b_${testSuffix}@example.com`,
        name: `Referred Customer B ${testSuffix}`,
        passwordHash: 'dummy_hash',
        emailVerified: true,
        status: 'active',
        availableCredits: 0,
        lifetimeCreditsEarned: 0,
      },
    });

    const attribB = await ReferralEngine.attributeReferral({
      customerId: userB.id,
      referralCode: codeA,
      source: 'DIRECT_LINK',
      ipAddress: '198.51.100.2',
    });
    assert(attribB.success === true, 'Customer B successfully attributed to Referrer A');

    // First Valid Attribution Wins Rule
    const userC = await prisma.user.create({
      data: {
        email: `test_ref_c_${testSuffix}@example.com`,
        name: `Third Referrer C ${testSuffix}`,
        passwordHash: 'dummy_hash',
        emailVerified: true,
        status: 'active',
      },
    });
    const codeC = await ReferralEngine.getOrCreateUserReferralCode(userC.id);

    // B tries to click C's link after already being attributed to A
    const secondAttribCheck = await ReferralEngine.attributeReferral({
      customerId: userB.id,
      referralCode: codeC,
    });
    assert(
      secondAttribCheck.alreadyAttributed === true || secondAttribCheck.referral?.referrerId === userA.id,
      'First valid attribution wins (subsequent referrer C does not overwrite A)'
    );

    // Circular Referral Prevention (B tries to refer A)
    const codeB = await ReferralEngine.getOrCreateUserReferralCode(userB.id);
    const circularCheck = await ReferralEngine.attributeReferral({
      customerId: userA.id,
      referralCode: codeB,
    });
    assert(circularCheck.success === false && circularCheck.reason === 'CIRCULAR_REFERRAL_BLOCKED', 'Circular referral (A -> B -> A) blocked');

    // 4. Qualifying Purchase & Reward Issuance (₹3,500)
    console.log('\n--- 5. QUALIFYING PURCHASE & REWARD CALCULATION ---');
    const purchaseAmount = 3500;
    const orderB1 = await prisma.order.create({
      data: {
        internalOrderId: `LD-TEST-B1-${testSuffix}`,
        userId: userB.id,
        planId: 'plan_pro',
        planName: 'Claude Max Pro',
        amountInr: purchaseAmount,
        paidAmountInr: purchaseAmount,
        currency: 'INR',
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FULFILLED',
        status: 'PAID',
      },
    });

    // Process Referral Qualification for Order 1
    const qualResult1 = await ReferralEngine.processOrderReferralQualification({
      orderId: orderB1.id,
      userId: userB.id,
      amountPaid: purchaseAmount,
    });

    assert(qualResult1.qualified === true, 'Referral qualifying purchase validated');
    assert(qualResult1.creditsAwarded === 350, 'Referral credits awarded match 10% (₹350)', `Credits: ${qualResult1.creditsAwarded}`);

    // Verify Referrer A's balance & credit transaction
    const refreshedA = await prisma.user.findUnique({ where: { id: userA.id } });
    assert(refreshedA?.availableCredits === 350, 'Referrer A available balance credited with ₹350');

    const txA = await prisma.creditTransaction.findFirst({
      where: { orderId: orderB1.id, type: 'REFERRAL_REWARD' },
    });
    assert(Boolean(txA) && txA?.amount === 350, 'CreditTransaction of type REFERRAL_REWARD recorded in ledger');

    // 5. Idempotency Check (Duplicate webhook / process)
    console.log('\n--- 6. IDEMPOTENCY & DUPLICATE PROTECTION ---');
    const duplicateQual = await ReferralEngine.processOrderReferralQualification({
      orderId: orderB1.id,
      userId: userB.id,
      amountPaid: purchaseAmount,
    });
    assert(duplicateQual.alreadyCredited === true, 'Duplicate payment event safely handled without double-crediting');

    const refreshedAAfterDup = await prisma.user.findUnique({ where: { id: userA.id } });
    assert(refreshedAAfterDup?.availableCredits === 350, 'Referrer balance untouched upon duplicate processing');

    // 6. First Purchase Only Rule (Second purchase by B)
    console.log('\n--- 7. FIRST PURCHASE ONLY POLICY ---');
    const orderB2 = await prisma.order.create({
      data: {
        internalOrderId: `LD-TEST-B2-${testSuffix}`,
        userId: userB.id,
        planId: 'plan_ultra',
        planName: 'Claude Max Ultra',
        amountInr: 2000,
        paidAmountInr: 2000,
        currency: 'INR',
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FULFILLED',
        status: 'PAID',
      },
    });

    const qualResult2 = await ReferralEngine.processOrderReferralQualification({
      orderId: orderB2.id,
      userId: userB.id,
      amountPaid: 2000,
    });
    assert(
      qualResult2.qualified === false && qualResult2.reason === 'FIRST_PURCHASE_ONLY_ALREADY_REWARDED',
      'Second purchase by B does not produce second referral reward under FIRST_PURCHASE_ONLY'
    );

    // 7. Minimum Purchase Rule (< ₹500)
    console.log('\n--- 8. MINIMUM PURCHASE AMOUNT ENFORCEMENT ---');
    const userD = await prisma.user.create({
      data: {
        email: `test_ref_d_${testSuffix}@example.com`,
        name: `Referred D ${testSuffix}`,
        passwordHash: 'dummy',
        emailVerified: true,
        status: 'active',
      },
    });
    await ReferralEngine.attributeReferral({ customerId: userD.id, referralCode: codeA });

    const orderDLow = await prisma.order.create({
      data: {
        internalOrderId: `LD-TEST-D-LOW-${testSuffix}`,
        userId: userD.id,
        amountInr: 400,
        paidAmountInr: 400,
        currency: 'INR',
        paymentStatus: 'CAPTURED',
        status: 'PAID',
      },
    });

    const qualLow = await ReferralEngine.processOrderReferralQualification({
      orderId: orderDLow.id,
      userId: userD.id,
      amountPaid: 400,
    });
    assert(
      qualLow.qualified === false && qualLow.reason === 'MINIMUM_PURCHASE_NOT_MET',
      'Purchase under ₹500 minimum generates ₹0 referral credits'
    );

    // 8. Reward Cap Enforcement (₹10,000 purchase)
    console.log('\n--- 9. PER-PURCHASE REWARD CAP ENFORCEMENT ---');
    const userE = await prisma.user.create({
      data: {
        email: `test_ref_e_${testSuffix}@example.com`,
        name: `Referred E ${testSuffix}`,
        passwordHash: 'dummy',
        emailVerified: true,
        status: 'active',
      },
    });
    await ReferralEngine.attributeReferral({ customerId: userE.id, referralCode: codeA });

    const orderEHigh = await prisma.order.create({
      data: {
        internalOrderId: `LD-TEST-E-HIGH-${testSuffix}`,
        userId: userE.id,
        amountInr: 10000,
        paidAmountInr: 10000,
        currency: 'INR',
        paymentStatus: 'CAPTURED',
        status: 'PAID',
      },
    });

    const qualHigh = await ReferralEngine.processOrderReferralQualification({
      orderId: orderEHigh.id,
      userId: userE.id,
      amountPaid: 10000,
    });
    assert(
      qualHigh.qualified === true && qualHigh.creditsAwarded === 500,
      'Large purchase of ₹10,000 is capped at ₹500 referral reward'
    );

    // 9. Refund & Clawback Handling
    console.log('\n--- 10. REFUND & REVERSAL FLOW ---');
    const reversalResult = await ReferralEngine.reverseReferralReward({
      orderId: orderEHigh.id,
      reason: 'Customer requested refund',
      adminUserId: 'admin_test_1',
    });
    assert(reversalResult.reversed === true, 'Referral reward cleanly reversed upon order refund');

    const revTx = await prisma.creditTransaction.findFirst({
      where: { orderId: orderEHigh.id, type: 'REFUND_REVERSAL', userId: userA.id },
    });
    assert(Boolean(revTx) && revTx?.amount === -500, 'Negative REFUND_REVERSAL transaction created in credit ledger');

    // 10. Refund When Referrer Has Already Spent/Redeemed Credits (No Negative Balance)
    console.log('\n--- 11. INSUFFICIENT BALANCE CLAWBACK PROTECTION ---');
    // Reduce User A balance to ₹0 (simulating customer spent credits)
    await prisma.user.update({
      where: { id: userA.id },
      data: { availableCredits: 0 },
    });

    // Now try to refund order B1 (which awarded ₹350)
    const reviewResult = await ReferralEngine.reverseReferralReward({
      orderId: orderB1.id,
      reason: 'Order B1 refunded after credits were already spent',
      adminUserId: 'admin_test_1',
    });

    assert(reviewResult.requiresReview === true, 'Flagged for Admin Review instead of corrupting balance to negative');
    const userAProtected = await prisma.user.findUnique({ where: { id: userA.id } });
    assert(userAProtected?.availableCredits === 0, 'User balance protected from going negative');

    const flaggedRef = await prisma.referral.findFirst({
      where: { qualifyingOrderId: orderB1.id },
    });
    assert(flaggedRef?.riskStatus === 'REVIEW_REQUIRED', 'Referral record marked REVIEW_REQUIRED');

    // 11. Customer Overview & Privacy Masking
    console.log('\n--- 12. CUSTOMER OVERVIEW & PRIVACY PROTECTION ---');
    const overviewA = await ReferralEngine.getCustomerReferralOverview(userA.id);
    assert(Boolean(overviewA.referralCode), 'Customer overview returns referral code');
    assert(Boolean(overviewA.referralUrl), 'Customer overview returns shareable URL');
    assert(overviewA.referrals.length >= 2, 'Customer overview returns associated referrals');

    // Verify privacy masking
    const firstMasked = overviewA.referrals[0];
    assert(
      firstMasked.displayName.includes('***'),
      'Privacy masking verified: full customer email is not exposed to referrer',
      `Masked: ${firstMasked.displayName}`
    );

    // 12. Admin Analytics & Actions
    console.log('\n--- 13. ADMIN ANALYTICS & ACTIONS ---');
    const adminAnalytics = await ReferralEngine.getAdminAnalytics();
    assert(adminAnalytics.metrics.totalReferrals > 0, 'Admin analytics accurately aggregates total referrals');
    assert(adminAnalytics.topReferrers.length > 0, 'Admin analytics computes top referrers leaderboard');

    // Admin action: Disqualify
    const actionDisqualify = await ReferralEngine.adminAction({
      referralId: flaggedRef!.id,
      action: 'DISQUALIFY',
      reason: 'Manual abuse investigation',
      adminUserId: 'admin_test_1',
    });
    assert(actionDisqualify.referral.status === 'DISQUALIFIED', 'Admin can disqualify suspicious referrals');

    // Admin action: Approve
    const actionApprove = await ReferralEngine.adminAction({
      referralId: flaggedRef!.id,
      action: 'APPROVE',
      reason: 'Verified legitimate account',
      adminUserId: 'admin_test_1',
    });
    assert(actionApprove.referral.riskStatus === 'NORMAL', 'Admin can approve / clear risk on referrals');

    // Admin settings update
    const updatedSettings = await ReferralEngine.updateSettings({
      minPurchaseAmountInr: 500,
      attributionWindowDays: 30,
      maxRewardPerOrder: 500,
    });
    assert(updatedSettings.minPurchaseAmountInr === 500, 'Admin can safely update referral system configuration');

    console.log('\n============================================================');
    console.log(`TEST SUITE RESULTS: ${results.filter((r) => r.passed).length} / ${results.length} PASSED`);
    console.log('============================================================\n');

    const allPassed = results.every((r) => r.passed);
    if (!allPassed) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Test suite fatal failure:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runReferralTestSuite();
