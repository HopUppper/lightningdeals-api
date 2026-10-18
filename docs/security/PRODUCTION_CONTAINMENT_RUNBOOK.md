# LightningDeals AI API Gateway — Production Containment Runbook

**Document Reference:** `docs/security/PRODUCTION_CONTAINMENT_RUNBOOK.md`  
**Classification:** TLP:AMBER / PRODUCTION INCIDENT RESPONSE & CONTAINMENT RUNBOOK  
**System:** LightningDeals AI API Gateway (`https://lightningapi.pro`)  
**Repository:** `HopUppper/lightningdeals-api`  
**Target Remediation Branch:** `incident/phase1-containment`  
**Hosting Topology:** Cloudflare WAF/CDN -> Render Web Service -> Supabase Managed PostgreSQL  
**Version:** 1.1.0 (Safety Hardened)  
**Effective Date:** 2026-10-18  

---

## 1. Objective & Operational Scope

This runbook specifies the ordered, verified operational procedure for executing production containment on the LightningDeals AI API Gateway following the incident detailed in `HACK_REPORT.md`.

It establishes:
1. Complete elimination of compromised credentials and authentication bypasses in production.
2. Controlled rotation of all exposed secrets across Render, Supabase, AI providers, and administrative access.
3. Invalidation of unauthorized JWT sessions without causing unnecessary data loss or prolonged customer downtime.
4. Comprehensive verification procedures to confirm remediation before authorizing Phase 2.

> [!IMPORTANT]
> **MANDATORY RULES OF ENGAGEMENT**
> - **Zero Disruption of Legitimate Data:** No destructive migrations, table truncations, or raw customer data deletions.
> - **Redacted Credentials:** Never enter, commit, or print plain-text secrets, production tokens, database passwords, or provider master keys in logs, chats, or shell commands.
> - **Owner Approval Required:** Every action requiring live production control-plane access (Render, Supabase, Cloudflare, GitHub, upstream AI providers) requires explicit authorization from the business owner.
> - **Evidence Preservation:** Existing production database backups, logs, and tamper records must be archived before executing in-place rotations.

---

## 2. Global Secret Inventory & Rotation Matrix

| Secret Category | Variable / Storage Location | Exposure Risk in Incident | Rotation Required? | Primary Dependencies | Verification Method |
|---|---|---|---|---|---|
| **JWT Signing Key** | Render Env: `JWT_SECRET` | **CRITICAL**: Hardcoded fallbacks (`lightningdeals_secret_jwt_key_2026`, `apexscale-jwt-secret-key-production-2026`) allowed offline admin token forgery. | **YES (MANDATORY)** | Must be applied simultaneously with code deployment in Stage 5. | Verify server starts; test legacy tokens return HTTP 401. |
| **Security Epoch** | Render Env: `SECURITY_EPOCH` | **HIGH**: Legacy stateless tokens minted before incident could remain valid if DB session check bypassed. | **YES (MANDATORY)** | Accepts numeric milliseconds string or ISO 8601 string. | Old tokens with `iat * 1000 < SECURITY_EPOCH` rejected with 401. |
| **Admin Passwords** | PostgreSQL table `User` (`role = 'admin'`) | **CRITICAL**: Seed credentials (`sidhjain9002@gmail.com` / `love9002`, `admin@lightningdeals.com` / `admin123`) compromised. | **YES (MANDATORY)** | Code deployment in Stage 5 must be live first (Scrypt hashing enforced). | `scripts/provision-admin.ts --rotate` executed; test login. |
| **Database Credentials** | Render Env: `DATABASE_URL`, `DIRECT_URL` / Supabase | **HIGH**: Public repo exposure or potential SQL/admin shell exfiltration makes DB credentials suspect. | **YES (STAGE 9)** | Supabase DB password reset; Render `DATABASE_URL` & `DIRECT_URL` updated in sync. | `node scripts/prepare-env.cjs && npx prisma db pull` succeeds. |
| **Vault Encryption Key** | Render Env: `ENCRYPTION_KEY` | **HIGH**: Key encrypts upstream AI master keys in table `VendorProvider`. If compromised, master keys readable. | **STAGE 9 (CONCURRENT WITH FRESH KEYS)** | **CRITICAL CAUTION**: Changing key blindly destroys existing encrypted master keys. Must be executed concurrently with entering fresh provider keys. | Re-enter fresh provider keys after key rotation in Admin UI. |
| **Integration API Key** | Render Env: `INTEGRATION_API_KEY` | **MEDIUM**: Localhost origin bypass fixed; static internal integration header now required. | **YES (NEW KEY)** | Generate cryptographically secure random token (min 32 chars). | Request with `X-Integration-Key` succeeds; missing/wrong fails 401. |
| **Upstream AI Master Keys** | Encrypted in `VendorProvider` (`masterApiKeyEncrypted`) | **CRITICAL**: If admin portal or DB was accessed, OpusMax / Anthropic / OpenAI master keys are compromised. | **YES (MANDATORY)** | Admin rotates keys at upstream AI providers first, then enters in portal. | Test gateway route `POST /api/v1/chat/completions` with test key. |
| **GitHub Access Tokens & Deploy Keys** | GitHub repo secrets / Render webhook | **HIGH**: Potential CI/CD or repo compromise during public exposure period. | **YES (MANDATORY)** | GitHub Repository Settings -> Secrets and variables. | Test push & manual trigger succeeds with new token. |
| **Cloudflare API Tokens** | Cloudflare Dashboard | **MEDIUM**: DNS and WAF configuration control tokens. | **RECOMMENDED** | Rotate tokens used for Render or CI automation. | Verify DNS resolution and SSL handshake intact. |

