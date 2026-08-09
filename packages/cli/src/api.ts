export interface KeyStatusResult {
  valid: boolean;
  status?: string;
  name?: string;
  tokensRemaining?: string;
  purchasedTokens?: string;
  tokensUsed?: string;
  expiresAt?: string | null;
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
  return 'https://lightningdeals-api.onrender.com';
};



export const validateApiKey = async (apiKey: string): Promise<KeyStatusResult> => {
  const cleanKey = apiKey.trim();
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
      headers: { 'x-api-key': cleanKey },
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
        model: 'claude-3-5-sonnet-20241022',
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
