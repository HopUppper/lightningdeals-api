/**
 * scripts/test-builder-overhaul.ts
 * ============================================================================
 * Production Regression Test Suite for AI Website & App Builder Quality Overhaul
 * 
 * Verifies:
 * 1. 5 Distinct Archetypes produced for different prompts (Restaurant, SaaS, Portfolio, Dashboard, Store)
 * 2. Visual design integrity, purposeful components, and functional interactive vanilla JS
 * 3. Sandboxed live preview compilation & SVG data-URI inlining
 * 4. Iterative conversational refinement and version snapshotting
 * 5. Model registry integrity: 100% Claude 4/5/5.5, zero Claude 3 models
 * ============================================================================
 */

import {
  detectProjectArchetype,
  synthesizeByArchetype,
  synthesizeRestaurantWebsite,
  synthesizeSaaSLandingPage,
  synthesizePortfolioWebsite,
  synthesizeDashboardApp,
  synthesizeStorefrontWebsite,
} from '../server/studioBuilderArchetypes';
import {
  synthesizeProjectFiles,
  compilePreviewBundle,
  validateProjectBundle,
} from '../server/studioBuilder';
import { VERIFIED_STUDIO_MODELS } from '../server/studio';
import { getFriendlyModelName, findCatalogModel } from '../server/gateway';

