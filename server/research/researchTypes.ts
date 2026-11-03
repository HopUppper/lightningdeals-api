/**
 * server/research/researchTypes.ts
 *
 * LightningAPI Advanced Web Research, Deep Search & Shopping Intelligence Architecture
 * Core type definitions for multi-stage research, product discovery, URL classification,
 * price verification, and structured evidence datasets.
 */

export type ResearchCategory =
  | 'product_discovery'
  | 'price_comparison'
  | 'deal_discovery'
  | 'product_specifications'
  | 'product_reviews'
  | 'software_saas_comparison'
  | 'technical_research'
  | 'market_research'
  | 'business_research'
  | 'academic_research'
  | 'news_current_events'
  | 'general_factual';

export type UrlType =
  | 'direct_product_listing'
  | 'marketplace_search'
  | 'category_page'
  | 'official_manufacturer'
  | 'editorial_review'
  | 'academic_paper'
  | 'official_docs'
  | 'general_web';

export type PriceVerificationStatus =
  | 'VERIFIED'           // Price extracted directly from an active product listing
  | 'RECENTLY_OBSERVED'  // Price obtained from an authoritative tracker/spec sheet with date
  | 'UNVERIFIED'         // Price mentioned in an unverified source or snippet
  | 'UNAVAILABLE';       // No reliable price could be established

export type StockAvailability =
  | 'in_stock'
  | 'out_of_stock'
  | 'reported_available'
  | 'unknown';

export interface ProductVariant {
  ram?: string;
  storage?: string;
  color?: string;
  condition: 'new' | 'refurbished' | 'open_box';
}

export interface ProductListing {
  id: string;
  productName: string;
  exactModel: string;
  variant: ProductVariant;
  sellingPrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  currency: string;
  priceStatus: PriceVerificationStatus;
  observedDate?: string;
  merchant: string;
  marketplace: string;
  directProductUrl: string | null;
  searchFallbackUrl: string | null;
  amazonUrl?: string | null;
  flipkartUrl?: string | null;
  urlType: UrlType;
  productIdentifier: string | null; // e.g. Amazon ASIN (B0...) or Flipkart FSN/PID
  imageUrl?: string;
  specifications: {
    processor?: string;
    ram?: string;
    storage?: string;
    display?: string;
    battery?: string;
    charging?: string;
    rearCamera?: string;
    frontCamera?: string;
    os?: string;
    warranty?: string;
    [key: string]: string | undefined;
  };
  availability: StockAvailability;
  dealQuality: {
    badge?: string; // e.g. "Best Overall Value", "Lowest Verified Price", "Best Performance Under ₹15,000"
    summary?: string;
    valueScore?: number; // 1-100 scale
  };
  unverifiedFields: string[];
  retrievalTimestamp: string;
  sources: Array<{
    citationIndex: number;
    title: string;
    url: string;
    domain: string;
  }>;
}

export interface ResearchSourceItem {
  citationIndex: number;
  title: string;
  url: string;
  cleanUrl: string;
  domain: string;
  snippet: string;
  urlType: UrlType;
  productIdentifier?: string | null;
  timestamp: string;
  publishedDate?: string;
  score?: number;
}

export interface GeneralResearchFinding {
  topic: string;
  claim: string;
  supportingExcerpt: string;
  sourceUrl: string;
  sourceTitle: string;
  citationIndex: number;
  confidence: 'high' | 'medium' | 'low';
  publicationDate?: string;
}

export interface StructuredResearchDataset {
  query: string;
  category: ResearchCategory;
  location: string;
  budgetLimit: {
    amount: number;
    currency: string;
  } | null;
  products: ProductListing[];
  findings: GeneralResearchFinding[];
  comparisonMatrix: {
    headers: string[];
    rows: Array<Record<string, string>>;
  };
  recommendations: Array<{
    title: string;
    badge: string;
    reason: string;
    priceFormatted: string;
    directUrl?: string | null;
    searchUrl?: string | null;
    variantSummary: string;
    citationIndices: number[];
  }>;
  unverifiedAspects: string[];
  allSources: ResearchSourceItem[];
  totalSourcesExamined: number;
  completedAt: string;
}

export interface ResearchPlan {
  category: ResearchCategory;
  cleanTopic: string;
  extractedEntities: string[];
  targetLocation: string;
  targetCurrency: string;
  budgetNumber: number | null;
  searchQueries: string[];
  requiredAttributes: string[];
  userPreferences: string[];
}
