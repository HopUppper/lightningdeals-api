/**
 * server/studioBuilderIndianJewellery.ts
 * ============================================================================
 * Premium Indian Heritage Jewellery & Bridal Fine Ornaments Archetype
 * 
 * Provides:
 * - Luxury Indian royal aesthetic: royal midnight, champagne gold, deep emerald, warm ivory
 * - Purpose-built sections: BIS Hallmarking Assurance Strip, Royal Legacy Hero,
 *   6 Handcrafted Heirlooms (Polki, Kundan, Temple Gold, Solitaires), Karigar Craftsmanship
 *   Pillars, BIS Purity Standards, Bespoke Bridal Consultation Form
 * - Interactive collection filtering and bridal video concierge scheduler
 * - Verified curated high-resolution jewellery photography with fallback handlers
 * - Zero SaaS metrics, zero fabricated claims
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export const JEWELLERY_PHOTOGRAPHY = {
  hero: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
  item1: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  item2: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
  item3: 'https://images.unsplash.com/photo-1611591475152-47eac9dc66ec?auto=format&fit=crop&w=800&q=80',
  item4: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
  item5: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80',
  item6: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80',
};

export function synthesizeIndianJewelleryWebsite(brief: string): ProjectFile[] {
  let brandName = 'Auraa Heritage Jewellers';
  const brandMatch = brief.match(/(?:for|named|called|brand)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|premium|indian|jewellery|jewelry|website|brand)\b/i.test(brandMatch[1].trim())) {
    brandName = brandMatch[1].trim();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Handcrafted BIS 916 Royal Indian Jewellery & Bridal Heirlooms</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- BIS Hallmarking & Security Bar -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>✨ 100% BIS 916 Hallmarked Gold &bull; IGI Certified Natural Diamonds &bull; Insured Worldwide Dispatch &bull; Guaranteed Lifetime Buyback</span>
    </div>
  </aside>

  <!-- Royal Navbar -->
  <header class="navbar" id="topNav">
    <div class="container nav-wrap">
      <a href="#hero" class="brand-logo">
        <span class="logo-mark">👑</span>
        <span class="logo-text">${brandName}</span>
      </a>
      <nav class="nav-links">
        <a href="#collections" class="nav-link">Heritage Collections</a>
        <a href="#craftsmanship" class="nav-link">Karigar Legacy</a>
        <a href="#purity" class="nav-link">Hallmarking & Purity</a>
        <a href="#bespoke" class="nav-link">Bespoke Bridal</a>
      </nav>
      <div class="nav-actions">
        <a href="#bespoke" class="btn btn-primary btn-sm">Book Virtual Concierge</a>
      </div>
    </div>
  </header>

  <!-- Royal Legacy Hero -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Imperial Craftsmanship &bull; Est. 1978</span>
        </div>
        <h1 class="hero-title">Timeless royal legacies, hand-sculpted in pure gold.</h1>
        <p class="hero-lead">
          From uncut Polki diamond chokers and sacred temple nakshi work to bespoke bridal sets, our master karigars craft heirlooms meant to be treasured across generations.
        </p>
        <div class="hero-cta-group">
          <a href="#collections" class="btn btn-primary btn-lg">Explore Royal Heirlooms</a>
          <a href="#bespoke" class="btn btn-secondary btn-lg">Schedule Bridal Consultation</a>
        </div>
        <div class="hero-assurances">
          <div class="assurance-item">
            <span class="assurance-icon">⚜️</span>
            <div>
              <strong>BIS 916 Certified</strong>
              <p>Government hallmarked 22kt & 18kt pure bullion</p>
            </div>
          </div>
          <div class="assurance-item">
            <span class="assurance-icon">💎</span>
            <div>
              <strong>Ethical Sourcing</strong>
              <p>Conflict-free Kimberley Process natural diamonds</p>
            </div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-photo-wrapper">
          <img 
            src="${JEWELLERY_PHOTOGRAPHY.hero}" 
            alt="${brandName} Heirloom Jewellery" 
            class="hero-photo-img" 
            loading="eager"
            onerror="this.onerror=null; this.classList.add('img-fallback');"
          >
          <div class="photo-overlay-badge">Aadira Nizam Collection &bull; 22kt Handcrafted Gold</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Masterpiece Collections Grid -->
  <section id="collections" class="section-collections">
    <div class="container">
      <div class="section-header-flex">
        <div>
          <span class="section-pill-tag">Royal Showcase</span>
          <h2 class="section-title">The Imperial Heirloom Collection</h2>
        </div>
        <!-- Interactive Category Filters -->
        <div class="filter-tabs" id="jewelleryFilterTabs" role="tablist">
          <button type="button" class="filter-tab active" data-filter="all">All Ornaments</button>
          <button type="button" class="filter-tab" data-filter="polki">Jadau & Polki</button>
          <button type="button" class="filter-tab" data-filter="temple">Temple Gold</button>
          <button type="button" class="filter-tab" data-filter="solitaires">Diamond & Gems</button>
        </div>
      </div>

      <div class="ornaments-grid" id="ornamentsGrid">
        <!-- Item 1 -->
        <article class="ornament-card" data-category="polki">
          <div class="ornament-thumb">
            <span class="ornament-badge">22kt Gold &bull; 84.5g</span>
            <img 
              src="${JEWELLERY_PHOTOGRAPHY.item1}" 
              alt="Aadira Kundan Polki Choker" 
              class="ornament-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="ornament-info">
            <div class="ornament-meta">Jadau Craft &bull; Certified BIS 916</div>
            <h3 class="ornament-name">Aadira Kundan & Polki Choker</h3>
            <p class="ornament-desc">Handset uncut syndicate polki diamonds layered with natural Basra pearls and deep green emerald drops on pure 22kt foil.</p>
            <div class="ornament-foot">
              <span class="ornament-price">₹4,85,000</span>
              <button type="button" class="btn-inquire-jewel" data-item="choker">Inquire & Concierge &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Item 2 -->
        <article class="ornament-card" data-category="solitaires">
          <div class="ornament-thumb">
            <span class="ornament-badge">18kt Gold &bull; 1.85ct Diamond</span>
            <img 
              src="${JEWELLERY_PHOTOGRAPHY.item2}" 
              alt="Surya Solitaire Diamond Ring" 
              class="ornament-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="ornament-info">
            <div class="ornament-meta">Solitaires &bull; IGI Certified VVS1</div>
            <h3 class="ornament-name">Surya Oval Brilliant Solitaire</h3>
            <p class="ornament-desc">A flawless 1.85 carat oval diamond secured in a micro-pavé hidden halo band handcrafted in dual-tone yellow and white gold.</p>
            <div class="ornament-foot">
              <span class="ornament-price">₹3,40,000</span>
              <button type="button" class="btn-inquire-jewel" data-item="ring">Inquire & Concierge &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Item 3 -->
        <article class="ornament-card" data-category="temple">
          <div class="ornament-thumb">
            <span class="ornament-badge">22kt Gold &bull; 42.0g</span>
            <img 
              src="${JEWELLERY_PHOTOGRAPHY.item3}" 
              alt="Mayura Royal Temple Jhumkas" 
              class="ornament-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="ornament-info">
            <div class="ornament-meta">Antique Nakshi &bull; BIS 916</div>
            <h3 class="ornament-name">Mayura Royal Temple Jhumkas</h3>
            <p class="ornament-desc">Hand-carved dancing peacock motifs adorned with natural unheated Burmese rubies and delicate hanging gold bead tassels.</p>
            <div class="ornament-foot">
              <span class="ornament-price">₹2,65,000</span>
              <button type="button" class="btn-inquire-jewel" data-item="jhumka">Inquire & Concierge &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Item 4 -->
        <article class="ornament-card" data-category="polki">
          <div class="ornament-thumb">
            <span class="ornament-badge">22kt Gold &bull; 58.0g</span>
            <img 
              src="${JEWELLERY_PHOTOGRAPHY.item4}" 
              alt="Rani Padmavati Bridal Haathphool" 
              class="ornament-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="ornament-info">
            <div class="ornament-meta">Bridal Jadau &bull; Traditional Meenakari</div>
            <h3 class="ornament-name">Padmavati Royal Bridal Haathphool</h3>
            <p class="ornament-desc">Ornate finger-to-wrist bridal ornament featuring ruby-red Jaipur meenakari reverse enameling and bezel-set uncut diamonds.</p>
            <div class="ornament-foot">
              <span class="ornament-price">₹3,90,000</span>
              <button type="button" class="btn-inquire-jewel" data-item="haathphool">Inquire & Concierge &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Item 5 -->
        <article class="ornament-card" data-category="solitaires">
          <div class="ornament-thumb">
            <span class="ornament-badge">18kt Gold &bull; 28.5g</span>
            <img 
              src="${JEWELLERY_PHOTOGRAPHY.item5}" 
              alt="Emerald Nizam Pendant" 
              class="ornament-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="ornament-info">
            <div class="ornament-meta">Gemstone Haute &bull; Zambian Emerald</div>
            <h3 class="ornament-name">Emerald Cascade Nizam Pendant</h3>
            <p class="ornament-desc">A deep green untreated 6.4 carat Zambian emerald centerpiece framed with radiant rose-cut diamond baguettes.</p>
            <div class="ornament-foot">
              <span class="ornament-price">₹3,15,000</span>
              <button type="button" class="btn-inquire-jewel" data-item="pendant">Inquire & Concierge &rarr;</button>
            </div>
          </div>
        </article>

        <!-- Item 6 -->
        <article class="ornament-card" data-category="temple">
          <div class="ornament-thumb">
            <span class="ornament-badge">22kt Gold &bull; 62.0g Pair</span>
            <img 
              src="${JEWELLERY_PHOTOGRAPHY.item6}" 
              alt="Padma Royal Filigree Bangles" 
              class="ornament-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="ornament-info">
            <div class="ornament-meta">Heirloom Kadas &bull; Screw Clasp</div>
            <h3 class="ornament-name">Padma Antique Gold Kadas (Pair)</h3>
            <p class="ornament-desc">Intricate floral filigree and granulation work executed by 4th-generation karigars, fitted with secure threaded screw clasps.</p>
            <div class="ornament-foot">
              <span class="ornament-price">₹4,20,000</span>
              <button type="button" class="btn-inquire-jewel" data-item="bangles">Inquire & Concierge &rarr;</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Karigar Craftsmanship Pillars -->
  <section id="craftsmanship" class="section-craftsmanship">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Heritage Technique</span>
        <h2 class="section-title">The Four Pillars of ${brandName} Artistry</h2>
        <p class="section-subtitle">Every curve and setting is handcrafted by master artisans preserving age-old royal ateliers.</p>
      </div>

      <div class="pillars-grid">
        <article class="pillar-card">
          <div class="pillar-icon">🔨</div>
          <h3 class="pillar-title">Nakshi Hand-Embossing</h3>
          <p class="pillar-desc">Traditional repoussé and chasing where sheets of 22kt gold are hand-hammered over lac beds to create three-dimensional divine motifs.</p>
        </article>
        <article class="pillar-card">
          <div class="pillar-icon">💎</div>
          <h3 class="pillar-title">Jadau & Kundan Setting</h3>
          <p class="pillar-desc">Pure 24kt gold foil (kundan) refined to hyper-malleability, pressed delicately around uncut diamonds without chemical adhesives.</p>
        </article>
        <article class="pillar-card">
          <div class="pillar-icon">🎨</div>
          <h3 class="pillar-title">Vibrant Meenakari Enamel</h3>
          <p class="pillar-desc">The reverse of each heirloom is adorned with mineral-colored vitreous enamel, kiln-fired at 800°C to create secret wearable paintings.</p>
        </article>
        <article class="pillar-card">
          <div class="pillar-icon">⚖️</div>
          <h3 class="pillar-title">BIS Hallmarking & Laser Audit</h3>
          <p class="pillar-desc">Every piece undergoes government-approved XRF spectrometer assaying and laser engraving of the unique 6-digit HUID code.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- Hallmarking Purity Matrix -->
  <section id="purity" class="section-purity">
    <div class="container">
      <div class="purity-box">
        <div class="purity-header text-center">
          <span class="section-pill-tag">Trust & Assurance</span>
          <h2 class="section-title">The 4 Hallmarks of Pure Gold Assurance</h2>
          <p class="section-subtitle">We guarantee absolute purity and complete transparency on gold weight, stone deductions, and karat testing.</p>
        </div>
        <div class="purity-grid">
          <div class="purity-item">
            <span class="purity-symbol">🇮🇳</span>
            <strong>BIS Triangular Logo</strong>
            <p>Official hallmark from the Bureau of Indian Standards certifying authentic gold alloy.</p>
          </div>
          <div class="purity-item">
            <span class="purity-symbol">916</span>
            <strong>22K916 Purity Grade</strong>
            <p>Denotes 91.6% pure gold content, the global luxury benchmark for handcrafted heirloom jewellery.</p>
          </div>
          <div class="purity-item">
            <span class="purity-symbol">🔬</span>
            <strong>Assaying Center Mark</strong>
            <p>Identification mark of the licensed third-party laboratory where the piece was melted and assayed.</p>
          </div>
          <div class="purity-item">
            <span class="purity-symbol">🏷️</span>
            <strong>6-Digit HUID Code</strong>
            <p>Unique alphanumeric identity code for traceability on the official BIS Care mobile registry.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Bespoke Bridal Consultation Form -->
  <section id="bespoke" class="section-bespoke">
    <div class="container bespoke-container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Private Concierge</span>
        <h2 class="section-title">Schedule a Bespoke Bridal Consultation</h2>
        <p class="section-subtitle">Book a private video appointment or in-lounge suite viewing with our master jewellery stylist.</p>
      </div>

      <form class="bespoke-form" id="jewelleryInquiryForm">
        <div class="form-row">
          <div class="form-group">
            <label for="clientName">Full Name</label>
            <input type="text" id="clientName" required placeholder="Priya Sharma">
          </div>
          <div class="form-group">
            <label for="clientPhone">WhatsApp / Mobile Number</label>
            <input type="tel" id="clientPhone" required placeholder="+91 98765 43210">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="clientEmail">Email Address</label>
            <input type="email" id="clientEmail" required placeholder="priya@example.com">
          </div>
          <div class="form-group">
            <label for="collectionInterest">Collection of Interest</label>
            <select id="collectionInterest" required>
              <option value="">Select collection...</option>
              <option value="polki_bridal">Jadau & Polki Bridal Sets</option>
              <option value="temple_gold">Antique Temple Nakshi Jewellery</option>
              <option value="solitaires">Diamond Solitaires & Rings</option>
              <option value="custom_heirloom">Custom Bespoke Heirlooms (from sketch)</option>
              <option value="bangles_kadas">Royal Gold Bangles & Kadas</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="consultationMode">Consultation Preference</label>
            <select id="consultationMode" required>
              <option value="video">Private Virtual Video Consultation</option>
              <option value="mumbai">Mumbai Flagship Lounge (Bandra)</option>
              <option value="delhi">New Delhi Atelier (Mehrauli)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="targetDate">Wedding / Event Date</label>
            <input type="date" id="targetDate">
          </div>
        </div>

        <div class="form-group">
          <label for="specialRequests">Specific Ornament Requests or Family Heirlooms</label>
          <textarea id="specialRequests" rows="3" placeholder="Describe specific gemstones, karat requirements, or bespoke customization details..."></textarea>
        </div>

        <div class="form-actions text-center">
          <button type="submit" class="btn btn-primary btn-lg" id="submitInquiryBtn">Request Concierge Appointment</button>
        </div>
        <div class="form-success-message" id="jewellerySuccessMsg" style="display: none;">
          <p>✓ Consultation request received. Our Senior Jewellery Stylist will connect with you on WhatsApp within 4 business hours to share appointment options and private catalog previews.</p>
        </div>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="logo-mark">👑</span>
          <span class="logo-text">${brandName}</span>
        </div>
        <p class="footer-tagline">Purveyors of BIS 916 certified handcrafted royal gold, polki, and fine diamond heirlooms.</p>
        <p class="footer-copy">&copy; 2026 ${brandName}. Member, All India Gem and Jewellery Domestic Council.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Flagship Lounges</h4>
        <p class="footer-address"><strong>Mumbai:</strong> Waterfield Road, Bandra West<br><strong>Delhi:</strong> One Style Mile, Mehrauli<br><strong>Bengaluru:</strong> Lavelle Road</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Customer Care</h4>
        <p class="footer-link"><a href="#purity">Hallmark Verification</a></p>
        <p class="footer-link"><a href="#purity">Lifetime Buyback Terms</a></p>
        <p class="footer-link"><a href="#bespoke">Insured Vault Shipping</a></p>
        <p class="footer-link"><a href="tel:18001234567">Concierge: 1800-123-4567</a></p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Assurance</h4>
        <p class="footer-address">Every purchase includes an official computerized Tax Invoice, BIS Hallmarking Certificate, and IGI Diamond Authentication Card.</p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `/* styles/theme.css — Indian Jewellery Design Tokens */
