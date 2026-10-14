# LIGHTNINGAPI.PRO — AI CHAT STUDIO AUDIT REPORT
**Document Reference**: `studio_audit.md`  
**Date**: October 2026  
**Auditor**: Lead System Architect  
**Status**: Completed — Implementation Underway  

---

## 1. Executive Summary
An exhaustive architectural audit of `/dashboard/studio`, its frontend components, server routes, database schema, gateway proxies, and upstream providers was conducted. 

While the interface has high visual quality with recent layout fixes, the audit revealed several critical architectural gaps:
1. **Conversation Persistence**: Threads and message history are currently stored strictly in client-side `localStorage` (`lightning_chat_threads_v3`). There is no database persistence for customer studio conversations. Reloading across devices or clearing cache erases history.
2. **Streaming Execution**: The studio currently requests completions via `/api/user/keys/test`, which executes with `stream: false`. Responses are returned in a single monolithic JSON payload after 10–40 seconds of waiting, rather than true Server-Sent Events (SSE) streaming.
3. **Model Catalog Alignment**: The frontend model picker in `UserChatStudio.tsx` maintains a static local array that differs from the dynamic capabilities returned by `VendorProvider` in the PostgreSQL database.
4. **Productivity Controls**:
   - **Thinking Mode**: Supported on Claude 3.7 Sonnet and Opus reasoning models, but was previously simulated when upstream didn't return explicit thinking blocks.
   - **Token-Saver**: Appended a system prompt string but lacked true context compaction, measured token differential logging, or user-configurable levels.
   - **Memory**: Maintained purely in local component state without server-backed user memory profile persistence.
   - **Artifact Canvas**: Rendered static HTML or code snippets; lacked full bidirectional workspace editing and multi-artifact tracking.
5. **File & Multimodal Handling**: Client-side `FileReader` converted files directly to base64 strings in browser memory, with no server-side document parsing (PDF text extraction, DOCX parsing, spreadsheet CSV ingestion) or virus/size validation before submission.

---

## 2. Component & Feature Classification Matrix

| Feature | Visible UI Status | Actual Implementation Status | Classification | Gap / Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Chat Layout & Navigation** | ✅ Present | ✅ Fixed in place, viewport locked | **Fully Implemented** | Retain layout fixes (`h-screen overflow-hidden`). |
| **Conversation History** | ✅ Sidebar present | ⚠️ `localStorage` only | **UI-Only / Partial** | Create `StudioConversation` & `StudioMessage` in Prisma, build CRUD API routes. |
| **Response Streaming** | ⚠️ Animated card | ❌ Monolithic HTTP POST (`stream: false`) | **UI-Only / Simulated** | Implement true SSE `/api/user/studio/chat/stream` with real-time text & thinking deltas. |
| **Stop Generation** | ⚠️ Button visible | ❌ Does not abort upstream socket | **UI-Only / Partial** | Bind client `AbortController` to upstream socket cancellation with exact usage accounting. |
| **Model Switcher** | ✅ Dropdown present | ⚠️ Static local array | **Partially Implemented** | Ground selector in verified upstream provider mappings and live availability. |
| **File Attachments** | ✅ Drag & Drop / Picker | ⚠️ Client base64 encoding | **Partially Implemented** | Add server-side validation, PDF/TXT/CSV text extraction pipeline, and size limits. |
| **Token-Saver Mode** | ✅ Toggle present | ⚠️ System prompt string only | **Partially Implemented** | Implement context pruning, history compaction, and real measured token savings metrics. |
| **Thinking Process** | ✅ Animated trace | ⚠️ Simulated fallback when null | **Partially Implemented** | Stream genuine upstream `thinking` blocks via SSE, parse thinking deltas cleanly. |
| **Memory Drawer** | ✅ Drawer present | ⚠️ Stored in thread object | **Partially Implemented** | Add `StudioMemory` Prisma model, provide CRUD endpoints for persistent facts. |
| **Artifact Canvas** | ✅ Split pane | ⚠️ Static iframe/code table | **Partially Implemented** | Support code editing, copy, download, live sandbox reload, and multiple artifacts. |
| **Quota & Billing** | ✅ Balance badges | ✅ Active key deduction in db | **Fully Implemented** | Seamlessly link studio streaming deductions with `ApiKey` and `ApiRequest` tables. |
| **Theme (Light/Dark)** | ✅ Toggle present | ✅ Slate-50 light / Obsidian dark | **Fully Implemented** | Preserved high-contrast design. |

---

## 3. Deep Dive: Architectural Gaps

