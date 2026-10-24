/**
 * server/studioBuilderArchetypes.ts
 * ============================================================================
 * Purpose-Built Design System & Website Archetypes for LightningAPI Studio
 * 
 * Provides distinct architectures, design tokens, responsive styles,
 * interactive logic, and SVG graphics for:
 * 1. South Indian & Fine Dining Restaurants
 * 2. Modern SaaS & AI Productivity Platforms
 * 3. Photography & Creative Portfolios
 * 4. Interactive Sales & Analytics Dashboards
 * 5. E-commerce Skincare & Retail Storefronts
 * 6. Mineral Sunscreen & Beauty Brands
 * ============================================================================
 */

export interface ProjectFile {
  path: string;
  content: string;
  language?: string;
}

// ============================================================================
// Archetype Detection
// ============================================================================

export function detectProjectArchetype(brief: string, categoryHint?: string): string {
  const text = (brief + ' ' + (categoryHint || '')).toLowerCase();

  if (/(dashboard|analytics|kpi|metrics|admin portal|crm|sales report|transaction table|revenue chart|telemetry)/i.test(text)) {
    return 'dashboard';
  }
  if (/(restaurant|food|dining|cuisine|menu|dishes|dosa|dosai|south indian|curry|cafe|bistro|\bbar\b|bakery|reservation|chef|thali|tiffin)/i.test(text) && !text.includes('bar chart')) {
    return 'restaurant';
  }
  if (/(portfolio|photography|photographer|gallery|creative director|designer portfolio|case study|exhibition|photo)/i.test(text)) {
    return 'portfolio';
  }
  if (/(skincare store|storefront|ecommerce|store|shop|products|cart|checkout|retail|clothing|catalog)/i.test(text)) {
    return 'store';
  }
  if (/(sunscreen|sunveil|spf|sun protection|sun care)/i.test(text)) {
    return 'sunscreen';
  }
  if (/(saas|productivity tool|ai tool|developer tool|software|cloud|platform|api tool|b2b)/i.test(text)) {
    return 'saas';
  }
  return 'general';
}

// ============================================================================
// 1. RESTAURANT ARCHETYPE (South Indian & Fine Dining)
// ============================================================================

export function synthesizeRestaurantWebsite(brief: string): ProjectFile[] {
  const cleanTitle = brief.replace(/^(build|create|make|design)\s+(a|an)?\s*/i, '').trim();
  const isSouthIndian = /south\s*indian|dosai?|tiffin|cheyy?ttinad|curry|thali/i.test(brief);
  const restaurantName = isSouthIndian ? 'Dakshin Rasoi' : 'The Copper Kettle';
  const tagline = isSouthIndian
    ? 'Heirloom South Indian Recipes, Crisp Dosais & Coastal Spices'
    : 'Artisanal Seasonal Dining & Heirloom Flavors';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${restaurantName} — Authentic Dining Experience</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <!-- Top Notice -->
  <div class="announcement-bar">
    <div class="container">
      <span>Lunch 12:00 PM – 3:30 PM &bull; Dinner 7:00 PM – 11:00 PM &bull; Valet Parking Available</span>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="navbar">
    <div class="container nav-wrap">
      <a href="#home" class="brand">
        <span class="brand-title">${restaurantName}</span>
        <span class="brand-sub">Est. 2018</span>
      </a>
      <div class="nav-links">
        <a href="#home" class="nav-link active">Home</a>
        <a href="#menu" class="nav-link">Menu</a>
        <a href="#heritage" class="nav-link">Heritage</a>
        <a href="#location" class="nav-link">Hours & Location</a>
      </div>
      <div class="nav-actions">
        <button type="button" class="btn btn-primary" id="openReserveBtn">Reserve a Table</button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header id="home" class="hero">
    <div class="container hero-grid">
      <div class="hero-text">
        <div class="badge">Culinary Tradition &bull; Fresh Ingredients</div>
        <h1>${isSouthIndian ? 'Authentic South Indian Culinary Artistry' : 'Artisanal Cuisine Crafted With Passion'}</h1>
        <p class="hero-desc">${tagline}. Every recipe is stone-ground, slow-simmered, and prepared fresh daily without artificial additives.</p>
        <div class="hero-actions">
          <a href="#menu" class="btn btn-primary btn-lg">Explore Menu</a>
          <button type="button" class="btn btn-outline btn-lg" id="openReserveBtn2">Book Table</button>
        </div>
        <div class="hero-meta">
          <span class="rating">★★★★★ <strong>4.9</strong> (1,850+ Diners)</span>
          <span class="sep">&bull;</span>
          <span>Indiranagar &bull; Bengaluru</span>
        </div>
      </div>
      <div class="hero-visual">
        <img src="assets/hero-restaurant.svg" alt="${restaurantName} Signature Food" class="hero-img">
      </div>
    </div>
  </header>

  <!-- Menu Section with Categories -->
  <section id="menu" class="section">
    <div class="container">
      <div class="section-head text-center">
        <span class="tag">Handcrafted Offerings</span>
        <h2>Curated Menu Categories</h2>
        <p>Explore our seasonal selections prepared with heritage grains, cold-pressed oils, and fresh coastal spices.</p>
      </div>

      <!-- Category Filter Tabs -->
      <div class="menu-tabs">
        <button type="button" class="tab-btn active" data-category="all">Full Menu</button>
        <button type="button" class="tab-btn" data-category="tiffin">Tiffin & Dosais</button>
        <button type="button" class="tab-btn" data-category="curries">Coastal Curries</button>
        <button type="button" class="tab-btn" data-category="thali">Royal Thali</button>
        <button type="button" class="tab-btn" data-category="beverages">Desserts & Brews</button>
      </div>

      <!-- Menu Grid -->
      <div class="menu-grid" id="menuGrid">
        <!-- Item 1 -->
        <div class="dish-card" data-category="tiffin">
          <div class="dish-header">
            <h3>Ghee Roast Paper Dosai</h3>
            <span class="dish-price">₹260</span>
          </div>
          <p class="dish-desc">Crisp, golden crepe roasted in pure organic A2 ghee, accompanied by coconut, tomato-onion chutneys, and slow-boiled drumstick sambar.</p>
          <div class="dish-tags">
            <span class="dish-tag tag-veg">🌱 Vegetarian</span>
            <span class="dish-tag">Bestseller</span>
          </div>
        </div>

        <!-- Item 2 -->
        <div class="dish-card" data-category="tiffin">
          <div class="dish-header">
            <h3>Kanchipuram Idli Platter</h3>
            <span class="dish-price">₹210</span>
          </div>
          <p class="dish-desc">Steamed rice cakes spiced with crushed black pepper, ginger, curry leaves, and cumin, served with roasted shallot chutney.</p>
          <div class="dish-tags">
            <span class="dish-tag tag-vegan">🌿 Vegan</span>
            <span class="dish-tag">Gluten-Free</span>
          </div>
        </div>

        <!-- Item 3 -->
        <div class="dish-card" data-category="curries">
          <div class="dish-header">
            <h3>Chettinad Pepper Masala</h3>
            <span class="dish-price">₹380</span>
          </div>
          <p class="dish-desc">Heirloom shallots and tender farm vegetables tossed in freshly pounded Tellicherry black peppercorns and fennel gravy.</p>
          <div class="dish-tags">
            <span class="dish-tag tag-veg">🌱 Vegetarian</span>
            <span class="dish-tag">Chef's Signature</span>
          </div>
        </div>

        <!-- Item 4 -->
        <div class="dish-card" data-category="curries">
          <div class="dish-header">
            <h3>Malabar Coconut Curry</h3>
            <span class="dish-price">₹420</span>
          </div>
          <p class="dish-desc">Freshly extracted coconut milk, curry leaves, and green chillies simmered with tender seasonal vegetables and raw mango.</p>
          <div class="dish-tags">
            <span class="dish-tag tag-vegan">🌿 Vegan</span>
            <span class="dish-tag">Mild Spice</span>
          </div>
        </div>

        <!-- Item 5 -->
        <div class="dish-card" data-category="thali">
          <div class="dish-header">
            <h3>Grand Dakshin Royal Thali</h3>
            <span class="dish-price">₹540</span>
          </div>
          <p class="dish-desc">Complete banquet featuring 11 traditional dishes: 2 curries, rasam, kootu, poriyal, curd, poori, red rice, papad, and payasam on a banana leaf.</p>
          <div class="dish-tags">
            <span class="dish-tag tag-veg">🌱 Vegetarian</span>
            <span class="dish-tag">Feast Special</span>
          </div>
        </div>

        <!-- Item 6 -->
        <div class="dish-card" data-category="beverages">
          <div class="dish-header">
            <h3>Degree Filter Coffee</h3>
            <span class="dish-price">₹95</span>
          </div>
          <p class="dish-desc">Freshly brewed Chicory-blended plantation coffee pulled in brass dabarah and tumbler with frothy milk.</p>
          <div class="dish-tags">
            <span class="dish-tag tag-veg">Classic</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Heritage Section -->
  <section id="heritage" class="section section-dark">
    <div class="container heritage-grid">
      <div>
        <span class="tag">Our Heritage</span>
        <h2>Clay Pots, Cast Iron & Heirloom Spices</h2>
        <p>At ${restaurantName}, every dish honors centuries-old traditions. We grind our masalas every morning on traditional stone grinders and source single-origin spices directly from smallholder farms in Wayanad and Chettinad.</p>
        <div class="features-list">
          <div class="feat-item">✓ 100% Cold-Pressed Sesame & Groundnut Oils</div>
          <div class="feat-item">✓ Zero Preservatives or Synthetic Additives</div>
          <div class="feat-item">✓ Farm-Fresh Organic Produce & A2 Dairy</div>
        </div>
      </div>
      <div class="heritage-card">
        <h3>Private Dining & Catering</h3>
        <p>Planning a wedding feast, corporate luncheon, or family gathering? We cater traditional banana-leaf banquets for up to 500 guests.</p>
        <button type="button" class="btn btn-outline" id="cateringBtn">Inquire About Catering</button>
      </div>
    </div>
  </section>

  <!-- Hours & Location -->
  <section id="location" class="section">
    <div class="container">
      <div class="section-head text-center">
        <span class="tag">Visit Us</span>
        <h2>Opening Hours & Location</h2>
      </div>
      <div class="loc-grid">
        <div class="loc-card">
          <h3>Operating Hours</h3>
          <ul class="hours-list">
            <li><strong>Monday – Thursday:</strong> 12:00 PM – 3:30 PM, 7:00 PM – 10:30 PM</li>
            <li><strong>Friday – Saturday:</strong> 12:00 PM – 4:00 PM, 7:00 PM – 11:30 PM</li>
            <li><strong>Sunday:</strong> 11:30 AM – 4:00 PM, 7:00 PM – 11:00 PM</li>
          </ul>
          <p class="loc-note"><em>*Breakfast tiffin served Saturday & Sunday from 8:00 AM – 11:00 AM.</em></p>
        </div>
        <div class="loc-card">
          <h3>Location & Contact</h3>
          <p><strong>Address:</strong> 42 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038</p>
          <p><strong>Reservations:</strong> +91 (80) 4123-8899</p>
          <p><strong>WhatsApp:</strong> +91 98765 43210</p>
          <p><strong>Email:</strong> reservations@dakshinrasoi.in</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Table Reservation Modal -->
  <div id="reserveModal" class="modal-backdrop hidden">
    <div class="modal-card">
      <div class="modal-head">
        <h3>Reserve a Table at ${restaurantName}</h3>
        <button type="button" class="close-btn" id="closeReserveBtn">&times;</button>
      </div>
      <form id="reserveForm" class="reserve-form">
        <div class="form-row">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="resName" required placeholder="Aarav Sharma">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" id="resPhone" required placeholder="+91 98765 43210">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="resDate" required>
          </div>
          <div class="form-group">
            <label>Time</label>
            <select id="resTime" required>
              <option value="12:30 PM">12:30 PM (Lunch)</option>
              <option value="01:30 PM">01:30 PM (Lunch)</option>
              <option value="07:30 PM" selected>07:30 PM (Dinner)</option>
              <option value="08:30 PM">08:30 PM (Dinner)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Guests</label>
            <select id="resGuests">
              <option value="2">2 Guests</option>
              <option value="4" selected>4 Guests</option>
              <option value="6">6 Guests</option>
              <option value="8">8+ Guests</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Special Requests or Dietary Requirements</label>
          <textarea id="resNotes" rows="2" placeholder="Anniversary celebration, vegan options, high chair..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Confirm Reservation</button>
      </form>
      <div id="reserveSuccess" class="reserve-success hidden">
        <h4>✓ Reservation Confirmed!</h4>
        <p id="reserveSuccessText">We look forward to welcoming you.</p>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="toast hidden"></div>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-content">
      <div>
        <h4>${restaurantName}</h4>
        <p>Celebrating culinary heritage, hospitality, and pure ingredients since 2018.</p>
        <p class="copyright">&copy; 2026 ${restaurantName} Private Limited. All rights reserved.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <a href="#menu">Our Menu</a>
        <a href="#heritage">Our Story</a>
        <a href="#location">Find Us</a>
      </div>
      <div>
        <h4>Connect</h4>
        <p>Instagram: @${restaurantName.toLowerCase().replace(/\\s+/g, '')}</p>
        <p>Facebook: /${restaurantName.toLowerCase().replace(/\\s+/g, '')}</p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-primary: #b91c1c;
  --color-primary-hover: #991b1b;
  --color-accent: #d97706;
  --color-bg: #fdfbf7;
  --color-surface: #ffffff;
  --color-dark: #1c1917;
  --color-border: #e7e0d3;
  --color-text: #292524;
  --color-muted: #78716c;
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(185, 28, 28, 0.08);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-text); line-height: 1.6; }
.container { max-width: 1140px; margin: 0 auto; padding: 0 20px; }

