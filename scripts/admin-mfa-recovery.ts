import { prisma, encryptText } from '../server/db';
import { getAdminMfaConfig, saveAdminMfaConfig, deleteAdminMfaConfig, generateBackupCodes } from '../server/totp';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const targetEmail = (args[1] || 'sidhjain9002@gmail.com').trim().toLowerCase();

  console.log(`[AdminMfaRecovery] Target Admin: ${targetEmail} | Command: ${command.toUpperCase()}`);

  const user = await prisma.user.findFirst({
    where: { email: targetEmail, role: 'admin' },
  });

  if (!user) {
    console.error(`[AdminMfaRecovery] Error: Admin user with email "${targetEmail}" not found in database.`);
    process.exit(1);
  }

  const mfaConfig = await getAdminMfaConfig(user.id);

  if (command === 'status') {
    if (!mfaConfig || !mfaConfig.enrolled) {
      console.log(`[AdminMfaRecovery] Status: MFA is NOT ENROLLED for ${targetEmail}.`);
    } else {
      const activeBackups = mfaConfig.backupCodes.filter((b) => !b.used).length;
      console.log(`[AdminMfaRecovery] Status: MFA is ACTIVE and ENROLLED for ${targetEmail}.`);
      console.log(`[AdminMfaRecovery] Enrolled At: ${mfaConfig.enrolledAt}`);
      console.log(`[AdminMfaRecovery] Active Unused Backup Codes: ${activeBackups} of ${mfaConfig.backupCodes.length}`);
    }
  } else if (command === 'disable') {
    await deleteAdminMfaConfig(user.id);
    console.log(`[AdminMfaRecovery] SUCCESS: MFA has been DISABLED for ${targetEmail}.`);
    console.log(`[AdminMfaRecovery] The administrator can now log in using standard password authentication.`);
  } else if (command === 'generate-backups') {
    if (!mfaConfig || !mfaConfig.enrolled) {
      console.error(`[AdminMfaRecovery] Error: MFA is not enrolled for ${targetEmail}. Cannot generate backup codes.`);
      process.exit(1);
    }

    const { plaintextCodes, hashedCodes } = generateBackupCodes(8);
    mfaConfig.backupCodes = hashedCodes.map((hash) => ({ hash, used: false }));
    await saveAdminMfaConfig(user.id, mfaConfig);

    console.log(`[AdminMfaRecovery] SUCCESS: 8 new backup recovery codes generated for ${targetEmail}:`);
    plaintextCodes.forEach((code, i) => {
      console.log(`  Code ${i + 1}: ${code}`);
    });
    console.log(`[AdminMfaRecovery] Please securely store these backup codes. Each code can only be used once.`);
  } else {
    console.log(`Usage: npx tsx scripts/admin-mfa-recovery.ts [status|disable|generate-backups] [admin_email]`);
  }
}

main()
  .catch((e) => {
    console.error('[AdminMfaRecovery] Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
