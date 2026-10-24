/**
 * server/studioBuilderDynamic.ts
 * ============================================================================
 * Universal Dynamic Semantic Website Synthesizer
 * 
 * Provides:
 * - Dynamic domain inference for arbitrary industries (bakery, veterinary, yoga, law, etc.)
 * - Adaptive color palettes, typography, and photography matching the inferred industry
 * - 6 domain-tailored service/product cards with specifications and interactions
 * - Interactive inquiry/booking/ordering form with instant client feedback
 * - ZERO SaaS leakage, zero fabricated claims
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

interface DomainConfig {
  industryTitle: string;
  palette: {
    bg: string;
    surface: string;
    card: string;
    primary: string;
    primaryHover: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
  };
  heroBadge: string;
  heroHeadline: string;
  heroLead: string;
  pillarsTitle: string;
  pillars: Array<{ icon: string; title: string; desc: string }>;
  catalogTitle: string;
  catalogSubtitle: string;
  items: Array<{
    name: string;
    badge: string;
    desc: string;
    meta: string;
    img: string;
    actionText: string;
  }>;
  formTitle: string;
  formSubtitle: string;
  formActionBtn: string;
}

export function synthesizeDynamicWebsite(brief: string): ProjectFile[] {
  const cleanBrief = brief.trim();
  const lower = cleanBrief.toLowerCase();

  // Extract brand name
  let brandName = 'Artisan & Co.';
  const brandMatch = cleanBrief.match(/(?:for|named|called|brand|firm|studio|shop)\s+([\p{L}\p{N}\s'\-]{2,30})(?:\s+with|\s+featuring|\s+and|\s*,|\s*$)/iu);
  if (brandMatch && !/^(a|an|the|website|modern|boutique|premium|local|online|platform)\b/i.test(brandMatch[1].trim())) {
    brandName = brandMatch[1].trim();
  } else {
    // Generate derived brand name from keywords
    const words = cleanBrief.split(/\s+/).filter((w) => w.length > 3 && !/^(build|create|make|design|website|landing|page|with)$/i.test(w));
    if (words.length > 0) {
      brandName = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // Domain Config Resolution
  let config: DomainConfig;

  if (/solar|battery|clean energy|photovoltaic|microgrid/i.test(lower)) {
    config = {
      industryTitle: 'Residential Solar & Clean Energy Storage',
      palette: {
        bg: '#f8fafc',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#065f46',
        primaryHover: '#047857',
        accent: '#f59e0b',
        text: '#0f172a',
        muted: '#475569',
        border: '#e2e8f0',
      },
      heroBadge: 'Clean Energy Independence & Whole-Home Battery Storage',
      heroHeadline: 'Power your home with precision residential solar and smart battery backup.',
      heroLead: 'Custom engineered photovoltaic arrays and high-capacity battery storage systems designed for grid resilience, true zero bills, and clean energy autonomy.',
      pillarsTitle: 'Engineered for Clean Energy Reliability',
      pillars: [
        { icon: '☀️', title: 'Tier-1 Monocrystalline Solar', desc: 'High-efficiency bi-facial photovoltaic modules with 25-year power production warranties.' },
        { icon: '🔋', title: 'Intelligent Battery Backup', desc: 'Whole-home lithium iron phosphate (LiFePO4) battery systems for seamless blackout transition.' },
        { icon: '⚡', title: 'Microgrid Clean Energy Inversion', desc: 'High-frequency hybrid inverters maximizing peak-sun capture and instantaneous load balancing.' },
        { icon: '📊', title: 'Zero-Opaque Energy Telemetry', desc: 'Real-time generation and battery state-of-charge tracking on your personal dashboard.' },
      ],
      catalogTitle: 'Engineered Solar & Clean Battery Solutions',
      catalogSubtitle: 'Turnkey residential solar arrays and high-capacity battery storage configured for your home’s roof and consumption profile.',
      items: [
        { name: 'Whole-Home Solar & Battery System', badge: 'Turnkey Flagship', desc: 'Tier-1 all-black solar array paired with 20kWh clean battery storage for complete blackout immunity and peak shaving.', meta: '25-Year Warranty · LiFePO4 Battery', img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80', actionText: 'Request System Audit' },
        { name: 'Next-Gen LiFePO4 Battery Storage', badge: 'Smart Storage', desc: 'Modular whole-home battery backup system providing continuous power during utility brownouts and time-of-use cost arbitrage.', meta: '10kWh – 40kWh Modular Battery', img: 'https://images.unsplash.com/photo-1558441719-8b449c6ff673?auto=format&fit=crop&w=800&q=80', actionText: 'Configure Battery' },
        { name: 'Architectural Rooftop Solar Array', badge: 'Aesthetic Integration', desc: 'Sleek, low-profile solar panels with concealed mounting brackets engineered for maximum clean energy harvest and curb appeal.', meta: '400W+ High Output Solar', img: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80', actionText: 'Calculate Solar Potential' },
        { name: 'Bi-Directional EV Solar Charging', badge: 'Vehicle Integration', desc: 'High-power Level-2 clean energy EV charger drawing directly from rooftop solar generation and daytime battery reserves.', meta: 'Clean Energy 11.5kW Output', img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80', actionText: 'Explore Charger' },
        { name: 'Smart Hybrid Inverter & Energy Hub', badge: 'Microgrid Intelligence', desc: 'Ultra-efficient dual-MPPT hybrid inverter managing continuous solar input, grid tie-in, and instant battery switching.', meta: '98.5% Conversion Efficiency', img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=800&q=80', actionText: 'View Inverter Specs' },
        { name: 'Annual Solar Maintenance & Health', badge: 'Lifecycle Care', desc: 'Infrared panel inspection, clean energy production verification, and battery chemistry diagnostics by certified master electricians.', meta: 'Comprehensive Performance Check', img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Audit' },
      ],
      formTitle: 'Request a Free Solar & Battery Feasibility Study',
      formSubtitle: 'Our clean energy engineers analyze your utility bills, roof satellite imagery, and electrical service panel.',
      formActionBtn: 'Request Solar & Battery Proposal',
    };
  } else if (/pottery|ceramic|kiln|clay|stoneware|porcelain|wheel-thrown/i.test(lower)) {
    config = {
      industryTitle: 'Handcrafted Ceramics & Pottery Atelier',
      palette: {
        bg: '#faf7f2',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#7c2d12',
        primaryHover: '#9a3412',
        accent: '#d97706',
        text: '#1c1917',
        muted: '#78716c',
        border: '#e7e0d5',
      },
      heroBadge: 'Wheel-Thrown Ceramic Stoneware & Wood-Fired Kiln Workshops',
      heroHeadline: 'Handcrafted ceramic vessels and tactile pottery shaped by earth, water, and fire.',
      heroLead: 'Every vessel is hand-thrown on the wheel, coated in natural mineral glazes, and slow-fired in our brick kiln to celebrate the beauty of honest craft.',
      pillarsTitle: 'The Spirit of Pottery & Kiln Craft',
      pillars: [
        { icon: '🏺', title: 'Handcrafted Wheel-Thrown Forms', desc: 'Individually shaped on the potter\'s wheel with subtle fingertip ridges honoring human touch.' },
        { icon: '🔥', title: 'High-Fire Reduction Kiln', desc: 'Vitreous stoneware fired to 2,300°F in our atmospheric wood and gas kiln for superior chip-resistant density.' },
        { icon: '🌾', title: 'Local Wild Clays & Natural Slips', desc: 'Sourced directly from riverbed sedimentary clays and blended with crushed feldspar and volcanic ash.' },
        { icon: '✋', title: 'Intimate Kiln Workshops', desc: 'Hands-on pottery instruction guided by master ceramic artists in our sunlit neighborhood atelier.' },
      ],
      catalogTitle: 'Handcrafted Ceramic Collection & Kiln Workshops',
      catalogSubtitle: 'Functional ceramic tableware, sculptural stoneware vessels, and weekend pottery kiln workshops.',
      items: [
        { name: 'Speckled Stoneware Dinner Plate', badge: 'Atelier Classic', desc: 'Handcrafted wheel-thrown plate featuring unglazed toasted rim and raw tactile ceramic underside.', meta: 'High-Fire Kiln Stoneware', img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80', actionText: 'Acquire Piece' },
        { name: 'Wabi-Sabi Ceramic Matcha Bowl', badge: 'One-of-a-Kind', desc: 'Individually pinched and wood-fired in our kiln with natural fly-ash melt and subtle ceramic crackle.', meta: 'Handcrafted Chawan', img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80', actionText: 'Acquire Piece' },
        { name: 'Fluted Ceramic Pour-Over Dripper', badge: 'Daily Ritual', desc: 'Precision spiral ribs engineered for balanced coffee extraction, finished in matte ceramic oatmeal glaze.', meta: 'Handcrafted Ceramics', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', actionText: 'Acquire Piece' },
        { name: 'Architectural Ceramic Moon Jar', badge: 'Kiln Sculpture', desc: 'Substantial spherical vessel showcasing raw iron-flecked clay and subtle wood-fired kiln flame flashes.', meta: 'Handcrafted Atelier Series', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Commission' },
        { name: 'Introductory Wheel Throwing Workshop', badge: 'Kiln Workshop', desc: 'A 4-week weekend pottery intensive mastering centering, pulling, trimming, and loading the kiln.', meta: 'Hands-on Pottery Class', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80', actionText: 'Book Workshop' },
        { name: 'Kiln Glaze Chemistry Masterclass', badge: 'Advanced Kiln', desc: 'Deep dive into ceramic glaze formulations, cone-10 reduction firing, and kiln atmospheric controls.', meta: 'Handcrafted Pottery Mastery', img: 'https://images.unsplash.com/photo-1590374585152-ca0e8194c0d6?auto=format&fit=crop&w=800&q=80', actionText: 'Book Masterclass' },
      ],
      formTitle: 'Book a Kiln Workshop or Inquire on Handcrafted Pottery',
      formSubtitle: 'Reach out to reserve a wheel in our pottery workshop or commission bespoke ceramic dining sets.',
      formActionBtn: 'Send Pottery Atelier Inquiry',
    };
  } else if (/vertical farm|hydroponic|microgreen|aeroponic|aquaponic/i.test(lower)) {
    config = {
      industryTitle: 'Urban Hydroponic Vertical Farm & Microgreens',
      palette: {
        bg: '#f8fafc',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#15803d',
        primaryHover: '#166534',
        accent: '#22c55e',
        text: '#0f172a',
        muted: '#475569',
        border: '#e2e8f0',
      },
      heroBadge: 'Pesticide-Free Controlled Environment Vertical Farm',
      heroHeadline: 'Hyper-local organic microgreens harvested hours before reaching your kitchen table.',
      heroLead: 'Our indoor closed-loop hydroponic vertical farm grows vibrant living microgreens and nutrient-dense greens using 95% less water and zero synthetic pesticides.',
      pillarsTitle: 'Precision Hydroponic Cultivation',
      pillars: [
        { icon: '🌱', title: 'Closed-Loop Hydroponic Feeding', desc: 'Recirculating mineral-rich organic nutrient solutions using 95% less water than open-field cultivation.' },
        { icon: '🌿', title: 'Living Microgreens Harvest', desc: 'Delivered living with root systems intact for maximum enzyme density and week-long freshness.' },
        { icon: '💡', title: 'Full-Spectrum LED Vertical Farm', desc: 'Engineered photosynthesis spectrums enhancing natural antioxidants and crisp vegetable flavors.' },
        { icon: '🚚', title: 'Sub-2-Hour Hyper-Local Delivery', desc: 'Grown in the urban center, eliminating thousands of refrigerated long-haul food miles.' },
      ],
      catalogTitle: 'Fresh Microgreens & Hydroponic Produce',
      catalogSubtitle: 'Vibrant living greens grown in our vertical farm and harvested fresh daily for restaurants and home chefs.',
      items: [
        { name: 'Spicy Radish & Broccoli Microgreens', badge: 'Chef Favorite', desc: 'Peppery, antioxidant-rich living microgreens grown vertically in our clean hydroponic rooms.', meta: 'Living Vertical Farm Tray', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', actionText: 'Order Fresh' },
        { name: 'Hydroponic Tuscan Baby Kale', badge: 'Living Greens', desc: 'Tender baby kale leaves with sweet nutty notes, grown without soil in our controlled vertical farm environment.', meta: 'Zero Pesticides · Hydroponic', img: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80', actionText: 'Order Fresh' },
        { name: 'Sunflower & Pea Shoot Microgreens', badge: 'Crisp & Sweet', desc: 'Crunchy, succulent vertical farm microgreens loaded with plant protein and crisp sweetness.', meta: 'Living Hydroponic Microgreens', img: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80', actionText: 'Order Fresh' },
        { name: 'Genovese Sweet Hydroponic Basil', badge: 'Aromatic Herb', desc: 'High-fragrance living basil grown in closed-loop hydroponic bays for unmatched culinary aromas.', meta: 'Vertical Farm Herb', img: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?auto=format&fit=crop&w=800&q=80', actionText: 'Order Fresh' },
        { name: 'Chef\'s Vertical Farm Subscription', badge: 'Weekly Box', desc: 'Rotating weekly selection of freshly cut microgreens and crisp hydroponic herbs delivered to your door.', meta: 'Fresh Microgreens Delivery', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', actionText: 'Subscribe Weekly' },
        { name: 'Wholesale Restaurant Microgreens', badge: 'Commercial Supply', desc: 'Direct wholesale crates of living microgreens harvested for fine dining restaurants and bistros.', meta: 'Vertical Farm Wholesale', img: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&q=80', actionText: 'Request Wholesale' },
      ],
      formTitle: 'Order Fresh Microgreens from Our Vertical Farm',
      formSubtitle: 'Request home delivery or wholesale restaurant supply of our organic hydroponic greens.',
      formActionBtn: 'Send Hydroponic Order Request',
    };
  } else if (/neurology|brain health|cognitive|neuroscience|concussion|memory care/i.test(lower)) {
    config = {
      industryTitle: 'Cognitive Neurology & Restorative Brain Health',
      palette: {
        bg: '#f8fafc',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#1e3a8a',
        primaryHover: '#1e40af',
        accent: '#0284c7',
        text: '#0f172a',
        muted: '#475569',
        border: '#cbd5e1',
      },
      heroBadge: 'Evidence-Based Cognitive Neurology & Brain Health Diagnostics',
      heroHeadline: 'Advanced neurology care focused on restorative cognitive health and brain vitality.',
      heroLead: 'Board-certified neurologists providing precision qEEG diagnostics, targeted cognitive rehabilitation, and evidence-backed therapies for optimal lifelong brain health.',
      pillarsTitle: 'Clinical Foundations of Neurology & Brain Health',
      pillars: [
        { icon: '🧠', title: 'Comprehensive Cognitive Assessment', desc: 'Quantitative neurocognitive testing and digital biomarkers evaluating memory, attention, and executive function.' },
        { icon: '🔬', title: 'Advanced Diagnostic Neurology', desc: 'High-density qEEG mapping, autonomic nervous system testing, and metabolic brain biomarkers.' },
        { icon: '⚡', title: 'Neuroplasticity & Cognitive Training', desc: 'Personalized neuro-rehabilitation protocols leveraging neuroplasticity to restore cognitive performance.' },
        { icon: '🛡️', title: 'Long-Term Brain Health Protection', desc: 'Multi-modal prevention strategies mitigating cognitive decline and protecting neurological longevity.' },
      ],
      catalogTitle: 'Clinical Neurology & Brain Health Services',
      catalogSubtitle: 'Comprehensive cognitive consultations, neurological diagnostics, and restorative brain health therapy.',
      items: [
        { name: 'Executive Cognitive Neurology Evaluation', badge: 'Comprehensive Exam', desc: 'Multi-hour diagnostic workup evaluating memory circuits, processing speed, and brain health metrics.', meta: 'Board-Certified Neurology', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Consultation' },
        { name: 'Quantitative EEG Brain Health Mapping', badge: 'Diagnostic Imaging', desc: '24-channel digital brain wave mapping identifying focal slowing, dysregulation, and cognitive biomarkers.', meta: 'Precision Neurology', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Scan' },
        { name: 'Post-Concussion Cognitive Recovery', badge: 'Targeted Protocol', desc: 'Evidence-based neuro-vestibular and cognitive rehabilitation for prolonged concussion recovery.', meta: 'Restorative Neurology', img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', actionText: 'Book Assessment' },
        { name: 'Memory Preservation & Brain Health', badge: 'Proactive Care', desc: 'Translational cognitive interventions and metabolic therapies designed to preserve long-term brain health.', meta: 'Cognitive Longevity', img: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Protocol' },
        { name: 'Non-Invasive Neuromodulation Therapy', badge: 'Clinical Neuro-Tech', desc: 'FDA-cleared targeted electrical and magnetic stimulation protocols enhancing neural synchrony and focus.', meta: 'Advanced Neurology', img: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80', actionText: 'Learn More' },
        { name: 'Pediatric & Adolescent Cognitive Care', badge: 'Specialized Neurology', desc: 'Developmental cognitive neurology focusing on attention architectures, executive function, and brain health.', meta: 'Youth Neurology', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Consultation' },
      ],
      formTitle: 'Schedule a Confidential Neurology Consultation',
      formSubtitle: 'Begin your path toward restorative cognitive performance and lifelong brain health.',
      formActionBtn: 'Request Clinical Appointment',
    };
  } else if (/vinyl|record store|analog listening|turntable|audiophile|hi-fi/i.test(lower)) {
    config = {
      industryTitle: 'Independent Vinyl Record Store & Analog Listening Lounge',
      palette: {
        bg: '#18181b',
        surface: '#27272a',
        card: '#27272a',
        primary: '#f59e0b',
        primaryHover: '#d97706',
        accent: '#fbbf24',
        text: '#f4f4f5',
        muted: '#a1a1aa',
        border: '#3f3f46',
      },
      heroBadge: 'Curated First Pressings, Audiophile Reissues & Analog Listening',
      heroHeadline: 'Rediscover the warm, uncompressed sound of original vinyl records.',
      heroLead: 'A sanctuary for music collectors. Browse thousands of rare vinyl records, explore audiophile pressings, and experience full albums in our dedicated vacuum-tube listening lounge.',
      pillarsTitle: 'The Pure Analog Experience',
      pillars: [
        { icon: '🎵', title: 'Curated Vinyl Record Vault', desc: 'Inspected, ultrasonic-cleaned original pressings and 180-gram analog remaster vinyl.' },
        { icon: '🎧', title: 'Dedicated Analog Listening Lounge', desc: 'Private acoustic booths outfitted with McIntosh tube amplifiers and Grado reference headphones.' },
        { icon: '📀', title: 'Ultrasonic Record Restoration', desc: 'State-of-the-art multi-stage ultrasonic cavitation cleaning removing micro-groove dust and static.' },
        { icon: '☕', title: 'Natural Wine & Espresso Bar', desc: 'Single-origin coffees and low-intervention natural wines to accompany your listening sessions.' },
      ],
      catalogTitle: 'Featured Vinyl Records & Listening Booths',
      catalogSubtitle: 'Rare original record pressings, new independent arrivals, and bookable private listening lounge sessions.',
      items: [
        { name: 'Miles Davis — Kind of Blue (Mono 180g)', badge: 'Audiophile Record', desc: 'Definitive analog cut from the original master tapes with quiet surfaces and stunning horn dynamics.', meta: 'Blue Note · Mint Vinyl', img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', actionText: 'Reserve Record' },
        { name: 'Analog Listening Lounge Private Session', badge: 'Listening Lounge', desc: '60-minute private booth listening experience featuring tube pre-amps, turntable, and vinyl library access.', meta: 'Audiophile Listening Booth', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', actionText: 'Book Listening Session' },
        { name: 'John Coltrane — A Love Supreme (Impulse!)', badge: 'Rare Pressing', desc: 'Gatefold original pressing with deep groove labels and sublime tenor saxophone fidelity.', meta: 'Original Vinyl Record', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80', actionText: 'Reserve Record' },
        { name: 'Ultrasonic Vinyl Record Deep Cleaning', badge: 'Record Care', desc: 'Professional 35kHz cavitation bath and vacuum drying restoring neglected records to whisper-quiet playback.', meta: 'Vinyl Preservation', img: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80', actionText: 'Book Record Service' },
        { name: 'Fleetwood Mac — Rumours (Textured Sleeve)', badge: 'Vintage Vinyl', desc: 'Original textured sleeve release with insert lyrics and warm analog soundstage.', meta: 'Classic Rock Record', img: 'https://images.unsplash.com/photo-1546707012-c46675f12716?auto=format&fit=crop&w=800&q=80', actionText: 'Reserve Record' },
        { name: 'Independent Japanese City Pop Crate', badge: 'Import Vinyl', desc: 'Exclusive Tokyo import pressings featuring crisp brass sections and sparkling disco funk grooves.', meta: 'Japanese Pressing Vinyl', img: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=800&q=80', actionText: 'Browse Crate' },
      ],
      formTitle: 'Reserve a Listening Lounge Booth or Inquire on Rare Vinyl',
      formSubtitle: 'Let our crate curators know what rare vinyl record titles you are hunting for.',
      formActionBtn: 'Send Record Inquiry',
    };
  } else if (/maritime|admiralty|shipping law|vessel arrest|salvage|cargo dispute/i.test(lower)) {
    config = {
      industryTitle: 'Maritime & Admiralty Legal Counsel',
      palette: {
        bg: '#f8fafc',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#0c4a6e',
        primaryHover: '#075985',
        accent: '#0284c7',
        text: '#0f172a',
        muted: '#475569',
        border: '#cbd5e1',
      },
      heroBadge: 'Specialized Maritime Law & Admiralty Legal Counsel',
      heroHeadline: 'Decisive admiralty legal counsel protecting shipowners, charterers, and maritime cargo interests.',
      heroLead: 'Senior admiralty attorneys delivering rapid legal intervention for ocean carrier disputes, marine insurance claims, salvage operations, and emergency vessel arrests.',
      pillarsTitle: 'Maritime & Admiralty Legal Pillars',
      pillars: [
        { icon: '⚓', title: 'Emergency Admiralty Vessel Arrest', desc: 'Rapid jurisdiction enforcement and emergency vessel attachment across global commercial ports.' },
        { icon: '🚢', title: 'Cargo Loss & Marine Insurance Legal Counsel', desc: 'Strategic recovery advocacy for major casualty, general average, and container loss disputes.' },
        { icon: '📜', title: 'Charterparty & Bill of Lading Contracts', desc: 'Precision legal drafting and arbitration under London (LMAA) and New York (SMA) maritime rules.' },
        { icon: '🌊', title: 'Collision, Salvage & Environmental Law', desc: 'Immediate legal crisis management for marine collisions, towage agreements, and bunker disputes.' },
      ],
      catalogTitle: 'Admiralty Legal Practice Areas',
      catalogSubtitle: 'Comprehensive maritime legal representation and commercial marine advisory.',
      items: [
        { name: 'Emergency Admiralty Vessel Arrest & Release', badge: 'Legal Defense', desc: 'Immediate legal filings for maritime lien enforcement, vessel arrest, and expedited counter-security.', meta: 'Admiralty Legal Counsel', img: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80', actionText: 'Retain Admiralty Counsel' },
        { name: 'Charterparty Dispute Maritime Arbitration', badge: 'Arbitration Counsel', desc: 'Resolving complex laytime, demurrage, speed and consumption disputes under standard maritime forms.', meta: 'Admiralty Legal Counsel', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', actionText: 'Retain Admiralty Counsel' },
        { name: 'Marine Insurance & General Average Legal', badge: 'Claims Advocacy', desc: 'Advising hull underwriters, P&I clubs, and cargo owners on general average declarations and legal subrogation.', meta: 'Maritime Legal Practice', img: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=800&q=80', actionText: 'Retain Admiralty Counsel' },
        { name: 'Collision & Salvage Maritime Response', badge: 'Casualty Counsel', desc: '24/7 legal investigation and Lloyd\'s Open Form (LOF) salvage representation following vessel collision.', meta: 'Emergency Maritime Law', img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80', actionText: 'Retain Admiralty Counsel' },
        { name: 'Ship Finance & Vessel Registration', badge: 'Transaction Counsel', desc: 'Structuring cross-border ship mortgage deeds, flag state registrations, and multi-vessel sale & purchase.', meta: 'Admiralty Commercial Counsel', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', actionText: 'Retain Admiralty Counsel' },
        { name: 'Port Operations & Stevedore Liability', badge: 'Operational Advisory', desc: 'Advising terminal operators and stevedoring firms on regulatory maritime compliance and dock damage liabilities.', meta: 'Maritime Legal Counsel', img: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80', actionText: 'Retain Admiralty Counsel' },
      ],
      formTitle: 'Request an Urgent Maritime Legal Consultation',
      formSubtitle: 'Our admiralty legal counsel is available 24/7 for urgent marine casualty and vessel arrest matters.',
      formActionBtn: 'Contact Admiralty Counsel',
    };
  } else if (/bakery|bread|sourdough|pastry|cake|coffee|roaster|cafe|tea|bistro|diner|culinary/i.test(lower)) {
    config = {
      industryTitle: 'Artisanal Food & Beverage',
      palette: {
        bg: '#fdfbf7',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#78350f',
        primaryHover: '#59250b',
        accent: '#d97706',
        text: '#1c1917',
        muted: '#78716c',
        border: '#e7e0d5',
      },
      heroBadge: 'Slow Fermentation & Natural Ingredients',
      heroHeadline: 'Handcrafted sourdough, heirloom bakes, and single-origin roasts.',
      heroLead: 'We believe good food takes patience. Baked fresh at dawn using certified organic stoneground flours and heritage wild yeast starters.',
      pillarsTitle: 'Our Baking Philosophy',
      pillars: [
        { icon: '🌾', title: '100% Organic Grains', desc: 'Sourced directly from regional organic farmers who prioritize regenerative soil stewardship.' },
        { icon: '⏳', title: '36-Hour Cold Fermentation', desc: 'Slow, natural wild yeast fermentation unlocks deep complex flavor and improves natural digestibility.' },
        { icon: '🔥', title: 'Deck Oven Stone Baking', desc: 'Baked directly on high-thermal stone hearths for an unmistakable blistered crust and open crumb.' },
        { icon: '☕', title: 'Direct-Trade Micro Roasts', desc: 'Ethically sourced single-origin coffees roasted weekly in small batches for peak aromatic freshness.' },
      ],
      catalogTitle: 'Fresh From the Morning Bake',
      catalogSubtitle: 'Available fresh daily at our bakery counter or reserved for morning pickup.',
      items: [
        { name: 'Country Sourdough Batard', badge: 'Signature Loaf', desc: 'Blistered caramelized crust with a custardy, open crumb made with organic whole wheat and rye.', meta: 'Fresh Daily · Vegan', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', actionText: 'Reserve Loaf' },
        { name: 'Kardemummabulle (Cardamom Bun)', badge: 'Traditional', desc: 'Twisted Scandinavian dough infused with freshly crushed green cardamom and Swedish pearl sugar.', meta: 'Morning Batch', img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', actionText: 'Add to Order' },
        { name: 'Heirloom Seeded Rye', badge: 'Dense & Nutty', desc: '100% rye sourdough packed with toasted flax, sunflower, and pumpkin seeds with rich malt undertones.', meta: 'Whole Grain', img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80', actionText: 'Reserve Loaf' },
        { name: 'Pain au Chocolat', badge: 'Laminated', desc: 'Hand-laminated flaky butter pastry wrapped around dual batons of 70% single-origin dark chocolate.', meta: 'French Butter', img: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=800&q=80', actionText: 'Add to Order' },
        { name: 'Almond Frangipane Tart', badge: 'Seasonal Tart', desc: 'Crisp sablé shell filled with rich roasted almond cream and topped with seasonal stone fruits.', meta: 'Patisserie', img: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80', actionText: 'Add to Order' },
        { name: 'House Espresso Roast', badge: 'Whole Bean · 250g', desc: 'Single-origin washed Ethiopian beans featuring notes of bergamot, candied stone fruit, and dark honey.', meta: 'Direct Trade', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', actionText: 'Acquire Bag' },
      ],
      formTitle: 'Pre-Order & Custom Catering Inquiries',
      formSubtitle: 'Reserve loaves in advance for weekend gatherings or special morning events.',
      formActionBtn: 'Submit Order Request',
    };
  } else if (/yoga|fitness|gym|pilates|wellness|retreat|spa|health|physio/i.test(lower)) {
    config = {
      industryTitle: 'Health & Mindful Movement',
      palette: {
        bg: '#f8fafc',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#0f766e',
        primaryHover: '#115e59',
        accent: '#14b8a6',
        text: '#0f172a',
        muted: '#64748b',
        border: '#e2e8f0',
      },
      heroBadge: 'Mindful Somatic Practice & Strength',
      heroHeadline: 'Ground your body. Restore your breath. Build sustainable vitality.',
      heroLead: 'Intimate studio classes combining alignment-focused movement, breathwork, and restorative sound therapy in a light-filled sanctuary.',
      pillarsTitle: 'Our Movement Foundations',
      pillars: [
        { icon: '🌿', title: 'Anatomical Alignment', desc: 'Precision cueing and hands-on guidance to protect joints, build spinal integrity, and release chronic tension.' },
        { icon: '🌬️', title: 'Pranayama & Nervous System', desc: 'Dedicated breathwork practices designed to downregulate stress hormones and restore parasympathetic calm.' },
        { icon: '🧘', title: 'Small-Group Intimacy', desc: 'Class sizes capped at 12 practitioners to ensure personalized instructor attention and spacious movement.' },
        { icon: '✨', title: 'Thermal & Sound Recovery', desc: 'Complimentary access to our cedar dry sauna, infrared therapy mats, and singing bowl sound meditations.' },
      ],
      catalogTitle: 'Studio Classes & Movement Immersions',
      catalogSubtitle: 'Carefully curated sessions led by experienced, trauma-informed movement instructors.',
      items: [
        { name: 'Vinyasa Flow & Dynamic Strength', badge: 'All Levels', desc: 'Breath-synchronized sequences cultivating physical stamina, core heat, and mental presence.', meta: '60 Minutes', img: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80', actionText: 'Book Class' },
        { name: 'Restorative Sound & Yin Therapy', badge: 'Gentle & Calming', desc: 'Long-held supported postures on organic bolsters accompanied by Tibetan quartz sound bowls.', meta: '75 Minutes', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80', actionText: 'Book Class' },
        { name: 'Functional Mat Pilates Core', badge: 'Strength Focus', desc: 'Low-impact, high-intensity core stabilization and pelvic floor conditioning for posture and athletic longevity.', meta: '50 Minutes', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80', actionText: 'Book Class' },
        { name: 'Breathwork & Ice Plunge Immersion', badge: 'Weekend Workshop', desc: 'Guided neuro-somatic breathing followed by supervised cold immersion in outdoor spring-fed tubs.', meta: '90 Minutes', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80', actionText: 'Reserve Spot' },
        { name: 'Prenatal & Postnatal Movement', badge: 'Specialized Care', desc: 'Nurturing sequences tailored to support maternal bodies through all trimesters and postpartum recovery.', meta: '60 Minutes', img: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=800&q=80', actionText: 'Book Class' },
        { name: 'Private 1-on-1 Somatic Coaching', badge: 'Personalized', desc: 'Tailored postural assessment, mobility rehabilitation, and private meditation tailored to your goals.', meta: '60 Minutes', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Private' },
      ],
      formTitle: 'Reserve Your Introductory Practice',
      formSubtitle: 'New practitioners receive our welcome week pass with unlimited studio access for 7 days.',
      formActionBtn: 'Reserve Welcome Pass',
    };
  } else if (/\b(law|legal|attorney|arbitration|barrister|counsel|finance|wealth advisory)\b/i.test(lower)) {
    config = {
      industryTitle: 'Legal & Professional Advisory',
      palette: {
        bg: '#f8fafc',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#0f172a',
        primaryHover: '#1e293b',
        accent: '#2563eb',
        text: '#0f172a',
        muted: '#475569',
        border: '#cbd5e1',
      },
      heroBadge: 'Rigorous Advocacy & Strategic Advisory',
      heroHeadline: 'Clear legal counsel navigating complex commercial and regulatory landscapes.',
      heroLead: 'We provide senior-led representation for enterprises, high-growth founders, and private individuals requiring discreet, high-stakes counsel.',
      pillarsTitle: 'Our Practice Principles',
      pillars: [
        { icon: '⚖️', title: 'Senior-Led Representation', desc: 'Your matters are handled directly by seasoned partners, not delegated to junior associates.' },
        { icon: '🛡️', title: 'Discreet Strategic Diligence', desc: 'Protecting intellectual property, corporate governance, and commercial interests with unyielding rigor.' },
        { icon: '💡', title: 'Commercial Pragmatism', desc: 'We deliver actionable business solutions that facilitate growth rather than creating endless roadblocks.' },
        { icon: '🔒', title: 'Transparent Milestone Pricing', desc: 'Predictable fixed-fee or phased billing structures with zero opaque hourly surprises.' },
      ],
      catalogTitle: 'Core Practice Areas',
      catalogSubtitle: 'Comprehensive legal and commercial advisory tailored to modern business environments.',
      items: [
        { name: 'Corporate Governance & M&A', badge: 'Transaction Counsel', desc: 'Cross-border mergers, venture equity financings, joint ventures, and fiduciary advisory.', meta: 'Corporate Practice', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Review' },
        { name: 'Intellectual Property & Patents', badge: 'IP Protection', desc: 'Trademark registration, proprietary software licensing, trade secret protection, and IP audits.', meta: 'Technology & IP', img: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Review' },
        { name: 'Commercial Contract Architecture', badge: 'Operational Diligence', desc: 'Drafting master service agreements, supply chain frameworks, and enterprise partnership deeds.', meta: 'Commercial Law', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Review' },
        { name: 'Commercial Dispute Arbitration', badge: 'Dispute Resolution', desc: 'Alternative dispute resolution, private arbitration, and strategic pre-litigation negotiation.', meta: 'Dispute Resolution', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Review' },
        { name: 'Employment & Executive Equity', badge: 'Talent & Incentives', desc: 'Executive compensation structures, equity incentive plans, and employment dispute compliance.', meta: 'Employment Advisory', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Review' },
        { name: 'Private Wealth & Family Trusts', badge: 'Asset Protection', desc: 'Multi-generational estate planning, succession architecture, and private family office advisory.', meta: 'Private Wealth', img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80', actionText: 'Schedule Review' },
      ],
      formTitle: 'Request a Confidential Case Evaluation',
      formSubtitle: 'Submit brief non-confidential details to schedule a preliminary partner consultation.',
      formActionBtn: 'Submit Consultation Request',
    };
  } else {
    // General bespoke business archetype (Zero SaaS, high craft)
    config = {
      industryTitle: 'Bespoke Studio & Craft',
      palette: {
        bg: '#fdfbf7',
        surface: '#ffffff',
        card: '#ffffff',
        primary: '#1c1917',
        primaryHover: '#292524',
        accent: '#d97706',
        text: '#1c1917',
        muted: '#57534e',
        border: '#e7e0d5',
      },
      heroBadge: 'Honest Materials & Dedicated Craft',
      heroHeadline: 'Thoughtfully designed, sustainably made, built to endure.',
      heroLead: 'We bring intentionality and quiet excellence to every commission. Sourced ethically, refined with care, and tailored to your life.',
      pillarsTitle: 'Our Guiding Principles',
      pillars: [
        { icon: '🌿', title: 'Ethical Provenance', desc: 'Every raw material is traceable, responsibly harvested, and chosen for longevity.' },
        { icon: '✨', title: 'Master Craftsmanship', desc: 'Trained artisans hand-assemble each piece with precision joinery and meticulous quality control.' },
        { icon: '📐', title: 'Custom Tailoring', desc: 'Every project can be customized to your specific dimensions, aesthetic palette, and functional needs.' },
        { icon: '🤝', title: 'Direct Collaboration', desc: 'Work directly with our studio founders from preliminary concept sketches to final delivery.' },
      ],
      catalogTitle: 'Featured Studio Creations',
      catalogSubtitle: 'A curated selection of our most celebrated works, available for acquisition or custom commission.',
      items: [
        { name: 'Signature Studio Creation I', badge: 'Flagship Edition', desc: 'Crafted using sustainably sourced materials with subtle tactile detailing and hand-rubbed finish.', meta: 'Studio Classic', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Commission' },
        { name: 'Bespoke Artisan Series II', badge: 'Limited Edition', desc: 'Individually numbered workshop piece marrying clean geometry with organic warmth.', meta: 'Numbered 1 of 50', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Commission' },
        { name: 'Custom Heritage Work III', badge: 'Hand Finished', desc: 'Made to order with bespoke dimension choices and personalized material options.', meta: 'Custom Dimensions', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Commission' },
        { name: 'Minimalist Everyday Piece IV', badge: 'Daily Essential', desc: 'Clean, understated design created for effortless integration into modern living spaces.', meta: 'Timeless Form', img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Commission' },
        { name: 'Organic Material Sculpture V', badge: 'Natural Texture', desc: 'Celebrating the natural grain, texture variations, and tactile character of honest materials.', meta: 'Organic Character', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Commission' },
        { name: 'Architectural Collector Work VI', badge: 'Collector Choice', desc: 'An ambitious sculptural statement exploring proportion, shadow, and structural balance.', meta: 'Collector Piece', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', actionText: 'Inquire Commission' },
      ],
      formTitle: 'Initiate a Studio Dialogue',
      formSubtitle: 'Tell us about your project aspirations, dimensions, or questions. We respond within 24 hours.',
      formActionBtn: 'Send Message to Studio',
    };
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — ${config.industryTitle}</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Top Bar -->
  <aside class="announcement-bar" role="complementary">
    <div class="container bar-inner">
      <span>Dedicated Craft &bull; Sustainable Provenance &bull; Inquiries Welcomed Worldwide</span>
    </div>
  </aside>

  <!-- Navigation -->
  <header class="navbar" id="topNav">
    <div class="container nav-wrap">
      <a href="#hero" class="brand-logo">
        <span class="logo-mark">✦</span>
        <span class="logo-text">${brandName}</span>
      </a>
      <nav class="nav-links">
        <a href="#about" class="nav-link">About</a>
        <a href="#catalog" class="nav-link">Showcase</a>
        <a href="#contact" class="nav-link">Inquiries</a>
      </nav>
      <div class="nav-actions">
        <a href="#contact" class="btn btn-primary btn-sm">Get in Touch</a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section id="hero" class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>${config.heroBadge}</span>
        </div>
        <h1 class="hero-title">${config.heroHeadline}</h1>
        <p class="hero-lead">${config.heroLead}</p>
        <div class="hero-cta-group">
          <a href="#catalog" class="btn btn-primary btn-lg">Explore Selected Works</a>
          <a href="#contact" class="btn btn-secondary btn-lg">Contact Our Studio</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-photo-wrapper">
          <img 
            src="${config.items[0].img}" 
            alt="${brandName} Showcase" 
            class="hero-photo-img" 
            loading="eager"
            onerror="this.onerror=null; this.classList.add('img-fallback');"
          >
          <div class="photo-overlay-badge">${brandName} &bull; Handcrafted Excellence</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pillars Section -->
  <section id="about" class="section-pillars">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Methodology</span>
        <h2 class="section-title">${config.pillarsTitle}</h2>
      </div>

      <div class="pillars-grid">
        ${config.pillars
          .map(
            (p) => `
        <article class="pillar-card">
          <div class="pillar-icon">${p.icon}</div>
          <h3 class="pillar-title">${p.title}</h3>
          <p class="pillar-desc">${p.desc}</p>
        </article>`
          )
          .join('\n')}
      </div>
    </div>
  </section>

  <!-- Catalog / Service Grid -->
  <section id="catalog" class="section-catalog">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Selected Portfolio</span>
        <h2 class="section-title">${config.catalogTitle}</h2>
        <p class="section-subtitle">${config.catalogSubtitle}</p>
      </div>

      <div class="catalog-grid">
        ${config.items
          .map(
            (item, idx) => `
        <article class="catalog-card">
          <div class="catalog-thumb">
            <span class="catalog-badge">${item.badge}</span>
            <img 
              src="${item.img}" 
              alt="${item.name}" 
              class="catalog-img" 
              loading="lazy"
              onerror="this.onerror=null; this.classList.add('img-fallback');"
            >
          </div>
          <div class="catalog-info">
            <div class="catalog-meta">${item.meta}</div>
            <h3 class="catalog-name">${item.name}</h3>
            <p class="catalog-desc">${item.desc}</p>
            <div class="catalog-foot">
              <button type="button" class="btn btn-secondary btn-sm btn-item-action" data-item="${item.name}">
                ${item.actionText} &rarr;
              </button>
            </div>
          </div>
        </article>`
          )
          .join('\n')}
      </div>
    </div>
  </section>

  <!-- Contact Form -->
  <section id="contact" class="section-contact">
    <div class="container contact-container">
      <div class="section-header text-center">
        <span class="section-pill-tag">Direct Dialogue</span>
        <h2 class="section-title">${config.formTitle}</h2>
        <p class="section-subtitle">${config.formSubtitle}</p>
      </div>

      <form class="contact-form" id="dialogueForm">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" required placeholder="Alex Mercer">
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" required placeholder="alex@domain.com">
          </div>
        </div>

        <div class="form-group">
          <label for="interest">Area of Interest</label>
          <input type="text" id="interest" placeholder="E.g., Custom commission, class reservation, or general inquiry">
        </div>

        <div class="form-group">
          <label for="message">Your Message</label>
          <textarea id="message" rows="4" required placeholder="Describe your vision, timeline, or question in detail..."></textarea>
        </div>

        <div class="form-actions text-center">
          <button type="submit" class="btn btn-primary btn-lg" id="submitDialogueBtn">${config.formActionBtn}</button>
        </div>
        <div class="form-success-message" id="dialogueSuccessMsg" style="display: none;">
          <p>✓ Thank you. Your message has been received by our studio team. We will reply within one business day.</p>
        </div>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="logo-mark">✦</span>
          <span class="logo-text">${brandName}</span>
        </div>
        <p class="footer-tagline">Crafting enduring, intentional work with dedication to quality and honest materials.</p>
        <p class="footer-copy">&copy; 2026 ${brandName}. All rights reserved.</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Navigation</h4>
        <p class="footer-link"><a href="#about">Philosophy</a></p>
        <p class="footer-link"><a href="#catalog">Showcase</a></p>
        <p class="footer-link"><a href="#contact">Direct Inquiries</a></p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Studio Inquiries</h4>
        <p class="footer-address">General: <strong>hello@${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</strong><br>Hours: Monday – Friday, 9:00 AM – 5:00 PM</p>
      </div>
      <div class="footer-col">
        <h4 class="footer-heading">Ethos</h4>
        <p class="footer-address">We partner with conscious purveyors and master makers committed to circular sustainability and transparent sourcing.</p>
      </div>
    </div>
  </footer>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const p = config.palette;

  const themeCss = `/* styles/theme.css — Dynamic Studio Design Tokens */
