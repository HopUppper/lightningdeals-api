# LIGHTNINGAPI.PRO — AI CHAT STUDIO 2.0
## KNOWN LIMITATIONS & OPERATIONAL BOUNDARIES

**Last Updated:** October 2026  
**Target Audience:** Engineering, Operations & Customer Support  

---

### 1. UPSTREAM VENDOR & QUOTA CONSTRAINTS

1. **5-Hour Rolling Limit Windows**:
   - Customer token consumption is evaluated continuously over the preceding 5 hours.
   - When a user exhausts their rolling quota allocation, the API rejects further requests with an HTTP 429 status code indicating the exact countdown until partial quota resets.
   - *Guarantee*: Zero tokens are deducted when an upstream request returns a 429 or fails due to upstream supplier rate limits.
2. **Upstream Multi-Model Multipliers**:
   - Claude 5 series and Claude Opus models incur higher upstream cost structures, reflected in client-side multipliers (1.4x for Sonnet 5.5, 1.8x for Opus 5.5).
   - Customers on smaller tier subscriptions may consume their rolling quota faster when using reasoning or flagship Opus models.
3. **Thinking Budget Rules**:
   - Anthropic protocol mandates that when thinking is enabled (`thinking.type = 'enabled'`), `temperature` must be set to 1.0. The studio automatically enforces this setting in the payload.
   - The minimum allowable thinking budget is 1,024 tokens; values below this will fail upstream schema validation.
   - Models without native reasoning support (e.g., `claude-3-5-haiku`) ignore the thinking toggle.

---

### 2. FILE UPLOADS & DOCUMENT PROCESSING

1. **Upload Size Ceiling**:
   - File uploads are capped at **25 MB** per individual file on `/api/user/studio/upload` to prevent memory exhaustion on backend workers.
2. **Scanned PDF Limitations**:
   - The server utilizes direct PDF text-stream extraction. Standard text-based PDFs, research papers, and exported documents parse reliably.
   - Purely scanned image-only PDFs lacking an embedded text layer (OCR) will yield empty text payloads. Users should upload images directly (PNG/JPEG) to leverage the vision pipeline instead.
3. **Vision Processing**:
   - Vision is supported for images up to 10MB in PNG, JPEG, WEBP, and GIF formats.
   - Upstream vision does not process video or multi-page TIFF files directly.

---

### 3. ARTIFACT SANDBOX & SECURITY ISOLATION

1. **Sandboxed Iframe Execution**:
   - Generated code previews run inside an `<iframe>` configured with `sandbox="allow-scripts"`.
   - The sandbox strictly blocks:
     - Access to parent window cookies, `localStorage`, or `sessionStorage`.
     - Outbound top-level navigation (`window.top.location = ...`).
     - Native browser popups or modal alerts (`window.alert`, `window.prompt`).
2. **Node.js / Server-Side Code**:
   - Artifact preview is intended for client-side HTML, CSS, JavaScript, SVG, and React UI components.
   - Server-side code (e.g., Express servers, Python Flask/Django, Dockerfiles) cannot execute in the browser sandbox and must be copied or downloaded to run in an external environment.

---

### 4. BROWSER COMPATIBILITY & SPEECH APIS

1. **Speech-to-Text (Voice Dictation)**:
   - Voice dictation uses the standard Web Speech Recognition API (`webkitSpeechRecognition`).
   - Supported natively in Google Chrome, Microsoft Edge, and modern Safari.
   - Mozilla Firefox does not support the Web Speech Recognition API by default; the microphone icon will display a compatibility tooltip in unsupported browsers.
2. **Text-to-Speech (Audio Playback)**:
   - Audio playback relies on browser-native `window.speechSynthesis`. Voice timbre and accent depend on the client operating system's installed voices.

---

### 5. SECRECY & VENDOR ISOLATION POLICY

1. **Upstream Anonymity**:
   - LightningAPI.pro acts as an enterprise AI abstraction layer.
   - At no time should error messages, reasoning logs, or response headers leak upstream supplier names, hostnames, or backend routing endpoints to the browser.
   - All errors are sanitized by `server/studio.ts` into standard user-facing messages (e.g., *"Upstream capacity limit reached. Please retry in 30 seconds."*).