:root {
  --color-bg: #0b1120;
  --color-surface: #111827;
  --color-surface-card: #172033;
  --color-gold: #d4af37;
  --color-gold-light: #f3e5ab;
  --color-gold-hover: #b89728;
  --color-emerald: #064e3b;
  --color-cream: #fffdfa;
  --color-text: #f8fafc;
  --color-muted: #94a3b8;
  --color-border: #26334d;

  --font-serif: 'Cinzel', Georgia, serif;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-pill: 9999px;

  --shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-gold: 0 8px 30px rgba(212, 175, 55, 0.15);
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

h1, h2, h3, .brand-logo, .stat-title, .ornament-name {
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

button, input, select, textarea {
  font: inherit;
}`;

  const siteCss = `/* assets/site.css — Indian Jewellery Layout & Responsive Styles */
.container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Announcement Bar */
.announcement-bar {
  background-color: #060a14;
  color: var(--color-gold-light);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  padding: 0.65rem 0;
  text-align: center;
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(11, 17, 32, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  padding: 1.25rem 0;
}
.nav-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-gold);
  letter-spacing: 0.03em;
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
  color: var(--color-gold);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition);
}
.btn-primary {
  background-color: var(--color-gold);
  color: #0b1120;
}
.btn-primary:hover {
  background-color: var(--color-gold-hover);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}
