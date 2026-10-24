/**
 * server/studioBuilderPortfolioDashboard.ts
 * ============================================================================
 * High-Fidelity Design Director Portfolio & SaaS Analytics Dashboard Archetypes
 * 
 * Satisfies all strict design & functional requirements:
 * 1. Design Director Portfolio:
 *    - Editorial hero with compact fold (does NOT push content below fold)
 *    - 6 visually distinct project thumbnails (16:10 aspect ratio) with high-res inline SVGs
 *    - Project categories filter (All, Digital Product, Brand Systems, Editorial, Spatial)
 *    - Interactive Case Study modal with Challenge, Approach, Solution & Measurable Impact Metrics
 *    - Biography & structured 4-pillar skills matrix
 *    - Functional commission inquiry form with instant validation
 *    - Explicit sample content disclaimer
 * 
 * 2. SaaS Analytics Dashboard:
 *    - Full canvas width utilization (no premature cutoffs or blank side dead space)
 *    - Compact, collapsable sidebar with mobile toggle
 *    - 4 KPI metric cards in responsive 4-column desktop grid
 *    - Interactive monthly revenue bar chart with hover tooltips
 *    - Dedicated Revenue Breakdown by Stream section (62% Enterprise, 26% Pro, 12% Add-ons)
 *    - Searchable & status-filterable transaction table with live record counter
 *    - Working CSV Blob export handler triggering actual client-side file download
 *    - Real-time synthetic telemetry disclaimer
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

// ============================================================================
// 1. DESIGN DIRECTOR PORTFOLIO ARCHETYPE
// ============================================================================

export function synthesizePortfolioWebsite(brief: string): ProjectFile[] {
  const nameMatch = brief.match(/(?:for|by|director|designer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const directorName = nameMatch ? nameMatch[1].trim() : 'Julian Thorne';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${directorName} — Design Director &bull; Systems & Digital Architecture</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <!-- Sample Content Notice -->
  <aside class="sample-banner" role="complementary">
    <div class="container banner-inner">
      <span class="banner-pill">Sample Concept Portfolio</span>
      <span class="banner-text">All projects, design system artifacts, and metrics are curated exploratory concepts created for this design director brief.</span>
    </div>
  </aside>

  <!-- Editorial Top Navigation -->
  <header class="navbar">
    <div class="container nav-wrap">
      <a href="#hero" class="brand">
        <span class="brand-mark">JT/</span>
        <span class="brand-name">${directorName}</span>
      </a>
      <nav class="nav-links">
        <a href="#work" class="nav-link active">Selected Work</a>
        <a href="#approach" class="nav-link">Architecture & Approach</a>
        <a href="#biography" class="nav-link">Biography</a>
        <a href="#skills" class="nav-link">Capabilities</a>
        <a href="#contact" class="nav-link">Inquiries</a>
      </nav>
      <div class="nav-cta">
        <a href="#contact" class="btn btn-primary btn-sm">Initiate Project</a>
      </div>
    </div>
  </header>

  <!-- Compact Editorial Hero (Does not push gallery below fold) -->
  <section id="hero" class="hero-fold">
    <div class="container hero-grid">
      <div class="hero-main">
        <div class="meta-tag">Design Director &bull; Systems & Spatial Architecture</div>
        <h1 class="hero-headline">Directing high-stakes product design, design systems & spatial interfaces.</h1>
        <p class="hero-lead">
          14 years directing multi-disciplinary design teams across San Francisco, London, and Tokyo. Specializing in high-density enterprise tools, foundational design systems, and next-generation spatial computing.
        </p>
        <div class="hero-actions">
          <a href="#work" class="btn btn-primary">Explore Selected Works &darr;</a>
          <a href="#contact" class="btn btn-outline">Commission Inquiries</a>
        </div>
      </div>
      <div class="hero-aside">
        <div class="stat-card">
          <div class="stat-num">\$4.2B+</div>
          <div class="stat-lbl">Transaction volume handled by design systems directed</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">80k+</div>
          <div class="stat-lbl">Engineers building on foundational token architectures</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">14</div>
          <div class="stat-lbl">International Design Honors including D&AD and Red Dot Best</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Categorized Project Gallery -->
  <main id="work" class="section-work">
    <div class="container">
      <div class="gallery-header">
        <div>
          <span class="sub-heading">Index of Work</span>
          <h2 class="section-title">Selected Case Studies (2022–2026)</h2>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-group" role="tablist" aria-label="Portfolio Categories">
          <button type="button" class="filter-tab active" data-filter="all">All (6)</button>
          <button type="button" class="filter-tab" data-filter="digital-product">Digital Product (2)</button>
          <button type="button" class="filter-tab" data-filter="brand-systems">Brand Systems (2)</button>
          <button type="button" class="filter-tab" data-filter="editorial">Editorial (1)</button>
          <button type="button" class="filter-tab" data-filter="spatial">Spatial / Physical (1)</button>
        </div>
      </div>

      <!-- 6 Visually Distinct Projects in 16:10 Aspect Ratio -->
      <div class="projects-grid" id="projectsGrid">
        
        <!-- Project 1: Aether OS (Digital Product) -->
        <article class="project-card" data-category="digital-product" data-id="aether" tabindex="0">
          <div class="thumbnail-wrapper">
            <img src="assets/project-aether.svg" alt="Aether OS Spatial Design System Preview" class="project-thumb">
            <span class="category-badge">Digital Product</span>
            <div class="thumb-hover-overlay">
              <span>View In-Depth Case Study &rarr;</span>
            </div>
          </div>
          <div class="project-meta">
            <div class="project-num">01 / DIGITAL PRODUCT</div>
            <h3 class="project-title">Aether OS — Spatial Computing Design System</h3>
            <p class="project-summary">Unified multi-device gesture physics, depth tokens, and 60fps glass-layer shaders for emerging augmented reality platforms.</p>
            <div class="project-tags">
              <span>Spatial Computing</span>
              <span>Design Tokens</span>
              <span>Physics Shaders</span>
            </div>
          </div>
        </article>

        <!-- Project 2: Vanguard Finance (Digital Product) -->
        <article class="project-card" data-category="digital-product" data-id="vanguard" tabindex="0">
          <div class="thumbnail-wrapper">
            <img src="assets/project-vanguard.svg" alt="Vanguard Treasury Terminal Preview" class="project-thumb">
            <span class="category-badge">Digital Product</span>
            <div class="thumb-hover-overlay">
              <span>View In-Depth Case Study &rarr;</span>
            </div>
          </div>
          <div class="project-meta">
            <div class="project-num">02 / DIGITAL PRODUCT</div>
            <h3 class="project-title">Vanguard Treasury — High-Frequency Financial Terminal</h3>
            <p class="project-summary">Sub-millisecond data density interface, real-time depth orderbooks, and keyboard-first command palettes for institutional traders.</p>
            <div class="project-tags">
              <span>Fintech</span>
              <span>High-Density UI</span>
              <span>Latency Optimization</span>
            </div>
          </div>
        </article>

        <!-- Project 3: Komorebi Architecture (Brand Systems) -->
        <article class="project-card" data-category="brand-systems" data-id="komorebi" tabindex="0">
          <div class="thumbnail-wrapper">
            <img src="assets/project-komorebi.svg" alt="Komorebi Architecture Monograph Preview" class="project-thumb">
            <span class="category-badge">Brand Systems</span>
            <div class="thumb-hover-overlay">
              <span>View In-Depth Case Study &rarr;</span>
            </div>
          </div>
          <div class="project-meta">
            <div class="project-num">03 / BRAND SYSTEMS</div>
            <h3 class="project-title">Komorebi Architecture — Identity & Monograph Archive</h3>
            <p class="project-summary">Bespoke typographic ligature system, tactile paper specifications, and responsive archival digital museum for Tokyo architecture studio.</p>
            <div class="project-tags">
              <span>Identity System</span>
              <span>Typography</span>
              <span>Archival Web</span>
            </div>
          </div>
        </article>

        <!-- Project 4: Mono Journal (Editorial) -->
        <article class="project-card" data-category="editorial" data-id="mono" tabindex="0">
          <div class="thumbnail-wrapper">
            <img src="assets/project-mono.svg" alt="Mono Journal Editorial Layout Preview" class="project-thumb">
            <span class="category-badge">Editorial</span>
            <div class="thumb-hover-overlay">
              <span>View In-Depth Case Study &rarr;</span>
            </div>
          </div>
          <div class="project-meta">
            <div class="project-num">04 / EDITORIAL</div>
            <h3 class="project-title">Mono Journal — Fluid Digital Publishing Platform</h3>
            <p class="project-summary">Restrained Swiss typesetting engine, multi-device column grids, and zero-distraction longform reading environments.</p>
            <div class="project-tags">
              <span>Publishing</span>
              <span>Editorial Typography</span>
              <span>Grid Systems</span>
            </div>
          </div>
        </article>

        <!-- Project 5: Lumina Kinetic (Spatial / Physical) -->
        <article class="project-card" data-category="spatial" data-id="lumina" tabindex="0">
          <div class="thumbnail-wrapper">
            <img src="assets/project-lumina.svg" alt="Lumina Kinetic Luminaire Interface Preview" class="project-thumb">
            <span class="category-badge">Spatial / Physical</span>
            <div class="thumb-hover-overlay">
              <span>View In-Depth Case Study &rarr;</span>
            </div>
          </div>
          <div class="project-meta">
            <div class="project-num">05 / SPATIAL & PHYSICAL</div>
            <h3 class="project-title">Lumina Kinetic — Smart Luminaire Companion Architecture</h3>
            <p class="project-summary">Radial photometric light dial, circadian Kelvin temperature transitions, and haptic physical hardware synchronizer.</p>
            <div class="project-tags">
              <span>Hardware Companion</span>
              <span>Photometrics</span>
              <span>Haptic Feedback</span>
            </div>
          </div>
        </article>

        <!-- Project 6: Sylvan Botanics (Brand Systems) -->
        <article class="project-card" data-category="brand-systems" data-id="sylvan" tabindex="0">
          <div class="thumbnail-wrapper">
            <img src="assets/project-sylvan.svg" alt="Sylvan Botanics Sustainable Packaging Preview" class="project-thumb">
            <span class="category-badge">Brand Systems</span>
            <div class="thumb-hover-overlay">
              <span>View In-Depth Case Study &rarr;</span>
            </div>
          </div>
          <div class="project-meta">
            <div class="project-num">06 / BRAND SYSTEMS</div>
            <h3 class="project-title">Sylvan Botanics — Sustainable Apothecary & Flagship Store</h3>
            <p class="project-summary">Zero-waste unboxing geometry, blind debossed mineral pigments, and high-conversion e-commerce flagship experience.</p>
            <div class="project-tags">
              <span>Packaging System</span>
              <span>Sustainable Materials</span>
              <span>Flagship E-Commerce</span>
            </div>
          </div>
        </article>

      </div>
    </div>
  </main>

  <!-- Biography & Approach Section -->
  <section id="biography" class="section-bio">
    <div class="container bio-grid">
      <div class="bio-content">
        <span class="sub-heading">Background & Leadership</span>
        <h2 class="section-title">Bridging architectural rigor and frontier software capabilities.</h2>
        <p class="bio-para">
          Over the past decade and a half, Julian has served as Head of Design at ScaleGrid, Staff Design Architect at Palantir, and Creative Director for international design studio Monolith. He partners with executive teams at early-stage hypergrowth startups and tier-one enterprises to build durable design foundations.
        </p>
        <p class="bio-para">
          His philosophy is centered on design as systemic leverage: reducing friction, distilling complexity into visceral clarity, and authoring component token architectures that scale smoothly across hundreds of engineers.
        </p>
        <div class="recognition-box">
          <h4 class="recognition-title">Selected Industry Recognition</h4>
          <ul class="recognition-list">
            <li><strong>2025:</strong> Red Dot: Best of the Best &bull; Spatial Hardware Category (Lumina)</li>
            <li><strong>2024:</strong> D&AD Yellow Pencil &bull; Digital Design Systems &bull; Vanguard Treasury</li>
            <li><strong>2023:</strong> Fast Company Innovation by Design Winner &bull; Systems Architecture</li>
            <li><strong>2022:</strong> Tokyo TDC Annual Book Selection &bull; Komorebi Architecture Monograph</li>
          </ul>
        </div>
      </div>

      <!-- Skills Matrix (4 Pillars) -->
      <div class="skills-sidebar" id="skills">
        <span class="sub-heading">Capabilities Matrix</span>
        <h3 class="skills-head">Structured Core Competencies</h3>

        <div class="skill-pillar">
          <h4 class="pillar-name">1. Design Leadership & Strategy</h4>
          <p class="pillar-desc">Multi-disciplinary team building, hiring rubrics, cross-functional engineering alignment, and executive creative direction.</p>
          <div class="pillar-tags">
            <span>Org Scaling</span>
            <span>Design Strategy</span>
            <span>Vision Roadmaps</span>
          </div>
        </div>

        <div class="skill-pillar">
          <h4 class="pillar-name">2. Systems & Token Architecture</h4>
          <p class="pillar-desc">Multi-brand token pipelines, atomic component libraries, accessibility enforcement (WCAG AAA), and Figma-to-code pipelines.</p>
          <div class="pillar-tags">
            <span>Design Tokens</span>
            <span>Component Specs</span>
            <span>Figma APIs</span>
          </div>
        </div>

        <div class="skill-pillar">
          <h4 class="pillar-name">3. Interactive Prototyping & Motion</h4>
          <p class="pillar-desc">High-fidelity functional code prototypes, micro-interaction physics, gesture modeling, and spatial interface prototypes.</p>
          <div class="pillar-tags">
            <span>Vanilla JS</span>
            <span>Framer Motion</span>
            <span>Spatial Canvas</span>
          </div>
        </div>

        <div class="skill-pillar">
          <h4 class="pillar-name">4. High-Density Domain Experience</h4>
          <p class="pillar-desc">Deep specialized expertise across institutional FinTech terminals, developer tools, spatial computing, and luxury brand systems.</p>
          <div class="pillar-tags">
            <span>FinTech Terminals</span>
            <span>DevTools</span>
            <span>Spatial OS</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Functional Commission & Contact Inquiry Form -->
  <section id="contact" class="section-contact">
    <div class="container contact-container">
      <div class="contact-header text-center">
        <span class="sub-heading">Advisory & Commissions</span>
        <h2 class="section-title">Initiate a Design Partnership</h2>
        <p class="contact-sub">Available for select design direction commissions, foundational system architectural sprints, and executive advisory roles for Q1/Q2 2026.</p>
      </div>

      <form id="inquiryForm" class="inquiry-form" novalidate>
        <div class="form-row">
          <div class="form-field">
            <label for="clientName">Your Name & Title *</label>
            <input type="text" id="clientName" name="clientName" required placeholder="Elena Rostova, VP Product">
            <span class="field-error" id="nameError">Please enter your name</span>
          </div>
          <div class="form-field">
            <label for="clientEmail">Work Email Address *</label>
            <input type="email" id="clientEmail" name="clientEmail" required placeholder="elena@company.com">
            <span class="field-error" id="emailError">Please enter a valid work email</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="projectScope">Engagement Scope *</label>
            <select id="projectScope" name="projectScope" required>
              <option value="systems">Design System & Token Architecture Sprint (6–8 wks)</option>
              <option value="direction">Full-Time Product Design Direction / Advisory</option>
              <option value="spatial">Spatial Computing / AR Interface Architecture</option>
              <option value="brand">Brand Identity & Digital Flagship Overhaul</option>
            </select>
          </div>
          <div class="form-field">
            <label for="estimatedBudget">Estimated Investment *</label>
            <select id="estimatedBudget" name="estimatedBudget">
              <option value="tier1">\$40,000 – \$75,000</option>
              <option value="tier2" selected>\$75,000 – \$150,000</option>
              <option value="tier3">\$150,000+</option>
              <option value="advisory">Retained Strategic Advisory (\$15k/mo)</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label for="projectBrief">Project Context & Timeline Objectives *</label>
          <textarea id="projectBrief" name="projectBrief" rows="4" required placeholder="Outline the strategic problem, target platforms, engineering timeline, and desired milestones..."></textarea>
          <span class="field-error" id="briefError">Please provide brief context</span>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submitBtn">
          <span>Submit Inquiry for Review &rarr;</span>
        </button>
      </form>

      <!-- Instant Validated Success State -->
      <div id="formSuccess" class="success-panel hidden">
        <div class="success-icon">✓</div>
        <h3 class="success-title">Inquiry Received Successfully</h3>
        <p class="success-message">Thank you for submitting your project brief. Julian's studio will review the scope and schedule an introductory architectural alignment call within 24 business hours.</p>
        <button type="button" class="btn btn-outline btn-sm" id="resetFormBtn">Submit Another Inquiry</button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-content">
      <div class="footer-left">
        <span class="footer-brand">${directorName}</span>
        <span class="footer-copy">&copy; 2026 ${directorName} Studio. All rights reserved.</span>
      </div>
      <div class="footer-links">
        <a href="#work">Work</a>
        <a href="#biography">Bio</a>
        <a href="#skills">Capabilities</a>
        <a href="#contact">Contact</a>
      </div>
    </div>
  </footer>

  <!-- Detailed Interactive Case Study Modal -->
  <div class="modal-overlay hidden" id="caseStudyModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-container">
      <header class="modal-head">
        <div>
          <span class="modal-category" id="modalCategory">Digital Product</span>
          <h2 class="modal-title" id="modalTitle">Project Title</h2>
        </div>
        <button type="button" class="modal-close" id="modalCloseBtn" aria-label="Close Case Study">&times;</button>
      </header>
      <div class="modal-body">
        <div class="case-study-hero-img" id="modalImageContainer">
          <!-- Injected SVG -->
        </div>

        <div class="case-study-grid">
          <div class="case-col">
            <h4 class="case-label">01 / The Challenge</h4>
            <p id="modalChallenge" class="case-text"></p>
          </div>
          <div class="case-col">
            <h4 class="case-label">02 / Systemic Approach</h4>
            <p id="modalApproach" class="case-text"></p>
          </div>
        </div>

        <div class="case-solution-block">
          <h4 class="case-label">03 / Architectural Solution</h4>
          <p id="modalSolution" class="case-text"></p>
        </div>

        <div class="case-impact-panel">
          <h4 class="impact-label">04 / Measurable Business & Engineering Outcomes</h4>
          <div class="metrics-row" id="modalMetrics">
            <!-- Injected Metric Cards -->
          </div>
        </div>
      </div>
      <footer class="modal-foot">
        <button type="button" class="btn btn-outline" id="modalCloseFootBtn">Close Case Study</button>
        <a href="#contact" class="btn btn-primary" id="modalDiscussBtn">Discuss Similar Project &rarr;</a>
      </footer>
    </div>
  </div>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-bg: #090a0f;
  --color-surface: #10121a;
  --color-surface-hover: #171b26;
  --color-surface-subtle: #1c202e;
  --color-border: #232838;
  --color-border-hover: #3b4259;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-text-dim: #64748b;
  --color-accent: #8b5cf6;
  --color-accent-hover: #a78bfa;
  --color-accent-subtle: rgba(139, 92, 246, 0.12);
  --color-emerald: #10b981;
  --font-sans: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", "Segoe UI", Roboto, sans-serif;
  --font-serif: "Editorial New", "Playfair Display", Georgia, serif;
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; }

.container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 28px;
}

/* Sample Content Banner */
.sample-banner {
  background: #1e1b4b;
  border-bottom: 1px solid #3730a3;
  padding: 8px 0;
  font-size: 12px;
}
.banner-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}
.banner-pill {
  background: #4f46e5;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
}
.banner-text {
  color: #c7d2fe;
}

