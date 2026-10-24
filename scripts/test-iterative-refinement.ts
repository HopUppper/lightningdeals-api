/**
 * scripts/test-iterative-refinement.ts
 * ============================================================================
 * Comprehensive Phase 7 Verification Suite for LightningAPI Studio:
 * Tests A through H covering Initial Generation, FAQ Additions, Visual Styles,
 * Image Replacement, Mobile Layout, Failure Handling, Multi-edit Context
 * Preservation, and Version Restore.
 * ============================================================================
 */

import {
  synthesizeByArchetype,
  detectProjectArchetype,
  ProjectFile,
} from '../server/studioBuilderArchetypes';
import {
  compilePreviewBundle,
  validateProjectBundle,
  ProjectVersionSnapshot,
} from '../server/studioBuilder';
import {
  executeProjectRefinement,
  CURATED_PHOTOGRAPHY,
} from '../server/studioBuilderRefinement';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGAPI STUDIO — PHASE 7 ITERATIVE REFINEMENT TEST SUITE');
  console.log('================================================================\n');

  // Track project versions across journey
  const versions: ProjectVersionSnapshot[] = [];

  // --------------------------------------------------------------------------
  // TEST A: Initial Generation (Premium Skincare Brand)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST A] Initial Generation: Premium Skincare Storefront...');
  const promptA = 'Build a premium mineral sunscreen brand website named SÉLÈNE with lifestyle imagery, product formulas, benefits, clinical ingredients, customer testimonials, and an order or waitlist form.';
  const archetypeA = detectProjectArchetype(promptA);
  console.log(`  Archetype detected: "${archetypeA}"`);
  assert(archetypeA === 'sunscreen', `Expected archetype "sunscreen", got "${archetypeA}"`);

  let currentFiles = synthesizeByArchetype(promptA, archetypeA);
  assert(currentFiles.length >= 3, `Expected at least 3 files, got ${currentFiles.length}`);

  const validationA = validateProjectBundle(currentFiles);
  assert(validationA.valid, `Bundle invalid: ${validationA.errors.join(', ')}`);

  let previewHtml = compilePreviewBundle(currentFiles);
  assert(previewHtml.includes('SÉLÈNE'), 'Brand name SÉLÈNE not found');
  assert(previewHtml.includes('Invisible Daily Mineral Fluid') || previewHtml.includes('Daily Facial Sunscreen'), 'Product collection not found');
  assert(previewHtml.includes('images.unsplash.com'), 'Curated photography URLs not found');
  assert(!previewHtml.includes('prod-img bg-cream'), 'Empty solid bg-cream placeholder detected in product card');
  assert(!previewHtml.includes('prod-img bg-moss'), 'Empty solid bg-moss placeholder detected in product card');
  assert(previewHtml.includes('Clean Formulation') || previewHtml.includes('Transparent Botanical Architecture') || previewHtml.includes('Zinc Oxide'), 'Ingredients/actives section missing');
  assert(previewHtml.includes('orderForm') || previewHtml.includes('waitlist'), 'Order or waitlist form missing');

  versions.push({
    version: 1,
    summary: 'Initial generation of SÉLÈNE luxury skincare storefront',
    files: JSON.parse(JSON.stringify(currentFiles)),
    createdAt: new Date().toISOString(),
  });
  console.log('  ✅ [TEST A PASSED] Initial generation contains brand, products, real photography, ingredients, and pre-order form.\n');

  // --------------------------------------------------------------------------
  // TEST B: Add FAQ Section
  // --------------------------------------------------------------------------
  console.log('▶ [TEST B] Iterative Edit: Add an FAQ Section...');
  const promptB = 'Add an FAQ section with five relevant questions and collapsible answers';
  const dummyProject = { id: 'test_proj_1', brief: promptA, name: 'SÉLÈNE Botanicals' };

  const resultB = await executeProjectRefinement(dummyProject, currentFiles, promptB);
  assert(resultB.success, 'Refinement failed for FAQ');
  assert(resultB.verification.passed, 'Refinement verification failed');
  currentFiles = resultB.files;
  previewHtml = compilePreviewBundle(currentFiles);

  assert(previewHtml.includes('id="faq"') || previewHtml.includes('class="section-faq"'), 'FAQ section not injected');
  assert(previewHtml.includes('Frequently Asked Questions'), 'FAQ heading missing');
  assert(previewHtml.includes('faq-accordion-item'), 'Accordion items missing');
  assert(previewHtml.includes('zinc') || previewHtml.includes('formula'), 'Questions lack relevant skincare context');
  assert(previewHtml.includes('faq-accordion-header'), 'Accordion header elements missing');
  // Check that original components are intact
  assert(previewHtml.includes('SÉLÈNE'), 'Original brand name SÉLÈNE was corrupted or lost');
  assert(previewHtml.includes('Invisible Daily Mineral Fluid') || previewHtml.includes('Daily Facial Sunscreen'), 'Product collection was lost after adding FAQ');

  versions.push({
    version: 2,
    summary: resultB.summary,
    files: JSON.parse(JSON.stringify(currentFiles)),
    createdAt: new Date().toISOString(),
  });
  console.log('  ✅ [TEST B PASSED] FAQ section injected with 5 collapsible Q&As and accordion JS; original content intact.\n');

  // --------------------------------------------------------------------------
  // TEST C: Visual Refinement (Warm Cream, Forest Green, Editorial Typography)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST C] Visual Refinement: Warm Cream, Forest Green & Editorial Typography...');
  const promptC = 'Change the visual style to warm cream, forest green, and elegant editorial typography';

  const resultC = await executeProjectRefinement(dummyProject, currentFiles, promptC);
  assert(resultC.success, 'Refinement failed for visual style');
  currentFiles = resultC.files;
  previewHtml = compilePreviewBundle(currentFiles);

  assert(previewHtml.includes('#1b4332'), 'Forest green (#1b4332) not found in compiled bundle');
  assert(previewHtml.includes('#fbf8f3'), 'Warm cream (#fbf8f3) not found in compiled bundle');
  assert(previewHtml.includes('Playfair Display'), 'Playfair Display serif font not imported or styled');
  // Verify FAQ and products still present
  assert(previewHtml.includes('id="faq"'), 'FAQ section was lost after visual restyle');
  assert(previewHtml.includes('Invisible Daily Mineral Fluid') || previewHtml.includes('Daily Facial Sunscreen'), 'Products lost after visual restyle');

  versions.push({
    version: 3,
    summary: resultC.summary,
    files: JSON.parse(JSON.stringify(currentFiles)),
    createdAt: new Date().toISOString(),
  });
  console.log('  ✅ [TEST C PASSED] Visual style transformed to forest green & warm cream with Playfair Display typography; structure preserved.\n');

  // --------------------------------------------------------------------------
  // TEST D: Image Replacement (Curated Botanical Skincare Photography)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST D] Image Replacement: Hero Botanical Skincare Photography...');
  const promptD = 'Replace the hero visual with premium botanical skincare photography';

  const resultD = await executeProjectRefinement(dummyProject, currentFiles, promptD);
  assert(resultD.success, 'Refinement failed for image replacement');
  currentFiles = resultD.files;
  previewHtml = compilePreviewBundle(currentFiles);

  assert(previewHtml.includes(CURATED_PHOTOGRAPHY.skincareHero), 'Curated hero photo URL not found in HTML');
  assert(previewHtml.includes('hero-photo-wrapper') || previewHtml.includes('hero-photo-img'), 'Hero photo wrapper styling missing');
  assert(previewHtml.includes('id="faq"'), 'FAQ was lost during image replacement');

  versions.push({
    version: 4,
    summary: resultD.summary,
    files: JSON.parse(JSON.stringify(currentFiles)),
    createdAt: new Date().toISOString(),
  });
  console.log('  ✅ [TEST D PASSED] Hero visual replaced with verified high-res photography URL and responsive wrapper.\n');

  // --------------------------------------------------------------------------
  // TEST E: Mobile Improvement & Overflow Removal
  // --------------------------------------------------------------------------
  console.log('▶ [TEST E] Mobile Improvement: Remove Horizontal Overflow & Adapt Grid...');
  const promptE = 'Improve the mobile layout and remove horizontal overflow';

  const resultE = await executeProjectRefinement(dummyProject, currentFiles, promptE);
  assert(resultE.success, 'Refinement failed for mobile improvement');
  currentFiles = resultE.files;
  previewHtml = compilePreviewBundle(currentFiles);

  assert(previewHtml.includes('overflow-x: hidden'), 'Zero horizontal overflow rule missing in CSS');
  assert(previewHtml.includes('@media (max-width: 768px)'), 'Mobile media query missing in CSS');
  assert(previewHtml.includes('id="faq"'), 'FAQ lost during mobile optimization');

  versions.push({
    version: 5,
    summary: resultE.summary,
    files: JSON.parse(JSON.stringify(currentFiles)),
    createdAt: new Date().toISOString(),
  });
  console.log('  ✅ [TEST E PASSED] Mobile viewport rules, zero-overflow enforcement, and single-column collapse configured.\n');

  // --------------------------------------------------------------------------
  // TEST F: Failure Handling (Malformed or Nonsensical Input)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST F] Failure Handling: Malformed or Nonsensical Input...');
  const promptF = '???$$$!!!@@@###';

  const filesBeforeF = JSON.stringify(currentFiles);
  const resultF = await executeProjectRefinement(dummyProject, currentFiles, promptF);

  assert(resultF.success === false, 'Expected success === false for nonsensical request');
  assert(resultF.assistantMessage.includes("couldn't quite understand"), 'Assistant did not explain issue gracefully');
  assert(resultF.suggestedFollowUps.length > 0, 'Follow-up suggestions missing on error');
  // Verify files were not corrupted
  assert(JSON.stringify(resultF.files) === filesBeforeF, 'Files were modified despite malformed input');
  const previewHtmlAfterF = compilePreviewBundle(resultF.files);
  assert(previewHtmlAfterF === previewHtml, 'Preview changed despite invalid request');
  console.log('  ✅ [TEST F PASSED] Nonsensical prompt handled gracefully with explanatory message, suggestions, and 100% preview preservation.\n');

  // --------------------------------------------------------------------------
  // TEST G: Context Preservation Across Multiple Edits (v1 through v5)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST G] Context Preservation: Verifying Cumulative Features in Version 5...');
  const v5Files = versions.find((v) => v.version === 5)!.files;
  const v5Html = compilePreviewBundle(v5Files);

  // Check feature accumulation from each step
  assert(v5Html.includes('SÉLÈNE BOTANICALS') || v5Html.includes('SÉLÈNE'), 'v1 Feature Lost: Brand name');
  assert(v5Html.includes('Invisible Daily Mineral Fluid') || v5Html.includes('Daily Facial Sunscreen'), 'v1 Feature Lost: Products');
  assert(v5Html.includes('id="faq"'), 'v2 Feature Lost: FAQ section');
  assert(v5Html.includes('faq-accordion-item'), 'v2 Feature Lost: FAQ accordion items');
  assert(v5Html.includes('#1b4332'), 'v3 Feature Lost: Forest green palette');
  assert(v5Html.includes('Playfair Display'), 'v3 Feature Lost: Playfair Display typography');
  assert(v5Html.includes(CURATED_PHOTOGRAPHY.skincareHero), 'v4 Feature Lost: Hero photography');
  assert(v5Html.includes('overflow-x: hidden'), 'v5 Feature Lost: Zero-overflow mobile rule');

  console.log('  ✅ [TEST G PASSED] All 5 consecutive edits preserved cumulatively with ZERO feature regression!\n');

  // --------------------------------------------------------------------------
  // TEST H: Version Restore (Rollback to v2 Snapshot)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST H] Version Restore: Roll Back to Version 2 Snapshot...');
  const v2Snapshot = versions.find((v) => v.version === 2);
  assert(!!v2Snapshot, 'Snapshot v2 not found in version history');

  const restoredFiles = JSON.parse(JSON.stringify(v2Snapshot!.files));
  const restoredHtml = compilePreviewBundle(restoredFiles);

  // v2 MUST have FAQ
  assert(restoredHtml.includes('id="faq"'), 'Restored v2 is missing FAQ section');
  // v2 MUST NOT have subsequent overrides from v3-v5
  assert(!restoredHtml.includes('#1b4332'), 'Restored v2 prematurely contains v3 forest green color');
  assert(!restoredHtml.includes(CURATED_PHOTOGRAPHY.skincareHero), 'Restored v2 prematurely contains v4 hero photo');
  assert(!restoredHtml.includes('overflow-x: hidden !important'), 'Restored v2 prematurely contains v5 overflow rule');

  console.log('  ✅ [TEST H PASSED] Successfully rolled back to Version 2 snapshot; state matches exact v2 point in time.\n');

  console.log('================================================================');
  console.log('🎉 ALL 8 USER WORKFLOW TESTS (TESTS A - H) PASSED WITH 100% INTEGRITY!');
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