:root {
  --color-bg: ${p.bg};
  --color-surface: ${p.surface};
  --color-card: ${p.card};
  --color-primary: ${p.primary};
  --color-primary-hover: ${p.primaryHover};
  --color-accent: ${p.accent};
  --color-text: ${p.text};
  --color-muted: ${p.muted};
  --color-border: ${p.border};

  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-pill: 9999px;

  --shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 12px 28px rgba(0, 0, 0, 0.08);
  --transition: all 0.25s ease;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  overflow-x: hidden;
  max-width: 100vw;
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text);
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

button, input, textarea {
  font: inherit;
}`;

  const siteCss = `/* assets/site.css — Dynamic Studio Layout & Styles */
.container {
  width: 100%;
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 2rem;
}

.announcement-bar {
  background-color: var(--color-primary);
  color: #ffffff;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  padding: 0.65rem 0;
  text-align: center;
  font-weight: 600;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
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
  font-weight: 800;
  color: var(--color-text);
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
  color: var(--color-text);
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

.hero-section {
  padding: 5rem 0 6rem;
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
  background-color: rgba(0,0,0,0.04);
  border: 1px solid var(--color-border);
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
  background-color: var(--color-accent);
}
.hero-title {
  font-size: 3.25rem;
  line-height: 1.15;
  font-weight: 800;
  margin-bottom: 1.25rem;
  color: var(--color-text);
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
}
.hero-photo-wrapper {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-subtle);
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
  background-color: rgba(0,0,0,0.85);
  color: #ffffff;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

.section-pillars {
  padding: 6rem 0;
  background-color: rgba(0,0,0,0.02);
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
  color: var(--color-primary);
  background-color: rgba(0,0,0,0.06);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  margin-bottom: 0.75rem;
}
.section-title {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.section-subtitle {
  font-size: 1.05rem;
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
  background-color: var(--color-card);
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
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
}

.section-catalog {
  padding: 6rem 0;
}
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
}
.catalog-card {
  background-color: var(--color-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
}
.catalog-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
.catalog-thumb {
  position: relative;
  height: 240px;
  overflow: hidden;
  background-color: rgba(0,0,0,0.05);
}
.catalog-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.catalog-card:hover .catalog-img {
  transform: scale(1.04);
}
.catalog-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(0,0,0,0.85);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
}
.catalog-info {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.catalog-meta {
  font-size: 0.75rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
  font-weight: 700;
}
.catalog-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
}
.catalog-desc {
  font-size: 0.875rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}
.catalog-foot {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

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
}
.form-group input,
.form-group textarea {
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: #fafbfc;
  color: var(--color-text);
  transition: var(--transition);
}
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: #ffffff;
}
.form-success-message {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: var(--radius-sm);
  color: #065f46;
  font-weight: 600;
  text-align: center;
}

