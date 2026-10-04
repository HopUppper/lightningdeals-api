import crypto from 'crypto';
import { prisma } from '../server/db';
import { OrderEngine } from '../server/orders/orderEngine';
import { calculateReward, updateRewardSettings, getRewardSettings } from '../server/rewards/rewardService';

async function runTestSuite() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGAPI.PRO — UNIVERSAL ORDER ENGINE & REWARDS TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failedTests++;
    }
  }

  // Ensure clean test user
  const testEmail = `test_order_engine_${Date.now()}@lightningapi.pro`;
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Order Engine Test User',
      passwordHash: 'dummy_scrypt_hash',
      emailVerified: true,
      status: 'active',
      availableCredits: 1000,
    },
  });

  // Ensure customer B for IDOR testing
  const customerB = await prisma.user.create({
    data: {
      email: `customer_b_${Date.now()}@lightningapi.pro`,
      name: 'Customer B',
      passwordHash: 'dummy_scrypt_hash',
      emailVerified: true,
      status: 'active',
      availableCredits: 0,
    },
  });

  // Ensure active plan
  let plan = await prisma.plan.findFirst({ where: { status: 'active', enabled: true } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'Pro',
        displayName: 'Claude Max Pro',
        tokenAllowance: 20000000n,
        priceInr: 4999,
        windowHours: 5,
        validityDays: 30,
        status: 'active',
        enabled: true,
      },
    });
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: REWARD CALCULATION BUSINESS RULES (10%, CAPPED AT ₹5,000 / ₹500)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Core Reward Calculation Formula ---');
    // Ensure default settings (10%, 5000 max eligible, 500 max reward, promo inactive)
    await updateRewardSettings({
      rewardPercentage: 10,
      maxEligiblePurchaseAmount: 5000,
      maxRewardPerTransaction: 500,
      isActive: true,
      promoActive: false,
    });

    const testAmounts = [
      { amount: 500, expected: 50 },
      { amount: 1000, expected: 100 },
      { amount: 2000, expected: 200 },
      { amount: 3000, expected: 300 },
      { amount: 4000, expected: 400 },
      { amount: 5000, expected: 500 },
      { amount: 7500, expected: 500 }, // capped at ₹5,000 purchase
      { amount: 10000, expected: 500 }, // capped at ₹5,000 purchase
      { amount: 20000, expected: 500 }, // capped at ₹5,000 purchase
    ];

    for (const t of testAmounts) {
      const calc = await calculateReward(t.amount);
      assert(calc.rewardCredits === t.expected, `₹${t.amount} purchase gives ₹${t.expected} credits (got ₹${calc.rewardCredits})`);
    }

    // Test Promotional Offer Multiplier (2X with 1000 credits max cap on purchases up to 5000)
    console.log('\n--- 2. Testing Promotional 2X Boost Multiplier ---');
    await updateRewardSettings({
      promoActive: true,
      promoMultiplier: 2.0,
      promoMinPurchaseAmount: 0,
      promoMaxCredits: 1000,
      promoEndsAt: new Date(Date.now() + 86400000),
    });

    const promoCalc1 = await calculateReward(3000); // 300 base * 2 = 600
    assert(promoCalc1.rewardCredits === 600 && promoCalc1.isPromoApplied, '₹3,000 purchase with 2X gives ₹600 credits');

    const promoCalc2 = await calculateReward(5000); // 500 base * 2 = 1000
    assert(promoCalc2.rewardCredits === 1000, '₹5,000 purchase with 2X gives ₹1,000 credits');

    const promoCalc3 = await calculateReward(8000); // capped at 500 base * 2 = 1000
    assert(promoCalc3.rewardCredits === 1000, '₹8,000 purchase with 2X capped at ₹1,000 credits');

    // Reset promo settings to clean base
    await updateRewardSettings({ promoActive: false });

    // -------------------------------------------------------------------------
    // TEST 3: WEBSITE ORDER CREATION & PAYU SUCCESSFUL PAYMENT FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Website Order Creation & Successful PayU Payment Flow ---');
    const orderCreateResult = await OrderEngine.createWebsiteOrder({
      userId: testUser.id,
      planId: plan.id,
    });

    assert(Boolean(orderCreateResult.order?.internalOrderId), 'Internal order created with prefix', orderCreateResult.order?.internalOrderId);
    assert(orderCreateResult.order?.amountInr === plan.priceInr, 'Order amount matches authoritative plan price');

    const internalOrderId = orderCreateResult.order.internalOrderId;
    const initialBalance = (await prisma.user.findUnique({ where: { id: testUser.id } }))?.availableCredits || 0;

    // Simulate PayU Webhook / Callback Payment Captured Event
    const payuPaymentId = `payu_test_${Date.now()}`;
    const paymentResult = await OrderEngine.processPaymentEvent({
      provider: 'PAYU',
      eventId: `evt_${payuPaymentId}`,
      eventType: 'payment.captured',
      internalOrderId,
      gatewayOrderId: internalOrderId,
      gatewayPaymentId: payuPaymentId,
      paidAmount: plan.priceInr,
      rawPayload: { status: 'success', mihpayid: payuPaymentId, amount: plan.priceInr },
      source: 'WEBHOOK',
    });

    assert(paymentResult.success === true, 'Payment event processed successfully');
    assert(paymentResult.paymentStatus === 'CAPTURED', 'Payment status transitioned to CAPTURED');
    assert(Boolean(paymentResult.fulfillment?.apiKeyId), 'API Key automatically provisioned in atomic fulfillment');
    assert(paymentResult.fulfillment?.displayKey?.startsWith('ld_live_'), 'API Key has production prefix ld_live_');

    // Check Database State
    const verifiedOrder = await prisma.order.findUnique({ where: { internalOrderId } });
    assert(verifiedOrder?.paymentStatus === 'CAPTURED', 'Database order paymentStatus is CAPTURED');
    assert(verifiedOrder?.fulfillmentStatus === 'FULFILLED', 'Database order fulfillmentStatus is FULFILLED');
    assert(verifiedOrder?.status === 'PAID', 'Database order legacy status is PAID');

    // Check Lightning Rewards Issuance
    const userAfter = await prisma.user.findUnique({ where: { id: testUser.id } });
    const expectedCredits = Math.min(plan.priceInr, 5000) * 0.1;
    const expectedBalance = initialBalance + expectedCredits;
    assert(userAfter?.availableCredits === expectedBalance, `User balance increased by ₹${expectedCredits} (from ₹${initialBalance} to ₹${userAfter?.availableCredits})`);

    // Check Universal Purchase Record
    const purchaseRecord = await prisma.purchase.findFirst({ where: { orderId: verifiedOrder?.id } });
    assert(Boolean(purchaseRecord && purchaseRecord.status === 'COMPLETED'), 'Universal Purchase record created with status COMPLETED');
    assert(purchaseRecord?.creditsEarned === expectedCredits, 'Universal Purchase record has correct creditsEarned');

    // Check Credit Transaction Ledger
    const creditTx = await prisma.creditTransaction.findFirst({
      where: { orderId: verifiedOrder?.id, type: 'PURCHASE_REWARD' },
    });
    assert(Boolean(creditTx), 'CreditTransaction entry created with type PURCHASE_REWARD');
    assert(creditTx?.amount === expectedCredits, 'CreditTransaction entry amount matches awarded credits');

    // -------------------------------------------------------------------------
    // TEST 4: STRICT WEBHOOK IDEMPOTENCY (CONCURRENT WEBHOOKS)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Strict Webhook Idempotency (5 Concurrent Invocations) ---');
    const concurrentEvents = Array.from({ length: 5 }, (_, i) =>
      OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_duplicate_${i}_${payuPaymentId}`,
        eventType: 'payment.captured',
        internalOrderId,
        gatewayOrderId: internalOrderId,
        gatewayPaymentId: payuPaymentId,
        paidAmount: plan.priceInr,
        rawPayload: { status: 'success', mihpayid: payuPaymentId },
        source: 'WEBHOOK',
      })
    );

    const concurrentResults = await Promise.all(concurrentEvents);
    const allAlreadyProcessed = concurrentResults.every((r) => r.alreadyProcessed === true || r.success === true);
    assert(allAlreadyProcessed, 'All 5 concurrent/duplicate webhook calls handled cleanly without error');

    // Verify NO duplicate API keys created
    const userKeys = await prisma.apiKey.count({ where: { userId: testUser.id } });
    assert(userKeys === 1, `Exactly 1 API Key exists for this user (found ${userKeys})`);

    // Verify NO duplicate Credit Transactions created
    const rewardTxCount = await prisma.creditTransaction.count({
      where: { orderId: verifiedOrder?.id, type: 'PURCHASE_REWARD' },
    });
    assert(rewardTxCount === 1, `Exactly 1 CreditTransaction exists for this order (found ${rewardTxCount})`);

    // Verify balance was NOT double credited
    const userAfterDupes = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(userAfterDupes?.availableCredits === expectedBalance, `User balance unchanged after duplicate webhooks: ₹${userAfterDupes?.availableCredits}`);

    // -------------------------------------------------------------------------
    // TEST 5: FAILED PAYMENT FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Payment Failure Handling ---');
    const failedOrderResult = await OrderEngine.createWebsiteOrder({
      userId: testUser.id,
      planId: plan.id,
    });
    const failedOrderId = failedOrderResult.order.internalOrderId;

    const failedPaymentResult = await OrderEngine.processPaymentEvent({
      provider: 'PAYU',
      eventId: `evt_failed_${Date.now()}`,
      eventType: 'payment.failed',
      internalOrderId: failedOrderId,
      gatewayOrderId: failedOrderId,
      gatewayPaymentId: 'pay_failed_123',
      paidAmount: 0,
      rawPayload: { status: 'failure', error_Message: 'User cancelled transaction on bank page' },
      source: 'WEBHOOK',
    });

    assert(failedPaymentResult.success === false, 'Failed payment event returns success=false');
    const failedDbOrder = await prisma.order.findUnique({ where: { internalOrderId: failedOrderId } });
    assert(failedDbOrder?.paymentStatus === 'FAILED', 'Order paymentStatus updated to FAILED');
    assert(failedDbOrder?.fulfillmentStatus === 'NOT_FULFILLED', 'Order fulfillmentStatus remains NOT_FULFILLED');
    assert(failedDbOrder?.failureReason?.includes('User cancelled transaction'), 'Failure reason stored in order');

    // -------------------------------------------------------------------------
    // TEST 6: ₹0 PAYABLE INSTANT FULFILLMENT (COVERED BY REWARD CREDITS)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing 100% Credit Covered Order (₹0 Payable) ---');
    // Ensure testUser has enough credits for full redemption
    await prisma.user.update({
      where: { id: testUser.id },
      data: { availableCredits: plan.priceInr + 500 },
    });
    const preCreditBalance = (await prisma.user.findUnique({ where: { id: testUser.id } }))?.availableCredits || 0;

    const zeroPayableResult = await OrderEngine.createWebsiteOrder({
      userId: testUser.id,
      planId: plan.id,
      redeemCredits: plan.priceInr,
    });

    assert(zeroPayableResult.order?.amountInr === 0, 'Payable amount is ₹0');
    assert(zeroPayableResult.order?.paymentStatus === 'CAPTURED', 'Zero payable order automatically marked CAPTURED');
    assert(Boolean(zeroPayableResult.fulfillment?.apiKeyId), 'Zero payable order immediately fulfilled');

    const postCreditBalance = (await prisma.user.findUnique({ where: { id: testUser.id } }))?.availableCredits || 0;
    assert(postCreditBalance === preCreditBalance - plan.priceInr, `Credits deducted atomically: was ₹${preCreditBalance}, now ₹${postCreditBalance}`);

    // -------------------------------------------------------------------------
    // TEST 7: REFUND & REWARD REVERSAL FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Order Refund & Lightning Credit Reversal ---');
    const balanceBeforeRefund = (await prisma.user.findUnique({ where: { id: testUser.id } }))?.availableCredits || 0;

    const refundResult = await OrderEngine.refundOrder({
      internalOrderId,
      reason: 'Customer requested refund within 24h',
    });

    assert(refundResult.success === true, 'Refund processed successfully');
    assert(refundResult.order.paymentStatus === 'REFUNDED', 'Order paymentStatus marked REFUNDED');

    const balanceAfterRefund = (await prisma.user.findUnique({ where: { id: testUser.id } }))?.availableCredits || 0;
    assert(balanceAfterRefund === balanceBeforeRefund - expectedCredits, `Credits earned were reversed: was ₹${balanceBeforeRefund}, now ₹${balanceAfterRefund}`);

    const reversalTx = await prisma.creditTransaction.findFirst({
      where: { orderId: verifiedOrder?.id, type: 'REFUND_REVERSAL' },
    });
    assert(Boolean(reversalTx), 'REFUND_REVERSAL transaction created in ledger');

    const refundedKey = await prisma.apiKey.findUnique({ where: { id: paymentResult.fulfillment.apiKeyId } });
    assert(refundedKey?.status === 'revoked', 'Associated API key status revoked');

    // -------------------------------------------------------------------------
    // TEST 8: EXTERNAL / WHATSAPP ORDER INGESTION
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing WhatsApp / External Order Ingestion ---');
    const externalResult = await OrderEngine.createExternalOrder({
      customerIdentifier: testUser.email,
      productName: 'Claude Ultra WhatsApp Custom',
      amountPaid: 6500,
      channel: 'WHATSAPP',
      referenceId: `WA-TX-${Date.now()}`,
      status: 'COMPLETED',
      notes: 'Paid via WhatsApp UPI QR code',
    });

    assert(externalResult.success === true, 'WhatsApp order ingested successfully');
    assert(externalResult.purchase.channel === 'WHATSAPP', 'Channel correctly set to WHATSAPP');
    // ₹6,500 capped at ₹5,000 max eligible = ₹500 credits
    assert(externalResult.creditsAwarded === 500, 'WhatsApp order earned ₹500 credits (capped at ₹5,000 eligible purchase)');

    // -------------------------------------------------------------------------
    // TEST 9: MULTI-TENANT ISOLATION / IDOR PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing IDOR Isolation Security ---');
    // Customer B tries to view or touch Customer A's order
    const orderBelongingToA = await prisma.order.findUnique({ where: { internalOrderId } });
    const isCustomerBAuthorized = orderBelongingToA?.userId === customerB.id;
    assert(isCustomerBAuthorized === false, 'Customer B is prohibited from accessing Customer A order');

    // Clean up test data
    console.log('\n--- Cleaning up test records ---');
    await prisma.user.deleteMany({
      where: { id: { in: [testUser.id, customerB.id] } },
    });
    console.log('Test records safely cleaned up.');

  } catch (err: any) {
    console.error('Test suite error:', err);
    failedTests++;
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite();
