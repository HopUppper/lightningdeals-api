---
name: lightningdeals-documentation
description: Documentation sync rules, verified code examples, and technical guide standards for LightningDeals.
---

# LightningDeals Documentation Standards

## Documentation Synchronization Directives

1. **Truth-in-Documentation**: Every code example, cURL snippet, base URL, and CLI command in docs must be tested and verified against the actual running system.
2. **Never Document Fictional Endpoints**: Do not document non-existent API routes or fake CLI flags.
3. **Core Topic Coverage**:
   - Getting Started & Quick Start
   - One-Command CLI Onboarding (`npx lightningdeals`)
   - Authentication & Key Inspection (`/api/key-status`)
   - API Reference (`/v1/messages`, `/v1/chat/completions`)
   - Supported Models & Context Windows
   - Server-Sent Events (SSE) Streaming & Token Accounting
   - Client Configurations (Claude Code, Cursor, Windsurf, VS Code, Continue, Roo Code, Cline)
   - System Status & Incident History
