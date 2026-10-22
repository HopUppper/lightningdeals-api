import { prisma } from '../db';

// Fast in-memory cache for ultra-low latency gateway routing
interface MemoryReservation {
  apiKeyId?: string;
  providerId?: string;
  tokens: number;
  expiresAtMs: number;
}
const memoryReservations = new Map<string, MemoryReservation>();

/**
 * Sweeps expired reservations from memory and database.
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const nowMs = Date.now();
  for (const [reqId, res] of memoryReservations.entries()) {
    if (res.expiresAtMs <= nowMs) {
      memoryReservations.delete(reqId);
    }
  }

  try {
    const expired = await prisma.tokenReservation.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date(nowMs) },
      },
      data: { status: 'EXPIRED' },
    });
    return expired.count;
  } catch (err) {
    // Non-fatal if DB is temporarily unreachable
    return 0;
  }
}

/**
 * Creates a concurrent token reservation before forwarding to upstream.
 */
export async function reserveTokens({
  apiKeyId,
  providerId,
  requestId,
  estimatedTokens,
  ttlSeconds = 300, // 5 minute default TTL
}: {
  apiKeyId?: string;
  providerId?: string;
  requestId: string;
  estimatedTokens: number;
  ttlSeconds?: number;
}): Promise<boolean> {
  if (estimatedTokens <= 0) return true;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  // 1. Fast in-memory registration
  memoryReservations.set(requestId, {
    apiKeyId,
    providerId,
    tokens: estimatedTokens,
    expiresAtMs: expiresAt.getTime(),
  });

  // 2. Persist to DB for durability across restarts
  try {
    await prisma.tokenReservation.upsert({
      where: { requestId },
      create: {
        requestId,
        apiKeyId,
        providerId,
        tokens: estimatedTokens,
        status: 'ACTIVE',
        expiresAt,
      },
      update: {
        tokens: estimatedTokens,
        status: 'ACTIVE',
        expiresAt,
      },
    });
  } catch (err) {
    // If DB write fails, memory reservation still protects the gateway process
    console.warn(`[Reservation] DB write failed for ${requestId}:`, err);
  }

  return true;
}

/**
 * Settles reservation upon successful upstream response with actual token count.
 */
export async function settleReservation(requestId: string): Promise<void> {
  memoryReservations.delete(requestId);

  try {
    await prisma.tokenReservation.updateMany({
      where: { requestId, status: 'ACTIVE' },
      data: { status: 'SETTLED' },
    });
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Releases reservation on request failure, cancellation, or abort.
 */
export async function releaseReservation(requestId: string): Promise<void> {
  memoryReservations.delete(requestId);

  try {
    await prisma.tokenReservation.updateMany({
      where: { requestId, status: 'ACTIVE' },
      data: { status: 'RELEASED' },
    });
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Returns sum of active reserved tokens for a customer API key.
 */
export async function getActiveCustomerReservations(apiKeyId: string): Promise<number> {
  const nowMs = Date.now();
  let memSum = 0;
  for (const [, res] of memoryReservations.entries()) {
    if (res.apiKeyId === apiKeyId && res.expiresAtMs > nowMs) {
      memSum += res.tokens;
    }
  }

  return memSum;
}

/**
 * Returns sum of active reserved tokens for an upstream vendor provider.
 */
export async function getActiveMasterReservations(providerId: string): Promise<number> {
  const nowMs = Date.now();
  let memSum = 0;
  for (const [, res] of memoryReservations.entries()) {
    if (res.providerId === providerId && res.expiresAtMs > nowMs) {
      memSum += res.tokens;
    }
  }

  return memSum;
}
