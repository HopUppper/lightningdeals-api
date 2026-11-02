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
 * Strips any potential vendor names or internal endpoints to protect supplier isolation.
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/scalemax(?:\.pro)?/gi, 'LightningAPI')
    .replace(/opusmax(?:\.pro)?/gi, 'LightningAPI')
    .replace(/lotusai(?:\.pro)?/gi, 'LightningAPI')
    .replace(/minimax(?:-abab)?/gi, 'Anthropic')
    .replace(/api\.scalemax\.pro/gi, 'api.lightningapi.pro')
    .replace(/api\.opusmax\.pro/gi, 'api.lightningapi.pro')
    .replace(/claude-3(?:-5|-7)?-(?:sonnet|opus|haiku)/gi, 'Claude Sonnet 5.5');
}

/**
 * Client-side resolution helper matching backend deterministic error categorization.
 */
export function getFriendlyError(input: FriendlyErrorInput): FriendlyErrorInfo {
  const statusCode = input.statusCode || 500;
  const rawCode = (input.errorCode || '').trim().toLowerCase();
  const rawMsg = sanitizeText(input.errorMessage || '');
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
