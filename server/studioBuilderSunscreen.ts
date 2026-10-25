/**
 * server/studioBuilderSunscreen.ts
 * ============================================================================
 * Premium Mineral Sunscreen & Botanical Skincare Archetype
 * 
 * Inspired by the luxury, sun-drenched, editorial aesthetic of fine skincare:
 * - Brand: "Solveil Botanicals" / "Aurelia Solaire"
 * - Warm terracotta, sand, and golden amber palette (not generic purple)
 * - Typography: High-contrast editorial serif headers + modern grotesque body
 * - Complete long-form sections:
 *   1. Announcement bar (Free carbon-neutral shipping over $50)
 *   2. Navbar with dynamic Shopping Bag counter & slide-out Drawer
 *   3. Editorial Sun-Drenched Hero with key formulation badges & CTA
 *   4. Four Core Formula Pillars (Non-nano zinc, Zero white cast, Reef safe, Squalane barrier)
 *   5. Curated Product Formulas Gallery (Face Fluid, Tinted Glow, Sport Mist, After-Sun Elixir)
 *   6. Clinical & Dermatological Efficacy Stats (99% zero white cast, 96% hydration)
 *   7. Ingredients & Clean Science Matrix (Active Zinc vs Botanical Lipids)
 *   8. Verified Customer Reviews & Community Social Proof
 *   9. Interactive FAQ Accordion (Deep skin tones, chemical vs mineral, makeup primer)
 *   10. Editorial Footer with newsletter signup discount code
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export function synthesizeMineralSunscreenWebsite(brief: string): ProjectFile[] {
  let brandName = 'Solveil Botaniques';
  const brandMatch = brief.match(/(?:for|named|called)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|brand|website|premium|mineral|sunscreen)\b/i.test(brandMatch[1].trim())) {
    brandName = brandMatch[1].trim();
  }
  const brandParts = brandName.split(/\s+/);
  const primaryBrandWord = brandParts[0] || 'Solveil';
  const secondaryBrandWord = brandParts.slice(1).join(' ') || (primaryBrandWord.toLowerCase() === 'solveil' ? 'BOTANIQUES' : '');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — 100% Sheer Mineral Sunscreen & Botanical Barrier Care</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Top Announcement Bar -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>Free Carbon-Neutral Shipping on Orders Over $50 &bull; 100% Non-Nano Mineral Zinc &bull; Reef-Safe Certified</span>
    </div>
  </aside>

  <!-- Editorial Navigation -->
  <header class="navbar">
    <div class="container nav-wrap">
      <a href="#hero" class="brand">
        <span class="brand-symbol">☼</span>
        <span class="brand-text">${brandName}</span>
      </a>
      <nav class="nav-links">
        <a href="#formula" class="nav-link">The Formula</a>
        <a href="#benefits" class="nav-link">Pillars</a>
        <a href="#shop" class="nav-link">Formulas</a>
        <a href="#science" class="nav-link">Clean Science</a>
        <a href="#reviews" class="nav-link">Reviews</a>
        <a href="#faq" class="nav-link">FAQ</a>
      </nav>
      <div class="nav-actions">
        <button type="button" class="bag-btn" id="openBagBtn" aria-label="Open Shopping Bag">
          <span class="bag-icon">🛍</span>
          <span class="bag-label">Bag</span>
          <span class="bag-count" id="bagCountBadge">0</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Hero Section: Sun-Drenched Editorial Long-Form -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-copy">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Broad Spectrum SPF 50+ &bull; Invisible Mineral Shield</span>
        </div>
        <h1 class="hero-title">Sun protection crafted like <span class="font-italic">fine skincare</span>.</h1>
        <p class="hero-lead">
          100% sheer non-nano zinc oxide infused with botanical squalane, green tea polyphenols, and desert succulent nectar. Melts weightlessly into every skin tone with zero ghostly white cast, zero synthetic fragrances, and all-day dewy moisture.
        </p>
        <div class="hero-cta-group">
          <a href="#shop" class="btn btn-primary btn-lg">Shop The Formulas &rarr;</a>
          <a href="#science" class="btn btn-secondary btn-lg">Explore Ingredients</a>
        </div>
        <div class="hero-guarantees">
          <div class="guarantee-item">
            <span class="check">✓</span>
            <span>Zero White Cast (All Skin Tones)</span>
          </div>
          <div class="guarantee-item">
            <span class="check">✓</span>
            <span>80-Min Water Resistant</span>
          </div>
          <div class="guarantee-item">
            <span class="check">✓</span>
            <span>Reef-Safe Hawaii Act 104</span>
          </div>
        </div>
      </div>
      <div class="hero-imagery">
        <div class="bottle-frame">
          <img src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80" alt="${brandName} Invisible Daily Mineral Shield" class="hero-bottle-img">
          <div class="sun-glow-overlay"></div>
          <div class="hero-floating-card">
            <span class="star-rating">★★★★★</span>
            <strong>"Finally a mineral SPF with zero chalky residue."</strong>
            <span class="card-author">— Vogue Beauty Review 2026</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 4 Core Formula Pillars -->
  <section id="benefits" class="section-pillars">
    <div class="container">
      <div class="section-header text-center">
        <span class="pill-tag">The Mineral Standard</span>
        <h2 class="section-title">Four Uncompromising Formulatory Pillars</h2>
        <p class="section-subtitle">We spent 36 months in Swiss laboratories eliminating the trade-offs of traditional physical sunscreens.</p>
      </div>

      <div class="pillars-grid">
        <article class="pillar-card">
          <div class="pillar-icon">☀️</div>
          <h3 class="pillar-title">100% Non-Nano Mineral Zinc</h3>
          <p class="pillar-desc">True physical photon reflection. Sits smoothly on the skin's surface without penetrating into living tissue or entering the bloodstream.</p>
          <span class="pillar-metric">18.5% Active Zinc Oxide</span>
        </article>

        <article class="pillar-card">
          <div class="pillar-icon">✨</div>
          <h3 class="pillar-title">Zero Ghostly White Cast</h3>
          <p class="pillar-desc">Proprietary sheer micro-milling dispersion suspension that disappears completely across all Fitzpatrick skin types (I through VI).</p>
          <span class="pillar-metric">Sheer Satin Finish</span>
        </article>

        <article class="pillar-card">
          <div class="pillar-icon">🌊</div>
          <h3 class="pillar-title">Reef-Safe & Ocean Kind</h3>
          <p class="pillar-desc">Formulated strictly without oxybenzone, octinoxate, homosalate, or microplastics. 100% biodegradable and compliant with Hawaii Act 104.</p>
          <span class="pillar-metric">Marine Biome Safe</span>
        </article>

        <article class="pillar-card">
          <div class="pillar-icon">💧</div>
          <h3 class="pillar-title">Squalane & Ceramide Shield</h3>
          <p class="pillar-desc">Cold-pressed olive squalane and biomimetic ceramides continuously replenish the lipid barrier under extreme photo-oxidative stress.</p>
          <span class="pillar-metric">24hr Barrier Hydration</span>
        </article>
      </div>
    </div>
  </section>

  <!-- Interactive Product Formulas Gallery with Working Cart Handler -->
  <section id="shop" class="section-shop">
    <div class="container">
      <div class="gallery-head">
        <div>
          <span class="pill-tag">Curated Collection</span>
          <h2 class="section-title">Targeted Sun Protection Formulations</h2>
        </div>
        <p class="gallery-lead">Every formula is dermatologist-tested, non-comedogenic, and suited for sensitive, reactive, or acne-prone skin.</p>
      </div>

      <div class="products-grid">
        <!-- Product 1 -->
        <article class="product-card">
          <div class="product-thumb-box">
            <span class="product-badge">Best Seller</span>
            <img src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80" alt="Invisible Mineral Daily Fluid SPF 50" class="prod-img">
          </div>
          <div class="product-info">
            <div class="product-cat">Daily Facial Sunscreen &bull; 50ml</div>
            <h3 class="product-name">Invisible Daily Mineral Fluid SPF 50+</h3>
            <p class="product-desc">Ultralight weightless daily fluid with a soft velvet finish. Infused with niacinamide to balance sebum and even skin tone.</p>
            <div class="product-rating">★★★★★ <span>(1,480 reviews)</span></div>
            <div class="product-foot">
              <span class="product-price">$38.00</span>
              <button type="button" class="btn btn-add-bag" data-id="fluid-50" data-name="Invisible Daily Mineral Fluid SPF 50+" data-price="38.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 2 -->
        <article class="product-card">
          <div class="product-thumb-box">
            <span class="product-badge">Radiant Finish</span>
            <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80" alt="Golden Hour Tinted Mineral Fluid SPF 45" class="prod-img">
          </div>
          <div class="product-info">
            <div class="product-cat">Adaptive Mineral Tint &bull; 50ml</div>
            <h3 class="product-name">Golden Hour Sheer Tinted Mineral SPF 45</h3>
            <p class="product-desc">Universal tone-adaptive sheer tint using pure iron oxides. Protects against HEV blue light while imparting a lit-from-within glow.</p>
            <div class="product-rating">★★★★★ <span>(920 reviews)</span></div>
            <div class="product-foot">
              <span class="product-price">$42.00</span>
              <button type="button" class="btn btn-add-bag" data-id="tint-45" data-name="Golden Hour Sheer Tinted Mineral SPF 45" data-price="42.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 3 -->
        <article class="product-card">
          <div class="product-thumb-box">
            <span class="product-badge">Water Resistant</span>
            <img src="https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80" alt="Active Hydramist Mineral Sunveil SPF 45" class="prod-img">
          </div>
          <div class="product-info">
            <div class="product-cat">Sport Reapplication Mist &bull; 120ml</div>
            <h3 class="product-name">Active Hydramist Mineral Sunveil SPF 45</h3>
            <p class="product-desc">Continuous fine-aerosol-free mineral mist. 80-minute sweat resistant formula with cooling aloe vera and green tea extract.</p>
            <div class="product-rating">★★★★★ <span>(640 reviews)</span></div>
            <div class="product-foot">
              <span class="product-price">$34.00</span>
              <button type="button" class="btn btn-add-bag" data-id="mist-45" data-name="Active Hydramist Mineral Sunveil SPF 45" data-price="34.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>

        <!-- Product 4 -->
        <article class="product-card">
          <div class="product-thumb-box">
            <span class="product-badge">Recovery</span>
            <img src="https://images.unsplash.com/photo-1608248597334-a13470483d3b?auto=format&fit=crop&w=800&q=80" alt="Botanical Recovery After-Sun Elixir" class="prod-img">
          </div>
          <div class="product-info">
            <div class="product-cat">Post-Sun Lipids &bull; 100ml</div>
            <h3 class="product-name">Botanical Recovery After-Sun Elixir</h3>
            <p class="product-desc">Rapid-calming cooling balm with blue tansy, organic prickly pear seed oil, and bisabolol to neutralize post-sun erythema.</p>
            <div class="product-rating">★★★★★ <span>(510 reviews)</span></div>
            <div class="product-foot">
              <span class="product-price">$36.00</span>
              <button type="button" class="btn btn-add-bag" data-id="elixir-sun" data-name="Botanical Recovery After-Sun Elixir" data-price="36.00">
                + Add to Bag
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Clinical & Dermatological Efficacy Stats -->
  <section class="section-stats">
    <div class="container stats-wrap">
      <div class="stat-block">
        <div class="stat-figure">99%</div>
        <div class="stat-desc">Agreed formula leaves zero white chalkiness on skin</div>
      </div>
      <div class="stat-block">
        <div class="stat-figure">96%</div>
        <div class="stat-desc">Reported all-day barrier hydration without greasy shine</div>
      </div>
      <div class="stat-block">
        <div class="stat-figure">80 Min</div>
        <div class="stat-desc">Clinically proven water & sweat immersion resistance</div>
      </div>
      <div class="stat-block">
        <div class="stat-figure">100%</div>
        <div class="stat-desc">Clean, vegan, non-nano & Leaping Bunny certified</div>
      </div>
    </div>
  </section>

  <!-- Clean Science & Ingredients Matrix -->
  <section id="science" class="section-science">
    <div class="container">
      <div class="science-grid">
        <div class="science-copy">
          <span class="pill-tag">Clean Formulation</span>
          <h2 class="section-title">Transparent Botanical Architecture</h2>
          <p class="science-lead">We believe you should know exactly what touches your skin. We disclose every single active and botanical suspension carrier.</p>
          
          <div class="ingredients-list">
            <div class="ing-item">
              <strong>Non-Nano Zinc Oxide (18.5%):</strong>
              <span>Eco-certified pharmaceutical-grade mineral photon reflector.</span>
            </div>
            <div class="ing-item">
              <strong>100% Plant Squalane:</strong>
              <span>Bio-identical lipid that mimics natural sebum to seal hydration.</span>
            </div>
            <div class="ing-item">
              <strong>Niacinamide (Vitamin B3 2%):</strong>
              <span>Soothes sun-induced redness and tightens appearance of pores.</span>
            </div>
            <div class="ing-item">
              <strong>Raspberry Seed Extract:</strong>
              <span>Cold-pressed botanical rich in carotenoids and polyphenols.</span>
            </div>
          </div>
        </div>

        <div class="science-card">
          <div class="clean-badge">🌿 Zero Compromise Promise</div>
          <h3 class="card-head">Formulated Strictly Without:</h3>
          <ul class="clean-checklist">
            <li>✕ Oxybenzone & Octinoxate</li>
            <li>✕ Synthetic Fragrances or Phthalates</li>
            <li>✕ Parabens, Sulfates & Silicones</li>
            <li>✕ Microplastics & Chemical Nanoparticles</li>
            <li>✕ Mineral Oil & Petroleum Byproducts</li>
          </ul>
          <div class="cert-row">
            <span>Dermatologist Approved</span> &bull; <span>Non-Comedogenic</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Customer Reviews & Social Proof -->
  <section id="reviews" class="section-reviews">
    <div class="container">
      <div class="section-header text-center">
        <span class="pill-tag">Verified Experiences</span>
        <h2 class="section-title">Trusted by 45,000+ Daily Wearers</h2>
        <div class="review-stars-summary">★★★★★ <strong>4.9 / 5.0 Overall Rating</strong></div>
      </div>

      <div class="reviews-grid">
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-text">"As a woman of color, mineral sunscreen has always been a nightmare of purple-gray ash. ${brandName} is the first mineral SPF in history that genuinely disappears into my skin within 30 seconds."</p>
          <div class="review-author">
            <strong>Kendra Washington</strong>
            <span>Verified Buyer &bull; Deep Warm Undertone</span>
          </div>
        </div>

        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-text">"I have extremely reactive rosacea and chemical sunscreens burn my face instantly. This formula calms my redness while protecting me on my daily 5-mile coastal runs."</p>
          <div class="review-author">
            <strong>Julian Meyer</strong>
            <span>Verified Buyer &bull; Sensitive Reactive Skin</span>
          </div>
        </div>

        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-text">"The texture feels like a $90 luxury French serum. It sits flawlessly under my makeup without pilling or causing mid-day foundation breakdown."</p>
          <div class="review-author">
            <strong>Camille Durand</strong>
            <span>Verified Buyer &bull; Makeup Artist, Paris</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Sunscreen FAQ Accordion -->
  <section id="faq" class="section-faq">
    <div class="container faq-container">
      <div class="section-header text-center">
        <span class="pill-tag">Questions Answered</span>
        <h2 class="section-title">Frequently Asked Questions</h2>
        <p class="section-subtitle">Everything you need to know about mineral zinc, reapplication, and clean sun care.</p>
      </div>

      <div class="faq-accordion" id="faqAccordion">
        <div class="faq-item">
          <button type="button" class="faq-question">
            <span>Will this formula leave a white cast on deeper skin tones?</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-answer">
            <p>No. Our proprietary micro-milled zinc suspension eliminates the optical scattering that causes chalkiness. When warmed between your fingers and smoothed across the skin, it sets to an invisible, natural satin finish on all Fitzpatrick skin tones (I–VI).</p>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-question">
            <span>How does non-nano mineral zinc differ from chemical filters?</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-answer">
            <p>Non-nano mineral zinc sits on top of your stratum corneum to physically reflect UVA and UVB rays away from your body like microscopic mirrors. Chemical filters must absorb into living dermal layers and convert UV into heat, which frequently triggers irritation, rosacea flares, and coral reef bleaching.</p>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-question">
            <span>Can I wear this seamlessly underneath makeup?</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-answer">
            <p>Yes. Because the formula is infused with plant squalane and lightweight silica, it functions as a smoothing, pore-blurring primer. Wait 60 seconds after application before applying foundation, tinted moisturizer, or concealer.</p>
          </div>
        </div>

        <div class="faq-item">
          <button type="button" class="faq-question">
            <span>Is this water-resistant for ocean swimming and sweat?</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-answer">
            <p>Both our Daily Mineral Fluid and Active Hydramist are clinically tested and verified for 80 minutes of continuous water and sweat resistance. We recommend reapplying after towel drying or every 2 hours of direct sun exposure.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- VIP Allocation & Pre-Order Waitlist Section -->
  <section id="waitlist" class="section-waitlist">
    <div class="container waitlist-container">
      <div class="waitlist-card">
        <span class="pill-tag">Small-Batch Reserve</span>
        <h2 class="section-title">Join The Priority Allocation Waitlist</h2>
        <p class="section-subtitle">Our micronized mineral dispersions are blended in limited quarterly batches. Register for guaranteed priority allocation and complimentary worldwide express delivery.</p>
        <form id="orderForm" class="waitlist-form" onsubmit="event.preventDefault(); window.showToast ? window.showToast('Priority allocation confirmed!') : alert('Allocation confirmed!');">
          <div class="waitlist-row">
            <input type="text" placeholder="Your Name" required class="waitlist-input">
            <input type="email" placeholder="Your Email Address" required class="waitlist-input">
          </div>
          <button type="submit" class="btn btn-primary btn-lg btn-block">Claim Priority Allocation &rarr;</button>
          <p class="waitlist-note">✓ 100% Satisfaction Guarantee &bull; Free Shipping Over $50 &bull; No Spam</p>
        </form>
      </div>
    </div>
  </section>

  <!-- Editorial Footer with Newsletter Capture -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand-col">
        <span class="footer-logo">☼ ${brandName}</span>
        <p class="footer-tagline">Clean mineral sun defense formulated with botanical lipids and zero compromises for human skin and coral reefs.</p>
        <p class="footer-copy">&copy; 2026 ${brandName} Inc. All rights reserved.</p>
      </div>
      <div class="footer-links-col">
        <h4>Formulas</h4>
        <a href="#shop">Daily Face Fluid SPF 50</a>
        <a href="#shop">Tinted Mineral SPF 45</a>
        <a href="#shop">Sport Hydramist SPF 45</a>
        <a href="#shop">After-Sun Elixir</a>
      </div>
      <div class="footer-links-col">
        <h4>The Brand</h4>
        <a href="#benefits">Pillars</a>
        <a href="#science">Clean Science</a>
        <a href="#reviews">Reviews</a>
        <a href="#faq">FAQ</a>
      </div>
      <div class="footer-newsletter-col">
        <h4>Receive 15% Off Your First Order</h4>
        <p>Subscribe for seasonal sun protection protocols, dermatological insights, and private formula drops.</p>
        <form id="newsletterForm" class="newsletter-form">
          <input type="email" id="newsEmail" placeholder="Enter your email..." required>
          <button type="submit" class="btn btn-primary btn-sm">Subscribe</button>
        </form>
      </div>
    </div>
  </footer>

  <!-- Slide-Out Shopping Bag Drawer -->
  <aside class="bag-drawer hidden" id="bagDrawer" role="dialog" aria-modal="true" aria-label="Shopping Bag">
    <div class="bag-drawer-backdrop" id="bagBackdrop"></div>
    <div class="bag-drawer-panel">
      <div class="bag-head">
        <h3>Your Sunscreen Bag (<span id="bagCountTitle">0</span>)</h3>
        <button type="button" class="bag-close" id="bagCloseBtn">&times;</button>
      </div>

      <div class="bag-body" id="bagItemsList">
        <div class="bag-empty" id="bagEmptyState">
          <span class="empty-icon">☼</span>
          <p>Your bag is empty.</p>
          <a href="#shop" class="btn btn-secondary btn-sm" id="emptyShopBtn">Explore Formulas</a>
        </div>
      </div>

      <div class="bag-foot" id="bagFooter">
        <div class="shipping-progress">
          <span class="shipping-pill">✓ You Qualify for Free Carbon-Neutral Shipping!</span>
        </div>
        <div class="subtotal-row">
          <span>Subtotal:</span>
          <strong id="bagSubtotalVal">$0.00</strong>
        </div>
        <button type="button" class="btn btn-primary btn-block btn-lg" id="checkoutBtn">
          Checkout &bull; Instant Delivery
        </button>
      </div>
    </div>
  </aside>

  <!-- Real Toast Notification -->
  <div id="toast" class="toast hidden" role="status" aria-live="polite"></div>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-sand: #fdfbf7;
  --color-warm-stone: #f5f0ea;
  --color-terracotta: #c25e3d;
  --color-terracotta-hover: #a84b2c;
  --color-amber: #d97706;
  --color-bronze: #78350f;
  --color-charcoal: #1c1917;
  --color-charcoal-muted: #57534e;
  --color-charcoal-dim: #a8a29e;
  --color-border: #e7e0d5;
  --color-border-subtle: #f0eae1;
  --color-white: #ffffff;
  --font-serif: "Playfair Display", Georgia, serif;
  --font-sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
@media (max-width: 768px) {
  :root {
    --container-padding: 16px;
  }
}
`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  overflow-x: hidden;
  max-width: 100vw;
  font-family: var(--font-sans);
  background: var(--color-sand);
  color: var(--color-charcoal);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; }

.container {
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 28px;
}

/* Announcement Bar */
.announcement-bar {
  background: var(--color-terracotta);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 8px 0;
  text-align: center;
}

