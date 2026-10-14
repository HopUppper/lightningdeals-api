# LIGHTNINGAPI.PRO — AI CHAT STUDIO 2.0
## FEATURE COMPARISON MATRIX

**Last Updated:** October 2026  
**Status Key:**  
- ✅ **Supported**: Fully implemented, tested, and active in production.  
- 🟡 **Partial**: Functional with known boundaries or client-side fallbacks.  
- 🔮 **Planned**: Roadmap item scheduled for upcoming sprint.  
- ❌ **Deprecated / Disabled**: Removed or intentionally suppressed.  

---

### 1. CORE CHAT CAPABILITIES

| Feature | Status | Backend Support | Frontend Component | Model Compatibility | Operational Notes |
|---|---|---|---|---|---|
| **Real-time SSE Streaming** | ✅ Supported | `POST /api/user/studio/chat/stream` | `UserChatStudio.tsx` (`fetch` + `ReadableStream`) | All models | True token-by-token streaming with `TextDecoder` pipeline; zero fake typing delay. |
| **Stop Generation** | ✅ Supported | `req.on('close')` abort controller | Stop button in composer | All models | Immediately halts upstream connection; meters only generated tokens up to abort. |
| **Extended Thinking / Reasoning** | ✅ Supported | Upstream Anthropic streaming `thinking_delta` | Collapsible reasoning drawer with duration & token count | Claude 3.7 Sonnet, Claude 5 series | Thinking tokens metered transparently; upstream provider names strictly scrubbed. |
| **Conversation Persistence** | ✅ Supported | Supabase PostgreSQL (`StudioConversation`) | Left sidebar with date grouping | All models | Stored per user account across sessions and devices. |
| **Date Grouping & Pinned Chats** | ✅ Supported | `GET /api/user/studio/conversations` | `renderThreadRow()` | All models | Grouped into *Pinned*, *Today*, *Yesterday*, *Previous 7 Days*, *Older*. |
| **Inline Conversation Rename** | ✅ Supported | `PATCH /api/user/studio/conversations/:id` | Inline input in sidebar | All models | Saves automatically on Enter or Blur. |
| **Delete Conversation** | ✅ Supported | `DELETE /api/user/studio/conversations/:id` | Trash icon with modal confirmation | All models | Cascades and deletes all messages in PostgreSQL. |
| **Message Regeneration** | ✅ Supported | `POST /api/user/studio/chat/stream` | Refresh icon on assistant message | All models | Re-executes the last prompt with currently active parameters. |
| **Copy Message / Code** | ✅ Supported | Client-side clipboard API | Copy buttons on messages and code blocks | All models | Toast feedback on copy success. |
| **Speech-to-Text (Dictation)** | ✅ Supported | Web Speech Recognition API | Mic icon in composer | Browser-dependent (Chrome, Edge, Safari) | Real-time speech transcription directly into composer input. |
| **Text-to-Speech (Audio)** | ✅ Supported | Web SpeechSynthesis API | Speaker icon on assistant message | All models | Native browser text-to-speech with cancelation on new generation. |

---

### 2. MODEL SELECTION & PARAMETERS

| Feature | Status | Backend Support | Frontend Component | Model Compatibility | Operational Notes |
|---|---|---|---|---|---|
| **Authoritative Model Catalog** | ✅ Supported | `GET /api/user/studio/models` | `ModelSelectorModal` | All 12 verified models | Catalog dynamically lists multipliers, context limits, and capability tags. |
| **Searchable Model Modal** | ✅ Supported | In-memory filtered list | Modal with category tabs & search | All models | Filter by *All*, *Flagship*, *Reasoning*, *Coding*, *Fast*. |
| **Next-Gen Claude 5.5 / 5 Series** | ✅ Supported | Upstream Claude proxy | Model catalog (`claude-opus-5.5`, `claude-sonnet-5.5`, etc.) | Claude 5 series | Integrated with verified token multipliers (1.4x – 1.8x). |
| **Thinking Budget Control** | ✅ Supported | Passed via `thinking.budget_tokens` | `ContextManagerDrawer.tsx` slider | Claude 3.7+ only | User configurable from 1,024 to 8,192 tokens. |
| **Temperature Tuning** | ✅ Supported | Passed via request payload | Parameters slider (0.0 – 1.0) | Standard models (disabled when thinking is active) | Auto-adjusted to 1.0 when thinking is enabled per Anthropic specification. |
| **Max Tokens Slider** | ✅ Supported | Passed via `max_tokens` | Slider (512 – 8,192 tokens) | All models | Controls maximum output token budget. |

---

### 3. CONTEXT MANAGEMENT & PRODUCTIVITY TOOLS

