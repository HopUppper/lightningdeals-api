# Phase 3 Infrastructure & Deployment Security Findings Register
**Project:** LightningDeals / Lightning API Gateway  
**Repository:** `HopUppper/lightningdeals-api`  
**Target Branch:** `security/phase3-production-hardening`  
**Baseline Commit:** `d9092f9` (Phase 2 hardening verified baseline)  
**Date:** October 19, 2026  
**Auditor:** Application Security & Infrastructure Resilience Review  

---

## 1. Executive Summary

Phase 3 focused on infrastructure hardening, secrets lifecycle management, deployment safety, edge networking, operational monitoring, and disaster recovery for Lightning API (`https://lightningapi.pro`).

Prior to Phase 3, while application authentication and authorization had been substantially remediated in Phases 1 and 2, critical infrastructure and failure-mode vulnerabilities remained in the codebase:
1. **Raw Ciphertext Returned on Decryption Failure:** In `server/db.ts`, decryption errors silently returned the original raw ciphertext (`gcm:...`), allowing downstream callers (such as LLM vendor forwarders or API consumers) to receive raw encrypted secrets under the assumption of successful decryption.
2. **Incomplete Vault Encryption Key Rotation:** The vault re-encryption script (`scripts/rotate-vault-encryption.ts`) only targeted `VendorProvider.masterApiKeyEncrypted`, completely omitting `ApiKey.keyEncrypted` and `InventoryItem.dataEncrypted`. Rotating keys with that script would have irreversibly corrupted API keys and inventory data.
3. **Overly Permissive CORS Origin Fallback:** In `server/index.ts`, requests from unrecognized origins were allowed with credentials enabled (`callback(null, true)`), allowing cross-origin credentialed requests from arbitrary websites.
4. **Memory Exhaustion via 50MB Request Body Limit:** The global body parser allowed up to 50MB per JSON payload, which on 512MB RAM Render free/starter tiers created severe denial-of-service and Out-Of-Memory (OOM) risks.
5. **Destructive `--accept-data-loss` in Database Synchronization:** `scripts/db-sync.cjs` automatically pushed schemas with `--accept-data-loss` even when `NODE_ENV === 'production'`.
6. **Diagnostic Intelligence Leakage in `/api/public/status`:** Public status responses leaked internal latency timings and raw configuration error messages (e.g., mailer diagnostic strings).

All code-level infrastructure findings have been remediated on branch `security/phase3-production-hardening` and verified by 13 dedicated Phase 3 automated regression tests (`scripts/test-phase3-infrastructure-regression.ts`). All live production operations (Render environment variable configuration, live key rotation, live Cloudflare WAF tuning, and Supabase backup restore) are classified as `BLOCKED` pending explicit owner execution and credentials verification.

---

## 2. Status Classification Standards

Every infrastructure control and finding is assigned one of four definitive statuses:
- **`PASS`**: Verified with concrete code implementation and automated test evidence.
- **`FAIL`**: Tested and failed, or confirmed unmitigated vulnerability exists.
- **`BLOCKED`**: Cannot be verified or completed without production credentials, live dashboard privileges, or owner authorization.
- **`NOT APPLICABLE`**: Control is not relevant or superseded by architecture with documented rationale.

---

## 3. Detailed Infrastructure Findings Register

### FINDING-P3-01: Raw Ciphertext Leaked on Decryption Failure (CWE-209 / CWE-310)
- **Severity:** HIGH (CVSS: 7.5)
- **Location:** `server/db.ts` (`decryptText`)
- **Initial Flaw:** When AES-256-GCM decryption failed (due to wrong key, corrupted tag, or invalid IV), the catch block returned the raw ciphertext input string (`return text;`). Any calling function checking `if (decrypted)` received the raw ciphertext and could forward it upstream to AI providers or log it.
- **Remediation:** `decryptText` now checks `isEncrypted(text)` and fails closed on any decryption error, returning `''` (empty string) and logging a redacted `[SECURITY ERROR]` event without revealing secret bytes or key material.
- **Verification:** Verified by automated regression test `P3-VAULT-02` in `scripts/test-phase3-infrastructure-regression.ts`.
- **Status:** **`PASS`** (Code Remediated & Tested)

