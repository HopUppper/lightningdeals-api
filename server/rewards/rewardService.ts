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
  isPromoApplied: boolean;
  promoMultiplier?: number;
  promoTitle?: string;
  promoMinPurchaseAmount?: number;
  promoMaxCredits?: number;
  baseRewardCredits: number;
  bonusCredits: number;
}

/**
 * Fetch or initialize global RewardSettings
 */
export async function getRewardSettings() {
  const defaultFallback = {
    id: 'default',
    rewardPercentage: 10.0,
    maxEligiblePurchaseAmount: 5000.0,
    maxRewardPerTransaction: 500.0,
    currency: 'INR',
    isActive: true,
    promoActive: false,
    promoMultiplier: 2.0,
    promoMinPurchaseAmount: 0.0,
    promoMaxCredits: 1000.0,
    promoTitle: '⚡ SUNDAY SPECIAL: 2X LIGHTNING CREDITS',
    promoSubtitle: 'Get 2X credits on ALL purchases today (up to 1,000 credits max on purchases up to ₹5,000)!',
    promoBadge: 'SUNDAY BOOST',
    promoShowPopup: true,
    promoShowBanner: true,
    promoEndsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    let settings = await prisma.rewardSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      try {
        settings = await prisma.rewardSettings.create({
          data: {
            id: 'default',
            rewardPercentage: 10.0,
            maxEligiblePurchaseAmount: 5000.0,
            maxRewardPerTransaction: 500.0,
            currency: 'INR',
            isActive: true,
            promoActive: false,
            promoMultiplier: 2.0,
            promoMinPurchaseAmount: 0.0,
            promoMaxCredits: 1000.0,
            promoTitle: '⚡ SUNDAY SPECIAL: 2X LIGHTNING CREDITS',
            promoSubtitle: 'Get 2X credits on ALL purchases today (up to 1,000 credits max on purchases up to ₹5,000)!',
            promoBadge: 'SUNDAY BOOST',
            promoShowPopup: true,
            promoShowBanner: true,
            promoEndsAt: null,
          },
        });
      } catch {
        return defaultFallback as any;
      }
    }

    return settings;
  } catch {
    return defaultFallback as any;
  }
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
    promoActive?: boolean;
    promoMultiplier?: number;
    promoMinPurchaseAmount?: number;
    promoMaxCredits?: number;
    promoTitle?: string;
    promoSubtitle?: string;
    promoBadge?: string;
    promoShowPopup?: boolean;
    promoShowBanner?: boolean;
    promoEndsAt?: Date | string | null;
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
      ...(params.promoActive !== undefined && { promoActive: Boolean(params.promoActive) }),
      ...(params.promoMultiplier !== undefined && { promoMultiplier: Math.max(1, Number(params.promoMultiplier) || 1) }),
      ...(params.promoMinPurchaseAmount !== undefined && { promoMinPurchaseAmount: Math.max(0, Number(params.promoMinPurchaseAmount) || 0) }),
      ...(params.promoMaxCredits !== undefined && { promoMaxCredits: Math.max(0, Number(params.promoMaxCredits) || 0) }),
      ...(params.promoTitle !== undefined && { promoTitle: params.promoTitle }),
      ...(params.promoSubtitle !== undefined && { promoSubtitle: params.promoSubtitle }),
      ...(params.promoBadge !== undefined && { promoBadge: params.promoBadge }),
      ...(params.promoShowPopup !== undefined && { promoShowPopup: Boolean(params.promoShowPopup) }),
      ...(params.promoShowBanner !== undefined && { promoShowBanner: Boolean(params.promoShowBanner) }),
      ...(params.promoEndsAt !== undefined && { promoEndsAt: params.promoEndsAt ? new Date(params.promoEndsAt) : null }),
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
 * base_reward = eligible_amount * (rewardPercentage / 100)
 * capped_base_reward = MIN(base_reward, maxRewardPerTransaction)
 *
 * If promotional offer active and meets min purchase:
 * boosted_credits = capped_base_reward * promoMultiplier
 * final_reward = promoMaxCredits > 0 ? MIN(boosted_credits, promoMaxCredits) : boosted_credits
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
      isPromoApplied: false,
      baseRewardCredits: 0,
      bonusCredits: 0,
    };
  }

  // 1. Calculate eligible base amount (First ₹5,000 max by default)
  const eligibleAmount = Math.min(cleanAmount, settings.maxEligiblePurchaseAmount);

  // 2. Calculate percentage base reward (10% by default)
  const calculatedCredits = Math.round((eligibleAmount * (settings.rewardPercentage / 100)) * 100) / 100;
  const baseRewardCredits = Math.min(calculatedCredits, settings.maxRewardPerTransaction);

  // 3. Check Promotional Offer condition
  const isPromoTimeValid = !settings.promoEndsAt || new Date(settings.promoEndsAt) > new Date();
  const isPromoActive = Boolean(settings.promoActive) && isPromoTimeValid;
  const meetsMinPurchase = cleanAmount >= (settings.promoMinPurchaseAmount || 0);

  if (isPromoActive && meetsMinPurchase && (settings.promoMultiplier || 1) > 1) {
    const multiplier = Number(settings.promoMultiplier) || 1;
    const boostedCredits = Math.round((baseRewardCredits * multiplier) * 100) / 100;
    const maxCap = settings.promoMaxCredits && settings.promoMaxCredits > 0 ? settings.promoMaxCredits : boostedCredits;
    const finalRewardCredits = Math.min(boostedCredits, maxCap);
    const bonusCredits = Math.max(0, Math.round((finalRewardCredits - baseRewardCredits) * 100) / 100);

    return {
      purchaseAmount: cleanAmount,
      eligibleAmount,
      rewardPercentage: settings.rewardPercentage,
      rewardCredits: finalRewardCredits,
      maxEligibleAmount: settings.maxEligiblePurchaseAmount,
      maxRewardPerTransaction: settings.maxRewardPerTransaction,
      currency: settings.currency,
      isPromoApplied: true,
      promoMultiplier: multiplier,
      promoTitle: settings.promoTitle,
      promoMinPurchaseAmount: settings.promoMinPurchaseAmount,
      promoMaxCredits: settings.promoMaxCredits,
      baseRewardCredits,
      bonusCredits,
    };
  }

  return {
    purchaseAmount: cleanAmount,
    eligibleAmount,
    rewardPercentage: settings.rewardPercentage,
    rewardCredits: baseRewardCredits,
    maxEligibleAmount: settings.maxEligiblePurchaseAmount,
    maxRewardPerTransaction: settings.maxRewardPerTransaction,
    currency: settings.currency,
    isPromoApplied: false,
    baseRewardCredits,
    bonusCredits: 0,
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
    // Find or create Universal Purchase record for this website order
    let purchase = await tx.purchase.findFirst({
      where: {
        OR: [{ orderId }, { referenceId: orderId }],
      },
    });

    const orderRecord = await tx.order.findUnique({ where: { id: orderId } });
    if (!purchase && orderRecord) {
      purchase = await tx.purchase.create({
        data: {
          userId,
          orderId,
          productName: orderRecord.planName || 'API Subscription',
          description: `Website purchase - ${orderRecord.planName || 'API Plan'}`,
          amountPaid: calculation.purchaseAmount,
          channel: 'WEBSITE',
          status: 'COMPLETED',
          creditsEarned: calculation.rewardCredits,
          creditsRedeemed: orderRecord.creditsRedeemed || 0,
          referenceId: orderRecord.internalOrderId,
          createdBy: 'SYSTEM',
        },
      });
    } else if (purchase) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          creditsEarned: calculation.rewardCredits,
          status: 'COMPLETED',
        },
      });
    }

    // Create Credit Ledger Entry
    const creditTx = await tx.creditTransaction.create({
      data: {
        userId,
        orderId,
        purchaseId: purchase?.id || null,
        channel: 'WEBSITE',
        referenceId: orderRecord?.internalOrderId || null,
        type: 'PURCHASE_REWARD',
        amount: calculation.rewardCredits,
        balanceBefore: currentBalance,
        balanceAfter,
        description: calculation.isPromoApplied
          ? `${calculation.promoTitle || 'Flash Offer'}: ${calculation.promoMultiplier}X Lightning Credits earned (${calculation.rewardCredits} credits on ₹${calculation.purchaseAmount.toLocaleString()} purchase)`
          : `${calculation.rewardPercentage}% Lightning Credits earned on purchase (₹${calculation.purchaseAmount.toLocaleString()} purchase, ₹${calculation.eligibleAmount.toLocaleString()} eligible)`,
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
      purchaseId: purchase?.id,
      balanceBefore: currentBalance,
      balanceAfter,
    };
  }, { maxWait: 10000, timeout: 20000 });
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
 * Unified across ALL purchase channels (WhatsApp, Website, Manual, etc.)
 */
