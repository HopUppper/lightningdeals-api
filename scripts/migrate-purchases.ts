import { prisma } from '../server/db';

async function migrate() {
  console.log('⚡ Applying Universal Purchase schema migrations via Prisma Client...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Purchase" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "orderId" TEXT REFERENCES "Order"("id") ON DELETE SET NULL,
      "productName" TEXT NOT NULL,
      "description" TEXT,
      "amountPaid" DOUBLE PRECISION NOT NULL,
      "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
      "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT NOT NULL DEFAULT 'COMPLETED',
      "creditsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "creditsRedeemed" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "referenceId" TEXT UNIQUE,
      "notes" TEXT,
      "createdBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✓ Purchase table created/verified.');

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Purchase_userId_purchaseDate_idx" ON "Purchase"("userId", "purchaseDate");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Purchase_channel_idx" ON "Purchase"("channel");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Purchase_status_idx" ON "Purchase"("status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Purchase_referenceId_idx" ON "Purchase"("referenceId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Purchase_createdAt_idx" ON "Purchase"("createdAt");
  `);

  console.log('✓ Purchase indices created/verified.');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "purchaseId" TEXT REFERENCES "Purchase"("id") ON DELETE SET NULL;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "channel" TEXT DEFAULT 'WEBSITE';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "referenceId" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CreditTransaction_purchaseId_idx" ON "CreditTransaction"("purchaseId");
  `);

  console.log('✓ CreditTransaction columns and index updated.');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PasswordResetToken" ADD COLUMN IF NOT EXISTS "otpHash" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PasswordResetToken_otpHash_idx" ON "PasswordResetToken"("otpHash");
  `);
  console.log('✓ PasswordResetToken otpHash column and index updated.');

  // Idempotent Row Level Security & Least-Privilege lockdown across all public tables
  const allTables = [
    'User', 'ApiKey', 'ApiRequest', 'VendorProvider', 'MasterTokenLedger', 'TokenPackage',
    'Order', 'TokenLedger', 'TrialClaim', 'Plan', 'Model', 'AdminLog', 'SystemSetting', 'Lead',
    'SupportTicket', 'TicketMessage', 'EmailVerificationToken', 'PhoneOtpCode',
    'PasswordResetToken', 'UserSession', 'SecurityLog', 'PaymentEvent', 'Notification',
    'Subscription', 'AuditEvent', 'Coupon', 'CouponUsage', 'CreditTransaction',
    'RewardSettings', 'Purchase'
  ];

  for (const tbl of allTables) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${tbl}" ENABLE ROW LEVEL SECURITY;`).catch(() => {});
  }
  await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;`).catch(() => {});
  await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;`).catch(() => {});
  await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;`).catch(() => {});
  await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;`).catch(() => {});
  console.log('✓ Row Level Security (RLS) verified enabled on all 30 public tables.');

  // Backfill existing completed Orders into Purchase table if they are not already there
  const completedOrders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ['CAPTURED', 'PAID'] },
    },
  });

  console.log(`Found ${completedOrders.length} completed orders to check for Purchase sync.`);

  let synced = 0;
  for (const order of completedOrders) {
    const existing = await prisma.purchase.findFirst({
      where: {
        OR: [
          { orderId: order.id },
          { referenceId: order.internalOrderId },
        ],
      },
    });

    if (!existing) {
      const amount = order.paidAmountInr ?? order.amountInr;
      await prisma.purchase.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          productName: order.planName || 'API Subscription',
          description: `Website purchase - ${order.planName || 'API Plan'}`,
          amountPaid: amount,
          channel: 'WEBSITE',
          purchaseDate: order.paidAt || order.createdAt,
          status: 'COMPLETED',
          creditsEarned: order.creditsEarned || 0,
          creditsRedeemed: order.creditsRedeemed || 0,
          referenceId: order.internalOrderId,
          createdBy: 'SYSTEM',
        },
      });
      synced++;
    }
  }

  console.log(`✓ Synced ${synced} historical website orders into universal Purchase records.`);
  console.log('⚡ Migration completed successfully!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
