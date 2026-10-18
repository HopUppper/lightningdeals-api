# Incident Containment Runbook & Secret Rotation Inventory

**Document Reference:** `docs/security/INCIDENT_CONTAINMENT.md`  
**Classification:** STRICTLY CONFIDENTIAL — TLP:RED / INCIDENT RESPONSE  
**Target Application:** LightningDeals AI API Gateway (`https://lightningapi.pro`)  
**Repository:** `HopUppper/lightningdeals-api`  
**Hosting Environment:** Render (`lightningdeals-api.onrender.com`), Cloudflare DNS/WAF, PostgreSQL (Supabase / Render)  
**Incident Reference:** `HACK_REPORT.md` (Penetration Report — 2026-10-18)  
**Remediation Branch:** `incident/phase1-containment`

---

## 1. Incident Overview & Containment Baseline

On 2026-10-18, an independent penetration report documented full administrative compromise of `https://lightningapi.pro`.

### Root Causes
1. **Public Source Disclosure:** The backend and frontend codebase was committed to a public GitHub repository (`HopUppper/lightningdeals-api`), exposing `prisma/seed.ts`, internal architecture, and route topologies.
2. **Exposed Seed Administrator Credentials (F1):** Seed accounts (`sidhjain9002@gmail.com` and `sidhjain9802@gmail.com`) with plain SHA-256 and scrypt password hashes matching the default seed credential remained active and unchanged in production.
3. **Hardcoded Biphasic JWT Fallback Secrets (F2):** `server/auth.ts` and `server/adminAuth.ts` maintained hardcoded fallback secrets (`lightningdeals_secret_jwt_key_2026` and `apexscale-jwt-secret-key-production-2026`). An offline token forged with arbitrary UUIDs and owner email yielded full admin API access without valid login credentials.
4. **Login Error Foreign-Key Defect (F3):** Failed logins for non-existent admin emails used `'SYSTEM_UNAUTH'` as a foreign key on `AdminLog.adminUserId`, throwing an unhandled database exception and crashing the request with HTTP 500.
5. **Rate-Limit Client-Header Trust (F4):** Rate limiters directly inspected attacker-controlled `X-Forwarded-For` header strings, allowing unlimited brute-force attacks via header manipulation.
6. **Registration Failure (F5):** Missing `ReferralEngine` import caused all user registrations to crash with HTTP 500.
7. **Backdoor Logic in User & Admin Auth (Discovered during Audit):** Regular user login contained auto-provisioning backdoor logic for `sidhjain9002@gmail.com`, and admin password update contained bypass logic accepting legacy credentials.

---

## 2. Immediate Operational Scope & Compromised Assets

All credentials, tokens, and keys committed to the repository or stored in the database prior to containment must be treated as **COMPROMISED**.

| Component | Status | Operational Exposure |
|---|---|---|
| **Admin Account 1** (`sidhjain9002@gmail.com`) | COMPROMISED | Seed password committed to public repo. Successfully authenticated by attacker. |
| **Admin Account 2** (`sidhjain9802@gmail.com`) | COMPROMISED | Reused seed password. Successfully authenticated by attacker. |
| **Primary JWT Signing Secret** | COMPROMISED | `lightningdeals_secret_jwt_key_2026` committed in source. Forged tokens accepted. |
| **Legacy User JWT Fallback Secret** | COMPROMISED | `apexscale-jwt-secret-key-production-2026` committed in source. |
| **Vault Encryption Key (`ENCRYPTION_KEY`)** | COMPROMISED | Fallback `lightningdeals_default_vault_secret` and salt `lightningdeals_salt_2026` committed in source. |
| **Integration API Key (`INTEGRATION_API_KEY`)** | COMPROMISED | Fallback `lightning-integration-key-2026` and localhost header bypass present in source. |
| **Thinking Signature HMAC Key** | COMPROMISED | Fallback `ant_thinking_sec_key_2025` committed in source. |
| **Upstream AI Master Keys** | PRESUMED COMPROMISED | Admin panel provider endpoint `/api/admin/providers` and `/api/admin/keys` was reachable; encrypted material accessible. |
| **Customer API Keys (`ld_live_...`)** | EXPOSED | 12 customer API keys and token quotas visible via `/api/admin/keys`. |
| **Customer PII** | EXPOSED | 6 customer records (emails, IPs, cities, user-agents) accessible via `/api/admin/customers`. |
| **GitHub Repository** | PUBLIC EXPOSURE | Repository `HopUppper/lightningdeals-api` public; git history contains sensitive commits. |

---

## 3. Secret-Rotation Inventory & Owner Execution Plan

> [!CAUTION]
> In accordance with incident response policy, secret values are NEVER printed or committed.
> The owner must generate cryptographically strong, random values (minimum 32-64 bytes) via external control planes.

### 3.1 Owner Participation Required (External Control Planes)

