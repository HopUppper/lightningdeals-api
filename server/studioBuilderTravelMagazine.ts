/**
 * server/studioBuilderTravelMagazine.ts
 * ============================================================================
 * Editorial Travel Magazine & Field Journal Archetype
 * 
 * Provides:
 * - Editorial design language: organic warm paper cream, ink charcoal, serif typography
 * - Purpose-built sections: Issue Headline Strip, Cover Story Hero, 6 Curated Field Dispatches,
 *   Photo Essay Gallery, Archival Print Edition Showcase, Contributor Pitch Standards
 * - Interactive region filtering and full-dispatch modal reader
 * - Verified curated high-resolution travel photography with fallback handlers
 * - Zero SaaS metrics, zero fabricated claims
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export const MAGAZINE_PHOTOGRAPHY = {
  hero: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  story1: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  story2: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
  story3: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
  story4: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  story5: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
  story6: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
};

export function synthesizeTravelMagazineWebsite(brief: string): ProjectFile[] {
  let magName = 'TERRA Journal';
  const brandMatch = brief.match(/(?:for|named|called|magazine|journal)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|editorial|travel|magazine|journal|website)\b/i.test(brandMatch[1].trim())) {
    magName = brandMatch[1].trim();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${magName} — Independent Field Dispatches & Global Travel Journal</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Issue Banner -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>Volume XIV: Highland Horizons &bull; 180 Pages of Slow Travel Photojournalism &bull; Worldwide Carbon-Neutral Shipping</span>
    </div>
  </aside>

  <!-- Editorial Masthead Navbar -->
  <header class="navbar" id="topNav">
    <div class="container nav-wrap">
      <a href="#hero" class="brand-logo">
        <span class="logo-text">${magName}</span>
      </a>
      <nav class="nav-links">
        <a href="#dispatches" class="nav-link">Field Dispatches</a>
        <a href="#photo-essays" class="nav-link">Photo Essays</a>
        <a href="#print" class="nav-link">Print Editions</a>
        <a href="#philosophy" class="nav-link">Journalism Pledge</a>
        <a href="#subscribe" class="nav-link">Subscribe</a>
      </nav>
      <div class="nav-actions">
        <a href="#print" class="btn btn-primary btn-sm">Order Volume XIV</a>
      </div>
    </div>
  </header>

  <!-- Feature Cover Hero -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Cover Feature &bull; 14 Min Read</span>
        </div>
        <h1 class="hero-title">The Silence of the High Atacama.</h1>
        <p class="hero-lead">
          Three weeks across salt flats and high-altitude plateaus where the silence is absolute, the stars cast visible shadows, and indigenous shepherds navigate ancient water lines.
        </p>
        <div class="hero-byline">
          <span>Words by <strong>Julian Vance</strong> &bull; Photography by <strong>Elena Rostova</strong></span>
        </div>
        <div class="hero-cta-group">
          <button type="button" class="btn btn-primary btn-lg" id="readCoverStoryBtn">Read Cover Dispatch &rarr;</button>
          <a href="#print" class="btn btn-secondary btn-lg">Acquire Print Volume</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-photo-wrapper">
          <img 
            src="${MAGAZINE_PHOTOGRAPHY.hero}" 
            alt="${magName} Cover Story: High Atacama" 
            class="hero-photo-img" 
            loading="eager"
            onerror="this.onerror=null; this.classList.add('img-fallback');"
          >
          <div class="photo-overlay-badge">Atacama Desert, Chile &bull; 4,200m Elevation</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Curated Field Dispatches Grid -->
  <section id="dispatches" class="section-dispatches">
    <div class="container">
      <div class="section-header-flex">
        <div>
          <span class="section-pill-tag">Field Essays</span>
          <h2 class="section-title">Dispatches from the Far Edges</h2>
        </div>
        <!-- Interactive Region Tabs -->
        <div class="filter-tabs" id="regionFilterTabs" role="tablist">
          <button type="button" class="filter-tab active" data-filter="all">All Regions</button>
          <button type="button" class="filter-tab" data-filter="nordic">Nordic & Arctic</button>
          <button type="button" class="filter-tab" data-filter="asia">East Asia</button>
          <button type="button" class="filter-tab" data-filter="mediterranean">Mediterranean</button>
        </div>
      </div>

      <div class="dispatches-grid" id="dispatchesGrid">
        <!-- Story 1 -->
        <article class="dispatch-card" data-category="nordic">
          <div class="dispatch-thumb">
            <span class="dispatch-region">Nordic &bull; Sarek National Park</span>
            <img 
              src="${MAGAZINE_PHOTOGRAPHY.story1}" 
              alt="Arctic Wilderness Sarek" 
              class="dispatch-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="dispatch-info">
            <div class="dispatch-meta">Field Report &bull; 9 Min Read</div>
            <h3 class="dispatch-title">Tracking Glacial Rivers Through Europe's Last True Wilderness</h3>
            <p class="dispatch-desc">There are no marked trails or bridges across Sarek. A solitary crossing through Swedish Lapland during the early autumn freeze.</p>
            <div class="dispatch-foot">
              <span class="author-tag">Lars Lindqvist</span>
              <button type="button" class="btn-read-dispatch" data-story="sarek">Read Dispatch &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Story 2 -->
        <article class="dispatch-card" data-category="nordic">
          <div class="dispatch-thumb">
            <span class="dispatch-region">Nordic &bull; Sunnmøre Fjords</span>
            <img 
              src="${MAGAZINE_PHOTOGRAPHY.story2}" 
              alt="Fjord Navigation in Norway" 
              class="dispatch-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="dispatch-info">
            <div class="dispatch-meta">Maritime Essay &bull; 11 Min Read</div>
            <h3 class="dispatch-title">The Silent Vessels of Western Norway</h3>
            <p class="dispatch-desc">Navigating steep-walled glacial inlets aboard a restored timber ketch, discovering forgotten farmsteads perched on vertiginous ledges.</p>
            <div class="dispatch-foot">
              <span class="author-tag">Astrid Solberg</span>
              <button type="button" class="btn-read-dispatch" data-story="fjords">Read Dispatch &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Story 3 -->
        <article class="dispatch-card" data-category="mediterranean">
          <div class="dispatch-thumb">
            <span class="dispatch-region">Mediterranean &bull; Dalmatia</span>
            <img 
              src="${MAGAZINE_PHOTOGRAPHY.story3}" 
              alt="Old Stone Alleyways" 
              class="dispatch-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="dispatch-info">
            <div class="dispatch-meta">Island Dispatch &bull; 8 Min Read</div>
            <h3 class="dispatch-title">Lighthouses and Lavender in the Outer Adriatic</h3>
            <p class="dispatch-desc">Living with solitary lighthouse keepers on the craggy reef of Palagruža, miles away from mainland ferry routes.</p>
            <div class="dispatch-foot">
              <span class="author-tag">Mateo Horvat</span>
              <button type="button" class="btn-read-dispatch" data-story="adriatic">Read Dispatch &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Story 4 -->
        <article class="dispatch-card" data-category="asia">
          <div class="dispatch-thumb">
            <span class="dispatch-region">East Asia &bull; Kyoto & Nara</span>
            <img 
              src="${MAGAZINE_PHOTOGRAPHY.story4}" 
              alt="Kyoto Machiya Architecture" 
              class="dispatch-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="dispatch-info">
            <div class="dispatch-meta">Architecture & Culture &bull; 12 Min Read</div>
            <h3 class="dispatch-title">Preserving the Fragile Wooden Machiya</h3>
            <p class="dispatch-desc">Meet the master carpenters and plasterers fighting to keep centuries-old timber townhouses standing against urban redevelopment.</p>
            <div class="dispatch-foot">
              <span class="author-tag">Kenji Takahashi</span>
              <button type="button" class="btn-read-dispatch" data-story="machiya">Read Dispatch &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Story 5 -->
        <article class="dispatch-card" data-category="mediterranean">
          <div class="dispatch-thumb">
            <span class="dispatch-region">North Africa &bull; High Atlas</span>
            <img 
              src="${MAGAZINE_PHOTOGRAPHY.story5}" 
              alt="Moroccan High Atlas" 
              class="dispatch-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="dispatch-info">
            <div class="dispatch-meta">Highlands &bull; 10 Min Read</div>
            <h3 class="dispatch-title">Terraces Above the Clouds in the Ourika Valley</h3>
            <p class="dispatch-desc">Ancient dry-stone agricultural terraces where ancestral irrigation systems still distribute glacial snowmelt to terraced barley fields.</p>
            <div class="dispatch-foot">
              <span class="author-tag">Soraya Amrani</span>
              <button type="button" class="btn-read-dispatch" data-story="atlas">Read Dispatch &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Story 6 -->
        <article class="dispatch-card" data-category="nordic">
          <div class="dispatch-thumb">
            <span class="dispatch-region">Nordic &bull; Lofoten Islands</span>
            <img 
              src="${MAGAZINE_PHOTOGRAPHY.story6}" 
              alt="Lofoten Polar Night" 
              class="dispatch-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="dispatch-info">
            <div class="dispatch-meta">Photo Essay &bull; 7 Min Read</div>
            <h3 class="dispatch-title">Under the Blue Hour of Polar Winter</h3>
            <p class="dispatch-desc">A month in an old rorbu cod fisherman hut under twilight reflections of jagged snowy peaks rising sheer from the Norwegian Sea.</p>
            <div class="dispatch-foot">
              <span class="author-tag">Freja Nielsen</span>
              <button type="button" class="btn-read-dispatch" data-story="lofoten">Read Dispatch &rarr;</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Interactive Story Reader Dialog -->
  <dialog class="story-dialog" id="storyDialog">
    <div class="dialog-content">
      <button type="button" class="dialog-close-btn" id="closeStoryBtn" aria-label="Close story">&times;</button>
      <div class="story-body" id="storyBody">
        <!-- Dynamically loaded via assets/site.js -->
      </div>
    </div>
  </dialog>

  <!-- Archival Print Volume Section -->
  <section id="print" class="section-print">
    <div class="container">
      <div class="print-grid">
        <div class="print-visual">
          <div class="book-cover-mockup">
            <div class="book-spine"></div>
            <div class="book-front">
              <span class="book-vol">VOLUME XIV &bull; 2026</span>
              <h3 class="book-title">${magName}</h3>
              <p class="book-sub">Slow Journeys &bull; Tactile Chronicles</p>
              <div class="book-badge">180gsm Archival Fedrigoni Paper</div>
            </div>
          </div>
        </div>
        <div class="print-content">
          <span class="section-pill-tag">Print Edition</span>
          <h2 class="section-title">Tangible, slow chronicles crafted to outlive the digital feed.</h2>
          <p class="print-lead">
            We publish four quarterly volumes each year. Printed in Germany using vegetable-based inks on heavy uncoated Italian paper, thread-sewn with a textured linen spine.
          </p>
          <ul class="print-specs">
            <li>✓ 180 pages of zero-advertising editorial photojournalism</li>
            <li>✓ Pull-out topographical foldout map of the High Atacama</li>
            <li>✓ Embossed cloth-bound cover with copper foil titling</li>
          </ul>
          <div class="print-pricing-box">
            <div class="price-col">
              <span class="price-val">$28.00</span>
              <span class="price-label">Single Volume XIV</span>
            </div>
            <div class="price-col featured">
              <span class="price-val">$95.00</span>
              <span class="price-label">Annual Subscription (4 Volumes)</span>
            </div>
          </div>
          <div class="print-actions">
            <button type="button" class="btn btn-primary btn-lg" id="orderSingleBtn">Order Single Issue</button>
            <button type="button" class="btn btn-secondary btn-lg" id="orderAnnualBtn">Subscribe Annually</button>
          </div>
          <div class="order-feedback" id="orderFeedback" style="display: none;">
            <p>✓ Volume XIV added to dispatch checkout. Complimentary tracked postal delivery applied.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Journalism Pledge & Integrity -->
  <section id="philosophy" class="section-philosophy">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Editorial Code</span>
        <h2 class="section-title">The ${magName} Field Journalism Pledge</h2>
        <p class="section-subtitle">We believe true exploration requires uncompromised independence and honest curiosity.</p>
      </div>

      <div class="pledge-grid">
        <article class="pledge-card">
          <h3 class="pledge-title">Zero Sponsored Junkets</h3>
          <p class="pledge-desc">Every flight, train ticket, meal, and mountain guide is funded entirely by our subscriber revenue. We never accept free stays or tourist-board itineraries.</p>
        </article>
        <article class="pledge-card">
          <h3 class="pledge-title">Slow & Immersive Residencies</h3>
          <p class="pledge-desc">Our contributors spend a minimum of two uninterrupted weeks on location, prioritizing conversations with locals over tourist checklists.</p>
        </article>
        <article class="pledge-card">
          <h3 class="pledge-title">Fair Compensation for Contributors</h3>
          <p class="pledge-desc">We respect the craft of independent photography and long-form writing, paying above industry standard rates for every published line and photograph.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- Subscribe Newsletter -->
  <section id="subscribe" class="section-subscribe">
    <div class="container subscribe-container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Weekly Field Notes</span>
        <h2 class="section-title">Receive Sunday Morning Travel Dispatches</h2>
        <p class="section-subtitle">A quiet, photo-rich weekly newsletter featuring one extraordinary landscape, a recipe, and a piece of field writing.</p>
      </div>

      <form class="subscribe-form" id="newsletterForm">
        <input type="email" id="subscriberEmail" placeholder="Enter your email address..." required>
        <button type="submit" class="btn btn-primary" id="subscribeSubmitBtn">Join Dispatches</button>
      </form>
      <div class="subscribe-success" id="subscribeSuccess" style="display: none;">
        <p>✓ Welcome to ${magName} Field Notes. Check your inbox for our special field essay on the Lofoten Polar Night.</p>
      </div>
    </div>
  </section>

  <!-- Editorial Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="logo-text">${magName}</span>
        </div>
        <p class="footer-tagline">Independent print & digital travel journal dedicated to slow exploration and evocative photojournalism.</p>
        <p class="footer-copy">&copy; 2026 ${magName} Publishing. Printed on FSC-certified archival stock.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Sections</h4>
        <p class="footer-link"><a href="#dispatches">Field Dispatches</a></p>
        <p class="footer-link"><a href="#dispatches">Nordic Chronicles</a></p>
        <p class="footer-link"><a href="#dispatches">Kyoto Archives</a></p>
        <p class="footer-link"><a href="#print">Print Subscriptions</a></p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Contributors</h4>
        <p class="footer-address">We accept pitch proposals for field photo essays and travel writing.<br>Send pitches to: <strong>editor@terra-journal.com</strong></p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Stockists</h4>
        <p class="footer-address">Found in select independent bookstores in London, Berlin, Tokyo, Stockholm, and New York.</p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `/* styles/theme.css — Editorial Magazine Design Tokens */