| Feature | Status | Backend Support | Frontend Component | Model Compatibility | Operational Notes |
|---|---|---|---|---|---|
| **Token-Saver Mode** | ✅ Supported | Prompt injection + unified diff formatting | Header toggle + Token-Saver card | All models | Instructs model to output git diffs and omit conversational fluff; saves 60-75% tokens. |
| **Context Window Health Gauge** | ✅ Supported | Token counter calculation | Live gauge in Context Drawer | All models | Displays active context tokens vs 200,000 token limit. |
| **Context Compaction** | ✅ Supported | Truncation & summary heuristics | `Compress Context` button in Drawer | All models | Compresses older thread messages into condensed context memory. |
| **Persistent Project Memory** | ✅ Supported | Supabase PostgreSQL (`StudioMemory`) | `ContextManagerDrawer.tsx` | All models | Memories (e.g., Tech Stack, Architectural Rules) persist across threads and sessions. |
| **Developer Personas** | ✅ Supported | System prompt presets | Preset selector (*Full-Stack*, *Debugger*, *Architect*, *Token-Saver*) | All models | Injects specialized developer instructions into request system prompt. |
| **Actionable New Chat Cards** | ✅ Supported | Client template prefill | 5 Cards (*Document*, *Debug*, *Compare*, *Writing*, *Data*) | All models | Populates prompt composer with structured starting queries. |

---

### 4. ARTIFACTS & CODE SANDBOX

| Feature | Status | Backend Support | Frontend Component | Model Compatibility | Operational Notes |
|---|---|---|---|---|---|
| **Artifact Code Detection** | ✅ Supported | Regex parser for code/HTML blocks | `ArtifactCanvas.tsx` | All models | Auto-detects standalone web apps, SVG graphics, Mermaid diagrams, and components. |
| **Live Sandboxed Preview** | ✅ Supported | Sandboxed `<iframe>` (`allow-scripts`) | `ArtifactCanvas` Preview Tab | HTML, CSS, JavaScript, React, SVG | Live interactive execution of generated UI components. |
| **Live In-Canvas Code Editor** | ✅ Supported | Local editor state | Code tab with syntax styling | All code artifacts | Users can modify HTML/JS code directly inside the canvas. |
| **Apply & Run** | ✅ Supported | Dynamic iframe reload with updated blob | Run button in canvas header | All code artifacts | Re-renders edited code instantly in the sandbox. |
| **Export & Download** | ✅ Supported | Browser Blob download | Download button in canvas toolbar | All code artifacts | Downloads artifact as `.html`, `.tsx`, or source file with appropriate extension. |
| **Fullscreen Mode** | ✅ Supported | CSS overlay expansion | Maximize toggle button | All code artifacts | Expands canvas to full viewport for testing responsive layouts. |

---

### 5. FILE ATTACHMENTS & VISION

| Feature | Status | Backend Support | Frontend Component | Model Compatibility | Operational Notes |
|---|---|---|---|---|---|
| **Multi-File Upload** | ✅ Supported | `POST /api/user/studio/upload` | Attachment button & drag/drop chip | All models | Validates file size (25MB max) and file types. |
| **Source Code & Text Files** | ✅ Supported | UTF-8 parser with syntax highlighting | File chip preview | All models | Supports `.ts`, `.tsx`, `.js`, `.py`, `.json`, `.csv`, `.md`, `.sql`, `.html`. |
| **PDF Text Extraction** | ✅ Supported | Text content stream extractor | Document badge in composer | All models | Extracts plain text from standard PDF documents for model context. |
| **Vision & Image Understanding** | ✅ Supported | Base64 image serialization | Thumbnail preview in composer | Vision-capable models (Sonnet, Opus, Fable) | Formatted as Anthropic image block (`image/png`, `image/jpeg`, `image/webp`). |

---

### 6. QUOTA, BILLING & SECURITY

| Feature | Status | Backend Support | Frontend Component | Model Compatibility | Operational Notes |
|---|---|---|---|---|---|
| **5-Hour Rolling Limit Quota** | ✅ Supported | Rolling token ledger in PostgreSQL | Token consumption badge & progress bar | All models | Requests check quota before execution; no debit on 429 errors. |
| **Transparent Multiplier Accounting** | ✅ Supported | Exact token math on completion | Detailed breakdown popover in chat | All models | Shows input tokens, output tokens, multiplier, and total debited tokens. |
| **Strict Vendor Isolation** | ✅ Supported | `server/studio.ts` sanitization | Studio interface & error toasts | All models | Upstream URLs, vendor API keys, and internal proxy hostnames are never exposed. |
| **User Data Isolation** | ✅ Supported | Row-level `userId` validation in PostgreSQL | API endpoints return only user's records | All models | Enforced via Prisma relational queries with JWT verification. |
