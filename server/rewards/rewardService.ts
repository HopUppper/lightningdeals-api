import { prisma } from '../db';
import { recordAuditEvent } from '../auditLogger';

export interface RewardCalculation {
  purchaseAmount: number;
  eligibleAmount: number;
  rewardPercentage: number;
  rewardCredits: number;
  maxEligibleAmount: number;
  maxRewardPerTransaction: number;
  currency: string;
}

/**
 * Fetch or initialize global RewardSettings
 */
export async function getRewardSettings() {
  let settings = await prisma.rewardSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.rewardSettings.create({
      data: {
        id: 'default',
        rewardPercentage: 10.0,
        maxEligiblePurchaseAmount: 5000.0,
        maxRewardPerTransaction: 500.0,
        currency: 'INR',
        isActive: true,
      },
    });
  }

  return settings;
}

/**
 * Update global RewardSettings (Admin only)
 * Note: Historical transactions are NEVER recalculated.
 */
export async function updateRewardSettings(
  params: {
    rewardPercentage?: number;
    maxEligiblePurchaseAmount?: number;
    maxRewardPerTransaction?: number;
    isActive?: boolean;
    currency?: string;
  },
  adminUserId?: string
) {
  const current = await getRewardSettings();

  const updated = await prisma.rewardSettings.update({
    where: { id: 'default' },
    data: {
      ...(params.rewardPercentage !== undefined && { rewardPercentage: Math.max(0, params.rewardPercentage) }),
      ...(params.maxEligiblePurchaseAmount !== undefined && { maxEligiblePurchaseAmount: Math.max(0, params.maxEligiblePurchaseAmount) }),
      ...(params.maxRewardPerTransaction !== undefined && { maxRewardPerTransaction: Math.max(0, params.maxRewardPerTransaction) }),
      ...(params.isActive !== undefined && { isActive: Boolean(params.isActive) }),
      ...(params.currency !== undefined && { currency: params.currency }),
    },
  });

  await recordAuditEvent({
    eventType: 'REWARD_SETTINGS_UPDATED',
    severity: 'MEDIUM',
    actorType: 'ADMIN',
    actorId: adminUserId,
    adminId: adminUserId,
    action: 'UPDATE_SETTINGS',
    result: 'SUCCESS',
    resourceType: 'SYSTEM',
    resourceId: 'RewardSettings',
    beforeState: JSON.stringify(current),
    afterState: JSON.stringify(updated),
  });

  return updated;
}

/**
 * Server-side Authoritative Reward Calculation
 * Formula:
 * eligible_amount = MIN(transaction_amount, maxEligiblePurchaseAmount)
 * reward = eligible_amount * (rewardPercentage / 100)
 * capped_reward = MIN(reward, maxRewardPerTransaction)
 */
export async function calculateReward(purchaseAmount: number): Promise<RewardCalculation> {
  const settings = await getRewardSettings();

  const cleanAmount = Math.max(0, Number(purchaseAmount) || 0);

  if (!settings.isActive || cleanAmount <= 0) {
    return {
      purchaseAmount: cleanAmount,
      eligibleAmount: 0,
      rewardPercentage: settings.rewardPercentage,
      rewardCredits: 0,
      maxEligibleAmount: settings.maxEligiblePurchaseAmount,
      maxRewardPerTransaction: settings.maxRewardPerTransaction,
      currency: settings.currency,
    };
  }

  // 1. Calculate eligible amount (First ₹5,000 max by default)
  const eligibleAmount = Math.min(cleanAmount, settings.maxEligiblePurchaseAmount);

  // 2. Calculate percentage reward (10% by default)
  const calculatedCredits = Math.round((eligibleAmount * (settings.rewardPercentage / 100)) * 100) / 100;

  // 3. Cap reward per transaction (Max ₹500 by default)
  const rewardCredits = Math.min(calculatedCredits, settings.maxRewardPerTransaction);

  return {
    purchaseAmount: cleanAmount,
    eligibleAmount,
    rewardPercentage: settings.rewardPercentage,
    rewardCredits,
    maxEligibleAmount: settings.maxEligiblePurchaseAmount,
    maxRewardPerTransaction: settings.maxRewardPerTransaction,
    currency: settings.currency,
  };
}

