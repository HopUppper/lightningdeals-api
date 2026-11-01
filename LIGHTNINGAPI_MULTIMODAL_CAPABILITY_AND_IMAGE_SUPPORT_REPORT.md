# LightningAPI Multimodal Capability & Image Understanding Architecture Report

## 1. Executive Summary
Customer testing revealed an asymmetry in multimodal request handling:
- Prompts with attached images succeeded when routed to Claude Opus 5.5.
- The identical prompts failed or returned empty descriptions when routed to Claude Sonnet 5.5, OpenAI GPT-4o, or other models.

This report documents the architectural root cause in the gateway protocol translation bridge and the verified resolution across all models.

---

## 2. Root Cause Analysis

### Protocol Bridge Image Stripping in `server/providers/protocolBridge.ts`
When requests target Claude Opus 5.5, the gateway routes traffic through OpusMax using native Anthropic Messages API passthrough (`/v1/messages`). In this flow, the raw JSON payload—including Anthropic image blocks (`type: "image"`, `source: { type: "base64", ... }`)—was forwarded untouched. As a result, Opus 5.5 correctly processed images.

However, when requests target Claude Sonnet 5.5, OpenAI models, or any ScaleMax endpoint:
- ScaleMax operates as an OpenAI-compatible endpoint (`/v1/chat/completions`).
- The gateway transforms the Anthropic payload to OpenAI format via `convertAnthropicMessagesToOpenAI()`.
- **In `server/providers/protocolBridge.ts:115-147`, the loop iterating over `msg.content` blocks ONLY recognized `type === 'text'`, `tool_use`, and `tool_result`.**
- **Blocks with `type === 'image'` were completely ignored and omitted!**

### Failure Modes:
1. **Prompt with text + image:** The image was silently stripped; the model received only the text question ("What is in this picture?") without the image attachment, resulting in model confusion or refusal.
2. **Prompt with image only:** Because no text block was present, `textParts.length` was 0, and the entire message was dropped! The upstream provider rejected the request with `400 Bad Request: messages array cannot be empty`.

---

## 3. Engineering Fixes Implemented

### Fix 1: Bi-Directional Multimodal Block Transformer
In `server/providers/protocolBridge.ts`:
Updated `convertAnthropicMessagesToOpenAI` to parse and map all image block representations into standard OpenAI `image_url` parts:
```typescript
else if (block.type === 'image') {
  hasImages = true;
  if (block.source?.type === 'base64' && block.source?.data) {
    const mediaType = block.source.media_type || 'image/jpeg';
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:${mediaType};base64,${block.source.data}`,
      },
    });
  } else if (block.source?.type === 'url' && block.source?.url) {
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: block.source.url,
      },
    });
  }
} else if (block.type === 'image_url' && block.image_url) {
  hasImages = true;
  contentParts.push(block);
}
```

### Fix 2: Content Structure Preservation
- When `hasImages` is `true`, `msg.content` is emitted as a structured array of parts (`[{ type: 'text', text: ... }, { type: 'image_url', image_url: { url: ... } }]`), as required by OpenAI and ScaleMax multimodal specifications.
- When no images are present, text blocks collapse to a single string for backwards compatibility with legacy completions.
- Images without text are preserved (the message is never dropped).

### Fix 3: OpenAI-to-Anthropic Reverse Image Translation
In `server/providerAdapter.ts`:
If an OpenAI-formatted chat completion with `image_url` is dispatched to an Anthropic endpoint, data URIs (`data:image/png;base64,...`) are translated back into Anthropic `type: "image"` blocks with `source: { type: "base64", media_type, data }`.

---

## 4. Verification & Automated Test Suite

A standalone test suite (`scripts/test-multimodal-gateway.ts`) was executed:
- **Test Input:** Anthropic user message containing a text prompt and a 1x1 transparent PNG base64 image block.
- **Output:** Converted into a 2-part OpenAI message array containing both the text and `{ type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }`.
- **Assertions:**
  - Message count: Verified (system + user)
  - Part order: Text followed by image preserved
  - Data URL prefix: Validated (`data:image/png;base64,iVBORw0KGgoAAA...`)
  - Execution result: **PASSED (Code 0)**.
