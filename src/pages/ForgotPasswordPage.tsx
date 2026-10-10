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
    if (!email.trim() || !code.trim()) {
      setError('Please provide your email and 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/verify-code-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.error?.message || 'Invalid or expired code. Please try again.');
      }
    } catch {
      setError('Network error during instant sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set New Password via Code
  const handleResetPasswordWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim() || !newPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
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
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token && data.user) {
          login(data.token, data.user);
          navigate('/dashboard');
        } else {
          navigate('/login?reset=success');
        }
      } else {
        setError(data.error?.message || 'Password reset failed. Code may be invalid or expired.');
      }
    } catch {
      setError('Network error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-5 h-5 text-slate-100" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-700 border border-slate-200">
              <span>Account Recovery</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Reset Your Password
            </h1>
            <p className="text-xs text-[#4b5563]">
              {step === 'request'
                ? "Enter your account email to receive a 6-digit recovery code."
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {message && (
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/80 text-emerald-900 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/80 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full ui-button-brand text-xs py-2.5 font-semibold justify-center rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Recovery Code →'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Option Selector: Instant Login vs Reset Password */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#f3f4f6] rounded-lg border border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setVerifyMode('instant_login')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    verifyMode === 'instant_login'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  Instant Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMode('reset_password')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    verifyMode === 'reset_password'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  Set New Password
                </button>
              </div>

              {verifyMode === 'instant_login' ? (
                <form onSubmit={handleInstantCodeLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">
                      6-Digit Recovery Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest font-mono text-lg font-bold py-2 bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full ui-button-brand text-xs py-2.5 font-semibold justify-center rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Sign In Instantly →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordWithCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest font-mono text-base font-semibold py-2 bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full pl-9 pr-9 py-2.5 text-xs bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6 || !newPassword}
                    className="w-full ui-button-brand text-xs py-2.5 font-semibold justify-center rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password & Sign In →'}
                  </button>
                </form>
              )}

              {/* Resend and Switch */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-[#6b7280] hover:text-[#111827] font-medium"
                >
                  ← Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="text-[#1e40af] hover:text-[#1d4ed8] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#e5e7eb] text-center">
            <Link to="/login" className="text-xs text-[#6b7280] hover:text-[#111827] font-medium">
              ← Return to Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
