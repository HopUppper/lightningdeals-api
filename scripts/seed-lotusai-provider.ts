import { prisma } from '../server/db';
import { encryptText } from '../server/crypto';

export async function seedLotusAiProvider() {
  const existing = await prisma.vendorProvider.findFirst({
    where: { slug: 'lotusai' }
  });

  const lotusMasterKey = process.env.LOTUSAI_MASTER_API_KEY || process.env.LOTUSAI_API_KEY || 'sk-lotus-unconfigured-master';

  let providerId = existing?.id;

  if (!existing) {
    const provider = await prisma.vendorProvider.create({
      data: {
        name: 'LotusAI (OpenAI 5H Rolling)',
        slug: 'lotusai',
        providerType: 'openai',
        protocol: 'openai-compatible',
        baseUrl: 'https://api.lotusai.pro/v1',
        masterApiKeyEncrypted: encryptText(lotusMasterKey),
        status: 'connected',
        isPrimary: false,
        isDefault: false,
        priority: 2,
        capacityModel: 'rolling_window',
        windowHours: 5,
        windowAllowance: 25000000n,
        configuredLimitTokens: 25000000n,
        supportedFamiliesJson: JSON.stringify(['openai']),
        capabilitiesJson: JSON.stringify(['chat', 'streaming', 'tools', 'vision', 'responses', 'reasoning']),
        supportedModelsJson: JSON.stringify([
          'gpt-6.1-sol', 'gpt-6-astra', 'gpt-6-sol', 'gpt-6-luna',
          'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5'
        ]),
        notes: 'LotusAI official supplier for OpenAI 5-Hour rolling-window plans (OpusMax partner relationship).',
      }
    });
    providerId = provider.id;
    console.log('✅ Created LotusAI VendorProvider:', provider.id);
  } else {
    console.log('ℹ️ LotusAI VendorProvider already exists:', existing.id);
  }

  // Seed / Upsert the 4 OpenAI 5-Hour Rolling Plans
  const plans = [
    {
      id: 'openai_rolling_7m',
      slug: 'openai_rolling_7m',
      name: 'OpenAI Plus 7M',
      displayName: 'OpenAI Plus 7M (5h Window)',
      tokenAllowance: 7000000n,
      tokenDisplay: '7M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 60,
      priceInr: 1499,
      planType: 'window',
      planCategory: 'openai_max_rolling',
      providerScope: 'lotusai',
      allowedModelFamilies: JSON.stringify(['openai']),
      supplierCostInr: 450.0,
      supplierAllocation: '7M tokens per 5h window',
      tagline: '7 Million tokens continuously refilling every 5 hours for Codex CLI, IDE extensions, and GPT-6.1 Sol.',
      badge: 'OPENAI PLUS',
      featuresJson: JSON.stringify([
        '7,000,000 Tokens every 5 hours',
        'Continuous 5-Hour Rolling Pool Refill',
        'Full GPT-6 & GPT-5.6 Model Lineup',
        '1,050,000 Token Context Window',
        'Codex CLI & IDE Extension Support',
        'Streaming & Tool Calling Enabled',
      ]),
      sortOrder: 15,
      enabled: true,
      featured: false,
    },
    {
      id: 'openai_rolling_25m',
      slug: 'openai_rolling_25m',
      name: 'OpenAI Pro 25M',
      displayName: 'OpenAI Pro 25M (5h Window)',
      tokenAllowance: 25000000n,
      tokenDisplay: '25M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 60,
      priceInr: 3999,
      planType: 'window',
      planCategory: 'openai_max_rolling',
      providerScope: 'lotusai',
      allowedModelFamilies: JSON.stringify(['openai']),
      supplierCostInr: 1200.0,
      supplierAllocation: '25M tokens per 5h window',
      tagline: '25 Million tokens every 5 hours (~3.5x Plus allowance) for long agentic sessions and GPT-6 Astra.',
      badge: 'OPENAI PRO',
      featuresJson: JSON.stringify([
        '25,000,000 Tokens every 5 hours',
        'About 3.5x Plus Headroom',
        'GPT-6 Astra & GPT-6.1 Sol Flagships',
        '1,050,000 Token Context Window',
        'High-Throughput Streaming & Vision',
        'Multi-File Refactors & Deep Reasoning',
      ]),
      sortOrder: 16,
      enabled: true,
      featured: true,
    },
    {
      id: 'openai_rolling_50m',
      slug: 'openai_rolling_50m',
      name: 'OpenAI Ultra 50M',
      displayName: 'OpenAI Ultra 50M (5h Window)',
      tokenAllowance: 50000000n,
      tokenDisplay: '50M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 100,
      priceInr: 7499,
      planType: 'window',
      planCategory: 'openai_max_rolling',
      providerScope: 'lotusai',
      allowedModelFamilies: JSON.stringify(['openai']),
      supplierCostInr: 2400.0,
      supplierAllocation: '50M tokens per 5h window',
      tagline: '50 Million tokens every 5 hours for engineering teams and heavy autonomous agent loops.',
      badge: 'OPENAI ULTRA',
      featuresJson: JSON.stringify([
        '50,000,000 Tokens every 5 hours',
        'High Concurrency & 100 RPM Rate Limit',
        'Maximum Reasoning & Autonomous Agent Depth',
        '1,050,000 Token Context Window',
        'VIP Gateway Ingress Routing',
      ]),
      sortOrder: 17,
      enabled: true,
      featured: false,
    },
    {
      id: 'openai_rolling_100m',
      slug: 'openai_rolling_100m',
      name: 'OpenAI Max 100M',
      displayName: 'OpenAI Max 100M (5h Window)',
      tokenAllowance: 100000000n,
      tokenDisplay: '100M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 120,
      priceInr: 13999,
      planType: 'window',
      planCategory: 'openai_max_rolling',
      providerScope: 'lotusai',
      allowedModelFamilies: JSON.stringify(['openai']),
      supplierCostInr: 4500.0,
      supplierAllocation: '100M tokens per 5h window',
      tagline: '100 Million tokens every 5 hours for enterprise workloads and high-throughput production systems.',
      badge: 'OPENAI MAX',
      featuresJson: JSON.stringify([
        '100,000,000 Tokens every 5 hours',
        'Ultimate Capacity & Maximum Concurrency',
        'Dedicated Upstream LotusAI Ingress',
        '1,050,000 Token Context Window',
        '24/7 Dedicated Support',
      ]),
      sortOrder: 18,
      enabled: true,
      featured: false,
    },
  ];

  for (const p of plans) {
    const pExisting = await prisma.plan.findFirst({ where: { id: p.id } });
    if (!pExisting) {
      await prisma.plan.create({ data: p });
      console.log(`✅ Created plan ${p.id} (${p.displayName})`);
    } else {
      await prisma.plan.update({
        where: { id: p.id },
        data: {
          planCategory: p.planCategory,
          allowedModelFamilies: p.allowedModelFamilies,
          providerScope: p.providerScope,
          featuresJson: p.featuresJson,
          tokenDisplay: p.tokenDisplay,
          enabled: p.enabled,
        },
      });
      console.log(`ℹ️ Updated plan ${p.id}`);
    }
  }

  // Seed / Upsert the 8 LotusAI Models in PostgreSQL Model table
  const lotusModels = [
    {
      modelId: 'gpt-6.1-sol',
      displayName: 'GPT-6.1 Sol',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 32768,
      description: 'Codex flagship recommendation for everyday features, bug fixes, multi-file refactors and agentic loops. Low to max reasoning effort.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: true,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
    {
      modelId: 'gpt-6-astra',
      displayName: 'GPT-6 Astra',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 32768,
      description: 'Maximum depth reasoning model for complex architectural migrations, deep debugging and high-stakes changes.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: true,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
    {
      modelId: 'gpt-6-sol',
      displayName: 'GPT-6 Sol',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 32768,
      description: 'High-speed versatile all-rounder for code reviews, test generation and daily engineering tasks.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: true,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
    {
      modelId: 'gpt-6-luna',
      displayName: 'GPT-6 Luna',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 16384,
      description: 'Ultra-fast low-latency execution model for quick edits, linting, formatting and high-volume CI loops.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: true,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
    {
      modelId: 'gpt-5.6-sol',
      displayName: 'GPT-5.6 Sol',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 16384,
      description: 'Previous-generation balanced everyday model for existing developer workflows.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: false,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
    {
      modelId: 'gpt-5.6-terra',
      displayName: 'GPT-5.6 Terra',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 16384,
      description: 'Steady high-throughput batch and routine task execution model.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: false,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
    {
      modelId: 'gpt-5.6-luna',
      displayName: 'GPT-5.6 Luna',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 16384,
      description: 'Light edits and high-volume background processing.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: false,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
    {
      modelId: 'gpt-5.5',
      displayName: 'GPT-5.5',
      provider: 'OpenAI',
      providerSlug: 'lotusai',
      family: 'openai',
      protocol: 'openai-compatible',
      contextWindow: 1050000,
      maxOutputTokens: 16384,
      description: 'High-consistency reproducible run model for regression suites and pinned prompts.',
      enabled: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
      supportsReasoning: false,
      supportedBillingArchitectures: 'openai_max_rolling,claude_openai_credits,openai_tokens',
      isCustomerAvailable: true,
    },
  ];

  for (const m of lotusModels) {
    const existingModel = await prisma.model.findFirst({ where: { modelId: m.modelId } });
    if (!existingModel) {
      await prisma.model.create({ data: m });
      console.log(`✅ Created model ${m.modelId} (${m.displayName})`);
    } else {
      await prisma.model.update({
        where: { id: existingModel.id },
        data: {
          displayName: m.displayName,
          providerSlug: 'lotusai',
          contextWindow: m.contextWindow,
          description: m.description,
          supportsStreaming: m.supportsStreaming,
          supportsTools: m.supportsTools,
          supportsVision: m.supportsVision,
          supportsReasoning: m.supportsReasoning,
          supportedBillingArchitectures: m.supportedBillingArchitectures,
          isCustomerAvailable: true,
          enabled: true,
        },
      });
      console.log(`ℹ️ Updated model ${m.modelId}`);
    }
  }

  console.log('🎉 LotusAI Provider, Plans, and Models seeded successfully!');
}

seedLotusAiProvider()
  .catch((err) => {
    console.error('Error seeding LotusAI:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