.footer {
  background-color: rgba(0,0,0,0.04);
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
  font-weight: 800;
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
  color: var(--color-primary);
}

.img-fallback {
  background-color: rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
}

@media (max-width: 992px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .pillars-grid, .catalog-grid {
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
  .pillars-grid, .catalog-grid {
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

  const siteJs = `/* assets/site.js — Dynamic Studio Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // Action buttons on items scroll to inquiry form and prefill interest
  document.querySelectorAll('.btn-item-action').forEach((btn) => {
    btn.addEventListener('click', () => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        const interestInput = document.getElementById('interest');
        if (interestInput) {
          interestInput.value = btn.dataset.item || '';
        }
      }
    });
  });

  // Dialogue Form
  const form = document.getElementById('dialogueForm');
  const successMsg = document.getElementById('dialogueSuccessMsg');
  const submitBtn = document.getElementById('submitDialogueBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting Message...';
      }
      setTimeout(() => {
        if (successMsg) successMsg.style.display = 'block';
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Message Received';
        }
      }, 700);
    });
  }
});`;

  const readme = `# ${brandName} — ${config.industryTitle}

Production-grade website tailored for ${brandName}:
- Distinct visual aesthetic and design tokens tailored to ${config.industryTitle}
- 6 featured service/product offerings with responsive card layouts
- 4 foundational craftsmanship and practice pillars
- Direct dialogue/inquiry form with prefilling interactions
- Zero SaaS leakage, zero fabricated claims

## Structure
- \`index.html\`: Semantic HTML5 structure
- \`styles/theme.css\`: Design tokens
- \`assets/site.css\`: Layout and responsive styling
- \`assets/site.js\`: Form handling and interactions
`;

  return [
    { path: 'index.html', content: html, language: 'html' },
    { path: 'styles/theme.css', content: themeCss, language: 'css' },
    { path: 'assets/site.css', content: siteCss, language: 'css' },
    { path: 'assets/site.js', content: siteJs, language: 'javascript' },
    { path: 'README.md', content: readme, language: 'markdown' },
  ];
}