export async function getCustomerRewardsSummary(userId: string) {
  const [user, settings, transactions, eligiblePurchasesCount, recentPurchases] = await Promise.all([
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
      take: 30,
      include: {
        order: {
          select: {
            internalOrderId: true,
            amountInr: true,
            planName: true,
          },
        },
        purchase: {
          select: {
            id: true,
            productName: true,
            channel: true,
            referenceId: true,
            amountPaid: true,
          },
        },
      },
    }),
    prisma.purchase.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    }),
    prisma.purchase.findMany({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
      take: 20,
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
  ]);

  if (!user) {
    throw new Error('Customer account not found.');
  }

  const purchasesMapped = recentPurchases.map((p) => ({
    id: p.id,
    productName: p.productName,
    description: p.description,
    amountPaid: p.amountPaid,
    channel: p.channel,
    status: p.status,
    creditsEarned: p.creditsEarned,
    creditsRedeemed: p.creditsRedeemed,
    referenceId: p.referenceId,
    date: p.purchaseDate,
    eligibleAmount: Math.min(p.amountPaid, settings.maxEligiblePurchaseAmount),
  }));

  return {
    availableCredits: user.availableCredits || 0,
    lifetimeCreditsEarned: user.lifetimeCreditsEarned || 0,
    lifetimeCreditsRedeemed: user.lifetimeCreditsRedeemed || 0,
    eligiblePurchasesCount,
    settings: {
      rewardPercentage: settings.rewardPercentage,
      maxEligiblePurchaseAmount: settings.maxEligiblePurchaseAmount,
      maxRewardPerTransaction: settings.maxRewardPerTransaction,
      currency: settings.currency,
      isActive: settings.isActive,
      promoActive: settings.promoActive,
      promoMultiplier: settings.promoMultiplier,
      promoMinPurchaseAmount: settings.promoMinPurchaseAmount,
      promoMaxCredits: settings.promoMaxCredits,
      promoTitle: settings.promoTitle,
      promoSubtitle: settings.promoSubtitle,
      promoBadge: settings.promoBadge,
      promoShowPopup: settings.promoShowPopup,
      promoShowBanner: settings.promoShowBanner,
      promoEndsAt: settings.promoEndsAt,
    },
    transactions,
    purchases: purchasesMapped,
    // Keep orders array for backward compatibility with existing components
    orders: purchasesMapped.map((p) => ({
      id: p.id,
      internalOrderId: p.referenceId || p.id.substring(0, 8),
      planName: p.productName,
      purchaseAmount: p.amountPaid,
      eligibleAmount: p.eligibleAmount,
      creditsEarned: p.creditsEarned,
      creditsRedeemed: p.creditsRedeemed,
      status: p.status,
      date: p.date,
      channel: p.channel,
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
    purchasesAggregates,
    channelAggregates,
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
    prisma.purchase.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amountPaid: true, creditsEarned: true },
      _count: { id: true },
    }),
    prisma.purchase.groupBy({
      by: ['channel'],
      where: { status: 'COMPLETED' },
      _sum: { amountPaid: true },
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
        purchase: { select: { id: true, productName: true, channel: true, referenceId: true } },
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

  const channelBreakdown: Record<string, { count: number; volume: number }> = {
    WEBSITE: { count: 0, volume: 0 },
    WHATSAPP: { count: 0, volume: 0 },
    MANUAL: { count: 0, volume: 0 },
    OTHER: { count: 0, volume: 0 },
  };

  for (const item of channelAggregates) {
    channelBreakdown[item.channel] = {
      count: item._count.id || 0,
      volume: item._sum.amountPaid || 0,
    };
  }

  return {
    settings,
    kpis: {
      totalCustomers: usersAggregates._count.id || 0,
      totalCustomersWithCredits,
      totalEligiblePurchaseVolume: purchasesAggregates._sum.amountPaid || txAggregates._sum.amountInr || 0,
      totalEligiblePurchases: purchasesAggregates._count.id || 0,
      totalCreditsIssued: usersAggregates._sum.lifetimeCreditsEarned || 0,
      totalCreditsRedeemed: usersAggregates._sum.lifetimeCreditsRedeemed || 0,
      totalOutstandingLiability: usersAggregates._sum.availableCredits || 0,
      thisMonthIssued: Math.round(thisMonthIssued * 100) / 100,
      thisMonthRedeemed: Math.round(thisMonthRedeemed * 100) / 100,
      channelBreakdown,
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
      { purchase: { productName: { contains: s, mode: 'insensitive' } } },
      { purchase: { referenceId: { contains: s, mode: 'insensitive' } } },
      { description: { contains: s, mode: 'insensitive' } },
      { reason: { contains: s, mode: 'insensitive' } },
      { referenceId: { contains: s, mode: 'insensitive' } },
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
        purchase: {
          select: { id: true, productName: true, channel: true, referenceId: true },
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
 * Customer Credit & Universal Purchase Details for Admin
 */
export async function getAdminCustomerProfileDetails(userId: string) {
  const user = await prisma.user.findUnique({
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
  });

  if (!user) {
    throw new Error('Customer account not found.');
  }

  const [purchases, transactions, aggregates] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
    }),
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        purchase: { select: { id: true, productName: true, channel: true, referenceId: true } },
        order: { select: { internalOrderId: true, amountInr: true } },
      },
    }),
    prisma.purchase.groupBy({
      by: ['channel'],
      where: { userId },
      _count: { id: true },
      _sum: { amountPaid: true, creditsEarned: true },
    }),
  ]);

  let totalPurchasesCount = 0;
  let totalPurchaseValue = 0;
  let websitePurchasesCount = 0;
  let websitePurchaseValue = 0;
  let whatsappPurchasesCount = 0;
  let whatsappPurchaseValue = 0;
  let manualPurchasesCount = 0;
  let manualPurchaseValue = 0;

  for (const group of aggregates) {
    const count = group._count.id || 0;
    const value = group._sum.amountPaid || 0;
    totalPurchasesCount += count;
    totalPurchaseValue += value;

    if (group.channel === 'WEBSITE') {
      websitePurchasesCount = count;
      websitePurchaseValue = value;
    } else if (group.channel === 'WHATSAPP') {
      whatsappPurchasesCount = count;
      whatsappPurchaseValue = value;
    } else if (group.channel === 'MANUAL') {
      manualPurchasesCount = count;
      manualPurchaseValue = value;
    }
  }

  return {
    customer: user,
    stats: {
      availableCredits: user.availableCredits || 0,
      lifetimeCreditsEarned: user.lifetimeCreditsEarned || 0,
      lifetimeCreditsRedeemed: user.lifetimeCreditsRedeemed || 0,
      totalPurchases: totalPurchasesCount,
      totalPurchaseValue,
      websitePurchases: websitePurchasesCount,
      websitePurchaseValue,
      whatsappPurchases: whatsappPurchasesCount,
      whatsappPurchaseValue,
      manualPurchases: manualPurchasesCount,
      manualPurchaseValue,
    },
    purchases,
    transactions,
  };
}

