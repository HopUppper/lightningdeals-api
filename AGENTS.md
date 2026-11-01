# LightningAPI Development & Architecture Rules

## Strict Model Family Rules (CRITICAL & PERMANENT)

### 1. Absolute Prohibition on Claude 3 Family Mentions
- **NEVER display or mention any Claude 3 family model anywhere on the website or documentation.**
- This prohibition applies across:
  - Public marketing pages (`/`, `/models`, `/pricing`, `/how-it-works`, `/why-us`, `/demo`, `/faq`)
  - Customer dashboard pages (`/dashboard/models`, `/dashboard/studio`, `/dashboard/api-test`, `/dashboard/overview`, `/dashboard/plan`, `/dashboard/docs`, `/dashboard/migration`)
  - Model dropdowns, presets, and select boxes
  - System prompts, placeholder text, code snippets, and curl examples
  - Public `/v1/models` API outputs
- **Specific Models Strictly Prohibited from Being Displayed**:
  - `claude-3-opus` / `claude-3-opus-20240229` (Claude 3 Opus)
  - `claude-3-sonnet` / `claude-3-sonnet-20240229` (Claude 3 Sonnet)
  - `claude-3-haiku` / `claude-3-haiku-20240307` (Claude 3 Haiku)
  - `claude-3-5-sonnet` / `claude-3-5-sonnet-20241022` / `claude-3-5-sonnet-20240620` (Claude 3.5 Sonnet)
  - `claude-3-5-haiku` / `claude-3-5-haiku-20241022` (Claude 3.5 Haiku)
  - `claude-3-7-sonnet` / `claude-3-7-sonnet-20250219` (Claude 3.7 Sonnet)

### 2. Showcase Models
- **Anthropic Claude Frontier**: `claude-sonnet-5.5`, `claude-opus-5.5`, `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`, `claude-fable-5.1`, `claude-fable-5-flash`, `claude-haiku-5.5`, `claude-haiku-5`, `claude-sonnet-4.5`.
- **Google Gemini**: `gemini-4-argon` (1M tokens, multimodal reasoning), `gemini-2.5-pro`, `gemini-2.5-flash`.
- **OpenAI Frontier**: `gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`, `gpt-4.5`.
- **Open-Weights & Labs**: DeepSeek V3/R1, xAI Grok, Alibaba Qwen, Zhipu GLM.

## Strict Pricing Display Rules (CRITICAL & PERMANENT)

### 3. Strikethrough Prices ONLY for Claude 5-Hour Rolling Plans
- **Strikethrough original prices (`originalPriceInr` and `annualOriginalPriceInr`) are permitted ONLY on Claude 5-Hour Rolling Plans** (`planCategory === 'claude_max_rolling'` / `planType === 'window'`).
- **For EVERY other type of plan, NEVER show strikethrough prices. Only show our direct pricing**:
  - API Credits deposit plans (`credit_starter`, `credit_growth`, `credit_pro`, `credit_scale`, etc.)
  - OpenAI consumable token packs (`openai_token_10m`, `openai_token_50m`, `openai_token_100m`)
  - Claude consumable token packs (`claude_token_10m`, `claude_token_50m`, `claude_token_100m`)
  - Local/Open-weights consumable token packs (`local_token_10m`, `local_token_100m`, `local_token_500m`)
- This applies universally across public pricing pages, customer dashboard plans, cart drawers, admin views, and API responses.

## Strict Testing & Database Hygiene Rules (CRITICAL & PERMANENT)

### 4. Zero Residual Test Artifacts & Strict Live Customer Isolation
- **NEVER use or attach test data to existing customer accounts**:
  - Never query `prisma.user.findFirst()` or attach test keys/orders to live customer IDs.
  - Live customers (`ms861000@gmail.com`, `ms86100@gmail.com`, `kunalkumarjha97@gmail.com`, `sivadthapa.93@gmail.com`, etc.) must NEVER have their keys, orders, or usage modified or deleted.
- **Always use dedicated test user sandboxes**:
  - All test customer accounts must use distinct test domains: `test-...@test.internal`.
  - Use [`scripts/test-sandbox.ts`](file:///c:/Users/irons/OneDrive/Desktop/Lightning%20Deal%20API/scripts/test-sandbox.ts) (`createTestUser`, `createTestApiKey`, `cleanupSandbox`).
- **Always clean up ALL test artifacts in `finally` blocks**:
  - When tests complete, the suite must immediately delete:
    1. Any `ApiRequest` records generated during testing (preventing orphaned "Deleted Key" rows in `/deez/usage`).
    2. Any `TokenLedger` and `CustomerUsageCreditLedger` records created.
    3. Any `Subscription` records associated with test orders.
    4. Any `Order` records created for test buyers.
    5. Any `ApiKey` records created for testing.
    6. Any test `User` records created.
- **Clear Identification**:
  - Always identify test entities via sandbox tracking arrays (`userIds`, `keyIds`, `orderIds`).
  - Never delete by generic unbounded queries that could touch live customer rows.
