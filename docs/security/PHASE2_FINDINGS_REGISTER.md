# LightningDeals Phase 2 Security Findings Register

**Document Reference:** `docs/security/PHASE2_FINDINGS_REGISTER.md`  
**Classification:** STRICTLY CONFIDENTIAL — TLP:AMBER / APPLICATION SECURITY REGISTER  
**Application:** LightningDeals AI API Gateway (`https://lightningapi.pro`)  
**Repository:** `HopUppper/lightningdeals-api`  
**Branch:** `security/phase2-hardening`  
**Baseline Phase 1 Commit:** `f7ac202`  
**Status:** ALL PHASE 2 DEFECTS REMEDIATED & VERIFIED IN TESTS

---

## 1. Executive Summary

This Register catalogues all vulnerabilities, architectural weaknesses, and data exposure vectors discovered, assessed, and remediated during Phase 2 Backend Security Hardening. 

Every finding is mapped to:
- Common Weakness Enumeration (CWE) and OWASP Top 10 (2021) categories.
- Concrete source code locations.
- Remediation diff and mechanism.
- Automated security regression test ID in `scripts/test-phase2-security-regression.ts`.

---

## 2. Summary Findings Matrix

| Finding ID | Title | Severity | CWE / OWASP | Component | Verification Status |
|---|---|---|---|---|---|
| `P2-01` | Plaintext API Key Exposure on Customer Listings | **P1 (High)** | CWE-359 / OWASP A02:2021 | `server/user.ts:2015` | **VERIFIED FIXED IN TESTS** (`P2-MASK-01`) |
| `P2-02` | API Key Decryption on Subscription Listings | **P1 (High)** | CWE-359 / OWASP A02:2021 | `server/user.ts:1555` | **VERIFIED FIXED IN TESTS** (`P2-MASK-02`) |
| `P2-03` | API Key Decryption on Order History Listings | **P1 (High)** | CWE-359 / OWASP A02:2021 | `server/user.ts:1638` | **VERIFIED FIXED IN TESTS** (`P2-MASK-03`) |
| `P2-04` | Key Creation Route Variable ReferenceError | **P1 (High)** | CWE-754 / OWASP A04:2021 | `server/user.ts:1170` | **VERIFIED FIXED IN TESTS** (`P2-KEY-01`) |
| `P2-05` | AI Gateway Token Ledger Concurrency Overdraft | **P1 (High)** | CWE-362 / OWASP A04:2021 | `server/gateway.ts:1526` | **VERIFIED FIXED IN TESTS** (`P2-CONCURRENCY-01`) |
| `P2-06` | Reflected XSS in PayU Hosted Order Redirect | **P2 (Medium)** | CWE-79 / OWASP A03:2021 | `server/payments/paymentRoutes.ts:228` | **VERIFIED FIXED IN TESTS** (`P2-XSS-01`) |
| `P2-07` | Gateway Parameter & Model Input Validation Gap | **P2 (Medium)** | CWE-20 / OWASP A04:2021 | `server/gateway.ts:739` | **VERIFIED FIXED IN TESTS** (`P2-GATEWAY-02`) |
| `P2-08` | Cryptographic Audit Log Race-Condition False Alarm | **P2 (Medium)** | CWE-362 / OWASP A09:2021 | `server/auditLogger.ts:156` | **VERIFIED FIXED IN TESTS** (`P2-AUDIT-01`, `P2-AUDIT-02`) |

---

## 3. Detailed Vulnerability Analyses & Remediations

### 3.1 P2-01: Plaintext API Key Exposure on Customer Listings
- **Severity:** P1 (High)
- **CWE:** CWE-359 (Exposure of Private Personal Information to an Unauthorized Actor)
- **OWASP:** A02:2021 – Cryptographic Failures
- **Location:** `server/user.ts:2015-2062` (`GET /api/user/keys`)
- **Description:** When customers retrieved their API key catalog, the backend decrypted `keyEncrypted` and transmitted the full plaintext API key (`secretKey: decrypted || k.displayKey`) in every response payload. If a customer dashboard session was observed via proxy, browser extension, or client-side XSS, the attacker could harvest all permanent API keys.
- **Remediation:** Removed decryption and `secretKey` from the `GET /keys` mapping. The endpoint now strictly returns `displayKey` (masked prefix and suffix, e.g., `ld_live_...9999`). Full raw secrets are only returned once during initial creation (`POST /keys`).
- **Regression Test:** `P2-MASK-01` in `scripts/test-phase2-security-regression.ts`.

---

### 3.2 P2-02: API Key Decryption on Subscription Listings
- **Severity:** P1 (High)
- **CWE:** CWE-359 (Exposure of Private Personal Information)
- **OWASP:** A02:2021 – Cryptographic Failures
- **Location:** `server/user.ts:1555-1635` (`GET /api/user/subscriptions`)
- **Description:** The customer subscription endpoint decrypted and returned `apiKeySecret` for active subscriptions.
- **Remediation:** Omitted `apiKeySecret` from the subscription response payload. Only `apiKeyDisplay` is returned.
- **Regression Test:** `P2-MASK-02` in `scripts/test-phase2-security-regression.ts`.

---

