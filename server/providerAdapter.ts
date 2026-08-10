import { mapToUpstreamModel } from './gateway';

export interface VendorProviderRecord {
  id: string;
  name: string;
  providerType: string;
  protocol: string;
  baseUrl: string;
  masterApiKeyEncrypted: string;
  modelMappingsJson?: string | null;
  headersJson?: string | null;
  isPrimary: boolean;
}

export interface PreparedProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: any;
  targetModel: string;
}

export interface NormalizedProviderResponse {
  ok: boolean;
  statusCode: number;
  data?: any;
  error?: { type: string; message: string };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    isEstimated: boolean;
    usageSource: 'PROVIDER_REPORTED' | 'LOCAL_CALCULATED' | 'SIMULATED_ESTIMATE';
  };
}

/**
 * Resolves internal model ID to vendor-specific model ID using DB model mappings or default fallbacks.
 */
export function resolveVendorModel(vendor: VendorProviderRecord | null, internalModel: string): string {
  if (vendor?.modelMappingsJson) {
    try {
      const mappings: Record<string, string> = JSON.parse(vendor.modelMappingsJson);
      if (mappings[internalModel]) {
        return mappings[internalModel];
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return mapToUpstreamModel(internalModel, vendor?.protocol || 'anthropic');
}

/**
 * Dynamically constructs request payload, headers, and target URL based on vendor configuration.
 */
export function buildProviderRequest(
  vendor: VendorProviderRecord | null,
  decryptedMasterKey: string,
  internalModel: string,
  payload: {
    messages?: any[];
    max_tokens?: number;
    stream?: boolean;
    system?: string;
    tools?: any[];
    tool_choice?: any;
    temperature?: number;
    top_p?: number;
    stop_sequences?: string[];
    metadata?: any;
  }
): PreparedProviderRequest {
  const protocol = vendor?.protocol || 'anthropic';
  const baseUrl = (vendor?.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
  const targetModel = resolveVendorModel(vendor, internalModel);

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  // Merge custom headers if configured
  if (vendor?.headersJson) {
    try {
      const customHeaders: Record<string, string> = JSON.parse(vendor.headersJson);
      Object.assign(headers, customHeaders);
    } catch {
      // Ignore invalid headers JSON
    }
  }

  if (protocol === 'openai-compatible' || protocol === 'openai') {
    headers['authorization'] = `Bearer ${decryptedMasterKey}`;
    const targetUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

    // Convert Anthropic messages to OpenAI format if needed
    const openAiMessages: any[] = [];
    if (payload.system) {
      openAiMessages.push({ role: 'system', content: payload.system });
    }
    if (Array.isArray(payload.messages)) {
      openAiMessages.push(...payload.messages);
    }

    return {
      url: targetUrl,
      headers,
      targetModel,
      body: {
        model: targetModel,
        messages: openAiMessages,
        max_tokens: payload.max_tokens,
        stream: payload.stream,
        temperature: payload.temperature,
        top_p: payload.top_p,
      },
    };
  }

  // Default: Anthropic Protocol
  headers['x-api-key'] = decryptedMasterKey;
  headers['anthropic-version'] = '2023-06-01';
  const targetUrl = baseUrl.endsWith('/v1/messages') ? baseUrl : `${baseUrl}/v1/messages`;

  return {
    url: targetUrl,
    headers,
    targetModel,
    body: {
      model: targetModel,
      messages: payload.messages || [],
      max_tokens: payload.max_tokens,
      stream: payload.stream,
      system: payload.system,
      tools: payload.tools,
      tool_choice: payload.tool_choice,
      temperature: payload.temperature,
      top_p: payload.top_p,
      stop_sequences: payload.stop_sequences,
      metadata: payload.metadata,
    },
  };
}

/**
 * Normalizes vendor response & token accounting metrics across Anthropic, OpenAI, or custom APIs.
 */
export function normalizeProviderResponse(
  protocol: string,
  statusCode: number,
  responseJson: any,
  fallbackInputTokens: number,
  fallbackOutputTokens: number
): NormalizedProviderResponse {
  if (statusCode < 200 || statusCode >= 300) {
    const errorMsg =
      responseJson?.error?.message ||
      responseJson?.message ||
      `Upstream vendor returned HTTP ${statusCode}`;
    return {
      ok: false,
      statusCode,
      error: { type: responseJson?.error?.type || 'vendor_error', message: errorMsg },
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        isEstimated: true,
        usageSource: 'LOCAL_CALCULATED',
      },
    };
  }

  // 1. Anthropic Response Format
  if (responseJson?.usage && typeof responseJson.usage.input_tokens === 'number') {
    const inputTokens = responseJson.usage.input_tokens || fallbackInputTokens;
    const outputTokens = responseJson.usage.output_tokens || fallbackOutputTokens;
    return {
      ok: true,
      statusCode,
      data: responseJson,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        isEstimated: false,
        usageSource: 'PROVIDER_REPORTED',
      },
    };
  }

  // 2. OpenAI Response Format
  if (responseJson?.usage && typeof responseJson.usage.prompt_tokens === 'number') {
    const inputTokens = responseJson.usage.prompt_tokens || fallbackInputTokens;
    const outputTokens = responseJson.usage.completion_tokens || fallbackOutputTokens;
    return {
      ok: true,
      statusCode,
      data: responseJson,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: responseJson.usage.total_tokens || inputTokens + outputTokens,
        isEstimated: false,
        usageSource: 'PROVIDER_REPORTED',
      },
    };
  }

  // 3. Fallback: Calculated token length
  const inputTokens = fallbackInputTokens || 1;
  const outputTokens = fallbackOutputTokens || 1;
  return {
    ok: true,
    statusCode,
    data: responseJson,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      isEstimated: true,
      usageSource: 'LOCAL_CALCULATED',
    },
  };
}