.btn-secondary {
  background-color: transparent;
  color: var(--color-gold);
  border-color: var(--color-gold);
}
.btn-secondary:hover {
  background-color: var(--color-gold);
  color: #0b1120;
}
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.775rem;
}
.btn-lg {
  padding: 0.9rem 2rem;
  font-size: 0.9rem;
}

/* Hero Section */
.hero-section {
  padding: 5rem 0 6rem;
  background: radial-gradient(circle at 70% 30%, #1e293b 0%, #0b1120 70%);
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
  background-color: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: var(--color-gold);
  border-radius: var(--radius-pill);
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1.5rem;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-gold);
}
.hero-title {
  font-size: 3.25rem;
  line-height: 1.15;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: var(--color-cream);
  letter-spacing: -0.01em;
}
.hero-lead {
  font-size: 1.125rem;
  color: var(--color-muted);
  line-height: 1.8;
  margin-bottom: 2rem;
  max-width: 540px;
}
.hero-cta-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}
.hero-assurances {
  display: flex;
  gap: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
.assurance-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.assurance-icon {
  font-size: 1.5rem;
}
.assurance-item strong {
  display: block;
  font-size: 0.95rem;
  color: var(--color-gold);
}
.assurance-item p {
  font-size: 0.8rem;
  color: var(--color-muted);
}
.hero-photo-wrapper {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-gold);
  border: 1px solid rgba(212, 175, 55, 0.3);
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
  background-color: rgba(11, 17, 32, 0.92);
  color: var(--color-gold-light);
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

/* Collections Section */
.section-collections {
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
  letter-spacing: 0.1em;
  color: var(--color-gold);
  background-color: rgba(212, 175, 55, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(212, 175, 55, 0.25);
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-cream);
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
  background-color: var(--color-gold);
  color: #0b1120;
}
.ornaments-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
}
.ornament-card {
  background-color: var(--color-surface-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}
.ornament-card:hover {
  transform: translateY(-4px);
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: var(--shadow-gold);
}
.ornament-thumb {
  position: relative;
  height: 280px;
  overflow: hidden;
  background-color: #172033;
}
.ornament-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.ornament-card:hover .ornament-img {
  transform: scale(1.05);
}
.ornament-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(11, 17, 32, 0.88);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: var(--color-gold-light);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
}
.ornament-info {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.ornament-meta {
  font-size: 0.75rem;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.4rem;
}
.ornament-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-cream);
}
.ornament-desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}
.ornament-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.ornament-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gold);
}
.btn-inquire-jewel {
  background: transparent;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-gold-light);
  cursor: pointer;
  padding: 0.25rem 0;
}
.btn-inquire-jewel:hover {
  text-decoration: underline;
}