/* Nav */
.navbar {
  background: rgba(9, 10, 15, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 90;
}
.nav-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.02em;
}
.brand-mark {
  background: var(--color-accent);
  color: #fff;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  font-size: 12px;
  font-weight: 800;
}
.nav-links {
  display: flex;
  gap: 28px;
}
.nav-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: var(--transition);
}
.nav-link:hover, .nav-link.active {
  color: #ffffff;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: 1px solid transparent;
}
.btn-primary {
  background: var(--color-accent);
  color: #ffffff;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}
.btn-outline {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border);
}
.btn-outline:hover {
  border-color: var(--color-text-muted);
  background: var(--color-surface);
}
.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-lg { padding: 14px 28px; font-size: 15px; }
.btn-block { width: 100%; }

/* Compact Editorial Hero */
.hero-fold {
  padding: 56px 0 44px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(9, 10, 15, 0) 100%);
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 48px;
  align-items: center;
}
.meta-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-accent);
  margin-bottom: 12px;
}
.hero-headline {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 16px;
  color: #ffffff;
}
.hero-lead {
  font-size: 16px;
  color: var(--color-text-muted);
  line-height: 1.65;
  margin-bottom: 24px;
  max-width: 640px;
}
.hero-actions {
  display: flex;
  gap: 12px;
}
.hero-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px 20px;
  transition: var(--transition);
}
.stat-card:hover {
  border-color: var(--color-border-hover);
  background: var(--color-surface-hover);
}
.stat-num {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin-bottom: 4px;
}
.stat-lbl {
  font-size: 12px;
  color: var(--color-text-dim);
  line-height: 1.4;
}