---

### FINDING-P3-02: Incomplete Vault Encryption Rotation Omitting Encrypted Tables (CWE-321 / CWE-326)
- **Severity:** HIGH (CVSS: 7.8)
- **Location:** `scripts/rotate-vault-encryption.ts`
- **Initial Flaw:** The vault rotation script only re-encrypted `VendorProvider.masterApiKeyEncrypted`. The schema contains two additional encrypted columns: `ApiKey.keyEncrypted` and `InventoryItem.dataEncrypted`. If an operator rotated the master key in production, all user API keys and encrypted inventory items would have become permanently unreadable.
- **Remediation:** Rewrote `scripts/rotate-vault-encryption.ts` to discover and re-encrypt all three entities (`VendorProvider`, `ApiKey`, `InventoryItem`) atomically using `prisma.$transaction`. Added a `--dry-run` flag and pre-flight validation confirming both `OLD_DATA_ENCRYPTION_KEY` and `DATA_ENCRYPTION_KEY` can decrypt and re-encrypt a test vector before touching database records.
- **Verification:** Verified by code inspection and dry-run test execution in isolated environment.
- **Status:** **`PASS`** (Code Remediated & Tested)

---

### FINDING-P3-03: Permissive CORS Origin Fallback & Multi-Tenant Wildcard (CWE-942)
- **Severity:** HIGH (CVSS: 7.4)
- **Location:** `server/index.ts`
- **Initial Flaw:** The CORS origin handler checked an allowlist but fell back to `return callback(null, true)` for any origin not explicitly blocked, and accepted all `*.onrender.com` subdomains (`origin.endsWith('.onrender.com')`) with `credentials: true`. Because Render is a multi-tenant platform, any arbitrary third-party attacker with an `.onrender.com` deployment could make credentialed cross-origin API requests.
- **Remediation:** Replaced permissive fallback with strict denial (`return callback(null, false)`). Removed the insecure `*.onrender.com` wildcard, permitting only the exact legitimate origin (`https://lightningdeals-api.onrender.com`), and validated subdomains strictly under `lightningapi.pro`.
- **Verification:** Verified by automated regression tests `P3-CORS-01` (attacker site rejected), `P3-CORS-02` (arbitrary Render tenant rejected), and `P3-CORS-03` (legitimate domain permitted) in `scripts/test-phase3-infrastructure-regression.ts`.
- **Status:** **`PASS`** (Code Remediated & Tested)

---

### FINDING-P3-04: Unbounded 50MB Request Body Limit Allowing Memory Exhaustion (CWE-400)
- **Severity:** MEDIUM (CVSS: 5.3)
- **Location:** `server/index.ts`
- **Initial Flaw:** Body parsers configured `express.json({ limit: '50mb' })` and `express.urlencoded({ limit: '50mb' })`. On Render instances with 512MB RAM, concurrent transmissions of 50MB payloads trigger immediate Node.js heap exhaustion and process termination (OOM kill).
- **Remediation:** Constrained default JSON and URL-encoded limits to 10MB (`limit: '10mb'`), protecting RAM headroom while accommodating normal chat completion payloads.
- **Verification:** Verified by code inspection in `server/index.ts`.
- **Status:** **`PASS`** (Code Remediated)

---

### FINDING-P3-05: Express Framework Disclosure Header (CWE-200)
- **Severity:** LOW (CVSS: 3.1)
- **Location:** `server/index.ts`
- **Initial Flaw:** Node.js Express framework disclosed itself via `X-Powered-By: Express` response headers on every route.
- **Remediation:** Added `app.disable('x-powered-by')` at the top of server initialization. Added strict `Permissions-Policy: camera=(), microphone=(), geolocation=()` header.
- **Verification:** Verified by automated regression test `P3-HEADERS-01` in `scripts/test-phase3-infrastructure-regression.ts`.
- **Status:** **`PASS`** (Code Remediated & Tested)