export const getAdminCustomerCreditDetails = getAdminCustomerProfileDetails;

/**
 * Universal Purchase Creation
 * Authoritatively calculates rewards and updates customer wallet balance.
 */
export async function createUniversalPurchase(params: {
  userId: string;
  productName: string;
  description?: string;
  amountPaid: number;
  channel?: string;
  purchaseDate?: Date | string;
  status?: string;
  referenceId?: string;
  orderId?: string;
  notes?: string;
  createdBy?: string;
}) {
  const {
    userId,
    productName,
    description,
    amountPaid,
    channel = 'WHATSAPP',
    purchaseDate,
    status = 'COMPLETED',
    referenceId,
    orderId,
    notes,
    createdBy = 'ADMIN',
  } = params;

  const cleanAmount = Math.max(0, Math.round(Number(amountPaid) * 100) / 100);
  const cleanChannel = (channel || 'WHATSAPP').toUpperCase().trim();
  const cleanStatus = (status || 'COMPLETED').toUpperCase().trim();
  const cleanRef = referenceId?.trim() || null;

  if (!userId) {
    throw new Error('Customer ID is required.');
  }

  if (!productName || !productName.trim()) {
    throw new Error('Product / Subscription name is required.');
  }

  if (cleanAmount <= 0) {
    throw new Error('Purchase amount must be greater than zero.');
  }

  // 1. Verify Customer Exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, availableCredits: true, lifetimeCreditsEarned: true },
  });

  if (!user) {
    throw new Error('Customer account not found.');
  }

  // 2. Duplicate Check / Idempotency
  if (cleanRef) {
    const existing = await prisma.purchase.findUnique({
      where: { referenceId: cleanRef },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (existing) {
      return {
        success: true,
        isDuplicate: true,
        message: `Purchase already exists for reference ${cleanRef}.`,
        purchase: existing,
        creditsAwarded: existing.creditsEarned,
        currentBalance: user.availableCredits,
        newBalance: user.availableCredits,
      };
    }
  }

  // 3. Calculate Reward
  const calculation = await calculateReward(cleanAmount);
  const shouldAwardCredits = cleanStatus === 'COMPLETED' && calculation.rewardCredits > 0;
  const creditsToAward = shouldAwardCredits ? calculation.rewardCredits : 0;

  // 4. Atomic Interactive Database Transaction
  return await prisma.$transaction(async (tx) => {
    // Secondary check inside lock
    if (cleanRef) {
      const race = await tx.purchase.findUnique({ where: { referenceId: cleanRef } });
      if (race) {
        return {
          success: true,
          isDuplicate: true,
          message: `Purchase already exists for reference ${cleanRef}.`,
          purchase: race,
          creditsAwarded: race.creditsEarned,
          currentBalance: user.availableCredits,
          newBalance: user.availableCredits,
        };
      }
    }

    const currentBalance = user.availableCredits || 0;
    const balanceAfter = shouldAwardCredits
      ? Math.round((currentBalance + creditsToAward) * 100) / 100
      : currentBalance;
    const newLifetimeEarned = shouldAwardCredits
      ? Math.round(((user.lifetimeCreditsEarned || 0) + creditsToAward) * 100) / 100
      : user.lifetimeCreditsEarned || 0;

    const channelReadable = cleanChannel === 'WHATSAPP' ? 'WhatsApp' : cleanChannel === 'WEBSITE' ? 'Website' : cleanChannel;
    const purchaseDesc = description?.trim() || `${productName.trim()} purchased via ${channelReadable}`;

    // Create Universal Purchase Record
    const purchase = await tx.purchase.create({
      data: {
        userId,
        orderId: orderId || null,
        productName: productName.trim(),
        description: purchaseDesc,
        amountPaid: cleanAmount,
        channel: cleanChannel,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        status: cleanStatus,
        creditsEarned: creditsToAward,
        creditsRedeemed: 0,
        referenceId: cleanRef,
        notes: notes?.trim() || null,
        createdBy,
      },
    });

    let creditTx: any = null;

    if (shouldAwardCredits) {
      // Create Credit Transaction
      creditTx = await tx.creditTransaction.create({
        data: {
          userId,
          purchaseId: purchase.id,
          orderId: orderId || null,
          channel: cleanChannel,
          referenceId: cleanRef,
          type: 'PURCHASE_REWARD',
          amount: creditsToAward,
          balanceBefore: currentBalance,
          balanceAfter,
          description: calculation.isPromoApplied
            ? `${productName.trim()} purchased via ${channelReadable} - ${calculation.promoTitle || 'Flash Offer'} (${calculation.promoMultiplier}X Lightning Credits earned: ${creditsToAward} credits)`
            : `${productName.trim()} purchased via ${channelReadable} - ${calculation.rewardPercentage}% Lightning Credits earned (${creditsToAward} credits)`,
          status: 'COMPLETED',
        },
      });

      // Update User Balance
      await tx.user.update({
        where: { id: userId },
        data: {
          availableCredits: balanceAfter,
          lifetimeCreditsEarned: newLifetimeEarned,
        },
      });

      // Customer Notification
      await tx.notification.create({
        data: {
          userId,
          title: '⚡ Lightning Rewards',
          message: `You earned ₹${creditsToAward.toLocaleString()} Lightning Credits from your ${productName.trim()} purchase. Current balance: ₹${balanceAfter.toLocaleString()}. Purchased via ${channelReadable}.`,
          type: 'success',
        },
      });
    }

    // Audit Logging
    await recordAuditEvent({
      eventType: 'PURCHASE_CREATED',
      severity: 'MEDIUM',
      actorType: createdBy.startsWith('WHATSAPP') ? 'SYSTEM' : 'ADMIN',
      actorId: createdBy,
      customerId: userId,
      resourceType: 'PURCHASE',
      resourceId: purchase.id,
      action: 'CREATE_PURCHASE',
      metadata: JSON.stringify({
        productName: purchase.productName,
        amountPaid: purchase.amountPaid,
        channel: purchase.channel,
        creditsEarned: purchase.creditsEarned,
        referenceId: purchase.referenceId,
        newBalance: balanceAfter,
      }),
    });

    return {
      success: true,
      isDuplicate: false,
      purchase,
      calculation,
      creditTransaction: creditTx,
      creditsAwarded: creditsToAward,
      currentBalance,
      newBalance: balanceAfter,
    };
  });
}

/**
 * Universal Purchase Amount Editing (Strict Ledger Preserving)
 * Reverses original reward and awards new calculated reward.
 */
export async function updateUniversalPurchaseAmount(params: {
  purchaseId: string;
  newAmount: number;
  reason?: string;
  adminUserId?: string;
}) {
  const { purchaseId, newAmount, reason, adminUserId } = params;
  const cleanNewAmount = Math.max(0, Math.round(Number(newAmount) * 100) / 100);

  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true },
    });

    if (!purchase) {
      throw new Error(`Purchase ${purchaseId} not found.`);
    }

    if (purchase.amountPaid === cleanNewAmount) {
      return { success: true, message: 'Amount is unchanged.', purchase };
    }

    const oldCredits = purchase.creditsEarned || 0;
    const oldAmount = purchase.amountPaid;
    const user = purchase.user;
    let currentBalance = user.availableCredits || 0;

    let newCalculation = { rewardCredits: 0, eligibleAmount: 0, purchaseAmount: cleanNewAmount };
    if (purchase.status === 'COMPLETED') {
      newCalculation = await calculateReward(cleanNewAmount);
    }
    const newCredits = newCalculation.rewardCredits;

    // 1. Reverse original credits if any were earned
    if (oldCredits > 0) {
      const balanceAfterReversal = Math.max(0, Math.round((currentBalance - oldCredits) * 100) / 100);
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          purchaseId: purchase.id,
          orderId: purchase.orderId,
          type: 'REFUND_REVERSAL',
          amount: -oldCredits,
          balanceBefore: currentBalance,
          balanceAfter: balanceAfterReversal,
          description: `Adjustment reversal: Original reward on ${purchase.productName} (₹${oldAmount.toLocaleString()}) reversed`,
          reason: reason || 'Purchase amount adjusted by admin',
          adminUserId,
          status: 'COMPLETED',
        },
      });
      currentBalance = balanceAfterReversal;
    }

    // 2. Award new credits
    const finalBalance = Math.round((currentBalance + newCredits) * 100) / 100;
    if (newCredits > 0) {
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          purchaseId: purchase.id,
          orderId: purchase.orderId,
          type: 'PURCHASE_REWARD',
          amount: newCredits,
          balanceBefore: currentBalance,
          balanceAfter: finalBalance,
          description: `Adjustment award: Recalculated reward on ${purchase.productName} (₹${cleanNewAmount.toLocaleString()}) awarded`,
          reason: reason || 'Purchase amount adjusted by admin',
          adminUserId,
          status: 'COMPLETED',
        },
      });
    }

    // 3. Update User balance
    const netCreditDelta = newCredits - oldCredits;
    const newLifetimeEarned = Math.max(0, Math.round(((user.lifetimeCreditsEarned || 0) + netCreditDelta) * 100) / 100);
    await tx.user.update({
      where: { id: user.id },
      data: {
        availableCredits: finalBalance,
        lifetimeCreditsEarned: newLifetimeEarned,
      },
    });

    // 4. Update Purchase
    const updatedPurchase = await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        amountPaid: cleanNewAmount,
        creditsEarned: newCredits,
      },
    });

    // 5. Audit Log
    await recordAuditEvent({
      eventType: 'PURCHASE_AMOUNT_ADJUSTED',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: adminUserId,
      customerId: user.id,
      resourceType: 'PURCHASE',
      resourceId: purchase.id,
      metadata: JSON.stringify({
        oldAmount,
        newAmount: cleanNewAmount,
        oldCredits,
        newCredits,
        netDelta: netCreditDelta,
        reason,
      }),
    });

    return {
      success: true,
      purchase: updatedPurchase,
      oldAmount,
      newAmount: cleanNewAmount,
      oldCredits,
      newCredits,
      netCreditDelta,
      newBalance: finalBalance,
    };
  });
}