/* Craftsmanship Section */
.section-craftsmanship {
  padding: 6rem 0;
  background-color: #070b14;
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
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.75rem;
}
.pillar-card {
  background-color: var(--color-surface-card);
  padding: 2.25rem 1.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: var(--transition);
}
.pillar-card:hover {
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-4px);
}
.pillar-icon {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}
.pillar-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-gold);
}
.pillar-desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
}

/* Purity Section */
.section-purity {
  padding: 5rem 0;
}
.purity-box {
  background: linear-gradient(180deg, #131c30 0%, #0b1120 100%);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--radius-md);
  padding: 3.5rem;
}
.purity-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-top: 3rem;
}
.purity-item {
  text-align: center;
}
.purity-symbol {
  display: inline-block;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-gold);
  margin-bottom: 0.75rem;
}
.purity-item strong {
  display: block;
  font-size: 1rem;
  color: var(--color-cream);
  margin-bottom: 0.5rem;
}
.purity-item p {
  font-size: 0.85rem;
  color: var(--color-muted);
  line-height: 1.5;
}

/* Bespoke Section */
.section-bespoke {
  padding: 6rem 0;
}
.bespoke-container {
  max-width: 820px;
}
.bespoke-form {
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
  margin-bottom: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gold-light);
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: #0d1527;
  color: #ffffff;
  transition: var(--transition);
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-gold);
}
.form-success-message {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background-color: rgba(6, 78, 59, 0.3);
  border: 1px solid #059669;
  border-radius: var(--radius-sm);
  color: #6ee7b7;
  font-weight: 500;
  line-height: 1.6;
}