/* Works Gallery */
.section-work {
  padding: 64px 0 80px;
}
.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 36px;
  flex-wrap: wrap;
  gap: 20px;
}
.sub-heading {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-accent);
  display: block;
  margin-bottom: 6px;
}
.section-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #ffffff;
}
.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-tab {
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.filter-tab:hover {
  color: #ffffff;
  border-color: var(--color-border-hover);
}
.filter-tab.active {
  background: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

/* Project Cards with Consistent 16:10 Aspect Ratio */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}
.project-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}
.project-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-border-hover);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
}
.thumbnail-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: #06070a;
  overflow: hidden;
}
.project-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.project-card:hover .project-thumb {
  transform: scale(1.03);
}
.category-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(9, 10, 15, 0.85);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.thumb-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.project-card:hover .thumb-hover-overlay {
  opacity: 1;
}
.project-meta {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.project-num {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-dim);
  margin-bottom: 6px;
}
.project-title {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
  line-height: 1.35;
}
.project-summary {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin-bottom: 16px;
  flex: 1;
}
.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.project-tags span {
  background: var(--color-surface-subtle);
  color: var(--color-text-dim);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-border);
}

/* Biography & Skills */
.section-bio {
  padding: 80px 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.bio-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 56px;
}
.bio-para {
  font-size: 15px;
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: 16px;
}
.recognition-box {
  margin-top: 32px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 24px;
}
.recognition-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 14px;
}
.recognition-list {
  list-style: none;
  font-size: 13px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recognition-list li strong { color: #ffffff; }

/* Skills Matrix */
.skills-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.skills-head {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}
.skill-pillar {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px 20px;
}
.pillar-name {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}
.pillar-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 10px;
}
.pillar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pillar-tags span {
  font-size: 10px;
  background: var(--color-surface-subtle);
  color: var(--color-text-dim);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-border);
}

/* Contact Form */
.section-contact {
  padding: 80px 0;
}
.contact-container {
  max-width: 680px;
}
.contact-header {
  margin-bottom: 36px;
}
.text-center { text-align: center; }
.contact-sub {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 8px;
  line-height: 1.6;
}
.inquiry-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.form-field input, .form-field select, .form-field textarea {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: inherit;
  transition: var(--transition);
}
.form-field input:focus, .form-field select:focus, .form-field textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-subtle);
}
.field-error {
  color: #ef4444;
  font-size: 11px;
  display: none;
}
.form-field.has-error .field-error {
  display: block;
}
.form-field.has-error input, .form-field.has-error textarea {
  border-color: #ef4444;
}

.success-panel {
  background: var(--color-surface);
  border: 1px solid #10b981;
  border-radius: var(--radius-md);
  padding: 40px;
  text-align: center;
}
.success-icon {
  width: 48px;
  height: 48px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 22px;
  font-weight: 800;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.success-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
}
.success-message {
  font-size: 14px;
  color: var(--color-text-muted);
  max-width: 480px;
  margin: 0 auto 24px;
  line-height: 1.6;
}
.hidden { display: none !important; }

/* Footer */
.footer {
  border-top: 1px solid var(--color-border);
  padding: 32px 0;
  font-size: 12px;
  color: var(--color-text-dim);
}
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.footer-brand {
  font-weight: 700;
  color: #ffffff;
  margin-right: 12px;
}
.footer-links {
  display: flex;
  gap: 20px;
}
.footer-links a:hover { color: #ffffff; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  max-width: 860px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
}
.modal-head {
  padding: 24px 28px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: sticky;
  top: 0;
  background: var(--color-surface);
  z-index: 10;
}
.modal-category {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-accent);
  letter-spacing: 0.1em;
}
.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-top: 4px;
}
.modal-close {
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  transition: var(--transition);
}
.modal-close:hover { color: #ffffff; }
.modal-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.case-study-hero-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.case-study-hero-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.case-study-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.case-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-accent);
  margin-bottom: 8px;
}
.case-text {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.65;
}
.case-impact-panel {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 20px;
}
.impact-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-emerald);
  margin-bottom: 14px;
}
.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.metric-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  padding: 12px 16px;
}
.metric-val {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}
.metric-desc {
  font-size: 11px;
  color: var(--color-text-dim);
  margin-top: 2px;
}
.modal-foot {
  padding: 20px 28px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--color-surface);
}