/* Navbar */
.navbar {
  background: rgba(253, 251, 247, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-serif);
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-charcoal);
}
.brand-symbol {
  color: var(--color-terracotta);
  font-size: 22px;
}
.nav-links {
  display: flex;
  gap: 28px;
}
.nav-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-charcoal-muted);
  transition: var(--transition);
}
.nav-link:hover {
  color: var(--color-terracotta);
}
.bag-btn {
  background: var(--color-warm-stone);
  border: 1px solid var(--color-border);
  padding: 8px 16px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}
.bag-btn:hover {
  border-color: var(--color-terracotta);
  background: #ffffff;
}
.bag-count {
  background: var(--color-terracotta);
  color: #ffffff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 9999px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  border: 1px solid transparent;
}
.btn-primary {
  background: var(--color-terracotta);
  color: #ffffff;
}
.btn-primary:hover {
  background: var(--color-terracotta-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(194, 94, 61, 0.25);
}
.btn-secondary {
  background: #ffffff;
  color: var(--color-charcoal);
  border-color: var(--color-border);
}
.btn-secondary:hover {
  border-color: var(--color-charcoal);
}
.btn-lg { padding: 14px 30px; font-size: 14px; }
.btn-sm { padding: 8px 16px; font-size: 12px; }
.btn-block { width: 100%; }

/* Sun-Drenched Hero */
.hero-section {
  padding: 68px 0 80px;
  background: linear-gradient(180deg, #fdfbf7 0%, #f6efe7 100%);
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  gap: 56px;
  align-items: center;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-terracotta);
  margin-bottom: 20px;
}
.badge-dot {
  width: 8px;
  height: 8px;
  background: var(--color-terracotta);
  border-radius: 9999px;
}
.hero-title {
  font-family: var(--font-serif);
  font-size: 48px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
  color: var(--color-charcoal);
}
.font-italic { font-style: italic; font-weight: 400; color: var(--color-terracotta); }
.hero-lead {
  font-size: 16px;
  color: var(--color-charcoal-muted);
  line-height: 1.7;
  margin-bottom: 32px;
  max-width: 580px;
}
.hero-cta-group {
  display: flex;
  gap: 14px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}
.hero-guarantees {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-charcoal-muted);
}
.guarantee-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.guarantee-item .check {
  color: var(--color-terracotta);
  font-weight: 800;
}

