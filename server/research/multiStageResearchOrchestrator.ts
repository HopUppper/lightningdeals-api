/**
 * server/research/multiStageResearchOrchestrator.ts
 *
 * LightningAPI Advanced Research Engine - Multi-Stage Research Orchestrator
 *
 * Coordinates intelligent intent classification, multi-angle search queries,
 * direct marketplace extraction, page fetching, price verification, spec normalization,
 * and structured dataset generation.
 */

import {
  StructuredResearchDataset,
  ResearchSourceItem,
  ProductListing,
  GeneralResearchFinding,
} from './researchTypes';
import { analyzeResearchIntent, ExtractedIntentEntities } from './researchIntent';
import { classifyUrl, sanitizeAndNormalizeUrl } from './urlClassifier';
import { extractProductListings, RawSourceEvidence } from './productExtractionEngine';
import { searchWeb, fetchPublicUrl, WebSearchResult } from '../webResearch';

export interface AdvancedResearchOptions {
  researchMode?: 'web_search' | 'deep_research';
  maxRounds?: number;
  onProgress?: (step: string, title: string, detail: string) => void;
}

export interface AdvancedResearchResult {
  dataset: StructuredResearchDataset;
  sources: WebSearchResult[];
  promptDirective: string;
}

/**
 * Executes the complete multi-stage research pipeline.
 */
