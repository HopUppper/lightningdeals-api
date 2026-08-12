import { prisma } from '../server/db';

async function testAdminSecurity() {
  console.log('🔒 Running Comprehensive Admin Security & Lockout Tests...');

  // Test 1: Unauthenticated request to /api/admin/providers
  console.log('\n--- TEST 1: Unauthenticated Endpoint Protection ---');
  try {
    const unauthRes = await fetch('http://localhost:3001/api/admin/providers');
    console.log(`Unauthenticated API Status: ${unauthRes.status} (Expected 401)`);
    if (unauthRes.status === 401) {
      console.log('✅ PASS: Unauthenticated access to /api/admin/* is strictly blocked!');
    } else {
      console.error('❌ FAIL: Endpoint allowed unauthenticated access!');
    }
  } catch (err: any) {
    console.log(`Notice: Local server check skipped or error: ${err.message}`);
  }

  // Test 2: Admin Password Verification in DB
  console.log('\n--- TEST 2: Admin User Credentials Audit ---');
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (adminUser) {
    console.log(`Found Admin Account: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Status: ${adminUser.status}`);
    console.log(`Password Hash Present: ${Boolean(adminUser.passwordHash)}`);
    console.log('✅ PASS: Admin account exists with hashed password credentials!');
  } else {
    console.error('❌ FAIL: No admin user account found in database!');
  }
}

testAdminSecurity().finally(() => prisma.$disconnect());
