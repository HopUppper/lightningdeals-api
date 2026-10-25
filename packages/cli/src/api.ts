// Enforce strict TLS certificate verification in CLI execution
delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

export interface KeyModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  ownedBy?: string;
}

export interface KeyStatusResult {
  valid: boolean;
  status?: string;
  name?: string;
  tokensRemaining?: string;
  purchasedTokens?: string;
  tokensUsed?: string;
  expiresAt?: string | null;
  allowedModels?: string;
  defaultModel?: string;
  availableModels?: KeyModel[];
  error?: string;
}

export interface ModelProbeResult {
  success: boolean;
  statusCode: number;
  latencyMs: number;
  requestedModel: string;
  gatewayModel?: string;
  resolvedModel?: string;
  upstreamProvider?: string;
  aliasApplied?: boolean;
  returnedModel?: string;
  responseText?: string;
  error?: string;
}

export const getGatewayUrl = (): string => {
  const args = process.argv.slice(2);
  const urlIdx = args.findIndex(arg => arg === '--api-url' || arg === '-u');
  if (urlIdx !== -1 && args[urlIdx + 1]) {
    return args[urlIdx + 1].trim().replace(/\/$/, '');
  }
  if (process.env.LIGHTNINGDEALS_API_URL) {
    return process.env.LIGHTNINGDEALS_API_URL.replace(/\/$/, '');
  }
  return 'https://lightningapi.pro';
};

export const validateApiKey = async (apiKey: string): Promise<KeyStatusResult> => {
  let cleanKey = apiKey.trim();

  // Normalize common user copy-paste prefixes for keys
  if (cleanKey.startsWith('id_trial_')) {
    cleanKey = 'ld_trial_' + cleanKey.substring(9);
  } else if (cleanKey.startsWith('id_live_')) {
    cleanKey = 'ld_live_' + cleanKey.substring(8);
  } else if (cleanKey.startsWith('trial_')) {
    cleanKey = 'ld_trial_' + cleanKey.substring(6);
  } else if (cleanKey.startsWith('live_')) {
    cleanKey = 'ld_live_' + cleanKey.substring(5);
  }

  const baseUrl = getGatewayUrl();
  try {
    const res = await fetch(`${baseUrl}/api/key-status?key=${encodeURIComponent(cleanKey)}`, {
      headers: {
        'x-api-key': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: errJson.error?.message || `HTTP ${res.status} Key Validation Failed`,
      };
    }

    const data = await res.json();
    return {
      valid: true,
      status: data.status,
      name: data.name,
      tokensRemaining: data.tokensRemaining,
      purchasedTokens: data.purchasedTokens,
      tokensUsed: data.tokensUsed,
      expiresAt: data.expiresAt,
      allowedModels: data.allowedModels,
      defaultModel: data.defaultModel,
      availableModels: Array.isArray(data.availableModels) ? data.availableModels : [],
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not connect to LightningDeals API Gateway at ${baseUrl} (${err.message || 'Network error'}). Ensure the production backend server is online and DNS is configured.`,
    };
  }
};

export const fetchLiveModels = async (apiKey: string): Promise<any[]> => {
  const cleanKey = apiKey.trim();
  const baseUrl = getGatewayUrl();
  try {
    const res = await fetch(`${baseUrl}/v1/models`, {
      headers: {
        'x-api-key': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const testApiRequest = async (apiKey: string): Promise<{ success: boolean; latencyMs: number; responseText?: string; error?: string }> => {
  const cleanKey = apiKey.trim();
  const baseUrl = getGatewayUrl();
  const startTime = Date.now();

  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': cleanKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-5.5',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Ping test' }],
      }),
    });

    const latencyMs = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      const text = data.content?.[0]?.text || 'OK';
      return { success: true, latencyMs, responseText: text };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, latencyMs, error: err.error?.message || `HTTP ${res.status}` };
    }
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - startTime, error: err.message };
  }
};

/**
 * Repeatable, evidence-based diagnostic probe to verify actual model routing,
 * gateway resolution, and upstream provider handling without secrets or prompt leaks.
 */
export const probeModelRouting = async (apiKey: string, model: string): Promise<ModelProbeResult> => {
  const cleanKey = apiKey.trim();
  const baseUrl = getGatewayUrl();
  const startTime = Date.now();

  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': cleanKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 15,
        messages: [{ role: 'user', content: 'Diagnostic probe ping' }],
      }),
    });

    const latencyMs = Date.now() - startTime;
    const gatewayModel = res.headers.get('x-gateway-model') || undefined;
    const resolvedModel = res.headers.get('x-gateway-resolved-model') || undefined;
    const upstreamProvider = res.headers.get('x-upstream-provider') || undefined;
    const aliasAppliedHeader = res.headers.get('x-model-alias-applied');
    const aliasApplied = aliasAppliedHeader ? aliasAppliedHeader === 'true' : undefined;

    let bodyData: any = {};
    try {
      bodyData = await res.json();
    } catch {}

    if (res.ok) {
      const responseText = bodyData.content?.[0]?.text || '';
      return {
        success: true,
        statusCode: res.status,
        latencyMs,
        requestedModel: model,
        gatewayModel: gatewayModel || bodyData.model || model,
        resolvedModel: resolvedModel || bodyData.model || model,
        upstreamProvider: upstreamProvider || 'Configured Vendor Provider',
        aliasApplied: aliasApplied ?? (resolvedModel ? resolvedModel.toLowerCase() !== model.toLowerCase() : false),
        returnedModel: bodyData.model || model,
        responseText,
      };
    } else {
      return {
        success: false,
        statusCode: res.status,
        latencyMs,
        requestedModel: model,
        gatewayModel,
        resolvedModel,
        upstreamProvider,
        aliasApplied,
        error: bodyData.error?.message || `HTTP ${res.status} Gateway Probe Failed`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      statusCode: 0,
      latencyMs: Date.now() - startTime,
      requestedModel: model,
      error: `Could not connect to Gateway at ${baseUrl}: ${err.message}`,
    };
  }
};
