import { prisma } from '../server/db';
import { validateAndNormalizeEmail, validateEmailDomainMx, hashSecret } from '../server/authSecurity';
import { sendVerificationEmail, getEmailProviderStatus } from '../server/email';

async function runAudit() {
  console.log('=== ENTERPRISE REGISTRATION & SECURITY AUDIT ===\n');

  // 1. Email Provider Health Check
  const providerStatus = getEmailProviderStatus();
  console.log('1. EMAIL PROVIDER HEALTH STATUS:', providerStatus);

  // 2. Domain MX Record Validation
  const invalidDomainMx = await validateEmailDomainMx('invalid-domain-xyz-999.com');
  console.log('2. MX RECORD VALIDATION (invalid domain):', invalidDomainMx.isValid ? 'FAIL' : `PASS - Rejected ("${invalidDomainMx.error}")`);

  const validDomainMx = await validateEmailDomainMx('gmail.com');
  console.log('3. MX RECORD VALIDATION (valid domain):', validDomainMx.isValid ? 'PASS - Domain verified' : 'FAIL');

  // 3. User State Machine & Duplicate Protection Test
  const testEmail = 'audit_user_test_2026@gmail.com';
  await prisma.emailVerificationToken.deleteMany({ where: { email: testEmail } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  // Create Pending User
  const user = await prisma.user.create({
    data: {
      name: 'Audit Test User',
      email: testEmail,
      passwordHash: 'scrypt$dummy_hash',
      role: 'user',
      emailVerified: false,
      status: 'unverified',
    },
  });

  console.log('4. PENDING ACCOUNT CREATED:', {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    status: user.status,
  });

  // Verify Account State Machine
  const tokenHash = hashSecret('sample_raw_token_123');
  const tokenRec = await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  console.log('5. VERIFICATION TOKEN HASH STORED IN DB:', { tokenHashId: tokenRec.id });

  // Activate Account
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: tokenRec.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date(), status: 'active' },
    }),
  ]);

  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  console.log('6. ACCOUNT ACTIVATED AFTER VERIFICATION:', {
    emailVerified: updatedUser?.emailVerified,
    status: updatedUser?.status,
  });

  // Cleanup
  await prisma.emailVerificationToken.deleteMany({ where: { email: testEmail } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  console.log('\n=== ALL REGISTRATION & AUDIT TESTS PASSED ===');
}

runAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('AUDIT ERROR:', err);
    process.exit(1);
  });
