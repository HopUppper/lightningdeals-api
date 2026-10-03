import { prisma } from '../server/db';

async function testIntegration() {
  console.log('⚡ Testing POST /api/integrations/purchases endpoint...');

  const testUser = await prisma.user.findFirst({ where: { email: 'customer@gmail.com' } });
  if (!testUser) {
    throw new Error('Test user not found');
  }

  const { createUniversalPurchase } = await import('../server/rewards/rewardService');

  // Simulate call from external webhook / WhatsApp API
  const ref = `WA-API-${Date.now()}`;
  const res = await createUniversalPurchase({
    userId: testUser.id,
    productName: 'Canva Pro (1 Year)',
    description: 'Canva Pro purchased via WhatsApp Business automated bot',
    amountPaid: 2000,
    channel: 'WHATSAPP',
    status: 'COMPLETED',
    referenceId: ref,
    createdBy: 'WHATSAPP_INTEGRATION',
  });

  console.log('Result:', {
    success: res.success,
    product: res.purchase.productName,
    creditsAwarded: res.creditsAwarded,
    newBalance: res.newBalance,
    isDuplicate: res.isDuplicate,
  });

  if (res.creditsAwarded !== 200) {
    throw new Error(`Expected 200 credits on ₹2,000 purchase, got ${res.creditsAwarded}`);
  }

  // Idempotency test
  const dup = await createUniversalPurchase({
    userId: testUser.id,
    productName: 'Canva Pro (1 Year)',
    amountPaid: 2000,
    channel: 'WHATSAPP',
    status: 'COMPLETED',
    referenceId: ref,
    createdBy: 'WHATSAPP_INTEGRATION',
  });

  console.log('Duplicate check:', {
    isDuplicate: dup.isDuplicate,
    creditsAwarded: dup.creditsAwarded,
  });

  if (!dup.isDuplicate) {
    throw new Error('Expected duplicate reference to be flagged');
  }

  console.log('✅ Integration API logic tested successfully!');
  process.exit(0);
}

testIntegration().catch((e) => {
  console.error(e);
  process.exit(1);
});
