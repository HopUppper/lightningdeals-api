/**
 * server/research/urlClassifier.ts
 *
 * LightningAPI Advanced Research Engine - URL Classifier & Normalizer
 *
 * Distinguishes direct product listings from search results, category pages,
 * editorial reviews, official manufacturer portals, technical documentation, and academic repositories.
 * Extracts canonical identifiers (Amazon ASIN, Flipkart FSN/PID) and cleans tracking parameters.
 */

import { UrlType } from './researchTypes';

export interface ClassifiedUrlInfo {
  urlType: UrlType;
  rawUrl: string;
  cleanUrl: string;
  domain: string;
  merchant: string;
  productIdentifier: string | null;
  identifierType?: 'ASIN' | 'FSN' | 'SKU' | 'DOI' | 'ARXIV' | null;
  canonicalListingUrl: string | null;
}

// Common affiliate and tracking query parameters to scrub
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'tag',
  'ascsubtag',
  'linkcode',
  'linkId',
  'ref',
  'ref_',
  'creative',
  'camp',
  'creativeasin',
  'gclid',
  'fbclid',
  'cmpid',
  'adid',
  'affid',
  'source',
  'aff_id',
  '_hsenc',
  '_hsmi',
  'mc_cid',
  'mc_eid',
  'dgcid',
  'sr_share',
]);

const EDITORIAL_DOMAINS = new Set([
  'gadgets360.com',
  '91mobiles.com',
  'gsmarena.com',
  'mysmartprice.com',
  'digit.in',
  'smartprix.com',
  'theverge.com',
  'techcrunch.com',
  'tomsguide.com',
  'cnet.com',
  'wirecutter.com',
  'pcmag.com',
  'engadget.com',
  'androidcentral.com',
  'xda-developers.com',
  'beebom.com',
  'techradar.com',
  'anandtech.com',
  'notebookcheck.net',
]);

const ACADEMIC_DOMAINS = new Set([
  'arxiv.org',
  'doi.org',
  'sciencedirect.com',
  'springer.com',
  'nature.com',
  'ieee.org',
  'acm.org',
  'scholar.google.com',
  'biorxiv.org',
  'medrxiv.org',
  'semanticscholar.org',
  'nber.org',
  'jstor.org',
  'ssrn.com',
  'ncbi.nlm.nih.gov',
  'pubmed.ncbi.nlm.nih.gov',
]);

const DOCS_DOMAINS = new Set([
  'docs.github.com',
  'developer.mozilla.org',
  'postgresql.org',
  'python.org',
  'nodejs.org',
  'golang.org',
  'rust-lang.org',
  'kubernetes.io',
  'react.dev',
  'vuejs.org',
  'angular.io',
  'nextjs.org',
  'prisma.io',
  'supabase.com',
  'redis.io',
  'docker.com',
  'aws.amazon.com',
  'cloud.google.com',
  'learn.microsoft.com',
]);

const MANUFACTURER_DOMAINS = new Set([
  'tecno-mobile.in',
  'tecno-mobile.com',
  'apple.com',
  'samsung.com',
  'mi.com',
  'oneplus.in',
  'oneplus.com',
  'realme.com',
  'vivo.com',
  'oppo.com',
  'motorola.in',
  'motorola.com',
  'iqoo.com',
  'asus.com',
  'lenovo.com',
  'dell.com',
  'hp.com',
  'acer.com',
  'nothing.tech',
  'google.com',
  'store.google.com',
]);

/**
 * Strips tracking parameters, affiliate tokens, and hash fragments from URLs.
 */
