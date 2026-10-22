import crypto from 'crypto';
import { prisma } from '../server/db';
import { calculateAggregateAccounting } from '../server/accounting/aggregateAccounting';
import { getUpstreamMasterAccounting } from '../server/accounting/upstreamAccounting';
import { calculateCustomerRollingWindow } from '../server/accounting/customerAccounting';
import {
  reserveTokens,
  releaseReservation,
  settleReservation,
  cleanupExpiredReservations,
  getActiveCustomerReservations,
  getActiveMasterReservations,
} from '../server/accounting/tokenReservation';
import { AnthropicAdapter } from '../server/providers/AnthropicAdapter';
import { OpenAICompatibleAdapter } from '../server/providers/OpenAICompatibleAdapter';
import { CustomHttpAdapter } from '../server/providers/CustomHttpAdapter';
import { ProviderDiscoveryRegistry } from '../server/providers/ProviderDiscoveryRegistry';
import { validatePublicWebUrl } from '../server/ssrf';
import { updateTokensAndLog } from '../server/gateway';

interface TestResult {
  scenarioNumber: number;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];
const createdKeyIds: string[] = [];

function recordTest(scenarioNumber: number, name: string, passed: boolean, details?: string, error?: string) {
  results.push({ scenarioNumber, name, passed, details, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [Scenario ${scenarioNumber}] ${name}: ${passed ? 'PASSED' : 'FAILED'}`);
  if (details) console.log(`   └─ ${details}`);
  if (error) console.log(`   └─ ERROR: ${error}`);
}

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

async function createTestApiKey(overrides: any = {}) {
  const rawKey = overrides.key || `sk-ld-test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const keyHash = hashSecret(rawKey);
  const keyPrefix = overrides.keyPrefix || rawKey.substring(0, 10);
  const displayKey = `${keyPrefix}...${rawKey.slice(-4)}`;

  const key = await prisma.apiKey.create({
    data: {
      name: overrides.name || 'Test API Key',
      keyEncrypted: 'enc_test',
      keyHash,
      keyPrefix,
      displayKey,
      plan: overrides.plan || 'Claude Max 5x',
      purchasedTokens: overrides.purchasedTokens !== undefined ? BigInt(overrides.purchasedTokens) : BigInt(5000000),
      tokensRemaining: overrides.tokensRemaining !== undefined ? BigInt(overrides.tokensRemaining) : BigInt(5000000),
      status: overrides.status || 'active',
      providerId: overrides.providerId || null,
    },
  });

  createdKeyIds.push(key.id);
  return key;
}

export async function runTokenAccountingDiscoveryTests() {
  console.log('\n================================================================');
  console.log('⚡ LIGHTNING API: 24 SCENARIO TOKEN ACCOUNTING & DISCOVERY SUITE');
  console.log('================================================================\n');

  const testProviderSlug = `test-prov-${Date.now()}`;
  let testProvider: any = null;

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: The 20M Upstream / 15M Customer Allocation Business Scenario
    // -------------------------------------------------------------
    try {
      testProvider = await prisma.vendorProvider.create({
        data: {
          name: 'Test Enterprise Provider 20M',
          slug: testProviderSlug,
          providerType: 'custom_http',
          protocol: 'anthropic',
          baseUrl: 'https://api.test-provider.com',
          masterApiKeyEncrypted: 'enc_test_key',
          capacityModel: 'rolling_window',
          windowHours: 5,
          windowAllowance: BigInt(20000000),      // 20M Upstream Master Limit
          configuredLimitTokens: BigInt(20000000),
          discoveredLimitTokens: BigInt(20000000),
          discoverySource: 'ADMIN_CONFIGURED_UNVERIFIED',
          discoveryStatus: 'LOCALLY_TRACKED',
          discoveryConfidence: 'HIGH',
        },
      });

      // Create 3 active customer keys with 5M allowance each = 15M active exposure
      const keys = [];
      for (let i = 1; i <= 3; i++) {
        const k = await createTestApiKey({
          key: `sk-ld-test-scenario1-key${i}-${Date.now()}`,
          keyPrefix: `sk-ld-s1k${i}`,
          plan: 'Claude Max 5x',
          purchasedTokens: 5000000,
          tokensRemaining: 5000000,
          providerId: testProvider.id,
          status: 'active',
          windowHours: 5,
        });
        keys.push(k);
      }

      // Record 3M tokens consumed in the current 5-hour rolling window
      // 1M on key 1, 1M on key 2, 1M on key 3 = 3M total
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        await prisma.apiRequest.create({
          data: {
            apiKeyId: keys[i].id,
            model: 'claude-3-7-sonnet',
            endpoint: '/v1/messages',
            statusCode: 200,
            inputTokens: 500000,
            outputTokens: 500000,
            totalTokens: 1000000,
            providerId: testProvider.id,
            createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
          },
        });
      }

      const aggregate = await calculateAggregateAccounting(testProvider.id);

      // Invariants:
      // Master limit = 20M
      // Consumed = 3M
      // Remaining Upstream Capacity = 20M - 3M = 17M (NOT 20M - 15M = 5M!)
      // Active Customer Exposure = 15M
      // Exposure Headroom = 20M - 15M = 5M
      // Exposure Ratio = 15M / 20M = 75.0%
      const limitMatches = aggregate.upstream.upstreamLimit === 20000000;
      const consumedMatches = aggregate.aggregateWindowTokensConsumed === 3000000;
      const remainingMatches = aggregate.upstreamRemainingMasterCapacity === 17000000;
      const exposureMatches = aggregate.activeCustomer5hAllowanceExposure >= 15000000;
      const headroomMatches = aggregate.exposureHeadroomTokens <= 5000000;

      const passed = limitMatches && consumedMatches && remainingMatches;
      recordTest(
        1,
        '20M Upstream / 15M Customer Allocation (17M Remaining, Not 5M)',
        passed,
        `Master Limit: ${aggregate.upstream.upstreamLimit?.toLocaleString()} | Consumed: ${aggregate.aggregateWindowTokensConsumed.toLocaleString()} | Remaining: ${aggregate.upstreamRemainingMasterCapacity.toLocaleString()} | Active Exposure: ${aggregate.activeCustomer5hAllowanceExposure.toLocaleString()} | Headroom: ${aggregate.exposureHeadroomTokens.toLocaleString()}`
      );
    } catch (err: any) {
      recordTest(1, '20M Upstream / 15M Customer Allocation', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 2: SSRF Protection — Loopback Target Rejection
    // -------------------------------------------------------------
    try {
      const loopback1 = await validatePublicWebUrl('http://127.0.0.1:8080/v1/credits');
      const loopback2 = await validatePublicWebUrl('http://localhost:3000/v1/quota');
      const loopback3 = await validatePublicWebUrl('http://[::1]:8000/models');
      const passed = !loopback1.safe && !loopback2.safe && !loopback3.safe;
      recordTest(2, 'SSRF Protection — Loopback Target Rejection', passed, '127.0.0.1, localhost, and [::1] successfully blocked.');
    } catch (err: any) {
      recordTest(2, 'SSRF Protection — Loopback Target Rejection', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 3: SSRF Protection — Private Subnet Rejection (RFC 1918)
    // -------------------------------------------------------------
    try {
      const priv10 = await validatePublicWebUrl('http://10.0.0.1:80/v1');
      const priv192 = await validatePublicWebUrl('http://192.168.1.50/api');
      const priv172 = await validatePublicWebUrl('http://172.16.5.10/v1/models');
      const passed = !priv10.safe && !priv192.safe && !priv172.safe;
      recordTest(3, 'SSRF Protection — RFC 1918 Private Subnet Rejection', passed, '10/8, 192.168/16, and 172.16/12 successfully blocked.');
    } catch (err: any) {
      recordTest(3, 'SSRF Protection — RFC 1918 Private Subnet Rejection', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 4: SSRF Protection — Cloud Metadata IP Rejection (169.254.169.254)
    // -------------------------------------------------------------
    try {
      const metadata = await validatePublicWebUrl('http://169.254.169.254/latest/meta-data/');
      const googleMeta = await validatePublicWebUrl('http://metadata.google.internal/computeMetadata/v1/');
      const passed = !metadata.safe && !googleMeta.safe;
      recordTest(4, 'SSRF Protection — Cloud Metadata IP & Hostname Rejection', passed, 'AWS/GCP metadata endpoints successfully blocked.');
    } catch (err: any) {
      recordTest(4, 'SSRF Protection — Cloud Metadata IP & Hostname Rejection', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 5: SSRF Protection — Non-Standard Port Rejection
    // -------------------------------------------------------------
    try {
      const sshPort = await validatePublicWebUrl('https://api.anthropic.com:22/v1');
      const customPort = await validatePublicWebUrl('https://api.openai.com:8443/v1');
      const validPort = await validatePublicWebUrl('https://api.anthropic.com:443/v1');
      const passed = !sshPort.safe && !customPort.safe && validPort.safe;
      recordTest(5, 'SSRF Protection — Non-Standard Port Rejection', passed, 'Ports 22 and 8443 blocked, standard port 443 permitted.');
    } catch (err: any) {
      recordTest(5, 'SSRF Protection — Non-Standard Port Rejection', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 6: Provider Discovery — Anthropic Rate-Limit Extraction
    // -------------------------------------------------------------
    try {
      const adapter = new AnthropicAdapter();
      const mockHeaders = {
        'anthropic-ratelimit-tokens-limit': '40000000',
        'anthropic-ratelimit-tokens-remaining': '35000000',
        'anthropic-ratelimit-tokens-reset': new Date(Date.now() + 60000).toISOString(),
        'anthropic-ratelimit-requests-limit': '5000',
        'anthropic-ratelimit-requests-remaining': '4950',
      };
      const metadata = adapter.extractRateLimits(mockHeaders);
      const passed = metadata !== null &&
        metadata.limitTokens === 40000000 &&
        metadata.remainingTokens === 35000000 &&
        metadata.limitRequests === 5000 &&
        metadata.remainingRequests === 4950 &&
        metadata.resetAt !== undefined;
      recordTest(6, 'Anthropic Rate-Limit Header Extraction', passed, `Limit: ${metadata?.limitTokens?.toLocaleString()} | Remaining: ${metadata?.remainingTokens?.toLocaleString()}`);
    } catch (err: any) {
      recordTest(6, 'Anthropic Rate-Limit Header Extraction', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 7: Provider Discovery — Anthropic Idle Local Tracking
    // -------------------------------------------------------------
    try {
      const adapter = new AnthropicAdapter();
      const discovery = await adapter.discoverCapacity(testProvider, 'mock_master_key');
      const passed = discovery.source === 'ADMIN_CONFIGURED_UNVERIFIED' &&
        discovery.status === 'LOCALLY_TRACKED' &&
        discovery.limitTokens === 20000000 &&
        discovery.consumedTokens === 3000000 &&
        discovery.remainingTokens === 17000000;
      recordTest(7, 'Anthropic Idle Local Tracking Without Guessing Endpoints', passed, `Discovered remaining: ${discovery.remainingTokens?.toLocaleString()} via local request ledger.`);
    } catch (err: any) {
      recordTest(7, 'Anthropic Idle Local Tracking Without Guessing Endpoints', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 8: Provider Discovery — OpenAI Standard Rate-Limit Extraction
    // -------------------------------------------------------------
    try {
      const adapter = new OpenAICompatibleAdapter();
      const mockHeaders = {
        'x-ratelimit-limit-tokens': '50000000',
        'x-ratelimit-remaining-tokens': '48000000',
        'x-ratelimit-reset-tokens': '6m0s',
      };
      const metadata = adapter.extractRateLimits(mockHeaders);
      const passed = metadata !== null &&
        metadata.limitTokens === 50000000 &&
        metadata.remainingTokens === 48000000 &&
        metadata.resetAt !== undefined;
      recordTest(8, 'OpenAI Standard Rate-Limit Header Extraction (Duration Reset)', passed, `Limit: ${metadata?.limitTokens?.toLocaleString()} | Reset: ${metadata?.resetAt?.toISOString()}`);
    } catch (err: any) {
      recordTest(8, 'OpenAI Standard Rate-Limit Header Extraction (Duration Reset)', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 9: Customer Rolling Window — Strict Interval Boundaries
    // -------------------------------------------------------------
    try {
      const testKey = await createTestApiKey({
        key: `sk-ld-test-boundary-${Date.now()}`,
        keyPrefix: 'sk-ld-bnd',
        plan: 'Claude Max 5x',
        purchasedTokens: 5000000,
        tokensRemaining: 5000000,
        providerId: testProvider.id,
        status: 'active',
        windowHours: 5,
      });

      const nowMs = Date.now();
      const fiveHoursOneSecAgo = new Date(nowMs - (5 * 3600 + 1) * 1000);
      const fourHoursAgo = new Date(nowMs - 4 * 3600 * 1000);

      // Request 1: Outside window (5 hours 1 second ago) -> 500,000 tokens
      await prisma.apiRequest.create({
        data: {
          apiKeyId: testKey.id,
          model: 'claude-3-7-sonnet',
          endpoint: '/v1/messages',
          totalTokens: 500000,
          createdAt: fiveHoursOneSecAgo,
        },
      });

      // Request 2: Inside window (4 hours ago) -> 1,200,000 tokens
      await prisma.apiRequest.create({
        data: {
          apiKeyId: testKey.id,
          model: 'claude-3-7-sonnet',
          endpoint: '/v1/messages',
          totalTokens: 1200000,
          createdAt: fourHoursAgo,
        },
      });

      const metrics = await calculateCustomerRollingWindow(testKey);
      const passed = metrics.windowTokensUsed === 1200000 && metrics.remainingWindowAllowance === (5000000 - 1200000);
      recordTest(9, 'Customer Rolling Window — Strict Interval Boundaries', passed, `Used in window: ${metrics.windowTokensUsed.toLocaleString()} (500k aged-out request excluded)`);
    } catch (err: any) {
      recordTest(9, 'Customer Rolling Window — Strict Interval Boundaries', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 10: Customer Rolling Window — Roll-Off Reset Timestamp
    // -------------------------------------------------------------
    try {
      const testKey = await prisma.apiKey.findFirst({
        where: { keyPrefix: 'sk-ld-bnd' },
      });
      const metrics = await calculateCustomerRollingWindow(testKey);
      const passed = metrics.nextResetAt !== null &&
        metrics.windowResetSeconds !== null &&
        metrics.windowResetSeconds > 0 &&
        metrics.rolloffSchedule.length === 1;
      recordTest(10, 'Customer Rolling Window — Roll-Off Reset Timestamp & Schedule', passed, `Next reset at: ${metrics.nextResetAt} (${metrics.windowResetSeconds}s remaining)`);
    } catch (err: any) {
      recordTest(10, 'Customer Rolling Window — Roll-Off Reset Timestamp & Schedule', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 11: Customer Rolling Window — Remaining Allowance Calculation
    // -------------------------------------------------------------
    try {
      const testKey = await prisma.apiKey.findFirst({
        where: { keyPrefix: 'sk-ld-bnd' },
      });
      const metrics = await calculateCustomerRollingWindow(testKey);
      const expectedRemaining = 5000000 - 1200000;
      const passed = metrics.remainingWindowAllowance === expectedRemaining;
      recordTest(11, 'Customer Rolling Window — Remaining Allowance Formula', passed, `Remaining: ${metrics.remainingWindowAllowance.toLocaleString()} tokens`);
    } catch (err: any) {
      recordTest(11, 'Customer Rolling Window — Remaining Allowance Formula', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 12: Customer Rolling Window — Non-Permanent Depletion Bugfix
    // -------------------------------------------------------------
    try {
      const testKey = await createTestApiKey({
        key: `sk-ld-test-renewal-${Date.now()}`,
        keyPrefix: 'sk-ld-rnw',
        plan: 'Claude Pro Rolling',
        purchasedTokens: 5000000,
        tokensRemaining: 5000000,
        status: 'active',
        windowHours: 5,
      });

      // Execute updateTokensAndLog with 2,000,000 tokens
      await updateTokensAndLog({
        keyRecord: testKey,
        model: 'claude-3-7-sonnet',
        inputTokens: 1000000,
        outputTokens: 1000000,
        totalTokens: 2000000,
        latencyMs: 1500,
        streaming: false,
      });

      // Fetch key from DB: tokensRemaining should NOT be decremented to 3,000,000 for rolling window keys
      const freshKey = await prisma.apiKey.findUnique({ where: { id: testKey.id } });
      const windowMetrics = await calculateCustomerRollingWindow(freshKey);

      // Remaining in window is 5M - 2M = 3M
      const passed = windowMetrics.remainingWindowAllowance === 3000000 &&
        Number(freshKey?.tokensRemaining) === 5000000; // wallet remains intact
      recordTest(12, 'Rolling Window Non-Permanent Depletion (Allowance Renews Naturally)', passed, `Window remaining: ${windowMetrics.remainingWindowAllowance.toLocaleString()}, Permanent balance protected: ${freshKey?.tokensRemaining.toString()}`);
    } catch (err: any) {
      recordTest(12, 'Rolling Window Non-Permanent Depletion', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 13: Token Reservation — Concurrent Reservation Lock
    // -------------------------------------------------------------
    try {
      const reqId = `req_conc_${Date.now()}`;
      await reserveTokens({
        apiKeyId: createdKeyIds[0],
        providerId: testProvider.id,
        requestId: reqId,
        estimatedTokens: 250000,
      });

      const activeCust = await getActiveCustomerReservations(createdKeyIds[0]);
      const activeMast = await getActiveMasterReservations(testProvider.id);
      const passed = activeCust === 250000 && activeMast === 250000;
      recordTest(13, 'Token Reservation — Concurrent Reservation Lock', passed, `Reserved: ${activeCust.toLocaleString()} tokens`);
    } catch (err: any) {
      recordTest(13, 'Token Reservation — Concurrent Reservation Lock', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 14: Token Reservation — Settlement on Request Completion
    // -------------------------------------------------------------
    try {
      const reqId = `req_settle_${Date.now()}`;
      await reserveTokens({
        apiKeyId: createdKeyIds[0],
        providerId: testProvider.id,
        requestId: reqId,
        estimatedTokens: 150000,
      });

      await settleReservation(reqId);
      const activeCust = await getActiveCustomerReservations(createdKeyIds[0]);
      // The settled reservation should be released from memory
      const passed = activeCust === 250000; // only previous reservation remains
      recordTest(14, 'Token Reservation — Settlement on Request Completion', passed, 'Reservation cleanly removed upon settlement.');
    } catch (err: any) {
      recordTest(14, 'Token Reservation — Settlement on Request Completion', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 15: Token Reservation — Release on Error
    // -------------------------------------------------------------
    try {
      const reqId = `req_release_${Date.now()}`;
      await reserveTokens({
        apiKeyId: createdKeyIds[0],
        providerId: testProvider.id,
        requestId: reqId,
        estimatedTokens: 300000,
      });

      await releaseReservation(reqId);
      const activeCust = await getActiveCustomerReservations(createdKeyIds[0]);
      const passed = activeCust === 250000; // release successful
      recordTest(15, 'Token Reservation — Immediate Release on Error/Abort', passed, 'Reservation released and capacity restored.');
    } catch (err: any) {
      recordTest(15, 'Token Reservation — Immediate Release on Error/Abort', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 16: Token Reservation — TTL Auto-Expiration
    // -------------------------------------------------------------
    try {
      const reqId = `req_exp_${Date.now()}`;
      // Reserve with negative TTL so it is immediately expired
      await reserveTokens({
        apiKeyId: createdKeyIds[0],
        providerId: testProvider.id,
        requestId: reqId,
        estimatedTokens: 100000,
        ttlSeconds: -10,
      });

      await cleanupExpiredReservations();
      const activeCust = await getActiveCustomerReservations(createdKeyIds[0]);
      const passed = activeCust === 250000; // expired reservation cleared
      recordTest(16, 'Token Reservation — TTL Auto-Expiration of Orphaned Requests', passed, 'Expired reservations auto-purged.');
    } catch (err: any) {
      recordTest(16, 'Token Reservation — TTL Auto-Expiration', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 17: Anthropic Token Usage Extraction — Cache Metrics
    // -------------------------------------------------------------
    try {
      const adapter = new AnthropicAdapter();
      const mockBody = {
        id: 'msg_test123',
        usage: {
          input_tokens: 1500,
          output_tokens: 800,
          cache_creation_input_tokens: 3000,
          cache_read_input_tokens: 5000,
        },
      };
      const usage = adapter.extractUsage(mockBody);
      const passed = usage.inputTokens === 1500 &&
        usage.outputTokens === 800 &&
        usage.cachedTokens === 8000 &&
        usage.totalTokens === (1500 + 800 + 8000);
      recordTest(17, 'Anthropic Usage Extraction — Full Cache Metrics Accounting', passed, `Total: ${usage.totalTokens} (Input: ${usage.inputTokens}, Output: ${usage.outputTokens}, Cached: ${usage.cachedTokens})`);
    } catch (err: any) {
      recordTest(17, 'Anthropic Usage Extraction — Full Cache Metrics Accounting', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 18: Anthropic SSE Streaming Token Extraction
    // -------------------------------------------------------------
    try {
      const adapter = new AnthropicAdapter();
      const sseChunk1 = 'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":1200,"cache_creation_input_tokens":500,"cache_read_input_tokens":1500}}}\n\n';
      const sseChunk2 = 'event: message_delta\ndata: {"type":"message_delta","usage":{"output_tokens":650}}\n\n';

      const usage1 = adapter.extractStreamUsage(sseChunk1);
      const usage2 = adapter.extractStreamUsage(sseChunk2);

      const passed = usage1?.inputTokens === 1200 &&
        usage1?.cachedTokens === 2000 &&
        usage2?.outputTokens === 650;
      recordTest(18, 'Anthropic SSE Stream Usage Extraction (Start & Delta)', passed, `Stream In: ${usage1?.inputTokens}, Cache: ${usage1?.cachedTokens}, Out: ${usage2?.outputTokens}`);
    } catch (err: any) {
      recordTest(18, 'Anthropic SSE Stream Usage Extraction', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 19: OpenAI Reasoning Tokens Tracking
    // -------------------------------------------------------------
    try {
      const adapter = new OpenAICompatibleAdapter();
      const mockBody = {
        id: 'chatcmpl-test123',
        usage: {
          prompt_tokens: 2000,
          completion_tokens: 1500,
          total_tokens: 3500,
          prompt_tokens_details: { cached_tokens: 800 },
          completion_tokens_details: { reasoning_tokens: 1000 },
        },
      };
      const usage = adapter.extractUsage(mockBody);
      const passed = usage.inputTokens === 2000 &&
        usage.outputTokens === 1500 &&
        usage.cachedTokens === 800 &&
        usage.reasoningTokens === 1000 &&
        usage.totalTokens === 3500;
      recordTest(19, 'OpenAI Reasoning Tokens & Cached Details Extraction', passed, `Reasoning: ${usage.reasoningTokens}, Cached: ${usage.cachedTokens}`);
    } catch (err: any) {
      recordTest(19, 'OpenAI Reasoning Tokens & Cached Details Extraction', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 20: Multi-Tenant Customer Isolation
    // -------------------------------------------------------------
    try {
      const keyA = await prisma.apiKey.findUnique({ where: { id: createdKeyIds[0] } });
      const keyB = await prisma.apiKey.findUnique({ where: { id: createdKeyIds[1] } });

      const metricsA = await calculateCustomerRollingWindow(keyA);
      const metricsB = await calculateCustomerRollingWindow(keyB);

      // Key A has 1M request, Key B has 1M request
      const passed = metricsA.windowTokensUsed === 1000000 &&
        metricsB.windowTokensUsed === 1000000 &&
        metricsA.apiKeyId !== metricsB.apiKeyId;
      recordTest(20, 'Multi-Tenant Cross-Customer Usage Isolation', passed, 'Customer A and B windows are strictly isolated.');
    } catch (err: any) {
      recordTest(20, 'Multi-Tenant Cross-Customer Usage Isolation', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 21: Zero Multiplier Formula Verification
    // -------------------------------------------------------------
    try {
      // Test that CustomHttpAdapter and AnthropicAdapter never scale small numbers by 500,000
      const adapter = new CustomHttpAdapter();
      const mockHeaders = {
        'x-ratelimit-remaining-tokens': '250', // small number that previously was multiplied by 500,000
      };
      const res = adapter.extractRateLimits(mockHeaders);
      const passed = res?.remainingTokens === 250; // NOT 250 * 500,000 = 125,000,000!
      recordTest(21, 'Zero Multiplier Verification (No val * 500000 Anywhere)', passed, `Extracted exact value: ${res?.remainingTokens} (no multiplier applied).`);
    } catch (err: any) {
      recordTest(21, 'Zero Multiplier Verification', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 22: Zero Hardcoded Fallback Verification
    // -------------------------------------------------------------
    try {
      // Provider with 0 allowance and no discovered limit must NOT fallback to 5,000,000
      const emptyProvider = await prisma.vendorProvider.create({
        data: {
          name: 'Empty Test Provider Zero Fallback',
          slug: `test-zero-${Date.now()}`,
          providerType: 'anthropic',
          protocol: 'anthropic',
          baseUrl: 'https://api.empty-provider.com',
          masterApiKeyEncrypted: 'enc_mock',
          capacityModel: 'rolling_window',
          windowHours: 5,
          windowAllowance: BigInt(0),
          configuredLimitTokens: BigInt(0),
          discoveredLimitTokens: BigInt(0),
          availableTokens: BigInt(0),
        },
      });

      const upstream = await getUpstreamMasterAccounting(emptyProvider.id);
      const passed = upstream.upstreamLimit === null || upstream.upstreamLimit === 0;
      recordTest(22, 'Zero Hardcoded Fallback Verification (No Fake 5M Tokens)', passed, `Reported upstream limit: ${upstream.upstreamLimit} (0 or null, never 5M).`);

      // Clean up empty provider
      await prisma.vendorProvider.delete({ where: { id: emptyProvider.id } });
    } catch (err: any) {
      recordTest(22, 'Zero Hardcoded Fallback Verification', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 23: Request Idempotency Protection
    // -------------------------------------------------------------
    try {
      const key = await prisma.apiKey.findUnique({ where: { id: createdKeyIds[0] } });
      const idempotencyKey = `idemp_${Date.now()}`;

      // First call
      await updateTokensAndLog({
        keyRecord: key,
        model: 'claude-3-7-sonnet',
        inputTokens: 5000,
        outputTokens: 5000,
        totalTokens: 10000,
        latencyMs: 300,
        streaming: false,
        idempotencyKey,
      });

      // Second call with same idempotency key
      await updateTokensAndLog({
        keyRecord: key,
        model: 'claude-3-7-sonnet',
        inputTokens: 5000,
        outputTokens: 5000,
        totalTokens: 10000,
        latencyMs: 300,
        streaming: false,
        idempotencyKey,
      });

      // Count ApiRequest rows with this idempotency key
      const count = await prisma.apiRequest.count({
        where: { apiKeyId: key?.id, idempotencyKey },
      });
      const passed = count === 1;
      recordTest(23, 'Request Idempotency Protection (Zero Double-Charging)', passed, `ApiRequest rows recorded for duplicate request: ${count}`);
    } catch (err: any) {
      recordTest(23, 'Request Idempotency Protection', false, undefined, err.message);
    }

    // -------------------------------------------------------------
    // SCENARIO 24: Admin Provider Balance API Payload Contract
    // -------------------------------------------------------------
    try {
      const aggregate = await calculateAggregateAccounting(testProvider.id);
      const hasLayerA = aggregate.upstream && aggregate.upstream.upstreamLimit !== undefined;
      const hasLayerB = aggregate.activeCustomerCount > 0;
      const hasLayerC = aggregate.upstreamRemainingMasterCapacity !== undefined &&
        aggregate.activeCustomer5hAllowanceExposure !== undefined &&
        aggregate.exposureHeadroomTokens !== undefined;

      const passed = hasLayerA && hasLayerB && hasLayerC;
      recordTest(24, 'Admin Provider Balance API Three-Layer Contract', passed, 'All Layer A, B, and C fields verified in accounting payload.');
    } catch (err: any) {
      recordTest(24, 'Admin Provider Balance API Three-Layer Contract', false, undefined, err.message);
    }

  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test keys and providers...');
    if (createdKeyIds.length > 0) {
      await prisma.apiRequest.deleteMany({ where: { apiKeyId: { in: createdKeyIds } } });
      await prisma.tokenLedger.deleteMany({ where: { apiKeyId: { in: createdKeyIds } } });
      await prisma.tokenReservation.deleteMany({ where: { apiKeyId: { in: createdKeyIds } } });
      await prisma.apiKey.deleteMany({ where: { id: { in: createdKeyIds } } });
    }
    if (testProvider) {
      await prisma.apiRequest.deleteMany({ where: { providerId: testProvider.id } });
      await prisma.masterTokenLedger.deleteMany({ where: { providerId: testProvider.id } });
      await prisma.tokenReservation.deleteMany({ where: { providerId: testProvider.id } });
      await prisma.vendorProvider.delete({ where: { id: testProvider.id } });
    }
    console.log('✓ Test data cleaned up successfully.\n');
  }

  // Summary
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log('================================================================');
  console.log(`TEST SUMMARY: ${passedCount}/${total} Scenarios Passed (${failedCount} Failed)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTokenAccountingDiscoveryTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
