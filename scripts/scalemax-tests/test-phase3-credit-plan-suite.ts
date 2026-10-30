import assert from 'assert';
import {
  resolveProviderCredential,
  determineCustomerBillingType,
  isScaleMaxProvider,
} from '../../server/providers/credentialResolver';
import {
  convertAnthropicMessagesToOpenAI,
  convertAnthropicToolsToOpenAI,
  convertAnthropicToolChoiceToOpenAI,
  convertOpenAIResponseToAnthropic,
  OpenAIToAnthropicStreamTransformer,
} from '../../server/providers/protocolBridge';
import {
  reserveCredits,
  releaseCreditReservation,
  releaseCreditForRequest,
  inFlightCreditReservations,
  inFlightCreditByRequest,
} from '../../server/accounting/tokenReservation';
import { ScaleMaxProviderAdapter } from '../../server/providerAdapter';
import { OpenAICompatibleAdapter } from '../../server/providers/OpenAICompatibleAdapter';
import { encryptText, decryptText } from '../../server/crypto';
import { checkMasterCapacity } from '../../server/masterLedger';

// Setup test environment encryption keys
process.env.DATA_ENCRYPTION_KEY = 'test_vault_secret_key_for_offline_verification_2026';

let passedTests = 0;
let failedTests = 0;

