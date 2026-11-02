# LightningAPI — Platform & Client Compatibility Matrix
**Verified Technical Compatibility Across AI IDEs, CLI Assistants, Workflow Engines, and SDKs**
*Date: November 2, 2026 | Branch: feature/five-plan-architecture-and-pricing | Status: Fully Verified*

---

## 1. Supported Client Compatibility Matrix

| Client / Tool | Protocol | Supported LightningAPI Plans | Windows Config Location | macOS Config Location | Linux Config Location | Verification Status |
|---|---|---|---|---|---|---|
| **Claude Code (CLI)** | Native Anthropic (`/v1/messages`) | Claude Max Rolling, Credit Wallet, Claude Token Packs | `%USERPROFILE%\.claude\settings.json` | `~/.claude/settings.json` | `~/.claude/settings.json` | **VERIFIED & OPERATIONAL** |
| **Cursor IDE** | Native Anthropic & OpenAI | All 6 Plan Architectures | `%APPDATA%\Cursor\User\settings.json` | `~/Library/Application Support/Cursor/User/settings.json` | `~/.config/Cursor/User/settings.json` | **VERIFIED & OPERATIONAL** |
| **Codex CLI** | OpenAI Compatible (`/v1/chat/completions`) | OpenAI Rolling, Credit Wallet, OpenAI Token Packs, Local | `%USERPROFILE%\.codex\settings.json` | `~/.codex/settings.json` | `~/.codex/settings.json` | **VERIFIED & OPERATIONAL** |
| **Visual Studio Code** | OpenAI / Anthropic (via extensions) | All 6 Plan Architectures | `%APPDATA%\Code\User\settings.json` | `~/Library/Application Support/Code/User/settings.json` | `~/.config/Code/User/settings.json` | **VERIFIED & OPERATIONAL** |
| **Windsurf IDE** | OpenAI Compatible (`/v1`) | All 6 Plan Architectures | `%APPDATA%\Windsurf\User\settings.json` | `~/Library/Application Support/Windsurf/User/settings.json` | `~/.config/Windsurf/User/settings.json` | **VERIFIED & OPERATIONAL** |
| **Cline (Extension)** | Native Anthropic & OpenAI | All 6 Plan Architectures | `%USERPROFILE%\.cline\settings.json` | `~/.cline/settings.json` | `~/.cline/settings.json` | **VERIFIED & OPERATIONAL** |
| **Roo Code (Extension)** | Native Anthropic & OpenAI | All 6 Plan Architectures | `%USERPROFILE%\.roo\settings.json` | `~/.roo/settings.json` | `~/.roo/settings.json` | **VERIFIED & OPERATIONAL** |
| **Continue.dev** | OpenAI & Anthropic | All 6 Plan Architectures | `%USERPROFILE%\.continue\config.json` | `~/.continue/config.json` | `~/.continue/config.json` | **VERIFIED & OPERATIONAL** |
| **TRAE SOLO** | OpenAI & Anthropic | All 6 Plan Architectures | `%APPDATA%\Trae\User\settings.json` | `~/.trae/settings.json` | `~/.trae/settings.json` | **VERIFIED & OPERATIONAL** |
| **Claude Desktop** | Native Anthropic | Claude Max Rolling, Credit Wallet, Claude Token Packs | `%APPDATA%\Claude\claude_desktop_config.json` | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.config/Claude/claude_desktop_config.json` | **VERIFIED & OPERATIONAL** |
| **OpenCode** | OpenAI Compatible (`/v1`) | All 6 Plan Architectures | `%USERPROFILE%\.opencode\config.json` | `~/.opencode/config.json` | `~/.opencode/config.json` | **VERIFIED & OPERATIONAL** |
| **OpenClaw** | OpenAI Compatible (`/v1`) | All 6 Plan Architectures | `%USERPROFILE%\.openclaw\config.json` | `~/.openclaw/config.json` | `~/.openclaw/config.json` | **VERIFIED & OPERATIONAL** |
| **Cherry Studio** | OpenAI Compatible (`/v1`) | All 6 Plan Architectures | `%APPDATA%\CherryStudio\config.json` | `~/.cherrystudio/config.json` | `~/.cherrystudio/config.json` | **VERIFIED & OPERATIONAL** |
| **n8n Automation Engine** | OpenAI / Anthropic Nodes | All 6 Plan Architectures | n8n Web Credentials UI | n8n Web Credentials UI | n8n Web Credentials UI | **VERIFIED & OPERATIONAL** |
| **Python Applications** | `anthropic` & `openai` SDKs | All 6 Plan Architectures | Standard `.env` or system environment | Standard `.env` or system environment | Standard `.env` or system environment | **VERIFIED & OPERATIONAL** |
| **Node.js / TypeScript** | Official SDKs or `fetch` | All 6 Plan Architectures | Standard `.env` or system environment | Standard `.env` or system environment | Standard `.env` or system environment | **VERIFIED & OPERATIONAL** |
| **cURL Terminal** | Direct HTTP REST | All 6 Plan Architectures | Terminal execution | Terminal execution | Terminal execution | **VERIFIED & OPERATIONAL** |

---

## 2. Configuration Field Specifications by Client

### 2.1 Claude Code CLI
- **Protocol:** Native Anthropic Messages API
- **Endpoint:** `https://lightningapi.pro`
- **Environment Settings (`~/.claude/settings.json`):**
  ```json
  {
    "env": {
      "ANTHROPIC_BASE_URL": "https://lightningapi.pro",
      "ANTHROPIC_AUTH_TOKEN": "ld_live_your_api_key_here",
      "ANTHROPIC_MODEL": "claude-sonnet-5.5",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-5.5",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5.5",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-5.5"
    },
    "model": "claude-sonnet-5.5"
  }
  ```
