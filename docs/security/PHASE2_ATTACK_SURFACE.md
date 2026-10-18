# LightningDeals Phase 2 Route Attack Surface & Authorization Matrix

**Document Reference:** `docs/security/PHASE2_ATTACK_SURFACE.md`  
**Classification:** STRICTLY CONFIDENTIAL — TLP:AMBER / APPLICATION SECURITY AUDIT  
**Application:** LightningDeals AI API Gateway (`https://lightningapi.pro`)  
**Repository:** `HopUppper/lightningdeals-api`  
**Target Branch:** `security/phase2-hardening`  
**Audit Standard:** OWASP ASVS 4.0 / NIST SP 800-115  
**Last Updated:** Phase 2 Hardening Milestone

---

## 1. Executive Summary & Architecture Topology

LightningDeals operates an enterprise AI Gateway, subscription management platform, billing integration, and multi-tenant customer dashboard. This document provides an exhaustive, evidence-based inventory of all mounted Express HTTP endpoints, their authorization middleware, IDOR defenses, secret-masking rules, and remediation statuses.

### 1.1 Express Router Mounting Topography (`server/index.ts`)

| Mount Prefix | Router Export | Source File | Required Base Middleware |
|---|---|---|---|
| `/` & `/v1` | Root Gateway Handlers | `server/gateway.ts` | API Key Header / Public Status |
| `/tools/*` | Tools Router | `server/tools.ts` | Anonymous / Rate Limited |
| `/api/key-status` | Gateway Key Inspector | `server/gateway.ts` | `keyCheckLimiter` (Bearer Token) |
| `/api/pricing/*`, `/api/plans` | Public Plans Handlers | `server/payments/plans.ts` | Anonymous (Uncached Public Catalog) |
| `/api` | `healthRouter` | `server/health.ts` | Anonymous Health Checks |
| `/api` | `feedbackRouter` | `server/feedback/feedbackRoutes.ts` | Mixed (Anonymous Public / Customer JWT / Admin Role) |
| `/api/whatsapp` | `whatsappWebhookRouter` | `server/whatsapp/whatsappWebhookRoutes.ts` | Meta HMAC Signature / Verify Token |
| `/api/admin/auth` | `adminAuthRouter` | `server/adminAuth.ts` | Anonymous (`authLimiter`) / Active Admin JWT |
| `/api/admin/whatsapp` | `adminWhatsAppRouter` | `server/whatsapp/adminWhatsAppRoutes.ts` | Strict Admin JWT (`authenticateJwt, requireAdmin`) |
| `/api/admin/ai` | `adminAIRouter` | `server/whatsapp/adminAIRoutes.ts` | Strict Admin JWT (`authenticateJwt, requireAdmin`) |
| `/api/admin/fulfillment` | `adminFulfillmentRouter` | `server/adminFulfillmentRoutes.ts` | Strict Admin JWT (`authenticateJwt, requireAdmin`) |
| `/api/admin/referrals` | `adminReferralRouter` | `server/referrals/adminReferralRoutes.ts` | Strict Admin JWT (`authenticateJwt, requireAdmin`) |
| `/api/admin/rewards` | `adminRewardsRouter` | `server/rewards/adminRewardRoutes.ts` | Strict Admin JWT (`authenticateJwt, requireAdmin`) |
| `/api/admin` | `adminRouter` | `server/admin.ts` | Strict Admin JWT (`authenticateJwt, requireAdmin`) |
| `/api/user/notifications` | `notificationsRouter` | `server/notifications.ts` | Customer JWT (`authenticateJwt`) |
| `/api/user/rewards` & `/api/rewards` | `customerRewardsRouter` | `server/rewards/customerRewardRoutes.ts` | Mixed (Customer JWT / Public Promo) |
| `/api/user/subscriptions` & `/api/subscriptions` | `customerSubscriptionRouter` | `server/subscriptions/customerSubscriptionRoutes.ts` | Customer JWT (`authenticateJwt`) |
| `/api/user/referrals` & `/api/referrals` | `customerReferralRouter` | `server/referrals/customerReferralRoutes.ts` | Mixed (Customer JWT / Public Tracking) |
| `/api/integrations` | `integrationRouter` | `server/integrations/integrationRoutes.ts` | `x-integration-key` Constant-Time Comparison |
| `/api/checkout` | `checkoutRouter` | `server/payments/paymentRoutes.ts` | Mixed (Public Plans / Customer JWT / Gateway Webhooks) |
| `/pay/:orderId` | Direct PayU Handler | `server/payments/paymentRoutes.ts` | Public Hosted Redirect (HTML Sanitized) |
| `/api/webhooks/payment`, `/payu`, `/cashfree` | Webhook Handlers | `server/payments/paymentRoutes.ts` | Gateway Signature Verification |
| `/api/user/studio` | `studioRouter` | `server/studio.ts` | Customer JWT (`authenticateJwt`) |
| `/api/user` & `/api` | `userRouter` | `server/user.ts` | Mixed (Customer JWT / Auth Endpoints) |

