import crypto from 'crypto';
import { Request } from 'express';
import { prisma } from './db';

// 1. Email Normalization & Validation
export function validateAndNormalizeEmail(rawEmail: string): { isValid: boolean; email: string; error?: string } {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { isValid: false, email: '', error: 'Email address is required.' };
  }

  const cleanEmail = rawEmail.trim().toLowerCase();

  if (cleanEmail.length < 5 || cleanEmail.length > 254) {
    return { isValid: false, email: '', error: 'Email length must be between 5 and 254 characters.' };
  }

  // Strict RFC 5322 Compliant Email Syntax Regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, email: '', error: 'Please provide a valid, well-formed email address.' };
  }

  return { isValid: true, email: cleanEmail };
}

// 2. Phone Number Validation (E.164 Format)
export function validatePhoneNumber(rawPhone: string): { isValid: boolean; phone: string; error?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, phone: '', error: 'Phone number is required.' };
  }

  const cleanPhone = rawPhone.trim().replace(/[\s\-\(\)]/g, '');

  // E.164 International Format Regex (+1234567890)
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, phone: '', error: 'Phone number must be in E.164 format with country code (e.g. +14155552671 or +919876543210).' };
  }

  return { isValid: true, phone: cleanPhone };
}

// 3. Password Strength & Policy Validation
export function validatePasswordPolicy(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required.' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters.' };
  }

  // Reject top common compromised passwords
  const weakPasswords = [
    '123456', '12345678', 'password', 'password123', 'admin123',
    'welcome', 'letmein', 'monkey', 'dragon', 'master', 'lightningdeals'
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Password is too common and easily guessable. Please choose a stronger passphrase.' };
  }

  return { isValid: true };
}

// 4. Cryptographic High-Entropy Tokens & Hashing
export function generateCryptographicToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex'); // 64 chars high-entropy secret
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// Cryptographically secure 6-digit OTP generator
export function generateSecureOtpCode(): { rawOtp: string; otpHash: string } {
  const otpNumber = crypto.randomInt(100000, 999999);
  const rawOtp = otpNumber.toString();
  const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
  return { rawOtp, otpHash };
}

// 5. Security Audit Logger
export async function recordSecurityLog(params: {
  userId?: string | null;
  email?: string | null;
  req?: Request;
  eventType: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { userId, email, req, eventType, metadata } = params;
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
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error('[SECURITY LOG ERROR]', err);
  }
}
