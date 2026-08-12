import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@lightningapi.pro');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const { adminLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both admin email address and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      const remainingHeader = res.headers.get('X-RateLimit-Remaining');
      if (remainingHeader !== null) {
        setRemainingAttempts(parseInt(remainingHeader, 10));
      }

      if (res.ok && data.success) {
        // Save session in AuthContext & redirect
        if (adminLogin) {
          adminLogin(data.token, data.user);
        } else {
          window.location.href = '/admin';
        }
      } else {
        setError(data?.error?.message || 'Authentication failed. Please verify your admin credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to Admin Gateway.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-300">
      {/* Dynamic Background Glow Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-[#0F1420]/90 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Header Header Icon */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            LightningDeals Admin
          </h1>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
            Secure Control Center Portal
          </p>
        </div>

        {/* Security Alert / Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-start gap-2.5 shadow-sm animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-200">{error}</p>
              {remainingAttempts !== null && remainingAttempts < 5 && (
                <p className="text-[11px] text-red-400/90 font-sans">
                  ⚠️ Security Notice: {remainingAttempts} login attempt{remainingAttempts === 1 ? '' : 's'} remaining before temporary IP lockout.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Admin Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lightningapi.pro"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#07090E] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#07090E] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 text-xs font-bold font-mono tracking-wide rounded-xl text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Shield Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>256-Bit TLS Encrypted</span>
          </div>
          <span className="text-slate-400">Max 5 Attempts / IP</span>
        </div>

      </div>

      {/* Return to Public Website */}
      <a
        href="/"
        className="mt-6 text-xs text-slate-400 hover:text-white transition-colors font-mono flex items-center gap-1"
      >
        ← Return to LightningDeals Homepage
      </a>
    </div>
  );
};
