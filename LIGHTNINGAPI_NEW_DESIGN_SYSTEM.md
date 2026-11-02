# LightningAPI — New Design System Specification

**Document Version:** 1.0.0  
**Date:** November 2026  
**Target:** LightningAPI Public Platform & Customer Portal (`lightningapi.pro`)  
**Design Philosophy:** Modern Light Editorial SaaS · High Clarity · Low Cognitive Load  

---

## 1. Design Philosophy & Core Principles

The LightningAPI New Design System establishes a clean, modern, and developer-friendly aesthetic inspired by the simplicity and editorial clarity of benchmark platforms like LotusAI, while maintaining LightningAPI's distinct identity, electric violet accents, and multi-architecture capabilities.

### Core Tenets:
1. **The 5-Second Rule:** A user must comprehend the platform's value proposition within five seconds of landing.
2. **Whitespaces Over Clutter:** Generous padding and margins (`py-16`, `px-6`, `gap-8`) reduce visual fatigue.
3. **Monospace for Code & IDs Only:** Technical entities (model IDs, endpoints, API keys, curl commands) are rendered strictly in `JetBrains Mono` / `Geist Mono` with one-click copy actions.
4. **Restrained Brand Accents:** Brand violet is used with discipline for high-intent actions, active states, and focal badges—avoiding garish gradients or distracting neon glows.
5. **Clear Billing Differentiation:** 5-hour rolling pool plans, non-expiring USD credit wallets, and consumable token packs are clearly delineated through distinct visual signifiers.

---

## 2. Color Palette & Design Tokens

### 2.1 Surfaces & Canvas
| Token Name | Hex Code | Tailwind Utility | Usage Description |
| :--- | :--- | :--- | :--- |
| `surface-canvas` | `#fafaf9` | `bg-stone-50` / `bg-[#fafaf9]` | Primary page canvas background. Soft, warm, low-glare. |
| `surface-card` | `#ffffff` | `bg-white` | Primary card, modal, and drawer container surface. |
| `surface-muted` | `#f4f4f5` | `bg-zinc-100` / `bg-[#f4f4f5]` | Inset panels, secondary badges, search inputs. |
| `surface-dark` | `#09090b` | `bg-zinc-950` / `bg-[#09090b]` | Developer code blocks, terminal outputs, CLI snippets. |

### 2.2 Typography & Text Colors
| Token Name | Hex Code | Tailwind Utility | Usage Description |
| :--- | :--- | :--- | :--- |
| `text-primary` | `#09090b` | `text-zinc-950` | Primary headlines, card titles, high-contrast labels. |
| `text-body` | `#27272a` | `text-zinc-800` | Paragraph text, descriptions, table body. |
| `text-muted` | `#71717a` | `text-zinc-500` | Subtitles, helper text, timestamps, secondary labels. |
| `text-subtle` | `#a1a1aa` | `text-zinc-400` | Inactive states, breadcrumb separators, placeholder text. |

### 2.3 Borders & Separators
| Token Name | Hex Code | Tailwind Utility | Usage Description |
| :--- | :--- | :--- | :--- |
| `border-subtle` | `#f4f4f5` | `border-zinc-100` | Divider lines within cards and secondary lists. |
| `border-default` | `#e4e4e7` | `border-zinc-200` | Standard card borders, navigation separators, table grid lines. |
| `border-hover` | `#d4d4d8` | `border-zinc-300` | Interactive card hover state border. |
| `border-focus` | `#7c3aed` | `border-violet-600` | Input focus rings and active navigation indicators. |

### 2.4 Brand & Functional Accents
| Token Name | Hex Code | Tailwind Utility | Usage Description |
| :--- | :--- | :--- | :--- |
| `violet-primary` | `#7c3aed` | `bg-violet-600` / `text-violet-600` | Primary buttons, brand logo, active tab indicator. |
| `violet-hover` | `#6d28d9` | `bg-violet-700` | Primary button hover state. |
| `violet-tint` | `#f5f3ff` | `bg-violet-50` | Pill badge background, active navigation selection. |
| `violet-border` | `#ddd6fe` | `border-violet-200` | Subtle accent border for high-intent badges. |
| `status-success` | `#059669` | `text-emerald-600` / `bg-emerald-50` | Operational status, active keys, positive credits. |
| `status-warning` | `#d97706` | `text-amber-600` / `bg-amber-50` | Rolling window reset warning, low balance warning. |
| `status-danger` | `#dc2626` | `text-rose-600` / `bg-rose-50` | Revoked keys, expired plans, gateway error states. |

---

## 3. Typography Hierarchy

