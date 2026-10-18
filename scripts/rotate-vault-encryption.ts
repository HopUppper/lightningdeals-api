import crypto from 'crypto';
import { prisma } from '../server/db';
import { recordAuditEvent } from '../server/auditLogger';

/**
 * LightningDeals Vault Encryption Key Migration Script
 *
 * Usage:
 *   npx tsx scripts/rotate-vault-encryption.ts --old-key="<old>" --new-key="<new>"
 *   OR with environment variables:
 *   OLD_ENCRYPTION_KEY="<old>" ENCRYPTION_KEY="<new>" npx tsx scripts/rotate-vault-encryption.ts
 *
 * Features:
 *   - Decrypts existing VendorProvider.masterApiKeyEncrypted records with oldKey.
 *   - Re-encrypts with newKey using AES-256-GCM.
 *   - Verifies round-trip decryption before writing to database.
 *   - Executes in an atomic Prisma transaction ($transaction).
 *   - Safe rollback if any record fails decryption or verification.
 */

function deriveKey(secret: string): Buffer {
  return crypto.scryptSync(secret, 'lightningdeals_salt_2026', 32, { N: 1024, r: 8, p: 1 });
}

function encryptGcm(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptTextWithKey(text: string, key: Buffer): string | null {
  try {
    if (text.startsWith('gcm:')) {
      const parts = text.split(':');
      if (parts.length !== 4) return null;
      const [, ivHex, tagHex, cipherHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');
      const encryptedText = Buffer.from(cipherHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    // Legacy CBC support
    const textParts = text.split(':');
    if (textParts.length < 2) return null;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let oldKeySecret = process.env.OLD_ENCRYPTION_KEY || '';
  let newKeySecret = process.env.ENCRYPTION_KEY || '';

  for (const arg of args) {
    if (arg.startsWith('--old-key=')) {
      oldKeySecret = arg.split('=')[1].trim();
    } else if (arg.startsWith('--new-key=')) {
      newKeySecret = arg.split('=')[1].trim();
    }
  }

  // Fallback to default if old key was unconfigured
  if (!oldKeySecret) {
    oldKeySecret = 'lightningdeals_default_vault_secret';
  }

  console.log('================================================================');
  console.log('🔒 LIGHTNINGDEALS VAULT ENCRYPTION KEY MIGRATION');
  console.log('================================================================\n');

  if (!newKeySecret) {
    console.error('❌ Error: New encryption key is mandatory.');
    console.error('   Usage: npx tsx scripts/rotate-vault-encryption.ts --old-key="..." --new-key="..."');
    process.exit(1);
  }

  if (oldKeySecret === newKeySecret) {
    console.error('❌ Error: Old key and new key are identical. Nothing to migrate.');
    process.exit(1);
  }

  const oldKey = deriveKey(oldKeySecret);
  const newKey = deriveKey(newKeySecret);

  // 1. Fetch all providers with non-empty credentials
  const providers = await prisma.vendorProvider.findMany({
    where: {
      masterApiKeyEncrypted: {
        not: '',
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      masterApiKeyEncrypted: true,
    },
  });

  console.log(`Found ${providers.length} provider record(s) with encrypted credentials.\n`);

  if (providers.length === 0) {
    console.log('✅ No provider credentials found to re-encrypt.');
    await prisma.$disconnect();
    process.exit(0);
  }

  // 2. Prepare re-encrypted payloads and verify round-trip
  const updates: { id: string; name: string; newCipher: string }[] = [];

  for (const provider of providers) {
    const rawCipher = provider.masterApiKeyEncrypted;
    const decrypted = decryptTextWithKey(rawCipher, oldKey);

    if (decrypted === null) {
      console.error(`❌ FATAL: Failed to decrypt credentials for provider '${provider.name}' (${provider.id}) using old key.`);
      console.error('   Aborting migration to prevent data loss. Zero database writes performed.');
      process.exit(1);
    }

    // Re-encrypt with new key
    const newCipher = encryptGcm(decrypted, newKey);

    // Verify round-trip decryption
    const verifyDecrypted = decryptTextWithKey(newCipher, newKey);
    if (verifyDecrypted !== decrypted) {
      console.error(`❌ FATAL: Round-trip verification failed for provider '${provider.name}' (${provider.id}).`);
      console.error('   Aborting migration. Zero database writes performed.');
      process.exit(1);
    }

    updates.push({
      id: provider.id,
      name: provider.name,
      newCipher,
    });
    console.log(`✓ Verified re-encryption for provider: ${provider.name} (${provider.slug})`);
  }

  // 3. Execute database updates in an atomic Prisma transaction
  console.log(`\nExecuting atomic transaction to update ${updates.length} record(s)...`);

  await prisma.$transaction(
    updates.map((u) =>
      prisma.vendorProvider.update({
        where: { id: u.id },
        data: { masterApiKeyEncrypted: u.newCipher },
      })
    )
  );

  // 4. Record Audit Log
  await recordAuditEvent({
    eventType: 'VAULT_ENCRYPTION_KEY_ROTATED',
    severity: 'HIGH',
    actorType: 'SYSTEM',
    action: 'VAULT_MIGRATION',
    result: 'SUCCESS',
    metadata: {
      migratedProvidersCount: updates.length,
      providerIds: updates.map((u) => u.id),
      timestamp: new Date().toISOString(),
    },
  });

  console.log('\n================================================================');
  console.log(`✅ SUCCESS: ${updates.length} provider record(s) migrated to new encryption key.`);
  console.log('   New ciphertexts successfully written and verified.');
  console.log('================================================================');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
