import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Determine authoritative SQLite database path with persistent disk fallback & auto-backup
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))) {
    return process.env.DATABASE_URL;
  }

  const defaultLocalDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const persistentDir = process.env.PERSISTENT_DATA_PATH || '/var/data';
  let targetDbFile = defaultLocalDb;

  // Check for cloud persistent disk (e.g. Render Persistent Disk)
  if (fs.existsSync(persistentDir)) {
    try {
      const persistentDbFile = path.join(persistentDir, 'lightningdeals.db');
      if (fs.existsSync(defaultLocalDb) && !fs.existsSync(persistentDbFile)) {
        fs.copyFileSync(defaultLocalDb, persistentDbFile);
      }
      if (fs.existsSync(persistentDbFile)) {
        targetDbFile = persistentDbFile;
        console.log('✅ Using Render Persistent Disk Database:', persistentDbFile);
      }
    } catch (e) {
      console.warn('⚠️ Could not initialize persistent disk database, falling back to local file:', e);
    }
  }

  // Backup file in system temp dir to survive container process restarts
  const tmpBackupFile = path.join(process.env.TMPDIR || '/tmp', 'lightningdeals_backup.sqlite');

  // Auto-restore from backup if primary database is missing or smaller
  try {
    if (fs.existsSync(tmpBackupFile)) {
      const primarySize = fs.existsSync(targetDbFile) ? fs.statSync(targetDbFile).size : 0;
      const backupSize = fs.statSync(tmpBackupFile).size;
      if (backupSize > primarySize) {
        fs.copyFileSync(tmpBackupFile, targetDbFile);
        console.log(`✅ Automatically restored database state from persistent backup (${backupSize} bytes)`);
      }
    }
  } catch (e) {
    console.warn('⚠️ Auto-restore check notice:', e);
  }

  // Schedule periodic background sync to persistent backup file every 5 seconds
  setInterval(() => {
    try {
      if (fs.existsSync(targetDbFile) && fs.statSync(targetDbFile).size > 0) {
        fs.copyFileSync(targetDbFile, tmpBackupFile);
      }
    } catch (e) {}
  }, 5000);

  return `file:${targetDbFile}`;
}

const activeDbUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = activeDbUrl;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: activeDbUrl,
    },
  },
});

let cachedEncryptionKey: Buffer | null = null;
function getDerivedEncryptionKey(): Buffer {
  if (!cachedEncryptionKey) {
    const secret = process.env.ENCRYPTION_KEY || 'lightningdeals_default_vault_secret';
    cachedEncryptionKey = crypto.scryptSync(secret, 'lightningdeals_salt_2026', 32, { N: 1024, r: 8, p: 1 });
  }
  return cachedEncryptionKey;
}

const IV_LENGTH_GCM = 12; // 96-bit IV for AES-256-GCM

export function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH_GCM);
  const key = getDerivedEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptText(text: string): string {
  if (!text) return '';
  try {
    // Format 1: AES-256-GCM AEAD (gcm:iv:authTag:ciphertext)
    if (text.startsWith('gcm:')) {
      const parts = text.split(':');
      if (parts.length !== 4) return text;
      const [, ivHex, tagHex, cipherHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');
      const encryptedText = Buffer.from(cipherHex, 'hex');
      const key = getDerivedEncryptionKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    // Format 2: Legacy AES-256-CBC backwards compatibility (iv:ciphertext)
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = getDerivedEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    return text;
  }
}

// Convert BigInt to string in JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
