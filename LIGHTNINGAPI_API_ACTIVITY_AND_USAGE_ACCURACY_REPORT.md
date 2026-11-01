# LightningAPI API Activity & Usage Tracking Accuracy Report

## 1. Executive Summary
A paying customer reported discrepancies in their API activity logs:
- The customer sent 5 requests via external developer tools (VS Code / terminal).
- Only 2 requests appeared in the Customer Dashboard Activity log.
- The Verify Key page displayed a contradictory metric: **"Total Requests: 0"** alongside **"24h Requests: 2"**.

This investigation traced the root causes to silent drop-outs during gateway pre-flight validation and an asynchronous counter desynchronization between `ApiKey.totalRequests` and the immutable `ApiRequest` event ledger.

---

## 2. Root Cause Analysis

### Cause 1: Rejection Without Logging in `server/gateway.ts`
When an incoming API request encountered any pre-upstream failure in `/v1/chat/completions` or `/v1/messages`:
- Invalid model name (`!modelCheck.isValid`)
- Model not permitted under key's plan
- Anomaly / velocity throttling
- Quota reservation depletion (`!customerReservation.success`)
- Upstream 4xx/5xx errors
The gateway immediately returned `res.status(...).json(...)` **without invoking `prisma.apiRequest.create()`**.
Consequently, the 3 failed requests were completely dropped from telemetry, leaving the customer unaware of why their requests failed.

### Cause 2: Dual Metric Source Mismatch in `server/tools.ts`
In `server/tools.ts:335-336`:
```typescript
// Faulty implementation
totalRequests: keyRecord.totalRequests, // Static integer on ApiKey table
requests24h: requests24h,              // Live count: await prisma.apiRequest.count(...)
```
`keyRecord.totalRequests` was only incremented inside `updateTokensAndLog()` when an HTTP 200 response completed successfully. If requests failed or if a race condition delayed database updates, `keyRecord.totalRequests` remained `0`, while `requests24h` accurately counted the 2 successful requests in the ledger. This produced the impossible display: `Total Requests: 0 | 24H Requests: 2`.

---

## 3. Engineering Fixes Implemented

### Fix 1: Unified Failed Request Logging (`logFailedRequest`)
In `server/gateway.ts`:
Created an asynchronous telemetry hook `logFailedRequest()` that writes an immutable record to `prisma.apiRequest` whenever a request is blocked, rejected, or encounters an upstream failure:
```typescript
export async function logFailedRequest({
  keyRecord,
  userId,
  model,
  endpoint,
  statusCode,
  errorMessage,
  errorCode,
  latencyMs,
  streaming = false,
  clientPlatform,
  userAgent,
  ipAddress,
  requestId,
}: LogFailedRequestParams) {
  try {
    const keyId = keyRecord?.id || null;
    const uid = userId || keyRecord?.userId || null;
    await prisma.apiRequest.create({
      data: {
        apiKeyId: keyId,
        userId: uid,
        model: model || 'unknown',
        endpoint: endpoint || '/v1/chat/completions',
        statusCode,
        latencyMs: Math.max(0, latencyMs),
        streaming,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        errorMessage: (errorMessage || '').slice(0, 500),
        errorCode: errorCode || 'REQUEST_FAILED',
        failureReason: (errorMessage || '').slice(0, 500),
        clientPlatform: clientPlatform || null,
        userAgent: userAgent ? userAgent.slice(0, 255) : null,
        ipAddress: ipAddress || null,
        requestId: requestId || `req_fail_${crypto.randomBytes(8).toString('hex')}`,
      },
    });
    if (keyId) {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { totalRequests: { increment: 1 } },
      }).catch(() => {});
    }
  } catch (err) {
    // Non-blocking telemetry
  }
}
```
This hook is wired into all rejection paths across `handleChatCompletionsEndpoint` and `handleMessagesEndpoint`.

### Fix 2: Ledger-Backed Metric Reconciliation
In `server/tools.ts:343`:
```typescript
// Fixed implementation
totalRequests: await prisma.apiRequest.count({ where: { apiKeyId: keyRecord.id } }),
requests24h: requests24h,
```
Both lifetime and 24-hour request counts now query the authoritative `ApiRequest` ledger table directly, ensuring `totalRequests` is guaranteed to be `>= requests24h`.

---

## 4. Verification & Audit Results

1. **Rejection Logging Verification:**
   - Simulated an invalid model request (`qwen3-8-max` with Credit Key).
   - Response returned `403 Forbidden` with explanation.
   - Record immediately created in `prisma.apiRequest` with `statusCode: 403` and `failureReason: "Model is an open-weights/local model and is not available on API Usage Credits"`.
   - Entry appeared in Customer Activity Log in real time.
2. **Metric Reconciliation for Customer `kayuar@gmail.com`:**
   - Queried `/api/key-status` for key `sk_live_d50685...3842`:
     - `totalRequests`: **15**
     - `requests24h`: **15**
     - Ratio: **100% synchronized**
3. **Data Integrity:**
   - Zero orphaned records.
   - Exact failure reasons populated across all HTTP 4xx and 5xx logs.
