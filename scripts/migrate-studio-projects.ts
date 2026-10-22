import { prisma } from '../server/db';

export async function migrateStudioProjects() {
  console.log('⚡ Applying Studio Experience & Projects schema migration...');

  // 1. Create StudioProject table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StudioProject" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "instructions" TEXT,
      "color" TEXT DEFAULT '#8b5cf6',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "StudioProject_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "StudioProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StudioProject_userId_updatedAt_idx" ON "StudioProject"("userId", "updatedAt");
  `);
  console.log('✓ StudioProject table verified.');

  // 2. Add projectId and archived columns to StudioConversation
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "StudioConversation" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "StudioConversation" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StudioConversation_projectId_fkey'
      ) THEN
        ALTER TABLE "StudioConversation" ADD CONSTRAINT "StudioConversation_projectId_fkey"
          FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StudioConversation_userId_projectId_idx" ON "StudioConversation"("userId", "projectId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StudioConversation_userId_archived_idx" ON "StudioConversation"("userId", "archived");
  `);
  console.log('✓ StudioConversation project and archive columns verified.');

  // 3. Add telemetry columns to StudioMessage
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "StudioMessage" ADD COLUMN IF NOT EXISTS "cachedTokens" INTEGER NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "StudioMessage" ADD COLUMN IF NOT EXISTS "reasoningTokens" INTEGER NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "StudioMessage" ADD COLUMN IF NOT EXISTS "firstTokenMs" INTEGER NOT NULL DEFAULT 0;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "StudioMessage" ADD COLUMN IF NOT EXISTS "usageSource" TEXT NOT NULL DEFAULT 'PROVIDER_REPORTED';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "StudioMessage" ADD COLUMN IF NOT EXISTS "costUsd" DOUBLE PRECISION;
  `);
  console.log('✓ StudioMessage telemetry columns verified.');

  console.log('✓ Studio Experience & Projects schema migration completed successfully.');
}

if (process.argv[1]?.includes('migrate-studio-projects')) {
  migrateStudioProjects()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
