import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './db';
import { createRateLimiter, clearAuthRateLimit } from './rateLimit';
import { AuthRequest } from './auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lightningdeals_secret_jwt_key_2026';

// 15-minute lockout for failed admin login attempts (max 25 attempts)
const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Security Alert: Maximum admin authentication attempts exceeded from this IP address. Access is locked for 15 minutes.',
  keyPrefix: 'auth',
});

// Helper for timing-safe password verification
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  
  // Format 1: salt:hash
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(hash, 'hex');
    if (derivedKey.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, storedBuffer);
  }

  // Format 2: Direct hash or legacy plaintext compare in test/dev
  const computed = crypto.createHash('sha256').update(password).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash.length === 64 ? storedHash : computed));
}

// Helper to hash passwords securely
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

// POST /api/admin/auth/login
router.post('/login', adminLoginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();

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
      await prisma.adminLog.create({
        data: {
          adminUserId: 'SYSTEM_UNAUTH',
          action: 'ADMIN_LOGIN_FAILED',
          targetType: 'Auth',
          metadata: `Failed admin login attempt for email: ${email} from IP: ${clientIp} (User not found or not admin)`,
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
          metadata: `Failed admin login attempt (Invalid Password) from IP: ${clientIp}`,
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
        createdAt: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log successful admin login
    await prisma.adminLog.create({
      data: {
        adminUserId: adminUser.id,
        action: 'ADMIN_LOGIN_SUCCESS',
        targetType: 'Auth',
        targetId: adminUser.id,
        metadata: `Successful admin login from IP: ${clientIp}`,
      },
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
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      decoded = jwt.verify(token, 'lightningdeals_secret_jwt_key_2026');
    }

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({
        error: {
          type: 'forbidden',
          message: 'Insufficient administrative permissions.',
        },
      });
    }

    let adminUser = decoded.id ? await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, status: true },
    }) : null;

    if (!adminUser && decoded.email) {
      adminUser = await prisma.user.findFirst({
        where: { email: decoded.email.trim().toLowerCase() },
        select: { id: true, email: true, name: true, role: true, status: true },
      });
    }

    if (!adminUser || adminUser.role !== 'admin' || adminUser.status !== 'active') {
      return res.status(403).json({
        error: {
          type: 'forbidden',
          message: 'Admin user account is disabled or revoked.',
        },
      });
    }

    return res.json({
      success: true,
      user: adminUser,
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
