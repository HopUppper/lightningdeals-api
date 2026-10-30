import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Determine authoritative database path with connection pool tuning & auto-backup
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))) {
    let pgUrl = process.env.DATABASE_URL;
    // Route Supabase pooler through port 6543 (transaction mode) with pgbouncer=true
    // to prevent EMAXCONNSESSION (max clients limited to pool_size: 15 on port 5432)
    if (pgUrl.includes('.pooler.supabase.com:5432')) {
      pgUrl = pgUrl.replace('.pooler.supabase.com:5432', '.pooler.supabase.com:6543');
    }
    if (pgUrl.includes(':6543') && !pgUrl.includes('pgbouncer=true')) {
      const sep = pgUrl.includes('?') ? '&' : '?';
      pgUrl = `${pgUrl}${sep}pgbouncer=true`;
    }
    if (!pgUrl.includes('connection_limit=')) {
      const sep = pgUrl.includes('?') ? '&' : '?';
      pgUrl = `${pgUrl}${sep}connection_limit=10&pool_timeout=30&connect_timeout=15`;
    }
    return pgUrl;
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
  const backupSyncTimer = setInterval(() => {
    try {
      if (fs.existsSync(targetDbFile) && fs.statSync(targetDbFile).size > 0) {
        fs.copyFileSync(targetDbFile, tmpBackupFile);
      }
    } catch (e) {}
  }, 5000);
  if (backupSyncTimer && typeof backupSyncTimer.unref === 'function') {
    backupSyncTimer.unref();
  }

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

export { deriveVaultKey, encryptText, decryptText, isEncrypted, tryDecryptWithKey } from './crypto';


// Convert BigInt to string in JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
