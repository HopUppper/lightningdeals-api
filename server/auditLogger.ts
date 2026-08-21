import crypto from 'crypto';
import { Request } from 'express';
import { prisma } from './db';

export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditActorType = 'CUSTOMER' | 'ADMIN' | 'API_KEY' | 'SYSTEM' | 'ANONYMOUS' | 'PAYMENT_PROVIDER' | 'SUPPLIER';
export type AuditResult = 'SUCCESS' | 'BLOCKED' | 'FAILED' | 'DENIED' | 'WARNING';

export interface AuditEventParams {
  eventType: string;
  severity?: AuditSeverity;
  actorType?: AuditActorType;
  actorId?: string | null;
  actorEmail?: string | null;
  customerId?: string | null;
  adminId?: string | null;
  apiKeyId?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  endpoint?: string | null;
  httpMethod?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  action?: string | null;
  result?: AuditResult;
  statusCode?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  country?: string | null;
  metadata?: Record<string, any> | null;
  failureReason?: string | null;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  req?: Request;
}

// Global In-Memory Last Tamper Hash Cache for high-speed chaining
let lastKnownTamperHash: string | null = null;

// Sensitive keys to strictly redact
const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /auth(orization)?/i,
  /cookie/i,
  /key_hash/i,
  /rawkey/i,
  /signature/i,
  /cvv/i,
  /credit_card/i,
  /prompt/i,
  /completion/i,
  /master_key/i,
];

/**
 * Deep recursive secret redaction for safe logging
 */
export function sanitizeLogPayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Redact raw API keys if accidentally passed in text
    if (obj.startsWith('ld_live_') || obj.startsWith('ld_trial_')) {
      const prefix = obj.substring(0, 8);
      const suffix = obj.substring(obj.length - 4);
      return `${prefix}••••${suffix}`;
    }
    if (obj.startsWith('sk-ant-') || obj.startsWith('sk-')) {
      return 'sk-••••••••[REDACTED]';
    }
    return obj.length > 1000 ? `${obj.substring(0, 1000)}...[TRUNCATED]` : obj;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map(sanitizeLogPayload);
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogPayload(value);
      }
    }
    return sanitized;
  }
  return String(obj);
}

/**
 * Derive default severity based on event type if not explicitly supplied
 */
export function deriveSeverity(eventType: string, result?: AuditResult): AuditSeverity {
  const evt = eventType.toUpperCase();

  // CRITICAL SEVERITY
  if (
    evt.includes('COMPROMISED') ||
    evt.includes('KILLSWITCH') ||
    evt.includes('TAMPER') ||
    evt.includes('MASTER_KEY_CORRUPT')
  ) {
    return 'CRITICAL';
  }

  // HIGH SEVERITY
  if (
    evt.includes('IDOR') ||
    evt.includes('INJECTION') ||
    evt.includes('XSS') ||
    evt.includes('TRAVERSAL') ||
    evt.includes('SSRF') ||
    evt.includes('COMMAND') ||
    evt.includes('UNAUTHORIZED_ADMIN') ||
    evt.includes('SUSPENDED') ||
    evt.includes('ACCOUNT_LOCKED') ||
    evt.includes('REFUNDED')
  ) {
    return 'HIGH';
  }

  // MEDIUM SEVERITY
  if (
    evt.includes('BRUTE_FORCE') ||
    evt.includes('FAILED_LOGINS') ||
    evt.includes('INVALID_WEBHOOK') ||
    evt.includes('REPLAY') ||
    evt.includes('TIMEOUT') ||
    evt.includes('EXCESSIVE') ||
    evt.includes('ABUSE')
  ) {
    return 'MEDIUM';
  }

  // LOW SEVERITY
  if (
    evt.includes('RATE_LIMIT') ||
    evt.includes('MALFORMED') ||
    evt.includes('FAILED') ||
    result === 'BLOCKED' ||
    result === 'FAILED'
  ) {
    return 'LOW';
  }

  // INFO
  return 'INFO';
}

/**
 * Main Structured Audit Logging Function (Non-blocking & Tamper-Evident)
 */
