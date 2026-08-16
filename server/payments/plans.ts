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
}

export const AUTHORITATIVE_PLANS: Record<string, ServerPlan> = {
  plan_5m_5h: {
    id: 'plan_5m_5h',
    name: 'Claude Max 5x',
    displayName: 'Claude Max 5x (5M / 5h Window)',
    tokenAllowance: 5000000n,
    tokenDisplay: '5 Million Tokens',
    windowHours: 5,
    validityDays: 30,
    priceInr: 999,
    currency: 'INR',
    tagline: 'Ideal for starter projects & light coding',
    featured: false,
    enabled: true,
  },
  plan_20m_5h: {
    id: 'plan_20m_5h',
    name: 'Claude Max 20x',
    displayName: 'Claude Max 20x (20M / 5h Window)',
    tokenAllowance: 20000000n,
    tokenDisplay: '20 Million Tokens',
    windowHours: 5,
    validityDays: 30,
    priceInr: 2499,
    currency: 'INR',
    tagline: 'Great for active daily coding assistance',
    featured: true,
    enabled: true,
  },
  plan_40m_5h: {
    id: 'plan_40m_5h',
    name: 'Claude Max 40x',
    displayName: 'Claude Max 40x (40M / 5h Window)',
    tokenAllowance: 40000000n,
    tokenDisplay: '40 Million Tokens',
    windowHours: 5,
    validityDays: 30,
    priceInr: 4499,
    currency: 'INR',
    tagline: 'Best value for heavy IDE power users & builders',
    featured: false,
    enabled: true,
  },
  plan_100m_5h: {
    id: 'plan_100m_5h',
    name: 'Claude Max 100x',
    displayName: 'Claude Max 100x (100M / 5h Window)',
    tokenAllowance: 100000000n,
    tokenDisplay: '100 Million Tokens',
    windowHours: 5,
    validityDays: 30,
    priceInr: 9999,
    currency: 'INR',
    tagline: 'High volume allocation for full engineering squads',
    featured: false,
    enabled: true,
  },
};

export function getPlanById(planId: string): ServerPlan | null {
  if (!planId || typeof planId !== 'string') return null;
  const cleanId = planId.trim().toLowerCase();
  const plan = AUTHORITATIVE_PLANS[cleanId];
  if (!plan || !plan.enabled) return null;
  return plan;
}

export function getAllActivePlans(): ServerPlan[] {
  return Object.values(AUTHORITATIVE_PLANS).filter((p) => p.enabled);
}