---

## 3. End-to-End Dependency & Execution Workflow

```mermaid
flowchart TD
    subgraph STAGE_1 ["Stage 1: Forensic Preservation"]
        S1A["1.1 Take Supabase Snapshot Backup"] --> S1B["1.2 Export Production Logs & Audit Records"]
    end

    subgraph STAGE_2 ["Stage 2: Access & Perimeter Lockdown"]
        S2A["2.1 Verify / Enforce GitHub Repo Visibility Private"] --> S2B["2.2 Audit Deploy Keys & Collaborators"]
        S2B --> S2C["2.3 Verify Cloudflare WAF & Proxy Rules"]
    end

    subgraph STAGE_3 ["Stage 3: Secret Generation"]
        S3A["3.1 Generate Cryptographic Secrets Locally"] --> S3B["3.2 Stage Secrets in Secure Password Manager"]
    end

    subgraph STAGE_4 ["Stage 4: Upstream AI Provider Preparation"]
        S4A["4.1 Issue Fresh API Keys in Anthropic / OpusMax Dashboards"] --> S4B["4.2 Keep Fresh Keys Staged for Admin Portal Entry"]
    end

    subgraph STAGE_5 ["Stage 5: Remediation Deployment"]
        S5A["5.1 Merge incident/phase1-containment to Main"] --> S5B["5.2 Configure Render Env: JWT_SECRET, SECURITY_EPOCH, INTEGRATION_API_KEY"]
        S5B --> S5C["5.3 Trigger Render Manual Deploy (Hold ENCRYPTION_KEY for Stage 9)"]
        S5C --> S5D["5.4 Verify Healthcheck /api/health (HTTP 200)"]
    end

    subgraph STAGE_6 ["Stage 6: Admin Credential Rotation"]
        S6A["6.1 Execute scripts/provision-admin.ts --rotate in Render Shell"] --> S6B["6.2 Verify Banned Passwords Rejected (HTTP 401)"]
    end

    subgraph STAGE_7 ["Stage 7: Global Session Revocation"]
        S7A["7.1 Execute npm run session:revoke in Render Shell"] --> S7B["7.2 Verify passwordChangedAt Updated & Active Tokens Expired"]
    end

    subgraph STAGE_8 ["Stage 8: Live Auth & Authorization Verification"]
        S8A["8.1 Verify Legacy JWTs Rejected (HTTP 401)"] --> S8B["8.2 Verify Backdoors Eliminated"]
        S8B --> S8C["8.3 Verify Rate Limiting via Synthetic Test Account"]
    end

    subgraph STAGE_9 ["Stage 9: Synchronized DB & Provider Key Rotation"]
        S9A["9.1 Reset Supabase Database Password"] --> S9B["9.2 Update Render DATABASE_URL & DIRECT_URL"]
        S9B --> S9C["9.3 Update ENCRYPTION_KEY on Render"]
        S9C --> S9D["9.4 Re-enter Fresh AI Keys in /admin/providers"]
        S9D --> S9E["9.5 Verify AI Gateway with Synthetic Prompt"]
    end

    subgraph STAGE_10 ["Stage 10: Operational Monitoring & Audit Review"]
        S10A["10.1 Monitor Render & Cloudflare Live Logs"] --> S10B["10.2 Verify Provider Billing & Quotas for 48 Hours"]
    end

    subgraph STAGE_11 ["Stage 11: Production Exit Gate"]
        S11A["11.1 Sign off on PRODUCTION_EXIT_GATE.md"]
    end

    STAGE_1 --> STAGE_2
    STAGE_2 --> STAGE_3
    STAGE_3 --> STAGE_4
    STAGE_4 --> STAGE_5
    STAGE_5 --> STAGE_6
    STAGE_6 --> STAGE_7
    STAGE_7 --> STAGE_8
    STAGE_8 --> STAGE_9
    STAGE_9 --> STAGE_10
    STAGE_10 --> STAGE_11
```

