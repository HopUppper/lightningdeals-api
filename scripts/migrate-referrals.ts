import { prisma } from '../server/db';
import crypto from 'crypto';

function generateCleanCode(): string {
  // 8 characters, non-ambiguous uppercase alphanumeric (avoiding 0, O, 1, I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

async function runReferralMigration() {
  console.log('⚡ Starting Referral Engine Database Migration...');

  try {
    // 1. Alter User table
    console.log('1. Altering User table with referralCode column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
    `);

    // 2. Alter CreditTransaction table
    console.log('2. Altering CreditTransaction table with referralId column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "referralId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CreditTransaction_referralId_idx" ON "CreditTransaction"("referralId");
    `);

    // 3. Create Referral table
    console.log('3. Creating Referral table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Referral" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "referrerId" TEXT NOT NULL,
        "referredUserId" TEXT,
        "referralCode" TEXT NOT NULL,
        "referralSource" TEXT DEFAULT 'DIRECT_LINK',
        "status" TEXT NOT NULL DEFAULT 'ATTRIBUTED',
        "riskStatus" TEXT NOT NULL DEFAULT 'NORMAL',
        "riskReason" TEXT,
        "attributionStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "attributionExpiresAt" TIMESTAMP(3) NOT NULL,
        "registrationAt" TIMESTAMP(3),
        "firstPurchaseAt" TIMESTAMP(3),
        "qualifyingOrderId" TEXT,
        "rewardCreditsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "rewardStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "rewardCreditedAt" TIMESTAMP(3),
        "rewardReversedAt" TIMESTAMP(3),
        "reversalReason" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Referral_qualifyingOrderId_fkey" FOREIGN KEY ("qualifyingOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredUserId_key" ON "Referral"("referredUserId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON "Referral"("referrerId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Referral_referralCode_idx" ON "Referral"("referralCode");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Referral_rewardStatus_idx" ON "Referral"("rewardStatus");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Referral_riskStatus_idx" ON "Referral"("riskStatus");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Referral_qualifyingOrderId_idx" ON "Referral"("qualifyingOrderId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Referral_createdAt_idx" ON "Referral"("createdAt");
    `);

    // 4. Create ReferralClick table
    console.log('4. Creating ReferralClick table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReferralClick" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "referralCode" TEXT NOT NULL,
        "referrerId" TEXT NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "landingPage" TEXT,
        "converted" BOOLEAN NOT NULL DEFAULT false,
        "convertedUserId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReferralClick_referralCode_createdAt_idx" ON "ReferralClick"("referralCode", "createdAt");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReferralClick_referrerId_createdAt_idx" ON "ReferralClick"("referrerId", "createdAt");
    `);

    // 5. Create ReferralEvent table
    console.log('5. Creating ReferralEvent table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReferralEvent" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "referralId" TEXT NOT NULL,
        "eventType" TEXT NOT NULL,
        "actorType" TEXT NOT NULL DEFAULT 'SYSTEM',
        "actorId" TEXT,
        "metadata" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReferralEvent_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReferralEvent_referralId_createdAt_idx" ON "ReferralEvent"("referralId", "createdAt");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReferralEvent_eventType_idx" ON "ReferralEvent"("eventType");
    `);

    // 6. Create ReferralSettings table
    console.log('6. Creating ReferralSettings table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReferralSettings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "minPurchaseAmountInr" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
        "attributionWindowDays" INTEGER NOT NULL DEFAULT 30,
        "qualificationRule" TEXT NOT NULL DEFAULT 'FIRST_PURCHASE_ONLY',
        "rewardMethod" TEXT NOT NULL DEFAULT 'MATCH_PURCHASE_REWARD',
        "customPercentage" DOUBLE PRECISION DEFAULT 10.0,
        "customFixedAmount" DOUBLE PRECISION DEFAULT 100.0,
        "maxRewardPerOrder" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
        "allowExistingCustomerWithoutPurchase" BOOLEAN NOT NULL DEFAULT true,
        "firstAttributionWins" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default settings row if not present
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ReferralSettings" (
        "id", "enabled", "minPurchaseAmountInr", "attributionWindowDays",
        "qualificationRule", "rewardMethod", "maxRewardPerOrder",
        "allowExistingCustomerWithoutPurchase", "firstAttributionWins",
        "createdAt", "updatedAt"
      ) VALUES (
        'default', true, 500.0, 30,
        'FIRST_PURCHASE_ONLY', 'MATCH_PURCHASE_REWARD', 500.0,
        true, true,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // 7. Backfill unique referralCode for all existing Users
    console.log('7. Backfilling unique referralCode for all existing Users...');
    const usersWithoutCode: any = await prisma.$queryRawUnsafe(`
      SELECT "id", "email" FROM "User" WHERE "referralCode" IS NULL;
    `);

    console.log(`Found ${usersWithoutCode.length} users needing referral codes.`);
    for (const u of usersWithoutCode) {
      let assigned = false;
      let attempts = 0;
      while (!assigned && attempts < 10) {
        attempts++;
        const candidate = generateCleanCode();
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE "User" SET "referralCode" = $1 WHERE "id" = $2;`,
            candidate,
            u.id
          );
          assigned = true;
        } catch (e: any) {
          if (!e.message?.includes('unique') && !e.message?.includes('duplicate')) throw e;
        }
      }
    }

    console.log('✅ Referral System Database Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runReferralMigration();
