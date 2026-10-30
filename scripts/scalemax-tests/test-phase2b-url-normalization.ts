// Phase 2B Offline URL Normalization Verification Suite
// Tests all 6 core URL cases and edge cases with zero network calls and zero DB mutations.

interface TestCase {
  id: string;
  category: string;
  description: string;
  input: {
    protocol: 'openai-compatible' | 'anthropic';
    apiCreditBaseUrl?: string;
    tokenPackBaseUrl?: string;
    baseUrl?: string;
    billingType?: string;
    targetType: 'completion' | 'discovery';
  };
  expected: string;
}

// 1. Adapter URL Resolution Logic (reflecting updated server/providerAdapter.ts)
function resolveScaleMaxAdapterUrl(
  protocol: 'openai-compatible' | 'anthropic',
  apiCreditBaseUrl: string | undefined,
  tokenPackBaseUrl: string | undefined,
  baseUrl: string | undefined,
  billingType?: string
): string {
  let effectiveBaseUrl = (billingType === 'token') ? tokenPackBaseUrl : apiCreditBaseUrl;
  if (!effectiveBaseUrl) {
    effectiveBaseUrl = baseUrl;
  }
  const cleanBase = (effectiveBaseUrl || 'https://api.scalemax.pro/v1').replace(/\/+$/, '');

  if (protocol === 'openai-compatible') {
    return cleanBase.endsWith('/chat/completions')
      ? cleanBase
      : cleanBase.endsWith('/v1')
        ? `${cleanBase}/chat/completions`
        : `${cleanBase}/v1/chat/completions`;
  }

  // Anthropic protocol
  return cleanBase.endsWith('/messages')
    ? cleanBase
    : cleanBase.endsWith('/v1')
      ? `${cleanBase}/messages`
      : `${cleanBase}/v1/messages`;
}

// 2. Discovery URL Resolution Logic (reflecting updated server/providers/OpenAICompatibleAdapter.ts)
function resolveDiscoveryUrl(provider: any, billingType?: string): string {
  let rawBase: string;
  if (billingType === 'token') {
    rawBase = provider?.tokenPackBaseUrl || provider?.baseUrl || 'https://api.openai.com';
  } else if (billingType === 'credit') {
    rawBase = provider?.apiCreditBaseUrl || provider?.baseUrl || 'https://api.openai.com';
  } else {
    rawBase = provider?.apiCreditBaseUrl || provider?.baseUrl || 'https://api.openai.com';
  }
  const cleanBase = String(rawBase).replace(/\/+$/, '');
  return cleanBase.endsWith('/models')
    ? cleanBase
    : cleanBase.endsWith('/v1')
      ? `${cleanBase}/models`
      : `${cleanBase}/v1/models`;
}

