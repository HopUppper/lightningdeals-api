import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type PlanCategory =
  | 'claude_max_rolling'
  | 'claude_openai_credits'
  | 'openai_tokens'
  | 'claude_tokens'
  | 'local_models_tokens';

export interface PlanItem {
  id: string;
  slug?: string;
  name: string;
  displayName?: string;
  tokenAllowance: string;
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
  tagline: string;
  badge?: string;
  features?: string[];
  featured?: boolean;
  enabled?: boolean;
  sortOrder?: number;
  planType?: 'window' | 'credit' | 'token';
  planCategory?: PlanCategory;
  creditMultiplier?: number;
  creditAmountInr?: number;
  creditBalanceDenomination?: string;
  supplierCostInr?: number;
  supplierAllocation?: string;
  creditAmountUsd?: number;
  bonusCreditsUsd?: number;
  bonusTokens?: string;
  providerScope?: string;
  allowedModelFamilies?: string[];
}

export interface PlansContextType {
  plans: PlanItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  starterPlan?: PlanItem;
  featuredPlan?: PlanItem;
  getPlanById: (id: string) => PlanItem | undefined;
}

export const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'pro',
    slug: 'pro',
    name: 'Max 5x',
    displayName: 'PRO (5M / 5h Window)',
    tokenAllowance: '5000000',
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
    featured: false,
    features: [
      '5,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'Claude Sonnet 5 & Haiku 4.5 Access',
      'Sub-50ms Gateway Routing',
      'Instant Automated Delivery',
    ],
    sortOrder: 1,
  },
  {
    id: 'max',
    slug: 'max',
    name: 'MAX 20X',
    displayName: 'MAX (20M / 5h Window)',
    tokenAllowance: '20000000',
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
    featured: true,
    features: [
      '20,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'Claude Opus 5, Fable 5 & Sonnet 5 Access',
      'Cursor, Windsurf & CLI Ready',
      'Instant Automated Delivery',
    ],
    sortOrder: 2,
  },
  {
    id: 'ultra',
    slug: 'ultra',
    name: 'MAX 40X',
    displayName: 'ULTRA (40M / 5h Window)',
    tokenAllowance: '40000000',
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
    featured: false,
    features: [
      '40,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'Max Concurrency & Throughput',
      'All Top Claude Opus 5, Fable 5 & Sonnet 5 Models',
      'VIP Priority Support',
    ],
    sortOrder: 3,
  },
  {
    id: '36b000a6-69da-4b3d-9574-68f2769a765d',
    slug: 'max_100x',
    name: 'MAX 100x',
    displayName: 'Supreme ( 100m / 5 hours )',
    tokenAllowance: '100000000',
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
    featured: false,
    features: [
      '100,000,000 Tokens / 5h Window',
      '30-Day / 365-Day Validity',
      'All Top Claude Opus 5.5, Sonnet 5.5 & Haiku Access',
      'VIP Priority Concurrency & Dedicated Gateway Ingress',
      'Instant Automated Delivery',
    ],
    sortOrder: 4,
    planType: 'window',
  },
  {
    id: 'credit_starter',
    slug: 'credit_starter',
    name: 'Credit Starter',
    displayName: 'API Credits Starter (₹700 Credits)',
    planCategory: 'claude_openai_credits',
    tokenAllowance: '0',
    tokenDisplay: '₹700 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 100,
    originalPriceInr: 200,
    currency: 'INR',
    creditAmountInr: 700,
    creditBalanceDenomination: 'INR',
    tagline: 'Pay ₹100 → Receive ₹700 API Credits (7x multiplier). Universal access to Claude, OpenAI, and Local models.',
    badge: 'STARTER PACK',
    featured: false,
    features: [
      '₹700 API Credits Balance (INR)',
      '7x Purchasing Power Multiplier',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Flexible Validity',
      'Atomic Pay-As-You-Go Deductions',
      'Sub-50ms Gateway Routing',
    ],
    sortOrder: 5,
    planType: 'credit',
    creditMultiplier: 7.0,
    supplierCostInr: 250,
    providerScope: 'all',
  },
  {
    id: 'credit_growth',
    slug: 'credit_growth',
    name: 'Credit Growth',
    displayName: 'API Credits Growth (₹3,850 Credits)',
    planCategory: 'claude_openai_credits',
    tokenAllowance: '0',
    tokenDisplay: '₹3,850 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 150,
    priceInr: 499,
    originalPriceInr: 999,
    currency: 'INR',
    creditAmountInr: 3850,
    creditBalanceDenomination: 'INR',
    tagline: 'Pay ₹499 → Receive ₹3,850 API Credits (7.7x multiplier). Extra headroom for active developers.',
    badge: 'GROWTH PACK',
    featured: true,
    features: [
      '₹3,850 API Credits Balance (INR)',
      '7.7x Value Multiplier Included',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Extended Validity',
      'Atomic Pay-As-You-Go Deductions',
      'Priority Gateway Ingress',
    ],
    sortOrder: 6,
    planType: 'credit',
    creditMultiplier: 7.7,
    supplierCostInr: 1000,
    providerScope: 'all',
  },
  {
    id: 'credit_pro',
    slug: 'credit_pro',
    name: 'Credit Pro',
    displayName: 'API Credits Pro (₹16,000 Credits)',
    planCategory: 'claude_openai_credits',
    tokenAllowance: '0',
    tokenDisplay: '₹16,000 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 1999,
    originalPriceInr: 3999,
    currency: 'INR',
    creditAmountInr: 16000,
    creditBalanceDenomination: 'INR',
    tagline: 'Pay ₹1,999 → Receive ₹16,000 API Credits (8x multiplier). High-volume inference for engineering power users.',
    badge: 'POWER USERS',
    featured: false,
    features: [
      '₹16,000 API Credits Balance (INR)',
      '8x Highest Value Multiplier',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Extended Validity',
      'Atomic Pay-As-You-Go Deductions',
      'VIP Priority Gateway Ingress',
    ],
    sortOrder: 7,
    planType: 'credit',
    creditMultiplier: 8.0,
    supplierCostInr: 5000,
    providerScope: 'all',
  },
  {
    id: 'credit_scale',
    slug: 'credit_scale',
    name: 'Credit Scale',
    displayName: 'API Credits Scale (₹35,000 Credits)',
    planCategory: 'claude_openai_credits',
    tokenAllowance: '0',
    tokenDisplay: '₹35,000 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 300,
    priceInr: 3999,
    originalPriceInr: 7999,
    currency: 'INR',
    creditAmountInr: 35000,
    creditBalanceDenomination: 'INR',
    tagline: 'Pay ₹3,999 → Receive ₹35,000 API Credits (8.75x multiplier). Maximum capacity for teams and production workloads.',
    badge: 'MAX SCALE',
    features: [
      '₹35,000 API Credits Balance (INR)',
      '8.75x Maximum Scale Multiplier',
      'Universal Access (Claude, OpenAI, Local)',
      '365-Day Extended Validity',
      'Atomic Pay-As-You-Go Deductions',
      'Dedicated High-Concurrency Quota',
    ],
    sortOrder: 8,
    planType: 'credit',
    creditMultiplier: 8.75,
    supplierCostInr: 10000,
    providerScope: 'all',
  },
  {
    id: 'openai_token_10m',
    slug: 'openai_token_10m',
    name: 'OpenAI 10M Token Pack',
    displayName: 'OpenAI 10M Token Pack',
    planCategory: 'openai_tokens',
    tokenAllowance: '10000000',
    tokenDisplay: '10M OPENAI TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 999,
    originalPriceInr: 1499,
    currency: 'INR',
    tagline: '10 Million consumable tokens for OpenAI o1, o3-mini, and GPT-4o.',
    badge: 'OPENAI PACK',
    features: [
      '10,000,000 Consumable Tokens',
      'OpenAI Model Family Access',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Drop-in OpenAI API Endpoint',
      'Instant Key Delivery',
    ],
    sortOrder: 9,
    planType: 'token',
    supplierCostInr: 230,
    providerScope: 'scalemax',
  },
  {
    id: 'openai_token_50m',
    slug: 'openai_token_50m',
    name: 'OpenAI 50M Token Pack',
    displayName: 'OpenAI 50M Token Pack',
    planCategory: 'openai_tokens',
    tokenAllowance: '50000000',
    tokenDisplay: '50M OPENAI TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 180,
    priceInr: 3499,
    originalPriceInr: 4999,
    currency: 'INR',
    tagline: '50 Million consumable tokens for high-volume OpenAI inference and reasoning.',
    badge: 'PRO OPENAI PACK',
    featured: true,
    features: [
      '50,000,000 Consumable Tokens',
      'OpenAI Model Family Access',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Sub-50ms Latency Routing',
      'Instant Key Delivery',
    ],
    sortOrder: 10,
    planType: 'token',
    supplierCostInr: 1050,
    providerScope: 'scalemax',
  },
  {
    id: 'openai_token_100m',
    slug: 'openai_token_100m',
    name: 'OpenAI 100M Token Pack',
    displayName: 'OpenAI 100M Token Pack',
    planCategory: 'openai_tokens',
    tokenAllowance: '100000000',
    tokenDisplay: '100M OPENAI TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 250,
    priceInr: 5999,
    originalPriceInr: 8999,
    currency: 'INR',
    tagline: '100 Million consumable tokens for enterprise OpenAI workflows.',
    badge: 'SCALE OPENAI PACK',
    features: [
      '100,000,000 Consumable Tokens',
      'OpenAI Model Family Access',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Dedicated Gateway Concurrency',
      'Instant Key Delivery',
    ],
    sortOrder: 11,
    planType: 'token',
    supplierCostInr: 2100,
    providerScope: 'scalemax',
  },
  {
    id: 'claude_token_10m',
    slug: 'claude_token_10m',
    name: 'Claude 10M Token Pack',
    displayName: 'Claude 10M Token Pack',
    planCategory: 'claude_tokens',
    tokenAllowance: '10000000',
    tokenDisplay: '10M CLAUDE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 1199,
    originalPriceInr: 1799,
    currency: 'INR',
    tagline: '10 Million consumable tokens for Claude Sonnet 4.6 & Opus models without 5-hour resets.',
    badge: 'CLAUDE PACK',
    features: [
      '10,000,000 Consumable Tokens',
      'Claude Sonnet & Opus Models',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Native Anthropic API Protocol',
      'Instant Key Delivery',
    ],
    sortOrder: 12,
    planType: 'token',
    supplierCostInr: 250,
    providerScope: 'scalemax',
  },
  {
    id: 'claude_token_50m',
    slug: 'claude_token_50m',
    name: 'Claude 50M Token Pack',
    displayName: 'Claude 50M Token Pack',
    planCategory: 'claude_tokens',
    tokenAllowance: '50000000',
    tokenDisplay: '50M CLAUDE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 180,
    priceInr: 3999,
    originalPriceInr: 5999,
    currency: 'INR',
    tagline: '50 Million consumable tokens for demanding Claude engineering projects.',
    badge: 'PRO CLAUDE PACK',
    featured: true,
    features: [
      '50,000,000 Consumable Tokens',
      'Claude Sonnet & Opus Models',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Cursor & Claude Code CLI Ready',
      'Instant Key Delivery',
    ],
    sortOrder: 13,
    planType: 'token',
    supplierCostInr: 1150,
    providerScope: 'scalemax',
  },
  {
    id: 'claude_token_100m',
    slug: 'claude_token_100m',
    name: 'Claude 100M Token Pack',
    displayName: 'Claude 100M Token Pack',
    planCategory: 'claude_tokens',
    tokenAllowance: '100000000',
    tokenDisplay: '100M CLAUDE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 250,
    priceInr: 6999,
    originalPriceInr: 9999,
    currency: 'INR',
    tagline: '100 Million consumable tokens for large-scale Claude pipelines.',
    badge: 'SCALE CLAUDE PACK',
    features: [
      '100,000,000 Consumable Tokens',
      'Claude Sonnet & Opus Models',
      '365-Day Full Validity (No 5-Hour Reset)',
      'VIP Priority Gateway Ingress',
      'Instant Key Delivery',
    ],
    sortOrder: 14,
    planType: 'token',
    supplierCostInr: 2300,
    providerScope: 'scalemax',
  },
  {
    id: 'local_token_10m',
    slug: 'local_token_10m',
    name: 'Local Models 10M Token Pack',
    displayName: 'Local Models 10M Token Pack',
    planCategory: 'local_models_tokens',
    tokenAllowance: '10000000',
    tokenDisplay: '10M LOCAL TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 799,
    originalPriceInr: 1199,
    currency: 'INR',
    tagline: '10 Million consumable tokens for DeepSeek, Gemini, Grok, Qwen, GLM, and MiniMax.',
    badge: 'LOCAL PACK',
    features: [
      '10,000,000 Consumable Tokens',
      'DeepSeek v3.2, Grok, Qwen 2.5, GLM-4',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Dedicated Wholesale Local Credential',
      'Instant Key Delivery',
    ],
    sortOrder: 15,
    planType: 'token',
    supplierCostInr: 220,
    providerScope: 'scalemax',
  },
  {
    id: 'local_token_100m',
    slug: 'local_token_100m',
    name: 'Local Models 100M Token Pack',
    displayName: 'Local Models 100M Token Pack',
    planCategory: 'local_models_tokens',
    tokenAllowance: '100000000',
    tokenDisplay: '100M LOCAL TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 3499,
    originalPriceInr: 4999,
    currency: 'INR',
    tagline: '100 Million consumable tokens for high-throughput batch and open-weight models.',
    badge: 'PRO LOCAL PACK',
    featured: true,
    features: [
      '100,000,000 Consumable Tokens',
      'DeepSeek v3.2, Grok, Qwen 2.5, GLM-4',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Ultra-Low Cost Inference Pool',
      'Instant Key Delivery',
    ],
    sortOrder: 16,
    planType: 'token',
    supplierCostInr: 1300,
    providerScope: 'scalemax',
  },
  {
    id: 'local_token_500m',
    slug: 'local_token_500m',
    name: 'Local Models 500M Token Pack',
    displayName: 'Local Models 500M Token Pack',
    planCategory: 'local_models_tokens',
    tokenAllowance: '500000000',
    tokenDisplay: '500M LOCAL TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 300,
    priceInr: 14999,
    originalPriceInr: 19999,
    currency: 'INR',
    tagline: '500 Million consumable tokens for massive open-weight data generation.',
    badge: 'ENTERPRISE LOCAL',
    features: [
      '500,000,000 Consumable Tokens',
      'DeepSeek v3.2, Grok, Qwen 2.5, GLM-4',
      '365-Day Full Validity (No 5-Hour Reset)',
      'Dedicated High-Concurrency Quota',
      'Instant Key Delivery',
    ],
    sortOrder: 17,
    planType: 'token',
    supplierCostInr: 5800,
    providerScope: 'scalemax',
  },
];

