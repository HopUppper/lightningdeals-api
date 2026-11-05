/**
 * server/research/researchIntent.ts
 *
 * LightningAPI Advanced Research Engine - Intent Classifier & Multi-Stage Query Generator
 *
 * Analyzes natural language user prompts to determine the exact research category,
 * extracts budget, location, product entities, and generates targeted multi-angle search queries.
 * Fully supports multi-turn conversational query rewriting and context inheritance.
 */

import { ResearchCategory, ResearchPlan } from './researchTypes';

export interface ConversationContextHint {
  title?: string;
  previousUserMessage?: string;
  previousAssistantResponse?: string;
  recentMessages?: Array<{ role: string; content: string }>;
}

export interface ExtractedIntentEntities {
  category: ResearchCategory;
  primarySubject: string;
  brandOrEntity: string;
  detectedModels?: string[];
  targetLocation: 'India' | 'US' | 'Global';
  currency: string;
  budgetLimit: {
    amount: number;
    currency: string;
  } | null;
  requiredAttributes: string[];
  isShoppingOrProduct: boolean;
  isFollowUp?: boolean;
  generatedQueries: Array<{
    query: string;
    purpose: 'broad' | 'amazon_direct' | 'flipkart_direct' | 'specs_official' | 'pricing' | 'academic' | 'general';
    preferredDomains?: string[];
  }>;
}

/**
 * Classifies research intent and extracts key entities from user query.
 * Fully contextual: resolves anaphoric follow-ups ("can u give me the direct product link?")
 * using conversation history to prevent amnesia and irrelevant queries.
 */