### 3.1 Backend & Database Infrastructure
- **Missing Database Models**: PostgreSQL database contains `User`, `ApiKey`, `ApiRequest`, `VendorProvider`, and `Subscription`, but zero tables for user chat threads or messages.
- **Single-Turn Playground Heritage**: `/api/user/keys/test` was originally authored as a quick test console for verifying API keys. It was repurposed for the Chat Studio, meaning it lacked session tracking, conversation branching, message pagination, or server-side conversation search.

### 3.2 Streaming Architecture
- `server/gateway.ts` already has a battle-tested SSE parser for `/v1/messages` (Anthropic format: `event: content_block_delta`, `delta: { type: "text_delta", text }`).
- However, the studio route in `server/user.ts` was not using SSE. It performed an `await fetch()` on the entire response, converting what should be sub-50ms Time-To-First-Token (TTFT) into a 20-second synchronous wait.

### 3.3 Upstream Model Realities
- The primary active provider is **Opus Max** (`https://api.opusmax.pro`), which provides custom HTTP Anthropic routing.
- Supported and mapped models in database:
  - `claude-opus-5.5` -> `claude-opus-5-5`
  - `claude-opus-5` -> `claude-opus-5`
  - `claude-sonnet-5.5` -> `claude-sonnet-5`
  - `claude-sonnet-5` -> `claude-sonnet-5`
  - `claude-fable-5` -> `claude-fable-5`
  - `claude-fable-5.1` -> `claude-fable-5-1`
  - `claude-haiku-5.5` -> `claude-haiku-4-5-20251001`
  - `claude-haiku-5` -> `claude-haiku-4-5-20251001`
  - `claude-3-7-sonnet-20250219`
  - `claude-3-5-sonnet-20241022`
  - `claude-3-opus-20240229`
  - `claude-3-5-haiku-20241022`
- The studio selector must reflect these verified capabilities with correct token multipliers (Opus 5.5: 2.0x, Sonnet 5.5: 1.0x, Haiku 5.5: 0.25x, etc.).

---

## 4. End-to-End Upgrade Plan

### Step 1: Database Migration (Prisma Schema)
Add:
- `StudioConversation`: `id`, `userId`, `title`, `model`, `systemPrompt`, `thinkingEnabled`, `tokenSaverEnabled`, `temperature`, `pinned`, `createdAt`, `updatedAt`.
- `StudioMessage`: `id`, `conversationId`, `role`, `content`, `thinking`, `modelUsed`, `inputTokens`, `outputTokens`, `totalTokens`, `multiplier`, `latencyMs`, `attachmentsJson`, `createdAt`.
- `StudioMemory`: `id`, `userId`, `category`, `fact`, `createdAt`, `updatedAt`.
Push to PostgreSQL database using `prisma db push`.

### Step 2: Server-Side Studio API (`server/studio.ts`)
Create dedicated, high-performance router mounted at `/api/user/studio`:
1. `GET /conversations`: Paginated list of user conversations with search.
2. `POST /conversations`: Create conversation.
3. `GET /conversations/:id`: Retrieve conversation and all messages.
4. `PATCH /conversations/:id`: Update title, pin, model, or settings.
5. `DELETE /conversations/:id`: Delete conversation and messages.
6. `POST /chat/stream`: Real-time SSE streaming endpoint with upstream `AbortController`, live thinking streaming, genuine token accounting, and immediate DB message persistence.
7. `GET /memories`, `POST /memories`, `DELETE /memories/:id`: Full persistent memory CRUD.
8. `POST /upload`: Secure multi-format document parser (PDF, text, code, CSV, images).

### Step 3: Frontend Overhaul (`UserChatStudio.tsx`)
1. Integrate SSE stream consumer with live text chunking and live thinking updates.
2. Synchronize conversations with server database via SWR/state sync with fallback to local cache.
3. Add search, pinning, conversation renaming, and confirmation dialogs.
4. Wire Token-Saver with genuine context compaction and savings telemetry.
5. Connect Memory manager to persistent DB endpoints.
6. Enhance Artifact Canvas with live code editor, copy, download, and fullscreen view.
7. Implement message actions: Copy, Regenerate, Edit previous prompt, and Stop Generation.

### Step 4: Verification & Deliverables
1. Run full typecheck and production build (`npx tsc --noEmit && npm run build`).
2. Generate all required internal documentation:
   - `studio_audit.md`
   - `studio_implementation_report.md`
   - `studio_feature_matrix.md`
   - `studio_known_limitations.md`
3. Commit and deploy to `main`.
