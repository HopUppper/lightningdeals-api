import { prisma } from '../server/db';

export async function migrateAnnualPricingEntitlements() {
  console.log('⚡ Applying Annual Pricing & Subscription Entitlements schema migration...');

  // 1. Plan model additions
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "annualPriceInr" DOUBLE PRECISION;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "annualOriginalPriceInr" DOUBLE PRECISION;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "annualValidityDays" INTEGER DEFAULT 365;
  `);
  console.log('✓ Plan table annual pricing columns verified.');

  // 2. Order model additions
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT DEFAULT 'monthly';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "validityDays" INTEGER DEFAULT 30;
  `);
  console.log('✓ Order table billingPeriod & validityDays columns verified.');

  // 3. Subscription model additions
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT DEFAULT 'monthly';
  `);
  console.log('✓ Subscription table billingPeriod column verified.');

  // 4. VendorProvider model additions
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "vendorSubscriptionStatus" TEXT DEFAULT 'active';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "vendorCurrentPeriodStart" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "vendorCurrentPeriodEnd" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "vendorAutoRenew" BOOLEAN DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "vendorRenewalCount" INTEGER DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "vendorLastRenewedAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "vendorNextRenewalDate" TIMESTAMP(3);
  `);
  console.log('✓ VendorProvider table vendor renewal tracking columns verified.');

  // 5. VendorRenewalEvent table creation
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorRenewalEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "providerId" TEXT NOT NULL REFERENCES "VendorProvider"("id") ON DELETE CASCADE,
      "status" TEXT NOT NULL,
      "periodStart" TIMESTAMP(3) NOT NULL,
      "periodEnd" TIMESTAMP(3) NOT NULL,
      "renewalCost" DOUBLE PRECISION,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "vendorReference" TEXT,
      "failureReason" TEXT,
      "notes" TEXT,
      "initiatedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VendorRenewalEvent_providerId_createdAt_idx" ON "VendorRenewalEvent"("providerId", "createdAt");
  `);
  console.log('✓ VendorRenewalEvent table & indices verified.');

  // 6. Seed/Update default annual pricing for standard plans if not yet set
  const plans = await prisma.plan.findMany();
  for (const p of plans) {
    let annualPrice: number | null = p.annualPriceInr;
    let annualOrigPrice: number | null = p.annualOriginalPriceInr;

    if (!annualPrice && p.priceInr >= 500) {
      // Standard annual pricing: 10 months price (2 months free / ~17% savings)
      // e.g. 2499/mo -> 24990/yr; 5999/mo -> 59990/yr; 8999/mo -> 89990/yr; 16999/mo -> 169990/yr
      annualPrice = Math.round(p.priceInr * 10);
      annualOrigPrice = Math.round((p.originalPriceInr || p.priceInr) * 12);

      await prisma.plan.update({
        where: { id: p.id },
        data: {
          annualPriceInr: annualPrice,
          annualOriginalPriceInr: annualOrigPrice,
          annualValidityDays: 365,
        },
      });
      console.log(`✓ Configured default annual pricing for plan "${p.name}": ₹${annualPrice}/yr (365 days)`);
    }
  }

  console.log('✅ Annual Pricing & Subscription Entitlements migration completed successfully.');
}

if (process.argv[1] && process.argv[1].includes('migrate-annual-pricing-entitlements')) {
  migrateAnnualPricingEntitlements()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration error:', err);
      process.exit(1);
    });
}
