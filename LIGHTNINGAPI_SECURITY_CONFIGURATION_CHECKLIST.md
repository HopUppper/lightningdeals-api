# LIGHTNINGAPI — PRODUCTION SECURITY CONFIGURATION CHECKLIST
**Platform:** LightningAPI (https://lightningapi.pro)  
**Document Purpose:** Mandatory Pre-Deployment and Production Verification Checklist for Security, Infrastructure, and Reliability.  
**Audience:** DevOps Engineers, System Administrators, Release Managers  
**Version:** 2.0 (Hardened)  

---

## 1. ENVIRONMENT VARIABLES & SECRETS MANAGEMENT

| Item | Control Requirement | Verified | Notes / Enforcement |
| :--- | :--- | :---: | :--- |
| **ENV-01** | `JWT_SECRET` is high-entropy (>= 64 chars) and not a default string | [x] | Enforced on boot by `validateEnvironmentOnStartup()` |
| **ENV-02** | `DATABASE_URL` connects via TLS/SSL (`sslmode=require`) | [x] | Supabase pooler configured with encrypted transport |
| **ENV-03** | `SCALEMAX_TOKEN_API_KEY` & `SCALEMAX_LOCAL_TOKEN_API_KEY` in environment or encrypted DB | [x] | Plaintext keys are never checked into git |
| **ENV-04** | `.env` file is strictly included in `.gitignore` | [x] | Verified in root `.gitignore` |
| **ENV-05** | Production `NODE_ENV` is set to `production` on Render | [x] | Enforces strict CORS origin whitelisting |
| **ENV-06** | Zero hardcoded API keys or test secrets in repository code | [x] | Verified via static grep scan |

---

## 2. DATABASE & ORM SECURITY

| Item | Control Requirement | Verified | Notes / Enforcement |
| :--- | :--- | :---: | :--- |
| **DB-01** | Prisma parameterized queries used exclusively (zero raw SQL string concatenation) | [x] | All user and admin queries use Prisma API |
| **DB-02** | Master API keys encrypted at rest via AES-256-GCM | [x] | Handled by `encryptText()` in `server/db.ts` |
| **DB-03** | Connection pooling configured with bounded timeouts | [x] | Connection timeout: 10s; pool size: 20 |
| **DB-04** | Strict multi-tenant isolation on customer queries (`where: { userId }`) | [x] | Enforced across all routes in `server/user.ts` |
| **DB-05** | Zero residual test artifacts & live customer protection (Rule 4) | [x] | Live customer accounts strictly isolated; tests use dedicated sandbox |

---

## 3. NETWORK, TLS & HTTP SECURITY HEADERS

| Item | Control Requirement | Verified | Notes / Enforcement |
| :--- | :--- | :---: | :--- |
| **NET-01** | Strict-Transport-Security (HSTS) with `preload` and `includeSubDomains` | [x] | `max-age=31536000; includeSubDomains; preload` |
| **NET-02** | `X-Content-Type-Options: nosniff` | [x] | Prevents MIME-sniffing exploits |
| **NET-03** | `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'` | [x] | Prevents UI clickjacking attacks |
| **NET-04** | `Referrer-Policy: strict-origin-when-cross-origin` | [x] | Prevents path/query leakage in referrers |
| **NET-05** | Content Security Policy (CSP) includes `object-src 'none'`, `base-uri 'self'` | [x] | Prevents injection of plugins or `<base>` tags |
| **NET-06** | CSP `form-action` restricted to `self` and approved payment gateways | [x] | Allowed: `'self'`, `https://secure.payu.in`, `https://api.cashfree.com` |
| **NET-07** | `trust proxy: 1` enabled for accurate client IP resolution behind Cloudflare/Render | [x] | Set on Express app; handles `CF-Connecting-IP` |
| **NET-08** | CORS strictly limits origins in production to `lightningapi.pro` domains | [x] | `allowedOrigins` whitelist enforced in `server/index.ts` |

---

## 4. AUTHENTICATION & ACCESS CONTROLS

| Item | Control Requirement | Verified | Notes / Enforcement |
| :--- | :--- | :---: | :--- |
| **AUTH-01** | Passwords hashed using scrypt with unique salt (zero SHA-256 or MD5) | [x] | `hashPasswordScrypt()` in `server/auth.ts` |
| **AUTH-02** | Known compromised/incident passwords banned at registration and login | [x] | `BANNED_COMPROMISED_PASSWORDS` check enforced |
| **AUTH-03** | RFC 6238 TOTP Two-Factor Authentication implemented for Administrators | [x] | `server/totp.ts` & `/api/admin/auth/mfa/*` |
| **AUTH-04** | Single-use cryptographic backup recovery codes provided for 2FA | [x] | 8 codes per admin, stored hashed with SHA-256 |
| **AUTH-05** | Emergency CLI recovery script available (`scripts/admin-mfa-recovery.ts`) | [x] | Tested and verified; preserves super-admin access |
| **AUTH-06** | JWT tokens strictly accepted via `Authorization: Bearer` or secure cookies (CWE-598) | [x] | `req.query?.token` removed from `authenticateJwt` |
| **AUTH-07** | Session invalidation supported via `security_session_epoch` and password change | [x] | Enforced on every authenticated request |
| **AUTH-08** | `/api/models/sync` protected with `authenticateJwt` and `requireAdmin` | [x] | Unauthenticated POST returns HTTP 401 |

---

## 5. UPSTREAM PROVIDER & SSRF DEFENSE

| Item | Control Requirement | Verified | Notes / Enforcement |
| :--- | :--- | :---: | :--- |
| **SSRF-01** | Private, loopback, and cloud metadata IPs blocked (`isIpPrivateOrRestricted`) | [x] | 127.0.0.1, 169.254.169.254, 10.0.0.0/8, [::1] blocked |
| **SSRF-02** | Custom DNS socket agent (`safeHttpAgent`) defeats DNS rebinding (TOCTOU) | [x] | Resolved IPs checked at socket connection time |
| **SSRF-03** | Wholesale supplier keys masked in all administrative endpoints | [x] | Returns only bullet-masked prefixes (`sm_live_••••••••`) |
| **SSRF-04** | Wholesale ciphertext properties stripped from responses (`localTokenApiKeyEncrypted: undefined`) | [x] | Verified on `/api/admin/providers` |
| **SSRF-05** | Direct supplier inference test endpoints sanitize upstream response bodies | [x] | Vendor key objects stripped from diagnostic payloads |

---

## 6. RATE LIMITING & ANTI-ABUSE CONTROLS

| Item | Control Requirement | Verified | Notes / Enforcement |
| :--- | :--- | :---: | :--- |
| **RATE-01** | Admin login rate limiter: max 15 requests per 15 min per IP; max 5 per account | [x] | `adminLoginLimiter` in `server/adminAuth.ts` |
| **RATE-02** | Customer login/registration limiter: max 15 requests per 15 min per IP | [x] | `authLimiter` in `server/rateLimit.ts` |
| **RATE-03** | Public key status check limiter: max 5 requests per minute per IP | [x] | `keyCheckLimiter` on `/api/key-status` |
| **RATE-04** | Free trial key generation limiter: max 3 claims per 24 hours per IP | [x] | `trialLimiter` on `/api/trial/claim` |
| **RATE-05** | API Gateway per-key RPM enforcement | [x] | Enforces configured RPM (60-300 RPM) on `/v1/*` |

---

## 7. AUTOMATED THREAT DETECTION & AUDIT LOGGING

| Item | Control Requirement | Verified | Notes / Enforcement |
| :--- | :--- | :---: | :--- |
| **THREAT-01** | SQL Injection patterns detected and blocked across query strings and bodies | [x] | `securityThreatDetector` returns HTTP 400 |
| **THREAT-02** | Cross-Site Scripting (XSS) patterns detected and blocked | [x] | `securityThreatDetector` returns HTTP 400 |
| **THREAT-03** | Automated exploit scanners (`sqlmap`, `nikto`, `wpscan`, `gobuster`) blocked | [x] | User-agent scanner filter returns HTTP 403 |
| **THREAT-04** | Administrative actions logged to immutable `AdminLog` with IP & actor ID | [x] | Tracks logins, key updates, provider edits |
| **THREAT-05** | Security events logged to `AuditEvent` table for SIEM/SOC export | [x] | Tracks failed logins, rate limit triggers, threat blocks |
| **THREAT-06** | Zero plaintext secrets or keys printed to server stdout or logs | [x] | Strictly enforced across all logging statements |

---

## 8. PRODUCTION VERIFICATION SIGN-OFF

- **Branch:** `feature/five-plan-architecture-and-pricing`
- **Build Status:** Verified (`npm run build` completed with 0 errors, 21 static SSG routes rendered)
- **Defensive Regression Tests:** 21 of 21 Passed (SSRF, TOTP, Backup Codes, Admin Protection)
- **Deployment Readiness:** **APPROVED FOR STAGING & PRODUCTION DEPLOYMENT**
