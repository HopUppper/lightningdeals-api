import { prisma } from '../db';

interface CachedKeyEntry {
  keyRecord: any;
  cachedAt: number;
  expiresAt: number;
}

// In-memory Auth and Settings Cache
const KEY_CACHE_TTL_MS = 30000; // 30 seconds TTL
const SETTINGS_CACHE_TTL_MS = 10000; // 10 seconds TTL

const keyCache = new Map<string, CachedKeyEntry>(); // keyHash -> CachedKeyEntry
const keyIdToHash = new Map<string, string>(); // keyId -> keyHash

let cachedGlobalDisabled: { value: boolean; cachedAt: number } | null = null;

// Telemetry metrics
export const authCacheMetrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,
};

/**
 * Retrieve cached global API disabled setting with 10s TTL.
 */
export async function getCachedGlobalApiDisabled(): Promise<boolean> {
  const now = Date.now();
  if (cachedGlobalDisabled && (now - cachedGlobalDisabled.cachedAt < SETTINGS_CACHE_TTL_MS)) {
    return cachedGlobalDisabled.value;
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'global_api_disabled' },
      select: { value: true },
    });
    const isDisabled = setting?.value === 'true';
    cachedGlobalDisabled = { value: isDisabled, cachedAt: now };
    return isDisabled;
  } catch (err) {
    // If DB is momentarily unreachable, default to last known value or false
    return cachedGlobalDisabled ? cachedGlobalDisabled.value : false;
  }
}

/**
 * Retrieve key record from in-memory cache or query PostgreSQL.
 */
export async function getCachedApiKey(keyHash: string): Promise<any | null> {
  const now = Date.now();
  const cached = keyCache.get(keyHash);

  if (cached && (now < cached.expiresAt)) {
    authCacheMetrics.hits++;
    return cached.keyRecord;
  }

  authCacheMetrics.misses++;
  const keyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true, provider: true },
  });

  if (keyRecord) {
    keyCache.set(keyHash, {
      keyRecord,
      cachedAt: now,
      expiresAt: now + KEY_CACHE_TTL_MS,
    });
    keyIdToHash.set(keyRecord.id, keyHash);
  } else {
    // If key not found, ensure any stale cache entry is removed
    keyCache.delete(keyHash);
  }

  return keyRecord;
}

/**
 * Instantly invalidate cache when key is updated, rotated, revoked, or suspended.
 */
export function invalidateKeyCache(keyHashOrId?: string): void {
  authCacheMetrics.invalidations++;
  if (!keyHashOrId) {
    keyCache.clear();
    keyIdToHash.clear();
    cachedGlobalDisabled = null;
    return;
  }

  // Check if argument is keyId
  const hashFromId = keyIdToHash.get(keyHashOrId);
  if (hashFromId) {
    keyCache.delete(hashFromId);
    keyIdToHash.delete(keyHashOrId);
    return;
  }

  // Otherwise assume it's keyHash
  keyCache.delete(keyHashOrId);
  for (const [id, hash] of keyIdToHash.entries()) {
    if (hash === keyHashOrId) {
      keyIdToHash.delete(id);
      break;
    }
  }
}

/**
 * In-place update of cached key balance to avoid cache staleness between DB updates.
 */
export function updateCachedKeyBalance(
  keyId: string,
  update: {
    creditBalanceUsd?: number;
    tokensRemaining?: bigint;
    status?: string;
  }
): void {
  const hash = keyIdToHash.get(keyId);
  if (!hash) return;

  const entry = keyCache.get(hash);
  if (!entry || !entry.keyRecord) return;

  if (update.creditBalanceUsd !== undefined) {
    entry.keyRecord.creditBalanceUsd = update.creditBalanceUsd;
  }
  if (update.tokensRemaining !== undefined) {
    entry.keyRecord.tokensRemaining = update.tokensRemaining;
  }
  if (update.status !== undefined) {
    entry.keyRecord.status = update.status;
  }
}
