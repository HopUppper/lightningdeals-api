import { sanitizeErrorMessage } from './providers/responseSanitizer';

export interface CustomerSafeError {
  type: string;
  message: string;
  code: string;
  param?: string | null;
  action?: 'retry' | 'switch_key' | 'switch_model' | 'recharge' | 'view_plans' | 'contact_support';
  actionLabel?: string;
  actionUrl?: string;
  retryAfterSec?: number;
}

export interface NormalizedErrorResponse {
  statusCode: number;
  error: CustomerSafeError;
}

export interface FriendlyErrorInfo {
  statusCode: number;
  category:
    | 'window_limit'
    | 'credit_depleted'
    | 'token_pack_depleted'
    | 'model_not_allowed'
    | 'invalid_key'
    | 'key_suspended'
    | 'rpm_limit'
    | 'invalid_request'
    | 'cluster_busy'
    | 'general_error';
  simpleTitle: string;
  simpleReason: string;
  simpleExplanation: string;
  solutionSteps: string[];
  actionLabel?: string;
  actionUrl?: string;
  actionType?: 'navigate' | 'external';
}

export interface FriendlyErrorInput {
  statusCode: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  model?: string | null;
  billingPlanType?: string | null;
}

/**
 * Sanitizes any text to strictly ensure no vendor names or internal endpoints leak.
 */
export function cleanText(text: string): string {
  if (!text) return '';
  let cleaned = sanitizeErrorMessage(text);
  // Extra layer of defence against vendor leaks
  cleaned = cleaned
    .replace(/scalemax(?:\.pro)?/gi, 'LightningAPI')
    .replace(/opusmax(?:\.pro)?/gi, 'LightningAPI')
    .replace(/lotusai(?:\.pro)?/gi, 'LightningAPI')
    .replace(/minimax(?:-abab)?/gi, 'Anthropic')
    .replace(/api\.scalemax\.pro/gi, 'api.lightningapi.pro')
    .replace(/api\.opusmax\.pro/gi, 'api.lightningapi.pro')
    .replace(/api\.lotusai\.pro/gi, 'api.lightningapi.pro');
  return cleaned;
}

/**
 * Analyzes request failure telemetry and returns a clear, non-technical explanation
 * and verified step-by-step resolution without exposing vendor names.
 */
