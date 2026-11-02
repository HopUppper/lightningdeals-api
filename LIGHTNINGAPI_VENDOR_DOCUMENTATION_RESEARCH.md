# LightningAPI — Vendor Documentation Research Report
**Comprehensive Analysis of LotusAI, OpusMax, and ScaleMax Documentation Ecosystems**
*Date: November 2, 2026 | Branch: feature/five-plan-architecture-and-pricing | Status: Completed*

---

## Executive Summary

This research report provides a deep comparative analysis of the documentation ecosystems of **LotusAI** (`https://lotusai.pro/docs`), **OpusMax** (`https://www.opusmax.pro/docs`), and **ScaleMax** (`https://docs.scalemax.pro/docs`). 

The objective of this research is to establish industry benchmarks for AI gateway documentation, identify UX strengths and pitfalls across reference providers, audit LightningAPI's technical reality, and formulate an architectural specification for LightningAPI's new Documentation Centre.

---

## 1. Documentation Structure of Each Vendor

### A. LotusAI & OpusMax (`lotusai.pro/docs` & `opusmax.pro/docs`)
*LotusAI and OpusMax operate as dual arms of a shared infrastructure ecosystem. LotusAI focuses on OpenAI-compatible models (Codex, GPT series, and local models), while OpusMax focuses on Anthropic Claude Frontier models.*

- **Layout Style:** Minimalist, editorial, modern light/stone aesthetic. Clean typography, restrained purple/violet accents, high whitespace, and uncluttered navigation.
- **Information Architecture:**
  1. **Quick Start / 1-Minute Onboarding:** Prominently displays automated CLI setup scripts right at the top (`npx lotusai` or `npx opusmax`).
  2. **Platform Setup Tabs:** Separate tabbed cards for Windows (PowerShell `irm ... | iex`), macOS/Linux (Bash `curl -fsSL ... | bash`), and NPM/NPX.
  3. **Supported IDEs & Tools:** Dedicated guides for Claude Code, Codex, VS Code, Cursor, Windsurf, Cline, and Roo Code.
  4. **API Endpoints:** Documents base URLs (`https://api.lotusai.pro/v1` for OpenAI protocol, `https://api.opusmax.pro` for Anthropic protocol).
  5. **Model Catalog & Context Windows:** Lists models with friendly names and context sizes.
  6. **Key Status & Diagnostics:** Direct links to interactive key-checking utilities (`/key-status`).
  7. **Uninstallation & Rollback:** Explicit instructions on how to revert configuration changes or uninstall.

### B. ScaleMax (`docs.scalemax.pro/docs`)
*ScaleMax focuses on wholesale and retail prepaid model capacity pools, offering both OpenAI-compatible and Anthropic-compatible routes across Credit Wallets and Token Packs.*

- **Layout Style:** Comprehensive developer portal (GitBook/Docusaurus style). Multi-level left sidebar navigation, central documentation column, and right-hand on-page anchor table of contents.
- **Information Architecture:**
  1. **Getting Started:** Quick Start, Interactive CLI (`npx scalemax@latest` or `npm install -g scalemax@latest`), and Manual Setup.
  2. **Authentication & Key Types:** Distinguishes between Credit Keys (`sm_live_...`), Token Pack Keys, and Provider Scope limits.
  3. **Client Integrations (14+ Tools):** Extensive platform tutorials covering Codex, Claude Code, Cursor, Roo Code, Cline, Continue, TRAE SOLO, Claude Desktop, OpenCode, OpenClaw, Hermes, Cherry Studio, n8n, and custom API code.
  4. **API Reference & Protocols:** Dual protocol documentation detailing `/v1/chat/completions` vs `/v1/messages`.
  5. **Base URL Segregation:** Separates Credit routes (`api.scalemax.pro/v1`, `api.scalemax.pro`) from Token Pack routes (`api.scalemax.pro/token/v1`, `api.scalemax.pro/token`).
  6. **Operations & Billing:** Detailed breakdowns of token accounting, rate limits (RPM), balance depletion, and error taxonomy.
  7. **SDK References:** Code snippets in Python (`openai` / `anthropic` SDKs), Node.js, and cURL.

---

## 2. Every Relevant Platform Supported by Each Vendor

