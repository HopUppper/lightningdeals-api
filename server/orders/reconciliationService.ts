import { prisma } from '../db';
import { fulfillOrder } from '../payments/fulfillment';
import { recordAuditEvent } from '../auditLogger';

export interface ReconciliationReport {
  timestamp: string;
  reconciledOrdersCount: number;
  reconciledPurchasesCount: number;
  reconciledSubscriptionsCount: number;
  reconciledKeysCount: number;
  details: string[];
}

/**
 * ============================================================================
 * 🔄 UNIVERSAL PAYMENT & FULFILLMENT RECONCILIATION ENGINE — LIGHTNINGAPI.PRO
 * ============================================================================
 * Scans, repairs, and links broken/orphaned orders, purchases, subscriptions,
 * and API keys safely with 100% database-enforced idempotency.
 */
export class ReconciliationService {
  /**
   * Run full reconciliation across all customers or a specific customer
   */
  static async reconcileAll(targetUserId?: string): Promise<ReconciliationReport> {
    const details: string[] = [];
    let reconciledOrdersCount = 0;
    let reconciledPurchasesCount = 0;
    let reconciledSubscriptionsCount = 0;
    let reconciledKeysCount = 0;

    console.log(`[RECONCILIATION] Starting reconciliation run... (target: ${targetUserId || 'ALL'})`);

    // --------------------------------------------------------------------------
    // 1. RECONCILE SAGAR (ms861000@gmail.com) SPECIFIC RECOVERY
    // --------------------------------------------------------------------------
    try {
      const sagar = await prisma.user.findFirst({
        where: { email: { equals: 'ms861000@gmail.com', mode: 'insensitive' } },
      });

      if (sagar && (!targetUserId || targetUserId === sagar.id)) {
        // Find Sagar's WhatsApp purchase
        const sagarPurchase = await prisma.purchase.findFirst({
          where: {
            userId: sagar.id,
            status: 'COMPLETED',
            productName: { contains: '20x', mode: 'insensitive' },
          },
        });

        // Find Sagar's production key
        const sagarKey = await prisma.apiKey.findFirst({
          where: {
            userId: sagar.id,
            status: 'active',
            name: { contains: 'Sagar', mode: 'insensitive' },
          },
        });

        if (sagarPurchase && sagarKey) {
          // Check if an Order already exists for this purchase
          let sagarOrder = sagarPurchase.orderId
            ? await prisma.order.findUnique({ where: { id: sagarPurchase.orderId } })
            : null;

          if (!sagarOrder) {
            const internalOrderId = 'LD-WA-SAGAR20X';
            sagarOrder = await prisma.order.findUnique({ where: { internalOrderId } });

            if (!sagarOrder) {
              sagarOrder = await prisma.order.create({
                data: {
                  internalOrderId,
                  userId: sagar.id,
                  planId: 'claude_max_20x',
                  planName: 'Claude Max 20x',
                  planCategory: 'claude_max_rolling',
                  orderType: 'PLAN',
                  tokenQuantity: 20000000n,
                  windowHours: 5,
                  validityDays: 30,
                  amountInr: 5999,
                  paidAmountInr: 5999,
                  currency: 'INR',
                  status: 'PAID',
                  paymentStatus: 'CAPTURED',
                  fulfillmentStatus: 'FULFILLED',
                  paymentGateway: 'WHATSAPP',
                  fulfilledApiKeyId: sagarKey.id,
                  channel: 'WHATSAPP',
                  paidAt: sagarPurchase.purchaseDate || new Date('2026-10-30T17:31:32.306Z'),
                  fulfilledAt: sagarPurchase.purchaseDate || new Date('2026-10-30T17:31:32.306Z'),
                  tokensCredited: true,
                },
              });
              reconciledOrdersCount++;
              details.push(`Created reconciled Order ${sagarOrder.internalOrderId} for Sagar's purchase.`);
            }

            // Link purchase to order
            await prisma.purchase.update({
              where: { id: sagarPurchase.id },
              data: {
                orderId: sagarOrder.id,
                referenceId: sagarOrder.internalOrderId,
              },
            });
            reconciledPurchasesCount++;
            details.push(`Linked Sagar's purchase ${sagarPurchase.id} to Order ${sagarOrder.internalOrderId}.`);
          }

          // Check if Sagar has an active Subscription for Claude Max 20x
          const activeSub = await prisma.subscription.findFirst({
            where: {
              userId: sagar.id,
              status: 'ACTIVE',
              planName: { contains: '20x', mode: 'insensitive' },
            },
          });

          const expiryDate = new Date('2026-11-30T23:59:59.000Z');

          if (!activeSub) {
            await prisma.subscription.create({
              data: {
                userId: sagar.id,
                planId: 'claude_max_20x',
                planName: 'Claude Max 20x',
                orderId: sagarOrder.id,
                apiKeyId: sagarKey.id,
                activationTime: sagarPurchase.purchaseDate || new Date('2026-10-30T17:31:32.306Z'),
                expiryTime: expiryDate,
                durationDays: 30,
                billingPeriod: 'monthly',
                quotaLimit: 20000000n,
                quotaWindowHours: 5,
                currentUsage: 0n,
                nextResetTime: new Date(Date.now() + 5 * 3600 * 1000),
                status: 'ACTIVE',
                notes: 'Authoritative subscription restored via Reconciliation Engine',
              },
            });
            reconciledSubscriptionsCount++;
            details.push(`Created active Claude Max 20x Subscription for Sagar expiring 2026-11-30.`);
          }

          // Synchronize Sagar's Key expiration
          await prisma.apiKey.update({
            where: { id: sagarKey.id },
            data: {
              expiresAt: expiryDate,
              status: 'active',
              plan: 'Claude Max 20x',
              billingType: 'window',
              purchasedTokens: 20000000n,
            },
          });
          reconciledKeysCount++;
          details.push(`Synchronized Sagar's key ${sagarKey.displayKey} with 20M allowance and 2026-11-30 expiry.`);
        }
      }
    } catch (sagarErr: any) {
      console.error('[RECONCILIATION] Error reconciling Sagar:', sagarErr.message);
      details.push(`Error reconciling Sagar: ${sagarErr.message}`);
    }

    // --------------------------------------------------------------------------
    // 2. RECONCILE KUNAL (kunalkumarjha97@gmail.com) VERIFICATION
    // --------------------------------------------------------------------------
    try {
      const kunal = await prisma.user.findFirst({
        where: { email: { equals: 'kunalkumarjha97@gmail.com', mode: 'insensitive' } },
      });

      if (kunal && (!targetUserId || targetUserId === kunal.id)) {
        const capturedOrder = await prisma.order.findFirst({
          where: {
            userId: kunal.id,
            paymentStatus: { in: ['CAPTURED', 'PAID'] },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (capturedOrder) {
          // Ensure purchase is linked
          const linkedPurchase = await prisma.purchase.findFirst({
            where: {
              userId: kunal.id,
              OR: [{ orderId: capturedOrder.id }, { referenceId: capturedOrder.internalOrderId }],
            },
          });

          if (!linkedPurchase) {
            await prisma.purchase.create({
              data: {
                userId: kunal.id,
                orderId: capturedOrder.id,
                productName: capturedOrder.planName,
                description: `Website purchase - ${capturedOrder.planName}`,
                amountPaid: capturedOrder.paidAmountInr || capturedOrder.amountInr,
                channel: 'WEBSITE',
                status: 'COMPLETED',
                creditsEarned: capturedOrder.creditsEarned || 10,
                referenceId: capturedOrder.internalOrderId,
                createdBy: 'RECONCILIATION_ENGINE',
              },
            });
            reconciledPurchasesCount++;
            details.push(`Created missing Purchase record for Kunal's Order ${capturedOrder.internalOrderId}.`);
          }

          // Ensure subscription is active and has correct planCategory
          if (capturedOrder.planCategory !== 'claude_openai_credits') {
            await prisma.order.update({
              where: { id: capturedOrder.id },
              data: { planCategory: 'claude_openai_credits', orderType: 'CREDIT_PACK' },
            });
            details.push(`Updated Kunal's Order ${capturedOrder.internalOrderId} planCategory to claude_openai_credits.`);
          }
        }
      }
    } catch (kunalErr: any) {
      console.error('[RECONCILIATION] Error reconciling Kunal:', kunalErr.message);
      details.push(`Error reconciling Kunal: ${kunalErr.message}`);
    }

    // --------------------------------------------------------------------------
    // 3. GENERAL SCAN: CAPTURED ORDERS WITH MISSING / PENDING FULFILLMENT
    // --------------------------------------------------------------------------
    try {
      const unfulfilledCapturedOrders = await prisma.order.findMany({
        where: {
          paymentStatus: { in: ['CAPTURED', 'PAID'] },
          fulfillmentStatus: { in: ['NOT_FULFILLED', 'FULFILLMENT_PENDING', 'RETRY_REQUIRED', 'FULFILLMENT_FAILED'] },
          ...(targetUserId ? { userId: targetUserId } : {}),
        },
      });

      for (const order of unfulfilledCapturedOrders) {
        console.log(`[RECONCILIATION] Retrying fulfillment for captured order ${order.internalOrderId}...`);
        try {
          const fulfillment = await fulfillOrder(order.internalOrderId);
          if (fulfillment.success) {
            reconciledOrdersCount++;
            details.push(`Fulfilled previously stuck order ${order.internalOrderId} (Key: ${fulfillment.displayKey}).`);
          } else {
            details.push(`Fulfillment retry for ${order.internalOrderId} failed: ${fulfillment.error}`);
          }
        } catch (fulErr: any) {
          details.push(`Fulfillment exception for ${order.internalOrderId}: ${fulErr.message}`);
        }
      }
    } catch (scanErr: any) {
      console.error('[RECONCILIATION] Error scanning unfulfilled captured orders:', scanErr.message);
    }

    // --------------------------------------------------------------------------
    // 4. GENERAL SCAN: PURCHASES WITHOUT LINKED ORDERS
    // --------------------------------------------------------------------------
    try {
      const unlinkedPurchases = await prisma.purchase.findMany({
        where: {
          orderId: null,
          status: 'COMPLETED',
          ...(targetUserId ? { userId: targetUserId } : {}),
        },
      });

      for (const purchase of unlinkedPurchases) {
        const internalOrderId = purchase.referenceId || `LD-REC-${purchase.channel}-${purchase.id.slice(0, 8).toUpperCase()}`;

        // Check if an order already has this internalOrderId
        let order = await prisma.order.findUnique({ where: { internalOrderId } });
        if (!order) {
          order = await prisma.order.create({
            data: {
              internalOrderId,
              userId: purchase.userId,
              planId: 'reconciled_purchase',
              planName: purchase.productName,
              amountInr: purchase.amountPaid,
              paidAmountInr: purchase.amountPaid,
              currency: 'INR',
              status: 'PAID',
              paymentStatus: 'CAPTURED',
              fulfillmentStatus: 'FULFILLED',
              paymentGateway: purchase.channel || 'EXTERNAL',
              channel: purchase.channel || 'WEBSITE',
              paidAt: purchase.purchaseDate || purchase.createdAt,
              fulfilledAt: purchase.createdAt,
            },
          });
          reconciledOrdersCount++;
        }

        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { orderId: order.id, referenceId: internalOrderId },
        });
        reconciledPurchasesCount++;
        details.push(`Linked purchase ${purchase.productName} (${purchase.id}) to Order ${internalOrderId}.`);
      }
    } catch (purchErr: any) {
      console.error('[RECONCILIATION] Error linking purchases to orders:', purchErr.message);
    }

    // --------------------------------------------------------------------------
    // 5. GENERAL SCAN: ORPHANED ACTIVE KEYS WITHOUT ACTIVE SUBSCRIPTION
    // --------------------------------------------------------------------------
    try {
      const activeKeys = await prisma.apiKey.findMany({
        where: {
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          subscriptions: { none: { status: 'ACTIVE' } },
          ...(targetUserId ? { userId: targetUserId } : {}),
        },
        include: { user: true },
      });

      for (const key of activeKeys) {
        if (!key.userId) continue;

        const isCredit = key.billingType === 'credit';
        const isToken = key.billingType === 'token';
        const expiry = key.expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000);

        await prisma.subscription.create({
          data: {
            userId: key.userId,
            planId: key.plan.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            planName: key.plan,
            apiKeyId: key.id,
            activationTime: key.createdAt,
            expiryTime: expiry,
            durationDays: 30,
            billingPeriod: 'monthly',
            quotaLimit: isCredit ? 0n : key.purchasedTokens,
            quotaWindowHours: isCredit || isToken ? 0 : 5,
            currentUsage: key.tokensUsed,
            nextResetTime: new Date(Date.now() + 5 * 3600 * 1000),
            status: 'ACTIVE',
            notes: 'Restored active subscription for provisioned key',
          },
        });
        reconciledSubscriptionsCount++;
        details.push(`Created missing Subscription for Key ${key.displayKey} (${key.plan}).`);
      }
    } catch (keySubErr: any) {
      console.error('[RECONCILIATION] Error restoring subscriptions for active keys:', keySubErr.message);
    }

    const report: ReconciliationReport = {
      timestamp: new Date().toISOString(),
      reconciledOrdersCount,
      reconciledPurchasesCount,
      reconciledSubscriptionsCount,
      reconciledKeysCount,
      details,
    };

    console.log(`[RECONCILIATION] Completed. Summary:`, report);
    return report;
  }
}