/* Hero Imagery Frame */
.bottle-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  background: radial-gradient(circle at 50% 40%, #fffbf4 0%, #ecdcc9 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border: 1px solid #ebd9c5;
  box-shadow: 0 20px 48px rgba(120, 53, 15, 0.12);
}
.hero-bottle-img {
  max-height: 88%;
  filter: drop-shadow(0 16px 28px rgba(0,0,0,0.18));
  transition: transform 0.4s ease;
}
.bottle-frame:hover .hero-bottle-img {
  transform: translateY(-6px) scale(1.02);
}
.hero-floating-card {
  position: absolute;
  bottom: 24px;
  left: -20px;
  background: #ffffff;
  border: 1px solid var(--color-border);
  padding: 14px 18px;
  border-radius: var(--radius-md);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
  max-width: 260px;
  font-size: 12px;
}
.star-rating {
  color: #f59e0b;
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
}
.card-author {
  display: block;
  font-size: 10px;
  color: var(--color-charcoal-dim);
  margin-top: 4px;
}

/* Pillars Section */
.section-pillars {
  padding: 88px 0;
  background: #ffffff;
}
.pill-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-terracotta);
  display: block;
  margin-bottom: 8px;
}
.section-title {
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-charcoal);
  margin-bottom: 10px;
}
.section-subtitle {
  font-size: 15px;
  color: var(--color-charcoal-muted);
  max-width: 600px;
  margin: 0 auto;
}
.text-center { text-align: center; }

