import { prisma } from '../server/db';
import { generateProviderApiKey } from '../server/keyService';
import { encryptText } from '../server/db';
import { activateOrRenewSubscription } from '../server/subscriptions/subscriptionEngine';

interface ReconcileOptions {
  dryRun: boolean;
}

export async function runReconciliation(options: ReconcileOptions = { dryRun: true }) {
  const { dryRun } = options;
  console.log(`================================================================`);
  console.log(`⚡ LIGHTNINGAPI CUSTOMER ENTITLEMENT RECONCILIATION ENGINE`);
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (Audit Only - No DB writes)' : '🚀 LIVE APPLY (Writing Changes)'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`================================================================\n`);

  const auditLog: Array<{
    type: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    details: any;
  }> = [];

  const users = await prisma.user.findMany({
    include: {
      apiKeys: true,
      subscriptions: true,
      orders: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Inspecting ${users.length} registered customers...\n`);

  for (const user of users) {
    const activeKeys = user.apiKeys.filter((k) => k.status === 'active');
    const existingSubs = user.subscriptions;
    const capturedOrders = user.orders.filter((o) => o.paymentStatus === 'CAPTURED');

    for (const order of capturedOrders) {
      // Check if order already has an active key
      const existingKey = order.fulfilledApiKeyId
        ? user.apiKeys.find((k) => k.id === order.fulfilledApiKeyId)
        : null;

      // Check if order already has a subscription
      let existingSub = order.subscriptionId
        ? existingSubs.find((s) => s.id === order.subscriptionId)
        : existingSubs.find((s) => s.orderId === order.id || (existingKey && s.apiKeyId === existingKey.id));

      if (existingKey && existingSub) {
        // Both exist, check if order.subscriptionId is linked
        if (!order.subscriptionId) {
          console.log(`🔗 User [${user.name}]: Linking order [${order.internalOrderId}] to existing Subscription [${existingSub.id}]`);
          auditLog.push({
            type: 'LINK_ORDER_SUBSCRIPTION',
            userId: user.id,
            userName: user.name || 'Unnamed',
            userEmail: user.email,
            action: 'LINK_ORDER_TO_EXISTING_SUBSCRIPTION',
            details: { orderId: order.id, subscriptionId: existingSub.id },
          });
          if (!dryRun) {
            await prisma.order.update({
              where: { id: order.id },
              data: { subscriptionId: existingSub.id },
            });
          }
        }
        continue;
      }

      if (existingKey && !existingSub) {
        // Key exists, but subscription missing! Create subscription linked to existing key
        console.log(`⚠️ User [${user.name}]: Order [${order.internalOrderId}] has key [${existingKey.displayKey}] but lacks Subscription!`);
        auditLog.push({
          type: 'CREATE_SUBSCRIPTION_FOR_EXISTING_KEY',
          userId: user.id,
          userName: user.name || 'Unnamed',
          userEmail: user.email,
          action: 'CREATE_LINKED_SUBSCRIPTION',
          details: { orderId: order.id, keyId: existingKey.id },
        });

        if (!dryRun) {
          const isCredit = existingKey.billingType === 'credit';
          const isToken = existingKey.billingType === 'token';
          const quotaWindowHours = isCredit || isToken ? 0 : 5;
          const expiry = existingKey.expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000);
          const days = Math.max(1, Math.ceil((expiry.getTime() - Date.now()) / (24 * 3600 * 1000)));

          const newSub = await prisma.subscription.create({
            data: {
              userId: user.id,
              planId: order.planId || existingKey.plan.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
              planName: order.planName || existingKey.plan,
              apiKeyId: existingKey.id,
              orderId: order.id,
              activationTime: order.paidAt || existingKey.createdAt,
              expiryTime: expiry,
              durationDays: days,
              billingPeriod: days >= 365 ? 'yearly' : 'monthly',
              quotaLimit: isCredit ? 0n : existingKey.purchasedTokens,
              quotaWindowHours,
              currentUsage: existingKey.tokensUsed,
              nextResetTime: new Date(Date.now() + 5 * 3600 * 1000),
              status: 'ACTIVE',
              notes: `Reconciled subscription for order ${order.internalOrderId}`,
            },
          });

          await prisma.order.update({
            where: { id: order.id },
            data: { subscriptionId: newSub.id },
          });

          console.log(`   ✅ CREATED: Subscription [${newSub.id}] linked to key and order`);
        }
        continue;
      }

      if (!existingKey && !existingSub) {
        // Neither key nor subscription exists (e.g. Onkar Yadav Patil)
        console.log(`🚨 User [${user.name} <${user.email}>]: Captured order [${order.internalOrderId}] lacks key AND subscription!`);
        console.log(`   Plan: ${order.planName || order.planId} | Amount: ₹${order.paidAmountInr ?? order.amountInr}`);

        auditLog.push({
          type: 'UNFULFILLED_CAPTURED_ORDER',
          userId: user.id,
          userName: user.name || 'Unnamed',
          userEmail: user.email,
          action: 'PROVISION_FULFILLMENT_KEY_AND_SUBSCRIPTION',
          details: {
            orderId: order.id,
            internalOrderId: order.internalOrderId,
            amountInr: order.paidAmountInr ?? order.amountInr,
            planName: order.planName || order.planId,
          },
        });

        if (!dryRun) {
          const isYearly = order.planName?.toLowerCase().includes('1 year') || (order.validityDays && order.validityDays >= 365);
          const durationDays = isYearly ? 365 : 30;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000);

          const keyMaterial = await generateProviderApiKey({
            isTrial: false,
            keyPrefix: 'sk_live_',
          });

          const initialTokens = order.tokenQuantity ? BigInt(order.tokenQuantity) : 5000000n;
          const billingType = order.billingPeriod === 'credit' ? 'credit' : 'window';

          const newKey = await prisma.apiKey.create({
            data: {
              userId: user.id,
              providerId: keyMaterial.providerId,
              keyPrefix: keyMaterial.keyPrefix,
              keyHash: keyMaterial.keyHash,
              displayKey: keyMaterial.displayKey,
              keyEncrypted: encryptText(keyMaterial.rawKeySecret),
              name: `${order.planName || 'Reconciled Plan'} Key`,
              type: 'production',
              status: 'active',
              billingType,
              creditBalanceUsd: 0,
              totalCreditsUsedUsd: 0,
              allowedModels: 'all',
              allowedModelFamilies: 'all',
              purchasedTokens: initialTokens,
              tokensUsed: 0n,
              tokensRemaining: initialTokens,
              rateLimitRpm: 60,
              expiresAt,
              plan: order.planName || 'Reconciled Plan',
            },
          });

          const subResult = await activateOrRenewSubscription({
            userId: user.id,
            planId: order.planId || 'reconciled_purchase',
            planName: order.planName || 'Reconciled Plan',
            orderId: order.id,
            apiKeyId: newKey.id,
            durationDays,
            billingPeriod: isYearly ? 'yearly' : 'monthly',
            quotaLimit: initialTokens,
            quotaWindowHours: order.windowHours || 5,
            notes: `Reconciled via automated entitlement engine for order ${order.internalOrderId}`,
          });

          await prisma.order.update({
            where: { id: order.id },
            data: {
              fulfilledApiKeyId: newKey.id,
              subscriptionId: subResult.subscription.id,
              fulfillmentStatus: 'FULFILLED',
              tokensCredited: true,
              fulfilledAt: new Date(),
            },
          });

          console.log(`   ✅ PROVISIONED: Key ${newKey.displayKey} and Subscription ${subResult.subscription.id}`);
        }
      }
    }

    // ISSUE B: Active API keys without linked Subscription records
    const subKeyIds = new Set(existingSubs.map((s) => s.apiKeyId).filter(Boolean));
    for (const key of activeKeys) {
      if (!subKeyIds.has(key.id)) {
        console.log(`⚠️ User [${user.name} <${user.email}>]: Active key [${key.displayKey}] lacks Subscription record!`);
        console.log(`   Plan: ${key.plan} | Type: ${key.billingType} | Tokens: ${key.tokensRemaining}/${key.purchasedTokens} | USD: $${key.creditBalanceUsd}`);

        auditLog.push({
          type: 'ORPHANED_ACTIVE_KEY',
          userId: user.id,
          userName: user.name || 'Unnamed',
          userEmail: user.email,
          action: 'CREATE_LINKED_SUBSCRIPTION',
          details: {
            apiKeyId: key.id,
            displayKey: key.displayKey,
            plan: key.plan,
            billingType: key.billingType,
          },
        });

        if (!dryRun) {
          const isCredit = key.billingType === 'credit';
          const isToken = key.billingType === 'token';
          const quotaWindowHours = isCredit || isToken ? 0 : 5;
          const expiry = key.expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000);
          const days = Math.max(1, Math.ceil((expiry.getTime() - Date.now()) / (24 * 3600 * 1000)));

          const matchingOrder = capturedOrders.find((o) => !o.subscriptionId || o.fulfilledApiKeyId === key.id);

          const autoSub = await prisma.subscription.create({
            data: {
              userId: user.id,
              planId: key.plan ? key.plan.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'custom_plan',
              planName: key.plan || (isCredit ? 'API Credits' : 'Claude Max Plan'),
              apiKeyId: key.id,
              orderId: matchingOrder ? matchingOrder.id : null,
              activationTime: key.createdAt,
              expiryTime: expiry,
              durationDays: days,
              billingPeriod: days >= 365 ? 'yearly' : 'monthly',
              quotaLimit: isCredit ? 0n : key.purchasedTokens,
              quotaWindowHours,
              currentUsage: key.tokensUsed,
              nextResetTime: new Date(Date.now() + 5 * 3600 * 1000),
              status: 'ACTIVE',
              notes: 'Reconciled subscription linked to active API key',
            },
          });

          if (matchingOrder && !matchingOrder.subscriptionId) {
            await prisma.order.update({
              where: { id: matchingOrder.id },
              data: {
                subscriptionId: autoSub.id,
                fulfilledApiKeyId: key.id,
              },
            });
          }

          console.log(`   ✅ LINKED: Subscription ${autoSub.id} created for key ${key.displayKey}`);
        }
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`📊 RECONCILIATION SUMMARY:`);
  console.log(`Total Issues Detected: ${auditLog.length}`);
  auditLog.forEach((log, idx) => {
    console.log(` ${idx + 1}. [${log.type}] ${log.userName} (${log.userEmail}) -> Action: ${log.action}`);
  });
  console.log(`================================================================\n`);

  await prisma.$disconnect();
  return auditLog;
}

const isApply = process.argv.includes('--apply');
runReconciliation({ dryRun: !isApply }).catch((err) => {
  console.error('Fatal error during reconciliation:', err);
  process.exit(1);
});
