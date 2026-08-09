# LightningDeals — Anthropic API Compatibility Specification

This document details the support status of all Anthropic Messages API features and parameters implemented in the LightningDeals API Gateway.

---

## 1. Feature Support Matrix

| Endpoint / Feature | Status | Notes / Implementation Details |
| :--- | :--- | :--- |
| `POST /v1/messages` | **`SUPPORTED`** | Full JSON request body parsing, streaming, and error handling. |
| `GET /v1/models` | **`SUPPORTED`** | Returns active model catalog list with `id`, `name`, `context_window`. |
| `x-api-key` Auth Header | **`SUPPORTED`** | SHA-256 server-side key validation, status check, RPM rate limits, token deduction. |
| `Authorization: Bearer` Header | **`SUPPORTED`** | Alternative auth format supported natively. |
| `system` Prompt | **`SUPPORTED`** | Preserved in full and forwarded to upstream supplier without prompt leakage. |
| `messages` Array (Multi-Turn)| **`SUPPORTED`** | Preserves `user` / `assistant` role ordering across full conversation history. |
| `tools` Schema Transport | **`SUPPORTED`** | `tools` array serialized and forwarded to supplier without modification or corruption. |
| `tool_choice` Transport | **`SUPPORTED`** | `tool_choice` parameter (`auto`, `any`, `tool`) serialized and forwarded. |
| `max_tokens` Parameter | **`SUPPORTED`** | Passed through to supplier and validated server-side. |
| `temperature` Parameter | **`SUPPORTED`** | Forwarded to supplier API. |
| `top_p` Parameter | **`SUPPORTED`** | Forwarded to supplier API. |
| `stop_sequences` Parameter | **`SUPPORTED`** | Forwarded to supplier API. |
| `metadata` Parameter | **`SUPPORTED`** | Forwarded to supplier API. |
| SSE Streaming (`text/event-stream`)| **`SUPPORTED`** | Native event sequence (`message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`). |
| `usage` Reporting | **`SUPPORTED`** | Upstream `input_tokens` and `output_tokens` recorded in `TokenLedger`. |
| `stop_reason` Reporting | **`SUPPORTED`** | Standard `end_turn` / `max_tokens` / `stop_sequence` values returned. |
| Structured Errors | **`SUPPORTED`** | Standard JSON format (`error.type`, `error.message`) for HTTP 400, 401, 403, 429, 503. |
| Prompt Caching (`cache_control`) | **`NOT TESTED`** | Awaits supplier credential integration. |
| Vision / Multi-modal Images | **`PARTIALLY SUPPORTED`** | Base64 image payload pass-through to Anthropic upstream. |

---

## 2. Automated Contract Verification

Run the contract test suite at any time via:

```bash
npm run test:api
```

Test Results (10/10 Passed):
- `Test A (Simple Text)`: `✓ PASS`
- `Test B (System Prompt + User Message)`: `✓ PASS`
- `Test C (Multi-Turn Conversation)`: `✓ PASS`
- `Test D (Large Message Payload 5KB)`: `✓ PASS`
- `Test E (Tool Definition Transport)`: `✓ PASS`
- `Test F (Multiple Tools & tool_choice)`: `✓ PASS`
- `Test G (Response Contract Field Schema)`: `✓ PASS`
- `Test H (Streaming SSE Event Sequence)`: `✓ PASS`
- `Test I (Error Contract HTTP 400 Invalid Request)`: `✓ PASS`
- `Test J (Error Contract HTTP 401 Invalid Key)`: `✓ PASS`