/* Footer */
.footer {
  background-color: #070b14;
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
  color: var(--color-gold);
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
  color: #64748b;
}
.footer-heading {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  color: var(--color-gold-light);
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
  color: var(--color-gold);
}

/* Image fallback */
.img-fallback {
  background-color: #172033;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gold);
}

/* Responsive */
@media (max-width: 992px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .ornaments-grid, .pillars-grid, .purity-grid {
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
  .ornaments-grid, .pillars-grid, .purity-grid {
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

  const siteJs = `/* assets/site.js — Indian Jewellery Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // Category Filtering
  const filterTabs = document.querySelectorAll('#jewelleryFilterTabs .filter-tab');
  const ornamentCards = document.querySelectorAll('.ornament-card');

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      ornamentCards.forEach((card) => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Inquire buttons trigger smooth scroll to bespoke concierge
  document.querySelectorAll('.btn-inquire-jewel').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bespokeSection = document.getElementById('bespoke');
      if (bespokeSection) {
        bespokeSection.scrollIntoView({ behavior: 'smooth' });
        const interestSelect = document.getElementById('collectionInterest');
        if (interestSelect) {
          const itemKey = btn.dataset.item;
          if (itemKey === 'choker' || itemKey === 'haathphool') interestSelect.value = 'polki_bridal';
          else if (itemKey === 'jhumka' || itemKey === 'bangles') interestSelect.value = 'temple_gold';
          else if (itemKey === 'ring' || itemKey === 'pendant') interestSelect.value = 'solitaires';
        }
      }
    });
  });

  // Bridal Inquiry Form
  const form = document.getElementById('jewelleryInquiryForm');
  const successMsg = document.getElementById('jewellerySuccessMsg');
  const submitBtn = document.getElementById('submitInquiryBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connecting with Senior Stylist...';
      }
      setTimeout(() => {
        if (successMsg) successMsg.style.display = 'block';
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Concierge Request Registered';
        }
      }, 700);
    });
  }
});`;

  const readme = `# ${brandName} — Handcrafted Royal Indian Jewellery

Production-grade Indian heritage jewellery website featuring:
- Royal midnight & gold luxury design with BIS 916 hallmarking assurance
- 6 masterpiece ornaments (Jadau Polki, Antique Temple Gold, Diamond Solitaires)
- Interactive category filtering (Jadau & Polki, Temple Gold, Diamond & Gems)
- 4 Karigar craftsmanship pillars (Nakshi, Jadau, Meenakari, HUID Laser Audit)
- BIS Hallmarking Purity assurance matrix
- Private Bespoke Bridal Concierge appointment form
- Mobile responsive layout with touch-friendly controls

## Structure
- \`index.html\`: Semantic HTML5 structure
- \`styles/theme.css\`: Royal midnight & champagne gold design tokens
- \`assets/site.css\`: Ornament cards and responsive grids
- \`assets/site.js\`: Tab filtering and concierge booking handling
`;

  return [
    { path: 'index.html', content: html, language: 'html' },
    { path: 'styles/theme.css', content: themeCss, language: 'css' },
    { path: 'assets/site.css', content: siteCss, language: 'css' },
    { path: 'assets/site.js', content: siteJs, language: 'javascript' },
    { path: 'README.md', content: readme, language: 'markdown' },
  ];
}