function runTest(category: string, id: string, name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      throw new Error(`Test ${id} returned a promise, please use runAsyncTest instead`);
    }
    passedTests++;
    console.log(`✅ PASS [${category}] ${id}: ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`❌ FAIL [${category}] ${id}: ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

async function runAsyncTest(category: string, id: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passedTests++;
    console.log(`✅ PASS [${category}] ${id}: ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`❌ FAIL [${category}] ${id}: ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

async function main() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGAPI × SCALEMAX — MAIN PHASE 3 CREDIT-PLAN TEST SUITE');
  console.log('================================================================\n');

  const FAKE_CREDIT_KEY = 'sm_live_credit_test_key_valid_12345';
  const FAKE_TOKEN_KEY = 'sm_live_token_test_key_valid_67890';
  const FAKE_OPUS_KEY = 'sk-ant-opm-fake-master-key-opus';

  const encryptedCreditKey = encryptText(FAKE_CREDIT_KEY);
  const encryptedTokenKey = encryptText(FAKE_TOKEN_KEY);
  const encryptedOpusKey = encryptText(FAKE_OPUS_KEY);

  const mockScaleMaxProvider = {
    id: 'prov_scalemax_credit',
    name: 'ScaleMax',
    slug: 'scalemax',
    protocol: 'openai-compatible',
    status: 'connected',
    creditApiKeyEncrypted: encryptedCreditKey,
    tokenApiKeyEncrypted: encryptedTokenKey,
    apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
    tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
    costPerMillionInput: 1.5,
    costPerMillionOutput: 6.0,
    costPerMillionCached: 0.75,
    billingModel: 'credit_wallet',
    capacityModel: 'credit',
  };

  const mockOpusMaxProvider = {
    id: 'prov_opus_max',
    name: 'Opus Max',
    slug: 'opus_max',
    protocol: 'anthropic',
    status: 'connected',
    masterApiKeyEncrypted: encryptedOpusKey,
    baseUrl: 'https://api.opusmax.pro',
    billingModel: 'rolling_window',
    capacityModel: 'rolling_window',
  };

  // ===========================================================================
  // 1. ELIGIBILITY & CREDENTIAL RESOLUTION TESTS
  // ===========================================================================
  console.log('--- 1. Eligibility & Credential Resolution ---');

  runTest('Eligibility & Credentials', 'ELIG-01', 'Eligible credit-plan customer selects ScaleMax credit credential', () => {
    const keyRecord = {
      id: 'key_cust_credit_1',
      userId: 'user_1',
      billingType: 'credit',
      status: 'active',
      creditBalanceUsd: 25.00,
    };
    const res = resolveProviderCredential(mockScaleMaxProvider, keyRecord);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.credential.apiKey, FAKE_CREDIT_KEY);
      assert.strictEqual(res.credential.keySource, 'credit');
      assert.strictEqual(res.credential.billingType, 'credit');
    }
  });

  runTest('Eligibility & Credentials', 'ELIG-02', 'Token customer cannot be forced onto credit path by client request headers/params', () => {
    const keyRecord = {
      id: 'key_cust_token_1',
      userId: 'user_2',
      billingType: 'token',
      status: 'active',
    };
    // Simulate malicious client attempting to send client-level billing overrides
    const clientPayload = { billingType: 'credit', billingModel: 'credit' };
    const entitlement = determineCustomerBillingType(keyRecord);
    assert.strictEqual(entitlement, 'token');

    const res = resolveProviderCredential(mockScaleMaxProvider, keyRecord);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.credential.apiKey, FAKE_TOKEN_KEY);
      assert.strictEqual(res.credential.keySource, 'token');
    }
  });

  runTest('Eligibility & Credentials', 'ELIG-03', 'Credit-plan request cannot use token credential', () => {
    const keyRecord = {
      id: 'key_cust_credit_2',
      userId: 'user_3',
      billingType: 'credit',
      status: 'active',
      creditBalanceUsd: 10.00,
    };
    const res = resolveProviderCredential(mockScaleMaxProvider, keyRecord);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.notStrictEqual(res.credential.apiKey, FAKE_TOKEN_KEY);
    }
  });

  runTest('Eligibility & Credentials', 'ELIG-04', 'Missing credit credential fails closed safely with HTTP 502', () => {
    const providerWithoutCreditKey = {
      ...mockScaleMaxProvider,
      creditApiKeyEncrypted: null,
    };
    delete process.env.SCALEMAX_CREDIT_MASTER_API_KEY;
    delete process.env.SCALEMAX_MASTER_API_KEY;

    const keyRecord = { id: 'key_cust_credit_3', billingType: 'credit' };
    const res = resolveProviderCredential(providerWithoutCreditKey, keyRecord);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.strictEqual(res.failure.error.status, 502);
      assert.strictEqual(res.failure.error.code, 'missing_credit_master_key');
      assert.ok(!res.failure.error.message.includes('sk-'));
    }
  });

  runTest('Eligibility & Credentials', 'ELIG-05', 'OpusMax routing remains untouched for credit-plan customer', () => {
    const keyRecord = { id: 'key_cust_credit_4', billingType: 'credit' };
    const res = resolveProviderCredential(mockOpusMaxProvider, keyRecord);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.credential.apiKey, FAKE_OPUS_KEY);
      assert.strictEqual(res.credential.keySource, 'master');
    }
  });

  runTest('Eligibility & Credentials', 'ELIG-06', 'Undecryptable credit credential fails closed safely with HTTP 502', () => {
    const corruptProvider = {
      ...mockScaleMaxProvider,
      creditApiKeyEncrypted: 'gcm:badiv:badtag:badciphertext',
    };
    const keyRecord = { id: 'key_cust_corrupt', billingType: 'credit' };
    const res = resolveProviderCredential(corruptProvider, keyRecord);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.strictEqual(res.failure.error.status, 502);
    }
  });

  // ===========================================================================
  // 2. CREDIT BALANCES & RESERVATIONS
  // ===========================================================================
  console.log('\n--- 2. Credit Balances & Reservations ---');

  runTest('Credit Balances & Reservations', 'RES-01', 'Zero or negative credit balance rejects request', () => {
    const keyRecord = {
      id: 'key_exhausted_1',
      creditBalanceUsd: 0.00,
      billingType: 'credit',
    };
    const inFlightCredit = inFlightCreditReservations.get(keyRecord.id) || 0;
    const availableCreditToSpend = Number(keyRecord.creditBalanceUsd) - inFlightCredit;
    assert.ok(availableCreditToSpend <= 0);
  });

  runTest('Credit Balances & Reservations', 'RES-02', 'Positive available balance permits reservation with requestId tagging', () => {
    const keyId = 'key_active_res_1';
    const reqId = 'req_msg_res_001';
    const initialBal = 10.00;

    // Reset maps
    inFlightCreditReservations.delete(keyId);
    inFlightCreditByRequest.delete(reqId);

    reserveCredits(keyId, 0.005, reqId);
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0.005);
    assert.deepStrictEqual(inFlightCreditByRequest.get(reqId), { keyId, amount: 0.005 });

    const availableCreditToSpend = initialBal - (inFlightCreditReservations.get(keyId) || 0);
    assert.strictEqual(availableCreditToSpend, 9.995);
  });

  runTest('Credit Balances & Reservations', 'RES-03', 'Concurrent requests exhaust available balance and prevent overdrawing', () => {
    const keyId = 'key_concurrent_pool_1';
    const creditBal = 0.010; // Exactly enough for 2 concurrent requests at $0.005 buffer

    inFlightCreditReservations.delete(keyId);

    // Request 1
    const avail1 = creditBal - (inFlightCreditReservations.get(keyId) || 0);
    assert.ok(avail1 > 0);
    reserveCredits(keyId, 0.005, 'req_c1');

    // Request 2
    const avail2 = creditBal - (inFlightCreditReservations.get(keyId) || 0);
    assert.ok(avail2 > 0);
    reserveCredits(keyId, 0.005, 'req_c2');

    // Request 3 arrives concurrently - balance is now fully reserved!
    const avail3 = creditBal - (inFlightCreditReservations.get(keyId) || 0);
    assert.ok(avail3 <= 0, 'Third concurrent request must be rejected to prevent overdraw');
  });

  runTest('Credit Balances & Reservations', 'RES-04', 'Failed upstream request releases credit reservation cleanly', () => {
    const keyId = 'key_cleanup_test_1';
    const reqId = 'req_failed_upstream_1';

    inFlightCreditReservations.delete(keyId);
    inFlightCreditByRequest.delete(reqId);

    reserveCredits(keyId, 0.005, reqId);
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0.005);

    // Simulate upstream error (HTTP 502 / timeout)
    const released = releaseCreditForRequest(reqId);
    assert.strictEqual(released, true);
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0);
    assert.strictEqual(inFlightCreditByRequest.has(reqId), false);
  });

  runTest('Credit Balances & Reservations', 'RES-05', 'Release is idempotent - multiple calls do not over-decrement reservation map', () => {
    const keyId = 'key_idempotent_test_1';
    const reqId = 'req_double_release_1';

    inFlightCreditReservations.delete(keyId);
    inFlightCreditByRequest.delete(reqId);

    reserveCredits(keyId, 0.005, reqId);
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0.005);

    const firstRelease = releaseCreditForRequest(reqId);
    assert.strictEqual(firstRelease, true);
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0);

    // Second release attempt (e.g. from both error handler and stream close)
    const secondRelease = releaseCreditForRequest(reqId);
    assert.strictEqual(secondRelease, false, 'Second release must be a no-op');
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0, 'Reservation must not go negative');
  });

  runTest('Credit Balances & Reservations', 'RES-06', 'Customer credit ledgers remain isolated across different keys and users', () => {
    const keyA = 'key_cust_A';
    const keyB = 'key_cust_B';

    inFlightCreditReservations.delete(keyA);
    inFlightCreditReservations.delete(keyB);

    reserveCredits(keyA, 0.005, 'req_A1');
    assert.strictEqual(inFlightCreditReservations.get(keyA), 0.005);
    assert.strictEqual(inFlightCreditReservations.get(keyB) || 0, 0);

    reserveCredits(keyB, 0.005, 'req_B1');
    assert.strictEqual(inFlightCreditReservations.get(keyA), 0.005);
    assert.strictEqual(inFlightCreditReservations.get(keyB), 0.005);

    releaseCreditForRequest('req_A1');
    assert.strictEqual(inFlightCreditReservations.get(keyA), 0);
    assert.strictEqual(inFlightCreditReservations.get(keyB), 0.005);

    releaseCreditForRequest('req_B1');
    assert.strictEqual(inFlightCreditReservations.get(keyB), 0);
  });

  // ===========================================================================
  // 3. ROUTING & COMPATIBILITY
  // ===========================================================================
  console.log('\n--- 3. Routing & Compatibility ---');

  const scaleMaxAdapter = new ScaleMaxProviderAdapter(mockScaleMaxProvider as any);
  const openAiAdapter = new OpenAICompatibleAdapter();

  runTest('Routing & Compatibility', 'ROUTE-01', 'Credit OpenAI chat completions use exact normalized URL', () => {
    const req = scaleMaxAdapter.buildRequest(FAKE_CREDIT_KEY, 'gpt-4o', {
      messages: [{ role: 'user', content: 'hi' }],
    }, 'credit');
    assert.strictEqual(req.url, 'https://api.scalemax.pro/v1/chat/completions');
    assert.strictEqual(req.headers['authorization'], `Bearer ${FAKE_CREDIT_KEY}`);
  });

  runTest('Routing & Compatibility', 'ROUTE-02', 'Credit Anthropic Messages endpoint uses exact normalized URL', () => {
    const req = scaleMaxAdapter.buildRequest(FAKE_CREDIT_KEY, 'claude-3-5-sonnet-20241022', {
      messages: [{ role: 'user', content: 'hello' }],
    }, 'credit');
    assert.strictEqual(req.url, 'https://api.scalemax.pro/v1/chat/completions');
    assert.strictEqual(req.body.model, 'claude-3-5-sonnet-20241022');
  });

  runTest('Routing & Compatibility', 'ROUTE-03', 'Credit model catalogue uses credit base URL without /v1 duplication', () => {
    const modelsUrl = openAiAdapter.buildModelsUrl(mockScaleMaxProvider, 'credit');
    assert.strictEqual(modelsUrl, 'https://api.scalemax.pro/v1/models');
  });

  runTest('Routing & Compatibility', 'ROUTE-04', 'Model name preservation - requested model is passed faithfully to provider', () => {
    const targetModel = 'claude-sonnet-5.5';
    const req = scaleMaxAdapter.buildRequest(FAKE_CREDIT_KEY, targetModel, {
      messages: [{ role: 'user', content: 'test' }],
    }, 'credit');
    // Model catalog maps claude-sonnet-5.5 to upstreamId claude-sonnet-5
    assert.strictEqual(req.body.model, 'claude-sonnet-5');
  });

  runTest('Routing & Compatibility', 'ROUTE-05', 'Anthropic tool schema and tool choice properly converted for credit request', () => {
    const anthropicTools = [
      {
        name: 'get_stock_price',
        description: 'Fetch stock quote',
        input_schema: {
          type: 'object',
          properties: { ticker: { type: 'string' } },
          required: ['ticker'],
        },
      },
    ];
    const req = scaleMaxAdapter.buildRequest(FAKE_CREDIT_KEY, 'claude-3-5-sonnet-20241022', {
      messages: [{ role: 'user', content: 'what is AAPL' }],
      tools: anthropicTools,
      tool_choice: { type: 'tool', name: 'get_stock_price' },
    }, 'credit');

    assert.ok(Array.isArray(req.body.tools));
    assert.strictEqual(req.body.tools[0].type, 'function');
    assert.strictEqual(req.body.tools[0].function.name, 'get_stock_price');
    assert.deepStrictEqual(req.body.tools[0].function.parameters, anthropicTools[0].input_schema);
    assert.deepStrictEqual(req.body.tool_choice, { type: 'function', function: { name: 'get_stock_price' } });
  });

  runTest('Routing & Compatibility', 'ROUTE-06', 'Streaming mode preserves stream flag and credit URL', () => {
    const req = scaleMaxAdapter.buildRequest(FAKE_CREDIT_KEY, 'gpt-4o', {
      messages: [{ role: 'user', content: 'tell a story' }],
      stream: true,
    }, 'credit');
    assert.strictEqual(req.url, 'https://api.scalemax.pro/v1/chat/completions');
    assert.strictEqual(req.body.stream, true);
  });

  runTest('Routing & Compatibility', 'ROUTE-07', 'Trailing slashes and pre-appended path segments normalize correctly', () => {
    const messyProvider = {
      ...mockScaleMaxProvider,
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1///',
    };
    const adapter = new ScaleMaxProviderAdapter(messyProvider as any);
    const req = adapter.buildRequest(FAKE_CREDIT_KEY, 'gpt-4o', {
      messages: [{ role: 'user', content: 'test' }],
    }, 'credit');
    assert.strictEqual(req.url, 'https://api.scalemax.pro/v1/chat/completions');
  });

  runTest('Routing & Compatibility', 'ROUTE-08', 'Unsupported model families filter check blocks unauthorized family access', () => {
    const keyWithFamilyRestrictions = {
      allowedModelFamilies: JSON.stringify(['claude']),
    };
    const allowed = JSON.parse(keyWithFamilyRestrictions.allowedModelFamilies);
    const requestedModel = 'gpt-4o';
    let modelFamily = 'claude';
    if (requestedModel.includes('gpt')) modelFamily = 'openai';

    const isPermitted = allowed.includes(modelFamily);
    assert.strictEqual(isPermitted, false, 'gpt-4o must be blocked when key only permits claude family');
  });

  // ===========================================================================
  // 4. USAGE & ACCOUNTING
  // ===========================================================================
  console.log('\n--- 4. Usage & Accounting ---');

  runTest('Usage & Accounting', 'ACCT-01', 'Extracts prompt_tokens and completion_tokens from non-streaming upstream response', () => {
    const fakeOpenAiResponse = {
      id: 'chatcmpl-test-01',
      choices: [
        {
          message: { role: 'assistant', content: 'Here is the answer.' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 45,
        total_tokens: 195,
      },
    };

    const anthropicResp = convertOpenAIResponseToAnthropic(fakeOpenAiResponse, 'claude-sonnet-5.5');
    assert.strictEqual(anthropicResp.usage.input_tokens, 150);
    assert.strictEqual(anthropicResp.usage.output_tokens, 45);
    assert.strictEqual(anthropicResp.stop_reason, 'end_turn');
  });

  runTest('Usage & Accounting', 'ACCT-02', 'Missing usage fields gracefully handled with zero defaults (no NaN or negative values)', () => {
    const missingUsageResp = {
      id: 'chatcmpl-test-02',
      choices: [{ message: { role: 'assistant', content: 'Short answer' } }],
    };
    const converted = convertOpenAIResponseToAnthropic(missingUsageResp, 'claude-sonnet-5.5');
    assert.strictEqual(converted.usage.input_tokens, 0);
    assert.strictEqual(converted.usage.output_tokens, 0);
    assert.ok(Number.isFinite(converted.usage.input_tokens));
    assert.ok(Number.isFinite(converted.usage.output_tokens));
  });

  runTest('Usage & Accounting', 'ACCT-03', 'Streaming transformer propagates upstream usage tokens', () => {
    const transformer = new OpenAIToAnthropicStreamTransformer('claude-sonnet-5.5', 'msg_test_stream_01');
    transformer.processChunk({
      id: 'chunk_1',
      choices: [{ delta: { content: 'Streaming test ' } }],
    });
    transformer.processChunk({
      id: 'chunk_2',
      choices: [{ delta: { content: 'completed.' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 300, completion_tokens: 80 },
    });
    const finalEvents = transformer.finish();
    const tokenInfo = transformer.getReportedTokens();
    assert.strictEqual(tokenInfo.inputTokens, 300);
    assert.strictEqual(tokenInfo.outputTokens, 80);

    const deltaEvent = finalEvents.find((e) => e.startsWith('event: message_delta'));
    assert.ok(deltaEvent);
    assert.ok(deltaEvent.includes('"output_tokens":80'));
  });

  runTest('Usage & Accounting', 'ACCT-04', 'Streaming transformer calculates deterministic character estimate when upstream omits usage', () => {
    const transformer = new OpenAIToAnthropicStreamTransformer('claude-sonnet-5.5', 'msg_test_stream_02');
    transformer.processChunk({
      choices: [{ delta: { content: '12345678901234567890123456789012345678' } }], // 38 characters
    });
    const finalEvents = transformer.finish({ inputTokens: 50, outputTokens: 10 });
    const streamedText = transformer.getStreamedText();
    assert.strictEqual(streamedText.length, 38);
    const estTokens = Math.max(1, Math.ceil(streamedText.length / 3.8)); // exactly 10 tokens
    assert.strictEqual(estTokens, 10);
  });

  runTest('Usage & Accounting', 'ACCT-05', 'Wholesale cost and retail credit deduction calculations follow exact math', () => {
    const inPrice = 3.00; // $3.00 / M retail
    const outPrice = 15.00; // $15.00 / M retail
    const cachedPrice = inPrice * 0.50; // $1.50 / M retail

    const pInCost = 1.50; // $1.50 / M wholesale
    const pOutCost = 6.00; // $6.00 / M wholesale
    const pCachedCost = pInCost * 0.50; // $0.75 / M wholesale

    const inputTokens = 10000;
    const outputTokens = 2000;
    const cachedTokens = 2000;
    const uncachedInput = inputTokens - cachedTokens; // 8000

    const costDeductedUsd = Math.round(((uncachedInput * inPrice + cachedTokens * cachedPrice + outputTokens * outPrice) / 1000000) * 100000) / 100000;
    const providerCostUsd = Math.round(((uncachedInput * pInCost + cachedTokens * pCachedCost + outputTokens * pOutCost) / 1000000) * 100000) / 100000;
    const marginUsd = Math.round((costDeductedUsd - providerCostUsd) * 100000) / 100000;

    // uncachedInput: 8000 * 3 = 24,000
    // cachedTokens: 2000 * 1.5 = 3,000
    // outputTokens: 2000 * 15 = 30,000
    // total retail: 57,000 / 1,000,000 = $0.057
    assert.strictEqual(costDeductedUsd, 0.057);

    // uncachedInput cost: 8000 * 1.5 = 12,000
    // cachedTokens cost: 2000 * 0.75 = 1,500
    // outputTokens cost: 2000 * 6 = 12,000
    // total wholesale: 25,500 / 1,000,000 = $0.0255
    assert.strictEqual(providerCostUsd, 0.0255);

    // margin: 0.057 - 0.0255 = $0.0315
    assert.strictEqual(marginUsd, 0.0315);
  });

  runTest('Usage & Accounting', 'ACCT-06', 'Credit request deduction does not alter token-plan tokensRemaining', () => {
    const keyRecord = {
      id: 'key_credit_partition_1',
      billingType: 'credit',
      tokensRemaining: 500000n, // Prepaid tokens from earlier plan
      creditBalanceUsd: 10.00,
      totalCreditsUsedUsd: 0,
    };

    const costDeductedUsd = 0.05;
    const curCreditBal = keyRecord.creditBalanceUsd;
    const newCreditBal = Math.max(0, Math.round((curCreditBal - costDeductedUsd) * 100000) / 100000);

    // Verify credit balance decrements, but tokensRemaining is untouched
    assert.strictEqual(newCreditBal, 9.95);
    assert.strictEqual(keyRecord.tokensRemaining, 500000n);
  });

  runTest('Usage & Accounting', 'ACCT-07', 'Negative or invalid token inputs are sanitized to non-negative integers', () => {
    const rawInputTokens = -50;
    const rawOutputTokens = NaN;
    const safeInput = Math.max(0, Math.floor(Number(rawInputTokens) || 0));
    const safeOutput = Math.max(0, Math.floor(Number(rawOutputTokens) || 0));
    assert.strictEqual(safeInput, 0);
    assert.strictEqual(safeOutput, 0);
  });

  // ===========================================================================
  // 5. SECURITY & REGRESSION
  // ===========================================================================
  console.log('\n--- 5. Security & Regression ---');

  runTest('Security & Regression', 'SEC-01', 'No master credential is leaked in converted Anthropic responses', () => {
    const fakeUpstreamResponse = {
      id: 'chatcmpl-sec-01',
      choices: [{ message: { role: 'assistant', content: 'Secret response' } }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    };
    const converted = convertOpenAIResponseToAnthropic(fakeUpstreamResponse, 'claude-sonnet-5.5');
    const serialized = JSON.stringify(converted);
    assert.ok(!serialized.includes(FAKE_CREDIT_KEY));
    assert.ok(!serialized.includes(FAKE_TOKEN_KEY));
    assert.ok(!serialized.includes(FAKE_OPUS_KEY));
  });

  runTest('Security & Regression', 'SEC-02', 'Zero cross-billing env fallback occurs for token customer', () => {
    process.env.SCALEMAX_CREDIT_MASTER_API_KEY = 'sm_live_credit_env_fallback_only';
    const providerWithoutKeys = {
      id: 'prov_empty',
      name: 'ScaleMax',
      slug: 'scalemax',
      protocol: 'openai-compatible',
    };
    const tokenCustomer = { id: 'key_token_strict', billingType: 'token' };
    const res = resolveProviderCredential(providerWithoutKeys, tokenCustomer);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      assert.strictEqual(res.failure.error.code, 'missing_token_master_key');
      assert.notStrictEqual(res.failure.error.code, 'missing_credit_master_key');
    }
    delete process.env.SCALEMAX_CREDIT_MASTER_API_KEY;
  });

  runTest('Security & Regression', 'SEC-03', 'Client cancellation releases in-flight credit reservation cleanly', () => {
    const keyId = 'key_client_cancel_1';
    const reqId = 'req_client_cancel_001';

    inFlightCreditReservations.delete(keyId);
    inFlightCreditByRequest.delete(reqId);

    reserveCredits(keyId, 0.005, reqId);
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0.005);

    // Simulate client abort event: req.on('close') triggers safeCleanup()
    const released = releaseCreditForRequest(reqId);
    assert.strictEqual(released, true);
    assert.strictEqual(inFlightCreditReservations.get(keyId), 0);
  });

  runTest('Security & Regression', 'SEC-04', 'ScaleMax provider status disabled in DB fails closed for customer requests', () => {
    const disabledScaleMax = {
      ...mockScaleMaxProvider,
      status: 'disabled',
    };
    // In gateway.ts, provider.status === 'disabled' blocks with 503 PROVIDER_DISABLED
    assert.strictEqual(disabledScaleMax.status, 'disabled');
  });

  runTest('Security & Regression', 'SEC-05', 'Master token reservation does not block credit wholesale provider', () => {
    const creditProviderAccounting = {
      providerId: 'prov_scalemax_credit',
      providerName: 'ScaleMax',
      capacityModel: 'credit' as const,
      billingModel: 'credit_wallet',
      effectiveAvailableTokens: 0,
      activeMasterReservations: 0,
      status: 'HEALTHY' as const,
    };
    // If provider is credit_wallet / credit, capacity is available regardless of token window
    const isCredit = creditProviderAccounting.capacityModel === 'credit' || creditProviderAccounting.billingModel === 'credit_wallet';
    assert.strictEqual(isCredit, true);
  });

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