| Client / Application | LotusAI / OpusMax | ScaleMax | Protocol Used | Primary Config Location |
|---|---|---|---|---|
| **Claude Code (CLI)** | Supported (Full) | Supported (Full) | Native Anthropic (`/v1/messages`) | `~/.claude/settings.json` (`env.ANTHROPIC_BASE_URL`) |
| **Cursor IDE** | Supported (Full) | Supported (Full) | Native Anthropic or OpenAI | `AppData/Cursor/User/settings.json` or UI Settings |
| **Codex CLI** | Supported (Primary) | Supported (Full) | OpenAI Compatible | `~/.codex/settings.json` or env variables |
| **VS Code (Native/Ext)** | Supported (Full) | Supported (Full) | OpenAI or Anthropic | `settings.json` via Cline, Continue, Roo Code |
| **Windsurf IDE** | Supported (Full) | Supported (Via OpenAI) | OpenAI Compatible | Windsurf Provider Settings |
| **Cline (VS Code Ext)** | Supported (Full) | Supported (Full) | Native Anthropic / OpenAI | `~/.cline/settings.json` or extension state |
| **Roo Code (VS Code)** | Supported (Full) | Supported (Full) | Native Anthropic / OpenAI | `~/.roo/settings.json` or extension state |
| **Continue.dev** | Partial (Generic) | Supported (Full) | OpenAI / Anthropic | `~/.continue/config.json` |
| **TRAE SOLO** | Not explicitly documented | Supported (Full) | OpenAI / Anthropic | `~/.trae/settings.json` |
| **Claude Desktop** | Partial | Supported (Full) | Native Anthropic (`claude_desktop_config.json`) | Desktop config JSON |
| **OpenCode / OpenClaw** | Not documented | Supported (Full) | OpenAI Compatible | `~/.opencode/config.json`, `~/.openclaw/config.json` |
| **Cherry Studio** | Not documented | Supported (Full) | OpenAI Compatible | AppData / `~/.cherrystudio/config.json` |
| **n8n Workflow Engine** | Not documented | Supported (Full) | OpenAI / Anthropic nodes | n8n Credentials UI |
| **Python Applications** | Supported (Generic) | Supported (Comprehensive) | `openai` and `anthropic` SDKs | Python environment variables / client instantiations |
| **Node.js / TypeScript** | Supported (Generic) | Supported (Comprehensive) | Native Fetch / Official SDKs | Environment variables (`process.env`) |
| **cURL / HTTP Direct** | Supported | Supported | Direct HTTP REST | CLI Terminal |

---

## 3. How Each Vendor Structures Its Installation Guides

Both vendor ecosystems structure their installation guides following a **3-tier progression model**:

1. **The "1-Click" Happy Path (Automated CLI):**
   - Prominently displays a single terminal command that detects the client, checks the OS, backs up old settings, and writes the new configuration automatically.
   - ScaleMax uses: `npx scalemax@latest`
   - LotusAI / OpusMax uses: `npx lotusai` or `npx opusmax` / `setup.sh` / `setup.ps1`
2. **The "Copy-Paste Snippet" Path (Manual Fast Track):**
   - For users who prefer not to run a CLI installer, provides exact shell export commands:
     - Windows PowerShell: `$env:ANTHROPIC_BASE_URL="..."; $env:ANTHROPIC_AUTH_TOKEN="ld_live_..."`
     - macOS/Linux Bash: `export ANTHROPIC_BASE_URL="..."; export ANTHROPIC_AUTH_TOKEN="ld_live_..."`
3. **The "Exact File Editor" Path (Manual Deep Dive):**
   - Identifies the exact file path on disk (e.g. `~/.claude/settings.json`).
   - Shows the exact JSON structure before and after.
   - Highlights which fields to replace.
   - Tells the user whether an application restart is required.
   - Provides a test command to verify connectivity.

---

## 4. How Automatic and Manual Installation Work

