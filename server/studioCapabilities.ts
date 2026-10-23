/**
 * server/studioCapabilities.ts
 *
 * Centralized, authoritative capability registry for LightningAPI AI Chat Studio.
 * Separates:
 * 1. Upstream Model Capabilities (context window, vision, reasoning, tool-calling, streaming)
 * 2. Studio Native Capabilities (DOCX, XLSX, PPTX, PDF, CSV, ZIP export, sandboxed preview, deterministic data analysis)
 * 3. External Integrations (Web research, SSRF-guarded URL inspection, browser service)
 * 4. Customer Plan Constraints (Trial vs Paid access, token quotas, upload size limits)
 */

import { isTavilyConfigured } from './tavilySearch';

export interface ModelCapabilityProfile {
  id: string;
  displayName: string;
  provider: 'anthropic' | 'openai' | 'google' | 'deepseek' | 'meta' | 'custom';
  tier: 'trial' | 'paid';
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: {
    textGeneration: boolean;
    reasoning: boolean; // Extended thinking / CoT
    codingAssistance: boolean;
    imageInput: boolean; // Vision
    toolCalling: boolean;
    structuredOutput: boolean;
    streaming: boolean;
    fileInput: boolean;
    webSearch: boolean;
    imageGeneration: boolean;
    videoGeneration: boolean;
  };
}

export interface StudioNativeCapabilities {
  documents: {
    supportedFormats: Array<'docx' | 'xlsx' | 'pptx' | 'pdf' | 'csv' | 'md' | 'txt' | 'html'>;
    maxFileSize: number;
    directDownload: boolean;
    serverSideValidation: boolean;
  };
  codeWorkspace: {
    multiFileZipExport: boolean;
    sandboxedPreviewLanguages: Array<'html' | 'svg' | 'css' | 'xml'>;
    supportedLanguages: string[];
    liveEditing: boolean;
  };
  dataAnalysis: {
    csvAnalysis: boolean;
    excelAnalysis: boolean;
    summaryStatistics: boolean;
    groupingAndAggregation: boolean;
    cleanAndTransform: boolean;
    revisedWorkbookExport: boolean;
    chartGeneration: boolean;
  };
  projects: {
    persistentWorkspaces: boolean;
    projectDirectives: boolean;
    maxProjectsPerUser: number;
    isolatedContext: boolean;
  };
  persistentMemory: {
    enabled: boolean;
    userControllable: boolean;
    disableSupported: boolean;
    sensitiveDataFilter: boolean;
    maxMemoriesPerUser: number;
  };
}

export interface ExternalIntegrations {
  webResearch: {
    enabled: boolean;
    provider: 'tavily' | 'duckduckgo' | 'searxng' | 'hybrid';
    traceableCitations: boolean;
    ssrfGuarded: boolean;
  };
  urlInspection: {
    enabled: boolean;
    maxPayloadBytes: number;
    timeoutMs: number;
  };
  browserPreview: {
    enabled: boolean;
  };
}

export interface CustomerEntitlementLimits {
  userId: string;
  isPaidCustomer: boolean;
  hasActiveKey: boolean;
  tokenAllocationRemaining: number;
  allowedModels: string[];
  maxUploadSizeBytes: number;
  maxFilesPerUpload: number;
  dailyDocumentGenerationsRemaining: number;
  deepResearchAllowed: boolean;
}

export interface EvaluatedStudioCapabilities {
  selectedModel: ModelCapabilityProfile;
  availableModels: Array<{ id: string; displayName: string; tier: 'trial' | 'paid'; available: boolean }>;
  nativeCapabilities: StudioNativeCapabilities;
  externalIntegrations: ExternalIntegrations;
  entitlements: CustomerEntitlementLimits;
  systemNotice?: string;
}

