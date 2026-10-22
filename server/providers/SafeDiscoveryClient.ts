import http from 'http';
import https from 'https';
import { URL } from 'url';
import { validatePublicWebUrl, safeHttpAgent, safeHttpsAgent } from '../ssrf';

export interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

export interface SafeFetchResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  json: () => any;
  latencyMs: number;
}

/**
 * SSRF-Safe HTTP Client for Provider Capability and Limit Discovery.
 * Enforces:
 * - Scheme restriction (http/https)
 * - Port restriction (80/443)
 * - DNS rebinding mitigation using custom socket lookup
 * - Private, loopback, link-local, and cloud-metadata IP blocking
 * - Strict timeout and response size limits
 */
export async function safeDiscoveryFetch(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 5000,
    maxResponseBytes = 64 * 1024, // 64KB max
  } = options;

  // 1. Validate URL against SSRF and DNS rebinding
  const validation = await validatePublicWebUrl(rawUrl);
  if (!validation.safe || !validation.url) {
    throw new Error(`SSRF Blocked: ${validation.error || 'Target URL is not permitted.'}`);
  }

  const parsedUrl = validation.url;
  const isHttps = parsedUrl.protocol === 'https:';
  const transport = isHttps ? https : http;
  const agent = isHttps ? safeHttpsAgent : safeHttpAgent;

  return new Promise<SafeFetchResponse>((resolve, reject) => {
    const startTime = Date.now();
    let timedOut = false;

    const reqOptions: http.RequestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method.toUpperCase(),
      headers: {
        ...headers,
        'User-Agent': 'LightningAPI-Capability-Discovery/1.0',
        Accept: 'application/json, text/plain, */*',
      },
      agent,
      timeout: timeoutMs,
    };

    const req = transport.request(reqOptions, (res) => {
      let receivedBytes = 0;
      let rawData = '';

      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        receivedBytes += Buffer.byteLength(chunk, 'utf8');
        if (receivedBytes > maxResponseBytes) {
          req.destroy(new Error(`Response exceeded maximum allowed size of ${maxResponseBytes} bytes`));
          return;
        }
        rawData += chunk;
      });

      res.on('end', () => {
        if (timedOut) return;
        const latencyMs = Date.now() - startTime;
        const resHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v !== undefined) {
            resHeaders[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
          }
        }

        resolve({
          statusCode: res.statusCode || 0,
          headers: resHeaders,
          body: rawData,
          json: () => {
            try {
              return JSON.parse(rawData);
            } catch {
              throw new Error(`Invalid JSON in discovery response: ${rawData.substring(0, 100)}`);
            }
          },
          latencyMs,
        });
      });
    });

    req.on('timeout', () => {
      timedOut = true;
      req.destroy(new Error(`Discovery request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}
