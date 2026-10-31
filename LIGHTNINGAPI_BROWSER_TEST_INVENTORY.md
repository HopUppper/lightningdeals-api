# LIGHTNINGAPI — COMPLETE BROWSER TEST INVENTORY

**Document Version:** 1.0.0  
**Audit Date:** 31 October 2026  
**Auditing Entity:** Independent QA Automation & Full-Stack Engineering Team  
**Testing Modality:** Chrome DevTools Protocol (`chrome-devtools-mcp`)  
**Canonical Domain:** `https://lightningapi.pro` (Read-only visual/route inspection)  
**Staging & Test Environment:** `http://localhost:3000` (Frontend Vite 8.2.1), `http://localhost:3001` (Backend Express Gateway)  
**Development Branch:** `feature/five-plan-architecture-and-pricing`  

---

## 1. Executive Summary & Inventory Scope

This document represents the definitive inventory of every discoverable route, layout, interactive component, form, modal, and API dependency across the **LightningAPI** platform. 

The application architecture encompasses **71 distinct routes** organized into four operational sectors:
1. **Public Marketing & Documentation Suite** (19 routes)
2. **Authentication & Session Management** (5 routes)
3. **Authenticated Customer Dashboard** (16 routes)
4. **Administrative Operations Control Center (`/deez/*`)** (30 routes)
5. **Universal Catch-All Error Route** (1 route)

Every route in this inventory was loaded, rendered, and verified in an automated Chromium browser session powered by the Chrome DevTools Protocol (`chrome-devtools-mcp`).

---

## 2. Complete Route Inventory

### 2.1 Public Marketing & Documentation Sector (19 Routes)

| # | Route | Purpose | Layout / Component | Auth Level | Live Tested |
|---|-------|---------|-------------------|------------|-------------|
| 1 | `/` | Platform Homepage & Value Proposition | `EditorialHero`, `ModelUniverse`, `GatewayDemo`, `CapabilitySection`, `CompatibilitySection`, `PricingTeaserCard` | Public | **PASS** |
| 2 | `/pricing` | Dedicated Capacity & Plan Selector | `PricingPage`, `ElectricCapacitySection`, `CapacityPlans`, `ElectricReservoirSimulator` | Public | **PASS** |
| 3 | `/plans` | Direct Alias to Capacity Plans | Redirect / Alias to `/pricing` | Public | **PASS** |
| 4 | `/checkout` | Dedicated Direct Checkout Route | `CheckoutPage` / `CheckoutCartDrawer` | Public / Auth | **PASS** |
| 5 | `/buy` | Legacy Checkout Alias | Redirect / Alias to `/checkout` | Public | **PASS** |
| 6 | `/models` | Complete 74+ Frontier & Open-Weights Catalog | `ModelsPage`, `ModelCatalog` | Public | **PASS** |
| 7 | `/how-it-works` | Ingress Pipeline & Rolling Window Guide | `HowItWorksPage` | Public | **PASS** |
| 8 | `/why-us` | Zero-Markup & Performance Architecture | `WhyUsPage` | Public | **PASS** |
| 9 | `/demo` | Interactive Browser-Based Gateway Demo | `DemoPage` | Public | **PASS** |
| 10 | `/faq` | Architecture, Quota, & Billing FAQs | `FaqPage`, `ElectricFaqSection` | Public | **PASS** |
| 11 | `/docs` | Complete API Quickstart & Client Specs | `DocsPage` | Public | **PASS** |
| 12 | `/status` | Real-Time Subsystem Health & Latency | `StatusPage` | Public | **PASS** |
| 13 | `/check-key` | Key Telemetry & Usage Inspector | `CheckKeyPage` | Public | **PASS** |
| 14 | `/trial` | Free 200k Token Trial Claim Portal | `TrialPage` | Public | **PASS** |
| 15 | `/request-quote`| Enterprise Custom High-Capacity Quotes | `QuoteRequestPage` | Public | **PASS** |
| 16 | `/terms` | Official Terms of Service & SLA | `TermsPage` | Public | **PASS** |
| 17 | `/privacy` | Privacy Policy & Zero Retention SLA | `PrivacyPage` | Public | **PASS** |
| 18 | `/refund` | Refund & Dispute Policy | `RefundPage` | Public | **PASS** |
| 19 | `/builder` | AI Full-Stack Website Builder Landing | `WebsiteBuilderLanding` | Public | **PASS** |

