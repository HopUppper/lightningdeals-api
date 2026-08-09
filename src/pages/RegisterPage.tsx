import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Lock, Mail, ArrowRight, AlertCircle, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Registration failed.');
      } else {
        login(data.token, data.user);
        if (data.initialKey) {
          setCreatedKey(data.initialKey);
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
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-panel p-6 sm:p-8 shadow-xl">
          {!createdKey ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-fg">Create LightningDeals Account</h1>
                <p className="text-xs text-muted mt-1.5">
                  Get instant trial access with 1,000,000 API tokens. No credit card required.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3.5 rounded-control border border-red-500/30 bg-red-500/5 text-red-600 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@example.com"
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
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ui-button-primary w-full justify-center py-3 text-sm font-semibold mt-2 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Get Free Trial Key'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted">
                <span>Already have an account? </span>
                <Link to="/login" className="text-amber-500 font-semibold hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* Trial Key Created Modal State */
            <div className="text-center py-4 space-y-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-fg">Account Created Successfully!</h2>
                <p className="text-xs text-muted mt-1">
                  Your account has been provisioned with 1,000,000 trial tokens. Copy your API key below:
                </p>
              </div>

              <div className="p-4 bg-bg border border-accent/30 rounded-control font-mono text-xs text-accent break-all select-all">
                {createdKey}
              </div>

              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-control">
                ⚠️ Save this key safely! It will only be displayed once.
              </p>

              <button
                onClick={() => navigate('/dashboard')}
                className="ui-button-primary w-full justify-center py-3 text-sm font-semibold"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