### Automatic Installation Architecture
- Both vendors use a Node-based CLI wrapper distributed via NPX or curl/irm shell loaders.
- **Workflow:**
  1. Requests the user's API Key.
  2. Queries the status endpoint to validate the key and discover enabled model IDs.
  3. Scans default filesystem directories for installed clients (Claude Code, Cursor, Roo Code, etc.).
  4. Prompts the user to select which applications to configure.
  5. Creates a timestamped `.backup` of existing configuration files before touching them.
  6. Safely parses existing JSON without clobbering unrelated user configurations.
  7. Clears conflicting environment variables (e.g., AWS Bedrock / Vertex overrides in Claude Code).
  8. Emits a non-billable validation request to verify end-to-end routing.
  9. Prints a summary of configured tools and test instructions.

### Manual Installation Architecture
- Vendor docs provide exact operating-system-specific commands:
  - **PowerShell (Windows):** Avoids `export` (which fails in PowerShell) and instead provides `$env:VARIABLE = "value"` or `[System.Environment]::SetEnvironmentVariable(...)`.
  - **Bash/Zsh (macOS/Linux):** Provides `export VARIABLE="value"` and shows how to persist in `~/.bashrc` or `~/.zshrc`.
  - **JSON Configuration:** Provides copyable JSON objects with placeholder tokens (`your_api_key_here`).

---

## 5. How They Explain API Keys and Authentication

- **Bearer Token Standardization:** Both vendors emphasize that the API key is passed either via standard HTTP headers:
  - `Authorization: Bearer <API_KEY>`
  - `x-api-key: <API_KEY>` (in native Anthropic protocol)
- **Key Prefixing:**
  - LotusAI uses `lotus_...` / `sk_live_...`
  - OpusMax uses `opm_...` / `sk-ant-opm-...`
  - ScaleMax uses `sm_live_...`
  - LightningAPI uses `ld_live_...` and `ld_trial_...`
- **Security Guidance:**
  - Vendors explicitly caution users never to commit keys to public GitHub repositories.
  - Advise using environment variables or dedicated secret management.
  - Explain how to revoke or rotate keys if leaked.

---

## 6. How They Distinguish Different Key and Billing Types

*This is a critical area where documentation often creates confusion if not structured carefully.*

- **ScaleMax Documentation Approach:**
  - ScaleMax separates keys into **Credit Keys** (metered USD wallet) and **Token Pack Keys** (wholesale capacity pools).
  - They warn developers that Token Pack Keys must point to `/token` or `/token/v1` routes, while Credit Keys point to the root `/v1`.
- **LotusAI / OpusMax Approach:**
  - LotusAI and OpusMax emphasize **5-Hour Rolling Window Quotas** (e.g. Claude Max 20x, Claude Max 40x).
  - They explain that usage resets automatically on a continuous rolling basis every 5 hours without requiring manual top-ups.
- **LightningAPI's Unique Architecture:**
  - LightningAPI unifies **ALL SIX** billing architectures behind a **single unified customer gateway** (`https://lightningapi.pro` and `https://lightningapi.pro/v1`):
    1. Claude Max (5-hour rolling-window quota)
    2. OpenAI (5-hour rolling-window quota)
    3. Claude + OpenAI (Prepaid API Credit Wallet)
    4. OpenAI Consumable Token Packs (10M, 50M, 100M)
    5. Claude Consumable Token Packs (10M, 50M, 100M)
    6. Local & Open-Weights Consumable Token Packs (10M, 100M, 500M)
  - Unlike ScaleMax, **LightningAPI customers do NOT need to switch base URLs** between `/token/v1` and `/v1`. LightningAPI's intelligent gateway routes requests based on the key's provisioned plan automatically!

---

## 7. How They Explain Base URLs and Model IDs

- **Base URLs:**
  - Vendors clearly separate the **protocol requirement**:
    - Native Anthropic protocol: `BASE_URL` is without `/v1` suffix (e.g. `https://lightningapi.pro`), because client SDKs automatically append `/v1/messages`.
    - OpenAI-compatible protocol: `BASE_URL` requires `/v1` suffix (e.g. `https://lightningapi.pro/v1`), because client SDKs automatically append `/chat/completions`.
- **Model IDs vs Display Names:**
  - Reference docs caution developers to use the exact technical model string (e.g. `claude-sonnet-5.5` or `gpt-4o`) rather than the marketing display name in configuration files.
  - Under LightningAPI's strict rules, **zero Claude 3 family models** are permitted. Only frontier models (`claude-sonnet-5.5`, `claude-opus-5.5`, `claude-fable-5`, `claude-haiku-5.5`, `gemini-4-argon`, `gpt-4o`) are documented.