export async function recordAuditEvent(params: AuditEventParams): Promise<void> {
  // Fire and forget to not block incoming request threads
  setImmediate(async () => {
    try {
      const {
        eventType,
        action,
        statusCode,
        failureReason,
        beforeState,
        afterState,
        metadata,
        req,
      } = params;

      let {
        severity,
        actorType = 'SYSTEM',
        actorId,
        actorEmail,
        customerId,
        adminId,
        apiKeyId,
        sessionId,
        requestId,
        endpoint,
        httpMethod,
        resourceType,
        resourceId,
        result = 'SUCCESS',
        ipAddress,
        userAgent,
        country,
      } = params;

      // Extract client details from Express req if provided
      if (req) {
        if (!ipAddress) {
          ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();
        }
        if (!userAgent) {
          userAgent = (req.headers['user-agent'] || 'Unknown').substring(0, 200);
        }
        if (!endpoint) {
          endpoint = req.originalUrl || req.url;
        }
        if (!httpMethod) {
          httpMethod = req.method;
        }
        if (!requestId) {
          requestId = (req.headers['x-request-id'] as string) || `req_${crypto.randomBytes(8).toString('hex')}`;
        }
        if (!country) {
          country = (req.headers['cf-ipcountry'] as string) || (req.headers['x-country-code'] as string) || null;
        }
      }

      // Default severity if not provided
      if (!severity) {
        severity = deriveSeverity(eventType, result);
      }

      // Auto-detect actor type if user/admin ID is known
      if (actorType === 'SYSTEM' || !actorType) {
        if (adminId) actorType = 'ADMIN';
        else if (customerId || actorId) actorType = 'CUSTOMER';
        else if (apiKeyId) actorType = 'API_KEY';
        else actorType = 'ANONYMOUS';
      }

      // Sanitize JSON payloads
      const sanitizedMeta = metadata ? JSON.stringify(sanitizeLogPayload(metadata)) : null;
      const sanitizedBefore = beforeState ? JSON.stringify(sanitizeLogPayload(beforeState)) : null;
      const sanitizedAfter = afterState ? JSON.stringify(sanitizeLogPayload(afterState)) : null;

      // Retrieve previous hash for tamper-evident blockchain-style chaining
      if (!lastKnownTamperHash) {
        const lastRecord = await prisma.auditEvent.findFirst({
          orderBy: { timestamp: 'desc' },
          select: { tamperHash: true },
        });
        lastKnownTamperHash = lastRecord?.tamperHash || '0000000000000000000000000000000000000000000000000000000000000000';
      }

      const previousHash = lastKnownTamperHash;
      const timestamp = new Date();

      // Compute Cryptographic SHA-256 Tamper Hash
      const hashPayload = `${previousHash}|${timestamp.toISOString()}|${eventType}|${severity}|${actorType}|${actorId || ''}|${resourceId || ''}|${result}|${ipAddress || ''}`;
      const tamperHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
      lastKnownTamperHash = tamperHash;

      // Persist to PostgreSQL AuditEvent table
      await prisma.auditEvent.create({
        data: {
          timestamp,
          eventType,
          severity,
          actorType,
          actorId: actorId || customerId || adminId || null,
          actorEmail: actorEmail || null,
          customerId: customerId || (actorType === 'CUSTOMER' ? actorId : null),
          adminId: adminId || (actorType === 'ADMIN' ? actorId : null),
          apiKeyId: apiKeyId || null,
          sessionId: sessionId || null,
          requestId: requestId || null,
          endpoint: endpoint ? endpoint.substring(0, 255) : null,
          httpMethod: httpMethod ? httpMethod.substring(0, 10) : null,
          resourceType: resourceType || null,
          resourceId: resourceId || null,
          action: action || null,
          result,
          statusCode: statusCode || null,
          ipAddress: ipAddress ? ipAddress.substring(0, 64) : null,
          userAgent: userAgent ? userAgent.substring(0, 255) : null,
          country: country ? country.substring(0, 8) : null,
          metadata: sanitizedMeta,
          failureReason: failureReason ? failureReason.substring(0, 500) : null,
          beforeState: sanitizedBefore,
          afterState: sanitizedAfter,
          tamperHash,
          previousHash,
        },
      });
    } catch (err) {
      console.error('[AUDIT LOGGER DEGRADED]', err);
    }
  });
}

/**
 * Backward-compatible adapter for legacy recordSecurityLog
 */
export async function recordSecurityLog(params: {
  userId?: string | null;
  email?: string | null;
  req?: Request;
  eventType: string;
  metadata?: Record<string, any>;
}) {
  const { userId, email, req, eventType, metadata } = params;

  // 1. Record in legacy SecurityLog for backward compatibility
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'Unknown';

    if (req) {
      ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();
      userAgent = (req.headers['user-agent'] || 'Unknown').substring(0, 150);
    }

    await prisma.securityLog.create({
      data: {
        userId: userId || null,
        email: email || null,
        ipAddress,
        userAgent,
        eventType,
        metadata: metadata ? JSON.stringify(sanitizeLogPayload(metadata)) : null,
      },
    });
  } catch (err) {
    console.error('[LEGACY SECURITY LOG ERROR]', err);
  }

  // 2. Also record in the new Advanced AuditEvent Center
  await recordAuditEvent({
    eventType,
    actorType: userId ? 'CUSTOMER' : 'ANONYMOUS',
    actorId: userId,
    actorEmail: email,
    customerId: userId,
    req,
    metadata,
  });
}