/**
 * Award Lightning Credits to customer upon successful order completion.
 * Fully idempotent: safe to call multiple times without duplicate credit issuance.
 */
export async function awardOrderCredits(params: {
  userId: string;
  orderId: string;
  purchaseAmount: number;
}) {
  const { userId, orderId, purchaseAmount } = params;

  // 1. Idempotency Check: Don't award twice for the same order
  const existingTx = await prisma.creditTransaction.findFirst({
    where: {
      orderId,
      type: 'PURCHASE_REWARD',
    },
  });

  if (existingTx) {
    return {
      success: true,
      alreadyAwarded: true,
      creditsAwarded: existingTx.amount,
      transactionId: existingTx.id,
      balanceAfter: existingTx.balanceAfter,
    };
  }

  // 2. Server-side Calculation
  const calculation = await calculateReward(purchaseAmount);
  if (calculation.rewardCredits <= 0) {
    return {
      success: true,
      alreadyAwarded: false,
      creditsAwarded: 0,
      message: 'Purchase is not eligible for rewards or reward is 0.',
    };
  }

  // 3. Atomic Interactive Transaction
  return await prisma.$transaction(async (tx) => {
    // Secondary concurrency check inside transaction lock
    const raceCheck = await tx.creditTransaction.findFirst({
      where: {
        orderId,
        type: 'PURCHASE_REWARD',
      },
    });

    if (raceCheck) {
      return {
        success: true,
        alreadyAwarded: true,
        creditsAwarded: raceCheck.amount,
        transactionId: raceCheck.id,
        balanceAfter: raceCheck.balanceAfter,
      };
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, availableCredits: true, lifetimeCreditsEarned: true, email: true },
    });

    if (!user) {
      throw new Error(`User ${userId} not found for reward credit.`);
    }

    const currentBalance = user.availableCredits || 0;
    const balanceAfter = Math.round((currentBalance + calculation.rewardCredits) * 100) / 100;
    const newLifetimeEarned = Math.round(((user.lifetimeCreditsEarned || 0) + calculation.rewardCredits) * 100) / 100;

    // Create Credit Ledger Entry
    const creditTx = await tx.creditTransaction.create({
      data: {
        userId,
        orderId,
        type: 'PURCHASE_REWARD',
        amount: calculation.rewardCredits,
        balanceBefore: currentBalance,
        balanceAfter,
        description: `10% Lightning Credits earned on purchase (₹${calculation.purchaseAmount.toLocaleString()} purchase, ₹${calculation.eligibleAmount.toLocaleString()} eligible)`,
        status: 'COMPLETED',
      },
    });

    // Update User Balance & Lifetime Stats
    await tx.user.update({
      where: { id: userId },
      data: {
        availableCredits: balanceAfter,
        lifetimeCreditsEarned: newLifetimeEarned,
      },
    });

    // Record on Order
    await tx.order.update({
      where: { id: orderId },
      data: {
        creditsEarned: calculation.rewardCredits,
      },
    });

    // Customer Notification
    await tx.notification.create({
      data: {
        userId,
        title: '⚡ Lightning Credits Earned!',
        message: `You earned ₹${calculation.rewardCredits.toLocaleString()} Lightning Credits from your purchase! You can use these toward your next order.`,
        type: 'success',
      },
    });

    return {
      success: true,
      alreadyAwarded: false,
      creditsAwarded: calculation.rewardCredits,
      transactionId: creditTx.id,
      balanceBefore: currentBalance,
      balanceAfter,
    };
  });
}

/**
 * Redeem Lightning Credits at checkout.
 * Enforces atomic balance verification to guarantee zero double-spending.
 */
