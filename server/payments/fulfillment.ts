import crypto from 'crypto';
import { prisma } from '../db';
import { getPlanById } from './plans';
import { recordSecurityLog } from '../authSecurity';

export interface FulfillmentResult {
  success: boolean;
  orderId: string;
  internalOrderId: string;
  planId: string;
  tokenAllowance: string;
  apiKeyId?: string;
  displayKey?: string;
  rawKeySecret?: string;
  alreadyFulfilled?: boolean;
  error?: string;
}

// Generate high-entropy customer production API key
function generateCustomerApiKey(): { rawKeySecret: string; keyPrefix: string; keyHash: string; displayKey: string } {
  const keyPrefix = 'ld_live_';
  const randomEntropy = crypto.randomBytes(24).toString('hex'); // 48 chars
  const rawKeySecret = `${keyPrefix}${randomEntropy}`;
  const keyHash = crypto.createHash('sha256').update(rawKeySecret).digest('hex');
  const displayKey = `${keyPrefix}${randomEntropy.substring(0, 6)}...${randomEntropy.substring(randomEntropy.length - 4)}`;
  return { rawKeySecret, keyPrefix, keyHash, displayKey };
}

export async function fulfillOrder(internalOrderId: string): Promise<FulfillmentResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { internalOrderId },
      include: { user: true },
    });

    if (!order) {
      return { success: false, orderId: '', internalOrderId, planId: '', tokenAllowance: '0', error: 'Internal order not found.' };
    }

    // Idempotency: One Payment = One Fulfillment
    if (order.fulfillmentStatus === 'FULFILLED' && order.fulfilledApiKeyId) {
      const existingKey = await prisma.apiKey.findUnique({ where: { id: order.fulfilledApiKeyId } });
      return {
        success: true,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: order.tokenQuantity.toString(),
        apiKeyId: order.fulfilledApiKeyId,
        displayKey: existingKey?.displayKey || '',
        alreadyFulfilled: true,
      };
    }

    // Verify Payment Status (Must be CAPTURED or AUTHORIZED)
    if (order.paymentStatus !== 'CAPTURED' && order.paymentStatus !== 'AUTHORIZED') {
      return {
        success: false,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: order.tokenQuantity.toString(),
        error: `Cannot fulfill order in payment status '${order.paymentStatus}'. Payment must be verified and captured.`,
      };
    }

    // Server-Side Plan & Price Verification
    const plan = getPlanById(order.planId);
    if (!plan) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: 'FULFILLMENT_FAILED',
          failureReason: `Authoritative plan '${order.planId}' is disabled or not found.`,
        },
      });
      return {
        success: false,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: '0',
        error: `Plan '${order.planId}' is invalid or disabled.`,
      };
    }

    // Verify Amount Integrity: Actual Paid Amount must match Server Plan Price
    if (order.paidAmountInr !== null && order.paidAmountInr !== undefined && order.paidAmountInr < plan.priceInr) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'VERIFICATION_FAILED',
          fulfillmentStatus: 'FULFILLMENT_FAILED',
          failureReason: `Paid amount (₹${order.paidAmountInr}) is less than required plan price (₹${plan.priceInr}).`,
        },
      });
      return {
        success: false,
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: order.planId,
        tokenAllowance: '0',
        error: `Payment amount mismatch. Expected ₹${plan.priceInr}, received ₹${order.paidAmountInr}.`,
      };
    }

    // Atomic Provisioning Transaction: Create API Key + Token Ledger + Update Order
    const { rawKeySecret, keyPrefix, keyHash, displayKey } = generateCustomerApiKey();
    const tokenAllowanceBigInt = plan.tokenAllowance;
    const expiresAt = new Date(Date.now() + plan.validityDays * 24 * 3600 * 1000);

    const [apiKey, tokenLedger] = await prisma.$transaction([
      prisma.apiKey.create({
        data: {
          userId: order.userId,
          keyPrefix,
          keyHash,
          displayKey,
          name: `${plan.name} (${order.internalOrderId.substring(0, 8)})`,
          type: 'production',
          status: 'active',
          purchasedTokens: tokenAllowanceBigInt,
          tokensUsed: 0n,
          tokensRemaining: tokenAllowanceBigInt,
          expiresAt,
          plan: plan.name,
          rateLimitRpm: plan.rateLimitRpm || 60,
          maxConcurrency: 5,
        },
      }),
      prisma.tokenLedger.create({
        data: {
          userId: order.userId,
          amount: tokenAllowanceBigInt,
          balanceAfter: tokenAllowanceBigInt,
          type: 'PURCHASE',
          reference: order.internalOrderId,
          notes: `Automated fulfillment for ${plan.displayName}`,
        },
      }),
    ]);

    // Update Order to FULFILLED state
    await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: 'FULFILLED',
        fulfilledApiKeyId: apiKey.id,
        fulfilledAt: new Date(),
        tokensCredited: true,
        status: 'PAID',
      },
    });

    await recordSecurityLog({
      userId: order.userId,
      email: order.user.email,
      eventType: 'ORDER_FULFILLED_API_KEY_CREATED',
      metadata: {
        orderId: order.id,
        internalOrderId: order.internalOrderId,
        planId: plan.id,
        apiKeyId: apiKey.id,
        tokenAllowance: tokenAllowanceBigInt.toString(),
      },
    });

    return {
      success: true,
      orderId: order.id,
      internalOrderId: order.internalOrderId,
      planId: plan.id,
      tokenAllowance: tokenAllowanceBigInt.toString(),
      apiKeyId: apiKey.id,
      displayKey,
      rawKeySecret,
      alreadyFulfilled: false,
    };
  } catch (err: any) {
    console.error('[FULFILLMENT ERROR]', err.message);
    
    // Mark order as FULFILLMENT_FAILED for retry
    try {
      await prisma.order.update({
        where: { internalOrderId },
        data: {
          fulfillmentStatus: 'FULFILLMENT_FAILED',
          failureReason: `Fulfillment exception: ${err.message}`,
        },
      });
    } catch {}

    return {
      success: false,
      orderId: '',
      internalOrderId,
      planId: '',
      tokenAllowance: '0',
      error: `Fulfillment error: ${err.message}`,
    };
  }
}
