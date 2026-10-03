import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Mail, KeyRound } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';

  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<'token' | 'code'>(initialToken ? 'token' : 'code');
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: { token?: string; code?: string; email?: string; newPassword: string } = {
      newPassword,
    };

    if (mode === 'token') {
      if (!token.trim()) {
        setError('Password reset token is missing. Please click the link in your email or enter your 6-digit code below.');
        return;
      }
      payload.token = token.trim();
    } else {
      if (!email.trim()) {
        setError('Please enter your registered account email.');
        return;
      }
      const cleanCode = code.trim().replace(/\s+/g, '');
      if (!cleanCode || cleanCode.length !== 6) {
        setError('Please enter the 6-digit verification code sent to your email.');
        return;
      }
      payload.email = email.trim();
      payload.code = cleanCode;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/user/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        if (data.token && data.user) {
          login(data.token, data.user);
        }
        setTimeout(() => {
          navigate('/dashboard');
        }, 2200);
      } else {
        setError(data.error?.message || 'Failed to reset password. Link or code may be expired.');
      }
    } catch {
      setError('Error connecting to security server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-violet-100 p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-violet-50 text-violet-600 border border-violet-200 mb-2">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-fg tracking-tight">Set New Password</h1>
            <p className="text-xs text-muted font-mono">
              Choose a strong, unique password to secure your account.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-mono">
            <button
              type="button"
              onClick={() => { setMode('code'); setError(null); }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                mode === 'code'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              6-Digit Code
            </button>
            <button
              type="button"
              onClick={() => { setMode('token'); setError(null); }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                mode === 'token'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Direct Link / Token
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {success ? (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono flex items-center gap-2 text-left">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Password reset successfully! All prior active sessions have been securely revoked. Redirecting to your dashboard...
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-xs shadow-md"
              >
                Go to Dashboard Now →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'code' ? (
                <>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                      Account Email Address
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

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                      6-Digit Password Reset Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fg font-mono tracking-widest font-bold focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                    Reset Token (from email link)
                  </label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter cryptographic token from email URL"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fg font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fg font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-fg font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Update Password & Sign In'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium font-mono"
                >
                  Need a new reset link or code? Request here →
                </Link>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-slate-100 text-[11px] text-muted font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Password hashed using scrypt with high-entropy salt
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