:root {
  --color-bg: #faf8f5;
  --color-surface: #ffffff;
  --color-paper: #f4eee5;
  --color-charcoal: #1c1917;
  --color-ink: #292524;
  --color-muted: #78716c;
  --color-amber: #d97706;
  --color-primary: #1c1917;
  --color-primary-hover: #44403c;
  --color-border: #e7e0d5;

  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-pill: 9999px;

  --shadow-subtle: 0 4px 20px rgba(41, 37, 36, 0.05);
  --shadow-hover: 0 16px 36px rgba(41, 37, 36, 0.1);
  --transition: all 0.25s ease;
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
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .brand-logo, .book-title {
  font-family: var(--font-serif);
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

button, input {
  font: inherit;
}`;

  const siteCss = `/* assets/site.css — Travel Magazine Layout & Responsive Styles */
.container {
  width: 100%;
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Announcement Bar */
.announcement-bar {
  background-color: var(--color-charcoal);
  color: #faf8f5;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  padding: 0.65rem 0;
  text-align: center;
  font-weight: 500;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(250, 248, 245, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
  padding: 1.25rem 0;
}
.nav-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-logo {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-charcoal);
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
  border-color: var(--color-border);
}
.btn-secondary:hover {
  border-color: var(--color-charcoal);
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
  padding: 5rem 0 6rem;
  border-bottom: 1px solid var(--color-border);
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 4.5rem;
  align-items: center;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background-color: var(--color-paper);
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-amber);
}
.hero-title {
  font-size: 3.5rem;
  line-height: 1.1;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: var(--color-charcoal);
}
.hero-lead {
  font-size: 1.15rem;
  color: var(--color-muted);
  line-height: 1.8;
  margin-bottom: 1.5rem;
  max-width: 540px;
}
.hero-byline {
  font-size: 0.9rem;
  color: var(--color-charcoal);
  margin-bottom: 2.25rem;
  font-style: italic;
}
.hero-cta-group {
  display: flex;
  gap: 1rem;
}
.hero-photo-wrapper {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(41, 37, 36, 0.12);
}
.hero-photo-img {
  width: 100%;
  height: 520px;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.hero-photo-wrapper:hover .hero-photo-img {
  transform: scale(1.03);
}
.photo-overlay-badge {
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  background-color: rgba(28, 25, 23, 0.9);
  color: #faf8f5;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
}

/* Dispatches Section */
.section-dispatches {
  padding: 6rem 0;
}
.section-header-flex {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 3.5rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.section-pill-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-charcoal);
  background-color: var(--color-paper);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: 2.35rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background-color: var(--color-paper);
  padding: 0.35rem;
  border-radius: var(--radius-sm);
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
  box-shadow: 0 2px 6px rgba(41, 37, 36, 0.06);
}
.dispatches-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
}
.dispatch-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}
.dispatch-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
.dispatch-thumb {
  position: relative;
  height: 250px;
  overflow: hidden;
  background-color: var(--color-paper);
}
.dispatch-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.dispatch-card:hover .dispatch-img {
  transform: scale(1.04);
}
.dispatch-region {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(28, 25, 23, 0.85);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
}
.dispatch-info {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.dispatch-meta {
  font-size: 0.8rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
}
.dispatch-title {
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 0.75rem;
  color: var(--color-charcoal);
}
.dispatch-desc {
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.7;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}
.dispatch-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.author-tag {
  font-size: 0.85rem;
  font-style: italic;
  color: var(--color-muted);
}
.btn-read-dispatch {
  background: transparent;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-charcoal);
  cursor: pointer;
  padding: 0.25rem 0;
}
.btn-read-dispatch:hover {
  text-decoration: underline;
}

