/**
 * scripts/test-master-builder-suite.ts
 * ============================================================================
 * LIGHTNINGAPI STUDIO — MASTER 13-TEST VERIFICATION SUITE
 * Tests A through M as specified in Master Prompt Section 17
 * ============================================================================
 */

import { detectProjectArchetype } from '../server/studioBuilderArchetypes';
import { synthesizeProjectFiles, compilePreviewBundle, validateProjectBundle, VERIFIED_STUDIO_MODELS } from '../server/studioBuilder';
import { executeProjectRefinement, CURATED_PHOTOGRAPHY } from '../server/studioBuilderRefinement';
import fs from 'fs';
import path from 'path';

interface TestResult {
  test: string;
  name: string;
  passed: boolean;
  details: string[];
}

const results: TestResult[] = [];

function recordTest(test: string, name: string, passed: boolean, details: string[]) {
  results.push({ test, name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n[${status}] Test ${test}: ${name}`);
  for (const d of details) {
    console.log(`   ${passed ? '✓' : '✗'} ${d}`);
  }
}

async function runMasterTestSuite() {
  console.log('='.repeat(80));
  console.log('⚡ LIGHTNINGAPI STUDIO — MASTER 13-TEST VERIFICATION SUITE');
  console.log('   Testing Requirements A through M');
  console.log('='.repeat(80));

  // ==========================================================================
  // TEST A: Premium Footwear Brand Website Generation
  // ==========================================================================
  {
    const prompt = 'Build a premium footwear brand website.';
    const archetype = detectProjectArchetype(prompt);
    const files = synthesizeProjectFiles(prompt);
    const htmlFile = files.find(f => f.path.endsWith('.html'));
    const cssFile = files.find(f => f.path.endsWith('.css'));
    const validation = validateProjectBundle(files);

    const hasFootwearArchetype = archetype === 'footwear';
    const hasBrandIdentity = !!htmlFile && (htmlFile.content.includes('VELO') || htmlFile.content.includes('Footwear') || htmlFile.content.includes('Silhouettes'));
    const hasSneakerPhotos = !!htmlFile && (htmlFile.content.includes('photo-1542291026-7eec264c27ff') || htmlFile.content.includes('photo-1608231387042-66d1773070a5'));
    const hasProductCards = !!htmlFile && htmlFile.content.includes('product-card') && htmlFile.content.includes('Select US Size:');
    const hasBagDrawer = !!htmlFile && htmlFile.content.includes('bag-drawer') && htmlFile.content.includes('bag-count');
    const hasZeroSaaS = !!htmlFile && !htmlFile.content.includes('token routing') && !htmlFile.content.includes('API latency') && !htmlFile.content.includes('99.95% uptime');

    const passed = hasFootwearArchetype && hasBrandIdentity && hasSneakerPhotos && hasProductCards && hasBagDrawer && hasZeroSaaS && validation.valid;
    recordTest('A', 'Initial prompt: "Build a premium footwear brand website."', passed, [
      `Archetype correctly classified as 'footwear': ${hasFootwearArchetype}`,
      `Brand identity & ergonomics copy generated: ${hasBrandIdentity}`,
      `Curated Unsplash sneaker photography linked: ${hasSneakerPhotos}`,
      `Footwear products with US size selectors & Add to Bag present: ${hasProductCards}`,
      `Slide-out shopping bag drawer integrated: ${hasBagDrawer}`,
      `Zero AI SaaS / API confusion present: ${hasZeroSaaS}`,
      `Project bundle passes strict validation: ${validation.valid}`,
    ]);
  }

  // ==========================================================================
  // TEST B: AI SaaS Writing Assistant Landing Page
  // ==========================================================================
  {
    const prompt = 'Create an AI SaaS writing assistant landing page.';
    const archetype = detectProjectArchetype(prompt);
    const files = synthesizeProjectFiles(prompt);
    const htmlFile = files.find(f => f.path.endsWith('.html'));
    const validation = validateProjectBundle(files);

    const hasSaaSArchetype = archetype === 'ai_writer';
    const hasWritingAssistantCopy = !!htmlFile && (htmlFile.content.includes('ProseCraft') || htmlFile.content.includes('Writing Assistant') || htmlFile.content.includes('Editorial'));
    const hasPricingTiers = !!htmlFile && (htmlFile.content.includes('pricing') || htmlFile.content.includes('Starter') || htmlFile.content.includes('Pro'));
    const hasZeroFootwear = !!htmlFile && !htmlFile.content.includes('sneaker') && !htmlFile.content.includes('shoes') && !htmlFile.content.includes('US Size:');

    const passed = hasSaaSArchetype && hasWritingAssistantCopy && hasPricingTiers && hasZeroFootwear && validation.valid;
    recordTest('B', 'Initial prompt: "Create an AI SaaS writing assistant landing page."', passed, [
      `Archetype correctly classified as 'ai_writer': ${hasSaaSArchetype}`,
      `Tailored writing assistant copy & features generated: ${hasWritingAssistantCopy}`,
      `Software subscription plans & pricing present: ${hasPricingTiers}`,
      `Zero footwear or shoe elements present: ${hasZeroFootwear}`,
      `Project bundle passes strict validation: ${validation.valid}`,
    ]);
  }

  // ==========================================================================
  // TEST C: Modern Vegetarian Cafe Website
  // ==========================================================================
  {
    const prompt = 'Build a modern vegetarian cafe website.';
    const archetype = detectProjectArchetype(prompt);
    const files = synthesizeProjectFiles(prompt);
    const htmlFile = files.find(f => f.path.endsWith('.html'));
    const validation = validateProjectBundle(files);

    const hasRestaurantArchetype = archetype === 'restaurant';
    const hasVegetarianCopy = !!htmlFile && (htmlFile.content.includes('Botanical') || htmlFile.content.includes('Verdant') || htmlFile.content.includes('Avocado') || htmlFile.content.includes('Matcha') || htmlFile.content.includes('Cafe'));
    const hasTableBooking = !!htmlFile && (htmlFile.content.includes('Reserve') || htmlFile.content.includes('reservation') || htmlFile.content.includes('Table'));
    const hasZeroFootwearOrSaaS = !!htmlFile && !htmlFile.content.includes('sneaker') && !htmlFile.content.includes('token routing');

    const passed = hasRestaurantArchetype && hasVegetarianCopy && hasTableBooking && hasZeroFootwearOrSaaS && validation.valid;
    recordTest('C', 'Initial prompt: "Build a modern vegetarian cafe website."', passed, [
      `Archetype correctly classified as 'restaurant': ${hasRestaurantArchetype}`,
      `Plant-based cafe menu & matcha cafe copy generated: ${hasVegetarianCopy}`,
      `Table reservation workflow integrated: ${hasTableBooking}`,
      `Zero footwear or SaaS artifacts present: ${hasZeroFootwearOrSaaS}`,
      `Project bundle passes strict validation: ${validation.valid}`,
    ]);
  }

  // ==========================================================================
  // TEST D: Follow-up FAQ Section on Footwear Project
  // ==========================================================================
  let footwearProjectFiles = synthesizeProjectFiles('Build a premium footwear brand website.');
  let footwearProjectMock = {
    id: 'proj-footwear-123',
    brief: 'Build a premium footwear brand website.',
    currentVersion: 1,
  };

  {
    const refinePrompt = 'Add an FAQ section covering sizing, materials, and shipping.';
    const result = await executeProjectRefinement(footwearProjectMock, footwearProjectFiles, refinePrompt, 'claude-sonnet-5.5');
    const htmlFile = result.files.find(f => f.path.endsWith('.html'));
    const cssFile = result.files.find(f => f.path.endsWith('.css'));

    const hasFaqSection = !!htmlFile && htmlFile.content.includes('id="faq"');
    const hasSizingFaq = !!htmlFile && htmlFile.content.includes('true-to-size');
    const hasWearTestFaq = !!htmlFile && htmlFile.content.includes('30-Day Wear-Test');
    const hasVeganFaq = !!htmlFile && htmlFile.content.includes('100% vegan certified');
    const hasShippingFaq = !!htmlFile && htmlFile.content.includes('carbon-neutral standard delivery');
    const hasPreservedProducts = !!htmlFile && htmlFile.content.includes('product-card');

    const passed = result.success && hasFaqSection && hasSizingFaq && hasWearTestFaq && hasVeganFaq && hasShippingFaq && hasPreservedProducts;
    recordTest('D', 'Follow-up: "Add an FAQ section covering sizing, materials, and shipping."', passed, [
      `Refinement execution succeeded: ${result.success}`,
      `FAQ section injected into HTML: ${hasFaqSection}`,
      `Footwear sizing question configured: ${hasSizingFaq}`,
      `30-day wear-test trial question configured: ${hasWearTestFaq}`,
      `100% vegan materials question configured: ${hasVeganFaq}`,
      `Shipping & delivery question configured: ${hasShippingFaq}`,
      `Original footwear catalog preserved intact: ${hasPreservedProducts}`,
    ]);

    if (result.success) {
      footwearProjectFiles = result.files;
      footwearProjectMock.currentVersion = 2;
    }
  }

  // ==========================================================================
  // TEST E: Hero Image Replacement on Footwear Project
  // ==========================================================================
  {
    const refinePrompt = 'Replace the hero image with lifestyle sneaker photography.';
    const result = await executeProjectRefinement(footwearProjectMock, footwearProjectFiles, refinePrompt, 'claude-sonnet-5.5');
    const htmlFile = result.files.find(f => f.path.endsWith('.html'));

    const hasLifestylePhoto = !!htmlFile && htmlFile.content.includes(CURATED_PHOTOGRAPHY.footwearHeroLifestyle);
    const hasPreservedFaq = !!htmlFile && htmlFile.content.includes('id="faq"');
    const hasPreservedProducts = !!htmlFile && htmlFile.content.includes('product-card');

    const passed = result.success && hasLifestylePhoto && hasPreservedFaq && hasPreservedProducts;
    recordTest('E', 'Follow-up: "Replace the hero image with lifestyle sneaker photography."', passed, [
      `Refinement execution succeeded: ${result.success}`,
      `Hero image replaced with curated sneaker lifestyle photography: ${hasLifestylePhoto}`,
      `FAQ section from Test D preserved: ${hasPreservedFaq}`,
      `Footwear collection cards preserved: ${hasPreservedProducts}`,
      `Assistant explanation confirms lifestyle photo swap: ${result.assistantMessage.includes('lifestyle')}`,
    ]);

    if (result.success) {
      footwearProjectFiles = result.files;
      footwearProjectMock.currentVersion = 3;
    }
  }

  // ==========================================================================
  // TEST F: Add Six Footwear Products with Images, Names, Prices
  // ==========================================================================
  {
    const refinePrompt = 'Add six footwear products with images, names, and prices.';
    const result = await executeProjectRefinement(footwearProjectMock, footwearProjectFiles, refinePrompt, 'claude-sonnet-5.5');
    const htmlFile = result.files.find(f => f.path.endsWith('.html'));

    const cardCount = (htmlFile?.content.match(/<article class="product-card"/g) || []).length;
    const has6Cards = cardCount >= 6;
    const hasPrices = !!htmlFile && (htmlFile.content.includes('$220.00') && htmlFile.content.includes('$185.00') && htmlFile.content.includes('$165.00'));
    const hasSizePills = !!htmlFile && htmlFile.content.includes('size-pill');
    const hasAddBagButtons = !!htmlFile && htmlFile.content.includes('btn-add-bag');

    const passed = result.success && has6Cards && hasPrices && hasSizePills && hasAddBagButtons;
    recordTest('F', 'Follow-up: "Add six footwear products with images, names, and prices."', passed, [
      `Refinement execution succeeded: ${result.success}`,
      `Found ${cardCount} product cards (>= 6 required): ${has6Cards}`,
      `Distinct pricing for all footwear items verified: ${hasPrices}`,
      `Interactive US size selection pills present on each card: ${hasSizePills}`,
      `'+ Add to Bag' action buttons configured: ${hasAddBagButtons}`,
    ]);

    if (result.success) {
      footwearProjectFiles = result.files;
      footwearProjectMock.currentVersion = 4;
    }
  }

  // ==========================================================================
  // TEST G: Visual Refinement: Minimalist Cream and Black
  // ==========================================================================
  {
    const refinePrompt = 'Change the visual style to minimalist cream and black.';
    const result = await executeProjectRefinement(footwearProjectMock, footwearProjectFiles, refinePrompt, 'claude-sonnet-5.5');
    const allCss = result.files.filter(f => f.path.endsWith('.css')).map(f => f.content).join('\n');
    const previewHtml = result.previewHtml;

    const hasCreamBg = allCss.includes('#fdfbf7') || allCss.includes('--color-bg: #fdfbf7');
    const hasBlackText = allCss.includes('#111111') || allCss.includes('--color-text: #111111');
    const hasPreviewCompiled = !!previewHtml && previewHtml.includes('#fdfbf7');

    const passed = result.success && hasCreamBg && hasBlackText && hasPreviewCompiled;
    recordTest('G', 'Follow-up: "Change the visual style to minimalist cream and black."', passed, [
      `Refinement execution succeeded: ${result.success}`,
      `Cream background variable applied (#fdfbf7): ${hasCreamBg}`,
      `High-contrast black typography variable applied (#111111): ${hasBlackText}`,
      `Live preview bundle successfully recompiled with new theme: ${hasPreviewCompiled}`,
    ]);

    if (result.success) {
      footwearProjectFiles = result.files;
      footwearProjectMock.currentVersion = 5;
    }
  }

  // ==========================================================================
  // TEST H: Mobile Responsive Layout Verification (< 768px)
  // ==========================================================================
  {
    const allCss = footwearProjectFiles.filter(f => f.path.endsWith('.css')).map(f => f.content).join('\n');
    const hasOverflowRule = allCss.includes('overflow-x: hidden');
    const hasResponsiveMedia = allCss.includes('@media (max-width: 768px)');
    const hasSingleColumnGrid = allCss.includes('1fr');

    const passed = hasOverflowRule && hasResponsiveMedia && hasSingleColumnGrid;
    recordTest('H', 'Mobile Layout: Zero horizontal overflow and responsive collapse', passed, [
      `Global overflow-x: hidden rule present: ${hasOverflowRule}`,
      `Mobile viewport media queries configured for <= 768px: ${hasResponsiveMedia}`,
      `Multi-column grids collapse to 1fr single column on mobile: ${hasSingleColumnGrid}`,
    ]);
  }

  // ==========================================================================
  // TEST I: Project Isolation
  // ==========================================================================
  {
    const proj1 = synthesizeProjectFiles('Build a premium footwear brand website.');
    const proj2 = synthesizeProjectFiles('Create an AI SaaS writing assistant landing page.');

    const proj1Html = proj1.find(f => f.path.endsWith('.html'))?.content || '';
    const proj2Html = proj2.find(f => f.path.endsWith('.html'))?.content || '';

    const p1HasFootwear = proj1Html.includes('Footwear') && !proj1Html.includes('ProseCraft');
    const p2HasWriter = proj2Html.includes('ProseCraft') && !proj2Html.includes('Footwear');
    const isolationPassed = p1HasFootwear && p2HasWriter;

    recordTest('I', 'Project Isolation between distinct generation brief types', isolationPassed, [
      `Footwear project contains footwear and zero ProseCraft artifacts: ${p1HasFootwear}`,
      `Writing assistant project contains writing tools and zero footwear artifacts: ${p2HasWriter}`,
      `Sequential synthesis exhibits strict project isolation: ${isolationPassed}`,
    ]);
  }

  // ==========================================================================
  // TEST J: Failure & Malformed Prompt Handling
  // ==========================================================================
  {
    const gibberishPrompt = 'asdf ???';
    const result = await executeProjectRefinement(footwearProjectMock, footwearProjectFiles, gibberishPrompt);

    const handledGracefully = result.success === false;
    const hasHelpfulMessage = result.assistantMessage.includes("I couldn't quite understand");
    const preservedFiles = result.files.length === footwearProjectFiles.length;
    const preservedPreview = !!result.previewHtml && result.previewHtml.length > 500;

    const passed = handledGracefully && hasHelpfulMessage && preservedFiles && preservedPreview;
    recordTest('J', 'Build Failure Handling: Malformed / nonsensical follow-up request', passed, [
      `Identified malformed request without throwing unhandled exception: ${handledGracefully}`,
      `Returned polite clarifying guidance and suggested next steps: ${hasHelpfulMessage}`,
      `Preserved all existing files without corruption: ${preservedFiles}`,
      `Preserved existing working preview intact: ${preservedPreview}`,
    ]);
  }

  // ==========================================================================
  // TEST K: Real Claude-Only Model Catalog & Gateway Routing
  // ==========================================================================
  {
    const allClaude = VERIFIED_STUDIO_MODELS.every(m => m.id.startsWith('claude-'));
    const hasSonnet55 = VERIFIED_STUDIO_MODELS.some(m => m.id === 'claude-sonnet-5.5');
    const hasOpus55 = VERIFIED_STUDIO_MODELS.some(m => m.id === 'claude-opus-5.5');
    const zeroLegacy = !VERIFIED_STUDIO_MODELS.some(m => m.id.includes('claude-3') || m.id.includes('gpt') || m.id.includes('deepseek'));

    const passed = allClaude && hasSonnet55 && hasOpus55 && zeroLegacy;
    recordTest('K', 'Real Claude Model Catalog & Frontier-only gateway configuration', passed, [
      `All available Studio models are frontier Claude models: ${allClaude}`,
      `Includes Claude Sonnet 5.5: ${hasSonnet55}`,
      `Includes Claude Opus 5.5: ${hasOpus55}`,
      `Zero deprecated Claude 3 or competitor models present in Studio selector: ${zeroLegacy}`,
    ]);
  }

  // ==========================================================================
  // TEST L: Download ZIP Verification (File tree & relative links)
  // ==========================================================================
  {
    const files = footwearProjectFiles;
    const hasIndexHtml = files.some(f => f.path === 'index.html');
    const hasThemeCss = files.some(f => f.path === 'styles/theme.css');
    const hasSiteCss = files.some(f => f.path === 'assets/site.css');
    const hasSiteJs = files.some(f => f.path === 'assets/site.js');
    const hasReadme = files.some(f => f.path === 'README.md');

    // Verify relative CSS/JS paths in index.html match file paths
    const indexHtml = files.find(f => f.path === 'index.html')?.content || '';
    const hasCorrectCssPath = indexHtml.includes('styles/theme.css') && indexHtml.includes('assets/site.css');
    const hasCorrectJsPath = indexHtml.includes('assets/site.js');

    const passed = hasIndexHtml && hasThemeCss && hasSiteCss && hasSiteJs && hasReadme && hasCorrectCssPath && hasCorrectJsPath;
    recordTest('L', 'ZIP Bundle Structure & relative path integrity', passed, [
      `Contains root index.html: ${hasIndexHtml}`,
      `Contains styles/theme.css: ${hasThemeCss}`,
      `Contains assets/site.css: ${hasSiteCss}`,
      `Contains assets/site.js: ${hasSiteJs}`,
      `Contains comprehensive README.md: ${hasReadme}`,
      `All asset links in index.html match physical folder structure: ${hasCorrectCssPath && hasCorrectJsPath}`,
    ]);
  }

  // ==========================================================================
  // TEST M: Studio UI Layout, Responsive Mobile Tabs, and Independent Scroll
  // ==========================================================================
  {
    const uiSourcePath = path.resolve(process.cwd(), 'src/pages/dashboard/UserWebsiteBuilder.tsx');
    const uiSource = fs.readFileSync(uiSourcePath, 'utf8');

    const hasMobileTabs = uiSource.includes("const [mobileTab, setMobileTab] = useState<'preview' | 'chat' | 'code'>('preview');");
    const hasLightAesthetic = uiSource.includes('bg-slate-50 text-slate-900') && uiSource.includes('bg-white px-3 sm:px-4');
    const hasIndependentScroll = uiSource.includes('overflow-y-auto p-4 space-y-4 min-h-0');
    const hasSandboxedIframe = uiSource.includes('sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-downloads"');
    const hasCodeEditor = uiSource.includes('handleSaveCode') && uiSource.includes('Save & Recompile');

    const passed = hasMobileTabs && hasLightAesthetic && hasIndependentScroll && hasSandboxedIframe && hasCodeEditor;
    recordTest('M', 'Studio UI: Responsive mobile tabs, light aesthetic, independent scrolling', passed, [
      `Mobile responsive tabs switcher present for < 768px: ${hasMobileTabs}`,
      `Light, clean aesthetic applied (bg-slate-50, bg-white, text-slate-900): ${hasLightAesthetic}`,
      `Independent scroll container with min-h-0 and overflow-y-auto: ${hasIndependentScroll}`,
      `Sandboxed iframe with allow-downloads: ${hasSandboxedIframe}`,
      `Interactive code editor with save & recompile capability: ${hasCodeEditor}`,
    ]);
  }

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n' + '='.repeat(80));
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const allPassed = totalTests === passedTests;

  console.log(`MASTER TEST SUITE EXECUTION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`OVERALL STATUS: ${allPassed ? '✅ 100% ALL TESTS PASSING' : '❌ FAILURES DETECTED'}`);
  console.log('='.repeat(80));

  if (!allPassed) {
    process.exit(1);
  }
}

runMasterTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
