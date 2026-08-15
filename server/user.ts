import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from './db';
import { generateToken, authenticateJwt, requireVerifiedEmail, AuthRequest, hashPasswordScrypt, verifyPasswordScrypt } from './auth';
import { calculateKeyRollingWindow } from './window';
import { authLimiter, trialLimiter } from './rateLimit';
import {
  validateAndNormalizeEmail,
  validatePhoneNumber,
  validatePasswordPolicy,
  generateCryptographicToken,
  generateSecureOtpCode,
  hashSecret,
  recordSecurityLog
} from './authSecurity';

const router = Router();

// ============================================================================
// 1. ENTERPRISE REGISTRATION & EMAIL / PHONE VERIFICATION WORKFLOW
// ============================================================================

// POST /api/user/auth/register — Secure Registration Flow
router.post('/auth/register', authLimiter, async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  // 1. Syntactic Validation & Normalization
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: { type: 'invalid_request', message: 'Full Name is required.' } });
  }

  const emailCheck = validateAndNormalizeEmail(email);
  if (!emailCheck.isValid) {
    return res.status(400).json({ error: { type: 'invalid_email', message: emailCheck.error } });
  }
  const cleanEmail = emailCheck.email;

  let cleanPhone: string | null = null;
  if (phone) {
    const phoneCheck = validatePhoneNumber(phone);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ error: { type: 'invalid_phone', message: phoneCheck.error } });
    }
    cleanPhone = phoneCheck.phone;
  }

  const passwordCheck = validatePasswordPolicy(password);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ error: { type: 'weak_password', message: passwordCheck.error } });
  }

  try {
    // 2. Duplicate Account Check
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      await recordSecurityLog({
        email: cleanEmail,
        req,
        eventType: 'REGISTER_DUPLICATE_ATTEMPT',
        metadata: { reason: 'Email already registered' },
      });
      return res.status(400).json({ error: { type: 'duplicate_account', message: 'An account with this email address already exists.' } });
    }

    // 3. Create Pending User (emailVerified = false, status = 'unverified')
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash: hashPasswordScrypt(password),
        role: 'user',
        emailVerified: false,
        phoneVerified: false,
        status: 'unverified',
      },
    });

    // 4. Generate High-Entropy Cryptographic Verification Token (Expires in 24h)
    const { rawToken, tokenHash } = generateCryptographicToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 3600 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt: tokenExpiresAt,
      },
    });

    // 5. Generate Optional Phone OTP Code if Phone Provided (Expires in 10m)
    let rawPhoneOtp: string | null = null;
    if (cleanPhone) {
      const { rawOtp, otpHash } = generateSecureOtpCode();
      rawPhoneOtp = rawOtp;
      await prisma.phoneOtpCode.create({
        data: {
          userId: user.id,
          phone: cleanPhone,
          otpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    }

    await recordSecurityLog({
      userId: user.id,
      email: user.email,
      req,
      eventType: 'REGISTER',
      metadata: { phoneProvided: !!cleanPhone },
    });

    await recordSecurityLog({
      userId: user.id,
      email: user.email,
      req,
      eventType: 'EMAIL_VERIFICATION_SENT',
      metadata: { expiresAt: tokenExpiresAt },
    });

    // In production, token is sent via email. For developer testing visibility, return verification details safely.
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please verify your email address to activate your account.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified: false,
        status: user.status,
      },
      verification: {
        method: 'EMAIL_TOKEN',
        expiresAt: tokenExpiresAt,
        token: rawToken, // Verification link token secret
        phoneOtp: rawPhoneOtp, // Phone OTP if requested
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/user/auth/verify-email — Verify Email with Token
router.post('/auth/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: { type: 'invalid_request', message: 'Verification token is required.' } });
  }

  try {
    const tokenHash = hashSecret(token.trim());

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      return res.status(400).json({ error: { type: 'invalid_token', message: 'Invalid or expired verification token.' } });
    }

    if (record.usedAt) {
      return res.status(400).json({ error: { type: 'token_used', message: 'This verification link has already been used.' } });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: { type: 'token_expired', message: 'Verification link has expired. Please request a new verification email.' } });
    }

    if (record.attempts >= 5) {
      return res.status(400).json({ error: { type: 'too_many_attempts', message: 'Maximum verification attempts exceeded. Please request a new verification email.' } });
    }

    // Mark email as verified & activate account
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: 'active',
        },
      }),
    ]);

    await recordSecurityLog({
      userId: record.userId,
      email: record.email,
      req,
      eventType: 'EMAIL_VERIFIED',
    });

    // Create session for auto-login after verification
    const user = record.user;
    const jwtToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const sessionTokenHash = hashSecret(jwtToken);
    const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();
    const userAgent = (req.headers['user-agent'] || 'Unknown Device').substring(0, 150);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionTokenHash,
        ipAddress,
        userAgent,
        device: `${userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} Browser`,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    res.cookie('ld_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });

    res.json({
      success: true,
      message: 'Email address verified successfully! Your account is now fully active.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
        status: 'active',
      },
      token: jwtToken,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/user/auth/resend-verification — Resend Email Verification Token
router.post('/auth/resend-verification', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  const emailCheck = validateAndNormalizeEmail(email);
  if (!emailCheck.isValid) {
    return res.status(400).json({ error: { type: 'invalid_email', message: emailCheck.error } });
  }
  const cleanEmail = emailCheck.email;

  try {
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Always return generic success to prevent account enumeration
    const genericResponse = {
      success: true,
      message: 'If an unverified account with that email exists, a new verification link has been issued.',
    };

    if (!user || user.emailVerified) {
      return res.json(genericResponse);
    }

    // Rate Limit Resends (60s Cooldown)
    const recentToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (recentToken && (Date.now() - new Date(recentToken.lastSentAt).getTime()) < 60000) {
      return res.status(429).json({
        error: {
          type: 'rate_limited',
          message: 'Please wait at least 60 seconds before requesting another verification email.',
        },
      });
    }

    const { rawToken, tokenHash } = generateCryptographicToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 3600 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt: tokenExpiresAt,
        resendCount: (recentToken?.resendCount || 0) + 1,
      },
    });

    await recordSecurityLog({
      userId: user.id,
      email: user.email,
      req,
      eventType: 'EMAIL_VERIFICATION_SENT',
      metadata: { resendCount: (recentToken?.resendCount || 0) + 1 },
    });

    res.json({
      ...genericResponse,
      token: rawToken, // Provided for testing
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/user/auth/verify-phone-otp — Confirm Phone OTP Code
router.post('/auth/verify-phone-otp', async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: { message: 'Phone number and OTP code are required.' } });
  }

  const phoneCheck = validatePhoneNumber(phone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({ error: { message: phoneCheck.error } });
  }

  try {
    const otpHash = hashSecret(otp.trim());
    const record = await prisma.phoneOtpCode.findFirst({
      where: {
        phone: phoneCheck.phone,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return res.status(400).json({ error: { message: 'No pending OTP verification found for this phone number.' } });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: { message: 'OTP code has expired. Please request a new OTP.' } });
    }

    if (record.attempts >= 3) {
      return res.status(400).json({ error: { message: 'Maximum OTP attempts exceeded. Please request a new OTP.' } });
    }

    if (record.otpHash !== otpHash) {
      await prisma.phoneOtpCode.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      return res.status(400).json({ error: { message: 'Invalid OTP code. Please check and try again.' } });
    }

    await prisma.$transaction([
      prisma.phoneOtpCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      }),
    ]);

    await recordSecurityLog({
      userId: record.userId,
      req,
      eventType: 'PHONE_VERIFIED',
    });

    res.json({ success: true, message: 'Phone number verified successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ============================================================================
// 2. HARDENED LOGIN & SESSION MANAGEMENT
// ============================================================================

// POST /api/user/auth/login — Secure Login Endpoint
router.post('/auth/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { message: 'Email and password are required.' } });
  }

  const cleanEmail = email.trim().toLowerCase();
  const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || req.ip || '').split(',')[0].trim();
  const userAgent = (req.headers['user-agent'] || 'Unknown Device').substring(0, 150);

  try {
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Auto-create Master Admin if not present
    if (!user && cleanEmail === 'sidhjain9002@gmail.com' && (password === '9002' || password === 'love9002')) {
      user = await prisma.user.create({
        data: {
          name: 'LightningDeals Owner',
          email: cleanEmail,
          passwordHash: hashPasswordScrypt(password),
          role: 'admin',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: 'active',
        },
      });
    }

    const genericError = { error: { type: 'authentication_failed', message: 'Invalid email or password.' } };

    if (!user) {
      await recordSecurityLog({
        email: cleanEmail,
        req,
        eventType: 'LOGIN_FAILED',
        metadata: { reason: 'User not found' },
      });
      return res.status(401).json(genericError);
    }

    // Check Account Lockout State
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await recordSecurityLog({
        userId: user.id,
        email: user.email,
        req,
        eventType: 'LOGIN_LOCKED_ATTEMPT',
        metadata: { remainingMinutes },
      });
      return res.status(423).json({
        error: {
          type: 'account_locked',
          message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        },
      });
    }

    // Verify Password
    const isPasswordValid = verifyPasswordScrypt(password, user.passwordHash);

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil,
        },
      });

      await recordSecurityLog({
        userId: user.id,
        email: user.email,
        req,
        eventType: lockedUntil ? 'LOGIN_LOCKED' : 'LOGIN_FAILED',
        metadata: { failedAttempts },
      });

      return res.status(401).json(genericError);
    }

    // Check Account Status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: { type: 'account_suspended', message: 'Your account is suspended. Please contact support.' } });
    }

    // Check Email Verification Status
    if (!user.emailVerified && user.role !== 'admin') {
      return res.status(403).json({
        error: {
          type: 'email_unverified',
          message: 'Your email address is not verified yet. Please check your inbox or request a new verification link.',
          emailVerified: false,
        },
      });
    }

    // Reset Failed Attempts on Successful Authentication
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT & Create Server-Side UserSession Record
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const sessionTokenHash = hashSecret(token);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionTokenHash,
        ipAddress,
        userAgent,
        device: `${userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} Browser`,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    res.cookie('ld_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });

    await recordSecurityLog({
      userId: user.id,
      email: user.email,
      req,
      eventType: 'LOGIN_SUCCESS',
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/user/auth/logout — Revoke Session Server-Side & Clear Cookie
router.post('/auth/logout', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    if (req.sessionId) {
      await prisma.userSession.update({
        where: { id: req.sessionId },
        data: { isRevoked: true },
      });
    }

    await recordSecurityLog({
      userId: req.user?.id,
      email: req.user?.email,
      req,
      eventType: 'LOGOUT',
    });

    res.clearCookie('ld_token');
    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (err: any) {
    res.clearCookie('ld_token');
    res.json({ success: true });
  }
});

// GET /api/user/auth/me — Current User Session Details
router.get('/auth/me', authenticateJwt, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// GET /api/user/auth/sessions — View Active User Sessions
router.get('/auth/sessions', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId: req.user!.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        device: true,
        location: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    res.json({
      sessions: sessions.map(s => ({
        ...s,
        isCurrent: s.id === req.sessionId,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// DELETE /api/user/auth/sessions/:id — Revoke Specific Session
router.delete('/auth/sessions/:id', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.userSession.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!session) {
      return res.status(404).json({ error: { message: 'Session not found or already revoked.' } });
    }

    await prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    await recordSecurityLog({
      userId: req.user!.id,
      email: req.user!.email,
      req,
      eventType: 'SESSION_REVOKED',
      metadata: { revokedSessionId: session.id },
    });

    res.json({ success: true, message: 'Session revoked successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ============================================================================
// 3. SECURE PASSWORD RESET WORKFLOW
// ============================================================================

// POST /api/user/auth/forgot-password — Request Password Reset Link
router.post('/auth/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  const emailCheck = validateAndNormalizeEmail(email);
  if (!emailCheck.isValid) {
    return res.status(400).json({ error: { type: 'invalid_email', message: emailCheck.error } });
  }

  const genericMsg = {
    success: true,
    message: 'If an account with that email address exists, a password reset link has been issued.',
  };

  try {
    const user = await prisma.user.findUnique({ where: { email: emailCheck.email } });
    if (!user) {
      return res.json(genericMsg);
    }

    const { rawToken, tokenHash } = generateCryptographicToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiration

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt,
      },
    });

    await recordSecurityLog({
      userId: user.id,
      email: user.email,
      req,
      eventType: 'PASSWORD_RESET_REQUESTED',
    });

    res.json({
      ...genericMsg,
      token: rawToken, // Provided for testing workflow
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/user/auth/reset-password — Complete Password Reset
router.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: { message: 'Reset token and new password are required.' } });
  }

  const passwordCheck = validatePasswordPolicy(newPassword);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ error: { type: 'weak_password', message: passwordCheck.error } });
  }

  try {
    const tokenHash = hashSecret(token.trim());
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: { type: 'invalid_token', message: 'Invalid or expired password reset link.' } });
    }

    // Update Password, Revoke All Sessions, Invalidate Token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: hashPasswordScrypt(newPassword),
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.userSession.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      }),
    ]);

    await recordSecurityLog({
      userId: resetRecord.userId,
      email: resetRecord.email,
      req,
      eventType: 'PASSWORD_RESET_COMPLETED',
    });

    res.json({
      success: true,
      message: 'Password reset successfully! All existing sessions have been revoked. Please sign in with your new password.',
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ============================================================================
// 4. API KEY & TOKEN MANAGEMENT (VERIFIED USERS ONLY)
// ============================================================================

// POST /api/user/keys — Generate API Key (Requires Verified Email)
router.post('/keys', authenticateJwt, requireVerifiedEmail, async (req: AuthRequest, res: Response) => {
  const { name, plan } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: { message: 'API key name is required.' } });
  }

  try {
    const rawKey = 'ld_live_' + crypto.randomBytes(24).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const displayKey = `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`;

    const key = await prisma.apiKey.create({
      data: {
        userId: req.user!.id,
        keyPrefix: 'ld_live_',
        keyHash,
        displayKey,
        name: name.trim(),
        purchasedTokens: BigInt(1000000),
        tokensRemaining: BigInt(1000000),
        plan: plan || 'Prepaid',
      },
    });

    await recordSecurityLog({
      userId: req.user!.id,
      email: req.user!.email,
      req,
      eventType: 'API_KEY_CREATED',
      metadata: { apiKeyId: key.id, keyPrefix: key.keyPrefix },
    });

    res.status(201).json({
      key: {
        ...key,
        purchasedTokens: key.purchasedTokens.toString(),
        tokensUsed: key.tokensUsed.toString(),
        tokensRemaining: key.tokensRemaining.toString(),
        totalInputTokens: key.totalInputTokens.toString(),
        totalOutputTokens: key.totalOutputTokens.toString(),
        secretKey: rawKey, // Exposed ONCE on creation
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/user/keys — List User's Own API Keys (IDOR Protected)
router.get('/keys', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      keys: keys.map((k) => ({
        ...k,
        purchasedTokens: k.purchasedTokens.toString(),
        tokensUsed: k.tokensUsed.toString(),
        tokensRemaining: k.tokensRemaining.toString(),
        totalInputTokens: k.totalInputTokens.toString(),
        totalOutputTokens: k.totalOutputTokens.toString(),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// DELETE /api/user/keys/:id — Revoke User's API Key (IDOR Protected)
router.delete('/keys/:id', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const key = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!key) {
      return res.status(404).json({ error: { message: 'API key not found or unauthorized.' } });
    }

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { status: 'revoked' },
    });

    await recordSecurityLog({
      userId: req.user!.id,
      email: req.user!.email,
      req,
      eventType: 'API_KEY_REVOKED',
      metadata: { apiKeyId: key.id },
    });

    res.json({ success: true, message: 'API key revoked successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/user/plan — Get Current User Plan Details (Derived strictly from req.user.id)
router.get('/plan', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.id, status: 'active' },
    });

    let totalWindowAllowance = 0n;
    let totalRemaining = 0n;
    keys.forEach((k) => {
      totalWindowAllowance += k.purchasedTokens;
      totalRemaining += k.tokensRemaining;
    });

    res.json({
      planName: keys.length > 0 ? (keys[0].plan || 'Enterprise 5M/5H Rolling Gateway') : 'Standard 5M Rolling Gateway',
      status: req.user!.emailVerified ? 'active' : 'pending_verification',
      windowAllowance: totalWindowAllowance > 0n ? totalWindowAllowance.toString() : '5000000',
      tokensRemaining: totalRemaining > 0n ? totalRemaining.toString() : '5000000',
      activeKeysCount: keys.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 5. Risk-Scored Trial Anti-Abuse Key Claim (/api/trial/claim)
router.post('/trial/claim', trialLimiter, async (req: Request, res: Response) => {
  const { email, name, deviceHash } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const existingCookie = req.cookies?.ld_trial_id;

  const emailCheck = validateAndNormalizeEmail(email);
  if (!emailCheck.isValid) {
    return res.status(400).json({ error: { message: 'Valid email address required for trial verification.' } });
  }

  try {
    let riskScore = 0;
    const existingEmailClaim = await prisma.trialClaim.findFirst({ where: { email: emailCheck.email } });
    if (existingEmailClaim) riskScore += 60;
    if (existingCookie) riskScore += 50;

    const ipTrialCount = await prisma.trialClaim.count({ where: { ipAddress: String(ipAddress) } });
    if (ipTrialCount >= 2) riskScore += 40;

    if (riskScore >= 50) {
      await prisma.trialClaim.create({
        data: {
          email: emailCheck.email,
          ipAddress: String(ipAddress),
          deviceHash,
          riskScore,
          decision: 'REJECTED',
        },
      });

      return res.status(403).json({
        error: {
          type: 'trial_abuse_prevention',
          message: 'Trial eligibility could not be verified for this request.',
        },
      });
    }

    const rawKey = 'ld_trial_' + crypto.randomBytes(18).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const displayKey = `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const key = await prisma.apiKey.create({
      data: {
        keyPrefix: 'ld_trial_',
        keyHash,
        displayKey,
        name: `Trial Key - ${emailCheck.email.split('@')[0]}`,
        type: 'trial',
        purchasedTokens: BigInt(1000000),
        tokensRemaining: BigInt(1000000),
        expiresAt,
        plan: 'Trial',
      },
    });

    await prisma.trialClaim.create({
      data: {
        email: emailCheck.email,
        ipAddress: String(ipAddress),
        deviceHash,
        riskScore,
        decision: 'APPROVED',
        apiKeyId: key.id,
      },
    });

    res.cookie('ld_trial_id', key.id, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 24 * 3600 * 1000 });

    res.json({
      key: {
        id: key.id,
        displayKey: key.displayKey,
        secretKey: rawKey,
        expiresAt: key.expiresAt,
        purchasedTokens: key.purchasedTokens.toString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

export default router;
