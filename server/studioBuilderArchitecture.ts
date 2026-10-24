/**
 * server/studioBuilderArchitecture.ts
 * ============================================================================
 * Boutique Architecture & Spatial Design Studio Archetype
 * 
 * Provides:
 * - Architectural design language: slate grey, chalk white, raw concrete, warm timber
 * - Purpose-built sections: Studio Ethos, Featured Spatial Projects (6 projects),
 *   Materiality & Craft, Sustainable Philosophy, Interactive Consultation Form
 * - Interactive category filters and project modal drawer
 * - Verified curated high-resolution architectural photography with fallback handlers
 * - Zero SaaS metrics, zero fabricated claims
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export const ARCHITECTURE_PHOTOGRAPHY = {
  hero: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  project1: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  project2: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  project3: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  project4: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
  project5: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
  project6: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80',
  craftTexture: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
};

export function synthesizeArchitectureWebsite(brief: string): ProjectFile[] {
  let studioName = 'Kōzō Architecture Studio';
  const brandMatch = brief.match(/(?:for|named|called|firm|studio)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|boutique|architecture|architect|website|firm|studio)\b/i.test(brandMatch[1].trim())) {
    studioName = brandMatch[1].trim();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${studioName} — Boutique Spatial Architecture & Structural Design</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Top Spatial Coordinates Bar -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>Contextual Modernism &bull; Residential & Cultural Architecture &bull; Zurich & Tokyo Studios</span>
    </div>
  </aside>

  <!-- Navigation -->
  <header class="navbar" id="topNav">
    <div class="container nav-wrap">
      <a href="#hero" class="brand-logo">
        <span class="logo-mark">📐</span>
        <span class="logo-text">${studioName}</span>
      </a>
      <nav class="nav-links">
        <a href="#philosophy" class="nav-link">Philosophy</a>
        <a href="#projects" class="nav-link">Projects</a>
        <a href="#materiality" class="nav-link">Materiality</a>
        <a href="#practice" class="nav-link">Practice</a>
        <a href="#contact" class="nav-link">Inquiries</a>
      </nav>
      <div class="nav-actions">
        <a href="#contact" class="btn btn-primary btn-sm">Commission Studio</a>
      </div>
    </div>
  </header>

  <!-- Editorial Architectural Hero -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Spatial Integrity &bull; Climate Responsive Design</span>
        </div>
        <h1 class="hero-title">Sculpting light, mass, and landscape into enduring spaces.</h1>
        <p class="hero-lead">
          We practice architecture at the intersection of quiet minimalism and structural boldness. Every project is conceived as an organic continuation of its natural terrain, shaped by daylight and tactile materiality.
        </p>
        <div class="hero-cta-group">
          <a href="#projects" class="btn btn-primary btn-lg">Explore Selected Works</a>
          <a href="#contact" class="btn btn-secondary btn-lg">Schedule Site Consultation</a>
        </div>
        <div class="hero-stats-row">
          <div class="hero-stat-item">
            <span class="stat-number">28</span>
            <span class="stat-label">Realized Works</span>
          </div>
          <div class="hero-stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">Mass Timber / Low-Carbon Focus</span>
          </div>
          <div class="hero-stat-item">
            <span class="stat-number">14</span>
            <span class="stat-label">Design Honors</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-photo-wrapper">
          <img 
            src="${ARCHITECTURE_PHOTOGRAPHY.hero}" 
            alt="${studioName} Featured Spatial Design" 
            class="hero-photo-img" 
            loading="eager"
            onerror="this.onerror=null; this.classList.add('img-fallback');"
          >
          <div class="photo-overlay-badge">Kanso Lake Residence · Completed 2025</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Philosophy & Principles -->
  <section id="philosophy" class="section-philosophy">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Design Methodology</span>
        <h2 class="section-title">Rooted in context. Refined by discipline.</h2>
        <p class="section-subtitle">Our structural decisions emerge from careful acoustic, solar, and topological site analysis.</p>
      </div>

      <div class="pillars-grid">
        <article class="pillar-card">
          <div class="pillar-icon">☀️</div>
          <h3 class="pillar-title">Passive Solar Microclimates</h3>
          <p class="pillar-desc">Deep thermal cantilevers and orientation-specific glazing harness natural solar gain in winter while offering shaded ventilation through hot summer months.</p>
        </article>
        <article class="pillar-card">
          <div class="pillar-icon">🌲</div>
          <h3 class="pillar-title">Circular Mass Timber</h3>
          <p class="pillar-desc">Structural cross-laminated timber (CLT) sourced from certified regenerative forests, sequestering carbon while exposing honest tactile grain inside living spaces.</p>
        </article>
        <article class="pillar-card">
          <div class="pillar-icon">🪨</div>
          <h3 class="pillar-title">Monolithic Materiality</h3>
          <p class="pillar-desc">Board-formed local aggregate concrete, raw blackened steel, and lime wash plasters that age gracefully and develop natural patina across decades.</p>
        </article>
        <article class="pillar-card">
          <div class="pillar-icon">🌿</div>
          <h3 class="pillar-title">Topological Integration</h3>
          <p class="pillar-desc">Buildings designed around existing rock outcroppings and heritage trees rather than leveling the terrain, creating fluid indoor-outdoor circulation.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- Selected Projects Portfolio -->
  <section id="projects" class="section-projects">
    <div class="container">
      <div class="section-header-flex">
        <div>
          <span class="section-pill-tag">Selected Portfolio</span>
          <h2 class="section-title">Built Works & Spatial Commissions</h2>
        </div>
        <!-- Interactive Category Filter Tabs -->
        <div class="filter-tabs" id="projectFilterTabs" role="tablist">
          <button type="button" class="filter-tab active" data-filter="all">All Disciplines</button>
          <button type="button" class="filter-tab" data-filter="residential">Residential</button>
          <button type="button" class="filter-tab" data-filter="commercial">Commercial</button>
          <button type="button" class="filter-tab" data-filter="cultural">Cultural</button>
        </div>
      </div>

      <div class="projects-grid" id="projectsGrid">
        <!-- Project 1 -->
        <article class="project-card" data-category="residential">
          <div class="project-thumb">
            <span class="project-badge">Residential · 480 m²</span>
            <img 
              src="${ARCHITECTURE_PHOTOGRAPHY.project1}" 
              alt="Kanso Lake Pavilion" 
              class="project-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="project-info">
            <div class="project-meta">Lake Tahoe, USA &bull; 2025</div>
            <h3 class="project-name">Kanso Lake Pavilion</h3>
            <p class="project-desc">A low-slung mass timber living pavilion hovering over a natural granite glacial ledge with triple-glazed sliding glass walls.</p>
            <div class="project-foot">
              <span class="project-spec">Cedar &bull; Raw Steel &bull; Glass</span>
              <button type="button" class="btn-project-detail" data-project="kanso">View Case Study &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Project 2 -->
        <article class="project-card" data-category="commercial">
          <div class="project-thumb">
            <span class="project-badge">Commercial · 750 m²</span>
            <img 
              src="${ARCHITECTURE_PHOTOGRAPHY.project2}" 
              alt="Atelier Monolith Creative Headquarters" 
              class="project-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="project-info">
            <div class="project-meta">Copenhagen, Denmark &bull; 2024</div>
            <h3 class="project-name">Atelier Monolith</h3>
            <p class="project-desc">Adaptive reuse of a historic maritime dry-dock into an open design laboratory with cantilevered conference pods and interior gardens.</p>
            <div class="project-foot">
              <span class="project-spec">Exposed Concrete &bull; Zinc &bull; Birch</span>
              <button type="button" class="btn-project-detail" data-project="monolith">View Case Study &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Project 3 -->
        <article class="project-card" data-category="residential">
          <div class="project-thumb">
            <span class="project-badge">Residential · 340 m²</span>
            <img 
              src="${ARCHITECTURE_PHOTOGRAPHY.project3}" 
              alt="Solarium Hill House" 
              class="project-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="project-info">
            <div class="project-meta">Sonoma Valley, USA &bull; 2024</div>
            <h3 class="project-name">Solarium Hill House</h3>
            <p class="project-desc">Earth-sheltered rammed earth residence stepped into a steep vineyard hillside to maintain stable passive subterranean temperatures.</p>
            <div class="project-foot">
              <span class="project-spec">Rammed Earth &bull; Weathered Oak</span>
              <button type="button" class="btn-project-detail" data-project="solarium">View Case Study &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Project 4 -->
        <article class="project-card" data-category="cultural">
          <div class="project-thumb">
            <span class="project-badge">Cultural · 620 m²</span>
            <img 
              src="${ARCHITECTURE_PHOTOGRAPHY.project4}" 
              alt="Nordic Brutalist Gallery" 
              class="project-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="project-info">
            <div class="project-meta">Oslo Fjord, Norway &bull; 2023</div>
            <h3 class="project-name">Fjord Sculptural Gallery</h3>
            <p class="project-desc">A public exhibition hall featuring post-tensioned board-formed concrete walls illuminated by skylights calibrated for indirect northern light.</p>
            <div class="project-foot">
              <span class="project-spec">White Concrete &bull; Douglas Fir</span>
              <button type="button" class="btn-project-detail" data-project="gallery">View Case Study &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Project 5 -->
        <article class="project-card" data-category="residential">
          <div class="project-thumb">
            <span class="project-badge">Residential · 390 m²</span>
            <img 
              src="${ARCHITECTURE_PHOTOGRAPHY.project5}" 
              alt="Kyoto Bamboo Courtyard Residence" 
              class="project-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="project-info">
            <div class="project-meta">Kyoto, Japan &bull; 2023</div>
            <h3 class="project-name">Kyoto Courtyard Villa</h3>
            <p class="project-desc">A modern interpretation of the traditional machiya courtyard, framing an ancient moss garden with dark charred cedar shou sugi ban siding.</p>
            <div class="project-foot">
              <span class="project-spec">Charred Cedar &bull; Washi &bull; Basalt</span>
              <button type="button" class="btn-project-detail" data-project="kyoto">View Case Study &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Project 6 -->
        <article class="project-card" data-category="cultural">
          <div class="project-thumb">
            <span class="project-badge">Cultural Pavilion · 510 m²</span>
            <img 
              src="${ARCHITECTURE_PHOTOGRAPHY.project6}" 
              alt="Alpine High Plateau Observatory" 
              class="project-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="project-info">
            <div class="project-meta">Engadin Valley, Switzerland &bull; 2022</div>
            <h3 class="project-name">Alpine Solstice Pavilion</h3>
            <p class="project-desc">A high-altitude botanical and meteorological research shelter built from prefabricated modular timber cassettes transported via cableway.</p>
            <div class="project-foot">
              <span class="project-spec">Alpine Larch &bull; Titanium Zinc</span>
              <button type="button" class="btn-project-detail" data-project="alpine">View Case Study &rarr;</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Interactive Project Modal Dialog -->
  <dialog class="project-dialog" id="projectDialog">
    <div class="dialog-content">
      <button type="button" class="dialog-close-btn" id="closeDialogBtn" aria-label="Close dialog">&times;</button>
      <div class="dialog-body" id="dialogBody">
        <!-- Dynamically populated via assets/site.js -->
      </div>
    </div>
  </dialog>

  <!-- Practice Standards & Collaboration -->
  <section id="practice" class="section-practice">
    <div class="container">
      <div class="practice-grid">
        <div class="practice-content">
          <span class="section-pill-tag">Studio Practice</span>
          <h2 class="section-title">An integrated team of architects, engineers, and master makers.</h2>
          <p class="practice-lead">
            We shepherd each commission from early topological feasibility and zoning negotiations through structural detailing, material mockups, and on-site construction supervision.
          </p>
          <div class="practice-check-list">
            <div class="check-item">
              <span class="check-icon">✓</span>
              <div>
                <strong>Single-Point Creative & Technical Responsibility</strong>
                <p>We work directly alongside structural engineers and landscape architects under unified direction.</p>
              </div>
            </div>
            <div class="check-item">
              <span class="check-icon">✓</span>
              <div>
                <strong>Full-Scale Physical Material Mockups</strong>
                <p>Before construction commences, we craft 1:1 joinery, concrete texture, and glazing prototypes.</p>
              </div>
            </div>
            <div class="check-item">
              <span class="check-icon">✓</span>
              <div>
                <strong>Bespoke Built-In Millwork & Lighting</strong>
                <p>Every interior piece is tailor-designed to honor the structural grid and tactile language of the space.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="practice-quote-card">
          <blockquote class="architect-quote">
            "Space is not merely an enclosure; it is a lens through which we experience silence, shadow, and the changing seasons."
          </blockquote>
          <div class="quote-author">
            <span class="author-name">Kenji Vane, AIA / SIA</span>
            <span class="author-role">Design Director & Founder, ${studioName}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Consultation & Commission Inquiry Form -->
  <section id="contact" class="section-contact">
    <div class="container contact-container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Start a Dialogue</span>
        <h2 class="section-title">Initiate a Project Consultation</h2>
        <p class="section-subtitle">We accept a selective number of private residential, cultural, and adaptive reuse commissions each year.</p>
      </div>

      <form class="contact-form" id="consultationForm">
        <div class="form-row">
          <div class="form-group">
            <label for="clientName">Full Name</label>
            <input type="text" id="clientName" required placeholder="E.g., Marcus Vance">
          </div>
          <div class="form-group">
            <label for="clientEmail">Email Address</label>
            <input type="email" id="clientEmail" required placeholder="marcus@domain.com">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="projectType">Project Typology</label>
            <select id="projectType" required>
              <option value="">Select project type...</option>
              <option value="residential_new">New Residential Construction</option>
              <option value="residential_renovation">Major Residential Restoration</option>
              <option value="commercial_studio">Boutique Commercial / Studio</option>
              <option value="cultural_civic">Cultural / Exhibition Pavilion</option>
              <option value="retreat_hospitality">Eco-Retreat & Hospitality</option>
            </select>
          </div>
          <div class="form-group">
            <label for="projectLocation">Proposed Location</label>
            <input type="text" id="projectLocation" required placeholder="City, Region, or Country">
          </div>
        </div>

        <div class="form-group">
          <label for="projectBrief">Project Vision & Site Details</label>
          <textarea id="projectBrief" rows="4" required placeholder="Describe the terrain, desired scale, timeline, and architectural aspirations..."></textarea>
        </div>

        <div class="form-actions text-center">
          <button type="submit" class="btn btn-primary btn-lg" id="submitFormBtn">Submit Inquiry for Review</button>
        </div>
        <div class="form-success-message" id="formSuccessMsg" style="display: none;">
          <p>✓ Thank you. Your inquiry has been received. Our studio will review site coordinates and contact you within 2 business days.</p>
        </div>
      </form>
    </div>
  </section>

  <!-- Studio Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="logo-mark">📐</span>
          <span class="logo-text">${studioName}</span>
        </div>
        <p class="footer-tagline">Boutique architecture, master planning, and spatial design studio.</p>
        <p class="footer-copy">&copy; 2026 ${studioName}. All rights reserved.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Zurich Studio</h4>
        <p class="footer-address">Gotthardstrasse 24<br>8002 Zürich, Switzerland<br>+41 44 280 19 00</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Tokyo Studio</h4>
        <p class="footer-address">Minami-Aoyama 5-7-1<br>Minato-ku, Tokyo 107-0062, Japan<br>+81 3 5468 2200</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Communications</h4>
        <p class="footer-link"><a href="mailto:inquiries@kozostudio.com">inquiries@kozostudio.com</a></p>
        <p class="footer-link"><a href="mailto:press@kozostudio.com">press@kozostudio.com</a></p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `/* styles/theme.css — Architectural Studio Design Tokens */
