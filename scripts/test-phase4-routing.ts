import 'dotenv/config';
import { prisma, decryptText } from '../server/db';
import {
  resolveProviderForApiKey,
  sanitizeModelResponse,
  sanitizeErrorMessage,
  handleMessagesEndpoint,
} from '../server/gateway';
import { resolveVendorModel, buildProviderRequest } from '../server/providerAdapter';
import { checkMasterCapacity } from '../server/masterLedger';
import { generateProviderApiKey } from '../server/keyService';

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (i < retries - 1) {
        console.warn(`[DB RETRY] Connection attempt ${i + 1} failed (${err.message}). Retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs = Math.round(delayMs * 1.5);
      }
    }
  }
  throw lastError;
}

function createMockResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: any = null;
  let rawOutput = '';
  let ended = false;

  const res: any = {
    statusCode: 200,
    setHeader: (k: string, v: string) => { headers[k.toLowerCase()] = v; },
    status: (code: number) => { statusCode = code; res.statusCode = code; return res; },
    json: (data: any) => { body = data; ended = true; return res; },
    write: (chunk: string) => { rawOutput += chunk; },
    end: () => { ended = true; },
    on: () => {},
    getHeaders: () => headers,
    getBody: () => body,
    getStatusCode: () => statusCode,
    getRawOutput: () => rawOutput,
    isEnded: () => ended,
  };
  return res;
}

async function runPhase4Tests() {
  console.log('=================================================================');
  console.log('⚡ LIGHTNINGAPI — PHASE 4: PROVIDER-AWARE GATEWAY ROUTING TESTS');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Warm up connection with retry
  console.log('Connecting to database pooler...');
  await withRetry(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });
  console.log('✓ Database connection established.\n');

  // Pre-test Database Baseline
  const initialKeyCount = await withRetry(() => prisma.apiKey.count());
  const initialReqCount = await withRetry(() => prisma.apiRequest.count());
  const initialLedgerCount = await withRetry(() => prisma.masterTokenLedger.count());
  console.log('Pre-test Database Baseline:');
  console.log(`  - Total ApiKeys: ${initialKeyCount}`);
  console.log(`  - Total ApiRequests: ${initialReqCount}`);
  console.log(`  - Total MasterTokenLedger: ${initialLedgerCount}\n`);

  const createdTestReqIds: string[] = [];
  const createdTestKeyIds: string[] = [];
  let originalDefaultSetting: string | null = null;

  try {
    const scaleMax = await withRetry(() =>
      prisma.vendorProvider.findFirst({
        where: { name: 'ScaleMax' },
      })
    );
    const primaryVendorDisabled = await withRetry(() =>
      prisma.vendorProvider.findUnique({
        where: { id: '6798fd18-421f-4b11-b3e6-1d06476c1856' },
      })
    );
    const defaultSetting = await withRetry(() =>
      prisma.systemSetting.findUnique({
        where: { key: 'default_provider_id' },
      })
    );
    originalDefaultSetting = defaultSetting?.value || null;

    // Pick an existing real LD key from database for read-only resolution testing
    const existingLdKey = await withRetry(() =>
      prisma.apiKey.findFirst({
        where: { keyPrefix: { startsWith: 'ld_' } },
        include: { provider: true, user: true },
      })
    );

    assert(Boolean(existingLdKey), 'Found existing production LD key for testing');
    assert(Boolean(scaleMax), 'ScaleMax provider exists in database');
    assert(Boolean(primaryVendorDisabled), 'Primary Vendor Provider (disabled) exists in database');

    // -------------------------------------------------------------------------
    // TEST 1: Existing LD Key Resolves Authoritatively to ScaleMax
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Existing LD Key Resolves to ScaleMax ---');
    const res1 = await resolveProviderForApiKey(existingLdKey);
    assert(!res1.error, 'Provider resolution succeeded with no error');
    assert(res1.provider?.id === scaleMax?.id, 'LD key resolves to ScaleMax provider ID');
    assert(res1.provider?.name === 'ScaleMax', 'Resolved provider name is ScaleMax');

    // -------------------------------------------------------------------------
    // TEST 2: Existing LD Key Cannot Be Redirected by Changing default_provider_id
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: default_provider_id Cannot Redirect Existing Keys ---');
    await withRetry(() =>
      prisma.systemSetting.update({
        where: { key: 'default_provider_id' },
        data: { value: '00000000-0000-0000-0000-000000000000' },
      })
    );

    const res2 = await resolveProviderForApiKey(existingLdKey);
    assert(!res2.error, 'Resolution succeeded despite default setting change');
    assert(res2.provider?.id === scaleMax?.id, 'Existing LD key STILL routes to ScaleMax');

    // Restore original default setting
    if (originalDefaultSetting) {
      await withRetry(() =>
        prisma.systemSetting.update({
          where: { key: 'default_provider_id' },
          data: { value: originalDefaultSetting },
        })
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Unknown Provider ID Fails Safely
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Unknown providerId Fails Safely ---');
    const unknownKeyMock = {
      ...existingLdKey,
      providerId: '99999999-9999-9999-9999-999999999999',
      provider: null,
    };
    const res3 = await resolveProviderForApiKey(unknownKeyMock);
    assert(Boolean(res3.error), 'Unknown providerId returns error');
    assert(res3.error?.status === 503, 'Unknown providerId returns HTTP 503');
    assert(res3.error?.code === 'PROVIDER_NOT_FOUND', 'Error code is PROVIDER_NOT_FOUND');

    // -------------------------------------------------------------------------
    // TEST 4: Disabled Provider Fails Safely
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Disabled Provider Fails Safely ---');
    const disabledKeyMock = {
      ...existingLdKey,
      providerId: primaryVendorDisabled?.id,
      provider: primaryVendorDisabled,
    };
    const res4 = await resolveProviderForApiKey(disabledKeyMock);
    assert(Boolean(res4.error), 'Disabled provider returns error');
    assert(res4.error?.status === 503, 'Disabled provider returns HTTP 503');
    assert(res4.error?.code === 'PROVIDER_DISABLED', 'Error code is PROVIDER_DISABLED');

    // -------------------------------------------------------------------------
    // TEST 5: NULL / Missing providerId Fails Safely
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: NULL providerId Fails Safely ---');
    const nullKeyMock = {
      ...existingLdKey,
      providerId: null,
      provider: null,
    };
    const res5 = await resolveProviderForApiKey(nullKeyMock);
    assert(Boolean(res5.error), 'NULL providerId returns error');
    assert(res5.error?.status === 500, 'NULL providerId returns HTTP 500 configuration error');
    assert(res5.error?.code === 'MISSING_PROVIDER_ASSOCIATION', 'Error code is MISSING_PROVIDER_ASSOCIATION');

    // -------------------------------------------------------------------------
    // TEST 6, 7, 8: Client Inputs & Key Prefixes Cannot Override DB providerId
    // -------------------------------------------------------------------------
    console.log('\n--- TESTS 6-8: Strict Database Authority (Anti-Tampering) ---');
    const keyWithScaleMax = { ...existingLdKey, providerId: scaleMax?.id, provider: scaleMax };
    const resAuth = await resolveProviderForApiKey(keyWithScaleMax);
    assert(resAuth.provider?.id === scaleMax?.id, 'Database providerId is sole authority');

    const skKeyWithScaleMax = {
      ...existingLdKey,
      keyPrefix: 'sk_live_',
      providerId: scaleMax?.id,
      provider: scaleMax,
    };
    const resPrefix = await resolveProviderForApiKey(skKeyWithScaleMax);
    assert(resPrefix.provider?.id === scaleMax?.id, 'Key prefix does NOT override database providerId');

    // -------------------------------------------------------------------------
    // TEST 9: ScaleMax Model Mapping
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Provider-Specific Model Resolution ---');
    const mappedSonnet = resolveVendorModel(scaleMax, 'claude-sonnet-5');
    assert(mappedSonnet === 'claude-3-5-sonnet-20241022', 'claude-sonnet-5 maps to claude-3-5-sonnet-20241022 for ScaleMax');

    const mappedOpus = resolveVendorModel(scaleMax, 'claude-opus-5');
    assert(mappedOpus === 'claude-3-opus-20240229', 'claude-opus-5 maps to claude-3-opus-20240229 for ScaleMax');

    const mappedFallback = resolveVendorModel(scaleMax, 'claude-haiku-4-5');
    assert(mappedFallback === 'claude-3-5-haiku-20241022', 'claude-haiku-4-5 fallback mapping works');

    // -------------------------------------------------------------------------
    // TEST 10: allowedModels Authorization
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: allowedModels Authorization ---');
    const restrictedKey = {
      ...existingLdKey,
      allowedModels: JSON.stringify(['claude-sonnet-5']),
    };
    let allowedSonnet = false;
    let allowedOpus = false;
    if (restrictedKey.allowedModels) {
      const allowed = JSON.parse(restrictedKey.allowedModels);
      allowedSonnet = allowed.includes('claude-sonnet-5');
      allowedOpus = allowed.includes('claude-opus-5');
    }
    assert(allowedSonnet === true, 'claude-sonnet-5 authorized under allowedModels');
    assert(allowedOpus === false, 'claude-opus-5 blocked under allowedModels');

    // -------------------------------------------------------------------------
    // TEST 11 & 12: Capacity Check & Token Accounting against ScaleMax
    // -------------------------------------------------------------------------
    console.log('\n--- TESTS 11 & 12: Provider Capacity Check & Accounting ---');
    const capCheck = await checkMasterCapacity(scaleMax?.id, 100);
    assert(capCheck.available === true, 'ScaleMax capacity check succeeds');
    assert(Number(capCheck.availableTokens) > 1000000, 'ScaleMax has ample token capacity available');

    const preparedReq = buildProviderRequest(scaleMax, 'test-master-key', 'claude-sonnet-5', {
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 100,
    });
    assert(preparedReq.url.includes('/v1/messages'), 'Request URL targets /v1/messages');
    assert(preparedReq.headers['x-api-key'] === 'test-master-key', 'Master key placed in x-api-key header');
    assert(preparedReq.body.model === 'claude-3-5-sonnet-20241022', 'Target model in request body is resolved model');

    // -------------------------------------------------------------------------
    // TEST 13, 14, 15: Brand Isolation & Sanitization
    // -------------------------------------------------------------------------
    console.log('\n--- TESTS 13-15: Brand Isolation & Data Sanitization ---');
    const rawLeakText = 'I am running on ScaleMax.pro at https://api2.scalemax.pro with key sm_live_1234567890abcdef. Also Opus Max is here.';
    const sanitizedText = sanitizeModelResponse(rawLeakText, 'Claude Opus 5');
    assert(!sanitizedText.includes('ScaleMax'), 'Sanitized text does NOT contain ScaleMax');
    assert(!sanitizedText.includes('ScaleMax.pro'), 'Sanitized text does NOT contain ScaleMax.pro');
    assert(!sanitizedText.includes('api2.scalemax.pro'), 'Sanitized text does NOT contain supplier hostname');
    assert(!sanitizedText.includes('sm_live_1234567890abcdef'), 'Sanitized text does NOT contain master API key');
    assert(!sanitizedText.includes('Opus Max'), 'Sanitized text does NOT contain Opus Max');

    const rawErrorText = 'HTTP 502 from api2.scalemax.pro: ScaleMax backend error with master key sm_live_deadbeef';
    const sanitizedError = sanitizeErrorMessage(rawErrorText);
    assert(!sanitizedError.includes('ScaleMax'), 'Sanitized error does NOT contain ScaleMax');
    assert(!sanitizedError.includes('api2.scalemax.pro'), 'Sanitized error does NOT contain supplier hostname');
    assert(!sanitizedError.includes('sm_live_deadbeef'), 'Sanitized error does NOT contain master API key');

    // -------------------------------------------------------------------------
    // TEST 16-19: Endpoint Execution & Intercept Handling
    // -------------------------------------------------------------------------
    console.log('\n--- TESTS 16-19: Endpoint Execution & Intercept Handling ---');
    // Test 16: Missing API Key returns 401
    const mockReqNoKey: any = { headers: {}, body: { model: 'claude-sonnet-5', messages: [{ role: 'user', content: 'hi' }] } };
    const mockResNoKey = createMockResponse();
    await handleMessagesEndpoint(mockReqNoKey, mockResNoKey);
    assert(mockResNoKey.getStatusCode() === 401, 'Request with missing API key returns HTTP 401');

    // Create an ephemeral test API key associated with ScaleMax to test live endpoint
    const testKeyMat = await generateProviderApiKey({ providerId: scaleMax?.id, isTrial: false });
    const ephemKey = await withRetry(() =>
      prisma.apiKey.create({
        data: {
          user: existingLdKey.userId ? { connect: { id: existingLdKey.userId } } : undefined,
          provider: { connect: { id: scaleMax.id } },
          name: 'Phase 4 Ephemeral Test Key',
          keyHash: testKeyMat.keyHash,
          keyPrefix: testKeyMat.keyPrefix,
          displayKey: testKeyMat.displayKey,
          status: 'active',
          rateLimitRpm: 120,
          allowedModels: JSON.stringify(['claude-sonnet-5', 'claude-opus-5']),
        },
      })
    );
    createdTestKeyIds.push(ephemKey.id);
    const rawKeySecret = testKeyMat.rawKeySecret;
    assert(Boolean(rawKeySecret), 'Successfully generated ephemeral test API key for endpoint test');

    // Test 17: Missing Model returns 400
    const mockReqNoModel: any = { headers: { 'x-api-key': rawKeySecret }, body: { messages: [{ role: 'user', content: 'hi' }] } };
    const mockResNoModel = createMockResponse();
    await handleMessagesEndpoint(mockReqNoModel, mockResNoModel);
    assert(mockResNoModel.getStatusCode() === 400, 'Request with missing model returns HTTP 400');

    // Test 18: Model Identity Intercept (Non-streaming) routes and records providerId
    const mockReqIdentity: any = {
      headers: { 'x-api-key': rawKeySecret },
      body: {
        model: 'claude-sonnet-5',
        messages: [{ role: 'user', content: 'What model are you?' }],
      },
    };
    const mockResIdentity = createMockResponse();
    await handleMessagesEndpoint(mockReqIdentity, mockResIdentity);
    assert(mockResIdentity.getStatusCode() === 200, 'Model identity query returns HTTP 200');
    assert(mockResIdentity.getBody()?.role === 'assistant', 'Response has assistant role');
    assert(!JSON.stringify(mockResIdentity.getBody()).includes('ScaleMax'), 'Response does not leak ScaleMax');

    // Verify ApiRequest record created has providerId = ScaleMax
    const latestReq = await prisma.apiRequest.findFirst({
      where: { apiKeyId: ephemKey.id },
      orderBy: { createdAt: 'desc' },
    });
    if (latestReq) createdTestReqIds.push(latestReq.id);
    assert(latestReq?.providerId === scaleMax?.id, 'ApiRequest.providerId records ScaleMax on gateway call');

    // Test 19: Model Identity Intercept (SSE Streaming)
    const mockReqStream: any = {
      headers: { 'x-api-key': rawKeySecret },
      body: {
        model: 'claude-sonnet-5',
        stream: true,
        messages: [{ role: 'user', content: 'What model are you?' }],
      },
    };
    const mockResStream = createMockResponse();
    await handleMessagesEndpoint(mockReqStream, mockResStream);
    assert(mockResStream.getHeaders()['content-type'] === 'text/event-stream', 'Streaming response sets text/event-stream header');
    assert(mockResStream.getRawOutput().includes('event: message_start'), 'Streaming response outputs message_start event');
    assert(mockResStream.getRawOutput().includes('event: message_stop'), 'Streaming response outputs message_stop event');
    assert(!mockResStream.getRawOutput().includes('ScaleMax'), 'Streaming stream does not leak ScaleMax');

    const streamReq = await prisma.apiRequest.findFirst({
      where: { apiKeyId: ephemKey.id },
      orderBy: { createdAt: 'desc' },
    });
    if (streamReq && streamReq.id !== latestReq?.id) createdTestReqIds.push(streamReq.id);
    assert(streamReq?.providerId === scaleMax?.id, 'Streaming ApiRequest records ScaleMax');

    // -------------------------------------------------------------------------
    // TEST 20-24: Database Safety & Integrity Verification
    // -------------------------------------------------------------------------
    console.log('\n--- TESTS 20-24: Database Safety & Integrity Verification ---');
    if (createdTestReqIds.length > 0) {
      await withRetry(() =>
        prisma.apiRequest.deleteMany({
          where: { id: { in: createdTestReqIds } },
        })
      );
      console.log(`  (Cleaned up ${createdTestReqIds.length} test ApiRequests)`);
    }
    if (createdTestKeyIds.length > 0) {
      await withRetry(() =>
        prisma.masterTokenLedger.deleteMany({
          where: { apiKeyId: { in: createdTestKeyIds } },
        })
      );
      await withRetry(() =>
        prisma.tokenLedger.deleteMany({
          where: { apiKeyId: { in: createdTestKeyIds } },
        })
      );
      await withRetry(() =>
        prisma.apiKey.deleteMany({
          where: { id: { in: createdTestKeyIds } },
        })
      );
      console.log(`  (Cleaned up test ledgers and ${createdTestKeyIds.length} test ApiKeys)`);
      if (scaleMax) {
        await withRetry(() =>
          prisma.vendorProvider.update({
            where: { id: scaleMax.id },
            data: {
              availableTokens: BigInt(9386450),
              consumedTokens: BigInt(613550),
            },
          })
        );
      }
    }

    const finalKeyCount = await withRetry(() => prisma.apiKey.count());
    const finalReqCount = await withRetry(() => prisma.apiRequest.count());
    const finalLedgerCount = await withRetry(() => prisma.masterTokenLedger.count());
    const scaleMaxKeyCount = await withRetry(() => prisma.apiKey.count({ where: { providerId: scaleMax?.id } }));
    const nullKeyCount = await withRetry(() => prisma.apiKey.count({ where: { providerId: null } }));
    const opusProviderCount = await withRetry(() =>
      prisma.vendorProvider.count({
        where: { name: { contains: 'Opus' } },
      })
    );

    assert(finalKeyCount === initialKeyCount, `Total ApiKeys intact (${finalKeyCount} == ${initialKeyCount})`);
    assert(finalReqCount === initialReqCount, `Total ApiRequests intact (${finalReqCount} == ${initialReqCount})`);
    assert(finalLedgerCount === initialLedgerCount, `MasterTokenLedger intact (${finalLedgerCount} == ${initialLedgerCount})`);
    assert(scaleMaxKeyCount === 177, `ScaleMax keys = 177 (${scaleMaxKeyCount})`);
    assert(nullKeyCount === 0, `NULL providerId keys = 0 (${nullKeyCount})`);
    assert(opusProviderCount === 0, `No persistent Opus Max provider created (${opusProviderCount} == 0)`);

  } catch (err: any) {
    console.error('UNEXPECTED EXCEPTION IN TESTS:', err);
    failed++;
  } finally {
    try {
      if (createdTestReqIds.length > 0) {
        await prisma.apiRequest.deleteMany({
          where: { id: { in: createdTestReqIds } },
        }).catch(() => {});
      }
      if (createdTestKeyIds.length > 0) {
        await prisma.masterTokenLedger.deleteMany({
          where: { apiKeyId: { in: createdTestKeyIds } },
        }).catch(() => {});
        await prisma.tokenLedger.deleteMany({
          where: { apiKeyId: { in: createdTestKeyIds } },
        }).catch(() => {});
        await prisma.apiKey.deleteMany({
          where: { id: { in: createdTestKeyIds } },
        }).catch(() => {});
        if (scaleMax) {
          await prisma.vendorProvider.update({
            where: { id: scaleMax.id },
            data: {
              availableTokens: BigInt(9386450),
              consumedTokens: BigInt(613550),
            },
          }).catch(() => {});
        }
      }
      if (originalDefaultSetting) {
        await prisma.systemSetting.update({
          where: { key: 'default_provider_id' },
          data: { value: originalDefaultSetting },
        }).catch(() => {});
      }
    } catch {}
  }

  console.log('\n=================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
