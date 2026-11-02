# LightningAPI — Customer Interface Error Sanitisation Audit

**Document Version:** 1.0.0  
**Classification:** Frontend & API Surface Security Audit  
**Status:** AUDITED, REMEDIATED & VERIFIED  
**Surfaces Audited:** AI Website Builder, AI Chat Studio, API Test Console (Playground), Key Status Checker, Public API Endpoints (`/v1/models`, `/v1/messages`, `/v1/chat/completions`)

---

## 1. Audit Scope & Objective

This audit inspected every customer-facing surface in LightningAPI to ensure that:
1. No raw upstream error strings, stack traces, hostnames, or vendor diagnostic payloads can ever be displayed to a customer.
2. Every error display component provides context-aware user actions (`[Retry]` vs `[Switch Key]`).
3. Model catalog tags, plan descriptions, and feature lists contain zero supplier brand names (`ScaleMax`, `OpusMax`, `LotusAI`).

---

## 2. Customer Surface Audit Matrix

| Interface / Component | Source File | Risk Level Before Fix | Vulnerability Discovered | Remediation Implemented | Status After Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AI Website Builder** | `src/pages/dashboard/UserWebsiteBuilder.tsx` | **CRITICAL** | `formatErrorMessage` returned `err.message` / `err.error` unscrubbed. When 502 HTML was parsed, raw Cloudflare title was toasted. | Implemented `sanitizeText` scrubber, caught HTTP 502/503/504 and mapped to clean `"Our AI service is temporarily unavailable. Please retry in a moment."` | **SECURED** |
| **AI Chat Studio** | `src/pages/dashboard/UserChatStudio.tsx` | **CRITICAL** | Unconditionally offered `[Switch Key]` and `[Retry]` on every error. SSE error events did not pass structured action codes. | Added `errorCode` & `errorAction` to `ChatMessage`. Isolated `[Switch Key]` strictly to genuine key auth/quota failures. 502/503/504 displays ONLY `[Retry]` with backoff. | **SECURED** |
| **API Test Console** | `src/pages/dashboard/UserApiTestConsole.tsx` | **MEDIUM** | `setError(data.error?.message)` and `setError(err.message)` lacked sanitization wrappers. | Wrapped both error state setters in `sanitizeText(...)`. | **SECURED** |
| **Key Status Checker** | `server/tools.ts` (`/api/verify-key`) | **LOW** | Returned `plan: planName.replace(/ScaleMax/gi, 'LightningAPI')` but lacked LotusAI scrubbers. | Added comprehensive multi-supplier sanitization for verified key responses. | **SECURED** |
| **Public Models Page** | `src/data/modelsData.ts` | **HIGH** | Line 925 contained tag `"ScaleMax Live"` on Gemini 3.8 Flash. | Replaced `"ScaleMax Live"` with `"LightningMesh Live"`. | **SECURED** |
| **Plan Pricing & Features** | `src/context/PlansContext.tsx` | **HIGH** | Line 680 feature list contained `"Dedicated Upstream LotusAI Ingress"`. | Replaced with `"Dedicated VIP Ingress Routing"`. | **SECURED** |
| **Model Sync Background Service** | `server/models/modelSyncService.ts` | **CRITICAL** | Model descriptions inserted `"via ScaleMax enterprise network"` into database. | Replaced provider attribution with `'LightningAPI'` and descriptions with `"via LightningAPI enterprise network"`. | **SECURED** |
| **Public HTTP Headers** | `server/gateway.ts` | **CRITICAL** | `res.setHeader('x-lightning-routed-provider', ...)` returned `scalemax` or `lotusai` in public responses. | Completely eliminated `x-lightning-routed-provider`; replaced with generic `x-lightning-engine: neural-mesh`. | **SECURED** |

---

## 3. Deep-Dive Surface Remediation

### 3.1 AI Website Builder (`UserWebsiteBuilder.tsx`)

#### Before Remediation:
```typescript
const formatErrorMessage = (err: any): string => {
  if (!err) return 'An unexpected error occurred. Please try again.';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  if (typeof err.error === 'string') return err.error;
  if (typeof err.error === 'object' && err.error?.message) return err.error.message;
  try { return JSON.stringify(err); } catch { return 'An unexpected error occurred.'; }
};
```
*Issue*: If the server returned `{ error: "HTTP 502 scalemax.pro | 502: Bad gateway" }`, this function returned the raw string directly to the toast notification system.

#### After Remediation:
```typescript
const formatErrorMessage = (err: any): string => {
  if (!err) return 'An unexpected error occurred. Please try again.';
  let raw = '';
  if (typeof err === 'string') raw = err;
  else if (typeof err.message === 'string') raw = err.message;
  else if (typeof err.error === 'string') raw = err.error;
  else if (typeof err.error === 'object' && err.error?.message) raw = err.error.message;
  else {
    try { raw = JSON.stringify(err); } catch { raw = 'An unexpected error occurred.'; }
  }

  // Intercept 502/503/504 gateway failures
  if (/\b(?:502|503|504)\b/i.test(raw) || /bad gateway|gateway timeout|service unavailable/i.test(raw)) {
    return 'Our AI service is temporarily unavailable. Please retry in a moment.';
  }

  return sanitizeText(raw);
};
```

---

### 3.2 AI Chat Studio (`UserChatStudio.tsx`)

#### Before Remediation:
```tsx
{msg.isError && (
  <div className="mt-3 pt-2 border-t border-rose-500/20 flex items-center justify-between gap-2 flex-wrap">
    <span className="text-xs text-rose-500">Request failed or limit reached.</span>
    <div className="flex items-center gap-2">
      <button onClick={() => setKeyPickerOpen(true)}>
        <Key className="w-3 h-3" />
        <span>Switch Key</span>
      </button>
      <button onClick={handleRetry}>
        <RotateCcw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </div>
  </div>
)}
```
*Issue*: Switching keys during a 502 Bad Gateway does nothing to resolve an upstream network glitch, confusing customers into believing their active key is broken.

#### After Remediation:
```tsx
{msg.isError && (
  <div className="mt-3 pt-2 border-t border-rose-500/20 flex items-center justify-between gap-2 flex-wrap">
    <span className="text-xs text-rose-500">
      {msg.errorAction === 'switch_key'
        ? 'API key quota exhausted or inactive.'
        : 'Temporary network congestion or upstream interruption.'}
    </span>
    <div className="flex items-center gap-2">
      {msg.errorAction === 'switch_key' && (
        <button
          type="button"
          onClick={() => setKeyPickerOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold text-xs flex items-center gap-1 cursor-pointer"
          title="Switch to another active API key"
        >
          <Key className="w-3 h-3" />
          <span>Switch Key</span>
        </button>
      )}
      <button
        type="button"
        onClick={handleRetry}
        className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs flex items-center gap-1 cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </div>
  </div>
)}
```

---

## 4. Conclusion

Every customer-facing surface in LightningAPI now renders sanitized, brand-consistent error messages and context-appropriate action buttons. The customer will never see upstream hostnames, vendor brand names, or misleading action buttons.
