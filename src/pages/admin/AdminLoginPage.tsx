import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, AlertTriangle, Eye, EyeOff, CheckCircle2, UserPlus, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Setup detection for initial bootstrap flow
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isBootstrapMode, setIsBootstrapMode] = useState(false);
  const [bootstrapName, setBootstrapName] = useState('System Administrator');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if initial admin has been provisioned
    fetch('/api/admin/auth/setup-status')
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(Boolean(data?.isConfigured));
        if (data?.isConfigured === false) {
          setIsBootstrapMode(true);
        }
      })
      .catch(() => {
        setIsConfigured(true);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please provide both administrator email and password.');
      return;
    }

    if (isBootstrapMode) {
      if (password.length < 12) {
        setError('Administrator password must be at least 12 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and confirmation do not match.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const endpoint = isBootstrapMode ? '/api/admin/auth/bootstrap' : '/api/admin/auth/login';
      const payload: any = { email: cleanEmail, password };
      if (isBootstrapMode) {
        payload.name = bootstrapName.trim() || 'System Administrator';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      const remainingHeader = res.headers.get('X-RateLimit-Remaining');
      if (remainingHeader !== null) {
        setRemainingAttempts(parseInt(remainingHeader, 10));
      }

      if (res.ok && data.success && data.token) {
        setSuccessMsg(isBootstrapMode ? 'Admin initialized! Entering Control Center...' : 'Authenticated successfully.');
        adminLogin(data.token, data.user);
        setTimeout(() => {
          window.location.href = '/deez';
        }, 150);
      } else {
        const errorMsg = data?.error?.message || 'Authentication failed. Please verify your admin credentials.';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to Admin Gateway.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col justify-center items-center px-4 py-8 sm:py-12 font-sans selection:bg-violet-500/20 selection:text-violet-900">
      <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl shadow-sm p-6 sm:p-10 space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0f172a] text-white flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6 text-violet-400" />
          </div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f4f4f0] border border-[#e5e7eb] text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">
            {isBootstrapMode ? 'Initial Setup' : 'Control Center'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            {isBootstrapMode ? 'Initialize Admin' : 'Admin Sign In'}
          </h1>
          <p className="text-xs text-[#6b7280] max-w-xs mx-auto">
            {isBootstrapMode
              ? 'Choose your administrator email and master password to secure your platform.'
              : 'Authorized administrator credentials required for operations portal.'}
          </p>
        </div>

        {/* Security Alert / Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{error}</p>
              {remainingAttempts !== null && remainingAttempts < 5 && (
                <p className="text-[11px] text-rose-600">
                  Security notice: {remainingAttempts} login attempt{remainingAttempts === 1 ? '' : 's'} remaining before temporary IP lockout.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Success Notice */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isBootstrapMode && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111827]">
                Administrator Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={bootstrapName}
                  onChange={(e) => setBootstrapName(e.target.value)}
                  placeholder="System Administrator"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d1d5db] rounded-xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 text-[#111827] font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111827]">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@lightningapi.pro"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-[#d1d5db] rounded-xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 text-[#111827] font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-[#111827]">
                Password
              </label>
              {isBootstrapMode && (
                <span className="text-[11px] text-[#6b7280]">Min 12 characters</span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isBootstrapMode ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isBootstrapMode ? 'Choose strong master password' : '••••••••••••'}
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-[#d1d5db] rounded-xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 text-[#111827]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isBootstrapMode && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111827]">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-[#d1d5db] rounded-xl focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 text-[#111827]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isBootstrapMode ? 'Configuring Platform...' : 'Authenticating...'}</span>
              </>
            ) : (
              <span>{isBootstrapMode ? 'Initialize Administrator →' : 'Sign In to Control Center →'}</span>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#6b7280]">
          <Link to="/" className="hover:text-[#111827] font-medium transition-colors">
            ← Home
          </Link>
          {isConfigured === false && !isBootstrapMode && (
            <button
              onClick={() => setIsBootstrapMode(true)}
              className="text-violet-600 font-semibold hover:underline cursor-pointer"
            >
              Initial Setup
            </button>
          )}
          {isBootstrapMode && isConfigured !== false && (
            <button
              onClick={() => setIsBootstrapMode(false)}
              className="text-violet-600 font-semibold hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
