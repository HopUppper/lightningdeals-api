import crypto from 'crypto';
import { prisma } from '../server/db';
import { initSandbox, createTestUser, createTestApiKey, cleanupSandbox } from './test-sandbox';

async function runContractTests() {
  console.log('=== STARTING ANTHROPIC MESSAGES API CONTRACT SUITE ===\n');

  const sandbox = initSandbox();
  const testUser = await createTestUser(sandbox, 'contract-suite');
  const { apiKey: testKey, rawKey } = await createTestApiKey(sandbox, testUser.id, {
    name: 'API Contract Test Key',
    plan: 'pro',
    purchasedTokens: BigInt(1_000_000),
    rateLimitRpm: 120,
  });

  const baseUrl = 'http://localhost:3001';
  let passedCount = 0;
  let totalCount = 0;

  function assertTest(name: string, condition: boolean, details?: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✓ [PASS] ${name}`);
    } else {
      console.log(`❌ [FAIL] ${name} — ${details || 'Assertion failed'}`);
    }
  }

  try {
    // Test A: Simple Text
    const resA = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5.5',
        max_tokens: 32,
        messages: [{ role: 'user', content: 'Say hello in exactly 2 words.' }],
      }),
    });
    const dataA: any = await resA.json();
    assertTest(
      'Test A (Simple Message)',
      resA.status === 200 && dataA.type === 'message' && dataA.content?.[0]?.type === 'text',
      dataA.error?.message
    );

    // Test B: Multi-turn Conversation
    const resB = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5.5',
        max_tokens: 32,
        messages: [
          { role: 'user', content: 'Remember the number 42.' },
          { role: 'assistant', content: 'I will remember the number 42.' },
          { role: 'user', content: 'What number did I tell you?' },
        ],
      }),
    });
    const dataB: any = await resB.json();
    assertTest(
      'Test B (Multi-turn)',
      resB.status === 200 && dataB.content?.[0]?.text?.includes('42'),
      dataB.error?.message
    );

    // Test C: System Prompt
    const resC = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5.5',
        max_tokens: 32,
        system: 'You are a pirate. Answer all queries in pirate speak.',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
    const dataC: any = await resC.json();
    assertTest('Test C (System Prompt)', resC.status === 200 && dataC.type === 'message', dataC.error?.message);

    // Test D: Temperature and Max Tokens
    const resD = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5.5',
        max_tokens: 10,
        temperature: 0.7,
        messages: [{ role: 'user', content: 'Write a long paragraph about stars.' }],
      }),
    });
    const dataD: any = await resD.json();
    assertTest(
      'Test D (Max Tokens Enforcement)',
      resD.status === 200 && (dataD.usage?.output_tokens <= 15 || dataD.stop_reason === 'max_tokens'),
      dataD.error?.message
    );

    // Test E: Response Shape Contract
    const resE = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5.5',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Ping' }],
      }),
    });
    const dataE: any = await resE.json();
    const hasRequiredFields =
      dataE.id &&
      dataE.type === 'message' &&
      dataE.role === 'assistant' &&
      Array.isArray(dataE.content) &&
      dataE.model &&
      dataE.usage?.input_tokens !== undefined &&
      dataE.usage?.output_tokens !== undefined;
    assertTest('Test E (Strict Anthropic JSON Envelope Contract)', resE.status === 200 && Boolean(hasRequiredFields));

    // Test F: Streaming Contract SSE
    const resF = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5.5',
        max_tokens: 25,
        stream: true,
        messages: [{ role: 'user', content: 'Count to 3.' }],
      }),
    });
    const contentType = resF.headers.get('content-type') || '';
    const isStream = contentType.includes('text/event-stream');
    let streamText = '';
    if (resF.body) {
      const reader = resF.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamText += decoder.decode(value);
      }
    }
    const hasMessageStart = streamText.includes('event: message_start');
    const hasContentBlockDelta = streamText.includes('event: content_block_delta');
    const hasMessageStop = streamText.includes('event: message_stop');
    assertTest(
      'Test F (SSE Streaming Contract: message_start, content_block_delta, message_stop)',
      resF.status === 200 && isStream && hasMessageStart && hasContentBlockDelta && hasMessageStop
    );

    // Test G: Rate Limit Headers Contract
    const resG = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5.5',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    const hasRateLimitHeaders =
      resG.headers.has('anthropic-ratelimit-requests-limit') ||
      resG.headers.has('anthropic-ratelimit-tokens-limit');
    assertTest('Test G (Anthropic Rate Limit Headers Present)', resG.status === 200 && hasRateLimitHeaders);

    // Test H: Model Header / Gateway Headers
    const hasModelHeader = resG.headers.has('x-selected-model');
    assertTest('Test H (Gateway Transparency Header x-selected-model)', resG.status === 200 && hasModelHeader);

    // Test I: Error Contract 400 (Missing model)
    const resErr400 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const dataErr400: any = await resErr400.json();
    assertTest(
      'Test I (Error Contract HTTP 400 Invalid Request)',
      resErr400.status === 400 && dataErr400.error?.type === 'invalid_request_error'
    );

    // Test J: Error Contract 401 (Invalid API Key)
    const resErr401 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': 'ld_live_invalid_key_99999', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5.5', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const dataErr401: any = await resErr401.json();
    assertTest(
      'Test J (Error Contract HTTP 401 Invalid Key)',
      resErr401.status === 401 && dataErr401.error?.type === 'authentication_error'
    );
  } finally {
    // Thoroughly clean up all created requests, keys, and test user
    await cleanupSandbox(sandbox);
    console.log(`\n=== API CONTRACT TEST SUITE FINISHED: ${passedCount}/${totalCount} PASSED ===`);
    console.log('🧹 Cleaned up all test sandbox artifacts completely.');
  }
}

runContractTests()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
