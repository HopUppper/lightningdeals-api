import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Key, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedEmail(false);

    try {
      const res = await fetch('/api/user/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.type === 'email_unverified') {
          setUnverifiedEmail(true);
        }
        setError(data.error?.message || 'Login failed.');
      } else {
        login(data.token, data.user);
        const redirectParam = searchParams.get('redirect');
        if (data.user.role === 'admin') {
          navigate('/deez');
        } else if (redirectParam && redirectParam.startsWith('/')) {
          navigate(redirectParam);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-950 flex flex-col font-sans antialiased">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-md bg-white border border-[#ede8e1] rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-200/60 flex items-center justify-center mx-auto shadow-2xs">
              <Key className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60 text-[10px] font-mono font-bold uppercase tracking-wider">
              Account Sign In
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-display">
              Sign In to LightningAPI
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-sm mx-auto">
              Access your API keys, usage dashboard, and subscription allocations.
            </p>
          </div>

          {searchParams.get('session_expired') === '1' && !error && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Your session has expired. Please sign in to continue.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              {unverifiedEmail && (
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="mt-1 text-violet-700 font-semibold underline hover:text-violet-800"
                >
                  Verify your email address →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-900">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-900">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700 hover:underline font-semibold">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#ede8e1] text-center space-y-2">
            <p className="text-xs text-zinc-600">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-violet-600 hover:text-violet-700 font-semibold hover:underline">
                Create Free Account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default LoginPage;
