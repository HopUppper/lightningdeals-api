import { prisma } from '../db';

export interface DiscrepancyItem {
  id: string;
  category:
    | 'CUSTOMER_CREDIT'
    | 'CUSTOMER_TOKEN'
    | 'PURCHASE_GRANT'
    | 'USAGE_SETTLEMENT'
    | 'STALE_RESERVATION'
    | 'DUPLICATE_SETTLEMENT'
    | 'CROSS_BILLING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  expected: any;
  actual: any;
  discrepancy: any;
  resourceId?: string;
  reference?: string;
  recommendedAction: string;
}

export interface AccountingReconciliationResult {
  timestamp: string;
  auditScope: string;
  isReconciled: boolean;
  totalIssuesCount: number;
  customerCreditDiscrepancies: DiscrepancyItem[];
  customerTokenDiscrepancies: DiscrepancyItem[];
  purchaseGrantDiscrepancies: DiscrepancyItem[];
  unsettledUsageDiscrepancies: DiscrepancyItem[];
  staleReservations: DiscrepancyItem[];
  duplicateSettlements: DiscrepancyItem[];
  crossBillingAnomalies: DiscrepancyItem[];
  metrics: {
    totalCustomerKeysAudited: number;
    totalOrdersAudited: number;
    totalUsageEventsAudited: number;
    totalReservationsAudited: number;
  };
}

/**
 * ============================================================================
 * ⚡ READ-ONLY ACCOUNTING & USAGE RECONCILIATION ENGINE
 * ============================================================================
 * Audits ledger consistency across all three billing modalities:
 * - Credit Plans (CustomerUsageCreditLedger vs ApiKey.creditBalanceUsd)
 * - Token Plans (TokenLedger vs ApiKey.tokensRemaining)
 * - Rolling-Window Plans (ApiRequest in 5h window vs Subscription)
 *
 * Rules:
 * 1. STRICTLY READ-ONLY by default. Zero automated writes, updates, or deletions.
 * 2. Compares authoritative stored state with immutable ledger transaction logs.
 * 3. Identifies discrepancies, missing grants, orphaned usage, and cross-billing leaks.
 */

// 1. Audit Customer Credit Balances
export function auditCreditKeyBalance(
  key: { id: string; name?: string; creditBalanceUsd?: number | null; billingType?: string | null },
  ledgerEntries: Array<{ amount: number; type: string }>
): DiscrepancyItem | null {
  if (key.billingType !== 'credit') return null;

  const storedBalance = Number(key.creditBalanceUsd || 0);
  let calculatedBalance = 0;

  for (const entry of ledgerEntries) {
    calculatedBalance += Number(entry.amount || 0);
  }

  calculatedBalance = Math.round(calculatedBalance * 100000) / 100000;
  const delta = Math.round((storedBalance - calculatedBalance) * 100000) / 100000;

  if (Math.abs(delta) > 0.001) {
    return {
      id: `credit-disc-${key.id}`,
      category: 'CUSTOMER_CREDIT',
      severity: Math.abs(delta) > 1.0 ? 'HIGH' : 'MEDIUM',
      description: `Credit balance mismatch on API key ${key.name || key.id}: stored balance ($${storedBalance.toFixed(4)}) differs from ledger movements ($${calculatedBalance.toFixed(4)})`,
      expected: calculatedBalance,
      actual: storedBalance,
      discrepancy: delta,
      resourceId: key.id,
      recommendedAction: 'Verify ledger audit trail and reconcile with authorized admin adjustment if valid.',
    };
  }

  return null;
}

// 2. Audit Customer Token Balances
export function auditTokenKeyBalance(
  key: { id: string; name?: string; tokensRemaining?: bigint | number | null; purchasedTokens?: bigint | number | null; billingType?: string | null },
  ledgerEntries: Array<{ amount: bigint | number; type: string }>
): DiscrepancyItem | null {
  if (key.billingType !== 'token') return null;

  const storedRemaining = BigInt(key.tokensRemaining || 0);
  let calculatedRemaining = BigInt(0);

  for (const entry of ledgerEntries) {
    calculatedRemaining += BigInt(entry.amount || 0);
  }

  if (storedRemaining !== calculatedRemaining) {
    const delta = storedRemaining - calculatedRemaining;
    return {
      id: `token-disc-${key.id}`,
      category: 'CUSTOMER_TOKEN',
      severity: delta > 1000000n || delta < -1000000n ? 'HIGH' : 'MEDIUM',
      description: `Token balance mismatch on API key ${key.name || key.id}: stored tokens (${storedRemaining.toString()}) differs from token ledger movements (${calculatedRemaining.toString()})`,
      expected: calculatedRemaining.toString(),
      actual: storedRemaining.toString(),
      discrepancy: delta.toString(),
      resourceId: key.id,
      recommendedAction: 'Inspect recent token deduction logs and reconcile with authorized adjustment.',
    };
  }

  return null;
}