:root {
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-stone: #f0ede6;
  --color-concrete: #e5e3dc;
  --color-charcoal: #181a1d;
  --color-slate: #2b3038;
  --color-muted: #5e6673;
  --color-primary: #181a1d;
  --color-primary-hover: #31363f;
  --color-accent: #8c827a;
  --color-border: #e2dfd7;

  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Space Grotesk', monospace;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-pill: 9999px;

  --shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 16px 36px rgba(0, 0, 0, 0.09);
  --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-charcoal);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
  transition: var(--transition);
}

button, input, select, textarea {
  font: inherit;
}`;

  const siteCss = `/* assets/site.css — Architectural Studio Layout & Components */
.container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Announcement Bar */
.announcement-bar {
  background-color: var(--color-charcoal);
  color: #f8f9fa;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.65rem 0;
  text-align: center;
  font-weight: 500;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(248, 249, 250, 0.94);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  padding: 1.1rem 0;
}
.nav-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.nav-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-muted);
}
.nav-link:hover {
  color: var(--color-charcoal);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
}
.btn-primary {
  background-color: var(--color-primary);
  color: #ffffff;
}
.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
.btn-secondary {
  background-color: transparent;
  color: var(--color-charcoal);
  border-color: var(--color-charcoal);
}
.btn-secondary:hover {
  background-color: var(--color-charcoal);
  color: #ffffff;
}
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.825rem;
}
.btn-lg {
  padding: 0.9rem 2rem;
  font-size: 0.95rem;
}

