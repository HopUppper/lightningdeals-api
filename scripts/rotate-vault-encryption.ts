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
  let oldKeySecret = process.env.OLD_DATA_ENCRYPTION_KEY || process.env.OLD_ENCRYPTION_KEY || '';
  let newKeySecret = process.env.DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || '';

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

  const isDryRun = args.includes('--dry-run');
  if (isDryRun) {
    console.log('🔍 [DRY-RUN MODE] Pre-flight verification only. No database modifications will be committed.\n');
  }

  // 1. Fetch VendorProvider records
  const providers = await prisma.vendorProvider.findMany({
    where: { masterApiKeyEncrypted: { not: '' } },
    select: { id: true, name: true, slug: true, masterApiKeyEncrypted: true },
  });

  // 2. Fetch ApiKey records with keyEncrypted
  const apiKeys = await prisma.apiKey.findMany({
    where: { keyEncrypted: { not: null } },
    select: { id: true, displayKey: true, keyEncrypted: true },
  });

  // 3. Fetch InventoryItem records
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { dataEncrypted: { not: '' } },
    select: { id: true, displayValue: true, dataEncrypted: true },
  });

  console.log(`Found:`);
  console.log(`  - ${providers.length} VendorProvider credential(s)`);
  console.log(`  - ${apiKeys.length} ApiKey encrypted secret(s)`);
  console.log(`  - ${inventoryItems.length} InventoryItem license(s)\n`);

  const totalRecords = providers.length + apiKeys.length + inventoryItems.length;
  if (totalRecords === 0) {
    console.log('✅ No encrypted records found across all tables to re-encrypt.');
    await prisma.$disconnect();
    process.exit(0);
  }

  // 4. Verify and prepare re-encrypted payloads
  const providerUpdates: { id: string; name: string; newCipher: string }[] = [];
  for (const provider of providers) {
    const rawCipher = provider.masterApiKeyEncrypted;
    const decrypted = decryptTextWithKey(rawCipher, oldKey);
    if (decrypted === null) {
      console.error(`❌ FATAL: Failed to decrypt credentials for provider '${provider.name}' (${provider.id}) using old key.`);
      console.error('   Aborting migration to prevent data loss. Zero database writes performed.');
      process.exit(1);
    }
    const newCipher = encryptGcm(decrypted, newKey);
    const verifyDecrypted = decryptTextWithKey(newCipher, newKey);
    if (verifyDecrypted !== decrypted) {
      console.error(`❌ FATAL: Round-trip verification failed for provider '${provider.name}' (${provider.id}).`);
      process.exit(1);
    }
    providerUpdates.push({ id: provider.id, name: provider.name, newCipher });
    console.log(`✓ Verified VendorProvider: ${provider.name} (${provider.slug})`);
  }

  const apiKeyUpdates: { id: string; displayKey: string; newCipher: string }[] = [];
  for (const key of apiKeys) {
    if (!key.keyEncrypted) continue;
    const decrypted = decryptTextWithKey(key.keyEncrypted, oldKey);
    if (decrypted === null) {
      console.error(`❌ FATAL: Failed to decrypt secret for ApiKey '${key.displayKey}' (${key.id}) using old key.`);
      process.exit(1);
    }
    const newCipher = encryptGcm(decrypted, newKey);
    if (decryptTextWithKey(newCipher, newKey) !== decrypted) {
      console.error(`❌ FATAL: Round-trip verification failed for ApiKey '${key.displayKey}' (${key.id}).`);
      process.exit(1);
    }
    apiKeyUpdates.push({ id: key.id, displayKey: key.displayKey, newCipher });
    console.log(`✓ Verified ApiKey: ${key.displayKey}`);
  }

  const inventoryUpdates: { id: string; displayValue: string; newCipher: string }[] = [];
  for (const item of inventoryItems) {
    const decrypted = decryptTextWithKey(item.dataEncrypted, oldKey);
    if (decrypted === null) {
      console.error(`❌ FATAL: Failed to decrypt InventoryItem '${item.displayValue}' (${item.id}) using old key.`);
      process.exit(1);
    }
    const newCipher = encryptGcm(decrypted, newKey);
    if (decryptTextWithKey(newCipher, newKey) !== decrypted) {
      console.error(`❌ FATAL: Round-trip verification failed for InventoryItem '${item.displayValue}' (${item.id}).`);
      process.exit(1);
    }
    inventoryUpdates.push({ id: item.id, displayValue: item.displayValue, newCipher });
    console.log(`✓ Verified InventoryItem: ${item.displayValue}`);
  }

  if (isDryRun) {
    console.log('\n================================================================');
    console.log(`✅ DRY-RUN COMPLETE: All ${totalRecords} record(s) successfully verified for re-encryption.`);
    console.log('   Zero database modifications committed.');
    console.log('================================================================');
    await prisma.$disconnect();
    process.exit(0);
  }

  // 5. Execute database updates in an atomic Prisma transaction
  console.log(`\nExecuting atomic transaction to update ${totalRecords} record(s)...`);

  await prisma.$transaction([
    ...providerUpdates.map((u) =>
      prisma.vendorProvider.update({
        where: { id: u.id },
        data: { masterApiKeyEncrypted: u.newCipher },
      })
    ),
    ...apiKeyUpdates.map((u) =>
      prisma.apiKey.update({
        where: { id: u.id },
        data: { keyEncrypted: u.newCipher },
      })
    ),
    ...inventoryUpdates.map((u) =>
      prisma.inventoryItem.update({
        where: { id: u.id },
        data: { dataEncrypted: u.newCipher },
      })
    ),
  ]);

  // 6. Record Cryptographic Audit Log
  await recordAuditEvent({
    eventType: 'VAULT_ENCRYPTION_KEY_ROTATED',
    severity: 'HIGH',
    actorType: 'SYSTEM',
    action: 'VAULT_MIGRATION',
    result: 'SUCCESS',
    metadata: {
      migratedProvidersCount: providerUpdates.length,
      migratedApiKeysCount: apiKeyUpdates.length,
      migratedInventoryCount: inventoryUpdates.length,
      totalRecordsMigrated: totalRecords,
      timestamp: new Date().toISOString(),
    },
  });

  console.log('\n================================================================');
  console.log(`✅ SUCCESS: ${totalRecords} record(s) migrated to new encryption key.`);
  console.log('   New ciphertexts successfully written and verified atomically.');
  console.log('================================================================');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