export function sanitizeAndNormalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    
    // Remove default tracking query parameters
    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (TRACKING_PARAMS.has(lower) || lower.startsWith('utm_')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((k) => parsed.searchParams.delete(k));

    // Clear hash fragment
    parsed.hash = '';

    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Extracts domain name in lowercase, stripped of leading www.
 */
export function extractCleanDomain(urlString: string): string {
  try {
    const parsed = new URL(urlString.trim());
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return 'unknown-source';
  }
}

/**
 * Classifies any web URL into its authoritative research category.
 */
export function classifyUrl(rawUrl: string): ClassifiedUrlInfo {
  const cleanUrl = sanitizeAndNormalizeUrl(rawUrl);
  let parsed: URL;
  try {
    parsed = new URL(cleanUrl);
  } catch {
    return {
      urlType: 'general_web',
      rawUrl,
      cleanUrl,
      domain: 'invalid-url',
      merchant: 'Web',
      productIdentifier: null,
      canonicalListingUrl: null,
    };
  }

  const domain = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  const pathname = parsed.pathname;

  // 1. Amazon Direct Product Listing vs Search / Category
  if (domain.includes('amazon.')) {
    // Amazon ASIN patterns: /dp/B0..., /gp/product/B0..., /[slug]/dp/B0...
    const dpMatch = pathname.match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i);
    if (dpMatch && dpMatch[1]) {
      const asin = dpMatch[1].toUpperCase();
      const canonicalListingUrl = `https://${parsed.hostname}/dp/${asin}`;
      return {
        urlType: 'direct_product_listing',
        rawUrl,
        cleanUrl,
        domain,
        merchant: domain.endsWith('.in') ? 'Amazon India' : 'Amazon',
        productIdentifier: asin,
        identifierType: 'ASIN',
        canonicalListingUrl,
      };
    }

    // Amazon Search or Filter Link
    if (pathname.startsWith('/s') || parsed.searchParams.has('k') || pathname.includes('/search/')) {
      return {
        urlType: 'marketplace_search',
        rawUrl,
        cleanUrl,
        domain,
        merchant: domain.endsWith('.in') ? 'Amazon India' : 'Amazon',
        productIdentifier: null,
        canonicalListingUrl: null,
      };
    }

    // Amazon Category / Browse Link
    if (pathname.startsWith('/b') || pathname.includes('/browse/')) {
      return {
        urlType: 'category_page',
        rawUrl,
        cleanUrl,
        domain,
        merchant: domain.endsWith('.in') ? 'Amazon India' : 'Amazon',
        productIdentifier: null,
        canonicalListingUrl: null,
      };
    }

    return {
      urlType: 'general_web',
      rawUrl,
      cleanUrl,
      domain,
      merchant: 'Amazon',
      productIdentifier: null,
      canonicalListingUrl: null,
    };
  }

  // 2. Flipkart Direct Product Listing vs Search / Category
  if (domain.includes('flipkart.com')) {
    // Flipkart Direct Listing: /[title]/p/itm[a-zA-Z0-9]+ or has pid=
    const pidFromQuery = parsed.searchParams.get('pid');
    const itmMatch = pathname.match(/\/p\/(itm[a-zA-Z0-9]+)/i);

    if (itmMatch && itmMatch[1]) {
      const fsn = itmMatch[1];
      const canonicalListingUrl = `https://www.flipkart.com/p/${fsn}${pidFromQuery ? `?pid=${pidFromQuery}` : ''}`;
      return {
        urlType: 'direct_product_listing',
        rawUrl,
        cleanUrl,
        domain,
        merchant: 'Flipkart',
        productIdentifier: pidFromQuery || fsn,
        identifierType: 'FSN',
        canonicalListingUrl,
      };
    }

    if (pidFromQuery && pidFromQuery.length >= 8) {
      return {
        urlType: 'direct_product_listing',
        rawUrl,
        cleanUrl,
        domain,
        merchant: 'Flipkart',
        productIdentifier: pidFromQuery,
        identifierType: 'FSN',
        canonicalListingUrl: `https://www.flipkart.com/p/${pidFromQuery}`,
      };
    }

    // Flipkart Search Link
    if (pathname.startsWith('/search') || pathname.startsWith('/q/') || parsed.searchParams.has('q')) {
      return {
        urlType: 'marketplace_search',
        rawUrl,
        cleanUrl,
        domain,
        merchant: 'Flipkart',
        productIdentifier: null,
        canonicalListingUrl: null,
      };
    }

    // Flipkart Category / Filter
    if (pathname.includes('/pr') || parsed.searchParams.has('sid')) {
      return {
        urlType: 'category_page',
        rawUrl,
        cleanUrl,
        domain,
        merchant: 'Flipkart',
        productIdentifier: null,
        canonicalListingUrl: null,
      };
    }

    return {
      urlType: 'general_web',
      rawUrl,
      cleanUrl,
      domain,
      merchant: 'Flipkart',
      productIdentifier: null,
      canonicalListingUrl: null,
    };
  }

  // 3. Croma & Reliance Digital Product Listings
  if (domain.includes('croma.com')) {
    const cromaMatch = pathname.match(/\/p\/([0-9]+)/i);
    if (cromaMatch && cromaMatch[1]) {
      return {
        urlType: 'direct_product_listing',
        rawUrl,
        cleanUrl,
        domain,
        merchant: 'Croma',
        productIdentifier: cromaMatch[1],
        identifierType: 'SKU',
        canonicalListingUrl: `https://www.croma.com/p/${cromaMatch[1]}`,
      };
    }
  }

  if (domain.includes('reliancedigital.in')) {
    const rdMatch = pathname.match(/\/p\/([0-9]+)/i);
    if (rdMatch && rdMatch[1]) {
      return {
        urlType: 'direct_product_listing',
        rawUrl,
        cleanUrl,
        domain,
        merchant: 'Reliance Digital',
        productIdentifier: rdMatch[1],
        identifierType: 'SKU',
        canonicalListingUrl: `https://www.reliancedigital.in/p/${rdMatch[1]}`,
      };
    }
  }

  // 4. Academic Research
  if (
    ACADEMIC_DOMAINS.has(domain) ||
    domain.endsWith('.edu') ||
    domain.endsWith('.ac.in') ||
    domain.endsWith('.ac.uk') ||
    pathname.includes('/doi/') ||
    pathname.includes('/abs/')
  ) {
    let identifier: string | null = null;
    let identifierType: 'DOI' | 'ARXIV' | null = null;

    if (domain.includes('arxiv.org')) {
      const arxivMatch = pathname.match(/\/(?:abs|pdf)\/([0-9]{4}\.[0-9]+)/i);
      if (arxivMatch) {
        identifier = arxivMatch[1];
        identifierType = 'ARXIV';
      }
    } else if (pathname.includes('/doi/')) {
      const doiMatch = pathname.match(/\/doi\/(10\.[0-9]+\/[^\s/?#]+)/i);
      if (doiMatch) {
        identifier = doiMatch[1];
        identifierType = 'DOI';
      }
    }

    return {
      urlType: 'academic_paper',
      rawUrl,
      cleanUrl,
      domain,
      merchant: 'Academic Institution',
      productIdentifier: identifier,
      identifierType,
      canonicalListingUrl: cleanUrl,
    };
  }

  // 5. Official Technical Documentation
  if (
    DOCS_DOMAINS.has(domain) ||
    domain.startsWith('docs.') ||
    domain.startsWith('documentation.') ||
    domain.startsWith('developer.') ||
    domain.startsWith('dev.') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/documentation')
  ) {
    return {
      urlType: 'official_docs',
      rawUrl,
      cleanUrl,
      domain,
      merchant: 'Documentation Portal',
      productIdentifier: null,
      canonicalListingUrl: cleanUrl,
    };
  }

  // 6. Official Manufacturer Portal
  if (MANUFACTURER_DOMAINS.has(domain) || domain.includes('store.') || domain.includes('shop.')) {
    return {
      urlType: 'official_manufacturer',
      rawUrl,
      cleanUrl,
      domain,
      merchant: domain.split('.')[0].toUpperCase(),
      productIdentifier: null,
      canonicalListingUrl: cleanUrl,
    };
  }

  // 7. Editorial Tech Reviews & Spec Sites
  if (EDITORIAL_DOMAINS.has(domain)) {
    return {
      urlType: 'editorial_review',
      rawUrl,
      cleanUrl,
      domain,
      merchant: domain.split('.')[0],
      productIdentifier: null,
      canonicalListingUrl: cleanUrl,
    };
  }

  // Default General Web
  return {
    urlType: 'general_web',
    rawUrl,
    cleanUrl,
    domain,
    merchant: domain,
    productIdentifier: null,
    canonicalListingUrl: cleanUrl,
  };
}

/**
 * Returns true strictly if the URL is an actual direct product listing page.
 */
export function isDirectProductListing(rawUrl: string): boolean {
  const classified = classifyUrl(rawUrl);
  return classified.urlType === 'direct_product_listing';
}
