import { prisma } from './db';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    description: string | null;
  };
  discountAmountInr: number;
  finalAmountInr: number;
  error?: string;
}

/**
 * Validates a coupon code server-side against database rules
 */
export async function validateCoupon(
  code: string,
  planPriceInr: number,
  userId?: string,
  planId?: string
): Promise<CouponValidationResult> {
  const cleanCode = (code || '').trim().toUpperCase();

  if (!cleanCode) {
    return {
      valid: false,
      discountAmountInr: 0,
      finalAmountInr: planPriceInr,
      error: 'Please enter a coupon code.',
    };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon) {
    return {
      valid: false,
      discountAmountInr: 0,
      finalAmountInr: planPriceInr,
      error: `Coupon code '${cleanCode}' does not exist.`,
    };
  }

  if (coupon.status !== 'ACTIVE') {
    return {
      valid: false,
      discountAmountInr: 0,
      finalAmountInr: planPriceInr,
      error: `Coupon code '${cleanCode}' is no longer active.`,
    };
  }

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return {
      valid: false,
      discountAmountInr: 0,
      finalAmountInr: planPriceInr,
      error: `Coupon code '${cleanCode}' has expired.`,
    };
  }

  // Check total usage limit
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return {
      valid: false,
      discountAmountInr: 0,
      finalAmountInr: planPriceInr,
      error: `Coupon code '${cleanCode}' has reached its maximum redemption limit.`,
    };
  }

  // Check minimum order amount
  if (planPriceInr < coupon.minOrderAmountInr) {
    return {
      valid: false,
      discountAmountInr: 0,
      finalAmountInr: planPriceInr,
      error: `Minimum order amount of ₹${coupon.minOrderAmountInr.toLocaleString()} required for this coupon.`,
    };
  }

  // Check plan applicability
  if (coupon.applicablePlanIds && coupon.applicablePlanIds !== 'ALL' && planId) {
    try {
      const allowedPlans = JSON.parse(coupon.applicablePlanIds);
      if (Array.isArray(allowedPlans) && !allowedPlans.includes(planId)) {
        return {
          valid: false,
          discountAmountInr: 0,
          finalAmountInr: planPriceInr,
          error: `Coupon '${cleanCode}' is not applicable to the selected plan.`,
        };
      }
    } catch (e) {
      // If parsing fails, allow all
    }
  }

  // Check per-user limit
  if (userId && coupon.maxUsesPerUser) {
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    if (userUsageCount >= coupon.maxUsesPerUser) {
      return {
        valid: false,
        discountAmountInr: 0,
        finalAmountInr: planPriceInr,
        error: `You have already used coupon '${cleanCode}' the maximum number of times allowed (${coupon.maxUsesPerUser}).`,
      };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = Math.round((planPriceInr * coupon.discountValue) / 100);
    if (coupon.maxDiscountInr && discountAmount > coupon.maxDiscountInr) {
      discountAmount = coupon.maxDiscountInr;
    }
  } else {
    // FLAT_INR
    discountAmount = Math.min(coupon.discountValue, planPriceInr);
  }

  const finalAmountInr = Math.max(1, planPriceInr - discountAmount);

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
    },
    discountAmountInr: discountAmount,
    finalAmountInr,
  };
}

/**
 * Records coupon usage and increments redemption count atomically
 */
export async function recordCouponUsage(params: {
  couponId: string;
  userId: string;
  orderId?: string;
  discountAmount: number;
  finalAmount: number;
}) {
  try {
    await prisma.$transaction([
      prisma.couponUsage.create({
        data: {
          couponId: params.couponId,
          userId: params.userId,
          orderId: params.orderId,
          discountAmount: params.discountAmount,
          finalAmount: params.finalAmount,
        },
      }),
      prisma.coupon.update({
        where: { id: params.couponId },
        data: {
          usedCount: { increment: 1 },
        },
      }),
    ]);
  } catch (err) {
    console.error('Error recording coupon usage:', err);
  }
}
