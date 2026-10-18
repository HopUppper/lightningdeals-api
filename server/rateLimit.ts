import { Request, Response, NextFunction } from 'express';
import net from 'net';
import { recordAuditEvent } from './auditLogger';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const rateLimitStores = new Map<string, Map<string, RateLimitStore>>();

function getStore(prefix: string): Map<string, RateLimitStore> {
  let store = rateLimitStores.get(prefix);
  if (!store) {
    store = new Map<string, RateLimitStore>();
    rateLimitStores.set(prefix, store);
  }
  return store;
}

// Clean up expired buckets periodically (every 5 minutes) without blocking process exit
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const store of rateLimitStores.values()) {
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) store.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

/**
 * Derives client IP securely.
 * Express 'trust proxy: 1' inspects the trusted reverse proxy (Render / Cloudflare)
 * and populates req.ip with the real client IP.
 * Raw attacker-supplied X-Forwarded-For headers cannot spoof req.ip when trust proxy is configured properly.
 */
export function resolveClientIp(req: Request): string {
  // 1. Prefer Express-calculated req.ip (validated through trust proxy setting)
  if (req.ip) {
    const cleanIp = req.ip.replace(/^::ffff:/, '').trim();
    if (net.isIP(cleanIp)) {
      return cleanIp;
    }
  }

  // 2. Direct socket address fallback
  const socketIp = req.socket?.remoteAddress?.replace(/^::ffff:/, '').trim();
  if (socketIp && net.isIP(socketIp)) {
    return socketIp;
  }

  return '127.0.0.1';
}

export function clearAuthRateLimit(identifier: string) {
  const clean = identifier.trim();
  const authIpStore = getStore('auth_ip');
  const authAdminStore = getStore('auth_admin');
  const authStore = getStore('auth');
  authIpStore.delete(`auth_ip:${clean}`);
  authAdminStore.delete(`auth_admin:${clean}`);
  authStore.delete(`auth:${clean}`);
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix: string;
  accountKeyExtractor?: (req: Request) => string | null;
  accountMax?: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const ipStore = getStore(options.keyPrefix);
  const accountStore = getStore(`${options.keyPrefix}_account`);

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = resolveClientIp(req);
    const ipKey = `${options.keyPrefix}:${clientIp}`;
    const now = Date.now();

    // 1. Check IP-based limit
    const ipRecord = ipStore.get(ipKey);
    if (!ipRecord || now > ipRecord.resetAt) {
      ipStore.set(ipKey, { count: 1, resetAt: now + options.windowMs });
    } else {
      if (ipRecord.count >= options.max) {
        const retryAfterSec = Math.ceil((ipRecord.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        res.setHeader('X-RateLimit-Limit', options.max);
        res.setHeader('X-RateLimit-Remaining', 0);

        recordAuditEvent({
          eventType: 'RATE_LIMIT_TRIGGERED',
          severity: 'LOW',
          actorType: (req as any).user ? 'CUSTOMER' : 'ANONYMOUS',
          actorId: (req as any).user?.id,
          endpoint: req.originalUrl || req.url,
          action: 'RATE_LIMIT_BLOCK',
          result: 'BLOCKED',
          statusCode: 429,
          failureReason: options.message,
          metadata: {
            rateLimitPrefix: options.keyPrefix,
            dimension: 'IP',
            clientIp,
            maxAllowed: options.max,
            retryAfterSec,
          },
          req,
        });

        return res.status(429).json({
          error: {
            type: 'rate_limit_exceeded',
            message: options.message,
            retryAfterSeconds: retryAfterSec,
          },
        });
      }
      ipRecord.count++;
    }

    // 2. Check Account-based limit (anti-spraying / credential stuffing)
    if (options.accountKeyExtractor) {
      const accountKeyRaw = options.accountKeyExtractor(req);
      if (accountKeyRaw) {
        const accMax = options.accountMax || Math.min(options.max, 10);
        const accKey = `${options.keyPrefix}_acc:${accountKeyRaw.toLowerCase().trim()}`;
        const accRecord = accountStore.get(accKey);

        if (!accRecord || now > accRecord.resetAt) {
          accountStore.set(accKey, { count: 1, resetAt: now + options.windowMs });
        } else {
          if (accRecord.count >= accMax) {
            const retryAfterSec = Math.ceil((accRecord.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            res.setHeader('X-RateLimit-Limit', accMax);
            res.setHeader('X-RateLimit-Remaining', 0);

            recordAuditEvent({
              eventType: 'RATE_LIMIT_ACCOUNT_TRIGGERED',
              severity: 'MEDIUM',
              actorType: 'ANONYMOUS',
              endpoint: req.originalUrl || req.url,
              action: 'RATE_LIMIT_BLOCK',
              result: 'BLOCKED',
              statusCode: 429,
              failureReason: 'Account targeted by excessive authentication attempts.',
              metadata: {
                rateLimitPrefix: options.keyPrefix,
                dimension: 'ACCOUNT',
                accountKey: accountKeyRaw,
                retryAfterSec,
              },
              req,
            });

            return res.status(429).json({
              error: {
                type: 'rate_limit_exceeded',
                message: 'Too many authentication attempts for this account. Access is temporarily locked for protection.',
                retryAfterSeconds: retryAfterSec,
              },
            });
          }
          accRecord.count++;
        }
      }
    }

    const currentCount = ipStore.get(ipKey)?.count || 1;
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - currentCount));
    next();
  };
}

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  keyPrefix: 'auth',
  accountKeyExtractor: (req) => (req.body?.email ? String(req.body.email) : null),
  accountMax: 10,
});

export const trialLimiter = createRateLimiter({
  windowMs: 24 * 3600 * 1000, // 24 hours
  max: 3, // 3 claims per day per IP
  message: 'Daily trial limit reached for this IP address. Please upgrade to a paid key or try again tomorrow.',
  keyPrefix: 'trial',
});

export const keyCheckLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: 'Security Alert: Rate limit exceeded for API key validation. Max 5 checks per minute.',
  keyPrefix: 'key_check',
});