export function analyzeResearchIntent(
  userPrompt: string,
  contextHint?: string | ConversationContextHint
): ExtractedIntentEntities {
  const prompt = (userPrompt || '').trim();
  const lower = prompt.toLowerCase();

  // Extract text from contextHint
  let contextUserText = '';
  let contextAssistantText = '';
  let contextTitleText = '';
  if (typeof contextHint === 'string') {
    contextUserText = contextHint;
    contextTitleText = contextHint;
  } else if (contextHint && typeof contextHint === 'object') {
    contextUserText = contextHint.previousUserMessage || '';
    contextAssistantText = contextHint.previousAssistantResponse || '';
    contextTitleText = contextHint.title || '';
    if (Array.isArray(contextHint.recentMessages)) {
      const msgs = contextHint.recentMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join(' ');
      contextUserText += ` ${msgs}`;
    }
  }

  // Clean title of conversational filler and trailing truncation ellipsis
  let cleanTitle = contextTitleText
    .replace(/\.{2,}$/g, '')
    .replace(/^(can (u|you) (get|find|give) (me )?(a )?(cheap |good |best )?(deal (on|for) (a )?)?)/i, '')
    .trim();
  if (cleanTitle.toLowerCase().startsWith('refur') && cleanTitle.length < 15) {
    cleanTitle = 'refurbished mini pc';
  }

  const combinedContext = `${contextUserText} ${contextAssistantText} ${cleanTitle}`.trim();
  const combinedContextLower = combinedContext.toLowerCase();

  // Helper to detect meta-intent phrases (asking for links, deals, where to buy) that are NOT products
  const isMetaIntentQuery = (str: string): boolean => {
    if (!str) return true;
    const s = str.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
    if (s.length <= 3) return true;
    return /^(the\s*)?(direct\s+)?(product\s+|purchase\s+|buy\s+|amazon\s+|flipkart\s+)?(links?|urls?|options?|deals?|prices?)$/i.test(s) ||
           /^(the\s*)?(link|product link|direct link|direct product link|purchase link|buy link)$/i.test(s) ||
           /^(can (u|you) (give|share|send|provide|show) (me )?(the )?(direct |purchase |buy )?(product |amazon |flipkart )?links?\??)$/i.test(s) ||
           /^(give me|show me|send|share|where to buy|how to buy|where can i buy|where to find)\b/i.test(s);
  };

  // 1. Follow-up / Anaphora Detection
  const followUpPattern =
    /^(can (u|you) (give|share|send|provide|show) (me )?(the )?(direct |purchase |buy )?(product |amazon |flipkart )?links?\??)/i.test(lower) ||
    /\b(direct (product )?links?|purchase links?|buy links?|amazon links?|flipkart links?|where to buy|how to buy|where can i buy|indian links?|india links?|purchase link|product link)\b/i.test(lower) ||
    /^(give me|show me|share|send) (the )?(links?|options?|deals?|prices?)/i.test(lower) ||
    /^(which (one|is better)|what about (the|this)|show (me )?cheaper|any other|is there any)\b/i.test(lower) ||
    (/\b(this|that|these|those|it|them|the first one|the second one|the former|the latter|links?)\b/i.test(lower) && prompt.split(/\s+/).length <= 12) ||
    isMetaIntentQuery(prompt);

  const isFollowUp = Boolean(followUpPattern && combinedContext.length > 3);

  // 2. Detect Location & Currency
  // Default to India for consumer shopping on LightningAPI unless explicit US/UK/EUR markers exist
  let targetLocation: 'India' | 'US' | 'Global' = 'India';
  let currency = 'INR';

  const hasExplicitUs =
    /\$|\busd\b|\bin us\b|\bin usa\b|\bunited states\b|\bamazon\.com\b/i.test(lower);
  const hasExplicitUk =
    /£|\bgbp\b|\bin uk\b|\bunited kingdom\b|\bamazon\.co\.uk\b/i.test(lower);
  const hasExplicitEur =
    /€|\beur\b|\bin europe\b|\bamazon\.de\b/i.test(lower);

  if (hasExplicitUs) {
    targetLocation = 'US';
    currency = 'USD';
  } else if (hasExplicitUk) {
    targetLocation = 'Global';
    currency = 'GBP';
  } else if (hasExplicitEur) {
    targetLocation = 'Global';
    currency = 'EUR';
  } else {
    // Check if India markers exist in prompt or context
    const hasIndiaMarker =
      /₹|\brs\.?|\binr\b|\b(lakh|crore)\b|\bflipkart\b|\bamazon\.in\b|\bcroma\b|\breliance digital\b|\bin india\b|\bindia\b|\bnewjaisa\b/i.test(lower) ||
      /\b\d+\s*k\b/i.test(lower) ||
      /₹|\brs\.?|\binr\b|\b(lakh|crore)\b|\bflipkart\b|\bamazon\.in\b|\bin india\b|\bindia\b|\bnewjaisa\b/i.test(combinedContextLower);

    if (hasIndiaMarker) {
      targetLocation = 'India';
      currency = 'INR';
    } else if (isFollowUp && combinedContextLower.includes('usd')) {
      targetLocation = 'US';
      currency = 'USD';
    } else {
      // Default consumer shopping to India, academic / tech to Global if neutral
      targetLocation = 'India';
      currency = 'INR';
    }
  }

  // 3. Detect Budget Constraint (checking prompt first, then context)
  let budgetLimit: { amount: number; currency: string } | null = null;
  const budgetSourceText = lower + (isFollowUp ? ` ${combinedContextLower}` : '');
  const budgetMatch = budgetSourceText.match(
    /(?:under|below|less than|within|budget of)\s*(?:₹|rs\.?|\$|€|£)?\s*([0-9,]+)(?:\s*(?:k|thousand|lakh|inr|usd))?(?:\s*(?:or|to|-)\s*([0-9,]+)(?:\s*(?:k|thousand|lakh|inr|usd))?)?/i
  );

  if (budgetMatch) {
    // If range like "within 16k or 17k", use upper bound
    const rawValStr = budgetMatch[2] || budgetMatch[1];
    let rawNum = parseFloat(rawValStr.replace(/,/g, ''));
    if (!isNaN(rawNum)) {
      if (budgetSourceText.includes(`${rawValStr}k`) || budgetSourceText.includes('thousand') || (rawNum <= 100 && currency === 'INR')) {
        rawNum = rawNum * 1000;
      } else if (budgetSourceText.includes('lakh')) {
        rawNum = rawNum * 100000;
      }
      budgetLimit = {
        amount: rawNum,
        currency,
      };
    }
  }

  // 4. Classify Category
  let category: ResearchCategory = 'general_factual';
  const effectiveTextForCategory = isFollowUp ? `${combinedContextLower} ${lower}` : lower;

  const isShopping = /\b(buy|deal|deals|discount|discounts|price|prices|cheap|cheapest|under\s*(?:₹|rs\.?|\$)?\s*\d+|\d+\s*k\b|amazon|flipkart|shop|shopping|purchase|cost|offer|offers|refurbished|renewed|mini pc|pc|laptop|phone|smartphone|direct product link|product link)\b/i.test(effectiveTextForCategory);
  const isComparison = /\b(compare|comparison|versus|vs|better than|difference between)\b/i.test(effectiveTextForCategory);
  const isSpecs = /\b(specs|specifications|features|camera|battery|processor|display|ram|storage)\b/i.test(effectiveTextForCategory);
  const isSoftwareSaaS = /\b(saas|software|crm|hosting|provider|cloud|database|postgres|postgresql|tool|tools|pricing plan|per month|subscription)\b/i.test(effectiveTextForCategory);
  const isTechnical = /\b(api|sdk|code|github|documentation|architecture|benchmark|performance|latency|postgres|kubernetes|docker|library)\b/i.test(effectiveTextForCategory);
  const isAcademic = /\b(paper|papers|study|studies|research paper|arxiv|journal|peer-reviewed|impact of|academic|doi)\b/i.test(effectiveTextForCategory);
  const isNews = /\b(latest news|current events|breaking|today|announcement|announced)\b/i.test(effectiveTextForCategory);
  const isMarket = /\b(market size|market share|industry report|cagr|forecast|revenue|market analysis)\b/i.test(effectiveTextForCategory);

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
  } else if (isShopping && /\b(deal|deals|discount|offer|cheapest|cheap)\b/i.test(effectiveTextForCategory)) {
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

  // 5. Extract Specific Models & Hardware Entities
  const detectedModels: string[] = [];
  const modelRegexes = [
    /dell\s+optiplex\s+(?:30[0-9]{2}|70[0-9]{2}|50[0-9]{2}|[0-9]{4}|micro)/gi,
    /hp\s+prodesk\s+(?:600|400|800|g[0-9]|mini|micro)/gi,
    /hp\s+elitedesk\s+(?:800|705|g[0-9]|mini)/gi,
    /lenovo\s+thinkcentre\s+(?:m[0-9]{2,3}[a-z]?|tiny)/gi,
    /tecno\s+pova\s+(?:[0-9]+(?:\s*(?:pro|neo|5g))?)/gi,
    /samsung\s+galaxy\s+(?:[a-z0-9]+)/gi,
    /iphone\s+(?:[0-9]{1,2}(?:\s*(?:pro|max|plus|mini))?)/gi,
    /mac\s+mini\s+(?:m[0-9])/gi,
  ];

  const searchCorpus = `${prompt} ${combinedContext}`;
  for (const regex of modelRegexes) {
    const matches = searchCorpus.match(regex);
    if (matches) {
      for (const m of matches) {
        const clean = m.trim();
        if (!detectedModels.some(existing => existing.toLowerCase() === clean.toLowerCase())) {
          detectedModels.push(clean);
        }
      }
    }
  }

  // 6. Extract Primary Brand / Entity
  let primarySubject = prompt
    .replace(/^(can (u|you) (get|find|give|show|recommend) (me )?(a )?(cheap |good |best )?(deal (on|for) (a )?)?)/i, '')
    .replace(/^(find|search|give me|show me|look up|what are|tell me about|compare|research|where can i buy|where to buy|looking for)\s+(a\s+)?/i, '')
    .replace(/\s+(within\s*(?:₹|rs\.?|\$)?\s*\d+\s*(?:k|thousand)?(?:\s*(?:or|to|-)\s*\d+\s*(?:k|thousand)?)?)$/i, '')
    .replace(/\s+(under\s*(?:₹|rs\.?|\$)?\s*\d+\s*(?:k|thousand)?)$/i, '')
    .replace(/\s+(in india|in us|for me|today|please|now)$/i, '')
    .trim();

  let brandOrEntity = '';
  const brands = [
    'tecno pova',
    'tecno',
    'dell optiplex',
    'hp prodesk',
    'hp elitedesk',
    'lenovo thinkcentre',
    'samsung',
    'apple',
    'iphone',
    'macbook',
    'mac mini',
    'xiaomi',
    'redmi',
    'poco',
    'realme',
    'oneplus',
    'motorola',
    'iqoo',
    'vivo',
    'oppo',
    'asus',
    'lenovo',
    'dell',
    'hp',
    'postgresql',
    'supabase',
    'linear',
    'docker',
    'kubernetes',
  ];

  for (const b of brands) {
    if (lower.includes(b)) {
      brandOrEntity = b;
      break;
    }
  }

  // If follow-up or missing brand, extract from context
  if (!brandOrEntity && combinedContext) {
    for (const b of brands) {
      if (combinedContextLower.includes(b)) {
        brandOrEntity = b;
        break;
      }
    }
  }

  // Rewrite primarySubject if it's a follow-up or meta query
  if (isFollowUp || isMetaIntentQuery(primarySubject)) {
    if (detectedModels.length > 0) {
      primarySubject = detectedModels.slice(0, 2).join(' and ');
    } else {
      const hardwareKeywords = [
        'refurbished mini pc',
        'mini pc',
        'refurbished laptop',
        'refurbished desktop',
        'micro pc',
        'desktop pc',
        'laptop',
        'smartphone',
        'budget phone',
        'tablet',
        'monitor',
      ];
      let matchedHw = '';
      for (const hw of hardwareKeywords) {
        if (combinedContextLower.includes(hw)) {
          matchedHw = hw;
          break;
        }
      }
      if (matchedHw) {
        primarySubject = matchedHw;
      } else if (cleanTitle && !isMetaIntentQuery(cleanTitle) && cleanTitle.length > 3) {
        primarySubject = cleanTitle;
      } else if (contextUserText) {
        const cleanedPrev = contextUserText
          .replace(/^(can (u|you) (get|find|give|show) (me )?(a )?(cheap |good |best )?(deal (on|for) (a )?)?)/i, '')
          .replace(/\s+(within\s*(?:₹|rs\.?|\$)?\s*\d+\s*(?:k|thousand)?(?:\s*(?:or|to|-)\s*\d+\s*(?:k|thousand)?)?)$/i, '')
          .trim();
        if (cleanedPrev.length > 3 && !isMetaIntentQuery(cleanedPrev)) {
          primarySubject = cleanedPrev.slice(0, 60);
        }
      }
    }

    // Append key hardware specs from context if not already in primarySubject
    const specs: string[] = [];
    const cpuMatch = combinedContext.match(/i[3579][ -]?[0-9]{1,2}(?:th|[0-9]{3}[a-z]*)?/i);
    if (cpuMatch && !primarySubject.toLowerCase().includes(cpuMatch[0].toLowerCase())) {
      specs.push(cpuMatch[0]);
    }
    const ramMatch = combinedContext.match(/([0-9]{1,2}\s*gb(?:\s*ram)?)/i);
    if (ramMatch && !primarySubject.toLowerCase().includes(ramMatch[1].toLowerCase())) {
      specs.push(ramMatch[0]);
    }
    const storageMatch = combinedContext.match(/([0-9]{3,4}\s*gb(?:\s*ssd)?)/i);
    if (storageMatch && !primarySubject.toLowerCase().includes(storageMatch[1].toLowerCase())) {
      specs.push(storageMatch[0]);
    }

    if (specs.length > 0) {
      primarySubject += ` ${specs.join(' ')}`;
    }
  }

  // Safety check: ensure primarySubject is NEVER a meta query string
  if (isMetaIntentQuery(primarySubject)) {
    primarySubject = brandOrEntity || (cleanTitle && cleanTitle.length > 3 ? cleanTitle : 'refurbished mini pc i5 16gb');
  }

  // 7. Generate Multi-Angle Search Strategy
  const isShoppingOrProduct = [
    'product_discovery',
    'price_comparison',
    'deal_discovery',
    'product_specifications',
    'product_reviews',
  ].includes(category);

  const generatedQueries: ExtractedIntentEntities['generatedQueries'] = [];

  if (isShoppingOrProduct) {
    let cleanProductTarget = (brandOrEntity || primarySubject)
      .replace(/\b(deals?|best|buy|find|under\s*\d+|price|direct product link|or above|cheap|purchase links?|buy links?|product links?)\b/gi, '')
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanProductTarget || cleanProductTarget.length < 3 || isMetaIntentQuery(cleanProductTarget)) {
      cleanProductTarget = brandOrEntity || (detectedModels[0] || 'refurbished mini pc i5 16gb');
    }

    if (targetLocation === 'India') {
      // If we have specific detected models, target them directly on Amazon India and Flipkart
      if (detectedModels.length > 0) {
        for (const model of detectedModels.slice(0, 2)) {
          generatedQueries.push({
            query: `amazon.in ${model} refurbished renewed price India`,
            purpose: 'amazon_direct',
            preferredDomains: ['amazon.in'],
          });
          generatedQueries.push({
            query: `flipkart.com ${model} refurbished`,
            purpose: 'flipkart_direct',
            preferredDomains: ['flipkart.com'],
          });
        }
      } else {
        // Direct Amazon India listing search
        const conciseTarget = cleanProductTarget
          .replace(/\b(with|for|or|above)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        generatedQueries.push({
          query: `amazon.in ${conciseTarget} renewed refurbished buy online India`,
          purpose: 'amazon_direct',
          preferredDomains: ['amazon.in'],
        });
        // Direct Flipkart listing search
        generatedQueries.push({
          query: `flipkart.com ${conciseTarget} renewed refurbished`,
          purpose: 'flipkart_direct',
          preferredDomains: ['flipkart.com'],
        });
      }

      // Spec & Price Authority Check in India
      generatedQueries.push({
        query: `${cleanProductTarget} price in India buy online amazon.in flipkart deals 2026`,
        purpose: 'specs_official',
      });

      // Broad Deal query
      generatedQueries.push({
        query: `${cleanProductTarget} refurbished mini pc price in India amazon flipkart`,
        purpose: 'broad',
      });
    } else {
      // Global / US Shopping
      if (detectedModels.length > 0) {
        for (const model of detectedModels.slice(0, 2)) {
          generatedQueries.push({
            query: `site:amazon.com "${model}"`,
            purpose: 'amazon_direct',
            preferredDomains: ['amazon.com'],
          });
        }
      } else {
        generatedQueries.push({
          query: `site:amazon.com "${cleanProductTarget}"`,
          purpose: 'amazon_direct',
          preferredDomains: ['amazon.com'],
        });
      }
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
      query: isFollowUp ? primarySubject : prompt,
      purpose: 'general',
    });
    generatedQueries.push({
      query: `${primarySubject} overview analysis 2026`,
      purpose: 'broad',
    });
  }

  // 8. Extract Required Attributes
  const requiredAttributes: string[] = [];
  const ramMatch = effectiveTextForCategory.match(/\b(\d+\s*gb)\s*(?:ram)?\b/i);
  if (ramMatch) requiredAttributes.push(ramMatch[1].toUpperCase() + ' RAM');

  const storageMatch = effectiveTextForCategory.match(/\b(\d+\s*gb|\d+\s*tb)\s*(?:storage|rom|ssd)\b/i);
  if (storageMatch) requiredAttributes.push(storageMatch[1].toUpperCase() + ' Storage');

  if (effectiveTextForCategory.includes('5g')) requiredAttributes.push('5G');
  if (effectiveTextForCategory.includes('amoled')) requiredAttributes.push('AMOLED Display');
  if (effectiveTextForCategory.includes('refurbished') || effectiveTextForCategory.includes('renewed')) requiredAttributes.push('Refurbished');

  return {
    category,
    primarySubject: primarySubject.trim(),
    brandOrEntity,
    detectedModels,
    targetLocation,
    currency,
    budgetLimit,
    requiredAttributes,
    isShoppingOrProduct,
    isFollowUp,
    generatedQueries: generatedQueries.slice(0, 4),
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