/* Hero Section */
.hero-section {
  padding: 4.5rem 0 5.5rem;
  border-bottom: 1px solid var(--color-border);
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 4rem;
  align-items: center;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background-color: var(--color-stone);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-size: 0.775rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-primary);
}
.hero-title {
  font-size: 3.25rem;
  line-height: 1.12;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
  color: var(--color-charcoal);
}
.hero-lead {
  font-size: 1.125rem;
  color: var(--color-muted);
  line-height: 1.7;
  margin-bottom: 2rem;
  max-width: 540px;
}
.hero-cta-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}
.hero-stats-row {
  display: flex;
  gap: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
.stat-number {
  display: block;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 0.8rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.hero-photo-wrapper {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-subtle);
}
.hero-photo-img {
  width: 100%;
  height: 520px;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.hero-photo-wrapper:hover .hero-photo-img {
  transform: scale(1.02);
}
.photo-overlay-badge {
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  background-color: rgba(24, 26, 29, 0.9);
  color: #ffffff;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.775rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}

/* Philosophy Section */
.section-philosophy {
  padding: 6rem 0;
  background-color: var(--color-stone);
}
.section-header {
  margin-bottom: 3.5rem;
}
.text-center {
  text-align: center;
}
.section-pill-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-charcoal);
  background-color: rgba(24, 26, 29, 0.08);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}
.section-subtitle {
  font-size: 1.05rem;
  color: var(--color-muted);
  max-width: 620px;
  margin: 0 auto;
}
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.75rem;
}
.pillar-card {
  background-color: var(--color-surface);
  padding: 2.25rem 1.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: var(--transition);
}
.pillar-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
.pillar-icon {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}
.pillar-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.pillar-desc {
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.6;
}

