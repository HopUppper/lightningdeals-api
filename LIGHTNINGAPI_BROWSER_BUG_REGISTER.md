# LIGHTNINGAPI — BROWSER BUG REGISTER & DEFECT LOG

**Document Version:** 1.0.0  
**Audit Period:** 31 October 2026  
**Lead QA Engineer:** Senior QA Automation Engineer & Browser Automation Specialist  
**Development Branch:** `feature/five-plan-architecture-and-pricing`  
**Total Defects Identified:** 3  
**Total Defects Remediated:** 3 (100% Resolved and Verified in Browser)  

---

## 1. Summary Defect Triage Table

| Defect ID | Severity | Category | Affected File(s) | Impact | Resolution Status | Verified in Browser |
|-----------|----------|----------|------------------|--------|-------------------|---------------------|
| **BUG-001** | High | UI / Telemetry | `src/components/ElectricFooter.tsx` | False positive "Partial Outage" displayed in public footer when all services were healthy. | **RESOLVED** | **YES** |
| **BUG-002** | Critical | Auth / Session | `src/components/NotificationCenter.tsx`, `src/components/LightningRewardsHighlight.tsx` | Customer dashboard component called `adminFetch` instead of `userFetch`, causing 401 Unauthorized errors and session invalidation. | **RESOLVED** | **YES** |
| **BUG-003** | Medium | Auth / Scrypt | `server/adminAuth.ts`, `server/auth.ts` | Admin login credential hashing protocol discrepancy between bcrypt and scrypt. | **RESOLVED** | **YES** |

---

## 2. Detailed Defect Reports

---

### Defect BUG-001: Case Sensitivity Telemetry Mismatch in Public Footer

- **Issue ID:** `BUG-001`
- **Severity:** High (Customer Trust & Conversion Impact)
- **Component:** `src/components/ElectricFooter.tsx`
- **Discovered On Route:** All public pages (`/`, `/pricing`, `/models`, `/status`, etc.)
- **Discovered Via Tool:** `chrome-devtools-mcp` (`take_snapshot` on `/status`)

#### Description & Symptoms
When navigating to any public route with the standard footer, the footer status badge rendered:
`[🔴] Partial Outage`
even when `/api/system/status` returned `200 OK` with all subsystems operational and `/status` displayed "All Services Operational".

#### Root Cause Analysis
The backend endpoint `GET /api/system/status` returns an uppercase status string:
```json
{
  "status": "OPERATIONAL",
  "dbOperational": true,
  "vendorConnected": true,
  "services": [...]
}
```
In `src/components/ElectricFooter.tsx`, the status check was written as:
```tsx
// Flawed implementation
fetch('/api/system/status')
  .then((res) => res.json())
  .then((data) => {
    if (data && data.status) {
      setSystemStatus(data.status === 'operational' ? 'OPERATIONAL' : 'DEGRADED');
    }
  });
```
Because `'OPERATIONAL'` (uppercase) did not strictly equal `'operational'` (lowercase), the ternary expression defaulted to `'DEGRADED'`. This triggered the label:
`systemStatus === 'DEGRADED' ? 'Partial Outage' : 'All Systems Operational'`

#### Remediation Implemented
Updated `src/components/ElectricFooter.tsx` to handle case insensitivity and check both `data.status` and `data.overallStatus`:
```tsx
if (data && data.status) {
  const isOp = data.status.toLowerCase() === 'operational' || data.overallStatus === 'operational';
  setSystemStatus(isOp ? 'OPERATIONAL' : 'DEGRADED');
}
```

#### Browser Verification
- Navigated to `http://localhost:3000/status` using `navigate_page`.
- Took accessible DOM snapshot:
  `uid=19_68 link "All Systems Operational" url="http://localhost:3000/status"`
- Verified badge turns green and shows "All Systems Operational".
- **Status:** **VERIFIED & CLOSED**

---

### Defect BUG-002: Customer Shell Called Admin Auth Gateway for Notifications & Rewards

- **Issue ID:** `BUG-002`
- **Severity:** Critical (Session Destruction & Data Access Failure)
- **Components:**
  - `src/components/NotificationCenter.tsx`
  - `src/components/LightningRewardsHighlight.tsx`
- **Discovered On Route:** `/dashboard/keys`, `/dashboard/usage`, `/dashboard/*`
- **Discovered Via Tool:** `chrome-devtools-mcp` (`list_console_messages`, `list_network_requests`)