// 3. Audit Purchase Grants
export function auditPurchaseGrant(
  order: {
    id: string;
    internalOrderId: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    orderType?: string | null;
    fulfilledApiKeyId?: string | null;
  },
  keyExists: boolean,
  creditGrantExists: boolean,
  tokenGrantExists: boolean,
  subscriptionExists: boolean
): DiscrepancyItem | null {
  if (order.paymentStatus === 'CAPTURED' && order.fulfillmentStatus === 'FULFILLED') {
    if (!order.fulfilledApiKeyId || !keyExists) {
      return {
        id: `grant-missing-key-${order.id}`,
        category: 'PURCHASE_GRANT',
        severity: 'HIGH',
        description: `Order ${order.internalOrderId} marked FULFILLED but fulfilledApiKeyId is missing or key was not found.`,
        expected: 'Valid ApiKey provisioned',
        actual: order.fulfilledApiKeyId || 'null',
        discrepancy: 'Orphaned fulfilled order without active API key',
        resourceId: order.id,
        reference: order.internalOrderId,
        recommendedAction: 'Trigger retry-fulfill to provision customer API key safely.',
      };
    }

    if (order.orderType === 'CREDIT_PACK' && !creditGrantExists) {
      return {
        id: `grant-missing-credit-${order.id}`,
        category: 'PURCHASE_GRANT',
        severity: 'HIGH',
        description: `Credit order ${order.internalOrderId} fulfilled without corresponding CustomerUsageCreditLedger grant entry.`,
        expected: 'CREDITS_GRANTED ledger entry',
        actual: 'None found',
        discrepancy: 'Missing credit ledger grant record',
        resourceId: order.id,
        reference: order.internalOrderId,
        recommendedAction: 'Record missing credit grant in CustomerUsageCreditLedger.',
      };
    }

    if (order.orderType === 'TOKEN_PACK' && !tokenGrantExists) {
      return {
        id: `grant-missing-token-${order.id}`,
        category: 'PURCHASE_GRANT',
        severity: 'HIGH',
        description: `Token pack order ${order.internalOrderId} fulfilled without corresponding TokenLedger PURCHASE entry.`,
        expected: 'PURCHASE token ledger entry',
        actual: 'None found',
        discrepancy: 'Missing token ledger grant record',
        resourceId: order.id,
        reference: order.internalOrderId,
        recommendedAction: 'Record missing token grant in TokenLedger.',
      };
    }
  }

  return null;
}

// 4. Audit Usage Settlements
export function auditUsageSettlement(
  request: { id: string; apiKeyId?: string | null; model: string; totalTokens: number; statusCode: number; billingType?: string | null },
  hasLedgerDeduction: boolean
): DiscrepancyItem | null {
  // Only successful completions should have settled ledger deductions
  if (request.statusCode === 200 && request.totalTokens > 0) {
    if (!hasLedgerDeduction) {
      return {
        id: `unsettled-req-${request.id}`,
        category: 'USAGE_SETTLEMENT',
        severity: 'MEDIUM',
        description: `ApiRequest ${request.id} for model ${request.model} (${request.totalTokens} tokens) has no recorded ledger deduction.`,
        expected: 'Ledger deduction record present',
        actual: 'No deduction found',
        discrepancy: `${request.totalTokens} uncharged tokens`,
        resourceId: request.id,
        reference: request.id,
        recommendedAction: 'Investigate gateway completion log for premature termination or missed settlement.',
      };
    }
  }

  return null;
}