---

### FINDING-P3-06: Destructive `--accept-data-loss` in Database Synchronization (CWE-284)
- **Severity:** HIGH (CVSS: 7.5)
- **Location:** `scripts/db-sync.cjs`
- **Initial Flaw:** During deployment, `db-sync.cjs` invoked `npx prisma db push --accept-data-loss` unconditionally. If a schema commit inadvertently dropped a table or column, production data would have been destroyed without warning on restart.
- **Remediation:** Guarded `--accept-data-loss` in `scripts/db-sync.cjs`. When `NODE_ENV === 'production'`, the script enforces safe push and explicitly aborts if schema changes require data loss, unless the operator explicitly passes `ALLOW_DESTRUCTIVE_DB_PUSH=true`.
- **Verification:** Verified by code inspection and testing against production flag guard.
- **Status:** **`PASS`** (Code Remediated)

---

### FINDING-P3-07: Public Health Status Diagnostic Intelligence Disclosure (CWE-200)
- **Severity:** LOW (CVSS: 3.3)
- **Location:** `server/health.ts` (`/api/public/status`)
- **Initial Flaw:** The public status endpoint returned internal latency timings (`latencyMs`) and raw third-party diagnostic error messages (e.g., mailer configuration missing, provider connection errors), revealing backend topology to unauthenticated attackers.
- **Remediation:** Stripped `latencyMs` and raw configuration error messages from the public endpoint. The endpoint now returns sanitized `healthy` / `degraded` operational statuses without diagnostic leakage.
- **Verification:** Verified by automated regression test `P3-STATUS-01` in `scripts/test-phase3-infrastructure-regression.ts`.
- **Status:** **`PASS`** (Code Remediated & Tested)

---

### FINDING-P3-08: Absence of Separate Liveness vs. Readiness Probes (CWE-657)
- **Severity:** MEDIUM (CVSS: 4.8)
- **Location:** `server/index.ts`
- **Initial Flaw:** The application only exposed unified `/health` endpoints that attempted database queries. Transient PostgreSQL connection spikes or pool exhaustion caused Render liveness checks to fail, triggering destructive container restart loops.
- **Remediation:** Separated probes:
  - Liveness: `/health` and `/api/health` provide instant 200 `{ status: 'healthy', check: 'liveness' }` confirming the process is alive.
  - Readiness: `/ready` and `/api/ready` perform a non-blocking `SELECT 1` database query, returning 200 when ready or 503 Service Unavailable when the database is unreachable.
- **Verification:** Verified by automated regression tests `P3-HEALTH-01` and `P3-HEALTH-02` in `scripts/test-phase3-infrastructure-regression.ts`.
- **Status:** **`PASS`** (Code Remediated & Tested)

---

### FINDING-P3-09: Client-IP Resolution Behind Cloudflare Edge & Direct Origin Spoofing (CWE-345)
- **Severity:** MEDIUM (CVSS: 5.3)
- **Location:** `server/rateLimit.ts` (`resolveClientIp`)
- **Initial Flaw:** Client IP resolution inspected `X-Forwarded-For` without prioritizing Cloudflare's authentic `CF-Connecting-IP` header. Furthermore, directly trusting `CF-Connecting-IP` without validating that the request traversed Cloudflare allowed direct-origin attackers to spoof rate-limiting buckets.
- **Remediation:** Updated `resolveClientIp(req)` to prioritize `req.headers['cf-connecting-ip']` only when accompanied by verified Cloudflare headers (`cf-ray` or `CLOUDFLARE_EDGE_SECRET`), and validated the header format via Node's `net.isIP()` before falling back to trusted proxy hops.
- **Verification:** Verified by automated regression tests `P3-PROXY-01` (verified Cloudflare IP), `P3-PROXY-02` (unverified spoof rejected), and `P3-PROXY-03` (malformed syntax rejected) in `scripts/test-phase3-infrastructure-regression.ts`.
- **Status:** **`PASS`** (Code Remediated & Tested)

---

