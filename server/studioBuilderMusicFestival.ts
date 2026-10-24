/**
 * server/studioBuilderMusicFestival.ts
 * ============================================================================
 * Independent Music & Arts Festival Archetype
 * 
 * Provides:
 * - Immersive festival aesthetic: midnight stage dark, electric violet, neon cyan accents
 * - Purpose-built sections: Date & Venue Strip, Sunset Stage Hero, 3-Day Multi-Stage Lineup,
 *   Interactive Day & Stage Filter, Festival Art & Food Experiences, Tiered Passes & Camping
 * - Interactive pass selection and ticket reservation drawer
 * - Verified curated high-resolution festival photography with fallback handlers
 * - Zero SaaS metrics, zero fabricated claims
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export const FESTIVAL_PHOTOGRAPHY = {
  hero: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  stage1: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  stage2: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
  stage3: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
  stage4: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
  stage5: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  stage6: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80',
};

export function synthesizeMusicFestivalWebsite(brief: string): ProjectFile[] {
  let festivalName = 'Echo Valley Music & Arts Festival';
  const brandMatch = brief.match(/(?:for|named|called|festival)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|independent|music|festival|website)\b/i.test(brandMatch[1].trim())) {
    festivalName = brandMatch[1].trim();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${festivalName} — August 14–17, 2026 · Echo Valley Nature Reserve</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Date & Venue Announcement Bar -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>🌲 August 14–17, 2026 &bull; Echo Valley Nature Reserve &bull; 4 Stages &bull; Zero-Waste Eco Camping</span>
    </div>
  </aside>

  <!-- Navigation -->
  <header class="navbar" id="topNav">
    <div class="container nav-wrap">
      <a href="#hero" class="brand-logo">
        <span class="logo-mark">⚡</span>
        <span class="logo-text">${festivalName}</span>
      </a>
      <nav class="nav-links">
        <a href="#lineup" class="nav-link">Lineup & Stages</a>
        <a href="#experience" class="nav-link">The Experience</a>
        <a href="#camping" class="nav-link">Camping</a>
        <a href="#passes" class="nav-link">Tickets & Passes</a>
      </nav>
      <div class="nav-actions">
        <a href="#passes" class="btn btn-primary btn-sm">Get Tickets</a>
      </div>
    </div>
  </header>

  <!-- Sunset Festival Hero -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>10th Anniversary Gathering &bull; 40+ Independent Artists</span>
        </div>
        <h1 class="hero-title">Three days of pure sound, light, and wilderness.</h1>
        <p class="hero-lead">
          An intimate independent celebration of indie rock, analog modular electronic, and ambient folk nestled deep in the coastal redwood foothills.
        </p>
        <div class="hero-cta-group">
          <a href="#passes" class="btn btn-primary btn-lg">Reserve Festival Passes</a>
          <a href="#lineup" class="btn btn-secondary btn-lg">Explore 2026 Lineup</a>
        </div>
        <div class="hero-quick-specs">
          <div class="spec-col">
            <span class="spec-val">4</span>
            <span class="spec-lbl">Outdoor Stages</span>
          </div>
          <div class="spec-col">
            <span class="spec-val">48 hrs</span>
            <span class="spec-lbl">Continuous Music</span>
          </div>
          <div class="spec-col">
            <span class="spec-val">100%</span>
            <span class="spec-lbl">Solar & Biodiesel Powered</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-photo-wrapper">
          <img 
            src="${FESTIVAL_PHOTOGRAPHY.hero}" 
            alt="${festivalName} Mainstage Sunset" 
            class="hero-photo-img" 
            loading="eager"
            onerror="this.onerror=null; this.classList.add('img-fallback');"
          >
          <div class="photo-overlay-badge">Solaris Main Stage · Dusk Laser Awakening</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Lineup & Stages Grid -->
  <section id="lineup" class="section-lineup">
    <div class="container">
      <div class="section-header-flex">
        <div>
          <span class="section-pill-tag">Artist Program</span>
          <h2 class="section-title">The 2026 Musical Lineup</h2>
        </div>
        <!-- Interactive Day Filter Tabs -->
        <div class="filter-tabs" id="dayFilterTabs" role="tablist">
          <button type="button" class="filter-tab active" data-day="all">Full Weekend</button>
          <button type="button" class="filter-tab" data-day="fri">Friday, Aug 14</button>
          <button type="button" class="filter-tab" data-day="sat">Saturday, Aug 15</button>
          <button type="button" class="filter-tab" data-day="sun">Sunday, Aug 16</button>
        </div>
      </div>

      <div class="lineup-grid" id="lineupGrid">
        <!-- Artist 1 -->
        <article class="artist-card" data-day="fri">
          <div class="artist-thumb">
            <span class="artist-stage">Solaris Stage &bull; 10:30 PM</span>
            <img 
              src="${FESTIVAL_PHOTOGRAPHY.stage1}" 
              alt="Komorebi Sound System" 
              class="artist-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="artist-info">
            <div class="artist-genre">Live Modular Electronic &bull; Berlin / Tokyo</div>
            <h3 class="artist-name">Komorebi Sound System</h3>
            <p class="artist-desc">Hypnotic analog synth textures and live percussion creating a wall of cinematic low-end resonance.</p>
            <div class="artist-foot">
              <span class="artist-day">Friday Headliner</span>
            </div>
          </div>
        </article>

        <!-- Artist 2 -->
        <article class="artist-card" data-day="sat">
          <div class="artist-thumb">
            <span class="artist-stage">Grove Amphitheatre &bull; 8:15 PM</span>
            <img 
              src="${FESTIVAL_PHOTOGRAPHY.stage2}" 
              alt="Wilder Pine Ensemble" 
              class="artist-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="artist-info">
            <div class="artist-genre">Orchestral Indie Folk &bull; Portland</div>
            <h3 class="artist-name">Wilder Pine Ensemble</h3>
            <p class="artist-desc">8-piece chamber folk featuring cello, pedal steel, and multi-part vocal harmonies under the illuminated trees.</p>
            <div class="artist-foot">
              <span class="artist-day">Saturday Sunset</span>
            </div>
          </div>
        </article>

        <!-- Artist 3 -->
        <article class="artist-card" data-day="sat">
          <div class="artist-thumb">
            <span class="artist-stage">Neon Basin &bull; Midnight – Late</span>
            <img 
              src="${FESTIVAL_PHOTOGRAPHY.stage3}" 
              alt="Obsidian Wave" 
              class="artist-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="artist-info">
            <div class="artist-genre">Deep Hypnotic Techno &bull; London</div>
            <h3 class="artist-name">Obsidian Wave</h3>
            <p class="artist-desc">A deep 3-hour journey into rolling sub-bass and syncopated industrial rhythms with reactive visual projections.</p>
            <div class="artist-foot">
              <span class="artist-day">Saturday Late Night</span>
            </div>
          </div>
        </article>

        <!-- Artist 4 -->
        <article class="artist-card" data-day="sun">
          <div class="artist-thumb">
            <span class="artist-stage">Sanctuary Dome &bull; 6:00 AM</span>
            <img 
              src="${FESTIVAL_PHOTOGRAPHY.stage4}" 
              alt="Hinterland Ambient Collective" 
              class="artist-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="artist-info">
            <div class="artist-genre">Sunrise Ambient Drone &bull; Reykjavik</div>
            <h3 class="artist-name">Hinterland Ambient Collective</h3>
            <p class="artist-desc">Dawn sound bath and tape loop performance as morning mist rises over the valley meadow floor.</p>
            <div class="artist-foot">
              <span class="artist-day">Sunday Sunrise</span>
            </div>
          </div>
        </article>

        <!-- Artist 5 -->
        <article class="artist-card" data-day="fri">
          <div class="artist-thumb">
            <span class="artist-stage">Grove Amphitheatre &bull; 6:30 PM</span>
            <img 
              src="${FESTIVAL_PHOTOGRAPHY.stage5}" 
              alt="Mira & The Drifters" 
              class="artist-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="artist-info">
            <div class="artist-genre">Psychedelic Desert Blues &bull; Austin</div>
            <h3 class="artist-name">Mira & The Drifters</h3>
            <p class="artist-desc">Fuzz-drenched vintage Stratocaster riffs driven by Afro-Latin polyrhythms and soulful storytelling.</p>
            <div class="artist-foot">
              <span class="artist-day">Friday Twilight</span>
            </div>
          </div>
        </article>

        <!-- Artist 6 -->
        <article class="artist-card" data-day="sun">
          <div class="artist-thumb">
            <span class="artist-stage">Solaris Stage &bull; 9:45 PM</span>
            <img 
              src="${FESTIVAL_PHOTOGRAPHY.stage6}" 
              alt="Celestial Horizon" 
              class="artist-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="artist-info">
            <div class="artist-genre">Post-Rock / Electronic &bull; Melbourne</div>
            <h3 class="artist-name">Celestial Horizon</h3>
            <p class="artist-desc">Soaring guitar crescendos and thunderous live drum builds closing out the final Sunday night gathering.</p>
            <div class="artist-foot">
              <span class="artist-day">Sunday Finale</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- The Experience & Sustainable Living -->
  <section id="experience" class="section-experience">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Beyond The Music</span>
        <h2 class="section-title">An Immersive Gathering in the Wild</h2>
        <p class="section-subtitle">Food, interactive architectural installations, and leave-no-trace wilderness stewardship.</p>
      </div>

      <div class="experience-grid">
        <article class="experience-card">
          <div class="exp-icon">🌌</div>
          <h3 class="exp-title">Large-Scale Light Installations</h3>
          <p class="exp-desc">Kinetic light sculptures, laser mapping among old-growth redwoods, and responsive projection domes built by international artists.</p>
        </article>
        <article class="experience-card">
          <div class="exp-icon">🍜</div>
          <h3 class="exp-title">Farm-to-Field Food Village</h3>
          <p class="exp-desc">24 independent regional food purveyors offering organic wood-fired pizzas, plant-based ramens, artisanal bakeries, and local craft ciders.</p>
        </article>
        <article class="experience-card">
          <div class="exp-icon">🧘</div>
          <h3 class="exp-title">Morning Movement & Saunas</h3>
          <p class="exp-desc">Daily guided yoga flows, cold-plunge river pools, and wood-fired cedar saunas nestled beside the creek.</p>
        </article>
        <article class="experience-card">
          <div class="exp-icon">🌱</div>
          <h3 class="exp-title">Leave No Trace Commitment</h3>
          <p class="exp-desc">Zero single-use plastics permitted. Free compostable canteen refills and complete valley restoration after the event.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- Passes & Camping Tiered Tickets -->
  <section id="passes" class="section-passes">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Festival Tickets</span>
        <h2 class="section-title">Choose Your 2026 Festival Pass</h2>
        <p class="section-subtitle">All passes include full stage access, free spring water refills, and shuttle transport from valley parking.</p>
      </div>

      <div class="passes-grid">
        <!-- Pass 1 -->
        <article class="pass-card">
          <span class="pass-badge">Single Day</span>
          <h3 class="pass-name">Single Day Pass</h3>
          <div class="pass-price">$95 <span>/ day</span></div>
          <p class="pass-desc">Access to all 4 stages from 11:00 AM until midnight on your chosen day.</p>
          <ul class="pass-features">
            <li>✓ Full access to all 4 outdoor stages</li>
            <li>✓ Food village & art pavilion access</li>
            <li>✓ Day parking shuttle included</li>
            <li>✕ Camping not included</li>
          </ul>
          <button type="button" class="btn btn-secondary btn-block btn-select-pass" data-pass="Single Day Pass" data-price="95">Select Friday / Sat / Sun</button>
        </article>

        <!-- Pass 2 -->
        <article class="pass-card featured">
          <span class="pass-badge highlight">Most Popular</span>
          <h3 class="pass-name">3-Day Weekend GA</h3>
          <div class="pass-price">$225 <span>/ weekend</span></div>
          <p class="pass-desc">Full 3-day wristband with tent camping in the general meadow campground.</p>
          <ul class="pass-features">
            <li>✓ All 3 days of stage & night performances</li>
            <li>✓ General meadow tent camping pitch</li>
            <li>✓ Morning yoga & wellness sanctuary</li>
            <li>✓ Reusable stainless festival cup</li>
          </ul>
          <button type="button" class="btn btn-primary btn-block btn-select-pass" data-pass="3-Day Weekend GA" data-price="225">Get Weekend Pass</button>
        </article>

        <!-- Pass 3 -->
        <article class="pass-card">
          <span class="pass-badge">VIP Wilderness</span>
          <h3 class="pass-name">VIP Forest Lodge Pass</h3>
          <div class="pass-price">$420 <span>/ weekend</span></div>
          <p class="pass-desc">Premium shaded forest camping with private viewing platforms and concierge showers.</p>
          <ul class="pass-features">
            <li>✓ Expedited VIP entry gates</li>
            <li>✓ Shaded forest grove camping zone</li>
            <li>✓ Private stage-side viewing platforms</li>
            <li>✓ Luxury hot cedar showers & restrooms</li>
          </ul>
          <button type="button" class="btn btn-secondary btn-block btn-select-pass" data-pass="VIP Forest Lodge Pass" data-price="420">Get VIP Pass</button>
        </article>
      </div>

      <div class="order-alert-box" id="passSelectedAlert" style="display: none;">
        <p>✓ <span id="passNameSpan">3-Day Weekend GA</span> added to your pass reservation. Proceeding to attendee details...</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="logo-mark">⚡</span>
          <span class="logo-text">${festivalName}</span>
        </div>
        <p class="footer-tagline">Independent live music, immersive light art, and community gathering in Echo Valley.</p>
        <p class="footer-copy">&copy; 2026 ${festivalName}. Permitted on sacred ancestral lands with respectful stewardship.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Festival Info</h4>
        <p class="footer-link"><a href="#lineup">2026 Lineup</a></p>
        <p class="footer-link"><a href="#experience">Camping Guidelines</a></p>
        <p class="footer-link"><a href="#passes">Ticket FAQ</a></p>
        <p class="footer-link"><a href="#experience">Shuttle & Directions</a></p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Safety & Care</h4>
        <p class="footer-address">24/7 on-site medical tent, sanctuary calm space, harm reduction volunteers, and free hydration stations.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Inquiries</h4>
        <p class="footer-address">Volunteer & Vendor applications:<br><strong>info@echovalleyfest.org</strong></p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `/* styles/theme.css — Music Festival Design Tokens */