const PlansContext = createContext<PlansContextType>({
  plans: DEFAULT_PLANS,
  loading: false,
  error: null,
  refetch: async () => {},
  starterPlan: DEFAULT_PLANS[0],
  featuredPlan: DEFAULT_PLANS[1],
  getPlanById: () => undefined,
});

export const PlansProvider: React.FC<{
  children: React.ReactNode;
  initialPlans?: PlanItem[];
}> = ({ children, initialPlans }) => {
  // Check SSR/SSG pre-injected plans on window.__INITIAL_PLANS__
  const getInitial = (): PlanItem[] => {
    if (initialPlans && initialPlans.length > 0) return initialPlans;
    if (
      typeof window !== 'undefined' &&
      Array.isArray((window as any).__INITIAL_PLANS__) &&
      (window as any).__INITIAL_PLANS__.length > 0
    ) {
      return (window as any).__INITIAL_PLANS__;
    }
    return DEFAULT_PLANS;
  };

  const [plans, setPlans] = useState<PlanItem[]>(getInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/plans?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: PlanItem[] = data.map((p: any) => ({
          id: p.id,
          slug: p.slug || p.id,
          name: p.name,
          displayName: p.displayName || p.name,
          tokenAllowance: String(p.tokenAllowance || 5000000),
          tokenDisplay:
            p.tokenDisplay ||
            `${(Number(p.tokenAllowance || 5000000) / 1000000).toFixed(0)}M Tokens / ${p.windowHours || 5}h`,
          windowHours: Number(p.windowHours) || 5,
          validityDays: Number(p.validityDays) || 30,
          rateLimitRpm: Number(p.rateLimitRpm) || 100,
          priceInr: Number(p.priceInr) || 0,
          originalPriceInr: p.originalPriceInr ? Number(p.originalPriceInr) : undefined,
          annualPriceInr: p.annualPriceInr ? Number(p.annualPriceInr) : undefined,
          annualOriginalPriceInr: p.annualOriginalPriceInr ? Number(p.annualOriginalPriceInr) : undefined,
          annualValidityDays: p.annualValidityDays ? Number(p.annualValidityDays) : 365,
          currency: p.currency || 'INR',
          tagline: p.tagline || 'Prepaid token capacity with 5-hour rolling renewal',
          badge: p.badge || undefined,
          features:
            Array.isArray(p.features) && p.features.length > 0
              ? p.features
              : [
                  `${(Number(p.tokenAllowance || 5000000) / 1000000).toFixed(0)}M Tokens / 5h Window`,
                  '30-Day Fixed Active Validity',
                  'Claude Models Access',
                  'Sub-35ms Gateway Ingress',
                  'Instant Key Delivery via Dashboard',
                ],
          featured: Boolean(p.featured),
          sortOrder: p.sortOrder !== undefined ? Number(p.sortOrder) : 0,
          planType: p.planType || 'window',
          creditMultiplier: p.creditMultiplier ? Number(p.creditMultiplier) : 7.0,
          creditAmountUsd: p.creditAmountUsd ? Number(p.creditAmountUsd) : undefined,
          bonusCreditsUsd: p.bonusCreditsUsd ? Number(p.bonusCreditsUsd) : undefined,
          bonusTokens: p.bonusTokens || undefined,
          providerScope: p.providerScope || 'all',
        }));
        setPlans(mapped);
        setError(null);
      }
    } catch (err: any) {
      console.warn('Plans fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();

    // Listen to plan update events (e.g. emitted from AdminPlans save/toggle/delete)
    const handlePlansUpdated = () => {
      fetchPlans();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lightning_plans_updated', handlePlansUpdated);
      window.addEventListener('focus', handlePlansUpdated);
      return () => {
        window.removeEventListener('lightning_plans_updated', handlePlansUpdated);
        window.removeEventListener('focus', handlePlansUpdated);
      };
    }
  }, [fetchPlans]);

  const starterPlan = useMemo(() => {
    if (!plans || plans.length === 0) return DEFAULT_PLANS[0];
    const regularPlans = plans.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const isTrial = name.includes('trial') || slug.includes('trial') || id.includes('trial') || slug.includes('test');
      return !isTrial && p.priceInr >= 500;
    });
    const sorted = [...(regularPlans.length > 0 ? regularPlans : plans)].sort((a, b) => a.priceInr - b.priceInr);
    return sorted[0];
  }, [plans]);

  const featuredPlan = useMemo(() => {
    if (!plans || plans.length === 0) return DEFAULT_PLANS[1];
    return plans.find((p) => p.featured) || plans[Math.floor(plans.length / 2)] || plans[0];
  }, [plans]);

  const getPlanById = useCallback(
    (id: string) => {
      if (!id) return undefined;
      const clean = id.trim().toLowerCase();
      return plans.find(
        (p) =>
          p.id.toLowerCase() === clean ||
          (p.slug && p.slug.toLowerCase() === clean) ||
          p.name.toLowerCase() === clean ||
          (clean === 'max_100x' && p.name.toLowerCase().includes('100x')) ||
          (clean === 'plan_100m_5h' && p.name.toLowerCase().includes('100x'))
      );
    },
    [plans]
  );

  const value = useMemo(
    () => ({
      plans,
      loading,
      error,
      refetch: fetchPlans,
      starterPlan,
      featuredPlan,
      getPlanById,
    }),
    [plans, loading, error, fetchPlans, starterPlan, featuredPlan, getPlanById]
  );

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>;
};

export const usePlans = () => useContext(PlansContext);