---

## 2. Exhaustive Route Attack Surface Inventory

### 2.1 AI Gateway & Public Inference Endpoints

| HTTP Method | Path | Source File & Line | Auth Middleware | Role Required | IDOR & Tenant Risk | Secret & PII Risk | Rate Limit | Status |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/v1` | `server/index.ts:147` | None | Anonymous | None (Static banner) | None | Standard IP | VERIFIED SAFE |
| `GET` | `/v1/models` | `server/gateway.ts:640` | None | Anonymous | None (Public catalog) | None | Standard IP | VERIFIED SAFE |
| `POST` | `/v1/messages` | `server/gateway.ts:739` | `validateAndExtractApiKey` | API Key (`ld_live_...`) | Isolated to API Key + Rolling Window Ledger | Master Supplier Key isolation | Per-Key RPM | HARDENED |
| `POST` | `/v1/messages/count_tokens` | `server/gateway.ts:1250` | `validateAndExtractApiKey` | API Key (`ld_live_...`) | None (Token counter) | None | Per-Key RPM | VERIFIED SAFE |
| `GET` | `/api/key-status` | `server/gateway.ts:50` | Bearer Header Extraction | API Key (`ld_live_...`) | Scoped to Bearer key hash | Masked key only (`displayKey`) | `keyCheckLimiter` | VERIFIED SAFE |
| `GET` | `/api/system/status` | `server/gateway.ts:70` | None | Anonymous | None (System operational status) | None | Standard IP | VERIFIED SAFE |
| `POST` | `/tools/web_search` | `server/tools.ts:20` | None | Anonymous | None (Public search) | Upstream SerpAPI key masked | Standard IP | VERIFIED SAFE |
| `POST` | `/tools/understand_image` | `server/tools.ts:80` | None | Anonymous | None (Public vision tool) | Master key isolated | Standard IP | VERIFIED SAFE |

---

### 2.2 Customer Account & Authentication (`userRouter` & `customerSubscriptionRouter`)

| HTTP Method | Path | Source File & Line | Auth Middleware | Role Required | IDOR & Tenant Risk | Secret & PII Risk | Rate Limit | Status |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/user/auth/email-health` | `server/user.ts:32` | None | Anonymous | None (SMTP health) | Provider credentials omitted | Standard IP | VERIFIED SAFE |
| `POST` | `/api/user/auth/register` | `server/user.ts:38` | `authLimiter` | Anonymous | Prevents duplicate active account hijack | Password hashed with scrypt | `authLimiter` | VERIFIED SAFE |
| `POST` | `/api/user/auth/verify-email` | `server/user.ts:256` | None | Anonymous | One-time token verification | Secure token hash | Standard IP | VERIFIED SAFE |
| `POST` | `/api/user/auth/forgot-password` | `server/user.ts:373` | `authLimiter` | Anonymous | Anti-enumeration response timing | Reset token cryptographically random | `authLimiter` | VERIFIED SAFE |
| `POST` | `/api/user/auth/reset-password` | `server/user.ts:456` | None | Anonymous | Invalidates existing sessions upon reset | Password policy enforced | Standard IP | VERIFIED SAFE |
| `POST` | `/api/user/auth/login` | `server/user.ts:812` | `authLimiter` | Anonymous | Backdoors eliminated | Password timing-safe comparison | `authLimiter` | VERIFIED SAFE |
| `POST` | `/api/user/auth/logout` | `server/user.ts:961` | `authenticateJwt` | Customer | Database session row deleted | Token cookie cleared | Standard IP | VERIFIED SAFE |
| `GET` | `/api/user/auth/me` | `server/user.ts:986` | `authenticateJwt` | Customer | Strictly returns `req.user` | Password hash omitted | Standard IP | VERIFIED SAFE |
| `GET` | `/api/user/auth/sessions` | `server/user.ts:991` | `authenticateJwt` | Customer | `where: { userId: req.user.id }` | Session token hash only | Standard IP | VERIFIED SAFE |
| `DELETE` | `/api/user/auth/sessions/:id` | `server/user.ts:1023` | `authenticateJwt` | Customer | `where: { id, userId: req.user.id }` | None | Standard IP | VERIFIED SAFE |
| `POST` | `/api/user/keys` | `server/user.ts:1170` | `authenticateJwt, requireVerifiedEmail` | Customer | Scoped to `req.user.id` | Returns `secretKey` ONCE on creation; `keyEncrypted` omitted | Standard IP | HARDENED |
| `GET` | `/api/user/keys` | `server/user.ts:2015` | `authenticateJwt` | Customer | `where: { userId: req.user.id }` | **MASKED:** Returns only `displayKey`; `secretKey` omitted | Standard IP | HARDENED |
| `DELETE` | `/api/user/keys/:id` | `server/user.ts:2065` | `authenticateJwt` | Customer | `where: { id, userId: req.user.id }` | Soft-deletes / revokes key | Standard IP | VERIFIED SAFE |
| `GET` | `/api/user/subscriptions` | `server/user.ts:1555` | `authenticateJwt` | Customer | `where: { userId: req.user.id }` | **MASKED:** Secret key omitted; only `displayKey` returned | Standard IP | HARDENED |
| `GET` | `/api/user/orders` | `server/user.ts:1638` | `authenticateJwt` | Customer | `where: { userId: req.user.id }` | **MASKED:** Secret key omitted; only `displayKey` returned | Standard IP | HARDENED |
| `POST` | `/api/user/orders/:orderId/retry-fulfill` | `server/user.ts:1687` | `authenticateJwt` | Customer | `where: { userId: req.user.id, orderId }` | None | Standard IP | VERIFIED SAFE |
| `POST` | `/api/user/trial/claim` | `server/user.ts:1721` | `authenticateJwt` | Customer | Anti-abuse checks (subnet, device fingerprint, disposable email) | Key generated once | `trialLimiter` | VERIFIED SAFE |
| `GET` | `/api/user/trial/status` | `server/user.ts:1951` | `authenticateJwt` | Customer | Scoped to `req.user.id` | None | Standard IP | VERIFIED SAFE |
| `GET` | `/api/user/plan` | `server/user.ts:2095` | `authenticateJwt` | Customer | Scoped to `req.user.id` | None | Standard IP | VERIFIED SAFE |
| `GET` | `/api/user/usage` | `server/user.ts:2121` | `authenticateJwt` | Customer | Scoped to `req.user.id` | None | Standard IP | VERIFIED SAFE |
| `GET` | `/api/user/support` | `server/user.ts:2182` | `authenticateJwt` | Customer | `where: { userId: req.user.id }` | None | Standard IP | VERIFIED SAFE |
| `POST` | `/api/user/support` | `server/user.ts:2204` | `authenticateJwt` | Customer | Bound to `req.user.id` | None | Standard IP | VERIFIED SAFE |
| `GET` | `/api/user/support/:id` | `server/user.ts:2260` | `authenticateJwt` | Customer | `where: { id, userId: req.user.id }` | None | Standard IP | VERIFIED SAFE |
| `POST` | `/api/user/support/:id/reply` | `server/user.ts:2285` | `authenticateJwt` | Customer | `where: { id, userId: req.user.id }` | None | Standard IP | VERIFIED SAFE |

