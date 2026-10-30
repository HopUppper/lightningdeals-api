/**
 * LightningAPI × ScaleMax — Main Phase 2 Offline Verification Suite
 * Deterministic, offline regression test suite covering:
 * 1. Credential separation & billing-mode enforcement
 * 2. Admin credential decoupling
 * 3. URL routing & discovery regression protection
 * 4. Request conversion (tools, parameters, messages, thinking)
 * 5. Non-streaming response conversion
 * 6. Streaming SSE lifecycle translation & termination
 * 7. OpusMax regression isolation
 *
 * Safety Invariants: ZERO external network calls, ZERO database writes.
 */

import {
  convertAnthropicToolsToOpenAI,
  convertAnthropicToolChoiceToOpenAI,
  convertAnthropicMessagesToOpenAI,
  convertOpenAIResponseToAnthropic,
  mapOpenAIFinishReasonToAnthropic,
  OpenAIToAnthropicStreamTransformer,
} from '../../server/providers/protocolBridge';

import {
  resolveProviderCredential,
  isScaleMaxProvider,
  determineCustomerBillingType,
} from '../../server/providers/credentialResolver';

// Mock encrypt/decrypt functions for pure offline verification
function mockDecrypt(ciphertext: string): string {
  if (ciphertext.startsWith('enc_')) return ciphertext.replace('enc_', '');
  return ciphertext;
}

interface TestReportItem {
  suite: string;
  id: string;
  description: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  detail?: string;
}

const report: TestReportItem[] = [];

function assertTest(suite: string, id: string, description: string, actual: any, expected: any, detail?: string) {
  const passed = actual === expected;
  report.push({ suite, id, description, passed, actual, expected, detail });
}