---

## 4. Stage-by-Stage Operational Procedures

### Stage 1: Preserve Evidence and Assess Active Compromise

- **Purpose & Risk Addressed:** Ensures forensic data, existing user balances, order history, and audit logs are not destroyed or overwritten during credential rotation and deployment.
- **Service / Dashboard:** Supabase Console (`app.supabase.com`), Render Dashboard (`dashboard.render.com`).
- **Prerequisites & Dependencies:** Owner access to Supabase and Render.
- **Downtime / Reauthentication Impact:** Zero downtime; zero reauthentication.
- **Potential Data-Loss / Billing Consequences:** None. Protects against permanent loss.
- **Required Action & Approval:** Owner manual action.

#### Execution Steps:
1. **Supabase Database Backup:**
   - Log into Supabase Dashboard -> Select Project `lightningdeals-api`.
   - Navigate to `Database` -> `Backups`.
   - Click `Take backup now` or download the latest automated daily snapshot.
   - Retain backup file in secure offline storage labeled `pre-containment-backup-20261018.sql`.
2. **Export Render Service Logs:**
   - In Render Dashboard -> Select Web Service -> `Logs`.
   - Filter by last 14 days. Click `Export Logs` (or download raw log stream).
   - Archive logs for forensic review of unauthorized administrator logins and potential data exfiltration.
3. **Capture Current Audit Log State:**
   - Run a non-destructive read of table `AdminLog` to preserve existing log records:
     ```bash
     # Local terminal connected via read-only replica or snapshot:
     npx prisma studio --port 5555
     ```
   - **Crucial Rule:** Do **NOT** rewrite, re-hash, or backfill historical audit records. The historical state must remain immutable forensic evidence.

- **Verification:** Confirm `.sql` backup file size is non-zero and log archive exists.
- **Rollback Procedure:** N/A (Read-only forensic operation).

---

### Stage 2: Restrict Repository and Deployment Access

- **Purpose & Risk Addressed:** Prevents attackers from viewing commits, exploiting webhooks, or injecting malicious code into the CI/CD pipeline while containment is underway.
- **Service / Dashboard:** GitHub (`github.com/HopUppper/lightningdeals-api`), Cloudflare (`dash.cloudflare.com`).
- **Prerequisites & Dependencies:** GitHub repository owner or admin privileges.
- **Downtime / Reauthentication Impact:** Zero downtime.
- **Potential Data-Loss / Billing Consequences:** None.
- **Required Action & Approval:** Owner manual action.

