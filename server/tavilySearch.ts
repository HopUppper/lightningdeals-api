/**
 * server/tavilySearch.ts
 *
 * Official Tavily Search API Service for LightningAPI AI Chat Studio.
 * Complies with the official Tavily Search API specification:
 * - Endpoint: POST https://api.tavily.com/search
 * - Authentication: Bearer token via TAVILY_API_KEY environment variable
 * - Strict server-side secret isolation: API key is never sent to clients or logged
 * - Bounded request duration, query length, and result count
 * - Separately tracked usage telemetry for monitoring monthly allowance
 */

export interface TavilySearchOptions {
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeImages?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  timeoutMs?: number;
}

export interface TavilyRawResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  raw_content?: string;
  published_date?: string;
}

export interface TavilySearchSuccessResponse {
  success: true;
  provider: 'Tavily Search API';
  query: string;
  answer?: string;
  results: Array<{
    citationIndex: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    score?: number;
    publishedDate?: string;
    timestamp: string;
  }>;
  responseTimeMs: number;
}

export interface TavilySearchErrorResponse {
  success: false;
  provider: 'Tavily Search API';
  query: string;
  results: [];
  error: string;
  code: 'MISSING_API_KEY' | 'INVALID_QUERY' | 'CREDITS_EXHAUSTED' | 'RATE_LIMITED' | 'TIMEOUT' | 'API_ERROR';
}

export type TavilySearchResponse = TavilySearchSuccessResponse | TavilySearchErrorResponse;

export interface TavilyUsageTelemetry {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUsedAt: string | null;
  currentMonth: string;
  monthlyRequests: number;
  estimatedMonthlyLimit: number;
}

// ---------------------------------------------------------------------------
// Telemetry & Monthly Accounting State
// ---------------------------------------------------------------------------
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

const usageTelemetry: TavilyUsageTelemetry = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastUsedAt: null,
  currentMonth: getCurrentMonthKey(),
  monthlyRequests: 0,
  estimatedMonthlyLimit: 1000, // Standard free tier allowance
};

function recordTavilyRequest(success: boolean) {
  const currentMonth = getCurrentMonthKey();
  if (usageTelemetry.currentMonth !== currentMonth) {
    usageTelemetry.currentMonth = currentMonth;
    usageTelemetry.monthlyRequests = 0;
  }

  usageTelemetry.totalRequests++;
  usageTelemetry.monthlyRequests++;
  usageTelemetry.lastUsedAt = new Date().toISOString();

  if (success) {
    usageTelemetry.successfulRequests++;
  } else {
    usageTelemetry.failedRequests++;
  }
}

/**
 * Returns current Tavily consumption metrics without exposing any credentials.
 */
export function getTavilyUsageStats(): TavilyUsageTelemetry & { isConfigured: boolean } {
  return {
    ...usageTelemetry,
    isConfigured: Boolean(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.trim()),
  };
}

/**
 * Checks whether Tavily API credentials are configured.
 */
export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.trim());
}

/**
 * Sanitizes and extracts the domain name from a URL string safely.
 */
export function extractCleanDomain(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'web-source';
  }
}

/**
 * Executes a search against the official Tavily API.
 */
export async function searchTavily(
  query: string,
  options: TavilySearchOptions = {}
): Promise<TavilySearchResponse> {
  const cleanQuery = (query || '').trim();

  // 1. Validate Input Query
  if (!cleanQuery) {
    return {
      success: false,
      provider: 'Tavily Search API',
      query: '',
      results: [],
      error: 'Search query cannot be empty.',
      code: 'INVALID_QUERY',
    };
  }

  // Enforce sensible query length limit (max 400 characters)
  const boundedQuery = cleanQuery.slice(0, 400);

  // 2. Validate API Key Existence
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      provider: 'Tavily Search API',
      query: boundedQuery,
      results: [],
      error: 'Tavily search is not configured. Server environment variable TAVILY_API_KEY is missing.',
      code: 'MISSING_API_KEY',
    };
  }

  // 3. Enforce Sensible Bounded Options
  const maxResults = Math.min(Math.max(Number(options.maxResults) || 5, 1), 10);
  const searchDepth = options.searchDepth === 'advanced' ? 'advanced' : 'basic';
  const timeoutMs = Math.min(Math.max(Number(options.timeoutMs) || 8000, 2000), 15000);

  const requestPayload: Record<string, any> = {
    api_key: apiKey,
    query: boundedQuery,
    search_depth: searchDepth,
    max_results: maxResults,
    include_answer: Boolean(options.includeAnswer),
    include_raw_content: Boolean(options.includeRawContent),
    include_images: Boolean(options.includeImages),
  };

  if (Array.isArray(options.includeDomains) && options.includeDomains.length > 0) {
    requestPayload.include_domains = options.includeDomains.slice(0, 10).map((d) => String(d).trim());
  }
  if (Array.isArray(options.excludeDomains) && options.excludeDomains.length > 0) {
    requestPayload.exclude_domains = options.excludeDomains.slice(0, 10).map((d) => String(d).trim());
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutHandle);
    const responseTimeMs = Date.now() - startTime;

    // Handle HTTP status errors gracefully
    if (!res.ok) {
      recordTavilyRequest(false);
      let errorDetail = `Tavily HTTP ${res.status}`;
      let errorCode: TavilySearchErrorResponse['code'] = 'API_ERROR';

      try {
        const errorBody: any = await res.json();
        if (errorBody?.detail?.error) {
          errorDetail = String(errorBody.detail.error);
        } else if (errorBody?.message) {
          errorDetail = String(errorBody.message);
        }
      } catch {
        // Fall back to status text
      }

      if (res.status === 401 || res.status === 403) {
        errorCode = 'CREDITS_EXHAUSTED';
        errorDetail = 'Tavily API key is invalid or monthly credits are exhausted.';
      } else if (res.status === 429) {
        errorCode = 'RATE_LIMITED';
        errorDetail = 'Tavily rate limit exceeded. Please wait a moment before retrying.';
      }

      return {
        success: false,
        provider: 'Tavily Search API',
        query: boundedQuery,
        results: [],
        error: errorDetail,
        code: errorCode,
      };
    }

    const data: any = await res.json();
    recordTavilyRequest(true);

    const timestamp = new Date().toISOString();
    const rawResults: TavilyRawResult[] = Array.isArray(data.results) ? data.results : [];

    const mappedResults = rawResults.slice(0, maxResults).map((r, idx) => ({
      citationIndex: idx + 1,
      title: (r.title || 'Untitled Web Source').slice(0, 150),
      url: r.url,
      snippet: (r.content || '').slice(0, 800), // Bounded snippet to prevent prompt bloat
      domain: extractCleanDomain(r.url),
      score: typeof r.score === 'number' ? Number(r.score.toFixed(3)) : undefined,
      publishedDate: r.published_date,
      timestamp,
    }));

    return {
      success: true,
      provider: 'Tavily Search API',
      query: boundedQuery,
      answer: typeof data.answer === 'string' ? data.answer : undefined,
      results: mappedResults,
      responseTimeMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutHandle);
    recordTavilyRequest(false);

    const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
    return {
      success: false,
      provider: 'Tavily Search API',
      query: boundedQuery,
      results: [],
      error: isTimeout
        ? `Tavily search timed out after ${timeoutMs}ms.`
        : `Tavily network request failed: ${err.message || 'Unknown network error.'}`,
      code: isTimeout ? 'TIMEOUT' : 'API_ERROR',
    };
  }
}