export function computeFriendlyError(input: FriendlyErrorInput): FriendlyErrorInfo {
  const statusCode = input.statusCode || 500;
  const rawCode = (input.errorCode || '').trim().toLowerCase();
  const rawMsg = cleanText(input.errorMessage || '');
  const model = input.model || 'the requested model';
  const planType = (input.billingPlanType || '').toLowerCase();

  // 1. Model permission or tier mismatch (403)
  if (
    statusCode === 403 &&
    (rawCode.includes('model') ||
      rawCode.includes('family') ||
      rawMsg.includes('not permitted') ||
      rawMsg.includes('not authorized') ||
      rawMsg.includes('family'))
  ) {
    return {
      statusCode: 403,
      category: 'model_not_allowed',
      simpleTitle: 'Model Not Included in Current Plan',
      simpleReason: `The model '${model}' is not included in this API key's provisioned plan.`,
      simpleExplanation: `Your key is set up for specific model families (such as Claude Frontier or Open-Weights). You requested '${model}', which belongs to a different model tier.`,
      solutionSteps: [
        `In your code or AI editor (Cursor, Claude Code, Cline), switch the model setting to one included in your plan (e.g. Claude Sonnet 5.5, Claude Opus 5.5, Gemini 2.5 Pro, or GPT-4o).`,
        `Check the 'Supported Models' list in your dashboard or key status checker to see all models supported by this key.`,
        `To access all models with a single key, upgrade to an All-Model Universal plan or Credit Wallet.`,
      ],
      actionLabel: 'View Supported Models',
      actionUrl: '/models',
      actionType: 'navigate',
    };
  }

  // 2. Key paused or suspended (403)
  if (
    statusCode === 403 &&
    (rawCode.includes('suspended') ||
      rawCode.includes('paused') ||
      rawCode.includes('status') ||
      rawMsg.includes('status is') ||
      rawMsg.includes('suspended') ||
      rawMsg.includes('inactive'))
  ) {
    return {
      statusCode: 403,
      category: 'key_suspended',
      simpleTitle: 'API Key Paused or Inactive',
      simpleReason: 'This API key is currently paused or inactive.',
      simpleExplanation: 'Requests cannot be completed while the API key is paused. This can happen if the key was manually paused or if your plan status changed.',
      solutionSteps: [
        'Open your Customer Dashboard and navigate to API Keys.',
        'Locate this key in the list and toggle its status back to "Active".',
        'If your subscription has paused, check your billing status under Active Plans.',
      ],
      actionLabel: 'Manage API Keys',
      actionUrl: '/dashboard/keys',
      actionType: 'navigate',
    };
  }

  // 3. 5-Hour rolling window quota exhausted (429)
  const isRollingLimit =
    planType === 'window' ||
    rawCode === 'window_quota_exhausted' ||
    rawMsg.includes('5-hour') ||
    rawMsg.includes('rolling window') ||
    rawMsg.includes('allowance exhausted') ||
    (statusCode === 429 && !rawCode.includes('rpm') && !rawMsg.includes('per minute') && planType !== 'token');

  if (isRollingLimit && (statusCode === 429 || rawMsg.includes('rolling window'))) {
    return {
      statusCode: 429,
      category: 'window_limit',
      simpleTitle: '5-Hour Rolling Allowance Reached',
      simpleReason: 'You have used your token allowance for the current 5-hour rolling window.',
      simpleExplanation: 'Under your rolling plan, tokens regenerate continuously over every 5-hour window. Your key is temporarily waiting for older requests to cycle out.',
      solutionSteps: [
        'Automatic Regeneration: Your token quota gradually restores continuously as previous usage rolls past the 5-hour mark.',
        'Instant Workaround: Need to keep coding right away without waiting? Deposit Pay-As-You-Go Credits or a Token Pack from the Plans page.',
        'Deposit credits never expire and activate automatically on your key when your rolling quota is exhausted.',
      ],
      actionLabel: 'Add Top-Up Credits',
      actionUrl: '/pricing',
      actionType: 'navigate',
    };
  }

  // 4. Token pack exhausted (429)
  if (
    planType === 'token' &&
    (statusCode === 429 || rawMsg.includes('token pack') || rawCode.includes('quota'))
  ) {
    return {
      statusCode: 429,
      category: 'token_pack_depleted',
      simpleTitle: 'Prepaid Token Pack Depleted',
      simpleReason: 'All tokens in your purchased token pack have been used.',
      simpleExplanation: 'Your consumable token quota has reached zero. New requests are paused until a new token pack is added.',
      solutionSteps: [
        'Order a new consumable Token Pack (10M, 50M, or 100M tokens) from the Plans page.',
        'If you already purchased a new pack, check My Keys in your dashboard to make sure you are using the active key linked to your new order.',
      ],
      actionLabel: 'Get New Token Pack',
      actionUrl: '/pricing',
      actionType: 'navigate',
    };
  }

  // 5. Credit wallet balance depleted (402)
  if (
    statusCode === 402 ||
    rawCode.includes('credit') ||
    rawMsg.includes('credit balance') ||
    rawMsg.includes('recharge') ||
    rawMsg.includes('$0.00')
  ) {
    return {
      statusCode: 402,
      category: 'credit_depleted',
      simpleTitle: 'Credit Balance Depleted ($0.00 Remaining)',
      simpleReason: 'Your API credit balance has reached $0.00.',
      simpleExplanation: 'Your account or key has run out of usage credits. Requests are paused until additional credits are deposited.',
      solutionSteps: [
        'Go to the Plans page and select an API Credit Pack ($5, $15, $35, $75, or $150).',
        'Once deposited, your credit balance activates immediately and your existing API key will resume without any configuration changes in your editor.',
        'API Credits are valid for 365 days and apply across all supported model families.',
      ],
      actionLabel: 'Recharge Credit Balance',
      actionUrl: '/pricing',
      actionType: 'navigate',
    };
  }

  // 6. Invalid, revoked, or expired API key (401)
  if (
    statusCode === 401 ||
    rawCode.includes('authentication') ||
    rawCode.includes('invalid_key') ||
    rawMsg.includes('expired') ||
    rawMsg.includes('revoked') ||
    rawMsg.includes('invalid')
  ) {
    return {
      statusCode: 401,
      category: 'invalid_key',
      simpleTitle: 'API Key Unrecognized or Expired',
      simpleReason: 'The gateway could not authenticate the API key provided in the request.',
      simpleExplanation: 'The API key provided is either mistyped, has expired, or was revoked.',
      solutionSteps: [
        'Open your Customer Dashboard and verify that your API key is listed in "Active" state.',
        'Click the copy button in your dashboard to copy the exact key string, making sure no accidental spaces or quotation marks are included.',
        'Paste the key into your tool settings (e.g. ANTHROPIC_API_KEY or OPENAI_API_KEY).',
        'If your key was revoked or expired, generate a new active key from your dashboard.',
      ],
      actionLabel: 'Check My API Keys',
      actionUrl: '/dashboard/keys',
      actionType: 'navigate',
    };
  }

  // 7. Request rate speed limit (429 RPM)
  if (
    statusCode === 429 &&
    (rawCode.includes('rpm') ||
      rawCode.includes('rate_limit') ||
      rawMsg.includes('per minute') ||
      rawMsg.includes('rpm'))
  ) {
    return {
      statusCode: 429,
      category: 'rpm_limit',
      simpleTitle: 'Request Speed Limit Reached (RPM)',
      simpleReason: 'Too many requests were sent within a single minute.',
      simpleExplanation: 'To maintain gateway stability and low latency, each key has a per-minute rate limit (typically 60 RPM). Your client sent requests faster than this threshold.',
      solutionSteps: [
        'Add a brief retry delay or backoff (e.g. 1 to 2 seconds) between calls in your automated tool or script.',
        'Reduce the number of parallel requests if running multiple concurrent agent threads.',
        'Wait 30–60 seconds and your rate limit counter will automatically reset.',
        'Need higher enterprise throughput? Contact our support team for an increased RPM limit.',
      ],
      actionLabel: 'Contact Support',
      actionUrl: 'mailto:support@lightningapi.pro',
      actionType: 'external',
    };
  }

  // 8. Malformed or invalid request payload (400)
  if (
    statusCode === 400 ||
    rawCode.includes('invalid_request') ||
    rawMsg.includes('messages') ||
    rawMsg.includes('signature')
  ) {
    return {
      statusCode: 400,
      category: 'invalid_request',
      simpleTitle: 'Invalid Request Format',
      simpleReason: 'The parameters sent by your client could not be processed by the API.',
      simpleExplanation: 'The request body was missing required parameters or contained unsupported fields.',
      solutionSteps: [
        'Verify that your request contains a valid "model" parameter and a non-empty "messages" list.',
        'If uploading images, ensure the file is under 20MB and uses standard base64 encoding (JPEG, PNG, WEBP, or GIF).',
        'Refer to our interactive Documentation for verified curl, Python, and TypeScript code examples.',
      ],
      actionLabel: 'View Documentation',
      actionUrl: '/docs',
      actionType: 'navigate',
    };
  }

  // 9. Temporary cluster congestion or network timeout (500, 502, 503, 504)
  if (statusCode >= 500) {
    return {
      statusCode,
      category: 'cluster_busy',
      simpleTitle: 'Temporary AI Cluster Congestion',
      simpleReason: 'The model cluster experienced a momentary surge in traffic or a brief network timeout.',
      simpleExplanation: 'A brief connection issue occurred between the gateway and the intelligence cluster. No tokens or credits were charged for this attempt.',
      solutionSteps: [
        'Retry your request after 3 to 5 seconds. The gateway automatically reroutes to healthy nodes in the cluster.',
        'If the selected model is experiencing high demand, switch to an alternative high-performance model (e.g. Claude Sonnet 5.5 or Gemini 2.5 Pro).',
        'Check the live System Status page to verify operational cluster health.',
      ],
      actionLabel: 'View System Status',
      actionUrl: '/key-status',
      actionType: 'navigate',
    };
  }

  // 10. General fallback
  return {
    statusCode,
    category: 'general_error',
    simpleTitle: `Request Processing Issue (${statusCode})`,
    simpleReason: rawMsg || `The request encountered an issue (HTTP ${statusCode}).`,
    simpleExplanation: 'An unexpected issue occurred while processing this API call.',
    solutionSteps: [
      'Confirm your API key is in "Active" state with available tokens or credit balance in your Customer Dashboard.',
      'Retry your request after a brief moment.',
      'If the issue persists, reach out to LightningAPI support with your request details for immediate assistance.',
    ],
    actionLabel: 'Open Dashboard',
    actionUrl: '/dashboard',
    actionType: 'navigate',
  };
}

