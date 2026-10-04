import { prisma } from '../server/db';

async function runWhatsAppMigration() {
  console.log('⚡ Starting WhatsApp Commerce & Negotiated Price Database Migration...');

  try {
    // 1. Alter Order table
    console.log('1. Altering Order table with WhatsApp fields...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'WEBSITE';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "priceSource" TEXT NOT NULL DEFAULT 'STANDARD';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "whatsappConversationId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Order_channel_idx" ON "Order"("channel");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Order_whatsappConversationId_idx" ON "Order"("whatsappConversationId");
    `);

    // 2. Create WhatsAppConversation table
    console.log('2. Creating WhatsAppConversation table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WhatsAppConversation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "customerId" TEXT,
        "whatsappNumber" TEXT NOT NULL,
        "customerName" TEXT,
        "status" TEXT NOT NULL DEFAULT 'NEW',
        "currentState" TEXT NOT NULL DEFAULT 'START',
        "currentProductId" TEXT,
        "currentProductName" TEXT,
        "currentOrderId" TEXT,
        "assignedAdminId" TEXT,
        "unreadCount" INTEGER NOT NULL DEFAULT 0,
        "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastMessageSnippet" TEXT,
        "adminNotes" TEXT,
        "metadata" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppConversation_whatsappNumber_idx" ON "WhatsAppConversation"("whatsappNumber");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppConversation_customerId_idx" ON "WhatsAppConversation"("customerId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppConversation_status_idx" ON "WhatsAppConversation"("status");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppConversation_assignedAdminId_idx" ON "WhatsAppConversation"("assignedAdminId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppConversation_lastMessageAt_idx" ON "WhatsAppConversation"("lastMessageAt");
    `);

    // 3. Create WhatsAppMessage table
    console.log('3. Creating WhatsAppMessage table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WhatsAppMessage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "conversationId" TEXT NOT NULL,
        "direction" TEXT NOT NULL,
        "messageType" TEXT NOT NULL DEFAULT 'TEXT',
        "content" TEXT NOT NULL,
        "providerMessageId" TEXT,
        "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT',
        "sentBy" TEXT,
        "senderId" TEXT,
        "metadata" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppMessage_providerMessageId_key" ON "WhatsAppMessage"("providerMessageId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppMessage_conversationId_createdAt_idx" ON "WhatsAppMessage"("conversationId", "createdAt");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppMessage_deliveryStatus_idx" ON "WhatsAppMessage"("deliveryStatus");
    `);

    // 4. Create WhatsAppCustomerIdentity table
    console.log('4. Creating WhatsAppCustomerIdentity table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WhatsAppCustomerIdentity" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "customerId" TEXT NOT NULL,
        "whatsappNumber" TEXT NOT NULL,
        "verified" BOOLEAN NOT NULL DEFAULT true,
        "verifiedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppCustomerIdentity_whatsappNumber_key" ON "WhatsAppCustomerIdentity"("whatsappNumber");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WhatsAppCustomerIdentity_customerId_idx" ON "WhatsAppCustomerIdentity"("customerId");
    `);

    // 5. Create NegotiatedPrice table
    console.log('5. Creating NegotiatedPrice table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NegotiatedPrice" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "customerId" TEXT NOT NULL,
        "whatsappConversationId" TEXT,
        "productId" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'INR',
        "createdBy" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "orderId" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "NegotiatedPrice_orderId_key" ON "NegotiatedPrice"("orderId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NegotiatedPrice_customerId_status_idx" ON "NegotiatedPrice"("customerId", "status");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NegotiatedPrice_productId_idx" ON "NegotiatedPrice"("productId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NegotiatedPrice_whatsappConversationId_idx" ON "NegotiatedPrice"("whatsappConversationId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NegotiatedPrice_createdBy_idx" ON "NegotiatedPrice"("createdBy");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NegotiatedPrice_expiresAt_idx" ON "NegotiatedPrice"("expiresAt");
    `);

    console.log('✅ WhatsApp Commerce & Negotiated Price Database Migration Completed Successfully!');
  } catch (err: any) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runWhatsAppMigration();
