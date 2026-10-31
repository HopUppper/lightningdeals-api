/**
 * Admin Pricing Persistence Verification Script
 * Validates dynamic pricing updates, persistence in DB, public reflection on /api/checkout/plans,
 * and seamless restoration to pristine values.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('=== ADMIN PRICING PERSISTENCE TEST ===\n');

  // 1. Admin Login
  const loginRes = await fetch('http://localhost:3001/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa_e2e_admin@lightningapi.pro', password: 'LightningAdmin!2026Pass' })
  });
  const { token: adminToken } = await loginRes.json();
  if (!adminToken) throw new Error('Admin login failed');
  console.log('1. Admin authenticated successfully.');

  // 2. Identify test plan & original values
  const plan = await prisma.plan.findFirst({
    where: { id: 'credit_starter' }
  });
  if (!plan) throw new Error('Plan credit_starter not found');
  const originalPriceInr = plan.priceInr;
  const originalPriceUsd = plan.priceUsd;
  console.log(`2. Baseline Plan '${plan.name}' priceInr: ${originalPriceInr}, priceUsd: ${originalPriceUsd}`);

  // 3. Controlled modification via Admin API
  const newPriceInr = 120;
  console.log(`3. Updating price to ${newPriceInr} via PUT /api/admin/plans-catalog/${plan.id}...`);
  const updateRes = await fetch(`http://localhost:3001/api/admin/plans-catalog/${plan.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      priceInr: newPriceInr,
      displayName: plan.displayName,
      tagline: plan.tagline || ''
    })
  });
  const updateData = await updateRes.json();
  console.log('   Update response status:', updateRes.status, 'success:', updateData.success);

  // 4. Verify DB persistence directly
  const dbUpdated = await prisma.plan.findUnique({ where: { id: plan.id } });
  console.log(`4. Direct DB check priceInr: ${dbUpdated.priceInr} (expected: ${newPriceInr})`);
  const dbPersisted = dbUpdated.priceInr === newPriceInr;

  // 5. Verify Public Checkout API reflects new price immediately
  const publicPlansRes = await fetch('http://localhost:3001/api/checkout/plans');
  const publicPlansData = await publicPlansRes.json();
  const publicPlan = publicPlansData.plans?.find(p => p.id === plan.id);
  console.log(`5. Public /api/checkout/plans check priceInr: ${publicPlan?.priceInr} (expected: ${newPriceInr})`);
  const publicReflected = publicPlan?.priceInr === newPriceInr;

  // 6. Restore original price via Admin API
  console.log(`6. Restoring original price to ${originalPriceInr}...`);
  const restoreRes = await fetch(`http://localhost:3001/api/admin/plans-catalog/${plan.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      priceInr: originalPriceInr,
      displayName: plan.displayName,
      tagline: plan.tagline || ''
    })
  });
  const restoreData = await restoreRes.json();
  console.log('   Restore response status:', restoreRes.status, 'success:', restoreData.success);

  // 7. Verify Pristine Restoration
  const dbRestored = await prisma.plan.findUnique({ where: { id: plan.id } });
  const restoredPublicRes = await fetch('http://localhost:3001/api/checkout/plans');
  const restoredPublicData = await restoredPublicRes.json();
  const restoredPublicPlan = restoredPublicData.plans?.find(p => p.id === plan.id);

  const restoredDbOk = dbRestored.priceInr === originalPriceInr;
  const restoredPublicOk = restoredPublicPlan?.priceInr === originalPriceInr;
  console.log(`7. Restoration DB price: ${dbRestored.priceInr}, Public price: ${restoredPublicPlan?.priceInr}`);

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Admin Modification Success:   ', updateData.success ? '✅ PASS' : '❌ FAIL');
  console.log('Database Persistence:          ', dbPersisted ? '✅ PASS' : '❌ FAIL');
  console.log('Public API Cache Invalidation: ', publicReflected ? '✅ PASS' : '❌ FAIL');
  console.log('Pristine Restoration:          ', (restoredDbOk && restoredPublicOk) ? '✅ PASS' : '❌ FAIL');

  await prisma.$disconnect();
}

runTest().catch(console.error);
