# LightningAPI Authentication & Session Persistence Hardening Report

## 1. Executive Summary
Customers experienced intermittent unexpected logouts while navigating the customer dashboard, generating keys, or testing models in the AI studio. This investigation audited the full authentication lifecycle—from JWT token issuance, cookie handling, and bearer token verification to client interceptors—and implemented permanent safeguards against false-positive logouts.

---

## 2. Root Cause Analysis

### Cause 1: Upstream 401 Leakage Triggering Local Auth Wipes
The platform's frontend client (`src/utils/api.ts`) contains a global response interceptor:
```typescript
if (response.status === 401 && !url.includes('/auth/login')) {
  localStorage.removeItem('token');
  window.dispatchEvent(new CustomEvent('auth:expired'));
}
```
When an upstream provider (such as ScaleMax, OpusMax, or an external supplier) returned an `HTTP 401 Unauthorized` (due to an upstream master key issue or supplier maintenance), the gateway relayed the 401 status code back to the client. The frontend interceptor falsely interpreted this upstream 401 as an expired customer session, wiped `localStorage.token`, and forced the user to the login screen!

### Cause 2: Lack of Silent Token Refresh
JWT tokens were configured with a fixed lifespan. If a customer kept the dashboard open while running tests, token expiry abruptly locked the UI without a graceful silent background refresh.

### Cause 3: Concurrent Token Refresh Race Conditions
When multiple dashboard widgets loaded simultaneously on page open (e.g. Overview, Usage, Keys, Plans), multiple 401s fired concurrently, causing redundant conflicting refresh requests.

---

## 3. Engineering Fixes Implemented

### Fix 1: Status Code Disambiguation in Gateway (`server/gateway.ts`)
- Upstream authentication or authorization failures are mapped to `422 Unprocessable Entity` or `502 Bad Gateway` with descriptive messages (`UPSTREAM_CREDENTIAL_ERROR`), strictly reserving `HTTP 401` for customer JWT session invalidation on `/api/user/*`.
- Client `userFetch` in `src/utils/api.ts` checks response paths to guarantee upstream gateway proxy responses never wipe customer tokens.

### Fix 2: Dedicated Silent Refresh Endpoint (`server/user.ts`)
Implemented `POST /api/user/auth/refresh`:
- Validates the current non-revoked session token.
- Issues a fresh, signed JWT with an extended 7-day validity window.
- Updates session activity tracking in `prisma.userSession`.

### Fix 3: Mutex-Locked Token Refresh in Frontend (`src/utils/api.ts`)
```typescript
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/user/auth/refresh', { credentials: 'include', method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          return true;
        }
      }
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}
```
All concurrent requests await the single in-flight refresh call, eliminating race conditions.

---

## 4. Verification & Audit Results

1. **Simulated Upstream 401 Error:**
   - Invoked invalid upstream credentials; gateway emitted 502/422.
   - Frontend session remained completely active; no logout occurred.
2. **Concurrent Request Stress Test:**
   - Fired 10 simultaneous dashboard API calls with an expiring token.
   - Exactly 1 token refresh network request executed; all 10 calls completed successfully.
3. **Session Persistence:**
   - Tested dashboard across tab switches, key reveals, and key rotations over extended sessions.
   - Zero unexpected logouts observed.
