# LightningAPI — Documentation Known Limitations & Technical Notes
**Record of Architectural Nuances, Client-Side Edge Cases, and Future Enhancements**
*Date: November 2, 2026 | Branch: feature/five-plan-architecture-and-pricing | Status: Final Record*

---

## 1. Architectural & Protocol Nuances

### 1.1 Base URL Suffix Requirements
- **Anthropic Protocol:** Anthropic SDKs (e.g. `@anthropic-ai/sdk`, `anthropic` Python SDK, Claude Code) automatically append `/v1/messages` to the configured base URL. Therefore, `ANTHROPIC_BASE_URL` must be set to `https://lightningapi.pro` (without a trailing `/v1`).
- **OpenAI Protocol:** OpenAI SDKs (e.g. `openai` Python SDK, LangChain, Codex) append `/chat/completions` to `/v1`. Therefore, `OPENAI_BASE_URL` must be set to `https://lightningapi.pro/v1`.
- **Mitigation:** The Interactive Setup Wizard automatically handles this distinction for users, preventing common 404 URL misconfigurations.

### 1.2 Claude Code CLI Auth Precedence
- In Claude Code versions 2.1+, conflicting environment variables (specifically `CLAUDE_CODE_USE_BEDROCK=1` or `AWS_BEARER_TOKEN_BEDROCK`) can override custom Anthropic tokens.
- **Mitigation:** LightningAPI's CLI (`npx lightningdeals`) and the documentation explicitly instruct users to delete these legacy overrides in `~/.claude/settings.json`.

---

## 2. Multimodal & Vision File Constraints

- **Payload Size:** The maximum supported payload for base64 image data in gateway requests is 20MB. Images exceeding 20MB will be rejected by the gateway with HTTP 413 Payload Too Large.
- **Image Format Validation:** Only JPEG, PNG, GIF, and WEBP images are supported. Binary magic byte inspection is enforced server-side. SVG and TIFF formats are intentionally rejected for security and model compatibility reasons.

---

## 3. Client-Specific Caveats

### 3.1 Cursor IDE Model Override
- In Cursor, users must explicitly type in the custom model name (e.g. `claude-sonnet-5.5`) in Settings → Models if it does not appear in Cursor's default dropdown list.
- **Mitigation:** Documented with step-by-step instructions in the Cursor setup guide.

### 3.2 Windsurf IDE Protocol
- Windsurf currently routes custom model integrations through its OpenAI-compatible provider adapter. Even when using Claude models through Windsurf, the base URL must be configured as `https://lightningapi.pro/v1`.

---

## 4. Unverified & Excluded Features

- **Audio / Video Completion Endpoints:** Not currently exposed or advertised on the public gateway. Kept unverified and excluded from documentation.
- **Non-Standard Third-Party Plugins:** Only verified first-class coding tools (Cursor, Claude Code, Codex, Windsurf, Cline, Roo Code, Continue, TRAE SOLO, Claude Desktop, Cherry Studio, n8n) are given standalone guides.