---

### 2.3 Customer Studio & Browser Automation (`studioRouter`)

All endpoints below are mounted under `/api/user/studio` and inherit `studioRouter.use(authenticateJwt)`.

| HTTP Method | Path | Source File & Line | IDOR Scoping Rule | PII / Data Isolation | Status |
|---|---|---|---|---|---|
| `GET` | `/models` | `server/studio.ts:330` | Public model catalog | None | VERIFIED SAFE |
| `GET` | `/conversations` | `server/studio.ts:338` | `where: { userId: req.user.id }` | User conversation history only | VERIFIED SAFE |
| `POST` | `/conversations` | `server/studio.ts:393` | Created with `userId: req.user.id` | Private to user | VERIFIED SAFE |
| `GET` | `/conversations/:id` | `server/studio.ts:418` | `where: { id, userId: req.user.id }` | IDOR protected | VERIFIED SAFE |
| `PATCH` | `/conversations/:id` | `server/studio.ts:503` | `where: { id, userId: req.user.id }` | IDOR protected | VERIFIED SAFE |
| `DELETE` | `/conversations/:id` | `server/studio.ts:539` | `where: { id, userId: req.user.id }` | IDOR protected | VERIFIED SAFE |
| `DELETE` | `/conversations/:id/messages/:msgId` | `server/studio.ts:564` | Verified conversation ownership prior to delete | IDOR protected | VERIFIED SAFE |
| `GET` | `/memories` | `server/studio.ts:747` | `where: { userId: req.user.id }` | User memory facts only | VERIFIED SAFE |
| `POST` | `/memories` | `server/studio.ts:762` | Created with `userId: req.user.id` | Private to user | VERIFIED SAFE |
| `PATCH` | `/memories/:id` | `server/studio.ts:787` | `where: { id, userId: req.user.id }` | IDOR protected | VERIFIED SAFE |
| `DELETE` | `/memories/:id` | `server/studio.ts:816` | `where: { id, userId: req.user.id }` | IDOR protected | VERIFIED SAFE |
| `GET` | `/skills` | `server/studio.ts:847` | System skills + `where: { userId: req.user.id }` | Private skills isolated | VERIFIED SAFE |
| `POST` | `/skills` | `server/studio.ts:898` | Created with `userId: req.user.id` | Private to user | VERIFIED SAFE |
| `POST` | `/upload` | `server/studio.ts:1017` | Bounded file size (15MB), safe parsing (PDF/DOCX) | Stored in-memory/temp only | VERIFIED SAFE |
| `POST` | `/research/search` | `server/studio.ts:1116` | Bounded query length, rate limited | None | VERIFIED SAFE |
| `POST` | `/research/url` | `server/studio.ts:1131` | SSRF validated via `validateVendorBaseUrl` | Prevents loopback/internal scraping | VERIFIED SAFE |
| `POST` | `/chat/stream` | `server/studio.ts:1236` | Verified user key balance or studio entitlement | Model response scrubbed | VERIFIED SAFE |

