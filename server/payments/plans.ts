import { prisma } from '../db';

export interface ServerPlan {
  id: string;
  slug?: string;
  name: string;
  displayName: string;
  tokenAllowance: bigint;
  tokenDisplay: string;
  windowHours: number;
  validityDays: number;
  rateLimitRpm?: number;
  priceInr: number;
  originalPriceInr?: number;
  annualPriceInr?: number;
  annualOriginalPriceInr?: number;
  annualValidityDays?: number;
  currency: string;
  tagline?: string;
  badge?: string;
  features?: string[];
  featured: boolean;
  enabled: boolean;
  displayOrder: number;
  planType?: 'window' | 'credit' | 'token';
  creditMultiplier?: number;
  creditAmountUsd?: number;
  bonusCreditsUsd?: number;
  bonusTokens?: bigint;
  providerScope?: string;
  allowedModelFamilies?: string[];
}

export interface PlanPricingCalculation {
  priceInr: number;
  amountInr?: number;
  originalPriceInr?: number;
  validityDays: number;
  billingPeriod: 'monthly' | 'yearly';
  monthlyEquivalentPrice: number;
  annualSavings: number;
  annualSavingsInr?: number;
  savingsPercentage: number;
  isAnnualAvailable: boolean;
}

export function calculatePlanPricing(
  plan: ServerPlan,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): PlanPricingCalculation {
  const isAnnual = billingPeriod === 'yearly';
  const monthlyPrice = Number(plan.priceInr || 0);
  const annualPrice = plan.annualPriceInr !== undefined && plan.annualPriceInr !== null
    ? Number(plan.annualPriceInr)
    : undefined;
  const isAnnualAvailable = annualPrice !== undefined && annualPrice > 0;

  if (isAnnual && isAnnualAvailable) {
    const monthlyEquivalent = Math.round((annualPrice! / 12) * 100) / 100;
    const fullYearMonthlySum = monthlyPrice * 12;
    const annualSavings = Math.max(0, fullYearMonthlySum - annualPrice!);
    const savingsPercentage = fullYearMonthlySum > 0 && annualSavings > 0
      ? Math.round((annualSavings / fullYearMonthlySum) * 100)
      : 0;

    return {
      priceInr: annualPrice!,
      amountInr: annualPrice!,
      originalPriceInr: plan.annualOriginalPriceInr || (fullYearMonthlySum > annualPrice! ? fullYearMonthlySum : undefined),
      validityDays: plan.annualValidityDays || 365,
      billingPeriod: 'yearly',
      monthlyEquivalentPrice: monthlyEquivalent,
      annualSavings,
      annualSavingsInr: annualSavings,
      savingsPercentage,
      isAnnualAvailable: true,
    };
  }

  return {
    priceInr: monthlyPrice,
    amountInr: monthlyPrice,
    originalPriceInr: plan.originalPriceInr || undefined,
    validityDays: plan.validityDays || 30,
    billingPeriod: 'monthly',
    monthlyEquivalentPrice: monthlyPrice,
    annualSavings: 0,
    annualSavingsInr: 0,
    savingsPercentage: 0,
    isAnnualAvailable,
  };
}

