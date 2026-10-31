# LIGHTNINGAPI — CONTENT, PRICING & SUPPLIER ISOLATION AUDIT

**Document Version:** 1.0.0  
**Audit Date:** 31 October 2026  
**Auditor:** Full-Stack & API Integration Specialist  
**Development Branch:** `feature/five-plan-architecture-and-pricing`  
**Compliance Standards:** 
- *Zero Public Pricing Leakage*
- *Strict Supplier Proxy Isolation (Zero ScaleMax/OpusMax leaks)*
- *Exact Five-Plan Architectural Distinction*
- *Accurate Currency Multipliers (INR Payment $\rightarrow$ USD API Credits)*

---

## 1. Architectural Distinction of the Five Plan Categories

A critical requirement of this platform is maintaining clear, uncompromised separation between the **five distinct customer-facing plan categories**. Each category serves a specific workload profile and possesses independent quota accounting rules.

```
                              LIGHTNINGAPI INGRESS GATEWAY
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
   [CATEGORY 1]                       [CATEGORY 2]                        [CATEGORIES 3-5]
 Claude Max 5-Hour                Claude + OpenAI API               Consumable Token Packs
  Rolling Window                      Usage Credits                     (Fixed Lifetime)
        │                                   │                                   │
        ▼                                   ▼                                   ▼
OpusMax Master Pool               ScaleMax Universal Key             ScaleMax Dedicated Keys
Continuous 300m Refill           7x–8.75x Power Multiplier           No 5-Hour Reset Windows
Drop-in Anthropic Ingress       Atomic USD-per-Token Ledger         Claude / OpenAI / Local
```

---

### Plan Category 1 — Claude Max: Five-Hour Rolling Window
- **Customer Identity:** Continuous 5-Hour Rolling Pool.
- **Upstream Supplier Engine:** OpusMax Claude Cluster.
- **Billing Mechanics:** 
  - Token quota automatically regenerates every 300 minutes (5 hours) on a continuous sliding-window basis as past requests age out.
  - Zero end-of-calendar-month reset locks.
- **Catalog Tiers & Pricing:**
  - **Max 5x:** 5M Tokens per 5-hour window — `₹2,999/month` (or `₹2,499/mo` annually)
  - **Max 20x:** 20M Tokens per 5-hour window — `₹5,999/month` (or `₹4,999/mo` annually)
  - **Max 40x:** 40M Tokens per 5-hour window — `₹8,999/month` (or `₹7,499/mo` annually)
  - **Runway Pro:** 5M Tokens per 5-hour window — `₹16,000/month`
  - **Max 100x:** 100M Tokens per 5-hour window — `₹24,999/month` (or `₹19,999/mo` annually)
- **Model Eligibility:** Exclusively latest Claude models (`claude-sonnet-5.5`, `claude-opus-5.5`, `claude-haiku-5.5`, `claude-fable-5`).
- **Telemetry Display:** Key Checker and dashboard display live 5-hour countdown timers, active rolling allowance, and dynamic rolloff schedules.

---

### Plan Category 2 — Claude + OpenAI: API Credit Plans
- **Customer Identity:** Pay-As-You-Go API Usage Credits with 7× to 8.75× Purchasing Power.
- **Upstream Supplier Engine:** ScaleMax Universal Compute Wallet.
- **Billing Mechanics:**
  - Customer pays in Indian Rupees (₹ INR).
  - Backend grants an authoritative USD ($) credit wallet balance calculated via the plan's multiplier.
  - Credits are atomically deducted per request based on exact input/output tokens.
  - Non-expiring 365-day validity term; **zero 5-hour resets**.
- **Catalog Tiers & Multipliers:**
  - **Credit Starter:** Pay `₹100` $\rightarrow$ Receive `$7.00 USD` API Credits (**7.0× multiplier**)
  - **Credit Growth:** Pay `₹499` $\rightarrow$ Receive `$38.50 USD` API Credits (**7.7× multiplier**)
  - **Credit Pro:** Pay `₹1,999` $\rightarrow$ Receive `$160.00 USD` API Credits (**8.0× multiplier**)
  - **Credit Scale:** Pay `₹3,999` $\rightarrow$ Receive `$350.00 USD` API Credits (**8.75× multiplier**)
- **Model Eligibility:** Universal access across Claude Sonnet/Opus, OpenAI o1/GPT-4o, and all Local models.
- **Telemetry Display:** Key Checker and dashboard render dedicated USD wallet balance (`$7.00 remaining out of $7.00 granted`), omitting rolling-window reset timers entirely.

---

### Plan Category 3 — OpenAI: Consumable Token Plans
- **Customer Identity:** Prepaid OpenAI Token Packs (Consumable Quota).
- **Upstream Supplier Engine:** ScaleMax Dedicated OpenAI Supplier Route.
- **Billing Mechanics:**
  - Fixed token allowance with non-expiring 365-day validity.
  - Zero 5-hour reset windows; spend as fast or slow as needed.
