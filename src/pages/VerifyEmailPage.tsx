import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState(emailParam);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify if rawToken is present in URL from email click
  const verifyToken = async (tokenToVerify: string) => {
    setVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Verification failed. The link may be invalid or expired.');
      }
    } catch (err: any) {
      setError('Error connecting to verification server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Verify 6-digit code entered in UI
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !emailInput.trim()) {
      setError('Please enter your email and 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), code: otpCode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Invalid verification code. Please check and try again.');
      }
    } catch (err: any) {
      setError('Network error connecting to verification gateway.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    const targetEmail = emailInput || emailParam;
    if (!targetEmail) {
      setError('Email address is required to resend verification.');
      return;
    }
    setResending(true);
    setResendMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setResendMessage(data.message || 'Verification email resent! Check your inbox.');
        setResendCooldown(data.waitSeconds || 60);
      } else {
        setError(data.error?.message || 'Failed to resend verification email.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="max-w-md w-full bg-card border border-border rounded-panel p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className={`p-4 rounded-3xl ${success ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : error ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-violet-50 text-violet-600 border border-violet-200'}`}>
              {success ? <CheckCircle2 className="w-10 h-10" /> : error ? <AlertCircle className="w-10 h-10" /> : <Mail className="w-10 h-10 animate-bounce" />}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-fg tracking-tight">
              {success ? 'Email Verified Successfully!' : 'Verify Your Email Address'}
            </h1>
            <p className="text-xs text-muted font-mono mt-2 leading-relaxed">
              {success
                ? 'Your LightningDeals account is now active! You can now access your customer dashboard and API keys.'
                : 'Enter the 6-digit verification code sent to your inbox or click the link in your verification email.'}
            </p>
          </div>

          {verifying && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-violet-600 py-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Verifying security credentials...
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono text-left">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="p-3.5 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono text-left">
              {resendMessage}
            </div>
          )}

          {success ? (
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:brightness-110 transition-all"
            >
              Continue to Customer Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            !tokenParam && (
              <form onSubmit={handleCodeSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-bg border border-border rounded-control text-fg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">6-Digit Verification Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-9 pr-4 py-2.5 text-center font-mono font-bold text-lg tracking-widest bg-bg border border-border rounded-control text-fg focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || !otpCode || otpCode.length < 6}
                  className="w-full py-3 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-all disabled:opacity-50"
                >
                  {verifying ? 'Verifying Code...' : 'Verify Code & Activate Account →'}
                </button>
              </form>
            )
          )}

          {!success && (
            <div className="space-y-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="w-full py-2.5 rounded-control bg-subtle hover:bg-border text-fg text-xs font-bold transition-all disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend Available in ${resendCooldown}s` : resending ? 'Resending...' : 'Resend Verification Email'}
              </button>

              <div className="flex items-center justify-between text-xs font-mono text-muted">
                <Link to="/register" className="hover:text-violet-600">← Back to Signup</Link>
                <Link to="/login" className="hover:text-violet-600">Sign In →</Link>
              </div>
            </div>
          )}

          <div className="pt-2 text-[11px] text-muted font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Cryptographic Email & State Machine Verification
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmailPage;