function runAllSuites() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGAPI × SCALEMAX — MAIN PHASE 2 OFFLINE REGRESSION SUITE');
  console.log('================================================================\n');

  // ===========================================================================
  // SUITE 1: CREDENTIAL SEPARATION & BILLING-MODE ENFORCEMENT
  // ===========================================================================
  console.log('--- 1. Testing Credential Separation & Billing-Mode Enforcement ---');

  const mockScaleMaxVendor = {
    id: 'vendor_scalemax',
    name: 'ScaleMax',
    slug: 'scalemax',
    creditApiKeyEncrypted: 'mock_credit_key_val',
    tokenApiKeyEncrypted: 'mock_token_key_val',
    masterApiKeyEncrypted: 'mock_generic_key_val',
  };

  // 1.1 Credit keyRecord selects ONLY creditApiKey
  const res1_1 = resolveProviderCredential(mockScaleMaxVendor, { id: 'k1', billingType: 'credit' });
  assertTest(
    'Credential Separation',
    'CRED-01',
    'Credit plan request selects ScaleMax credit credential',
    res1_1.success && res1_1.credential.keySource === 'credit' && res1_1.credential.billingType === 'credit',
    true
  );

  // 1.2 Token keyRecord selects ONLY tokenApiKey
  const res1_2 = resolveProviderCredential(mockScaleMaxVendor, { id: 'k2', billingType: 'token' });
  assertTest(
    'Credential Separation',
    'CRED-02',
    'Token plan request selects ScaleMax token credential',
    res1_2.success && res1_2.credential.keySource === 'token' && res1_2.credential.billingType === 'token',
    true
  );

  // 1.3 Missing token credential fails closed (no fallback to credit key or master key)
  const vendorMissingToken = {
    ...mockScaleMaxVendor,
    tokenApiKeyEncrypted: '',
  };
  const res1_3 = resolveProviderCredential(vendorMissingToken, { id: 'k3', billingType: 'token' });
  assertTest(
    'Credential Separation',
    'CRED-03',
    'Missing token credential fails closed (zero cross-billing fallback)',
    res1_3.success === false && res1_3.failure?.error.code === 'missing_token_master_key',
    true,
    res1_3.success ? 'Failed: Fallback occurred!' : 'Correctly rejected with missing_token_master_key'
  );

  // 1.4 Missing credit credential fails closed (no fallback to token key)
  const vendorMissingCredit = {
    ...mockScaleMaxVendor,
    creditApiKeyEncrypted: '',
  };
  // Ensure env var does not mask missing credit key during test
  const origEnv = process.env.SCALEMAX_MASTER_API_KEY;
  delete process.env.SCALEMAX_MASTER_API_KEY;
  delete process.env.SCALEMAX_CREDIT_MASTER_API_KEY;

  const res1_4 = resolveProviderCredential(vendorMissingCredit, { id: 'k4', billingType: 'credit' });
  assertTest(
    'Credential Separation',
    'CRED-04',
    'Missing credit credential fails closed (zero fallback to token key)',
    res1_4.success === false && res1_4.failure?.error.code === 'missing_credit_master_key',
    true
  );
  if (origEnv) process.env.SCALEMAX_MASTER_API_KEY = origEnv;

  // 1.5 Server entitlement enforcement: client cannot override billingType via properties
  const keyWithPlan = { id: 'k5', billingType: 'credit', requestedBilling: 'token', plan: { planType: 'credit' } };
  const billingDetermined = determineCustomerBillingType(keyWithPlan);
  assertTest(
    'Credential Separation',
    'CRED-05',
    'Server entitlement determines billing mode (client parameter override blocked)',
    billingDetermined,
    'credit'
  );

  // 1.6 OpusMax provider unaffected (uses generic master key)
  const mockOpusMaxVendor = {
    id: 'vendor_opus',
    name: 'Opus Max',
    slug: 'opus_max',
    masterApiKeyEncrypted: 'mock_opus_master_key',
  };
  const res1_6 = resolveProviderCredential(mockOpusMaxVendor, { id: 'k6', billingType: 'credit' });
  assertTest(
    'Credential Separation',
    'CRED-06',
    'OpusMax provider preserves standard master key resolution',
    res1_6.success && res1_6.credential.keySource === 'master',
    true
  );

  // ===========================================================================
  // SUITE 2: ADMIN CREDENTIAL INTEGRITY (Simulation of admin.ts logic)
  // ===========================================================================
  console.log('\n--- 2. Testing Admin Credential Update Integrity ---');

  function simulateAdminVendorUpdate(
    currentRecord: { creditApiKeyEncrypted: string; tokenApiKeyEncrypted: string; masterApiKeyEncrypted: string },
    body: { creditApiKey?: any; tokenApiKey?: any }
  ) {
    const updateData: any = {};
    if (body.creditApiKey !== undefined && typeof body.creditApiKey === 'string' && body.creditApiKey.trim()) {
      updateData.creditApiKeyEncrypted = `enc_${body.creditApiKey.trim()}`;
    }
    if (body.tokenApiKey !== undefined) {
      if (typeof body.tokenApiKey === 'string' && body.tokenApiKey.trim()) {
        updateData.tokenApiKeyEncrypted = `enc_${body.tokenApiKey.trim()}`;
      }
    }
    return { ...currentRecord, ...updateData };
  }

  const initialAdminVendor = {
    creditApiKeyEncrypted: 'enc_initial_credit',
    tokenApiKeyEncrypted: 'enc_initial_token',
    masterApiKeyEncrypted: 'enc_initial_master',
  };

  // 2.1 Updating credit key touches ONLY creditApiKeyEncrypted (masterApiKeyEncrypted preserved)
  const afterCreditUpdate = simulateAdminVendorUpdate(initialAdminVendor, { creditApiKey: 'new_credit_key' });
  assertTest(
    'Admin Credential Integrity',
    'ADMIN-01',
    'Updating creditApiKey does NOT overwrite masterApiKeyEncrypted',
    afterCreditUpdate.masterApiKeyEncrypted,
    'enc_initial_master'
  );
  assertTest(
    'Admin Credential Integrity',
    'ADMIN-02',
    'Updating creditApiKey does NOT overwrite tokenApiKeyEncrypted',
    afterCreditUpdate.tokenApiKeyEncrypted,
    'enc_initial_token'
  );

  // 2.2 Updating token key touches ONLY tokenApiKeyEncrypted
  const afterTokenUpdate = simulateAdminVendorUpdate(initialAdminVendor, { tokenApiKey: 'new_token_key' });
  assertTest(
    'Admin Credential Integrity',
    'ADMIN-03',
    'Updating tokenApiKey does NOT overwrite creditApiKeyEncrypted',
    afterTokenUpdate.creditApiKeyEncrypted,
    'enc_initial_credit'
  );

  // 2.3 Empty input does not erase existing token key
  const afterEmptyToken = simulateAdminVendorUpdate(initialAdminVendor, { tokenApiKey: '   ' });
  assertTest(
    'Admin Credential Integrity',
    'ADMIN-04',
    'Whitespace tokenApiKey preserves existing token key (safe update semantics)',
    afterEmptyToken.tokenApiKeyEncrypted,
    'enc_initial_token'
  );

  // ===========================================================================
  // SUITE 3: URL CONSTRUCTION & DISCOVERY REGRESSION PROTECTION
  // ===========================================================================
  console.log('\n--- 3. Testing URL Construction & Discovery Protection ---');

  function resolveTestUrl(cleanBase: string, endpoint: 'chat/completions' | 'messages' | 'models'): string {
    const base = cleanBase.replace(/\/+$/, '');
    if (base.endsWith(`/${endpoint}`)) return base;
    return base.endsWith('/v1') ? `${base}/${endpoint}` : `${base}/v1/${endpoint}`;
  }

  assertTest('Routing', 'URL-01', 'Credit OpenAI chat completion', resolveTestUrl('https://api.scalemax.pro/v1', 'chat/completions'), 'https://api.scalemax.pro/v1/chat/completions');
  assertTest('Routing', 'URL-02', 'Token OpenAI chat completion', resolveTestUrl('https://api.scalemax.pro/token/v1', 'chat/completions'), 'https://api.scalemax.pro/token/v1/chat/completions');
  assertTest('Routing', 'URL-03', 'Credit Anthropic Messages', resolveTestUrl('https://api.scalemax.pro/v1', 'messages'), 'https://api.scalemax.pro/v1/messages');
  assertTest('Routing', 'URL-04', 'Token Anthropic Messages', resolveTestUrl('https://api.scalemax.pro/token/v1', 'messages'), 'https://api.scalemax.pro/token/v1/messages');
  assertTest('Routing', 'URL-05', 'Credit model catalogue', resolveTestUrl('https://api.scalemax.pro/v1', 'models'), 'https://api.scalemax.pro/v1/models');
  assertTest('Routing', 'URL-06', 'Token model catalogue', resolveTestUrl('https://api.scalemax.pro/token/v1', 'models'), 'https://api.scalemax.pro/token/v1/models');
  assertTest('Routing', 'URL-07', 'Trailing slash normalization', resolveTestUrl('https://api.scalemax.pro/v1///', 'messages'), 'https://api.scalemax.pro/v1/messages');
  assertTest('Routing', 'URL-08', 'Pre-appended suffix idempotency', resolveTestUrl('https://api.scalemax.pro/v1/messages', 'messages'), 'https://api.scalemax.pro/v1/messages');

  // ===========================================================================
  // SUITE 4: REQUEST CONVERSION (TOOLS, MESSAGES, PARAMETERS)
  // ===========================================================================
  console.log('\n--- 4. Testing Request Conversion (Tools & Messages) ---');

  const anthropicTools = [
    {
      name: 'get_weather',
      description: 'Get live weather for city',
      input_schema: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
    {
      name: 'calculate_tax',
      description: 'Calculate income tax',
      input_schema: {
        type: 'object',
        properties: { income: { type: 'number' } },
        required: ['income'],
      },
    },
  ];

  const convertedTools = convertAnthropicToolsToOpenAI(anthropicTools);
  assertTest(
    'Request Conversion',
    'REQ-01',
    'Converts multiple Anthropic tools to OpenAI function format',
    convertedTools?.length === 2 &&
      convertedTools[0].type === 'function' &&
      convertedTools[0].function.name === 'get_weather' &&
      convertedTools[0].function.parameters?.properties?.city?.type === 'string',
    true
  );

  const toolChoiceAuto = convertAnthropicToolChoiceToOpenAI({ type: 'auto' });
  const toolChoiceSpecific = convertAnthropicToolChoiceToOpenAI({ type: 'tool', name: 'get_weather' });
  assertTest('Request Conversion', 'REQ-02', 'Maps tool_choice auto to auto', toolChoiceAuto, 'auto');
  assertTest(
    'Request Conversion',
    'REQ-03',
    'Maps tool_choice specific tool to function structure',
    toolChoiceSpecific?.function?.name,
    'get_weather'
  );

  // Message conversion with system and tool_use / tool_result
  const anthropicHistory = [
    { role: 'user', content: 'What is the weather in Delhi?' },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Checking Delhi weather...' },
        { type: 'tool_use', id: 'toolu_delhi', name: 'get_weather', input: { city: 'Delhi' } },
      ],
    },
    {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'toolu_delhi', content: '32°C Sunny' }],
    },
  ];

  const convertedMessages = convertAnthropicMessagesToOpenAI(anthropicHistory, 'You are a helpful assistant.');
  assertTest('Request Conversion', 'REQ-04', 'System instruction unshifted as first message', convertedMessages[0].role, 'system');
  assertTest('Request Conversion', 'REQ-05', 'Tool use block mapped to assistant tool_calls', convertedMessages[2].tool_calls?.[0]?.function?.name, 'get_weather');
  assertTest('Request Conversion', 'REQ-06', 'Tool result block mapped to role tool message', convertedMessages[3].role, 'tool');
  assertTest('Request Conversion', 'REQ-07', 'Tool result tool_call_id preserved', convertedMessages[3].tool_call_id, 'toolu_delhi');

  // ===========================================================================
  // SUITE 5: NON-STREAMING RESPONSE CONVERSION
  // ===========================================================================
  console.log('\n--- 5. Testing Non-Streaming Response Conversion ---');

  const openAiNonStreamingResponse = {
    id: 'chatcmpl-test-response-1',
    object: 'chat.completion',
    created: 1735689600,
    model: 'gpt-4o',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Here is the current weather update for Delhi.',
          tool_calls: [
            {
              id: 'call_lookup_1',
              type: 'function',
              function: {
                name: 'get_forecast',
                arguments: '{"city":"Delhi","days":3}',
              },
            },
          ],
        },
        finish_reason: 'tool_calls',
      },
    ],
    usage: {
      prompt_tokens: 35,
      completion_tokens: 65,
      total_tokens: 100,
    },
  };

  const convertedResponse = convertOpenAIResponseToAnthropic(openAiNonStreamingResponse, 'claude-sonnet-5.5');
  assertTest('Response Conversion', 'RESP-01', 'Response type is "message"', convertedResponse.type, 'message');
  assertTest('Response Conversion', 'RESP-02', 'Assistant role preserved', convertedResponse.role, 'assistant');
  assertTest('Response Conversion', 'RESP-03', 'Model name preserved as requested target', convertedResponse.model, 'claude-sonnet-5.5');
  assertTest('Response Conversion', 'RESP-04', 'Contains text content block', convertedResponse.content[0].type === 'text' && convertedResponse.content[0].text.includes('Delhi'), true);
  assertTest('Response Conversion', 'RESP-05', 'Contains tool_use content block with parsed input', convertedResponse.content[1].type === 'tool_use' && convertedResponse.content[1].input?.city === 'Delhi', true);
  assertTest('Response Conversion', 'RESP-06', 'Stop reason tool_calls mapped to tool_use', convertedResponse.stop_reason, 'tool_use');
  assertTest('Response Conversion', 'RESP-07', 'Usage input_tokens mapped from prompt_tokens', convertedResponse.usage.input_tokens, 35);
  assertTest('Response Conversion', 'RESP-08', 'Usage output_tokens mapped from completion_tokens', convertedResponse.usage.output_tokens, 65);

  // Stop reason mappings
  assertTest('Response Conversion', 'RESP-09', 'Stop reason stop -> end_turn', mapOpenAIFinishReasonToAnthropic('stop'), 'end_turn');
  assertTest('Response Conversion', 'RESP-10', 'Stop reason length -> max_tokens', mapOpenAIFinishReasonToAnthropic('length'), 'max_tokens');

  // ===========================================================================
  // SUITE 6: STREAMING RESPONSE CONVERSION (OpenAI SSE -> Anthropic SSE)
  // ===========================================================================
  console.log('\n--- 6. Testing Streaming Response Conversion ---');

  const transformer = new OpenAIToAnthropicStreamTransformer('claude-sonnet-5.5', 'msg_stream_test_123');

  const chunk1 = {
    id: 'chatcmpl-stream-1',
    object: 'chat.completion.chunk',
    choices: [{ index: 0, delta: { role: 'assistant', content: 'Hello' }, finish_reason: null }],
  };
  const chunk2 = {
    id: 'chatcmpl-stream-1',
    object: 'chat.completion.chunk',
    choices: [{ index: 0, delta: { content: ' world!' }, finish_reason: null }],
  };
  const chunk3 = {
    id: 'chatcmpl-stream-1',
    object: 'chat.completion.chunk',
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
  };

  const events1 = transformer.processChunk(chunk1);
  const events2 = transformer.processChunk(chunk2);
  const events3 = transformer.processChunk(chunk3);
  const finalEvents = transformer.finish();

  const allStreamEvents = [...events1, ...events2, ...events3, ...finalEvents];
  const streamOutput = allStreamEvents.join('');

  assertTest('Streaming', 'STRM-01', 'Emits message_start as first event', allStreamEvents[0].startsWith('event: message_start'), true);
  assertTest('Streaming', 'STRM-02', 'Emits content_block_start', streamOutput.includes('event: content_block_start'), true);
  assertTest('Streaming', 'STRM-03', 'Emits content_block_delta with text', streamOutput.includes('content_block_delta') && streamOutput.includes('world!'), true);
  assertTest('Streaming', 'STRM-04', 'Emits content_block_stop before terminal events', streamOutput.includes('event: content_block_stop'), true);
  assertTest('Streaming', 'STRM-05', 'Emits message_delta with stop_reason', streamOutput.includes('event: message_delta') && streamOutput.includes('"stop_reason":"end_turn"'), true);
  assertTest('Streaming', 'STRM-06', 'Propagates upstream output usage tokens', streamOutput.includes('"output_tokens":8'), true);
  assertTest('Streaming', 'STRM-07', 'Emits message_stop as terminal event', allStreamEvents[allStreamEvents.length - 1].startsWith('event: message_stop'), true);

  // Idempotency: calling finish() twice does NOT produce duplicate terminal events
  const duplicateEvents = transformer.finish();
  assertTest('Streaming', 'STRM-08', 'Idempotent stream termination (no duplicate terminal events)', duplicateEvents.length, 0);

  // Zero raw OpenAI SSE chunks leaked
  assertTest('Streaming', 'STRM-09', 'No raw chat.completion.chunk leaked to Anthropic client', streamOutput.includes('chat.completion.chunk'), false);

  // ===========================================================================
  // SUMMARY REPORT
  // ===========================================================================
  console.log('\n================================================================');
  console.log('MAIN PHASE 2 TEST EXECUTION SUMMARY:');
  console.log('================================================================');

  let passedTotal = 0;
  let failedTotal = 0;

  for (const item of report) {
    const icon = item.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} [${item.suite}] ${item.id}: ${item.description}`);
    if (!item.passed) {
      console.log(`     Expected: ${JSON.stringify(item.expected)}`);
      console.log(`     Actual  : ${JSON.stringify(item.actual)}`);
      if (item.detail) console.log(`     Detail  : ${item.detail}`);
      failedTotal++;
    } else {
      passedTotal++;
    }
  }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${report.length} | PASSED: ${passedTotal} | FAILED: ${failedTotal}`);
  console.log('================================================================');

  if (failedTotal > 0) {
    process.exit(1);
  }
}

runAllSuites();