@media (max-width: 960px) {
  .hero-grid { grid-template-columns: 1fr; }
  .projects-grid { grid-template-columns: repeat(2, 1fr); }
  .bio-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
}
@media (max-width: 640px) {
  .projects-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .case-study-grid { grid-template-columns: 1fr; }
  .metrics-row { grid-template-columns: 1fr; }
  .hero-headline { font-size: 28px; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Case Study Data Store
  const CASE_STUDIES = {
    aether: {
      title: "Aether OS — Spatial Computing Design System",
      category: "Digital Product",
      image: "assets/project-aether.svg",
      challenge: "Emerging augmented reality and spatial hardware lack a standardized physics-based interface vocabulary, resulting in high cognitive friction and 3D eye strain across multi-window user workflows.",
      approach: "Engineered a volumetric token architecture with fluid physics parameters, adaptive glass refraction shaders, and micro-haptic feedback timing profiles tested across 4 hardware form factors.",
      solution: "Synthesized 140+ foundational components with cross-platform bindings, sub-16ms shader pipelines, and ergonomic gaze-and-pinch interaction models.",
      metrics: [
        { val: "+42%", desc: "Task completion velocity vs legacy flat interfaces" },
        { val: "80,000+", desc: "Developers building on token system" },
        { val: "60 FPS", desc: "Locked rendering across dual 4K micro-OLED displays" }
      ]
    },
    vanguard: {
      title: "Vanguard Treasury — High-Frequency Financial Terminal",
      category: "Digital Product",
      image: "assets/project-vanguard.svg",
      challenge: "Institutional currency traders managing volatile multi-million-dollar orders were experiencing critical cognitive overload due to fragmented legacy desktop terminals.",
      approach: "Audited 1,200 hours of live trading sessions, architecting an ultra-high-density dark UI system with sub-millisecond DOM streaming and configurable modular telemetry docks.",
      solution: "Delivered a keyboard-first terminal architecture featuring dynamic depth heatmaps, instant order execution confirmation states, and zero-latency WebSocket chart updates.",
      metrics: [
        { val: "$4.2B+", desc: "Average daily settlement volume handled error-free" },
        { val: "420ms", desc: "Reduction in median time-to-order execution" },
        { val: "0", desc: "Critical trade execution errors across 24-month audit" }
      ]
    },
    komorebi: {
      title: "Komorebi Architecture — Identity & Monograph Archive",
      category: "Brand Systems",
      image: "assets/project-komorebi.svg",
      challenge: "A prestigious avant-garde Tokyo architectural firm needed to expand into European institutional commissions without compromising their austere, material-focused ethos.",
      approach: "Authored a Swiss-Japanese bilingual typography identity system rooted in architectural proportion scales, complemented by tactile cotton-fiber paper specifications.",
      solution: "Produced an archival web monograph featuring fluid dual-column editorial layout and a published hardcover monograph distributed to global cultural institutions.",
      metrics: [
        { val: "3", desc: "Major European cultural museum commissions secured ($18M+ value)" },
        { val: "TDC 2022", desc: "Tokyo Type Directors Club Annual Selection" },
        { val: "100%", desc: "Digital archive accessibility compliance (WCAG AAA)" }
      ]
    },
    mono: {
      title: "Mono Journal — Fluid Digital Publishing Platform",
      category: "Editorial",
      image: "assets/project-mono.svg",
      challenge: "A four-decade-old cultural periodical suffered subscriber attrition due to an outdated, slow-loading digital interface that failed to translate its renowned print layout.",
      approach: "Created a fluid editorial grid engine featuring bespoke serif type scales, distraction-free reading environments, and instant offline client indexing.",
      solution: "Built a lightning-fast responsive publishing engine with custom drop caps, footnote popovers, and reading progress indicators.",
      metrics: [
        { val: "+165%", desc: "Growth in paid digital subscriptions within 90 days" },
        { val: "4.8 min", desc: "Average session reading duration (3.2x industry benchmark)" },
        { val: "99.4%", desc: "PageSpeed Performance Score on mobile devices" }
      ]
    },
    lumina: {
      title: "Lumina Kinetic — Smart Luminaire Companion Architecture",
      category: "Spatial / Physical",
      image: "assets/project-lumina.svg",
      challenge: "Kinetic smart lighting hardware with motor-articulated optical arrays required an interface that made complex photometric tuning feel intuitive.",
      approach: "Designed a radial photometric controller with real-time Kelvin color temperature transitions and physics-based gesture inertia.",
      solution: "Engineered companion iOS and wall-mount controller software with one-touch architectural lighting scene morphing and circadian syncing.",
      metrics: [
        { val: "Red Dot", desc: "Best of the Best 2025 Hardware & Companion UI" },
        { val: "12,000+", desc: "Luxury architectural installations worldwide" },
        { val: "98.7%", desc: "Positive user satisfaction rating in post-install surveys" }
      ]
    },
    sylvan: {
      title: "Sylvan Botanics — Sustainable Apothecary & Flagship Store",
      category: "Brand Systems",
      image: "assets/project-sylvan.svg",
      challenge: "Launching an ultra-luxury sustainable botanical skincare range using 100% post-consumer materials without sacrificing high-end tactile elegance.",
      approach: "Engineered zero-adhesive origami carton die-lines, blind embossed mineral foil marks, and an editorial e-commerce digital flagship.",
      solution: "Complete omni-channel brand system from physical unboxing experience to sub-50ms headless e-commerce checkout flow.",
      metrics: [
        { val: "240k", desc: "Units sold out in first 6 weeks post-launch" },
        { val: "0g", desc: "Single-use plastic used in entire supply chain" },
        { val: "4.9/5", desc: "Average verified customer unboxing review rating" }
      ]
    }
  };

  // 2. Category Filtering
  const filterTabs = document.querySelectorAll('.filter-tab');
  const projectCards = document.querySelectorAll('.project-card');

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const cardCat = card.getAttribute('data-category');
        if (category === 'all' || cardCat === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 3. Case Study Modal Interactions
  const modal = document.getElementById('caseStudyModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalImageContainer = document.getElementById('modalImageContainer');
  const modalChallenge = document.getElementById('modalChallenge');
  const modalApproach = document.getElementById('modalApproach');
  const modalSolution = document.getElementById('modalSolution');
  const modalMetrics = document.getElementById('modalMetrics');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCloseFootBtn = document.getElementById('modalCloseFootBtn');
  const modalDiscussBtn = document.getElementById('modalDiscussBtn');

  function openModal(projectId) {
    const data = CASE_STUDIES[projectId];
    if (!data || !modal) return;

    modalTitle.textContent = data.title;
    modalCategory.textContent = data.category;
    modalImageContainer.innerHTML = '<img src="' + data.image + '" alt="' + data.title + '" class="modal-case-img">';
    modalChallenge.textContent = data.challenge;
    modalApproach.textContent = data.approach;
    modalSolution.textContent = data.solution;

    modalMetrics.innerHTML = data.metrics.map(m => 
      '<div class="metric-box"><div class="metric-val">' + m.val + '</div><div class="metric-desc">' + m.desc + '</div></div>'
    ).join('');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  projectCards.forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      if (id) openModal(id);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.getAttribute('data-id');
        if (id) openModal(id);
      }
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCloseFootBtn) modalCloseFootBtn.addEventListener('click', closeModal);
  if (modalDiscussBtn) modalDiscussBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 4. Commission Form Validation & Submission
  const form = document.getElementById('inquiryForm');
  const successPanel = document.getElementById('formSuccess');
  const resetBtn = document.getElementById('resetFormBtn');

  if (form && successPanel) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const nameInput = document.getElementById('clientName');
      const emailInput = document.getElementById('clientEmail');
      const briefInput = document.getElementById('projectBrief');

      if (!nameInput.value.trim()) {
        nameInput.parentElement.classList.add('has-error');
        isValid = false;
      } else {
        nameInput.parentElement.classList.remove('has-error');
      }

      if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
        emailInput.parentElement.classList.add('has-error');
        isValid = false;
      } else {
        emailInput.parentElement.classList.remove('has-error');
      }

      if (!briefInput.value.trim()) {
        briefInput.parentElement.classList.add('has-error');
        isValid = false;
      } else {
        briefInput.parentElement.classList.remove('has-error');
      }

      if (isValid) {
        form.classList.add('hidden');
        successPanel.classList.remove('hidden');
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        successPanel.classList.add('hidden');
        form.classList.remove('hidden');
      });
    }
  }
});`;

  // 6 Intricate Inline SVGs for Project Previews (16:10 aspect ratio 800x500)
  const aetherSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="100%" stop-color="#141926"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="800" height="500" fill="url(#bgGrad)"/>
  <!-- Ambient Spatial Glow -->
  <circle cx="200" cy="180" r="140" fill="#8b5cf6" opacity="0.18" filter="url(#glow)"/>
  <circle cx="640" cy="340" r="160" fill="#3b82f6" opacity="0.14" filter="url(#glow)"/>
  <!-- Spatial Window Chrome 1 -->
  <rect x="60" y="60" width="440" height="280" rx="14" fill="#151b2c" fill-opacity="0.8" stroke="#2d3748" stroke-width="1.5"/>
  <rect x="60" y="60" width="440" height="40" rx="14" fill="#1a2236"/>
  <circle cx="84" cy="80" r="5" fill="#ef4444"/>
  <circle cx="102" cy="80" r="5" fill="#f59e0b"/>
  <circle cx="120" cy="80" r="5" fill="#10b981"/>
  <text x="144" y="84" fill="#94a3b8" font-family="monospace" font-size="12">Aether · Physics Shader Engine v4.2</text>
  <!-- Window Content -->
  <rect x="88" y="124" width="180" height="8" rx="4" fill="#8b5cf6"/>
  <rect x="88" y="144" width="280" height="6" rx="3" fill="#475569"/>
  <rect x="88" y="160" width="220" height="6" rx="3" fill="#334155"/>
  <!-- Component Tokens Matrix -->
  <rect x="88" y="190" width="80" height="60" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
  <rect x="180" y="190" width="80" height="60" rx="8" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>
  <rect x="272" y="190" width="80" height="60" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
  <!-- Floating Spatial Tool Palette -->
  <rect x="420" y="180" width="320" height="240" rx="16" fill="#0f172a" fill-opacity="0.92" stroke="#6366f1" stroke-width="1.5"/>
  <text x="444" y="214" fill="#ffffff" font-family="sans-serif" font-weight="700" font-size="14">Spatial Depth Parameters</text>
  <rect x="444" y="234" width="272" height="1" fill="#334155"/>
  <!-- Slider 1 -->
  <text x="444" y="260" fill="#94a3b8" font-family="sans-serif" font-size="11">Volumetric Refraction: 1.48</text>
  <rect x="444" y="270" width="272" height="6" rx="3" fill="#1e293b"/>
  <rect x="444" y="270" width="180" height="6" rx="3" fill="url(#accentGrad)"/>
  <circle cx="624" cy="273" r="7" fill="#ffffff"/>
  <!-- Slider 2 -->
  <text x="444" y="306" fill="#94a3b8" font-family="sans-serif" font-size="11">Haptic Resonance: 16ms</text>
  <rect x="444" y="316" width="272" height="6" rx="3" fill="#1e293b"/>
  <rect x="444" y="316" width="220" height="6" rx="3" fill="url(#accentGrad)"/>
  <circle cx="664" cy="319" r="7" fill="#ffffff"/>
  <!-- Badge -->
  <rect x="444" y="348" width="120" height="28" rx="6" fill="#312e81"/>
  <text x="462" y="366" fill="#c7d2fe" font-family="sans-serif" font-weight="700" font-size="11">60 FPS VERIFIED</text>
</svg>`;

  const vanguardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="#080c14"/>
  <!-- Terminal Top Bar -->
  <rect x="40" y="40" width="720" height="50" rx="8" fill="#0f172a" stroke="#1e293b"/>
  <text x="64" y="70" fill="#10b981" font-family="monospace" font-weight="700" font-size="14">VANGUARD / INSTITUTIONAL DESK · USD/JPY 154.82</text>
  <rect x="620" y="52" width="120" height="26" rx="4" fill="#064e3b"/>
  <text x="636" y="69" fill="#34d399" font-family="monospace" font-size="11" font-weight="700">+1.84% LIVE</text>
  <!-- Chart Canvas -->
  <rect x="40" y="104" width="460" height="340" rx="8" fill="#0d131f" stroke="#1e293b"/>
  <!-- Grid Guidelines -->
  <line x1="40" y1="160" x2="500" y2="160" stroke="#1e293b" stroke-dasharray="4"/>
  <line x1="40" y1="220" x2="500" y2="220" stroke="#1e293b" stroke-dasharray="4"/>
  <line x1="40" y1="280" x2="500" y2="280" stroke="#1e293b" stroke-dasharray="4"/>
  <line x1="40" y1="340" x2="500" y2="340" stroke="#1e293b" stroke-dasharray="4"/>
  <!-- Trend Area -->
  <polygon points="60,340 100,320 140,330 180,260 220,280 260,210 300,230 340,180 380,190 420,140 460,150 480,120 480,420 60,420" fill="url(#finGrad)"/>
  <polyline points="60,340 100,320 140,330 180,260 220,280 260,210 300,230 340,180 380,190 420,140 460,150 480,120" fill="none" stroke="#10b981" stroke-width="2.5"/>
  <!-- Candlesticks -->
  <rect x="96" y="310" width="8" height="24" fill="#10b981"/>
  <rect x="176" y="250" width="8" height="32" fill="#ef4444"/>
  <rect x="256" y="200" width="8" height="28" fill="#10b981"/>
  <rect x="336" y="170" width="8" height="30" fill="#10b981"/>
  <rect x="416" y="130" width="8" height="28" fill="#10b981"/>
  <!-- Depth Orderbook Sidepanel -->
  <rect x="516" y="104" width="244" height="340" rx="8" fill="#0d131f" stroke="#1e293b"/>
  <text x="536" y="132" fill="#94a3b8" font-family="monospace" font-size="11" font-weight="700">DEPTH ORDERBOOK</text>
  <rect x="536" y="150" width="204" height="18" fill="#ef4444" fill-opacity="0.15"/>
  <text x="544" y="163" fill="#f87171" font-family="monospace" font-size="10">154.90 &bull; 4,200 LOTS</text>
  <rect x="536" y="174" width="170" height="18" fill="#ef4444" fill-opacity="0.25"/>
  <text x="544" y="187" fill="#f87171" font-family="monospace" font-size="10">154.88 &bull; 8,150 LOTS</text>
  <rect x="536" y="198" width="130" height="18" fill="#ef4444" fill-opacity="0.35"/>
  <text x="544" y="211" fill="#f87171" font-family="monospace" font-size="10">154.85 &bull; 12,400 LOTS</text>
  <!-- Spread -->
  <line x1="536" y1="228" x2="740" y2="228" stroke="#334155"/>
  <text x="584" y="244" fill="#38bdf8" font-family="monospace" font-size="11">SPREAD: 0.2 PIPS</text>
  <line x1="536" y1="256" x2="740" y2="256" stroke="#334155"/>
  <!-- Bids -->
  <rect x="536" y="268" width="140" height="18" fill="#10b981" fill-opacity="0.35"/>
  <text x="544" y="281" fill="#34d399" font-family="monospace" font-size="10">154.80 &bull; 14,800 LOTS</text>
  <rect x="536" y="292" width="180" height="18" fill="#10b981" fill-opacity="0.25"/>
  <text x="544" y="305" fill="#34d399" font-family="monospace" font-size="10">154.78 &bull; 9,300 LOTS</text>
  <rect x="536" y="316" width="204" height="18" fill="#10b981" fill-opacity="0.15"/>
  <text x="544" y="329" fill="#34d399" font-family="monospace" font-size="10">154.75 &bull; 5,100 LOTS</text>