.pillars-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 56px;
}
.pillar-card {
  background: var(--color-warm-stone);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  transition: var(--transition);
}
.pillar-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-terracotta);
  box-shadow: 0 12px 28px rgba(0,0,0,0.06);
}
.pillar-icon {
  font-size: 28px;
  margin-bottom: 16px;
}
.pillar-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-charcoal);
  margin-bottom: 10px;
}
.pillar-desc {
  font-size: 13px;
  color: var(--color-charcoal-muted);
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
}
.pillar-metric {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-terracotta);
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

/* Product Gallery */
.section-shop {
  padding: 88px 0;
  background: var(--color-sand);
  border-top: 1px solid var(--color-border);
}
.gallery-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 48px;
  flex-wrap: wrap;
  gap: 20px;
}
.gallery-lead {
  font-size: 14px;
  color: var(--color-charcoal-muted);
  max-width: 440px;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.product-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: var(--transition);
}
.product-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-terracotta);
  box-shadow: 0 16px 32px rgba(0,0,0,0.08);
}
.product-thumb-box {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1.1;
  background: radial-gradient(circle at 50% 50%, #fffdfa 0%, #f6efe7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
}
.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--color-charcoal);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}
.prod-img {
  max-height: 85%;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.12));
  transition: transform 0.3s ease;
}
.product-card:hover .prod-img {
  transform: scale(1.05);
}
.product-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.product-cat {
  font-size: 11px;
  color: var(--color-charcoal-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  font-weight: 600;
}
.product-name {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-charcoal);
  margin-bottom: 8px;
  line-height: 1.35;
}
.product-desc {
  font-size: 12px;
  color: var(--color-charcoal-muted);
  line-height: 1.5;
  margin-bottom: 12px;
  flex: 1;
}
.product-rating {
  font-size: 11px;
  color: #f59e0b;
  margin-bottom: 14px;
}
.product-rating span { color: var(--color-charcoal-dim); }
.product-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 14px;
}
.product-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-charcoal);
}
.btn-add-bag {
  background: var(--color-warm-stone);
  border: 1px solid var(--color-border);
  color: var(--color-charcoal);
  font-size: 11px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 9999px;
  cursor: pointer;
  transition: var(--transition);
}
.btn-add-bag:hover {
  background: var(--color-terracotta);
  color: #ffffff;
  border-color: var(--color-terracotta);
}

