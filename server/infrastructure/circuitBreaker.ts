import { prisma } from '../db';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Consecutive failures to trip breaker (default: 5)
  recoverySeconds?: number;  // Cool-down seconds before half-open probe (default: 30)
  halfOpenProbes?: number;   // Successful probes to close breaker (default: 2)
}

export interface BreakerStatus {
  key: string;
  state: CircuitState;
  failureCount: number;
  consecutiveFailures: number;
  successCount: number;
  lastFailureAt: Date | null;
  lastSuccessAt: Date | null;
  openedAt: Date | null;
  nextProbeAt: Date | null;
  lastErrorMessage: string | null;
}

// In-memory micro-cache for zero-overhead hot path lookups
const inMemoryBreakers = new Map<string, BreakerStatus>();

/**
 * Normalises circuit breaker key for provider and model
 */
export function buildBreakerKey(providerSlug: string, modelId: string): string {
  const p = (providerSlug || 'unknown').toLowerCase().trim();
  const m = (modelId || 'all').toLowerCase().trim();
  return `${p}:${m}`;
}

/**
 * Calculates exponential backoff sleep with full jitter to prevent retry storms
 */
export function calculateExponentialBackoffJitter(
  attempt: number,
  baseMs: number = 300,
  maxMs: number = 5000
): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // Full jitter: random between 0 and exponential
  return Math.floor(Math.random() * exponential);
}

/**
 * Extracts Retry-After header delay in seconds (supports delta-seconds and HTTP date)
 */
export function parseRetryAfterHeader(headerValue?: string | null): number | null {
  if (!headerValue || typeof headerValue !== 'string') return null;
  const trimmed = headerValue.trim();

  // Case 1: Delta-seconds integer
  const seconds = parseInt(trimmed, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return Math.min(300, seconds); // Cap at 5 minutes
  }

  // Case 2: HTTP-date format
  const date = Date.parse(trimmed);
  if (!isNaN(date)) {
    const diffSeconds = Math.max(0, Math.ceil((date - Date.now()) / 1000));
    return Math.min(300, diffSeconds);
  }

  return null;
}

/**
 * Fast in-memory check if circuit breaker allows execution
 */
export function isCircuitOpen(key: string): { isOpen: boolean; retryAfterSeconds?: number; state: CircuitState } {
  const breaker = inMemoryBreakers.get(key);
  if (!breaker || breaker.state === 'CLOSED') {
    return { isOpen: false, state: 'CLOSED' };
  }

  const now = Date.now();

  // If OPEN, check if recovery cool-down has elapsed to enter HALF_OPEN probe state
  if (breaker.state === 'OPEN') {
    if (breaker.nextProbeAt && now >= breaker.nextProbeAt.getTime()) {
      breaker.state = 'HALF_OPEN';
      return { isOpen: false, state: 'HALF_OPEN' };
    }
    const remainingMs = breaker.nextProbeAt ? Math.max(1000, breaker.nextProbeAt.getTime() - now) : 30000;
    return {
      isOpen: true,
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
      state: 'OPEN',
    };
  }

  // If HALF_OPEN, permit probe traffic
  return { isOpen: false, state: 'HALF_OPEN' };
}

/**
 * Records a successful upstream call, recovering breaker if in HALF_OPEN
 */
export async function recordCircuitSuccess(key: string, options: CircuitBreakerOptions = {}): Promise<void> {
  const probesNeeded = options.halfOpenProbes || 2;
  let breaker = inMemoryBreakers.get(key);

  if (!breaker) {
    breaker = {
      key,
      state: 'CLOSED',
      failureCount: 0,
      consecutiveFailures: 0,
      successCount: 1,
      lastFailureAt: null,
      lastSuccessAt: new Date(),
      openedAt: null,
      nextProbeAt: null,
      lastErrorMessage: null,
    };
    inMemoryBreakers.set(key, breaker);
    return;
  }

  breaker.lastSuccessAt = new Date();
  breaker.consecutiveFailures = 0;

  if (breaker.state === 'HALF_OPEN') {
    breaker.successCount++;
    if (breaker.successCount >= probesNeeded) {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.openedAt = null;
      breaker.nextProbeAt = null;
      breaker.lastErrorMessage = null;

      // Asynchronously persist state to database
      prisma.circuitBreakerRecord.upsert({
        where: { key },
        create: {
          key,
          state: 'CLOSED',
          failureCount: 0,
          successCount: breaker.successCount,
          consecutiveFailures: 0,
          lastSuccessAt: breaker.lastSuccessAt,
        },
        update: {
          state: 'CLOSED',
          failureCount: 0,
          successCount: breaker.successCount,
          consecutiveFailures: 0,
          lastSuccessAt: breaker.lastSuccessAt,
          openedAt: null,
          nextProbeAt: null,
          lastErrorMessage: null,
        },
      }).catch(() => {});
    }
  } else {
    breaker.successCount++;
  }
}

/**
 * Records an upstream failure, tripping breaker if threshold is reached
 */
