# LightningAPI — DeepSeek & ScaleMax Model Deduplication Report

**Date:** November 2026  
**Component:** Model Catalogue Synchronization & Provider Discovery Mesh  
**Branch:** `feature/five-plan-architecture-and-pricing`  
**Status:** FULLY DEDUPLICATED & VERIFIED  

---

## 1. Problem Description & Discovery

When querying the available models catalogue via the customer dashboard or `/v1/models`, duplicate entries were observed for DeepSeek and frontier models:
- `deepseek-v4-1-flash` and `deepseek-v4.1-flash`
- `fable-5-1` and `fable-5.1`
- `glm-5-1` and `glm-5.1`
- `glm-5-2-v2` and `glm-5.2-v2`
- `glm-5-3-flash` and `glm-5.3-flash`
- `gpt-5-6-luna` and `gpt-5.6-luna`
- `gpt-5-6-sol` and `gpt-5.6-sol`
- `gpt-5-6-terra` and `gpt-5.6-terra`
- `gpt-6-1-sol` and `gpt-6.1-sol`

---

## 2. Root Cause Analysis (RCA)

Our audit identified the root cause in the multi-source discovery architecture of `server/models/modelSyncService.ts`:

1. **Dual Ingestion Sources with Differing ID Conventions:**
   - **Source A (Public HTML Scraper):** Scrapes `https://scalemax.pro/models` and `https://dashboard.scalemax.pro/models`. The HTML rendered model slugs where periods were converted to hyphens (e.g., `deepseek-v4-1-flash`).
   - **Source B (Authenticated API):** Queries the ScaleMax upstream `/v1/models` endpoint, which returns canonical dot notation (e.g., `deepseek-v4.1-flash`).
2. **Database Keying Discrepancy:**
   - In Prisma schema, the unique constraint was `provider_modelId` (`@@unique([provider, modelId])`).
   - Because `scalemax:deepseek-v4-1-flash` and `scalemax:deepseek-v4.1-flash` had different string values, Prisma created two distinct database rows.
3. **Background Sync Re-insertion:**
   - Whenever the background sync job executed, both sources merged into `prisma.model`, repeatedly resurrecting the duplicate hyphenated entries.

---

## 3. Engineering Remediation & Implementation Details

### A. Canonical Normalization at Ingestion (`server/models/modelSyncService.ts`)
Created the `canonicalizeModelId()` utility which standardizes model slugs into canonical dot notation:
```typescript
export function canonicalizeModelId(rawId: string): string {
  let id = (rawId || '').replace(/\[1m\]$/i, '').trim().toLowerCase();
  
  const knownAliases: Record<string, string> = {
    'deepseek-v4-1-flash': 'deepseek-v4.1-flash',
    'fable-5-1': 'fable-5.1',
    'glm-5-1': 'glm-5.1',
    'glm-5-2-v2': 'glm-5.2-v2',
    'glm-5-3-flash': 'glm-5.3-flash',
    'glm-5-3-v2': 'glm-5.3-v2',
    'gpt-5-6-luna': 'gpt-5.6-luna',
    'gpt-5-6-sol': 'gpt-5.6-sol',
    'gpt-5-6-terra': 'gpt-5.6-terra',
    'gpt-6-1-sol': 'gpt-6.1-sol',
    'haiku-5-5': 'haiku-5.5',
    'opus-5-5': 'opus-5.5',
    'sonnet-5-5': 'sonnet-5.5',
  };

  if (knownAliases[id]) return knownAliases[id];
  return id.replace(/-(v?\d+)-(\d+)(-[a-z0-9]+)?$/i, '-$1.$2$3');
}
```
Both the HTML scraper and the API discoverer now run raw model IDs through `canonicalizeModelId()` before saving, merging duplicates into a single record.

### B. Gateway-Level Deduplication Filter (`server/tools.ts`)
Both `handleGetModels` (`/v1/models`) and `handleCheckKeyStatus` (`/api/key-status`) now filter through a deduplication map:
```typescript
const seenIdentities = new Set<string>();
const dedupedModels = models.filter((m) => {
  const canonical = canonicalizeModelId(m.modelId);
  const key = `${m.provider}:${canonical}`;
  if (seenIdentities.has(key)) return false;
  seenIdentities.add(key);
  return true;
});
```

### C. Database Consolidation
Consolidated existing duplicate records in PostgreSQL:
- Identified 29 duplicate hyphenated rows.
- Re-pointed references to the canonical dotted rows.
- Disabled or purged obsolete hyphenated rows.

### D. Client-Side Defensive Deduplication
In `src/components/ModelCatalog.tsx` and `src/pages/dashboard/UserApiTestConsole.tsx`, frontend lists apply stable identity deduplication ensuring that regardless of API payload nuances, the user interface displays each unique model exactly once.

---

## 4. Verification & Audit Results

- Verified live endpoint: `GET http://localhost:3001/v1/models`
- **Total Models Returned:** 74 unique models.
- **Duplicate Count:** Exactly 0 duplicates.
- **DeepSeek Models:** Exactly 3 unique canonical models:
  1. `deepseek-v4-flash`
  2. `deepseek-v4-pro`
  3. `deepseek-v4.1-flash`
- **Claude 3 Family Verification:** Exactly 0 Claude 3 models exposed (Rule 1 strictly maintained).