/**
 * Universal Purchase Status Updating
 * Handles COMPLETED (awards rewards) and REFUNDED/CANCELLED (reverses rewards).
 */
export async function updateUniversalPurchaseStatus(params: {
  purchaseId: string;
  status: string;
  reason?: string;
  adminUserId?: string;
}) {
  const { purchaseId, status, reason, adminUserId } = params;
  const newStatus = status.toUpperCase().trim();

  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true },
    });

    if (!purchase) {
      throw new Error(`Purchase ${purchaseId} not found.`);
    }

    if (purchase.status === newStatus) {
      return { success: true, message: 'Status is unchanged.', purchase };
    }

    const user = purchase.user;
    let currentBalance = user.availableCredits || 0;
    let creditsEarned = purchase.creditsEarned || 0;

    // Moving to REFUNDED or CANCELLED from COMPLETED: reverse credits
    if ((newStatus === 'REFUNDED' || newStatus === 'CANCELLED') && purchase.status === 'COMPLETED' && creditsEarned > 0) {
      const balanceAfter = Math.max(0, Math.round((currentBalance - creditsEarned) * 100) / 100);
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          purchaseId: purchase.id,
          type: 'REFUND_REVERSAL',
          amount: -creditsEarned,
          balanceBefore: currentBalance,
          balanceAfter,
          description: `Reward reversal for ${newStatus.toLowerCase()} purchase (${purchase.productName})`,
          reason: reason || `Purchase marked as ${newStatus}`,
          adminUserId,
          status: 'COMPLETED',
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { availableCredits: balanceAfter },
      });

      currentBalance = balanceAfter;
    }

    // Moving to COMPLETED from PENDING: award credits
    if (newStatus === 'COMPLETED' && purchase.status !== 'COMPLETED') {
      const calculation = await calculateReward(purchase.amountPaid);
      if (calculation.rewardCredits > 0) {
        creditsEarned = calculation.rewardCredits;
        const balanceAfter = Math.round((currentBalance + creditsEarned) * 100) / 100;
        const newLifetime = Math.round(((user.lifetimeCreditsEarned || 0) + creditsEarned) * 100) / 100;

        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            purchaseId: purchase.id,
            type: 'PURCHASE_REWARD',
            amount: creditsEarned,
            balanceBefore: currentBalance,
            balanceAfter,
            description: `${purchase.productName} completed - 10% Lightning Credits earned`,
            status: 'COMPLETED',
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            availableCredits: balanceAfter,
            lifetimeCreditsEarned: newLifetime,
          },
        });

        currentBalance = balanceAfter;
      }
    }

    const updated = await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        status: newStatus,
        creditsEarned,
      },
    });

    await recordAuditEvent({
      eventType: 'PURCHASE_STATUS_UPDATED',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: adminUserId,
      customerId: user.id,
      resourceType: 'PURCHASE',
      resourceId: purchase.id,
      metadata: JSON.stringify({ oldStatus: purchase.status, newStatus, reason }),
    });

    return {
      success: true,
      purchase: updated,
      newBalance: currentBalance,
    };
  });
}

