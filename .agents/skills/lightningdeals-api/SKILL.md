---
name: lightningdeals-api
description: Endpoint testing standards, response payloads, error formats, and streaming verification for LightningDeals API.
---

# LightningDeals API Gateway Specification

## Core Endpoints

1. **System Health**: `GET /health` -> `{ status: "OPERATIONAL", timestamp: "..." }`
2. **Model Catalog**: `GET /v1/models` -> Returns list of enabled models with context windows and provider scopes.
3. **Key Status Inspection**: `GET /api/key-status` (Bearer Header `ld_live_...`) -> Returns token remaining balance, plan, RPM limits, and usage metrics.
4. **Anthropic Messages Endpoint**: `POST /v1/messages` -> Accepts Anthropic-compatible JSON payload, verifies key, streams SSE events.
5. **OpenAI ChatCompletions Endpoint**: `POST /v1/chat/completions` -> Accepts OpenAI-compatible JSON payload, verifies key, returns completion or SSE stream.

## Testing Rules

- Validate HTTP status codes (200, 401, 403, 429, 500).
- Confirm JSON error response structure (`{ error: { message, code, status } }`).
- Verify streaming headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`).