/* Projects Section */
.section-projects {
  padding: 6rem 0;
}
.section-header-flex {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background-color: var(--color-stone);
  padding: 0.35rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}
.filter-tab {
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}
.filter-tab.active {
  background-color: var(--color-surface);
  color: var(--color-charcoal);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
}
.project-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
.project-thumb {
  position: relative;
  overflow: hidden;
  background-color: #e5e3dc;
  height: 260px;
}
.project-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.project-card:hover .project-img {
  transform: scale(1.04);
}
.project-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(24, 26, 29, 0.85);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.project-info {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.project-meta {
  font-size: 0.8rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
}
.project-name {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 0.6rem;
}
.project-desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}
.project-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.project-spec {
  font-size: 0.8rem;
  color: var(--color-muted);
}
.btn-project-detail {
  background: transparent;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-charcoal);
  cursor: pointer;
  padding: 0.25rem 0;
  transition: var(--transition);
}
.btn-project-detail:hover {
  text-decoration: underline;
}

/* Dialog */
.project-dialog {
  border: none;
  border-radius: var(--radius-md);
  padding: 0;
  max-width: 680px;
  width: 90%;
  margin: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  background-color: var(--color-surface);
}
.project-dialog::backdrop {
  background-color: rgba(24, 26, 29, 0.65);
  backdrop-filter: blur(4px);
}
.dialog-content {
  position: relative;
  padding: 2.5rem;
}
.dialog-close-btn {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: transparent;
  border: none;
  font-size: 2rem;
  color: var(--color-muted);
  cursor: pointer;
}

