# LIGHTNINGAPI.PRO — CONTENT INVENTORY & AUDIT REPORT
## Information Architecture, Accuracy Assessment & Action Plan

---

## 1. Audit Overview

This document presents a comprehensive audit of all public marketing pages, developer documentation, policy documents, and customer-facing touchpoints across LightningAPI.pro.

The goal is to eliminate outdated, inaccurate, or fabricated claims, synchronize documentation with the actual backend implementation, and adopt clear, developer-focused messaging informed by industry benchmarks (OpusMax and ScaleMax).

---

## 2. Page-by-Page Content Inventory

| Page / Route | Component | Current State | Accuracy & Findings | Proposed Action |
|---|---|---|---|---|
| `/` (Homepage) | `LivingGatewayHero.tsx` | Needs Refinement | Contained fictional CLI reference `npx lightningdeals`. Factual setup uses `curl -fsSL https://lightningapi.pro/setup.sh \| bash` and PowerShell `setup.ps1`. Models list needed alignment with database. | Update copy to feature verified setup commands, clear Anthropic `/v1/messages` gateway positioning, and DB-backed models. |
| `/` (Editorial) | `ElectricEditorialContrast.tsx` | Accurate | Highlights drop-in Anthropic compatibility, 5-hour rolling window replenishment, and private key isolation. | Preserve visual design; ensure terminology is 100% consistent with docs. |
| `/` (Observatory) | `ElectricModelObservatory.tsx` | Needs Alignment | Model context windows and IDs should match verified database entries (`claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`, `claude-3-5-sonnet-20241022`). | Sync with `/v1/models` database truth. |
| `/` (Simulator) | `ElectricReservoirSimulator.tsx` | Accurate | Interactive 5-hour rolling token replenishment visualizer. Matches `server/window.ts` mathematics. | Retain; tighten supporting technical explanation. |
| `/` (Developer) | `ElectricDeveloperStudio.tsx` | Accurate | Shows configuration for Claude Code, Cursor, Windsurf, Python SDK, TypeScript SDK, and cURL. | Retain; ensure base URL is consistently `https://lightningapi.pro`. |
| `/` (Capacity) | `ElectricCapacitySection.tsx` | Partially Outdated | Pricing cards referenced legacy tiers. Database has `Claude Max 5x (₹299)`, `Claude Max 20x (₹899)`, `Claude Max 40x (₹1,699)`, and `Claude Max 100x (₹3,999)`. | Align all cards, token amounts, and rolling refill terms with live database records. |
| `/` (Governance) | `ElectricGovernanceSla.tsx` | Accurate | Explains transient memory streaming, zero prompt disk retention, and strict telemetry. | Retain; reinforce that upstream processing follows Anthropic commercial terms. |
| `/` (Reviews) | `ElectricPublicReviews.tsx` | Verified & Live | Authentic testimonials with strict admin approval and zero-fake empty state. | Retain completely. |
| `/` (FAQ) | *Missing from landing page* | Missing | FAQ accordion was not mounted on homepage; questions in component were sparse and referenced unverified CLI. | Build comprehensive `ElectricFaqSection.tsx` answering all 12 key customer questions; mount on homepage. |
| `/docs` | `src/pages/docs/DocsPage.tsx` | Incomplete / Mixed | Mixed old copy, listed unverified models (e.g. 13 legacy items), lacked detailed error codes, lacked in-depth 5h rolling window mathematics, and lacked complete cURL/Python/TS SDK verification. | Overhaul into a comprehensive, multi-section developer documentation portal with full API reference, error matrix, and client guides. |
| `/models` | `src/pages/ModelsPage.tsx` | Needs Sync | Statically hardcoded subset of models; needed alignment with `/v1/models` endpoint. | Sync model catalog table with DB schema. |
| `/status` | `src/pages/StatusPage.tsx` | Accurate | Live connection to `/api/public/status` and `/api/system/status`. | Retain; ensure consistent branding and helpful links to docs. |
| `/check-key` | `src/pages/CheckKeyPage.tsx` | Accurate | Live key verification tool using `/api/key-status`. Displays real token balance and rolling window reset countdown. | Retain; enhance instructions on handling exhausted windows. |
| `/terms` | `src/pages/TermsPage.tsx` | Needs Professional Overhaul | Contained mixed naming ("Lightning Deals" vs "LightningAPI.pro"), legacy plan references (PRO/MAX/ULTRA), and lacked clear bearer token security clauses. | Overhaul into a rigorous 11-section Terms of Service matching ScaleMax's structured clarity. |
| `/privacy` | `src/pages/PrivacyPage.tsx` | Good Base, Needs Structure | Had prompt retention claims but lacked explicit structural distinction between collected vs non-collected data, transient memory flow, and third-party upstream handoff. | Overhaul into a comprehensive 12-section Privacy Policy using OpusMax's transparent data disclosure framework. |
| `/refund` | `src/pages/RefundPage.tsx` | Needs Unification | Contained outdated email `support@lightningdeals.in` and legacy plan names. | Rewrite into a clear, fair 5-section policy with unified support contact (`support@lightningapi.pro`). |

