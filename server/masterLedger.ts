import { prisma } from './db';
import { calculateKeyRollingWindow } from './window';

// In-memory active request reservations for Master Vendor Capacity: requestId -> tokens
const masterReservations = new Map<string, { providerId: string; tokens: number }>();

export function getActiveMasterReservations(providerId: string): number {
  let sum = 0;
  for (const [, res] of masterReservations.entries()) {
    if (res.providerId === providerId) {
      sum += res.tokens;
    }
  }
  return sum;
}

export function reserveMasterTokens(providerId: string, requestId: string, estimatedTokens: number) {
  masterReservations.set(requestId, { providerId, tokens: estimatedTokens });
}

export function releaseMasterReservation(requestId: string) {
  masterReservations.delete(requestId);
}

export async function checkMasterCapacity(providerId?: string, requiredTokens = 1000) {
  const provider = providerId
    ? await prisma.vendorProvider.findUnique({ where: { id: providerId } })
    : await prisma.vendorProvider.findFirst({ where: { isPrimary: true } });

  if (!provider || !provider.masterApiKeyEncrypted) {
    return {
      available: false,
      availableTokens: 0,
      rawAvailableTokens: '0',
      reservedTokens: 0,
      providerId: provider?.id || 'none',
      providerName: provider?.name || 'No Upstream Provider Configured',
      status: 'NOT_CONFIGURED',
    };
  }

  const reservedNum = getActiveMasterReservations(provider.id);
  const availableNum = Number(provider.availableTokens) - reservedNum;
  const isAvailable = availableNum >= requiredTokens && provider.status !== 'disabled';

  let status = 'HEALTHY';
  if (provider.status === 'disabled' || !provider.masterApiKeyEncrypted) {
    status = 'NOT_CONFIGURED';
  } else if (availableNum <= Number(provider.criticalThresholdTokens)) {
    status = availableNum <= 0 ? 'DEPLETED' : 'CRITICAL';
  } else if (availableNum <= Number(provider.warningThresholdTokens)) {
    status = 'WARNING';
  }

  return {
    available: isAvailable,
    availableTokens: Math.max(0, availableNum),
    rawAvailableTokens: provider.availableTokens.toString(),
    reservedTokens: reservedNum,
    providerId: provider.id,
    providerName: provider.name,
    status,
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

    const newAvailable = provider.availableTokens > tokensUsedBig ? provider.availableTokens - tokensUsedBig : BigInt(0);
    const newConsumed = provider.consumedTokens + tokensUsedBig;

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
        notes: notes || `Customer API request completed (${actualTokens} tokens)`,
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

export async function reconcileMasterLedger(providerId: string) {
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

  return {
    providerId: provider.id,
    providerName: provider.name,
    isReconciled,
    calculatedBalance: calculatedSum.toString(),
    dbBalance: dbBalance.toString(),
    discrepancy: discrepancy.toString(),
    transactionCount: provider.masterTokenLedgers.length,
  };
}

export async function calculateActiveEntitlementExposure() {
  const activeKeys = await prisma.apiKey.findMany({
    where: { status: 'active' },
  });

  let sumActiveWindowAllowance = BigInt(0);
  let sumActiveWindowUsed = BigInt(0);
  let sumActiveWindowRemaining = BigInt(0);

  for (const key of activeKeys) {
    const windowMetrics = await calculateKeyRollingWindow(key);
    sumActiveWindowAllowance += key.purchasedTokens;
    sumActiveWindowUsed += BigInt(windowMetrics.windowTokensUsed);
    sumActiveWindowRemaining += BigInt(windowMetrics.remainingNum);
  }

  // Theoretical 30-day exposure = (sumActiveWindowAllowance * (30 days * 24 hours / 5 hours)) = sumActiveWindowAllowance * 144
  const theoretical30DayExposure = sumActiveWindowAllowance * BigInt(144);

  return {
    activeKeyCount: activeKeys.length,
    active5hWindowAllowance: sumActiveWindowAllowance.toString(),
    active5hWindowUsed: sumActiveWindowUsed.toString(),
    active5hWindowRemaining: sumActiveWindowRemaining.toString(),
    theoretical30DayExposure: theoretical30DayExposure.toString(),
  };
}