/* Stats Section */
.section-stats {
  padding: 48px 0;
  background: var(--color-charcoal);
  color: #ffffff;
}
.stats-wrap {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}
.stat-block { text-align: center; }
.stat-figure {
  font-family: var(--font-serif);
  font-size: 40px;
  font-weight: 600;
  color: #fde68a;
  margin-bottom: 4px;
}
.stat-desc {
  font-size: 12px;
  color: #d6d3d1;
  max-width: 200px;
  margin: 0 auto;
}

/* Clean Science Section */
.section-science {
  padding: 88px 0;
  background: #ffffff;
}
.science-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 56px;
  align-items: center;
}
.science-lead {
  font-size: 15px;
  color: var(--color-charcoal-muted);
  margin-bottom: 28px;
}
.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ing-item {
  background: var(--color-warm-stone);
  border-left: 3px solid var(--color-terracotta);
  padding: 12px 16px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: 13px;
}
.ing-item strong {
  display: block;
  color: var(--color-charcoal);
  margin-bottom: 2px;
}
.ing-item span { color: var(--color-charcoal-muted); }

.science-card {
  background: var(--color-sand);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 36px;
}
.clean-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-terracotta);
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}
.card-head {
  font-family: var(--font-serif);
  font-size: 20px;
  margin-bottom: 18px;
}
.clean-checklist {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: var(--color-charcoal-muted);
  margin-bottom: 24px;
}
.clean-checklist li { font-weight: 600; }
.cert-row {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-charcoal-dim);
  text-transform: uppercase;
}

