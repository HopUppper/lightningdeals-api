import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './db';
import { hashSecret } from './authSecurity';
import { recordAuditEvent } from './auditLogger';
import { getJwtSecret, getSecurityEpoch, ALLOWED_JWT_ALGORITHMS } from './jwtConfig';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    phone?: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  sessionId?: string;
}

export function generateToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), { algorithm: 'HS256', expiresIn: '7d' });
}

export async function authenticateJwt(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const queryToken = typeof req.query?.token === 'string' ? req.query.token : undefined;
  const cookieToken = (req as any).cookies?.apexscale_token || (req as any).cookies?.token;
  const token = authHeader || queryToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Authentication required. Please sign in.' } });
  }

  let decoded: { id?: string; email?: string; role?: string; iat?: number; exp?: number };
  try {
    decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as any;
  } catch (e) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Invalid or expired authentication session.' } });
  }

  if (!decoded || !decoded.id || typeof decoded.id !== 'string') {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Malformed token: missing subject identity.' } });
  }

  if (typeof decoded.iat !== 'number' || isNaN(decoded.iat) || decoded.iat <= 0) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Malformed token: missing or invalid issuance timestamp.' } });
  }

  try {
    const tokenHash = hashSecret(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: { type: 'authentication_error', message: 'User account not found.' } });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: { type: 'account_suspended', message: 'Account is suspended. Please contact support.' } });
    }

    // Invalidate sessions issued before password was last changed
    if (decoded.iat && user.passwordChangedAt) {
      const issuedAtMs = decoded.iat * 1000;
      if (issuedAtMs < user.passwordChangedAt.getTime()) {
        return res.status(401).json({
          error: {
            type: 'session_invalidated',
            message: 'Session invalidated due to password change. Please sign in again.',
          },
        });
      }
    }

    // Invalidate sessions issued before incident security epoch
    const securityEpoch = getSecurityEpoch();
    if (securityEpoch > 0 && decoded.iat) {
      const issuedAtMs = decoded.iat * 1000;
      if (issuedAtMs < securityEpoch) {
        return res.status(401).json({
          error: {
            type: 'session_invalidated',
            message: 'Session invalidated by security epoch policy. Please sign in again.',
          },
        });
      }
    }

    // Check if session has been revoked server-side
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionTokenHash: tokenHash,
      },
    });

    if (session && session.isRevoked) {
      return res.status(401).json({ error: { type: 'session_revoked', message: 'This session has been revoked. Please sign in again.' } });
    }

    // Touch last active timestamp on session
    if (session) {
      prisma.userSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      }).catch(() => {});
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };
    req.sessionId = session?.id;

    next();
  } catch (err) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Invalid or expired authentication session.' } });
  }
}

// Optional Server-Side JWT Authenticator (attaches user if valid, otherwise proceeds anonymously)
export async function optionalAuthenticateJwt(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const token = authHeader;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as any;
    if (decoded && decoded.id && typeof decoded.id === 'string') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (user && user.status !== 'suspended') {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        };
      }
    }
  } catch {
    // Silently continue for public optional endpoints
  }
  next();
}

// Strict Server-Side Email Verification Guard
export function requireVerifiedEmail(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Authentication required.' } });
  }

  if (req.user.role !== 'admin' && !req.user.emailVerified) {
    return res.status(403).json({
      error: {
        type: 'email_unverified',
        message: 'Email verification required. Please verify your email address to unlock account features.',
        emailVerified: false,
      },
    });
  }

  next();
}

// Strict Server-Side Admin Guard
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    recordAuditEvent({
      eventType: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      severity: 'HIGH',
      actorType: req.user ? 'CUSTOMER' : 'ANONYMOUS',
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      customerId: req.user?.id,
      action: 'ADMIN_ROUTE_ACCESS',
      result: 'DENIED',
      statusCode: 403,
      failureReason: req.user ? `Customer (${req.user.email}) attempted unauthorized access to admin endpoint` : 'Unauthenticated attempt to access admin endpoint',
      req,
    });

    return res.status(403).json({ error: { type: 'forbidden', message: 'Access denied: Admin privileges required.' } });
  }
  next();
}

export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

const BANNED_COMPROMISED_PASSWORDS = new Set(['love9002', '9002']);

export function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.startsWith('scrypt$')) return false;

  if (BANNED_COMPROMISED_PASSWORDS.has(password)) {
    return false;
  }

  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const hash = parts[2];
    
    // Support both N=16384 (production) and N=1024 (legacy scrypt)
    let derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    if (crypto.timingSafeEqual(derivedKey, Buffer.from(hash, 'hex'))) {
      return true;
    }
    derivedKey = crypto.scryptSync(password, salt, 64, { N: 1024, r: 8, p: 1 });
    return crypto.timingSafeEqual(derivedKey, Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}