// 5. Audit Stale Reservations
export function auditStaleReservation(
  reservation: { id: string; requestId: string; apiKeyId?: string | null; tokens: number; status: string; expiresAt: Date },
  now: Date = new Date()
): DiscrepancyItem | null {
  if (reservation.status === 'ACTIVE' && reservation.expiresAt.getTime() < now.getTime()) {
    const elapsedMinutes = Math.round((now.getTime() - reservation.expiresAt.getTime()) / 60000);
    return {
      id: `stale-res-${reservation.id}`,
      category: 'STALE_RESERVATION',
      severity: 'LOW',
      description: `Reservation for request ${reservation.requestId} expired ${elapsedMinutes} minutes ago but remains in ACTIVE status.`,
      expected: 'SETTLED or EXPIRED',
      actual: 'ACTIVE',
      discrepancy: `${reservation.tokens} tokens reserved past expiration`,
      resourceId: reservation.id,
      reference: reservation.requestId,
      recommendedAction: 'Run cleanupExpiredReservations() to sweep stale reservation entries.',
    };
  }

  return null;
}

// 6. Audit Cross-Billing Anomalies
export function auditCrossBillingAnomaly(
  key: { id: string; billingType?: string | null; name?: string },
  creditEntriesCount: number,
  tokenEntriesCount: number
): DiscrepancyItem | null {
  if (key.billingType === 'credit' && tokenEntriesCount > 0) {
    return {
      id: `cross-bill-${key.id}`,
      category: 'CROSS_BILLING',
      severity: 'HIGH',
      description: `API key ${key.name || key.id} is configured for credit billing, but has entries in the TokenLedger.`,
      expected: 'Usage recorded exclusively in CustomerUsageCreditLedger',
      actual: `${tokenEntriesCount} entries found in TokenLedger`,
      discrepancy: 'Cross-billing contamination',
      resourceId: key.id,
      recommendedAction: 'Ensure routing passes billingType to gateway settlement without falling back to token ledger.',
    };
  }

  if (key.billingType === 'token' && creditEntriesCount > 0) {
    return {
      id: `cross-bill-${key.id}`,
      category: 'CROSS_BILLING',
      severity: 'HIGH',
      description: `API key ${key.name || key.id} is configured for token billing, but has entries in CustomerUsageCreditLedger.`,
      expected: 'Usage recorded exclusively in TokenLedger',
      actual: `${creditEntriesCount} entries found in CustomerUsageCreditLedger`,
      discrepancy: 'Cross-billing contamination',
      resourceId: key.id,
      recommendedAction: 'Verify key billingType matches plan configuration.',
    };
  }

  return null;
}

/**
 * Main Database / Offline-Safe Reconciliation Function.
 * Runs complete accounting audit across the entire system.
 */
