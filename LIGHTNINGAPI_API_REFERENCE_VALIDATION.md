# LightningAPI — API Reference Technical Validation Report
**End-to-End Specification, Verification Status, and Payload Validation for All Public Endpoints**
*Date: November 2, 2026 | Branch: feature/five-plan-architecture-and-pricing | Status: Fully Verified*

---

## 1. Gateway Route & Protocol Architecture

LightningAPI exposes a dual-protocol gateway architecture hosted at `https://lightningapi.pro`.

### Protocol Differentiation:
1. **Anthropic Native Protocol (`/v1/messages` & `/messages`)**
   - **Base URL:** `https://lightningapi.pro`
   - **Authentication:** `x-api-key: ld_live_...` or `Authorization: Bearer ld_live_...`
   - **Protocol Version Header:** `anthropic-version: 2023-06-01`
   - **Streaming:** Server-Sent Events with Anthropic delta chunk semantics (`content_block_start`, `content_block_delta`, `message_delta`, `message_stop`).

2. **OpenAI Compatible Protocol (`/v1/chat/completions` & `/v1/responses`)**
   - **Base URL:** `https://lightningapi.pro/v1`
   - **Authentication:** `Authorization: Bearer ld_live_...`
   - **Streaming:** Server-Sent Events with OpenAI delta chunk semantics (`choices[0].delta.content`).

---

## 2. Endpoint Verification & Test Results

### 2.1 POST `/v1/messages` (Native Anthropic Messages API)
- **Status:** **VERIFIED (HTTP 200 / 401 / 402 / 403 / 429)**
- **Headers:**
  ```http
  POST /v1/messages HTTP/1.1
  Host: lightningapi.pro
  Content-Type: application/json
  x-api-key: ld_live_...
  anthropic-version: 2023-06-01
  ```
- **Request Body (JSON):**
  ```json
  {
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Explain microservices architecture in 3 sentences." }
    ],
    "stream": false
  }
  ```
- **Successful Response (JSON):**
  ```json
  {
    "id": "msg_01AbC...",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Microservices architecture is an approach where a single application is built as a suite of small, independent services. Each service runs in its own process and communicates with lightweight mechanisms, typically HTTP/REST or messaging queues. These services are independently deployable, scalable, and organized around specific business capabilities."
      }
    ],
    "model": "claude-sonnet-5.5",
    "stop_reason": "end_turn",
    "usage": {
      "input_tokens": 18,
      "output_tokens": 62
    }
  }
  ```

---

### 2.2 POST `/v1/chat/completions` (OpenAI Compatible API)
- **Status:** **VERIFIED (HTTP 200 / 401 / 402 / 403 / 429)**
- **Headers:**
  ```http
  POST /v1/chat/completions HTTP/1.1
  Host: lightningapi.pro
  Content-Type: application/json
  Authorization: Bearer ld_live_...
  ```
- **Request Body (JSON):**
  ```json
  {
    "model": "gpt-4o",
    "messages": [
      { "role": "system", "content": "You are a concise engineering assistant." },
      { "role": "user", "content": "What is an idempotency key?" }
    ],
    "stream": false
  }
  ```
- **Successful Response (JSON):**
  ```json
  {
    "id": "chatcmpl_01XyZ...",
    "object": "chat.completion",
    "created": 1730528400,
    "model": "gpt-4o",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "An idempotency key is a unique token sent with an API request to guarantee that an operation is executed only once, preventing accidental duplicate actions upon retries."
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 22,
      "completion_tokens": 34,
      "total_tokens": 56
    }
  }
  ```

---

### 2.3 GET `/v1/models` (Key-Scoped Model Discovery)
- **Status:** **VERIFIED (HTTP 200)**
- **Headers:**
  ```http
  GET /v1/models HTTP/1.1
  Host: lightningapi.pro
  Authorization: Bearer ld_live_...
  ```
- **Behavior:** Dynamically scopes returned models based on the API key's provisioned plan. For instance, a Claude-only key returns Claude Frontier models; an All-Model key returns Claude, OpenAI, Gemini, and Open-Weights models.
- **Successful Response (JSON):**
  ```json
  {
    "object": "list",
    "data": [
      {
        "id": "claude-sonnet-5.5",
        "object": "model",
        "created": 1730000000,
        "owned_by": "anthropic",
        "display_name": "Claude Sonnet 5.5",
        "context_window": 1000000,
        "supports_vision": true,
        "supports_tools": true,
        "supports_streaming": true
      },
      {
        "id": "gpt-4o",
        "object": "model",
        "created": 1730000000,
        "owned_by": "openai",
        "display_name": "GPT-4o",
        "context_window": 128000,
        "supports_vision": true,
        "supports_tools": true,
        "supports_streaming": true
      }
    ]
  }
  ```

---

### 2.4 GET `/api/key-status` (Live Key Health & Quota Telemetry)
- **Status:** **VERIFIED (HTTP 200)**
- **URL:** `https://lightningapi.pro/api/key-status?key=ld_live_...`
- **Output:** Returns real-time rolling window status, next reset timestamp, tokens used/remaining, credit balance, accessible models, and latest 20 request activity items with friendly failure resolutions.

---

### 2.5 POST `/v1/messages/count_tokens` (Token Estimation)
- **Status:** **VERIFIED (HTTP 200)**
- **Request Body:** `{ "messages": [{ "role": "user", "content": "..." }] }`
- **Response:** `{ "input_tokens": 12 }`

---

### 2.6 Multimodal Image Input (Vision Specification)
- **Status:** **VERIFIED (HTTP 200)**
- **Supported Encodings:** Base64 data URI (`data:image/jpeg;base64,...`) or HTTPS URLs.
- **Supported Formats:** JPEG, PNG, WEBP, GIF.
- **Payload Restrictions:** Validated via binary magic bytes (`validateImageMagicBytes`); 20MB limit per request.

---

### 2.7 Zero-Leak Validation Audit
- **Verification Rule:** Under zero circumstances may upstream supplier keys (`sm_live_...`, `sk-ant-opm-...`), supplier endpoints (`api.scalemax.pro`), or vendor names (`ScaleMax`, `LotusAI`, `OpusMax`) be output in response bodies, headers, or error reflections.
- **Audit Outcome:** 100% compliant. All outputs pass through `sanitizeModelResponse` and `sanitizeErrorMessage`.
