import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Check, User as UserIcon, Phone } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('ref');
      return p ? p.trim().toUpperCase() : (sessionStorage.getItem('ld_ref') || localStorage.getItem('ld_ref') || '');
    }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/user/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Registration failed. Please check your details and try again.');
      } else {
        setRegisteredEmail(email);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Server request timed out. Please try registering again.');
      } else {
        setError('Network error connecting to security server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-950 flex flex-col font-sans antialiased">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-md bg-white border border-[#ede8e1] rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
          {registeredEmail ? (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-2xs">
                <Mail className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <Check className="w-3.5 h-3.5" /> Registration Received
                </span>
                <h2 className="text-2xl font-extrabold text-zinc-950 font-display tracking-tight">Verify Your Email</h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  We sent a confirmation code to <strong className="text-zinc-900 font-semibold">{registeredEmail}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-left space-y-1 text-xs">
                <div className="font-semibold text-zinc-900">
                  Activation Pending
                </div>
                <p className="text-zinc-600">
                  Enter your 6-digit confirmation code on the verification page to activate your keys.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  Enter Verification Code →
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-zinc-600 hover:text-zinc-900 font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-200/60 flex items-center justify-center mx-auto shadow-2xs">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Create Account
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-display">
                  Start with LightningAPI
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-sm mx-auto">
                  Get instant access to API keys and 200,000 free evaluation tokens.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-900">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-900">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-900">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 0199"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-900">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-900">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FRIEND10"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 uppercase font-mono transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? 'Creating Account...' : 'Create Account →'}
                </button>
              </form>

              <div className="pt-3 border-t border-[#ede8e1] text-center space-y-2">
                <p className="text-xs text-zinc-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default RegisterPage;
