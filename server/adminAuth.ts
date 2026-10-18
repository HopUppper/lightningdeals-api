import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './db';
import { createRateLimiter, clearAuthRateLimit } from './rateLimit';
import { AuthRequest, verifyPasswordScrypt, hashPasswordScrypt } from './auth';
import { hashSecret } from './authSecurity';
import { recordAuditEvent } from './auditLogger';
import { getJwtSecret, getSecurityEpoch } from './jwtConfig';

const router = Router();

const BANNED_COMPROMISED_PASSWORDS = new Set(['love9002', '9002']);

// 15-minute lockout for failed admin login attempts with IP and Account-based dual limiting
const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Security Alert: Maximum admin authentication attempts exceeded. Access is temporarily locked.',
  keyPrefix: 'auth_admin',
  accountKeyExtractor: (req) => (req.body?.email ? String(req.body.email) : null),
  accountMax: 5,
});

// Helper for timing-safe password verification (strictly rejecting plain SHA-256 and compromised credentials)
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Immediately reject exposed/compromised incident credentials
  if (BANNED_COMPROMISED_PASSWORDS.has(password)) {
    return false;
  }

  if (storedHash.startsWith('scrypt$')) {
    return verifyPasswordScrypt(password, storedHash);
  }
  
  // Format 1: salt:hash (scrypt 64-byte)
  if (storedHash.includes(':')) {
    try {
      const [salt, hash] = storedHash.split(':');
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const storedBuffer = Buffer.from(hash, 'hex');
      if (derivedKey.length !== storedBuffer.length) return false;
      return crypto.timingSafeEqual(derivedKey, storedBuffer);
    } catch {
      return false;
    }
  }

  // Plain SHA-256 or plaintext matches are strictly banned
  return false;
}

// Helper to hash passwords securely using scrypt
export function hashPassword(password: string): string {
  return hashPasswordScrypt(password);
}

// POST /api/admin/auth/login
router.post('/login', adminLoginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const clientIp = (req.ip || (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1');

  if (!email || !password) {
    return res.status(400).json({
      error: {
        type: 'invalid_request',
        message: 'Admin email and password are required credentials.',
      },
    });
  }

  try {
    const adminUser = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminUser) {
      // Fix F3: adminUserId is nullable foreign key. Pass null instead of invalid string 'SYSTEM_UNAUTH'
      await prisma.adminLog.create({
        data: {
          adminUserId: null,
          action: 'ADMIN_LOGIN_FAILED',
          targetType: 'Auth',
          metadata: JSON.stringify({
            attemptedEmail: email.trim().toLowerCase(),
            ip: clientIp,
            reason: 'USER_NOT_FOUND_OR_NOT_ADMIN',
          }),
        },
      });

      return res.status(401).json({
        error: {
          type: 'authentication_failed',
          message: 'Invalid admin credentials or unauthorized account access.',
        },
      });
    }

    const isValid = verifyPassword(password, adminUser.passwordHash);
    if (!isValid) {
      await prisma.adminLog.create({
        data: {
          adminUserId: adminUser.id,
          action: 'ADMIN_LOGIN_FAILED',
          targetType: 'Auth',
          targetId: adminUser.id,
          metadata: JSON.stringify({
            ip: clientIp,
            reason: 'INVALID_PASSWORD',
          }),
        },
      });

      return res.status(401).json({
        error: {
          type: 'authentication_failed',
          message: 'Invalid admin credentials or unauthorized account access.',
        },
      });
    }

    // Password valid -> Clear IP rate limit counter & Generate Admin JWT Token
    clearAuthRateLimit(clientIp);
    const token = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        authType: 'ADMIN_SESSION',
      },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    // Track active admin session in database for server-side revocation capability
    const tokenHash = hashSecret(token);
    await prisma.userSession.create({
      data: {
        userId: adminUser.id,
        sessionTokenHash: tokenHash,
        ipAddress: clientIp,
        userAgent: (req.headers['user-agent'] || 'Admin Console').substring(0, 200),
        device: 'Admin Console',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    // Update user login metadata and reset failed attempts
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
        failedLoginAttempts: 0,
      },
    }).catch(() => {});

    // Audit log successful admin login
    await prisma.adminLog.create({
      data: {
        adminUserId: adminUser.id,
        action: 'ADMIN_LOGIN_SUCCESS',
        targetType: 'Auth',
        targetId: adminUser.id,
        metadata: JSON.stringify({ ip: clientIp }),
      },
    });

    await recordAuditEvent({
      eventType: 'ADMIN_LOGIN_SUCCESS',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      adminId: adminUser.id,
      action: 'ADMIN_LOGIN',
      result: 'SUCCESS',
      statusCode: 200,
      req,
    });

    // Clear any background cookies to prevent unintended auto-login on site open
    res.clearCookie('ld_admin_token');
    res.clearCookie('ld_token');
    res.clearCookie('apexscale_token');

    return res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });
  } catch (err: any) {
    console.error('Admin authentication error:', err);
    return res.status(500).json({
      error: {
        type: 'internal_error',
        message: 'An error occurred during admin authentication.',
      },
    });
  }
});

// POST /api/admin/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (authHeader) {
    const tokenHash = hashSecret(authHeader);
    await prisma.userSession.updateMany({
      where: { sessionTokenHash: tokenHash },
      data: { isRevoked: true },
    }).catch(() => {});
  }

  res.clearCookie('ld_admin_token');
  res.clearCookie('ld_token');
  res.clearCookie('apexscale_token');
  return res.json({ success: true, message: 'Admin session terminated successfully.' });
});

// GET /api/admin/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({
      error: {
        type: 'unauthorized',
        message: 'No active admin session found.',
      },
    });
  }

  try {
    let decoded: any;
    try {
      decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    } catch (e) {
      return res.status(401).json({
        error: {
          type: 'invalid_token',
          message: 'Admin session expired or token signature invalid.',
        },
      });
    }

    if (!decoded || !decoded.id || typeof decoded.id !== 'string' || decoded.role !== 'admin') {
      return res.status(403).json({
        error: {
          type: 'forbidden',
          message: 'Insufficient administrative permissions.',
        },
      });
    }

    // Strictly lookup admin user by UUID id (never fallback to email)
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, status: true, passwordChangedAt: true },
    });

    if (!adminUser || adminUser.role !== 'admin' || adminUser.status !== 'active') {
      return res.status(403).json({
        error: {
          type: 'forbidden',
          message: 'Admin user account is disabled or revoked.',
        },
      });
    }

    // Invalidate sessions issued before password was last changed
    if (decoded.iat && adminUser.passwordChangedAt) {
      const issuedAtMs = decoded.iat * 1000;
      if (issuedAtMs < adminUser.passwordChangedAt.getTime()) {
        return res.status(401).json({
          error: {
            type: 'session_invalidated',
            message: 'Admin session invalidated due to password change. Please sign in again.',
          },
        });
      }
    }

    // Verify server-side session revocation
    const tokenHash = hashSecret(token);
    const session = await prisma.userSession.findFirst({
      where: { userId: adminUser.id, sessionTokenHash: tokenHash },
    });
    if (session && session.isRevoked) {
      return res.status(401).json({
        error: {
          type: 'session_revoked',
          message: 'This admin session has been revoked. Please sign in again.',
        },
      });
    }

    return res.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });
  } catch (err) {
    return res.status(401).json({
      error: {
        type: 'invalid_token',
        message: 'Admin session expired or token signature invalid.',
      },
    });
  }
});

export default router;