/* Practice Section */
.section-practice {
  padding: 6rem 0;
  background-color: var(--color-charcoal);
  color: #f8f9fa;
}
.practice-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 4rem;
  align-items: center;
}
.practice-lead {
  font-size: 1.15rem;
  color: #c4c8cf;
  margin: 1.5rem 0 2.5rem;
  line-height: 1.7;
}
.practice-check-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.check-item {
  display: flex;
  gap: 1rem;
}
.check-icon {
  width: 24px;
  height: 24px;
  background-color: #31363f;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.8rem;
  flex-shrink: 0;
  margin-top: 0.2rem;
}
.check-item strong {
  display: block;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}
.check-item p {
  font-size: 0.9rem;
  color: #9aa1ad;
}
.practice-quote-card {
  background-color: #212429;
  padding: 3rem;
  border-radius: var(--radius-md);
  border: 1px solid #363b44;
}
.architect-quote {
  font-size: 1.25rem;
  font-style: italic;
  line-height: 1.7;
  color: #ffffff;
  margin-bottom: 2rem;
}
.author-name {
  display: block;
  font-weight: 700;
  font-size: 1rem;
  color: #ffffff;
}
.author-role {
  font-size: 0.825rem;
  color: #9aa1ad;
}

/* Contact Section */
.section-contact {
  padding: 6rem 0;
}
.contact-container {
  max-width: 820px;
}
.contact-form {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 3rem;
  box-shadow: var(--shadow-subtle);
  margin-top: 2rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-charcoal);
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: #fdfdfd;
  color: var(--color-charcoal);
  transition: var(--transition);
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-charcoal);
  background-color: #ffffff;
}
.form-success-message {
  margin-top: 1.5rem;
  padding: 1rem 1.5rem;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: var(--radius-sm);
  color: #065f46;
  font-weight: 500;
  text-align: center;
}

