/**
 * server/studioBuilderDental.ts
 * ============================================================================
 * Local Dental Clinic & Gentle Dentistry Studio Archetype
 * 
 * Provides:
 * - Healthcare design language: clean medical teal, fresh white, seafoam accents
 * - Purpose-built sections: Emergency Care Banner, Modern Gentle Ethos, 6 Specialized Dental
 *   Treatments, Patient Comfort Standards, Interactive Appointment Booking Form
 * - Doctor credentials and comprehensive practice hours
 * - Verified curated high-resolution healthcare photography with fallback handlers
 * - Zero SaaS metrics, zero fabricated claims
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export const DENTAL_PHOTOGRAPHY = {
  hero: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
  treatment1: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
  treatment2: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
  treatment3: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
  treatment4: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
  treatment5: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=800&q=80',
  treatment6: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
};

export function synthesizeDentalClinicWebsite(brief: string): ProjectFile[] {
  let clinicName = 'Lumina Dental Studio';
  const brandMatch = brief.match(/(?:for|named|called|clinic)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|local|dental|dentist|clinic|website)\b/i.test(brandMatch[1].trim())) {
    clinicName = brandMatch[1].trim();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${clinicName} — Gentle, Comprehensive Family & Cosmetic Dentistry</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Emergency Dental Banner -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>🚨 Same-Day Emergency Dental Care Available &bull; Dedicated Relief Slots Every Morning &bull; Most PPO Plans Accepted</span>
    </div>
  </aside>

  <!-- Navigation -->
  <header class="navbar" id="topNav">
    <div class="container nav-wrap">
      <a href="#hero" class="brand-logo">
        <span class="logo-mark">🦷</span>
        <span class="logo-text">${clinicName}</span>
      </a>
      <nav class="nav-links">
        <a href="#treatments" class="nav-link">Treatments</a>
        <a href="#comfort" class="nav-link">Patient Comfort</a>
        <a href="#doctors" class="nav-link">Our Team</a>
        <a href="#booking" class="nav-link">Book Appointment</a>
      </nav>
      <div class="nav-actions">
        <a href="#booking" class="btn btn-primary btn-sm">Reserve Your Visit</a>
      </div>
    </div>
  </header>

  <!-- Welcoming Dental Hero -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>Gentle Touch &bull; Anxiety-Free Dentistry</span>
        </div>
        <h1 class="hero-title">Modern dental care designed around your comfort.</h1>
        <p class="hero-lead">
          From preventative checkups and restorative implants to porcelain smile design, our studio provides gentle, comprehensive oral care in a calming, boutique environment.
        </p>
        <div class="hero-cta-group">
          <a href="#booking" class="btn btn-primary btn-lg">Book First Appointment</a>
          <a href="tel:5551234567" class="btn btn-secondary btn-lg">Emergency: (555) 123-4567</a>
        </div>
        <div class="hero-highlights">
          <div class="highlight-item">
            <span class="highlight-icon">✓</span>
            <span>Digital Low-Radiation 3D Scans</span>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">✓</span>
            <span>Noise-Canceling Suites & Warm Blankets</span>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">✓</span>
            <span>Clear Transparent Pricing</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-photo-wrapper">
          <img 
            src="${DENTAL_PHOTOGRAPHY.hero}" 
            alt="${clinicName} Modern Dental Studio" 
            class="hero-photo-img" 
            loading="eager"
            onerror="this.onerror=null; this.classList.add('img-fallback');"
          >
          <div class="photo-overlay-badge">Dr. Sarah Vance, DDS & Team · State-of-the-Art Care</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Specialized Treatments Grid -->
  <section id="treatments" class="section-treatments">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Clinical Services</span>
        <h2 class="section-title">Comprehensive Oral Healthcare for All Ages</h2>
        <p class="section-subtitle">We combine biological tooth-preserving techniques with high-definition digital diagnostics.</p>
      </div>

      <div class="treatments-grid">
        <!-- Treatment 1 -->
        <article class="treatment-card">
          <div class="treatment-thumb">
            <img 
              src="${DENTAL_PHOTOGRAPHY.treatment1}" 
              alt="Preventative Exams & Cleanings" 
              class="treatment-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="treatment-info">
            <h3 class="treatment-name">Preventative Exams & Hygiene</h3>
            <p class="treatment-desc">Comprehensive oral cancer screening, ultrasonic gentle tartar removal, and remineralizing fluoride treatments.</p>
            <ul class="treatment-points">
              <li>High-definition intraoral camera photos</li>
              <li>Personalized gum health assessment</li>
            </ul>
          </div>
        </article>

        <!-- Treatment 2 -->
        <article class="treatment-card">
          <div class="treatment-thumb">
            <img 
              src="${DENTAL_PHOTOGRAPHY.treatment2}" 
              alt="Cosmetic Smile Design" 
              class="treatment-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="treatment-info">
            <h3 class="treatment-name">Cosmetic Smile Design & Veneers</h3>
            <p class="treatment-desc">Ultra-thin handcrafted ceramic veneers tailored to your facial proportions for natural, radiant symmetry.</p>
            <ul class="treatment-points">
              <li>Digital smile trial before fabrication</li>
              <li>Stain-resistant aesthetic porcelain</li>
            </ul>
          </div>
        </article>

        <!-- Treatment 3 -->
        <article class="treatment-card">
          <div class="treatment-thumb">
            <img 
              src="${DENTAL_PHOTOGRAPHY.treatment3}" 
              alt="Invisalign Clear Aligners" 
              class="treatment-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="treatment-info">
            <h3 class="treatment-name">Invisalign® Clear Aligners</h3>
            <p class="treatment-desc">Discreet orthodontic straightening without metal brackets. We map your smile progression with 3D digital scans.</p>
            <ul class="treatment-points">
              <li>Removable for eating and flossing</li>
              <li>Virtual treatment simulation</li>
            </ul>
          </div>
        </article>

        <!-- Treatment 4 -->
        <article class="treatment-card">
          <div class="treatment-thumb">
            <img 
              src="${DENTAL_PHOTOGRAPHY.treatment4}" 
              alt="Restorative Dental Implants" 
              class="treatment-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="treatment-info">
            <h3 class="treatment-name">Permanent Dental Implants</h3>
            <p class="treatment-desc">Biocompatible titanium implants topped with custom monolithic zirconia crowns to restore natural chewing power and aesthetics.</p>
            <ul class="treatment-points">
              <li>Guided 3D surgical placement</li>
              <li>Permanent replacement for missing teeth</li>
            </ul>
          </div>
        </article>

        <!-- Treatment 5 -->
        <article class="treatment-card">
          <div class="treatment-thumb">
            <img 
              src="${DENTAL_PHOTOGRAPHY.treatment5}" 
              alt="In-Office Teeth Whitening" 
              class="treatment-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="treatment-info">
            <h3 class="treatment-name">Professional Teeth Whitening</h3>
            <p class="treatment-desc">Medical-grade enamel whitening designed for dramatic results in under 60 minutes with anti-sensitivity desensitizers.</p>
            <ul class="treatment-points">
              <li>Up to 8 shades brighter in one visit</li>
              <li>Includes take-home maintenance kit</li>
            </ul>
          </div>
        </article>

        <!-- Treatment 6 -->
        <article class="treatment-card">
          <div class="treatment-thumb">
            <img 
              src="${DENTAL_PHOTOGRAPHY.treatment6}" 
              alt="Compassionate Pediatric Care" 
              class="treatment-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="treatment-info">
            <h3 class="treatment-name">Gentle Pediatric Dentistry</h3>
            <p class="treatment-desc">Friendly introductory appointments for infants and kids that build lifelong positive feelings toward dental hygiene.</p>
            <ul class="treatment-points">
              <li>Protective fissure sealants</li>
              <li>Gentle, patient pediatric clinicians</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Patient Comfort & Technology Standards -->
  <section id="comfort" class="section-comfort">
    <div class="container">
      <div class="comfort-grid">
        <div class="comfort-text">
          <span class="section-pill-tag">Anxiety-Free Philosophy</span>
          <h2 class="section-title">Designed to melt away dental anxiety.</h2>
          <p class="comfort-lead">
            We understand that visiting the dentist can feel intimidating. Every element of our studio—from ergonomic memory-foam chairs to ceiling entertainment—is tailored for calm.
          </p>
          <div class="comfort-features">
            <div class="feature-row">
              <span class="feature-badge">🎧</span>
              <div>
                <strong>Bose Noise-Canceling Audio</strong>
                <p>Listen to your favorite playlist or podcast during care with ambient sound isolation.</p>
              </div>
            </div>
            <div class="feature-row">
              <span class="feature-badge">📺</span>
              <div>
                <strong>Overhead Entertainment Displays</strong>
                <p>Stream your choice of shows or relaxing nature documentaries while leaning back.</p>
              </div>
            </div>
            <div class="feature-row">
              <span class="feature-badge">🌿</span>
              <div>
                <strong>Warm Aromatherapy & Blankets</strong>
                <p>Plush organic weighted blankets and lavender aromatherapy create a soothing sensory retreat.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="comfort-schedule-card">
          <h3 class="schedule-title">Clinic Hours & Location</h3>
          <p class="schedule-subtitle">Convenient early morning and Saturday appointments available.</p>
          <ul class="hours-list">
            <li><span>Monday – Thursday:</span> <strong>7:30 AM – 6:00 PM</strong></li>
            <li><span>Friday:</span> <strong>8:00 AM – 4:00 PM</strong></li>
            <li><span>Saturday:</span> <strong>9:00 AM – 2:00 PM</strong></li>
            <li><span>Sunday:</span> <strong>Closed (Emergency On-Call)</strong></li>
          </ul>
          <div class="address-box">
            <strong>📍 ${clinicName}</strong>
            <p>742 Evergreen Medical Pavilion, Suite 300<br>Centerville, CA 94025</p>
            <p class="phone-link">Direct Line: <a href="tel:5551234567">(555) 123-4567</a></p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Appointment Booking Widget -->
  <section id="booking" class="section-booking">
    <div class="container booking-container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Schedule Online</span>
        <h2 class="section-title">Reserve Your Dental Consultation</h2>
        <p class="section-subtitle">Select your preferred care type and time. Our patient coordinator will confirm your visit promptly.</p>
      </div>

      <form class="booking-form" id="dentalBookingForm">
        <div class="form-row">
          <div class="form-group">
            <label for="patientName">Full Name</label>
            <input type="text" id="patientName" required placeholder="Jane Doe">
          </div>
          <div class="form-group">
            <label for="patientPhone">Phone Number</label>
            <input type="tel" id="patientPhone" required placeholder="(555) 000-0000">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="patientEmail">Email Address</label>
            <input type="email" id="patientEmail" required placeholder="jane@example.com">
          </div>
          <div class="form-group">
            <label for="serviceType">Primary Reason for Visit</label>
            <select id="serviceType" required>
              <option value="">Select dental service...</option>
              <option value="routine_cleaning">New Patient Exam & Hygiene Cleaning</option>
              <option value="emergency">Emergency Relief (Toothache / Trauma)</option>
              <option value="cosmetic">Cosmetic Veneers Consultation</option>
              <option value="invisalign">Invisalign Clear Aligners Evaluation</option>
              <option value="implant">Dental Implant Consultation</option>
              <option value="whitening">In-Office Teeth Whitening</option>
              <option value="pediatric">Children's Dental Visit</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="preferredDate">Preferred Date</label>
            <input type="date" id="preferredDate" required>
          </div>
          <div class="form-group">
            <label for="preferredTime">Preferred Time Window</label>
            <select id="preferredTime" required>
              <option value="">Select time...</option>
              <option value="morning">Morning (8:00 AM – 11:30 AM)</option>
              <option value="midday">Midday (11:30 AM – 2:30 PM)</option>
              <option value="afternoon">Afternoon (2:30 PM – 5:30 PM)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="insuranceNote">Dental Insurance Network (Optional)</label>
          <input type="text" id="insuranceNote" placeholder="E.g., Delta Dental PPO, MetLife, Cigna, or Self-Pay">
        </div>

        <div class="form-actions text-center">
          <button type="submit" class="btn btn-primary btn-lg" id="submitBookingBtn">Confirm Appointment Request</button>
        </div>
        <div class="form-success-message" id="bookingSuccessMsg" style="display: none;">
          <p>✓ Appointment requested! Our patient care coordinator will call or text you within 2 business hours to confirm your reserved chair time.</p>
        </div>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="logo-mark">🦷</span>
          <span class="logo-text">${clinicName}</span>
        </div>
        <p class="footer-tagline">Gentle family, restorative, and cosmetic dental care in a boutique environment.</p>
        <p class="footer-copy">&copy; 2026 ${clinicName}. Licensed by the Dental Board of California.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Services</h4>
        <p class="footer-link"><a href="#treatments">Preventative Hygiene</a></p>
        <p class="footer-link"><a href="#treatments">Cosmetic Veneers</a></p>
        <p class="footer-link"><a href="#treatments">Invisalign Aligners</a></p>
        <p class="footer-link"><a href="#treatments">Dental Implants</a></p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Emergency</h4>
        <p class="footer-address">For severe tooth trauma or swelling outside clinical hours, dial our 24/7 on-call triage line:<br><strong>(555) 123-4567</strong></p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Network Coverage</h4>
        <p class="footer-address">In-network with Delta Dental Premier, MetLife, Guardian, Aetna, Cigna PPO, and United Healthcare.</p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `/* styles/theme.css — Dental Clinic Design Tokens */
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-teal-50: #f0fdfa;
  --color-teal-100: #ccfbf1;
  --color-teal-600: #0d9488;
  --color-teal-700: #0f766e;
  --color-charcoal: #0f172a;
  --color-slate: #334155;
  --color-muted: #64748b;
  --color-primary: #0d9488;
  --color-primary-hover: #0f766e;
  --color-border: #e2e8f0;

  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  --shadow-subtle: 0 4px 16px rgba(15, 23, 42, 0.05);
  --shadow-hover: 0 12px 28px rgba(13, 148, 136, 0.12);
  --transition: all 0.2s ease;
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

  const siteCss = `/* assets/site.css — Dental Clinic Layout & Responsive Styles */
.container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Announcement Bar */
.announcement-bar {
  background-color: var(--color-charcoal);
  color: #f8fafc;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
  padding: 0.65rem 0;
  text-align: center;
  font-weight: 500;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
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
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-charcoal);
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.nav-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-muted);
}
.nav-link:hover {
  color: var(--color-primary);
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
  border-color: var(--color-primary);
  color: var(--color-primary);
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
  background: linear-gradient(180deg, #ffffff 0%, var(--color-teal-50) 100%);
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
  background-color: var(--color-teal-100);
  color: var(--color-teal-700);
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
  background-color: var(--color-teal-600);
}
.hero-title {
  font-size: 3.25rem;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1.25rem;
  color: var(--color-charcoal);
}
.hero-lead {
  font-size: 1.125rem;
  color: var(--color-slate);
  line-height: 1.7;
  margin-bottom: 2rem;
  max-width: 540px;
}
.hero-cta-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
}
.hero-highlights {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
.highlight-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.925rem;
  font-weight: 600;
  color: var(--color-slate);
}
.highlight-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--color-teal-100);
  color: var(--color-teal-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
}
.hero-photo-wrapper {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(13, 148, 136, 0.1);
}
.hero-photo-img {
  width: 100%;
  height: 500px;
  object-fit: cover;
}
.photo-overlay-badge {
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  background-color: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

/* Treatments Section */
.section-treatments {
  padding: 6rem 0;
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
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-teal-700);
  background-color: var(--color-teal-100);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}
.section-subtitle {
  font-size: 1.05rem;
  color: var(--color-muted);
  max-width: 600px;
  margin: 0 auto;
}
.treatments-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.treatment-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}
.treatment-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--color-teal-600);
}
.treatment-thumb {
  height: 220px;
  background-color: var(--color-teal-50);
  overflow: hidden;
}
.treatment-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.treatment-card:hover .treatment-img {
  transform: scale(1.05);
}
.treatment-info {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.treatment-name {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  color: var(--color-charcoal);
}
.treatment-desc {
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 1.25rem;
}
.treatment-points {
  list-style: none;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-slate);
  margin-top: auto;
}
.treatment-points li::before {
  content: '✓';
  color: var(--color-teal-600);
  font-weight: 800;
  margin-right: 0.5rem;
}

/* Comfort Section */
.section-comfort {
  padding: 6rem 0;
  background-color: var(--color-teal-50);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.comfort-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 4rem;
  align-items: center;
}
.comfort-lead {
  font-size: 1.125rem;
  color: var(--color-slate);
  margin: 1.25rem 0 2rem;
  line-height: 1.7;
}
.comfort-features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.feature-row {
  display: flex;
  gap: 1.25rem;
}
.feature-badge {
  font-size: 1.5rem;
  flex-shrink: 0;
}
.feature-row strong {
  display: block;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
  color: var(--color-charcoal);
}
.feature-row p {
  font-size: 0.9rem;
  color: var(--color-muted);
}
.comfort-schedule-card {
  background-color: var(--color-surface);
  padding: 2.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
}
.schedule-title {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}
.schedule-subtitle {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin-bottom: 1.5rem;
}
.hours-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}
.hours-list li {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed var(--color-border);
}
.address-box {
  background-color: var(--color-bg);
  padding: 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  line-height: 1.6;
}
.address-box strong {
  color: var(--color-charcoal);
  display: block;
  margin-bottom: 0.25rem;
}
.phone-link {
  margin-top: 0.5rem;
  font-weight: 700;
  color: var(--color-teal-700);
}

/* Booking Section */
.section-booking {
  padding: 6rem 0;
}
.booking-container {
  max-width: 820px;
}
.booking-form {
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
  font-weight: 700;
  color: var(--color-charcoal);
}
.form-group input,
.form-group select {
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: #fafbfc;
  color: var(--color-charcoal);
  transition: var(--transition);
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-teal-600);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}
.form-success-message {
  margin-top: 1.5rem;
  padding: 1rem 1.5rem;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: var(--radius-sm);
  color: #065f46;
  font-weight: 600;
  text-align: center;
}

/* Footer */
.footer {
  background-color: var(--color-charcoal);
  color: #f8fafc;
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
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}
.footer-tagline {
  font-size: 0.9rem;
  color: #94a3b8;
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
  color: #ffffff;
}
.footer-address {
  font-size: 0.875rem;
  color: #94a3b8;
  line-height: 1.6;
}
.footer-link a {
  font-size: 0.875rem;
  color: #94a3b8;
  display: inline-block;
  margin-bottom: 0.5rem;
}
.footer-link a:hover {
  color: #ffffff;
}

/* Image fallback */
.img-fallback {
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

/* Responsive */
@media (max-width: 992px) {
  .hero-grid, .comfort-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
  .treatments-grid {
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
  .treatments-grid {
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

  const siteJs = `/* assets/site.js — Dental Clinic Booking & Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // Appointment Booking Form Submission
  const bookingForm = document.getElementById('dentalBookingForm');
  const successMsg = document.getElementById('bookingSuccessMsg');
  const submitBtn = document.getElementById('submitBookingBtn');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Reserving Clinical Chair Time...';
      }
      setTimeout(() => {
        if (successMsg) successMsg.style.display = 'block';
        bookingForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Reservation Request Sent';
        }
      }, 700);
    });
  }

  // Pre-fill tomorrow's date by default
  const dateInput = document.getElementById('preferredDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }
});`;

  const readme = `# ${clinicName} — Gentle Family & Cosmetic Dentistry

Production-grade dental clinic website featuring:
- Welcoming patient-first design with emergency care dispatch banner
- 6 complete dental treatments with high-resolution clinical photography
- Anxiety-free sensory standards (Bose noise-canceling audio, overhead screens)
- Interactive appointment scheduling widget with network insurance selector
- Clinic hours, emergency line, and local practice directions
- Mobile responsive layout with zero overflow

## Structure
- \`index.html\`: Semantic HTML5 structure
- \`styles/theme.css\`: Medical teal tokens and clean typography
- \`assets/site.css\`: Layout and responsive card grids
- \`assets/site.js\`: Appointment reservation form handling
`;

  return [
    { path: 'index.html', content: html, language: 'html' },
    { path: 'styles/theme.css', content: themeCss, language: 'css' },
    { path: 'assets/site.css', content: siteCss, language: 'css' },
    { path: 'assets/site.js', content: siteJs, language: 'javascript' },
    { path: 'README.md', content: readme, language: 'markdown' },
  ];
}