export const AUTHORITATIVE_PLANS: Record<string, ServerPlan> = {
  pro: {
    id: 'pro',
    slug: 'pro',
    name: 'Max 5x',
    displayName: 'PRO (5M / 5h Window)',
    tokenAllowance: 5000000n,
    tokenDisplay: '5M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 2499,
    originalPriceInr: 3499,
    annualPriceInr: 24990,
    annualOriginalPriceInr: 29988,
    annualValidityDays: 365,
    currency: 'INR',
    tagline: 'High-performance access for active daily coding assistance with Sonnet 5',
    badge: 'STARTER CHOICE',
    features: [
      '5,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'Claude Sonnet 5 & Haiku 4.5 Access',
      'Sub-50ms Gateway Routing',
      'Instant Automated Delivery',
    ],
    featured: false,
    enabled: true,
    displayOrder: 1,
  },
  max: {
    id: 'max',
    slug: 'max',
    name: 'MAX 20X',
    displayName: 'MAX (20M / 5h Window)',
    tokenAllowance: 20000000n,
    tokenDisplay: '20M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 5999,
    originalPriceInr: 22999,
    annualPriceInr: 59990,
    annualOriginalPriceInr: 71988,
    annualValidityDays: 365,
    currency: 'INR',
    tagline: 'Best value for heavy IDE power users & builders with Opus 5 & Fable 5',
    badge: 'MOST POPULAR',
    features: [
      '20,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'Claude Opus 5, Fable 5 & Sonnet 5 Access',
      'Cursor, Windsurf & CLI Ready',
      'Instant Automated Delivery',
    ],
    featured: true,
    enabled: true,
    displayOrder: 2,
  },
  ultra: {
    id: 'ultra',
    slug: 'ultra',
    name: 'MAX 40X',
    displayName: 'ULTRA (40M / 5h Window)',
    tokenAllowance: 40000000n,
    tokenDisplay: '40M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 8999,
    originalPriceInr: 12999,
    annualPriceInr: 89990,
    annualOriginalPriceInr: 107988,
    annualValidityDays: 365,
    currency: 'INR',
    tagline: 'Maximum high-volume capacity for engineering teams with all Claude 5 models',
    badge: 'BEST VALUE',
    features: [
      '40,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'Max Concurrency & Throughput',
      'All Top Claude Opus 5, Fable 5 & Sonnet 5 Models',
      'VIP Priority Support',
    ],
    featured: false,
    enabled: true,
    displayOrder: 3,
  },
  max_100x: {
    id: '36b000a6-69da-4b3d-9574-68f2769a765d',
    slug: 'max_100x',
    name: 'MAX 100x',
    displayName: 'Supreme ( 100m / 5 hours )',
    tokenAllowance: 100000000n,
    tokenDisplay: '100M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 16999,
    originalPriceInr: 69999,
    annualPriceInr: 169990,
    annualOriginalPriceInr: 203988,
    annualValidityDays: 365,
    currency: 'INR',
    tagline: 'Supreme high-volume capacity for engineering teams & autonomous agentic loops',
    badge: 'MAX SCALE',
    features: [
      '100,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'All Top Claude Opus 5.5, Sonnet 5.5 & Haiku Access',
      'VIP Priority Concurrency & Dedicated Gateway Ingress',
      'Instant Automated Delivery',
    ],
    featured: false,
    enabled: true,
    displayOrder: 4,
  },
  credit_starter: {
    id: 'credit_starter',
    slug: 'credit_starter',
    name: 'Credit Starter',
    displayName: 'Credit Starter ($700 Usage Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$700 USAGE CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 100,
    originalPriceInr: 200,
    currency: 'INR',
    tagline: '₹100 = $700 credits (7x value multiplier). Universal access to Claude, OpenAI, and Local models.',
    badge: 'STARTER PACK',
    features: [
      '$700 USD Usage Credit Balance',
      '7x Purchasing Power Multiplier',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Flexible Validity',
      'Atomic Pay-As-You-Go Deductions',
      'Sub-50ms Gateway Routing',
    ],
    featured: false,
    enabled: true,
    displayOrder: 5,
    planType: 'credit',
    creditMultiplier: 7.0,
    creditAmountUsd: 700.0,
    bonusCreditsUsd: 0,
    providerScope: 'both',
  },
  credit_growth: {
    id: 'credit_growth',
    slug: 'credit_growth',
    name: 'Credit Growth',
    displayName: 'Credit Growth ($3,850 Usage Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$3,850 USAGE CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 150,
    priceInr: 499,
    originalPriceInr: 999,
    currency: 'INR',
    tagline: '₹499 = $3,850 credits (7.7x multiplier). Extra headroom for active developers and multi-agent workflows.',
    badge: 'GROWTH PACK',
    features: [
      '$3,850 USD Usage Credit Balance',
      '7.7x Value Multiplier Included',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Extended Validity',
      'Atomic Pay-As-You-Go Deductions',
      'Priority Gateway Ingress',
    ],
    featured: true,
    enabled: true,
    displayOrder: 6,
    planType: 'credit',
    creditMultiplier: 7.7,
    creditAmountUsd: 3850.0,
    bonusCreditsUsd: 350.0,
    providerScope: 'both',
  },
  credit_pro: {
    id: 'credit_pro',
    slug: 'credit_pro',
    name: 'Credit Pro',
    displayName: 'Credit Pro ($16,000 Usage Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$16,000 USAGE CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 1999,
    originalPriceInr: 3999,
    currency: 'INR',
    tagline: '₹1,999 = $16,000 credits (8x multiplier). High-volume inference for engineering power users.',
    badge: 'POWER USERS',
    features: [
      '$16,000 USD Usage Credit Balance',
      '8x Highest Value Multiplier',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Extended Validity',
      'Atomic Pay-As-You-Go Deductions',
      'VIP Priority Gateway Ingress',
    ],
    featured: false,
    enabled: true,
    displayOrder: 7,
    planType: 'credit',
    creditMultiplier: 8.0,
    creditAmountUsd: 16000.0,
    bonusCreditsUsd: 2000.0,
    providerScope: 'both',
  },
  credit_scale: {
    id: 'credit_scale',
    slug: 'credit_scale',
    name: 'Credit Scale',
    displayName: 'Credit Scale ($35,000 Usage Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$35,000 USAGE CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 300,
    priceInr: 3999,
    originalPriceInr: 7999,
    currency: 'INR',
    tagline: '₹3,999 = $35,000 credits (8.75x multiplier). Maximum capacity for teams and production workloads.',
    badge: 'MAX SCALE',
    features: [
      '$35,000 USD Usage Credit Balance',
      '8.75x Maximum Scale Multiplier',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Extended Validity',
      'Atomic Pay-As-You-Go Deductions',
      'Dedicated High-Concurrency Quota',
    ],
    featured: false,
    enabled: true,
    displayOrder: 8,
    planType: 'credit',
    creditMultiplier: 8.75,
    creditAmountUsd: 35000.0,
    bonusCreditsUsd: 5000.0,
    providerScope: 'both',
  },
  token_pack_5m: {
    id: 'token_pack_5m',
    slug: 'token_pack_5m',
    name: 'Token Pack 5M',
    displayName: 'Token Pack 5M (Consumable Tokens)',
    tokenAllowance: 5000000n,
    tokenDisplay: '5M CONSUMABLE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 1499,
    originalPriceInr: 2499,
    currency: 'INR',
    tagline: '5 Million prepaid consumable tokens without 5-hour window resets. Spend at your own pace.',
    badge: 'STARTER TOKEN PACK',
    features: [
      '5,000,000 Consumable Tokens',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Spend at Your Own Velocity',
      'OpenAI & Claude Compatible',
      'Instant Key Delivery',
    ],
    featured: false,
    enabled: true,
    displayOrder: 9,
    planType: 'token',
    providerScope: 'both',
  },
  token_pack_20m: {
    id: 'token_pack_20m',
    slug: 'token_pack_20m',
    name: 'Token Pack 20M',
    displayName: 'Token Pack 20M (Consumable Tokens)',
    tokenAllowance: 20000000n,
    tokenDisplay: '20M CONSUMABLE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 150,
    priceInr: 2999,
    originalPriceInr: 4999,
    currency: 'INR',
    tagline: '20 Million prepaid consumable tokens for heavy bursts, scripts, and agent pipelines.',
    badge: 'PRO TOKEN PACK',
    features: [
      '20,000,000 Consumable Tokens',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Spend at Your Own Velocity',
      'Universal Model Access',
      'Instant Key Delivery',
    ],
    featured: true,
    enabled: true,
    displayOrder: 10,
    planType: 'token',
    providerScope: 'both',
  },
  token_pack_50m: {
    id: 'token_pack_50m',
    slug: 'token_pack_50m',
    name: 'Token Pack 50M',
    displayName: 'Token Pack 50M (Consumable Tokens)',
    tokenAllowance: 50000000n,
    tokenDisplay: '50M CONSUMABLE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 4999,
    originalPriceInr: 7999,
    currency: 'INR',
    tagline: '50 Million prepaid consumable tokens for teams & long-running autonomous workflows.',
    badge: 'MEGA TOKEN PACK',
    features: [
      '50,000,000 Consumable Tokens',
      '365-Day Full Validity (No 5-Hour Reset)',
      'High-Concurrency Ingress',
      'Universal Model Access',
      'Instant Key Delivery',
    ],
    featured: false,
    enabled: true,
    displayOrder: 11,
    planType: 'token',
    providerScope: 'both',
  },
};