#### Execution Steps:
1. **GitHub Visibility & Collaborators:**
   - Go to `https://github.com/HopUppper/lightningdeals-api/settings`.
   - In `Danger Zone` -> Confirm repository visibility is **Private**.
   - Navigate to `Collaborators` -> Review all users. Remove any unrecognized collaborators or stale service accounts.
   - Navigate to `Deploy Keys` -> Remove any deploy keys that cannot be tied to a known, authorized server.
   - Navigate to `Secrets and variables` -> `Actions` -> Audit all repository secrets.
2. **Branch Protection:**
   - Under `Branches` -> Ensure `main` has branch protection rules:
     - Require pull request reviews before merging.
     - Require status checks to pass (`test:security`, `build`).
3. **Cloudflare WAF Verification:**
   - In Cloudflare Dashboard -> `Security` -> `WAF`.
   - Confirm WAF rules block suspicious path traversals, SQL injection payloads, and brute-force scanners targeting `/api/admin/auth/login`.

- **Verification:** Run `curl -I https://github.com/HopUppper/lightningdeals-api` from an unauthenticated session; verify HTTP 404 (confirming private visibility).
- **Rollback Procedure:** N/A.

---

### Stage 3: Prepare New Secrets Securely

- **Purpose & Risk Addressed:** Prepares cryptographically strong replacements for all compromised and fallback secrets before applying them to Render.
- **Service / Dashboard:** Local workstation terminal (offline).
- **Prerequisites & Dependencies:** Node.js installed locally.
- **Downtime / Reauthentication Impact:** None.
- **Potential Data-Loss / Billing Consequences:** None.
- **Required Action & Approval:** Local execution by owner or security engineer.

#### Execution Steps:
Run the following local commands in a secure shell to generate production-grade 256-bit (64 hex characters) secrets:

```bash
# 1. Generate new JWT Secret (Minimum 32 bytes / 64 hex characters):
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Generate new Encryption Key (AES-256 requires exactly 32 bytes / 64 hex characters):
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# 3. Generate new Integration API Key (timing-safe integration token):
node -e "console.log('INTEGRATION_API_KEY=ld_int_' + require('crypto').randomBytes(24).toString('hex'))"

# 4. Generate new Security Epoch (current millisecond epoch or ISO string):
node -e "console.log('SECURITY_EPOCH=' + new Date().toISOString())"
```

> [!CAUTION]
> **RECORD SECRETS SECURELY:** Store these generated values in an encrypted password manager (1Password, Bitwarden, or AWS Secrets Manager). **NEVER** commit them to Git or paste them into public chat channels.

- **Verification:** Verify each secret meets or exceeds length criteria (`JWT_SECRET` >= 64 hex chars, `ENCRYPTION_KEY` = 64 hex chars).
- **Rollback Procedure:** Discard generated keys if not deployed.

---

### Stage 4: Prepare Upstream AI Provider Keys

- **Purpose & Risk Addressed:** Mitigates the risk of gateway outages and ensures replacement keys are ready before rotating vault encryption.
- **Service / Dashboard:** Upstream Provider Consoles (Anthropic: `console.anthropic.com`, OpusMax, OpenAI).
- **Prerequisites & Dependencies:** Owner access to AI provider billing accounts.
- **Downtime / Reauthentication Impact:** None yet.
- **Potential Data-Loss / Billing Consequences:**
  > [!WARNING]
  > **ENCRYPTION KEY COUPLING:** Because `VendorProvider.masterApiKeyEncrypted` is encrypted with `ENCRYPTION_KEY` using AES-256-GCM, updating `ENCRYPTION_KEY` on Render will make existing encrypted master keys undecryptable. Therefore, `ENCRYPTION_KEY` must **NOT** be changed in Stage 5. It will be changed in Stage 9 concurrently with entering the fresh provider keys.
- **Required Action & Approval:** Owner manual preparation.

#### Execution Steps:
1. Log into upstream AI provider dashboards:
   - Anthropic Console: `console.anthropic.com`
   - OpusMax / Third-Party Vendor Consoles
2. Generate fresh replacement API keys for each provider. Do not delete old keys immediately until Stage 9 is complete.
3. Keep the new provider keys ready to paste into the Admin UI (`/admin/providers`).