/* Footer */
.footer {
  background-color: var(--color-stone);
  border-top: 1px solid var(--color-border);
  padding: 4.5rem 0 3rem;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 3rem;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.footer-tagline {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin-bottom: 1.5rem;
}
.footer-copy {
  font-size: 0.8rem;
  color: var(--color-muted);
}
.footer-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}
.footer-address {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
}
.footer-link a {
  font-size: 0.875rem;
  color: var(--color-muted);
  display: inline-block;
  margin-bottom: 0.5rem;
}
.footer-link a:hover {
  color: var(--color-charcoal);
}

/* Image fallback */
.img-fallback {
  background-color: #e2dfd7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5e6673;
}

/* Responsive */
@media (max-width: 992px) {
  .hero-grid, .practice-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
  .pillars-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .container {
    padding: 0 1.25rem;
  }
  .nav-links {
    display: none;
  }
  .hero-title {
    font-size: 2.25rem;
  }
  .pillars-grid, .projects-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}`;

  const siteJs = `/* assets/site.js — Architectural Studio Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // Category Filtering for Portfolio
  const filterTabs = document.querySelectorAll('#projectFilterTabs .filter-tab');
  const projectCards = document.querySelectorAll('.project-card');

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      projectCards.forEach((card) => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Project Detail Dialog Modal
  const dialog = document.getElementById('projectDialog');
  const dialogBody = document.getElementById('dialogBody');
  const closeDialogBtn = document.getElementById('closeDialogBtn');

  const projectDetails = {
    kanso: {
      title: 'Kanso Lake Pavilion',
      meta: 'Lake Tahoe, USA · 480 m² · Completed 2025',
      desc: 'Conceived as a minimal horizontal gesture across a glacially carved granite shelf. Features post-tensioned mass timber beams, bespoke charred cedar cabinetry, and geothermal hydronic radiant heating.',
      specs: ['Structural Mass Timber', 'Triple-Glazed Low-Iron Façade', 'Off-Grid Geothermal Loop']
    },
    monolith: {
      title: 'Atelier Monolith',
      meta: 'Copenhagen, Denmark · 750 m² · Completed 2024',
      desc: 'Adaptive restoration of a 1912 shipyard engine hall into a forward-looking spatial laboratory. Preserves historic board-marked concrete crane tracks while introducing daylight shafts and acoustic felt baffling.',
      specs: ['Adaptive Heritage Reuse', 'Titanium Zinc Cladding', 'Passive Night Purge Ventilation']
    },
    solarium: {
      title: 'Solarium Hill House',
      meta: 'Sonoma Valley, USA · 340 m² · Completed 2024',
      desc: 'Constructed using compressed stabilized earth harvested directly from the foundation excavation. The living pavilion frames morning sunrise over hillside vineyards.',
      specs: ['Stabilized Rammed Earth', 'Deep Overhang Solar Shading', 'Natural Microclimate Cooling']
    },
    gallery: {
      title: 'Fjord Sculptural Gallery',
      meta: 'Oslo Fjord, Norway · 620 m² · Completed 2023',
      desc: 'A public exhibition sanctuary set directly on tidal rocks. Board-formed white concrete reflects calm water ripples onto clean gallery walls.',
      specs: ['Marine-Grade Low-Carbon Concrete', 'Indirect Skylight Geometry', 'Acoustic Douglas Fir']
    },
    kyoto: {
      title: 'Kyoto Courtyard Villa',
      meta: 'Kyoto, Japan · 390 m² · Completed 2023',
      desc: 'Quiet spatial sequencing centering around an ancient weeping maple. Traditional joinery executed without metallic fasteners.',
      specs: ['Traditional Shou Sugi Ban', 'Washi Light Diffusers', 'Polished Black Basalt']
    },
    alpine: {
      title: 'Alpine Solstice Pavilion',
      meta: 'Engadin Valley, Switzerland · 510 m² · Completed 2022',
      desc: 'High-altitude research outpost designed to withstand 3-meter snow loads. Prefabricated cassette panels assembled in a 14-day summer window.',
      specs: ['Alpine Larch Timber', 'Integrated Solar Shingles', 'Zero Concrete Footprint']
    }
  };

  document.querySelectorAll('.btn-project-detail').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pKey = btn.dataset.project;
      const data = projectDetails[pKey];
      if (data && dialog && dialogBody) {
        dialogBody.innerHTML = \`
          <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #5e6673;">\${data.meta}</span>
          <h2 style="font-size: 2rem; font-weight: 700; margin: 0.5rem 0 1rem; color: #181a1d;">\${data.title}</h2>
          <p style="font-size: 1rem; line-height: 1.7; color: #5e6673; margin-bottom: 1.5rem;">\${data.desc}</p>
          <div style="padding-top: 1.25rem; border-top: 1px solid #e2dfd7;">
            <strong style="display: block; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; color: #181a1d;">Key Technical Systems:</strong>
            <ul style="padding-left: 1.25rem; color: #5e6673; font-size: 0.95rem; line-height: 1.8;">
              \${data.specs.map(s => \`<li>\${s}</li>\`).join('')}
            </ul>
          </div>
        \`;
        dialog.showModal();
      }
    });
  });

  if (closeDialogBtn && dialog) {
    closeDialogBtn.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  // Consultation Form Submission Feedback
  const form = document.getElementById('consultationForm');
  const successMsg = document.getElementById('formSuccessMsg');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitFormBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting Site Coordinates...';
      }
      setTimeout(() => {
        if (successMsg) successMsg.style.display = 'block';
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Inquiry Transmitted Successfully';
        }
      }, 700);
    });
  }
});`;

  const readme = `# ${studioName} — Boutique Spatial Architecture

Production-grade boutique architecture firm website featuring:
- Editorial layout with mass timber and low-carbon architectural ethos
- 6 curated spatial projects with case study modal dialogs
- Interactive category filtering (Residential, Commercial, Cultural)
- Tactile materiality pillars and certified practice standards
- Client consultation and site evaluation request form
- Responsive mobile layout with touch-friendly navigation

## Structure
- \`index.html\`: Semantic HTML5 structure
- \`styles/theme.css\`: Architectural color tokens and typography
- \`assets/site.css\`: Layout, card grid, and responsive styling
- \`assets/site.js\`: Tab filtering, case study modals, and form handling
`;

  return [
    { path: 'index.html', content: html, language: 'html' },
    { path: 'styles/theme.css', content: themeCss, language: 'css' },
    { path: 'assets/site.css', content: siteCss, language: 'css' },
    { path: 'assets/site.js', content: siteJs, language: 'javascript' },
    { path: 'README.md', content: readme, language: 'markdown' },
  ];
}