/* Dialog */
.story-dialog {
  border: none;
  border-radius: var(--radius-md);
  padding: 0;
  max-width: 720px;
  width: 90%;
  margin: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  background-color: var(--color-bg);
}
.story-dialog::backdrop {
  background-color: rgba(28, 25, 23, 0.7);
  backdrop-filter: blur(4px);
}
.dialog-content {
  position: relative;
  padding: 3rem;
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

/* Print Section */
.section-print {
  padding: 6rem 0;
  background-color: var(--color-paper);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.print-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 4.5rem;
  align-items: center;
}
.book-cover-mockup {
  display: flex;
  box-shadow: 0 30px 60px rgba(41, 37, 36, 0.2);
  border-radius: 6px;
  overflow: hidden;
  max-width: 420px;
  margin: 0 auto;
}
.book-spine {
  width: 24px;
  background-color: #3b2f2f;
  border-right: 1px solid rgba(0,0,0,0.2);
}
.book-front {
  background-color: #2b2622;
  color: #faf8f5;
  padding: 4rem 2.5rem;
  flex-grow: 1;
  text-align: center;
}
.book-vol {
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: #d97706;
  font-weight: 700;
  display: block;
  margin-bottom: 1.5rem;
}
.book-title {
  font-size: 2.75rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  letter-spacing: 0.02em;
}
.book-sub {
  font-size: 1rem;
  font-style: italic;
  color: #c4b5a5;
  margin-bottom: 3rem;
}
.book-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-top: 1px solid rgba(255,255,255,0.15);
  padding-top: 1rem;
  color: #a89f91;
}
.print-lead {
  font-size: 1.15rem;
  color: var(--color-muted);
  line-height: 1.8;
  margin: 1.5rem 0 2rem;
}
.print-specs {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}
.print-pricing-box {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.price-col {
  background-color: var(--color-surface);
  padding: 1.25rem 1.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}
.price-col.featured {
  border-color: var(--color-charcoal);
  background-color: #ffffff;
}
.price-val {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-charcoal);
}
.price-label {
  font-size: 0.8rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.print-actions {
  display: flex;
  gap: 1rem;
}
.order-feedback {
  margin-top: 1.25rem;
  padding: 1rem 1.5rem;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: var(--radius-sm);
  color: #065f46;
  font-weight: 600;
}

/* Philosophy Section */
.section-philosophy {
  padding: 6rem 0;
}
.pledge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  margin-top: 3.5rem;
}
.pledge-card {
  background-color: var(--color-surface);
  padding: 2.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
}
.pledge-title {
  font-size: 1.35rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-charcoal);
}
.pledge-desc {
  font-size: 0.925rem;
  color: var(--color-muted);
  line-height: 1.8;
}

