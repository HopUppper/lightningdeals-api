/**
 * scripts/test-sandbox.ts
 *
 * Centralized Testing Sandbox & Isolation Standard for LightningAPI.
 *
 * RULES:
 * 1. NEVER use existing customer accounts for automated testing (NEVER use `prisma.user.findFirst()`).
 * 2. ALWAYS create dedicated test users marked with `@test.internal`.
 * 3. ALWAYS clean up test ApiRequests, TokenLedgers, Subscriptions, Orders, ApiKeys, and Users in `finally`.
 * 4. NEVER touch, modify, or delete any live customer record or active customer key.
 */

import crypto from 'crypto';
import { prisma, hashApiKey } from '../server/db';

export interface SandboxContext {
  userIds: string[];
  keyIds: string[];
  orderIds: string[];
}

export function initSandbox(): SandboxContext {
  return {
    userIds: [],
    keyIds: [],
    orderIds: [],
  };
}

export async function createTestUser(ctx: SandboxContext, label: string = 'tester') {
  const email = `test-${label}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@test.internal`;
  const user = await prisma.user.create({
    data: {
      name: `Test User (${label})`,
      email,
      passwordHash: crypto.randomBytes(16).toString('hex'),
      emailVerified: true,
      status: 'active',
      role: 'user',
    },
  });
  ctx.userIds.push(user.id);
  return user;
}

export async function createTestApiKey(
  ctx: SandboxContext,
  userId: string,
  options?: {
    name?: string;
    plan?: string;
    purchasedTokens?: bigint;
    rateLimitRpm?: number;
    billingType?: string;
  }
) {
  const rawKey = 'ld_live_test_' + crypto.randomBytes(16).toString('hex');
  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name: options?.name ? `[TEST] ${options.name}` : `[TEST] Key ${Date.now()}`,
      keyPrefix: 'ld_live_',
      keyHash,
      displayKey: rawKey.substring(0, 11) + '...' + rawKey.slice(-4),
      type: 'live',
      status: 'active',
      plan: options?.plan || 'pro',
      purchasedTokens: options?.purchasedTokens || BigInt(10_000_000),
      tokensRemaining: options?.purchasedTokens || BigInt(10_000_000),
      tokensUsed: BigInt(0),
      rateLimitRpm: options?.rateLimitRpm || 120,
      billingType: options?.billingType || 'window',
    },
  });

  ctx.keyIds.push(apiKey.id);
  return { apiKey, rawKey };
}

export async function cleanupSandbox(ctx: SandboxContext) {
  const { userIds, keyIds, orderIds } = ctx;

  try {
    // 1. Delete all ApiRequests generated during testing (prevent "Deleted Key" residue)
    if (keyIds.length > 0 || userIds.length > 0) {
      await prisma.apiRequest.deleteMany({
        where: {
          OR: [
            ...(keyIds.length > 0 ? [{ apiKeyId: { in: keyIds } }] : []),
            ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
    }

    // 2. Delete TokenLedgers & CreditLedgers
    if (keyIds.length > 0 || userIds.length > 0) {
      await prisma.tokenLedger.deleteMany({
        where: {
          OR: [
            ...(keyIds.length > 0 ? [{ apiKeyId: { in: keyIds } }] : []),
            ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
      await prisma.customerUsageCreditLedger.deleteMany({
        where: {
          OR: [
            ...(keyIds.length > 0 ? [{ apiKeyId: { in: keyIds } }] : []),
            ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
    }

    // 3. Delete Subscriptions linked to test orders or test users
    if (orderIds.length > 0 || userIds.length > 0) {
      await prisma.subscription.deleteMany({
        where: {
          OR: [
            ...(orderIds.length > 0 ? [{ orderId: { in: orderIds } }] : []),
            ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
    }

    // 4. Delete Orders linked to test users
    if (orderIds.length > 0 || userIds.length > 0) {
      await prisma.order.deleteMany({
        where: {
          OR: [
            ...(orderIds.length > 0 ? [{ id: { in: orderIds } }, { internalOrderId: { in: orderIds } }] : []),
            ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });
    }

    // 5. Delete ApiKeys
    if (keyIds.length > 0) {
      await prisma.apiKey.deleteMany({
        where: { id: { in: keyIds } },
      });
    }

    // 6. Delete Test Users
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  } catch (err: any) {
    console.error('⚠️ Sandbox cleanup encountered error:', err.message);
  }
}
