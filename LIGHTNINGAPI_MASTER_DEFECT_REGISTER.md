# LIGHTNINGAPI — MASTER DEFECT REGISTER
**Document Version:** 1.0.0-DEFECT-REGISTER  
**Updated:** 2026-10-31  
**Project:** LightningAPI Multi-Tenant AI Infrastructure  
**Worktree:** `C:\Users\irons\OneDrive\Desktop\Lightning Deal API`  
**Branch:** `audit/master-system-remediation`

---

## DEFECT REGISTER MATRIX

| Defect ID | Severity | Component | Affected Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | High | Token Accounting | `server/gateway.ts` | **RESOLVED** |
| **DEF-002** | High | Quota Engine | `server/accounting/tokenReservation.ts` | **RESOLVED** |
| **DEF-003** | Medium | Key Lifecycle | `server/user.ts` | **RESOLVED** |
| **DEF-004** | High | Security / White-Label | `server/gateway.ts` | **RESOLVED** |
| **DEF-005** | Medium | API Gateway Routing | `server/index.ts` | **RESOLVED** |
| **DEF-006** | Medium | Public Key Inspection | `server/tools.ts` | **RESOLVED** |
| **DEF-007** | Low | Documentation / UI | `src/pages/dashboard/UserDocs.tsx` | **RESOLVED** |
| **DEF-008** | Low | UI Key Templates | `src/pages/dashboard/UserKeys.tsx` | **RESOLVED** |
| **DEF-009** | Low | Website Builder | `src/pages/dashboard/UserWebsiteBuilder.tsx` | **RESOLVED** |

---

## DETAILED DEFECT LOG & REMEDIATION EVIDENCE

### DEF-001: Race Condition in Concurrent Token Balance Deduction
- **Severity**: High (Financial / Accounting Correctness)
- **Component**: Gateway Usage Accounting (`updateTokensAndLog`)
- **Affected Files**: `server/gateway.ts` (lines 2170–2345)
- **Root Cause**:
  `tokensRemaining` was updated using an in-memory calculate-and-set approach (`safeRem = currentKey.tokensRemaining - tokensUsedBig; keyUpdateData.tokensRemaining = safeRem`). In concurrent request bursts, multiple transactions read the same initial balance before prior transactions committed, leading to lost updates where only the last transaction's subtracted amount persisted. Additionally, default Prisma interactive transaction timeouts (2000ms maxWait) threw `P2028` on SQLite/PostgreSQL connection contention.
- **User / Business Impact**:
  During multi-turn concurrent requests or parallel test suites, token pack balances failed to decrement accurately, potentially giving customers uncharged tokens or failing accounting reconciliations.
- **Remediation**:
  1. Converted `tokensRemaining` to use database-native atomic decrement: `keyUpdateData.tokensRemaining = { decrement: tokensUsedBig }`.
  2. Wrapped `prisma.$transaction` in `{ maxWait: 15000, timeout: 30000 }`.
  3. Added an exponential backoff retry loop (up to 3 retries) catching `P2028` and `P2034` write conflict codes.
- **Verification Test**: `scripts/test-phase2-security-regression.ts` (`[P2-CONCURRENCY-01]`: 5 simultaneous concurrent deductions of 1k, 2k, 3k, 4k, 5k tokens against 1M allowance verified exact used = 15,000 and exact remaining = 985,000).
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-002: Premature Quota Rejection on Incomplete Rolling-Plan Recognition
- **Severity**: High (Gateway Routing & Availability)
- **Component**: Token Reservation & Window Calculations
- **Affected Files**: `server/accounting/tokenReservation.ts` (lines 85–100)
- **Root Cause**:
  `isRollingPlan()` checked `planStr` keywords (`rolling`, `5h`, `max`, `pro`) and `keyRecord.windowHours > 0`, but did not check `keyRecord.billingType === 'window'`. When a key had `plan: 'Prepaid'` and `billingType: 'window'`, `isRollingPlan` evaluated to `false`, treating the key as a depleted lifetime pack with 0 remaining allowance and rejecting requests with HTTP 429 before validating model names or request parameters.
