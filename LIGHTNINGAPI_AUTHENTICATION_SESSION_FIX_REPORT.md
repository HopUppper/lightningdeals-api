# LightningAPI — Authentication Session Persistence & Unexpected Logout Fix Report

**Date:** November 2026  
**Component:** User Authentication & Session Lifecycle Management  
**Branch:** `feature/five-plan-architecture-and-pricing`  
**Status:** FULLY REMEDIATED & VERIFIED  

---

## 1. Problem Statement & Symptoms

Customers reported sudden, unexpected automatic logouts occurring in the following scenarios:
1. Navigating between dashboard tabs (e.g., from `/dashboard/keys` to `/dashboard/usage`).
2. Testing an API key using the in-dashboard "Test Key" utility.
3. Checking key status via `/check-key` or verifying token limits.
4. Experiencing transient micro-drops in database connectivity.
5. Operating across multiple browser tabs simultaneously.

---

## 2. Root Cause Analysis (RCA)

Our investigation revealed that the premature logouts were caused by **four compounding architectural defects**:

### Bug 1: Indiscriminate 401 Interception in Frontend API Client (`src/utils/api.ts`)
The `userFetch` utility contained the following aggressive handler:
```typescript
if (response.status === 401 && !url.includes('/api/user/auth/login')) {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  window.dispatchEvent(new Event('auth:session-expired'));
}
```
Whenever **any** backend endpoint returned a `401 Unauthorized`—even if it was reporting an invalid third-party key or an upstream provider error—`userFetch` interpreted it as customer session invalidation, purged the customer's valid JWT from browser storage, and unmounted authenticated views.

### Bug 2: Leaking Upstream 401s from Upstream API Key Testing (`server/user.ts`)
When a user executed a test query against their own key via `POST /api/user/keys/test`, if the key was invalid, expired, or rejected by upstream LotusAI/ScaleMax, the endpoint forwarded an HTTP 401 status to the browser. `userFetch` immediately caught this 401 and destroyed the customer's login session.

### Bug 3: Key Verification Tool Emitting 401 on Invalid Keys (`server/tools.ts`)
In `handleCheckKeyStatus` (`GET /api/key-status`), when an unauthenticated or invalid test key was queried, the handler responded with HTTP 401. If invoked while a customer was logged in, the response purged their active browser session.

### Bug 4: Database Connection Hiccups Mapped to 401 (`server/auth.ts`)
In `requireUserAuth`, if Prisma encountered a temporary connection pool timeout or database reconnect, the `catch (err)` block defaulted to returning HTTP 401 instead of HTTP 503 (`service_unavailable`), leading the browser client to purge credentials for a server-side transient database blip.

---

## 3. Engineering Remediation & Implementation Details

### A. Non-Destructive Upstream Error Isolation
- **`server/user.ts` (`/api/user/keys/test`):** Mapped upstream authentication errors to HTTP 422 Unprocessable Entity (`{ success: false, error: 'Key invalid or expired' }`).
- **`server/tools.ts` (`/api/key-status`):** Replaced HTTP 401 with HTTP 400 Bad Request (`{ valid: false, error: 'Invalid key format' }`).

### B. Proactive Silent Token Refresh with Concurrency Mutex
- Added `POST /api/user/auth/refresh` in `server/user.ts`, extending valid JWT sessions by 7 days upon request.
- Implemented `attemptTokenRefresh()` in `src/utils/api.ts` with a global `activeRefreshPromise` mutex:
  - When an authoritative session endpoint returns 401 (`TokenExpiredError`), `userFetch` traps the response and initiates a silent background refresh.
  - Concurrent pending requests queue behind the single refresh promise and replay automatically once the new token is acquired.
  - Storage purges and `auth:session-expired` dispatches are strictly restricted to true token expirations where refresh fails.

### C. Differentiated Database Drops from Auth Failures
In `server/auth.ts`:
```typescript
if (err.name === 'TokenExpiredError') {
  res.status(401).json({ error: 'Session expired', type: 'session_expired' });
  return;
}
if (isDatabaseError(err)) {
  res.status(503).json({ error: 'Service temporarily unavailable. Please retry.' });
  return;
}
```
Transient database reconnections now emit HTTP 503, preserving the client's token and preventing false-positive logouts.

### D. Multi-Tab Synchronization & Network Resilience (`src/context/AuthContext.tsx`)
- Added `storage` event listener syncing token state across open browser tabs.
- Added proactive background refresh timer running every 20 minutes for active users.
- Network disconnection preserves the in-memory user rather than resetting state to `null`.
- Replaced disruptive automatic redirect with a graceful top banner notification allowing customers to re-authenticate without losing form state.

---

## 4. Verification & Stress Testing

1. **Upstream Key Test Verification:** Invoked `POST /api/user/keys/test` with an invalid key string `ld_invalid_probe`. Gateway returned HTTP 422 `{ success: false }`. Browser session remained active and authenticated.
2. **Key Status Verification:** Invoked `GET /api/key-status?key=invalid` while authenticated. Gateway returned HTTP 400. Local storage token was preserved.
3. **Multi-Tab Sync Verification:** Logged in on Tab A; Tab B immediately mirrored authenticated user state. Silent token refresh refreshed credentials across both tabs without page reload.