| Style Role | Font Family | Size / Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Inter / System Sans | `text-4xl sm:text-5xl lg:text-6xl` (`1.15`) | `font-bold` | `-0.025em` | Homepage Hero, Primary Landing Headings |
| **Section Header** | Inter / System Sans | `text-2xl sm:text-3xl` (`1.25`) | `font-bold` | `-0.02em` | Section titles, feature block headings |
| **Card Header** | Inter / System Sans | `text-lg sm:text-xl` (`1.35`) | `font-semibold` | `-0.015em` | Pricing plan titles, model cards |
| **Body Regular** | Inter / System Sans | `text-sm sm:text-base` (`1.6`) | `font-normal` | `0` | Explanatory copy, feature descriptions |
| **Label / Subtext** | Inter / System Sans | `text-xs sm:text-sm` (`1.5`) | `font-medium` | `0` | Form labels, table headers, metadata |
| **Code / Model ID** | JetBrains Mono / Geist | `text-xs sm:text-[13px]` (`1.5`) | `font-mono font-medium`| `0` | Model IDs, endpoints, curl, tokens, numbers |

---

## 4. Component Standards

### 4.1 Card Standard (`.ui-card`)
- **Background:** Pure White (`#ffffff`)
- **Border:** 1px solid `#e4e4e7` (`border-zinc-200`)
- **Border Radius:** `rounded-2xl` (`16px`)
- **Shadow:** `shadow-xs` (`0 1px 2px rgba(0,0,0,0.03)`)
- **Hover Transition:** `hover:border-zinc-300 hover:shadow-sm transition-all duration-200`

### 4.2 Button Standards
- **Primary Brand Button (`.btn-primary`):**  
  `bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors duration-150`
- **Secondary Neutral Button (`.btn-secondary`):**  
  `bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 font-medium text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors duration-150`
- **Ghost Action Button (`.btn-ghost`):**  
  `hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 font-medium text-sm px-3 py-1.5 rounded-lg transition-colors duration-150`

### 4.3 Monospace Pill / Copyable Tag (`.code-tag`)
- `font-mono text-xs px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-800 flex items-center gap-1.5 select-all`
- Includes interactive copy icon with instant feedback checkmark.

### 4.4 Badge Standards
- **Brand Pill:** `bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold px-2.5 py-0.5 rounded-full`
- **Success / Live Pill:** `bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium px-2 py-0.5 rounded-full`
- **Provider Pill:** `bg-zinc-100 text-zinc-700 text-xs font-medium px-2 py-0.5 rounded-md`

---

## 5. Navigation Structure & Page Hierarchy

### 5.1 Streamlined Top Navigation
- **Logo:** Clean Zap glyph + "LightningAPI" wordmark + `.pro` badge.
- **Links (Desktop):**
  1. `Models` (`/models`)
  2. `Plans` (`/pricing`)
  3. `Verify Key` (`/check-key`)
  4. `Docs` (`/docs`)
  5. `AI Builder` (`/builder`, badge: `Studio`)
- **Actions (Right):**
  - Cart button (if items present).
  - Authenticated State: User Initials Circle (`bg-violet-100 text-violet-700`) + Name/Email + Dropdown menu (Dashboard, API Keys, Usage, Sign Out).
  - Unauthenticated State: "Sign In" link + "Get Started" primary button.

### 5.2 Comprehensive Footer Navigation
- **Product:** Models Catalogue, Capacity Plans, Free Trial, Key Status, System Status.
- **Developers:** Quickstart Docs, Claude Code Setup, Cursor Setup, Python SDK, cURL Examples.
- **Company:** Why Choose LightningAPI, Frequently Asked Questions, Contact & Support.
- **Legal:** Terms of Service, Privacy Policy, Refund Policy.
- **Live Telemetry:** Pulse indicator showing "All Systems Operational" with direct link to `/status`.

---

## 6. Strict Rule Compliance Matrix

1. **Rule 1 (Absolute Claude 3 Prohibition):**
   - No instances of `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`, `claude-3-5-sonnet`, `claude-3-5-haiku`, or `claude-3-7-sonnet` in UI, model cards, dropdowns, placeholder text, code snippets, or documentation.
   - Showcase models strictly: `claude-sonnet-5.5`, `claude-opus-5.5`, `claude-opus-5`, `claude-sonnet-5`, `gemini-4-argon`, `gpt-4o`, `o1`, `o3-mini`, `deepseek-v3`, `deepseek-r1`.
2. **Rule 3 (Strikethrough Pricing Limitation):**
   - Strikethrough pricing (`originalPriceInr` and `annualOriginalPriceInr`) is strictly restricted to **Claude 5-Hour Rolling Plans** (`planCategory === 'claude_max_rolling'` / `planType === 'window'`).
   - For all other plans (Credit Deposits, OpenAI Token Packs, Claude Token Packs, Local Packs), only direct prices are displayed.
3. **Rule 4 (Test Sandbox Isolation):**
   - Zero modifications to live customer data. All testing conducted via dedicated test sandboxes.
