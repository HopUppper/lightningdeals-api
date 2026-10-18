# Phase 2 Deployment & Operational Verification Checklist

**Document Reference:** `docs/security/PHASE2_DEPLOYMENT_CHECKLIST.md`  
**Classification:** STRICTLY CONFIDENTIAL — TLP:AMBER / DEVOPS & SRE RUNBOOK  
**Target Application:** LightningDeals AI API Gateway (`https://lightningapi.pro`)  
**Repository:** `HopUppper/lightningdeals-api`  
**Target Branch:** `security/phase2-hardening`  
**Date:** 2026-10-19  
**Status:** READY FOR STAGING / CANARY DEPLOYMENT  

---

## 1. Overview & Scope

This checklist outlines the mandatory operational verification, deployment sequence, canary testing, and rollback criteria for releasing **Phase 2 Backend Security Hardening** into staging and production environments.

Phase 2 introduces backend security enhancements, secret masking, concurrency protection, and input validation without introducing breaking database migrations or changes to external API schemas.

---

## 2. Pre-Deployment Verification Gate (Local / CI)

Before triggering any deployment build or promotion, verify that all four pre-flight automated checks succeed on the target commit:

### 2.1 Branch & Commit Baseline
- [ ] Confirm you are on branch `security/phase2-hardening`.
- [ ] Confirm the commit ancestry traces back to verified Phase 1 commit `f7ac202`.
- [ ] Ensure `git status` reports a clean working tree.

### 2.2 Full Security Regression Test Suite
- [ ] Run the complete automated security test suite:
  ```bash
  npm run test:security:all
  ```
- [ ] Verify **34 / 34 tests pass (0 failures)**:
  - 19 / 19 Phase 1 emergency containment tests (`npm run test:security`)
  - 15 / 15 Phase 2 backend hardening tests (`npm run test:security:phase2`)

### 2.3 Standalone Audit Chain Verification
- [ ] Run the cryptographic hash-chain verifier:
  ```bash
  npm run verify:audit
  ```
- [ ] Confirm `All 50 events in sample verified tamper-free.`

### 2.4 TypeScript Static Analysis
- [ ] Run the TypeScript compiler in no-emit mode:
  ```bash
  npx tsc --noEmit
  ```
- [ ] Confirm **0 type errors** are reported.

### 2.5 Production Build Compilation
- [ ] Execute the production build pipeline:
  ```bash
  npm run build
  ```
- [ ] Confirm both client Vite build and server build succeed without warnings or errors.

---

## 3. Environment & Secrets Verification

Verify that all required environment variables are set in the Render / hosting provider control plane.

| Environment Variable | Requirement | Purpose | Validation Rule |
|---|---|---|---|
| `NODE_ENV` | `production` | Production runtime optimizations | Must equal `production` |
| `PORT` | `10000` or provider port | HTTP server port | Numeric port |
| `DATABASE_URL` | Pooled Postgres connection URL | Runtime application queries (Supabase Transaction Pooler, port 6543) | Valid PostgreSQL URI with pgbouncer parameters |
| `DIRECT_URL` | Direct Postgres connection URL | Schema management and migrations (Supabase port 5432) | Valid direct PostgreSQL URI |
| `JWT_SECRET` | 32+ character high-entropy secret | JWT signing and verification | Must NOT match banned default secrets |
| `DATA_ENCRYPTION_KEY` | 64-char hex string (32 bytes) | AES-256-GCM encryption of vendor and API keys | Hex string, exact 64 characters |
| `OLD_DATA_ENCRYPTION_KEY` | Optional 64-char hex string | Dual-key vault decryption fallback during key rotation | Optional |
| `SECURITY_EPOCH` | Optional Unix timestamp (seconds) | Global invalidation cutoff for legacy sessions | Unix epoch integer |

> [!IMPORTANT]
> Never commit production secret values or print them in terminal logs or CI output.

---

## 4. Deployment Execution Sequence

Phase 2 requires **zero destructive database migrations**. The changes are entirely application-layer business logic, atomic Prisma queries, and queue serialization.

### Step 4.1: Pull Request & Merge
1. Open a pull request from `security/phase2-hardening` targeting `main` (or the production release branch).
2. Attach `docs/security/PHASE2_REMEDIATION_REPORT.md` and test suite execution logs as review artifacts.
3. Obtain peer or security lead sign-off.
4. Merge using standard fast-forward or squash merge (do NOT rebase or force-push).

### Step 4.2: Render Staging / Production Deployment
1. Trigger deployment on Render for `lightningdeals-api`.
2. Monitor build logs:
   - Ensure `npm install` completes cleanly.
   - Ensure `npm run build` compiles Vite assets and server bundles.
   - Verify health check probe returns HTTP 200 on `/health`.

---

## 5. Post-Deployment Verification (Canary Smoke Tests)

Perform the following smoke tests against the deployed instance using synthetic test accounts:

### 5.1 Service Health
- [ ] Request `GET https://lightningapi.pro/health`:
  - Expected: HTTP 200 `{"status":"ok", ...}`

### 5.2 Secret Masking on Key Listings
- [ ] Log in with a synthetic customer account.
- [ ] Request `GET /api/user/keys`:
  - Expected: HTTP 200.
  - Verify every key in the array contains `displayKey` (e.g. `ld_live_...4321`) and that `secretKey` is `undefined`.
- [ ] Request `GET /api/user/subscriptions`:
  - Expected: HTTP 200. Verify `apiKeySecret` is `undefined`.
- [ ] Request `GET /api/user/orders`:
  - Expected: HTTP 200. Verify `secretKey` is `undefined`.

### 5.3 Key Generation Single Exposure
- [ ] Request `POST /api/user/keys` with `{"name": "Canary Key"}`:
  - Expected: HTTP 201.
  - Verify `key` contains `rawKeySecret` (or `secretKey`).
  - Verify `keyEncrypted` is NOT present in the response body.

### 5.4 Reflected XSS Neutralization
- [ ] Request `GET /pay/%3Cscript%3Ealert(1)%3C%2Fscript%3E`:
  - Expected: Rendered HTML page contains `&lt;script&gt;alert(1)&lt;/script&gt;` and does NOT execute script tags.

### 5.5 AI Gateway Token Decrement
- [ ] Send a test request to `POST /v1/messages` using the newly created canary key.
- [ ] Verify HTTP 200 response from upstream provider or test stub.
- [ ] Query `GET /api/user/keys` and verify `tokensRemaining` decreased by the exact token count reported in the usage ledger.

---

## 6. Rollback & Contingency Plan

### 6.1 Rollback Triggers
Initiate immediate rollback if any of the following occur within the first 60 minutes post-deployment:
- HTTP 5xx error rate exceeds 1% of total traffic.
- AI Gateway request latency (P95) increases by more than 500ms due to database transaction contention.
- Deadlock exceptions (`40P01` or Prisma transaction timeouts) appear in Render runtime logs.
- Audit logging pipeline halts or causes unhandled promise rejections.

### 6.2 Rollback Procedure
1. **Render Instant Rollback:**
   - In the Render Dashboard, navigate to the `lightningdeals-api` service.
   - Select **Deployments** > identify the previous healthy Phase 1 deployment commit > click **Rollback to this deploy**.
2. **Database Impact Assessment:**
   - Because Phase 2 did NOT execute database schema alterations, no SQL rollback migration is needed.
   - All token decrements processed during the canary window remain accurate and mathematically valid.
3. **Post-Rollback Notification:**
   - Notify the incident response channel of the rollback event, preserve server logs, and begin root-cause analysis.
