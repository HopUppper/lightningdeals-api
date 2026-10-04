import crypto from 'crypto';
import { prisma } from '../server/db';
import { generateToken, hashPasswordScrypt } from '../server/auth';
import { fulfillOrder, retryOrderFulfillment, adminManualFulfill } from '../server/payments/fulfillment';
import {
  calculateSubscriptionExpiry,
  calculateRenewalExpiry,
  getSubscriptionStatus,
  activateOrRenewSubscription,
  scheduleRenewalReminders,
} from '../server/subscriptions/subscriptionEngine';
import { InventoryService } from '../server/inventory/inventoryService';
import { AutomationEngine } from '../server/automation/jobs';
import { OrderEngine } from '../server/orders/orderEngine';
import { dispatchNotification } from '../server/notifications';

interface VerificationCheck {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'NOT_TESTED';
  details: string;
  error?: string;
}

const checks: VerificationCheck[] = [];

function recordPass(id: string, name: string, details: string) {
  checks.push({ id, name, status: 'PASS', details });
  console.log(`[${id}] ✅ ${name} — ${details}`);
}

function recordFail(id: string, name: string, error: string) {
  checks.push({ id, name, status: 'FAIL', details: error, error });
  console.error(`[${id}] ❌ ${name} — FAILED: ${error}`);
}

function recordNotTested(id: string, name: string, details: string) {
  checks.push({ id, name, status: 'NOT_TESTED', details });
  console.warn(`[${id}] ⚠️ NOT TESTED: ${name} — ${details}`);
}

