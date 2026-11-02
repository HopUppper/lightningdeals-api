# LIGHTNINGAPI — GLOBAL DESIGN SYSTEM & TYPOGRAPHY SPECIFICATION
**Document ID:** `LIGHTNINGAPI_GLOBAL_DESIGN_SYSTEM.md`  
**Reference Benchmark:** LotusAI Visual Architecture & Typography Quality  
**Status:** Unified Design System Standard Active  
**Version:** 2.0 (Platform-Wide)

---

## 1. Design Philosophy & Brand Direction

The LightningAPI design system establishes an authoritative, technically sophisticated, and visually cinematic software aesthetic. Inspired by the visual hierarchy, typographic density, and restrained ambient lighting of LotusAI, the platform balances:

1. **Cinematic Impact on Marketing Surfaces:** Expressive display headlines, tight negative tracking, bold weight distribution, and subtle obsidian/violet ambient illumination.
2. **Calm Precision in Customer Dashboards:** High-readability sans-serif, clear numerical telemetry, instant data scannability, and structured cards.
3. **Information-Dense Clarity in Admin Interfaces:** Compact tabular layouts, strict vertical rhythm, clean status pills, and high-contrast monospace technical values without visual clutter.

---

## 2. Typography System & Global Type Scale

### 2.1 Font Families

| Role | Font Family | Fallback Chain | Purpose |
|---|---|---|---|
| **Primary Sans & Display** | `Geist` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Page titles, section headings, card headers, navigation, body copy |
| **Technical Monospace** | `Geist Mono` | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | API keys, model IDs, endpoints, CLI commands, code blocks, request IDs, token metrics |

### 2.2 Typographic Hierarchy & CSS Utility Tokens

```css
/* ========================================================================= */
/* LIGHTNINGAPI TYPOGRAPHY TOKENS                                            */
/* ========================================================================= */

:root {
  /* Font Family Definitions */
  --font-sans: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --font-display: 'Geist', 'Inter', sans-serif;

  /* Typographic Scale: Font Sizes & Line Heights */
  --text-display: clamp(3.25rem, 7.5vw, 6.75rem);
  --leading-display: 0.98;
  --tracking-display: -0.04em;

  --text-h1: clamp(2.00rem, 4.0vw, 3.25rem);
  --leading-h1: 1.08;
  --tracking-h1: -0.035em;

  --text-h2: clamp(1.50rem, 2.5vw, 2.15rem);
  --leading-h2: 1.15;
  --tracking-h2: -0.025em;

  --text-h3: 1.25rem; /* 20px */
  --leading-h3: 1.25;
  --tracking-h3: -0.02em;

  --text-h4: 1.00rem; /* 16px */
  --leading-h4: 1.35;
  --tracking-h4: -0.015em;

  --text-body-lg: 1.0625rem; /* 17px */
  --leading-body-lg: 1.60;
  --tracking-body-lg: -0.01em;

  --text-body: 0.875rem; /* 14px */
  --leading-body: 1.50;
  --tracking-body: 0.00em;

  --text-body-sm: 0.8125rem; /* 13px */
  --leading-body-sm: 1.45;
  --tracking-body-sm: 0.005em;

  --text-caption: 0.6875rem; /* 11px */
  --leading-caption: 1.35;
  --tracking-caption: 0.025em;

  --text-mono-base: 0.8125rem; /* 13px */
  --leading-mono-base: 1.45;
  --tracking-mono-base: -0.01em;

  --text-mono-sm: 0.6875rem; /* 11px */
  --leading-mono-sm: 1.35;
  --tracking-mono-sm: 0.00em;
}
```

---

## 3. Global Color Palette Tokens

LightningAPI uses a cohesive, modern palette centered on our signature **Electric Violet** and **Obsidian Black**, supported by neutral stone/zinc surfaces that provide exceptional contrast and comfort.

### 3.1 Primary Brand & Accent Palette
- **Brand Violet Primary:** `#7136E8` (`var(--ui-brand-violet)`)
- **Brand Violet Dark / Hover:** `#581c87` (`var(--ui-brand-hover)`)
- **Brand Violet Deep:** `#431407` / `#3b0764`
- **Brand Violet Light Tint:** `#f5f3ff` (`var(--ui-brand-light)`)
- **Brand Violet Hairline Border:** `#ddd6fe` / `rgba(113, 54, 232, 0.25)`

### 3.2 Neutral Surface & Background Palette
- **Application Canvas (Light):** `#fbfbfa` / `#fafaf9` (`var(--ui-bg)`)
- **Card Surface Elevated:** `#ffffff` (`var(--ui-surface)`)
- **Subtle Well Surface:** `#f4f4f0` / `#f5f5f4` (`var(--ui-surface-subtle)`)
- **Hairline Border (Standard):** `#e4e4e7` (`var(--ui-border)`)
- **Hairline Border (Strong):** `#d4d4d8` (`var(--ui-border-strong)`)
- **Terminal & Obsidian Hero Dark:** `#09090b` / `#0f172a` (`var(--ui-obsidian)`)

