import nodemailer from 'nodemailer';
import { recordSecurityLog } from './authSecurity';

export interface EmailProviderStatus {
  activeProvider: 'RESEND' | 'SENDGRID' | 'SMTP' | 'DEVELOPMENT_LOG';
  isConfigured: boolean;
  fromAddress: string;
  baseUrl: string;
  statusMessage: string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'LightningDeals <support@lightningapi.pro>';
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.VITE_APP_URL || 'https://lightningapi.pro';

// Get current email provider health & configuration status
export function getEmailProviderStatus(): EmailProviderStatus {
  if (process.env.RESEND_API_KEY) {
    return {
      activeProvider: 'RESEND',
      isConfigured: true,
      fromAddress: DEFAULT_FROM,
      baseUrl: APP_BASE_URL,
      statusMessage: 'Resend Transactional HTTP API Active',
    };
  }

  if (process.env.SENDGRID_API_KEY) {
    return {
      activeProvider: 'SENDGRID',
      isConfigured: true,
      fromAddress: DEFAULT_FROM,
      baseUrl: APP_BASE_URL,
      statusMessage: 'SendGrid Transactional API Active',
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return {
      activeProvider: 'SMTP',
      isConfigured: true,
      fromAddress: DEFAULT_FROM,
      baseUrl: APP_BASE_URL,
      statusMessage: `SMTP Active (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`,
    };
  }

  return {
    activeProvider: 'DEVELOPMENT_LOG',
    isConfigured: false,
    fromAddress: DEFAULT_FROM,
    baseUrl: APP_BASE_URL,
    statusMessage: 'No Production Email API Key set (RESEND_API_KEY / SMTP). Operating in secure verification mode.',
  };
}

// Generate Enterprise HTML Verification Email Template
function generateVerificationEmailHtml(name: string, rawToken: string, otpCode: string): string {
  const verifyUrl = `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your LightningDeals Account</title>
  <style>
    body { margin: 0; padding: 0; background-color: #07090E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .logo-badge { display: inline-flex; items-center: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #7C3AED, #4F46E5); border-radius: 12px; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 800; margin: 0 0 12px 0; color: #F8FAFC; letter-spacing: -0.5px; }
    p { font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 0 0 24px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #6366F1); color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4); margin-bottom: 32px; }
    .code-box { background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .code-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748B; margin-bottom: 8px; }
    .code-digits { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38BDF8; }
    .expiry-note { font-size: 12px; color: #64748B; margin-top: 24px; border-top: 1px solid #1E293B; padding-top: 20px; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo-badge">
        <span style="color: #ffffff; font-size: 24px; font-weight: bold;">⚡</span>
      </div>
      <h1>Verify your email address</h1>
      <p>Welcome to <strong>LightningDeals</strong>, ${escapeHtml(name)}! Please verify your email address to activate your account and access high-speed Claude Code API infrastructure.</p>
      
      <a href="${verifyUrl}" class="btn" target="_blank">VERIFY MY EMAIL →</a>

      <div class="code-box">
        <div class="code-title">Or enter 6-Digit Verification Code</div>
        <div class="code-digits">${otpCode}</div>
      </div>

      <div class="expiry-note">
        🔒 This verification link and 6-digit code expire in <strong>15 minutes</strong> and can only be used once. If you did not sign up for LightningDeals, please ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 LightningDeals Inc. Universal AI Gateway & Key Infrastructure.
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface SendEmailOptions {
  email: string;
  name: string;
  rawToken: string;
  otpCode: string;
}

export interface SendEmailResult {
  success: boolean;
  providerUsed: string;
  messageId?: string;
  error?: string;
}

// Internal Enterprise Multi-Provider Transactional Dispatcher
interface DispatchEmailOptions {
  email: string;
  subject: string;
  htmlContent: string;
  contextName: string;
  devDetails?: {
    token?: string;
    code?: string;
    link?: string;
  };
}

async function dispatchEmailTransport(options: DispatchEmailOptions): Promise<SendEmailResult> {
  const { email, subject, htmlContent, contextName, devDetails } = options;
  let lastError = '';

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      let resendFrom = 'LightningDeals <support@lightningapi.pro>';
      if (process.env.EMAIL_FROM) {
        resendFrom = process.env.EMAIL_FROM;
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [email],
          subject,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        return { success: true, providerUsed: 'RESEND', messageId: data.id };
      }

      const resendMsg = data.message || data.error?.message || JSON.stringify(data);
      console.warn(`[EMAIL DELIVERY WARNING] Resend initial attempt for ${email} failed: ${resendMsg}`);

      // If domain verification failed on Resend (e.g. sending from unverified domain), try fallback to onboarding@resend.dev
      if (res.status === 403 || resendMsg.toLowerCase().includes('domain') || resendMsg.toLowerCase().includes('verify')) {
        console.info(`[EMAIL DELIVERY] Resend custom domain restricted. Retrying with onboarding@resend.dev...`);
        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'LightningDeals <onboarding@resend.dev>',
            to: [email],
            subject,
            html: htmlContent,
          }),
        });
        const retryData = await retryRes.json();
        if (retryRes.ok && retryData.id) {
          return { success: true, providerUsed: 'RESEND', messageId: retryData.id };
        }
      }

      lastError = `Resend API Error: ${resendMsg}`;
      console.error(`[EMAIL DELIVERY ERROR] Resend ${contextName} failed:`, resendMsg);
    } catch (err: any) {
      console.error(`[EMAIL DELIVERY ERROR] Resend fetch exception:`, err.message);
      lastError = `Resend exception: ${err.message}`;
    }
  }

  // 2. SendGrid API Fallback
  if (process.env.SENDGRID_API_KEY) {
    try {
      const fromEmail = process.env.EMAIL_FROM?.includes('<')
        ? process.env.EMAIL_FROM.match(/<([^>]+)>/)?.[1]
        : (process.env.EMAIL_FROM || 'support@lightningapi.pro');

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });

      if (res.ok) {
        return { success: true, providerUsed: 'SENDGRID' };
      }
      const sgErr = await res.text();
      console.error(`[EMAIL DELIVERY ERROR] SendGrid failed (${res.status}):`, sgErr);
      lastError = `SendGrid Error (${res.status}): ${sgErr}`;
    } catch (err: any) {
      console.error(`[EMAIL DELIVERY ERROR] SendGrid exception:`, err.message);
      lastError = `SendGrid exception: ${err.message}`;
    }
  }

  // 3. SMTP Transport via Nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: DEFAULT_FROM,
        to: email,
        subject,
        html: htmlContent,
      });

      return { success: true, providerUsed: 'SMTP', messageId: info.messageId };
    } catch (err: any) {
      console.error(`[EMAIL DELIVERY ERROR] SMTP Nodemailer exception:`, err.message);
      lastError = `SMTP exception: ${err.message}`;
    }
  }

  // 4. Fallback: Development Mode only
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n==================================================`);
    console.log(`[DEV ${contextName.toUpperCase()} EMAIL LOG] To: ${email}`);
    console.log(`Subject: ${subject}`);
    if (devDetails?.token) console.log(`Token: ${devDetails.token}`);
    if (devDetails?.code) console.log(`6-Digit Code: ${devDetails.code}`);
    if (devDetails?.link) console.log(`Action Link: ${devDetails.link}`);
    console.log(`==================================================\n`);

    return {
      success: true,
      providerUsed: 'DEVELOPMENT_LOG',
      messageId: `dev-log-${Date.now()}`,
    };
  }

