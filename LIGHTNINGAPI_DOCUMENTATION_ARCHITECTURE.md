# LightningAPI — Documentation Centre Architecture Specification
**Complete Information Architecture, Sitemap, Component Design, and User Journeys**
*Date: November 2, 2026 | Branch: feature/five-plan-architecture-and-pricing | Status: Active Specification*

---

## 1. Architectural Vision

The LightningAPI Documentation Centre is engineered to achieve a single uncompromising standard:
> **A customer who has never used an API before should be able to take their LightningAPI key, choose their preferred application, follow the step-by-step instructions, connect successfully, and make their first API request without needing external technical assistance.**

Simultaneously, experienced software engineers and enterprise architects have instant access to complete API specifications, protocol nuances, SDK integration examples, token accounting mechanics, and programmatic troubleshooting.

---

## 2. Core Information Architecture & Navigation Tree

The Documentation Centre is organized into **eight top-level logical domains (A through H)** designed around customer intent rather than backend jargon.

```text
Documentation Centre (/docs)
├── Hero & Triage Matrix ("I am new to APIs" | "Connect an App" | "Developer Reference")
├── Interactive Guided Setup Wizard (Client → OS → Plan → Model → Exact Config)
├── Global Documentation Search (Instant fuzzy filter + deep section anchors)
│
├── A. GETTING STARTED
│   ├── A1. Introduction to LightningAPI
│   ├── A2. What is an API Key? (Plain-English guide)
│   ├── A3. How LightningAPI Works (Gateway architecture)
│   ├── A4. How to Get Your API Key
│   ├── A5. Understanding Your Plan Architecture (6 Billing Types)
│   ├── A6. Your First Successful Request (1-Minute Quick Start)
│   └── A7. Checking Your Key Status & Live Consumption
│
├── B. QUICK SETUP (OS-SPECIFIC)
│   ├── B1. Windows Setup (PowerShell & Command Prompt)
│   ├── B2. macOS Setup (Zsh & Bash)
│   ├── B3. Linux Setup (Ubuntu, Debian, Fedora, Arch)
│   ├── B4. Automatic Setup (`npx lightningdeals` & 1-line shell loaders)
│   ├── B5. Manual Configuration Best Practices
│   ├── B6. Verifying Your Installation Safely
│   ├── B7. Changing or Rotating Your API Key
│   └── B8. Removing an Existing Configuration (Clean Uninstallation)
│
├── C. CONNECT YOUR APPLICATION (14+ DEDICATED GUIDES)
│   ├── C1. Claude Code CLI (Native Anthropic Protocol)
│   ├── C2. Cursor IDE (Anthropic & OpenAI Compatible)
│   ├── C3. Codex CLI (OpenAI Compatible)
│   ├── C4. Visual Studio Code (Native & Extensions)
│   ├── C5. Windsurf IDE (Codeium Flow Engine)
│   ├── C6. Cline (VS Code Autonomous Coding Extension)
│   ├── C7. Roo Code (VS Code Dual-Mode AI Extension)
│   ├── C8. Continue.dev (Open-source Copilot Extension)
│   ├── C9. TRAE SOLO (Adaptive AI IDE)
│   ├── C10. Claude Desktop (Anthropic Protocol Integration)
│   ├── C11. OpenCode & OpenClaw (Developer Agents)
│   ├── C12. Cherry Studio (Multi-model Desktop Client)
│   ├── C13. n8n Workflow Automation Engine
│   └── C14. Custom Scripts (Python, Node.js, cURL)
│
├── D. MODELS & PROVIDERS
│   ├── D1. Anthropic Claude Frontier Models (Sonnet 5.5, Opus 5.5, Haiku 5.5, Fable 5)
│   ├── D2. OpenAI Frontier Models (GPT-4o, GPT-4o-mini, o1, o3-mini, GPT-4.5)
│   ├── D3. Google Gemini Models (Gemini 4 Argon, Gemini 2.5 Pro, Flash)
│   ├── D4. Open-Weights & Labs (DeepSeek V3/R1, xAI Grok, Alibaba Qwen, Zhipu GLM)
│   ├── D5. How to Select the Optimal Model for Your Workload
│   ├── D6. Exact Technical Model IDs vs Friendly Names
│   └── D7. Model Family Permissions & Key Entitlements
│
├── E. API REFERENCE SPECIFICATION
│   ├── E1. Authentication Standards & Bearer Tokens
│   ├── E2. Public Base URLs (`https://lightningapi.pro` vs `/v1`)
│   ├── E3. GET /v1/models (Key-Scoped Model Discovery)
│   ├── E4. POST /v1/messages (Anthropic Messages API)
│   ├── E5. POST /v1/chat/completions (OpenAI Chat Completions API)
│   ├── E6. POST /v1/responses (OpenAI Structured Responses API)
│   ├── E7. POST /v1/messages/count_tokens (Token Estimator)
│   ├── E8. Server-Sent Events (SSE) Streaming Mechanics
│   ├── E9. Tool Calling & Function Execution
│   ├── E10. Multimodal Vision & Image Input Specification
│   ├── E11. Error Response Schemas & Headers
│   └── E12. Rate Limits & Concurrency Policies
│
├── F. USAGE, BILLING & QUOTAS
│   ├── F1. The Six Billing Architectures Explained
│   ├── F2. Prepaid Credit Wallets ($0.00 Depletion & Recharge)
│   ├── F3. Consumable Token Packages (Fixed Token Balance)
│   ├── F4. 5-Hour Rolling Window Allowance (Continuous Regeneration)
│   ├── F5. Monitoring Usage in Customer Dashboard
│   ├── F6. Inspecting Keys via the Verify Key Tool (`/check-key`)
│   ├── F7. Validity, Inactivity, and Expiry Policies
│   └── F8. Fair Usage & Non-Billable Failed Request Guarantee
│
├── G. TROUBLESHOOTING & ERROR LIBRARY
│   ├── G1. HTTP 400 — Invalid Request Payload
│   ├── G2. HTTP 401 — API Key Unrecognized or Expired
│   ├── G3. HTTP 402 — Credit Wallet Depleted ($0.00 Remaining)
│   ├── G4. HTTP 403 — Model Not Permitted on Current Key Plan
│   ├── G5. HTTP 403 — API Key Paused or Suspended
│   ├── G6. HTTP 404 — Route or Model Identifier Not Found
│   ├── G7. HTTP 429 — 5-Hour Rolling Allowance Reached
│   ├── G8. HTTP 429 — Prepaid Token Pack Depleted
│   ├── G9. HTTP 429 — Per-Minute Speed Limit Exceeded (RPM)
│   ├── G10. HTTP 500/502/503/504 — Temporary AI Cluster Congestion
│   ├── G11. Application Connection Failures & Proxy Conflicts
│   └── G12. Interactive Error Resolution Assistant Integration
│
└── H. SECURITY, ROTATION & SUPPORT
    ├── H1. API Key Security & Storage Hygiene
    ├── H2. Environment Variables vs Hardcoded Secrets
    ├── H3. Emergency Key Rotation Procedure
    ├── H4. Responding to Accidental Key Leaks
    ├── H5. Frequently Asked Questions (FAQ)
    └── H6. Contacting Engineering Support
