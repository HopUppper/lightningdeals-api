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