- **Verification:** Confirm new provider keys are active and funded in provider dashboards.
- **Rollback Procedure:** Keep existing keys documented until replacement is confirmed.

---

### Stage 5: Validate and Deploy the Remediation Branch

- **Purpose & Risk Addressed:** Deploys all Phase 1 fixes to production on Render, eliminating hardcoded fallback secrets, backdoor admin creation, password bypasses, and rate-limit spoofing.
- **Service / Dashboard:** GitHub PR -> Render Web Service Dashboard (`dashboard.render.com`).
- **Prerequisites & Dependencies:** All 18 regression tests pass locally; build passes; secrets staged from Stage 3.
- **Downtime / Reauthentication Impact:**
  - Brief rolling restart (< 60 seconds) during Render deployment. Zero customer downtime if rolling deploys are enabled.
  - Setting new `JWT_SECRET` and `SECURITY_EPOCH` will invalidate existing user/admin session tokens. Users will be asked to log in again on their next request.
- **Potential Data-Loss / Billing Consequences:** None. Database schema is backward-compatible (no destructive migrations).
- **Required Action & Approval:** Owner approval to merge PR and trigger deployment.

#### Execution Steps:
1. **GitHub PR & Merge:**
   - Push branch `incident/phase1-containment` to GitHub:
     ```bash
     git push -u origin incident/phase1-containment
     ```
   - Open Pull Request to `main`. Review diff: confirm only security containment changes are present.
   - Merge PR into `main`.
2. **Update Render Environment Variables:**
   - Navigate to Render Dashboard -> Web Service `lightningdeals-api` -> `Environment`.
   - Update / Add the following environment variables:
     - `JWT_SECRET`: `<New 64-hex char secret from Stage 3>`
     - `SECURITY_EPOCH`: `<New ISO timestamp or numeric ms from Stage 3>`
     - `INTEGRATION_API_KEY`: `<New integration token from Stage 3>`
     - `NODE_ENV`: `production`
   - **CRITICAL NOTE:** Leave `ENCRYPTION_KEY` unchanged in this step to ensure existing provider keys continue working.
   - Click `Save Changes`.
3. **Trigger Manual Deploy:**
   - In Render Dashboard, click `Manual Deploy` -> `Deploy latest commit`.
   - Monitor the deploy build log:
     - Verify: `npm run build` succeeds (Prisma client generates, TypeScript compiles, Vite builds).
     - Verify: Server starts with `Starting Lightning Deals API Gateway...`.
     - Verify: No fatal startup error emitted from `jwtConfig.ts`.
4. **Health Check Verification:**
   - Run:
     ```bash
     curl -i https://lightningapi.pro/api/health
     ```
   - Confirm response: `HTTP/1.1 200 OK` with JSON `{ "status": "ok", ... }`.

- **Verification:** Health check returns 200; Render logs show zero unhandled exceptions.
- **Rollback Procedure:**
  - If deployment fails to boot, inspect Render logs for missing environment variables.
  - Never rollback to a commit containing hardcoded secrets. Fix configuration forward.

---

### Stage 6: Rotate Production Administrator Credentials

- **Purpose & Risk Addressed:** Eliminates the compromised seed credentials (`sidhjain9002@gmail.com`, `admin@lightningdeals.com`) and hashes in the production database.
- **Service / Dashboard:** Render Web Shell (`dashboard.render.com` -> Service -> `Shell`).
- **Prerequisites & Dependencies:** Stage 5 deployment is live.
- **Downtime / Reauthentication Impact:** Zero downtime; forces existing admin sessions to terminate.
- **Potential Data-Loss / Billing Consequences:** None.
- **Required Action & Approval:** Owner execution.

#### Execution Steps:
Open the **Render Web Shell** for the web service (where production `DATABASE_URL` is already bound):

```bash
# 1. Rotate the primary administrator password (generates secure 24-char cryptographic password):
npx tsx scripts/provision-admin.ts --email="<owner_primary_email@domain.com>" --rotate

# 2. If the secondary seeded admin exists (admin@lightningdeals.com), rotate or disable:
npx tsx scripts/provision-admin.ts --email="admin@lightningdeals.com" --rotate
```