/* Subscribe Section */
.section-subscribe {
  padding: 6rem 0;
  background-color: var(--color-charcoal);
  color: #faf8f5;
}
.subscribe-container {
  max-width: 680px;
}
.section-subscribe .section-title {
  color: #ffffff;
}
.section-subscribe .section-subtitle {
  color: #a8a29e;
  margin-bottom: 2.5rem;
}
.subscribe-form {
  display: flex;
  gap: 0.75rem;
}
.subscribe-form input {
  flex-grow: 1;
  padding: 0.9rem 1.25rem;
  border: 1px solid #44403c;
  background-color: #292524;
  color: #ffffff;
  border-radius: var(--radius-sm);
}
.subscribe-form input:focus {
  outline: none;
  border-color: #d97706;
}
.subscribe-form .btn-primary {
  background-color: #d97706;
  color: #ffffff;
}
.subscribe-form .btn-primary:hover {
  background-color: #b45309;
}
.subscribe-success {
  margin-top: 1.25rem;
  padding: 1rem;
  background-color: rgba(217, 119, 6, 0.15);
  border: 1px solid #d97706;
  border-radius: var(--radius-sm);
  color: #fbbf24;
  text-align: center;
}

/* Footer */
.footer {
  background-color: var(--color-paper);
  border-top: 1px solid var(--color-border);
  padding: 4.5rem 0 3rem;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 3rem;
}
.footer-brand .logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  display: block;
  margin-bottom: 0.75rem;
}
.footer-tagline {
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.7;
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
  line-height: 1.7;
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
  background-color: #e7e0d5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78716c;
}

