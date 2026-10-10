import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@lightningapi.pro');
  const [password, setPassword] = useState('');
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
        adminLogin(data.token, data.user);
        window.location.href = '/admin';
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
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col justify-center items-center px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-xl shadow-xs p-8 sm:p-10 space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5" />
          </div>
          <div className="inline-flex items-center px-2 py-0.5 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
            Control Center
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Admin Sign In
          </h1>
          <p className="text-xs text-[#6b7280]">
            Authorized administrator credentials required for operations portal.
          </p>
        </div>

        {/* Security Alert / Error Notice */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
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

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#111827]">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lightningapi.pro"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827] font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#111827]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full ui-button-primary text-xs py-2.5 font-medium justify-center cursor-pointer disabled:opacity-50 mt-2"
          >
            {submitting ? 'Verifying...' : 'Authenticate & Enter →'}
          </button>
        </form>

        <div className="pt-3 border-t border-[#e5e7eb] text-center">
          <Link to="/" className="text-xs text-[#6b7280] hover:text-[#111827] font-medium transition-colors">
            ← Return to LightningAPI.pro
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