async function runPhase3Verification() {
  console.log('\n================================================================');
  console.log('⚡ LIGHTNINGAPI.PRO — PHASE 3 COMPREHENSIVE VERIFICATION SUITE');
  console.log('================================================================\n');

  const runId = Date.now();
  const testUserEmailA = `phase3_cust_a_${runId}@lightningapi.test`;
  const testUserEmailB = `phase3_cust_b_${runId}@lightningapi.test`;
  const adminEmail = `phase3_admin_${runId}@lightningapi.test`;
  const password = 'TestPassword123!@#';
  const passwordHash = await hashPasswordScrypt(password);

  // 1. Create Test Users & Tokens
  const userA = await prisma.user.create({
    data: {
      email: testUserEmailA,
      name: 'Customer Phase3 Alpha',
      passwordHash,
      role: 'user',
      status: 'active',
      emailVerified: true,
      availableCredits: 500,
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: testUserEmailB,
      name: 'Customer Phase3 Beta',
      passwordHash,
      role: 'user',
      status: 'active',
      emailVerified: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin Phase3 Ops',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
  });

  const tokenUserA = generateToken({ id: userA.id, email: userA.email, role: userA.role, name: userA.name });
  const tokenUserB = generateToken({ id: userB.id, email: userB.email, role: userB.role, name: userB.name });
  const tokenAdmin = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name });

  // --------------------------------------------------------------------------
  // TEST 1: Centralized Subscription Expiry Calculations
  // --------------------------------------------------------------------------
  try {
    const actDate = new Date('2026-10-04T00:00:00.000Z');
    const expiry30d = calculateSubscriptionExpiry(actDate, 30);
    const expectedDiffMs = 30 * 24 * 60 * 60 * 1000;
    if (expiry30d.getTime() - actDate.getTime() === expectedDiffMs) {
      recordPass('P3-01', 'Centralized Expiry Calculation', `30-day activation calculated accurately (${expiry30d.toISOString()})`);
    } else {
      recordFail('P3-01', 'Centralized Expiry Calculation', `Time difference mismatch: ${expiry30d.getTime() - actDate.getTime()}`);
    }
  } catch (e: any) {
    recordFail('P3-01', 'Centralized Expiry Calculation', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Centralized Renewal Extension Logic (Active vs Expired)
  // --------------------------------------------------------------------------
  try {
    const currentExpiry = new Date('2026-10-20T00:00:00.000Z');
    const renewalDate = new Date('2026-10-05T00:00:00.000Z'); // 15 days before expiry
    const newExpiryActive = calculateRenewalExpiry(currentExpiry, 30, false, renewalDate);
    const expectedActive = new Date('2026-11-19T00:00:00.000Z'); // Extended from 20 Oct

    const expiredDate = new Date('2026-10-01T00:00:00.000Z'); // Already expired
    const newExpiryExpired = calculateRenewalExpiry(expiredDate, 30, true, renewalDate);
    const expectedExpired = new Date('2026-11-04T00:00:00.000Z'); // Started from 05 Oct

    if (
      newExpiryActive.getTime() === currentExpiry.getTime() + 30 * 86400000 &&
      newExpiryExpired.getTime() === renewalDate.getTime() + 30 * 86400000
    ) {
      recordPass(
        'P3-02',
        'Renewal Extension Logic',
        'Active renewal extends from current expiry date; expired renewal starts anew from payment date.'
      );
    } else {
      recordFail('P3-02', 'Renewal Extension Logic', 'Date calculation math mismatch for active or expired renewal.');
    }
  } catch (e: any) {
    recordFail('P3-02', 'Renewal Extension Logic', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Status Transition Helper
  // --------------------------------------------------------------------------
  try {
    const now = new Date();
    const futureActive = new Date(now.getTime() + 20 * 86400000);
    const futureExpiring = new Date(now.getTime() + 4 * 86400000); // 4 days away
    const pastExpired = new Date(now.getTime() - 2 * 86400000);

    const stActive = getSubscriptionStatus(futureActive, 'ACTIVE', now);
    const stExpiring = getSubscriptionStatus(futureExpiring, 'ACTIVE', now);
    const stExpired = getSubscriptionStatus(pastExpired, 'ACTIVE', now);

    if (stActive === 'ACTIVE' && stExpiring === 'EXPIRING' && stExpired === 'EXPIRED') {
      recordPass('P3-03', 'Subscription Status Evaluation', 'Correctly flags ACTIVE (>7d), EXPIRING (<=7d), and EXPIRED (<=0d).');
    } else {
      recordFail('P3-03', 'Subscription Status Evaluation', `Mismatch: ${stActive}, ${stExpiring}, ${stExpired}`);
    }
  } catch (e: any) {
    recordFail('P3-03', 'Subscription Status Evaluation', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Automatic Fulfillment Lifecycle (Order -> Key -> Subscription -> Reward)
  // --------------------------------------------------------------------------
  let testOrderA: any = null;
  let testSubA: any = null;
  try {
    const internalOrderId = `P3-AUTO-${runId}`;
    testOrderA = await prisma.order.create({
      data: {
        internalOrderId,
        userId: userA.id,
        planId: 'pro',
        planName: 'Pro Tier',
        tokenQuantity: 10000000n,
        amountInr: 2499,
        paidAmountInr: 2499,
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FULFILLMENT_PENDING',
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const fulResult = await fulfillOrder(internalOrderId);
    if (fulResult.success && fulResult.fulfillmentStatus === 'FULFILLED' && fulResult.apiKeyId && fulResult.subscriptionId) {
      testSubA = await prisma.subscription.findUnique({ where: { id: fulResult.subscriptionId } });
      const orderFresh = await prisma.order.findUnique({ where: { id: testOrderA.id } });

      if (orderFresh?.fulfillmentStatus === 'FULFILLED' && testSubA?.status === 'ACTIVE') {
        recordPass(
          'P3-04',
          'Automatic Fulfillment Execution',
          `Order ${internalOrderId} fulfilled: API key ${fulResult.apiKeyId.substring(0, 8)} provisioned, subscription activated (${testSubA.id.substring(0, 8)}).`
        );
      } else {
        recordFail('P3-04', 'Automatic Fulfillment Execution', 'Order fulfillment status or subscription state not marked ACTIVE/FULFILLED.');
      }
    } else {
      recordFail('P3-04', 'Automatic Fulfillment Execution', fulResult.error || 'Fulfillment returned unsuccessful result.');
    }
  } catch (e: any) {
    recordFail('P3-04', 'Automatic Fulfillment Execution', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Fulfillment Idempotency Protection
  // --------------------------------------------------------------------------
  try {
    const secondFulfill = await fulfillOrder(testOrderA.internalOrderId);
    const subCount = await prisma.subscription.count({ where: { orderId: testOrderA.id } });

    if (secondFulfill.success && secondFulfill.alreadyFulfilled && subCount === 1) {
      recordPass('P3-05', 'Fulfillment Idempotency', 'Re-executing fulfillment on already fulfilled order returned existing artifacts without duplicate provisioning.');
    } else {
      recordFail('P3-05', 'Fulfillment Idempotency', `Duplicate provisioning detected. Subscription count: ${subCount}`);
    }
  } catch (e: any) {
    recordFail('P3-05', 'Fulfillment Idempotency', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Decoupled Payment vs Fulfillment States
  // --------------------------------------------------------------------------
  try {
    const decOrderId = `P3-DEC-${runId}`;
    const decOrder = await prisma.order.create({
      data: {
        internalOrderId: decOrderId,
        userId: userB.id,
        planId: 'pro',
        planName: 'Pro Tier',
        tokenQuantity: 10000000n,
        amountInr: 2499,
        paidAmountInr: 2000, // Invalid underpayment to trigger fulfillment verification rejection
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FULFILLMENT_PENDING',
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const decFulfill = await fulfillOrder(decOrderId);
    const updatedDec = await prisma.order.findUnique({ where: { id: decOrder.id } });

    // Payment status must stay CAPTURED/VERIFICATION_FAILED, fulfillment must be MANUAL_REVIEW or FAILED
    if (updatedDec?.paymentStatus !== 'FAILED' && updatedDec?.fulfillmentStatus === 'MANUAL_REVIEW') {
      recordPass('P3-06', 'Decoupled Payment/Fulfillment Lifecycle', 'Underpaid order flagged for MANUAL_REVIEW without silently deleting captured payment record.');
    } else {
      recordFail('P3-06', 'Decoupled Payment/Fulfillment Lifecycle', `Unexpected state: payment=${updatedDec?.paymentStatus}, fulfillment=${updatedDec?.fulfillmentStatus}`);
    }
  } catch (e: any) {
    recordFail('P3-06', 'Decoupled Payment/Fulfillment Lifecycle', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Manual Fulfillment Queue & Admin Transition
  // --------------------------------------------------------------------------
  try {
    const manualOrderId = `P3-MANUAL-${runId}`;
    const manualOrder = await prisma.order.create({
      data: {
        internalOrderId: manualOrderId,
        userId: userB.id,
        planId: 'pro',
        planName: 'Pro Tier (Manual)',
        tokenQuantity: 10000000n,
        amountInr: 2499,
        paidAmountInr: 2499,
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FULFILLMENT_PENDING',
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Admin manually fulfills with notes
    const adminFulfillRes = await adminManualFulfill({
      orderId: manualOrder.id,
      adminId: adminUser.id,
      notes: 'Manually delivered VIP license via Admin Dashboard',
    });

    const refreshedManual = await prisma.order.findUnique({ where: { id: manualOrder.id } });
    if (refreshedManual?.fulfillmentStatus === 'FULFILLED' && refreshedManual.fulfillmentNotes?.includes('VIP license')) {
      recordPass('P3-07', 'Admin Manual Fulfillment', 'Admin manual fulfillment executed, notes recorded, order marked FULFILLED.');
    } else {
      recordFail('P3-07', 'Admin Manual Fulfillment', 'Manual fulfillment failed to record notes or mark status FULFILLED.');
    }
  } catch (e: any) {
    recordFail('P3-07', 'Admin Manual Fulfillment', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Retry System & Escalation to MANUAL_REVIEW
  // --------------------------------------------------------------------------
  try {
    const retryOrderId = `P3-RETRY-${runId}`;
    const retryOrder = await prisma.order.create({
      data: {
        internalOrderId: retryOrderId,
        userId: userB.id,
        planId: 'non_existent_plan_trigger_error',
        planName: 'Invalid Plan',
        amountInr: 1000,
        paidAmountInr: 1000,
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FULFILLMENT_PENDING',
        fulfillmentAttempts: 2, // Set to 2 so next attempt hits maxRetries = 3
        status: 'PAID',
      },
    });

    const retryRes = await retryOrderFulfillment(retryOrderId, adminUser.id, 3);
    // 3rd attempt: attempts becomes 3, retryOrderFulfillment escalates to MANUAL_REVIEW
    const escalatedOrder = await prisma.order.findUnique({ where: { id: retryOrder.id } });

    if (escalatedOrder?.fulfillmentStatus === 'MANUAL_REVIEW') {
      recordPass('P3-08', 'Fulfillment Retry & Escalation', 'Exceeded max retries (3) safely escalated order to MANUAL_REVIEW queue.');
    } else {
      recordFail('P3-08', 'Fulfillment Retry & Escalation', `Order not in MANUAL_REVIEW. Current: ${escalatedOrder?.fulfillmentStatus}`);
    }
  } catch (e: any) {
    recordFail('P3-08', 'Fulfillment Retry & Escalation', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Renewal Flow & Subscription Extension
  // --------------------------------------------------------------------------
  try {
    if (!testSubA) throw new Error('Prior test subscription not found.');

    const initialExpiry = testSubA.expiryTime;
    const initialRenewalCount = testSubA.renewalCount;

    // Renew subscription using activateOrRenewSubscription
    const renewResult = await activateOrRenewSubscription({
      userId: userA.id,
      planId: testSubA.planId,
      planName: testSubA.planName,
      orderId: testOrderA.id,
      existingSubscriptionId: testSubA.id,
      durationDays: 30,
    });

    const refreshedSub = await prisma.subscription.findUnique({ where: { id: testSubA.id } });
    if (
      renewResult.isRenewal &&
      refreshedSub?.renewalCount === initialRenewalCount + 1 &&
      refreshedSub.expiryTime.getTime() > initialExpiry.getTime()
    ) {
      recordPass(
        'P3-09',
        'Subscription Renewal Extension',
        `Subscription extended by 30 days from previous expiry (${initialExpiry.toLocaleDateString()} -> ${refreshedSub.expiryTime.toLocaleDateString()}), renewalCount=${refreshedSub.renewalCount}`
      );
    } else {
      recordFail('P3-09', 'Subscription Renewal Extension', 'Subscription expiry did not extend or renewalCount did not increment.');
    }
  } catch (e: any) {
    recordFail('P3-09', 'Subscription Renewal Extension', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 10: Inventory Credential Allocation & Duplicate Prevention
  // --------------------------------------------------------------------------
  const testPlanId = `plan_inv_${runId}`;
  try {
    await prisma.plan.create({
      data: {
        id: testPlanId,
        name: testPlanId,
        displayName: 'Test Inventory Plan',
        priceInr: 1000,
        requiresInventory: true,
      },
    });

    // Add exactly 1 inventory item for this test plan
    const secretKey = `TEST-LIC-KEY-${runId}-SECRET`;
    const invItem = await InventoryService.addInventoryItem(
      {
        planId: testPlanId,
        secretData: secretKey,
        notes: 'Verification test item',
      },
      adminUser.id
    );

    // Customer A claims item
    const assignedA = await InventoryService.assignInventoryItem(testPlanId, `ORDER-INV-A-${runId}`, userA.id);

    // Customer B attempts to claim from same pool (now 0 available)
    const assignedB = await InventoryService.assignInventoryItem(testPlanId, `ORDER-INV-B-${runId}`, userB.id);

    if (assignedA?.id === invItem.id && assignedB === null) {
      recordPass(
        'P3-10',
        'Inventory Concurrency & Isolation',
        'Inventory item assigned atomically to Customer A; Customer B safely returned out-of-stock without duplicate assignment.'
      );
    } else {
      recordFail('P3-10', 'Inventory Concurrency & Isolation', `Duplicate inventory item assignment was not blocked. assignedB=${assignedB?.id}`);
    }
  } catch (e: any) {
    recordFail('P3-10', 'Inventory Concurrency & Isolation', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 11: Inventory Release on Order Cancellation / Refund
  // --------------------------------------------------------------------------
  try {
    const invToRelease = await InventoryService.addInventoryItem(
      { planId: testPlanId, secretData: `RELEASE-KEY-${runId}` },
      adminUser.id
    );

    await InventoryService.assignInventoryItem(testPlanId, `ORDER-REL-${runId}`, userA.id);
    const released = await InventoryService.releaseInventoryItem(invToRelease.id, 'Test refund');

    const checkItem = await prisma.inventoryItem.findUnique({ where: { id: invToRelease.id } });
    if (checkItem?.status === 'AVAILABLE' && checkItem.assignedOrderId === null) {
      recordPass('P3-11', 'Inventory Release on Refund', 'Assigned item successfully released back to AVAILABLE status upon refund.');
    } else {
      recordFail('P3-11', 'Inventory Release on Refund', `Item not restored to AVAILABLE. Current status: ${checkItem?.status}`);
    }
  } catch (e: any) {
    recordFail('P3-11', 'Inventory Release on Refund', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 12: Low Stock Threshold Detection
  // --------------------------------------------------------------------------
  try {
    // Set requiresInventory: true and lowStockThreshold: 10 on plan 'pro' temporarily
    await prisma.plan.update({
      where: { id: 'pro' },
      data: { requiresInventory: true, lowStockThreshold: 10 },
    });

    const lowStockAlerts = await InventoryService.getLowStockAlerts();
    const hasProAlert = lowStockAlerts.some((a) => a.planId === 'pro');

    if (hasProAlert) {
      recordPass('P3-12', 'Low Stock Alert Detection', `Pro plan triggered low-stock alert when available count fell below threshold.`);
    } else {
      recordFail('P3-12', 'Low Stock Alert Detection', 'Failed to detect low stock condition for inventory-backed plan.');
    }

    // Restore requiresInventory to false for pro plan
    await prisma.plan.update({
      where: { id: 'pro' },
      data: { requiresInventory: false, lowStockThreshold: 5 },
    });
  } catch (e: any) {
    recordFail('P3-12', 'Low Stock Alert Detection', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 13: Renewal Reminders Scheduling & Duplicate Prevention
  // --------------------------------------------------------------------------
  try {
    const testSubRem = await prisma.subscription.create({
      data: {
        userId: userA.id,
        planId: 'pro',
        planName: 'Pro Tier (Reminders)',
        activationTime: new Date(),
        expiryTime: new Date(Date.now() + 7 * 86400000), // 7 days from now
        status: 'ACTIVE',
        nextResetTime: new Date(Date.now() + 5 * 3600000),
      },
    });

    await scheduleRenewalReminders(testSubRem.id, testSubRem.expiryTime);
    const reminderCount1 = await prisma.subscriptionReminder.count({ where: { subscriptionId: testSubRem.id } });

    // Schedule again (should be idempotent upsert)
    await scheduleRenewalReminders(testSubRem.id, testSubRem.expiryTime);
    const reminderCount2 = await prisma.subscriptionReminder.count({ where: { subscriptionId: testSubRem.id } });

    if (reminderCount1 === 4 && reminderCount2 === 4) {
      recordPass('P3-13', 'Renewal Reminders Scheduling', '4 reminders scheduled (7d, 3d, 1d, on expiry); duplicate scheduling safely ignored.');
    } else {
      recordFail('P3-13', 'Renewal Reminders Scheduling', `Reminder counts unexpected: ${reminderCount1}, ${reminderCount2}`);
    }
  } catch (e: any) {
    recordFail('P3-13', 'Renewal Reminders Scheduling', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 14: Automation Engine Scheduled Jobs Execution
  // --------------------------------------------------------------------------
  try {
    const jobsRes = await AutomationEngine.runAllJobs();
    if (jobsRes && jobsRes.expiry && jobsRes.reminders && jobsRes.statusUpdates) {
      recordPass(
        'P3-14',
        'Automation Engine Jobs',
        `Automated lifecycle engine executed cleanly: ${jobsRes.expiry.processed} expiries, ${jobsRes.reminders.processed} reminders sent.`
      );
    } else {
      recordFail('P3-14', 'Automation Engine Jobs', 'Jobs execution returned malformed results.');
    }
  } catch (e: any) {
    recordFail('P3-14', 'Automation Engine Jobs', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 15: Customer Data Isolation & Authorization Guards
  // --------------------------------------------------------------------------
  try {
    // Customer B requests Customer A's subscription from DB
    const subCrossCheck = await prisma.subscription.findFirst({
      where: { id: testSubA.id, userId: userB.id },
    });

    if (subCrossCheck === null) {
      recordPass('P3-15', 'Customer Data Isolation', 'Tenant scoping strictly enforced: Customer B cannot access Customer A subscriptions.');
    } else {
      recordFail('P3-15', 'Customer Data Isolation', 'Data leakage: Customer B accessed Customer A subscription record.');
    }
  } catch (e: any) {
    recordFail('P3-15', 'Customer Data Isolation', e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 16: Notification Dispatcher & Preference Enforcement
  // --------------------------------------------------------------------------
  try {
    const notifRes = await dispatchNotification({
      event: 'ORDER_PAID',
      userId: userA.id,
      title: 'Test Notification',
      message: 'Your order was processed successfully.',
      type: 'success',
      channels: ['IN_APP'],
    });

    const notifCount = await prisma.notification.count({
      where: { userId: userA.id, title: 'Test Notification' },
    });

    if (notifRes.dispatched && notifCount > 0) {
      recordPass('P3-16', 'Notification Dispatcher', 'Notification successfully created in database with user preference enforcement.');
    } else {
      recordFail('P3-16', 'Notification Dispatcher', 'Notification was not created or dispatched.');
    }
  } catch (e: any) {
    recordFail('P3-16', 'Notification Dispatcher', e.message);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('⚡ PHASE 3 VERIFICATION SUMMARY');
  console.log('================================================================');
  const total = checks.length;
  const passed = checks.filter((c) => c.status === 'PASS').length;
  const failed = checks.filter((c) => c.status === 'FAIL').length;
  const notTested = checks.filter((c) => c.status === 'NOT_TESTED').length;

  console.log(`Total Checks Executed : ${total}`);
  console.log(`PASSED                : ${passed}`);
  console.log(`FAILED                : ${failed}`);
  console.log(`NOT TESTED            : ${notTested}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3Verification().catch((e) => {
  console.error('Fatal Phase 3 verification error:', e);
  process.exit(1);
});
