import { prisma } from '../server/db';
import { encryptText, decryptText } from '../server/crypto';
import { AUTHORITATIVE_PLANS } from '../server/payments/plans';

async function main() {
  console.log('⚡ Starting ScaleMax Live Production DB Configuration...');

  // 1. Configure VendorProvider for ScaleMax
  const scalemaxCreditKey = process.env.SCALEMAX_CREDIT_API_KEY || 'sm_live_5af4bbe6c3965077f52a56b8b20b6159';
  const scalemaxTokenKey = process.env.SCALEMAX_TOKEN_API_KEY || 'sm_live_94387a770f7f5781b59e4310208392be';
  const scalemaxBaseUrl = process.env.SCALEMAX_BASE_URL || 'https://api.scalemax.pro/v1';

  let scalemaxProvider = await prisma.vendorProvider.findFirst({
    where: {
      OR: [
        { slug: 'scalemax' },
        { name: { contains: 'scalemax', mode: 'insensitive' } },
        { baseUrl: { contains: 'scalemax' } }
      ]
    }
  });

  if (scalemaxProvider) {
    console.log(`Found existing ScaleMax provider (${scalemaxProvider.id}), updating credentials...`);
    scalemaxProvider = await prisma.vendorProvider.update({
      where: { id: scalemaxProvider.id },
      data: {
        name: 'ScaleMax',
        slug: 'scalemax',
        baseUrl: scalemaxBaseUrl,
        status: 'connected',
        creditApiKeyEncrypted: encryptText(scalemaxCreditKey),
        tokenApiKeyEncrypted: encryptText(scalemaxTokenKey),
        masterApiKeyEncrypted: encryptText(scalemaxCreditKey),
        isPrimary: false,
      }
    });
  } else {
    console.log('Creating new ScaleMax provider record...');
    scalemaxProvider = await prisma.vendorProvider.create({
      data: {
        name: 'ScaleMax',
        slug: 'scalemax',
        baseUrl: scalemaxBaseUrl,
        status: 'connected',
        creditApiKeyEncrypted: encryptText(scalemaxCreditKey),
        tokenApiKeyEncrypted: encryptText(scalemaxTokenKey),
        masterApiKeyEncrypted: encryptText(scalemaxCreditKey),
        isPrimary: false,
      }
    });
  }

  console.log(`✅ ScaleMax Provider configured: ID=${scalemaxProvider.id}, status=${scalemaxProvider.status}`);

  // 2. Synchronize and activate full suite of Credit and Token plans
  const plansToSync = [
    { authPlan: AUTHORITATIVE_PLANS.credit_starter, dbId: 'credit_starter' },
    { authPlan: AUTHORITATIVE_PLANS.credit_growth, dbId: 'credit_growth' },
    { authPlan: AUTHORITATIVE_PLANS.credit_pro, dbId: 'credit_pro' },
    { authPlan: AUTHORITATIVE_PLANS.credit_scale, dbId: 'credit_scale' },
    { authPlan: AUTHORITATIVE_PLANS.token_pack_5m, dbId: 'token_pack_5m' },
    { authPlan: AUTHORITATIVE_PLANS.token_pack_20m, dbId: 'token_pack_20m' },
    { authPlan: AUTHORITATIVE_PLANS.token_pack_50m, dbId: 'token_pack_50m' },
  ];

  for (const item of plansToSync) {
    const ap = item.authPlan;
    const existing = await prisma.plan.findUnique({ where: { id: item.dbId } });

    const planData: any = {
      name: ap.name,
      displayName: ap.displayName,
      slug: ap.slug || ap.id,
      tokenAllowance: ap.tokenAllowance,
      tokenDisplay: ap.tokenDisplay,
      windowHours: ap.windowHours,
      validityDays: ap.validityDays,
      rateLimitRpm: ap.rateLimitRpm || 120,
      priceInr: ap.priceInr,
      originalPriceInr: ap.originalPriceInr || null,
      currency: ap.currency,
      tagline: ap.tagline || null,
      badge: ap.badge || null,
      featuresJson: ap.features ? JSON.stringify(ap.features) : null,
      featured: ap.featured,
      enabled: true,
      status: 'active',
      sortOrder: ap.displayOrder,
      planType: ap.planType,
      creditMultiplier: ap.creditMultiplier || null,
      creditAmountUsd: ap.creditAmountUsd || null,
      bonusCreditsUsd: ap.bonusCreditsUsd || null,
      providerScope: ap.providerScope || 'scalemax',
    };

    if (existing) {
      console.log(`Updating and activating existing plan: ${item.dbId}`);
      await prisma.plan.update({
        where: { id: item.dbId },
        data: planData,
      });
    } else {
      console.log(`Creating new plan: ${item.dbId}`);
      await prisma.plan.create({
        data: {
          id: item.dbId,
          ...planData,
        },
      });
    }
    console.log(`✅ Plan ${item.dbId} active & synced (Price: ₹${ap.priceInr})`);
  }

  // 3. Verify All Active Plans
  const activePlans = await prisma.plan.findMany({
    where: { status: 'active', enabled: true },
    orderBy: { sortOrder: 'asc' }
  });

  console.log(`\n🎉 Verification: Found ${activePlans.length} active plans in database:`);
  for (const p of activePlans) {
    console.log(` - [${p.planType || 'window'}] ${p.displayName} (₹${p.priceInr}) - sortOrder: ${p.sortOrder}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