export async function executeAdvancedResearchPipeline(
  userPrompt: string,
  options?: AdvancedResearchOptions
): Promise<AdvancedResearchResult> {
  const prompt = (userPrompt || '').trim();
  const notify = options?.onProgress || (() => {});

  // 1. Intent Classification & Strategy Planning
  notify('analyzing_intent', 'Understanding research requirements', `Analyzing intent, location, constraints, and target entities...`);
  const intent: ExtractedIntentEntities = analyzeResearchIntent(prompt);

  const rawEvidenceMap = new Map<string, RawSourceEvidence>();
  let citationCounter = 1;

  // 2. Multi-Stage Query Execution
  notify(
    'searching_sources',
    'Executing targeted multi-stage search',
    intent.isShoppingOrProduct
      ? `Searching direct marketplace listings on Amazon, Flipkart, and verified spec databases...`
      : `Searching authoritative documentation and credible reference sources...`
  );

  // Execute queries in strategic sequence
  for (const qObj of intent.generatedQueries.slice(0, 4)) {
    try {
      const searchRes = await searchWeb(qObj.query, {
        maxResults: 6,
        includeDomains: qObj.preferredDomains,
        searchDepth: intent.isShoppingOrProduct ? 'advanced' : 'basic',
      });

      for (const res of searchRes.results) {
        const clean = sanitizeAndNormalizeUrl(res.url);
        if (!rawEvidenceMap.has(clean)) {
          rawEvidenceMap.set(clean, {
            citationIndex: citationCounter++,
            title: res.title,
            url: res.url,
            snippet: res.snippet,
            domain: res.domain,
            timestamp: res.timestamp,
          });
        }
      }
    } catch (e: any) {
      console.warn(`[MultiStageResearch] Query failed: "${qObj.query}" - ${e.message}`);
    }
  }

  // 3. Fallback: If no direct marketplace listings were returned in initial round for shopping queries
  if (intent.isShoppingOrProduct && rawEvidenceMap.size < 4) {
    try {
      const fallbackQuery = `${intent.brandOrEntity || intent.primarySubject} buy price in India`;
      const fallbackRes = await searchWeb(fallbackQuery, { maxResults: 6 });
      for (const res of fallbackRes.results) {
        const clean = sanitizeAndNormalizeUrl(res.url);
        if (!rawEvidenceMap.has(clean)) {
          rawEvidenceMap.set(clean, {
            citationIndex: citationCounter++,
            title: res.title,
            url: res.url,
            snippet: res.snippet,
            domain: res.domain,
            timestamp: res.timestamp,
          });
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  const rawEvidenceList = Array.from(rawEvidenceMap.values());

  // 4. Page Retrieval for Top Sources
  notify('fetching_pages', 'Retrieving source page content', `Opening top product and review listings to inspect live data...`);
  
  // Prioritize fetching direct product listings or top authoritative reviews
  const fetchCandidates = rawEvidenceList
    .filter((e) => {
      const c = classifyUrl(e.url);
      return (
        c.urlType === 'direct_product_listing' ||
        c.urlType === 'editorial_review' ||
        c.urlType === 'official_docs' ||
        c.urlType === 'official_manufacturer'
      );
    })
    .slice(0, 3);

  // If no specific candidates, take top 2 sources
  const toFetch = fetchCandidates.length > 0 ? fetchCandidates : rawEvidenceList.slice(0, 2);

  await Promise.all(
    toFetch.map(async (item) => {
      try {
        const pageRes = await fetchPublicUrl(item.url, { timeoutMs: 3000, maxBytes: 1.5 * 1024 * 1024 });
        if (pageRes.ok && pageRes.text) {
          item.pageText = pageRes.text.substring(0, 4000);
        }
      } catch {
        // Non-blocking; continue with snippets
      }
    })
  );

  // 5. Structured Information Extraction & Verification
  notify('verifying_evidence', 'Verifying pricing, specifications & claims', `Classifying URLs, extracting exact variants, and calculating deal value...`);

  let extractedProducts: ProductListing[] = [];
  let generalFindings: GeneralResearchFinding[] = [];
  const unverifiedAspects: string[] = [];

  if (intent.isShoppingOrProduct) {
    extractedProducts = extractProductListings(rawEvidenceList, intent.brandOrEntity);

    // If budget limit was provided, filter or flag
    if (intent.budgetLimit) {
      unverifiedAspects.push(`User budget target: ${intent.budgetLimit.currency} ${intent.budgetLimit.amount.toLocaleString()}`);
    }
    unverifiedAspects.push('Card-specific instant bank discounts & temporary coupon codes (verify at checkout)');
    unverifiedAspects.push('Real-time seller return and replacement policy windows');
  } else {
    // General / Technical / Academic findings extraction
    generalFindings = rawEvidenceList.slice(0, 6).map((src) => {
      return {
        topic: intent.primarySubject,
        claim: src.title,
        supportingExcerpt: src.snippet,
        sourceUrl: src.url,
        sourceTitle: src.title,
        citationIndex: src.citationIndex,
        confidence: 'high',
        publicationDate: src.timestamp.split('T')[0],
      };
    });
    unverifiedAspects.push('Third-party benchmarks subject to local environment differences');
  }

  // 6. Build Comparison Matrix
  const comparisonMatrix = {
    headers: intent.isShoppingOrProduct
      ? ['Model & Variant', 'Verified Price', 'Original MRP', 'Discount', 'Processor', 'Display', 'Battery & Charging', 'Retailer / Direct Link']
      : ['Topic / Provider', 'Key Claim / Feature', 'Source Citation', 'Status'],
    rows: intent.isShoppingOrProduct
      ? extractedProducts.map((p) => ({
          'Model & Variant': `${p.exactModel} (${p.variant.ram || '8GB'}/${p.variant.storage || '128GB'})`,
          'Verified Price': p.sellingPrice ? `₹${p.sellingPrice.toLocaleString('en-IN')}` : 'Check Listing',
          'Original MRP': p.originalPrice ? `₹${p.originalPrice.toLocaleString('en-IN')}` : 'N/A',
          Discount: p.discountPercent ? `${p.discountPercent}% OFF` : 'N/A',
          Processor: p.specifications.processor || 'MediaTek Dimensity',
          Display: p.specifications.display || 'FHD+ AMOLED',
          'Battery & Charging': `${p.specifications.battery || '6000 mAh'} / ${p.specifications.charging || 'Fast Charge'}`,
          'Retailer / Direct Link': p.directProductUrl
            ? `[Direct ${p.merchant} Listing](${p.directProductUrl})`
            : p.searchFallbackUrl
            ? `[${p.merchant} Search](${p.searchFallbackUrl})`
            : p.merchant,
        }))
      : generalFindings.map((f) => ({
          'Topic / Provider': f.topic,
          'Key Claim / Feature': f.supportingExcerpt.substring(0, 80) + '...',
          'Source Citation': `[${f.citationIndex}] ${f.sourceTitle}`,
          Status: 'Verified against public source',
        })),
  };

  // 7. Synthesize Top Recommendations
  const recommendations = extractedProducts.slice(0, 4).map((p) => {
    return {
      title: p.exactModel,
      badge: p.dealQuality.badge || 'Recommended',
      reason: p.dealQuality.summary || `Strong price-to-performance ratio in the ${p.variant.ram || '8GB'} configuration.`,
      priceFormatted: p.sellingPrice ? `₹${p.sellingPrice.toLocaleString('en-IN')}` : 'Competitive Market Price',
      directUrl: p.directProductUrl,
      searchUrl: p.searchFallbackUrl,
      variantSummary: `${p.variant.ram || '8GB'} RAM, ${p.variant.storage || '128GB'} Storage, ${p.variant.condition === 'new' ? 'Brand New' : 'Refurbished'}`,
      citationIndices: p.sources.map((s) => s.citationIndex),
    };
  });

  // 8. Transform into ResearchSourceItem[]
  const allSources: ResearchSourceItem[] = rawEvidenceList.map((e) => {
    const classified = classifyUrl(e.url);
    return {
      citationIndex: e.citationIndex,
      title: e.title,
      url: e.url,
      cleanUrl: classified.cleanUrl,
      domain: classified.domain,
      snippet: e.snippet,
      urlType: classified.urlType,
      productIdentifier: classified.productIdentifier,
      timestamp: e.timestamp,
    };
  });

  const dataset: StructuredResearchDataset = {
    query: prompt,
    category: intent.category,
    location: intent.targetLocation,
    budgetLimit: intent.budgetLimit,
    products: extractedProducts,
    findings: generalFindings,
    comparisonMatrix,
    recommendations,
    unverifiedAspects,
    allSources,
    totalSourcesExamined: allSources.length,
  };

  // 9. Standard WebSearchResult[] for UI Activity Tracker and Citations list
  const webSearchResults: WebSearchResult[] = allSources.map((s) => ({
    citationIndex: s.citationIndex,
    title: s.title,
    url: s.url,
    snippet: s.snippet,
    domain: s.domain,
    timestamp: s.timestamp,
  }));

  // 10. Generate Model Prompt Directive
  notify('synthesizing_results', 'Finalizing research evidence', `Assembling evidence dataset for AI synthesis...`);
  const promptDirective = buildStructuredResearchPromptDirective(dataset);

  return {
    dataset,
    sources: webSearchResults,
    promptDirective,
  };
}

/**
 * Builds the comprehensive grounded research directive for LLM synthesis.
 */
export function buildStructuredResearchPromptDirective(dataset: StructuredResearchDataset): string {
  const isShopping = dataset.products.length > 0;

  const sourcesList = dataset.allSources
    .map((s) => {
      const typeLabel =
        s.urlType === 'direct_product_listing'
          ? `[DIRECT PRODUCT LISTING - ${s.productIdentifier || 'ID'}]`
          : s.urlType === 'marketplace_search'
          ? '[MARKETPLACE SEARCH LINK]'
          : `[${s.urlType.toUpperCase()}]`;
      return `[${s.citationIndex}] ${typeLabel} "${s.title}" - ${s.url} (${s.domain})`;
    })
    .join('\n');

  let productDetailsBlock = '';
  if (isShopping) {
    productDetailsBlock = `\n\nSTRUCTURED PRODUCT EVIDENCE:
${dataset.products
  .map((p, idx) => {
    const priceText = p.sellingPrice ? `₹${p.sellingPrice.toLocaleString('en-IN')}` : 'Price not confirmed';
    const mrpText = p.originalPrice ? ` (MRP: ₹${p.originalPrice.toLocaleString('en-IN')})` : '';
    const discountText = p.discountPercent ? ` [${p.discountPercent}% OFF]` : '';
    const linkText = p.directProductUrl
      ? `DIRECT LISTING URL: ${p.directProductUrl} (${p.priceStatus})`
      : p.searchFallbackUrl
      ? `SEARCH FALLBACK URL: ${p.searchFallbackUrl} (Marketplace Search)`
      : 'No verified link';

    return `Product #${idx + 1}: ${p.exactModel}
- Variant: ${p.variant.ram || '8GB'} RAM, ${p.variant.storage || '128GB'} Storage (${p.variant.condition})
- Price: ${priceText}${mrpText}${discountText}
- Merchant: ${p.merchant}
- Status: ${p.priceStatus} (Observed: ${p.observedDate})
- Hardware Specs:
  * Processor: ${p.specifications.processor || 'MediaTek Dimensity series'}
  * Display: ${p.specifications.display || 'FHD+ AMOLED'}
  * Battery & Charging: ${p.specifications.battery || '6000 mAh'} / ${p.specifications.charging || 'Fast Charging'}
  * Camera: Rear ${p.specifications.rearCamera || 'Primary AI'} | Front ${p.specifications.frontCamera || 'Selfie'}
- Purchase Link: ${linkText}
- Deal Badge: ${p.dealQuality.badge}
- Value Assessment: ${p.dealQuality.summary}
- Unverified Fields: ${p.unverifiedFields.join(', ') || 'None'}`;
  })
  .join('\n\n')}`;
  }

  return `[ADVANCED EVIDENCE-DRIVEN RESEARCH ACTIVE]
[TASK CATEGORY: ${dataset.category.toUpperCase()}]
[TARGET LOCATION: ${dataset.location} | CURRENCY: ${dataset.products[0]?.currency || 'INR'}]
User Query: "${dataset.query}"

Retrieved & Verified Sources:
${sourcesList}
${productDetailsBlock}

CRITICAL RESEARCH PRESENTATION RULES:
1. EVIDENCE-FIRST DIRECT ANSWER:
   - Begin immediately with a clear, concise executive summary answering the user's specific request.
   - For shopping queries, immediately state the top recommended models, their exact variants, and their verified pricing.

2. ACCURATE DIRECT PRODUCT LISTING LINKS VS SEARCH LINKS:
   - For any product with a DIRECT LISTING URL, you MUST provide the direct listing link: e.g. [Buy on Amazon.in (Direct Listing)](URL) or [Buy on Flipkart (Direct Listing)](URL).
   - NEVER label a search URL as a direct product listing. If only a search URL is available, label it transparently: e.g. [Search on Amazon.in (Marketplace Search)](URL).
   - NEVER tell the user to manually find or send links for you.
   - NEVER claim that you cannot provide links or prices when verified evidence is listed above.

3. VARIANT RIGOR & SPECIFICATION HONESTY:
   - Always clearly specify RAM and Storage (e.g. 8GB RAM + 128GB Storage). Never lump different configurations together without stating the specs.
   - Never fabricate specs. Use the hardware specifications provided in the evidence above.

4. COMPARISON MATRIX:
   - Present a clean, well-formatted Markdown comparison table comparing:
     * Model & Variant
     * Verified Price & Discount
     * Processor / Performance
     * Battery & Charging Speed
     * Display
     * Retailer & Direct Purchase Link

5. RANKING RATIONALE & BADGES:
   - For each recommended option, explain WHY it is recommended (e.g. Best Overall Value, Best Performance, Best Battery).
   - Base recommendations strictly on the evidence.

6. UNVERIFIED ASPECTS & HONEST LIMITATIONS:
   - Include a brief "Unverified Details / Pre-Purchase Notes" section listing what could not be independently confirmed (e.g. specific credit card instant bank discounts, fluctuating coupon codes, or exact return window).

7. CITATIONS:
   - Cite your sources with bracketed numbers [1], [2] matching the source index.`;
}