---

## 8. How They Present API Examples

- **Multi-Language Tabs:** Every endpoint documentation card features synchronized code tabs for:
  - **cURL:** Direct command-line execution with exact headers and JSON payload.
  - **Python:** Using official `anthropic` or `openai` client libraries with `base_url` overrides.
  - **JavaScript / TypeScript:** Using official Node.js SDKs and native `fetch`.
- **Request / Response Side-by-Side:**
  - Shows the full JSON request schema alongside realistic, formatted response objects.
  - Explicitly documents token usage metadata returned in response (`usage.input_tokens`, `usage.output_tokens`).

---

## 9. How They Explain Limits, Balances, Usage, and Expiry

- **Credit Plans:** Explained as a prepaid cash wallet balance in USD/INR. Depleted when balance reaches $0.00. Valid for 365 days.
- **Token Packages:** Explained as a fixed consumable bucket (e.g. 10,000,000 tokens). Depleted when tokens remaining reach 0.
- **Rolling Windows:** Explained as a 5-hour sliding window allowance. Tokens continuously restore as requests roll past the 5-hour mark.
- **Self-Serve Verification:** Both vendors point users to `/key-status` where users can paste their key to view remaining tokens, reset countdowns, and recent requests.

---

## 10. How They Explain Common Errors

Reference documentation categorizes errors by HTTP status codes and plain-English meanings:
- `401 Unauthorized` → Invalid API key, typo, or expired key.
- `402 Payment Required` → Credit balance depleted ($0.00).
- `403 Forbidden` → Model family not permitted under current plan or key paused.
- `429 Too Many Requests` → Either 5-hour rolling allowance consumed OR speed limit (RPM) exceeded.
- `503 Service Unavailable` → Temporary model cluster overload; zero tokens charged.

---

## 11. What Makes Their Documentation Easy to Understand

1. **Immediate Clarity:** A beginner sees an interactive wizard or 1-command installer within 5 seconds.
2. **Visual Command Separation:** Windows PowerShell, macOS Bash, and Linux commands are clearly separated—never mixed into one confusing snippet.
3. **Copy-Button Feedback:** Every code block has an accessible one-click copy button with visual checkmark feedback.
4. **No Deep Technical Prerequisites:** Beginners do not need to understand reverse proxies, SSE chunks, or tokenization before getting started.
5. **Clear File Paths:** Exact configuration paths are given for Windows (`%APPDATA%`), macOS (`~/Library`), and Linux (`~/.config`).

---

## 12. Which Features LightningAPI Should Adopt

1. **Interactive Guided Setup Wizard:** Allow users to pick their tool (Claude Code, Cursor, Codex, etc.), OS, plan, and model to generate an exact copy-paste guide.
2. **Dedicated Platform Guides:** Deep-dive standalone pages for all 14+ supported tools with exact file locations and step-by-step instructions.
3. **One-Command CLI Onboarding:** Document LightningAPI's CLI (`npx lightningdeals`) with verified options.
4. **Multi-Language API Reference:** Full cURL, Python, and Node.js examples for all supported gateway endpoints.
5. **Interactive Search & Sidebar Navigation:** Expandable/collapsible documentation tree with real-time keyword search.
6. **Built-in Key Status Verification:** Integrated links and widgets for `/check-key` to test keys without leaving documentation.

---

## 13. Which Features Must Be Adapted for LightningAPI

1. **Unified Base URL:** Unlike ScaleMax, LightningAPI does NOT require separate `/token` base URLs for token packs. Everything goes through `https://lightningapi.pro` (Anthropic) or `https://lightningapi.pro/v1` (OpenAI).
2. **Multi-Plan Awareness:** Documentation must distinguish all 6 billing architectures cleanly without confusing customers.
3. **Strict Zero Claude 3 Family Rule:** All references must strictly feature permitted frontier models (`Claude Sonnet 5.5`, `Claude Opus 5.5`, `Gemini 4 Argon`, `GPT-4o`).
4. **Strict Zero Vendor Leaks:** Never mention ScaleMax, LotusAI, OpusMax, or upstream internal URLs. LightningAPI stands 100% independent.
5. **Non-Technical Error Resolution:** Seamlessly integrate the verified error diagnostics and "How to Resolve" assistant recently deployed.