// ---------------------------------------------------------------------------
// Authoritative Model Registry
// ---------------------------------------------------------------------------
export const MODEL_CAPABILITY_REGISTRY: Record<string, ModelCapabilityProfile> = {
  // Claude 3.7 Sonnet (Paid only, Reasoning + Coding flagship)
  'claude-3-7-sonnet': {
    id: 'claude-3-7-sonnet',
    displayName: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    tier: 'paid',
    contextWindow: 200000,
    maxOutputTokens: 64000,
    capabilities: {
      textGeneration: true,
      reasoning: true,
      codingAssistance: true,
      imageInput: true,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // Claude 3.5 Sonnet (Paid only)
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 'paid',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      reasoning: false,
      codingAssistance: true,
      imageInput: true,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // OpenAI o3-mini (Paid only, deep reasoning)
  'o3-mini': {
    id: 'o3-mini',
    displayName: 'OpenAI o3-mini',
    provider: 'openai',
    tier: 'paid',
    contextWindow: 200000,
    maxOutputTokens: 65536,
    capabilities: {
      textGeneration: true,
      reasoning: true,
      codingAssistance: true,
      imageInput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // GPT-4o (Paid only, multimodal)
  'gpt-4o': {
    id: 'gpt-4o',
    displayName: 'GPT-4o Omnimodal',
    provider: 'openai',
    tier: 'paid',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: {
      textGeneration: true,
      reasoning: false,
      codingAssistance: true,
      imageInput: true,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // GPT-4o-mini (Trial & Paid, lightweight fast)
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    tier: 'trial',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: {
      textGeneration: true,
      reasoning: false,
      codingAssistance: true,
      imageInput: true,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // Google Gemini 2.5 Flash (Trial & Paid, 1M context, vision)
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'google',
    tier: 'trial',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      reasoning: true,
      codingAssistance: true,
      imageInput: true,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // Google Gemini 2.5 Pro (Paid only, 2M context)
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'google',
    tier: 'paid',
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      reasoning: true,
      codingAssistance: true,
      imageInput: true,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // DeepSeek R1 (Paid only, open-weights reasoning)
  'deepseek-r1': {
    id: 'deepseek-r1',
    displayName: 'DeepSeek R1',
    provider: 'deepseek',
    tier: 'paid',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      reasoning: true,
      codingAssistance: true,
      imageInput: false,
      toolCalling: false,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
  // DeepSeek V3 (Trial & Paid, coding & chat)
  'deepseek-v3': {
    id: 'deepseek-v3',
    displayName: 'DeepSeek V3',
    provider: 'deepseek',
    tier: 'trial',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      reasoning: false,
      codingAssistance: true,
      imageInput: false,
      toolCalling: true,
      structuredOutput: true,
      streaming: true,
      fileInput: true,
      webSearch: false,
      imageGeneration: false,
      videoGeneration: false,
    },
  },
};

// ---------------------------------------------------------------------------
// Authoritative Studio-Native Capabilities
// ---------------------------------------------------------------------------
export const STUDIO_NATIVE_CAPABILITIES: StudioNativeCapabilities = {
  documents: {
    supportedFormats: ['docx', 'xlsx', 'pptx', 'pdf', 'csv', 'md', 'txt', 'html'],
    maxFileSize: 25 * 1024 * 1024, // 25 MB
    directDownload: true,
    serverSideValidation: true,
  },
  codeWorkspace: {
    multiFileZipExport: true,
    sandboxedPreviewLanguages: ['html', 'svg', 'css', 'xml'],
    supportedLanguages: [
      'typescript', 'javascript', 'python', 'html', 'css', 'json',
      'markdown', 'sql', 'bash', 'yaml', 'rust', 'go', 'xml', 'svg'
    ],
    liveEditing: true,
  },
  dataAnalysis: {
    csvAnalysis: true,
    excelAnalysis: true,
    summaryStatistics: true,
    groupingAndAggregation: true,
    cleanAndTransform: true,
    revisedWorkbookExport: true,
    chartGeneration: true,
  },
  projects: {
    persistentWorkspaces: true,
    projectDirectives: true,
    maxProjectsPerUser: 50,
    isolatedContext: true,
  },
  persistentMemory: {
    enabled: true,
    userControllable: true,
    disableSupported: true,
    sensitiveDataFilter: true,
    maxMemoriesPerUser: 50,
  },
};

// ---------------------------------------------------------------------------
// External Integrations Registry
// ---------------------------------------------------------------------------
export const STUDIO_EXTERNAL_INTEGRATIONS: ExternalIntegrations = {
  webResearch: {
    enabled: true,
    provider: 'hybrid',
    traceableCitations: true,
    ssrfGuarded: true,
  },
  urlInspection: {
    enabled: true,
    maxPayloadBytes: 2 * 1024 * 1024, // 2 MB
    timeoutMs: 10000,
  },
  browserPreview: {
    enabled: true,
  },
};

/**
 * Resolves full capability state for a specific user and requested model.
 */
export function resolveStudioCapabilities(
  user: {
    id: string;
    isPaid?: boolean;
    activeKey?: any;
    tokenBalance?: number;
  },
  requestedModel = 'gemini-2.5-flash'
): EvaluatedStudioCapabilities {
  const isPaid = Boolean(user.isPaid || (user.activeKey && !user.activeKey.isTrial && user.activeKey.status === 'ACTIVE'));
  const normModel = requestedModel.toLowerCase().trim();
  const selectedModel = MODEL_CAPABILITY_REGISTRY[normModel] || MODEL_CAPABILITY_REGISTRY['gemini-2.5-flash'];

  // Evaluate which models are available to this specific user
  const availableModels = Object.values(MODEL_CAPABILITY_REGISTRY).map((m) => ({
    id: m.id,
    displayName: m.displayName,
    tier: m.tier,
    available: m.tier === 'trial' || isPaid,
  }));

  const tokenRemaining = typeof user.tokenBalance === 'number'
    ? user.tokenBalance
    : (user.activeKey?.allocatedTokens || 0) - (user.activeKey?.usedTokens || 0);

  const entitlements: CustomerEntitlementLimits = {
    userId: user.id,
    isPaidCustomer: isPaid,
    hasActiveKey: Boolean(user.activeKey),
    tokenAllocationRemaining: Math.max(0, tokenRemaining),
    allowedModels: availableModels.filter((m) => m.available).map((m) => m.id),
    maxUploadSizeBytes: isPaid ? 25 * 1024 * 1024 : 10 * 1024 * 1024, // 25MB paid vs 10MB trial
    maxFilesPerUpload: isPaid ? 10 : 5,
    dailyDocumentGenerationsRemaining: isPaid ? 100 : 10,
    deepResearchAllowed: isPaid,
  };

  let systemNotice: string | undefined;
  if (!isPaid && selectedModel.tier === 'paid') {
    systemNotice = `Model ${selectedModel.displayName} requires a paid subscription. Please select a trial model or upgrade your plan.`;
  }

  const externalIntegrations: ExternalIntegrations = {
    ...STUDIO_EXTERNAL_INTEGRATIONS,
    webResearch: {
      ...STUDIO_EXTERNAL_INTEGRATIONS.webResearch,
      provider: isTavilyConfigured() ? 'tavily' : 'hybrid',
    },
  };

  return {
    selectedModel,
    availableModels,
    nativeCapabilities: STUDIO_NATIVE_CAPABILITIES,
    externalIntegrations,
    entitlements,
    systemNotice,
  };
}
