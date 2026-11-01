import http from 'http';
import https from 'https';
import { fetch as undiciFetch, Agent as UndiciAgent } from 'undici';

// High-performance HTTP Keep-Alive Agent Pool for Node HTTP clients
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

// Undici Agent for High-Performance Keep-Alive connection reuse in fetch
export const undiciAgent = new UndiciAgent({
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 180000,
  connections: 128,
  pipelining: 1,
  connect: {
    rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
  },
});

/**
 * Executes a network fetch using connection pooling and keep-alive reuse.
 */
export async function pooledFetch(
  url: string,
  options: RequestInit & { agent?: any; timeoutMs?: number } = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs || 120000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    // Try high-performance Undici pooled fetch with keep-alive
    const res = await undiciFetch(url, {
      ...options,
      dispatcher: undiciAgent,
      signal: controller.signal,
    } as any);

    return res as unknown as Response;
  } catch (err: any) {
    if (controller.signal.aborted) {
      throw err;
    }
    // Fallback to native fetch if undici dispatcher has a network issue
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
