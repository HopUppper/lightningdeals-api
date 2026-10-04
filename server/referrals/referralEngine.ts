import crypto from 'crypto';
import { prisma } from '../db';
import { calculateReward } from '../rewards/rewardService';
import { recordAuditEvent } from '../auditLogger';
import { dispatchNotification } from '../notifications';

export interface AdminReferralQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  riskStatus?: string;
  rewardStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReferralSettingsData {
  enabled?: boolean;
  minPurchaseAmountInr?: number;
  attributionWindowDays?: number;
  qualificationRule?: 'FIRST_PURCHASE_ONLY' | 'EVERY_QUALIFYING_PURCHASE';
  rewardMethod?: 'MATCH_PURCHASE_REWARD' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  customPercentage?: number;
  customFixedAmount?: number;
  maxRewardPerOrder?: number;
  allowExistingCustomerWithoutPurchase?: boolean;
  firstAttributionWins?: boolean;
}

export class ReferralEngine {
  /**
   * 1. GET OR INITIALIZE SYSTEM REFERRAL SETTINGS
   */
  static async getSettings() {
    let settings = await prisma.referralSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.referralSettings.create({
        data: {
          id: 'default',
          enabled: true,
          minPurchaseAmountInr: 500.0,
          attributionWindowDays: 30,
          qualificationRule: 'FIRST_PURCHASE_ONLY',
          rewardMethod: 'MATCH_PURCHASE_REWARD',
          maxRewardPerOrder: 500.0,
          allowExistingCustomerWithoutPurchase: true,
          firstAttributionWins: true,
        },
      });
    }

