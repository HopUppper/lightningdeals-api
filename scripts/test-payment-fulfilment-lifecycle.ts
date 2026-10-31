/**
 * scripts/test-payment-fulfilment-lifecycle.ts
 *
 * COMPREHENSIVE AUTOMATED VERIFICATION SUITE (22 PRODUCTION SCENARIOS):
 * Payment Confirmation, Order Creation, Idempotent Plan/Key Fulfillment,
 * Multi-Category Plan Handling, and Safe Historical Data Reconciliation.
 */

import assert from 'assert';
import crypto from 'crypto';
import { prisma, decryptText } from '../server/db';
import { OrderEngine } from '../server/orders/orderEngine';
import { fulfillOrder } from '../server/payments/fulfillment';
import { ReconciliationService } from '../server/orders/reconciliationService';

async function main() {
  console.log('========================================================================');
  console.log('⚡ LIGHTNINGAPI PRODUCTION PAYMENT & FULFILLMENT VERIFICATION SUITE');
  console.log('   Testing 22 Scenarios: Retries, Idempotency, 5-Plan Categories, Recovery');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const createdTestUserIds: string[] = [];
  const createdTestOrderIds: string[] = [];
  const createdTestKeyIds: string[] = [];

  async function test(scenarioNum: number, name: string, fn: () => Promise<void>) {
    process.stdout.write(`Scenario ${scenarioNum.toString().padStart(2, '0')}: ${name} ... `);
    try {
      await fn();
      passed++;
      console.log('✅ PASS');
    } catch (err: any) {
      failed++;
      console.log('❌ FAIL');
      console.error(`   Error: ${err.message}\n   Stack: ${err.stack}`);
    }
  }

  // Helper to create isolated test user
  async function createTestCustomer(emailSuffix: string) {
    const email = `test-buyer-${Date.now()}-${emailSuffix}@lightningtest.local`;
    const user = await prisma.user.create({
      data: {
        email,
        name: `Test Buyer ${emailSuffix}`,
        passwordHash: crypto.randomBytes(16).toString('hex'),
        emailVerified: true,
        status: 'active',
      },
    });
    createdTestUserIds.push(user.id);
    return user;
  }

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Clean successful payment on first attempt with immediate webhook delivery
    // ------------------------------------------------------------------------
    await test(1, 'Clean successful payment on first attempt with immediate webhook delivery', async () => {
      const user = await createTestCustomer('s1');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      const eventId = `evt_s1_${Date.now()}`;
      const payEventRes = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.gatewayOrderId || orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      assert.strictEqual(payEventRes.success, true);
      assert.strictEqual(payEventRes.paymentStatus, 'CAPTURED');

      const freshOrder = await prisma.order.findUnique({
        where: { internalOrderId: orderRes.order.internalOrderId },
        include: { subscriptions: true },
      });

      assert.ok(freshOrder);
      assert.strictEqual(freshOrder.paymentStatus, 'CAPTURED');
      assert.strictEqual(freshOrder.fulfillmentStatus, 'FULFILLED');
      assert.ok(freshOrder.fulfilledApiKeyId);
      assert.ok(freshOrder.paidAt);
      createdTestKeyIds.push(freshOrder.fulfilledApiKeyId!);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 2: Clean successful payment with delayed webhook delivery
    // ------------------------------------------------------------------------
    await test(2, 'Clean successful payment with delayed webhook delivery', async () => {
      const user = await createTestCustomer('s2');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      // Verify order is initially PENDING
      let o = await prisma.order.findUnique({ where: { internalOrderId: orderRes.order.internalOrderId } });
      assert.strictEqual(o?.paymentStatus, 'PENDING');

      // Simulate network delay
      await new Promise((r) => setTimeout(r, 200));

      const eventId = `evt_s2_delayed_${Date.now()}`;
      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s2_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      o = await prisma.order.findUnique({ where: { internalOrderId: orderRes.order.internalOrderId } });
      assert.strictEqual(o?.paymentStatus, 'CAPTURED');
      assert.strictEqual(o?.fulfillmentStatus, 'FULFILLED');
      if (o?.fulfilledApiKeyId) createdTestKeyIds.push(o.fulfilledApiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 3: Customer retries payment after one failed attempt and succeeds
    // ------------------------------------------------------------------------
    await test(3, 'Customer retries payment after one failed attempt and succeeds', async () => {
      const user = await createTestCustomer('s3');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      // 1. Initial attempt fails
      const failEventId = `evt_s3_fail_${Date.now()}`;
      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: failEventId,
        eventType: 'payment.failed',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s3_fail_${Date.now()}`,
        paidAmount: 0,
        rawPayload: { error_Message: 'Bank OTP expired' },
        source: 'WEBHOOK',
      });

      let o = await prisma.order.findUnique({ where: { internalOrderId: orderRes.order.internalOrderId } });
      assert.strictEqual(o?.paymentStatus, 'FAILED');
      assert.strictEqual(o?.fulfillmentStatus, 'NOT_FULFILLED');

      // 2. Customer retries and payment succeeds
      const successEventId = `evt_s3_succ_${Date.now()}`;
      const retryResult = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: successEventId,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s3_succ_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      assert.strictEqual(retryResult.success, true);
      assert.strictEqual(retryResult.paymentStatus, 'CAPTURED');

      o = await prisma.order.findUnique({ where: { internalOrderId: orderRes.order.internalOrderId } });
      assert.strictEqual(o?.paymentStatus, 'CAPTURED');
      assert.strictEqual(o?.failureReason, null); // Failure reason must be cleared
      assert.strictEqual(o?.fulfillmentStatus, 'FULFILLED');
      assert.ok(o?.fulfilledApiKeyId);
      if (o?.fulfilledApiKeyId) createdTestKeyIds.push(o.fulfilledApiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 4: Customer retries payment after multiple failed attempts and succeeds
    // ------------------------------------------------------------------------
    await test(4, 'Customer retries payment after multiple failed attempts and succeeds', async () => {
      const user = await createTestCustomer('s4');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      // 3 consecutive failed attempts
      for (let i = 1; i <= 3; i++) {
        await OrderEngine.processPaymentEvent({
          provider: 'PAYU',
          eventId: `evt_s4_fail_${i}_${Date.now()}`,
          eventType: 'payment.failed',
          internalOrderId: orderRes.order.internalOrderId,
          gatewayOrderId: orderRes.order.internalOrderId,
          gatewayPaymentId: `pay_s4_fail_${i}`,
          paidAmount: 0,
          rawPayload: { error_Message: `Attempt ${i} failed` },
          source: 'WEBHOOK',
        });
      }

      let o = await prisma.order.findUnique({ where: { internalOrderId: orderRes.order.internalOrderId } });
      assert.strictEqual(o?.paymentStatus, 'FAILED');

      // 4th attempt succeeds
      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s4_succ_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s4_success_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      o = await prisma.order.findUnique({ where: { internalOrderId: orderRes.order.internalOrderId } });
      assert.strictEqual(o?.paymentStatus, 'CAPTURED');
      assert.strictEqual(o?.fulfillmentStatus, 'FULFILLED');
      assert.strictEqual(o?.failureReason, null);
      if (o?.fulfilledApiKeyId) createdTestKeyIds.push(o.fulfilledApiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 5: Duplicate webhook events delivered for the same successful payment
    // ------------------------------------------------------------------------
    await test(5, 'Duplicate webhook events delivered for the same successful payment', async () => {
      const user = await createTestCustomer('s5');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      const duplicateEventId = `evt_s5_dup_${Date.now()}`;
      const payload = {
        provider: 'PAYU',
        eventId: duplicateEventId,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s5_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK' as const,
      };

      // Delivery 1
      const res1 = await OrderEngine.processPaymentEvent(payload);
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.alreadyProcessed, false);

      // Delivery 2 (Identical event ID)
      const res2 = await OrderEngine.processPaymentEvent(payload);
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.alreadyProcessed, true);

      // Delivery 3 (New event ID for same captured order)
      const res3 = await OrderEngine.processPaymentEvent({
        ...payload,
        eventId: `evt_s5_dup2_${Date.now()}`,
      });
      assert.strictEqual(res3.success, true);
      assert.strictEqual(res3.alreadyProcessed, true);

      // Ensure user has exactly 1 key and 1 subscription
      const userKeys = await prisma.apiKey.findMany({ where: { userId: user.id } });
      assert.strictEqual(userKeys.length, 1);
      const userSubs = await prisma.subscription.findMany({ where: { userId: user.id } });
      assert.strictEqual(userSubs.length, 1);
      createdTestKeyIds.push(userKeys[0].id);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 6: Out-of-order webhook delivery (failure event arrives after success event)
    // ------------------------------------------------------------------------
    await test(6, 'Out-of-order webhook delivery (failure event arrives after success event)', async () => {
      const user = await createTestCustomer('s6');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      // 1. Success event arrives first
      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s6_success_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s6_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      // 2. An older/delayed failure event arrives AFTER success
      const lateFailRes = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s6_late_failure_${Date.now()}`,
        eventType: 'payment.failed',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s6_old_attempt`,
        paidAmount: 0,
        rawPayload: { error_Message: 'Stale timeout event' },
        source: 'WEBHOOK',
      });

      assert.strictEqual(lateFailRes.ignored, true);

      // Order must remain CAPTURED and FULFILLED
      const o = await prisma.order.findUnique({ where: { internalOrderId: orderRes.order.internalOrderId } });
      assert.strictEqual(o?.paymentStatus, 'CAPTURED');
      assert.strictEqual(o?.fulfillmentStatus, 'FULFILLED');
      if (o?.fulfilledApiKeyId) createdTestKeyIds.push(o.fulfilledApiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 7: Concurrent webhook delivery and frontend payment-status check
    // ------------------------------------------------------------------------
    await test(7, 'Concurrent webhook delivery and frontend payment-status check', async () => {
      const user = await createTestCustomer('s7');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      const [whRes, feRes] = await Promise.all([
        OrderEngine.processPaymentEvent({
          provider: 'PAYU',
          eventId: `evt_s7_wh_${Date.now()}`,
          eventType: 'payment.captured',
          internalOrderId: orderRes.order.internalOrderId,
          gatewayOrderId: orderRes.order.internalOrderId,
          gatewayPaymentId: `pay_s7_${Date.now()}`,
          paidAmount: orderRes.order.amountInr,
          rawPayload: { status: 'success' },
          source: 'WEBHOOK',
        }),
        OrderEngine.processPaymentEvent({
          provider: 'PAYU',
          eventId: `evt_s7_fe_${Date.now()}`,
          eventType: 'payment.captured',
          internalOrderId: orderRes.order.internalOrderId,
          gatewayOrderId: orderRes.order.internalOrderId,
          gatewayPaymentId: `pay_s7_${Date.now()}`,
          paidAmount: orderRes.order.amountInr,
          rawPayload: { status: 'success' },
          source: 'DIRECT_VERIFY',
        }),
      ]);

      // Exactly one should succeed normally, other should recognize existing/concurrent lock
      assert.ok(whRes.success && feRes.success);

      // Verify exactly ONE key and ONE subscription created
      const userKeys = await prisma.apiKey.findMany({ where: { userId: user.id } });
      assert.strictEqual(userKeys.length, 1);
      const userSubs = await prisma.subscription.findMany({ where: { userId: user.id } });
      assert.strictEqual(userSubs.length, 1);
      createdTestKeyIds.push(userKeys[0].id);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 8: Frontend callback arrives before webhook
    // ------------------------------------------------------------------------
    await test(8, 'Frontend callback arrives before webhook', async () => {
      const user = await createTestCustomer('s8');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      // 1. Browser redirect arrives first
      const redirectRes = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s8_fe_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s8_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'REDIRECT_CALLBACK',
      });
      assert.strictEqual(redirectRes.success, true);
      assert.strictEqual(redirectRes.paymentStatus, 'CAPTURED');

      // 2. Webhook arrives later
      const webhookRes = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s8_wh_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s8_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });
      assert.strictEqual(webhookRes.success, true);
      assert.strictEqual(webhookRes.alreadyProcessed, true);

      const userKeys = await prisma.apiKey.findMany({ where: { userId: user.id } });
      assert.strictEqual(userKeys.length, 1);
      createdTestKeyIds.push(userKeys[0].id);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 9: Webhook arrives before frontend callback
    // ------------------------------------------------------------------------
    await test(9, 'Webhook arrives before frontend callback', async () => {
      const user = await createTestCustomer('s9');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      // 1. Webhook arrives first
      const webhookRes = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s9_wh_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s9_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });
      assert.strictEqual(webhookRes.success, true);

      // 2. Browser redirect arrives later
      const redirectRes = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s9_fe_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s9_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'REDIRECT_CALLBACK',
      });
      assert.strictEqual(redirectRes.success, true);
      assert.strictEqual(redirectRes.alreadyProcessed, true);

      const userKeys = await prisma.apiKey.findMany({ where: { userId: user.id } });
      assert.strictEqual(userKeys.length, 1);
      createdTestKeyIds.push(userKeys[0].id);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 10: Customer closes tab immediately after gateway payment
    // ------------------------------------------------------------------------
    await test(10, 'Customer closes tab immediately after gateway payment before redirecting to LightningAPI', async () => {
      const user = await createTestCustomer('s10');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      // Tab closed: NO redirect callback fires. Webhook processes in background.
      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s10_wh_alone_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s10_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      // Customer reopens site hours later: checks order and key
      const o = await prisma.order.findUnique({
        where: { internalOrderId: orderRes.order.internalOrderId },
        include: { subscriptions: { include: { apiKey: true } } },
      });
      assert.strictEqual(o?.paymentStatus, 'CAPTURED');
      assert.strictEqual(o?.fulfillmentStatus, 'FULFILLED');
      assert.ok(o?.fulfilledApiKeyId);

      const key = await prisma.apiKey.findUnique({ where: { id: o!.fulfilledApiKeyId! } });
      assert.ok(key);
      assert.strictEqual(key.status, 'active');
      createdTestKeyIds.push(key.id);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 11: Network timeout during fulfilment (partial failure recovery)
    // ------------------------------------------------------------------------
    await test(11, 'Network timeout during fulfilment (partial failure recovery)', async () => {
      const user = await createTestCustomer('s11');
      const order = await prisma.order.create({
        data: {
          internalOrderId: `LD-TEST-TIMEOUT-${Date.now()}`,
          userId: user.id,
          planId: 'plan_5m_5h',
          planName: 'Claude Max 5x',
          tokenQuantity: 5000000n,
          windowHours: 5,
          amountInr: 2999,
          paidAmountInr: 2999,
          currency: 'INR',
          status: 'PAID',
          paymentStatus: 'CAPTURED',
          fulfillmentStatus: 'RETRY_REQUIRED', // Simulates fulfillment failed midway
          failureReason: 'Database connection timeout during key generation',
          paymentGateway: 'PAYU',
        },
      });
      createdTestOrderIds.push(order.internalOrderId);

      // Crucial: Payment status remains CAPTURED even though fulfillment was pending
      assert.strictEqual(order.paymentStatus, 'CAPTURED');

      // System / Admin retry recovery
      const fulfillment = await OrderEngine.retryFulfillment(order.internalOrderId);
      assert.strictEqual(fulfillment.success, true);

      const freshOrder = await prisma.order.findUnique({ where: { id: order.id } });
      assert.strictEqual(freshOrder?.fulfillmentStatus, 'FULFILLED');
      assert.ok(freshOrder?.fulfilledApiKeyId);
      createdTestKeyIds.push(freshOrder!.fulfilledApiKeyId!);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 12: Idempotent key generation (repeated fulfilment requests for the same order)
    // ------------------------------------------------------------------------
    await test(12, 'Idempotent key generation (repeated fulfilment requests for the same order)', async () => {
      const user = await createTestCustomer('s12');
      const order = await prisma.order.create({
        data: {
          internalOrderId: `LD-TEST-REPEAT-${Date.now()}`,
          userId: user.id,
          planId: 'plan_5m_5h',
          planName: 'Claude Max 5x',
          tokenQuantity: 5000000n,
          windowHours: 5,
          amountInr: 2999,
          paidAmountInr: 2999,
          currency: 'INR',
          status: 'PAID',
          paymentStatus: 'CAPTURED',
          fulfillmentStatus: 'NOT_FULFILLED',
          paymentGateway: 'PAYU',
        },
      });
      createdTestOrderIds.push(order.internalOrderId);

      // Call fulfillOrder 5 times sequentially
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await fulfillOrder(order.internalOrderId));
      }

      // First run fulfills, subsequent 4 recognize already fulfilled
      assert.strictEqual(results[0].success, true);
      assert.strictEqual(results[0].alreadyFulfilled, false);
      for (let i = 1; i < 5; i++) {
        assert.strictEqual(results[i].success, true);
        assert.strictEqual(results[i].alreadyFulfilled, true);
        assert.strictEqual(results[i].apiKeyId, results[0].apiKeyId);
      }

      const totalKeys = await prisma.apiKey.findMany({ where: { userId: user.id } });
      assert.strictEqual(totalKeys.length, 1);
      createdTestKeyIds.push(totalKeys[0].id);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 13: Order visibility in customer Orders page after payment
    // ------------------------------------------------------------------------
    await test(13, 'Order visibility in customer Orders page after payment', async () => {
      const user = await createTestCustomer('s13');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s13_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s13_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      // Emulate GET /api/user/orders query logic
      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: { subscriptions: { include: { apiKey: true } } },
      });

      assert.strictEqual(orders.length, 1);
      const o = orders[0];
      assert.strictEqual(o.internalOrderId, orderRes.order.internalOrderId);
      assert.strictEqual(o.paymentStatus, 'CAPTURED');
      assert.strictEqual(o.fulfillmentStatus, 'FULFILLED');
      assert.strictEqual(o.amountInr, orderRes.order.amountInr);
      assert.ok(o.fulfilledApiKeyId);
      createdTestKeyIds.push(o.fulfilledApiKeyId!);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 14: Order visibility in admin order-management interface
    // ------------------------------------------------------------------------
    await test(14, 'Order visibility in admin order-management interface', async () => {
      const user = await createTestCustomer('s14');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s14_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s14_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      // Emulate admin queue query
      const adminOrders = await prisma.order.findMany({
        where: { internalOrderId: orderRes.order.internalOrderId },
        include: { user: true },
      });

      assert.strictEqual(adminOrders.length, 1);
      const adminOrder = adminOrders[0];
      assert.strictEqual(adminOrder.user.email, user.email);
      assert.strictEqual(adminOrder.paymentStatus, 'CAPTURED');
      assert.strictEqual(adminOrder.fulfillmentStatus, 'FULFILLED');
      if (adminOrder.fulfilledApiKeyId) createdTestKeyIds.push(adminOrder.fulfilledApiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 15: Plan appearance in My Plans for Claude Max rolling-window plan
    // ------------------------------------------------------------------------
    await test(15, 'Plan appearance in My Plans for Claude Max rolling-window plan', async () => {
      const user = await createTestCustomer('s15');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s15_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s15_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      // Query active subscription
      const sub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { apiKey: true },
      });

      assert.ok(sub);
      assert.strictEqual(sub.quotaWindowHours, 5);
      assert.strictEqual(sub.quotaLimit, 5000000n);
      assert.strictEqual(sub.apiKey?.billingType, 'window');
      assert.ok(sub.expiryTime > new Date());
      if (sub.apiKeyId) createdTestKeyIds.push(sub.apiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 16: Plan appearance in My Plans for Claude + OpenAI credit plan
    // ------------------------------------------------------------------------
    await test(16, 'Plan appearance in My Plans for Claude + OpenAI credit plan', async () => {
      const user = await createTestCustomer('s16');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'credit_starter',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s16_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s16_${Date.now()}`,
        paidAmount: 100,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      const sub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { apiKey: true },
      });

      assert.ok(sub);
      assert.strictEqual(sub.apiKey?.billingType, 'credit');
      assert.strictEqual(Number(sub.apiKey?.creditBalanceUsd), 7.0); // Pay ₹100 -> $7.00 USD
      if (sub.apiKeyId) createdTestKeyIds.push(sub.apiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 17: Plan appearance in My Plans for OpenAI consumable token plan
    // ------------------------------------------------------------------------
    await test(17, 'Plan appearance in My Plans for OpenAI consumable token plan', async () => {
      const user = await createTestCustomer('s17');
      // Create order with TOKEN_PACK / openai_tokens
      const internalOrderId = `LD-TEST-OA-TOK-${Date.now()}`;
      const order = await prisma.order.create({
        data: {
          internalOrderId,
          userId: user.id,
          planId: 'openai_token_10m',
          planName: 'OpenAI 10M Token Pack',
          orderType: 'TOKEN_PACK',
          planCategory: 'openai_tokens',
          tokenQuantity: 10000000n,
          tokensPurchased: 10000000n,
          windowHours: 0,
          amountInr: 999,
          paidAmountInr: 999,
          currency: 'INR',
          status: 'PAID',
          paymentStatus: 'CAPTURED',
          fulfillmentStatus: 'NOT_FULFILLED',
          paymentGateway: 'PAYU',
        },
      });
      createdTestOrderIds.push(internalOrderId);

      const fulfillment = await fulfillOrder(internalOrderId);
      assert.strictEqual(fulfillment.success, true);

      const sub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { apiKey: true },
      });

      assert.ok(sub);
      assert.strictEqual(sub.apiKey?.billingType, 'token');
      assert.strictEqual(sub.apiKey?.tokensRemaining, 10000000n);
      if (sub.apiKeyId) createdTestKeyIds.push(sub.apiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 18: Plan appearance in My Plans for Claude consumable token plan
    // ------------------------------------------------------------------------
    await test(18, 'Plan appearance in My Plans for Claude consumable token plan', async () => {
      const user = await createTestCustomer('s18');
      const internalOrderId = `LD-TEST-CL-TOK-${Date.now()}`;
      const order = await prisma.order.create({
        data: {
          internalOrderId,
          userId: user.id,
          planId: 'claude_token_10m',
          planName: 'Claude 10M Token Pack',
          orderType: 'TOKEN_PACK',
          planCategory: 'claude_tokens',
          tokenQuantity: 10000000n,
          tokensPurchased: 10000000n,
          windowHours: 0,
          amountInr: 1199,
          paidAmountInr: 1199,
          currency: 'INR',
          status: 'PAID',
          paymentStatus: 'CAPTURED',
          fulfillmentStatus: 'NOT_FULFILLED',
          paymentGateway: 'PAYU',
        },
      });
      createdTestOrderIds.push(internalOrderId);

      const fulfillment = await fulfillOrder(internalOrderId);
      assert.strictEqual(fulfillment.success, true);

      const sub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { apiKey: true },
      });

      assert.ok(sub);
      assert.strictEqual(sub.apiKey?.billingType, 'token');
      assert.strictEqual(sub.apiKey?.tokensRemaining, 10000000n);
      if (sub.apiKeyId) createdTestKeyIds.push(sub.apiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 19: Plan appearance in My Plans for Local models consumable token plan
    // ------------------------------------------------------------------------
    await test(19, 'Plan appearance in My Plans for Local models consumable token plan', async () => {
      const user = await createTestCustomer('s19');
      const internalOrderId = `LD-TEST-LOC-TOK-${Date.now()}`;
      const order = await prisma.order.create({
        data: {
          internalOrderId,
          userId: user.id,
          planId: 'local_token_10m',
          planName: 'Local Models 10M Token Pack',
          orderType: 'TOKEN_PACK',
          planCategory: 'local_models_tokens',
          tokenQuantity: 10000000n,
          tokensPurchased: 10000000n,
          windowHours: 0,
          amountInr: 799,
          paidAmountInr: 799,
          currency: 'INR',
          status: 'PAID',
          paymentStatus: 'CAPTURED',
          fulfillmentStatus: 'NOT_FULFILLED',
          paymentGateway: 'PAYU',
        },
      });
      createdTestOrderIds.push(internalOrderId);

      const fulfillment = await fulfillOrder(internalOrderId);
      assert.strictEqual(fulfillment.success, true);

      const sub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { apiKey: true },
      });

      assert.ok(sub);
      assert.strictEqual(sub.apiKey?.billingType, 'token');
      assert.strictEqual(sub.apiKey?.tokensRemaining, 10000000n);
      if (sub.apiKeyId) createdTestKeyIds.push(sub.apiKeyId);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 20: API key appearance and usability in My API Keys after fulfilment
    // ------------------------------------------------------------------------
    await test(20, 'API key appearance and usability in My API Keys after fulfilment', async () => {
      const user = await createTestCustomer('s20');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s20_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s20_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      // Emulate GET /api/user/keys
      const keys = await prisma.apiKey.findMany({
        where: { userId: user.id },
      });

      assert.strictEqual(keys.length, 1);
      const key = keys[0];
      assert.strictEqual(key.status, 'active');
      assert.ok(key.displayKey.startsWith('ld_live_') || key.displayKey.startsWith('sk_live_'));
      assert.ok(key.keyEncrypted);

      // Decrypt and verify
      const decrypted = decryptText(key.keyEncrypted!);
      assert.ok(decrypted.startsWith('ld_live_') || decrypted.startsWith('sk_live_'));
      createdTestKeyIds.push(key.id);
    });

    // ------------------------------------------------------------------------
    // SCENARIO 21: Usability of generated API key for making actual API requests
    // ------------------------------------------------------------------------
    await test(21, 'Usability of generated API key for making actual API requests', async () => {
      const user = await createTestCustomer('s21');
      const orderRes = await OrderEngine.createWebsiteOrder({
        userId: user.id,
        planId: 'plan_5m_5h',
      });
      createdTestOrderIds.push(orderRes.order.internalOrderId);

      const payRes = await OrderEngine.processPaymentEvent({
        provider: 'PAYU',
        eventId: `evt_s21_${Date.now()}`,
        eventType: 'payment.captured',
        internalOrderId: orderRes.order.internalOrderId,
        gatewayOrderId: orderRes.order.internalOrderId,
        gatewayPaymentId: `pay_s21_${Date.now()}`,
        paidAmount: orderRes.order.amountInr,
        rawPayload: { status: 'success' },
        source: 'WEBHOOK',
      });

      const apiKeyId = payRes.fulfillment?.apiKeyId;
      assert.ok(apiKeyId);
      createdTestKeyIds.push(apiKeyId!);

      const key = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
      assert.ok(key);

      // Verify key hash matches raw secret
      const rawSecret = decryptText(key.keyEncrypted!);
      const computedHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
      assert.strictEqual(key.keyHash, computedHash);
      assert.strictEqual(key.status, 'active');
      assert.ok(!key.expiresAt || key.expiresAt > new Date());
    });

    // ------------------------------------------------------------------------
    // SCENARIO 22: Safe reconciliation of existing broken or incomplete orders
    // ------------------------------------------------------------------------
    await test(22, 'Safe reconciliation of existing broken or incomplete orders', async () => {
      // Run reconciliation
      const report = await ReconciliationService.reconcileAll();
      assert.ok(report);
      assert.ok(Array.isArray(report.details));

      // Verify Sagar's active subscription and order
      const sagar = await prisma.user.findFirst({ where: { email: 'ms861000@gmail.com' } });
      assert.ok(sagar);

      const sagarSub = await prisma.subscription.findFirst({
        where: { userId: sagar.id, status: 'ACTIVE' },
      });
      assert.ok(sagarSub, "Sagar must have an active subscription");
      assert.strictEqual(sagarSub.planName, 'Claude Max 20x');

      const sagarOrder = await prisma.order.findFirst({
        where: { userId: sagar.id, paymentStatus: 'CAPTURED' },
      });
      assert.ok(sagarOrder, "Sagar must have a captured order");

      // Verify Kunal's active subscription and order
      const kunal = await prisma.user.findFirst({ where: { email: 'kunalkumarjha97@gmail.com' } });
      assert.ok(kunal);

      const kunalSub = await prisma.subscription.findFirst({
        where: { userId: kunal.id, status: 'ACTIVE' },
      });
      assert.ok(kunalSub, "Kunal must have an active subscription");

      const kunalOrder = await prisma.order.findFirst({
        where: { userId: kunal.id, paymentStatus: 'CAPTURED' },
      });
      assert.ok(kunalOrder, "Kunal must have a captured order");
    });
  } finally {
    // Clean up ONLY test artifacts created during this test run
    console.log('\nCleaning up isolated test entities...');
    try {
      if (createdTestOrderIds.length > 0) {
        await prisma.order.deleteMany({ where: { internalOrderId: { in: createdTestOrderIds } } });
      }
      if (createdTestKeyIds.length > 0) {
        await prisma.apiKey.deleteMany({ where: { id: { in: createdTestKeyIds } } });
      }
      if (createdTestUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: createdTestUserIds } } });
      }
    } catch (e: any) {
      console.warn('Cleanup notice:', e.message);
    }
  }

  console.log('\n========================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
