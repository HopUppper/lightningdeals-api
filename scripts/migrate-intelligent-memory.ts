import { prisma } from '../server/db';

export async function migrateIntelligentMemory() {
  console.log('⚡ Applying Intelligent Memory Architecture schema migration...');

  try {
    // 1. Add enhanced columns to StudioMemory safely
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "normalizedFact" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'automatic';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "sourceConversationId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "lastRetrievedAt" TIMESTAMP(3);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StudioMemory" ADD COLUMN IF NOT EXISTS "metadataJson" TEXT;
    `);

    // 2. Add foreign key for projectId in StudioMemory
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'StudioMemory_projectId_fkey'
        ) THEN
          ALTER TABLE "StudioMemory" ADD CONSTRAINT "StudioMemory_projectId_fkey"
            FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // 3. Add performance indexes for scoped memory retrieval
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudioMemory_userId_type_idx" ON "StudioMemory"("userId", "type");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudioMemory_userId_projectId_idx" ON "StudioMemory"("userId", "projectId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudioMemory_userId_isArchived_idx" ON "StudioMemory"("userId", "isArchived");
    `);

    // 4. Create UserMemorySettings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserMemorySettings" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
        "autoExtractionEnabled" BOOLEAN NOT NULL DEFAULT true,
        "crossConversationRecall" BOOLEAN NOT NULL DEFAULT true,
        "scope" TEXT NOT NULL DEFAULT 'account',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "UserMemorySettings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "UserMemorySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UserMemorySettings_userId_key" ON "UserMemorySettings"("userId");
    `);

    // 5. Create MemoryActivity table for transparent audit log
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MemoryActivity" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "memoryId" TEXT,
        "category" TEXT,
        "factSnippet" TEXT,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "MemoryActivity_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "MemoryActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MemoryActivity_userId_createdAt_idx" ON "MemoryActivity"("userId", "createdAt");
    `);

    // 6. Backfill existing StudioMemory records without data loss
    const existing = await prisma.studioMemory.findMany({
      where: { normalizedFact: null },
      select: { id: true, fact: true, category: true },
    });

    if (existing.length > 0) {
      console.log(`Backfilling normalizedFact and explicit tags for ${existing.length} existing memories...`);
      for (const item of existing) {
        const norm = item.fact.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        // Existing memories were manually created by user: mark as explicit
        await prisma.studioMemory.update({
          where: { id: item.id },
          data: {
            normalizedFact: norm,
            type: item.category === 'Skill' ? 'skill' : 'explicit',
            confidence: 1.0,
            isArchived: false,
          },
        });
      }
      console.log(`✓ Successfully migrated ${existing.length} legacy memories.`);
    }

    console.log('✓ Intelligent Memory Architecture schema migration completed successfully.');
  } catch (err: any) {
    console.error('❌ Intelligent Memory migration failed:', err.message);
    throw err;
  }
}

migrateIntelligentMemory()
  .then(() => {
    console.log('Migration script done.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
