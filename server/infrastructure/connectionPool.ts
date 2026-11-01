import http from 'http';
import https from 'https';

// High-performance HTTP Keep-Alive Agent Pool
export const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 128,
  maxFreeSockets: 32,
  timeout: 180000,
});

export const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 128,
  maxFreeSockets: 32,
  timeout: 180000,
  rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
});

/**
 * Executes a network fetch using connection pooling and keep-alive reuse.
 */
export async function pooledFetch(
  url: string,
  options: RequestInit & { agent?: any; timeoutMs?: number } = {}
): Promise<Response> {
  const isHttps = url.startsWith('https:');
  const agent = options.agent || (isHttps ? httpsAgent : httpAgent);

  const timeoutMs = options.timeoutMs || 120000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: any = {
      ...options,
      // Node.js native fetch / undici agent dispatcher option
      dispatcher: agent,
    };

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }
    fetchOptions.signal = controller.signal;

    const response = await fetch(url, fetchOptions);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