// Define the comprehensive test suite
const testCases: TestCase[] = [
  // --- 6 REQUIRED CORE CASES ---
  {
    id: 'CORE-1',
    category: 'Core Requirements',
    description: 'Credit OpenAI-compatible chat completion',
    input: {
      protocol: 'openai-compatible',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
      billingType: 'credit',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/v1/chat/completions',
  },
  {
    id: 'CORE-2',
    category: 'Core Requirements',
    description: 'Token OpenAI-compatible chat completion',
    input: {
      protocol: 'openai-compatible',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
      billingType: 'token',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/token/v1/chat/completions',
  },
  {
    id: 'CORE-3',
    category: 'Core Requirements',
    description: 'Credit Anthropic Messages',
    input: {
      protocol: 'anthropic',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
      billingType: 'credit',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/v1/messages',
  },
  {
    id: 'CORE-4',
    category: 'Core Requirements',
    description: 'Token Anthropic Messages',
    input: {
      protocol: 'anthropic',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
      billingType: 'token',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/token/v1/messages',
  },
  {
    id: 'CORE-5',
    category: 'Core Requirements',
    description: 'Credit model catalogue',
    input: {
      protocol: 'openai-compatible',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
      billingType: 'credit',
      targetType: 'discovery',
    },
    expected: 'https://api.scalemax.pro/v1/models',
  },
  {
    id: 'CORE-6',
    category: 'Core Requirements',
    description: 'Token model catalogue',
    input: {
      protocol: 'openai-compatible',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1',
      billingType: 'token',
      targetType: 'discovery',
    },
    expected: 'https://api.scalemax.pro/token/v1/models',
  },

  // --- EDGE CASES: TRAILING SLASHES ---
  {
    id: 'EDGE-1',
    category: 'Trailing Slashes',
    description: 'Credit OpenAI with trailing slash in base URL',
    input: {
      protocol: 'openai-compatible',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1/',
      billingType: 'credit',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/v1/chat/completions',
  },
  {
    id: 'EDGE-2',
    category: 'Trailing Slashes',
    description: 'Token OpenAI with trailing slash in token base URL',
    input: {
      protocol: 'openai-compatible',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1/',
      billingType: 'token',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/token/v1/chat/completions',
  },
  {
    id: 'EDGE-3',
    category: 'Trailing Slashes',
    description: 'Credit Anthropic Messages with trailing slash in base URL',
    input: {
      protocol: 'anthropic',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1/',
      billingType: 'credit',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/v1/messages',
  },
  {
    id: 'EDGE-4',
    category: 'Trailing Slashes',
    description: 'Token Anthropic Messages with trailing slash in token base URL',
    input: {
      protocol: 'anthropic',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1/',
      billingType: 'token',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/token/v1/messages',
  },
  {
    id: 'EDGE-5',
    category: 'Trailing Slashes',
    description: 'Discovery model URL with trailing slash in token base URL',
    input: {
      protocol: 'openai-compatible',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token/v1/',
      billingType: 'token',
      targetType: 'discovery',
    },
    expected: 'https://api.scalemax.pro/token/v1/models',
  },

  // --- EDGE CASES: ORIGIN WITHOUT /v1 ---
  {
    id: 'EDGE-6',
    category: 'Origin Without /v1',
    description: 'Credit Anthropic Messages when configured with bare origin',
    input: {
      protocol: 'anthropic',
      apiCreditBaseUrl: 'https://api.scalemax.pro',
      billingType: 'credit',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/v1/messages',
  },
  {
    id: 'EDGE-7',
    category: 'Origin Without /v1',
    description: 'Token Anthropic Messages when configured with bare token path',
    input: {
      protocol: 'anthropic',
      tokenPackBaseUrl: 'https://api.scalemax.pro/token',
      billingType: 'token',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/token/v1/messages',
  },

  // --- EDGE CASES: FULL PATHS (IDEMPOTENCY / NO DUPLICATE SUFFIXES) ---
  {
    id: 'EDGE-8',
    category: 'Idempotency',
    description: 'Base URL already containing /chat/completions suffix',
    input: {
      protocol: 'openai-compatible',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1/chat/completions',
      billingType: 'credit',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/v1/chat/completions',
  },
  {
    id: 'EDGE-9',
    category: 'Idempotency',
    description: 'Base URL already containing /messages suffix',
    input: {
      protocol: 'anthropic',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1/messages',
      billingType: 'credit',
      targetType: 'completion',
    },
    expected: 'https://api.scalemax.pro/v1/messages',
  },
  {
    id: 'EDGE-10',
    category: 'Idempotency',
    description: 'Discovery URL already containing /models suffix',
    input: {
      protocol: 'openai-compatible',
      apiCreditBaseUrl: 'https://api.scalemax.pro/v1/models',
      billingType: 'credit',
      targetType: 'discovery',
    },
    expected: 'https://api.scalemax.pro/v1/models',
  },
];

// Run tests
console.log('================================================================');
console.log('⚡ PHASE 2B OFFLINE URL NORMALIZATION VERIFICATION SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  let actual: string;
  if (tc.input.targetType === 'completion') {
    actual = resolveScaleMaxAdapterUrl(
      tc.input.protocol,
      tc.input.apiCreditBaseUrl,
      tc.input.tokenPackBaseUrl,
      tc.input.baseUrl,
      tc.input.billingType
    );
  } else {
    actual = resolveDiscoveryUrl(
      {
        apiCreditBaseUrl: tc.input.apiCreditBaseUrl,
        tokenPackBaseUrl: tc.input.tokenPackBaseUrl,
        baseUrl: tc.input.baseUrl,
      },
      tc.input.billingType
    );
  }

  const passed = actual === tc.expected;
  if (passed) {
    passCount++;
    console.log(`✅ [${tc.id}] ${tc.description}`);
    console.log(`   URL: ${actual}`);
  } else {
    failCount++;
    console.log(`❌ [${tc.id}] ${tc.description}`);
    console.log(`   Expected: ${tc.expected}`);
    console.log(`   Actual  : ${actual}`);
  }
}

console.log('\n================================================================');
console.log(`TOTAL: ${testCases.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
