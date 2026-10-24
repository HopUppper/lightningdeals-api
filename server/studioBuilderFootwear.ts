/**
 * server/studioBuilderFootwear.ts
 * ============================================================================
 * Premium Footwear Brand & Sneaker Storefront Archetype
 * 
 * Inspired by luxury performance footwear brands (On Running, Allbirds, APL):
 * - Brand: Dynamic name extraction or "VELO Footwear" / "KINETIC Studio"
 * - High-contrast editorial aesthetic: warm off-white, deep charcoal, amber accents
 * - Curated high-resolution footwear photography via direct Unsplash CDNs
 * - Complete long-form sections:
 *   1. Top announcement bar (Free express delivery over $150 & 30-day wear test)
 *   2. Navbar with category links and slide-out Shopping Bag drawer
 *   3. Editorial Footwear Hero with lifestyle photography and quick specs
 *   4. 4 Performance & Sustainability Pillars (Bio-EVA, Recycled knit, Ergonomics)
 *   5. Curated Collection of 6 Footwear Products with real images, size buttons, Add to Bag
 *   6. Material Science & Circular Craft Matrix
 *   7. Verified Athlete & Customer Reviews (4.9 / 5.0)
 *   8. Interactive Footwear FAQ Accordion (Sizing, 30-day wear test, cleaning, vegan)
 *   9. VIP First-Drop Allocation & Pre-Order Form
 *   10. Editorial Footer
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export const FOOTWEAR_PHOTOGRAPHY = {
  hero: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  heroLifestyle: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80',
  product1: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', // Puma/Retro trainer
  product2: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80', // Air athletic
  product3: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80', // Minimalist court canvas
  product4: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80', // Leather court classic
  product5: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', // Modern performance
  product6: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', // All-terrain outdoor
  craftTexture: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=1000&q=80',
};

export function synthesizeFootwearWebsite(brief: string): ProjectFile[] {
  let brandName = 'VELO Footwear';
  const brandMatch = brief.match(/(?:for|named|called|brand)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|brand|website|premium|landing|footwear)\b/i.test(brandMatch[1].trim())) {
    brandName = brandMatch[1].trim();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Precision Ergonomic Footwear & Performance Silhouettes</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Top Announcement Bar -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>Free Express Global Delivery Over $150 &bull; 30-Day Risk-Free Road Test &bull; 100% Recycled Ocean Knit</span>
    </div>
  </aside>

  <!-- Navigation -->
  <header class="navbar" id="topNav">
    <div class="container nav-wrap">
      <a href="#hero" class="brand-logo">
        <span class="logo-mark">⚡</span>
        <span class="logo-text">${brandName}</span>
      </a>
      <nav class="nav-links">
        <a href="#collection" class="nav-link">Collection</a>
        <a href="#technology" class="nav-link">Technology</a>
        <a href="#reviews" class="nav-link">Reviews</a>
        <a href="#faq" class="nav-link">FAQ</a>
        <a href="#waitlist" class="nav-link">VIP Access</a>
      </nav>
      <div class="nav-actions">
        <button type="button" class="bag-toggle-btn" id="openBagBtn" aria-label="Open Shopping Bag">
          <span class="bag-icon">🛒</span>
          <span class="bag-text">Bag</span>
          <span class="bag-count" id="bagCountBadge">0</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Editorial Footwear Hero -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Gen-3 Bio-Foam Propulsion &bull; Series 2026</span>
        </div>
        <h1 class="hero-title">Engineered for velocity. Sculpted for silence.</h1>
        <p class="hero-lead">
          Precision-molded ergonomic silhouettes combining carbon-fiber propulsion with zero-waste recycled ocean yarn. Lightweight comfort built to withstand 1,000 kilometers of high-impact road work.
        </p>
        <div class="hero-cta-group">
          <a href="#collection" class="btn btn-primary btn-lg">Explore Footwear &rarr;</a>
          <a href="#technology" class="btn btn-secondary btn-lg">Craft & Science</a>
        </div>
        <div class="hero-specs">
          <div class="spec-item">
            <span class="spec-val">208g</span>
            <span class="spec-lbl">Ultralight Chassis</span>
          </div>
          <div class="spec-divider"></div>
          <div class="spec-item">
            <span class="spec-val">82%</span>
            <span class="spec-lbl">Energy Return</span>
          </div>
          <div class="spec-divider"></div>
          <div class="spec-item">
            <span class="spec-val">100%</span>
            <span class="spec-lbl">Circular Recycled</span>
          </div>
        </div>
      </div>
      <div class="hero-imagery">
        <div class="hero-photo-wrapper">
          <img src="${FOOTWEAR_PHOTOGRAPHY.hero}" alt="${brandName} Velocity Pro Silhouette" class="hero-photo-img" loading="eager" onerror="this.onerror=null; this.classList.add('img-fallback');">
          <div class="photo-overlay-badge">Carbon Matrix Elite &bull; Flagship Edition</div>
        </div>
      </div>
    </div>
  </section>

  <!-- 4 Performance Pillars -->
  <section id="technology" class="section-pillars">
    <div class="container">
      <div class="section-head text-center">
        <span class="pill-tag">Biomechanics & Craft</span>
        <h2 class="section-title">Four Foundational Ergonomic Pillars</h2>
        <p class="section-subtitle">Eliminating the trade-offs between racing responsiveness, all-day arch support, and planetary sustainability.</p>
      </div>

      <div class="pillars-grid">
        <article class="pillar-card">
          <div class="pillar-icon">⚡</div>
          <h3 class="pillar-title">Dynamic Carbon Rocker Plate</h3>
          <p class="pillar-desc">Sandwiched between dual-density foam layers to convert heel strike impacts into effortless forward propulsion.</p>
          <span class="pillar-metric">82% Kinetic Energy Return</span>
        </article>

        <article class="pillar-card">
          <div class="pillar-icon">🌱</div>
          <h3 class="pillar-title">Sugarcane Bio-EVA Foam</h3>
          <p class="pillar-desc">40% lower carbon footprint than petroleum plastics, delivering cloud-soft cushioning that never hardens in freezing cold.</p>
          <span class="pillar-metric">Carbon-Negative Formulation</span>
        </article>

        <article class="pillar-card">
          <div class="pillar-icon">🧵</div>
          <h3 class="pillar-title">Seamless Anatomic Knit</h3>
          <p class="pillar-desc">Woven from single-strand marine polymers to eliminate hotspots, blisters, and friction points across the midfoot.</p>
          <span class="pillar-metric">Zero Waste 3D Weave</span>
        </article>

        <article class="pillar-card">
          <div class="pillar-icon">🌧️</div>
          <h3 class="pillar-title">All-Weather Micro-Tread</h3>
          <p class="pillar-desc">High-abrasion natural rubber compound inspired by endurance tire tread to maintain grip on slick wet cobblestone and wet asphalt.</p>
          <span class="pillar-metric">Wet-Grip Siped Geometry</span>
        </article>
      </div>
    </div>
  </section>

  <!-- Featured 6 Footwear Products Grid -->
  <section id="collection" class="section-collection">
    <div class="container">
      <div class="collection-head">
        <div>
          <span class="pill-tag">The 2026 Collection</span>
          <h2 class="section-title">Performance & Lifestyle Silhouettes</h2>
          <p class="section-subtitle">Every model is wear-tested for 500+ kilometers before release.</p>
        </div>
        <div class="cat-filter-tabs">
          <button type="button" class="filter-tab active" data-filter="all">All Silhouettes (6)</button>
          <button type="button" class="filter-tab" data-filter="running">Running (2)</button>
          <button type="button" class="filter-tab" data-filter="lifestyle">Lifestyle (2)</button>
          <button type="button" class="filter-tab" data-filter="outdoor">Trail & Court (2)</button>
        </div>
      </div>

      <div class="products-grid" id="productsGrid">
        <!-- Product 1 -->
        <article class="product-card" data-category="running">
          <div class="product-thumb">
            <span class="product-badge">Speed Elite</span>
            <img src="${FOOTWEAR_PHOTOGRAPHY.hero}" alt="Stratus Velocity Carbon Pro" class="prod-img" loading="lazy" onerror="this.onerror=null; this.classList.add('img-fallback');">
          </div>
          <div class="product-info">
            <div class="product-meta">Road Marathon &bull; 208g</div>
            <h3 class="product-name">Stratus Velocity Carbon Pro</h3>
            <p class="product-desc">Full-length curved carbon propulsion plate with reactive nitrogen-infused foam for breaking personal records.</p>
            <div class="size-selector-wrap">
              <span class="size-label">Select US Size:</span>
              <div class="size-pills">
                <button type="button" class="size-pill active">8</button>
                <button type="button" class="size-pill">9</button>
                <button type="button" class="size-pill">10</button>
                <button type="button" class="size-pill">11</button>
                <button type="button" class="size-pill">12</button>
              </div>
            </div>
            <div class="product-foot">
              <span class="product-price">$220.00</span>
              <button type="button" class="btn btn-add-bag" data-id="shoe-1" data-name="Stratus Velocity Carbon Pro" data-price="220.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 2 -->
        <article class="product-card" data-category="running">
          <div class="product-thumb">
            <span class="product-badge">Daily Cushion</span>
            <img src="${FOOTWEAR_PHOTOGRAPHY.product1}" alt="Aero Glide Cushion Trainer" class="prod-img" loading="lazy" onerror="this.onerror=null; this.classList.add('img-fallback');">
          </div>
          <div class="product-info">
            <div class="product-meta">Daily Miles &bull; 245g</div>
            <h3 class="product-name">Aero Glide Cushion Trainer</h3>
            <p class="product-desc">Maximalist recovery sole geometry designed to protect joints during high-mileage weekly endurance blocks.</p>
            <div class="size-selector-wrap">
              <span class="size-label">Select US Size:</span>
              <div class="size-pills">
                <button type="button" class="size-pill">7</button>
                <button type="button" class="size-pill active">8.5</button>
                <button type="button" class="size-pill">9.5</button>
                <button type="button" class="size-pill">10.5</button>
                <button type="button" class="size-pill">11.5</button>
              </div>
            </div>
            <div class="product-foot">
              <span class="product-price">$185.00</span>
              <button type="button" class="btn btn-add-bag" data-id="shoe-2" data-name="Aero Glide Cushion Trainer" data-price="185.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 3 -->
        <article class="product-card" data-category="lifestyle">
          <div class="product-thumb">
            <span class="product-badge">Minimalist Icon</span>
            <img src="${FOOTWEAR_PHOTOGRAPHY.product2}" alt="Monochrome Minimal Low-Top" class="prod-img" loading="lazy" onerror="this.onerror=null; this.classList.add('img-fallback');">
          </div>
          <div class="product-info">
            <div class="product-meta">Everyday Lifestyle &bull; 280g</div>
            <h3 class="product-name">Monochrome Minimal Low-Top</h3>
            <p class="product-desc">Stripped-back clean silhouette crafted with recycled bio-leather and orthopedic cork arch support.</p>
            <div class="size-selector-wrap">
              <span class="size-label">Select US Size:</span>
              <div class="size-pills">
                <button type="button" class="size-pill">8</button>
                <button type="button" class="size-pill active">9</button>
                <button type="button" class="size-pill">10</button>
                <button type="button" class="size-pill">11</button>
              </div>
            </div>
            <div class="product-foot">
              <span class="product-price">$165.00</span>
              <button type="button" class="btn btn-add-bag" data-id="shoe-3" data-name="Monochrome Minimal Low-Top" data-price="165.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 4 -->
        <article class="product-card" data-category="outdoor">
          <div class="product-thumb">
            <span class="product-badge">All-Weather</span>
            <img src="${FOOTWEAR_PHOTOGRAPHY.product6}" alt="Apex Ridge All-Terrain Trail" class="prod-img" loading="lazy" onerror="this.onerror=null; this.classList.add('img-fallback');">
          </div>
          <div class="product-info">
            <div class="product-meta">Mountain Trail &bull; 310g</div>
            <h3 class="product-name">Apex Ridge All-Terrain Trail</h3>
            <p class="product-desc">5mm multi-directional directional lugs with breathable hydrophobic membrane and reinforced TPU toe guard.</p>
            <div class="size-selector-wrap">
              <span class="size-label">Select US Size:</span>
              <div class="size-pills">
                <button type="button" class="size-pill">8.5</button>
                <button type="button" class="size-pill active">9.5</button>
                <button type="button" class="size-pill">10.5</button>
                <button type="button" class="size-pill">12</button>
              </div>
            </div>
            <div class="product-foot">
              <span class="product-price">$195.00</span>
              <button type="button" class="btn btn-add-bag" data-id="shoe-4" data-name="Apex Ridge All-Terrain Trail" data-price="195.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 5 -->
        <article class="product-card" data-category="lifestyle">
          <div class="product-thumb">
            <span class="product-badge">Court Heritage</span>
            <img src="${FOOTWEAR_PHOTOGRAPHY.product4}" alt="Retro Leather Court Classic" class="prod-img" loading="lazy" onerror="this.onerror=null; this.classList.add('img-fallback');">
          </div>
          <div class="product-info">
            <div class="product-meta">Heritage Court &bull; 290g</div>
            <h3 class="product-name">Retro Leather Court Classic</h3>
            <p class="product-desc">Supple calfskin leather upper paired with durable stitched natural gum outsoles for timeless architectural appeal.</p>
            <div class="size-selector-wrap">
              <span class="size-label">Select US Size:</span>
              <div class="size-pills">
                <button type="button" class="size-pill">8</button>
                <button type="button" class="size-pill active">9</button>
                <button type="button" class="size-pill">10</button>
                <button type="button" class="size-pill">11</button>
              </div>
            </div>
            <div class="product-foot">
              <span class="product-price">$150.00</span>
              <button type="button" class="btn btn-add-bag" data-id="shoe-5" data-name="Retro Leather Court Classic" data-price="150.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 6 -->
        <article class="product-card" data-category="outdoor">
          <div class="product-thumb">
            <span class="product-badge">Speed Slip-On</span>
            <img src="${FOOTWEAR_PHOTOGRAPHY.product5}" alt="Aura Knit Slip-On Trainer" class="prod-img" loading="lazy" onerror="this.onerror=null; this.classList.add('img-fallback');">
          </div>
          <div class="product-info">
            <div class="product-meta">Transit & Studio &bull; 190g</div>
            <h3 class="product-name">Aura Knit Slip-On Trainer</h3>
            <p class="product-desc">Seamless stretch collar that slips on effortlessly. Flexible grooved sipes allow natural foot articulation.</p>
            <div class="size-selector-wrap">
              <span class="size-label">Select US Size:</span>
              <div class="size-pills">
                <button type="button" class="size-pill">7</button>
                <button type="button" class="size-pill active">8</button>
                <button type="button" class="size-pill">9</button>
                <button type="button" class="size-pill">10</button>
              </div>
            </div>
            <div class="product-foot">
              <span class="product-price">$140.00</span>
              <button type="button" class="btn btn-add-bag" data-id="shoe-6" data-name="Aura Knit Slip-On Trainer" data-price="140.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Circular Material & Sustainability Matrix -->
  <section class="section-materials">
    <div class="container materials-grid">
      <div class="materials-copy">
        <span class="pill-tag">Material Transparency</span>
        <h2 class="section-title">Zero Plastic Waste. Infinite Recyclability.</h2>
        <p class="materials-lead">We refuse to use virgin fossil-fuel plastics. Every component is engineered to be disassembled and recycled into new footwear at the end of its life cycle.</p>
        
        <div class="mat-list">
          <div class="mat-item">
            <strong>Recycled Marine Plastic (Upper):</strong>
            <span>12 bottles collected from coastlines are spun into each pair of seamless uppers.</span>
          </div>
          <div class="mat-item">
            <strong>Sugarcane Bio-Foam (Midsole):</strong>
            <span>Ethically farmed in southern Brazil, capturing more CO2 during growth than manufacturing emits.</span>
          </div>
          <div class="mat-item">
            <strong>Natural Vulcanized Gum (Outsole):</strong>
            <span>Harvested from sustainably managed Hevea rubber tree groves with zero petroleum fillers.</span>
          </div>
        </div>
      </div>

      <div class="materials-card">
        <div class="mat-badge">🌿 B-Corp Certified Standard</div>
        <h3>Our Lifecycle Commitment</h3>
        <ul class="mat-checklist">
          <li>✓ 100% Recycled & Recyclable Packaging</li>
          <li>✓ Free Take-Back & Circular Re-Craft Program</li>
          <li>✓ Zero Chemical Adhesives or Toxic Solvents</li>
          <li>✓ Fair-Wage Certified Assembly Facilities</li>
        </ul>
        <div class="mat-foot">
          <span>Climate Neutral Verified &bull; 1% For The Planet</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Customer Reviews & Social Proof -->
  <section id="reviews" class="section-reviews">
    <div class="container">
      <div class="section-head text-center">
        <span class="pill-tag">Community Feedback</span>
        <h2 class="section-title">Field Tested by Daily Runners & Movement Enthusiasts</h2>
        <div class="rating-stars">★★★★★ <span>Community Wearer Reflections</span></div>
      </div>

      <div class="reviews-grid">
        <div class="review-card">
          <div class="stars">★★★★★</div>
          <p class="quote">"I ran the Berlin Marathon in the Velocity Carbon Pro right out of the box with zero blisters. The energy return through mile 20 was unlike anything I've experienced."</p>
          <div class="author">
            <strong>David Lindqvist</strong>
            <span>Sub-3:00 Marathoner &bull; Stockholm</span>
          </div>
        </div>
        <div class="review-card">
          <div class="stars">★★★★★</div>
          <p class="quote">"The Monochrome Low-Tops are my daily work shoe in Copenhagen. They look like minimalist luxury sneakers but have the arch cushioning of a high-end running shoe."</p>
          <div class="author">
            <strong>Astrid Møller</strong>
            <span>Industrial Designer &bull; Copenhagen</span>
          </div>
        </div>
        <div class="review-card">
          <div class="stars">★★★★★</div>
          <p class="quote">"Finally a shoe brand that doesn't compromise on wet weather grip. The Apex Trail handles wet slick timber bridges and mud with zero slip."</p>
          <div class="author">
            <strong>Kenji Takahashi</strong>
            <span>Trail Runner &bull; Nagano</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Footwear FAQ Accordion -->
  <section id="faq" class="section-faq">
    <div class="container faq-container">
      <div class="section-head text-center">
        <span class="pill-tag">Clear Answers</span>
        <h2 class="section-title">Frequently Asked Questions</h2>
        <p class="section-subtitle">Everything you need to know about sizing, our 30-day wear-test, and shoe care.</p>
      </div>

      <div class="faq-accordion" id="faqAccordion">
        <div class="faq-accordion-item">
          <button type="button" class="faq-accordion-header">
            <span>How does your footwear sizing compare to standard athletic shoes?</span>
            <span class="faq-accordion-icon">+</span>
          </button>
          <div class="faq-accordion-body">
            <p>Our silhouettes fit true to standard US athletic sizing. The toe box is shaped anatomically to allow natural toe splay during foot strike. If you have wider feet or prefer extra room for thick winter socks, we recommend ordering a half size up.</p>
          </div>
        </div>

        <div class="faq-accordion-item">
          <button type="button" class="faq-accordion-header">
            <span>What is your 30-day risk-free wear test guarantee?</span>
            <span class="faq-accordion-icon">+</span>
          </button>
          <div class="faq-accordion-body">
            <p>We want you to run, walk, and live in your shoes in the real world. Test them on road, trail, or treadmill for 30 full days. If you are not completely satisfied with the comfort and performance, return them for a full refund with free prepaid return shipping.</p>
          </div>
        </div>

        <div class="faq-accordion-item">
          <button type="button" class="faq-accordion-header">
            <span>How should I clean and maintain my shoes?</span>
            <span class="faq-accordion-icon">+</span>
          </button>
          <div class="faq-accordion-body">
            <p>Remove the OrthoLite insole, brush away loose dirt, and hand wash with cold water and mild eco-soap using a soft bristle brush. Let them air dry naturally away from direct sunlight and radiators. Do not machine dry.</p>
          </div>
        </div>

        <div class="faq-accordion-item">
          <button type="button" class="faq-accordion-header">
            <span>Are all materials and adhesives 100% vegan?</span>
            <span class="faq-accordion-icon">+</span>
          </button>
          <div class="faq-accordion-body">
            <p>Yes. All knitted uppers, bio-based midsoles, water-based glues, and color pigments are 100% certified vegan and cruelty-free. No animal by-products are ever used in our production supply chain.</p>
          </div>
        </div>

        <div class="faq-accordion-item">
          <button type="button" class="faq-accordion-header">
            <span>What are the domestic and international shipping times?</span>
            <span class="faq-accordion-icon">+</span>
          </button>
          <div class="faq-accordion-body">
            <p>All orders are processed and dispatched within 24 hours from our climate-neutral fulfillment hubs. Domestic express shipping arrives in 2-3 business days. International delivery arrives in 4-7 business days with all duties prepaid.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- VIP First-Drop Allocation & Pre-Order Form -->
  <section id="waitlist" class="section-waitlist">
    <div class="container waitlist-container">
      <div class="waitlist-card">
        <span class="pill-tag">Limited Edition Reserve</span>
        <h2 class="section-title">Join The Priority Allocation Waitlist</h2>
        <p class="section-subtitle">Our seasonal colorways are crafted in small limited drops of 2,000 pairs. Register your email for 24-hour early access and complimentary custom cedar shoe trees.</p>
        <form id="orderForm" class="waitlist-form">
          <div class="form-row">
            <input type="text" placeholder="Your Name" required class="waitlist-input">
            <input type="email" placeholder="Your Email Address" required class="waitlist-input">
          </div>
          <button type="submit" class="btn btn-primary btn-lg btn-block">Claim Priority Allocation &rarr;</button>
          <p class="waitlist-guarantee">✓ Guaranteed drop reservation &bull; 100% privacy protected &bull; One-click unsubscribe</p>
        </form>
      </div>
    </div>
  </section>

  <!-- Editorial Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <div class="footer-logo">⚡ ${brandName}</div>
        <p class="footer-tagline">Engineered for human velocity. Designed with circular materials to preserve the planet we run across.</p>
        <p class="footer-copy">&copy; 2026 ${brandName} Inc. All rights reserved.</p>
      </div>
      <div class="footer-links">
        <h4>Silhouettes</h4>
        <a href="#collection">Velocity Pro Runner</a>
        <a href="#collection">Aero Glide Cushion</a>
        <a href="#collection">Monochrome Low-Top</a>
        <a href="#collection">Apex Ridge Trail</a>
      </div>
      <div class="footer-links">
        <h4>Technology</h4>
        <a href="#technology">Carbon Rocker Plate</a>
        <a href="#technology">Bio-EVA Cushion</a>
        <a href="#technology">Recycled Ocean Yarn</a>
        <a href="#reviews">Wearer Reviews</a>
      </div>
      <div class="footer-newsletter">
        <h4>VIP Drop Announcements</h4>
        <p>Subscribe for private early-access access codes and technical footwear previews.</p>
        <form class="newsletter-inline" onsubmit="event.preventDefault(); window.showToast('Subscribed to VIP announcements!');">
          <input type="email" placeholder="Your email..." required>
          <button type="submit" class="btn btn-primary btn-sm">Join</button>
        </form>
      </div>
    </div>
  </footer>

  <!-- Slide-Over Shopping Bag Drawer -->
  <aside class="bag-drawer hidden" id="bagDrawer" role="dialog" aria-modal="true" aria-label="Shopping Bag">
    <div class="bag-backdrop" id="bagBackdrop"></div>
    <div class="bag-panel">
      <div class="bag-head">
        <h3>Your Shopping Bag (<span id="bagCountTitle">0</span>)</h3>
        <button type="button" class="bag-close-btn" id="closeBagBtn">&times;</button>
      </div>
      <div class="bag-body" id="bagItemsList">
        <div class="bag-empty" id="bagEmptyNotice">
          <span class="empty-icon">👟</span>
          <p>Your shopping bag is currently empty.</p>
          <a href="#collection" class="btn btn-secondary btn-sm" id="shopNowBtn">Explore Collection</a>
        </div>
      </div>
      <div class="bag-foot">
        <div class="bag-subtotal-row">
          <span>Subtotal</span>
          <span id="bagSubtotalVal">$0.00</span>
        </div>
        <div class="shipping-progress">
          <span id="shippingNotice">Add $150.00 more for free worldwide delivery</span>
        </div>
        <button type="button" class="btn btn-primary btn-block btn-lg" id="checkoutBtn">Proceed to Checkout</button>
        <p class="checkout-notice">Simulated Checkout &bull; Prototype Storefront</p>
      </div>
    </div>
  </aside>

  <!-- Toast Notification -->
  <div id="toast" class="toast hidden"></div>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-primary: #111827;
  --color-primary-hover: #000000;
  --color-accent: #f59e0b;
  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-dark: #0f172a;
  --color-text: #334155;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-display: 'Space Grotesk', sans-serif;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.08);
  --shadow-lg: 0 20px 40px rgba(0,0,0,0.12);
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  overflow-x: hidden;
  max-width: 100vw;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Announcement Bar */