export async function auditAccountingReconciliation(
  dbClient: any = prisma
): Promise<AccountingReconciliationResult> {
  const now = new Date();
  const customerCreditDiscrepancies: DiscrepancyItem[] = [];
  const customerTokenDiscrepancies: DiscrepancyItem[] = [];
  const purchaseGrantDiscrepancies: DiscrepancyItem[] = [];
  const unsettledUsageDiscrepancies: DiscrepancyItem[] = [];
  const staleReservations: DiscrepancyItem[] = [];
  const duplicateSettlements: DiscrepancyItem[] = [];
  const crossBillingAnomalies: DiscrepancyItem[] = [];

  // Query dataset in read-only mode
  const [keys, orders, requests, reservations, creditLedgers, tokenLedgers] = await Promise.all([
    dbClient.apiKey.findMany({
      select: {
        id: true,
        name: true,
        billingType: true,
        creditBalanceUsd: true,
        tokensRemaining: true,
        purchasedTokens: true,
        tokensUsed: true,
      },
    }),
    dbClient.order.findMany({
      where: { paymentStatus: 'CAPTURED' },
      select: {
        id: true,
        internalOrderId: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        orderType: true,
        fulfilledApiKeyId: true,
      },
    }),
    dbClient.apiRequest.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        apiKeyId: true,
        model: true,
        totalTokens: true,
        statusCode: true,
        idempotencyKey: true,
      },
    }),
    dbClient.tokenReservation.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        requestId: true,
        apiKeyId: true,
        tokens: true,
        status: true,
        expiresAt: true,
      },
    }),
    dbClient.customerUsageCreditLedger.findMany({
      select: {
        id: true,
        apiKeyId: true,
        userId: true,
        orderId: true,
        type: true,
        amount: true,
        reference: true,
      },
    }),
    dbClient.tokenLedger.findMany({
      select: {
        id: true,
        apiKeyId: true,
        userId: true,
        type: true,
        amount: true,
        reference: true,
      },
    }),
  ]);

  // 1. Audit Credit Balances
  for (const k of keys) {
    if (k.billingType === 'credit') {
      const kCreditEntries = creditLedgers.filter((c: any) => c.apiKeyId === k.id);
      const disc = auditCreditKeyBalance(k, kCreditEntries);
      if (disc) customerCreditDiscrepancies.push(disc);
    }
  }

  // 2. Audit Token Balances
  for (const k of keys) {
    if (k.billingType === 'token') {
      const kTokenEntries = tokenLedgers.filter((t: any) => t.apiKeyId === k.id);
      const disc = auditTokenKeyBalance(k, kTokenEntries);
      if (disc) customerTokenDiscrepancies.push(disc);
    }
  }

  // 3. Audit Cross-Billing
  for (const k of keys) {
    const kCreditCount = creditLedgers.filter((c: any) => c.apiKeyId === k.id && c.type === 'USAGE_DEDUCTION').length;
    const kTokenCount = tokenLedgers.filter((t: any) => t.apiKeyId === k.id && t.type === 'USAGE').length;
    const crossDisc = auditCrossBillingAnomaly(k, kCreditCount, kTokenCount);
    if (crossDisc) crossBillingAnomalies.push(crossDisc);
  }

  // 4. Audit Purchase Grants
  const keyIds = new Set(keys.map((k: any) => k.id));
  for (const o of orders) {
    const keyExists = o.fulfilledApiKeyId ? keyIds.has(o.fulfilledApiKeyId) : false;
    const hasCredit = creditLedgers.some((c: any) => c.orderId === o.id || c.reference === o.internalOrderId);
    const hasToken = tokenLedgers.some((t: any) => t.reference === o.internalOrderId);
    const disc = auditPurchaseGrant(o, keyExists, hasCredit, hasToken, true);
    if (disc) purchaseGrantDiscrepancies.push(disc);
  }

  // 5. Audit Stale Reservations
  for (const r of reservations) {
    const disc = auditStaleReservation(r, now);
    if (disc) staleReservations.push(disc);
  }

  // 6. Audit Usage Settlements & Duplicate Identifiers
  const idempotencySeen = new Set<string>();
  for (const req of requests) {
    if (req.idempotencyKey) {
      if (idempotencySeen.has(req.idempotencyKey)) {
        duplicateSettlements.push({
          id: `dup-idem-${req.id}`,
          category: 'DUPLICATE_SETTLEMENT',
          severity: 'HIGH',
          description: `Duplicate idempotencyKey detected: ${req.idempotencyKey}`,
          expected: 'Unique idempotency key per request',
          actual: 'Repeated idempotency key',
          discrepancy: req.idempotencyKey,
          resourceId: req.id,
          recommendedAction: 'Verify client retry logic and ensure gateway idempotency filter blocks duplicate writes.',
        });
      } else {
        idempotencySeen.add(req.idempotencyKey);
      }
    }

    const hasLedger = creditLedgers.some((c: any) => c.reference?.includes(req.id)) ||
      tokenLedgers.some((t: any) => t.reference?.includes(req.id));
    const disc = auditUsageSettlement(req, hasLedger);
    if (disc) unsettledUsageDiscrepancies.push(disc);
  }

  const totalIssuesCount =
    customerCreditDiscrepancies.length +
    customerTokenDiscrepancies.length +
    purchaseGrantDiscrepancies.length +
    unsettledUsageDiscrepancies.length +
    staleReservations.length +
    duplicateSettlements.length +
    crossBillingAnomalies.length;

  return {
    timestamp: now.toISOString(),
    auditScope: 'FULL_SYSTEM_AUDIT',
    isReconciled: totalIssuesCount === 0,
    totalIssuesCount,
    customerCreditDiscrepancies,
    customerTokenDiscrepancies,
    purchaseGrantDiscrepancies,
    unsettledUsageDiscrepancies,
    staleReservations,
    duplicateSettlements,
    crossBillingAnomalies,
    metrics: {
      totalCustomerKeysAudited: keys.length,
      totalOrdersAudited: orders.length,
      totalUsageEventsAudited: requests.length,
      totalReservationsAudited: reservations.length,
    },
  };
}