/**
 * Computes a friendly resolution for an entire key based on its top-level health attributes.
 */
export function computeKeyResolution(keyData: {
  status: string;
  isExpired?: boolean;
  isExhausted?: boolean;
  billingType?: string;
  plan?: string;
  creditBalanceUsd?: number;
  tokensRemaining?: string | number;
  nextResetAt?: string | null;
}): FriendlyErrorInfo | null {
  const { status, isExpired, isExhausted, billingType, creditBalanceUsd } = keyData;

  if (status !== 'active') {
    return {
      statusCode: 403,
      category: 'key_suspended',
      simpleTitle: `Key Status: ${status.toUpperCase()}`,
      simpleReason: `This API key is currently marked as "${status}".`,
      simpleExplanation: 'Requests using this key cannot be completed until the key is returned to Active status.',
      solutionSteps: [
        'Visit your Customer Dashboard -> API Keys.',
        'Toggle the key to "Active" if it was paused.',
        'If suspended, verify your active plan subscription.',
      ],
      actionLabel: 'Manage API Keys',
      actionUrl: '/dashboard/keys',
      actionType: 'navigate',
    };
  }

  if (isExpired) {
    return {
      statusCode: 401,
      category: 'invalid_key',
      simpleTitle: 'API Key Expired',
      simpleReason: 'The validity period for this API key has ended.',
      simpleExplanation: 'This key has reached its expiration date and can no longer accept requests.',
      solutionSteps: [
        'Renew your plan or order a new package from the Plans page.',
        'A fresh active API key will be provisioned in your dashboard upon order confirmation.',
      ],
      actionLabel: 'View Plans',
      actionUrl: '/pricing',
      actionType: 'navigate',
    };
  }

  if (isExhausted) {
    if (billingType === 'credit' || (creditBalanceUsd !== undefined && creditBalanceUsd <= 0)) {
      return {
        statusCode: 402,
        category: 'credit_depleted',
        simpleTitle: 'Credit Balance Depleted ($0.00)',
        simpleReason: 'Your prepaid credit balance is fully utilized.',
        simpleExplanation: 'Your credit wallet has reached $0.00. Top up credits to continue processing requests.',
        solutionSteps: [
          'Choose an API Credit Pack from the Plans page.',
          'Your existing API key will immediately resume without updating any code or editor settings.',
          'Credits never expire and remain active across all models.',
        ],
        actionLabel: 'Recharge Credit Balance',
        actionUrl: '/pricing',
        actionType: 'navigate',
      };
    } else if (billingType === 'token') {
      return {
        statusCode: 429,
        category: 'token_pack_depleted',
        simpleTitle: 'Token Pack Fully Consumed',
        simpleReason: 'All tokens allocated in your token pack have been used.',
        simpleExplanation: 'Your consumable token quota has reached zero.',
        solutionSteps: [
          'Order a new Token Pack from the Plans page.',
          'Once confirmed, your token allowance will be replenished.',
        ],
        actionLabel: 'Top Up Tokens',
        actionUrl: '/pricing',
        actionType: 'navigate',
      };
    } else {
      return {
        statusCode: 429,
        category: 'window_limit',
        simpleTitle: '5-Hour Rolling Allowance Reached',
        simpleReason: 'Your 5-hour rolling token allowance is currently fully used.',
        simpleExplanation: 'Under your rolling plan, tokens automatically regenerate continuously. Your key will restore allowance as older requests roll past 5 hours.',
        solutionSteps: [
          'Your token allowance continuously replenishes every minute as past usage exceeds the 5-hour window.',
          'To code immediately without waiting for window resets, top up with Pay-As-You-Go Credits from the Plans page.',
          'Deposit credits never expire and activate automatically on your key when your rolling quota is exhausted.',
        ],
        actionLabel: 'Add Top-Up Credits',
        actionUrl: '/pricing',
        actionType: 'navigate',
      };
    }
  }

  return null;
}

