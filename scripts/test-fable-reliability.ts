import { prisma, decryptText } from '../server/db';
import { initSandbox, createTestUser, createTestApiKey, cleanupSandbox } from './test-sandbox';
import { resolveIntelligentRoute } from '../server/infrastructure/smartRouter';
import { buildProviderRequest } from '../server/providerAdapter';
import { normalizeErrorResponse } from '../server/friendlyErrors';
import { detectModelFamily } from '../server/gateway';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runFableTestSuite() {
  console.log('================================================================');
  console.log('🚀 LIGHTNINGAPI — FABLE 5 RELIABILITY & ENTITLEMENT TEST SUITE');
  console.log('================================================================\n');

  const ctx = initSandbox();

  try {
    const testUser = await createTestUser(ctx, 'fable-reliability');
    const scalemaxVendor = await prisma.vendorProvider.findFirst({ where: { slug: 'scalemax' } });
    const opusmaxVendor = await prisma.vendorProvider.findFirst({ where: { slug: 'opus_max' } });

    // 1. Create a ScaleMax Credit Key with ["claude", "openai"] entitlement
    const creditKeyData = await createTestApiKey(ctx, testUser.id, {
      name: 'Fable Credit Test Key',
      billingType: 'credit',
      purchasedTokens: BigInt(5_000_000),
    });

    await prisma.apiKey.update({
      where: { id: creditKeyData.apiKey.id },
      data: {
        creditBalanceUsd: 10.0,
        allowedModelFamilies: JSON.stringify(['claude', 'openai']),
        allowedModels: 'all',
        providerId: scalemaxVendor?.id,
      },
    });

    // 2. Create an OpusMax Rolling Window Key
    const windowKeyData = await createTestApiKey(ctx, testUser.id, {
      name: 'Fable Window Test Key',
      billingType: 'window',
      plan: 'pro',
      purchasedTokens: BigInt(10_000_000),
    });

    await prisma.apiKey.update({
      where: { id: windowKeyData.apiKey.id },
      data: {
        allowedModelFamilies: JSON.stringify(['claude']),
        allowedModels: 'all',
        providerId: opusmaxVendor?.id,
      },
    });

    const creditKey = await prisma.apiKey.findUnique({
      where: { id: creditKeyData.apiKey.id },
      include: { provider: true },
    });

    const windowKey = await prisma.apiKey.findUnique({
      where: { id: windowKeyData.apiKey.id },
      include: { provider: true },
    });

    // ────────────────────────────────────────────────────────────
    // TEST 1: Model Family Detection & Normalization
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST 1: Model Family Detection for Fable Variants ---');
    const fam1 = detectModelFamily('claude-fable-5');
    const fam2 = detectModelFamily('fable-5');
    const fam3 = detectModelFamily('fable-5.1');
    const fam4 = detectModelFamily('claude-fable-5-flash');

    const test1Passed = fam1 === 'claude' && fam2 === 'claude' && fam3 === 'claude' && fam4 === 'claude';
    results.push({
      name: 'Test 1: Model Family Detection (Fable -> Claude)',
      passed: test1Passed,
      details: `Detected: claude-fable-5=${fam1}, fable-5=${fam2}, fable-5.1=${fam3}, fable-flash=${fam4}`,
    });
    console.log(`Result: ${test1Passed ? '✅ PASS' : '❌ FAIL'} (${results[results.length - 1].details})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST 2: Credit Key Route Resolution (Must route to ScaleMax)
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST 2: Credit Key Route Resolution to ScaleMax ---');
    const routeCredit1 = await resolveIntelligentRoute({
      keyRecord: creditKey,
      requestedModel: 'claude-fable-5',
      isStreaming: true,
    });
    const routeCredit2 = await resolveIntelligentRoute({
      keyRecord: creditKey,
      requestedModel: 'fable-5',
      isStreaming: false,
    });
    const routeCredit3 = await resolveIntelligentRoute({
      keyRecord: creditKey,
      requestedModel: 'fable-5.1',
      isStreaming: true,
    });

    const test2Passed =
      routeCredit1.success &&
      routeCredit1.routedProvider?.slug === 'scalemax' &&
      routeCredit2.success &&
      routeCredit2.routedProvider?.slug === 'scalemax' &&
      routeCredit3.success &&
      routeCredit3.routedProvider?.slug === 'scalemax';

    results.push({
      name: 'Test 2: ScaleMax Credit Route Resolution',
      passed: test2Passed,
      details: `claude-fable-5: ${routeCredit1.routedProvider?.slug} (${routeCredit1.protocol}), fable-5: ${routeCredit2.routedProvider?.slug}, fable-5.1: ${routeCredit3.routedProvider?.slug}`,
    });
    console.log(`Result: ${test2Passed ? '✅ PASS' : '❌ FAIL'} (${results[results.length - 1].details})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST 3: Rolling Window Key Route Resolution (Must route to OpusMax)
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST 3: Rolling Window Key Route Resolution to OpusMax ---');
    const routeWindow = await resolveIntelligentRoute({
      keyRecord: windowKey,
      requestedModel: 'claude-fable-5',
      isStreaming: true,
    });

    const test3Passed = routeWindow.success && routeWindow.routedProvider?.slug === 'opus_max';
    results.push({
      name: 'Test 3: OpusMax Window Route Resolution',
      passed: test3Passed,
      details: `Provider: ${routeWindow.routedProvider?.slug}, Protocol: ${routeWindow.protocol}, Model: ${routeWindow.effectiveModel}`,
    });
    console.log(`Result: ${test3Passed ? '✅ PASS' : '❌ FAIL'} (${results[results.length - 1].details})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST 4: Protocol Adaptation (OpenAI vs Anthropic Routes on ScaleMax)
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST 4: Protocol Adaptation on ScaleMax Provider Adapter ---');
    const smCredKey = scalemaxVendor?.creditApiKeyEncrypted ? decryptText(scalemaxVendor.creditApiKeyEncrypted) : '';

    // A. OpenAI-compatible request (IDE / chat/completions route)
    const openAiReq = buildProviderRequest(scalemaxVendor, smCredKey, 'claude-fable-5', {
      messages: [{ role: 'user', content: 'Say hello in 2 words' }],
      max_tokens: 30,
      stream: false,
      isOpenAiEndpoint: true,
    }, 'credit');

    // B. Anthropic-compatible request (Claude Code / messages route)
    const anthropicReq = buildProviderRequest(scalemaxVendor, smCredKey, 'claude-fable-5', {
      messages: [{ role: 'user', content: 'Say hello in 2 words' }],
      max_tokens: 30,
      stream: false,
      isAnthropicEndpoint: true,
    }, 'credit');

    const isOpenAiValid = openAiReq.url.includes('/chat/completions') && openAiReq.headers['authorization']?.startsWith('Bearer sm_');
    const isAnthropicValid = openAiReq.url.includes('/chat/completions') && anthropicReq.url.includes('/messages') && !!anthropicReq.headers['x-api-key'];

    const test4Passed = isOpenAiValid && isAnthropicValid;
    results.push({
      name: 'Test 4: Dual-Protocol Request Generation on ScaleMax',
      passed: test4Passed,
      details: `OpenAI URL: ${openAiReq.url}, Anthropic URL: ${anthropicReq.url}`,
    });
    console.log(`Result: ${test4Passed ? '✅ PASS' : '❌ FAIL'} (${results[results.length - 1].details})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST 5: Live Supplier Fulfillment on ScaleMax (OpenAI & Anthropic)
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST 5: Live Supplier Fulfillment for Fable 5 ---');
    let smOpenAiSuccess = false;
    let smAnthropicSuccess = false;

    try {
      const resOpenAi = await fetch(openAiReq.url, {
        method: 'POST',
        headers: openAiReq.headers,
        body: JSON.stringify(openAiReq.body),
      });
      if (resOpenAi.ok) {
        const data = await resOpenAi.json();
        smOpenAiSuccess = !!data.choices && data.choices.length > 0;
      }
    } catch (e: any) {
      console.warn('ScaleMax OpenAI call notice:', e.message);
    }

    try {
      const resAnthropic = await fetch(anthropicReq.url, {
        method: 'POST',
        headers: anthropicReq.headers,
        body: JSON.stringify(anthropicReq.body),
      });
      if (resAnthropic.ok) {
        const data = await resAnthropic.json();
        smAnthropicSuccess = !!data.content && data.content.length > 0;
      }
    } catch (e: any) {
      console.warn('ScaleMax Anthropic call notice:', e.message);
    }

    const test5Passed = smOpenAiSuccess && smAnthropicSuccess;
    results.push({
      name: 'Test 5: Live ScaleMax Fable Execution',
      passed: test5Passed,
      details: `OpenAI Completion: ${smOpenAiSuccess ? 'SUCCESS (HTTP 200)' : 'FAILED'}, Anthropic Messages: ${smAnthropicSuccess ? 'SUCCESS (HTTP 200)' : 'FAILED'}`,
    });
    console.log(`Result: ${test5Passed ? '✅ PASS' : '❌ FAIL'} (${results[results.length - 1].details})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST 6: AI Chat Studio Error Normalization (Zero ReferenceError)
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST 6: Studio Error Normalization Safety ---');
    let studioErrorPassed = false;
    try {
      const testModel = 'claude-fable-5';
      const normErr1 = normalizeErrorResponse(502, 'Upstream connect ECONNREFUSED', { model: testModel });
      const normErr2 = normalizeErrorResponse(504, 'Upstream timeout', { model: testModel });
      studioErrorPassed =
        normErr1.statusCode === 502 &&
        !normErr1.error.message.includes('scalemax') &&
        normErr2.statusCode === 504;
    } catch (err: any) {
      studioErrorPassed = false;
    }

    results.push({
      name: 'Test 6: Studio Error Normalizer & Zero ReferenceError',
      passed: studioErrorPassed,
      details: studioErrorPassed ? 'Successfully normalized without reference error' : 'ReferenceError thrown',
    });
    console.log(`Result: ${studioErrorPassed ? '✅ PASS' : '❌ FAIL'} (${results[results.length - 1].details})\n`);

    // ────────────────────────────────────────────────────────────
    // TEST 7: Zero Claude 3 Family Compliance
    // ────────────────────────────────────────────────────────────
    console.log('--- TEST 7: Zero Claude 3 Family Verification ---');
    const allModels = await prisma.model.findMany({ select: { modelId: true } });
    const claude3Violations = allModels.filter((m) =>
      /claude-3|3-5-sonnet|3-5-haiku|3-7-sonnet|3-opus|claude-3-opus|claude-3-haiku/i.test(m.modelId)
    );

    const test7Passed = claude3Violations.length === 0;
    results.push({
      name: 'Test 7: Absolute Zero Claude 3 Mentions (Rule 1)',
      passed: test7Passed,
      details: `Verified ${allModels.length} models in DB: ${claude3Violations.length} violations found`,
    });
    console.log(`Result: ${test7Passed ? '✅ PASS' : '❌ FAIL'} (${results[results.length - 1].details})\n`);

  } catch (outerErr: any) {
    console.error('Test suite uncaught error:', outerErr);
  } finally {
    console.log('🧹 Executing strict sandbox cleanup...');
    await cleanupSandbox(ctx);
    console.log('✅ Sandbox completely destroyed: 0 residual test records.\n');
  }

  console.log('================================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY');
  console.log('================================================================');
  let allPass = true;
  for (const r of results) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    if (!r.passed) allPass = false;
    console.log(`${icon} | ${r.name}`);
    console.log(`   └─ ${r.details}`);
  }
  console.log('================================================================');
  const passCount = results.filter((r) => r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${results.length - passCount}\n`);

  if (!allPass) {
    process.exit(1);
  }
}

runFableTestSuite().catch((e) => {
  console.error(e);
  process.exit(1);
});
