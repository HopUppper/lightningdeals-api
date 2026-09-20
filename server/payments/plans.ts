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
  currency: string;
  tagline?: string;
  badge?: string;
  features?: string[];
  featured: boolean;
  enabled: boolean;
  displayOrder: number;
}

export const AUTHORITATIVE_PLANS: Record<string, ServerPlan> = {
  pro: {
    id: 'pro',
    slug: 'pro',
    name: 'PRO',
    displayName: 'PRO (5M / 5h Window)',
    tokenAllowance: 5000000n,
    tokenDisplay: '5M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 2499,
    originalPriceInr: 3499,
    currency: 'INR',
    tagline: 'High-performance access for active daily coding assistance',
    badge: 'STARTER CHOICE',
    features: [
      '5,000,000 Tokens / 5h Window',
      '30-Day Fixed Validity',
      'Claude 3.5 Sonnet & Haiku',
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
    name: 'MAX',
    displayName: 'MAX (20M / 5h Window)',
    tokenAllowance: 20000000n,
    tokenDisplay: '20M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 5999,
    originalPriceInr: 22999,
    currency: 'INR',
    tagline: 'Best value for heavy IDE power users & builders',
    badge: 'MOST POPULAR',
    features: [
      '20,000,000 Tokens / 5h Window',
      '30-Day Fixed Validity',
      'Claude 3.5 Sonnet, Opus & Fable',
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
    name: 'ULTRA',
    displayName: 'ULTRA (40M / 5h Window)',
    tokenAllowance: 40000000n,
    tokenDisplay: '40M TOKENS / 5 HOURS',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 8999,
    originalPriceInr: 12999,
    currency: 'INR',
    tagline: 'Maximum high-volume capacity for engineering teams',
    badge: 'BEST VALUE',
    features: [
      '40,000,000 Tokens / 5h Window',
      '30-Day Fixed Validity',
      'Max Concurrency & Dedicated Throughput',
      'All Top Claude 3.5 & 3.7 Models',
      'VIP Priority Support',
    ],
    featured: false,
    enabled: true,
    displayOrder: 3,
  },
};

export const FREE_TRIAL_PLAN: ServerPlan = {
  id: 'free_trial',
  slug: 'trial',
  name: 'Free Trial',
  displayName: 'FREE 1-DAY TRIAL',
  tokenAllowance: 1000000n,
  tokenDisplay: '1M TOKENS / 5 HOURS',
  windowHours: 5,
  validityDays: 1,
  rateLimitRpm: 100,
  priceInr: 0,
  currency: 'INR',
  tagline: 'Try before you buy. 24 hours validity. No payment required.',
  badge: 'FREE TRIAL',
  features: ['1,000,000 Tokens / 5h', '24h Validity', 'Claude 3.5 Sonnet'],
  featured: false,
  enabled: true,
  displayOrder: 0,
};

/**
 * Fetch all active plans from PostgreSQL database with fallback to default plans
 */
export async function getAllActivePlansAsync(): Promise<ServerPlan[]> {
  try {
    const dbPlans = await prisma.plan.findMany({
      where: {
        status: 'active',
        enabled: true,
        priceInr: { gt: 0 },
        NOT: {
          name: { contains: 'Trial', mode: 'insensitive' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (dbPlans && dbPlans.length > 0) {
      return dbPlans.map((p) => {
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
          currency: p.currency || 'INR',
          tagline: p.tagline || undefined,
          badge: p.badge || undefined,
          features: features.length > 0 ? features : undefined,
          featured: p.featured,
          enabled: p.enabled,
          displayOrder: p.sortOrder,
        };
      });
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
        currency: dbPlan.currency || 'INR',
        tagline: dbPlan.tagline || undefined,
        badge: dbPlan.badge || undefined,
        features: features.length > 0 ? features : undefined,
        featured: dbPlan.featured,
        enabled: dbPlan.enabled,
        displayOrder: dbPlan.sortOrder,
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