### 3.3 Text & Typography Palette
- **Primary Ink (Highest Contrast):** `#09090b` / `#111827` (`var(--ui-text)`)
- **Secondary Ink (Descriptions):** `#4b5563` / `#52525b` (`var(--ui-text-secondary)`)
- **Muted Ink (Metadata / Labels):** `#71717a` (`var(--ui-text-muted)`)
- **Inverse White (Dark Mode / Hero):** `#f8fafc` (`var(--ui-text-inverse)`)

### 3.4 Semantic Status Palette
- **Success / Operational:** `#059669` (Emerald 600) | Light: `#ecfdf5` | Border: `#a7f3d0`
- **Warning / Refill In Progress:** `#d97706` (Amber 600) | Light: `#fef3c7` | Border: `#fde68a`
- **Error / Depleted / Revoked:** `#e11d48` (Rose 600) | Light: `#fff1f2` | Border: `#fecdd3`
- **Information / Verified Gateway:** `#0284c7` (Sky 600) | Light: `#f0f9ff` | Border: `#bae6fd`

---

## 4. Layout & Spacing Tokens

- **Max Page Width:** `1240px` (`max-w-page` / `--max-width-page`)
- **Max Content / Reading Width:** `768px` (`max-w-reading` / `--max-width-reading`)
- **Header Height:** `64px` (`h-16`)
- **Dashboard Sidebar Width:** `260px` (Expanded) | `72px` (Collapsed)
- **Admin Sidebar Width:** `240px`
- **Page Gutters:** Mobile: `16px` (`px-4`) | Tablet: `24px` (`px-6`) | Desktop: `32px` (`px-8`)
- **Card Border Radii:**
  - Control / Button / Input: `8px` (`rounded-lg` / `var(--radius-control)`)
  - Panel / Tooltip / Flyout: `12px` (`rounded-xl` / `var(--radius-panel)`)
  - Standard Card / Container: `16px` (`rounded-2xl` / `var(--radius-card)`)
  - Hero Highlight / Modal Dialog: `24px` (`rounded-3xl` / `var(--radius-hero)`)

---

## 5. Standard Component Specifications

### 5.1 Buttons

| Variant | Class | Background | Border | Text | Hover State | Purpose |
|---|---|---|---|---|---|---|
| **Primary Brand** | `.ui-button-brand` | `#7136E8` | `1px solid #7136E8` | White (`#fff`) | `#5b21b6` | Main call-to-actions, Submit, Get Key, Buy |
| **Primary Solid Dark** | `.ui-button-primary` | `#0f172a` | `1px solid #0f172a` | White (`#fff`) | `#1e293b` | Secondary high-contrast actions, Log in |
| **Secondary Outlined** | `.ui-button-secondary` | `#ffffff` | `1px solid #e4e4e7` | Dark Ink (`#111827`) | `#f9fafb`, border `#d4d4d8` | Filter buttons, cancel, view all, secondary links |
| **Ghost / Icon** | `.ui-button-ghost` | Transparent | None | Muted (`#71717a`) | `#f4f4f5`, text `#111827` | Icon controls, copy buttons, close triggers |

### 5.2 Inputs & Form Controls
- **Height:** Standard: `40px` (`min-h-[40px]`) | Compact: `34px` (`min-h-[34px]` in admin)
- **Typography:** `text-sm font-sans` (`0.875rem`), placeholder in `text-zinc-400`
- **Borders:** `1px solid var(--ui-border)` (`#e4e4e7`)
- **Focus Ring:** `2px solid #7136E8` with `focus:ring-2 focus:ring-violet-500/20`
- **Background:** `#ffffff` (default) or `#fbfbfa` (subtle wells)

### 5.3 Data Tables (Dashboard & Admin)
- **Header Row:** `bg-[#fafaf9]`, `text-[11px] font-semibold uppercase tracking-wider text-[#71717a]`, border bottom `1px solid #e4e4e7`.
- **Data Rows:** `text-xs text-[#111827]`, hover `bg-violet-50/30`, cell padding `px-4 py-3 sm:py-3.5`.
- **Numerical & Key Columns:** `font-mono tabular-nums`, aligned right where quantitative.

---

## 6. Implementation Architecture

All tokens and reusable classes are consolidated directly inside:
1. `index.html`: Font preconnections, Google Fonts link, and selection highlighting.
2. `src/index.css`: `@theme` variables, `:root` design tokens, typographic classes, and core button/card components.
3. `tailwind.config.js`: Tailwind utility extensions for typography and palette.
4. Public pages, Customer Dashboard layouts, and Admin layouts inherit these tokens universally.