.announcement-bar {
  background: var(--color-dark);
  color: #f8fafc;
  padding: 10px 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: center;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}
.nav-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  color: var(--color-dark);
  letter-spacing: -0.02em;
}
.logo-mark {
  color: var(--color-accent);
  font-size: 22px;
}
.nav-links {
  display: flex;
  gap: 28px;
}
.nav-link {
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  transition: color 0.2s;
}
.nav-link:hover { color: var(--color-dark); }
.bag-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-dark);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}
.bag-toggle-btn:hover { opacity: 0.9; }
.bag-count {
  background: var(--color-accent);
  color: var(--color-dark);
  font-size: 11px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 9999px;
}

/* Hero */
.hero-section {
  padding: 80px 0 90px;
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  border-bottom: 1px solid var(--color-border);
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 56px;
  align-items: center;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: #ffffff;
  border: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-dark);
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
}
.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--color-accent);
}
.hero-title {
  font-family: var(--font-display);
  font-size: 46px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--color-dark);
  margin-bottom: 18px;
}
.hero-lead {
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-muted);
  margin-bottom: 32px;
  max-width: 560px;
}
.hero-cta-group {
  display: flex;
  gap: 14px;
  margin-bottom: 40px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.btn-primary {
  background: var(--color-dark);
  color: #ffffff;
}
.btn-primary:hover {
  background: #000000;
  transform: translateY(-1px);
}
.btn-secondary {
  background: #ffffff;
  color: var(--color-dark);
  border-color: var(--color-border);
}
.btn-secondary:hover {
  background: #f8fafc;
}
.btn-lg { padding: 14px 28px; font-size: 15px; }
.btn-sm { padding: 8px 16px; font-size: 12px; }
.btn-block { width: 100%; }

.hero-specs {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}
.spec-item { display: flex; flex-direction: column; }
.spec-val {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  color: var(--color-dark);
}
.spec-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.spec-divider {
  width: 1px;
  height: 36px;
  background: var(--color-border);
}

.hero-photo-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: #e2e8f0;
}
.hero-photo-img {
  width: 100%;
  height: 480px;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}