#### Description & Symptoms
Upon logging in as a standard customer (`qa_e2e_customer@lightningapi.pro`) and opening `/dashboard/keys`, the page remained stuck on "Loading your assigned API keys...".
Inspection via `list_console_messages` revealed repeated `401 (Unauthorized)` errors.
Inspection via `list_network_requests` revealed:
`GET http://localhost:3000/api/user/notifications [401]`
Furthermore, following the 401 response, `src/utils/api.ts` cleared `sessionStorage` and `localStorage`, destroying the customer's session.

#### Root Cause Analysis
1. `NotificationCenter.tsx` imported and executed `adminFetch('/api/user/notifications')`.
2. `LightningRewardsHighlight.tsx` imported and executed `adminFetch('/api/user/rewards/balance')`.
3. `adminFetch` in `src/utils/api.ts` extracts `ld_admin_token`:
```ts
export function getAuthHeaders(isAdmin = false): Record<string, string> {
  const token = isAdmin
    ? (sessionStorage.getItem('ld_admin_token') || localStorage.getItem('ld_admin_token') || '')
    : (sessionStorage.getItem('apexscale_token') || ...);
```
4. Regular customers have an `apexscale_token`, NOT an `ld_admin_token`.
5. As a result, the request was dispatched without an Authorization header or with an invalid token, prompting the backend to return `401 Unauthorized`.
6. Upon intercepting a 401, `userFetch` / `adminFetch` in `api.ts` fired `auth:session-expired`, wiping customer credentials and logging the user out prematurely.

#### Remediation Implemented
1. In `src/components/NotificationCenter.tsx`:
   - Changed `import { adminFetch } from '../utils/api';` to `import { userFetch } from '../utils/api';`.
   - Updated `adminFetch` calls for `/api/user/notifications`, `/:id/read`, and `/read-all` to use `userFetch`.
2. In `src/components/LightningRewardsHighlight.tsx`:
   - Changed `import { adminFetch } from '../utils/api';` to `import { userFetch } from '../utils/api';`.
   - Updated `adminFetch('/api/user/rewards/balance')` to `userFetch('/api/user/rewards/balance')`.

#### Browser Verification
- Navigated to `http://localhost:3000/login`, authenticated as customer.
- Navigated to `http://localhost:3000/dashboard/keys`.
- Captured network requests:
  - `GET /api/user/notifications` returned `200 OK`.
  - `GET /api/user/keys` returned `200 OK`.
- Keys rendered immediately with zero console errors.
- **Status:** **VERIFIED & CLOSED**

---

### Defect BUG-003: Administrative Credential Protocol Incompatibility

- **Issue ID:** `BUG-003`
- **Severity:** Medium (Operational Access Barrier)
- **Component:** `server/adminAuth.ts`
- **Discovered On Route:** `/deez/login`
- **Discovered Via Tool:** `chrome-devtools-mcp` (Form submission on `/deez/login`)

#### Description & Symptoms
Submitting valid administrator credentials on `/deez/login` returned:
`401 Unauthorized: Invalid admin credentials or unauthorized account access.`

#### Root Cause Analysis
`server/adminAuth.ts` strictly requires scrypt key derivation format (`scrypt$salt$hash` or `salt:hash`) for administrative authentication:
```ts
if (storedHash.startsWith('scrypt$')) {
  return verifyPasswordScrypt(password, storedHash);
}
if (storedHash.includes(':')) { ... }
return false;
```
Bcrypt hashes (`$2a$`, `$2b$`) are explicitly rejected by design to prevent timing attacks and ensure hardened scrypt memory-hard parameters. Initial test seeding used bcrypt instead of scrypt.

#### Remediation Implemented
- Generated high-entropy scrypt password hashes using `crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })`.
- Seeded both admin and customer accounts using native `hashPasswordScrypt`.
- Documented and verified in `scripts/set_scrypt_passwords.cjs`.

#### Browser Verification
- Submitted credentials on `/deez/login` via `fill` and `click`.
- Response: `POST /api/admin/auth/login [200 OK]`.
- Browser successfully redirected to `/deez` (Operations Dashboard).
- **Status:** **VERIFIED & CLOSED**

---
*Maintained and Certified by Lead QA Engineer.*