</svg>`;

  const komorebiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#f5f0ea"/>
  <!-- Architectural Monograph Swiss Grid -->
  <line x1="80" y1="40" x2="80" y2="460" stroke="#dcd4c8" stroke-width="1"/>
  <line x1="280" y1="40" x2="280" y2="460" stroke="#dcd4c8" stroke-width="1"/>
  <line x1="520" y1="40" x2="520" y2="460" stroke="#dcd4c8" stroke-width="1"/>
  <line x1="720" y1="40" x2="720" y2="460" stroke="#dcd4c8" stroke-width="1"/>
  <line x1="40" y1="80" x2="760" y2="80" stroke="#dcd4c8" stroke-width="1"/>
  <line x1="40" y1="420" x2="760" y2="420" stroke="#dcd4c8" stroke-width="1"/>
  <!-- Monograph Numbering -->
  <text x="84" y="68" fill="#1c1917" font-family="serif" font-size="20" font-weight="700">03 / ARCHITECTURAL ARCHIVE</text>
  <text x="524" y="68" fill="#78716c" font-family="sans-serif" font-size="10" letter-spacing="2">TOKYO &bull; ZURICH &bull; 2025</text>
  <!-- Architectural Silhouette & Golden Spiral -->
  <polygon points="120,380 120,180 240,180 240,240 360,240 360,380" fill="#292524"/>
  <polygon points="360,380 360,140 480,140 480,380" fill="#44403c"/>
  <!-- Wireframe Golden Section Axis -->
  <circle cx="280" cy="240" r="120" fill="none" stroke="#a8a29e" stroke-dasharray="3"/>
  <circle cx="280" cy="240" r="60" fill="none" stroke="#78716c"/>
  <!-- Typography Specimen Column -->
  <text x="540" y="140" fill="#1c1917" font-family="serif" font-size="32" font-weight="400">木漏れ日</text>
  <text x="540" y="170" fill="#292524" font-family="sans-serif" font-size="16" font-weight="700">KOMOREBI ARCHITECTURE</text>
  <rect x="540" y="184" width="160" height="2" fill="#1c1917"/>
  <text x="540" y="214" fill="#57534e" font-family="serif" font-size="13" font-style="italic">"Light filtering through architectural canopy."</text>
  <text x="540" y="248" fill="#78716c" font-family="monospace" font-size="10">TYPE: Bespoke Ligature Serif</text>
  <text x="540" y="268" fill="#78716c" font-family="monospace" font-size="10">GRID: 12-Column Root-2 System</text>
  <text x="540" y="288" fill="#78716c" font-family="monospace" font-size="10">PAPER: 180gsm Uncoated Cotton</text>
</svg>`;

  const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#111318"/>
  <!-- Editorial Publication Frame -->
  <rect x="60" y="40" width="680" height="420" rx="8" fill="#181c24" stroke="#2a3242"/>
  <text x="100" y="80" fill="#94a3b8" font-family="sans-serif" font-size="11" letter-spacing="3" font-weight="700">MONO JOURNAL · ESSAY N° 48</text>
  <line x1="100" y1="94" x2="700" y2="94" stroke="#2a3242"/>
  <!-- Drop Cap Headline -->
  <text x="100" y="170" fill="#ffffff" font-family="serif" font-size="72" font-weight="700">T</text>
  <text x="160" y="136" fill="#ffffff" font-family="serif" font-size="24" font-weight="600">he Disappearance of Quiet Workspaces</text>
  <text x="160" y="162" fill="#94a3b8" font-family="sans-serif" font-size="13">By Julian Thorne &bull; 8 min read &bull; Digital Publishing Engine</text>
  <!-- Dual Column Layout -->
  <rect x="100" y="200" width="270" height="8" rx="2" fill="#475569"/>
  <rect x="100" y="218" width="250" height="8" rx="2" fill="#334155"/>
  <rect x="100" y="236" width="270" height="8" rx="2" fill="#334155"/>
  <rect x="100" y="254" width="230" height="8" rx="2" fill="#334155"/>
  <rect x="100" y="272" width="260" height="8" rx="2" fill="#334155"/>
  <!-- Pull Quote Box -->
  <rect x="100" y="304" width="270" height="80" rx="6" fill="#202634" stroke="#3b4559"/>
  <text x="116" y="334" fill="#e2e8f0" font-family="serif" font-style="italic" font-size="14">"Typography is visible breath."</text>
  <text x="116" y="360" fill="#64748b" font-family="sans-serif" font-size="10">— Architectural Typographic Axioms</text>
  <!-- Column 2 -->
  <rect x="420" y="130" width="280" height="180" rx="8" fill="#0d1117" stroke="#3b4252"/>
  <!-- Inline Diagram -->
  <circle cx="560" cy="220" r="50" fill="none" stroke="#8b5cf6" stroke-width="2"/>
  <circle cx="560" cy="220" r="28" fill="none" stroke="#38bdf8" stroke-dasharray="4"/>
  <text x="560" y="224" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="11">FLUID SCALE</text>
  <!-- Reading Progress Bar -->
  <rect x="60" y="456" width="680" height="4" fill="#1e293b"/>
  <rect x="60" y="456" width="420" height="4" fill="#8b5cf6"/>