/**
 * Central Error Normalization Engine
 *
 * Enforces strict supplier isolation and deterministic customer-facing error schemas.
 * Guarantees that:
 * 1. Supplier hostnames (scalemax.pro, opusmax.pro, lotusai.pro), internal paths,
 *    and HTML error bodies are completely stripped.
 * 2. Unwhitelisted fields (provider, upstream, url, host, stack, headers, etc.) are discarded.
 * 3. Context-aware actions are provided (e.g. 502/503/504 recommends retry with backoff, NEVER switch_key).
 */
export function normalizeErrorResponse(
  rawStatus: number | string | undefined,
  rawError: any,
  context?: {
    model?: string;
    billingPlanType?: string;
    retryAfterSec?: number;
  }
): NormalizedErrorResponse {
  let statusCode = Number(rawStatus) || Number(rawError?.status) || Number(rawError?.statusCode) || 500;
  if (isNaN(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  // Extract raw error message and code safely
  let rawMsg = '';
  if (typeof rawError === 'string') {
    rawMsg = rawError;
  } else if (rawError && typeof rawError === 'object') {
    rawMsg = rawError.error?.message || rawError.message || (typeof rawError.error === 'string' ? rawError.error : '') || '';
  }

  const rawCode = String(rawError?.error?.code || rawError?.code || '').trim().toLowerCase();
  const safeMsg = cleanText(rawMsg);
  const planType = (context?.billingPlanType || '').toLowerCase();
  const modelName = context?.model || 'the requested model';

  // 1. Upstream Outages / Bad Gateways / Timeouts (502, 503, 504)
  if (statusCode === 502 || statusCode === 504 || statusCode === 503 || (statusCode === 500 && (safeMsg.includes('gateway') || safeMsg.includes('econn') || safeMsg.includes('fetch') || safeMsg.includes('timeout')))) {
    const isTimeout = statusCode === 504 || /timeout|timed out|deadline/i.test(safeMsg);
    const isBusy = statusCode === 503 || /busy|overloaded|capacity/i.test(safeMsg);

    if (isTimeout) {
      return {
        statusCode: 504,
        error: {
          type: 'timeout_error',
          code: 'GATEWAY_TIMEOUT',
          message: 'The AI model took too long to complete the request. Please retry in a moment.',
          action: 'retry',
          actionLabel: 'Retry Request',
          retryAfterSec: context?.retryAfterSec || 3,
        },
      };
    }

    if (isBusy) {
      return {
        statusCode: 503,
        error: {
          type: 'service_unavailable',
          code: 'CAPACITY_BUSY',
          message: 'The requested AI model capacity is currently experiencing high demand. Please retry shortly.',
          action: 'retry',
          actionLabel: 'Retry in 5s',
          retryAfterSec: context?.retryAfterSec || 5,
        },
      };
    }

    return {
      statusCode: 502,
      error: {
        type: 'bad_gateway',
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'Our AI service is temporarily unavailable. Please retry in a moment.',
        action: 'retry',
        actionLabel: 'Retry Request',
        retryAfterSec: context?.retryAfterSec || 2,
      },
    };
  }

  // 2. Authentication Errors (401)
  if (statusCode === 401 || rawCode.includes('invalid_key') || rawCode.includes('auth') || safeMsg.includes('invalid api key')) {
    return {
      statusCode: 401,
      error: {
        type: 'authentication_error',
        code: 'INVALID_API_KEY',
        message: 'The API key provided is invalid, expired, or unrecognized. Please verify your API key in your customer dashboard.',
        action: 'switch_key',
        actionLabel: 'Check My API Keys',
        actionUrl: '/dashboard/keys',
      },
    };
  }

  // 3. Credit Balance Depleted (402)
  if (statusCode === 402 || rawCode.includes('credit_depleted') || safeMsg.includes('credit balance') || safeMsg.includes('$0.00')) {
    return {
      statusCode: 402,
      error: {
        type: 'insufficient_quota',
        code: 'CREDITS_DEPLETED',
        message: 'Your account or API key has run out of usage credits ($0.00 remaining). Please deposit credits to continue processing requests.',
        action: 'recharge',
        actionLabel: 'Recharge Credit Balance',
        actionUrl: '/pricing',
      },
    };
  }

  // 4. Permission / Model Tier / Suspended (403)
  if (statusCode === 403) {
    const isModelMismatch = rawCode.includes('model') || rawCode.includes('family') || safeMsg.includes('not permitted') || safeMsg.includes('tier') || safeMsg.includes('family');
    if (isModelMismatch) {
      return {
        statusCode: 403,
        error: {
          type: 'permission_denied',
          code: 'MODEL_NOT_PERMITTED',
          message: `The model '${modelName}' is not included in this API key's provisioned plan.`,
          action: 'switch_model',
          actionLabel: 'View Supported Models',
          actionUrl: '/models',
        },
      };
    }

    return {
      statusCode: 403,
      error: {
        type: 'permission_denied',
        code: 'KEY_SUSPENDED',
        message: 'This API key is currently paused or inactive. Please reactivate it from your customer dashboard.',
        action: 'switch_key',
        actionLabel: 'Manage API Keys',
        actionUrl: '/dashboard/keys',
      },
    };
  }

  // 5. Rate Limits & Quota Exhaustion (429)
  if (statusCode === 429) {
    const isRpm = rawCode.includes('rpm') || safeMsg.includes('per minute') || safeMsg.includes('speed limit');
    if (isRpm) {
      return {
        statusCode: 429,
        error: {
          type: 'rate_limit_error',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Request rate limit reached (RPM). Please wait a few seconds before retrying.',
          action: 'retry',
          actionLabel: 'Retry in 5s',
          retryAfterSec: context?.retryAfterSec || 5,
        },
      };
    }

    if (planType === 'token' || rawCode.includes('token_pack') || safeMsg.includes('token pack')) {
      return {
        statusCode: 429,
        error: {
          type: 'rate_limit_error',
          code: 'TOKEN_PACK_DEPLETED',
          message: 'All tokens in your purchased token pack have been used. Top up a new token pack to resume requests.',
          action: 'view_plans',
          actionLabel: 'Get New Token Pack',
          actionUrl: '/pricing',
        },
      };
    }

    return {
      statusCode: 429,
      error: {
        type: 'rate_limit_error',
        code: 'WINDOW_LIMIT_REACHED',
        message: 'You have reached your 5-hour rolling allowance for this model tier. Your quota continuously regenerates as older requests roll past 5 hours.',
        action: 'view_plans',
        actionLabel: 'Add Top-Up Credits',
        actionUrl: '/pricing',
      },
    };
  }

  // 6. Invalid Request (400)
  if (statusCode === 400) {
    return {
      statusCode: 400,
      error: {
        type: 'invalid_request_error',
        code: 'INVALID_REQUEST',
        message: safeMsg || 'Invalid request format or missing required parameters.',
        action: 'contact_support',
        actionLabel: 'View API Documentation',
        actionUrl: '/docs',
      },
    };
  }

  // 7. Generic Internal Gateway Error (500)
  return {
    statusCode: 500,
    error: {
      type: 'api_error',
      code: 'INTERNAL_GATEWAY_ERROR',
      message: 'The AI gateway encountered an unexpected error processing your request. Please retry in a moment.',
      action: 'retry',
      actionLabel: 'Retry Request',
      retryAfterSec: 3,
    },
  };
}