### 3.3 P2-03: API Key Decryption on Order History Listings
- **Severity:** P1 (High)
- **CWE:** CWE-359 (Exposure of Private Personal Information)
- **OWASP:** A02:2021 – Cryptographic Failures
- **Location:** `server/user.ts:1638-1684` (`GET /api/user/orders`)
- **Description:** The customer order history listing decrypted and returned `secretKey` for all fulfilled orders.
- **Remediation:** Omitted `secretKey` from the order history response. Only `displayKey` is provided.
- **Regression Test:** `P2-MASK-03` in `scripts/test-phase2-security-regression.ts`.

---

### 3.4 P2-04: Key Creation Route Variable ReferenceError
- **Severity:** P1 (High)
- **CWE:** CWE-754 (Improper Check for Unusual or Exceptional Conditions)
- **OWASP:** A04:2021 – Insecure Design
- **Location:** `server/user.ts:1170-1215` (`POST /api/user/keys`)
- **Description:** The route handler destructured `keyMaterial` as `{ rawKeySecret, ... }`, but on line 1211 attempted to access an undeclared identifier `rawKey`, causing an unhandled `ReferenceError` during manual key generation. Additionally, the response leaked internal ciphertext `keyEncrypted`.
- **Remediation:** Corrected variable identifier to `rawKeySecret`, omitted `keyEncrypted` from the response JSON, and guaranteed safe single-exposure output.
- **Regression Test:** `P2-KEY-01` in `scripts/test-phase2-security-regression.ts`.

---

### 3.5 P2-05: AI Gateway Token Ledger Concurrency Overdraft
- **Severity:** P1 (High)
- **CWE:** CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization)
- **OWASP:** A04:2021 – Insecure Design
- **Location:** `server/gateway.ts:1526-1605` (`updateTokensAndLog`)
- **Description:** `updateTokensAndLog` calculated `tokensRemaining` by subtracting usage from an in-memory `keyRecord` snapshot captured at request start. When multiple requests ran concurrently on the same key, subsequent request completions overwrote `tokensRemaining` with stale values, allowing customers to exceed their prepaid quota without deducting tokens.
- **Remediation:** Refactored token balance deduction into an interactive Prisma transaction with atomic database decrement: `tokensRemaining: { decrement: tokensUsedBig }` and atomic increment: `tokensUsed: { increment: tokensUsedBig }`.
- **Regression Test:** `P2-CONCURRENCY-01` in `scripts/test-phase2-security-regression.ts`.

---

### 3.6 P2-06: Reflected XSS in PayU Hosted Order Redirect
- **Severity:** P2 (Medium)
- **CWE:** CWE-79 (Improper Neutralization of Input During Web Page Generation)
- **OWASP:** A03:2021 – Injection
- **Location:** `server/payments/paymentRoutes.ts:228-325` (`handlePayUOrderRedirect`)
- **Description:** Route parameter `req.params.orderId` was interpolated directly into an HTML error card template when an order was not found, allowing reflected Cross-Site Scripting via crafted URLs (e.g., `/pay/<script>alert(1)</script>`).
- **Remediation:** Implemented `escapeHtml` entity encoder and applied sanitization to all reflected URL parameters and order fields.
- **Regression Test:** `P2-XSS-01` in `scripts/test-phase2-security-regression.ts`.

---

### 3.7 P2-07: Gateway Parameter & Model Input Validation Gap
- **Severity:** P2 (Medium)
- **CWE:** CWE-20 (Improper Input Validation)
- **OWASP:** A04:2021 – Insecure Design
- **Location:** `server/gateway.ts:739-795` (`handleMessagesEndpoint`)
- **Description:** Incoming requests did not strictly validate `max_tokens` type and bounds (allowing negative or excessive numbers), nor did they bound `model` string lengths.
- **Remediation:** Enforced strict integer bounds on `max_tokens` (1 to 128,000), validated `temperature` (0.0 to 2.0), and bounded `model` parameter lengths.
- **Regression Test:** `P2-GATEWAY-02` in `scripts/test-phase2-security-regression.ts`.

---

### 3.8 P2-08: Cryptographic Audit Log Race-Condition False Alarm
- **Severity:** P2 (Medium)
- **CWE:** CWE-362 (Race Condition in Logging Pipeline)
- **OWASP:** A09:2021 – Security Logging and Monitoring Failures
- **Location:** `server/auditLogger.ts:156-285` (`recordAuditEvent`)
- **Description:** Asynchronous `setImmediate` executions allowed adjacent audit events to simultaneously fetch the same previous hash, causing apparent breaks in the SHA-256 hash chain and generating false-positive tamper alerts.
- **Remediation:** Implemented sequential promise queue (`auditQueue`), strictly monotonic timestamp sequencing, and compound deterministic sorting `[{ timestamp: 'desc' }, { id: 'desc' }]`.
- **Regression Test:** `P2-AUDIT-01` & `P2-AUDIT-02` in `scripts/test-phase2-security-regression.ts`.

---

## 4. Multi-Tenant IDOR Baseline

All customer-facing endpoints in `userRouter`, `customerSubscriptionRouter`, `customerRewardRouter`, `customerReferralRouter`, and `studioRouter` were verified to enforce strict ownership scoping:
- `where: { userId: req.user.id }`
- Verified by tests `P2-IDOR-01` through `P2-IDOR-05`.