</svg>`;

  const luminaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <radialGradient id="luminaGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="500" fill="#0b0f19"/>
  <circle cx="400" cy="250" r="220" fill="url(#luminaGlow)"/>
  <!-- Hardware Controller Outer Ring -->
  <circle cx="400" cy="250" r="160" fill="#111827" stroke="#374151" stroke-width="2"/>
  <!-- Radial Arc Photometric Gauge -->
  <circle cx="400" cy="250" r="130" fill="none" stroke="#1f2937" stroke-width="16"/>
  <circle cx="400" cy="250" r="130" fill="none" stroke="#f59e0b" stroke-width="16" stroke-dasharray="612" stroke-dashoffset="180" stroke-linecap="round"/>
  <!-- Inner Touch Plate -->
  <circle cx="400" cy="250" r="90" fill="#0f172a" stroke="#4b5563" stroke-width="1.5"/>
  <text x="400" y="240" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-weight="800" font-size="32">3,200K</text>
  <text x="400" y="268" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="12" letter-spacing="1">WARM SUNLIGHT</text>
  <!-- Peripheral Control Nodes -->
  <rect x="100" y="100" width="160" height="60" rx="8" fill="#1e293b" stroke="#374151"/>
  <text x="120" y="126" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="700">Circadian Drift</text>
  <text x="120" y="146" fill="#10b981" font-family="monospace" font-size="10">SYNCHRONIZED</text>
  <rect x="540" y="340" width="160" height="60" rx="8" fill="#1e293b" stroke="#374151"/>
  <text x="560" y="366" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="700">Kinetic Aperture</text>
  <text x="560" y="386" fill="#f59e0b" font-family="monospace" font-size="10">WIDE FLUX (68°)</text>
</svg>`;

  const sylvanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="800" height="500" fill="#0d1b14"/>
  <!-- Sustainable Apothecary Carton Dieline -->
  <rect x="100" y="60" width="600" height="380" rx="4" fill="#12261d" stroke="#234534" stroke-width="1.5"/>
  <line x1="250" y1="60" x2="250" y2="440" stroke="#234534" stroke-dasharray="5"/>
  <line x1="400" y1="60" x2="400" y2="440" stroke="#234534" stroke-dasharray="5"/>
  <line x1="550" y1="60" x2="550" y2="440" stroke="#234534" stroke-dasharray="5"/>
  <!-- Gold Stamping Accent -->
  <text x="325" y="140" text-anchor="middle" fill="#d4af37" font-family="serif" font-size="24" font-weight="700" letter-spacing="4">SYLVAN</text>
  <text x="325" y="164" text-anchor="middle" fill="#88b598" font-family="sans-serif" font-size="9" letter-spacing="3">BOTANICAL ARCHIVES</text>
  <!-- Botanical Leaf Icon -->
  <path d="M 325 180 C 310 210 310 240 325 260 C 340 240 340 210 325 180 Z" fill="none" stroke="#d4af37" stroke-width="2"/>
  <line x1="325" y1="180" x2="325" y2="260" stroke="#d4af37" stroke-width="1.5"/>
  <!-- Sustainable Certification Badges -->
  <rect x="275" y="300" width="100" height="24" rx="4" fill="#0d1b14" stroke="#234534"/>
  <text x="325" y="316" text-anchor="middle" fill="#88b598" font-family="monospace" font-size="9">100% POST-CONSUMER</text>
  <!-- Flap Spec Panel -->
  <text x="140" y="100" fill="#4d7c60" font-family="monospace" font-size="9">FLAP: ZERO ADHESIVE</text>
  <text x="140" y="120" fill="#4d7c60" font-family="monospace" font-size="9">DIELINE: 340GSM KRAFT</text>
  <text x="140" y="140" fill="#4d7c60" font-family="monospace" font-size="9">PIGMENT: SOY VEGETAL</text>
</svg>`;

  return [
    { path: 'index.html', language: 'html', content: html },
    { path: 'styles/theme.css', language: 'css', content: themeCss },
    { path: 'assets/site.css', language: 'css', content: siteCss },
    { path: 'assets/site.js', language: 'javascript', content: siteJs },
    { path: 'assets/project-aether.svg', language: 'xml', content: aetherSvg },
    { path: 'assets/project-vanguard.svg', language: 'xml', content: vanguardSvg },
    { path: 'assets/project-komorebi.svg', language: 'xml', content: komorebiSvg },
    { path: 'assets/project-mono.svg', language: 'xml', content: monoSvg },
    { path: 'assets/project-lumina.svg', language: 'xml', content: luminaSvg },
    { path: 'assets/project-sylvan.svg', language: 'xml', content: sylvanSvg },
    { path: 'styles.css', language: 'css', content: `${themeCss}\n\n${siteCss}` },
    { path: 'app.js', language: 'javascript', content: siteJs },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# ${directorName} — Design Director Portfolio\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: Editorial compact hero, 6 distinct project thumbnails (16:10 aspect ratio), Categories filter, In-depth case study modal with outcome metrics, Biography & 4-pillar skills matrix, Functional commission form, Sample content disclaimer.\n- Run: Open index.html in any modern browser.`,
    },
  ];
}

// ============================================================================
// 2. SAAS ANALYTICS DASHBOARD ARCHETYPE
// ============================================================================

