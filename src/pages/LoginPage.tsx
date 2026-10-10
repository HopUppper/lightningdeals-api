import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Key, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

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
        if (data.user.role === 'admin') {
          navigate('/admin');
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
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center mx-auto">
              <Key className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center px-2 py-0.5 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
              Account Sign In
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Sign In to LightningAPI
            </h1>
            <p className="text-xs text-[#6b7280]">
              Access your API keys, usage dashboard, and subscription allocations.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              {unverifiedEmail && (
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="mt-1 text-[#1e40af] font-medium underline"
                >
                  Verify your email address →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#111827]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#111827]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#1e40af] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
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
              disabled={loading}
              className="w-full ui-button-primary text-xs py-2.5 font-medium justify-center cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#e5e7eb] text-center space-y-2">
            <p className="text-xs text-[#6b7280]">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-[#1e40af] font-medium hover:underline">
                Create Free Account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
