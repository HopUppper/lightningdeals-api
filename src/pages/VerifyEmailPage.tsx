import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [emailInput, setEmailInput] = useState(emailParam);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify if rawToken is present in URL from email click
  const verifyToken = async (tokenToVerify: string) => {
    setVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        if (data.token && data.user) {
          login(data.token, data.user);
        }
      } else {
        setError(data.error?.message || 'Verification failed. The link may be invalid or expired.');
      }
    } catch (err: any) {
      setError('Error connecting to verification server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Verify 6-digit code entered in UI
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !emailInput.trim()) {
      setError('Please enter your email and 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), code: otpCode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        if (data.token && data.user) {
          login(data.token, data.user);
        }
      } else {
        setError(data.error?.message || 'Invalid verification code. Please check and try again.');
      }
    } catch (err: any) {
      setError('Network error connecting to verification gateway.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!emailInput.trim() || resendCooldown > 0) return;
    setResending(true);
    setResendMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/user/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResendMessage('A fresh verification code was sent to your email.');
        setResendCooldown(60);
      } else {
        setError(data.error?.message || 'Could not resend code. Please try again.');
      }
    } catch (err: any) {
      setError('Network error while resending verification.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#e5e7eb] p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center mx-auto shadow-xs">
              <Mail className="w-5 h-5 text-slate-100" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-700 border border-slate-200">
              <span>One More Step</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Verify Your Email
            </h1>
            <p className="text-xs text-[#4b5563]">
              Enter the 6-digit confirmation code we sent to your inbox.
            </p>
          </div>

          {success ? (
            <div className="p-6 rounded-lg bg-emerald-50/80 border border-emerald-200 text-center space-y-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-emerald-950">Email Successfully Verified</h3>
                <p className="text-xs text-emerald-800">
                  Your account is fully activated. You're ready to create keys and build with Claude.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="ui-button-brand w-full text-xs font-semibold justify-center py-2.5 rounded-lg inline-flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/80 text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {resendMessage && (
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/80 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resendMessage}</span>
                </div>
              )}

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827]">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-xl font-bold py-2.5 bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] text-[#111827] shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || otpCode.length !== 6 || !emailInput}
                  className="w-full ui-button-brand text-xs py-2.5 font-semibold justify-center rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Verify Code & Continue →'}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#6b7280]">Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending || !emailInput}
                  className="text-[#1e40af] hover:text-[#1d4ed8] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#e5e7eb] text-center">
            <Link to="/login" className="text-xs text-[#6b7280] hover:text-[#111827] font-medium">
              ← Return to Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyEmailPage;