export function synthesizeDashboardApp(brief: string): ProjectFile[] {
  const cleanTitle = brief.replace(/^(build|create|make|design)\s+(a|an)?\s*/i, '').trim();
  const appName = 'SalesPulse';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} — Real-Time Sales & Revenue Analytics</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body class="dashboard-body">
  <!-- Top Sample Data Notice -->
  <aside class="sample-topbar">
    <div class="sample-topbar-inner">
      <span class="sample-pill">⚡ Realistic Telemetry Demo</span>
      <span>Synthetic analytics data stream &bull; Live client-side filtering & real CSV blob export enabled.</span>
    </div>
  </aside>

  <!-- Full Canvas Width App Shell (No premature cutoff or dead margins) -->
  <div class="app-layout">
    <!-- Compact Collapsible Sidebar -->
    <aside class="app-sidebar" id="appSidebar">
      <div class="sidebar-head">
        <div class="brand-logo">
          <span class="logo-mark">📊</span>
          <span class="logo-name">${appName}</span>
        </div>
        <button type="button" class="sidebar-close-mobile" id="sidebarCloseMobile" aria-label="Close Sidebar">&times;</button>
      </div>

      <nav class="sidebar-nav">
        <a href="#overview" class="nav-item active"><span class="icon">📈</span> <span class="nav-label">Overview</span></a>
        <a href="#revenue" class="nav-item"><span class="icon">⚡</span> <span class="nav-label">Revenue Streams</span></a>
        <a href="#transactions" class="nav-item"><span class="icon">💳</span> <span class="nav-label">Transactions</span></a>
        <a href="#customers" class="nav-item"><span class="icon">👥</span> <span class="nav-label">Customers</span></a>
        <a href="#reports" class="nav-item"><span class="icon">📑</span> <span class="nav-label">Reports & Export</span></a>
        <a href="#settings" class="nav-item"><span class="icon">⚙️</span> <span class="nav-label">Settings</span></a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-pill">
          <span class="user-avatar">AD</span>
          <div class="user-meta">
            <span class="user-name">Alex Drake</span>
            <span class="user-role">Lead Revenue Analyst</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Canvas (Uses 100% available browser width) -->
    <div class="app-main">
      <!-- Top Action Bar -->
      <header class="app-topbar">
        <div class="topbar-left">
          <button type="button" class="mobile-menu-btn" id="sidebarToggle" aria-label="Toggle Navigation">☰</button>
          <div class="page-title-wrap">
            <h1 class="page-title">Sales Analytics & Revenue Performance</h1>
            <span class="live-pulse"><span class="pulse-dot"></span> Live Data Pipeline Connected</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="date-selector">
            <span class="calendar-icon">📅</span>
            <span>Current Billing Cycle (Q4 2026)</span>
          </div>
          <button type="button" class="btn btn-primary" id="exportBtn">
            <span>⬇ Export CSV</span>
          </button>
        </div>
      </header>

      <!-- Scrollable Analytics Content -->
      <main class="app-content">
        
        <!-- 4 KPI Cards in Responsive 4-Column Desktop Grid -->
        <section class="kpi-grid">
          <!-- Card 1 -->
          <article class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Total Monthly Revenue</span>
              <span class="trend-badge trend-up">+18.4%</span>
            </div>
            <div class="kpi-value">$128,450.00</div>
            <div class="kpi-subtext">+$19,820.00 vs previous month</div>
          </article>

          <!-- Card 2 -->
          <article class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Active Paid Subscribers</span>
              <span class="trend-badge trend-up">+8.2%</span>
            </div>
            <div class="kpi-value">1,420</div>
            <div class="kpi-subtext">+114 net additions this cycle</div>
          </article>

          <!-- Card 3 -->
          <article class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Monthly Churn Rate</span>
              <span class="trend-badge trend-up">-0.4%</span>
            </div>
            <div class="kpi-value">1.18%</div>
            <div class="kpi-subtext">Lowest churn in 6 consecutive quarters</div>
          </article>

          <!-- Card 4 -->
          <article class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Avg Revenue Per User (ARPU)</span>
              <span class="trend-badge trend-up">+5.1%</span>
            </div>
            <div class="kpi-value">$86.50</div>
            <div class="kpi-subtext">Driven by annual enterprise plan upgrades</div>
          </article>
        </section>

        <!-- Monthly Revenue Bar Chart with Interactive Hover Tooltips -->
        <section class="chart-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Monthly Revenue Trajectory (Jan – Dec 2026)</h2>
              <p class="panel-subtitle">Verified recurring payment volume across all gateway providers</p>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot dot-actual"></span> Actual Volume</span>
              <span class="legend-item"><span class="dot dot-target"></span> Target Growth</span>
            </div>
          </div>

          <!-- Responsive CSS/SVG Bar Chart with Hover Tooltips -->
          <div class="bar-chart-container">
            <div class="y-axis">
              <span>$140k</span>
              <span>$105k</span>
              <span>$70k</span>
              <span>$35k</span>
              <span>$0</span>
            </div>
            <div class="bars-track">
              <!-- Jan -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 34%;" data-month="Jan" data-val="$48,200">
                  <div class="chart-tooltip"><strong>Jan:</strong> $48,200</div>
                </div>
                <span class="bar-month">Jan</span>
              </div>
              <!-- Feb -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 39%;" data-month="Feb" data-val="$55,100">
                  <div class="chart-tooltip"><strong>Feb:</strong> $55,100</div>
                </div>
                <span class="bar-month">Feb</span>
              </div>
              <!-- Mar -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 44%;" data-month="Mar" data-val="$62,400">
                  <div class="chart-tooltip"><strong>Mar:</strong> $62,400</div>
                </div>
                <span class="bar-month">Mar</span>
              </div>
              <!-- Apr -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 41%;" data-month="Apr" data-val="$58,300">
                  <div class="chart-tooltip"><strong>Apr:</strong> $58,300</div>
                </div>
                <span class="bar-month">Apr</span>
              </div>
              <!-- May -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 50%;" data-month="May" data-val="$70,500">
                  <div class="chart-tooltip"><strong>May:</strong> $70,500</div>
                </div>
                <span class="bar-month">May</span>
              </div>
              <!-- Jun -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 54%;" data-month="Jun" data-val="$76,800">
                  <div class="chart-tooltip"><strong>Jun:</strong> $76,800</div>
                </div>
                <span class="bar-month">Jun</span>
              </div>
              <!-- Jul -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 60%;" data-month="Jul" data-val="$84,200">
                  <div class="chart-tooltip"><strong>Jul:</strong> $84,200</div>
                </div>
                <span class="bar-month">Jul</span>
              </div>
              <!-- Aug -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 65%;" data-month="Aug" data-val="$92,100">
                  <div class="chart-tooltip"><strong>Aug:</strong> $92,100</div>
                </div>
                <span class="bar-month">Aug</span>
              </div>
              <!-- Sep -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 62%;" data-month="Sep" data-val="$88,400">
                  <div class="chart-tooltip"><strong>Sep:</strong> $88,400</div>
                </div>
                <span class="bar-month">Sep</span>
              </div>
              <!-- Oct -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 70%;" data-month="Oct" data-val="$98,900">
                  <div class="chart-tooltip"><strong>Oct:</strong> $98,900</div>
                </div>
                <span class="bar-month">Oct</span>
              </div>
              <!-- Nov -->
              <div class="bar-col">
                <div class="bar-fill" style="height: 77%;" data-month="Nov" data-val="$108,600">
                  <div class="chart-tooltip"><strong>Nov:</strong> $108,600</div>
                </div>
                <span class="bar-month">Nov</span>
              </div>
              <!-- Dec (Current Peak) -->
              <div class="bar-col">
                <div class="bar-fill bar-current" style="height: 91%;" data-month="Dec" data-val="$128,450">
                  <div class="chart-tooltip"><strong>Dec (Current):</strong> $128,450</div>
                </div>
                <span class="bar-month">Dec</span>
              </div>
            </div>
          </div>
        </section>

        <!-- DEDICATED REVENUE BREAKDOWN BY STREAM SECTION -->
        <section class="breakdown-panel" id="revenue">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Revenue Breakdown by Stream</h2>
              <p class="panel-subtitle">Proportional contribution across subscription tiers & usage consumption</p>
            </div>
            <div class="stream-total">
              <span class="total-label">Total Inflow:</span>
              <span class="total-val">$128,450.00</span>
            </div>
          </div>

          <!-- Multi-Segment Proportional Progress Bar -->
          <div class="stream-progress-bar" role="progressbar" aria-label="Revenue distribution across streams">
            <div class="progress-segment seg-enterprise" style="width: 62%;" title="Enterprise Tier: 62%"></div>
            <div class="progress-segment seg-pro" style="width: 26%;" title="Pro Tier: 26%"></div>
            <div class="progress-segment seg-addons" style="width: 12%;" title="Usage Add-ons: 12%"></div>
          </div>

          <!-- Stream Detail Cards -->
          <div class="stream-cards-grid">
            <div class="stream-card">
              <div class="stream-head">
                <span class="stream-color-dot dot-enterprise"></span>
                <span class="stream-name">Enterprise Annual Contracts</span>
              </div>
              <div class="stream-amount">$79,640.00</div>
              <div class="stream-meta">
                <span class="stream-share">62.0% share</span>
                <span class="stream-growth text-green">+24.6% YoY</span>
              </div>
              <p class="stream-detail">Dedicated multi-tenant clusters, custom SLAs, and custom model fine-tuning.</p>
            </div>

            <div class="stream-card">
              <div class="stream-head">
                <span class="stream-color-dot dot-pro"></span>
                <span class="stream-name">Pro Developer Subscriptions</span>
              </div>
              <div class="stream-amount">$33,400.00</div>
              <div class="stream-meta">
                <span class="stream-share">26.0% share</span>
                <span class="stream-growth text-green">+12.2% YoY</span>
              </div>
              <p class="stream-detail">Standard monthly self-serve developer subscriptions at $79/seat.</p>
            </div>

            <div class="stream-card">
              <div class="stream-head">
                <span class="stream-color-dot dot-addons"></span>
                <span class="stream-name">Overage Tokens & Data Egress</span>
              </div>
              <div class="stream-amount">$15,410.00</div>
              <div class="stream-meta">
                <span class="stream-share">12.0% share</span>
                <span class="stream-growth text-green">+31.0% YoY</span>
              </div>
              <p class="stream-detail">High-throughput token consumption past monthly quotas and dedicated egress.</p>
            </div>
          </div>
        </section>

        <!-- Searchable & Filterable Transactions Table with Live Record Counter -->
        <section class="table-panel" id="transactions">
          <div class="table-panel-header">
            <div>
              <h2 class="panel-title">Recent Sales & Billing Transactions</h2>
              <div class="record-counter-wrap">
                <span id="tableRecordCount" class="record-counter">Showing 5 of 5 transactions</span>
              </div>
            </div>

            <!-- Controls: Search Input + Status Select -->
            <div class="table-controls">
              <div class="search-input-wrap">
                <span class="search-icon">🔍</span>
                <input type="text" id="searchInput" placeholder="Search by customer, order ID, plan tier..." class="search-input">
              </div>
              <select id="statusFilter" class="status-select">
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table" id="transactionsTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Timestamp</th>
                  <th>Plan Tier</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="tableBody">
                <tr data-status="completed" data-search="ord-9921 maya chen enterprise annual 1908.00">
                  <td><code class="order-code">ORD-9921</code></td>
                  <td><strong>Maya Chen</strong><span class="customer-sub">chen@scaleinfra.io</span></td>
                  <td>Dec 24, 2026 &bull; 14:22</td>
                  <td><span class="tier-badge tier-enterprise">Enterprise (Annual)</span></td>
                  <td><strong class="amount-val">$1,908.00</strong></td>
                  <td><span class="status-pill status-completed">Completed</span></td>
                </tr>
                <tr data-status="completed" data-search="ord-9920 liam o'connor pro developer 79.00">
                  <td><code class="order-code">ORD-9920</code></td>
                  <td><strong>Liam O'Connor</strong><span class="customer-sub">liam@devloop.co</span></td>
                  <td>Dec 24, 2026 &bull; 11:05</td>
                  <td><span class="tier-badge tier-pro">Pro Developer</span></td>
                  <td><strong class="amount-val">$79.00</strong></td>
                  <td><span class="status-pill status-completed">Completed</span></td>
                </tr>
                <tr data-status="processing" data-search="ord-9919 zoe alvarez starter monthly 29.00">
                  <td><code class="order-code">ORD-9919</code></td>
                  <td><strong>Zoe Alvarez</strong><span class="customer-sub">zoe.a@fintechaudits.com</span></td>
                  <td>Dec 23, 2026 &bull; 18:40</td>
                  <td><span class="tier-badge tier-starter">Starter Monthly</span></td>
                  <td><strong class="amount-val">$29.00</strong></td>
                  <td><span class="status-pill status-processing">Processing</span></td>
                </tr>
                <tr data-status="completed" data-search="ord-9918 david kim pro developer annual 768.00">
                  <td><code class="order-code">ORD-9918</code></td>
                  <td><strong>David Kim</strong><span class="customer-sub">d.kim@metaruntime.dev</span></td>
                  <td>Dec 23, 2026 &bull; 09:15</td>
                  <td><span class="tier-badge tier-pro">Pro Developer (Annual)</span></td>
                  <td><strong class="amount-val">$768.00</strong></td>
                  <td><span class="status-pill status-completed">Completed</span></td>
                </tr>
                <tr data-status="refunded" data-search="ord-9917 sophia rossi starter monthly 29.00">
                  <td><code class="order-code">ORD-9917</code></td>
                  <td><strong>Sophia Rossi</strong><span class="customer-sub">rossi@rossidesign.it</span></td>
                  <td>Dec 22, 2026 &bull; 16:50</td>
                  <td><span class="tier-badge tier-starter">Starter Monthly</span></td>
                  <td><strong class="amount-val">$29.00</strong></td>
                  <td><span class="status-pill status-refunded">Refunded</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  </div>

  <!-- Real Export Feedback Toast -->
  <div id="toast" class="toast hidden" role="status" aria-live="polite"></div>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-bg: #090d16;
  --color-surface: #0f1523;
  --color-surface-hover: #161e31;
  --color-surface-subtle: #1c263d;
  --color-border: #1f2b42;
  --color-border-hover: #2e3e5e;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-text-dim: #64748b;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-emerald: #10b981;
  --color-amber: #f59e0b;
  --color-rose: #ef4444;
  --font-sans: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", "Segoe UI", Roboto, sans-serif;
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Notice Bar */
.sample-topbar {
  background: #111827;
  border-bottom: 1px solid #1f2937;
  padding: 6px 16px;
  font-size: 11px;
}
.sample-topbar-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9ca3af;
}
.sample-pill {
  background: #2563eb;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10px;
}

/* App Shell: Uses 100% of available browser width without cutoff */
.app-layout {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
}