---

### 2.4 Checkout, Payments & Webhooks (`checkoutRouter`)

| HTTP Method | Path | Source File & Line | Auth Middleware | Role Required | Vulnerability & IDOR Defenses | Status |
|---|---|---|---|---|---|---|
| `GET` | `/api/checkout/plans` | `server/payments/paymentRoutes.ts:16` | None | Anonymous | Public active plans catalog (uncached) | VERIFIED SAFE |
| `POST` | `/api/checkout/validate-coupon` | `server/payments/paymentRoutes.ts:48` | None | Anonymous | Rate limited; server validates against DB | VERIFIED SAFE |
| `GET` | `/api/checkout/provider-health` | `server/payments/paymentRoutes.ts:79` | None | Anonymous | Gateway availability indicator | VERIFIED SAFE |
| `POST` | `/api/checkout/create-order` | `server/payments/paymentRoutes.ts:90` | `authenticateJwt` | Customer | Order created strictly bound to `req.user.id` | VERIFIED SAFE |
| `POST` | `/api/checkout/verify` | `server/payments/paymentRoutes.ts:117` | `authenticateJwt` | Customer | Strict verification: `order.userId === req.user.id` | VERIFIED SAFE |
| `ALL` | `/api/checkout/payu/response` | `server/payments/paymentRoutes.ts:191` | None | PayU Redirection | SHA-512 reverse hash verified via `OrderEngine` | VERIFIED SAFE |
| `POST` | `/api/webhooks/payment` | `server/payments/paymentRoutes.ts:218` | None | Payment Provider | Idempotent HMAC/Hash signature verified | VERIFIED SAFE |
| `GET` | `/pay/:orderId` | `server/payments/paymentRoutes.ts:228` | None | Public Redirect | **XSS Neutralized:** `orderId` HTML-escaped | HARDENED |

---

### 2.5 Administrative Control Center (`adminRouter` & Related Admin Routers)

Every route under `/api/admin/*` is protected by `authenticateJwt` and `requireAdmin`.