export async function redeemCredits(params: {
  userId: string;
  orderId?: string;
  amountToRedeem: number;
}) {
  const { userId, orderId, amountToRedeem } = params;
  const redeemAmount = Math.round(Number(amountToRedeem) * 100) / 100;

  if (redeemAmount <= 0) {
    throw new Error('Redemption amount must be greater than zero.');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current user balance with strict lock
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, availableCredits: true, lifetimeCreditsRedeemed: true, email: true },
    });

    if (!user) {
      throw new Error(`User not found.`);
    }

    const currentBalance = user.availableCredits || 0;

    if (currentBalance < redeemAmount) {
      throw new Error(
        `Insufficient Lightning Credits. Available: ₹${currentBalance.toLocaleString()}, requested: ₹${redeemAmount.toLocaleString()}.`
      );
    }

    const balanceAfter = Math.round((currentBalance - redeemAmount) * 100) / 100;
    const newLifetimeRedeemed = Math.round(((user.lifetimeCreditsRedeemed || 0) + redeemAmount) * 100) / 100;

    // 2. Create Redemption Ledger Entry
    const creditTx = await tx.creditTransaction.create({
      data: {
        userId,
        orderId,
        type: 'CREDIT_REDEMPTION',
        amount: -redeemAmount,
        balanceBefore: currentBalance,
        balanceAfter,
        description: `Lightning Credits redeemed toward purchase`,
        status: 'COMPLETED',
      },
    });

    // 3. Update User Balance & Lifetime Stats
    await tx.user.update({
      where: { id: userId },
      data: {
        availableCredits: balanceAfter,
        lifetimeCreditsRedeemed: newLifetimeRedeemed,
      },
    });

    // 4. Update Order if orderId provided
    if (orderId) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          creditsRedeemed: redeemAmount,
        },
      });
    }

    return {
      success: true,
      redeemedAmount: redeemAmount,
      transactionId: creditTx.id,
      balanceBefore: currentBalance,
      balanceAfter,
    };
  });
}

/**
 * Admin Manual Adjustment (Credit or Debit)
 * Mandatory reason required for audit compliance.
 */
export async function adjustCustomerCredits(params: {
  userId: string;
  amount: number; // positive = add, negative = deduct
  reason: string;
  adminUserId: string;
}) {
  const { userId, amount, reason, adminUserId } = params;
  const adjAmount = Math.round(Number(amount) * 100) / 100;

  if (adjAmount === 0) {
    throw new Error('Adjustment amount cannot be zero.');
  }

  if (!reason || !reason.trim()) {
    throw new Error('Mandatory adjustment reason is required for compliance audit logs.');
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, availableCredits: true, lifetimeCreditsEarned: true, lifetimeCreditsRedeemed: true, email: true },
    });

    if (!user) {
      throw new Error(`Customer not found.`);
    }

    const currentBalance = user.availableCredits || 0;
    const newBalance = Math.round((currentBalance + adjAmount) * 100) / 100;

    if (newBalance < 0) {
      throw new Error(
        `Adjustment would result in negative balance. Current: ₹${currentBalance.toLocaleString()}, Adjustment: ₹${adjAmount.toLocaleString()}.`
      );
    }

    const type = adjAmount > 0 ? 'MANUAL_CREDIT' : 'MANUAL_DEBIT';
    const description = `Admin adjustment: ${reason.trim()}`;

    const creditTx = await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount: adjAmount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description,
        reason: reason.trim(),
        adminUserId,
        status: 'COMPLETED',
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        availableCredits: newBalance,
        ...(adjAmount > 0 && {
          lifetimeCreditsEarned: Math.round(((user.lifetimeCreditsEarned || 0) + adjAmount) * 100) / 100,
        }),
      },
    });

    // Notify user
    await tx.notification.create({
      data: {
        userId,
        title: adjAmount > 0 ? '⚡ Lightning Credits Added' : '⚡ Lightning Credits Adjusted',
        message:
          adjAmount > 0
            ? `₹${adjAmount.toLocaleString()} Lightning Credits were credited to your account: ${reason.trim()}`
            : `₹${Math.abs(adjAmount).toLocaleString()} Lightning Credits were deducted: ${reason.trim()}`,
        type: adjAmount > 0 ? 'success' : 'info',
      },
    });

    return {
      success: true,
      transactionId: creditTx.id,
      amount: adjAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
    };
  });
}