  // Production Fail-Closed Safety: Return exact diagnostic error
  return {
    success: false,
    providerUsed: 'NONE',
    error: lastError || 'Transactional email provider is not configured. Please add RESEND_API_KEY, SENDGRID_API_KEY, or SMTP credentials in your server environment settings.',
  };
}

// Enterprise Multi-Provider Transactional Email Dispatcher for Verification
export async function sendVerificationEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { email, name, rawToken, otpCode } = options;
  const htmlContent = generateVerificationEmailHtml(name, rawToken, otpCode);
  const subject = '⚡ Verify Your LightningDeals Account';
  const verifyUrl = `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;

  return dispatchEmailTransport({
    email,
    subject,
    htmlContent,
    contextName: 'Verification',
    devDetails: {
      token: rawToken,
      code: otpCode,
      link: verifyUrl,
    },
  });
}

function generatePasswordResetEmailHtml(name: string, resetUrl: string, otpCode: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your LightningDeals Password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #07090E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; padding: 40px; text-align: center; }
    .logo-badge { display: inline-flex; items-center: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #7C3AED, #4F46E5); border-radius: 12px; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 800; color: #F8FAFC; margin-bottom: 12px; }
    p { font-size: 14px; color: #94A3B8; margin-bottom: 24px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #6366F1); color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; margin-bottom: 32px; }
    .code-box { background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .code-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 8px; }
    .code-digits { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38BDF8; }
    .expiry-note { font-size: 12px; color: #64748B; margin-top: 24px; border-top: 1px solid #1E293B; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo-badge"><span style="color: #ffffff; font-size: 24px;">⚡</span></div>
      <h1>Password Reset Requested</h1>
      <p>Hello ${escapeHtml(name)}, we received a request to reset your LightningDeals account password. Click below to set a new password:</p>
      <a href="${resetUrl}" class="btn" target="_blank">RESET MY PASSWORD →</a>
      <div class="code-box">
        <div class="code-title">Or enter 6-Digit Password Reset Code</div>
        <div class="code-digits">${otpCode}</div>
      </div>
      <div class="expiry-note">
        🔒 This single-use reset link and 6-digit code expire in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Enterprise Multi-Provider Transactional Email Dispatcher for Password Reset
export async function sendPasswordResetEmail(options: { email: string; name: string; rawToken: string; otpCode: string }): Promise<SendEmailResult> {
  const { email, name, rawToken, otpCode } = options;
  const resetUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const subject = '🔒 Reset Your LightningDeals Password';
  const htmlContent = generatePasswordResetEmailHtml(name, resetUrl, otpCode);

  return dispatchEmailTransport({
    email,
    subject,
    htmlContent,
    contextName: 'Password Reset',
    devDetails: {
      token: rawToken,
      code: otpCode,
      link: resetUrl,
    },
  });
}