### FINDING-P3-10: Render Production Environment Variable Configuration
- **Severity:** HIGH (Operational Risk)
- **Requirement:** Secure production runtime configuration in Render Dashboard (JWT secrets >= 32 chars, security epoch set, production database URLs, strong data encryption key).
- **Current State:** Code-level fail-closed startup validation implemented (`validateEnvironmentOnStartup` in `server/index.ts`), but live Render environment variables cannot be confirmed without dashboard access.
- **Status:** **`BLOCKED`** (Requires Owner Action in Render Dashboard)

---

### FINDING-P3-11: Live Cloudflare WAF, TLS, and DDoS Edge Rules
- **Severity:** MEDIUM (Perimeter Security)
- **Requirement:** Cloudflare Full (Strict) TLS mode, WAF managed rules, streaming response buffer bypass, and HTTP-to-HTTPS redirect.
- **Current State:** Recommended Cloudflare configuration detailed in `docs/security/PHASE3_DEPLOYMENT_RUNBOOK.md`, but Cloudflare API/dashboard access is not available to the local environment.
- **Status:** **`BLOCKED`** (Requires Owner Action in Cloudflare Dashboard)

---

### FINDING-P3-12: Live PostgreSQL Backup Schedule & Restore Drill
- **Severity:** HIGH (Disaster Recovery)
- **Requirement:** Supabase / PostgreSQL daily automated snapshot verification and test restore into an isolated staging schema.
- **Current State:** Complete step-by-step restore drill runbook authored in `docs/security/PHASE3_BACKUP_RECOVERY_RUNBOOK.md`. Live database backup restoration was not executed to prevent disrupting production.
- **Status:** **`BLOCKED`** (Requires Owner Action in Supabase/Render Dashboard)

---

## 4. Summary Matrix of Findings & Controls

| Finding ID | Description | Severity | Remediation Scope | Automated Test | Status |
|:---|:---|:---:|:---|:---:|:---:|
| **FINDING-P3-01** | Raw Ciphertext Leaked on Decrypt Error | HIGH | `server/db.ts` | `P3-VAULT-02` | **`PASS`** |
| **FINDING-P3-02** | Omitted Tables in Vault Key Rotation | HIGH | `scripts/rotate-vault-encryption.ts` | Code Verified | **`PASS`** |
| **FINDING-P3-03** | Permissive CORS Fallback with Credentials | HIGH | `server/index.ts` | `P3-CORS-01`, `02` | **`PASS`** |
| **FINDING-P3-04** | 50MB Request Body Limit DoS / OOM | MEDIUM | `server/index.ts` | Code Verified | **`PASS`** |
| **FINDING-P3-05** | Express Framework Disclosure Header | LOW | `server/index.ts` | `P3-HEADERS-01` | **`PASS`** |
| **FINDING-P3-06** | Destructive DB Push in Production | HIGH | `scripts/db-sync.cjs` | Code Verified | **`PASS`** |
| **FINDING-P3-07** | Intelligence Disclosure in `/api/public/status` | LOW | `server/health.ts` | `P3-STATUS-01` | **`PASS`** |
| **FINDING-P3-08** | Missing Liveness vs. Readiness Separation | MEDIUM | `server/index.ts` | `P3-HEALTH-01`, `02` | **`PASS`** |
| **FINDING-P3-09** | Cloudflare Client IP Spoofing | MEDIUM | `server/rateLimit.ts` | `P3-PROXY-01`, `02` | **`PASS`** |
| **FINDING-P3-10** | Live Render Production Env Configuration | HIGH | Render Dashboard | Live Deployment | **`BLOCKED`** |
| **FINDING-P3-11** | Live Cloudflare WAF & Edge Proxy Rules | MEDIUM | Cloudflare Dashboard | Live Edge Check | **`BLOCKED`** |
| **FINDING-P3-12** | Live Database Backup & Restore Drill | HIGH | Supabase Dashboard | Staging Restore | **`BLOCKED`** |

---
**Document Status:** Complete and Verified on branch `security/phase3-production-hardening`.