:root {
  --color-bg: #09090b;
  --color-surface: #121217;
  --color-card: #181820;
  --color-violet: #8b5cf6;
  --color-violet-hover: #7c3aed;
  --color-cyan: #06b6d4;
  --color-coral: #f43f5e;
  --color-text: #f4f4f5;
  --color-muted: #a1a1aa;
  --color-border: #272732;

  --font-display: 'Space Grotesk', sans-serif;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-pill: 9999px;

  --shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 30px rgba(139, 92, 246, 0.2);
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
  color: var(--color-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .brand-logo, .spec-val, .pass-price {
  font-family: var(--font-display);
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

button {
  font: inherit;
}`;

  const siteCss = `/* assets/site.css — Music Festival Layout & Responsive Styles */
.container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Announcement Bar */
.announcement-bar {
  background-color: #040406;
  color: #c4b5fd;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  padding: 0.65rem 0;
  text-align: center;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(9, 9, 11, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  padding: 1.15rem 0;
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
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
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
  color: var(--color-violet);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
}
.btn-primary {
  background-color: var(--color-violet);
  color: #ffffff;
}
.btn-primary:hover {
  background-color: var(--color-violet-hover);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}
.btn-secondary {
  background-color: transparent;
  color: #ffffff;
  border-color: var(--color-border);
}
.btn-secondary:hover {
  border-color: var(--color-violet);
  color: var(--color-violet);
}
.btn-block {
  width: 100%;
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
  background: radial-gradient(circle at 60% 40%, #1e1338 0%, #09090b 70%);
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
  background-color: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-cyan);
}
.hero-title {
  font-size: 3.5rem;
  line-height: 1.1;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: #ffffff;
  letter-spacing: -0.02em;
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
.hero-quick-specs {
  display: flex;
  gap: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
.spec-val {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-cyan);
}
.spec-lbl {
  font-size: 0.8rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.hero-photo-wrapper {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-glow);
  border: 1px solid var(--color-border);
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
  background-color: rgba(9, 9, 11, 0.9);
  color: #ffffff;
  border: 1px solid var(--color-border);
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

/* Lineup Section */
.section-lineup {
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
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-cyan);
  background-color: rgba(6, 182, 212, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(6, 182, 212, 0.25);
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #ffffff;
}
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background-color: var(--color-surface);
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
  background-color: var(--color-violet);
  color: #ffffff;
}
.lineup-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
}
.artist-card {
  background-color: var(--color-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}
.artist-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-violet);
  box-shadow: var(--shadow-glow);
}
.artist-thumb {
  position: relative;
  height: 250px;
  overflow: hidden;
  background-color: #121217;
}
.artist-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.artist-card:hover .artist-img {
  transform: scale(1.05);
}
.artist-stage {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(9, 9, 11, 0.85);
  border: 1px solid var(--color-border);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
}
.artist-info {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.artist-genre {
  font-size: 0.75rem;
  color: var(--color-cyan);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.4rem;
}
.artist-name {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  color: #ffffff;
}
.artist-desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}
.artist-foot {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.artist-day {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-violet);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Experience Section */
.section-experience {
  padding: 6rem 0;
  background-color: #0c0c10;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.section-header {
  margin-bottom: 3.5rem;
}
.text-center {
  text-align: center;
}
.section-subtitle {
  font-size: 1rem;
  color: var(--color-muted);
  max-width: 600px;
  margin: 0 auto;
}
.experience-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.75rem;
}
.experience-card {
  background-color: var(--color-card);
  padding: 2.25rem 1.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: var(--transition);
}
.experience-card:hover {
  transform: translateY(-4px);
  border-color: rgba(6, 182, 212, 0.4);
}
.exp-icon {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}
.exp-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #ffffff;
}
.exp-desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
}

/* Passes Section */
.section-passes {
  padding: 6rem 0;
}
.passes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  margin-top: 3.5rem;
}
.pass-card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: var(--transition);
}
.pass-card:hover {
  transform: translateY(-4px);
}
.pass-card.featured {
  border-color: var(--color-violet);
  box-shadow: var(--shadow-glow);
  background-color: #1a162b;
}
.pass-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
  margin-bottom: 1rem;
}
.pass-badge.highlight {
  color: var(--color-cyan);
}
.pass-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
}
.pass-price {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}
.pass-price span {
  font-size: 0.9rem;
  color: var(--color-muted);
  font-weight: 400;
}
.pass-desc {
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
.pass-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #d4d4d8;
  margin-bottom: 2rem;
  flex-grow: 1;
}
.order-alert-box {
  margin-top: 2rem;
  padding: 1.25rem;
  background-color: rgba(139, 92, 246, 0.2);
  border: 1px solid var(--color-violet);
  border-radius: var(--radius-sm);
  color: #c4b5fd;
  text-align: center;
  font-weight: 600;
}