/* Reviews Section */
.section-reviews {
  padding: 88px 0;
  background: var(--color-warm-stone);
  border-top: 1px solid var(--color-border);
}
.review-stars-summary {
  font-size: 14px;
  color: var(--color-charcoal);
  margin-top: 6px;
}
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-top: 48px;
}
.review-card {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.review-stars {
  color: #f59e0b;
  font-size: 13px;
  margin-bottom: 12px;
}
.review-text {
  font-size: 13px;
  color: var(--color-charcoal-muted);
  line-height: 1.65;
  font-style: italic;
  margin-bottom: 20px;
}
.review-author strong {
  display: block;
  font-size: 13px;
  color: var(--color-charcoal);
}
.review-author span {
  font-size: 11px;
  color: var(--color-charcoal-dim);
}

/* FAQ Accordion */
.section-faq {
  padding: 88px 0;
  background: #ffffff;
}
.faq-container { max-width: 780px; }
.faq-accordion {
  margin-top: 44px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.faq-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-sand);
}
.faq-question {
  width: 100%;
  padding: 18px 24px;
  background: none;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-charcoal);
  cursor: pointer;
  text-align: left;
}
.faq-icon {
  font-size: 20px;
  color: var(--color-terracotta);
  transition: transform 0.2s ease;
}
.faq-item.open .faq-icon {
  transform: rotate(45deg);
}
.faq-answer {
  display: none;
  padding: 0 24px 20px;
  font-size: 13px;
  color: var(--color-charcoal-muted);
  line-height: 1.7;
}
.faq-item.open .faq-answer {
  display: block;
}

/* VIP Pre-Order & Waitlist */
.section-waitlist {
  padding: 80px 0;
  background: var(--color-sand, #f8f6f2);
  border-top: 1px solid var(--color-border);
}
.waitlist-container { max-width: 680px; margin: 0 auto; }
.waitlist-card {
  background: #ffffff;
  padding: 44px;
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  text-align: center;
}
.waitlist-form {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.waitlist-row {
  display: flex;
  gap: 12px;
}
@media (max-width: 640px) {
  .waitlist-row { flex-direction: column; }
}
.waitlist-input {
  flex: 1;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 6px);
  font-family: inherit;
  font-size: 14px;
  background: var(--color-sand, #f8f6f2);
  color: var(--color-charcoal);
  outline: none;
}
.waitlist-input:focus {
  border-color: var(--color-terracotta);
  background: #ffffff;
}
.waitlist-note {
  font-size: 12px;
  color: var(--color-charcoal-muted);
  margin-top: 8px;
}

/* Footer */
.footer {
  background: var(--color-charcoal);
  color: #ffffff;
  padding: 72px 0 40px;
  border-top: 1px solid #292524;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
  gap: 40px;
  margin-bottom: 48px;
}
.footer-logo {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  display: block;
  margin-bottom: 12px;
}
.footer-tagline {
  font-size: 13px;
  color: #a8a29e;
  line-height: 1.6;
  margin-bottom: 20px;
  max-width: 320px;
}
.footer-copy {
  font-size: 11px;
  color: #78716c;
}
.footer-links-col h4, .footer-newsletter-col h4 {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #fde68a;
  margin-bottom: 16px;
}
.footer-links-col a {
  display: block;
  font-size: 13px;
  color: #a8a29e;
  margin-bottom: 10px;
  transition: color 0.2s;
}
.footer-links-col a:hover { color: #ffffff; }
.footer-newsletter-col p {
  font-size: 12px;
  color: #a8a29e;
  margin-bottom: 14px;
  line-height: 1.5;
}
.newsletter-form {
  display: flex;
  gap: 8px;
}
.newsletter-form input {
  flex: 1;
  background: #292524;
  border: 1px solid #44403c;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-family: inherit;
}
.newsletter-form input:focus {
  outline: none;
  border-color: var(--color-terracotta);
}

/* Slide-Out Shopping Bag Drawer */
.bag-drawer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}
.bag-drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
.bag-drawer-panel {
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: var(--color-sand);
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 36px rgba(0,0,0,0.25);
  z-index: 10;
}
.bag-head {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bag-head h3 {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
}
.bag-close {
  background: none;
  border: none;
  font-size: 26px;
  color: var(--color-charcoal-muted);
  cursor: pointer;
  line-height: 1;
}
.bag-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bag-empty {
  text-align: center;
  padding: 60px 0;
  color: var(--color-charcoal-muted);
}
.empty-icon {
  font-size: 40px;
  color: var(--color-terracotta);
  display: block;
  margin-bottom: 12px;
}
.bag-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
}
.bag-item-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-charcoal);
}
.bag-item-price {
  font-size: 12px;
  color: var(--color-terracotta);
  font-weight: 700;
}
.bag-item-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
}
.bag-foot {
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
  background: #ffffff;
}
.shipping-pill {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #15803d;
  background: #dcfce7;
  padding: 4px 8px;
  border-radius: 9999px;
  font-weight: 700;
  margin-bottom: 14px;
}
.subtotal-row {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  margin-bottom: 16px;
}
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--color-charcoal);
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  z-index: 3000;
  border: 1px solid var(--color-terracotta);
}
.hidden { display: none !important; }