| HTTP Method | Path | Router File | Primary Responsibility | Critical Data Handled |
|---|---|---|---|---|
| `GET` | `/api/admin/overview` | `server/admin.ts` | High-level business metrics | Aggregated revenue & token metrics |
| `GET` | `/api/admin/providers` | `server/admin.ts` | Upstream AI suppliers | **Masked:** Master keys masked to prefix/suffix |
| `POST` | `/api/admin/providers` | `server/admin.ts` | Create upstream AI supplier | Master key encrypted with AES-256-GCM |
| `PUT` | `/api/admin/providers/:id` | `server/admin.ts` | Update upstream AI supplier | Re-encrypts key if changed |
| `POST` | `/api/admin/providers/test` | `server/admin.ts` | Probe upstream supplier latency | Diagnostic test call |
| `GET` | `/api/admin/keys` | `server/admin.ts` | Master API Key catalog | **Masked:** `displayKey` only, no raw secrets |
| `POST` | `/api/admin/keys` | `server/admin.ts` | Provision customer API key | Key generated securely |
| `POST` | `/api/admin/keys/:id/rotate` | `server/admin.ts` | Rotate customer API key | Old key invalidated, new key generated |
| `DELETE` | `/api/admin/keys/:id` | `server/admin.ts` | Revoke customer API key | Revocation immediately enforced |
| `GET` | `/api/admin/customers` | `server/admin.ts` | Customer directory | Search & pagination, passwords omitted |
| `POST` | `/api/admin/customers/:id/adjust-tokens` | `server/admin.ts` | Adjust token quota | Transactional ledger adjustment |
| `GET` | `/api/admin/audit/events` | `server/admin.ts` | Security audit trail | Immutable audit records |
| `GET` | `/api/admin/audit/verify-integrity` | `server/admin.ts` | Hash-chain integrity check | Verifies SHA-256 blockchain chain |
| `GET` | `/api/admin/fulfillment/queue` | `server/adminFulfillmentRoutes.ts` | Order fulfillment queue | SLA aging & manual fulfillment review |
| `GET` | `/api/admin/referrals` | `server/referrals/adminReferralRoutes.ts` | Referral fraud & payout queue | Referral risk & click attribution |
| `GET` | `/api/admin/rewards` | `server/rewards/adminRewardRoutes.ts` | Credit balance & reward engine | Universal purchase & ledger review |
| `GET` | `/api/admin/whatsapp/conversations` | `server/whatsapp/adminWhatsAppRoutes.ts` | Live WhatsApp sales support | CRM messaging & negotiated deals |
| `GET` | `/api/admin/ai/config` | `server/whatsapp/adminAIRoutes.ts` | WhatsApp AI Bot directives | System prompt & memory directives |

---

## 3. High-Risk Vulnerability Vectors Remediated in Phase 2

### 3.1 Customer API Key Plaintext Leaks (Data Minimization Violation)
- **Vulnerability:** `GET /api/user/keys`, `GET /api/user/subscriptions`, and `GET /api/user/orders` decrypted and returned `secretKey: decrypted` or `apiKeySecret: decrypted` on routine listing queries.
- **Remediation:** Removed decryption and plaintext transmission from all listing endpoints. Only `displayKey` (`ld_live_...1234`) is returned on GET operations. Raw key secrets are returned strictly once during initial generation (`POST /api/user/keys`).

### 3.2 AI Gateway Token Accounting Race Condition
- **Vulnerability:** In `server/gateway.ts`, `recordApiUsage` calculated remaining tokens using an in-memory snapshot (`keyRecord.tokensRemaining - tokensUsedBig`) fetched before the upstream request began. Concurrent requests resulted in lost deductions and overdrafting.
- **Remediation:** Migrated token deduction to an interactive `prisma.$transaction(async (tx) => ...)` with `{ increment: tokensUsedBig }` and atomic recalculation from fresh database state.

### 3.3 Hosted Checkout Redirect Reflected XSS
- **Vulnerability:** In `server/payments/paymentRoutes.ts` (`handlePayUOrderRedirect`), unescaped route parameter `orderIdParam` was interpolated directly into an HTML template when an order was not found.
- **Remediation:** Applied strict HTML entity encoding (`escapeHtml`) across all dynamically rendered template variables.

### 3.4 Cryptographic Audit Log Hash Chain Non-Determinism
- **Vulnerability:** Concurrent asynchronous execution of `setImmediate` allowed audit log events to write out-of-order, causing occasional false-positive tamper alarms during high load.
- **Remediation:** Implemented an in-memory sequential promise queue, strictly monotonic timestamps, and deterministic compound ordering (`[{ timestamp: 'asc' }, { id: 'asc' }]`).