/* Compact Sidebar */
.app-sidebar {
  width: 240px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}
.sidebar-head {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-mark { font-size: 20px; }
.logo-name {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
}
.sidebar-close-mobile {
  display: none;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 24px;
  cursor: pointer;
}
.sidebar-nav {
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition);
}
.nav-item:hover {
  background: var(--color-surface-hover);
  color: #ffffff;
}
.nav-item.active {
  background: var(--color-surface-subtle);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--color-border);
}
.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
}
.user-meta {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}
.user-role {
  font-size: 10px;
  color: var(--color-text-dim);
}

/* Main Content Area */
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}
.app-topbar {
  height: 64px;
  padding: 0 28px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 20px;
  cursor: pointer;
}
.page-title {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}
.live-pulse {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-emerald);
  margin-left: 10px;
}
.pulse-dot {
  width: 6px;
  height: 6px;
  background: var(--color-emerald);
  border-radius: 9999px;
  box-shadow: 0 0 8px var(--color-emerald);
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.date-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  border: none;
}
.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* App Canvas Scroll Area */
.app-content {
  padding: 24px 28px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

/* 4 KPI Cards in Responsive 4-Column Desktop Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  transition: var(--transition);
}
.kpi-card:hover {
  border-color: var(--color-border-hover);
  background: var(--color-surface-hover);
}
.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.trend-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}
.trend-up {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-emerald);
}
.kpi-value {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}
.kpi-subtext {
  font-size: 11px;
  color: var(--color-text-dim);
}

/* Monthly Revenue Chart */
.chart-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 22px 24px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}
.panel-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.chart-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}
.dot-actual { background: var(--color-primary); }
.dot-target { background: #475569; }

.bar-chart-container {
  display: flex;
  height: 220px;
  gap: 16px;
  padding-top: 10px;
}
.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-text-dim);
  text-align: right;
  width: 36px;
  padding-bottom: 24px;
}
.bars-track {
  display: flex;
  flex: 1;
  gap: 12px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 4px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  position: relative;
}
.bar-fill {
  width: 100%;
  max-width: 38px;
  background: var(--color-primary);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
}
.bar-fill:hover {
  background: #60a5fa;
  transform: scaleY(1.02);
}
.bar-current {
  background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
}
.bar-month {
  position: absolute;
  bottom: -22px;
  font-size: 10px;
  color: var(--color-text-dim);
  font-weight: 600;
}

/* Hover Tooltips on Bars */
.chart-tooltip {
  position: absolute;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 10;
}
.bar-fill:hover .chart-tooltip {
  opacity: 1;
}

/* DEDICATED REVENUE BREAKDOWN PANEL */
.breakdown-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 22px 24px;
}
.stream-total {
  text-align: right;
}
.total-label {
  font-size: 11px;
  color: var(--color-text-muted);
  display: block;
}
.total-val {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}

/* Multi-Segment Proportional Progress Bar */
.stream-progress-bar {
  display: flex;
  height: 12px;
  width: 100%;
  background: #111827;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 24px;
}
.progress-segment {
  height: 100%;
  transition: width 0.4s ease;
}
.seg-enterprise { background: #3b82f6; }
.seg-pro { background: #10b981; }
.seg-addons { background: #f59e0b; }

.stream-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stream-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px 18px;
}
.stream-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.stream-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
}
.dot-enterprise { background: #3b82f6; }
.dot-pro { background: #10b981; }
.dot-addons { background: #f59e0b; }
.stream-name {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}
.stream-amount {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 4px;
}
.stream-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 8px;
}
.stream-share { color: var(--color-text-muted); font-weight: 600; }
.text-green { color: var(--color-emerald); font-weight: 700; }
.stream-detail {
  font-size: 11px;
  color: var(--color-text-dim);
  line-height: 1.45;
}

/* Transactions Table Panel */
.table-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 22px 24px;
}
.table-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 14px;
}
.record-counter {
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 700;
  background: rgba(59, 130, 246, 0.12);
  padding: 3px 8px;
  border-radius: 9999px;
  margin-top: 4px;
  display: inline-block;
}
.table-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 10px;
  font-size: 12px;
  pointer-events: none;
}
.search-input {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 8px 12px 8px 30px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  width: 260px;
  font-family: inherit;
}
.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}
.status-select {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: inherit;
}

.table-container {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
.data-table th {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-dim);
  letter-spacing: 0.05em;
}
.data-table td {
  padding: 14px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.order-code {
  font-family: monospace;
  font-size: 12px;
  background: var(--color-bg);
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  color: #38bdf8;
}
.customer-sub {
  display: block;
  font-size: 11px;
  color: var(--color-text-dim);
  font-weight: 400;
}
.tier-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
}
.tier-enterprise { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.tier-pro { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.tier-starter { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
.amount-val { color: #ffffff; }

.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  display: inline-block;
}
.status-completed { background: rgba(16, 185, 129, 0.15); color: var(--color-emerald); }
.status-processing { background: rgba(245, 158, 11, 0.15); color: var(--color-amber); }
.status-refunded { background: rgba(239, 68, 68, 0.15); color: var(--color-rose); }

/* Real Toast Notification */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0f172a;
  border: 1px solid #10b981;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  font-size: 13px;
  font-weight: 600;
  z-index: 1000;
  transition: opacity 0.2s ease;
}
.hidden { display: none !important; }

@media (max-width: 1080px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .stream-cards-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 200;
    transform: translateX(-100%);
  }
  .app-sidebar.open {
    transform: translateX(0);
  }
  .mobile-menu-btn, .sidebar-close-mobile {
    display: block;
  }
  .kpi-grid { grid-template-columns: 1fr; }
  .search-input { width: 180px; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Transaction Table Data
  const TRANSACTIONS = [
    { orderId: 'ORD-9921', customer: 'Maya Chen', email: 'chen@scaleinfra.io', date: '2026-12-24', plan: 'Enterprise (Annual)', amount: 1908.00, status: 'completed' },
    { orderId: 'ORD-9920', customer: 'Liam O\\'Connor', email: 'liam@devloop.co', date: '2026-12-24', plan: 'Pro Developer', amount: 79.00, status: 'completed' },
    { orderId: 'ORD-9919', customer: 'Zoe Alvarez', email: 'zoe.a@fintechaudits.com', date: '2026-12-23', plan: 'Starter Monthly', amount: 29.00, status: 'processing' },
    { orderId: 'ORD-9918', customer: 'David Kim', email: 'd.kim@metaruntime.dev', date: '2026-12-23', plan: 'Pro Developer (Annual)', amount: 768.00, status: 'completed' },
    { orderId: 'ORD-9917', customer: 'Sophia Rossi', email: 'rossi@rossidesign.it', date: '2026-12-22', plan: 'Starter Monthly', amount: 29.00, status: 'refunded' }
  ];

  // 2. Real-Time Table Filter with Live Counter
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const tableRows = document.querySelectorAll('#transactionsTable tbody tr');
  const recordCountBadge = document.getElementById('tableRecordCount');

  function filterTransactions() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const status = statusFilter?.value || 'all';
    let visibleCount = 0;

    tableRows.forEach((row) => {
      const searchAttr = row.getAttribute('data-search') || '';
      const statusAttr = row.getAttribute('data-status') || '';

      const matchesSearch = !query || searchAttr.includes(query);
      const matchesStatus = status === 'all' || statusAttr === status;

      if (matchesSearch && matchesStatus) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (recordCountBadge) {
      recordCountBadge.textContent = 'Showing ' + visibleCount + ' of ' + tableRows.length + ' transactions';
    }
  }

  if (searchInput) searchInput.addEventListener('input', filterTransactions);
  if (statusFilter) statusFilter.addEventListener('change', filterTransactions);

  // 3. Functional Client-Side CSV Blob Export
  const exportBtn = document.getElementById('exportBtn');
  const toast = document.getElementById('toast');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      // Build authentic CSV file payload
      const headers = ['Order ID', 'Customer Name', 'Email', 'Date', 'Plan Tier', 'Amount (USD)', 'Status'];
      const csvRows = [headers.join(',')];

      TRANSACTIONS.forEach(t => {
        csvRows.push([
          t.orderId,
          '"' + t.customer + '"',
          t.email,
          t.date,
          '"' + t.plan + '"',
          t.amount.toFixed(2),
          t.status
        ].join(','));
      });

      const csvContent = csvRows.join('\\r\\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'sales-analytics-2026.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (toast) {
        toast.innerHTML = '✓ <strong>sales-analytics-2026.csv</strong> downloaded (' + TRANSACTIONS.length + ' records exported)';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
      }
    });
  }

  // 4. Mobile Sidebar Toggle
  const sidebar = document.getElementById('appSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarCloseMobile');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
  if (sidebarClose && sidebar) {
    sidebarClose.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }
});`;

  return [
    { path: 'index.html', language: 'html', content: html },
    { path: 'styles/theme.css', language: 'css', content: themeCss },
    { path: 'assets/site.css', language: 'css', content: siteCss },
    { path: 'assets/site.js', language: 'javascript', content: siteJs },
    { path: 'styles.css', language: 'css', content: `${themeCss}\n\n${siteCss}` },
    { path: 'app.js', language: 'javascript', content: siteJs },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# ${appName} SaaS Analytics & Revenue Dashboard\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: Full width responsive layout, 4 KPI metric cards, Interactive monthly revenue bar chart with hover tooltips, Dedicated Revenue Breakdown by Stream section, Live search & status-filtered transaction table, Real working CSV Blob export download.\n- Run: Open index.html in any browser.`,
    },
  ];
}
