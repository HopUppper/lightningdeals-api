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

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'lightningdeals_secure_encryption_key_32_bytes_long!!'; // Must be 32 chars
const IV_LENGTH = 16;

export function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptText(text: string): string {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
}

// Convert BigInt to string in JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
