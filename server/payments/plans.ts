import { prisma } from '../db';

export type PlanCategory =
  | 'claude_max_rolling'
  | 'claude_openai_credits'
  | 'openai_tokens'
  | 'claude_tokens'
  | 'local_models_tokens';

export const FIVE_PLAN_CATEGORIES = [
  {
    id: 'claude_max_rolling',
    name: 'Claude Max: 5-Hour Rolling Window',
    shortName: 'Claude Max (5h Rolling)',
    provider: 'OpusMax',
    providerScope: 'opus_max',
    billingType: 'window',
    description: 'Continuous 5-hour rolling-window entitlement. Premier Claude Sonnet, Opus & Haiku models.',
  },
  {
    id: 'claude_openai_credits',
    name: 'Claude + OpenAI: API Credit Plans',
    shortName: 'Claude + OpenAI (Credits)',
    provider: 'ScaleMax',
    providerScope: 'scalemax',
    billingType: 'credit',
    description: 'Indian Rupee-denominated API credit balances with 7x-8.75x purchasing multiplier for Claude & OpenAI.',
  },
  {
    id: 'openai_tokens',
    name: 'OpenAI: Token Plans',
    shortName: 'OpenAI (Tokens)',
    provider: 'ScaleMax',
    providerScope: 'scalemax',
    billingType: 'token',
    description: 'Consumable non-expiring token allocations for OpenAI GPT-4o, o1, and o3-mini models.',
  },
  {
    id: 'claude_tokens',
    name: 'Claude: Token Plans',
    shortName: 'Claude (Tokens)',
    provider: 'ScaleMax',
    providerScope: 'scalemax',
    billingType: 'token',
    description: 'Consumable non-expiring token allocations for Claude Sonnet 5.5, Opus 5.5, and Haiku models.',
  },
  {
    id: 'local_models_tokens',
    name: 'Local Models: Token Plans',
    shortName: 'Local Models (Tokens)',
    provider: 'ScaleMax',
    providerScope: 'scalemax',
    billingType: 'token',
    description: 'Consumable token allocations for DeepSeek, Gemini, Grok, Qwen, GLM, MiniMax, Kimi & open-weights models.',
  },
] as const;

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
  planCategory?: PlanCategory;
  creditMultiplier?: number;
  creditAmountInr?: number;
  creditBalanceDenomination?: string;
  supplierCostInr?: number;
  supplierCostUsd?: number;
  supplierAllocation?: string;
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
  // =========================================================================
  // CATEGORY 1 — CLAUDE MAX: 5-HOUR ROLLING WINDOW (OpusMax)
  // =========================================================================
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
    priceInr: 2999,
    originalPriceInr: 3499,
    annualPriceInr: 29990,
    annualOriginalPriceInr: 35988,
    annualValidityDays: 365,
    currency: 'INR',
    planType: 'window',
    planCategory: 'claude_max_rolling',
    providerScope: 'opus_max',
    allowedModelFamilies: ['claude'],
    tagline: 'High-performance 5M token capacity with full access to all latest Claude models',
    badge: 'STARTER CHOICE',
    features: [
      '5,000,000 Tokens / 5h Window Refill',
      'Continuous 5-Hour Rolling Replenishment',
      'Full Access to All Claude Models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5)',
      'Sub-50ms Ultra-Low Latency Gateway Routing',
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
    planType: 'window',
    planCategory: 'claude_max_rolling',
    providerScope: 'opus_max',
    allowedModelFamilies: ['claude'],
    tagline: 'Best value 20M token capacity with full access to all latest Claude models',
    badge: 'MOST POPULAR',
    features: [
      '20,000,000 Tokens / 5h Window Refill',
      'Continuous 5-Hour Rolling Replenishment',
      'Full Access to All Claude Models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5)',
      'Cursor, Windsurf & Claude Code CLI Ready',
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
    planType: 'window',
    planCategory: 'claude_max_rolling',
    providerScope: 'opus_max',
    allowedModelFamilies: ['claude'],
    tagline: 'Heavy-duty 40M token capacity with full access to all latest Claude models',
    badge: 'BEST VALUE',
    features: [
      '40,000,000 Tokens / 5h Window Refill',
      'Continuous 5-Hour Rolling Replenishment',
      'Max Concurrency & High Throughput',
      'Full Access to All Claude Models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5)',
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
    priceInr: 24999,
    originalPriceInr: 69999,
    annualPriceInr: 249990,
    annualOriginalPriceInr: 299988,
    annualValidityDays: 365,
    currency: 'INR',
    planType: 'window',
    planCategory: 'claude_max_rolling',
    providerScope: 'opus_max',
    allowedModelFamilies: ['claude'],
    tagline: 'Supreme 100M token capacity with full access to all latest Claude models',
    badge: 'MAX SCALE',
    features: [
      '100,000,000 Tokens / 5h Window Refill',
      'Continuous 5-Hour Rolling Replenishment',
      'Full Access to All Claude Models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5)',
      'Dedicated Gateway Ingress & Max Concurrency',
      'Instant Automated Delivery',
    ],
    featured: false,
    enabled: true,
    displayOrder: 4,
  },

  // =========================================================================
  // CATEGORY 2 — CLAUDE + OPENAI: API CREDIT PLANS (ScaleMax Credits, INR)
  // =========================================================================
  credit_starter: {
    id: 'credit_starter',
    slug: 'credit_starter',
    name: 'Credit Starter',
    displayName: 'API Credits Starter ($7.00 Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$7.00 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 100,
    originalPriceInr: 200,
    currency: 'INR',
    planType: 'credit',
    planCategory: 'claude_openai_credits',
    creditMultiplier: 7.0,
    creditAmountUsd: 7.0,
    creditAmountInr: 630.0,
    creditBalanceDenomination: 'USD',
    supplierCostInr: 250.0,
    supplierAllocation: '$25 credit allocation',
    providerScope: 'scalemax',
    allowedModelFamilies: ['claude', 'openai'],
    tagline: 'Pay ₹100 → Receive $7.00 USD API Credits (7x multiplier). Dedicated model access.',
    badge: 'STARTER PACK',
    features: [
      '$7.00 USD API Credit Balance',
      '7x Value Multiplier (Pay ₹100 → Get $7.00 Credits)',
      'Full Model Access Scoped to Your Plan',
      '365-Day Flexible Validity',
      'Atomic Pay-As-You-Go Deductions',
    ],
    featured: false,
    enabled: true,
    displayOrder: 10,
  },
  credit_growth: {
    id: 'credit_growth',
    slug: 'credit_growth',
    name: 'Credit Growth',
    displayName: 'API Credits Growth ($38.50 Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$38.50 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 150,
    priceInr: 499,
    originalPriceInr: 999,
    currency: 'INR',
    planType: 'credit',
    planCategory: 'claude_openai_credits',
    creditMultiplier: 7.7,
    creditAmountUsd: 38.50,
    creditAmountInr: 3465.0,
    creditBalanceDenomination: 'USD',
    supplierCostInr: 1000.0,
    supplierAllocation: '$105 credit allocation',
    providerScope: 'scalemax',
    allowedModelFamilies: ['claude', 'openai'],
    tagline: 'Pay ₹499 → Receive $38.50 USD API Credits (7.7x multiplier). Extra headroom for active developers.',
    badge: 'GROWTH PACK',
    features: [
      '$38.50 USD API Credit Balance',
      '7.7x Value Multiplier Included',
      'Full Model Access Scoped to Your Plan',
      '365-Day Extended Validity',
      'Atomic Pay-As-You-Go Deductions',
    ],
    featured: true,
    enabled: true,
    displayOrder: 11,
  },
  credit_pro: {
    id: 'credit_pro',
    slug: 'credit_pro',
    name: 'Credit Pro',
    displayName: 'API Credits Pro ($160.00 Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$160.00 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 1999,
    originalPriceInr: 3999,
    currency: 'INR',
    planType: 'credit',
    planCategory: 'claude_openai_credits',
    creditMultiplier: 8.0,
    creditAmountUsd: 160.0,
    creditAmountInr: 14400.0,
    creditBalanceDenomination: 'USD',
    supplierCostInr: 5000.0,
    supplierAllocation: '$535 credit allocation',
    providerScope: 'scalemax',
    allowedModelFamilies: ['claude', 'openai'],
    tagline: 'Pay ₹1,999 → Receive $160.00 USD API Credits (8x multiplier). High-volume inference for power users.',
    badge: 'POWER USERS',
    features: [
      '$160.00 USD API Credit Balance',
      '8x Highest Value Multiplier',
      'Full Model Access Scoped to Your Plan',
      '365-Day Extended Validity',
      'VIP Priority Gateway Ingress',
    ],
    featured: false,
    enabled: true,
    displayOrder: 12,
  },
  credit_scale: {
    id: 'credit_scale',
    slug: 'credit_scale',
    name: 'Credit Scale',
    displayName: 'API Credits Scale ($350.00 Credits)',
    tokenAllowance: 0n,
    tokenDisplay: '$350.00 API CREDITS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 300,
    priceInr: 3999,
    originalPriceInr: 7999,
    currency: 'INR',
    planType: 'credit',
    planCategory: 'claude_openai_credits',
    creditMultiplier: 8.75,
    creditAmountUsd: 350.0,
    creditAmountInr: 31500.0,
    creditBalanceDenomination: 'USD',
    supplierCostInr: 10000.0,
    supplierAllocation: '$1,100 credit allocation',
    providerScope: 'scalemax',
    allowedModelFamilies: ['claude', 'openai'],
    tagline: 'Pay ₹3,999 → Receive $350.00 USD API Credits (8.75x multiplier). Maximum capacity for teams.',
    badge: 'MAX SCALE',
    features: [
      '$350.00 USD API Credit Balance',
      '8.75x Maximum Scale Multiplier',
      'Full Model Access Scoped to Your Plan',
      '365-Day Extended Validity',
      'Dedicated High-Concurrency Quota',
    ],
    featured: false,
    enabled: true,
    displayOrder: 13,
  },

  // =========================================================================
  // CATEGORY 3 — OPENAI: TOKEN PLANS (ScaleMax Token, OpenAI Models)
  // =========================================================================
  openai_token_10m: {
    id: 'openai_token_10m',
    slug: 'openai_token_10m',
    name: 'OpenAI 10M Token Pack',
    displayName: 'OpenAI 10M Token Pack',
    tokenAllowance: 10000000n,
    tokenDisplay: '10M OPENAI TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 999,
    originalPriceInr: 1499,
    currency: 'INR',
    planType: 'token',
    planCategory: 'openai_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['openai'],
    supplierCostInr: 230.0,
    supplierAllocation: '10 million tokens',
    tagline: '10 Million consumable tokens for GPT-4o, o1, and o3-mini. No 5-hour window resets.',
    badge: 'OPENAI STARTER',
    features: [
      '10,000,000 Consumable OpenAI Tokens',
      'Supports GPT-4o, o1, o3-mini & Codex Models',
      '365-Day Validity (No 5-Hour Expiry)',
      'Full OpenAI SDK & Tools Compatibility',
      'Instant Key Allocation',
    ],
    featured: false,
    enabled: true,
    displayOrder: 20,
  },
  openai_token_50m: {
    id: 'openai_token_50m',
    slug: 'openai_token_50m',
    name: 'OpenAI 50M Token Pack',
    displayName: 'OpenAI 50M Token Pack',
    tokenAllowance: 50000000n,
    tokenDisplay: '50M OPENAI TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 150,
    priceInr: 3499,
    originalPriceInr: 4999,
    currency: 'INR',
    planType: 'token',
    planCategory: 'openai_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['openai'],
    supplierCostInr: 1050.0,
    supplierAllocation: '50 million tokens',
    tagline: '50 Million consumable tokens for high-volume OpenAI inference and autonomous agents.',
    badge: 'OPENAI PRO',
    features: [
      '50,000,000 Consumable OpenAI Tokens',
      'Supports All Frontier OpenAI Models',
      '365-Day Validity (No 5-Hour Expiry)',
      'Reasoning Tokens & Structured Outputs Supported',
      'High Concurrency Limits',
    ],
    featured: true,
    enabled: true,
    displayOrder: 21,
  },
  openai_token_100m: {
    id: 'openai_token_100m',
    slug: 'openai_token_100m',
    name: 'OpenAI 100M Token Pack',
    displayName: 'OpenAI 100M Token Pack',
    tokenAllowance: 100000000n,
    tokenDisplay: '100M OPENAI TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 5999,
    originalPriceInr: 8999,
    currency: 'INR',
    planType: 'token',
    planCategory: 'openai_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['openai'],
    supplierCostInr: 2100.0,
    supplierAllocation: '100 million tokens',
    tagline: '100 Million consumable tokens for enterprise OpenAI integrations and heavy pipelines.',
    badge: 'OPENAI SCALE',
    features: [
      '100,000,000 Consumable OpenAI Tokens',
      'Wholesale Economic Rates (Supplier Cost: ₹2,100)',
      '365-Day Extended Validity',
      'Dedicated Gateway Ingress',
      'Instant Key Allocation',
    ],
    featured: false,
    enabled: true,
    displayOrder: 22,
  },

  // =========================================================================
  // CATEGORY 4 — CLAUDE: TOKEN PLANS (ScaleMax Token, Claude Models)
  // =========================================================================
  claude_token_10m: {
    id: 'claude_token_10m',
    slug: 'claude_token_10m',
    name: 'Claude 10M Token Pack',
    displayName: 'Claude 10M Token Pack',
    tokenAllowance: 10000000n,
    tokenDisplay: '10M CLAUDE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 1199,
    originalPriceInr: 1799,
    currency: 'INR',
    planType: 'token',
    planCategory: 'claude_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['claude'],
    supplierCostInr: 250.0,
    supplierAllocation: '10 million tokens',
    tagline: '10 Million consumable tokens for Claude Sonnet 5.5, Opus 5.5, and Haiku without 5-hour resets.',
    badge: 'CLAUDE STARTER',
    features: [
      '10,000,000 Consumable Claude Tokens',
      'Claude Sonnet 5.5, Opus 5.5 & Haiku Access',
      '365-Day Validity (Spend at your own pace)',
      'Cursor, Windsurf & Claude Code CLI Ready',
      'Instant Key Allocation',
    ],
    featured: false,
    enabled: true,
    displayOrder: 30,
  },
  claude_token_50m: {
    id: 'claude_token_50m',
    slug: 'claude_token_50m',
    name: 'Claude 50M Token Pack',
    displayName: 'Claude 50M Token Pack',
    tokenAllowance: 50000000n,
    tokenDisplay: '50M CLAUDE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 150,
    priceInr: 3999,
    originalPriceInr: 5999,
    currency: 'INR',
    planType: 'token',
    planCategory: 'claude_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['claude'],
    supplierCostInr: 1150.0,
    supplierAllocation: '50 million tokens',
    tagline: '50 Million consumable tokens for deep coding sessions, large refactors, and multi-turn loops.',
    badge: 'CLAUDE PRO',
    features: [
      '50,000,000 Consumable Claude Tokens',
      'All Frontier Claude Sonnet & Opus Models Supported',
      '365-Day Validity (No 5-Hour Expiry)',
      'High-Throughput Streaming Support',
      'Instant Key Allocation',
    ],
    featured: true,
    enabled: true,
    displayOrder: 31,
  },
  claude_token_100m: {
    id: 'claude_token_100m',
    slug: 'claude_token_100m',
    name: 'Claude 100M Token Pack',
    displayName: 'Claude 100M Token Pack',
    tokenAllowance: 100000000n,
    tokenDisplay: '100M CLAUDE TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 6999,
    originalPriceInr: 9999,
    currency: 'INR',
    planType: 'token',
    planCategory: 'claude_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['claude'],
    supplierCostInr: 2300.0,
    supplierAllocation: '100 million tokens',
    tagline: '100 Million consumable tokens for engineering power users and autonomous agent workflows.',
    badge: 'CLAUDE SCALE',
    features: [
      '100,000,000 Consumable Claude Tokens',
      'Wholesale Supplier Reference: ₹2,300',
      '365-Day Extended Validity',
      'Sub-50ms Gateway Latency',
      'VIP Priority Support',
    ],
    featured: false,
    enabled: true,
    displayOrder: 32,
  },

  // =========================================================================
  // CATEGORY 5 — LOCAL MODELS: TOKEN PLANS (ScaleMax Dedicated Local Credential)
  // =========================================================================
  local_token_10m: {
    id: 'local_token_10m',
    slug: 'local_token_10m',
    name: 'Local Models 10M Token Pack',
    displayName: 'Local Models 10M Token Pack',
    tokenAllowance: 10000000n,
    tokenDisplay: '10M LOCAL TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 120,
    priceInr: 799,
    originalPriceInr: 1199,
    currency: 'INR',
    planType: 'token',
    planCategory: 'local_models_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['local', 'deepseek', 'gemini', 'grok', 'glm', 'minimax', 'kimi', 'qwen'],
    supplierCostInr: 220.0,
    supplierAllocation: '10 million tokens',
    tagline: '10 Million tokens for DeepSeek V4, Gemini, Grok, Qwen, GLM, and MiniMax via dedicated local routing.',
    badge: 'LOCAL STARTER',
    features: [
      '10,000,000 Consumable Local Tokens',
      'DeepSeek, Gemini, Grok, Qwen & GLM Supported',
      'Routed via Dedicated Local Models Credential',
      '365-Day Validity (No 5-Hour Expiry)',
      'High-Throughput Batch Processing',
    ],
    featured: false,
    enabled: true,
    displayOrder: 40,
  },
  local_token_100m: {
    id: 'local_token_100m',
    slug: 'local_token_100m',
    name: 'Local Models 100M Token Pack',
    displayName: 'Local Models 100M Token Pack',
    tokenAllowance: 100000000n,
    tokenDisplay: '100M LOCAL TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 150,
    priceInr: 3499,
    originalPriceInr: 5499,
    currency: 'INR',
    planType: 'token',
    planCategory: 'local_models_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['local', 'deepseek', 'gemini', 'grok', 'glm', 'minimax', 'kimi', 'qwen'],
    supplierCostInr: 1300.0,
    supplierAllocation: '100 million tokens',
    tagline: '100 Million tokens for heavy local/open-weight processing, embedding, and code execution.',
    badge: 'LOCAL VALUE',
    features: [
      '100,000,000 Consumable Local Tokens',
      'Full Model Catalog (DeepSeek V4, Gemini, Grok, Qwen)',
      'Wholesale Supplier Reference: ₹1,300',
      '365-Day Extended Validity',
      'Dedicated Local Upstream Pipeline',
    ],
    featured: true,
    enabled: true,
    displayOrder: 41,
  },
  local_token_500m: {
    id: 'local_token_500m',
    slug: 'local_token_500m',
    name: 'Local Models 500M Token Pack',
    displayName: 'Local Models 500M Token Pack',
    tokenAllowance: 500000000n,
    tokenDisplay: '500M LOCAL TOKENS',
    windowHours: 0,
    validityDays: 365,
    rateLimitRpm: 200,
    priceInr: 14999,
    originalPriceInr: 22999,
    currency: 'INR',
    planType: 'token',
    planCategory: 'local_models_tokens',
    providerScope: 'scalemax',
    allowedModelFamilies: ['local', 'deepseek', 'gemini', 'grok', 'glm', 'minimax', 'kimi', 'qwen'],
    supplierCostInr: 5800.0,
    supplierAllocation: '500 million tokens',
    tagline: '500 Million tokens for high-volume enterprise pipelines, batch loops, and autonomous systems.',
    badge: 'LOCAL ENTERPRISE',
    features: [
      '500,000,000 Consumable Local Tokens',
      'Wholesale Supplier Reference: ₹5,800',
      '365-Day Extended Validity',
      'Max Concurrency on Local Routing Channel',
      'VIP Priority Support',
    ],
    featured: false,
    enabled: true,
    displayOrder: 42,
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
          planCategory: (p.planCategory as any) || (p.planType === 'window' ? 'claude_max_rolling' : p.planType === 'credit' ? 'claude_openai_credits' : 'claude_tokens'),
          creditMultiplier: p.creditMultiplier !== null && p.creditMultiplier !== undefined ? Number(p.creditMultiplier) : (p.planType === 'credit' ? 7.0 : undefined),
          creditAmountInr: p.creditAmountInr !== null && p.creditAmountInr !== undefined ? Number(p.creditAmountInr) : (p.creditMultiplier ? Number(p.priceInr) * Number(p.creditMultiplier) : undefined),
          creditBalanceDenomination: p.creditBalanceDenomination || 'INR',
          supplierCostInr: p.supplierCostInr !== null && p.supplierCostInr !== undefined ? Number(p.supplierCostInr) : undefined,
          supplierCostUsd: p.supplierCostUsd !== null && p.supplierCostUsd !== undefined ? Number(p.supplierCostUsd) : undefined,
          supplierAllocation: p.supplierAllocation || undefined,
          creditAmountUsd: p.creditAmountUsd !== null && p.creditAmountUsd !== undefined ? Number(p.creditAmountUsd) : undefined,
          bonusCreditsUsd: p.bonusCreditsUsd !== null && p.bonusCreditsUsd !== undefined ? Number(p.bonusCreditsUsd) : undefined,
          bonusTokens: p.bonusTokens !== null && p.bonusTokens !== undefined ? BigInt(p.bonusTokens) : undefined,
          providerScope: p.providerScope || 'all',
          allowedModelFamilies: p.allowedModelFamilies ? (typeof p.allowedModelFamilies === 'string' ? (p.allowedModelFamilies.startsWith('[') ? JSON.parse(p.allowedModelFamilies) : [p.allowedModelFamilies]) : p.allowedModelFamilies) : undefined,
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