The following actions cannot be executed autonomously by code and require the repository and cloud account owner:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OWNER ACTIONS REQUIRED                             │
├──────────────────────┬──────────────────────────────────────────────────────┤
│ 1. GitHub Visibility │ Make repository HopUppper/lightningdeals-api PRIVATE │
│                      │ immediately. Revoke obsolete personal access tokens. │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 2. Render Dashboard  │ Rotate Environment Variables:                        │
│                      │ - Set JWT_SECRET (min 64 chars, base64 / hex)        │
│                      │ - Set ENCRYPTION_KEY (min 32 chars)                  │
│                      │ - Set INTEGRATION_API_KEY (min 32 chars)             │
│                      │ - Set INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD   │
│                      │ - Set SECURITY_EPOCH (ISO timestamp of incident)     │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 3. Database / Supabase│ Rotate PostgreSQL database password and update       │
│                      │ DATABASE_URL and DIRECT_URL on Render.               │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 4. Upstream AI Keys  │ Rotate vendor API keys in Anthropic / OpusMax /      │
│                      │ OpenAI dashboards. Re-encrypt keys in /admin/providers│
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 5. Session Revocation│ Run emergency session revocation script:             │
│                      │ npm run session:revoke                               │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 4. Hosting & Deployment Containment Runbook

### Step 1: Restrict Public Administrator Access (Render & Cloudflare)
1. In Cloudflare Dashboard (`lightningapi.pro`):
   - Add WAF custom rule: Block or challenge all traffic to `/api/admin/*` and `/admin/*` unless originating from approved administrator egress IPs.
   - Restrict TLS to TLS 1.3 only.
2. In Render Dashboard (`lightningdeals-api`):
   - Verify `trust proxy` is set to `1` (Render acts as single reverse proxy termination).

### Step 2: Invalidate All Active Sessions
Execute the provided emergency revocation command:
```bash
npm run session:revoke
```
This performs:
- `isRevoked: true` on all active rows in `UserSession`.
- `passwordChangedAt: new Date()` on all administrator accounts, causing all existing stateless JWTs to fail verification immediately.

### Step 3: Rotate Administrator Credentials
Run the secure provisioning tool to rotate both compromised administrator accounts:
```bash
npx tsx scripts/provision-admin.ts --email=sidhjain9002@gmail.com --rotate
npx tsx scripts/provision-admin.ts --email=sidhjain9802@gmail.com --rotate
```
Or provision a new, clean owner account:
```bash
npx tsx scripts/provision-admin.ts --email=owner@lightningapi.pro
```

### Step 4: Verify Code Baseline
Ensure code deployment is running on branch `incident/phase1-containment` where:
- All fallback secrets are removed.
- SHA-256 password verification is banned.
- Rate limiting enforces account-based dual keys and validates client IPs.
- Foreign key crash on admin login is fixed.
- ReferralEngine import is restored.

---

## 5. Evidence Preservation Checklist

Before taking services offline or running any database operations, preserve the following evidence:

- [x] **Incident Penetration Report:** Preserved at `c:\Users\irons\Downloads\HACK_REPORT.md`.
- [x] **Git Repository State at Incident Time:** Commit history preserved on `main` before branching.
- [ ] **Render Deployment & Access Logs:** Export raw HTTP access logs for the past 7 days from the Render dashboard (search for IP `103.*` or requests targeting `/api/admin/*`).
- [ ] **Database Audit Records:** Dump `AuditEvent`, `AdminLog`, and `SecurityLog` tables to offline storage prior to any schema modification.
- [ ] **Upstream Provider Usage:** Download usage logs from Anthropic and third-party provider accounts to verify whether unauthorized token consumption occurred.

---

## 6. Containment Verification Status

| Finding | Containment Action | Code Status | Production Status |
|---|---|---|---|
| **F1** — Exposed Admin Credentials | Banned `love9002`/`9002`, scrypt only, removed seed hardcoded credentials | **VERIFIED FIXED (Local/Branch)** | PENDING OWNER ROTATION IN PROD |
| **F2** — JWT Token Forgery | Removed both fallback secrets, enforced `getJwtSecret()`, UUID check, revoked sessions | **VERIFIED FIXED (Local/Branch)** | PENDING OWNER ROTATION IN PROD |
| **F3** — Admin Login 500 Defect | `adminUserId: null` on unauthenticated logins, identical 401 response | **VERIFIED FIXED (Local/Branch)** | PENDING DEPLOYMENT |
| **F4** — Rate-Limiter Bypass | Bound limiter to `req.ip` via `trust proxy: 1`, added account dual-key limit | **VERIFIED FIXED (Local/Branch)** | PENDING DEPLOYMENT |
| **F5** — Broken Registration | Added `ReferralEngine` import and transactional safety | **VERIFIED FIXED (Local/Branch)** | PENDING DEPLOYMENT |
| **F6** — Audit Chain Break | Concurrency lock and deterministic ordering for tamper check | **FIX IMPLEMENTED** | PENDING PRODUCTION VERIFICATION |
| **Backdoors** — Hardcoded Auto-Admin | Removed backdoor checks in `user.ts` (line 824) and `admin.ts` (line 3470) | **VERIFIED FIXED (Local/Branch)** | PENDING DEPLOYMENT |

**Exit Criteria for Phase 1 Containment:** Code changes verified via automated regression test suite (`npm run test:security` passing 16/16). Production deployment and credential rotation require explicit owner sign-off.