- **User / Business Impact**:
  Valid requests with new customer keys failed with rate limit errors instead of processing normally, and error regression tests (`[P2-GATEWAY-02]`) failed with 429 instead of expected 404/400.
- **Remediation**:
  Updated `isRollingPlan` to explicitly check `if (keyRecord.billingType === 'window') return true` and `if (keyRecord.billingType === 'token' || keyRecord.billingType === 'credit') return false`.
- **Verification Test**: `scripts/test-phase2-security-regression.ts` (`[P2-GATEWAY-02]`: Invalid model rejects with 404; invalid max_tokens rejects with 400).
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-003: Schema Mismatch on Customer API Key Generation
- **Severity**: Medium (Customer Portal Functionality)
- **Component**: User Key Service (`POST /api/user/keys`)
- **Affected Files**: `server/user.ts` (line 1197)
- **Root Cause**:
  `handleCreateKey` in `server/user.ts` passed `windowHours: effectiveBillingType === 'window' ? 5 : null` to `prisma.apiKey.create`. However, `windowHours` does not exist on the `ApiKey` Prisma model (it is defined on `Plan` and `Subscription`). Prisma threw an `Unknown argument` validation error, causing `POST /api/user/keys` to respond with HTTP 500.
- **User / Business Impact**:
  Customers attempting to create a new key via the dashboard experienced unexpected 500 Internal Server Errors.
- **Remediation**:
  Removed `windowHours` from `apiKey.create` payload in `server/user.ts`; default `purchasedTokens` and `tokensRemaining` set to `BigInt(1000000)` and `plan` defaulted to `Claude Max 20x`.
- **Verification Test**: `scripts/test-phase2-security-regression.ts` (`[P2-KEY-01]`: `POST /api/user/keys` returns HTTP 201 with single-reveal `secretKey`).
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-004: Upstream Supplier Name Leak in Error Message
- **Severity**: High (Brand Protection & Supplier Isolation)
- **Component**: AI Gateway Error Normalization
- **Affected Files**: `server/gateway.ts` (lines 581–605, 756)
- **Root Cause**:
  1. Line 756 returned a raw permission message: `"ScaleMax token plan access is not enabled. Only Credit Plans are supported on this provider."`
  2. Upstream provider balance depletion strings (`"Your ScaleMax balance is used up... Top up at https://dashboard.scalemax.pro/billing"`) were not explicitly converted into white-labeled platform maintenance messages.
- **User / Business Impact**:
  Customers could see internal upstream supplier names and URLs in terminal error outputs and IDE consoles.
- **Remediation**:
  1. Replaced line 756 with `"Token plan routing is currently unavailable for this key tier. Please contact LightningAPI support."`
  2. Added regex interception in `sanitizeErrorMessage` to convert all balance depletion and top-up leak URLs to: `"The requested model capacity is currently undergoing scheduled replenishment. Please retry in a few moments or switch to an alternate model."`
- **Verification Test**: `scripts/check-supplier-leaks.cjs` (0 supplier leaks across all non-admin client paths).
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-005: 404 on Dual Base URL and SDK Route Variations
- **Severity**: Medium (Developer Experience & Interoperability)
- **Component**: Express Route Mounting
- **Affected Files**: `server/index.ts` (lines 185–200, 373)
- **Root Cause**:
  Anthropic SDKs append `/v1/messages` to `baseURL`. If a user configured `baseURL="https://lightningapi.pro/v1"`, the SDK called `/v1/v1/messages`. Similarly, token pack configurations calling `/token/v1/messages` returned SPA fallback HTML rather than API JSON.
- **User / Business Impact**:
  Developer tools and SDK clients setting non-standard base URLs received 404 or HTML syntax errors when expecting JSON.
