import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'lightningdeals_secure_encryption_key_32_bytes_long!!';
const IV_LENGTH = 16;

function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function main() {
  console.log('Seeding LightningDeals database (idempotent production seed)...');

  const existingUserCount = await prisma.user.count();
  const existingVendorCount = await prisma.vendorProvider.count();
  const existingPackageCount = await prisma.tokenPackage.count();

  // ──────────────────────────────────────────────
  // 1. Initial Admin User (ONLY if admin does not exist)
  // ──────────────────────────────────────────────
  const adminEmail = 'sidhjain9002@gmail.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = crypto.createHash('sha256').update('love9002').digest('hex');
    await prisma.user.create({
      data: {
        name: 'LightningDeals Owner',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        status: 'active',
      },
    });
  }

  // ──────────────────────────────────────────────
  // 2. Default Vendor Provider (ONLY if no vendors exist)
  // ──────────────────────────────────────────────
  if (existingVendorCount === 0) {
    const defaultKey = process.env.ANTHROPIC_API_KEY || process.env.SUPPLIER_MASTER_API_KEY || '';
    await prisma.vendorProvider.create({
      data: {
        name: 'Primary Vendor Provider',
        providerType: 'anthropic',
        protocol: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        masterApiKeyEncrypted: defaultKey ? encryptText(defaultKey) : '',
        status: defaultKey ? 'connected' : 'disabled',
        isPrimary: true,
        availableTokens: BigInt(0),
        purchasedTokens: BigInt(0),
        consumedTokens: BigInt(0),
        notes: 'Configure your vendor master key (sm_live_... or sk-ant-...) and top up balance via Admin Panel.',
      },
    });
  }

  // ──────────────────────────────────────────────
  // 3. Token Packages (plan catalog for customer purchases)
  // ──────────────────────────────────────────────
  if (existingPackageCount === 0) {
    const packages = [
      { tokenAmount: BigInt(5000000), priceInr: 299, displayName: 'Claude Max 5x (5M / 5h)', description: 'Ideal for light coding & small projects', sortOrder: 1 },
      { tokenAmount: BigInt(20000000), priceInr: 899, displayName: 'Claude Max 20x (20M / 5h)', description: 'Great for daily coding assistance', sortOrder: 2 },
      { tokenAmount: BigInt(40000000), priceInr: 1699, displayName: 'Claude Max 40x (40M / 5h)', description: 'Popular choice for active developers', sortOrder: 3 },
      { tokenAmount: BigInt(100000000), priceInr: 3999, displayName: 'Claude Max 100x (100M / 5h)', description: 'Best value for heavy IDE power users', featured: true, sortOrder: 4 },
    ];

    for (const pkg of packages) {
      await prisma.tokenPackage.create({ data: pkg });
    }
  }

  // ──────────────────────────────────────────────
  // 4. Plan Definitions (entitlement tiers)
  // ──────────────────────────────────────────────
  const defaultPlans = [
    { name: 'Claude Max 5x', displayName: 'Claude Max 5x (5M / 5h)', tokenAllowance: BigInt(5000000), windowHours: 5, validityDays: 30, rateLimitRpm: 30, description: '5 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 10x', displayName: 'Claude Max 10x (10M / 5h)', tokenAllowance: BigInt(10000000), windowHours: 5, validityDays: 30, rateLimitRpm: 45, description: '10 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 20x', displayName: 'Claude Max 20x (20M / 5h)', tokenAllowance: BigInt(20000000), windowHours: 5, validityDays: 30, rateLimitRpm: 60, description: '20 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 40x', displayName: 'Claude Max 40x (40M / 5h)', tokenAllowance: BigInt(40000000), windowHours: 5, validityDays: 30, rateLimitRpm: 100, description: '40 Million tokens per 5-hour rolling window' },
    { name: 'Claude Max 100x', displayName: 'Claude Max 100x (100M / 5h)', tokenAllowance: BigInt(100000000), windowHours: 5, validityDays: 30, rateLimitRpm: 150, description: '100 Million tokens per 5-hour rolling window' },
    { name: 'Trial Key', displayName: 'Free Trial Key (1M / 5h)', tokenAllowance: BigInt(1000000), windowHours: 5, validityDays: 7, rateLimitRpm: 30, description: '1 Million trial tokens per 5-hour rolling window' },
  ];

  for (const p of defaultPlans) {
    const existingPlan = await prisma.plan.findUnique({ where: { name: p.name } });
    if (!existingPlan) {
      await prisma.plan.create({ data: p });
    }
  }

  // ──────────────────────────────────────────────
  // 5. Claude AI Models Catalog
  // ──────────────────────────────────────────────
  const models = [
    { modelId: 'claude-sonnet-5', displayName: 'Claude Sonnet 5', provider: 'Anthropic', description: 'Ideal balance of speed, intelligence, and coding ability.', contextWindow: 1000000, inputPrice: 3.0, outputPrice: 15.0 },
    { modelId: 'claude-fable-5', displayName: 'Claude Fable 5', provider: 'Anthropic', description: 'Ultra-fast response model optimized for rapid IDE edits.', contextWindow: 1000000, inputPrice: 0.8, outputPrice: 4.0 },
    { modelId: 'claude-opus-5', displayName: 'Claude Opus 5', provider: 'Anthropic', description: 'Most powerful model for complex systems architecture.', contextWindow: 1000000, inputPrice: 15.0, outputPrice: 75.0 },
    { modelId: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Flagship model for autonomous agentic coding.', contextWindow: 1000000, inputPrice: 3.0, outputPrice: 15.0 },
    { modelId: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', provider: 'Anthropic', description: 'Deep reasoning and complex synthesis model.', contextWindow: 200000, inputPrice: 15.0, outputPrice: 75.0 },
    { modelId: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Lightweight high-speed completion model.', contextWindow: 500000, inputPrice: 0.8, outputPrice: 4.0 },
  ];

  for (const m of models) {
    const existingModel = await prisma.model.findUnique({ where: { modelId: m.modelId } });
    if (!existingModel) {
      await prisma.model.create({ data: m });
    }
  }

  console.log('✅ Production idempotent seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