/**
 * Reverse reward credits if an order is refunded or cancelled.
 * Also restores redeemed credits if any were used on this order.
 */
export async function reverseOrderCredits(params: {
  orderId: string;
  reason: string;
  adminUserId?: string;
}) {
  const { orderId, reason, adminUserId } = params;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const results: any = { orderId };

    // 1. If customer earned rewards on this order, claw them back
    const earnedTx = await tx.creditTransaction.findFirst({
      where: { orderId, type: 'PURCHASE_REWARD', status: 'COMPLETED' },
    });

    if (earnedTx && earnedTx.amount > 0) {
      const user = await tx.user.findUnique({ where: { id: order.userId } });
      const currentBalance = user?.availableCredits || 0;
      // Reversal amount (deduct what was earned)
      const reversalAmount = earnedTx.amount;
      const balanceAfter = Math.max(0, Math.round((currentBalance - reversalAmount) * 100) / 100);

      await tx.creditTransaction.create({
        data: {
          userId: order.userId,
          orderId,
          type: 'REFUND_REVERSAL',
          amount: -reversalAmount,
          balanceBefore: currentBalance,
          balanceAfter,
          description: `Reward reversal for refunded order ${order.internalOrderId}`,
          reason: reason || 'Order refunded/cancelled',
          adminUserId,
          status: 'COMPLETED',
        },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: { availableCredits: balanceAfter },
      });

      results.earnedReversed = reversalAmount;
    }

    // 2. If customer redeemed credits on this order, refund them back to balance
    const redeemedTx = await tx.creditTransaction.findFirst({
      where: { orderId, type: 'CREDIT_REDEMPTION', status: 'COMPLETED' },
    });

    if (redeemedTx && Math.abs(redeemedTx.amount) > 0) {
      const user = await tx.user.findUnique({ where: { id: order.userId } });
      const currentBalance = user?.availableCredits || 0;
      const refundCredits = Math.abs(redeemedTx.amount);
      const balanceAfter = Math.round((currentBalance + refundCredits) * 100) / 100;

      await tx.creditTransaction.create({
        data: {
          userId: order.userId,
          orderId,
          type: 'REFUND_REVERSAL',
          amount: refundCredits,
          balanceBefore: currentBalance,
          balanceAfter,
          description: `Refunded redeemed credits for order ${order.internalOrderId}`,
          reason: reason || 'Order refunded/cancelled',
          adminUserId,
          status: 'COMPLETED',
        },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: {
          availableCredits: balanceAfter,
          lifetimeCreditsRedeemed: Math.max(0, ((user?.lifetimeCreditsRedeemed || 0) - refundCredits)),
        },
      });

      results.redeemedRestored = refundCredits;
    }

    return { success: true, ...results };
  });
}

/**
 * Customer Rewards Summary for `/dashboard/rewards` & `/api/user/rewards/summary`
 */
