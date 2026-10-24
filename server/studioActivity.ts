/**
 * LIGHTNINGAPI.PRO — STUDIO 4.0 CONTEXT-AWARE ACTIVITY & THINKING STREAM
 * Produces honest, task-specific, privacy-safe progress events for the Chat Studio.
 * Strictly forbids leaking internal reasoning traces, developer prompts, API keys,
 * vendor identities, or private model routing details.
 */

import crypto from 'crypto';
import { detectUrlsInText } from './webResearch';

export interface StudioActivityEvent {
  id: string;
  type:
    | 'understanding_request'
    | 'preparing_operation'
    | 'opening_url'
    | 'extracting_content'
    | 'inspecting_navigation'
    | 'checking_registration'
    | 'analyzing_form'
    | 'searching_web'
    | 'evaluating_sources'
    | 'comparing_sources'
    | 'deep_research_round'
    | 'navigating_browser'
    | 'waiting_approval'
    | 'generating_answer'
    | 'completed'
    | 'failed'
    | 'cancelled';
  stage: 'active' | 'completed' | 'waiting_approval' | 'failed' | 'cancelled';
  title: string;
  detail?: string;
  targetUrl?: string;
  timestamp: string;
}

export interface TaskContextAnalysis {
  category: 'account_registration' | 'compare_links' | 'analyze_url' | 'web_search' | 'deep_research' | 'code_generation' | 'general';
  detectedUrls: string[];
  primaryUrl?: string;
  plannedStages: Array<{
    type: StudioActivityEvent['type'];
    title: string;
    detail: string;
  }>;
}

/**
 * Redacts any accidental API keys, vendor names, passwords, or PII from activity text.
 */
