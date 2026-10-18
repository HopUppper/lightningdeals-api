import crypto from 'crypto';
import { prisma } from '../server/db';
import { hashPasswordScrypt } from '../server/auth';
import { recordAuditEvent } from '../server/auditLogger';

/**
 * LightningDeals Secure Administrator Provisioning / Password Recovery Tool
 *
 * Usage:
 *   npx tsx scripts/provision-admin.ts --email=<owner@example.com> [--password=<secure-pass>] [--rotate]
 *
 * Rules:
 *   - Never seeds hardcoded default credentials.
 *   - If password is not provided, generates a high-entropy 24-char cryptographic password.
 *   - When --rotate is passed for an existing admin, securely rotates password, invalidates all active sessions,
 *     and updates passwordChangedAt.
 *   - Strictly logs an audit event for accountability.
 */

async function main() {
  const args = process.argv.slice(2);
  let email = '';
  let password = '';
  let rotate = false;

  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      email = arg.split('=')[1].trim().toLowerCase();
    } else if (arg.startsWith('--password=')) {
      password = arg.split('=')[1].trim();
    } else if (arg === '--rotate') {
      rotate = true;
    }
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    console.error('❌ Error: Valid administrator email required.');
    console.error('   Usage: npx tsx scripts/provision-admin.ts --email=owner@example.com [--password=...] [--rotate]');
    process.exit(1);
  }

  // Prevent provisioning of known compromised passwords
  const BANNED_PASSWORDS = new Set(['love9002', '9002', 'admin123', 'password', 'password123']);
  if (password && BANNED_PASSWORDS.has(password)) {
    console.error('❌ Error: Insecure or compromised password provided. Please choose a strong password.');
    process.exit(1);
  }

  // If no password provided, generate cryptographically secure 24-char password
  let wasGenerated = false;
  if (!password) {
    password = crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, 'x').substring(0, 24);
    wasGenerated = true;
  }

  if (password.length < 12) {
    console.error('❌ Error: Administrator password must be at least 12 characters.');
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const passwordHash = hashPasswordScrypt(password);
  const now = new Date();

  if (existingUser) {
    if (!rotate) {
      console.error(`⚠️ Account ${email} already exists.`);
      console.error('   To rotate this administrator password and invalidate existing sessions, run with --rotate:');
      console.error(`   npx tsx scripts/provision-admin.ts --email=${email} --rotate`);
      process.exit(1);
    }

    // Atomic transaction: Rotate existing admin password AND invalidate all active sessions
    const [updatedUser, revoked] = await prisma.$transaction([
      prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          role: 'admin',
          status: 'active',
          passwordChangedAt: now,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.userSession.updateMany({
        where: { userId: existingUser.id },
        data: { isRevoked: true },
      }),
    ]);

    await recordAuditEvent({
      eventType: 'ADMIN_PASSWORD_ROTATED_CLI',
      severity: 'HIGH',
      actorType: 'SYSTEM',
      actorEmail: email,
      adminId: existingUser.id,
      action: 'ADMIN_CREDENTIAL_ROTATION',
      result: 'SUCCESS',
      metadata: {
        method: 'CLI_PROVISION_TOOL',
        revokedSessionsCount: revoked.count,
      },
    });

    console.log('================================================================');
    console.log(`✅ SUCCESS: Administrator password rotated for ${email}`);
    console.log(`   Revoked ${revoked.count} active session(s).`);
    if (wasGenerated) {
      console.log(`   Temporary generated password: [Generated and provided via secure CLI]`);
      console.log(`   >>> ${password} <<<`);
      console.log('   Save this password securely. It will NOT be shown again.');
    } else {
      console.log('   Custom password successfully applied.');
    }
    console.log('================================================================');
  } else {
    // Create new administrator account
    const newAdmin = await prisma.user.create({
      data: {
        name: 'Administrator',
        email,
        passwordHash,
        role: 'admin',
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: now,
        passwordChangedAt: now,
      },
    });

    await recordAuditEvent({
      eventType: 'ADMIN_ACCOUNT_PROVISIONED_CLI',
      severity: 'HIGH',
      actorType: 'SYSTEM',
      actorEmail: email,
      adminId: newAdmin.id,
      action: 'ADMIN_PROVISIONING',
      result: 'SUCCESS',
      metadata: { method: 'CLI_PROVISION_TOOL' },
    });

    console.log('================================================================');
    console.log(`✅ SUCCESS: New administrator account provisioned for ${email}`);
    if (wasGenerated) {
      console.log(`   Generated secure password:`);
      console.log(`   >>> ${password} <<<`);
      console.log('   Save this password securely. It will NOT be shown again.');
    } else {
      console.log('   Custom password successfully configured.');
    }
    console.log('================================================================');
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Provisioning failed:', err);
  process.exit(1);
});