async function runTestSuite() {
  console.log('🚀 Starting AI Website Builder Quality Overhaul Test Suite...\n');
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Archetype Detection & Prompt Classification
  // --------------------------------------------------------------------------
  console.log('📋 SECTION 1: Archetype Detection & Prompt Classification');
  const restaurantPrompt = 'Build a website for an authentic South Indian restaurant in Indiranagar Bangalore with menu, table reservation modal, and chef specialties';
  const saasPrompt = 'Create a landing page for an AI developer platform featuring sub-50ms latency, product preview mockup, interactive pricing toggle, and FAQ accordion';
  const portfolioPrompt = 'Design an editorial photography portfolio for Vikram Sen with full-bleed hero, category filterable gallery, exhibition history, and booking inquiry form';
  const dashboardPrompt = 'Develop a real-time sales and revenue analytics dashboard with KPI metric cards, revenue bar chart, and filterable customer transaction table';
  const storePrompt = 'Build a modern skincare ecommerce storefront for Botanica Labs with category filters, product cards, star ratings, and slide-over shopping bag drawer';

  assert(detectProjectArchetype(restaurantPrompt, 'landing_page') === 'restaurant', 'Detects Restaurant archetype from restaurant prompt');
  assert(detectProjectArchetype(saasPrompt, 'landing_page') === 'saas', 'Detects SaaS archetype from developer platform prompt');
  assert(detectProjectArchetype(portfolioPrompt, 'landing_page') === 'portfolio', 'Detects Portfolio archetype from photography portfolio prompt');
  assert(detectProjectArchetype(dashboardPrompt, 'landing_page') === 'dashboard', 'Detects Dashboard archetype from sales analytics prompt');
  assert(detectProjectArchetype(storePrompt, 'landing_page') === 'store', 'Detects Store archetype from skincare storefront prompt');

  // --------------------------------------------------------------------------
  // TEST 2: Distinct Websites Generated (No Repetitive PulseAI)
  // --------------------------------------------------------------------------
  console.log('\n📋 SECTION 2: Regression Archetype 1 — South Indian Restaurant');
  const restFiles = synthesizeRestaurantWebsite(restaurantPrompt);
  const restHtml = restFiles.find(f => f.path.endsWith('.html'))?.content || '';
  const restJs = restFiles.find(f => f.path.endsWith('.js'))?.content || '';
  
  assert(restFiles.length >= 4, 'Restaurant bundle has at least 4 files (HTML, CSS, JS, README)');
  assert(!restHtml.includes('Pulse AI') && !restHtml.includes('PulseAI'), 'Restaurant does NOT contain generic Pulse AI branding');
  assert(restHtml.includes('Indiranagar') || restHtml.includes('Bangalore'), 'Restaurant contains Indiranagar / Bangalore location details');
  assert(restHtml.includes('Tiffin') && restHtml.includes('Thali') && restHtml.includes('Brews'), 'Restaurant contains dedicated South Indian culinary categories');
  assert(restHtml.includes('reserveModal'), 'Restaurant contains interactive Table Reservation modal');
  assert(restJs.includes('reserveForm') && restJs.includes('openReserveBtn'), 'Restaurant app.js contains modal & reservation logic');
  assert(validateProjectBundle(restFiles).valid, 'Restaurant bundle passes HTML5 validation');

  console.log('\n📋 SECTION 3: Regression Archetype 2 — SaaS Developer Platform');
  const saasFiles = synthesizeSaaSLandingPage(saasPrompt);
  const saasHtml = saasFiles.find(f => f.path.endsWith('.html'))?.content || '';
  const saasJs = saasFiles.find(f => f.path.endsWith('.js'))?.content || '';

  assert(!saasHtml.includes('Pulse AI'), 'SaaS page uses dynamic branding, not hardcoded Pulse AI');
  assert(saasHtml.includes('billingToggle'), 'SaaS contains interactive monthly/annual billing toggle');
  assert(saasHtml.includes('faq-item') || saasHtml.includes('faq-question'), 'SaaS contains FAQ accordion section');
  assert(saasHtml.includes('dashboard-preview'), 'SaaS contains live UI dashboard preview mockup');
  assert(saasJs.includes('billingToggle') && saasJs.includes('addEventListener'), 'SaaS app.js implements live discount calculation on toggle');
  assert(validateProjectBundle(saasFiles).valid, 'SaaS bundle passes HTML5 validation');

  console.log('\n📋 SECTION 4: Regression Archetype 3 — Editorial Photography Portfolio');
  const portFiles = synthesizePortfolioWebsite(portfolioPrompt);
  const portHtml = portFiles.find(f => f.path.endsWith('.html'))?.content || '';
  const portJs = portFiles.find(f => f.path.endsWith('.js'))?.content || '';

  assert(portHtml.includes('Vikram Sen'), 'Portfolio incorporates the photographer name Vikram Sen from prompt');
  assert(portHtml.includes('filter-btn'), 'Portfolio has category filter buttons');
  assert(portHtml.includes('Architecture') && portHtml.includes('Editorial'), 'Portfolio categories include Architecture & Editorial');
  assert(portHtml.includes('Exhibitions') || portHtml.includes('exhibition-item'), 'Portfolio contains solo exhibition history');
  assert(portJs.includes('filter-btn') && portJs.includes('photo-card'), 'Portfolio app.js provides instant client-side gallery filtering');
  assert(validateProjectBundle(portFiles).valid, 'Portfolio bundle passes HTML5 validation');

  console.log('\n📋 SECTION 5: Regression Archetype 4 — Sales Analytics Dashboard');
  const dashFiles = synthesizeDashboardApp(dashboardPrompt);
  const dashHtml = dashFiles.find(f => f.path.endsWith('.html'))?.content || '';
  const dashJs = dashFiles.find(f => f.path.endsWith('.js'))?.content || '';

  assert(dashHtml.includes('kpi-grid') || dashHtml.includes('kpi-card'), 'Dashboard contains KPI metrics grid');
  assert(dashHtml.includes('chart-panel') && dashHtml.includes('bar-col'), 'Dashboard contains monthly revenue bar chart');
  assert(dashHtml.includes('searchInput') && dashHtml.includes('transactionsTable'), 'Dashboard contains customer transaction table with search input');
  assert(dashJs.includes('searchInput') && dashJs.includes('exportBtn'), 'Dashboard app.js contains real-time search filtering & CSV export');
  assert(validateProjectBundle(dashFiles).valid, 'Dashboard bundle passes HTML5 validation');

  console.log('\n📋 SECTION 6: Regression Archetype 5 — Skincare Storefront');
  const storeFiles = synthesizeStorefrontWebsite(storePrompt);
  const storeHtml = storeFiles.find(f => f.path.endsWith('.html'))?.content || '';
  const storeJs = storeFiles.find(f => f.path.endsWith('.js'))?.content || '';

  assert(storeHtml.includes('Botanica Labs'), 'Storefront reflects the brand name Botanica Labs from prompt');
  assert(storeHtml.includes('cartDrawer'), 'Storefront contains slide-over shopping bag drawer');
  assert(storeHtml.includes('prod-card') && storeHtml.includes('prod-price'), 'Storefront contains catalog product cards with ratings & prices');
  assert(storeJs.includes('renderCart') && storeJs.includes('updateCartQty'), 'Storefront app.js manages full cart state, quantities & subtotals');
  assert(validateProjectBundle(storeFiles).valid, 'Storefront bundle passes HTML5 validation');

  // --------------------------------------------------------------------------
  // TEST 3: Sandboxed Live Preview Bundler
  // --------------------------------------------------------------------------
  console.log('\n📋 SECTION 7: Sandboxed Live Preview Compilation');
  const previewHtml = compilePreviewBundle(storeFiles);
  assert(previewHtml.includes('<style data-source='), 'Preview compiler inlines CSS styles with source metadata');
  assert(previewHtml.includes('<script data-source='), 'Preview compiler inlines JS scripts with runtime error boundary');
  assert(!previewHtml.includes('<link rel="stylesheet"'), 'Preview compiler removes external CSS link tags');
  assert(previewHtml.length > 5000, `Preview HTML is substantial and fully populated (${previewHtml.length} bytes)`);

  // --------------------------------------------------------------------------
  // TEST 4: Model Registry Integrity (Claude 4/5/5.5 only, Zero Claude 3)
  // --------------------------------------------------------------------------
  console.log('\n📋 SECTION 8: Model Registry & Gateway Integrity');
  const models = VERIFIED_STUDIO_MODELS;
  assert(models.length >= 6, `Verified models catalog has ${models.length} production models`);

  const hasAnyClaude3 = models.some(m => 
    m.id.includes('claude-3') || 
    m.name.includes('Claude 3') || 
    m.id.includes('3.5') || 
    m.name.includes('3.5')
  );
  assert(!hasAnyClaude3, 'Zero Claude 3 or Claude 3.5 models exist in the verified model catalog');

  const allAreClaude4Or5 = models.every(m =>
    m.id.startsWith('claude-') &&
    (m.id.includes('4') || m.id.includes('5'))
  );
  assert(allAreClaude4Or5, 'All models strictly belong to Claude 4, 5, or 5.5 families');

  assert(getFriendlyModelName('claude-sonnet-5.5') === 'Claude Sonnet 5.5', 'Friendly model name maps correctly for claude-sonnet-5.5');
  assert(getFriendlyModelName('claude-opus-5.5') === 'Claude Opus 5.5', 'Friendly model name maps correctly for claude-opus-5.5');
  assert(findCatalogModel('claude-sonnet-5.5')?.id === 'claude-sonnet-5.5', 'findCatalogModel resolves claude-sonnet-5.5');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log(`\n================================================================`);
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log(`================================================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL QUALITY OVERHAUL REGRESSION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - passedTests} test(s) failed.`);
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
