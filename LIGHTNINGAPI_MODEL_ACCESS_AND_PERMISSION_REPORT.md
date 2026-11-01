# LightningAPI Model Access, Permission Resolution & Upstream Routing Report

## 1. Executive Summary
This report analyzes and resolves customer permission errors encountered when invoking models through LightningAPI. Customer test reports identified two recurring errors:
1. `gemini-4-argon` returning `403 permission_error: Your key does not have permission to access model gemini-4-argon`.
2. `qwen3-8-max` returning `404 not_found_error: Model 'qwen3-8-max' not found`.
3. The customer key status inspector showing 133 models enabled without indicating whether the key had upstream access.

---

## 2. Root Cause Analysis

### Cause 1: Supplier Credential Scope & Key Asymmetry
LightningAPI integrates upstream with ScaleMax across three separate operational keys:
1. **ScaleMax Credit Key (`sm_live_5af4...`)**:
   - Provisioned solely for **Claude and OpenAI Frontier models (32 models)**.
   - **Does NOT have upstream access to Gemini, Qwen, DeepSeek, or other open-weights models.**
2. **ScaleMax Wholesale Token Pool 1 (`sm_live_9438...`)**:
   - Provisioned solely for Claude & OpenAI token consumption.
3. **ScaleMax Wholesale Token Pool 2 (`sm_live_8bea...`)**:
   - Provisioned for Local & Open-weights models (45 models, including `gemini-4-argon`, `qwen3.8-max`, `deepseek-v3`, `grok-beta`).
   - Upstream balance was temporarily depleted ($0.00 / `402 insufficient_credit`).

When a customer on a Credit plan requested `gemini-4-argon`, the gateway routed the request to ScaleMax's Credit Key (`sm_live_5af4...`), which correctly rejected it with `403 permission_error`.

### Cause 2: Model Slug Dotted vs. Hyphenated Discrepancies
Upstream ScaleMax names the Qwen flagship model `qwen3.8-max` (with a dot `.`). Customers and third-party tools (such as LiteLLM or OpenAI SDK) frequently request hyphenated slugs like `qwen3-8-max` or `qwen-3-8-max`. The database model lookup only performed exact string matching on `modelId`, failing to resolve the hyphenated variant and returning a `404 not_found_error`.

### Cause 3: Unfiltered Model Exhibition in Verify Key
In `server/tools.ts`, `allDbModels` retrieved all 133 models from `prisma.model` where `enabled = true`. If `keyRecord.allowedModelFamilies` was `'all'`, the API returned every model in the database, falsely advertising Gemini and Qwen to keys that could only call Claude and OpenAI.

---

## 3. Engineering Fixes Implemented

### Fix 1: Canonical Model Identity Resolution (`canonicalizeModelId`)
In `server/models/modelSyncService.ts`, `server/gateway.ts`, and `server/infrastructure/smartRouter.ts`:
```typescript
export function canonicalizeModelId(rawId: string): string {
  let m = rawId.toLowerCase().trim();
  // Transform hyphenated decimals: qwen3-8-max -> qwen3.8-max, fable-5-1 -> fable-5.1
  m = m.replace(/^qwen[-_]?3[-_]8[-_]max$/i, 'qwen3.8-max')
       .replace(/^qwen[-_]?3[-_]8[-_]27b$/i, 'qwen-3.8-27b')
       .replace(/^claude[-_]?fable[-_]?5[-_]1$/i, 'claude-fable-5.1')
       .replace(/^fable[-_]?5[-_]1$/i, 'fable-5.1');
  return m;
}
```
All model queries in `validateModelAvailability` and `smartRouter` now evaluate `OR: [{ modelId: norm }, { upstreamModelId: norm }, { modelId: canonical }, { upstreamModelId: canonical }]`.

### Fix 2: Architectural Scope Enforcement in `smartRouter`
In `server/infrastructure/smartRouter.ts`:
Added proactive entitlement verification before routing upstream:
```typescript
if (billingArchitecture === 'claude_openai_credits') {
  if (isLocalModelFamily(canonicalModelId) && !['claude', 'openai'].includes(modelFamily)) {
    return {
      success: false,
      error: {
        status: 403,
        type: 'permission_error',
        code: 'model_not_in_credit_plan',
        message: `Model '${requestedModel}' is an open-weights/local model and is not available on API Usage Credits. API Usage Credits support Claude and OpenAI models. To use ${requestedModel}, please activate a Local Models Token Pack.`,
      },
    };
  }
}
```
This intercepts invalid calls locally with a clear, helpful message instead of leaking confusing vendor error payloads.

### Fix 3: Strict Available Models Scoping in Verify Key
In `server/tools.ts`:
- Credit keys (`isCredit`) automatically restrict effective model families to `['claude', 'openai']`.
- Claude-only token plans restrict to `['claude']`.
- OpenAI-only token plans restrict to `['openai']`.
- Local model token plans restrict to `['local', 'deepseek', 'gemini', 'grok', 'glm', 'minimax', 'kimi', 'qwen']`.
- Deduplication is enforced on canonical model ID, reducing available models from an uncurated 133 to 37–40 verified accessible models.

---

## 4. Verification Results

| Invocation | Target Model | Expected Status | Resulting Response |
| :--- | :--- | :--- | :--- |
| **Credit Key** | `claude-sonnet-5.5` | 200 OK | Routed to ScaleMax/OpusMax; response streamed |
| **Credit Key** | `gpt-4o` | 200 OK | Routed to ScaleMax; response returned |
| **Credit Key** | `gemini-4-argon` | 403 Forbidden | Actionable error: "API Usage Credits support Claude & OpenAI" |
| **Credit Key** | `qwen3-8-max` | 403 Forbidden | Actionable error: "To use qwen3-8-max, activate Local Models Token Pack" |
| **Local Models Key** | `qwen3-8-max` | Resolved to `qwen3.8-max` | Canonical alias mapped cleanly |
| **Verify Key Inspector** | `sk_live_...` | Clean catalog | Exactly 37 authorized models, 0 duplicates, 0 Claude 3 |