export function redactSensitiveActivityData(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // 1. Redact API keys and Tokens
  sanitized = sanitized.replace(/ld_live_[a-zA-Z0-9_\-]{16,}/gi, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/sk-ant-[a-zA-Z0-9_\-]{16,}/gi, '[REDACTED_KEY]');
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_\-]{20,}/gi, '[REDACTED_KEY]');
  sanitized = sanitized.replace(/ghp_[a-zA-Z0-9]{20,}/gi, '[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9_\-\.]{16,}/gi, 'Bearer [REDACTED_TOKEN]');

  // 2. Redact sensitive field patterns
  sanitized = sanitized.replace(/(password|passwd|secret|api_key|token)\s*[:=]\s*["']?[^\s"']+["']?/gi, '$1=[REDACTED]');

  // 3. Redact supplier names & internal routing identifiers
  sanitized = sanitized.replace(/\b(openrouter|bedrock|anthropic-proxy|vertex-ai|azure-openai)\b/gi, 'AI Gateway');
  sanitized = sanitized.replace(/\b(claude-3-5-sonnet-20241022|claude-3-7-sonnet-20250219|gpt-4o-2024-08-06)\b/gi, 'Verified Model');

  // 4. Redact raw file system paths
  sanitized = sanitized.replace(/[a-zA-Z]:\\[^\s<>"']+/gi, '[SYSTEM_PATH]');
  sanitized = sanitized.replace(/\/home\/[^\s<>"']+/gi, '[SYSTEM_PATH]');
  sanitized = sanitized.replace(/\/usr\/[^\s<>"']+/gi, '[SYSTEM_PATH]');

  // 5. Redact credit card numbers (13 to 19 digits)
  sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]');

  return sanitized;
}

/**
 * Analyzes the user prompt and request parameters to deduce the concrete task context.
 * Produces truthful, grounded task stages matching what the system actually does.
 */
export function analyzePromptTaskContext(
  prompt: string,
  researchMode?: string,
  targetUrl?: string
): TaskContextAnalysis {
  const cleanPrompt = (prompt || '').trim();
  const lower = cleanPrompt.toLowerCase();
  const urlsInText = detectUrlsInText(cleanPrompt);
  const primaryUrl = targetUrl || (urlsInText.length > 0 ? urlsInText[0] : undefined);

  // 1. Account Registration / Signup / Form Fill Context
  const isRegistrationIntent =
    primaryUrl &&
    (lower.includes('sign up') ||
      lower.includes('signup') ||
      lower.includes('register') ||
      lower.includes('create account') ||
      lower.includes('join') ||
      lower.includes('sign-up'));

  if (isRegistrationIntent && primaryUrl) {
    let domain = 'website';
    try { domain = new URL(primaryUrl).hostname.replace(/^www\./, ''); } catch {}

    return {
      category: 'account_registration',
      detectedUrls: urlsInText,
      primaryUrl,
      plannedStages: [
        {
          type: 'opening_url',
          title: `Opening ${domain}`,
          detail: 'Retrieving page content and navigation structure...',
        },
        {
          type: 'inspecting_navigation',
          title: 'Inspecting page content & navigation',
          detail: 'Locating navigation menus, links, and public options...',
        },
        {
          type: 'checking_registration',
          title: 'Examining account registration flow',
          detail: 'Checking which information the sign-up form requires...',
        },
        {
          type: 'analyzing_form',
          title: 'Reviewing form requirements',
          detail: 'Preparing next step. I will ask before submitting anything.',
        },
      ],
    };
  }

  // 2. Comparative Links Context (2+ URLs)
  if (urlsInText.length >= 2) {
    let d1 = 'first source';
    let d2 = 'second source';
    try { d1 = new URL(urlsInText[0]).hostname.replace(/^www\./, ''); } catch {}
    try { d2 = new URL(urlsInText[1]).hostname.replace(/^www\./, ''); } catch {}

    return {
      category: 'compare_links',
      detectedUrls: urlsInText,
      primaryUrl: urlsInText[0],
      plannedStages: [
        {
          type: 'opening_url',
          title: 'Analyzing provided URLs',
          detail: `Preparing to compare sources (${d1} and ${d2})...`,
        },
        {
          type: 'evaluating_sources',
          title: `Retrieving first source (${d1})`,
          detail: 'Extracting key arguments, statements, and evidence...',
        },
        {
          type: 'comparing_sources',
          title: `Retrieving second source (${d2})`,
          detail: 'Comparing claims, differences, and complementary details...',
        },
        {
          type: 'generating_answer',
          title: 'Synthesizing cross-source analysis',
          detail: 'Formulating comparative breakdown with grounded citations...',
        },
      ],
    };
  }

  // 3. Single Link Analysis Context
  if (primaryUrl || researchMode === 'open_link') {
    let domain = 'website';
    if (primaryUrl) {
      try { domain = new URL(primaryUrl).hostname.replace(/^www\./, ''); } catch {}
    }

    return {
      category: 'analyze_url',
      detectedUrls: urlsInText,
      primaryUrl,
      plannedStages: [
        {
          type: 'opening_url',
          title: `Opening ${domain}`,
          detail: 'Verifying destination security and retrieving content...',
        },
        {
          type: 'extracting_content',
          title: 'Extracting readable content',
          detail: 'Stripping layout boilerplate and formatting readable markdown...',
        },
        {
          type: 'evaluating_sources',
          title: 'Reviewing verified source content',
          detail: 'Checking factual claims before answering...',
        },
        {
          type: 'generating_answer',
          title: 'Generating grounded response',
          detail: 'Drafting answer referencing verified page content...',
        },
      ],
    };
  }

  // 4. Deep Research Context
  if (researchMode === 'deep_research') {
    return {
      category: 'deep_research',
      detectedUrls: urlsInText,
      plannedStages: [
        {
          type: 'searching_web',
          title: 'Starting deep research investigation',
          detail: `Round 1: Executing comprehensive primary web search for "${cleanPrompt.substring(0, 50)}"...`,
        },
        {
          type: 'evaluating_sources',
          title: 'Inspecting top authoritative sources',
          detail: 'Retrieving and extracting deep evidence from verified documents...',
        },
        {
          type: 'deep_research_round',
          title: 'Investigating technical sub-queries',
          detail: 'Round 2: Expanding evidence and cross-checking facts across providers...',
        },
        {
          type: 'generating_answer',
          title: 'Synthesizing structured research report',
          detail: 'Formatting comprehensive evidence with working source citations...',
        },
      ],
    };
  }

  // 5. Standard Web Search Context (Explicit toggle or Automatic Search Intent)
  const isSearchIntent =
    researchMode === 'web_search' ||
    (/\b(search web|search online|search for|google|browse|lookup|find online|web search)\b/i.test(lower)) ||
    (/\b(latest|recent|recently|news|today|yesterday|this week|this month|this year|2025|2026)\b/i.test(lower) &&
      !lower.includes('code') && !lower.includes('function') && !lower.includes('bug')) ||
    (/\b(who is currently|current price|weather in|who won|score of|release date of)\b/i.test(lower));

  if (isSearchIntent) {
    return {
      category: 'web_search',
      detectedUrls: urlsInText,
      plannedStages: [
        {
          type: 'searching_web',
          title: 'Searching live web sources',
          detail: `Querying authoritative sources for "${cleanPrompt.substring(0, 50)}"...`,
        },
        {
          type: 'evaluating_sources',
          title: 'Evaluating retrieved sources',
          detail: 'Extracting relevant snippets and verifying provenance...',
        },
        {
          type: 'generating_answer',
          title: 'Drafting response with source citations',
          detail: 'Synthesizing verified findings with [1], [2] source cards...',
        },
      ],
    };
  }

  // 6. Code Generation / Architecture / Bug Fix Context
  const isCodingIntent =
    lower.includes('code') ||
    lower.includes('function') ||
    lower.includes('component') ||
    lower.includes('api') ||
    lower.includes('implement') ||
    lower.includes('typescript') ||
    lower.includes('javascript') ||
    lower.includes('python') ||
    lower.includes('sql') ||
    lower.includes('fix') ||
    lower.includes('refactor');

  if (isCodingIntent) {
    return {
      category: 'code_generation',
      detectedUrls: urlsInText,
      plannedStages: [
        {
          type: 'understanding_request',
          title: 'Analyzing technical requirements',
          detail: 'Evaluating interface constraints, types, and logic...',
        },
        {
          type: 'preparing_operation',
          title: 'Formulating implementation architecture',
          detail: 'Designing modular, error-resilient code structure...',
        },
        {
          type: 'generating_answer',
          title: 'Generating production-ready solution',
          detail: 'Writing clean code with syntax highlighting and explanation...',
        },
      ],
    };
  }

  // 7. General Knowledge / Chat Context
  return {
    category: 'general',
    detectedUrls: urlsInText,
    plannedStages: [
      {
        type: 'understanding_request',
        title: 'Analyzing your question',
        detail: 'Evaluating context, requirements, and reference knowledge...',
      },
      {
        type: 'generating_answer',
        title: 'Formulating comprehensive answer',
        detail: 'Generating complete response...',
      },
    ],
  };
}

/**
 * Creates an Activity Tracker instance that emits validated, sanitized SSE activity events.
 */
export function createActivityTracker(sendSseEvent: (event: StudioActivityEvent) => void) {
  const activities: StudioActivityEvent[] = [];
  let currentActiveId: string | null = null;

  function emitEvent(
    type: StudioActivityEvent['type'],
    stage: StudioActivityEvent['stage'],
    title: string,
    detail?: string,
    targetUrl?: string
  ): StudioActivityEvent {
    const id = 'act_' + crypto.randomBytes(6).toString('hex');
    const event: StudioActivityEvent = {
      id,
      type,
      stage,
      title: redactSensitiveActivityData(title),
      detail: detail ? redactSensitiveActivityData(detail) : undefined,
      targetUrl: targetUrl ? redactSensitiveActivityData(targetUrl) : undefined,
      timestamp: new Date().toISOString(),
    };

    if (stage === 'active') {
      // Mark previous active event as completed
      if (currentActiveId) {
        const prev = activities.find((a) => a.id === currentActiveId);
        if (prev && prev.stage === 'active') {
          prev.stage = 'completed';
        }
      }
      currentActiveId = id;
    } else if (stage === 'completed' || stage === 'failed' || stage === 'cancelled') {
      if (currentActiveId === id) {
        currentActiveId = null;
      }
    }

    activities.push(event);
    sendSseEvent(event);
    return event;
  }

  return {
    startStep: (
      type: StudioActivityEvent['type'],
      title: string,
      detail?: string,
      targetUrl?: string
    ) => emitEvent(type, 'active', title, detail, targetUrl),

    completeCurrentStep: (title?: string, detail?: string) => {
      if (currentActiveId) {
        const active = activities.find((a) => a.id === currentActiveId);
        if (active) {
          active.stage = 'completed';
          if (title) active.title = redactSensitiveActivityData(title);
          if (detail) active.detail = redactSensitiveActivityData(detail);
          sendSseEvent(active);
          currentActiveId = null;
          return active;
        }
      }
      return null;
    },

    requireApprovalStep: (
      title: string,
      detail: string,
      targetUrl?: string
    ) => emitEvent('waiting_approval', 'waiting_approval', title, detail, targetUrl),

    failCurrentStep: (errorMessage: string) => {
      if (currentActiveId) {
        const active = activities.find((a) => a.id === currentActiveId);
        if (active) {
          active.stage = 'failed';
          active.detail = redactSensitiveActivityData(errorMessage);
          sendSseEvent(active);
          currentActiveId = null;
          return active;
        }
      }
      return emitEvent('failed', 'failed', 'Operation encountered an issue', errorMessage);
    },

    completeAll: (summary = 'Response complete') => {
      if (currentActiveId) {
        const active = activities.find((a) => a.id === currentActiveId);
        if (active) active.stage = 'completed';
      }
      return emitEvent('completed', 'completed', summary);
    },

    getActivities: () => [...activities],
    getCurrentActivity: () => activities.find((a) => a.id === currentActiveId) || null,
  };
}