/**
 * Incident Correlation: Get related activity timeline (±60 min window)
 */
export async function getEventCorrelation(params: {
  eventId: string;
  ipAddress?: string | null;
  customerId?: string | null;
  apiKeyId?: string | null;
  timestamp: Date;
}) {
  const { eventId, ipAddress, customerId, apiKeyId, timestamp } = params;

  const windowStart = new Date(timestamp.getTime() - 60 * 60 * 1000);
  const windowEnd = new Date(timestamp.getTime() + 60 * 60 * 1000);

  const orConditions: any[] = [];
  if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
    orConditions.push({ ipAddress });
  }
  if (customerId) {
    orConditions.push({ customerId });
  }
  if (apiKeyId) {
    orConditions.push({ apiKeyId });
  }

  if (orConditions.length === 0) return [];

  const related = await prisma.auditEvent.findMany({
    where: {
      id: { not: eventId },
      timestamp: { gte: windowStart, lte: windowEnd },
      OR: orConditions,
    },
    orderBy: { timestamp: 'desc' },
    take: 15,
    select: {
      id: true,
      timestamp: true,
      eventType: true,
      severity: true,
      actorType: true,
      actorEmail: true,
      ipAddress: true,
      endpoint: true,
      result: true,
      failureReason: true,
    },
  });

  return related;
}

/**
 * Tamper-Evident Hash Chain Verification
 */
export async function verifyHashChainIntegrity(limit: number = 100): Promise<{
  isTamperFree: boolean;
  checkedCount: number;
  brokenAtEventId?: string;
  verifiedAt: Date;
}> {
  const events = await prisma.auditEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  if (events.length <= 1) {
    return { isTamperFree: true, checkedCount: events.length, verifiedAt: new Date() };
  }

  // Reverse to check sequentially from oldest to newest in batch
  const sequential = [...events].reverse();

  for (let i = 1; i < sequential.length; i++) {
    const prev = sequential[i - 1];
    const curr = sequential[i];

    if (curr.previousHash && curr.previousHash !== prev.tamperHash) {
      return {
        isTamperFree: false,
        checkedCount: i,
        brokenAtEventId: curr.id,
        verifiedAt: new Date(),
      };
    }
  }

  return {
    isTamperFree: true,
    checkedCount: sequential.length,
    verifiedAt: new Date(),
  };
}

/**
 * Summary Statistics for Top Metrics Cards
 */
export async function getAuditSummary(): Promise<{
  todayTotal: number;
  criticalTotal: number;
  highTotal: number;
  mediumTotal: number;
  blockedTotal: number;
  rateLimitTotal: number;
  failedLoginsTotal: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    todayTotal,
    criticalTotal,
    highTotal,
    mediumTotal,
    blockedTotal,
    rateLimitTotal,
    failedLoginsTotal,
  ] = await Promise.all([
    prisma.auditEvent.count({ where: { timestamp: { gte: startOfDay } } }),
    prisma.auditEvent.count({ where: { severity: 'CRITICAL', timestamp: { gte: startOfDay } } }),
    prisma.auditEvent.count({ where: { severity: 'HIGH', timestamp: { gte: startOfDay } } }),
    prisma.auditEvent.count({ where: { severity: 'MEDIUM', timestamp: { gte: startOfDay } } }),
    prisma.auditEvent.count({ where: { result: 'BLOCKED', timestamp: { gte: startOfDay } } }),
    prisma.auditEvent.count({ where: { eventType: { contains: 'RATE_LIMIT' }, timestamp: { gte: startOfDay } } }),
    prisma.auditEvent.count({ where: { eventType: { in: ['LOGIN_FAILED', 'ADMIN_LOGIN_FAILED', 'MULTIPLE_FAILED_LOGINS'] }, timestamp: { gte: startOfDay } } }),
  ]);

  return {
    todayTotal,
    criticalTotal,
    highTotal,
    mediumTotal,
    blockedTotal,
    rateLimitTotal,
    failedLoginsTotal,
  };
}