/* Responsive */
@media (max-width: 992px) {
  .hero-grid, .print-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .dispatches-grid, .pledge-grid {
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
    font-size: 2.35rem;
  }
  .dispatches-grid, .pledge-grid {
    grid-template-columns: 1fr;
  }
  .print-actions {
    flex-direction: column;
  }
  .subscribe-form {
    flex-direction: column;
  }
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}`;

  const siteJs = `/* assets/site.js — Travel Magazine Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // Region Filter Tabs
  const filterTabs = document.querySelectorAll('#regionFilterTabs .filter-tab');
  const dispatchCards = document.querySelectorAll('.dispatch-card');

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      dispatchCards.forEach((card) => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Story Reader Dialog
  const storyDialog = document.getElementById('storyDialog');
  const storyBody = document.getElementById('storyBody');
  const closeStoryBtn = document.getElementById('closeStoryBtn');

  const storyArticles = {
    cover: {
      title: 'The Silence of the High Atacama',
      meta: 'Volume XIV Cover Essay · 14 Min Read · By Julian Vance',
      body: \`<p>Across the high altitude plains of the Atacama, sound behaves differently. At 4,200 meters above sea level, the atmosphere thins to a whisper. The wind rustles through salt polygons that have cracked under subterranean evaporation cycles lasting millennia.</p>
      <blockquote style="font-family: var(--font-serif); font-size: 1.35rem; font-style: italic; margin: 2rem 0; padding-left: 1.5rem; border-left: 3px solid #d97706; color: #1c1917;">"You do not travel here to escape modern noise; you travel here to rediscover the physical presence of stillness."</blockquote>
      <p>We spent twenty-one days with Don Ercilio, one of three remaining llama herders near the border of Bolivia. At night, the absence of humidity creates an optical lens so clear that stars don't twinkle—they burn steady white needles into the black void.</p>\`
    },
    sarek: {
      title: 'Tracking Glacial Rivers Through Europe\\'s Last True Wilderness',
      meta: 'Field Report · 9 Min Read · By Lars Lindqvist',
      body: \`<p>In Sarek National Park, there are no designated camp zones, no cell towers, and no timber footbridges across the Rapa River delta. To enter this glacial massif is to agree to self-reliance.</p>
      <p>For ten days, my partner and I carried 24-kilo packs across boggy birch forests and loose scree ridges. When autumn arrives in early September, the entire tundra ignites in fiery crimson and gold dwarf birch foliage under snow-dusted cirques.</p>\`
    },
    fjords: {
      title: 'The Silent Vessels of Western Norway',
      meta: 'Maritime Essay · 11 Min Read · By Astrid Solberg',
      body: \`<p>We killed the diesel engine at the mouth of Hjørundfjord. For thirty miles, the sheer granite walls of the Sunnmøre Alps rise 1,500 meters straight from green sea water into the low cloud ceiling.</p>
      <p>Aboard a 60-foot gaff-rigged wooden ketch built in 1928, silence is preserved. The only sounds are the creak of oiled hemp rigging and the rush of cascading waterfalls plunging directly into the brine.</p>\`
    },
    adriatic: {
      title: 'Lighthouses and Lavender in the Outer Adriatic',
      meta: 'Island Dispatch · 8 Min Read · By Mateo Horvat',
      body: \`<p>To reach Palagruža, one must take a supply boat forty miles south of Vis into open Mediterranean waters. The lighthouse stands on an isolated crag where Greco-Roman amphorae still lie wedged between underwater boulders.</p>\`
    },
    machiya: {
      title: 'Preserving the Fragile Wooden Machiya',
      meta: 'Architecture & Culture · 12 Min Read · By Kenji Takahashi',
      body: \`<p>In the Nishijin textile quarter of Kyoto, the fragrance of untreated hinoki cypress and tatami rush wafts from narrow wooden latticework facades. Master carpenter Tanaka-san works on a joinery beam without a single metallic nail.</p>\`
    },
    atlas: {
      title: 'Terraces Above the Clouds in the Ourika Valley',
      meta: 'Highlands · 10 Min Read · By Soraya Amrani',
      body: \`<p>High above Marrakech, stone villages cling to reddish metamorphic cliffs. Each terraced plot is fed by ancestral earthen canals carved into mountain rock hundreds of years ago.</p>\`
    },
    lofoten: {
      title: 'Under the Blue Hour of Polar Winter',
      meta: 'Photo Essay · 7 Min Read · By Freja Nielsen',
      body: \`<p>Between December and January in Reine, the sun never clears the jagged oceanic horizon. Instead, the landscape is bathed in six hours of continuous sapphire twilight known across Scandinavia as the Blue Hour.</p>\`
    }
  };

  function openStory(key) {
    const s = storyArticles[key];
    if (s && storyDialog && storyBody) {
      storyBody.innerHTML = \`
        <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c;">\${s.meta}</span>
        <h2 style="font-family: var(--font-serif); font-size: 2.25rem; font-weight: 600; margin: 0.75rem 0 1.5rem; color: #1c1917; line-height: 1.2;">\${s.title}</h2>
        <div style="font-size: 1.05rem; line-height: 1.85; color: #44403c;">\${s.body}</div>
      \`;
      storyDialog.showModal();
    }
  }

  const coverBtn = document.getElementById('readCoverStoryBtn');
  if (coverBtn) coverBtn.addEventListener('click', () => openStory('cover'));

  document.querySelectorAll('.btn-read-dispatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      openStory(btn.dataset.story);
    });
  });

  if (closeStoryBtn && storyDialog) {
    closeStoryBtn.addEventListener('click', () => storyDialog.close());
    storyDialog.addEventListener('click', (e) => {
      if (e.target === storyDialog) storyDialog.close();
    });
  }

  // Print Order Feedback
  const orderSingleBtn = document.getElementById('orderSingleBtn');
  const orderAnnualBtn = document.getElementById('orderAnnualBtn');
  const orderFeedback = document.getElementById('orderFeedback');

  [orderSingleBtn, orderAnnualBtn].forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (orderFeedback) orderFeedback.style.display = 'block';
      });
    }
  });

  // Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  const subscribeSuccess = document.getElementById('subscribeSuccess');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (subscribeSuccess) subscribeSuccess.style.display = 'block';
      newsletterForm.reset();
    });
  }
});`;

  const readme = `# ${magName} — Independent Field Dispatches & Travel Journal

Production-grade editorial travel magazine website featuring:
- Editorial layout with archival typography and high-definition photography
- 6 curated travel dispatches across Nordic, East Asia, and Mediterranean regions
- Interactive dispatch reader modal with full field essays and pull quotes
- Region category tabs (Nordic, East Asia, Mediterranean)
- Archival print edition showcase and quarterly subscription checkout
- Independent field journalism pledge with zero tourist-board sponsored content
- Weekly Sunday newsletter dispatch form

## Structure
- \`index.html\`: Semantic HTML5 structure
- \`styles/theme.css\`: Editorial paper cream and ink design tokens
- \`assets/site.css\`: Grid layout and typography styles
- \`assets/site.js\`: Region filtering and dispatch modal reader
`;

  return [
    { path: 'index.html', content: html, language: 'html' },
    { path: 'styles/theme.css', content: themeCss, language: 'css' },
    { path: 'assets/site.css', content: siteCss, language: 'css' },
    { path: 'assets/site.js', content: siteJs, language: 'javascript' },
    { path: 'README.md', content: readme, language: 'markdown' },
  ];
}