> [!TIP]
> The script hashes the password with Scrypt (32-byte salt, cost 16384), resets `failedLoginAttempts: 0, lockedUntil: null`, updates `passwordChangedAt: new Date()`, and invalidates all active sessions for that admin in `UserSession`. It prints the generated password **once**. Copy it into the password manager immediately.

- **Verification:**
  1. Test authentication with old compromised password `love9002`:
     ```bash
     curl -X POST https://lightningapi.pro/api/admin/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"sidhjain9002@gmail.com","password":"love9002"}'
     ```
     **Must return:** `HTTP/1.1 401 Unauthorized` (`error.type = "authentication_failed"`).
  2. Test authentication with the new Scrypt-generated password:
     ```bash
     curl -X POST https://lightningapi.pro/api/admin/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"<owner_primary_email@domain.com>","password":"<new_generated_password>"}'
     ```
     **Must return:** `HTTP/1.1 200 OK` with valid JWT token.
- **Rollback Procedure:** Run `scripts/provision-admin.ts --rotate` again to regenerate password if misplaced.

---

### Stage 7: Revoke Compromised Sessions and Tokens

- **Purpose & Risk Addressed:** Guarantees that any token minted by an attacker using old fallback keys or issued before password rotation is permanently rejected by all API endpoints.
- **Service / Dashboard:** Render Web Shell.
- **Prerequisites & Dependencies:** Stage 5 deployed, Stage 6 admin rotated.
- **Downtime / Reauthentication Impact:**
  - Zero application downtime.
  - All active users and admins will be required to re-authenticate on their next request.
- **Potential Data-Loss / Billing Consequences:** None.
- **Required Action & Approval:** Owner approval.

#### Execution Steps:
In the **Render Web Shell**, run:

```bash
npm run session:revoke
```

**Script Actions Performed:**
1. Executes `UPDATE "UserSession" SET "isRevoked" = true WHERE "isRevoked" = false`.
2. Executes `UPDATE "User" SET "passwordChangedAt" = NOW()`.
3. Records audit log event `GLOBAL_SESSION_REVOCATION_EXECUTED` (severity `CRITICAL`).

- **Verification:**
  - Submit request using any previously captured admin or user JWT:
    ```bash
    curl -H "Authorization: Bearer <old_token>" https://lightningapi.pro/api/admin/dashboard/stats
    ```
  - **Must return:** `HTTP/1.1 401 Unauthorized` with `{"error":{"type":"session_invalidated"}}` or `{"error":{"type":"invalid_token"}}`.
- **Rollback Procedure:** N/A (Revocation is intentional and permanent; users simply re-login).

---

### Stage 8: Live Authentication & Authorization Verification

- **Purpose & Risk Addressed:** Independently verifies in the live production environment that all 7 findings and 3 backdoors are closed.
- **Service / Dashboard:** External test client targeting `https://lightningapi.pro`.
- **Prerequisites & Dependencies:** Stages 5, 6, and 7 complete.
- **Downtime / Reauthentication Impact:** Zero.
- **Potential Data-Loss / Billing Consequences:** None (non-destructive tests).
- **Required Action & Approval:** Security lead or owner execution.

#### Execution Steps:
Run the live verification probe suite against production endpoints:

1. **Verify Default Seed Credentials Rejected:**
   - Attempt login with `sidhjain9002@gmail.com` / `love9002` -> Verify **401 Unauthorized**.
   - Attempt login with `admin@lightningdeals.com` / `admin123` -> Verify **401 Unauthorized**.
2. **Verify Offline Token Forgery Rejected:**
   - Craft token signed with `lightningdeals_secret_jwt_key_2026` -> Verify **401 Invalid Token**.
   - Craft token signed with `apexscale-jwt-secret-key-production-2026` -> Verify **401 Invalid Token**.
   - Craft token with non-existent UUID -> Verify **403 Forbidden** (confirms no email fallback).
   - Craft token without `iat` claim (`noTimestamp: true`) -> Verify **401 Malformed Token**.
