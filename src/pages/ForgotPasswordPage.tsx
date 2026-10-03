import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowRight, ShieldCheck, Mail, CheckCircle2, AlertCircle, Lock, Eye, EyeOff, RotateCcw, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<'request' | 'verify'>(
    searchParams.get('step') === 'code' || searchParams.get('code') ? 'verify' : 'request'
  );
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [verifyMode, setVerifyMode] = useState<'instant_login' | 'reset_password'>('instant_login');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resending code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request 6-digit code & reset link
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || `A secure 6-digit verification code has been sent to ${email.trim()}.`);
        setStep('verify');
        setResendCooldown(60);
      } else {
        setError(data.error?.message || 'Failed to issue reset code. Please try again.');
      }
    } catch {
      setError('Network connection error. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend code with cooldown
  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading || !email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`A fresh 6-digit code has been dispatched to ${email.trim()}.`);
        setResendCooldown(60);
      } else {
        setError(data.error?.message || 'Failed to resend code.');
      }
    } catch {
      setError('Error resending verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Instant 1-Time Code Login
  const handleInstantCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\D/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/login-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: cleanCode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token && data.user) {
          login(data.token, data.user);
        }
        setMessage('Code verified! Signing into your account...');
        setTimeout(() => {
          navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard');
        }, 1200);
      } else {
        setError(data.error?.message || 'Invalid or expired 6-digit code. Please verify or request a new code.');
      }
    } catch {
      setError('Connection error while verifying code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set New Password & Sign In
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\D/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: cleanCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token && data.user) {
          login(data.token, data.user);
        }
        setMessage('Password updated successfully! Logging into your dashboard...');
        setTimeout(() => {
          navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard');
        }, 1500);
      } else {
        setError(data.error?.message || 'Failed to update password. Code may have expired.');
      }
    } catch {
      setError('Connection error while updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-violet-100 p-8 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-violet-50 text-violet-600 border border-violet-200 mb-2">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-fg tracking-tight">
              {step === 'request' ? 'Reset Your Password' : 'Enter 6-Digit Code'}
            </h1>
            <p className="text-xs text-muted font-mono">
              {step === 'request'
                ? 'Enter your registered email address to receive a secure 6-digit login code and reset link.'
                : `We dispatched a 6-digit code to ${email || 'your email'}. Enter it below to proceed.`}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{message}</div>
            </div>
          )}

          {/* STEP 1: Request Code Form */}
          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fg font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send 6-Digit Code & Reset Link'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('verify'); setError(null); }}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium font-mono inline-flex items-center gap-1"
                >
                  Already have a 6-digit code? Enter code here →
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700 font-mono">
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            /* STEP 2: Enter 6-Digit Code & Sign In or Reset Password */
            <div className="space-y-4">
              
              {/* Email summary with edit button */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div className="truncate text-slate-700">
                  <span className="text-slate-400">Target: </span>
                  <strong>{email || 'No email specified'}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep('request'); setError(null); setMessage(null); }}
                  className="text-violet-600 hover:text-violet-800 font-bold ml-2 shrink-0 underline"
                >
                  Change
                </button>
              </div>

              {/* Mode Selection Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-mono">
                <button
                  type="button"
                  onClick={() => { setVerifyMode('instant_login'); setError(null); }}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                    verifyMode === 'instant_login'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Quick Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setVerifyMode('reset_password'); setError(null); }}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                    verifyMode === 'reset_password'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Set New Password
                </button>
              </div>

              {/* 6-Digit Code Input Section */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1 text-center">
                  6-Digit One-Time Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center py-3 bg-slate-50 border-2 border-violet-200 focus:border-violet-600 rounded-2xl text-xl text-fg font-mono font-black tracking-[0.5em] focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono text-muted">
                  <span>Expires in 15 minutes</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-violet-600 hover:text-violet-800 font-bold disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>

              {/* MODE 1: Quick Sign In Form */}
              {verifyMode === 'instant_login' ? (
                <form onSubmit={handleInstantCodeLogin} className="space-y-4 pt-1">
                  <button
                    type="submit"
                    disabled={loading || code.trim().length !== 6}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Verifying Code...' : 'Sign In With 6-Digit Code'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* MODE 2: Set New Password Form */
                <form onSubmit={handleResetPassword} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                      New Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fg font-mono focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fg font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.trim().length !== 6}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password & Sign In'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700 font-mono">
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Footer Security Badge */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-muted font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Single-use cryptographic OTP verification with 15-minute expiration
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