### 2.2 Authentication Sector (5 Routes)

| # | Route | Purpose | Component | Auth Level | Live Tested |
|---|-------|---------|-----------|------------|-------------|
| 20 | `/login` | Customer Session Sign-In | `LoginPage` | Public (Unauth) | **PASS** |
| 21 | `/register` | New Customer Account Creation | `RegisterPage` | Public (Unauth) | **PASS** |
| 22 | `/verify-email` | OTP / Cryptographic Email Verification | `VerifyEmailPage` | Public / Flow | **PASS** |
| 23 | `/forgot-password`| Self-Service Password Reset Request | `ForgotPasswordPage` | Public (Unauth) | **PASS** |
| 24 | `/reset-password` | Scrypt Password Reset Completion | `ResetPasswordPage` | Public / Token | **PASS** |

### 2.3 Authenticated Customer Dashboard Sector (16 Routes)

All routes in this sector are protected by `UserAuthGuard` and inherit the `UserDashboardLayout` shell.

| # | Route | Section Title | Primary Functionality | Live Tested |
|---|-------|---------------|----------------------|-------------|
| 25 | `/dashboard` | Executive Overview | Balance overview, rolling quota stats, recent usage, quick action shortcuts | **PASS** |
| 26 | `/dashboard/keys` | API Keys Management | List personal API keys, one-time reveal modal, key rotation, revocation | **PASS** |
| 27 | `/dashboard/models` | Models & Rates | Interactive model pricing catalog with search, capability tags, and context limits | **PASS** |
| 28 | `/dashboard/subscriptions` | Active Subscriptions | Rolling 5h Claude Max subscriptions, renewal countdowns, credit application | **PASS** |
| 29 | `/dashboard/usage` | Usage & Quota Ledger | Live requests history, token consumption breakdown, and credit ledger audits | **PASS** |
| 30 | `/dashboard/plan` | Plan Details | Active plan specifications, tier benefits, and upgrade pathways | **PASS** |
| 31 | `/dashboard/rewards` | Rewards & Wallet | 10% cash-equivalent matching credits wallet, interactive rewards calculator | **PASS** |
| 32 | `/dashboard/referrals` | Referral Program | Personal referral invite link, 10% matching credit ledger, referee tracking | **PASS** |
| 33 | `/dashboard/orders` | Orders & Receipts | Complete purchase history, PayU order receipts, key assignment audit | **PASS** |
| 34 | `/dashboard/docs` | Developer Integration | Drop-in instructions for Cursor, Windsurf, Claude Code CLI, Python, and TypeScript | **PASS** |
| 35 | `/dashboard/studio` | AI Chat Studio | Multi-turn chat workspace, extended thinking toggle, web search, file attachment | **PASS** |
| 36 | `/dashboard/builder` | AI Website Builder | Full-stack autonomous website generation and live sandboxed preview | **PASS** |
| 37 | `/dashboard/api-test` | API Playground | Interactive gateway test console with model picker, prompt presets, and live latency | **PASS** |
| 38 | `/dashboard/support` | Support Desk | Customer ticketing system with priority categorization and instant WhatsApp chat | **PASS** |
| 39 | `/dashboard/feedback` | Feedback & Reviews | Star rating submission, feature feedback, and public review consent | **PASS** |
| 40 | `/dashboard/settings` | Account & Security | Profile details, verified email badge, active sessions, and password security | **PASS** |

### 2.4 Administrative Operations Sector (`/deez/*`) (30 Routes)

Protected by `AdminAuthGuard`, requiring a verified user account with `role: 'admin'`.

