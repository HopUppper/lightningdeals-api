import { prisma } from '../db';
import { getUpstreamMasterAccounting, UpstreamMasterMetrics } from './upstreamAccounting';

export interface AggregateAccountingMetrics {
  upstream: UpstreamMasterMetrics;
  
  // Aggregate Customer Entitlements
  activeCustomerCount: number;
  totalCustomerCount: number;
  activeCustomer5hAllowanceExposure: number; // Sum of active customer 5h allowances (e.g. 15,000,000)
  
  // Actual Consumption
  aggregateWindowTokensConsumed: number;     // Tokens consumed across all customers in 5h window (e.g. 3,000,000)
  aggregateLifetimeTokensConsumed: number;   // Lifetime customer tokens consumed
  
  // Headroom & Remaining
  upstreamRemainingMasterCapacity: number;   // e.g. 20M limit - 3M consumed = 17M remaining (NOT 20M - 15M!)
  exposureHeadroomTokens: number;            // Upstream limit - Active Exposure (e.g. 20M - 15M = 5M)
  exposureRatioPercent: number;              // (Exposure / Upstream Limit) * 100 (e.g. 15M / 20M = 75%)
  utilizationRatioPercent: number;           // (Consumed in Window / Upstream Limit) * 100 (e.g. 3M / 20M = 15%)
  
  // Unreconciled / Discrepancy Tracking
  unreconciledOrUnknownTokens: number;
  isOversubscribed: boolean;
  theoretical30DayExposure: number;
}

/**
 * Layer C: Aggregate Capacity vs. Customer Allowance Exposure.
 * Strictly separates Customer Allowance Exposure from Upstream Consumption.
 *
 * Example (The 20M / 15M Scenario):
 * - Upstream Limit: 20,000,000 tokens
 * - Active Customer 5h Allowance Exposure: 15,000,000 tokens
 * - Consumed in current 5h window: 3,000,000 tokens
 * -> Remaining Upstream Master Capacity: 20M - 3M = 17,000,000 tokens (Remaining upstream tokens)
 * -> Active Exposure: 15,000,000 tokens (Maximum potential concurrent demand)
 * -> Exposure Headroom: 20M - 15M = 5,000,000 tokens
 */
export async function calculateAggregateAccounting(
  providerId?: string
): Promise<AggregateAccountingMetrics> {
  const upstream = await getUpstreamMasterAccounting(providerId);
  const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000);

  // 1. Query Active Customer API Keys and Exposure
  const [activeKeysAgg, totalKeysCount, windowRequestsAgg, lifetimeRequestsAgg] = await Promise.all([
    prisma.apiKey.aggregate({
      _sum: { purchasedTokens: true },
      _count: { id: true },
      where: { status: 'active' },
    }),
    prisma.apiKey.count(),
    prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        createdAt: { gte: fiveHoursAgo },
        ...(upstream.providerId !== 'none' && { providerId: upstream.providerId }),
      },
    }),
    prisma.apiRequest.aggregate({
      _sum: { totalTokens: true },
      where: {
        ...(upstream.providerId !== 'none' && { providerId: upstream.providerId }),
      },
    }),
  ]);

  const activeCustomerCount = activeKeysAgg._count.id || 0;
  const activeCustomer5hAllowanceExposure = Number(activeKeysAgg._sum.purchasedTokens || 0);

  const aggregateWindowTokensConsumed = windowRequestsAgg._sum.totalTokens || 0;
  const aggregateLifetimeTokensConsumed = lifetimeRequestsAgg._sum.totalTokens || 0;

  // 2. Upstream remaining calculation
  // Master remaining is: Master Limit - Master Window Consumption (NOT Master Limit - Exposure!)
  let upstreamRemainingMasterCapacity = upstream.upstreamRemainingTokens;
  if (upstream.upstreamLimit !== null && upstream.upstreamLimit > 0) {
    upstreamRemainingMasterCapacity = Math.max(0, upstream.upstreamLimit - aggregateWindowTokensConsumed);
  }

  // 3. Exposure headroom and ratios
  const upstreamLimit = upstream.upstreamLimit || (upstream.upstreamRemainingTokens + aggregateWindowTokensConsumed);
  const exposureHeadroomTokens = upstreamLimit > 0
    ? upstreamLimit - activeCustomer5hAllowanceExposure
    : 0;

  const exposureRatioPercent = upstreamLimit > 0
    ? Math.round((activeCustomer5hAllowanceExposure / upstreamLimit) * 1000) / 10
    : 0;

  const utilizationRatioPercent = upstreamLimit > 0
    ? Math.round((aggregateWindowTokensConsumed / upstreamLimit) * 1000) / 10
    : 0;

  const isOversubscribed = activeCustomer5hAllowanceExposure > upstreamLimit && upstreamLimit > 0;

  // Unreconciled usage: discrepancy between provider's recorded consumedTokens and sum of ApiRequests
  const unreconciledOrUnknownTokens = Math.max(
    0,
    upstream.upstreamConsumedLifetime - aggregateLifetimeTokensConsumed
  );

  // Theoretical 30-day exposure: (Exposure * 144 periods)
  const theoretical30DayExposure = activeCustomer5hAllowanceExposure * 144;

  return {
    upstream,
    activeCustomerCount,
    totalCustomerCount: totalKeysCount,
    activeCustomer5hAllowanceExposure,
    aggregateWindowTokensConsumed,
    aggregateLifetimeTokensConsumed,
    upstreamRemainingMasterCapacity,
    exposureHeadroomTokens,
    exposureRatioPercent,
    utilizationRatioPercent,
    unreconciledOrUnknownTokens,
    isOversubscribed,
    theoretical30DayExposure,
  };
}
