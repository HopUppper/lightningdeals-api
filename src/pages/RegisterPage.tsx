import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Check, User as UserIcon, Phone } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

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
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-xl p-8 sm:p-10 shadow-xs space-y-6">
          {registeredEmail ? (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-[#f0fdf4] text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#f0fdf4] text-xs font-medium text-emerald-800 border border-emerald-300">
                  <Check className="w-3.5 h-3.5" /> Registration Received
                </span>
                <h2 className="text-xl font-bold text-[#111827]">Verify Your Email</h2>
                <p className="text-xs text-[#4b5563] leading-relaxed">
                  We sent a confirmation code to <strong className="text-[#111827]">{registeredEmail}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#fbfbfa] border border-[#e5e7eb] text-left space-y-1 text-xs">
                <div className="font-medium text-[#111827]">
                  Activation Pending
                </div>
                <p className="text-[#6b7280]">
                  Enter your 6-digit confirmation code on the verification page to activate your keys.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
                  className="ui-button-primary w-full text-xs font-medium justify-center py-2.5"
                >
                  Enter Verification Code →
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-[#6b7280] hover:text-[#111827] font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center mx-auto">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="inline-flex items-center px-2 py-0.5 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
                  Create Account
                </div>
                <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                  Start with LightningAPI
                </h1>
                <p className="text-xs text-[#6b7280]">
                  Get instant access to API keys and 1,000,000 free evaluation tokens.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#111827]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#111827]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#111827]">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 0199"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#111827]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#111827]">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FRIEND10"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827] uppercase font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full ui-button-primary text-xs py-2.5 font-medium justify-center cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? 'Creating Account...' : 'Create Account →'}
                </button>
              </form>

              <div className="pt-3 border-t border-[#e5e7eb] text-center space-y-2">
                <p className="text-xs text-[#6b7280]">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#1e40af] font-medium hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