- **Remediation**:
  Mounted gateway route arrays in `server/index.ts`:
  - `['/v1/messages', '/v1/v1/messages', '/token/v1/messages']`
  - `['/v1/chat/completions', '/v1/v1/chat/completions', '/token/v1/chat/completions']`
  - `['/v1/models', '/v1/v1/models', '/token/v1/models']`
  - Updated 404 handler to catch `/token` and `/tools` API prefixes.
- **Verification Test**: `test:scalemax` Phase 2b URL Normalization suite (16/16 URL tests passing).
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-006: Supplier Branding in Public Key Status Response
- **Severity**: Medium (Brand Protection)
- **Component**: Public Key Diagnostics (`/api/key-status`)
- **Affected Files**: `server/tools.ts` (lines 40–48)
- **Root Cause**:
  Direct inspection of `sm_live_` upstream keys returned `provider: 'ScaleMax'` and `label: 'ScaleMax Key'`.
- **User / Business Impact**:
  Customers querying key status via CLI or cURL saw raw upstream supplier branding.
- **Remediation**:
  Replaced returned JSON fields with `provider: 'LightningAPI'`, `label: 'LightningAPI Gateway Key'`, and plan names `'LightningAPI Credit (Universal)'` / `'LightningAPI Token Pack'`.
- **Verification Test**: Verified via `node scripts/check-supplier-leaks.cjs`.
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-007: Outdated Dashboard Documentation for Tri-Ecosystem
- **Severity**: Low (Documentation Consistency)
- **Component**: Customer Dashboard Docs (`UserDocs.tsx`)
- **Affected Files**: `src/pages/dashboard/UserDocs.tsx`
- **Root Cause**:
  Dashboard docs only documented the legacy Claude Anthropic endpoint and lacked configuration guides for OpenAI Frontier models, Local & Open-Weights models, Cursor OpenAI mode, Windsurf, and Python/Node OpenAI SDKs.
- **User / Business Impact**:
  Logged-in customers purchasing credit plans or token packs had no in-dashboard instructions on configuring OpenAI or Local models.
- **Remediation**:
  Completely redesigned `src/pages/dashboard/UserDocs.tsx` with interactive tabs for Claude Code, Cursor, Windsurf, VS Code/Continue, Python SDK, Node.js SDK, and cURL across all 3 model ecosystems.
- **Verification Test**: Clean TypeScript check and production build SSG pre-render.
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-008: Inconsistent Base URL in User Key Copy Snippets
- **Severity**: Low (Developer Usability)
- **Component**: API Key Management (`UserKeys.tsx`)
- **Affected Files**: `src/pages/dashboard/UserKeys.tsx` (lines 108, 469, 492)
- **Root Cause**:
  `UserKeys.tsx` copy snippet included `/v1` in `export ANTHROPIC_BASE_URL="https://lightningapi.pro/v1"`, which could cause Claude Code CLI to call `/v1/v1/messages`.
- **User / Business Impact**:
  Users copying the Anthropic environment variable could experience unexpected route appending depending on client SDK version.
- **Remediation**:
  Standardized Anthropic snippet to `export ANTHROPIC_BASE_URL="https://lightningapi.pro"` and OpenAI snippet to `export OPENAI_BASE_URL="https://api.lightningapi.pro/v1"`.
- **Verification Test**: Verified visual copy output and key management UI.
- **Status**: **RESOLVED & VERIFIED**

---

### DEF-009: Supplier Name in Website Builder Templates
- **Severity**: Low (White-Label Cleanliness)
- **Component**: Customer Website Builder (`UserWebsiteBuilder.tsx`)
- **Affected Files**: `src/pages/dashboard/UserWebsiteBuilder.tsx`
- **Root Cause**:
  A template tag referenced `'ScaleMax Standard'`.
- **User / Business Impact**:
  Template preview in the customer builder exposed supplier name.
- **Remediation**:
  Renamed tag to `'LightningAPI Standard'`.
- **Verification Test**: Verified via `node scripts/check-supplier-leaks.cjs`.
- **Status**: **RESOLVED & VERIFIED**