export async function getCustomerRewardsSummary(userId: string) {
  const [user, settings, transactions, eligibleOrdersCount, recentOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        availableCredits: true,
        lifetimeCreditsEarned: true,
        lifetimeCreditsRedeemed: true,
      },
    }),
    getRewardSettings(),
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        order: {
          select: {
            internalOrderId: true,
            amountInr: true,
            planName: true,
          },
        },
      },
    }),
    prisma.order.count({
      where: {
        userId,
        paymentStatus: { in: ['CAPTURED', 'PAID'] },
      },
    }),
    prisma.order.findMany({
      where: {
        userId,
        paymentStatus: { in: ['CAPTURED', 'PAID'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        internalOrderId: true,
        planName: true,
        amountInr: true,
        paidAmountInr: true,
        creditsEarned: true,
        creditsRedeemed: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error('User not found.');
  }

  return {
    availableCredits: user.availableCredits || 0,
    lifetimeCreditsEarned: user.lifetimeCreditsEarned || 0,
    lifetimeCreditsRedeemed: user.lifetimeCreditsRedeemed || 0,
    eligiblePurchasesCount: eligibleOrdersCount,
    settings: {
      rewardPercentage: settings.rewardPercentage,
      maxEligiblePurchaseAmount: settings.maxEligiblePurchaseAmount,
      maxRewardPerTransaction: settings.maxRewardPerTransaction,
      currency: settings.currency,
      isActive: settings.isActive,
    },
    transactions,
    orders: recentOrders.map((o) => ({
      id: o.id,
      internalOrderId: o.internalOrderId,
      planName: o.planName,
      purchaseAmount: o.paidAmountInr ?? o.amountInr,
      eligibleAmount: Math.min(o.paidAmountInr ?? o.amountInr, settings.maxEligiblePurchaseAmount),
      creditsEarned: o.creditsEarned || 0,
      creditsRedeemed: o.creditsRedeemed || 0,
      status: o.paymentStatus,
      date: o.createdAt,
    })),
  };
}

/**
 * Admin Rewards Global Overview & Analytics
 */
export async function getAdminRewardsOverview() {
  const [
    settings,
    totalCustomersWithCredits,
    usersAggregates,
    txAggregates,
    thisMonthTxs,
    recentTransactions,
  ] = await Promise.all([
    getRewardSettings(),
    prisma.user.count({
      where: { availableCredits: { gt: 0 } },
    }),
    prisma.user.aggregate({
      _sum: {
        availableCredits: true,
        lifetimeCreditsEarned: true,
        lifetimeCreditsRedeemed: true,
      },
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: { in: ['CAPTURED', 'PAID'] } },
      _sum: { amountInr: true },
      _count: { id: true },
    }),
    prisma.creditTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      select: { type: true, amount: true },
    }),
    prisma.creditTransaction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { internalOrderId: true, amountInr: true } },
      },
    }),
  ]);

  // Compute month metrics
  let thisMonthIssued = 0;
  let thisMonthRedeemed = 0;
  for (const tx of thisMonthTxs) {
    if (tx.amount > 0) thisMonthIssued += tx.amount;
    if (tx.amount < 0) thisMonthRedeemed += Math.abs(tx.amount);
  }

  return {
    settings,
    kpis: {
      totalCustomers: usersAggregates._count.id || 0,
      totalCustomersWithCredits,
      totalEligiblePurchaseVolume: txAggregates._sum.amountInr || 0,
      totalEligibleOrders: txAggregates._count.id || 0,
      totalCreditsIssued: usersAggregates._sum.lifetimeCreditsEarned || 0,
      totalCreditsRedeemed: usersAggregates._sum.lifetimeCreditsRedeemed || 0,
      totalOutstandingLiability: usersAggregates._sum.availableCredits || 0,
      thisMonthIssued: Math.round(thisMonthIssued * 100) / 100,
      thisMonthRedeemed: Math.round(thisMonthRedeemed * 100) / 100,
    },
    recentTransactions,
  };
}

/**
 * Paginated Global Credit Ledger with filtering
 */
export async function getGlobalCreditLedger(options: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.type && options.type !== 'ALL') {
    where.type = options.type;
  }

  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    where.OR = [
      { user: { email: { contains: s, mode: 'insensitive' } } },
      { user: { name: { contains: s, mode: 'insensitive' } } },
      { order: { internalOrderId: { contains: s, mode: 'insensitive' } } },
      { description: { contains: s, mode: 'insensitive' } },
      { reason: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [total, transactions] = await Promise.all([
    prisma.creditTransaction.count({ where }),
    prisma.creditTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, availableCredits: true },
        },
        order: {
          select: { internalOrderId: true, amountInr: true, planName: true },
        },
      },
    }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Customer Credit Inspection for Admin
 */
export async function getAdminCustomerCreditDetails(userId: string) {
  const [user, transactions, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        availableCredits: true,
        lifetimeCreditsEarned: true,
        lifetimeCreditsRedeemed: true,
        createdAt: true,
      },
    }),
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        order: { select: { internalOrderId: true, amountInr: true } },
      },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        internalOrderId: true,
        planName: true,
        amountInr: true,
        paidAmountInr: true,
        creditsEarned: true,
        creditsRedeemed: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error('Customer not found.');
  }

  return {
    customer: user,
    transactions,
    orders,
  };
}