export async function recordCircuitFailure(
  key: string,
  error: Error | string,
  retryAfterSeconds?: number | null,
  options: CircuitBreakerOptions = {}
): Promise<{ state: CircuitState; opened: boolean }> {
  const failureThreshold = options.failureThreshold || 5;
  const recoverySeconds = options.recoverySeconds || 30;
  const errMsg = typeof error === 'string' ? error : error?.message || 'Unknown upstream failure';

  let breaker = inMemoryBreakers.get(key);
  if (!breaker) {
    breaker = {
      key,
      state: 'CLOSED',
      failureCount: 1,
      consecutiveFailures: 1,
      successCount: 0,
      lastFailureAt: new Date(),
      lastSuccessAt: null,
      openedAt: null,
      nextProbeAt: null,
      lastErrorMessage: errMsg,
    };
    inMemoryBreakers.set(key, breaker);
  } else {
    breaker.failureCount++;
    breaker.consecutiveFailures++;
    breaker.lastFailureAt = new Date();
    breaker.lastErrorMessage = errMsg;
  }

  let newlyOpened = false;

  // If in HALF_OPEN, any failure immediately re-opens the breaker
  if (breaker.state === 'HALF_OPEN') {
    breaker.state = 'OPEN';
    breaker.openedAt = new Date();
    const probeDelay = retryAfterSeconds ? retryAfterSeconds * 1000 : recoverySeconds * 1000;
    breaker.nextProbeAt = new Date(Date.now() + probeDelay);
    newlyOpened = true;
  } else if (breaker.consecutiveFailures >= failureThreshold) {
    // Trip breaker from CLOSED to OPEN
    breaker.state = 'OPEN';
    breaker.openedAt = new Date();
    const probeDelay = retryAfterSeconds ? retryAfterSeconds * 1000 : recoverySeconds * 1000;
    breaker.nextProbeAt = new Date(Date.now() + probeDelay);
    newlyOpened = true;
  }

  if (newlyOpened) {
    // Persist breaker opening to database
    prisma.circuitBreakerRecord.upsert({
      where: { key },
      create: {
        key,
        state: 'OPEN',
        failureCount: breaker.failureCount,
        consecutiveFailures: breaker.consecutiveFailures,
        lastFailureAt: breaker.lastFailureAt,
        openedAt: breaker.openedAt,
        nextProbeAt: breaker.nextProbeAt,
        lastErrorMessage: errMsg,
      },
      update: {
        state: 'OPEN',
        failureCount: breaker.failureCount,
        consecutiveFailures: breaker.consecutiveFailures,
        lastFailureAt: breaker.lastFailureAt,
        openedAt: breaker.openedAt,
        nextProbeAt: breaker.nextProbeAt,
        lastErrorMessage: errMsg,
      },
    }).catch(() => {});
  }

  return { state: breaker.state, opened: newlyOpened };
}

/**
 * Manually trips a circuit breaker (Admin action)
 */
export async function tripCircuitBreaker(key: string, reason: string = 'Manual administrative trip'): Promise<void> {
  const breaker: BreakerStatus = {
    key,
    state: 'OPEN',
    failureCount: 999,
    consecutiveFailures: 999,
    successCount: 0,
    lastFailureAt: new Date(),
    lastSuccessAt: null,
    openedAt: new Date(),
    nextProbeAt: new Date(Date.now() + 600000), // 10 minutes default
    lastErrorMessage: reason,
  };
  inMemoryBreakers.set(key, breaker);

  await prisma.circuitBreakerRecord.upsert({
    where: { key },
    create: {
      key,
      state: 'OPEN',
      failureCount: 999,
      consecutiveFailures: 999,
      lastFailureAt: new Date(),
      openedAt: new Date(),
      nextProbeAt: new Date(Date.now() + 600000),
      lastErrorMessage: reason,
    },
    update: {
      state: 'OPEN',
      failureCount: 999,
      consecutiveFailures: 999,
      lastFailureAt: new Date(),
      openedAt: new Date(),
      nextProbeAt: new Date(Date.now() + 600000),
      lastErrorMessage: reason,
    },
  });
}

/**
 * Manually resets a circuit breaker to CLOSED (Admin action)
 */
export async function resetCircuitBreaker(key: string): Promise<void> {
  const breaker: BreakerStatus = {
    key,
    state: 'CLOSED',
    failureCount: 0,
    consecutiveFailures: 0,
    successCount: 0,
    lastFailureAt: null,
    lastSuccessAt: new Date(),
    openedAt: null,
    nextProbeAt: null,
    lastErrorMessage: null,
  };
  inMemoryBreakers.set(key, breaker);

  await prisma.circuitBreakerRecord.upsert({
    where: { key },
    create: {
      key,
      state: 'CLOSED',
      failureCount: 0,
      consecutiveFailures: 0,
      successCount: 0,
      lastSuccessAt: new Date(),
    },
    update: {
      state: 'CLOSED',
      failureCount: 0,
      consecutiveFailures: 0,
      successCount: 0,
      openedAt: null,
      nextProbeAt: null,
      lastErrorMessage: null,
    },
  });
}

/**
 * Returns all active circuit breakers in memory and database
 */
export async function getAllCircuitBreakers(): Promise<BreakerStatus[]> {
  try {
    const dbRecords = await prisma.circuitBreakerRecord.findMany();
    for (const r of dbRecords) {
      if (!inMemoryBreakers.has(r.key)) {
        inMemoryBreakers.set(r.key, {
          key: r.key,
          state: r.state as CircuitState,
          failureCount: r.failureCount,
          consecutiveFailures: r.consecutiveFailures,
          successCount: r.successCount,
          lastFailureAt: r.lastFailureAt,
          lastSuccessAt: r.lastSuccessAt,
          openedAt: r.openedAt,
          nextProbeAt: r.nextProbeAt,
          lastErrorMessage: r.lastErrorMessage,
        });
      }
    }
  } catch {}

  return Array.from(inMemoryBreakers.values());
}