```

---

## 3. The Guided Setup Experience: Component Breakdown

### 3.1 Hero & Onboarding Triage
Rather than dropping the user into dense text, the page opens with an editorial hero providing three distinct entry points:
1. **"I am new to APIs"** → Smoothly scrolls to Chapter A, explaining what an API key is, how to get one, and how to use the 1-click CLI installer.
2. **"Connect an Application"** → Smoothly scrolls to the Interactive Wizard (Chapter C), letting the user configure Cursor, Claude Code, etc.
3. **"Developer Reference"** → Smoothly scrolls to Chapter E, providing full cURL, Python, and Node.js REST documentation.

### 3.2 The Interactive Configuration Wizard
An interactive widget embedded in the documentation that dynamically generates exact configuration snippets based on user choices:
- **Step 1: Application** (Claude Code, Cursor, Codex, VS Code, Windsurf, Cline, Roo Code, Continue, Python, Node.js, cURL)
- **Step 2: Operating System** (Windows PowerShell, macOS Terminal, Linux Bash)
- **Step 3: Billing Plan Category** (5-Hour Rolling Window, Credit Wallet, Consumable Token Pack)
- **Step 4: Target Model Family** (Claude Frontier, OpenAI Frontier, Universal / Open-Weights)
- **Output:** 
  - Exact file path for the active OS (e.g. `%APPDATA%\Cursor\User\settings.json` on Windows vs `~/Library/Application Support/Cursor/User/settings.json` on macOS).
  - Exact JSON snippet or terminal commands with copy-to-clipboard functionality.
  - Step-by-step verification commands.

---

## 4. UI/UX Design System & Layout Standards

- **Color Palette:**
  - Background: Pristine white (`#ffffff`) and soft stone neutral (`#faf8f5`).
  - Primary Accent: Restrained violet (`#6d28d9` / `#7c3aed`).
  - Borders: Subtle warm stone borders (`#ede8e1` / `#e7e5e4`).
  - Dark Code Blocks: High-contrast developer terminal (`#0c0d14` background, `#f4f4f5` text, `#11131c` header rail with traffic light window controls).
- **Responsive Navigation:**
  - Desktop: Left sticky sidebar with expandable categories, central reader column, and right-hand on-page anchor table of contents.
  - Mobile: Clean sticky header, drawer navigation, touch-friendly tab selectors, and horizontally scrollable code blocks with zero page overflow.
- **Search Experience:**
  - Client-side fuzzy search across all 8 domains, 14 applications, error codes, and technical models.
  - Instant modal or dropdown overlay showing matching sections with deep jump-links.