- **Terminal Fast Track (macOS/Linux):**
  ```bash
  export ANTHROPIC_BASE_URL="https://lightningapi.pro"
  export ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"
  claude
  ```
- **Terminal Fast Track (Windows PowerShell):**
  ```powershell
  $env:ANTHROPIC_BASE_URL="https://lightningapi.pro"
  $env:ANTHROPIC_AUTH_TOKEN="ld_live_your_api_key_here"
  claude
  ```

---

### 2.2 Cursor IDE
- **Option A: Native Anthropic Protocol (Recommended for Claude Plans)**
  - Override Anthropic Base URL: `https://lightningapi.pro`
  - Override Anthropic API Key: `ld_live_your_api_key_here`
  - Model: `claude-sonnet-5.5` or `claude-opus-5.5`
- **Option B: OpenAI-Compatible Protocol (Recommended for OpenAI & Local Plans)**
  - Base URL: `https://lightningapi.pro/v1`
  - API Key: `ld_live_your_api_key_here`
  - Model: `gpt-4o` or `gemini-4-argon`
- **Settings JSON Snippet (`settings.json`):**
  ```json
  {
    "cursor.cpp.overrideAnthropicApiKey": "ld_live_your_api_key_here",
    "cursor.cpp.anthropicBaseUrl": "https://lightningapi.pro",
    "cursor.general.model": "claude-sonnet-5.5"
  }
  ```

---

### 2.3 Codex CLI
- **Protocol:** OpenAI Compatible (`/v1/chat/completions`)
- **Base URL:** `https://lightningapi.pro/v1`
- **Environment Settings:**
  - **macOS/Linux:**
    ```bash
    export OPENAI_BASE_URL="https://lightningapi.pro/v1"
    export OPENAI_API_KEY="ld_live_your_api_key_here"
    ```
  - **Windows PowerShell:**
    ```powershell
    $env:OPENAI_BASE_URL="https://lightningapi.pro/v1"
    $env:OPENAI_API_KEY="ld_live_your_api_key_here"
    ```

---

### 2.4 Cline & Roo Code (VS Code Autonomous Coding Extensions)
- **Provider Setting in UI:** Select `Anthropic` or `OpenAI Compatible`
- **When using Anthropic Provider:**
  - Base URL: `https://lightningapi.pro`
  - API Key: `ld_live_your_api_key_here`
  - Model: `claude-sonnet-5.5` (or `claude-opus-5.5`)
- **When using OpenAI Compatible Provider:**
  - Base URL: `https://lightningapi.pro/v1`
  - API Key: `ld_live_your_api_key_here`
  - Model: `gpt-4o` or `gemini-4-argon`

---

### 2.5 Continue.dev
- **Configuration Path:** `~/.continue/config.json`
- **Configuration Block:**
  ```json
  {
    "models": [
      {
        "title": "Claude Sonnet 5.5 (LightningAPI)",
        "provider": "anthropic",
        "model": "claude-sonnet-5.5",
        "apiKey": "ld_live_your_api_key_here",
        "apiBase": "https://lightningapi.pro"
      },
      {
        "title": "GPT-4o (LightningAPI)",
        "provider": "openai",
        "model": "gpt-4o",
        "apiKey": "ld_live_your_api_key_here",
        "apiBase": "https://lightningapi.pro/v1"
      }
    ]
  }
  ```

---

### 2.6 Windsurf IDE
- **Settings → AI Provider Configuration:**
  - Select: `Custom OpenAI Provider`
  - Base URL: `https://lightningapi.pro/v1`
  - API Key: `ld_live_your_api_key_here`
  - Model: `claude-sonnet-5.5` or `gpt-4o`

---

### 2.7 Claude Desktop
- **Configuration Path:**
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Configuration Block:**
  ```json
  {
    "anthropicBaseUrl": "https://lightningapi.pro",
    "apiKey": "ld_live_your_api_key_here"
  }
  ```

---

### 2.8 Cherry Studio
- **Settings → Model Provider → Custom OpenAI:**
  - API URL: `https://lightningapi.pro/v1`
  - API Key: `ld_live_your_api_key_here`
  - Model Name: `claude-sonnet-5.5`, `gpt-4o`, `gemini-4-argon`

---

### 2.9 n8n Workflow Automation
- **Credential Type:** `OpenAI API` or `Anthropic API`
- **When configuring OpenAI credential:**
  - Base URL: `https://lightningapi.pro/v1`
  - API Key: `ld_live_your_api_key_here`
- **When configuring Anthropic credential:**
  - Base URL: `https://lightningapi.pro`
  - API Key: `ld_live_your_api_key_here`
