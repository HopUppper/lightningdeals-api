import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function getDerivedEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'lightningdeals_default_vault_secret';
  return crypto.scryptSync(secret, 'lightningdeals_salt_2026', 32);
}

const IV_LENGTH = 16;

function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getDerivedEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function main() {
  console.log('Seeding LightningDeals database (idempotent production seed)...');

  const existingUserCount = await prisma.user.count();
  const existingVendorCount = await prisma.vendorProvider.count();
  const existingPackageCount = await prisma.tokenPackage.count();

  // ──────────────────────────────────────────────
  // 1. Initial Admin User Provisioning (Secure, Non-Default)
  // ──────────────────────────────────────────────
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });

  const envAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const envAdminPass = process.env.INITIAL_ADMIN_PASSWORD?.trim();

  if (!existingAdmin) {
    if (envAdminEmail && envAdminPass) {
      if (envAdminPass.length < 12) {
        throw new Error('INITIAL_ADMIN_PASSWORD must be at least 12 characters.');
      }
      const passwordHash = hashPasswordScrypt(envAdminPass);
      await prisma.user.create({
        data: {
          name: 'LightningDeals Administrator',
          email: envAdminEmail,
          passwordHash,
          role: 'admin',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: 'active',
          passwordChangedAt: new Date(),
        },
      });
      console.log(`✅ Provisioned initial administrator (${envAdminEmail}) via environment configuration.`);
    } else {
      console.log('⚠️ [SECURITY NOTICE] No administrator account currently exists in database.');
      console.log('   Run: npx tsx scripts/provision-admin.ts --email=<owner@domain.com> to provision securely.');
    }
  } else {
    console.log('ℹ️ Administrator account exists. Preserving existing administrator credentials.');
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
  // 4. Plan Definitions (authoritative entitlement tiers)
  // ──────────────────────────────────────────────
  const defaultPlans = [
    {
      id: 'pro',
      slug: 'pro',
      name: 'PRO',
      displayName: 'PRO (5M / 5h Window)',
      tokenAllowance: BigInt(5000000),
      tokenDisplay: '5M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 100,
      priceInr: 2499,
      originalPriceInr: 3499,
      currency: 'INR',
      tagline: 'High-performance 5M token capacity with full access to all latest Claude models',
      badge: 'STARTER CHOICE',
      featuresJson: JSON.stringify([
        '5,000,000 Tokens / 5h Window',
        '30-Day Fixed Validity',
        'Full Access to All Claude Models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5)',
        'Sub-50ms Gateway Routing',
        'Instant Automated Delivery',
      ]),
      featured: false,
      enabled: true,
      sortOrder: 1,
    },
    {
      id: 'max',
      slug: 'max',
      name: 'MAX',
      displayName: 'MAX (20M / 5h Window)',
      tokenAllowance: BigInt(20000000),
      tokenDisplay: '20M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 100,
      priceInr: 5999,
      originalPriceInr: 22999,
      currency: 'INR',
      tagline: 'Best value 20M token capacity with full access to all latest Claude models',
      badge: 'MOST POPULAR',
      featuresJson: JSON.stringify([
        '20,000,000 Tokens / 5h Window',
        '30-Day Fixed Validity',
        'Full Access to All Claude Models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5)',
        'Cursor, Windsurf & CLI Ready',
        'Instant Automated Delivery',
      ]),
      featured: true,
      enabled: true,
      sortOrder: 2,
    },
    {
      id: 'ultra',
      slug: 'ultra',
      name: 'ULTRA',
      displayName: 'ULTRA (40M / 5h Window)',
      tokenAllowance: BigInt(40000000),
      tokenDisplay: '40M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 100,
      priceInr: 8999,
      originalPriceInr: 12999,
      currency: 'INR',
      tagline: 'Heavy-duty 40M token capacity with full access to all latest Claude models',
      badge: 'BEST VALUE',
      featuresJson: JSON.stringify([
        '40,000,000 Tokens / 5h Window',
        '30-Day Fixed Validity',
        'Max Concurrency & Throughput',
        'All Top Claude Opus 5, Fable 5 & Sonnet 5 Models',
        'VIP Priority Support',
      ]),
      featured: false,
      enabled: true,
      sortOrder: 3,
    },
  ];

  for (const p of defaultPlans) {
    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [{ id: p.id }, { slug: p.slug }, { name: p.name }],
      },
    });
    if (!existingPlan) {
      await prisma.plan.create({ data: p });
    } else {
      // Preserve existing prices set by admin in the admin panel
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          featuresJson: existingPlan.featuresJson || p.featuresJson,
          tagline: existingPlan.tagline || p.tagline,
          priceInr: existingPlan.priceInr ?? p.priceInr,
          originalPriceInr: existingPlan.originalPriceInr !== null && existingPlan.originalPriceInr !== undefined ? existingPlan.originalPriceInr : p.originalPriceInr,
          annualPriceInr: existingPlan.annualPriceInr !== null && existingPlan.annualPriceInr !== undefined ? existingPlan.annualPriceInr : p.annualPriceInr,
          annualOriginalPriceInr: existingPlan.annualOriginalPriceInr !== null && existingPlan.annualOriginalPriceInr !== undefined ? existingPlan.annualOriginalPriceInr : p.annualOriginalPriceInr,
          sortOrder: existingPlan.sortOrder ?? p.sortOrder,
          tokenDisplay: existingPlan.tokenDisplay || p.tokenDisplay,
          displayName: existingPlan.displayName || p.displayName,
          badge: existingPlan.badge || p.badge,
        },
      });
    }
  }

  // ──────────────────────────────────────────────
  // 5. Claude AI Models Catalog
  // ──────────────────────────────────────────────
  const models = [
    { modelId: 'claude-sonnet-5', displayName: 'Claude Sonnet 5', provider: 'Anthropic', description: 'Ideal balance of speed, intelligence, and coding ability.', contextWindow: 1000000, inputPrice: 3.0, outputPrice: 15.0 },
    { modelId: 'claude-fable-5', displayName: 'Claude Fable 5', provider: 'Anthropic', description: 'Ultra-fast response model optimized for rapid IDE edits.', contextWindow: 1000000, inputPrice: 0.8, outputPrice: 4.0 },
    { modelId: 'claude-opus-5', displayName: 'Claude Opus 5', provider: 'Anthropic', description: 'Most powerful model for complex systems architecture.', contextWindow: 1000000, inputPrice: 15.0, outputPrice: 75.0 },
    { modelId: 'claude-opus-5.5', displayName: 'Claude Opus 5.5', provider: 'Anthropic', description: 'Deep reasoning, math, and complex synthesis model.', contextWindow: 1000000, inputPrice: 15.0, outputPrice: 75.0 },
    { modelId: 'claude-sonnet-5.5', displayName: 'Claude Sonnet 5.5', provider: 'Anthropic', description: 'Next-gen flagship model for autonomous agentic coding.', contextWindow: 1000000, inputPrice: 3.0, outputPrice: 15.0 },
    { modelId: 'claude-haiku-5.5', displayName: 'Claude Haiku 5.5', provider: 'Anthropic', description: 'Lightweight ultra-high-speed completion model.', contextWindow: 500000, inputPrice: 0.8, outputPrice: 4.0 },
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
