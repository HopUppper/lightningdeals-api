/**
 * scripts/benchmark-gateway-latency.ts
 *
 * Comprehensive Latency Benchmark & Verification Suite
 * Measures and validates:
 * 1. API Key Auth Caching Latency (Cold DB vs Warm Cache p50/p95/p99)
 * 2. Edge Gateway Liveness Ping Latency
 * 3. User Dashboard Query Optimization (/api/user/usage)
 * 4. Keep-Alive Pooled Connection Latency
 * 5. Instant Cache Invalidation on Key Revocation
 * 6. Multi-Plan Isolation across 5 Billing Architectures
 *
 * Strict Sandbox Rules: Zero persistent test data residue.
 */

import { initSandbox, createTestUser, createTestApiKey, cleanupSandbox } from './test-sandbox';
import { getCachedApiKey, invalidateKeyCache, authCacheMetrics } from '../server/cache/authCache';
import { pooledFetch } from '../server/infrastructure/connectionPool';
import { hashApiKey, prisma } from '../server/db';
import { generateToken } from '../server/auth';

function calculatePercentiles(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  return {
    min: sorted[0],
    p50,
    p95,
    p99,
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
  };
}

async function runBenchmark() {
  console.log('========================================================================');
  console.log('⚡ LIGHTNINGAPI CRITICAL PERFORMANCE & LATENCY BENCHMARK SUITE');
  console.log('========================================================================\n');

  const sandbox = initSandbox();
  const BASE_URL = 'http://localhost:3001';

  try {
    // 1. Setup Isolated Sandbox Test User & Keys
    console.log('📦 Setting up isolated test sandbox...');
    const user = await createTestUser(sandbox, 'perf-benchmark');
    const userToken = generateToken({ id: user.id, email: user.email, role: user.role });

    const { apiKey, rawKey } = await createTestApiKey(sandbox, user.id, {
      name: 'Performance Benchmark Key',
      plan: 'pro',
      purchasedTokens: BigInt(50_000_000),
      billingType: 'window',
    });
    const keyHash = hashApiKey(rawKey);

    // -------------------------------------------------------------------------
    // TEST 1: API Key Auth Latency (Cold DB vs In-Memory Cache)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. API KEY AUTHENTICATION BENCHMARK ---');

    // Baseline: Uncached Direct Database Queries
    const dbTimes: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t0 = performance.now();
      await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: true, provider: true },
      });
      dbTimes.push(performance.now() - t0);
    }
    const dbStats = calculatePercentiles(dbTimes);
    console.log(`✓ Direct PostgreSQL DB Query: avg=${dbStats.avg}ms, p50=${dbStats.p50.toFixed(2)}ms, p95=${dbStats.p95.toFixed(2)}ms`);

    // Invalidate cache first to measure cold cache miss
    invalidateKeyCache(keyHash);
    const coldStart = performance.now();
    await getCachedApiKey(keyHash);
    const coldMissMs = performance.now() - coldStart;
    console.log(`✓ Cold Cache Miss: ${coldMissMs.toFixed(2)}ms`);

    // Warm Cache: 100 iterations
    const cacheTimes: number[] = [];
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now();
      await getCachedApiKey(keyHash);
      cacheTimes.push(performance.now() - t0);
    }
    const cacheStats = calculatePercentiles(cacheTimes);
    console.log(`⚡ Warm In-Memory Auth Cache: avg=${cacheStats.avg}ms, p50=${cacheStats.p50.toFixed(3)}ms, p95=${cacheStats.p95.toFixed(3)}ms, p99=${cacheStats.p99.toFixed(3)}ms`);
    console.log(`🚀 Auth Speedup: ${Math.round(dbStats.avg / Math.max(0.01, cacheStats.avg))}x faster (${((1 - cacheStats.avg / dbStats.avg) * 100).toFixed(1)}% reduction)`);

    // -------------------------------------------------------------------------
    // TEST 2: Edge Gateway Liveness Ping (/api/health)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. EDGE GATEWAY LIVENESS PING BENCHMARK ---');
    const healthTimes: number[] = [];
    for (let i = 0; i < 30; i++) {
      const t0 = performance.now();
      const res = await fetch(`${BASE_URL}/api/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      await res.json();
      healthTimes.push(performance.now() - t0);
    }
    const healthStats = calculatePercentiles(healthTimes);
    console.log(`⚡ Edge Gateway Round-Trip (/api/health): avg=${healthStats.avg}ms, p50=${healthStats.p50.toFixed(1)}ms, p95=${healthStats.p95.toFixed(1)}ms`);

    // -------------------------------------------------------------------------
    // TEST 3: User Dashboard (/api/user/usage) Query Optimization
    // -------------------------------------------------------------------------
    console.log('\n--- 3. USER DASHBOARD USAGE ENDPOINT BENCHMARK ---');
    const usageTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      const res = await fetch(`${BASE_URL}/api/user/usage`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (!res.ok) throw new Error(`Usage query failed: ${res.status}`);
      await res.json();
      usageTimes.push(performance.now() - t0);
    }
    const usageStats = calculatePercentiles(usageTimes);
    console.log(`⚡ Optimized Parallel Usage Endpoint (/api/user/usage): avg=${usageStats.avg}ms, p50=${usageStats.p50.toFixed(1)}ms, p95=${usageStats.p95.toFixed(1)}ms`);

    // -------------------------------------------------------------------------
    // TEST 4: High-Performance Pooled Fetch (HTTP Keep-Alive Socket Reuse)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. HTTP KEEP-ALIVE CONNECTION POOL BENCHMARK ---');
    const poolTarget = 'https://httpbin.org/get';
    const pooledTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      const res = await pooledFetch(poolTarget, { timeoutMs: 10000 });
      if (!res.ok) throw new Error(`Pooled fetch failed: ${res.status}`);
      await res.json();
      pooledTimes.push(performance.now() - t0);
    }
    console.log(`✓ 1st Request (TCP/TLS handshake): ${Math.round(pooledTimes[0])}ms`);
    console.log(`⚡ Subsequent Pooled Requests (Keep-Alive Reuse): avg=${Math.round(pooledTimes.slice(1).reduce((a, b) => a + b, 0) / (pooledTimes.length - 1))}ms (${pooledTimes.slice(1).map(t => Math.round(t)).join(', ')}ms)`);

    // -------------------------------------------------------------------------
    // TEST 5: Cache Invalidation on Key Revocation
    // -------------------------------------------------------------------------
    console.log('\n--- 5. INSTANT CACHE INVALIDATION VERIFICATION ---');
    // Key should be in warm cache
    const beforeRevoke = await getCachedApiKey(keyHash);
    if (!beforeRevoke || beforeRevoke.status !== 'active') throw new Error('Expected active cached key');

    // Revoke key in DB and trigger invalidateKeyCache
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { status: 'revoked' },
    });
    invalidateKeyCache(apiKey.id);

    // Next getCachedApiKey must query DB and return revoked status
    const afterRevoke = await getCachedApiKey(keyHash);
    if (!afterRevoke || afterRevoke.status !== 'revoked') {
      throw new Error(`Expected revoked status after invalidation, got: ${afterRevoke?.status}`);
    }
    console.log(`✓ Instant Cache Invalidation: Key ${apiKey.id} correctly transitioned to revoked in cache.`);

    // -------------------------------------------------------------------------
    // TEST 6: Multi-Plan Architecture Isolation Check
    // -------------------------------------------------------------------------
    console.log('\n--- 6. MULTI-PLAN ARCHITECTURE ISOLATION ---');
    const plans = [
      { name: 'Claude Rolling 5h', billingType: 'window', purchased: BigInt(20_000_000) },
      { name: 'Credit Plan', billingType: 'credit', purchased: BigInt(0) },
      { name: 'OpenAI Token Pack', billingType: 'token', purchased: BigInt(50_000_000) },
      { name: 'Claude Token Pack', billingType: 'token', purchased: BigInt(10_000_000) },
      { name: 'Local Model Pack', billingType: 'token', purchased: BigInt(100_000_000) },
    ];

    for (const p of plans) {
      const k = await createTestApiKey(sandbox, user.id, {
        name: `Plan Check: ${p.name}`,
        billingType: p.billingType,
        purchasedTokens: p.purchased,
      });
      const hash = hashApiKey(k.rawKey);
      const cachedKey = await getCachedApiKey(hash);
      if (cachedKey.billingType !== p.billingType) {
        throw new Error(`Plan isolation mismatch for ${p.name}: expected ${p.billingType}, got ${cachedKey.billingType}`);
      }
    }
    console.log(`✓ All 5 Plan Architectures verified with zero cross-billing bleed.`);

    console.log('\n========================================================================');
    console.log('✅ ALL LATENCY BENCHMARKS & VERIFICATIONS PASSED SUCCESSFULLY');
    console.log('========================================================================\n');
  } catch (err: any) {
    console.error('❌ Benchmark error:', err);
    process.exitCode = 1;
  } finally {
    console.log('🧹 Cleaning up sandbox test records...');
    await cleanupSandbox(sandbox);
    console.log('✓ Sandbox cleanup completed. Zero test residues.');
  }
}

runBenchmark();