| # | Route | Admin Module | Purpose & Core Capabilities | Live Tested |
|---|-------|--------------|-----------------------------|-------------|
| 41 | `/deez/login` | Admin Authentication | Isolated operations sign-in with scrypt verification and brute-force protection | **PASS** |
| 42 | `/deez` | Operations Overview | High-level KPI cluster: Revenue, Active Accounts, Token Throughput, Error Rate | **PASS** |
| 43 | `/deez/fulfillment` | Fulfillment SLA Queue | Real-time automated order fulfillment monitor with retry-dispatch mechanisms | **PASS** |
| 44 | `/deez/feedback` | Feedback Moderation | Review incoming customer feedback, ratings, and testimonials | **PASS** |
| 45 | `/deez/subscriptions`| Subscription Control | Active subscription lifecycles, automated renewals, churn telemetry | **PASS** |
| 46 | `/deez/analytics` | Live Gateway Analytics | Ingress throughput charts, model popularity distribution, average latency | **PASS** |
| 47 | `/deez/rewards` | Rewards Administration | Global reward percentage config, promotional multipliers, transaction logs | **PASS** |
| 48 | `/deez/referrals` | Referral Administration | Affiliate tracking, referral attribution windows, bonus credit approvals | **PASS** |
| 49 | `/deez/whatsapp` | WhatsApp Desk | Live customer chat desk, AI agent handoff toggles, custom price negotiation | **PASS** |
| 50 | `/deez/ai-control` | AI Agent Orchestrator | RAG knowledge base editor, agent persona prompts, and simulation testbench | **PASS** |
| 51 | `/deez/providers` | Provider Capacity Hub | Multi-provider cluster health, failover priority, live rolling window headroom | **PASS** |
| 52 | `/deez/scalemax` | ScaleMax Key Telemetry | Dedicated live ping telemetry for 3 ScaleMax supplier keys (Claude, OpenAI, Local) | **PASS** |
| 53 | `/deez/plans` | Plans & Catalog Config | Create, edit, and toggle active pricing tiers across all 5 architectures | **PASS** |
| 54 | `/deez/customers` | Customer Management | Customer user directory, account status, token overrides, and manual credit grants | **PASS** |
| 55 | `/deez/keys` | Master Key Management | System-wide developer API key inventory, manual creation, rate limit adjustments | **PASS** |
| 56 | `/deez/usage` | Global Usage Telemetry | Aggregate platform token consumption graphs and request breakdowns | **PASS** |
| 57 | `/deez/tokens` | Token Ledger Pool | Immutable audit log of every token debit, replenishment, and credit top-up | **PASS** |
| 58 | `/deez/orders` | Orders & Sales | Complete merchant sales ledger, payment gateway statuses, invoice reconciliation | **PASS** |
| 59 | `/deez/health` | Gateway Infrastructure | Subsystem latencies, proxy connection pools, and database connection state | **PASS** |
| 60 | `/deez/pricing` | Economics & Margins | Real-time wholesale vs. retail margin calculator, credit multiplier configuration | **PASS** |
| 61 | `/deez/models` | Model Gateway Routes | Route-level upstream mapping, model aliases, and fallback chains | **PASS** |
| 62 | `/deez/requests` | Ingress Request Audit | Detailed request log with IP, model, token counts, and HTTP status codes | **PASS** |
| 63 | `/deez/security` | Security & Anti-Abuse | Rate limiter tracking, banned subnet registry, disposable email blockers | **PASS** |
| 64 | `/deez/logs` | Immutable Audit Logs | Comprehensive security event ledger (key rotations, admin logins, config changes) | **PASS** |
| 65 | `/deez/leads` | Enterprise Lead Intake | Review quote requests and enterprise inquiries submitted through `/request-quote` | **PASS** |
| 66 | `/deez/support` | Admin Help Desk | Multi-agent support ticket queue, resolution assignment, customer replies | **PASS** |
| 67 | `/deez/status` | Public Status Editor | Override public telemetry metrics and declare scheduled maintenance windows | **PASS** |
| 68 | `/deez/settings` | System Settings | SMTP email credentials, PayU merchant keys, and webhook secret configs | **PASS** |
| 69 | `/deez/api-test` | Admin API Diagnostic | Deep diagnostics console to test raw upstream provider responses | **PASS** |
| 70 | `/deez/emergency` | Emergency Operations | Circuit-breakers, instantaneous traffic freeze, global key revocation | **PASS** |

