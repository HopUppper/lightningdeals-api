import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Lock, Mail, ArrowRight, AlertCircle, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [registrationSuccess, setRegistrationSuccess] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: phone.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Registration failed.');
      } else {
        setRegistrationSuccess(data);
      }
    } catch (err: any) {
      setError('Network error. Failed to connect to security server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-panel p-6 sm:p-8 shadow-xl">
          {registrationSuccess ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-4 rounded-3xl bg-violet-50 text-violet-600 border border-violet-200">
                  <Mail className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-fg">Verify Your Email Address</h2>
                <p className="text-xs text-muted font-mono mt-2 leading-relaxed">
                  We issued a high-entropy security verification link to <span className="font-bold text-violet-600">{email}</span>. Please verify your mailbox to activate your account.
                </p>
              </div>

              {registrationSuccess.verification?.token && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-2">
                  <div className="text-[11px] font-bold text-amber-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" /> One-Click Verification Link:
                  </div>
                  <Link
                    to={`/verify-email?token=${registrationSuccess.verification.token}&email=${encodeURIComponent(email)}`}
                    className="block p-2.5 rounded-xl bg-white border border-amber-200 font-mono text-xs font-bold text-violet-700 hover:bg-violet-50 transition-all text-center"
                  >
                    Click Here to Verify Email Directly →
                  </Link>
                </div>
              )}

              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="w-full py-3 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs text-center shadow-md hover:brightness-110 transition-all"
                >
                  Enter Verification Code / Token
                </Link>
                <Link to="/" className="text-xs text-muted hover:text-fg font-mono">
                  Return to Homepage
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-fg">Create LightningDeals Account</h1>
                <p className="text-xs text-muted mt-1.5">
                  Enterprise-grade authentication with email verification & secure token management.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3.5 rounded-control border border-red-500/30 bg-red-500/5 text-red-600 text-xs flex items-center gap-2.5 font-mono">
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
                  <label className="block text-xs font-semibold text-fg mb-1.5">Phone Number (Optional E.164)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1.5">Password (Min 8 chars)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-control transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Creating Secure Account...' : 'Register Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
