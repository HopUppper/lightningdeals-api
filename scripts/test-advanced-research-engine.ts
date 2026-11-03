/**
 * scripts/test-advanced-research-engine.ts
 *
 * Comprehensive End-to-End Regression Test Suite for LightningAPI Advanced Web Research,
 * Deep Search & Shopping Intelligence System.
 *
 * Tests the mandatory customer scenario:
 * "Find me the best Tecno POVA deals in India."
 */

import { classifyUrl, isDirectProductListing } from '../server/research/urlClassifier';
import { analyzeResearchIntent } from '../server/research/researchIntent';
import { extractProductListings } from '../server/research/productExtractionEngine';
import { executeAdvancedResearchPipeline } from '../server/research/multiStageResearchOrchestrator';

async function runTestSuite() {
  console.log('================================================================');
  console.log('⚡ LIGHTNINGAPI ADVANCED WEB RESEARCH & SHOPPING TEST SUITE ⚡');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
    }
  }

  // -------------------------------------------------------------------------
  // SUITE 1: URL Classification & Identifier Extraction
  // -------------------------------------------------------------------------
  console.log('--- SUITE 1: URL Classification & Identifier Extraction ---');

  // Test 1.1: Amazon Direct Product Listing
  const amzDirect = classifyUrl('https://www.amazon.in/Tecno-Pova-Pro-Storage-Processor/dp/B0CY5Q2N1M?ref_=nav_signin&tag=affil-21');
  assert(
    amzDirect.urlType === 'direct_product_listing' &&
      amzDirect.productIdentifier === 'B0CY5Q2N1M' &&
      amzDirect.merchant === 'Amazon India' &&
      amzDirect.canonicalListingUrl === 'https://www.amazon.in/dp/B0CY5Q2N1M',
    'Amazon Direct Product Listing extracted with ASIN and canonical URL',
    JSON.stringify(amzDirect)
  );

  // Test 1.2: Amazon Generic Search URL (must NOT be direct listing)
  const amzSearch = classifyUrl('https://www.amazon.in/s?k=tecno+pova+6+pro&ref=nb_sb_noss');
  assert(
    amzSearch.urlType === 'marketplace_search' &&
      amzSearch.productIdentifier === null &&
      !isDirectProductListing('https://www.amazon.in/s?k=tecno+pova'),
    'Amazon Search URL correctly classified as marketplace_search (never direct listing)',
    JSON.stringify(amzSearch)
  );

  // Test 1.3: Flipkart Direct Product Listing
  const fkDirect = classifyUrl('https://www.flipkart.com/tecno-pova-6-pro-5g-meteorite-grey-128-gb/p/itm4b0870377c862?pid=MOBGY6ZGQNZGYVHH');
  assert(
    fkDirect.urlType === 'direct_product_listing' &&
      (fkDirect.productIdentifier === 'MOBGY6ZGQNZGYVHH' || fkDirect.productIdentifier === 'itm4b0870377c862') &&
      fkDirect.merchant === 'Flipkart',
    'Flipkart Direct Product Listing extracted with FSN/PID',
    JSON.stringify(fkDirect)
  );

  // Test 1.4: Flipkart Search Link
  const fkSearch = classifyUrl('https://www.flipkart.com/search?q=tecno+pova+6+pro');
  assert(
    fkSearch.urlType === 'marketplace_search' && fkSearch.productIdentifier === null,
    'Flipkart Search URL classified as marketplace_search',
    JSON.stringify(fkSearch)
  );

  // Test 1.5: Editorial Tech Review
  const editorial = classifyUrl('https://www.gadgets360.com/mobiles/tecno-pova-6-pro-5g-price-in-india-12345');
  assert(
    editorial.urlType === 'editorial_review' && editorial.domain === 'gadgets360.com',
    'Editorial review classified accurately'
  );

  // Test 1.6: Academic Source
  const academic = classifyUrl('https://arxiv.org/abs/2402.12345');
  assert(
    academic.urlType === 'academic_paper' && academic.productIdentifier === '2402.12345',
    'Academic repository classified with arXiv ID'
  );

  // Test 1.7: Official Technical Docs
  const docs = classifyUrl('https://www.postgresql.org/docs/16/query-performance.html');
  assert(
    docs.urlType === 'official_docs',
    'Official technical documentation classified accurately'
  );

  // -------------------------------------------------------------------------
  // SUITE 2: Intent Classification & Multi-Angle Search Query Planning
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Intent Classification & Query Planning ---');

  // Test 2.1: Shopping Deal Discovery (Mandatory scenario)
  const shoppingIntent = analyzeResearchIntent('Find me the best Tecno POVA deals in India.');
  assert(
    shoppingIntent.category === 'deal_discovery' &&
      shoppingIntent.targetLocation === 'India' &&
      shoppingIntent.currency === 'INR' &&
      shoppingIntent.isShoppingOrProduct === true,
    'Mandatory Tecno POVA request classified as deal_discovery in India (INR)'
  );

  // Test 2.2: Multi-Angle Queries contain direct marketplace targets
  const hasAmzTarget = shoppingIntent.generatedQueries.some((q) => q.purpose === 'amazon_direct');
  const hasFkTarget = shoppingIntent.generatedQueries.some((q) => q.purpose === 'flipkart_direct');
  const hasSpecsTarget = shoppingIntent.generatedQueries.some((q) => q.purpose === 'specs_official');
  assert(
    hasAmzTarget && hasFkTarget && hasSpecsTarget,
    'Generated search strategy includes Amazon direct, Flipkart direct, and spec sheet queries'
  );

  // Test 2.3: Budget Extraction
  const budgetIntent = analyzeResearchIntent('Find the best 5G phones under ₹15,000 in India');
  assert(
    budgetIntent.budgetLimit?.amount === 15000 && budgetIntent.budgetLimit?.currency === 'INR',
    'Budget constraint ₹15,000 accurately parsed'
  );

  // Test 2.4: Technical Research
  const techIntent = analyzeResearchIntent('Research the latest PostgreSQL performance improvements');
  assert(
    techIntent.category === 'technical_research' && techIntent.isShoppingOrProduct === false,
    'PostgreSQL query classified as technical_research'
  );

  // -------------------------------------------------------------------------
  // SUITE 3: Product & Variant Extraction Engine
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Product, Variant & Specification Extraction ---');

  const mockEvidence = [
    {
      citationIndex: 1,
      title: 'Tecno POVA 6 Pro 5G (Meteorite Grey, 128 GB) (8 GB RAM)',
      url: 'https://www.amazon.in/dp/B0CY5Q2N1M',
      snippet: 'Buy Tecno POVA 6 Pro 5G online at ₹14,999 M.R.P.: ₹19,999. Features 6.78" FHD+ 120Hz AMOLED Display, MediaTek Dimensity 6080 5G Processor, 6000 mAh Battery with 70W Ultra Charge, 108 MP Dual Rear Camera.',
      domain: 'amazon.in',
      timestamp: new Date().toISOString(),
    },
    {
      citationIndex: 2,
      title: 'Tecno POVA 6 Pro 5G (Comet Green, 256 GB) (12 GB RAM)',
      url: 'https://www.flipkart.com/tecno-pova-6-pro-5g-green-256-gb/p/itm4b0870377c862?pid=MOBGY6ZGQNZGYVHH',
      snippet: 'Tecno POVA 6 Pro 5G with 12GB RAM, 256GB Storage. Current price: ₹16,999. MediaTek Dimensity 6080, 6000mAh Battery, 70W charging.',
      domain: 'flipkart.com',
      timestamp: new Date().toISOString(),
    },
    {
      citationIndex: 3,
      title: 'Tecno POVA 6 Neo 5G Price in India, Full Specs & Review',
      url: 'https://www.91mobiles.com/tecno-pova-6-neo-5g-price-in-india',
      snippet: 'Tecno POVA 6 Neo 5G price in India starts at ₹12,999. Powered by MediaTek Dimensity 6300 5G, 5000 mAh battery with 18W charging.',
      domain: '91mobiles.com',
      timestamp: new Date().toISOString(),
    },
  ];

  const extractedListings = extractProductListings(mockEvidence, 'Tecno POVA');

  assert(extractedListings.length >= 2, `Extracted ${extractedListings.length} distinct product variants`);

  // Test 3.1: Variant separation (8GB/128GB vs 12GB/256GB)
  const pova8gb = extractedListings.find((p) => p.variant.ram === '8GB' && p.variant.storage === '128GB');
  const pova12gb = extractedListings.find((p) => p.variant.ram === '12GB' && p.variant.storage === '256GB');
  assert(
    Boolean(pova8gb && pova12gb),
    'Distinct configurations (8GB/128GB and 12GB/256GB) successfully separated into distinct variants'
  );

  // Test 3.2: Price and Discount Accuracy
  assert(
    pova8gb?.sellingPrice === 14999 &&
      pova8gb?.originalPrice === 19999 &&
      pova8gb?.discountPercent === 25 &&
      pova8gb?.priceStatus === 'VERIFIED',
    'Price (₹14,999), MRP (₹19,999), Discount (25% OFF), and Status (VERIFIED) accurately extracted'
  );

  // Test 3.3: Direct Listing URL preservation
  assert(
    pova8gb?.directProductUrl === 'https://www.amazon.in/dp/B0CY5Q2N1M' &&
      pova8gb?.productIdentifier === 'B0CY5Q2N1M',
    'Amazon direct product URL (/dp/B0CY5Q2N1M) preserved as primary purchase destination'
  );

  // Test 3.4: Hardware Specifications
  assert(
    pova8gb?.specifications.battery === '6000 mAh' &&
      (pova8gb?.specifications.charging?.includes('70W') || pova8gb?.specifications.charging === '70W Fast Charging') &&
      pova8gb?.specifications.display?.includes('AMOLED'),
    'Hardware specifications (6000 mAh, 70W charging, AMOLED) extracted into structured records'
  );

  // Test 3.5: Unverified fields tracking
  assert(
    Array.isArray(pova8gb?.unverifiedFields) && pova8gb!.unverifiedFields.length > 0,
    'Unverified fields (e.g. warranty duration, real-time checkout status) honestly tracked'
  );

  // -------------------------------------------------------------------------
  // SUITE 4: End-to-End Orchestrator Pipeline Execution
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Full Multi-Stage Orchestrator Execution ---');

  const progressSteps: string[] = [];
  const pipelineResult = await executeAdvancedResearchPipeline('Find me the best Tecno POVA deals in India.', {
    researchMode: 'web_search',
    onProgress: (step, title, detail) => {
      progressSteps.push(`${step}: ${title}`);
    },
  });

  assert(progressSteps.length >= 3, `Orchestration progress emitted ${progressSteps.length} lifecycle events`);
  assert(pipelineResult.dataset.query === 'Find me the best Tecno POVA deals in India.', 'Dataset query matches input');
  assert(pipelineResult.dataset.location === 'India', 'Dataset target location resolved to India');
  assert(
    pipelineResult.promptDirective.includes('[ADVANCED EVIDENCE-DRIVEN RESEARCH ACTIVE]'),
    'Model prompt directive contains structured research grounding'
  );
  assert(
    pipelineResult.promptDirective.includes('CRITICAL RESEARCH PRESENTATION RULES'),
    'Directive mandates direct answers, verified links, honest uncertainty, and comparison table'
  );

  // -------------------------------------------------------------------------
  // SUITE 5: Strict Platform Security & Compliance Checks
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 5: Zero Supplier Leaks & Strict Model Family Compliance ---');

  const directiveText = pipelineResult.promptDirective;
  const prohibitedVendorTerms = ['scalemax', 'lotusai', 'openpipe', 'opusmax'];
  const hasVendorLeak = prohibitedVendorTerms.some((term) => directiveText.toLowerCase().includes(term));
  assert(!hasVendorLeak, 'ZERO supplier/vendor names leaked in research directives (Rule 5)');

  const claude3Terms = ['claude-3', '3-5-sonnet', '3-opus', '3-haiku', '3.5 sonnet', '3.7 sonnet'];
  const hasClaude3 = claude3Terms.some((term) => directiveText.toLowerCase().includes(term));
  assert(!hasClaude3, 'ZERO Claude 3 family model mentions in research directives (Rule 1)');

  console.log('\n================================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