export const FREE_TRIAL_PLAN: ServerPlan = {
  id: 'free_trial',
  slug: 'trial',
  name: 'Free Trial',
  displayName: '200K Free Trial Key',
  tokenAllowance: 200000n,
  tokenDisplay: '200K TOKENS',
  windowHours: 24,
  validityDays: 1,
  rateLimitRpm: 30,
  priceInr: 0,
  currency: 'INR',
  tagline: 'Instant free trial key for evaluation',
  badge: 'FREE TRIAL',
  features: ['200,000 Tokens / 24h', '24h Validity', 'Claude Sonnet 5.5 & Haiku 5.5 Access'],
  featured: false,
  enabled: true,
  displayOrder: 0,
};

export const TRIAL_PLAN: ServerPlan = FREE_TRIAL_PLAN;

/**
 * Fetch all active plans from PostgreSQL database with fallback to default plans
 */
export async function getAllActivePlansAsync(): Promise<ServerPlan[]> {
  try {
    const dbPlans = await prisma.plan.findMany({
      where: {
        status: 'active',
        enabled: true,
        priceInr: { gte: 50 },
        NOT: {
          OR: [
            { id: { in: ['free_trial', 'trial'] } },
            { slug: { in: ['free_trial', 'trial', 'test_plan'] } },
            { name: { contains: 'trial', mode: 'insensitive' } },
          ],
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (dbPlans && dbPlans.length > 0) {
      const mapped: any[] = dbPlans.map((p) => {
        let features: string[] = [];
        if (p.featuresJson) {
          try {
            features = JSON.parse(p.featuresJson);
          } catch (e) {}
        }
        return {
          id: p.id,
          slug: p.slug || p.id,
          name: p.name,
          displayName: p.displayName || p.name,
          tokenAllowance: p.tokenAllowance,
          tokenDisplay: p.tokenDisplay || `${Number(p.tokenAllowance) / 1000000}M TOKENS / ${p.windowHours} HOURS`,
          windowHours: p.windowHours,
          validityDays: p.validityDays,
          rateLimitRpm: p.rateLimitRpm || 100,
          priceInr: p.priceInr,
          originalPriceInr: p.originalPriceInr || undefined,
          annualPriceInr: p.annualPriceInr ? Number(p.annualPriceInr) : undefined,
          annualOriginalPriceInr: p.annualOriginalPriceInr ? Number(p.annualOriginalPriceInr) : undefined,
          annualValidityDays: p.annualValidityDays || 365,
          currency: p.currency || 'INR',
          tagline: p.tagline || undefined,
          badge: p.badge || undefined,
          features: features.length > 0 ? features : undefined,
          featured: p.featured,
          enabled: p.enabled,
          displayOrder: p.sortOrder,
          planType: (p.planType as any) || 'window',
          creditMultiplier: p.creditMultiplier !== null && p.creditMultiplier !== undefined ? Number(p.creditMultiplier) : (p.planType === 'credit' ? 7.0 : undefined),
          creditAmountUsd: p.creditAmountUsd !== null && p.creditAmountUsd !== undefined ? Number(p.creditAmountUsd) : undefined,
          bonusCreditsUsd: p.bonusCreditsUsd !== null && p.bonusCreditsUsd !== undefined ? Number(p.bonusCreditsUsd) : undefined,
          bonusTokens: p.bonusTokens !== null && p.bonusTokens !== undefined ? BigInt(p.bonusTokens) : undefined,
          providerScope: p.providerScope || 'all',
        };
      });
      const hasCredit = mapped.some((p: any) => p.planType === 'credit');
      const hasToken = mapped.some((p: any) => p.planType === 'token');
      if (!hasCredit || !hasToken) {
        const memPlans = getAllActivePlans();
        for (const mp of memPlans) {
          if (!mapped.some((p: any) => p.id === mp.id || p.slug === mp.slug)) {
            mapped.push(mp);
          }
        }
      }
      return mapped;
    }
  } catch (err) {
    console.warn('Error querying DB plans, using memory fallback:', err);
  }

  return getAllActivePlans();
}

/**
 * Find plan by ID, slug, or name from PostgreSQL with memory fallback
 */
export async function getPlanByIdAsync(planId: string): Promise<ServerPlan | null> {
  if (!planId || typeof planId !== 'string') return null;
  const cleanId = planId.trim().toLowerCase();

  if (cleanId === 'free_trial' || cleanId === 'trial') return FREE_TRIAL_PLAN;

  try {
    const dbPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { id: planId },
          { slug: cleanId },
          { name: { equals: planId, mode: 'insensitive' } },
        ],
        status: 'active',
        enabled: true,
      },
    });

    if (dbPlan) {
      let features: string[] = [];
      if (dbPlan.featuresJson) {
        try {
          features = JSON.parse(dbPlan.featuresJson);
        } catch (e) {}
      }
      return {
        id: dbPlan.id,
        slug: dbPlan.slug || dbPlan.id,
        name: dbPlan.name,
        displayName: dbPlan.displayName || dbPlan.name,
        tokenAllowance: dbPlan.tokenAllowance,
        tokenDisplay: dbPlan.tokenDisplay || `${Number(dbPlan.tokenAllowance) / 1000000}M TOKENS / ${dbPlan.windowHours} HOURS`,
        windowHours: dbPlan.windowHours,
        validityDays: dbPlan.validityDays,
        rateLimitRpm: dbPlan.rateLimitRpm || 100,
        priceInr: dbPlan.priceInr,
        originalPriceInr: dbPlan.originalPriceInr || undefined,
        annualPriceInr: dbPlan.annualPriceInr ? Number(dbPlan.annualPriceInr) : undefined,
        annualOriginalPriceInr: dbPlan.annualOriginalPriceInr ? Number(dbPlan.annualOriginalPriceInr) : undefined,
        annualValidityDays: dbPlan.annualValidityDays || 365,
        currency: dbPlan.currency || 'INR',
        tagline: dbPlan.tagline || undefined,
        badge: dbPlan.badge || undefined,
        features: features.length > 0 ? features : undefined,
        featured: dbPlan.featured,
        enabled: dbPlan.enabled,
        displayOrder: dbPlan.sortOrder,
        planType: (dbPlan.planType as any) || 'window',
        creditMultiplier: dbPlan.creditMultiplier !== null && dbPlan.creditMultiplier !== undefined ? Number(dbPlan.creditMultiplier) : (dbPlan.planType === 'credit' ? 7.0 : undefined),
        creditAmountUsd: dbPlan.creditAmountUsd !== null && dbPlan.creditAmountUsd !== undefined ? Number(dbPlan.creditAmountUsd) : undefined,
        bonusCreditsUsd: dbPlan.bonusCreditsUsd !== null && dbPlan.bonusCreditsUsd !== undefined ? Number(dbPlan.bonusCreditsUsd) : undefined,
        bonusTokens: dbPlan.bonusTokens !== null && dbPlan.bonusTokens !== undefined ? BigInt(dbPlan.bonusTokens) : undefined,
        providerScope: dbPlan.providerScope || 'all',
      };
    }
  } catch (err) {
    console.warn('Error querying DB plan by id, using memory fallback:', err);
  }

  return getPlanById(planId);
}

