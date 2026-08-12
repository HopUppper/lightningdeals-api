const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

async function runResilienceAudit() {
  console.log('🧪 Starting LightningDeals Error Handling & Resilience Test Suite...\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details || 'Assertion failed'}`);
      failCount++;
    }
  }

  // 1. Invalid Endpoint (404 JSON)
  try {
    const res = await fetch(`${BASE_URL}/v1/invalid_endpoint_xyz`);
    const data: any = await res.json();
    assert(res.status === 404, 'Unknown /v1 route returns 404 status code');
    assert(data.error?.type === 'invalid_request_error', '404 error contains standard JSON error type');
    assert(Boolean(data.error?.requestId), '404 error contains X-Request-ID reference');
  } catch (e: any) {
    assert(false, 'Unknown route test failed with exception', e.message);
  }

  // 2. Missing Authentication Header (401)
  try {
    const res = await fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', messages: [{ role: 'user', content: 'hello' }] }),
    });
    const data: any = await res.json();
    assert(res.status === 401, 'Missing API key returns HTTP 401');
    assert(data.error?.type === 'authentication_error', 'Missing API key error type is authentication_error');
    assert(res.headers.has('x-request-id'), 'Response includes X-Request-ID header');
  } catch (e: any) {
    assert(false, 'Missing auth test failed', e.message);
  }

  // 3. Conflicting Auth Headers (400)
  try {
    const res = await fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'ld_live_key1',
        'Authorization': 'Bearer ld_live_key2',
      },
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', messages: [{ role: 'user', content: 'hello' }] }),
    });
    const data: any = await res.json();
    assert(res.status === 400, 'Conflicting auth headers return HTTP 400');
    assert(data.error?.message?.includes('Conflicting'), 'Error message identifies conflicting headers');
  } catch (e: any) {
    assert(false, 'Conflicting auth header test failed', e.message);
  }

  // 4. Invalid API Key Format/Value (401)
  try {
    const res = await fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'ld_live_invalid_nonexistent_key_999',
      },
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', messages: [{ role: 'user', content: 'hello' }] }),
    });
    const data: any = await res.json();
    assert(res.status === 401, 'Invalid API key returns HTTP 401');
    assert(data.error?.type === 'authentication_error', 'Invalid API key error type is authentication_error');
  } catch (e: any) {
    assert(false, 'Invalid API key test failed', e.message);
  }

  // 5. Missing Required Request Fields (400)
  try {
    const res = await fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'ld_trial_demo',
      },
      body: JSON.stringify({}),
    });
    const data: any = await res.json();
    assert(res.status === 400 || res.status === 401, 'Missing body payload returns client HTTP 400/401 error');
    assert(Boolean(data.error), 'Response body contains error object');
  } catch (e: any) {
    assert(false, 'Missing required fields test failed', e.message);
  }

  // 6. Public Key Status Probe
  try {
    const res = await fetch(`${BASE_URL}/api/key-status?key=ld_trial_invalid_test`);
    const data: any = await res.json();
    assert(res.status === 401, 'Public key check for invalid key returns 401');
    assert(data.valid === false, 'data.valid is false');
  } catch (e: any) {
    assert(false, 'Public key check test failed', e.message);
  }

  // 7. System Health Status Check
  try {
    const res = await fetch(`${BASE_URL}/api/system/status`);
    const data: any = await res.json();
    assert(res.status === 200, 'System status endpoint returns HTTP 200');
    assert(data.status === 'healthy', 'System status indicates operational health');
  } catch (e: any) {
    assert(false, 'System status test failed', e.message);
  }

  console.log(`\n=================================================================`);
  console.log(`RESILIENCE TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED.`);
  console.log(`=================================================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runResilienceAudit().catch((e) => {
  console.error('Fatal test runner failure:', e);
  process.exit(1);
});
