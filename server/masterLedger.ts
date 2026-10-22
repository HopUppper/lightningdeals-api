import { prisma } from './db';
import { getUpstreamMasterAccounting } from './accounting/upstreamAccounting';
import { calculateAggregateAccounting } from './accounting/aggregateAccounting';
import {
  reserveTokens,
  releaseReservation,
  getActiveMasterReservations as getActiveMasterReservationsFromStore,
} from './accounting/tokenReservation';

export async function getActiveMasterReservations(providerId: string): Promise<number> {
  return getActiveMasterReservationsFromStore(providerId);
}

export function reserveMasterTokens(providerId: string, requestId: string, estimatedTokens: number) {
  reserveTokens({ providerId, requestId, estimatedTokens });
}

export function releaseMasterReservation(requestId: string) {
  releaseReservation(requestId);
}

/**
 * Checks master provider headroom against a required token amount.
 * Powered by Layer A upstream master accounting.
 * Zero hardcoded fallback numbers.
 */
export async function checkMasterCapacity(providerId?: string, requiredTokens = 1000) {
  const upstream = await getUpstreamMasterAccounting(providerId);

  if (upstream.providerId === 'none' || upstream.status === 'NOT_CONFIGURED') {
    return {
      available: false,
      availableTokens: 0,
      rawAvailableTokens: '0',
      reservedTokens: 0,
      providerId: upstream.providerId,
      providerName: upstream.providerName,
      status: 'NOT_CONFIGURED',
      capacityModel: 'lifetime_prepaid',
      windowHours: 5,
      windowAllowance: '0',
      windowTokensUsed: 0,
      nextResetAt: null,
      windowResetSeconds: null,
      discoverySource: upstream.discoverySource,
      discoveryStatus: upstream.discoveryStatus,
      discoveryConfidence: upstream.discoveryConfidence,
    };
  }

  const isAvailable = upstream.effectiveAvailableTokens >= requiredTokens;

  return {
    available: isAvailable,
    availableTokens: upstream.effectiveAvailableTokens,
    rawAvailableTokens: upstream.effectiveAvailableTokens.toString(),
    reservedTokens: upstream.activeMasterReservations,
    providerId: upstream.providerId,
    providerName: upstream.providerName,
    status: upstream.status,
    capacityModel: upstream.capacityModel,
    windowHours: upstream.windowHours,
    windowAllowance: (upstream.upstreamLimit !== null ? upstream.upstreamLimit : upstream.effectiveAvailableTokens).toString(),
    windowTokensUsed: upstream.upstreamConsumedWindow,
    nextResetAt: upstream.discoveredResetAt ? upstream.discoveredResetAt.toISOString() : null,
    windowResetSeconds: upstream.discoveredResetSeconds,
    discoverySource: upstream.discoverySource,
    discoveryStatus: upstream.discoveryStatus,
    discoveryConfidence: upstream.discoveryConfidence,
  };
}

export async function settleMasterUsage({
  providerId,
  apiKeyId,
  userId,
  actualTokens,
  reference,
  notes,
}: {
  providerId: string;
  apiKeyId?: string;
  userId?: string;
  actualTokens: number;
  reference?: string;
  notes?: string;
}) {
  if (actualTokens <= 0 || providerId === 'fallback') return;

  const tokensUsedBig = BigInt(actualTokens);

  return prisma.$transaction(async (tx) => {
    const provider = await tx.vendorProvider.findUnique({ where: { id: providerId } });
    if (!provider) return;

    const isRolling = provider.capacityModel === 'rolling_window' || Number(provider.windowAllowance) > 0;
    const newConsumed = provider.consumedTokens + tokensUsedBig;

    let newAvailable: bigint;
    if (isRolling) {
      const windowHours = provider.windowHours || 5;
      const windowMs = windowHours * 60 * 60 * 1000;
      const windowUsage = await tx.apiRequest.aggregate({
        _sum: { totalTokens: true },
        where: {
          providerId,
          createdAt: { gte: new Date(Date.now() - windowMs) },
        },
      });
      const usedInWindow = (windowUsage._sum.totalTokens || 0) + actualTokens;
      // Authoritative limit calculation: discoveredLimitTokens -> configuredLimitTokens -> windowAllowance -> purchasedTokens -> 0
      const allowanceNum = Number(
        provider.discoveredLimitTokens && provider.discoveredLimitTokens > BigInt(0)
          ? provider.discoveredLimitTokens
          : provider.configuredLimitTokens && provider.configuredLimitTokens > BigInt(0)
          ? provider.configuredLimitTokens
          : provider.windowAllowance > BigInt(0)
          ? provider.windowAllowance
          : provider.purchasedTokens > BigInt(0)
          ? provider.purchasedTokens
          : 0
      );
      const remainingRolling = Math.max(0, allowanceNum - usedInWindow);
      newAvailable = BigInt(remainingRolling);
    } else {
      newAvailable = provider.availableTokens > tokensUsedBig ? provider.availableTokens - tokensUsedBig : BigInt(0);
    }

    const updatedProvider = await tx.vendorProvider.update({
      where: { id: providerId },
      data: {
        availableTokens: newAvailable,
        consumedTokens: newConsumed,
      },
    });

    const ledgerEntry = await tx.masterTokenLedger.create({
      data: {
        providerId,
        type: 'CUSTOMER_USAGE',
        amount: -tokensUsedBig,
        balanceAfter: newAvailable,
        reference: reference || 'API_USAGE_SETTLEMENT',
        notes: notes || (isRolling ? `Customer API request completed (${actualTokens} tokens, 5h rolling model)` : `Customer API request completed (${actualTokens} tokens)`),
        apiKeyId,
        userId,
      },
    });

    return { updatedProvider, ledgerEntry };
  });
}

