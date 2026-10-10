import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Mail, KeyRound, Sparkles } from 'lucide-react';
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
        }, 2000);
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
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#e5e7eb] p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-5 h-5 text-slate-100" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-700 border border-slate-200">
              <span>Security Check</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Create New Password
            </h1>
            <p className="text-xs text-[#4b5563]">
              Choose a strong password to protect your account and API keys.
            </p>
          </div>

          {success ? (
            <div className="p-6 rounded-lg bg-emerald-50/80 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-semibold text-emerald-950">Password Updated Successfully</h3>
              <p className="text-xs text-emerald-800">
                Logging you into your dashboard now...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/80 text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#f3f4f6] rounded-lg border border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setMode('token')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    mode === 'token'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  Email Link
                </button>
                <button
                  type="button"
                  onClick={() => setMode('code')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    mode === 'code'
                      ? 'bg-white text-[#111827] shadow-xs font-semibold'
                      : 'text-[#6b7280] hover:text-[#111827]'
                  }`}
                >
                  6-Digit Code
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'token' ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111827]">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste token from email link"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111827]">
                        Account Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                      />
                    </div>
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
                        className="w-full text-center tracking-widest font-mono text-base font-bold py-2 bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full ui-button-brand text-xs py-2.5 font-semibold justify-center rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Updating Password...' : 'Save Password & Enter →'}
                </button>
              </form>
            </>
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

export default ResetPasswordPage;