3. **Verify Privilege Separation:**
   - Log in as a standard customer; use customer token against `/api/admin/dashboard/stats` -> Verify **403 Forbidden**.
4. **Verify Unknown User 500 Defect Fixed:**
   - Send admin login attempt with random unknown email `probe-unknown@example.com` -> Verify **401 Unauthorized** (returns `error.type = "authentication_failed"`, **not** HTTP 500).
5. **Verify Rate Limiting with Spoofed Headers (SYNTHETIC ACCOUNT ONLY):**
   > [!IMPORTANT]
   > Do **NOT** target the real administrator email. Target `probe-rate-test-synthetic@lightningapi.pro`.
   - Send 10 rapid failed login requests with varying `X-Forwarded-For: 1.1.1.X` headers -> Verify response changes to **HTTP 429 Too Many Requests** on the 6th attempt.
6. **Verify Backdoor 1 Eliminated:**
   - Attempt customer login at `/api/user/auth/login` with `sidhjain9002@gmail.com` / `love9002` -> Verify **401 Unauthorized** and verify no admin row created in database.
7. **Verify Backdoor 3 Eliminated:**
   - Request `/api/integrations/status` with header `Origin: http://localhost` without `X-Integration-Key` -> Verify **401 Unauthorized**.

- **Verification:** All 7 verification probes pass with expected status codes.
- **Rollback Procedure:** N/A.

---

### Stage 9: Synchronized Database & AI Provider Key Rotation

- **Purpose & Risk Addressed:** Rotates database connection strings and AI provider master keys while restoring live AI Gateway traffic with zero decryption failures.
- **Service / Dashboard:** Supabase Dashboard -> Render Environment -> Admin UI (`/admin/providers`).
- **Prerequisites & Dependencies:** Stage 8 verified; new AI provider keys prepared in Stage 4.
- **Downtime / Reauthentication Impact:**
  - Brief database reconnect (< 10 seconds) when updating `DATABASE_URL`.
- **Potential Data-Loss / Billing Consequences:** None when executed in synchronization.
- **Required Action & Approval:** Owner manual execution.

#### Execution Steps:
1. **Rotate Supabase Database Password:**
   - Go to Supabase Dashboard -> `Project Settings` -> `Database`.
   - Under `Database password`, click `Reset database password`.
   - Generate a strong random password.
2. **Update Render Database Environment Variables:**
   - In Render Dashboard -> Environment:
     - Update `DATABASE_URL` with new password:
       `postgresql://postgres:[NEW_PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true`
     - **CRITICAL:** Update `DIRECT_URL` as well, OR delete `DIRECT_URL` from the Render environment so `prepare-env.cjs` derives it dynamically:
       `postgresql://postgres:[NEW_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
     - Update `ENCRYPTION_KEY` with the new 64-hex char secret from Stage 3.
   - Save changes on Render. Render automatically redeploys.
3. **Re-enter AI Provider Master Keys:**
   - Immediately log into Admin UI: `https://lightningapi.pro/admin/login` using the new Scrypt admin credentials.
   - Navigate to `/admin/providers`.
   - Update each provider (Anthropic, OpusMax, etc.) with the fresh replacement API keys generated in Stage 4.
   - Click `Save Provider`. This re-encrypts the keys under the new `ENCRYPTION_KEY` using AES-256-GCM.
4. **Test Live Gateway Route (SYNTHETIC CUSTOMER):**
   - Send a synthetic completions request using a dedicated internal test customer account with `max_tokens: 5`:
     ```bash
     curl -X POST https://lightningapi.pro/api/v1/chat/completions \
       -H "Authorization: Bearer <test_synthetic_customer_api_key>" \
       -H "Content-Type: application/json" \
       -d '{
         "model": "claude-3-5-sonnet-20241022",
         "messages": [{"role": "user", "content": "ping"}],
         "max_tokens": 5
       }'
     ```
   - **Must return:** `HTTP/1.1 200 OK` with valid AI completion response and token usage recorded.

- **Verification:** Gateway completes request; tokens decremented correctly; provider console shows request billed.
- **Rollback Procedure:** If gateway fails, verify provider API key in provider console and re-save in `/admin/providers`.

