import { prisma, encryptText } from '../server/db.js';

export async function seedScaleMaxAndMultiProvider() {
  console.log('⚡ Starting Multi-Provider & ScaleMax Database Seeding...');

  // 1. Ensure Opus Max Provider exists
  let opusMax = await prisma.vendorProvider.findFirst({
    where: {
      OR: [{ slug: 'opus_max' }, { name: { contains: 'Opus', mode: 'insensitive' } }],
    },
  });

  if (!opusMax) {
    opusMax = await prisma.vendorProvider.create({
      data: {
        name: 'Opus Max',
        slug: 'opus_max',
        providerType: 'anthropic',
        protocol: 'anthropic',
        baseUrl: 'https://api.opusmax.pro',
        apiCreditBaseUrl: 'https://api.opusmax.pro',
        tokenPackBaseUrl: 'https://api.opusmax.pro',
        masterApiKeyEncrypted: encryptText(process.env.OPUSMAX_MASTER_API_KEY || 'sm_live_opusmax_master_key'),
        status: 'connected',
        isPrimary: false,
        isDefault: false,
        priority: 1,
        capacityModel: 'rolling_window',
        windowHours: 5,
        windowAllowance: BigInt(5000000),
        supportedFamiliesJson: JSON.stringify(['claude']),
        costPerMillionInput: 2.50,
        costPerMillionOutput: 12.00,
        notes: 'OpusMax AI Provider - Claude 5-hour rolling-window dedicated supplier',
      },
    });
    console.log('✓ Created Opus Max provider:', opusMax.id);
  } else {
    opusMax = await prisma.vendorProvider.update({
      where: { id: opusMax.id },
      data: {
        slug: 'opus_max',
        protocol: 'anthropic',
        providerType: 'anthropic',
        baseUrl: 'https://api.opusmax.pro',
        capacityModel: 'rolling_window',
        supportedFamiliesJson: JSON.stringify(['claude']),
        costPerMillionInput: 2.50,
        costPerMillionOutput: 12.00,
      },
    });
    console.log('✓ Updated Opus Max provider:', opusMax.id);
  }

  // 2. Ensure ScaleMax Provider exists as a first-class peer
  let scaleMax = await prisma.vendorProvider.findFirst({
    where: {
      OR: [{ slug: 'scalemax' }, { name: { contains: 'ScaleMax', mode: 'insensitive' } }],
    },
  });

  const scaleMaxKey = process.env.SCALEMAX_MASTER_API_KEY || process.env.SCALEMAX_API_KEY || 'sm_live_scalemax_master_key';

  if (!scaleMax) {
    scaleMax = await prisma.vendorProvider.create({
      data: {
        name: 'ScaleMax',
        slug: 'scalemax',
        providerType: 'openai-compatible',
        protocol: 'openai-compatible',
        baseUrl: 'https://api.scalemax.pro/v1',
        apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
        tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
        masterApiKeyEncrypted: encryptText(scaleMaxKey),
        status: 'connected',
        isPrimary: false,
        isDefault: false,
        priority: 2,
        capacityModel: 'lifetime_prepaid',
        availableTokens: BigInt(500000000),
        purchasedTokens: BigInt(500000000),
        supportedFamiliesJson: JSON.stringify(['openai', 'gemini', 'deepseek', 'grok', 'qwen', 'claude']),
        costPerMillionInput: 1.50,
        costPerMillionOutput: 6.00,
        notes: 'ScaleMax AI Infrastructure - OpenAI, Gemini, DeepSeek, Grok, and multi-model catalog',
      },
    });
    console.log('✓ Created ScaleMax provider:', scaleMax.id);
  } else {
    scaleMax = await prisma.vendorProvider.update({
      where: { id: scaleMax.id },
      data: {
        slug: 'scalemax',
        name: 'ScaleMax',
        protocol: 'openai-compatible',
        providerType: 'openai-compatible',
        baseUrl: 'https://api.scalemax.pro/v1',
        apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
        tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
        supportedFamiliesJson: JSON.stringify(['openai', 'gemini', 'deepseek', 'grok', 'qwen', 'claude']),
        status: 'connected',
      },
    });
    console.log('✓ Updated ScaleMax provider:', scaleMax.id);
  }

  // 3. Link all Claude models to OpusMax
  const claudeModels = await prisma.model.findMany({
    where: {
      OR: [
        { modelId: { startsWith: 'claude' } },
        { displayName: { contains: 'Claude' } },
      ],
    },
  });

  for (const cm of claudeModels) {
    await prisma.model.update({
      where: { id: cm.id },
      data: {
        providerId: opusMax.id,
        providerSlug: 'opus_max',
        family: 'claude',
        protocol: 'anthropic',
        providerCostInput: 2.50,
        providerCostOutput: 12.00,
        supportedPlans: JSON.stringify(['window', 'credit', 'token']),
        isCustomerAvailable: true,
      },
    });
  }
  console.log(`✓ Synchronized ${claudeModels.length} Claude models to OpusMax (${opusMax.id})`);

  // 4. Seed Non-Claude ScaleMax Models
  const nonClaudeModels = [
    {
      modelId: 'gpt-4o',
      displayName: 'OpenAI GPT-4o',
      upstreamModelId: 'gpt-4o',
      family: 'openai',
      protocol: 'openai-compatible',
      description: 'OpenAI flagship multimodal intelligence model with 128k context and high code synthesis speed.',
      contextWindow: 128000,
      inputPrice: 2.50,
      outputPrice: 10.00,
      providerCostInput: 2.00,
      providerCostOutput: 8.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    {
      modelId: 'gpt-4o-mini',
      displayName: 'OpenAI GPT-4o Mini',
      upstreamModelId: 'gpt-4o-mini',
      family: 'openai',
      protocol: 'openai-compatible',
      description: 'Ultra-fast, cost-effective multimodal model for high-throughput developer tasks and chat bots.',
      contextWindow: 128000,
      inputPrice: 0.15,
      outputPrice: 0.60,
      providerCostInput: 0.10,
      providerCostOutput: 0.40,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    {
      modelId: 'o1',
      displayName: 'OpenAI o1 Reasoning',
      upstreamModelId: 'o1',
      family: 'openai',
      protocol: 'openai-compatible',
      description: 'Deep deliberative reasoning model for advanced math, competitive coding, and complex logic.',
      contextWindow: 200000,
      inputPrice: 15.00,
      outputPrice: 60.00,
      providerCostInput: 12.00,
      providerCostOutput: 50.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    {
      modelId: 'o1-mini',
      displayName: 'OpenAI o1-mini',
      upstreamModelId: 'o1-mini',
      family: 'openai',
      protocol: 'openai-compatible',
      description: 'Fast reasoning model optimized for STEM, mathematics, and code debugging.',
      contextWindow: 128000,
      inputPrice: 3.00,
      outputPrice: 12.00,
      providerCostInput: 2.50,
      providerCostOutput: 10.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    {
      modelId: 'o3-mini',
      displayName: 'OpenAI o3-mini',
      upstreamModelId: 'o3-mini',
      family: 'openai',
      protocol: 'openai-compatible',
      description: 'High-speed reasoning model with adjustable reasoning effort and low latency.',
      contextWindow: 200000,
      inputPrice: 1.10,
      outputPrice: 4.40,
      providerCostInput: 0.90,
      providerCostOutput: 3.50,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    {
      modelId: 'gemini-2.5-pro',
      displayName: 'Google Gemini 2.5 Pro',
      upstreamModelId: 'gemini-2.5-pro',
      family: 'gemini',
      protocol: 'openai-compatible',
      description: 'Google frontier multimodal model with unprecedented 2M token context window and cross-modal reasoning.',
      contextWindow: 2000000,
      inputPrice: 1.25,
      outputPrice: 5.00,
      providerCostInput: 1.00,
      providerCostOutput: 4.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    {
      modelId: 'gemini-2.5-flash',
      displayName: 'Google Gemini 2.5 Flash',
      upstreamModelId: 'gemini-2.5-flash',
      family: 'gemini',
      protocol: 'openai-compatible',
      description: 'High-velocity 1M token context model designed for high frequency and real-time processing.',
      contextWindow: 1000000,
      inputPrice: 0.075,
      outputPrice: 0.30,
      providerCostInput: 0.05,
      providerCostOutput: 0.20,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    {
      modelId: 'deepseek-chat',
      displayName: 'DeepSeek V3 (Chat)',
      upstreamModelId: 'deepseek-chat',
      family: 'deepseek',
      protocol: 'openai-compatible',
      description: 'DeepSeek-V3 671B MoE architecture delivering frontier-grade code synthesis at fractional costs.',
      contextWindow: 64000,
      inputPrice: 0.14,
      outputPrice: 0.28,
      providerCostInput: 0.10,
      providerCostOutput: 0.20,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    {
      modelId: 'deepseek-reasoner',
      displayName: 'DeepSeek R1 (Reasoner)',
      upstreamModelId: 'deepseek-reasoner',
      family: 'deepseek',
      protocol: 'openai-compatible',
      description: 'DeepSeek-R1 open reasoning model utilizing large-scale reinforcement learning with explicit thinking.',
      contextWindow: 64000,
      inputPrice: 0.55,
      outputPrice: 2.19,
      providerCostInput: 0.40,
      providerCostOutput: 1.80,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    {
      modelId: 'grok-2',
      displayName: 'xAI Grok 2',
      upstreamModelId: 'grok-2',
      family: 'grok',
      protocol: 'openai-compatible',
      description: 'xAI state-of-the-art vision and text reasoning model with cutting-edge real-time capabilities.',
      contextWindow: 128000,
      inputPrice: 2.00,
      outputPrice: 10.00,
      providerCostInput: 1.50,
      providerCostOutput: 8.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    {
      modelId: 'qwen-2.5-72b-instruct',
      displayName: 'Qwen 2.5 72B Instruct',
      upstreamModelId: 'qwen-2.5-72b-instruct',
      family: 'qwen',
      protocol: 'openai-compatible',
      description: 'Alibaba Cloud 72B open-weight leader in multilingual instruction following, mathematics, and coding.',
      contextWindow: 131072,
      inputPrice: 0.35,
      outputPrice: 0.40,
      providerCostInput: 0.25,
      providerCostOutput: 0.30,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
  ];

  for (const m of nonClaudeModels) {
    const existing = await prisma.model.findFirst({
      where: {
        OR: [{ modelId: m.modelId }, { upstreamModelId: m.upstreamModelId }],
      },
    });

    if (existing) {
      await prisma.model.update({
        where: { id: existing.id },
        data: {
          ...m,
          providerId: scaleMax.id,
          providerSlug: 'scalemax',
          supportedPlans: JSON.stringify(['credit', 'token']),
          isCustomerAvailable: true,
          enabled: true,
          lastSyncAt: new Date(),
        },
      });
      console.log(`✓ Updated ScaleMax model: ${m.modelId}`);
    } else {
      await prisma.model.create({
        data: {
          ...m,
          provider: 'ScaleMax',
          providerId: scaleMax.id,
          providerSlug: 'scalemax',
          supportedPlans: JSON.stringify(['credit', 'token']),
          isCustomerAvailable: true,
          enabled: true,
          lastSyncAt: new Date(),
        },
      });
      console.log(`✓ Created ScaleMax model: ${m.modelId}`);
    }
  }

  // 5. Update existing window plans with planType: 'window'
  await prisma.plan.updateMany({
    where: {
      OR: [
        { id: 'pro' },
        { id: 'max' },
        { id: 'ultra' },
        { slug: 'max_100x' },
        { name: { contains: 'MAX' } },
      ],
    },
    data: {
      planType: 'window',
      providerScope: 'opus_max',
      providerId: opusMax.id,
    },
  });
  console.log('✓ Marked Claude 5-hour rolling-window plans as planType: window');

  // 6. Seed Credit-based Pay-As-You-Go Plans (Default multiplier: ₹1 paid = $7 usage credits)
  const creditPlans = [
    {
      id: 'credit_starter',
      slug: 'credit-starter',
      name: 'Credit Starter ($700 Credits)',
      displayName: 'Pay-As-You-Go Starter ($700 Credits)',
      priceInr: 100,
      originalPriceInr: 200,
      planType: 'credit',
      creditMultiplier: 7.0,
      creditAmountUsd: 700.0,
      bonusCreditsUsd: 0.0,
      tokenAllowance: BigInt(0),
      tokenDisplay: '$700 USAGE CREDITS',
      windowHours: 0,
      validityDays: 365,
      rateLimitRpm: 120,
      currency: 'INR',
      tagline: '₹100 = $700 credits (7x value multiplier). Universal access to all ScaleMax and Opus models.',
      badge: 'STARTER PACK',
      featured: false,
      enabled: true,
      status: 'active',
      sortOrder: 10,
      providerScope: 'all',
      featuresJson: JSON.stringify([
        '$700 Usage Credits included',
        '₹1 paid = $7 credits (7x multiplier)',
        'Full access to OpenAI, Gemini, DeepSeek & Claude',
        'Atomic pay-as-you-go deduction per token',
        '1-Year Validity & Instant Key Delivery',
      ]),
    },
    {
      id: 'credit_growth',
      slug: 'credit-growth',
      name: 'Credit Growth ($3,850 Credits)',
      displayName: 'Pay-As-You-Go Growth ($3,850 Credits)',
      priceInr: 500,
      originalPriceInr: 1000,
      planType: 'credit',
      creditMultiplier: 7.0,
      creditAmountUsd: 3500.0,
      bonusCreditsUsd: 350.0, // 10% bonus
      tokenAllowance: BigInt(0),
      tokenDisplay: '$3,850 USAGE CREDITS',
      windowHours: 0,
      validityDays: 365,
      rateLimitRpm: 200,
      currency: 'INR',
      tagline: '₹500 = $3,500 credits + $350 free bonus credits ($3,850 total). Best for developers & autonomous loops.',
      badge: 'POPULAR CREDITS',
      featured: true,
      enabled: true,
      status: 'active',
      sortOrder: 11,
      providerScope: 'all',
      featuresJson: JSON.stringify([
        '$3,500 Base + $350 Bonus ($3,850 Total)',
        '10% Free Bonus Credits added automatically',
        'All OpenAI, DeepSeek, Gemini & Claude models',
        'High RPM limit (200 requests/min)',
        '1-Year Validity & Dedicated Gateway Ingress',
      ]),
    },
    {
      id: 'credit_pro',
      slug: 'credit-pro',
      name: 'Credit Pro ($16,000 Credits)',
      displayName: 'Pay-As-You-Go Pro ($16,000 Credits)',
      priceInr: 2000,
      originalPriceInr: 4000,
      planType: 'credit',
      creditMultiplier: 7.0,
      creditAmountUsd: 14000.0,
      bonusCreditsUsd: 2000.0, // ~14% bonus
      tokenAllowance: BigInt(0),
      tokenDisplay: '$16,000 USAGE CREDITS',
      windowHours: 0,
      validityDays: 365,
      rateLimitRpm: 500,
      currency: 'INR',
      tagline: '₹2,000 = $14,000 credits + $2,000 bonus credits ($16,000 total). Heavy engineering & agent swarms.',
      badge: 'BEST POWER VALUE',
      featured: false,
      enabled: true,
      status: 'active',
      sortOrder: 12,
      providerScope: 'all',
      featuresJson: JSON.stringify([
        '$14,000 Base + $2,000 Bonus ($16,000 Total)',
        '$2,000 Massive Bonus Credits included',
        'Priority concurrency & sub-30ms routing',
        'High throughput for Claude Code & Cursor CLI',
        '1-Year Validity & VIP Support',
      ]),
    },
    {
      id: 'credit_scale',
      slug: 'credit-scale',
      name: 'Credit Scale ($42,000 Credits)',
      displayName: 'Pay-As-You-Go Scale ($42,000 Credits)',
      priceInr: 5000,
      originalPriceInr: 10000,
      planType: 'credit',
      creditMultiplier: 7.0,
      creditAmountUsd: 35000.0,
      bonusCreditsUsd: 7000.0, // 20% bonus
      tokenAllowance: BigInt(0),
      tokenDisplay: '$42,000 USAGE CREDITS',
      windowHours: 0,
      validityDays: 365,
      rateLimitRpm: 1000,
      currency: 'INR',
      tagline: '₹5,000 = $35,000 credits + $7,000 bonus credits ($42,000 total). Enterprise engineering teams.',
      badge: 'ENTERPRISE SCALE',
      featured: false,
      enabled: true,
      status: 'active',
      sortOrder: 13,
      providerScope: 'all',
      featuresJson: JSON.stringify([
        '$35,000 Base + $7,000 Bonus ($42,000 Total)',
        'Maximum 20% Bonus Credits allocation',
        '1,000 RPM high-velocity concurrency',
        'Unlimited model switching (OpenAI, Claude, DeepSeek)',
        '1-Year Validity & SLA Guarantee',
      ]),
    },
  ];

  for (const cp of creditPlans) {
    await prisma.plan.upsert({
      where: { id: cp.id },
      create: cp,
      update: cp,
    });
    console.log(`✓ Upserted credit plan: ${cp.id}`);
  }

  // 7. Seed Token Pack Plans
  const tokenPackPlans = [
    {
      id: 'token_pack_5m',
      slug: 'token-pack-5m',
      name: '5M Token Pack',
      displayName: 'Prepaid 5M Token Pack',
      priceInr: 1499,
      originalPriceInr: 2499,
      planType: 'token',
      tokenAllowance: BigInt(5000000),
      tokenDisplay: '5,000,000 PREPAID TOKENS',
      windowHours: 0,
      validityDays: 90,
      rateLimitRpm: 100,
      currency: 'INR',
      tagline: '5 Million non-expiring prepaid tokens across any supported model family.',
      badge: 'PREPAID TOKEN PACK',
      featured: false,
      enabled: true,
      status: 'active',
      sortOrder: 20,
      providerScope: 'all',
      featuresJson: JSON.stringify([
        '5,000,000 Guaranteed Prepaid Tokens',
        'Valid for 90 Days',
        'Supports OpenAI, Gemini, DeepSeek & Claude',
        'No hourly or rolling-window quota resets',
        'Instant Key Provisioning',
      ]),
    },
    {
      id: 'token_pack_20m',
      slug: 'token-pack-20m',
      name: '20M Token Pack',
      displayName: 'Prepaid 20M Token Pack',
      priceInr: 4999,
      originalPriceInr: 7999,
      planType: 'token',
      tokenAllowance: BigInt(20000000),
      tokenDisplay: '20,000,000 PREPAID TOKENS',
      windowHours: 0,
      validityDays: 180,
      rateLimitRpm: 200,
      currency: 'INR',
      tagline: '20 Million non-expiring prepaid tokens with high concurrency.',
      badge: 'PRO TOKEN PACK',
      featured: true,
      enabled: true,
      status: 'active',
      sortOrder: 21,
      providerScope: 'all',
      featuresJson: JSON.stringify([
        '20,000,000 Guaranteed Prepaid Tokens',
        'Valid for 180 Days (6 Months)',
        'All models (OpenAI, DeepSeek, Claude, Gemini)',
        'Cursor, Windsurf & CLI Ready',
        'Instant Key Provisioning',
      ]),
    },
    {
      id: 'token_pack_50m',
      slug: 'token-pack-50m',
      name: '50M Token Pack',
      displayName: 'Prepaid 50M Token Pack',
      priceInr: 9999,
      originalPriceInr: 17999,
      planType: 'token',
      tokenAllowance: BigInt(50000000),
      tokenDisplay: '50,000,000 PREPAID TOKENS',
      windowHours: 0,
      validityDays: 365,
      rateLimitRpm: 500,
      currency: 'INR',
      tagline: '50 Million non-expiring prepaid tokens for teams & long-running autonomous tasks.',
      badge: 'MEGA TOKEN PACK',
      featured: false,
      enabled: true,
      status: 'active',
      sortOrder: 22,
      providerScope: 'all',
      featuresJson: JSON.stringify([
        '50,000,000 Guaranteed Prepaid Tokens',
        'Full 1-Year Validity (365 Days)',
        'VIP Priority Concurrency & Ingress',
        'All models (o1, GPT-4o, DeepSeek R1, Sonnet 5.5)',
        'Instant Key Provisioning',
      ]),
    },
  ];

  for (const tp of tokenPackPlans) {
    await prisma.plan.upsert({
      where: { id: tp.id },
      create: tp,
      update: tp,
    });
    console.log(`✓ Upserted token pack plan: ${tp.id}`);
  }

  console.log('✅ Multi-Provider & ScaleMax Database Seeding Completed Successfully!');
}

if (process.argv[1] && process.argv[1].includes('seed-scalemax-provider')) {
  seedScaleMaxAndMultiProvider()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