- **Catalog Tiers & Pricing:**
  - **OpenAI 10M Token Pack:** 10,000,000 tokens — `₹999` (deposit) / `₹1,499` (original)
  - **OpenAI 50M Token Pack:** 50,000,000 tokens — `₹3,499` (deposit) / `₹4,999` (original)
  - **OpenAI 100M Token Pack:** 100,000,000 tokens — `₹5,999` (deposit) / `₹8,999` (original)
- **Model Eligibility:** OpenAI Chat Completions API models (`gpt-4o`, `o1`, `o3-mini`, `gpt-4o-mini`).

---

### Plan Category 4 — Claude: Consumable Token Plans
- **Customer Identity:** Prepaid Claude Token Packs (Consumable Quota).
- **Upstream Supplier Engine:** ScaleMax Dedicated Claude Supplier Route.
- **Billing Mechanics:**
  - Dedicated consumable quota for Claude developers who require non-resetting fixed packs for heavy autonomous agent loops.
  - Distinct customer identity and ledger independent of OpenAI packs.
- **Catalog Tiers & Pricing:**
  - **Claude 10M Token Pack:** 10,000,000 tokens — `₹1,199` (deposit) / `₹1,799` (original)
  - **Claude 50M Token Pack:** 50,000,000 tokens — `₹3,999` (deposit) / `₹5,999` (original)
  - **Claude 100M Token Pack:** 100,000,000 tokens — `₹6,999` (deposit) / `₹9,999` (original)
- **Model Eligibility:** Claude Native Messages API models (`claude-sonnet-5.5`, `claude-opus-5.5`, `claude-haiku-5.5`).

---

### Plan Category 5 — Local Models: Consumable Token Plans
- **Customer Identity:** Local & Open-Weights Models Token Packs.
- **Upstream Supplier Engine:** ScaleMax Dedicated Open-Weights Route.
- **Billing Mechanics:**
  - Ultra-high-throughput open models at wholesale economic rates.
  - Guaranteed consumable token pool with 365-day validity.
- **Catalog Tiers & Pricing:**
  - **Local Models 10M Token Pack:** 10,000,000 tokens — `₹799` (deposit) / `₹1,199` (original)
  - **Local Models 100M Token Pack:** 100,000,000 tokens — `₹3,499` (deposit) / `₹5,499` (original)
  - **Local Models 500M Token Pack:** 500,000,000 tokens — `₹14,999` (deposit) / `₹22,999` (original)
- **Model Eligibility:** DeepSeek V3/V4, Google Gemini Flash, xAI Grok, Alibaba Qwen, Zhipu GLM, and MiniMax.

---

## 2. Supplier Proxy Isolation Audit (Zero Vendor Name Leaks)

A strict audit was conducted to verify that upstream supplier identities (`ScaleMax`, `OpusMax`, internal provider endpoints) are completely shielded from customer-facing interfaces, CLI tools, error diagnostics, and streaming completions.

### 2.1 Audit Results Summary
- **Client-Facing Code (`src/pages/*`, `src/components/*`):** **0 occurrences** of ScaleMax or OpusMax.
- **CLI Packages (`packages/*`):** **0 occurrences** of ScaleMax or OpusMax.
- **Public API Responses & Diagnostics:** Sanitized by `server/providers/responseSanitizer.ts`.
- **Admin Dashboard (`/deez/*`):** ScaleMax and OpusMax are visible exclusively to authorized administrators with `role: 'admin'`.

### 2.2 Response Sanitizer Verification (`server/providers/responseSanitizer.ts`)
The gateway includes an active in-stream and buffered response scrubber that automatically intercepts:
1. Upstream canned self-identification prompts:
   - *"You are chatting with an official Anthropic model served by ScaleMax"* $\rightarrow$ *"You are chatting with Claude, an official Anthropic model powered by LightningAPI."*
2. Hostnames and domains:
   - `api.scalemax.pro`, `dashboard.scalemax.pro` $\rightarrow$ `api.lightningapi.pro`
   - `api.opusmax.pro`, `dashboard.opusmax.pro` $\rightarrow$ `api.lightningapi.pro`
3. Raw master credentials:
   - `sm_live_...`, `sk-ant-opm-...` $\rightarrow$ `••••••••`

---

## 3. Pricing Currency & Multiplier Verification

### User Inquiry Resolution
> **User Inquiry:** *"It was showing Rs. 7 credits whereas customer should receive the appropriate credits of the plan he paid for; I chose the starter plan, which gives $7 credits, not Rs. 7."*

#### Verified Implementation:
1. **Frontend Display:**
   - Clearly formatted as: `Pay ₹100 → Receive $7.00 USD API Credits (7x multiplier)`
   - Never formats credit balances as `₹7.00`.
2. **Backend Database:**
   - ApiKey schema stores `creditBalanceUsd: 7.00` (Float).
   - Rate calculations deduct against USD rates per 1M tokens.
3. **Key Rotation Integrity:**
   - If a customer key has `$2.00 USD` remaining and the customer rotates the key:
   - A new cryptographic secret is generated (`ld_live_...`).
   - The database updates only `keyPrefix`, `keyHash`, `displayKey`, and `keyEncrypted`.
   - `creditBalanceUsd` **remains exactly $2.00 USD**. It does not reset to $7.00 USD.

---
*Verified and Certified by API Integration & Product Quality Specialist.*
