import nodemailer from 'nodemailer';
import { recordSecurityLog } from './authSecurity';

export interface EmailProviderStatus {
  activeProvider: 'RESEND' | 'SENDGRID' | 'SMTP' | 'DEVELOPMENT_LOG';
  isConfigured: boolean;
  fromAddress: string;
  baseUrl: string;
  statusMessage: string;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'LightningDeals <onboarding@resend.dev>';
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
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; h-8; height: 48px; background: linear-gradient(135deg, #7C3AED, #4F46E5); border-radius: 12px; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 800; margin: 0 0 12px 0; color: #F8FAFC; letter-spacing: -0.5px; }
    p { font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 0 0 24px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7C3AED, #6366F1); color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4); margin-bottom: 32px; }
    .code-box { background: #020617; border: 1px border #334155; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
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

// Enterprise Multi-Provider Transactional Email Dispatcher
export async function sendVerificationEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { email, name, rawToken, otpCode } = options;
  const htmlContent = generateVerificationEmailHtml(name, rawToken, otpCode);
  const subject = '⚡ Verify Your LightningDeals Account';

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      let fromAddress = DEFAULT_FROM;
      let res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject,
          html: htmlContent,
        }),
      });

      let data = await res.json();
      
      // Fallback retry with onboarding@resend.dev if custom domain is not yet verified on Resend
      if (!res.ok && fromAddress !== 'LightningDeals <onboarding@resend.dev>') {
        console.warn('[RESEND WARNING] Retrying with onboarding@resend.dev fallback domain...');
        res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
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
        data = await res.json();
      }

      if (res.ok && data.id) {
        return { success: true, providerUsed: 'RESEND', messageId: data.id };
      }
      console.error('[EMAIL DELIVERY ERROR] Resend API failed:', data);
    } catch (err: any) {
      console.error('[EMAIL DELIVERY ERROR] Resend fetch exception:', err.message);
    }
  }

  // 2. SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: DEFAULT_FROM.includes('<') ? DEFAULT_FROM.match(/<([^>]+)>/)?.[1] : DEFAULT_FROM },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });

      if (res.ok) {
        return { success: true, providerUsed: 'SENDGRID' };
      }
    } catch (err: any) {
      console.error('[EMAIL DELIVERY ERROR] SendGrid exception:', err.message);
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
      console.error('[EMAIL DELIVERY ERROR] SMTP Nodemailer exception:', err.message);
    }
  }

  // 4. Fallback: Development Mode only
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n==================================================`);
    console.log(`[DEV VERIFICATION EMAIL LOG] To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification Token: ${rawToken}`);
    console.log(`6-Digit OTP Code: ${otpCode}`);
    console.log(`Verify Link: ${APP_BASE_URL}/verify-email?token=${rawToken}`);
    console.log(`==================================================\n`);

    return {
      success: true,
      providerUsed: 'DEVELOPMENT_LOG',
      messageId: `dev-log-${Date.now()}`,
    };
  }

  // Production Fail-Closed Safety: Do NOT pretend email was sent if provider credentials are missing
  return {
    success: false,
    providerUsed: 'NONE',
    error: 'Transactional email provider is not configured. Please add RESEND_API_KEY, SENDGRID_API_KEY, or SMTP credentials in your server environment settings.',
  };
}
