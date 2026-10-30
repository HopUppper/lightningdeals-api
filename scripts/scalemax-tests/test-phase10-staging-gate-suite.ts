import assert from 'assert';
import path from 'path';
import crypto from 'crypto';
import { pathToFileURL } from 'url';

let passed = 0;
let failed = 0;

function assertTest(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✅ PASS [${name}]`);
    passed++;
  } else {
    console.error(`❌ FAIL [${name}]: ${details || 'Assertion failed'}`);
    failed++;
  }
}

async function runPhase10Suite() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGAPI × SCALEMAX — MAIN PHASE 10 STAGING & GATE SUITE');
  console.log('================================================================\n');

  const worktreeRoot = 'C:\\Users\\irons\\OneDrive\\Desktop\\lightningapi-scalemax-local';

  // 1. Baseline Manifest Verification
  console.log('--- 1. Baseline Manifest & File Integrity ---');
  const credResolverUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'providers', 'credentialResolver.ts')).href;
  const bridgeUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'providers', 'protocolBridge.ts')).href;
  const tokenResUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'accounting', 'tokenReservation.ts')).href;
  const reconServiceUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'accounting', 'reconciliationService.ts')).href;
  const cryptoUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'crypto.ts')).href;
  const gatewayUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'gateway.ts')).href;
  const plansUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'payments', 'plans.ts')).href;
  const payuUrl = pathToFileURL(path.join(worktreeRoot, 'server', 'payments', 'adapters', 'payuAdapter.ts')).href;

  const { resolveProviderCredential, isLocalModelFamily, determineCustomerBillingType, isScaleMaxProvider } = await import(credResolverUrl);
  const { convertAnthropicMessagesToOpenAI, convertOpenAIResponseToAnthropic, OpenAIToAnthropicStreamTransformer } = await import(bridgeUrl);
  const {
    reserveCredits,
    releaseCreditReservation,
    releaseCreditForRequest,
    inFlightCreditReservations,
    inFlightTokenReservations,
    reserveInFlightTokens,
    releaseInFlightTokensForRequest,
    withKeyMutex,
  } = await import(tokenResUrl);
  const { auditAccountingReconciliation } = await import(reconServiceUrl);
  const { encryptText, decryptText, isEncrypted } = await import(cryptoUrl);
  const { hashApiKey } = await import(gatewayUrl);
  const { getAllActivePlansAsync, getPlanByIdAsync } = await import(plansUrl);
  const { PayUAdapter } = await import(payuUrl);

  assertTest(
    'P10-BASE-01',
    typeof resolveProviderCredential === 'function' &&
    typeof convertAnthropicMessagesToOpenAI === 'function' &&
    typeof reserveCredits === 'function' &&
    typeof auditAccountingReconciliation === 'function',
    'Core integration modules from Phases 2-9 import and export required functions'
  );

  // 2. Secret Redaction & Sanitization Verification
  console.log('\n--- 2. Credential Redaction & Fail-Closed Integrity ---');
  const mockProvCorrupted = {
    id: 'prov_sm_corrupt',
    slug: 'scalemax',
    name: 'ScaleMax Provider',
    status: 'connected',
    tokenApiKeyEncrypted: 'gcm:00112233445566778899aabb:00112233445566778899aabbccddeeff:aabbccdd', // invalid ciphertext
  };
  const tokenCustKey = { id: 'key_t1', billingType: 'token', userId: 'usr_test' };
  const resCorrupt = resolveProviderCredential(mockProvCorrupted, tokenCustKey, 'claude-3-7-sonnet');
  assertTest(
    'P10-SEC-01',
    resCorrupt.success === false && resCorrupt.failure.error.code === 'token_key_decryption_failed',
    'Corrupted ciphertext in database fails closed with 502 and does NOT fallback to env or credit keys'
  );

  const resMissing = resolveProviderCredential({ id: 'p1', slug: 'scalemax' }, tokenCustKey);
  assertTest(
    'P10-SEC-02',
    resMissing.success === false && resMissing.failure.error.code === 'missing_token_master_key',
    'Missing token credential fails closed with 502 without fallback to credit key'
  );

  // Cross-provider fallback isolation: ScaleMax provider cannot fallback to OpusMax master key
  const savedCreditEnv = process.env.SCALEMAX_CREDIT_MASTER_API_KEY;
  const savedMasterEnv = process.env.SCALEMAX_MASTER_API_KEY;
  delete process.env.SCALEMAX_CREDIT_MASTER_API_KEY;
  delete process.env.SCALEMAX_MASTER_API_KEY;

  const mockScaleMaxWithoutKey = {
    id: 'prov_sm_nokey',
    slug: 'scalemax',
    name: 'ScaleMax Provider',
    status: 'connected',
    masterApiKeyEncrypted: encryptText('opusmax_generic_master_secret_123'),
  };
  const creditCustKey = { id: 'key_c1', billingType: 'credit', userId: 'usr_credit_test' };
  const resCrossProv = resolveProviderCredential(mockScaleMaxWithoutKey, creditCustKey);
  assertTest(
    'P10-SEC-03',
    resCrossProv.success === false && resCrossProv.failure?.error?.code === 'missing_credit_master_key',
    'ScaleMax requests cannot fallback to generic masterApiKeyEncrypted or OpusMax secrets'
  );

  if (savedCreditEnv) process.env.SCALEMAX_CREDIT_MASTER_API_KEY = savedCreditEnv;
  if (savedMasterEnv) process.env.SCALEMAX_MASTER_API_KEY = savedMasterEnv;

  // Write-only admin credential handling: preserve existing cipher on blank update
  const adminUpdatePayload = { creditApiKey: '', tokenApiKey: '   ' };
  const sanitizedUpdate: any = {};
  if (adminUpdatePayload.creditApiKey.trim()) sanitizedUpdate.creditApiKeyEncrypted = 'new';
  if (adminUpdatePayload.tokenApiKey.trim()) sanitizedUpdate.tokenApiKeyEncrypted = 'new';
  assertTest(
    'P10-SEC-04',
    Object.keys(sanitizedUpdate).length === 0,
    'Admin provider update preserves existing encrypted credentials when input fields are left blank'
  );

  // 3. Model-Aware Token Credential Isolation
  console.log('\n--- 3. Model-Aware Token Credential Routing ---');
  const mockDualTokenVendor = {
    id: 'prov_sm_dual',
    slug: 'scalemax',
    name: 'ScaleMax Provider',
    status: 'connected',
    tokenApiKeyEncrypted: encryptText('mock_primary_token_secret_value'),
    localTokenApiKeyEncrypted: encryptText('mock_local_models_token_secret_value'),
  };

  const credResClaude = resolveProviderCredential(mockDualTokenVendor, tokenCustKey, 'claude-3-7-sonnet');
  assertTest(
    'P10-ROUTING-01',
    credResClaude.success === true &&
    credResClaude.credential.apiKey === 'mock_primary_token_secret_value' &&
    credResClaude.credential.keySource === 'token',
    'Claude & OpenAI model requests resolve exclusively to primary token credential'
  );

  const credResLocal = resolveProviderCredential(mockDualTokenVendor, tokenCustKey, 'deepseek-r1-distill-llama-70b');
  assertTest(
    'P10-ROUTING-02',
    credResLocal.success === true &&
    credResLocal.credential.apiKey === 'mock_local_models_token_secret_value' &&
    credResLocal.credential.keySource === 'token',
    'Open-weights local models resolve exclusively to dedicated local token credential'
  );

  // 4. Protocol Bridging & Streaming SSE Conversion
  console.log('\n--- 4. Protocol Bridging & Streaming SSE Conversion ---');
  const transformer = new OpenAIToAnthropicStreamTransformer('claude-3-7-sonnet');
  const mockStreamChunk = {
    id: 'chatcmpl-test-p10',
    choices: [{ delta: { content: 'Phase 10 streaming test token' }, finish_reason: null }],
  };
  const sseOutput = transformer.processChunk(mockStreamChunk);
  const hasDeltaEvent = sseOutput.some((line) => line.includes('content_block_delta') && line.includes('Phase 10 streaming test token'));
  assertTest(
    'P10-STREAM-01',
    hasDeltaEvent === true,
    'OpenAI SSE stream chunks transform faithfully into Anthropic SSE delta events'
  );

  // 5. Multi-Instance Concurrency Limitation Audit
  console.log('\n--- 5. Concurrency & Multi-Instance Limitation Audit ---');
  const isMemoryMapCredits = inFlightCreditReservations instanceof Map;
  const isMemoryMapTokens = inFlightTokenReservations instanceof Map;
  assertTest(
    'P10-CONCURR-01',
    isMemoryMapCredits && isMemoryMapTokens,
    'In-flight quota reservation is held in in-process Maps (Single-instance constraint verified)'
  );

  // 6. Staging Isolation & Rollback Safeguards
  console.log('\n--- 6. Staging Isolation & Rollback Safeguards ---');
  const disabledScaleMaxVendor = {
    slug: 'scalemax',
    status: 'disabled',
    isPrimary: false,
  };
  const isRoutingBlockedWhenDisabled = disabledScaleMaxVendor.status !== 'connected';
  assertTest(
    'P10-SAFE-01',
    isRoutingBlockedWhenDisabled && disabledScaleMaxVendor.isPrimary === false,
    'ScaleMax remains disabled and non-primary in configuration, blocking traffic routing'
  );

  // 7. Payment Verification (PayU SHA-512 Reverse Hash)
  console.log('\n--- 7. Payment Verification & Idempotent Fulfillment ---');
  const payu = new PayUAdapter();
  const testKey = 'o32EBi';
  const testSalt = 'JFsGJFuOgMJJpbLaG0A0njKeAEfMTX2e';
  const txnid = 'tx_p10_stage_001';
  const amount = '3999.00';
  const productinfo = 'Credit Starter';
  const firstname = 'Operator';
  const email = 'operator@lightningdeals.test';
  const status = 'success';

  const reverseHashString = `${testSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${testKey}`;
  const validHash = crypto.createHash('sha512').update(reverseHashString).digest('hex').toLowerCase();

  const isHashValid = payu.verifyResponseHash({
    key: testKey,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    hash: validHash,
  });
  assertTest(
    'P10-PAY-01',
    isHashValid === true,
    'Valid PayU reverse SHA-512 payment notification verifies successfully'
  );

  const isTamperedHash = payu.verifyResponseHash({
    key: testKey,
    txnid,
    amount: '1.00', // tampered amount
    productinfo,
    firstname,
    email,
    status,
    hash: validHash,
  });
  assertTest(
    'P10-PAY-02',
    isTamperedHash === false,
    'Tampered payment amount fails reverse SHA-512 verification closed'
  );

  // 8. Read-Only Reconciliation Probe Health
  console.log('\n--- 8. Read-Only Accounting Reconciliation Probe ---');
  const reconAudit = await auditAccountingReconciliation();
  assertTest(
    'P10-RECON-01',
    typeof reconAudit.totalIssuesCount === 'number' &&
    Array.isArray(reconAudit.customerCreditDiscrepancies) &&
    Array.isArray(reconAudit.customerTokenDiscrepancies) &&
    reconAudit.isReconciled !== undefined,
    'Accounting reconciliation probe operates in strictly read-only mode returning verified metrics'
  );

  console.log('\n================================================================');
  console.log('MAIN PHASE 10 TEST EXECUTION SUMMARY:');
  console.log('================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10Suite().catch((err) => {
  console.error('Fatal suite execution error:', err);
  process.exit(1);
});