export async function topUpMasterBalance({
  providerId,
  amountTokens,
  reference,
  notes,
  adminUserId,
}: {
  providerId: string;
  amountTokens: number | string;
  reference: string;
  notes?: string;
  adminUserId?: string;
}) {
  const amountNum = Number(amountTokens);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Top-up amount must be a positive integer.');
  }

  const amountBig = BigInt(Math.floor(amountNum));

  return prisma.$transaction(async (tx) => {
    const provider = await tx.vendorProvider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new Error(`Vendor provider with ID ${providerId} not found.`);
    }

    const newAvailable = provider.availableTokens + amountBig;
    const newPurchased = provider.purchasedTokens + amountBig;

    const updatedProvider = await tx.vendorProvider.update({
      where: { id: providerId },
      data: {
        availableTokens: newAvailable,
        purchasedTokens: newPurchased,
        status: 'connected',
      },
    });

    const ledgerEntry = await tx.masterTokenLedger.create({
      data: {
        providerId,
        type: 'TOP_UP',
        amount: amountBig,
        balanceAfter: newAvailable,
        reference: reference.trim(),
        notes: notes?.trim() || 'Vendor master balance top-up',
        adminUserId,
      },
    });

    await tx.adminLog.create({
      data: {
        adminUserId,
        action: 'TOP_UP_MASTER_BALANCE',
        targetType: 'VendorProvider',
        targetId: providerId,
        metadata: `Added +${amountNum.toLocaleString()} master tokens (Ref: ${reference}). New available balance: ${newAvailable.toString()}`,
      },
    });

    return { updatedProvider, ledgerEntry };
  });
}

export async function reconcileMasterLedger(providerId: string, autoFix = false, adminUserId?: string) {
  const provider = await prisma.vendorProvider.findUnique({
    where: { id: providerId },
    include: { masterTokenLedgers: true },
  });

  if (!provider) {
    throw new Error(`Vendor provider ${providerId} not found.`);
  }

  let calculatedSum = BigInt(0);
  provider.masterTokenLedgers.forEach((entry) => {
    calculatedSum += entry.amount;
  });

  const dbBalance = provider.availableTokens;
  const isReconciled = calculatedSum === dbBalance;
  const discrepancy = calculatedSum - dbBalance;

  let fixed = false;
  let newDbBalance = dbBalance;

  if (autoFix && (!isReconciled || calculatedSum < BigInt(0))) {
    const targetBalance = calculatedSum > BigInt(0) ? calculatedSum : BigInt(0);
    const adjustmentAmount = targetBalance - dbBalance;

    await prisma.$transaction(async (tx) => {
      await tx.vendorProvider.update({
        where: { id: providerId },
        data: { availableTokens: targetBalance },
      });

      if (adjustmentAmount !== BigInt(0)) {
        await tx.masterTokenLedger.create({
          data: {
            providerId,
            type: 'RECONCILIATION_ADJUSTMENT',
            amount: adjustmentAmount,
            balanceAfter: targetBalance,
            reference: 'AUDIT_AUTO_FIX',
            notes: `Automated ledger reconciliation adjustment (${adjustmentAmount > BigInt(0) ? '+' : ''}${adjustmentAmount.toString()} tokens)`,
            adminUserId,
          },
        });
      }

      await tx.adminLog.create({
        data: {
          adminUserId,
          action: 'RECONCILE_MASTER_LEDGER',
          targetType: 'VendorProvider',
          targetId: providerId,
          metadata: `Reconciled master ledger. Old DB balance: ${dbBalance.toString()}, target: ${targetBalance.toString()}, discrepancy was ${discrepancy.toString()}`,
        },
      });
    });

    fixed = true;
    newDbBalance = targetBalance;
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    isReconciled: isReconciled || fixed,
    fixed,
    calculatedBalance: calculatedSum.toString(),
    dbBalance: newDbBalance.toString(),
    discrepancy: fixed ? '0' : discrepancy.toString(),
    transactionCount: provider.masterTokenLedgers.length + (fixed ? 1 : 0),
  };
}

/**
 * Authoritative Layer C Active Entitlement Exposure calculation.
 * Accurately calculates exposure, consumption, remaining master capacity, and headroom.
 */
export async function calculateActiveEntitlementExposure(providerId?: string) {
  const aggregate = await calculateAggregateAccounting(providerId);

  return {
    activeKeyCount: aggregate.activeCustomerCount,
    totalCustomerCount: aggregate.totalCustomerCount,
    active5hWindowAllowance: aggregate.activeCustomer5hAllowanceExposure.toString(),
    active5hWindowUsed: aggregate.aggregateWindowTokensConsumed.toString(),
    active5hWindowRemaining: Math.max(0, aggregate.activeCustomer5hAllowanceExposure - aggregate.aggregateWindowTokensConsumed).toString(),
    theoretical30DayExposure: aggregate.theoretical30DayExposure.toString(),
    upstreamRemainingMasterCapacity: aggregate.upstreamRemainingMasterCapacity.toString(),
    exposureHeadroomTokens: aggregate.exposureHeadroomTokens.toString(),
    exposureRatioPercent: aggregate.exposureRatioPercent,
    utilizationRatioPercent: aggregate.utilizationRatioPercent,
    unreconciledOrUnknownTokens: aggregate.unreconciledOrUnknownTokens.toString(),
    isOversubscribed: aggregate.isOversubscribed,
  };
}
