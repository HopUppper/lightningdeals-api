import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isAdminParam = searchParams.get('admin') === 'true';

  const [email, setEmail] = useState(isAdminParam ? 'sidhjain9002@gmail.com' : '');
  const [password, setPassword] = useState(isAdminParam ? 'love9002' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
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

  const handleFillAdmin = () => {
    setEmail('sidhjain9002@gmail.com');
    setPassword('love9002');
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-panel p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-fg">
              {isAdminParam ? 'Admin Control Center Sign In' : 'Sign in to LightningDeals'}
            </h1>
            <p className="text-xs text-muted">
              {isAdminParam
                ? 'Sign in with administrator credentials to manage supplier keys, users, and tokens.'
                : 'Access your assigned API keys, token balances, and usage statistics.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-control border border-red-500/30 bg-red-500/5 text-red-600 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sidhjain9002@gmail.com or dev@lightningdeals.ai"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ui-button-primary w-full justify-center py-3 text-sm font-semibold mt-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Admin Credentials Shortcut */}
          <div className="p-3.5 bg-bg border border-border rounded-control text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fg flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Login Credentials:</span>
              </span>
              <button
                type="button"
                onClick={handleFillAdmin}
                className="text-[11px] font-mono text-amber-500 font-bold hover:underline"
              >
                Auto-Fill Admin
              </button>
            </div>
            <p className="font-mono text-[11px] text-muted">
              Email: <span className="text-fg font-bold">sidhjain9002@gmail.com</span> | Pass: <span className="text-fg font-bold">love9002</span>
            </p>
          </div>


          <div className="pt-4 border-t border-border text-center text-xs text-muted flex justify-between items-center">
            <Link to="/trial" className="text-amber-500 font-semibold hover:underline">
              Get Trial Key on WhatsApp
            </Link>
            <Link to="/login?admin=true" className="text-muted hover:text-fg font-mono text-[11px]">
              Admin Control Center →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