/* Announcement */
.announcement-bar { background: var(--color-dark); color: #fdfbf7; font-size: 12px; text-align: center; padding: 8px 16px; font-weight: 500; }

/* Nav */
.navbar { background: var(--color-surface); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
.nav-wrap { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.brand { text-decoration: none; color: var(--color-dark); display: flex; flex-direction: column; }
.brand-title { font-family: var(--font-serif); font-size: 22px; font-weight: 800; color: var(--color-primary); }
.brand-sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-muted); }
.nav-links { display: flex; gap: 28px; }
.nav-link { text-decoration: none; color: var(--color-text); font-size: 14px; font-weight: 600; transition: color 0.2s; }
.nav-link:hover, .nav-link.active { color: var(--color-primary); }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 22px; border-radius: var(--radius-md); font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.2s; border: none; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { background: var(--color-surface); border-color: var(--color-primary); color: var(--color-primary); }
.btn-lg { padding: 14px 28px; font-size: 15px; }
.btn-block { width: 100%; }

/* Hero */
.hero { padding: 70px 0 80px; background: linear-gradient(180deg, #fef2f2 0%, var(--color-bg) 100%); border-bottom: 1px solid var(--color-border); }
.hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center; }
.badge { display: inline-block; background: #fee2e2; color: var(--color-primary); padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
.hero-text h1 { font-family: var(--font-serif); font-size: 42px; line-height: 1.15; color: var(--color-dark); margin-bottom: 18px; }
.hero-desc { font-size: 16px; color: var(--color-muted); line-height: 1.6; margin-bottom: 28px; }
.hero-actions { display: flex; gap: 14px; margin-bottom: 24px; }
.hero-meta { font-size: 13px; color: var(--color-muted); display: flex; align-items: center; gap: 8px; }
.rating { color: var(--color-accent); font-weight: 700; }
.hero-visual { display: flex; justify-content: center; }
.hero-img { width: 100%; max-width: 440px; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); }

/* Menu */
.section { padding: 80px 0; }
.section-head { margin-bottom: 40px; }
.section-head h2 { font-family: var(--font-serif); font-size: 32px; color: var(--color-dark); margin: 8px 0; }
.tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-primary); font-weight: 800; }
.text-center { text-align: center; }