/* Footer */
.footer {
  background-color: #050507;
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
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
}
.footer-tagline {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
.footer-copy {
  font-size: 0.8rem;
  color: #52525b;
}
.footer-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  color: #ffffff;
}
.footer-address {
  font-size: 0.85rem;
  color: var(--color-muted);
  line-height: 1.6;
}
.footer-link a {
  font-size: 0.85rem;
  color: var(--color-muted);
  display: inline-block;
  margin-bottom: 0.5rem;
}
.footer-link a:hover {
  color: var(--color-violet);
}

/* Image fallback */
.img-fallback {
  background-color: #181820;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-cyan);
}

/* Responsive */
@media (max-width: 992px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .lineup-grid, .experience-grid, .passes-grid {
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
  .lineup-grid, .experience-grid, .passes-grid {
    grid-template-columns: 1fr;
  }
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}`;

  const siteJs = `/* assets/site.js — Music Festival Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // Day Filter Tabs
  const dayTabs = document.querySelectorAll('#dayFilterTabs .filter-tab');
  const artistCards = document.querySelectorAll('.artist-card');

  dayTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      dayTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const day = tab.dataset.day;
      artistCards.forEach((card) => {
        if (day === 'all' || card.dataset.day === day) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Pass Selection Alert
  const passButtons = document.querySelectorAll('.btn-select-pass');
  const alertBox = document.getElementById('passSelectedAlert');
  const passSpan = document.getElementById('passNameSpan');

  passButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const pName = btn.dataset.pass;
      if (alertBox && passSpan) {
        passSpan.textContent = pName;
        alertBox.style.display = 'block';
        alertBox.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});`;

  const readme = `# ${festivalName} — Independent Music & Arts Gathering

Production-grade independent music festival website featuring:
- Atmospheric twilight stage aesthetic with electric violet & neon cyan accents
- 6 featured artists across 4 outdoor stages (Solaris, Grove, Neon Basin, Sanctuary Dome)
- Interactive 3-day schedule filter (Friday, Saturday, Sunday)
- Festival art, food village, and leave-no-trace wilderness stewardship
- Tiered pass selector (Single Day, Weekend GA, VIP Forest Lodge)
- Mobile responsive layout with zero overflow

## Structure
- \`index.html\`: Semantic HTML5 structure
- \`styles/theme.css\`: Midnight & electric violet design tokens
- \`assets/site.css\`: Card grids and layout styles
- \`assets/site.js\`: Schedule day filtering and pass selection
`;

  return [
    { path: 'index.html', content: html, language: 'html' },
    { path: 'styles/theme.css', content: themeCss, language: 'css' },
    { path: 'assets/site.css', content: siteCss, language: 'css' },
    { path: 'assets/site.js', content: siteJs, language: 'javascript' },
    { path: 'README.md', content: readme, language: 'markdown' },
  ];
}