    return settings;
  }

  /**
   * 2. UPDATE REFERRAL SETTINGS (Admin Only)
   */
  static async updateSettings(data: ReferralSettingsData, adminUserId?: string) {
    const current = await this.getSettings();

    const updated = await prisma.referralSettings.update({
      where: { id: 'default' },
      data: {
        ...(data.enabled !== undefined && { enabled: Boolean(data.enabled) }),
        ...(data.minPurchaseAmountInr !== undefined && { minPurchaseAmountInr: Math.max(0, Number(data.minPurchaseAmountInr)) }),
        ...(data.attributionWindowDays !== undefined && { attributionWindowDays: Math.max(1, Number(data.attributionWindowDays)) }),
        ...(data.qualificationRule && { qualificationRule: data.qualificationRule }),
        ...(data.rewardMethod && { rewardMethod: data.rewardMethod }),
        ...(data.customPercentage !== undefined && { customPercentage: Number(data.customPercentage) }),
        ...(data.customFixedAmount !== undefined && { customFixedAmount: Number(data.customFixedAmount) }),
        ...(data.maxRewardPerOrder !== undefined && { maxRewardPerOrder: Math.max(0, Number(data.maxRewardPerOrder)) }),
        ...(data.allowExistingCustomerWithoutPurchase !== undefined && {
          allowExistingCustomerWithoutPurchase: Boolean(data.allowExistingCustomerWithoutPurchase),
        }),
        ...(data.firstAttributionWins !== undefined && { firstAttributionWins: Boolean(data.firstAttributionWins) }),
      },
    });

    await recordAuditEvent({
      eventType: 'REFERRAL_SETTINGS_UPDATED',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: adminUserId,
      adminId: adminUserId,
      action: 'UPDATE_REFERRAL_SETTINGS',
      result: 'SUCCESS',
      resourceType: 'SYSTEM',
      resourceId: 'ReferralSettings',
      beforeState: JSON.stringify(current),
      afterState: JSON.stringify(updated),
    });

    return updated;
  }

  /**
   * 3. GENERATE NON-GUESSABLE ALPHANUMERIC REFERRAL CODE
   */
  static generateCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }

  /**
   * 4. GET OR CREATE USER REFERRAL CODE
   */
  static async getOrCreateUserReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    });

    if (!user) {
      throw new Error(`Customer '${userId}' not found.`);
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    let assigned = false;
    let code = '';
    let attempts = 0;

    while (!assigned && attempts < 10) {
      attempts++;
      code = this.generateCode();
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
        });
        assigned = true;
      } catch (e: any) {
        if (e.code !== 'P2002') throw e;
      }
    }

    return code;
  }

  /**
   * 5. RESOLVE REFERRAL CODE PUBLICLY (Privacy-Safe)
   */
  static async resolveReferralCode(rawCode: string) {
    if (!rawCode || typeof rawCode !== 'string') {
      return { valid: false, error: 'Referral code is required.' };
    }

    const code = rawCode.trim().toUpperCase();
    const settings = await this.getSettings();

    if (!settings.enabled) {
      return { valid: false, error: 'The referral program is currently paused.' };
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, name: true, status: true },
    });

    if (!referrer || referrer.status === 'suspended') {
      return { valid: false, error: 'Invalid or inactive referral code.' };
    }

    const firstName = referrer.name ? referrer.name.trim().split(' ')[0] : 'A friend';

    return {
      valid: true,
      code,
      referrerFirstName: firstName,
      message: `You've been invited to LightningAPI.pro! Sign up and get rewarded on your purchases.`,
    };
  }

  /**
   * 6. RECORD REFERRAL LINK CLICK (Attribution Funnel)
   */
  static async recordReferralClick(params: {
    code: string;
    ipAddress?: string;
    userAgent?: string;
    landingPage?: string;
  }) {
    const { code: rawCode, ipAddress, userAgent, landingPage } = params;
    if (!rawCode) return { success: false };

    const code = rawCode.trim().toUpperCase();
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, status: true },
    });

    if (!referrer || referrer.status === 'suspended') {
      return { success: false, error: 'Invalid referral code.' };
    }

    try {
      await prisma.referralClick.create({
        data: {
          referralCode: code,
          referrerId: referrer.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent ? userAgent.substring(0, 255) : null,
          landingPage: landingPage || '/',
        },
      });
    } catch (e: any) {
      console.warn('[REFERRAL CLICK RECORD NOTICE]', e.message);
    }

    return { success: true, referrerId: referrer.id, code };
  }

  /**
   * 7. ATTRIBUTE REFERRAL TO REGISTERED/LOGGED-IN CUSTOMER
   * Strict Server-Side Anti-Abuse, Self-Referral, Circular Chain & Expiry Checks.
   */
  static async attributeReferral(params: {
    customerId: string;
    referralCode: string;
    source?: 'DIRECT_LINK' | 'MANUAL_CODE' | 'CAMPAIGN';
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { customerId, referralCode: rawCode, source = 'DIRECT_LINK', ipAddress, userAgent } = params;
    const settings = await this.getSettings();

    if (!settings.enabled) {
      return { success: false, reason: 'REFERRAL_SYSTEM_DISABLED', message: 'Referral program is disabled.' };
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Resolve Referrer Account
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, email: true, phone: true, name: true, status: true },
    });

    if (!referrer) {
      return { success: false, reason: 'INVALID_CODE', message: 'Invalid referral code.' };
    }

    if (referrer.status === 'suspended') {
      return { success: false, reason: 'REFERRER_SUSPENDED', message: 'Referrer account is inactive.' };
    }

    // 2. Resolve Customer Account
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, phone: true, name: true, createdAt: true },
    });

    if (!customer) {
      return { success: false, reason: 'CUSTOMER_NOT_FOUND', message: 'Customer account not found.' };
    }

    // 3. Self-Referral Prevention (A refers A)
    if (referrer.id === customer.id) {
      return { success: false, reason: 'SELF_REFERRAL_BLOCKED', message: 'You cannot use your own referral code.' };
    }

    // Normalized email check
    const normReferrerEmail = referrer.email.trim().toLowerCase();
    const normCustomerEmail = customer.email.trim().toLowerCase();
    if (normReferrerEmail === normCustomerEmail) {
      return { success: false, reason: 'SELF_REFERRAL_EMAIL_MATCH', message: 'Self-referrals are not permitted.' };
    }

    // Phone match check
    if (referrer.phone && customer.phone && referrer.phone.trim() === customer.phone.trim()) {
      return { success: false, reason: 'SELF_REFERRAL_PHONE_MATCH', message: 'Self-referrals are not permitted.' };
    }

    // 4. Circular Chain Prevention (A -> B -> A)
    // Check if the customer is already a referrer of this referrer
    const circularCheck = await prisma.referral.findFirst({
      where: {
        referrerId: customer.id,
        referredUserId: referrer.id,
      },
    });

    if (circularCheck) {
      return {
        success: false,
        reason: 'CIRCULAR_REFERRAL_BLOCKED',
        message: 'Circular referral relationships are not permitted.',
      };
    }

    // 5. Existing Customer Rule
    // Check if customer already completed purchases prior to attribution
    const priorCompletedOrder = await prisma.order.findFirst({
      where: {
        userId: customer.id,
        paymentStatus: { in: ['CAPTURED', 'PAID'] },
      },
    });

    const priorCompletedPurchase = await prisma.purchase.findFirst({
      where: {
        userId: customer.id,
        status: 'COMPLETED',
      },
    });

    const hasPriorPurchases = Boolean(priorCompletedOrder || priorCompletedPurchase);

    if (hasPriorPurchases && !settings.allowExistingCustomerWithoutPurchase) {
      return {
        success: false,
        reason: 'EXISTING_CUSTOMER_WITH_PURCHASES',
        message: 'Existing customers with prior purchases cannot be attributed to a referral.',
      };
    }

    // 6. Existing Referral Relationship Check (Single Direct Referrer Rule)
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: customer.id },
    });

    if (existingReferral) {
      if (settings.firstAttributionWins) {
        return {
          success: true,
          alreadyAttributed: true,
          referral: existingReferral,
          message: 'Customer already attributed to an established referrer.',
        };
      }
    }

    // 7. Calculate Attribution Window Expiry
    const attributionStartedAt = new Date();
    const attributionExpiresAt = new Date(
      attributionStartedAt.getTime() + settings.attributionWindowDays * 24 * 60 * 60 * 1000
    );

    // 8. Create or Update Referral Attribution Record
    const referral = await prisma.$transaction(async (tx) => {
      let rec: any;
      if (existingReferral) {
        rec = await tx.referral.update({
          where: { id: existingReferral.id },
          data: {
            referrerId: referrer.id,
            referralCode: code,
            referralSource: source,
            attributionStartedAt,
            attributionExpiresAt,
            registrationAt: customer.createdAt,
            status: 'REGISTERED',
            ipAddress: ipAddress || null,
            userAgent: userAgent ? userAgent.substring(0, 255) : null,
          },
        });
      } else {
        rec = await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: customer.id,
            referralCode: code,
            referralSource: source,
            attributionStartedAt,
            attributionExpiresAt,
            registrationAt: customer.createdAt,
            status: 'REGISTERED',
            riskStatus: 'NORMAL',
            ipAddress: ipAddress || null,
            userAgent: userAgent ? userAgent.substring(0, 255) : null,
          },
        });
      }

      // Mark any matching click as converted
      await tx.referralClick.updateMany({
        where: {
          referralCode: code,
          converted: false,
          ...(ipAddress ? { ipAddress } : {}),
        },
        data: {
          converted: true,
          convertedUserId: customer.id,
        },
      });

      // Record Event
      await tx.referralEvent.create({
        data: {
          referralId: rec.id,
          eventType: 'REFERRED_CUSTOMER_REGISTERED',
          actorType: 'CUSTOMER',
          actorId: customer.id,
          metadata: JSON.stringify({
            referrerId: referrer.id,
            customerEmail: customer.email,
            source,
            attributionExpiresAt: attributionExpiresAt.toISOString(),
          }),
        },
      });

      return rec;
    });

    await recordAuditEvent({
      eventType: 'REFERRAL_ATTRIBUTED',
      severity: 'INFO',
      actorType: 'CUSTOMER',
      actorId: customer.id,
      customerId: customer.id,
      resourceType: 'USER',
      resourceId: customer.id,
      action: 'ATTRIBUTE_REFERRAL',
      result: 'SUCCESS',
      metadata: {
        referralId: referral.id,
        referrerId: referrer.id,
        code,
        source,
      },
    });

    return {
      success: true,
      referral,
      message: 'Referral attribution successfully recorded.',
    };
  }

  /**
   * 8. PROCESS ORDER REFERRAL QUALIFICATION & AWARD CREDITS
   * Triggered upon Order Completion (Payment Verified & Fulfilled).
   * Fully Idempotent, Concurrency-Safe, Single Source of Truth for Rewards.
   */
  static async processOrderReferralQualification(params: {
    orderId: string;
    userId: string;
    amountPaid: number;
    channel?: string;
  }) {
    const { orderId, userId, amountPaid, channel = 'WEBSITE' } = params;
    const cleanAmount = Math.max(0, Number(amountPaid) || 0);

    const settings = await this.getSettings();
    if (!settings.enabled) {
      return { qualified: false, reason: 'REFERRAL_SYSTEM_DISABLED' };
    }

    // 1. Check if Customer has an Active Referral Relationship
    const referral = await prisma.referral.findUnique({
      where: { referredUserId: userId },
      include: {
        referrer: { select: { id: true, email: true, name: true, availableCredits: true, lifetimeCreditsEarned: true } },
      },
    });

    if (!referral) {
      return { qualified: false, reason: 'NO_REFERRER' };
    }

    // 2. Status Eligibility Check
    if (['DISQUALIFIED', 'CANCELLED', 'REVERSED'].includes(referral.status)) {
      return { qualified: false, reason: `REFERRAL_STATUS_${referral.status}` };
    }

    // 3. Idempotency Check: Verify if THIS specific order already produced a referral reward
    const existingTx = await prisma.creditTransaction.findFirst({
      where: {
        orderId,
        type: 'REFERRAL_REWARD',
      },
    });

    if (existingTx) {
      return {
        qualified: true,
        alreadyCredited: true,
        transactionId: existingTx.id,
        creditsAwarded: existingTx.amount,
      };
    }

    // 4. Attribution Expiry Check
    const orderRecord = await prisma.order.findUnique({ where: { id: orderId } });
    const orderDate = orderRecord?.createdAt || new Date();

    if (orderDate > referral.attributionExpiresAt) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'EXPIRED' },
      });
      await prisma.referralEvent.create({
        data: {
          referralId: referral.id,
          eventType: 'REFERRAL_EXPIRED',
          actorType: 'SYSTEM',
          metadata: JSON.stringify({ orderId, orderDate, expiresAt: referral.attributionExpiresAt }),
        },
      });
      return { qualified: false, reason: 'ATTRIBUTION_WINDOW_EXPIRED' };
    }

    // 5. Qualification Rule: FIRST_PURCHASE_ONLY vs EVERY_QUALIFYING_PURCHASE
    if (settings.qualificationRule === 'FIRST_PURCHASE_ONLY') {
      if (referral.rewardStatus === 'CREDITED' && referral.qualifyingOrderId && referral.qualifyingOrderId !== orderId) {
        return { qualified: false, reason: 'FIRST_PURCHASE_ONLY_ALREADY_REWARDED' };
      }
    }

    // 6. Minimum Qualifying Purchase Amount
    if (cleanAmount < settings.minPurchaseAmountInr) {
      return {
        qualified: false,
        reason: 'MINIMUM_PURCHASE_NOT_MET',
        minRequired: settings.minPurchaseAmountInr,
        actualPaid: cleanAmount,
      };
    }

    // 7. Calculate Referral Reward
    // Uses calculateReward(amount) as the authoritative single source of truth
    let referralRewardCredits = 0;
    if (settings.rewardMethod === 'MATCH_PURCHASE_REWARD') {
      const rewardCalc = await calculateReward(cleanAmount);
      referralRewardCredits = rewardCalc.rewardCredits;
    } else if (settings.rewardMethod === 'PERCENTAGE') {
      const pct = (settings.customPercentage || 10.0) / 100;
      referralRewardCredits = Math.round(cleanAmount * pct * 100) / 100;
    } else if (settings.rewardMethod === 'FIXED_AMOUNT') {
      referralRewardCredits = settings.customFixedAmount || 100.0;
    }

    // Apply per-order reward cap (Default: ₹500)
    if (settings.maxRewardPerOrder && settings.maxRewardPerOrder > 0) {
      referralRewardCredits = Math.min(referralRewardCredits, settings.maxRewardPerOrder);
    }

    if (referralRewardCredits <= 0) {
      return { qualified: false, reason: 'CALCULATED_REWARD_ZERO' };
    }

    // 8. Atomic Interactive Transaction: Credit Referrer & Update Ledger
    return await prisma.$transaction(async (tx) => {
      // Concurrency check within transaction
      const raceCheck = await tx.creditTransaction.findFirst({
        where: { orderId, type: 'REFERRAL_REWARD' },
      });
      if (raceCheck) {
        return {
          qualified: true,
          alreadyCredited: true,
          transactionId: raceCheck.id,
          creditsAwarded: raceCheck.amount,
        };
      }

      const referrer = await tx.user.findUnique({
        where: { id: referral.referrerId },
        select: { id: true, availableCredits: true, lifetimeCreditsEarned: true, email: true },
      });

      if (!referrer) {
        throw new Error(`Referrer '${referral.referrerId}' not found.`);
      }

      const currentBalance = referrer.availableCredits || 0;
      const balanceAfter = Math.round((currentBalance + referralRewardCredits) * 100) / 100;
      const newLifetimeEarned = Math.round(((referrer.lifetimeCreditsEarned || 0) + referralRewardCredits) * 100) / 100;

      // Create Ledger Entry for Referrer (Person A)
      const creditTx = await tx.creditTransaction.create({
        data: {
          userId: referrer.id,
          orderId,
          referralId: referral.id,
          channel: channel.toUpperCase(),
          referenceId: orderRecord?.internalOrderId || orderId,
          type: 'REFERRAL_REWARD',
          amount: referralRewardCredits,
          balanceBefore: currentBalance,
          balanceAfter,
          description: `⚡ Referral Reward: ₹${referralRewardCredits} earned from qualifying referral purchase (${orderRecord?.internalOrderId || orderId})`,
          status: 'COMPLETED',
        },
      });

      // Update Referrer Balance
      await tx.user.update({
        where: { id: referrer.id },
        data: {
          availableCredits: balanceAfter,
          lifetimeCreditsEarned: newLifetimeEarned,
        },
      });

      // Update Referral Record
      const updatedReferral = await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'REWARDED',
          rewardStatus: 'CREDITED',
          qualifyingOrderId: orderId,
          rewardCreditsEarned: referralRewardCredits,
          firstPurchaseAt: referral.firstPurchaseAt || new Date(),
          rewardCreditedAt: new Date(),
        },
      });

      // Create Referral Event
      await tx.referralEvent.create({
        data: {
          referralId: referral.id,
          eventType: 'REFERRAL_REWARD_CREDITED',
          actorType: 'SYSTEM',
          metadata: JSON.stringify({
            orderId,
            purchaseAmount: cleanAmount,
            rewardCredits: referralRewardCredits,
            transactionId: creditTx.id,
          }),
        },
      });

      // Dispatch Notification to Referrer (Person A)
      await dispatchNotification({
        event: 'REFERRAL_REWARD_EARNED',
        userId: referrer.id,
        title: '⚡ Referral Reward Credited!',
        message: `Great news! Your referral has completed a qualifying purchase and you've earned ₹${referralRewardCredits.toLocaleString()} Lightning Credits!`,
        type: 'success',
        metadata: {
          orderId,
          referralId: referral.id,
          rewardCredits: referralRewardCredits,
        },
      });

      return {
        qualified: true,
        alreadyCredited: false,
        creditsAwarded: referralRewardCredits,
        transactionId: creditTx.id,
        referral: updatedReferral,
      };
    });
  }

  /**
   * 9. REVERSE REFERRAL REWARD UPON REFUND
   * If Person B's qualifying purchase is refunded:
   * - Claw back A's referral reward if sufficient balance exists.
   * - If A already spent/redeemed credits, flag REVIEW_REQUIRED without corrupting balance.
   */
  static async reverseReferralReward(params: {
    orderId: string;
    reason: string;
    adminUserId?: string;
  }) {
    const { orderId, reason, adminUserId } = params;

    // Find credited referral reward transaction for this order
    const referralTx = await prisma.creditTransaction.findFirst({
      where: {
        orderId,
        type: 'REFERRAL_REWARD',
        status: 'COMPLETED',
      },
    });

    if (!referralTx) {
      return { reversed: false, message: 'No referral reward was awarded for this order.' };
    }

    const referral = await prisma.referral.findFirst({
      where: { qualifyingOrderId: orderId },
    });

    return await prisma.$transaction(async (tx) => {
      const referrer = await tx.user.findUnique({
        where: { id: referralTx.userId },
        select: { id: true, availableCredits: true, email: true },
      });

      if (!referrer) {
        throw new Error(`Referrer '${referralTx.userId}' not found.`);
      }

      const clawbackAmount = referralTx.amount;
      const currentBalance = referrer.availableCredits || 0;

      // Check if Referrer has sufficient balance to claw back
      if (currentBalance < clawbackAmount) {
        // Customer already spent/redeemed credits -> Flag for Admin Review, DO NOT corrupt balance
        if (referral) {
          await tx.referral.update({
            where: { id: referral.id },
            data: {
              riskStatus: 'REVIEW_REQUIRED',
              notes: `Refund occurred for order ${orderId}, but referrer has insufficient balance to reverse ₹${clawbackAmount} (Current: ₹${currentBalance}). Flagged for Admin Review.`,
            },
          });

          await tx.referralEvent.create({
            data: {
              referralId: referral.id,
              eventType: 'REFERRAL_REWARD_REVIEW_REQUIRED',
              actorType: 'ADMIN',
              actorId: adminUserId || 'SYSTEM',
              metadata: JSON.stringify({
                orderId,
                requiredClawback: clawbackAmount,
                currentBalance,
                reason,
              }),
            },
          });
        }

        await recordAuditEvent({
          eventType: 'REFERRAL_REWARD_REQUIRES_REVIEW',
          severity: 'HIGH',
          actorType: adminUserId ? 'ADMIN' : 'SYSTEM',
          actorId: adminUserId,
          customerId: referrer.id,
          resourceType: 'ORDER',
          resourceId: orderId,
          action: 'REVERSE_REFERRAL_REWARD',
          result: 'WARNING',
          metadata: {
            orderId,
            referralId: referral?.id,
            referrerId: referrer.id,
            clawbackAmount,
            currentBalance,
            reason,
          },
        });

        return {
          reversed: false,
          requiresReview: true,
          currentBalance,
          clawbackAmount,
          message: 'Insufficient balance to claw back referral reward. Flagged for Admin Review.',
        };
      }

      // Referrer has sufficient balance -> Perform clean atomic clawback
      const balanceAfter = Math.round((currentBalance - clawbackAmount) * 100) / 100;

      const reversalTx = await tx.creditTransaction.create({
        data: {
          userId: referrer.id,
          orderId,
          referralId: referral?.id || null,
          channel: 'WEBSITE',
          type: 'REFUND_REVERSAL',
          amount: -clawbackAmount,
          balanceBefore: currentBalance,
          balanceAfter,
          description: `Referral reward reversal for refunded order (${orderId}): ${reason}`,
          reason,
          adminUserId,
          status: 'COMPLETED',
        },
      });

      await tx.user.update({
        where: { id: referrer.id },
        data: { availableCredits: balanceAfter },
      });

      if (referral) {
        await tx.referral.update({
          where: { id: referral.id },
          data: {
            status: 'REVERSED',
            rewardStatus: 'REVERSED',
            rewardReversedAt: new Date(),
            reversalReason: reason,
          },
        });

        await tx.referralEvent.create({
          data: {
            referralId: referral.id,
            eventType: 'REFERRAL_REWARD_REVERSED',
            actorType: 'ADMIN',
            actorId: adminUserId || 'SYSTEM',
            metadata: JSON.stringify({
              orderId,
              reversedAmount: clawbackAmount,
              reason,
              reversalTxId: reversalTx.id,
            }),
          },
        });
      }

      // Notify Referrer
      await dispatchNotification({
        event: 'REFERRAL_REWARD_REVERSED',
        userId: referrer.id,
        title: '⚡ Referral Reward Adjusted',
        message: `An associated referral reward of ₹${clawbackAmount.toLocaleString()} has been reversed due to the underlying order being refunded.`,
        type: 'info',
        metadata: { orderId, reversedAmount: clawbackAmount },
      });

      return {
        reversed: true,
        requiresReview: false,
        reversedAmount: clawbackAmount,
        balanceAfter,
        reversalTxId: reversalTx.id,
      };
    });
  }

  /**
   * 10. GET CUSTOMER REFERRAL OVERVIEW & METRICS
   * Real database data, privacy-masked referrals list.
   */
  static async getCustomerReferralOverview(userId: string) {
    const code = await this.getOrCreateUserReferralCode(userId);
    const settings = await this.getSettings();

    const baseUrl = process.env.VITE_APP_URL || 'https://lightningapi.pro';
    const referralUrl = `${baseUrl}/?ref=${code}`;

    // Real database metrics
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: { select: { name: true, email: true, createdAt: true } },
        qualifyingOrder: { select: { internalOrderId: true, amountInr: true, paidAmountInr: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter((r) => r.status === 'REWARDED').length;
    const pendingReferrals = referrals.filter((r) => ['ATTRIBUTED', 'REGISTERED', 'QUALIFIED'].includes(r.status)).length;
    const creditsEarned = referrals.reduce((sum, r) => sum + (r.rewardStatus === 'CREDITED' ? r.rewardCreditsEarned : 0), 0);
    const creditsReversed = referrals.reduce((sum, r) => sum + (r.rewardStatus === 'REVERSED' ? r.rewardCreditsEarned : 0), 0);

    // Privacy-safe masked representation
    const privacyMaskedList = referrals.map((r) => {
      const name = r.referredUser?.name || 'Customer';
      const email = r.referredUser?.email || '';

      // Mask name: "Alex Johnson" -> "Alex J***"
      const nameParts = name.trim().split(' ');
      const maskedName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[1].charAt(0)}***`
        : `${name.substring(0, 3)}***`;

      // Mask email: "alex.johnson@example.com" -> "a***@example.com"
      const [local, dom] = email.split('@');
      const maskedEmail = dom ? `${local.charAt(0)}***@${dom}` : '***@***.com';

      return {
        id: r.id,
        displayName: `${maskedName} (${maskedEmail})`,
        status: r.status,
        rewardStatus: r.rewardStatus,
        joinedDate: r.registrationAt || r.createdAt,
        firstPurchaseAmount: r.qualifyingOrder ? (r.qualifyingOrder.paidAmountInr ?? r.qualifyingOrder.amountInr) : null,
        creditsEarned: r.rewardStatus === 'CREDITED' ? r.rewardCreditsEarned : 0,
      };
    });

    return {
      referralCode: code,
      referralUrl,
      settings: {
        enabled: settings.enabled,
        minPurchaseAmountInr: settings.minPurchaseAmountInr,
        maxRewardPerOrder: settings.maxRewardPerOrder,
      },
      stats: {
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        creditsEarned: Math.round(creditsEarned * 100) / 100,
        creditsReversed: Math.round(creditsReversed * 100) / 100,
      },
      referrals: privacyMaskedList,
    };
  }

  /**
   * 11. GET ADMIN REFERRALS LIST WITH SEARCH & PAGINATION
   */
  static async getAdminReferrals(query: AdminReferralQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.riskStatus && query.riskStatus !== 'ALL') {
      where.riskStatus = query.riskStatus;
    }
    if (query.rewardStatus && query.rewardStatus !== 'ALL') {
      where.rewardStatus = query.rewardStatus;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { referralCode: { contains: term, mode: 'insensitive' } },
        { referrer: { email: { contains: term, mode: 'insensitive' } } },
        { referrer: { name: { contains: term, mode: 'insensitive' } } },
        { referredUser: { email: { contains: term, mode: 'insensitive' } } },
        { referredUser: { name: { contains: term, mode: 'insensitive' } } },
        { qualifyingOrder: { internalOrderId: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.referral.count({ where }),
      prisma.referral.findMany({
        where,
        include: {
          referrer: { select: { id: true, name: true, email: true, phone: true } },
          referredUser: { select: { id: true, name: true, email: true, phone: true } },
          qualifyingOrder: {
            select: { id: true, internalOrderId: true, amountInr: true, paidAmountInr: true, paymentStatus: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 12. GET ADMIN REFERRAL ANALYTICS & CONVERSION FUNNEL
   */
  static async getAdminAnalytics() {
    const [totalReferrals, successfulCount, pendingCount, disqualifiedCount, clicksCount, settings] =
      await Promise.all([
        prisma.referral.count(),
        prisma.referral.count({ where: { status: 'REWARDED' } }),
        prisma.referral.count({ where: { status: { in: ['ATTRIBUTED', 'REGISTERED', 'QUALIFIED'] } } }),
        prisma.referral.count({ where: { status: 'DISQUALIFIED' } }),
        prisma.referralClick.count(),
        this.getSettings(),
      ]);

    // Financial calculations
    const creditedTransactions = await prisma.creditTransaction.aggregate({
      where: { type: 'REFERRAL_REWARD', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const reversedTransactions = await prisma.creditTransaction.aggregate({
      where: { type: 'REFUND_REVERSAL', referralId: { not: null }, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const rewardedReferrals = await prisma.referral.findMany({
      where: { status: 'REWARDED', qualifyingOrderId: { not: null } },
      include: {
        qualifyingOrder: { select: { paidAmountInr: true, amountInr: true } },
      },
    });

    const revenueGenerated = rewardedReferrals.reduce((sum, r) => {
      const orderAmount = r.qualifyingOrder?.paidAmountInr ?? r.qualifyingOrder?.amountInr ?? 0;
      return sum + orderAmount;
    }, 0);

    // Top Referrers Leaderboard
    const topReferrerAggs = await prisma.referral.groupBy({
      by: ['referrerId'],
      where: { status: 'REWARDED' },
      _count: { id: true },
      _sum: { rewardCreditsEarned: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topReferrers = await Promise.all(
      topReferrerAggs.map(async (row) => {
        const u = await prisma.user.findUnique({
          where: { id: row.referrerId },
          select: { id: true, name: true, email: true, referralCode: true },
        });
        return {
          user: u,
          successfulReferrals: row._count.id,
          creditsEarned: row._sum.rewardCreditsEarned || 0,
        };
      })
    );

    const conversionRate = totalReferrals > 0 ? Math.round((successfulCount / totalReferrals) * 1000) / 10 : 0;
    const clickConversionRate = clicksCount > 0 ? Math.round((totalReferrals / clicksCount) * 1000) / 10 : 0;

    return {
      settings,
      metrics: {
        totalReferrals,
        successfulReferrals: successfulCount,
        pendingReferrals: pendingCount,
        disqualifiedReferrals: disqualifiedCount,
        clicksCount,
        conversionRate,
        clickConversionRate,
        totalCreditsIssued: creditedTransactions._sum.amount || 0,
        totalCreditsReversed: Math.abs(reversedTransactions._sum.amount || 0),
        revenueGenerated,
        averageOrderValue: successfulCount > 0 ? Math.round(revenueGenerated / successfulCount) : 0,
      },
      topReferrers,
    };
  }

  /**
   * 13. ADMIN ACTIONS ON INDIVIDUAL REFERRAL
   */
  static async adminAction(params: {
    referralId: string;
    action: 'APPROVE' | 'DISQUALIFY' | 'MARK_REVIEW' | 'ADD_NOTE' | 'REVERSE_REWARD';
    reason: string;
    adminUserId: string;
  }) {
    const { referralId, action, reason, adminUserId } = params;

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: { referrer: true, referredUser: true },
    });

    if (!referral) {
      throw new Error(`Referral '${referralId}' not found.`);
    }

    const beforeState = JSON.stringify(referral);
    let updated: any;

    if (action === 'DISQUALIFY') {
      updated = await prisma.referral.update({
        where: { id: referralId },
        data: {
          status: 'DISQUALIFIED',
          riskStatus: 'DISQUALIFIED',
          riskReason: reason,
        },
      });
    } else if (action === 'APPROVE') {
      updated = await prisma.referral.update({
        where: { id: referralId },
        data: {
          riskStatus: 'NORMAL',
          riskReason: null,
          ...(referral.status === 'DISQUALIFIED' ? { status: 'ATTRIBUTED' } : {}),
        },
      });
    } else if (action === 'MARK_REVIEW') {
      updated = await prisma.referral.update({
        where: { id: referralId },
        data: {
          riskStatus: 'REVIEW_REQUIRED',
          riskReason: reason,
        },
      });
    } else if (action === 'ADD_NOTE') {
      const existingNotes = referral.notes ? `${referral.notes}\n` : '';
      updated = await prisma.referral.update({
        where: { id: referralId },
        data: {
          notes: `${existingNotes}[${new Date().toISOString()}] ${adminUserId}: ${reason}`,
        },
      });
    } else if (action === 'REVERSE_REWARD') {
      if (!referral.qualifyingOrderId) {
        throw new Error('No qualifying order attached to reverse.');
      }
      return await this.reverseReferralReward({
        orderId: referral.qualifyingOrderId,
        reason,
        adminUserId,
      });
    }

    await prisma.referralEvent.create({
      data: {
        referralId,
        eventType: `ADMIN_${action}`,
        actorType: 'ADMIN',
        actorId: adminUserId,
        metadata: JSON.stringify({ reason }),
      },
    });

    await recordAuditEvent({
      eventType: `REFERRAL_ADMIN_${action}`,
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: adminUserId,
      adminId: adminUserId,
      resourceType: 'SYSTEM',
      resourceId: referralId,
      action,
      result: 'SUCCESS',
      beforeState,
      afterState: JSON.stringify(updated),
    });

    return { success: true, referral: updated };
  }
}