.hero-photo-wrapper:hover .hero-photo-img {
  transform: scale(1.04);
}
.photo-overlay-badge {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 9999px;
}

/* Pillars */
.section-pillars {
  padding: 90px 0;
  background: #ffffff;
}
.section-head { margin-bottom: 50px; }
.text-center { text-align: center; }
.pill-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-dark);
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 12px;
}
.section-title {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-dark);
  margin-bottom: 12px;
}
.section-subtitle {
  font-size: 15px;
  color: var(--color-muted);
  max-width: 600px;
  margin: 0 auto;
}
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.pillar-card {
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 28px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}
.pillar-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.pillar-icon { font-size: 28px; margin-bottom: 16px; }
.pillar-title { font-size: 17px; font-weight: 700; color: var(--color-dark); margin-bottom: 10px; }
.pillar-desc { font-size: 13px; line-height: 1.6; color: var(--color-muted); margin-bottom: 16px; flex: 1; }
.pillar-metric { font-size: 12px; font-weight: 800; color: var(--color-dark); padding-top: 12px; border-top: 1px solid var(--color-border); }

/* Collection Grid */
.section-collection {
  padding: 90px 0;
  background: #f8fafc;
  border-top: 1px solid var(--color-border);
}
.collection-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 44px;
  flex-wrap: wrap;
  gap: 20px;
}
.cat-filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-tab {
  background: #ffffff;
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-tab.active, .filter-tab:hover {
  background: var(--color-dark);
  color: #ffffff;
  border-color: var(--color-dark);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}
.product-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
.product-thumb {
  position: relative;
  height: 240px;
  overflow: hidden;
  background: #f1f5f9;
}
.prod-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.product-card:hover .prod-img { transform: scale(1.05); }
.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--color-dark);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  z-index: 2;
}
.product-info {
  padding: 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.product-meta {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-muted);
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.product-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-dark);
  margin-bottom: 8px;
}
.product-desc {
  font-size: 13px;
  color: var(--color-muted);
  line-height: 1.5;
  margin-bottom: 16px;
  flex: 1;
}
.size-selector-wrap {
  margin-bottom: 18px;
}
.size-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 6px;
}
.size-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.size-pill {
  width: 34px;
  height: 30px;
  border: 1px solid var(--color-border);
  background: #ffffff;
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.size-pill.active, .size-pill:hover {
  border-color: var(--color-dark);
  background: var(--color-dark);
  color: #ffffff;
}
.product-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
.product-price {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  color: var(--color-dark);
}
.btn-add-bag {
  background: #f1f5f9;
  border: 1px solid var(--color-border);
  color: var(--color-dark);
  padding: 8px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-add-bag:hover {
  background: var(--color-dark);
  color: #ffffff;
}

/* Materials Section */
.section-materials {
  padding: 90px 0;
  background: #ffffff;
  border-top: 1px solid var(--color-border);
}
.materials-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 50px;
  align-items: center;
}
.materials-lead {
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-muted);
  margin-bottom: 28px;
}
.mat-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.mat-item {
  padding-left: 18px;
  border-left: 2px solid var(--color-accent);
}
.mat-item strong { display: block; font-size: 14px; color: var(--color-dark); margin-bottom: 2px; }
.mat-item span { font-size: 13px; color: var(--color-muted); }

