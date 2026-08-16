export interface ServerPlan {
  id: string;
  name: string;
  displayName: string;
  tokenAllowance: bigint;
  tokenDisplay: string;
  windowHours: number;
  validityDays: number;
  priceInr: number;
  currency: string;
  tagline: string;
  featured: boolean;
  enabled: boolean;
  displayOrder: number;
}

export const AUTHORITATIVE_PLANS: Record<string, ServerPlan> = {
  pro: {
    id: 'pro',
    name: 'PRO',
    displayName: 'PRO (5M / 5h Window)',
    tokenAllowance: 5000000n,
    tokenDisplay: '5M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    priceInr: 2499,
    currency: 'INR',
    tagline: 'High-performance access for active daily coding assistance',
    featured: true,
    enabled: true,
    displayOrder: 1,
  },
  max: {
    id: 'max',
    name: 'MAX',
    displayName: 'MAX (20M / 5h Window)',
    tokenAllowance: 20000000n,
    tokenDisplay: '20M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    priceInr: 5499,
    currency: 'INR',
    tagline: 'Best value for heavy IDE power users & builders',
    featured: false,
    enabled: true,
    displayOrder: 2,
  },
  ultra: {
    id: 'ultra',
    name: 'ULTRA',
    displayName: 'ULTRA (40M / 5h Window)',
    tokenAllowance: 40000000n,
    tokenDisplay: '40M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    priceInr: 9999,
    currency: 'INR',
    tagline: 'Maximum high-volume capacity for engineering teams',
    featured: false,
    enabled: true,
    displayOrder: 3,
  },
};

export const FREE_TRIAL_PLAN: ServerPlan = {
  id: 'free_trial',
  name: 'Free Trial',
  displayName: 'FREE 1-DAY TRIAL',
  tokenAllowance: 1000000n,
  tokenDisplay: '1M TOKENS / 5 HOURS',
  windowHours: 5,
  validityDays: 1,
  priceInr: 0,
  currency: 'INR',
  tagline: 'Try before you buy. 24 hours validity. No payment required.',
  featured: false,
  enabled: true,
  displayOrder: 0,
};

export function getPlanById(planId: string): ServerPlan | null {
  if (!planId || typeof planId !== 'string') return null;
  const cleanId = planId.trim().toLowerCase();
  
  if (cleanId === 'free_trial' || cleanId === 'trial') return FREE_TRIAL_PLAN;

  // Backward compatibility alias lookups
  if (cleanId === 'plan_5m_5h') return AUTHORITATIVE_PLANS['pro'];
  if (cleanId === 'plan_20m_5h') return AUTHORITATIVE_PLANS['max'];
  if (cleanId === 'plan_40m_5h' || cleanId === 'plan_100m_5h') return AUTHORITATIVE_PLANS['ultra'];

  const plan = AUTHORITATIVE_PLANS[cleanId];
  if (!plan || !plan.enabled) return null;
  return plan;
}

export function getAllActivePlans(): ServerPlan[] {
  return Object.values(AUTHORITATIVE_PLANS)
    .filter((p) => p.enabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
