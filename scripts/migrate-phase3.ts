import { prisma } from '../server/db';
import { execSync } from 'child_process';

async function migratePhase3() {
  console.log('⚡ [PHASE 3 DDL] Applying Phase 3 Schema updates to Database...');

  // 1. Order columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fulfillmentNotes" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fulfillmentAttempts" INTEGER NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "lastFulfillmentAttemptAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fulfillmentChannel" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "slaPriority" TEXT NOT NULL DEFAULT 'NORMAL';
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Order_fulfillmentStatus_idx" ON "Order"("fulfillmentStatus");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Order_subscriptionId_idx" ON "Order"("subscriptionId");
  `);
  console.log('✓ Order table updated with fulfillment lifecycle columns.');

  // 2. Subscription columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "durationDays" INTEGER NOT NULL DEFAULT 30;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "renewalCount" INTEGER NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "autoRenewEnabled" BOOLEAN NOT NULL DEFAULT false;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastRenewedAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "remindersSentCount" INTEGER NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "metadata" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Subscription_expiryTime_idx" ON "Subscription"("expiryTime");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
  `);
  console.log('✓ Subscription table updated with lifecycle columns.');

  // 3. Plan columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "fulfillmentType" TEXT NOT NULL DEFAULT 'AUTOMATIC';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "isSubscription" BOOLEAN NOT NULL DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "durationDays" INTEGER NOT NULL DEFAULT 30;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "renewalDurationDays" INTEGER NOT NULL DEFAULT 30;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "autoFulfillEnabled" BOOLEAN NOT NULL DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "manualFulfillEnabled" BOOLEAN NOT NULL DEFAULT false;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "requiresInventory" BOOLEAN NOT NULL DEFAULT false;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "activationInstructions" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "trackExpiry" BOOLEAN NOT NULL DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "renewalRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;
  `);
  console.log('✓ Plan table updated with fulfillment configuration columns.');

  // 4. SubscriptionReminder table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SubscriptionReminder" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"("id") ON DELETE CASCADE,
      "reminderType" TEXT NOT NULL,
      "scheduledFor" TIMESTAMP(3) NOT NULL,
      "sentAt" TIMESTAMP(3),
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "channel" TEXT NOT NULL DEFAULT 'IN_APP',
      "error" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SubscriptionReminder_subscriptionId_reminderType_key" UNIQUE ("subscriptionId", "reminderType")
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SubscriptionReminder_scheduledFor_status_idx" ON "SubscriptionReminder"("scheduledFor", "status");
  `);
  console.log('✓ SubscriptionReminder table created/verified.');

  // 5. InventoryItem table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InventoryItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "planId" TEXT NOT NULL REFERENCES "Plan"("id") ON DELETE CASCADE,
      "sku" TEXT,
      "dataEncrypted" TEXT NOT NULL,
      "displayValue" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
      "assignedOrderId" TEXT,
      "assignedUserId" TEXT,
      "reservedAt" TIMESTAMP(3),
      "usedAt" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "InventoryItem_planId_status_idx" ON "InventoryItem"("planId", "status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "InventoryItem_assignedOrderId_idx" ON "InventoryItem"("assignedOrderId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "InventoryItem_assignedUserId_idx" ON "InventoryItem"("assignedUserId");
  `);
  console.log('✓ InventoryItem table created/verified.');

  // 6. NotificationPreference table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NotificationPreference" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
      "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
      "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
      "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
      "renewalReminders" BOOLEAN NOT NULL DEFAULT true,
      "orderUpdates" BOOLEAN NOT NULL DEFAULT true,
      "marketingUpdates" BOOLEAN NOT NULL DEFAULT false,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NotificationPreference_userId_key" UNIQUE ("userId")
    );
  `);
  console.log('✓ NotificationPreference table created/verified.');

  console.log('⚡ Generating Prisma Client for updated schema...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Phase 3 Schema and Prisma Client ready!');
}

migratePhase3()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Phase 3 migration error:', e);
    process.exit(1);
  });