.materials-card {
  background: var(--color-dark);
  color: #fff;
  padding: 36px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.mat-badge { font-size: 12px; font-weight: 800; color: var(--color-accent); margin-bottom: 12px; }
.materials-card h3 { font-size: 20px; margin-bottom: 18px; }
.mat-checklist { list-style: none; margin-bottom: 24px; }
.mat-checklist li { font-size: 13px; margin-bottom: 10px; color: #cbd5e1; }
.mat-foot { font-size: 12px; color: #94a3b8; padding-top: 16px; border-top: 1px solid #334155; }

/* Reviews */
.section-reviews {
  padding: 90px 0;
  background: #f8fafc;
  border-top: 1px solid var(--color-border);
}
.rating-stars { font-size: 16px; color: var(--color-accent); font-weight: 700; margin-top: 6px; }
.rating-stars span { color: var(--color-muted); font-size: 13px; font-weight: 500; }
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.review-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 28px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}
.review-stars { color: var(--color-accent); font-size: 14px; margin-bottom: 14px; }
.quote { font-size: 14px; line-height: 1.6; color: var(--color-text); font-style: italic; margin-bottom: 20px; flex: 1; }
.author strong { display: block; font-size: 13px; color: var(--color-dark); }
.author span { font-size: 12px; color: var(--color-muted); }

/* FAQ Accordion */
.section-faq {
  padding: 90px 0;
  background: #ffffff;
  border-top: 1px solid var(--color-border);
}
.faq-container { max-width: 820px; }
.faq-accordion {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 40px;
}
.faq-accordion-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #f8fafc;
  overflow: hidden;
  transition: border-color 0.2s;
}
.faq-accordion-item:hover { border-color: var(--color-dark); }
.faq-accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-dark);
  cursor: pointer;
  text-align: left;
}
.faq-accordion-icon {
  font-size: 20px;
  color: var(--color-muted);
  transition: transform 0.25s ease;
}
.faq-accordion-item.open .faq-accordion-icon { transform: rotate(45deg); color: var(--color-dark); }
.faq-accordion-body {
  display: none;
  padding: 0 24px 20px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-muted);
}
.faq-accordion-item.open .faq-accordion-body { display: block; }

