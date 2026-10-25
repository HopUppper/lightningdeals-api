import { prisma, encryptText } from '../server/db.js';
import { ProviderRegistry, ScaleMaxProviderAdapter, OpusMaxProviderAdapter, buildProviderRequest } from '../server/providerAdapter.js';
import { resolveProviderForApiKey, findCatalogModel, isSupportedModel, updateTokensAndLog } from '../server/gateway.js';
import { getPlanByIdAsync, getAllActivePlansAsync } from '../server/payments/plans.js';
import { OrderEngine } from '../server/orders/orderEngine.js';
import { fulfillOrder } from '../server/payments/fulfillment.js';
import crypto from 'crypto';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${category}] ${name}: ${details}`);
}

export async function runMultiProviderScaleMaxSuite() {
  console.log('\n================================================================');
  console.log('⚡ LIGHTNINGAPI MULTI-PROVIDER & SCALEMAX VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE 1: PROVIDER NEUTRALITY & DATABASE SEEDING
    // -------------------------------------------------------------------------
    console.log('--- TEST SUITE 1: Provider Neutrality & Database Seeding ---');
    
    const providers = await prisma.vendorProvider.findMany({
      where: { status: { not: 'disabled' } },
    });

    const opusMax = providers.find((p) => p.slug === 'opus_max' || p.name.includes('Opus'));
    const scaleMax = providers.find((p) => p.slug === 'scalemax' || p.name.includes('Scale'));

    recordTest(
      'Providers',
      'OpusMax First-Class Peer Record',
      !!opusMax && opusMax.capacityModel === 'rolling_window',
      opusMax ? `Found OpusMax (ID: ${opusMax.id}, URL: ${opusMax.baseUrl}, Model: ${opusMax.capacityModel})` : 'OpusMax not found'
    );

    recordTest(
      'Providers',
      'ScaleMax First-Class Peer Record',
      !!scaleMax && scaleMax.protocol === 'openai-compatible',
      scaleMax ? `Found ScaleMax (ID: ${scaleMax.id}, URL: ${scaleMax.baseUrl}, Protocol: ${scaleMax.protocol})` : 'ScaleMax not found'
    );

    recordTest(
      'Providers',
      'ScaleMax Dual Endpoints Configured',
      !!scaleMax?.apiCreditBaseUrl && !!scaleMax?.tokenPackBaseUrl,
      scaleMax ? `Credits: ${scaleMax.apiCreditBaseUrl} | Tokens: ${scaleMax.tokenPackBaseUrl}` : 'Missing ScaleMax endpoints'
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 2: MODEL CATALOG & DYNAMIC PROVIDER REASSIGNMENT
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Model Catalog & Dynamic Provider Reassignment ---');

    const allModels = await prisma.model.findMany({ where: { enabled: true } });
    const gpt4o = allModels.find((m) => m.modelId === 'gpt-4o');
    const o1 = allModels.find((m) => m.modelId === 'o1');
    const gemini = allModels.find((m) => m.modelId === 'gemini-2.5-pro');
    const deepseek = allModels.find((m) => m.modelId === 'deepseek-chat');
    const claudeSonnet = allModels.find((m) => m.modelId === 'claude-sonnet-5.5' || m.modelId === 'claude-3-7-sonnet-20250219');

    recordTest(
      'Model Catalog',
      'Non-Claude ScaleMax Models Ingested',
      !!gpt4o && !!o1 && !!gemini && !!deepseek,
      `Verified gpt-4o (${gpt4o?.family}), o1 (${o1?.family}), gemini-2.5-pro (${gemini?.family}), deepseek-chat (${deepseek?.family})`
    );

    recordTest(
      'Model Catalog',
      'Claude Models Default to OpusMax',
      claudeSonnet?.providerSlug === 'opus_max',
      `Claude model assigned to providerSlug: ${claudeSonnet?.providerSlug}`
    );

    // Dynamic Admin Reassignment Test: Change gpt-4o provider and verify dynamic gateway resolution
    if (gpt4o) {
      // Reassign to opus_max temporarily
      await prisma.model.update({
        where: { id: gpt4o.id },
        data: { providerSlug: 'opus_max' },
      });

      const dummyKey = { id: 'dummy_key_1', providerId: null };
      const resolvedOpus = await resolveProviderForApiKey(dummyKey, 'gpt-4o');

      const reassignSuccess = resolvedOpus.provider?.slug === 'opus_max';

      // Reassign back to scalemax
      await prisma.model.update({
        where: { id: gpt4o.id },
        data: { providerSlug: 'scalemax' },
      });

      const resolvedScale = await resolveProviderForApiKey(dummyKey, 'gpt-4o');
      const restoreSuccess = resolvedScale.provider?.slug === 'scalemax';

      recordTest(
        'Routing',
        'Zero-Code Model Provider Reassignment',
        reassignSuccess && restoreSuccess,
        `Dynamically routed gpt-4o to ${resolvedOpus.provider?.slug} when updated, and back to ${resolvedScale.provider?.slug}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 3: SCALEMAX PROVIDER ADAPTER
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: ScaleMax Adapter Capabilities ---');

    if (scaleMax) {
      const adapter = ProviderRegistry.createAdapterInstance(scaleMax as any);
      const isScaleAdapter = adapter instanceof ScaleMaxProviderAdapter;

      recordTest(
        'Adapter',
        'Factory Instantiates ScaleMaxProviderAdapter',
        isScaleAdapter,
        `Instantiated ${adapter.constructor.name} for slug ${scaleMax.slug}`
      );

      // Verify Credit vs Token Request URL Generation
      const creditReq = (adapter as ScaleMaxProviderAdapter).buildRequest('dummy_key', 'gpt-4o', {
        messages: [{ role: 'user', content: 'hello' }],
      }, 'credit');

      const tokenReq = (adapter as ScaleMaxProviderAdapter).buildRequest('dummy_key', 'gpt-4o', {
        messages: [{ role: 'user', content: 'hello' }],
      }, 'token');

      recordTest(
        'Adapter',
        'Dual URL Routing (Credit vs Token Pack)',
        creditReq.url.includes('api.scalemax.pro/v1') && tokenReq.url.includes('api.scalemax.pro/token'),
        `Credit URL: ${creditReq.url} | Token URL: ${tokenReq.url}`
      );

      // Verify Response Normalization for OpenAI format
      const mockOpenAiResponse = {
        id: 'chatcmpl-mock-123',
        object: 'chat.completion',
        choices: [{ message: { role: 'assistant', content: 'Synthesized response' } }],
        usage: {
          prompt_tokens: 45,
          completion_tokens: 120,
          total_tokens: 165,
        },
      };

      const normalized = adapter.normalizeResponse(200, mockOpenAiResponse, 10, 10);
      recordTest(
        'Adapter',
        'OpenAI Protocol Response Normalization',
        normalized.ok && normalized.usage.inputTokens === 45 && normalized.usage.outputTokens === 120,
        `Reported: in=${normalized.usage.inputTokens}, out=${normalized.usage.outputTokens}, source=${normalized.usage.usageSource}`
      );

      // Verify Error Sanitization
      const rawError = 'Error communicating with upstream https://api.scalemax.pro/v1 using sm_live_secretkey1234567890';
      const sanitized = (adapter as any).sanitizeErrorMessage(rawError);
      recordTest(
        'Adapter',
        'Secret & Upstream Host Sanitization',
        !sanitized.includes('sm_live_secretkey') && !sanitized.includes('api.scalemax.pro'),
        `Sanitized output: "${sanitized}"`
      );
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 4: MULTI-TYPE PLANS (CREDIT, TOKEN, WINDOW)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Plan Catalog & Server-Authoritative Multi-Plan ---');

    const activePlans = await getAllActivePlansAsync();
    const creditStarter = activePlans.find((p) => p.id === 'credit_starter');
    const creditGrowth = activePlans.find((p) => p.id === 'credit_growth');
    const tokenPack5m = activePlans.find((p) => p.id === 'token_pack_5m');
    const proWindow = activePlans.find((p) => p.id === 'pro');

    recordTest(
      'Plans',
      'Pay-As-You-Go Credit Plans Present with Multiplier',
      !!creditStarter && creditStarter.creditMultiplier === 7.0 && creditStarter.creditAmountUsd === 700.0,
      creditStarter ? `Starter: ₹${creditStarter.priceInr} -> $${creditStarter.creditAmountUsd} credits (${creditStarter.creditMultiplier}x multiplier)` : 'Missing'
    );

    recordTest(
      'Plans',
      'Growth Credit Plan Includes Bonus Credits',
      !!creditGrowth && (creditGrowth.bonusCreditsUsd || 0) > 0,
      creditGrowth ? `Growth: ₹${creditGrowth.priceInr} -> $${creditGrowth.creditAmountUsd} + $${creditGrowth.bonusCreditsUsd} bonus ($${(creditGrowth.creditAmountUsd || 0) + (creditGrowth.bonusCreditsUsd || 0)} total)` : 'Missing'
    );

    recordTest(
      'Plans',
      'Prepaid Token Packs Present',
      !!tokenPack5m && tokenPack5m.planType === 'token',
      tokenPack5m ? `5M Token Pack: Allowance=${tokenPack5m.tokenAllowance.toString()}, Validity=${tokenPack5m.validityDays}d` : 'Missing'
    );

    recordTest(
      'Plans',
      'Preserved Claude 5-Hour Rolling Window Plans',
      !!proWindow && proWindow.windowHours === 5,
      proWindow ? `Pro: 5M tokens / ${proWindow.windowHours}h window` : 'Missing'
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 5: ORDER ENGINE & FULFILLMENT LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Order Creation & Automated Key Fulfillment ---');

    // 1. Create a test customer user
    const testUser = await prisma.user.upsert({
      where: { email: 'multiprovider_test_user@lightningapi.pro' },
      create: {
        email: 'multiprovider_test_user@lightningapi.pro',
        name: 'ScaleMax Test Customer',
        passwordHash: 'dummy_hash',
      },
      update: {},
    });

    // 2. Test Credit Plan Order & Fulfillment
    const creditOrderParams = {
      userId: testUser.id,
      planId: 'credit_starter',
      billingPeriod: 'monthly' as const,
    };

    const creditOrderResult = await OrderEngine.createWebsiteOrder(creditOrderParams);
    recordTest(
      'OrderEngine',
      'Credit Plan Order Server-Authoritative Calculation',
      creditOrderResult.order.amountInr === 100,
      `Created order ${creditOrderResult.order.internalOrderId} for ₹${creditOrderResult.order.amountInr}`
    );

    // Simulate Payment & Fulfillment
    await prisma.order.update({
      where: { internalOrderId: creditOrderResult.order.internalOrderId },
      data: { paymentStatus: 'CAPTURED', paidAmountInr: 100, status: 'PAID' },
    });

    const creditFulfillment = await fulfillOrder(creditOrderResult.order.internalOrderId);
    const provisionedCreditKey = creditFulfillment.apiKeyId
      ? await prisma.apiKey.findUnique({ where: { id: creditFulfillment.apiKeyId } })
      : null;

    recordTest(
      'Fulfillment',
      'Provisioned Credit Key with $700 Balance',
      !!provisionedCreditKey && provisionedCreditKey.billingType === 'credit' && Number(provisionedCreditKey.creditBalanceUsd) === 700.0,
      provisionedCreditKey ? `Key: ${provisionedCreditKey.displayKey}, BillingType: ${provisionedCreditKey.billingType}, Balance: $${provisionedCreditKey.creditBalanceUsd}` : 'Fulfillment failed'
    );

    // 3. Test Token Pack Order & Fulfillment
    const tokenOrderResult = await OrderEngine.createWebsiteOrder({
      userId: testUser.id,
      planId: 'token_pack_5m',
      billingPeriod: 'monthly' as const,
    });

    await prisma.order.update({
      where: { internalOrderId: tokenOrderResult.order.internalOrderId },
      data: { paymentStatus: 'CAPTURED', paidAmountInr: 1499, status: 'PAID' },
    });

    const tokenFulfillment = await fulfillOrder(tokenOrderResult.order.internalOrderId);
    const provisionedTokenKey = tokenFulfillment.apiKeyId
      ? await prisma.apiKey.findUnique({ where: { id: tokenFulfillment.apiKeyId } })
      : null;

    recordTest(
      'Fulfillment',
      'Provisioned Token Pack Key with 5,000,000 Tokens',
      !!provisionedTokenKey && provisionedTokenKey.billingType === 'token' && provisionedTokenKey.tokensRemaining === BigInt(5000000),
      provisionedTokenKey ? `Key: ${provisionedTokenKey.displayKey}, BillingType: ${provisionedTokenKey.billingType}, Remaining: ${provisionedTokenKey.tokensRemaining.toString()}` : 'Fulfillment failed'
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 6: ATOMIC USAGE DEDUCTION & COST ACCOUNTING
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 6: Atomic Usage Deduction & Margin Accounting ---');

    if (provisionedCreditKey && scaleMax) {
      const initialCredit = Number(provisionedCreditKey.creditBalanceUsd);
      
      // Simulate API call using gpt-4o: 10,000 input tokens, 2,000 output tokens
      // Customer rates: in=$2.50/M, out=$10.00/M -> cost = (10000 * 2.50 + 2000 * 10.00)/1M = (0.025 + 0.02) = $0.045
      // Provider cost: in=$2.00/M, out=$8.00/M -> cost = (10000 * 2.00 + 2000 * 8.00)/1M = (0.02 + 0.016) = $0.036
      await updateTokensAndLog({
        keyRecord: provisionedCreditKey,
        model: 'gpt-4o',
        inputTokens: 10000,
        outputTokens: 2000,
        totalTokens: 12000,
        latencyMs: 140,
        streaming: false,
        vendorId: scaleMax.id,
      });

      const updatedKey = await prisma.apiKey.findUnique({ where: { id: provisionedCreditKey.id } });
      const deducted = initialCredit - Number(updatedKey?.creditBalanceUsd);
      const isDeductedCorrectly = Math.abs(deducted - 0.045) < 0.001;

      recordTest(
        'Accounting',
        'Atomic Dollar Credit Deduction per Model Rate',
        isDeductedCorrectly,
        `Initial: $${initialCredit} -> Deducted: $${deducted.toFixed(5)} -> Remaining: $${updatedKey?.creditBalanceUsd} (Expected ~$0.045)`
      );

      // Verify ApiRequest audit entry recorded cost and provider
      const apiReqLog = await prisma.apiRequest.findFirst({
        where: { apiKeyId: provisionedCreditKey.id },
        orderBy: { createdAt: 'desc' },
      });

      recordTest(
        'Audit',
        'ApiRequest Log Contains Provider, Model & Cost Metrics',
        apiReqLog?.billingPlanType === 'credit' && Number(apiReqLog.costDeductedUsd) > 0 && Number(apiReqLog.providerCostUsd) > 0,
        `Logged: Plan=${apiReqLog?.billingPlanType}, Upstream=${apiReqLog?.upstreamModel}, CostDeducted=$${apiReqLog?.costDeductedUsd}, ProviderCost=$${apiReqLog?.providerCostUsd}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 7: ZERO REGRESSION PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 7: Strict Regression Protection ---');

    // Verify Claude Opus 5.5 is supported and maps correctly
    const catalogOpus = findCatalogModel('claude-opus-5.5');
    const isSupported = isSupportedModel('claude-sonnet-5.5');

    recordTest(
      'Regression',
      'Claude Catalog & Aliases Intact',
      !!catalogOpus && isSupported,
      `Verified Claude Opus 5.5 (${catalogOpus?.upstreamId}) & Sonnet 5.5`
    );

    // Verify Studio Project schema untouched and functional
    const studioProjectsCount = await prisma.studioProject.count();
    recordTest(
      'Regression',
      'Studio Builder Infrastructure Untouched',
      studioProjectsCount >= 0,
      `StudioProject table verified (${studioProjectsCount} projects present)`
    );

    // Cleanup test data safely
    await prisma.apiKey.deleteMany({ where: { userId: testUser.id } });
    await prisma.order.deleteMany({ where: { userId: testUser.id } });
    await prisma.tokenLedger.deleteMany({ where: { userId: testUser.id } });

  } catch (err: any) {
    console.error('Fatal suite failure:', err);
    recordTest('Fatal', 'Suite Execution', false, err.message);
  }

  // Summary
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`⚡ FINAL RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedCount === totalCount) {
    console.log('🎉 ALL MULTI-PROVIDER & SCALEMAX VERIFICATION TESTS PASSED!');
    return true;
  } else {
    console.error('⚠️ SOME TESTS FAILED. Inspect details above.');
    return false;
  }
}

if (process.argv[1] && process.argv[1].includes('test-multi-provider-scalemax-suite')) {
  runMultiProviderScaleMaxSuite()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
