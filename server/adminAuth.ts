import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma, encryptText, decryptText } from './db';
import { createRateLimiter, clearAuthRateLimit, resolveClientIp } from './rateLimit';
import { AuthRequest, authenticateJwt, requireAdmin, verifyPasswordScrypt, hashPasswordScrypt } from './auth';
import {
  generateTotpSecret,
  verifyTotpCode,
  generateOtpAuthUrl,
  generateBackupCodes,
  verifyBackupCode,
  getAdminMfaConfig,
  saveAdminMfaConfig,
  deleteAdminMfaConfig,
} from './totp';
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

// GET /api/admin/auth/setup-status - Check if initial administrator exists
router.get('/setup-status', async (req: Request, res: Response) => {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'admin', status: 'active' },
    });
    return res.json({ isConfigured: adminCount > 0 });
  } catch (err: any) {
    return res.status(500).json({ error: { message: 'Failed to verify admin status.' } });
  }
});

// POST /api/admin/auth/bootstrap - One-time initial owner admin setup (only allowed when 0 admins exist)
router.post('/bootstrap', adminLoginLimiter, async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const clientIp = (req.ip || (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1');

  try {
    const adminCount = await prisma.user.count({
      where: { role: 'admin', status: 'active' },
    });

    if (adminCount > 0) {
      return res.status(403).json({
        error: {
          type: 'initial_setup_disabled',
          message: 'Initial administrator setup is disabled. An active administrator account already exists.',
        },
      });
    }

    if (!email || !password || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        error: {
          type: 'invalid_request',
          message: 'A valid administrator email and password are required.',
        },
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        error: {
          type: 'weak_password',
          message: 'Administrator password must be at least 12 characters long.',
        },
      });
    }

    if (BANNED_COMPROMISED_PASSWORDS.has(password.toLowerCase())) {
      return res.status(400).json({
        error: {
          type: 'banned_password',
          message: 'The chosen password is too common or compromised. Please choose a strong, unique password.',
        },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'System Administrator';
    const passwordHash = hashPasswordScrypt(password);

    const newAdmin = await prisma.user.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        role: 'admin',
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordChangedAt: new Date(),
      },
      update: {
        name: cleanName,
        passwordHash,
        role: 'admin',
        status: 'active',
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Generate Admin JWT Token
    const token = jwt.sign(
      {
        id: newAdmin.id,
        email: newAdmin.email,
        role: 'admin',
        authType: 'ADMIN_SESSION',
      },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    const tokenHash = hashSecret(token);
    await prisma.userSession.create({
      data: {
        userId: newAdmin.id,
        sessionTokenHash: tokenHash,
        ipAddress: clientIp,
        userAgent: (req.headers['user-agent'] || 'Admin Console Setup').substring(0, 200),
        device: 'Admin Console Initial Setup',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    await recordAuditEvent({
      eventType: 'ADMIN_INITIAL_PROVISIONED',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: newAdmin.id,
      actorEmail: newAdmin.email,
      adminId: newAdmin.id,
      action: 'BOOTSTRAP_ADMIN',
      result: 'SUCCESS',
      statusCode: 200,
      req,
    });

    return res.json({
      success: true,
      message: 'Administrator account configured successfully.',
      token,
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    });
  } catch (err: any) {
    console.error('[AdminBootstrap] Error configuring admin:', err);
    return res.status(500).json({
      error: {
        type: 'internal_error',
        message: 'An error occurred during initial administrator setup.',
      },
    });
  }
});

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

    // Check if 2FA (MFA/TOTP) is enrolled for this administrator
    const mfaConfig = await getAdminMfaConfig(adminUser.id);
    if (mfaConfig && mfaConfig.enrolled) {
      const mfaTicket = jwt.sign(
        {
          id: adminUser.id,
          email: adminUser.email,
          role: 'admin',
          authType: 'ADMIN_MFA_CHALLENGE',
        },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: '5m' }
      );

      await recordAuditEvent({
        eventType: 'ADMIN_MFA_CHALLENGED',
        severity: 'INFO',
        actorType: 'ADMIN',
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        adminId: adminUser.id,
        action: 'MFA_CHALLENGE',
        result: 'PENDING_MFA',
        statusCode: 200,
        req,
      });

      return res.json({
        success: false,
        mfaRequired: true,
        mfaTicket,
        message: 'Two-factor authentication code required.',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
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
        mfaEnrolled: false,
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

    if (typeof decoded.iat !== 'number' || isNaN(decoded.iat) || decoded.iat <= 0) {
      return res.status(401).json({
        error: {
          type: 'invalid_token',
          message: 'Malformed token: missing or invalid issuance timestamp.',
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

    // Invalidate sessions issued before incident security epoch
    const securityEpoch = getSecurityEpoch();
    if (securityEpoch > 0) {
      const issuedAtMs = decoded.iat * 1000;
      if (issuedAtMs < securityEpoch) {
        return res.status(401).json({
          error: {
            type: 'session_invalidated',
            message: 'Admin session invalidated by security epoch policy. Please sign in again.',
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


// POST /api/admin/auth/mfa/verify - Verify TOTP code or backup recovery code during login
router.post('/mfa/verify', adminLoginLimiter, async (req: Request, res: Response) => {
  const { mfaTicket, code, recoveryCode } = req.body;
  const clientIp = resolveClientIp(req);

  if (!mfaTicket || (!code && !recoveryCode)) {
    return res.status(400).json({
      error: {
        type: 'invalid_request',
        message: 'MFA ticket and 6-digit verification code or recovery code are required.',
      },
    });
  }

  let decodedTicket: any;
  try {
    decodedTicket = jwt.verify(mfaTicket, getJwtSecret(), { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({
      error: {
        type: 'mfa_ticket_expired',
        message: 'MFA verification session expired. Please sign in again with your password.',
      },
    });
  }

  if (decodedTicket.authType !== 'ADMIN_MFA_CHALLENGE' || !decodedTicket.id) {
    return res.status(401).json({
      error: {
        type: 'invalid_mfa_ticket',
        message: 'Invalid MFA verification challenge ticket.',
      },
    });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: decodedTicket.id },
  });

  if (!adminUser || adminUser.role !== 'admin' || adminUser.status !== 'active') {
    return res.status(403).json({
      error: {
        type: 'forbidden',
        message: 'Admin user account is disabled or unauthorized.',
      },
    });
  }

  const mfaConfig = await getAdminMfaConfig(adminUser.id);
  if (!mfaConfig || !mfaConfig.enrolled) {
    return res.status(400).json({
      error: {
        type: 'mfa_not_enrolled',
        message: 'Two-factor authentication is not enrolled for this account.',
      },
    });
  }

  let isVerified = false;
  let verificationMethod = 'TOTP';

  if (recoveryCode) {
    const recoveryIdx = verifyBackupCode(recoveryCode, mfaConfig.backupCodes.map((b) => b.hash));
    if (recoveryIdx !== -1 && !mfaConfig.backupCodes[recoveryIdx].used) {
      isVerified = true;
      verificationMethod = 'RECOVERY_CODE';
      mfaConfig.backupCodes[recoveryIdx].used = true;
      mfaConfig.backupCodes[recoveryIdx].usedAt = new Date().toISOString();
      await saveAdminMfaConfig(adminUser.id, mfaConfig);
    }
  } else if (code) {
    const secret = decryptText(mfaConfig.secretEncrypted);
    const totpResult = verifyTotpCode(secret, code, mfaConfig.lastUsedStep);
    if (totpResult.valid && totpResult.matchedStep) {
      isVerified = true;
      mfaConfig.lastUsedStep = totpResult.matchedStep;
      await saveAdminMfaConfig(adminUser.id, mfaConfig);
    }
  }

  if (!isVerified) {
    await prisma.adminLog.create({
      data: {
        adminUserId: adminUser.id,
        action: 'ADMIN_MFA_FAILED',
        targetType: 'Auth',
        targetId: adminUser.id,
        metadata: JSON.stringify({ ip: clientIp, method: recoveryCode ? 'RECOVERY_CODE' : 'TOTP' }),
      },
    });

    return res.status(401).json({
      error: {
        type: 'invalid_mfa_code',
        message: recoveryCode
          ? 'Invalid or already used backup recovery code.'
          : 'Invalid 6-digit authentication code. Please check your authenticator app.',
      },
    });
  }

  // MFA verified successfully -> Clear IP rate limit and Issue 24h admin session token
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

  const tokenHash = hashSecret(token);
  await prisma.userSession.create({
    data: {
      userId: adminUser.id,
      sessionTokenHash: tokenHash,
      ipAddress: clientIp,
      userAgent: (req.headers['user-agent'] || 'Admin Console').substring(0, 200),
      device: 'Admin Console (MFA Verified)',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
      failedLoginAttempts: 0,
    },
  }).catch(() => {});

  await prisma.adminLog.create({
    data: {
      adminUserId: adminUser.id,
      action: 'ADMIN_LOGIN_SUCCESS_MFA',
      targetType: 'Auth',
      targetId: adminUser.id,
      metadata: JSON.stringify({ ip: clientIp, method: verificationMethod }),
    },
  });

  await recordAuditEvent({
    eventType: 'ADMIN_LOGIN_SUCCESS',
    severity: 'INFO',
    actorType: 'ADMIN',
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    adminId: adminUser.id,
    action: 'ADMIN_LOGIN_MFA',
    result: 'SUCCESS',
    statusCode: 200,
    metadata: { method: verificationMethod },
    req,
  });

  return res.json({
    success: true,
    token,
    user: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      mfaEnrolled: true,
    },
  });
});

// GET /api/admin/auth/mfa/status - Get current administrator MFA enrollment status
router.get('/mfa/status', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  const mfaConfig = await getAdminMfaConfig(req.user!.id);
  const enrolled = Boolean(mfaConfig?.enrolled);
  const remainingBackups = mfaConfig?.backupCodes?.filter((b) => !b.used).length || 0;
  return res.json({
    enrolled,
    enrolledAt: mfaConfig?.enrolledAt || null,
    remainingBackups,
  });
});

// POST /api/admin/auth/mfa/setup - Start 2FA enrollment (generates secret, QR URI, and backup codes)
router.post('/mfa/setup', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  const secret = generateTotpSecret();
  const otpAuthUrl = generateOtpAuthUrl(req.user!.email, secret);
  const { plaintextCodes, hashedCodes } = generateBackupCodes(8);

  return res.json({
    success: true,
    secret,
    otpAuthUrl,
    backupCodes: plaintextCodes,
    hashedCodes,
  });
});

// POST /api/admin/auth/mfa/activate - Verify first code and finalize 2FA enrollment
router.post('/mfa/activate', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { secret, code, hashedCodes } = req.body;

  if (!secret || !code || !Array.isArray(hashedCodes) || hashedCodes.length === 0) {
    return res.status(400).json({
      error: {
        type: 'invalid_request',
        message: 'Secret, 6-digit confirmation code, and hashed backup codes are required.',
      },
    });
  }

  const verify = verifyTotpCode(secret, code);
  if (!verify.valid || !verify.matchedStep) {
    return res.status(400).json({
      error: {
        type: 'invalid_totp_code',
        message: 'The 6-digit verification code is invalid. Please verify the code in your authenticator app and try again.',
      },
    });
  }

  const secretEncrypted = encryptText(secret);
  const backupCodes = hashedCodes.map((h: string) => ({ hash: h, used: false }));

  await saveAdminMfaConfig(req.user!.id, {
    enrolled: true,
    secretEncrypted,
    backupCodes,
    enrolledAt: new Date().toISOString(),
    lastUsedStep: verify.matchedStep,
  });

  await recordAuditEvent({
    eventType: 'ADMIN_MFA_ENROLLED',
    severity: 'HIGH',
    actorType: 'ADMIN',
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    adminId: req.user!.id,
    action: 'MFA_ENROLL',
    result: 'SUCCESS',
    statusCode: 200,
    req,
  });

  return res.json({
    success: true,
    message: 'Two-factor authentication has been activated successfully for your administrator account.',
  });
});

// POST /api/admin/auth/mfa/disable - Disable 2FA with current password confirmation
router.post('/mfa/disable', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      error: {
        type: 'invalid_request',
        message: 'Current administrator password is required to disable 2FA.',
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return res.status(401).json({
      error: {
        type: 'invalid_password',
        message: 'Incorrect password. Cannot disable 2FA.',
      },
    });
  }

  await deleteAdminMfaConfig(req.user!.id);

  await recordAuditEvent({
    eventType: 'ADMIN_MFA_DISABLED',
    severity: 'HIGH',
    actorType: 'ADMIN',
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    adminId: req.user!.id,
    action: 'MFA_DISABLE',
    result: 'SUCCESS',
    statusCode: 200,
    req,
  });

  return res.json({
    success: true,
    message: 'Two-factor authentication has been disabled.',
  });
});

export default router;