@media (max-width: 1024px) {
  .hero-grid { grid-template-columns: 1fr; }
  .pillars-grid { grid-template-columns: repeat(2, 1fr); }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-wrap { grid-template-columns: repeat(2, 1fr); }
  .science-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .pillars-grid { grid-template-columns: 1fr; }
  .products-grid { grid-template-columns: 1fr; }
  .reviews-grid { grid-template-columns: 1fr; }
  .stats-wrap { grid-template-columns: 1fr; }
  .hero-title { font-size: 32px; }
  .nav-links { display: none; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Shopping Bag State
  let bagItems = [];

  const bagCountBadge = document.getElementById('bagCountBadge');
  const bagCountTitle = document.getElementById('bagCountTitle');
  const bagDrawer = document.getElementById('bagDrawer');
  const openBagBtn = document.getElementById('openBagBtn');
  const bagCloseBtn = document.getElementById('bagCloseBtn');
  const bagBackdrop = document.getElementById('bagBackdrop');
  const bagItemsList = document.getElementById('bagItemsList');
  const bagEmptyState = document.getElementById('bagEmptyState');
  const bagSubtotalVal = document.getElementById('bagSubtotalVal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const toast = document.getElementById('toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  }

  function updateBagUI() {
    if (bagCountBadge) bagCountBadge.textContent = String(bagItems.length);
    if (bagCountTitle) bagCountTitle.textContent = String(bagItems.length);

    if (bagItems.length === 0) {
      if (bagEmptyState) bagEmptyState.classList.remove('hidden');
      if (bagSubtotalVal) bagSubtotalVal.textContent = '$0.00';
      const existingItems = document.querySelectorAll('.bag-item-card');
      existingItems.forEach(el => el.remove());
    } else {
      if (bagEmptyState) bagEmptyState.classList.add('hidden');
      const existingItems = document.querySelectorAll('.bag-item-card');
      existingItems.forEach(el => el.remove());

      let total = 0;
      bagItems.forEach((item, idx) => {
        total += item.price;
        const itemEl = document.createElement('div');
        itemEl.className = 'bag-item-card';
        itemEl.innerHTML = '<div><div class="bag-item-title">' + item.name + '</div><div class="bag-item-price">$' + item.price.toFixed(2) + '</div></div><button type="button" class="bag-item-remove" data-idx="' + idx + '">✕</button>';
        bagItemsList.appendChild(itemEl);
      });

      if (bagSubtotalVal) bagSubtotalVal.textContent = '$' + total.toFixed(2);

      const removeBtns = document.querySelectorAll('.bag-item-remove');
      removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx') || '0', 10);
          bagItems.splice(idx, 1);
          updateBagUI();
        });
      });
    }
  }

  function openBag() {
    if (bagDrawer) bagDrawer.classList.remove('hidden');
  }

  function closeBag() {
    if (bagDrawer) bagDrawer.classList.add('hidden');
  }

  if (openBagBtn) openBagBtn.addEventListener('click', openBag);
  if (bagCloseBtn) bagCloseBtn.addEventListener('click', closeBag);
  if (bagBackdrop) bagBackdrop.addEventListener('click', closeBag);

  const addButtons = document.querySelectorAll('.btn-add-bag');
  addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price') || '38.00');
      bagItems.push({ id, name, price });
      updateBagUI();
      openBag();
      showToast('✓ Added ' + name + ' to your bag');
    });
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (bagItems.length === 0) {
        showToast('Your bag is empty. Please add a formula.');
      } else {
        showToast('✓ Redirecting to Secure Carbon-Neutral Checkout...');
        setTimeout(() => {
          bagItems = [];
          updateBagUI();
          closeBag();
          showToast('✓ Order placed successfully! Confirmation dispatched.');
        }, 1500);
      }
    });
  }

  // 2. FAQ Accordion Toggle
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (item) {
        item.classList.toggle('open');
      }
    });
  });

  // 3. Newsletter Submission
  const newsForm = document.getElementById('newsletterForm');
  if (newsForm) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsEmail');
      showToast('✓ 15% discount code SUNVEIL15 dispatched to ' + (emailInput?.value || 'your email'));
      newsForm.reset();
    });
  }
});`;

  // Bespoke Vector Assets for Sunscreen Products
  const faceFluidSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="amberGlass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
    <linearGradient id="pumpGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#44403c"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#78350f" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Amber Bottle Body -->
    <rect x="130" y="140" width="140" height="280" rx="20" fill="url(#amberGlass)"/>
    <!-- Glass Highlight Reflection -->
    <rect x="145" y="150" width="14" height="260" rx="7" fill="#ffffff" fill-opacity="0.35"/>
    <!-- Shoulder -->
    <path d="M 130 150 Q 130 130 170 120 L 230 120 Q 270 130 270 150 Z" fill="#92400e"/>
    <!-- Collar & Pump -->
    <rect x="180" y="90" width="40" height="30" rx="4" fill="url(#pumpGrad)"/>
    <rect x="175" y="60" width="50" height="30" rx="6" fill="url(#pumpGrad)"/>
    <!-- Pump Spout -->
    <path d="M 175 75 L 120 70 L 120 82 L 175 80 Z" fill="#292524"/>
    <!-- Label -->
    <rect x="142" y="190" width="116" height="180" rx="4" fill="#faf7f2"/>
    <text x="200" y="224" text-anchor="middle" fill="#c25e3d" font-family="serif" font-size="14" font-weight="700">${primaryBrandWord.toUpperCase()}</text>
    <text x="200" y="240" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="8" letter-spacing="1">${(secondaryBrandWord || 'BOTANIQUES').toUpperCase()}</text>
    <line x1="160" y1="250" x2="240" y2="250" stroke="#e7e0d5"/>
    <text x="200" y="275" text-anchor="middle" fill="#1c1917" font-family="sans-serif" font-size="10" font-weight="700">MINERAL VEIL</text>
    <text x="200" y="292" text-anchor="middle" fill="#c25e3d" font-family="sans-serif" font-size="16" font-weight="800">SPF 50+</text>
    <text x="200" y="315" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="8">NON-NANO ZINC</text>
    <text x="200" y="330" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="8">SQUALANE &bull; 50ML</text>
  </g>
</svg>`;

  const tintedGlowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="dropperGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <!-- Frosted Glass Dropper Bottle -->
  <rect x="140" y="160" width="120" height="240" rx="16" fill="url(#dropperGrad)"/>
  <rect x="152" y="170" width="12" height="220" rx="6" fill="#ffffff" fill-opacity="0.3"/>
  <!-- Dropper Cap -->
  <rect x="180" y="120" width="40" height="40" rx="2" fill="#1c1917"/>
  <path d="M 185 120 C 185 85 215 85 215 120 Z" fill="#292524"/>
  <!-- Label -->
  <rect x="150" y="200" width="100" height="160" rx="4" fill="#faf7f2"/>
  <text x="200" y="230" text-anchor="middle" fill="#c25e3d" font-family="serif" font-size="12" font-weight="700">${primaryBrandWord.toUpperCase()}</text>
  <text x="200" y="260" text-anchor="middle" fill="#1c1917" font-family="sans-serif" font-size="10" font-weight="700">TINTED GLOW</text>
  <text x="200" y="280" text-anchor="middle" fill="#c25e3d" font-family="sans-serif" font-size="14" font-weight="800">SPF 45</text>
  <text x="200" y="305" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="8">ADAPTIVE TINT</text>
