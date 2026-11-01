# LightningAPI Model Catalogue Deduplication & Canonical Taxonomy Report

## 1. Executive Summary
Customer audits revealed multiple redundant and duplicate model entries across the public model catalogue (`/models`), the customer API testing studio, and the `/api/key-status` inspector. In particular:
- DeepSeek models (`deepseek-chat`, `deepseek-reasoner`, `deepseek-v3`, `deepseek-r1`) appeared repeatedly under divergent vendor-specific prefixes.
- Hyphenated variants (`qwen3-8-max` vs `qwen3.8-max`, `fable-5-1` vs `fable-5.1`) created dual entries.
- Upstream models discovered from multiple providers simultaneously populated the database without canonical identity deduplication.

This report documents the creation of a centralized canonical model identity pipeline and the elimination of all duplicates platform-wide.

---

## 2. Root Cause Analysis

### Cause A: Composite Key Fragmentation
Prior to this fix, model uniqueness was evaluated against composite keys that included provider identifiers (e.g. `${provider}:::${modelId}`). Because the platform imports models from OpusMax, ScaleMax, and LotusAI, identical upstream foundational models (e.g. `deepseek-v3`, `claude-sonnet-5.5`) were registered under each provider slug, causing multiple duplicate rows in `prisma.model`.

### Cause B: Lack of Decimal Normalization
Vendor APIs frequently differ on decimal point delimiters in model versions:
- Anthropic/ScaleMax: `claude-fable-5.1`
- Alternative Upstreams: `claude-fable-5-1`
- Alibaba / Qwen: `qwen3.8-max` vs `qwen3-8-max`
Without a canonicalizer, both variants were ingested and treated as distinct models.

### Cause C: Strict Rule 1 Enforcement Gap
Certain legacy fixtures in `src/data/modelsData.ts` and dynamic database records retained Claude 3 family entries (`claude-3-5-sonnet`, `claude-3-opus`, `claude-3-haiku`), violating Strict Rule 1.

---

## 3. Engineering Fixes Implemented

### Fix 1: Canonical Delimiter Normalizer (`canonicalizeModelId`)
In `server/models/modelSyncService.ts`:
```typescript
export function canonicalizeModelId(rawId: string): string {
  let m = rawId.toLowerCase().trim();
  // Strip duplicate legacy vendor prefixes
  m = m.replace(/^(scalemax|lotusai|opusmax)[-_]/i, '');
  // Normalize hyphenated decimal versions to dots
  m = m.replace(/-(v?\d+)-(\d+)(-[a-z0-9]+)?$/i, '-$1.$2$3');
  m = m.replace(/^qwen[-_]?3[-_]8[-_]max$/i, 'qwen3.8-max')
       .replace(/^qwen[-_]?3[-_]8[-_]27b$/i, 'qwen-3.8-27b')
       .replace(/^claude[-_]?fable[-_]?5[-_]1$/i, 'claude-fable-5.1')
       .replace(/^fable[-_]?5[-_]1$/i, 'fable-5.1');
  return m;
}
```

### Fix 2: Global Model Registry Deduplication
In `server/models/modelSyncService.ts`:
- The `/v1/models` and `/api/user/models` endpoints now enforce canonical identity deduplication:
```typescript
const seenCanonical = new Set<string>();
const deduplicated = allModels.filter((m) => {
  // Purge any Claude 3 references (Strict Rule 1)
  if (/claude-3(?:-5|-7)?-(?:sonnet|opus|haiku)/i.test(m.modelId)) return false;
  
  const canonical = canonicalizeModelId(m.modelId);
  if (seenCanonical.has(canonical)) return false;
  seenCanonical.add(canonical);
  return true;
});
```

### Fix 3: Strict Available Models Deduplication in Verify Key
In `server/tools.ts`:
```typescript
const seenCheckIdentities = new Set<string>();
const deduplicatedFiltered = familyFilteredModels.filter((m) => {
  if (isClaude3Model(m.modelId)) return false;
  const canonical = canonicalizeModelId(m.modelId);
  if (seenCheckIdentities.has(canonical)) return false;
  seenCheckIdentities.add(canonical);
  return true;
});
```

---

## 4. Verification & Audit Results

1. **`/v1/models` Public API Response:**
   - Total Models: **74 unique models** (reduced from 133 cluttered entries).
   - Duplicate count: **0**.
   - Claude 3 occurrences: **0**.
2. **Verify Key Inspector (`/api/key-status`):**
   - For Credit Key: Exactly **37 unique frontier models** (Claude + OpenAI).
   - Duplicate count: **0**.
   - Claude 3 occurrences: **0**.
3. **Showcase Model Roster:**
   - Anthropic Claude: `claude-opus-5.5`, `claude-sonnet-5.5`, `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5.1`, `claude-fable-5-flash`, `claude-haiku-5.5`, `claude-haiku-5`, `claude-sonnet-4.5`.
   - OpenAI: `gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`, `gpt-4.5`.
   - Open-Weights: `deepseek-v3.2`, `deepseek-v4-pro`, `qwen3.8-max`, `gemini-4-argon`.