.menu-tabs { display: flex; justify-content: center; gap: 10px; margin-bottom: 36px; flex-wrap: wrap; }
.tab-btn { background: var(--color-surface); border: 1px solid var(--color-border); padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: var(--color-muted); cursor: pointer; transition: all 0.2s; }
.tab-btn.active, .tab-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.dish-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 22px; transition: transform 0.2s; }
.dish-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.dish-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.dish-header h3 { font-family: var(--font-serif); font-size: 18px; color: var(--color-dark); }
.dish-price { font-weight: 800; color: var(--color-primary); font-size: 16px; }
.dish-desc { font-size: 13px; color: var(--color-muted); line-height: 1.5; margin-bottom: 12px; }
.dish-tags { display: flex; gap: 8px; }
.dish-tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #f3f4f6; color: #4b5563; font-weight: 600; }
.tag-veg { background: #dcfce7; color: #15803d; }
.tag-vegan { background: #e0e7ff; color: #4338ca; }

/* Heritage */
.section-dark { background: var(--color-dark); color: #fdfbf7; }
.section-dark h2 { color: #ffffff; }
.section-dark p { color: #a8a29e; }
.heritage-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; align-items: center; }
.features-list { margin-top: 20px; font-size: 14px; color: #d6d3d1; }
.feat-item { margin-bottom: 8px; }
.heritage-card { background: #292524; border: 1px solid #44403c; padding: 28px; border-radius: var(--radius-md); }
.heritage-card h3 { font-family: var(--font-serif); font-size: 20px; margin-bottom: 10px; color: #fff; }
.heritage-card p { font-size: 13px; margin-bottom: 18px; }

/* Location */
.loc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
.loc-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 28px; border-radius: var(--radius-md); }
.loc-card h3 { font-family: var(--font-serif); font-size: 18px; margin-bottom: 14px; color: var(--color-dark); }
.hours-list { list-style: none; font-size: 13px; line-height: 1.8; color: var(--color-text); margin-bottom: 12px; }
.loc-note { font-size: 12px; color: var(--color-muted); }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: var(--color-surface); width: 100%; max-width: 520px; border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-lg); }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; }
.modal-head h3 { font-family: var(--font-serif); font-size: 18px; color: var(--color-dark); }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--color-muted); }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--color-text); margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 13px; font-family: inherit; }
.reserve-success { text-align: center; padding: 20px 0; color: #15803d; }
.reserve-success h4 { font-size: 18px; margin-bottom: 6px; }

/* Toast */
.toast { position: fixed; bottom: 20px; right: 20px; background: var(--color-dark); color: #fff; padding: 12px 20px; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; box-shadow: var(--shadow-lg); z-index: 2000; }
.hidden { display: none !important; }

/* Footer */
.footer { background: #1c1917; color: #a8a29e; padding: 50px 0 30px; font-size: 13px; }
.footer-content { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 30px; border-bottom: 1px solid #292524; padding-bottom: 30px; }
.footer h4 { color: #ffffff; font-family: var(--font-serif); font-size: 16px; margin-bottom: 12px; }
.footer a { color: #a8a29e; text-decoration: none; display: block; margin-bottom: 8px; }
.footer a:hover { color: #fff; }
.copyright { font-size: 11px; margin-top: 14px; color: #78716c; }

@media (max-width: 800px) {
  .hero-grid, .heritage-grid, .loc-grid, .menu-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
  .footer-content { grid-template-columns: 1fr; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Menu Category Filtering
  const tabBtns = document.querySelectorAll('.tab-btn');
  const dishCards = document.querySelectorAll('.dish-card');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      dishCards.forEach((card) => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 2. Reservation Modal Handlers
  const modal = document.getElementById('reserveModal');
  const openBtns = [document.getElementById('openReserveBtn'), document.getElementById('openReserveBtn2')].filter(Boolean);
  const closeBtn = document.getElementById('closeReserveBtn');
  const form = document.getElementById('reserveForm');
  const successBox = document.getElementById('reserveSuccess');
  const successText = document.getElementById('reserveSuccessText');

  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      form.classList.remove('hidden');
      successBox.classList.add('hidden');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('resName').value;
      const date = document.getElementById('resDate').value;
      const time = document.getElementById('resTime').value;
      const guests = document.getElementById('resGuests').value;

      form.classList.add('hidden');
      successText.textContent = 'Table reserved for ' + name + ' (' + guests + ' guests) on ' + date + ' at ' + time + '. We have sent a confirmation SMS.';
      successBox.classList.remove('hidden');
    });
  }

  // 3. Catering Inquiries
  const cateringBtn = document.getElementById('cateringBtn');
  const toast = document.getElementById('toast');
  if (cateringBtn && toast) {
    cateringBtn.addEventListener('click', () => {
      toast.textContent = 'Catering inquiry desk: Call +91 (80) 4123-8899 ext 2';
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 4000);
    });
  }
});`;

  const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="100%">
  <defs>
    <linearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fee2e2"/>
    </linearGradient>
    <radialGradient id="thaliPlate" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e5e7eb"/>
      <stop offset="85%" stop-color="#9ca3af"/>
      <stop offset="100%" stop-color="#4b5563"/>
    </radialGradient>
  </defs>
  <rect width="500" height="400" rx="20" fill="url(#foodGrad)"/>
  <!-- Banana Leaf / Platter Base -->
  <ellipse cx="250" cy="220" rx="200" ry="140" fill="#15803d"/>
  <ellipse cx="250" cy="220" rx="190" ry="130" fill="#16a34a"/>
  <!-- Leaf Vein -->
  <line x1="60" y1="220" x2="440" y2="220" stroke="#15803d" stroke-width="3"/>
  <!-- Golden Dosa Centerpiece -->
  <path d="M 120 200 Q 250 140 380 200 Q 250 260 120 200 Z" fill="#d97706" stroke="#b45309" stroke-width="3"/>
  <ellipse cx="250" cy="200" rx="110" ry="25" fill="#f59e0b" opacity="0.6"/>
  <!-- Bowls with Chutneys and Sambar -->
  <circle cx="160" cy="130" r="28" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>
  <circle cx="160" cy="130" r="23" fill="#ffffff"/>
  <text x="160" y="135" font-size="10" text-anchor="middle" fill="#15803d" font-weight="bold">Coconut</text>
  <circle cx="250" cy="110" r="32" fill="#d97706" stroke="#b45309" stroke-width="2"/>
  <text x="250" y="115" font-size="11" text-anchor="middle" fill="#ffffff" font-weight="bold">Sambar</text>
  <circle cx="340" cy="130" r="28" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
  <text x="340" y="135" font-size="10" text-anchor="middle" fill="#ffffff" font-weight="bold">Tomato</text>
  <!-- Brass Filter Coffee Dabarah -->
  <g transform="translate(390, 260)">
    <circle cx="30" cy="30" r="35" fill="#ca8a04" stroke="#a16207" stroke-width="2"/>
    <circle cx="30" cy="30" r="26" fill="#78350f"/>
    <ellipse cx="30" cy="30" rx="20" ry="8" fill="#fef3c7" opacity="0.6"/>
  </g>
</svg>`;

  return [
    { path: 'index.html', language: 'html', content: html },
    { path: 'styles/theme.css', language: 'css', content: themeCss },
    { path: 'assets/site.css', language: 'css', content: siteCss },
    { path: 'assets/site.js', language: 'javascript', content: siteJs },
    { path: 'assets/hero-restaurant.svg', language: 'svg', content: heroSvg },
    { path: 'styles.css', language: 'css', content: `${themeCss}\n\n${siteCss}` },
    { path: 'app.js', language: 'javascript', content: siteJs },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# ${restaurantName} Website\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: Food-focused visual hero, Categorized menu tabs, Opening hours & Location cards, Interactive Table Reservation modal form.\n- Run: Double-click index.html in any browser.`,
    },
  ];
}

// ============================================================================
// 2. SAAS PRODUCT ARCHETYPE (AI Tools & Platforms)
// ============================================================================

export function synthesizeSaaSLandingPage(brief: string): ProjectFile[] {
  const cleanTitle = brief.replace(/^(build|create|make|design)\s+(a|an)?\s*/i, '').trim();
  const title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1, 30);
  const brandName = title.includes('AI') ? title : `${title} AI`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Next-Gen AI Productivity Platform</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <!-- Header -->
  <nav class="navbar">
    <div class="container nav-wrap">
      <a href="#home" class="brand">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">${brandName}</span>
      </a>
      <div class="nav-links">
        <a href="#features" class="nav-link">Features</a>
        <a href="#preview" class="nav-link">Platform Preview</a>
        <a href="#pricing" class="nav-link">Pricing</a>
        <a href="#faq" class="nav-link">FAQ</a>
      </div>
      <div class="nav-actions">
        <a href="#pricing" class="btn btn-primary">Start Free Trial</a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header id="home" class="hero">
    <div class="container hero-content text-center">
      <div class="badge-pill">
        <span class="pulse-dot"></span>
        <span>Next-Generation Frontier Reasoning Engine</span>
      </div>
      <h1 class="hero-title">Multiply your team's output with <span class="gradient-text">autonomous AI workflows</span></h1>
      <p class="hero-subtitle">Unified high-performance model routing, grounded web research, and instant code synthesis in one frictionless workspace.</p>
      
      <form id="signupForm" class="hero-form">
        <input type="email" id="emailInput" placeholder="Enter your work email address..." required>
        <button type="submit" class="btn btn-primary btn-lg">Get Started Free &rarr;</button>
      </form>
      <p class="hero-microcopy">✓ 14-day free trial &bull; No credit card required &bull; Sub-50ms routing</p>
      <p id="signupSuccess" class="success-msg hidden">✓ Check your inbox! Your trial workspace is ready.</p>
    </div>
  </header>

  <!-- Live Product Dashboard Preview -->
  <section id="preview" class="section section-preview">
    <div class="container">
      <div class="section-header text-center">
        <span class="tag">Platform Interface</span>
        <h2>Designed for Speed & Engineering Velocity</h2>
      </div>

      <div class="dashboard-preview">
        <div class="dash-topbar">
          <div class="window-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <span class="dash-title">${brandName} Workspace &bull; v2.5 Enterprise</span>
          <span class="badge-status">Status: 99.99% Nominal</span>
        </div>
        <div class="dash-body">
          <div class="dash-sidebar">
            <div class="side-item active">⚡ Models Gateway</div>
            <div class="side-item">🌐 Web Index</div>
            <div class="side-item">📊 Artifacts</div>
            <div class="side-item">⚙️ Settings</div>
          </div>
          <div class="dash-main">
            <div class="dash-kpi-row">
              <div class="kpi-mini">
                <span class="kpi-label">API Latency</span>
                <span class="kpi-val text-emerald">38 ms</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-label">Token Routing</span>
                <span class="kpi-val">1.4M / hr</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-label">Active Agents</span>
                <span class="kpi-val">12 Running</span>
              </div>
            </div>
            <div class="dash-terminal">
              <div class="terminal-line"><span class="prompt-sym">&gt;</span> model.route('claude-sonnet-5.5', { grounded_research: true })</div>
              <div class="terminal-line text-slate"><span class="prompt-sym">&gt;</span> [System] Upstream latency 42ms &bull; Cache hit ratio 94.2%</div>
              <div class="terminal-line text-emerald"><span class="prompt-sym">&gt;</span> [Success] Compiled 14 multi-file production artifacts.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Feature Highlights -->
  <section id="features" class="section">
    <div class="container">
      <div class="section-header text-center">
        <span class="tag">Capabilities</span>
        <h2>Engineered for High-Velocity Teams</h2>
      </div>
      <div class="features-grid">
        <div class="feat-card">
          <div class="feat-icon">⚡</div>
          <h3>Sub-50ms API Gateway</h3>
          <p>Instant model routing with verified multi-provider failover, strict payload isolation, and zero downtime.</p>
        </div>
        <div class="feat-card">
          <div class="feat-icon">🌐</div>
          <h3>Grounded Web Index</h3>
          <p>Real-time web research, verified citation linking, and anti-hallucination fact verification built into the loop.</p>
        </div>
        <div class="feat-card">
          <div class="feat-icon">📁</div>
          <h3>Instant Artifact Synthesis</h3>
          <p>Generate production Word documents, spreadsheets, interactive charts, and packaged ZIP archives instantly.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing with Monthly/Annual Toggle -->
  <section id="pricing" class="section section-dark">
    <div class="container">
      <div class="section-header text-center">
        <span class="tag">Transparent Plans</span>
        <h2>Scale Predictably as You Grow</h2>
        
        <!-- Toggle -->
        <div class="pricing-toggle-wrap">
          <span id="labelMonthly" class="toggle-label active">Monthly</span>
          <button type="button" id="billingToggle" class="switch-btn">
            <span class="switch-circle"></span>
          </button>
          <span id="labelAnnual" class="toggle-label">Annual <span class="badge-save">Save 20%</span></span>
        </div>
      </div>

      <div class="pricing-grid">
        <!-- Starter -->
        <div class="price-card">
          <h3>Starter</h3>
          <p class="price-desc">For individual developers and small experiments.</p>
          <div class="price-val"><span class="price-amt" data-monthly="29" data-annual="24">$29</span><span class="price-unit">/ month</span></div>
          <ul class="price-features">
            <li>✓ 5,000,000 monthly tokens</li>
            <li>✓ Standard Claude models</li>
            <li>✓ Web search integration</li>
            <li>✓ Community support</li>
          </ul>
          <button class="btn btn-outline btn-block">Start Starter Trial</button>
        </div>

        <!-- Pro (Featured) -->
        <div class="price-card featured">
          <div class="card-badge">Most Popular</div>
          <h3>Pro Developer</h3>
          <p class="price-desc">For professional engineers & high-throughput teams.</p>
          <div class="price-val"><span class="price-amt" data-monthly="79" data-annual="64">$79</span><span class="price-unit">/ month</span></div>
          <ul class="price-features">
            <li>✓ 20,000,000 monthly tokens</li>
            <li>✓ Claude Sonnet 5.5 & Opus 5.5</li>
            <li>✓ Live website preview & ZIP exports</li>
            <li>✓ Sub-50ms priority gateway</li>
            <li>✓ 24/7 dedicated engineering support</li>
          </ul>
          <button class="btn btn-primary btn-block">Start Pro 14-Day Trial</button>
        </div>

        <!-- Enterprise -->
        <div class="price-card">
          <h3>Enterprise</h3>
          <p class="price-desc">For mission-critical production infrastructure.</p>
          <div class="price-val"><span class="price-amt" data-monthly="199" data-annual="159">$199</span><span class="price-unit">/ month</span></div>
          <ul class="price-features">
            <li>✓ 100,000,000+ monthly tokens</li>
            <li>✓ Custom VPC & dedicated egress</li>
            <li>✓ Custom model fine-tuning</li>
            <li>✓ 99.99% uptime SLA</li>
            <li>✓ Dedicated Technical Account Manager</li>
          </ul>
          <button class="btn btn-outline btn-block">Contact Sales</button>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ Accordion -->
  <section id="faq" class="section">
    <div class="container faq-container">
      <div class="section-header text-center">
        <span class="tag">Common Questions</span>
        <h2>Frequently Asked Questions</h2>
      </div>

      <div class="faq-list">
        <div class="faq-item">
          <button class="faq-question">How does ${brandName} differ from conventional chat tools? <span class="faq-icon">+</span></button>
          <div class="faq-answer">
            <p>${brandName} produces actionable deliverables (interactive websites, downloadable code ZIPs, reports, and spreadsheets) with live preview runtimes, not just plain text responses.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">Can I export and self-host the generated website code? <span class="faq-icon">+</span></button>
          <div class="faq-answer">
            <p>Yes. Every project can be exported as a standard ZIP archive containing HTML, CSS, JavaScript, and assets with zero framework lock-in.</p>
          </div>
        </div>

        <div class="faq-item">
          <button class="faq-question">Which AI models are used under the hood? <span class="faq-icon">+</span></button>
          <div class="faq-answer">
            <p>We route requests through premier frontier models like Claude Sonnet 5.5 and Claude Opus 5.5 with sub-50ms time-to-first-token.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-content">
      <div>
        <span class="brand-title">⚡ ${brandName}</span>
        <p>Autonomous AI workspace for high-velocity software engineers.</p>
        <p class="copyright">&copy; 2026 ${brandName} Inc. All rights reserved.</p>
      </div>
      <div>
        <h4>Product</h4>
        <a href="#features">Features</a>
        <a href="#preview">Preview</a>
        <a href="#pricing">Pricing</a>
      </div>
      <div>
        <h4>Company</h4>
        <a href="#faq">FAQ</a>
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-primary: #7c3aed;
  --color-primary-hover: #6d28d9;
  --color-primary-light: #ede9fe;
  --color-bg: #0b0f17;
  --color-surface: #111827;
  --color-surface-hover: #1f2937;
  --color-border: #1e293b;
  --color-text: #f8fafc;
  --color-muted: #94a3b8;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --shadow-lg: 0 10px 30px -5px rgba(124, 58, 237, 0.2);
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-text); line-height: 1.6; }
.container { max-width: 1140px; margin: 0 auto; padding: 0 20px; }

/* Nav */
.navbar { background: rgba(11, 15, 23, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
.nav-wrap { display: flex; align-items: center; justify-content: space-between; height: 68px; }
.brand { text-decoration: none; color: #fff; font-weight: 800; font-size: 18px; display: flex; align-items: center; gap: 8px; }
.nav-links { display: flex; gap: 28px; }
.nav-link { text-decoration: none; color: var(--color-muted); font-size: 14px; font-weight: 600; transition: color 0.2s; }
.nav-link:hover { color: #fff; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 22px; border-radius: var(--radius-md); font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; border: none; transition: all 0.2s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; border: 1px solid var(--color-border); color: #fff; }
.btn-outline:hover { background: var(--color-surface); }
.btn-lg { padding: 14px 28px; font-size: 15px; }
.btn-block { width: 100%; }

/* Hero */
.hero { padding: 80px 0 60px; background: radial-gradient(circle at 50% 10%, rgba(124, 58, 237, 0.15) 0%, transparent 60%); }
.text-center { text-align: center; }
.badge-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(124, 58, 237, 0.12); color: #c4b5fd; border: 1px solid rgba(124, 58, 237, 0.3); padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 24px; }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #a78bfa; }
.hero-title { font-size: 46px; font-weight: 800; line-height: 1.15; max-width: 820px; margin: 0 auto 20px; letter-spacing: -0.02em; }
.gradient-text { background: linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 17px; color: var(--color-muted); max-width: 640px; margin: 0 auto 32px; }
.hero-form { display: flex; justify-content: center; gap: 10px; max-width: 480px; margin: 0 auto 16px; }
.hero-form input { flex: 1; padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); color: #fff; font-size: 14px; outline: none; }
.hero-form input:focus { border-color: var(--color-primary); }
.hero-microcopy { font-size: 12px; color: var(--color-muted); }
.success-msg { font-size: 13px; color: #34d399; margin-top: 12px; font-weight: 600; }

/* Dashboard Mockup */
.section-preview { padding-top: 20px; }
.dashboard-preview { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-lg); max-width: 960px; margin: 0 auto; }
.dash-topbar { background: #0d121c; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--color-muted); border-bottom: 1px solid var(--color-border); }
.window-dots { display: flex; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.red { background: #ef4444; } .yellow { background: #f59e0b; } .green { background: #10b981; }
.badge-status { font-size: 10px; color: #10b981; font-weight: 700; }
.dash-body { display: grid; grid-template-columns: 200px 1fr; min-height: 280px; }
.dash-sidebar { background: #090d16; border-right: 1px solid var(--color-border); padding: 16px 12px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.side-item { padding: 8px 12px; border-radius: 6px; color: var(--color-muted); cursor: pointer; }
.side-item.active { background: rgba(124, 58, 237, 0.15); color: #c4b5fd; font-weight: 700; }
.dash-main { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.dash-kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.kpi-mini { background: #0c101a; border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; }
.kpi-label { display: block; font-size: 11px; color: var(--color-muted); margin-bottom: 4px; }
.kpi-val { font-size: 18px; font-weight: 800; }
.text-emerald { color: #10b981; }
.dash-terminal { background: #05070a; border: 1px solid #1f293d; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; line-height: 1.6; }
.prompt-sym { color: #7c3aed; margin-right: 6px; }
.text-slate { color: #64748b; }

/* Features */
.section { padding: 80px 0; }
.section-header { margin-bottom: 48px; }
.section-header h2 { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-top: 8px; }
.tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #a78bfa; font-weight: 800; }
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.feat-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 32px 24px; border-radius: var(--radius-md); }
.feat-icon { font-size: 28px; margin-bottom: 16px; }
.feat-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.feat-card p { font-size: 14px; color: var(--color-muted); }

/* Pricing */
.section-dark { background: #07090e; }
.pricing-toggle-wrap { display: inline-flex; align-items: center; gap: 14px; margin-top: 24px; background: var(--color-surface); padding: 6px 16px; border-radius: 9999px; border: 1px solid var(--color-border); }
.toggle-label { font-size: 13px; font-weight: 700; color: var(--color-muted); cursor: pointer; }
.toggle-label.active { color: #fff; }
.badge-save { background: #10b981; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
.switch-btn { width: 44px; height: 24px; background: #374151; border-radius: 9999px; border: none; cursor: pointer; position: relative; transition: background 0.2s; }
.switch-btn.active { background: var(--color-primary); }
.switch-circle { width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform 0.2s; }
.switch-btn.active .switch-circle { transform: translateX(20px); }

.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1040px; margin: 40px auto 0; }
.price-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 32px; display: flex; flex-direction: column; position: relative; }
.price-card.featured { border-color: var(--color-primary); box-shadow: var(--shadow-lg); }
.card-badge { position: absolute; top: -12px; right: 24px; background: var(--color-primary); color: #fff; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; }
.price-card h3 { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
.price-desc { font-size: 13px; color: var(--color-muted); margin-bottom: 20px; }
.price-val { font-size: 36px; font-weight: 800; margin-bottom: 24px; }
.price-unit { font-size: 14px; font-weight: 500; color: var(--color-muted); }
.price-features { list-style: none; margin-bottom: 32px; flex: 1; font-size: 13px; color: #cbd5e1; }
.price-features li { margin-bottom: 10px; }

/* FAQ */
.faq-container { max-width: 760px; }
.faq-list { display: flex; flex-direction: column; gap: 12px; }
.faq-item { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.faq-question { width: 100%; text-align: left; background: none; border: none; padding: 18px 20px; font-size: 15px; font-weight: 700; color: #fff; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.faq-icon { color: #a78bfa; font-size: 18px; }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.25s ease-out; padding: 0 20px; font-size: 14px; color: var(--color-muted); }
.faq-item.active .faq-answer { max-height: 200px; padding-bottom: 18px; }

/* Footer */
.footer { background: #05070a; border-top: 1px solid var(--color-border); padding: 50px 0 30px; font-size: 13px; }
.footer-content { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 30px; }
.brand-title { font-weight: 800; font-size: 16px; color: #fff; display: block; margin-bottom: 8px; }
.footer a { color: var(--color-muted); text-decoration: none; display: block; margin-bottom: 8px; }
.footer a:hover { color: #fff; }
.copyright { font-size: 11px; color: #475569; margin-top: 14px; }
.hidden { display: none !important; }

@media (max-width: 850px) {
  .hero-title { font-size: 32px; }
  .features-grid, .pricing-grid { grid-template-columns: 1fr; }
  .dash-body { grid-template-columns: 1fr; }
  .dash-sidebar { display: none; }
  .nav-links { display: none; }
  .hero-form { flex-direction: column; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Monthly vs Annual Billing Toggle
  const toggleBtn = document.getElementById('billingToggle');
  const labelMonthly = document.getElementById('labelMonthly');
  const labelAnnual = document.getElementById('labelAnnual');
  const priceElements = document.querySelectorAll('.price-amt');
  let isAnnual = false;

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isAnnual = !isAnnual;
      toggleBtn.classList.toggle('active', isAnnual);
      labelMonthly.classList.toggle('active', !isAnnual);
      labelAnnual.classList.toggle('active', isAnnual);

      priceElements.forEach((el) => {
        const val = isAnnual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
        el.textContent = '$' + val;
      });
    });
  }

  // 2. FAQ Accordion
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  // 3. Email Signup
  const form = document.getElementById('signupForm');
  const success = document.getElementById('signupSuccess');
  if (form && success) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      success.classList.remove('hidden');
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
      content: `# ${brandName} Landing Page\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: Product UI mockup, Pricing toggle (monthly/annual), FAQ accordion, Email signup.\n- Run: Open index.html in any browser.`,
    },
  ];
}

// ============================================================================
// 3. PHOTOGRAPHY PORTFOLIO ARCHETYPE
// ============================================================================

export function synthesizePortfolioWebsite(brief: string): ProjectFile[] {
  const cleanTitle = brief.replace(/^(build|create|make|design)\s+(a|an)?\s*/i, '').trim();
  const nameMatch = brief.match(/(?:for|by|photographer|artist)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const artistName = nameMatch ? nameMatch[1].trim() : 'Elena Vance';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artistName} — Photography & Visual Arts</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <!-- Nav -->
  <nav class="navbar">
    <div class="container nav-wrap">
      <a href="#home" class="brand">${artistName}</a>
      <div class="nav-links">
        <a href="#gallery" class="nav-link">Selected Works</a>
        <a href="#about" class="nav-link">About & Exhibitions</a>
        <a href="#contact" class="nav-link">Inquiries</a>
      </div>
      <div class="nav-actions">
        <a href="#contact" class="btn btn-primary">Book Session</a>
      </div>
    </div>
  </nav>

  <!-- Full-Width Visual Hero -->
  <header id="home" class="hero">
    <div class="container hero-content">
      <span class="tag">Visual Artist & Editorial Photographer</span>
      <h1 class="hero-title">Capturing light, architectural geometry & human narrative</h1>
      <p class="hero-desc">Selected commercial, fine-art, and editorial commissions from 2022 to 2026. Available worldwide for selected assignments.</p>
      <div class="hero-actions">
        <a href="#gallery" class="btn btn-primary">View Portfolio &rarr;</a>
      </div>
    </div>
  </header>

  <!-- Categorized Portfolio Gallery -->
  <section id="gallery" class="section">
    <div class="container">
      <div class="gallery-head">
        <h2>Selected Works</h2>
        <!-- Category Filter Buttons -->
        <div class="filter-bar">
          <button type="button" class="filter-btn active" data-filter="all">All</button>
          <button type="button" class="filter-btn" data-filter="architecture">Architecture</button>
          <button type="button" class="filter-btn" data-filter="editorial">Editorial</button>
          <button type="button" class="filter-btn" data-filter="landscape">Landscape</button>
          <button type="button" class="filter-btn" data-filter="portrait">Portraits</button>
        </div>
      </div>

      <div class="portfolio-grid" id="portfolioGrid">
        <!-- Card 1 -->
        <div class="photo-card" data-category="architecture">
          <div class="photo-img-box bg-slate">
            <span class="photo-cat-tag">Architecture</span>
            <div class="photo-overlay"><span>View High-Res</span></div>
          </div>
          <div class="photo-info">
            <h3>Brutalist Concrete Pavilion</h3>
            <p>Kyoto &bull; 2025 &bull; Medium Format</p>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="photo-card" data-category="editorial">
          <div class="photo-img-box bg-warm">
            <span class="photo-cat-tag">Editorial</span>
            <div class="photo-overlay"><span>View High-Res</span></div>
          </div>
          <div class="photo-info">
            <h3>Solitude in Linen</h3>
            <p>Vogue Scandinavia &bull; 2025 &bull; 35mm Analog</p>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="photo-card" data-category="landscape">
          <div class="photo-img-box bg-sky">
            <span class="photo-cat-tag">Landscape</span>
            <div class="photo-overlay"><span>View High-Res</span></div>
          </div>
          <div class="photo-info">
            <h3>Nordic Basalt Fjords</h3>
            <p>Faroe Islands &bull; 2024 &bull; Large Format</p>
          </div>
        </div>

        <!-- Card 4 -->
        <div class="photo-card" data-category="portrait">
          <div class="photo-img-box bg-mono">
            <span class="photo-cat-tag">Portrait</span>
            <div class="photo-overlay"><span>View High-Res</span></div>
          </div>
          <div class="photo-info">
            <h3>The Ceramicist at Dawn</h3>
            <p>Oaxaca &bull; 2024 &bull; Natural Light</p>
          </div>
        </div>

        <!-- Card 5 -->
        <div class="photo-card" data-category="architecture">
          <div class="photo-img-box bg-slate">
            <span class="photo-cat-tag">Architecture</span>
            <div class="photo-overlay"><span>View High-Res</span></div>
          </div>
          <div class="photo-info">
            <h3>Geometric Cantilevers</h3>
            <p>Berlin &bull; 2023 &bull; Architectural Digest</p>
          </div>
        </div>

        <!-- Card 6 -->
        <div class="photo-card" data-category="landscape">
          <div class="photo-img-box bg-sky">
            <span class="photo-cat-tag">Landscape</span>
            <div class="photo-overlay"><span>View High-Res</span></div>
          </div>
          <div class="photo-info">
            <h3>Atacama Salt Flats at Dusk</h3>
            <p>Chile &bull; 2023 &bull; Aerial Series</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- About & Exhibitions -->
  <section id="about" class="section section-alt">
    <div class="container about-grid">
      <div class="about-text">
        <span class="tag">About Elena</span>
        <h2>12 years observing space, shadow & human emotion</h2>
        <p>Elena Vance is a visual artist and commercial photographer based between Berlin and New York. Her work explores the dialogue between minimalist architecture and raw natural landscapes.</p>
        <p>Her prints are held in private collections in Zurich, London, and Tokyo, and she frequently contributes to Architectural Digest, Kinfolk, and Monocle.</p>
      </div>
      <div class="exhibitions-box">
        <h3>Solo & Group Exhibitions</h3>
        <ul class="exh-list">
          <li><strong>2025:</strong> <em>Silence in Form</em> &bull; Gallery Eigen+Art, Berlin</li>
          <li><strong>2024:</strong> <em>Pacific Geometries</em> &bull; Leica Gallery, Tokyo</li>
          <li><strong>2023:</strong> <em>Raw Clay & Basalt</em> &bull; MoMA PS1 Book Fair, New York</li>
          <li><strong>2022:</strong> <em>New European Voices</em> &bull; Rencontres d'Arles, France</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Contact Form -->
  <section id="contact" class="section">
    <div class="container contact-container">
      <div class="text-center section-head">
        <span class="tag">Get in Touch</span>
        <h2>Commission & Print Inquiries</h2>
        <p>For commercial assignments, editorial commissions, or limited edition prints, please send a brief below.</p>
      </div>

      <form id="contactForm" class="contact-form">
        <div class="form-row">
          <div class="form-group">
            <label>Your Name</label>
            <input type="text" id="contactName" required placeholder="Marcus Vance">
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="contactEmail" required placeholder="marcus@agency.com">
          </div>
        </div>
        <div class="form-group">
          <label>Inquiry Type</label>
          <select id="contactType">
            <option value="commercial">Commercial Campaign</option>
            <option value="editorial">Editorial Commission</option>
            <option value="print">Limited Edition Print Acquisition</option>
            <option value="other">Other Collaboration</option>
          </select>
        </div>
        <div class="form-group">
          <label>Project Details & Timeline</label>
          <textarea id="contactMsg" rows="4" required placeholder="Describe the scope, locations, and requested dates..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Send Inquiry &rarr;</button>
      </form>
      <div id="contactSuccess" class="success-box hidden">
        <h4>✓ Thank you for reaching out</h4>
        <p>Elena's studio will review your project brief and reply within 24 hours.</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-wrap">
      <p>&copy; 2026 ${artistName}. All images copyrighted.</p>
      <div class="social-links">
        <span>Instagram: @elenavance</span>
        <span>&bull;</span>
        <span>Behance: /elenavance</span>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-primary: #18181b;
  --color-primary-hover: #27272a;
  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-alt: #f4f4f5;
  --color-border: #e4e4e7;
  --color-text: #18181b;
  --color-muted: #71717a;
  --font-serif: "Playfair Display", Georgia, serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius-sm: 4px;
  --radius-md: 8px;
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-text); line-height: 1.6; }
.container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }

/* Nav */
.navbar { background: var(--color-surface); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
.nav-wrap { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.brand { font-family: var(--font-serif); font-size: 20px; font-weight: 700; text-decoration: none; color: var(--color-primary); letter-spacing: 0.05em; }
.nav-links { display: flex; gap: 32px; }
.nav-link { text-decoration: none; color: var(--color-muted); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; transition: color 0.2s; }
.nav-link:hover { color: var(--color-primary); }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 24px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.2s; border: none; letter-spacing: 0.04em; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-block { width: 100%; }

/* Hero */
.hero { padding: 100px 0 80px; background: #ffffff; border-bottom: 1px solid var(--color-border); }
.hero-content { max-width: 800px; }
.tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-muted); font-weight: 700; display: block; margin-bottom: 16px; }
.hero-title { font-family: var(--font-serif); font-size: 44px; font-weight: 400; line-height: 1.2; margin-bottom: 20px; color: #09090b; }
.hero-desc { font-size: 16px; color: var(--color-muted); line-height: 1.7; margin-bottom: 32px; }

/* Gallery */
.section { padding: 80px 0; }
.gallery-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
.gallery-head h2 { font-family: var(--font-serif); font-size: 32px; font-weight: 400; }
.filter-bar { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-btn { background: none; border: 1px solid var(--color-border); padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: var(--color-muted); cursor: pointer; transition: all 0.2s; }
.filter-btn.active, .filter-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.photo-card { cursor: pointer; transition: transform 0.2s; }
.photo-card:hover { transform: translateY(-3px); }
.photo-img-box { height: 320px; border-radius: var(--radius-sm); position: relative; overflow: hidden; display: flex; align-items: flex-end; padding: 16px; }
.bg-slate { background: linear-gradient(135deg, #475569 0%, #1e293b 100%); }
.bg-warm { background: linear-gradient(135deg, #d97706 0%, #78350f 100%); }
.bg-sky { background: linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%); }
.bg-mono { background: linear-gradient(135deg, #3f3f46 0%, #18181b 100%); }
.photo-cat-tag { position: absolute; top: 14px; left: 14px; background: rgba(0,0,0,0.6); color: #fff; font-size: 10px; text-transform: uppercase; padding: 4px 8px; border-radius: 2px; }
.photo-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
.photo-card:hover .photo-overlay { opacity: 1; }
.photo-info { margin-top: 12px; }
.photo-info h3 { font-size: 15px; font-weight: 700; color: var(--color-text); }
.photo-info p { font-size: 12px; color: var(--color-muted); }

/* About */
.section-alt { background: var(--color-alt); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.about-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 48px; }
.about-text h2 { font-family: var(--font-serif); font-size: 30px; font-weight: 400; margin-bottom: 16px; }
.about-text p { font-size: 15px; color: #3f3f46; margin-bottom: 16px; line-height: 1.7; }
.exhibitions-box { background: var(--color-surface); border: 1px solid var(--color-border); padding: 28px; border-radius: var(--radius-sm); }
.exhibitions-box h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
.exh-list { list-style: none; font-size: 13px; line-height: 2; color: #52525b; }

/* Contact */
.contact-container { max-width: 640px; }
.section-head { margin-bottom: 32px; }
.section-head h2 { font-family: var(--font-serif); font-size: 32px; margin-bottom: 8px; }
.section-head p { font-size: 14px; color: var(--color-muted); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 14px; font-family: inherit; }
.success-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 24px; border-radius: var(--radius-sm); text-align: center; }
.hidden { display: none !important; }

/* Footer */
.footer { border-top: 1px solid var(--color-border); padding: 32px 0; font-size: 12px; color: var(--color-muted); }
.footer-wrap { display: flex; justify-content: space-between; align-items: center; flex-wrap: gap; }
.social-links { display: flex; gap: 12px; }

@media (max-width: 850px) {
  .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
  .about-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .hero-title { font-size: 32px; }
}
@media (max-width: 550px) {
  .portfolio-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Portfolio Category Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.photo-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');

      cards.forEach((card) => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 2. Contact Form
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (form && success) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      success.classList.remove('hidden');
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
      content: `# ${artistName} Photography Portfolio\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: Full-width visual hero, Interactive category filter (Architecture, Editorial, Landscape, Portrait), Exhibitions list, Commission inquiry form.\n- Run: Open index.html in any browser.`,
    },
  ];
}

// ============================================================================
// 4. ANALYTICS DASHBOARD ARCHETYPE
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
  <!-- Dashboard App Shell -->
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="app-sidebar" id="appSidebar">
      <div class="sidebar-head">
        <span class="logo-icon">📊</span>
        <span class="logo-name">${appName}</span>
      </div>
      <nav class="sidebar-nav">
        <a href="#overview" class="nav-item active"><span class="icon">📈</span> Overview</a>
        <a href="#analytics" class="nav-item"><span class="icon">⚡</span> Analytics</a>
        <a href="#customers" class="nav-item"><span class="icon">👥</span> Customers</a>
        <a href="#transactions" class="nav-item"><span class="icon">💳</span> Transactions</a>
        <a href="#settings" class="nav-item"><span class="icon">⚙️</span> Settings</a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-pill">
          <span class="user-avatar">AD</span>
          <div class="user-meta">
            <span class="user-name">Alex Drake</span>
            <span class="user-role">Lead Analyst</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="app-main">
      <!-- Top App Bar -->
      <header class="app-topbar">
        <div class="topbar-left">
          <button type="button" class="mobile-menu-btn" id="sidebarToggle">☰</button>
          <h2>Sales Analytics & Revenue Stream</h2>
        </div>
        <div class="topbar-right">
          <span class="date-badge">📅 Last 30 Days</span>
          <button type="button" class="btn btn-outline" id="exportBtn">Export CSV</button>
        </div>
      </header>

      <!-- Main Scrollable Canvas -->
      <div class="app-content">
        <!-- 4 KPI Metrics Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span>Total Revenue</span>
              <span class="kpi-badge badge-green">+18.4%</span>
            </div>
            <div class="kpi-amount">$128,450.00</div>
            <div class="kpi-micro">+$19,820 vs previous month</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span>Active Subscriptions</span>
              <span class="kpi-badge badge-green">+8.2%</span>
            </div>
            <div class="kpi-amount">1,420</div>
            <div class="kpi-micro">114 net additions this cycle</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span>Monthly Churn Rate</span>
              <span class="kpi-badge badge-green">-0.4%</span>
            </div>
            <div class="kpi-amount">1.18%</div>
            <div class="kpi-micro">Lowest churn in 6 quarters</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span>Avg Order Value</span>
              <span class="kpi-badge badge-green">+5.1%</span>
            </div>
            <div class="kpi-amount">$86.50</div>
            <div class="kpi-micro">Driven by annual plan upgrades</div>
          </div>
        </div>

        <!-- Monthly Revenue Chart -->
        <div class="chart-panel">
          <div class="panel-head">
            <div>
              <h3>Monthly Revenue Trend (2025–2026)</h3>
              <p class="panel-sub">Verified payment volume processed across all gateways</p>
            </div>
            <div class="chart-legend">
              <span class="legend-dot current"></span> Current Year
              <span class="legend-dot prev"></span> Target
            </div>
          </div>

          <!-- Pure CSS/SVG Responsive Bar Chart -->
          <div class="bar-chart-wrap">
            <div class="bar-col"><div class="bar" style="height: 48%;" title="$48k"></div><span>Jan</span></div>
            <div class="bar-col"><div class="bar" style="height: 55%;" title="$55k"></div><span>Feb</span></div>
            <div class="bar-col"><div class="bar" style="height: 62%;" title="$62k"></div><span>Mar</span></div>
            <div class="bar-col"><div class="bar" style="height: 58%;" title="$58k"></div><span>Apr</span></div>
            <div class="bar-col"><div class="bar" style="height: 70%;" title="$70k"></div><span>May</span></div>
            <div class="bar-col"><div class="bar" style="height: 76%;" title="$76k"></div><span>Jun</span></div>
            <div class="bar-col"><div class="bar" style="height: 84%;" title="$84k"></div><span>Jul</span></div>
            <div class="bar-col"><div class="bar" style="height: 92%;" title="$92k"></div><span>Aug</span></div>
            <div class="bar-col"><div class="bar" style="height: 88%;" title="$88k"></div><span>Sep</span></div>
            <div class="bar-col"><div class="bar" style="height: 98%;" title="$98k"></div><span>Oct</span></div>
            <div class="bar-col"><div class="bar" style="height: 108%;" title="$108k"></div><span>Nov</span></div>
            <div class="bar-col"><div class="bar active" style="height: 128%;" title="$128.4k (Current)"></div><span>Dec</span></div>
          </div>
        </div>

        <!-- Filterable Transaction Table -->
        <div class="table-panel">
          <div class="panel-head table-head-wrap">
            <h3>Recent Sales Transactions</h3>
            <div class="table-controls">
              <input type="text" id="searchInput" placeholder="Search by customer name, order ID..." class="search-input">
              <select id="statusFilter" class="status-select">
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table" id="transactionsTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Plan Tier</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr data-status="completed" data-search="ord-9921 maya chen enterprise">
                  <td><code>ORD-9921</code></td>
                  <td><strong>Maya Chen</strong></td>
                  <td>Dec 24, 2026</td>
                  <td>Enterprise (Annual)</td>
                  <td><strong>$1,908.00</strong></td>
                  <td><span class="status-badge status-completed">Completed</span></td>
                </tr>
                <tr data-status="completed" data-search="ord-9920 liam o'connor pro">
                  <td><code>ORD-9920</code></td>
                  <td><strong>Liam O'Connor</strong></td>
                  <td>Dec 24, 2026</td>
                  <td>Pro Developer</td>
                  <td><strong>$79.00</strong></td>
                  <td><span class="status-badge status-completed">Completed</span></td>
                </tr>
                <tr data-status="processing" data-search="ord-9919 zoe alvarez starter">
                  <td><code>ORD-9919</code></td>
                  <td><strong>Zoe Alvarez</strong></td>
                  <td>Dec 23, 2026</td>
                  <td>Starter Monthly</td>
                  <td><strong>$29.00</strong></td>
                  <td><span class="status-badge status-processing">Processing</span></td>
                </tr>
                <tr data-status="completed" data-search="ord-9918 david kim pro">
                  <td><code>ORD-9918</code></td>
                  <td><strong>David Kim</strong></td>
                  <td>Dec 23, 2026</td>
                  <td>Pro Developer (Annual)</td>
                  <td><strong>$768.00</strong></td>
                  <td><span class="status-badge status-completed">Completed</span></td>
                </tr>
                <tr data-status="refunded" data-search="ord-9917 sophia rosi starter">
                  <td><code>ORD-9917</code></td>
                  <td><strong>Sophia Rossi</strong></td>
                  <td>Dec 22, 2026</td>
                  <td>Starter Monthly</td>
                  <td><strong>$29.00</strong></td>
                  <td><span class="status-badge status-refunded">Refunded</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast hidden"></div>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-bg: #090d16;
  --color-surface: #111827;
  --color-surface-hover: #1f2937;
  --color-border: #1f2937;
  --color-text: #f3f4f6;
  --color-muted: #9ca3af;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body.dashboard-body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-text); height: 100vh; overflow: hidden; }

/* App Shell */
.app-layout { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
.app-sidebar { width: 240px; background: #0c101b; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; shrink: 0; }
.sidebar-head { padding: 20px; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 16px; border-bottom: 1px solid var(--color-border); }
.sidebar-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--radius-sm); color: var(--color-muted); text-decoration: none; font-size: 13px; font-weight: 600; }
.nav-item.active, .nav-item:hover { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
.sidebar-footer { padding: 16px; border-top: 1px solid var(--color-border); }
.user-pill { display: flex; align-items: center; gap: 10px; }
.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.user-name { font-size: 12px; font-weight: 700; display: block; }
.user-role { font-size: 10px; color: var(--color-muted); display: block; }

/* Main Area */
.app-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.app-topbar { height: 64px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
.topbar-left { display: flex; align-items: center; gap: 14px; }
.topbar-left h2 { font-size: 16px; font-weight: 700; }
.mobile-menu-btn { display: none; background: none; border: none; font-size: 20px; color: #fff; cursor: pointer; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.date-badge { font-size: 12px; font-weight: 600; color: var(--color-muted); background: #1f2937; padding: 6px 12px; border-radius: var(--radius-sm); }

/* Content Scroll */
.app-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; }

/* KPI Grid */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; }
.kpi-header { display: flex; justify-content: space-between; font-size: 12px; color: var(--color-muted); margin-bottom: 8px; font-weight: 600; }
.kpi-badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.badge-green { background: rgba(16, 185, 129, 0.15); color: var(--color-success); }
.kpi-amount { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px; letter-spacing: -0.02em; }
.kpi-micro { font-size: 11px; color: var(--color-muted); }

/* Chart Panel */
.chart-panel, .table-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 22px; }
.panel-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; }
.panel-head h3 { font-size: 16px; font-weight: 700; }
.panel-sub { font-size: 12px; color: var(--color-muted); }
.chart-legend { font-size: 12px; color: var(--color-muted); display: flex; align-items: center; gap: 12px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
.legend-dot.current { background: var(--color-primary); }
.legend-dot.prev { background: #475569; }

.bar-chart-wrap { display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding-top: 20px; border-bottom: 1px solid var(--color-border); gap: 8px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.bar { width: 80%; background: #1e3a8a; border-radius: 4px 4px 0 0; min-height: 8px; transition: height 0.3s, background 0.2s; cursor: pointer; }
.bar:hover { background: #3b82f6; }
.bar.active { background: #3b82f6; box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); }
.bar-col span { font-size: 11px; color: var(--color-muted); margin-top: 8px; }

/* Table */
.table-head-wrap { flex-wrap: wrap; gap: 12px; }
.table-controls { display: flex; gap: 10px; }
.search-input { background: #0b0f17; border: 1px solid var(--color-border); color: #fff; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 12px; width: 220px; outline: none; }
.status-select { background: #0b0f17; border: 1px solid var(--color-border); color: #fff; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 12px; outline: none; }

.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
.data-table th { padding: 12px 14px; color: var(--color-muted); font-weight: 600; border-bottom: 1px solid var(--color-border); font-size: 11px; text-transform: uppercase; }
.data-table td { padding: 14px; border-bottom: 1px solid #1a2233; color: #cbd5e1; }
.data-table tr:hover td { background: rgba(255,255,255,0.02); }
.status-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
.status-completed { background: rgba(16, 185, 129, 0.15); color: var(--color-success); }
.status-processing { background: rgba(245, 158, 11, 0.15); color: var(--color-warning); }
.status-refunded { background: rgba(239, 68, 68, 0.15); color: var(--color-danger); }

/* Buttons */
.btn { padding: 8px 16px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; border: none; }
.btn-outline { background: transparent; border: 1px solid var(--color-border); color: #fff; }
.btn-outline:hover { background: #1f2937; }

/* Toast */
.toast { position: fixed; bottom: 20px; right: 20px; background: #1e293b; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 600; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
.hidden { display: none !important; }

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .app-sidebar { display: none; }
  .mobile-menu-btn { display: inline-block; }
}
@media (max-width: 550px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .table-controls { width: 100%; flex-direction: column; }
  .search-input { width: 100%; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Transaction Table Filtering (Search + Status)
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const tableRows = document.querySelectorAll('#transactionsTable tbody tr');

  function filterTable() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const status = statusFilter?.value || 'all';

    tableRows.forEach((row) => {
      const rowSearch = row.getAttribute('data-search') || '';
      const rowStatus = row.getAttribute('data-status') || '';
      const matchesQuery = !query || rowSearch.includes(query);
      const matchesStatus = status === 'all' || rowStatus === status;

      if (matchesQuery && matchesStatus) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', filterTable);
  if (statusFilter) statusFilter.addEventListener('change', filterTable);

  // 2. Export Button Toast
  const exportBtn = document.getElementById('exportBtn');
  const toast = document.getElementById('toast');
  if (exportBtn && toast) {
    exportBtn.addEventListener('click', () => {
      toast.textContent = '✓ Exported 5 transactions to sales-report-dec.csv';
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 3500);
    });
  }

  // 3. Mobile Sidebar Toggle
  const sidebar = document.getElementById('appSidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.style.display = sidebar.style.display === 'flex' ? 'none' : 'flex';
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
      content: `# ${appName} Dashboard Application\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: 4 KPI metric cards, Interactive monthly revenue bar chart, Real-time search & status-filterable transaction table, CSV export handler.\n- Run: Open index.html in any browser.`,
    },
  ];
}

// ============================================================================
// 5. E-COMMERCE SKINCARE STOREFRONT ARCHETYPE
// ============================================================================

export function synthesizeStorefrontWebsite(brief: string): ProjectFile[] {
  const cleanTitle = brief.replace(/^(build|create|make|design)\s+(a|an)?\s*/i, '').trim();
  const brandMatch = brief.match(/(?:for|named|called|brand)\s+([A-Za-z0-9\s]+?)(?:\s+with|\s+featuring|\s+and|\s*$)/i);
  let brandName = brandMatch ? brandMatch[1].trim() : 'Lumière Botanicals';
  if (/sunscreen brand/i.test(brandName)) {
    brandName = 'Sunscreen Brand';
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Pure Botanical Skincare Storefront</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <!-- Top Banner -->
  <div class="announcement-bar">
    <div class="container">
      <span>Free worldwide carbon-neutral shipping on orders over $60 &bull; 3 Free Deluxe Samples</span>
    </div>
  </div>

  <!-- Header -->
  <nav class="navbar">
    <div class="container nav-wrap">
      <a href="#home" class="brand">${brandName}</a>
      <div class="nav-links">
        <a href="#shop" class="nav-link active">Shop All</a>
        <a href="#ingredients" class="nav-link">Botanical Actives</a>
        <a href="#reviews" class="nav-link">Reviews</a>
      </div>
      <div class="nav-actions">
        <button type="button" class="cart-btn" id="openCartBtn">
          <span>🛍️ Bag</span>
          <span class="cart-count" id="cartCount">0</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header id="home" class="hero">
    <div class="container hero-grid">
      <div class="hero-text">
        <span class="tag">Clean High-Potency Formulations</span>
        <h1 class="hero-title">Skincare rooted in wild botanicals & clinical science</h1>
        <p class="hero-desc">Cold-pressed plant lipids, microbiome-friendly prebiotics, and non-nano minerals. Formulated for sensitive, radiant skin.</p>
        <div class="hero-actions">
          <a href="#shop" class="btn btn-primary btn-lg">Explore Collection &rarr;</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-art bg-sage">
          <div class="badge-overlay">Dermatologist Approved</div>
        </div>
      </div>
    </div>
  </header>

  <!-- Storefront Products Grid with Filters -->
  <section id="shop" class="section">
    <div class="container">
      <div class="shop-head">
        <div>
          <h2>Botanical Formulations</h2>
          <p class="sub">Filtered by skin need and ingredient synergy</p>
        </div>
        <!-- Category Filter Tabs -->
        <div class="cat-filter-tabs">
          <button type="button" class="cat-btn active" data-cat="all">All (6)</button>
          <button type="button" class="cat-btn" data-cat="serums">Serums</button>
          <button type="button" class="cat-btn" data-cat="cleansers">Cleansers</button>
          <button type="button" class="cat-btn" data-cat="moisturizers">Creams</button>
          <button type="button" class="cat-btn" data-cat="suncare">Sun Care</button>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="products-grid" id="productsGrid">
        <!-- Product 1 -->
        <div class="prod-card" data-cat="serums">
          <div class="prod-img bg-cream"><span class="prod-badge">Bestseller</span></div>
          <div class="prod-body">
            <span class="prod-cat">Serum &bull; 30ml</span>
            <h3>Niacinamide 10% + Zinc</h3>
            <p class="prod-desc">Refines pore appearance and strengthens the moisture barrier with Centella Asiatica.</p>
            <div class="prod-rating">★★★★★ <span>(480)</span></div>
            <div class="prod-bottom">
              <span class="prod-price">$42.00</span>
              <button class="btn btn-primary btn-add" data-id="p1" data-name="Niacinamide 10% + Zinc" data-price="42.00">Add to Bag</button>
            </div>
          </div>
        </div>

        <!-- Product 2 -->
        <div class="prod-card" data-cat="cleansers">
          <div class="prod-img bg-moss"></div>
          <div class="prod-body">
            <span class="prod-cat">Cleanser &bull; 150ml</span>
            <h3>Botanical Squalane Cleanser</h3>
            <p class="prod-desc">A gentle, melt-away emulsion that dissolves makeup without stripping natural lipids.</p>
            <div class="prod-rating">★★★★★ <span>(312)</span></div>
            <div class="prod-bottom">
              <span class="prod-price">$28.00</span>
              <button class="btn btn-primary btn-add" data-id="p2" data-name="Botanical Squalane Cleanser" data-price="28.00">Add to Bag</button>
            </div>
          </div>
        </div>

        <!-- Product 3 -->
        <div class="prod-card" data-cat="moisturizers">
          <div class="prod-img bg-cream"><span class="prod-badge">Hydration</span></div>
          <div class="prod-body">
            <span class="prod-cat">Moisturizer &bull; 50ml</span>
            <h3>Ceramide Barrier Cream</h3>
            <p class="prod-desc">Deep restorative velvet cream with 5 bio-identical ceramides and soothing oats.</p>
            <div class="prod-rating">★★★★★ <span>(520)</span></div>
            <div class="prod-bottom">
              <span class="prod-price">$48.00</span>
              <button class="btn btn-primary btn-add" data-id="p3" data-name="Ceramide Barrier Cream" data-price="48.00">Add to Bag</button>
            </div>
          </div>
        </div>

        <!-- Product 4 -->
        <div class="prod-card" data-cat="suncare">
          <div class="prod-img bg-sand"><span class="prod-badge">SPF 50+</span></div>
          <div class="prod-body">
            <span class="prod-cat">Sun Protection &bull; 75ml</span>
            <h3>Mineral Invisible Shield SPF 50</h3>
            <p class="prod-desc">Weightless, non-nano zinc sunscreen that melts in without chalky white residue.</p>
            <div class="prod-rating">★★★★★ <span>(840)</span></div>
            <div class="prod-bottom">
              <span class="prod-price">$36.00</span>
              <button class="btn btn-primary btn-add" data-id="p4" data-name="Mineral Invisible Shield SPF 50" data-price="36.00">Add to Bag</button>
            </div>
          </div>
        </div>

        <!-- Product 5 -->
        <div class="prod-card" data-cat="serums">
          <div class="prod-img bg-moss"></div>
          <div class="prod-body">
            <span class="prod-cat">Serum &bull; 30ml</span>
            <h3>Bakuchiol Renewal Oil</h3>
            <p class="prod-desc">Gentle plant-derived alternative to retinol, smoothing fine lines overnight.</p>
            <div class="prod-rating">★★★★★ <span>(290)</span></div>
            <div class="prod-bottom">
              <span class="prod-price">$54.00</span>
              <button class="btn btn-primary btn-add" data-id="p5" data-name="Bakuchiol Renewal Oil" data-price="54.00">Add to Bag</button>
            </div>
          </div>
        </div>

        <!-- Product 6 -->
        <div class="prod-card" data-cat="cleansers">
          <div class="prod-img bg-sand"></div>
          <div class="prod-body">
            <span class="prod-cat">Mist &bull; 100ml</span>
            <h3>Hyaluronic Floral Essence</h3>
            <p class="prod-desc">Hydrating botanical mist infused with rosewater, chamomile, and low molecular weight HA.</p>
            <div class="prod-rating">★★★★★ <span>(180)</span></div>
            <div class="prod-bottom">
              <span class="prod-price">$24.00</span>
              <button class="btn btn-primary btn-add" data-id="p6" data-name="Hyaluronic Floral Essence" data-price="24.00">Add to Bag</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Slide-Over Shopping Cart Drawer -->
  <div id="cartDrawer" class="cart-drawer-backdrop hidden">
    <div class="cart-drawer">
      <div class="cart-head">
        <h3>Your Shopping Bag (<span id="cartDrawerCount">0</span>)</h3>
        <button type="button" class="close-cart-btn" id="closeCartBtn">&times;</button>
      </div>
      <div class="cart-items" id="cartItemsList">
        <p class="empty-cart-msg">Your shopping bag is empty.</p>
      </div>
      <div class="cart-footer">
        <div class="cart-subtotal-row">
          <span>Subtotal</span>
          <span id="cartSubtotal">$0.00</span>
        </div>
        <div class="shipping-progress">
          <span id="shippingNotice">Add $60.00 more for free worldwide shipping</span>
        </div>
        <button type="button" class="btn btn-primary btn-block btn-lg" id="checkoutBtn">Proceed to Checkout</button>
        <p class="proto-notice">Prototype Storefront &bull; Simulated Checkout</p>
      </div>
    </div>
  </div>

  <div id="toast" class="toast hidden"></div>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-content">
      <div>
        <h3>${brandName}</h3>
        <p>Consciously formulated in small batches. 100% Cruelty-Free, Vegan & Sustainably Packaged.</p>
        <p class="copyright">&copy; 2026 ${brandName} Skincare Inc.</p>
      </div>
      <div>
        <h4>Customer Care</h4>
        <p>Shipping & Returns</p>
        <p>Track Your Order</p>
        <p>Ingredient Glossary</p>
      </div>
      <div>
        <h4>Newsletter</h4>
        <p>Enjoy 15% off your first order when you subscribe.</p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-primary: #2d5a43;
  --color-primary-hover: #1e3d2d;
  --color-accent: #c48b5f;
  --color-bg: #f9f8f6;
  --color-surface: #ffffff;
  --color-border: #e6e3dd;
  --color-text: #212529;
  --color-muted: #6c757d;
  --font-serif: "Cormorant Garamond", Georgia, serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
  --shadow-md: 0 6px 20px rgba(45, 90, 67, 0.08);
}`;

  const siteCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-text); line-height: 1.6; }
.container { max-width: 1140px; margin: 0 auto; padding: 0 20px; }

/* Announcement */
.announcement-bar { background: var(--color-primary); color: #fff; font-size: 12px; text-align: center; padding: 8px 16px; font-weight: 600; }

/* Nav */
.navbar { background: var(--color-surface); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
.nav-wrap { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.brand { font-family: var(--font-serif); font-size: 24px; font-weight: 700; color: var(--color-primary); text-decoration: none; }
.nav-links { display: flex; gap: 28px; }
.nav-link { text-decoration: none; color: var(--color-muted); font-size: 14px; font-weight: 600; transition: color 0.2s; }
.nav-link:hover, .nav-link.active { color: var(--color-primary); }

.cart-btn { background: var(--color-primary); color: #fff; border: none; padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.cart-count { background: #fff; color: var(--color-primary); width: 18px; height: 18px; border-radius: 50%; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; border: none; transition: all 0.2s; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-lg { padding: 14px 28px; font-size: 14px; }
.btn-block { width: 100%; }

/* Hero */
.hero { padding: 70px 0; background: linear-gradient(180deg, #edf3ef 0%, var(--color-bg) 100%); border-bottom: 1px solid var(--color-border); }
.hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: center; }
.tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-primary); font-weight: 800; display: block; margin-bottom: 12px; }
.hero-title { font-family: var(--font-serif); font-size: 42px; line-height: 1.15; color: #1c2e24; margin-bottom: 16px; }
.hero-desc { font-size: 16px; color: var(--color-muted); line-height: 1.6; margin-bottom: 28px; }
.hero-art { height: 320px; border-radius: var(--radius-lg); position: relative; overflow: hidden; display: flex; align-items: flex-end; padding: 20px; box-shadow: var(--shadow-md); }
.bg-sage { background: linear-gradient(135deg, #a7c4b5 0%, #2d5a43 100%); }
.badge-overlay { background: rgba(255,255,255,0.9); padding: 8px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: var(--color-primary); }

/* Products Section */
.section { padding: 80px 0; }
.shop-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 36px; flex-wrap: wrap; gap: 16px; }
.shop-head h2 { font-family: var(--font-serif); font-size: 32px; color: #1c2e24; }
.shop-head .sub { font-size: 14px; color: var(--color-muted); }

.cat-filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.cat-btn { background: var(--color-surface); border: 1px solid var(--color-border); padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; color: var(--color-muted); cursor: pointer; }
.cat-btn.active, .cat-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.prod-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
.prod-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.prod-img { height: 200px; position: relative; padding: 12px; }
.bg-cream { background: #f4ede4; }
.bg-moss { background: #e2ede5; }
.bg-sand { background: #f8f1e8; }
.prod-badge { background: var(--color-primary); color: #fff; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; }
.prod-body { padding: 20px; display: flex; flex-direction: column; flex: 1; }
.prod-cat { font-size: 11px; text-transform: uppercase; color: var(--color-accent); font-weight: 700; margin-bottom: 4px; }
.prod-body h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.prod-desc { font-size: 13px; color: var(--color-muted); line-height: 1.5; margin-bottom: 12px; flex: 1; }
.prod-rating { font-size: 12px; color: #f59e0b; margin-bottom: 14px; }
.prod-rating span { color: var(--color-muted); font-size: 11px; }
.prod-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 14px; }
.prod-price { font-size: 18px; font-weight: 800; color: var(--color-text); }

/* Slide-over Cart Drawer */
.cart-drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: flex-end; }
.cart-drawer { width: 100%; max-width: 400px; background: #fff; height: 100%; display: flex; flex-direction: column; box-shadow: -5px 0 25px rgba(0,0,0,0.15); animation: slideIn 0.25s ease-out; }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

.cart-head { padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
.cart-head h3 { font-size: 16px; font-weight: 700; }
.close-cart-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--color-muted); }
.cart-items { flex: 1; overflow-y: auto; padding: 20px; }
.empty-cart-msg { text-align: center; color: var(--color-muted); font-size: 14px; margin-top: 40px; }
.cart-item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f1f1; font-size: 13px; }
.cart-item-info strong { display: block; }
.cart-item-info span { font-size: 11px; color: var(--color-muted); }
.qty-controls { display: flex; align-items: center; gap: 8px; }
.qty-btn { width: 22px; height: 22px; border: 1px solid var(--color-border); background: #fff; border-radius: 4px; cursor: pointer; font-size: 12px; }

.cart-footer { padding: 20px; border-top: 1px solid var(--color-border); background: #fdfdfd; }
.cart-subtotal-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; margin-bottom: 8px; }
.shipping-progress { font-size: 11px; color: var(--color-primary); margin-bottom: 14px; font-weight: 600; }
.proto-notice { text-align: center; font-size: 10px; color: var(--color-muted); margin-top: 10px; }

/* Toast */
.toast { position: fixed; bottom: 20px; right: 20px; background: #212529; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 600; z-index: 2000; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.hidden { display: none !important; }

/* Footer */
.footer { background: #1c2e24; color: #cfded6; padding: 50px 0 30px; font-size: 13px; }
.footer-content { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 30px; }
.footer h3 { font-family: var(--font-serif); font-size: 20px; color: #fff; margin-bottom: 8px; }
.footer h4 { color: #fff; font-size: 14px; margin-bottom: 10px; }
.footer p { margin-bottom: 8px; }
.copyright { font-size: 11px; color: #8ba899; margin-top: 16px; }

@media (max-width: 850px) {
  .hero-grid { grid-template-columns: 1fr; }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-content { grid-template-columns: 1fr; }
}
@media (max-width: 550px) {
  .products-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
}`;

  const siteJs = `document.addEventListener('DOMContentLoaded', () => {
  // 1. Category Filtering
  const catBtns = document.querySelectorAll('.cat-btn');
  const prodCards = document.querySelectorAll('.prod-card');

  catBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      catBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');

      prodCards.forEach((card) => {
        if (cat === 'all' || card.getAttribute('data-cat') === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 2. Shopping Cart State & Drawer
  let cart = [];
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartCountEl = document.getElementById('cartCount');
  const cartDrawerCountEl = document.getElementById('cartDrawerCount');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const shippingNotice = document.getElementById('shippingNotice');
  const toast = document.getElementById('toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2800);
  }

  function renderCart() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (cartDrawerCountEl) cartDrawerCountEl.textContent = totalQty;
    if (cartSubtotalEl) cartSubtotalEl.textContent = '$' + subtotal.toFixed(2);

    if (shippingNotice) {
      if (subtotal >= 60) {
        shippingNotice.textContent = '🎉 You have unlocked Free Carbon-Neutral Shipping!';
      } else {
        const diff = (60 - subtotal).toFixed(2);
        shippingNotice.textContent = 'Add $' + diff + ' more for free worldwide shipping';
      }
    }

    if (!cartItemsList) return;
    if (cart.length === 0) {
      cartItemsList.innerHTML = '<p class="empty-cart-msg">Your shopping bag is empty.</p>';
      return;
    }

    cartItemsList.innerHTML = cart
      .map(
        (item) => \`
      <div class="cart-item-row">
        <div class="cart-item-info">
          <strong>\${item.name}</strong>
          <span>$\${item.price.toFixed(2)} each</span>
        </div>
        <div class="qty-controls">
          <button type="button" class="qty-btn" onclick="window.updateCartQty('\${item.id}', -1)">-</button>
          <span>\${item.qty}</span>
          <button type="button" class="qty-btn" onclick="window.updateCartQty('\${item.id}', 1)">+</button>
        </div>
      </div>
    \`
      )
      .join('');
  }

  window.updateCartQty = function(id, delta) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => i.id !== id);
    }
    renderCart();
  };

  // Add to Bag Buttons
  document.querySelectorAll('.btn-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price') || '0');

      const existing = cart.find((i) => i.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, name, price, qty: 1 });
      }

      renderCart();
      showToast('Added ' + name + ' to your bag!');
    });
  });

  if (openCartBtn && cartDrawer) {
    openCartBtn.addEventListener('click', () => cartDrawer.classList.remove('hidden'));
  }
  if (closeCartBtn && cartDrawer) {
    closeCartBtn.addEventListener('click', () => cartDrawer.classList.add('hidden'));
  }

  // Simulated Checkout
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your shopping bag is currently empty.');
        return;
      }
      showToast('Redirecting to simulated checkout for $' + cart.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2));
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
      content: `# ${brandName} Skincare Storefront\n\nGenerated with **LightningAPI Studio AI Website Builder**.\n\n- Brief: ${brief}\n- Features: Category-filtered product grid, Interactive slide-over shopping bag drawer, Dynamic subtotal & free shipping progress calculation, Quantity controls.\n- Run: Open index.html in any browser.`,
    },
  ];
}

// ============================================================================
// Master Synthesis Dispatcher
// ============================================================================

export function synthesizeByArchetype(brief: string, categoryHint?: string): ProjectFile[] {
  const archetype = detectProjectArchetype(brief, categoryHint);

  switch (archetype) {
    case 'restaurant':
      return synthesizeRestaurantWebsite(brief);
    case 'dashboard':
      return synthesizeDashboardApp(brief);
    case 'portfolio':
      return synthesizePortfolioWebsite(brief);
    case 'sunscreen':
    case 'store':
      return synthesizeStorefrontWebsite(brief);
    case 'saas':
      return synthesizeSaaSLandingPage(brief);
    default:
      // Generic request: detect whether it's closer to SaaS, restaurant, or portfolio
      if (/cafe|tea|bakery|diner|pizza/i.test(brief)) {
        return synthesizeRestaurantWebsite(brief);
      }
      if (/chart|kpi|metric|report/i.test(brief)) {
        return synthesizeDashboardApp(brief);
      }
      if (/art|photo|gallery|cv/i.test(brief)) {
        return synthesizePortfolioWebsite(brief);
      }
      return synthesizeSaaSLandingPage(brief);
  }
}
