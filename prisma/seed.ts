import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding LightningDeals database...');

  await prisma.plan.deleteMany({});
  await prisma.adminLog.deleteMany({});

  await prisma.trialClaim.deleteMany({});
  await prisma.tokenLedger.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.tokenPackage.deleteMany({});
  await prisma.vendorProvider.deleteMany({});
  await prisma.apiRequest.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.model.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.systemSetting.deleteMany({});

  // 2. Initial Administrator User (sidhjain9002@gmail.com / love9002)
  const adminUser = await prisma.user.create({
    data: {
      email: 'sidhjain9002@gmail.com',
      name: 'LightningDeals Owner',
      passwordHash: hashPassword('love9002'),
      role: 'admin',
      emailVerified: true,
      status: 'active',
    },
  });


  // 3. Initial Developer Customer
  const devUser = await prisma.user.create({
    data: {
      email: 'dev@lightningdeals.ai',
      name: 'Rahul Developer',
      passwordHash: hashPassword('dev12345'),
      role: 'user',
      emailVerified: true,
      status: 'active',
    },
  });

  // 4. Default Upstream Vendor Provider
  const vendorProvider = await prisma.vendorProvider.create({
    data: {
      name: 'Anthropic Official Vendor',
      providerType: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      masterApiKeyEncrypted: process.env.ANTHROPIC_API_KEY || '',
      status: 'connected',
      isPrimary: true,
      notes: 'Primary upstream vendor gateway for Claude models.',
    },
  });

  // 5. Token Packages (Claude Rolling Window Allocations)
  const packages = [
    { tokenAmount: BigInt(5000000), priceInr: 299, displayName: 'Claude Max 5x (5M / 5h)', description: 'Ideal for light coding & small projects', sortOrder: 1 },
    { tokenAmount: BigInt(20000000), priceInr: 899, displayName: 'Claude Max 20x (20M / 5h)', description: 'Great for daily coding assistance', sortOrder: 2 },
    { tokenAmount: BigInt(40000000), priceInr: 1699, displayName: 'Claude Max 40x (40M / 5h)', description: 'Popular choice for active developers', sortOrder: 3 },
    { tokenAmount: BigInt(100000000), priceInr: 3999, displayName: 'Claude Max 100x (100M / 5h)', description: 'Best value for heavy IDE power users', featured: true, sortOrder: 4 },
  ];

  for (const pkg of packages) {
    await prisma.tokenPackage.create({ data: pkg });
  }

  // 5b. Default Plan Definitions
  const defaultPlans = [
    { name: 'Claude Max 5x', displayName: 'Claude Max 5x (5M / 5h)', tokenAllowance: BigInt(5000000), windowHours: 5, validityDays: 30, rateLimitRpm: 30, description: '5 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 10x', displayName: 'Claude Max 10x (10M / 5h)', tokenAllowance: BigInt(10000000), windowHours: 5, validityDays: 30, rateLimitRpm: 45, description: '10 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 20x', displayName: 'Claude Max 20x (20M / 5h)', tokenAllowance: BigInt(20000000), windowHours: 5, validityDays: 30, rateLimitRpm: 60, description: '20 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 40x', displayName: 'Claude Max 40x (40M / 5h)', tokenAllowance: BigInt(40000000), windowHours: 5, validityDays: 30, rateLimitRpm: 100, description: '40 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 100x', displayName: 'Claude Max 100x (100M / 5h)', tokenAllowance: BigInt(100000000), windowHours: 5, validityDays: 30, rateLimitRpm: 150, description: '100 Million tokens per 5-hour rolling window' },
    { name: 'Trial Key', displayName: 'Free Trial Key (1M / 5h)', tokenAllowance: BigInt(1000000), windowHours: 5, validityDays: 7, rateLimitRpm: 30, description: '1 Million trial tokens per 5-hour rolling window' },
  ];

  for (const p of defaultPlans) {
    await prisma.plan.create({ data: p });
  }


  // 6. Claude AI Models Catalog Only
  const models = [
    {
      modelId: 'claude-sonnet-5',
      displayName: 'Claude Sonnet 5',
      provider: 'Anthropic',
      description: 'Ideal balance of speed, intelligence, and coding ability.',
      contextWindow: 1000000,
      inputPrice: 3.0,
      outputPrice: 15.0,
    },
    {
      modelId: 'claude-fable-5',
      displayName: 'Claude Fable 5',
      provider: 'Anthropic',
      description: 'Ultra-fast response model optimized for rapid IDE edits.',
      contextWindow: 1000000,
      inputPrice: 0.8,
      outputPrice: 4.0,
    },
    {
      modelId: 'claude-opus-5',
      displayName: 'Claude Opus 5',
      provider: 'Anthropic',
      description: 'Most powerful model for complex systems architecture.',
      contextWindow: 1000000,
      inputPrice: 15.0,
      outputPrice: 75.0,
    },
    {
      modelId: 'claude-3-5-sonnet-20241022',
      displayName: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      description: 'Flagship model for autonomous agentic coding.',
      contextWindow: 1000000,
      inputPrice: 3.0,
      outputPrice: 15.0,
    },
    {
      modelId: 'claude-3-opus-20240229',
      displayName: 'Claude 3 Opus',
      provider: 'Anthropic',
      description: 'Deep reasoning and complex synthesis model.',
      contextWindow: 200000,
      inputPrice: 15.0,
      outputPrice: 75.0,
    },
    {
      modelId: 'claude-3-5-haiku-20241022',
      displayName: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      description: 'Lightweight high-speed completion model.',
      contextWindow: 500000,
      inputPrice: 0.8,
      outputPrice: 4.0,
    },
  ];

  for (const m of models) {
    await prisma.model.create({ data: m });
  }

  // 7. Seed Production API Key (Claude Max 20x)
  const liveKeyRaw = 'ld_live_9f8d7c6b5a4e3f2a1b0c9d8e';
  const liveKeyHash = hashApiKey(liveKeyRaw);

  const liveApiKey = await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      keyPrefix: 'ld_live_',
      keyHash: liveKeyHash,
      displayKey: 'ld_live_9f8d...9d8e',
      name: 'Rahul Production Claude Key',
      type: 'production',
      status: 'active',
      purchasedTokens: BigInt(20000000),
      tokensUsed: BigInt(1420000),
      tokensRemaining: BigInt(18580000),
      rateLimitRpm: 120,
      allowedModels: 'all',
      plan: 'Claude Max 20x',
    },
  });

  // Customer Key (Sagar)
  const sagarKeyRaw = 'ld_live_e80778bbfb8b30776c17758b7ee957119267';
  const sagarKeyHash = hashApiKey(sagarKeyRaw);
  await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      keyPrefix: 'ld_live_',
      keyHash: sagarKeyHash,
      displayKey: 'ld_live_e807...9267',
      name: 'Sagar Production Claude Key',
      type: 'production',
      status: 'active',
      purchasedTokens: BigInt(20000000),
      tokensUsed: BigInt(0),
      tokensRemaining: BigInt(20000000),
      rateLimitRpm: 120,
      allowedModels: 'all',
      plan: 'Claude Max 20x',
    },
  });


  await prisma.tokenLedger.create({
    data: {
      apiKeyId: liveApiKey.id,
      userId: devUser.id,
      amount: BigInt(20000000),
      balanceAfter: BigInt(20000000),
      type: 'PURCHASE',
      reference: 'LD-INIT-SEED',
      notes: 'Claude Max 20x 5h rolling window allocation',
    },
  });

  // 8. Seed Trial API Key (Trial Key)
  const trialKeyRaw = 'ld_trial_7a6b5c4d3e2f1a0b9c8d7e6f';
  const trialKeyHash = hashApiKey(trialKeyRaw);
  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 7);

  const trialApiKey = await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      keyPrefix: 'ld_trial_',
      keyHash: trialKeyHash,
      displayKey: 'ld_trial_7a6b...7e6f',
      name: 'Free Trial Key',
      type: 'trial',
      status: 'active',
      purchasedTokens: BigInt(1000000),
      tokensUsed: BigInt(125000),
      tokensRemaining: BigInt(875000),
      expiresAt: trialExpiry,
      rateLimitRpm: 30,
      allowedModels: 'all',
      plan: 'Trial Key',
    },
  });

  await prisma.tokenLedger.create({
    data: {
      apiKeyId: trialApiKey.id,
      userId: devUser.id,
      amount: BigInt(1000000),
      balanceAfter: BigInt(1000000),
      type: 'TRIAL_GRANT',
      reference: 'LD-TRIAL-GRANT',
      notes: 'Trial Key grant (7 days)',
    },
  });

  console.log('Seeding complete! Initial Admin: sidhjain9002@gmail.com / love9002');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