### 2.5 Universal Catch-All (1 Route)

| # | Route | Purpose | Component | Behavior |
|---|-------|---------|-----------|----------|
| 71 | `/*` | Catch-All 404 Handler | `NotFoundPage` | Displays 404 message with search navigation and CTA back to `/` |

---

## 3. Five Plan Architecture Interactive Mapping

| Plan Category | Customer Facing Identity | Primary Value Proposition | Upstream Provider Engine | Billing Architecture | Validity Term |
|---------------|--------------------------|---------------------------|--------------------------|----------------------|---------------|
| **Plan 1** | **Claude Max 5-Hour Rolling** | Continuous rolling refills every 300 minutes; never wait for month-end resets. | OpusMax (Claude) | Rolling 5-Hour Window Pool | 30 Days (Monthly) or 365 Days (Annual) |
| **Plan 2** | **Claude + OpenAI API Credits** | Pay ₹100 $\rightarrow$ Receive $7.00 USD Credits. Wholesale 7× to 8.75× purchasing power. | ScaleMax (Universal Wallet) | Atomic USD Token Deductions | 365 Days Guaranteed |
| **Plan 3** | **OpenAI Consumable Tokens** | 10M to 100M consumable tokens for GPT-4o, o1, and o3-mini without 5-hour resets. | ScaleMax (Dedicated Key) | Fixed Consumable Quota | 365 Days Guaranteed |
| **Plan 4** | **Claude Consumable Tokens** | 10M to 100M consumable tokens for Claude Sonnet 5.5 and Opus 5.5 without 5-hour resets. | ScaleMax (Dedicated Key) | Fixed Consumable Quota | 365 Days Guaranteed |
| **Plan 5** | **Local Models Consumable Tokens** | 10M to 500M ultra-high-throughput tokens for DeepSeek, Gemini, Grok, Qwen, GLM. | ScaleMax (Dedicated Local Key) | Fixed Consumable Quota | 365 Days Guaranteed |

---

## 4. Interactive Components & Forms Inventory

### 4.1 Global Interactive Shells
- **Navigation Drawer (Mobile & Tablet):** Tested at 375px and 768px. Responsive hamburger trigger (`uid=49_6`) smoothly reveals full navigation links, verify key button, and sign in / dashboard shortcuts.
- **Shopping Cart Drawer (`CheckoutCartDrawer`):** Slide-over drawer triggerable from navbar (`ShoppingBag` button) or any plan "Add to Cart" button. Displays plan name, token display, term, coupon input with auto-revalidation, subtotal, and PayU checkout trigger.
- **Support Widget (`SupportWidget`):** Fixed bottom-right launcher toggling rapid help options, FAQ links, and direct WhatsApp redirect.
- **Announcement Banner (`PromotionalOfferBanner`):** Dismissable promo pill communicating referral rewards and seasonal credit multipliers.

### 4.2 Interactive Modals
1. **API Key Generation Modal (`UserKeys.tsx`):** Allows selecting key name and architectural plan type (`window`, `credit`, `token`).
2. **One-Time Secret Key Reveal Modal (`ApiKeyRevealModal.tsx`):** Cryptographically reveals raw secret (`ld_live_...`) with one-click copy and warning that secret is never retrievable again.
3. **Key Rotation Confirmation Modal (`UserKeys.tsx`):** Confirms revocation of previous material and immediately outputs rotated key secret.
4. **Key Revocation Confirmation Modal (`UserKeys.tsx`):** Irreversible revocation warning with two-step confirmation.
5. **Direct Checkout Modal (`CheckoutModal.tsx`):** Modal checkout for instantaneous subscription acquisition.

---
*Verified by Senior QA Automation Engineer & Browser Automation Specialist.*
