import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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
  currency: string;
  tagline: string;
  badge?: string;
  features?: string[];
  featured?: boolean;
  sortOrder?: number;
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
    currency: 'INR',
    tagline: 'High-performance access for active daily coding assistance with Sonnet 5',
    badge: 'STARTER CHOICE',
    featured: false,
    features: [
      '5,000,000 Tokens / 5h Window',
      '30-Day Fixed Validity',
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
    currency: 'INR',
    tagline: 'Best value for heavy IDE power users & builders with Opus 5 & Fable 5',
    badge: 'MOST POPULAR',
    featured: true,
    features: [
      '20,000,000 Tokens / 5h Window',
      '30-Day Fixed Validity',
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
    currency: 'INR',
    tagline: 'Maximum high-volume capacity for engineering teams with all Claude 5 models',
    badge: 'BEST VALUE',
    featured: false,
    features: [
      '40,000,000 Tokens / 5h Window',
      '30-Day Fixed Validity',
      'Max Concurrency & Throughput',
      'All Top Claude Opus 5, Fable 5 & Sonnet 5 Models',
      'VIP Priority Support',
    ],
    sortOrder: 3,
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
    const sorted = [...plans].sort((a, b) => a.priceInr - b.priceInr);
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
          p.name.toLowerCase() === clean
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