---

## 14. Documentation Capabilities LightningAPI Currently Lacks

1. **Interactive Client Configuration Wizard:** The current Docs page is a long static document. It needs an interactive wizard at the top.
2. **Dedicated Standalone Client Guides:** Detailed per-app walkthroughs for Codex, TRAE SOLO, OpenCode, OpenClaw, Cherry Studio, and n8n.
3. **Comprehensive Search:** Real-time search across all documentation sections, error codes, and models.
4. **Visual File Tree & Config Diffs:** Clear "Before" and "After" configuration snippets for settings files.
5. **OS Tabs on Every Code Block:** Instant switching between Windows (PowerShell), macOS (Zsh), and Linux (Bash).

---

## 15. Comprehensive Comparison Matrix

| Documentation Capability | LotusAI / OpusMax | ScaleMax | LightningAPI Requirement |
|---|---|---|---|
| **Beginner Quick Start** | 1-minute command setup with simple tabs | Quick Start overview with CLI instructions | **Implement:** Hero with 3 paths (New to APIs, Connect App, Developer Reference) + Interactive Wizard |
| **Windows Setup** | PowerShell `irm ... \| iex` script + `$env:` commands | PowerShell commands + manual file paths | **Implement:** Native PowerShell `$env:` syntax and exact `%APPDATA%` paths |
| **macOS / Linux Setup** | Bash `curl ... \| bash` + `export` commands | Bash commands + `~/.config` paths | **Implement:** Native Zsh/Bash `export` syntax and exact `~/.config` paths |
| **Automatic Installation** | `npx lotusai` / `npx opusmax` CLI | `npx scalemax@latest` CLI | **Implement:** `npx lightningdeals` CLI with backup & model selection |
| **Manual Configuration** | Detailed settings JSON for Claude Code, Cursor, Windsurf | Detailed settings for 14+ IDEs & clients | **Implement:** Exact JSON & file locations for Claude Code, Cursor, Codex, Windsurf, Cline, Roo Code, Continue, etc. |
| **Individual App Guides** | 7 dedicated application guides | 14 dedicated application guides | **Implement:** 14 dedicated verified application guides |
| **API Reference** | `/v1` and Anthropic Messages specs | Full OpenAI & Anthropic specs | **Implement:** Full `/v1/messages`, `/v1/chat/completions`, `/v1/responses`, `/v1/models`, `/api/key-status` specs |
| **SDK Examples** | cURL, Python, Node.js snippets | cURL, Python, Node.js, Go snippets | **Implement:** Synchronized cURL, Python (`anthropic`/`openai`), JavaScript/Node.js tabs |
| **Model Catalog** | Claude Frontier, GPT series | Comprehensive multi-provider catalog | **Implement:** Showcase models (Claude Sonnet 5.5, Opus 5.5, Gemini 4 Argon, GPT-4o) with zero Claude 3 mentions |
| **Streaming & SSE** | Basic SSE explanation | In-depth chunked buffer streaming guide | **Implement:** SSE chunk format, Python/JS streaming client code, and token accounting |
| **Image & Multimodal** | Documented on supported Claude models | Documented on Claude and GPT-4o | **Implement:** Base64 image payload spec, 20MB limits, supported formats (PNG, JPEG, WEBP, GIF) |
| **Billing & Usage** | 5-Hour rolling window emphasis | Credit balance & Token pack emphasis | **Implement:** Clear breakdown of all 6 billing architectures with reset & rollover rules |
| **Error Codes** | 400, 401, 403, 429, 500 catalog | Detailed HTTP status & vendor error codes | **Implement:** Complete error taxonomy with non-technical explanations & verified resolution steps |
| **Troubleshooting Hub** | FAQ & connection issues | Comprehensive diagnostic steps | **Implement:** Interactive troubleshooting hub linking to `/check-key` and customer support |
| **Documentation Search** | Keyword filter | Full-text client search | **Implement:** Instant fuzzy search with deep anchor linking and category filters |