/**
 * Universal Purchases Query with Filtering and Pagination
 */
export async function getUniversalPurchases(options: {
  page?: number;
  limit?: number;
  channel?: string;
  status?: string;
  search?: string;
  userId?: string;
}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.channel && options.channel !== 'ALL') {
    where.channel = options.channel.toUpperCase();
  }

  if (options.status && options.status !== 'ALL') {
    where.status = options.status.toUpperCase();
  }

  if (options.userId) {
    where.userId = options.userId;
  }

  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    where.OR = [
      { productName: { contains: s, mode: 'insensitive' } },
      { referenceId: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { user: { email: { contains: s, mode: 'insensitive' } } },
      { user: { name: { contains: s, mode: 'insensitive' } } },
      { user: { phone: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const [total, purchases] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      skip,
      take: limit,
      orderBy: { purchaseDate: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, availableCredits: true },
        },
      },
    }),
  ]);

  return {
    purchases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Search Customers for Purchase Recording
 */
export async function searchCustomersForPurchase(query: string) {
  const q = (query || '').trim();
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { id: { equals: q } },
        ],
      }
    : {};

  return await prisma.user.findMany({
    where: where as any,
    take: 15,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      availableCredits: true,
      lifetimeCreditsEarned: true,
      lifetimeCreditsRedeemed: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Available Products Catalog for Dropdown
 * Merges website plans with popular external subscriptions
 */
export async function getAvailableProductsCatalog() {
  const [plans, packages] = await Promise.all([
    prisma.plan.findMany({
      where: { enabled: true },
      select: { id: true, displayName: true, name: true, priceInr: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.tokenPackage.findMany({
      where: { enabled: true },
      select: { id: true, displayName: true, priceInr: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const websiteProducts = [
    ...plans.map((p) => ({
      name: p.displayName || p.name,
      suggestedPrice: p.priceInr,
      category: 'Website Plan',
    })),
    ...packages.map((pkg) => ({
      name: pkg.displayName,
      suggestedPrice: pkg.priceInr,
      category: 'Token Package',
    })),
  ];

  const externalSubscriptions = [
    { name: 'LinkedIn Premium', suggestedPrice: 3500, category: 'Subscription' },
    { name: 'Canva Pro (1 Year)', suggestedPrice: 2000, category: 'Subscription' },
    { name: 'Adobe Creative Cloud', suggestedPrice: 5000, category: 'Subscription' },
    { name: 'Claude Pro (Monthly)', suggestedPrice: 2000, category: 'AI Tools' },
    { name: 'Microsoft 365 Family', suggestedPrice: 4200, category: 'Productivity' },
    { name: 'Perplexity Pro (Annual)', suggestedPrice: 4999, category: 'AI Tools' },
    { name: 'TradingView Premium', suggestedPrice: 4500, category: 'Finance' },
    { name: 'Coursera Plus (Annual)', suggestedPrice: 5000, category: 'Education' },
    { name: 'YouTube Premium Family', suggestedPrice: 1890, category: 'Media' },
    { name: 'Spotify Family (1 Year)', suggestedPrice: 1799, category: 'Media' },
  ];

  return {
    websiteProducts,
    externalSubscriptions,
  };
}

