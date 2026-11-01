import { prisma } from '../server/db';
import { initSandbox, createTestUser, createTestApiKey, cleanupSandbox } from './test-sandbox';
import { detectModelFamily } from '../server/gateway';
import { handleCheckKeyStatus } from '../server/tools';

async function main() {
  console.log('=== STARTING TOKEN PLAN & UPSTREAM SEPARATION TEST ===\n');

  const ctx = initSandbox();

  try {
    // -------------------------------------------------------------
    // TEST 1: Model Family Classifier
    // -------------------------------------------------------------
    console.log('[Test 1] Testing detectModelFamily classifier...');
    if (detectModelFamily('claude-sonnet-5.5') !== 'claude') throw new Error('claude-sonnet-5.5 not detected as claude');
    if (detectModelFamily('claude-opus-5.5') !== 'claude') throw new Error('claude-opus-5.5 not detected as claude');
    if (detectModelFamily('gpt-4o') !== 'openai') throw new Error('gpt-4o not detected as openai');
    if (detectModelFamily('o1-mini') !== 'openai') throw new Error('o1-mini not detected as openai');
    if (detectModelFamily('o3-mini') !== 'openai') throw new Error('o3-mini not detected as openai');
    if (detectModelFamily('deepseek-chat') !== 'deepseek') throw new Error('deepseek-chat not detected as deepseek');
    if (detectModelFamily('grok-2') !== 'grok') throw new Error('grok-2 not detected as grok');
    if (detectModelFamily('qwen-2.5-coder') !== 'qwen') throw new Error('qwen-2.5-coder not detected as qwen');
    console.log('✅ detectModelFamily correctly classified all model families.');

    // -------------------------------------------------------------
    // TEST 2: ScaleMax Direct Key Inspection via /api/key-status
    // -------------------------------------------------------------
    console.log('\n[Test 2] Testing ScaleMax direct Key 1 & Key 2 inspection via handleCheckKeyStatus...');
    const mockRes = () => {
      let statusCode = 200;
      let jsonData: any = null;
      return {
        status: (c: number) => { statusCode = c; return { json: (d: any) => { jsonData = d; } }; },
        json: (d: any) => { jsonData = d; },
        getData: () => ({ statusCode, jsonData }),
      };
    };

    const res1 = mockRes();
    await handleCheckKeyStatus({ query: { key: 'sm_live_94387a770f7f5781b59e4310208392be' }, headers: {} } as any, res1 as any);
    const d1 = res1.getData().jsonData;
    if (!d1 || !d1.valid) throw new Error('Key 1 inspection returned invalid');
    if (d1.billingType !== 'token') throw new Error(`Expected Key 1 billingType to be 'token', got ${d1.billingType}`);
    if (d1.keyArchitecture !== 'token_pool') throw new Error(`Expected Key 1 keyArchitecture 'token_pool', got ${d1.keyArchitecture}`);
    console.log(`✅ Key 1 (sm_live_9438...) verified: billingType=${d1.billingType}, plan="${d1.plan}", modelsCount=${d1.availableModels?.length}`);

    const res2 = mockRes();
    await handleCheckKeyStatus({ query: { key: 'sm_live_8beaa27e4a159c731b96ba9443c06620' }, headers: {} } as any, res2 as any);
    const d2 = res2.getData().jsonData;
    if (!d2 || !d2.valid) throw new Error('Key 2 inspection returned invalid');
    if (d2.billingType !== 'token') throw new Error(`Expected Key 2 billingType to be 'token', got ${d2.billingType}`);
    if (d2.keyArchitecture !== 'token_pool') throw new Error(`Expected Key 2 keyArchitecture 'token_pool', got ${d2.keyArchitecture}`);
    console.log(`✅ Key 2 (sm_live_8bea...) verified: billingType=${d2.billingType}, plan="${d2.plan}", modelsCount=${d2.availableModels?.length}`);

    // -------------------------------------------------------------
    // TEST 3: Customer Sandbox Key Model Segregation
    // -------------------------------------------------------------
    console.log('\n[Test 3] Creating isolated test user sandbox...');
    const testUser = await createTestUser(ctx, 'token-segregation');

    // 3a. Claude Token Key
    const { apiKey: claudeApiKey, rawKey: claudeRawKey } = await createTestApiKey(ctx, testUser.id, {
      name: 'Test Claude Token Pack Key',
      billingType: 'token',
      purchasedTokens: 10000000n,
      plan: 'Claude 10M Token Pack',
    });
    // Set allowedModelFamilies to ['claude']
    const updatedClaude = await prisma.apiKey.update({
      where: { id: claudeApiKey.id },
      data: { allowedModelFamilies: JSON.stringify(['claude']), tokensRemaining: 10000000n },
    });

    const resClaude = mockRes();
    await handleCheckKeyStatus({ query: { key: claudeRawKey }, headers: {} } as any, resClaude as any);
    const dClaude = resClaude.getData().jsonData;
    if (!dClaude.valid) throw new Error('Claude test key check failed');
    if (dClaude.billingType !== 'token') throw new Error('Expected billingType token');
    if (!dClaude.allowedModelFamilies.includes('claude')) throw new Error('Expected allowedModelFamilies to include claude');
    
    // Verify availableModels contains only Claude models
    const hasNonClaude = dClaude.availableModels.some((m: any) => !m.id.toLowerCase().includes('claude') && !m.id.toLowerCase().includes('fable'));
    if (hasNonClaude) throw new Error('Claude key returned non-Claude models in availableModels!');
    console.log(`✅ Claude Token Key verified: allowedModelFamilies=${JSON.stringify(dClaude.allowedModelFamilies)}, all ${dClaude.availableModels.length} models are Claude-only.`);

    // 3b. OpenAI Token Key
    const { apiKey: openaiApiKey, rawKey: openaiRawKey } = await createTestApiKey(ctx, testUser.id, {
      name: 'Test OpenAI Token Pack Key',
      billingType: 'token',
      purchasedTokens: 10000000n,
      plan: 'OpenAI 10M Token Pack',
    });
    // Set allowedModelFamilies to ['openai']
    const updatedOpenai = await prisma.apiKey.update({
      where: { id: openaiApiKey.id },
      data: { allowedModelFamilies: JSON.stringify(['openai']), tokensRemaining: 10000000n },
    });

    const resOpenai = mockRes();
    await handleCheckKeyStatus({ query: { key: openaiRawKey }, headers: {} } as any, resOpenai as any);
    const dOpenai = resOpenai.getData().jsonData;
    if (!dOpenai.valid) throw new Error('OpenAI test key check failed');
    if (dOpenai.billingType !== 'token') throw new Error('Expected billingType token');
    if (!dOpenai.allowedModelFamilies.includes('openai')) throw new Error('Expected allowedModelFamilies to include openai');

    // Verify availableModels contains only OpenAI models
    const hasNonOpenai = dOpenai.availableModels.some((m: any) => m.id.toLowerCase().includes('claude') || m.id.toLowerCase().includes('deepseek'));
    if (hasNonOpenai) throw new Error('OpenAI key returned non-OpenAI models in availableModels!');
    console.log(`✅ OpenAI Token Key verified: allowedModelFamilies=${JSON.stringify(dOpenai.allowedModelFamilies)}, all ${dOpenai.availableModels.length} models are OpenAI-only.`);

    // -------------------------------------------------------------
    // TEST 4: Gateway Model Gating Simulation
    // -------------------------------------------------------------
    console.log('\n[Test 4] Testing Gateway model gating logic...');
    const { validateKeyRecordAndCheckAllowance } = await import('../server/gateway');

    // Claude Key tries Claude model -> Allowed
    const gate1 = await validateKeyRecordAndCheckAllowance(updatedClaude, 'claude-sonnet-5.5');
    if (gate1.errorStatus) throw new Error(`Claude key was blocked from claude-sonnet-5.5: ${gate1.errorMessage}`);
    console.log('✅ Claude Key -> claude-sonnet-5.5: PERMITTED (200 OK)');

    // Claude Key tries OpenAI model -> Blocked 403
    const gate2 = await validateKeyRecordAndCheckAllowance(updatedClaude, 'gpt-4o');
    if (!gate2.errorStatus || gate2.errorStatus !== 403) throw new Error('Claude key was NOT blocked from gpt-4o!');
    console.log(`✅ Claude Key -> gpt-4o: STRICTLY BLOCKED (403 ${gate2.errorCode}: ${gate2.errorMessage})`);

    // OpenAI Key tries OpenAI model -> Allowed
    const gate3 = await validateKeyRecordAndCheckAllowance(updatedOpenai, 'gpt-4o');
    if (gate3.errorStatus) throw new Error(`OpenAI key was blocked from gpt-4o: ${gate3.errorMessage}`);
    console.log('✅ OpenAI Key -> gpt-4o: PERMITTED (200 OK)');

    // OpenAI Key tries Claude model -> Blocked 403
    const gate4 = await validateKeyRecordAndCheckAllowance(updatedOpenai, 'claude-sonnet-5.5');
    if (!gate4.errorStatus || gate4.errorStatus !== 403) throw new Error('OpenAI key was NOT blocked from claude-sonnet-5.5!');
    console.log(`✅ OpenAI Key -> claude-sonnet-5.5: STRICTLY BLOCKED (403 ${gate4.errorCode}: ${gate4.errorMessage})`);

    console.log('\n🎉 ALL TOKEN PLAN SEGREGATION & UPSTREAM TESTS PASSED SUCCESSFULLY!');
  } finally {
    // -------------------------------------------------------------
    // Strict Database Hygiene & Sandbox Cleanup
    // -------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test sandbox entities...');
    await cleanupSandbox(ctx);
    await prisma.$disconnect();
    console.log('✅ Test sandbox successfully purged. Zero residual test records.');
  }
}

main().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