/* Waitlist */
.section-waitlist {
  padding: 90px 0;
  background: #f1f5f9;
  border-top: 1px solid var(--color-border);
}
.waitlist-container { max-width: 680px; margin: 0 auto; }
.waitlist-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 44px;
  text-align: center;
  box-shadow: var(--shadow-md);
}
.waitlist-form {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-row {
  display: flex;
  gap: 12px;
}
.waitlist-input {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 14px;
  outline: none;
}
.waitlist-input:focus { border-color: var(--color-dark); }
.waitlist-guarantee { font-size: 12px; color: var(--color-muted); margin-top: 8px; }

/* Footer */
.footer {
  background: var(--color-dark);
  color: #94a3b8;
  padding: 80px 0 40px;
  font-size: 13px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
  gap: 40px;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 40px;
}
.footer-logo {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 14px;
}
.footer-tagline { line-height: 1.6; margin-bottom: 16px; }
.footer-copy { font-size: 11px; color: #64748b; }
.footer-links h4, .footer-newsletter h4 {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}
.footer-links a {
  display: block;
  color: #94a3b8;
  text-decoration: none;
  margin-bottom: 10px;
  transition: color 0.2s;
}
.footer-links a:hover { color: #ffffff; }
.newsletter-inline {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.newsletter-inline input {
  flex: 1;
  padding: 8px 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
}
.newsletter-inline input:focus { border-color: var(--color-accent); }

/* Slide-Over Shopping Bag Drawer */
.bag-drawer.hidden { display: none; }
.bag-drawer { position: fixed; inset: 0; z-index: 2000; }
.bag-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.bag-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}
.bag-head {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bag-head h3 { font-size: 16px; font-weight: 700; color: var(--color-dark); }
.bag-close-btn { background: none; border: none; font-size: 26px; cursor: pointer; color: var(--color-muted); }
.bag-body { flex: 1; overflow-y: auto; padding: 24px; }
.bag-empty { text-align: center; padding: 60px 0; }
.empty-icon { font-size: 40px; display: block; margin-bottom: 12px; }
.bag-foot {
  padding: 24px;
  border-top: 1px solid var(--color-border);
  background: #f8fafc;
}
.bag-subtotal-row {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-dark);
  margin-bottom: 12px;
}
.shipping-progress { font-size: 12px; color: var(--color-muted); margin-bottom: 16px; }
.checkout-notice { text-align: center; font-size: 11px; color: var(--color-muted); margin-top: 10px; }

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--color-dark);
  color: #fff;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  z-index: 3000;
}
.hidden { display: none !important; }

/* Responsive Viewports */
@media (max-width: 1024px) {
  .pillars-grid { grid-template-columns: repeat(2, 1fr); }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .hero-grid { grid-template-columns: 1fr; gap: 36px; }
  .hero-title { font-size: 32px; }
  .hero-photo-img { height: 320px; }
  .nav-links { display: none; }
  .products-grid { grid-template-columns: 1fr; }
  .materials-grid { grid-template-columns: 1fr; }
  .reviews-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; }
  .btn-lg { width: 100%; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Shopping Bag State
  let bag = [];
  const openBagBtn = document.getElementById('openBagBtn');
  const closeBagBtn = document.getElementById('closeBagBtn');
  const bagDrawer = document.getElementById('bagDrawer');
  const bagBackdrop = document.getElementById('bagBackdrop');
  const bagItemsList = document.getElementById('bagItemsList');
  const bagSubtotalVal = document.getElementById('bagSubtotalVal');
  const bagCountTitle = document.getElementById('bagCountTitle');
  const bagCountBadge = document.getElementById('bagCountBadge');
  const toast = document.getElementById('toast');

  window.showToast = function(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  };

  function updateBagUI() {
    const totalQty = bag.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = bag.reduce((sum, item) => sum + item.qty * item.price, 0);

    if (bagCountBadge) bagCountBadge.textContent = totalQty;
    if (bagCountTitle) bagCountTitle.textContent = totalQty;
    if (bagSubtotalVal) bagSubtotalVal.textContent = '$' + subtotal.toFixed(2);

    if (totalQty === 0) {
      bagItemsList.innerHTML = \`
        <div class="bag-empty">
          <span class="empty-icon">👟</span>
          <p>Your shopping bag is currently empty.</p>
        </div>\`;
    } else {
      bagItemsList.innerHTML = bag.map(item => \`
        <div class="bag-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;">
          <div>
            <strong style="display:block; font-size:13px; color:#0f172a;">\${item.name}</strong>
            <span style="font-size:12px; color:#64748b;">Size: US \${item.size} &bull; Qty: \${item.qty}</span>
          </div>
          <div style="font-weight:700; font-size:14px; color:#0f172a;">
            $\${(item.qty * item.price).toFixed(2)}
          </div>
        </div>
      \`).join('');
    }
  }

  // Add to Bag Buttons
  document.querySelectorAll('.btn-add-bag').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price') || '0');
      const activeSize = card ? (card.querySelector('.size-pill.active')?.textContent || '9') : '9';

      const existing = bag.find(i => i.id === id && i.size === activeSize);
      if (existing) {
        existing.qty += 1;
      } else {
        bag.push({ id, name, price, size: activeSize, qty: 1 });
      }
      updateBagUI();
      window.showToast('Added ' + name + ' (Size ' + activeSize + ') to bag');
    });
  });

  // Size Selector Pills
  document.querySelectorAll('.size-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const group = pill.closest('.size-pills');
      if (group) {
        group.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
    });
  });

  // Drawer Toggle
  if (openBagBtn && bagDrawer) {
    openBagBtn.addEventListener('click', () => bagDrawer.classList.remove('hidden'));
  }
  if (closeBagBtn && bagDrawer) {
    closeBagBtn.addEventListener('click', () => bagDrawer.classList.add('hidden'));
  }
  if (bagBackdrop && bagDrawer) {
    bagBackdrop.addEventListener('click', () => bagDrawer.classList.add('hidden'));
  }

  // 2. Category Filter Tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  const productCards = document.querySelectorAll('.product-card');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.getAttribute('data-filter');

      productCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (category === 'all' || cardCat === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 3. Interactive FAQ Accordion
  document.querySelectorAll('.faq-accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-accordion-item');
      if (item) {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-accordion-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      }
    });
  });

  // 4. Pre-Order Form Handler
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.showToast('Priority allocation confirmed! Check your inbox for reserve details.');
      orderForm.reset();
    });
  }

  // 5. Checkout Button Handler
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (bag.length === 0) {
        window.showToast('Your shopping bag is currently empty.');
        return;
      }
      const subtotal = bag.reduce((sum, item) => sum + item.qty * item.price, 0);
      window.showToast('Redirecting to secure simulated checkout for $' + subtotal.toFixed(2));
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
      content: `# ${brandName} — Premium Footwear Storefront\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: 6 precision silhouettes with sizing selectors, slide-out shopping bag, 4 performance pillars, sustainability matrix, customer reviews, interactive FAQ accordion, VIP allocation preorder form.\n- Run: Open index.html in any modern browser.`,
    },
  ];
}
