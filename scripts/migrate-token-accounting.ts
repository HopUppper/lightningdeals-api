import { prisma } from '../server/db';

export async function migrateTokenAccounting() {
  console.log('⚡ Applying Token Accounting & Provider Discovery schema migration...');

  // 1. ApiRequest additions
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ApiRequest" ADD COLUMN IF NOT EXISTS "cachedTokens" INTEGER DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ApiRequest" ADD COLUMN IF NOT EXISTS "reasoningTokens" INTEGER DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ApiRequest" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ApiRequest_idempotencyKey_idx" ON "ApiRequest"("idempotencyKey");
  `);
  console.log('✓ ApiRequest token metadata and idempotency columns verified.');

  // 2. VendorProvider additions
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "configuredLimitTokens" BIGINT DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveredLimitTokens" BIGINT DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveredConsumedTokens" BIGINT DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveredRemainingTokens" BIGINT DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveredResetAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoverySource" TEXT DEFAULT 'NOT_DISCOVERED';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveryStatus" TEXT DEFAULT 'UNKNOWN';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveryConfidence" TEXT DEFAULT 'UNKNOWN';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "lastDiscoveredAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "lastReconciledAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveryError" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "VendorProvider" ADD COLUMN IF NOT EXISTS "discoveryDetailsJson" TEXT;
  `);
  console.log('✓ VendorProvider capacity discovery columns verified.');

  // 3. TokenReservation table creation
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TokenReservation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "apiKeyId" TEXT,
      "providerId" TEXT,
      "requestId" TEXT NOT NULL UNIQUE,
      "tokens" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "TokenReservation_apiKeyId_status_idx" ON "TokenReservation"("apiKeyId", "status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "TokenReservation_providerId_status_idx" ON "TokenReservation"("providerId", "status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "TokenReservation_expiresAt_idx" ON "TokenReservation"("expiresAt");
  `);
  console.log('✓ TokenReservation table and indexes verified.');

  console.log('✅ Token accounting & provider discovery migration completed successfully.');
}

migrateTokenAccounting()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