export function getPlanById(planId: string): ServerPlan | null {
  if (!planId || typeof planId !== 'string') return null;
  const cleanId = planId.trim().toLowerCase();

  if (cleanId === 'free_trial' || cleanId === 'trial') return FREE_TRIAL_PLAN;

  // Backward compatibility alias lookups
  if (cleanId === 'plan_5m_5h') return AUTHORITATIVE_PLANS['pro'];
  if (cleanId === 'plan_20m_5h') return AUTHORITATIVE_PLANS['max'];
  if (cleanId === 'plan_40m_5h') return AUTHORITATIVE_PLANS['ultra'];
  if (
    cleanId === 'plan_100m_5h' ||
    cleanId === 'max_100x' ||
    cleanId === 'max 100x' ||
    cleanId === '36b000a6-69da-4b3d-9574-68f2769a765d'
  ) {
    return AUTHORITATIVE_PLANS['max_100x'];
  }
  if (cleanId === 'credit_starter' || cleanId === 'credit_pack' || cleanId === 'credit_50') {
    return AUTHORITATIVE_PLANS['credit_starter'];
  }
  if (cleanId === 'token_pack_50m' || cleanId === 'token_pack' || cleanId === 'tokens_50m') {
    return AUTHORITATIVE_PLANS['token_pack_50m'];
  }

  const plan = AUTHORITATIVE_PLANS[cleanId];
  if (!plan || !plan.enabled) return null;
  return plan;
}

export function getAllActivePlans(): ServerPlan[] {
  return Object.values(AUTHORITATIVE_PLANS)
    .filter((p) => p.enabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
