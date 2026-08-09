import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function runContractTests() {
  console.log('=== STARTING ANTHROPIC MESSAGES API CONTRACT SUITE ===\n');

  // Create isolated test key
  const rawKey = 'ld_live_contract_' + crypto.randomBytes(8).toString('hex');
  const keyHash = hashApiKey(rawKey);
  const devUser = await prisma.user.findFirst({ where: { role: 'user' } });

  const testKey = await prisma.apiKey.create({
    data: {
      userId: devUser?.id,
      name: 'API Contract Test Key',
      keyPrefix: 'ld_live_',
      keyHash,
      displayKey: rawKey.substring(0, 11) + '...' + rawKey.slice(-4),
      type: 'live',
      status: 'active',
      plan: 'pro',
      purchasedTokens: BigInt(100000),
      tokensRemaining: BigInt(100000),
      tokensUsed: BigInt(0),
      rateLimitRpm: 120,
    },
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
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 50, messages: [{ role: 'user', content: 'Hello' }] }),
    });
    const dataA: any = await resA.json();
    assertTest('Test A (Simple Text)', resA.status === 200 && dataA.type === 'message' && dataA.role === 'assistant' && Array.isArray(dataA.content));

    // Test B: System Prompt + User Message
    const resB = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        system: 'You are a helpful programming assistant.',
        messages: [{ role: 'user', content: 'What is 2+2?' }],
      }),
    });
    const dataB: any = await resB.json();
    assertTest('Test B (System Prompt + User Message)', resB.status === 200 && dataB.role === 'assistant' && !dataB.content[0].text.includes('helpful programming assistant'));

    // Test C: Multi-Turn Conversation
    const resC = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello! How can I help?' },
          { role: 'user', content: 'Explain recursion.' },
        ],
      }),
    });
    const dataC: any = await resC.json();
    assertTest('Test C (Multi-Turn Conversation)', resC.status === 200 && dataC.role === 'assistant');

    // Test D: Large Message Payload
    const largeContent = 'X'.repeat(5000);
    const resD = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 50, messages: [{ role: 'user', content: largeContent }] }),
    });
    const dataD: any = await resD.json();
    assertTest('Test D (Large Message Payload 5KB)', resD.status === 200 && dataD.usage.input_tokens > 500);

    // Test E: Tool Definition Transport
    const resE = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Get weather' }],
        tools: [{ name: 'get_weather', description: 'Get current weather', input_schema: { type: 'object', properties: { location: { type: 'string' } } } }],
      }),
    });
    const dataE: any = await resE.json();
    assertTest('Test E (Tool Definition Transport)', resE.status === 200 && dataE.type === 'message');

    // Test F: Multiple Tools & tool_choice
    const resF = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Calculate math' }],
        tools: [
          { name: 'calculator', description: 'Perform arithmetic', input_schema: { type: 'object' } },
          { name: 'web_search', description: 'Search web', input_schema: { type: 'object' } },
        ],
        tool_choice: { type: 'auto' },
      }),
    });
    const dataF: any = await resF.json();
    assertTest('Test F (Multiple Tools & tool_choice)', resF.status === 200 && dataF.type === 'message');

    // Test G: Response Contract Fields
    const hasAllFields = 'id' in dataA && 'type' in dataA && 'role' in dataA && 'model' in dataA && 'content' in dataA && 'stop_reason' in dataA && 'usage' in dataA;
    assertTest('Test G (Response Contract Field Schema)', hasAllFields && dataA.usage.input_tokens > 0 && dataA.usage.output_tokens > 0);

    // Test H: Streaming SSE Event Sequence
    const resH = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 50, stream: true, messages: [{ role: 'user', content: 'Ping' }] }),
    });
    const sseBody = await resH.text();
    const hasStart = sseBody.includes('event: message_start');
    const hasBlock = sseBody.includes('event: content_block_start');
    const hasDelta = sseBody.includes('event: content_block_delta');
    const hasStop = sseBody.includes('event: message_stop');
    assertTest('Test H (Streaming SSE Event Sequence)', resH.status === 200 && resH.headers.get('content-type')?.includes('text/event-stream') && hasStart && hasBlock && hasDelta && hasStop);

    // Test I: Error Contract 400 (Missing Required Field: model)
    const resErr400 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const dataErr400: any = await resErr400.json();
    assertTest('Test I (Error Contract HTTP 400 Invalid Request)', resErr400.status === 400 && dataErr400.error?.type === 'invalid_request_error');

    // Test J: Error Contract 401 (Invalid API Key)
    const resErr401 = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': 'ld_live_invalid_key_99999', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const dataErr401: any = await resErr401.json();
    assertTest('Test J (Error Contract HTTP 401 Invalid Key)', resErr401.status === 401 && dataErr401.error?.type === 'authentication_error');

  } finally {
    // Cleanup test key
    await prisma.apiKey.delete({ where: { id: testKey.id } });
    console.log(`\n=== API CONTRACT TEST SUITE FINISHED: ${passedCount}/${totalCount} PASSED ===`);
  }
}

runContractTests().then(() => prisma.$disconnect());
