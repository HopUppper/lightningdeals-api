import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const authRateLimitMap = new Map<string, RateLimitStore>();
const trialRateLimitMap = new Map<string, RateLimitStore>();
const keyCheckRateLimitMap = new Map<string, RateLimitStore>();

// Clean up expired buckets periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of authRateLimitMap.entries()) {
    if (now > val.resetAt) authRateLimitMap.delete(key);
  }
  for (const [key, val] of trialRateLimitMap.entries()) {
    if (now > val.resetAt) trialRateLimitMap.delete(key);
  }
  for (const [key, val] of apiRateLimitMap.entries()) {
    if (now > val.resetAt) apiRateLimitMap.delete(key);
  }
  for (const [key, val] of keyCheckRateLimitMap.entries()) {
    if (now > val.resetAt) keyCheckRateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

export function clearAuthRateLimit(ip: string) {
  authRateLimitMap.delete(`auth:${ip}`);
  authRateLimitMap.delete(`auth:${ip.trim()}`);
}

export function createRateLimiter(options: { windowMs: number; max: number; message: string; keyPrefix: string }) {
  const storeMap = options.keyPrefix === 'auth' ? authRateLimitMap : options.keyPrefix === 'trial' ? trialRateLimitMap : options.keyPrefix === 'key_check' ? keyCheckRateLimitMap : apiRateLimitMap;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();

    const record = storeMap.get(key);

    if (!record || now > record.resetAt) {
      storeMap.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', options.max - 1);
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        error: {
          type: 'rate_limit_exceeded',
          message: options.message,
          retryAfterSeconds: retryAfterSec,
        },
      });
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', options.max - record.count);
    next();
  };
}

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  keyPrefix: 'auth',
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
