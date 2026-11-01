---
name: lightningdeals-ui
description: Premium design aesthetics, Framer Motion animations, typography, and zero-public-pricing guidelines for LightningDeals UI.
---

# LightningDeals UI/UX Design System

## Aesthetic Principles

1. **Premium Dark Theme**: Dark slate/navy backgrounds (`#090d16`, `#111625`) paired with rich HSL accents (amber `#f59e0b`, emerald `#10b981`, cyan, violet).
2. **Dynamic Framer Motion**: Staggered scroll reveals, hover elevations (`whileHover={{ y: -4 }}`), interactive tab transitions, and pulsing indicator lights.
3. **Typography & Hierarchy**: Modern sans typography (Inter) paired with JetBrains Mono code snippets and uppercase tracking kicker badges.
4. **Zero Public Monetary Prices**: Customer-facing pages MUST NOT display exact dollar/rupee prices ($ / ₹). Display prepaid token allocations (**10M**, **40M**, **100M**, **250M**, **1B+**) with **Request Quote** CTAs.
5. **Zero Claude 3 Family Rule**: NEVER display or mention any Claude 3 family models on the website (Claude 3, Claude 3.5, Claude 3.7). Strictly showcase modern Claude 4 / 4.5 / 5 / 5.5 generation (`claude-sonnet-5.5`, `claude-opus-5.5`, `claude-sonnet-5`, `claude-fable-5`, `claude-haiku-5.5`), Google Gemini (`gemini-4-argon`), OpenAI, and open-weight models.
6. **Strict Pricing Strikethrough Rule**: Strikethrough original prices are shown ONLY on Claude 5-hour rolling plans. Never show strikethrough prices for usage credits or consumable token packs; show only our direct pricing.

## Responsive & Accessibility Standards

- Mobile-first responsive layouts with hamburger menu drawers.
- High contrast text (`text-fg`, `text-muted`, `text-amber-500`).
- Interactive hover states and focus rings on all buttons and inputs.
