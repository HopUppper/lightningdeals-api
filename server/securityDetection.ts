import { Request, Response, NextFunction } from 'express';
import { recordAuditEvent } from './auditLogger';

// Regex patterns for suspicious inputs
const SQLI_PATTERNS = [
  /(\b(UNION(\s+ALL)?|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
  /('|\")\s*(OR|AND)\s*('|\")?\d+('|\")?\s*=\s*('|\")?\d+/i,
  /('|\")\s*OR\s*1\s*=\s*1/i,
  /;\s*(DROP|DELETE|UPDATE|TRUNCATE)\s+/i,
  /--\s*$/m,
  /\/\*.*?\*\//,
];

const XSS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/i,
  /javascript\s*:\s*[^\s]+/i,
  /on(error|load|click|mouseover|focus|blur)\s*=\s*['"][^'"]*['"]/i,
  /<img\b[^>]*onerror\s*=/i,
  /<svg\b[^>]*onload\s*=/i,
  /<iframe\b/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]\.\.[\/\\]/,
  /\.\.[\/\\]/,
  /\/etc\/passwd/i,
  /win\.ini/i,
  /\/proc\/self\//i,
];

const SSRF_PATTERNS = [
  /169\.254\.169\.254/,
  /metadata\.google\.internal/i,
  /100\.100\.100\.200/,
];

const MALICIOUS_BOT_UA = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /wpscan/i,
  /gobuster/i,
  /dirbuster/i,
  /acunetix/i,
  /nessus/i,
  /nmap/i,
];

/**
 * Scan a single string or recursive object for attack patterns
 */
function scanValueForAttacks(val: any, depth: number = 0): {
  type: 'SQLI' | 'XSS' | 'PATH_TRAVERSAL' | 'SSRF' | null;
  patternMatched?: string;
} {
  if (depth > 5 || val === null || val === undefined) return { type: null };

  if (typeof val === 'string') {
    // Check SQLi
    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(val)) {
        return { type: 'SQLI', patternMatched: pattern.source };
      }
    }
    // Check XSS
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(val)) {
        return { type: 'XSS', patternMatched: pattern.source };
      }
    }
    // Check Path Traversal
    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(val)) {
        return { type: 'PATH_TRAVERSAL', patternMatched: pattern.source };
      }
    }
    // Check SSRF
    for (const pattern of SSRF_PATTERNS) {
      if (pattern.test(val)) {
        return { type: 'SSRF', patternMatched: pattern.source };
      }
    }
    return { type: null };
  }

  if (typeof val === 'object') {
    for (const key of Object.keys(val)) {
      // Don't scan password fields for SQL/XSS false positives, only scan metadata/query/body fields
      if (/pass(word)?/i.test(key) || /token/i.test(key) || /hash/i.test(key)) continue;

      const res = scanValueForAttacks(val[key], depth + 1);
      if (res.type) return res;
    }
  }

  return { type: null };
}

/**
 * Security Threat Detection & Block Middleware
 */
export function securityThreatDetector(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers['user-agent'] || '';

  // 1. Check for known scanner/exploit bots
  for (const botPattern of MALICIOUS_BOT_UA) {
    if (botPattern.test(userAgent)) {
      recordAuditEvent({
        eventType: 'BOT_ACTIVITY_DETECTED',
        severity: 'HIGH',
        actorType: 'ANONYMOUS',
        result: 'BLOCKED',
        statusCode: 403,
        failureReason: `Blocked automated exploit scanner (${botPattern.source})`,
        metadata: { userAgent },
        req,
      });

      return res.status(403).json({
        error: {
          type: 'access_denied',
          message: 'Access blocked by automated threat protection.',
        },
      });
    }
  }

  // 2. Scan Query Parameters
  if (req.query && Object.keys(req.query).length > 0) {
    const scan = scanValueForAttacks(req.query);
    if (scan.type) {
      const eventType =
        scan.type === 'SQLI'
          ? 'POSSIBLE_SQL_INJECTION_ATTEMPT'
          : scan.type === 'XSS'
          ? 'POSSIBLE_XSS_ATTEMPT'
          : scan.type === 'PATH_TRAVERSAL'
          ? 'PATH_TRAVERSAL_ATTEMPT'
          : 'SSRF_ATTEMPT';

      recordAuditEvent({
        eventType,
        severity: 'HIGH',
        actorType: (req as any).user ? 'CUSTOMER' : 'ANONYMOUS',
        actorId: (req as any).user?.id,
        customerId: (req as any).user?.id,
        result: 'BLOCKED',
        statusCode: 400,
        failureReason: `Suspicious input pattern detected in request query string (${scan.type})`,
        metadata: {
          threatType: scan.type,
          queryKeys: Object.keys(req.query),
        },
        req,
      });

      return res.status(400).json({
        error: {
          type: 'invalid_request',
          message: 'Malformed or potentially unsafe request parameters.',
        },
      });
    }
  }

  // 3. Scan JSON Request Body (excluding passwords/tokens)
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    // Skip large AI prompt bodies from gateway /v1/messages so developer code completions are not falsely blocked
    const isAiGateway = req.path.startsWith('/v1/messages') || req.path.startsWith('/v1/chat/completions');
    
    if (!isAiGateway) {
      const scan = scanValueForAttacks(req.body);
      if (scan.type) {
        const eventType =
          scan.type === 'SQLI'
            ? 'POSSIBLE_SQL_INJECTION_ATTEMPT'
            : scan.type === 'XSS'
            ? 'POSSIBLE_XSS_ATTEMPT'
            : scan.type === 'PATH_TRAVERSAL'
            ? 'PATH_TRAVERSAL_ATTEMPT'
            : 'SSRF_ATTEMPT';

        recordAuditEvent({
          eventType,
          severity: 'HIGH',
          actorType: (req as any).user ? 'CUSTOMER' : 'ANONYMOUS',
          actorId: (req as any).user?.id,
          customerId: (req as any).user?.id,
          result: 'BLOCKED',
          statusCode: 400,
          failureReason: `Suspicious payload pattern detected in request body (${scan.type})`,
          metadata: {
            threatType: scan.type,
            bodyKeys: Object.keys(req.body),
          },
          req,
        });

        return res.status(400).json({
          error: {
            type: 'invalid_request',
            message: 'Malformed or potentially unsafe request payload.',
          },
        });
      }
    }
  }

  next();
}