</svg>`;

  const sportMistSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="canisterGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#e7e5e4"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d6d3d1"/>
    </linearGradient>
  </defs>
  <!-- Aluminum Sport Canister -->
  <rect x="145" y="120" width="110" height="300" rx="14" fill="url(#canisterGrad)" stroke="#d6d3d1"/>
  <!-- Mist Spray Nozzle -->
  <rect x="185" y="80" width="30" height="40" rx="3" fill="#1c1917"/>
  <rect x="195" y="70" width="10" height="10" fill="#c25e3d"/>
  <!-- Printed Art Direction -->
  <rect x="145" y="200" width="110" height="140" fill="#c25e3d"/>
  <text x="200" y="235" text-anchor="middle" fill="#ffffff" font-family="serif" font-size="13" font-weight="700">${primaryBrandWord.toUpperCase()}</text>
  <text x="200" y="265" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="700">SPORT MIST</text>
  <text x="200" y="290" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="16" font-weight="800">SPF 45</text>
  <text x="200" y="315" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="8">80-MIN WATER RESIST</text>
</svg>`;

  const afterSunSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="jarGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>
  <!-- Luxury Balm Jar -->
  <rect x="130" y="210" width="140" height="160" rx="16" fill="url(#jarGrad)"/>
  <rect x="140" y="220" width="14" height="140" rx="7" fill="#ffffff" fill-opacity="0.3"/>
  <!-- Heavyweight Lid -->
  <rect x="125" y="170" width="150" height="40" rx="8" fill="#1c1917"/>
  <!-- Label -->
  <rect x="145" y="260" width="110" height="80" rx="4" fill="#faf7f2"/>
  <text x="200" y="285" text-anchor="middle" fill="#0369a1" font-family="serif" font-size="11" font-weight="700">AFTER-SUN</text>
  <text x="200" y="305" text-anchor="middle" fill="#1c1917" font-family="sans-serif" font-size="9" font-weight="700">BLUE TANSY BALM</text>
  <text x="200" y="325" text-anchor="middle" fill="#78716c" font-family="sans-serif" font-size="8">REPAIR LIPIDS &bull; 100ML</text>
</svg>`;

  return [
    { path: 'index.html', language: 'html', content: html },
    { path: 'styles/theme.css', language: 'css', content: themeCss },
    { path: 'assets/site.css', language: 'css', content: siteCss },
    { path: 'assets/site.js', language: 'javascript', content: siteJs },
    { path: 'assets/product-face-fluid.svg', language: 'xml', content: faceFluidSvg },
    { path: 'assets/product-tinted-glow.svg', language: 'xml', content: tintedGlowSvg },
    { path: 'assets/product-sport-mist.svg', language: 'xml', content: sportMistSvg },
    { path: 'assets/product-after-sun.svg', language: 'xml', content: afterSunSvg },
    { path: 'styles.css', language: 'css', content: `${themeCss}\n\n${siteCss}` },
    { path: 'app.js', language: 'javascript', content: siteJs },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# ${brandName} — Mineral Sunscreen & Skincare Flagship\n\nSynthesized with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: Sun-drenched editorial hero, 4 formulation pillars, 4 bespoke product formulas with vector artwork, Interactive slide-out Shopping Bag drawer, Clinical efficacy stats, Clean science ingredient disclosures, Verified buyer social proof, Interactive FAQ accordion, 15% discount newsletter capture.\n- Run: Open index.html in any modern browser.`,
    },
  ];
}