---

### Stage 10: Operational Monitoring and Incident Evidence Review

- **Purpose & Risk Addressed:** Ensures no anomalous traffic, unauthenticated access spikes, or abnormal billing spikes occur after containment.
- **Service / Dashboard:** Render Logs, Cloudflare Analytics, Anthropic/OpusMax Usage Dashboards.
- **Prerequisites & Dependencies:** Stages 1–9 complete.
- **Downtime / Reauthentication Impact:** Zero.
- **Potential Data-Loss / Billing Consequences:** Protects against unauthorized balance drain.
- **Required Action & Approval:** Owner observation over 24–48 hour stabilization period.

#### Execution Steps:
1. **Render Real-Time Logs:**
   - Check for repeated 401/403 or 429 errors (identifies whether attacker bots are still attempting old keys or brute force).
2. **Cloudflare WAF Analytics:**
   - Monitor rate limiting drops and blocked requests.
3. **Provider Billing Dashboard:**
   - Check Anthropic and OpusMax cost/spend graphs for the last 2 hours.
   - Confirm token burn rates match legitimate customer API orders.
4. **Audit Log Inspection:**
   - Navigate to `/admin/logs` in the admin dashboard.
   - Confirm new admin events (logins, provider updates) are recorded with deterministic hash chain verification.

- **Verification:** System operating stably with 0 unauthorized administrative actions.
- **Rollback Procedure:** N/A.

---

### Stage 11: Complete the Production Exit Gate

- **Purpose & Risk Addressed:** Formal closeout of Phase 1 containment with signed-off documentation before Phase 2 architecture work begins.
- **Deliverable:** `docs/security/PRODUCTION_EXIT_GATE.md`.
- **Required Decision:** Sign-off by application owner and lead security auditor.

---

## 5. Rollback & Emergency Contingency Procedures

| Failure Scenario | Immediate Operational Response | Rollback Action |
|---|---|---|
| **Render Deploy Fails to Boot** | Check Render build and deploy logs for missing environment variable validation failure. | In Render Dashboard, fix environment variable forward. Note: Never restore hardcoded fallback keys in code. |
| **Database Connection Refused** | Verify Supabase pooler status; ensure `DIRECT_URL` and `DATABASE_URL` both match the new password. | Re-enter known working Supabase database password in Render environment. |
| **AI Gateway Upstream Errors (502 / 500)** | Check if `VendorProvider.masterApiKeyEncrypted` decryption failed due to changed `ENCRYPTION_KEY`. | Log into Admin UI (`/admin/providers`) and re-paste the plain-text provider master keys to trigger re-encryption. |
| **Admin Locked Out** | If admin password is forgotten or locked out, connect to Render Web Shell. | Run `npx tsx scripts/provision-admin.ts --email="<owner_email>" --rotate` to clear lockout and regenerate password. |

---

## 6. Execution Sign-Off & Approvals

Before executing live production actions in Stages 5 through 9, obtain explicit owner confirmation:

- [ ] **Stage 1 (Forensic Backup):** Owner Confirmed
- [ ] **Stage 2 (GitHub & Cloudflare Lockdown):** Owner Confirmed
- [ ] **Stage 3 (Secret Generation):** Secrets Staged in Vault
- [ ] **Stage 4 (Provider Key Preparation):** Fresh Provider Keys Ready
- [ ] **Stage 5 (Render Deploy & Env Vars):** Deployment Approved (ENCRYPTION_KEY held)
- [ ] **Stage 6 (Admin Password Rotation):** CLI Rotation Approved
- [ ] **Stage 7 (Global Session Revocation):** Session Purge Approved
- [ ] **Stage 8 (Live Verification Probes):** Probes Executed & Passed
- [ ] **Stage 9 (DB & Provider Rotation):** DB & Gateway Live Verified
- [ ] **Stage 10 (Monitoring & Audit):** 48-Hour Stabilization Started
- [ ] **Stage 11 (Exit Gate Review):** `PRODUCTION_EXIT_GATE.md` Approved
