import express from 'express';
import { prisma } from '../server/db';
import { checkoutRouter, handlePaymentWebhook } from '../server/payments/paymentRoutes';
import { getPlanById } from '../server/payments/plans';
import { fulfillOrder } from '../server/payments/fulfillment';

async function runPaymentSuite() {
  console.log('==================================================');
  console.log('⚡ LIGHTNINGDEALS LOCAL PAYMENT & FULFILLMENT SUITE');
  console.log('==================================================\n');

  // Find or create test customer user
  const testEmail = 'checkout_test_customer_2026@gmail.com';
  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Checkout Test Customer',
        email: testEmail,
        passwordHash: 'scrypt$dummy_hash',
        role: 'user',
        emailVerified: true,
        status: 'active',
      },
    });
  }

  console.log('✅ Test Customer Account:', { id: user.id, email: user.email });

  // 1. TEST 5M PLAN CHECKOUT (plan_5m_5h)
  console.log('\n--- 1. TESTING 5M PLAN CHECKOUT (plan_5m_5h) ---');
  const plan5m = getPlanById('plan_5m_5h')!;
  const internalOrder5m = `LD-TEST-5M-${Date.now()}`;
  
  const order5m = await prisma.order.create({
    data: {
      internalOrderId: internalOrder5m,
      userId: user.id,
      planId: plan5m.id,
      planName: plan5m.name,
      tokenQuantity: plan5m.tokenAllowance,
      windowHours: plan5m.windowHours,
      amountInr: plan5m.priceInr,
      paidAmountInr: plan5m.priceInr,
      currency: 'INR',
      paymentStatus: 'CAPTURED',
      fulfillmentStatus: 'NOT_FULFILLED',
      paymentGateway: 'TEST',
    },
  });

  const fulfillment5m = await fulfillOrder(order5m.internalOrderId);
  console.log('5M PLAN FULFILLMENT RESULT:', {
    success: fulfillment5m.success,
    internalOrderId: fulfillment5m.internalOrderId,
    planId: fulfillment5m.planId,
    tokenAllowance: fulfillment5m.tokenAllowance,
    displayKey: fulfillment5m.displayKey,
    rawKeySecret: fulfillment5m.rawKeySecret?.substring(0, 15) + '...',
  });

  if (!fulfillment5m.success || fulfillment5m.tokenAllowance !== '5000000') {
    throw new Error('5M Plan fulfillment failed or token allowance mismatch!');
  }

  // 2. TEST 20M PLAN CHECKOUT (plan_20m_5h)
  console.log('\n--- 2. TESTING 20M PLAN CHECKOUT (plan_20m_5h) ---');
  const plan20m = getPlanById('plan_20m_5h')!;
  const internalOrder20m = `LD-TEST-20M-${Date.now()}`;

  const order20m = await prisma.order.create({
    data: {
      internalOrderId: internalOrder20m,
      userId: user.id,
      planId: plan20m.id,
      planName: plan20m.name,
      tokenQuantity: plan20m.tokenAllowance,
      windowHours: plan20m.windowHours,
      amountInr: plan20m.priceInr,
      paidAmountInr: plan20m.priceInr,
      currency: 'INR',
      paymentStatus: 'CAPTURED',
      fulfillmentStatus: 'NOT_FULFILLED',
      paymentGateway: 'TEST',
    },
  });

  const fulfillment20m = await fulfillOrder(order20m.internalOrderId);
  console.log('20M PLAN FULFILLMENT RESULT:', {
    success: fulfillment20m.success,
    internalOrderId: fulfillment20m.internalOrderId,
    planId: fulfillment20m.planId,
    tokenAllowance: fulfillment20m.tokenAllowance,
    displayKey: fulfillment20m.displayKey,
  });

  if (!fulfillment20m.success || fulfillment20m.tokenAllowance !== '20000000') {
    throw new Error('20M Plan fulfillment failed or token allowance mismatch!');
  }

  // 3. TEST 40M PLAN CHECKOUT (plan_40m_5h)
  console.log('\n--- 3. TESTING 40M PLAN CHECKOUT (plan_40m_5h) ---');
  const plan40m = getPlanById('plan_40m_5h')!;
  const internalOrder40m = `LD-TEST-40M-${Date.now()}`;

  const order40m = await prisma.order.create({
    data: {
      internalOrderId: internalOrder40m,
      userId: user.id,
      planId: plan40m.id,
      planName: plan40m.name,
      tokenQuantity: plan40m.tokenAllowance,
      windowHours: plan40m.windowHours,
      amountInr: plan40m.priceInr,
      paidAmountInr: plan40m.priceInr,
      currency: 'INR',
      paymentStatus: 'CAPTURED',
      fulfillmentStatus: 'NOT_FULFILLED',
      paymentGateway: 'TEST',
    },
  });

  const fulfillment40m = await fulfillOrder(order40m.internalOrderId);
  console.log('40M PLAN FULFILLMENT RESULT:', {
    success: fulfillment40m.success,
    internalOrderId: fulfillment40m.internalOrderId,
    planId: fulfillment40m.planId,
    tokenAllowance: fulfillment40m.tokenAllowance,
    displayKey: fulfillment40m.displayKey,
  });

  if (!fulfillment40m.success || fulfillment40m.tokenAllowance !== '40000000') {
    throw new Error('40M Plan fulfillment failed or token allowance mismatch!');
  }

  // 4. TEST PRICE MISMATCH REJECTION
  console.log('\n--- 4. TESTING PRICE MISMATCH PROTECTION ---');
  const internalOrderTampered = `LD-TEST-TAMPERED-${Date.now()}`;
  const tamperedOrder = await prisma.order.create({
    data: {
      internalOrderId: internalOrderTampered,
      userId: user.id,
      planId: plan40m.id, // 40M Plan requires ₹4,499
      planName: plan40m.name,
      tokenQuantity: plan40m.tokenAllowance,
      windowHours: plan40m.windowHours,
      amountInr: plan40m.priceInr,
      paidAmountInr: 99, // Customer tampered payment to ₹99
      currency: 'INR',
      paymentStatus: 'CAPTURED',
      fulfillmentStatus: 'NOT_FULFILLED',
      paymentGateway: 'TEST',
    },
  });

  const tamperedFulfillment = await fulfillOrder(tamperedOrder.internalOrderId);
  console.log('PRICE MISMATCH REJECTION RESULT:', {
    success: tamperedFulfillment.success,
    error: tamperedFulfillment.error,
  });

  if (tamperedFulfillment.success) {
    throw new Error('FAIL: Price mismatch was mistakenly accepted!');
  }
  console.log('✅ Price Mismatch correctly rejected by server!');

  // 5. TEST IDEMPOTENCY (Duplicate Fulfillment Request)
  console.log('\n--- 5. TESTING FULFILLMENT IDEMPOTENCY ---');
  const duplicateFulfillment = await fulfillOrder(order5m.internalOrderId);
  console.log('DUPLICATE FULFILLMENT RESULT:', {
    success: duplicateFulfillment.success,
    alreadyFulfilled: duplicateFulfillment.alreadyFulfilled,
    apiKeyId: duplicateFulfillment.apiKeyId,
  });

  if (!duplicateFulfillment.alreadyFulfilled) {
    throw new Error('FAIL: Duplicate fulfillment request was re-executed instead of returning ALREADY_FULFILLED!');
  }
  console.log('✅ Duplicate fulfillment correctly prevented by idempotency engine!');

  console.log('\n==================================================');
  console.log('🎉 ALL LOCAL PAYMENT & FULFILLMENT TESTS PASSED!');
  console.log('==================================================');
}

runPaymentSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('TEST SUITE ERROR:', err);
    process.exit(1);
  });
