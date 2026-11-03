/**
 * server/research/researchIntent.ts
 *
 * LightningAPI Advanced Research Engine - Intent Classifier & Multi-Stage Query Generator
 *
 * Analyzes natural language user prompts to determine the exact research category,
 * extracts budget, location, product entities, and generates targeted multi-angle search queries.
 */

import { ResearchCategory, ResearchPlan } from './researchTypes';

export interface ExtractedIntentEntities {
  category: ResearchCategory;
  primarySubject: string;
  brandOrEntity: string;
  targetLocation: 'India' | 'US' | 'Global';
  currency: string;
  budgetLimit: {
    amount: number;
    currency: string;
  } | null;
  requiredAttributes: string[];
  isShoppingOrProduct: boolean;
  generatedQueries: Array<{
    query: string;
    purpose: 'broad' | 'amazon_direct' | 'flipkart_direct' | 'specs_official' | 'pricing' | 'academic' | 'general';
    preferredDomains?: string[];
  }>;
}

/**
 * Classifies research intent and extracts key entities from user query.
 */
export function analyzeResearchIntent(userPrompt: string): ExtractedIntentEntities {
  const prompt = (userPrompt || '').trim();
  const lower = prompt.toLowerCase();

  // 1. Detect Location & Currency
  let targetLocation: 'India' | 'US' | 'Global' = 'Global';
  let currency = 'USD';

  if (
    lower.includes('in india') ||
    lower.includes('india') ||
    lower.includes('flipkart') ||
    lower.includes('amazon.in') ||
    lower.includes('croma') ||
    lower.includes('reliance digital') ||
    lower.includes('₹') ||
    lower.includes('rs.') ||
    lower.includes('inr') ||
    /\b(lakh|crore)\b/i.test(lower)
  ) {
    targetLocation = 'India';
    currency = 'INR';
  } else if (lower.includes('in uk') || lower.includes('£') || lower.includes('gbp')) {
    targetLocation = 'Global';
    currency = 'GBP';
  } else if (lower.includes('in europe') || lower.includes('€') || lower.includes('eur')) {
    targetLocation = 'Global';
    currency = 'EUR';
  } else if (lower.includes('$') || lower.includes('usd') || lower.includes('in us') || lower.includes('in usa')) {
    targetLocation = 'US';
    currency = 'USD';
  }

  // 2. Detect Budget Constraint
  let budgetLimit: { amount: number; currency: string } | null = null;
  const budgetMatch = lower.match(/(?:under|below|less than|within|budget of)\s*(?:₹|rs\.?|\$|€|£)?\s*([0-9,]+)(?:\s*(?:k|thousand|lakh|inr|usd))?/i);
  if (budgetMatch && budgetMatch[1]) {
    let rawNum = parseFloat(budgetMatch[1].replace(/,/g, ''));
    if (!isNaN(rawNum)) {
      if (lower.includes(`${budgetMatch[1]}k`) || lower.includes('thousand')) {
        rawNum = rawNum * 1000;
      } else if (lower.includes('lakh')) {
        rawNum = rawNum * 100000;
      }
      budgetLimit = {
        amount: rawNum,
        currency,
      };
    }
  }

  // 3. Classify Category
  let category: ResearchCategory = 'general_factual';
  const isShopping = /\b(buy|deal|deals|discount|discounts|price|prices|cheap|cheapest|under\s*(?:₹|rs\.?|\$)?\s*\d+|amazon|flipkart|shop|shopping|purchase|cost|offer|offers)\b/i.test(lower);
  const isComparison = /\b(compare|comparison|versus|vs|better than|difference between)\b/i.test(lower);
  const isSpecs = /\b(specs|specifications|features|camera|battery|processor|display|ram|storage)\b/i.test(lower);
  const isSoftwareSaaS = /\b(saas|software|crm|hosting|provider|cloud|database|postgres|postgresql|tool|tools|pricing plan|per month|subscription)\b/i.test(lower);
  const isTechnical = /\b(api|sdk|code|github|documentation|architecture|benchmark|performance|latency|postgres|kubernetes|docker|library)\b/i.test(lower);
  const isAcademic = /\b(paper|papers|study|studies|research paper|arxiv|journal|peer-reviewed|impact of|academic|doi)\b/i.test(lower);
  const isNews = /\b(latest news|current events|breaking|today|announcement|announced)\b/i.test(lower);
  const isMarket = /\b(market size|market share|industry report|cagr|forecast|revenue|market analysis)\b/i.test(lower);

  if (isAcademic) {
    category = 'academic_research';
  } else if (isMarket) {
    category = 'market_research';
  } else if (isSoftwareSaaS && isComparison) {
    category = 'software_saas_comparison';
  } else if (isTechnical && !isShopping) {
    category = 'technical_research';
  } else if (isShopping && isComparison) {
    category = 'price_comparison';
  } else if (isShopping && /\b(deal|deals|discount|offer|cheapest)\b/i.test(lower)) {
    category = 'deal_discovery';
  } else if (isShopping) {
    category = 'product_discovery';
  } else if (isSpecs) {
    category = 'product_specifications';
  } else if (isNews) {
    category = 'news_current_events';
  } else {
    category = 'general_factual';
  }

  // 4. Extract Primary Brand / Entity
  let primarySubject = prompt;
  let brandOrEntity = '';

  // Clean conversational prefixes
  const subjectClean = prompt
    .replace(/^(find|search|give me|show me|look up|what are|tell me about|compare|research)\s+/i, '')
    .replace(/\s+(in india|in us|for me|today|please|now)$/i, '')
    .trim();

  primarySubject = subjectClean;

  const brands = [
    'tecno pova',
    'tecno',
    'samsung',
    'apple',
    'iphone',
    'xiaomi',
    'redmi',
    'poco',
    'realme',
    'oneplus',
    'motorola',
    'iqoo',
    'vivo',
    'oppo',
    'nothing phone',
    'pixel',
    'google pixel',
    'asus',
    'lenovo',
    'dell',
    'hp',
    'macbook',
    'postgresql',
    'supabase',
    'linear',
    'jira',
    'notion',
    'trello',
    'docker',
    'kubernetes',
  ];

  for (const b of brands) {
    if (lower.includes(b)) {
      brandOrEntity = b;
      break;
    }
  }

  // 5. Generate Multi-Angle Search Strategy
  const isShoppingOrProduct = [
    'product_discovery',
    'price_comparison',
    'deal_discovery',
    'product_specifications',
    'product_reviews',
  ].includes(category);

  const generatedQueries: ExtractedIntentEntities['generatedQueries'] = [];

  if (isShoppingOrProduct) {
    const cleanProductTarget = brandOrEntity || primarySubject.replace(/\b(deals?|best|buy|find|under\s*\d+|price)\b/gi, '').trim();

    if (targetLocation === 'India') {
      // Angle 1: Direct Marketplace Amazon Listing
      generatedQueries.push({
        query: `${cleanProductTarget} site:amazon.in dp`,
        purpose: 'amazon_direct',
        preferredDomains: ['amazon.in'],
      });

      // Angle 2: Direct Marketplace Flipkart Listing
      generatedQueries.push({
        query: `${cleanProductTarget} site:flipkart.com /p/`,
        purpose: 'flipkart_direct',
        preferredDomains: ['flipkart.com'],
      });

      // Angle 3: Authoritative Spec Sheet / Price Tracker (Gadgets360 / 91mobiles)
      generatedQueries.push({
        query: `${cleanProductTarget} price in india specs site:91mobiles.com OR site:gadgets360.com`,
        purpose: 'specs_official',
        preferredDomains: ['91mobiles.com', 'gadgets360.com'],
      });

      // Angle 4: Broad live deal query
      generatedQueries.push({
        query: `${cleanProductTarget} price in India deals 2026`,
        purpose: 'broad',
      });
    } else {
      // Global / US Shopping
      generatedQueries.push({
        query: `${cleanProductTarget} site:amazon.com dp`,
        purpose: 'amazon_direct',
        preferredDomains: ['amazon.com'],
      });
      generatedQueries.push({
        query: `${cleanProductTarget} official price specs`,
        purpose: 'specs_official',
      });
      generatedQueries.push({
        query: `${cleanProductTarget} best price deals 2026`,
        purpose: 'broad',
      });
    }
  } else if (category === 'software_saas_comparison') {
    generatedQueries.push({
      query: `${primarySubject} official pricing plans features`,
      purpose: 'pricing',
    });
    generatedQueries.push({
      query: `${primarySubject} vs comparison 2026`,
      purpose: 'broad',
    });
  } else if (category === 'technical_research') {
    generatedQueries.push({
      query: `${primarySubject} official documentation guide`,
      purpose: 'specs_official',
    });
    generatedQueries.push({
      query: `${primarySubject} performance benchmarks architecture`,
      purpose: 'broad',
    });
  } else if (category === 'academic_research') {
    generatedQueries.push({
      query: `${primarySubject} arxiv paper research study`,
      purpose: 'academic',
      preferredDomains: ['arxiv.org', 'doi.org'],
    });
  } else {
    // General factual research
    generatedQueries.push({
      query: prompt,
      purpose: 'general',
    });
    generatedQueries.push({
      query: `${primarySubject} comprehensive overview analysis 2026`,
      purpose: 'broad',
    });
  }

  // 6. Extract Required Attributes
  const requiredAttributes: string[] = [];
  const ramMatch = lower.match(/\b(\d+\s*gb)\s*(?:ram)?\b/i);
  if (ramMatch) requiredAttributes.push(ramMatch[1].toUpperCase() + ' RAM');

  const storageMatch = lower.match(/\b(\d+\s*gb|\d+\s*tb)\s*(?:storage|rom|ssd)\b/i);
  if (storageMatch) requiredAttributes.push(storageMatch[1].toUpperCase() + ' Storage');

  if (lower.includes('5g')) requiredAttributes.push('5G');
  if (lower.includes('amoled')) requiredAttributes.push('AMOLED Display');
  if (lower.includes('refurbished')) requiredAttributes.push('Refurbished');

  return {
    category,
    primarySubject,
    brandOrEntity,
    targetLocation,
    currency,
    budgetLimit,
    requiredAttributes,
    isShoppingOrProduct,
    generatedQueries,
  };
}

/**
 * Builds a deterministic research execution plan.
 */
export function buildResearchPlan(prompt: string): ResearchPlan {
  const intent = analyzeResearchIntent(prompt);
  return {
    category: intent.category,
    primaryQuery: prompt,
    targetEntities: [intent.brandOrEntity || intent.primarySubject],
    location: intent.targetLocation,
    budgetLimit: intent.budgetLimit,
    executionRounds: [
      {
        roundIndex: 1,
        queries: intent.generatedQueries.slice(0, 2).map((q) => q.query),
        rationale: 'Execute initial targeted retrieval for direct listings and primary authority sources.',
      },
      {
        roundIndex: 2,
        queries: intent.generatedQueries.slice(2, 4).map((q) => q.query),
        rationale: 'Cross-reference specifications, verified pricing, and secondary merchant availability.',
      },
    ],
  };
}