---

## 3. Unsupported Claims & Inconsistencies Identified

1. **CLI Packaging (`npx lightningdeals`)**:
   - *Status*: Fictional on npm.
   - *Fix*: Replace with verified shell installer: `curl -fsSL https://lightningapi.pro/setup.sh | bash` and PowerShell: `irm https://lightningapi.pro/setup.ps1 | iex`, or direct environment configuration (`export ANTHROPIC_BASE_URL=https://lightningapi.pro`).
2. **OpenAI Protocol Support**:
   - *Status*: Gateway specifically mounts Anthropic Messages API (`POST /v1/messages`), NOT `/v1/chat/completions`.
   - *Fix*: Clearly position LightningAPI.pro as an **Anthropic Messages API compatible gateway**. Clearly explain that clients must use native Anthropic configuration or Claude Code settings.
3. **Model Identifiers**:
   - *Status*: The database enables `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`, `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, and `claude-3-5-haiku-20241022`. The router in `server/gateway.ts` handles aliases (`opus`, `sonnet`, `haiku`, `fable`, and `[1m]` suffix stripping).
   - *Fix*: Document these exact IDs and aliases systematically across docs, models page, and homepage.
4. **Product Naming & Brand Identity**:
   - *Status*: Mixed usage of "Lightning Deals", "ApexScale", and "LightningAPI".
   - *Fix*: Standardize product name to **LightningAPI.pro** (operated by LightningDeals AI Infrastructure).
5. **Support Channels**:
   - *Status*: Different pages listed `support@lightningdeals.in` or `support@lightningapi.pro`.
   - *Fix*: Standardize on `support@lightningapi.pro` and in-app Customer Portal ticket submission.

---

## 4. Remediation Plan

1. **Create `content_source_matrix.md`**: Map reference insights to implementation reality.
2. **Create `policy_review_checklist.md`**: Flag legal and business decisions for operator review.
3. **Upgrade `DocsPage.tsx`**: Multi-section developer documentation with live endpoints, request/response payloads, streaming details, client configs, rolling window math, and error troubleshooting.
4. **Upgrade `TermsPage.tsx`, `PrivacyPage.tsx`, `RefundPage.tsx`**: Rigorous, transparent, internally consistent policies.
5. **Upgrade Homepage Components & Mount `ElectricFaqSection.tsx`**: Accurate hero, synced models, genuine capacity tiers, and 12-question FAQ.
6. **Rebuild & Pre-render**: Verify TypeScript compilation, Vite build, and SSG generation.
7. **Verify via Chrome DevTools MCP**: Validate desktop and mobile responsiveness, link integrity, and visual fidelity.
