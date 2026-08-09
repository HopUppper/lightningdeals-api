---
name: lightningdeals-architecture
description: Architecture standards, token accounting flow, and supplier proxy isolation rules for LightningDeals.
---

# LightningDeals Architecture Guidelines

## Core Gateway Pipeline

```text
Customer Client (Claude Code / Cursor / Web Chat / SDK)
        ↓
LightningDeals API Key (ld_live_...)
        ↓
Authentication & Key Authorization (/v1/messages, /v1/chat/completions)
        ↓
Token Balance & Expiration Validation (Prisma ApiKey + TokenLedger)
        ↓
Per-Key RPM Rate Limiting
        ↓
LightningDeals Gateway Router (server/gateway.ts)
        ↓
Upstream Supplier Provider (VendorProvider / Master Key)
        ↓
Upstream AI Model (Anthropic / OpenAI / Gemini)
        ↓
Server-Sent Events (SSE) Response Stream
        ↓
Token Usage Accounting & Ledger Deduction
        ↓
Customer Client Output
```

## Security & Supplier Isolation Protocol

1. **Supplier Master Key Confidentiality**: The master supplier key (`sk-ant-...`) belongs strictly to the supplier infrastructure layer. It must **NEVER** be returned in customer API responses, exposed in logs, sent to client browsers, or output in CLI terminals.
2. **Prepaid Token Ledger Integrity**: Every incoming prompt and completion token must be tracked accurately in `TokenLedger` and deducted from `ApiKey.tokensRemaining`.
3. **Zero-Cost Prompt Caching**: Cache hits and prompt cache writes are not billed against the customer token balance; only fresh input/output completions deduct tokens.
