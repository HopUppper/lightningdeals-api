import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

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
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(data.error?.message || 'Email verification failed. The link may be invalid or expired.');
      }
    } catch (err: any) {
      setError('Error connecting to verification server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!emailParam) return;
    setResending(true);
    setResendMessage(null);

    try {
      const res = await fetch('/api/user/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam }),
      });

      const data = await res.json();
      if (res.ok) {
        setResendMessage(data.message || 'Verification link resent! Check your email inbox.');
        setResendCooldown(60);
      } else {
        setResendMessage(data.error?.message || 'Failed to resend verification email.');
      }
    } catch {
      setResendMessage('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-violet-100 p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className={`p-4 rounded-3xl ${success ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : error ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-violet-50 text-violet-600 border border-violet-200'}`}>
              {success ? <CheckCircle2 className="w-10 h-10" /> : error ? <AlertCircle className="w-10 h-10" /> : <Mail className="w-10 h-10 animate-bounce" />}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-fg tracking-tight">
              {success ? 'Email Verified Successfully!' : error ? 'Verification Failed' : 'Verify Your Email Address'}
            </h1>
            <p className="text-xs text-muted font-mono mt-2 leading-relaxed">
              {success
                ? 'Your account is now fully active. Redirecting you to your dashboard...'
                : error
                ? error
                : `We sent a high-entropy security verification link to ${emailParam || 'your registered email address'}. Please check your inbox and click the link to activate your account.`}
            </p>
          </div>

          {verifying && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-violet-600">
              <RefreshCw className="w-4 h-4 animate-spin" /> Verifying security token...
            </div>
          )}

          {success && (
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:brightness-110 transition-all"
            >
              Go to Customer Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {!success && !verifying && emailParam && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {resendMessage && (
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-mono">
                  {resendMessage}
                </div>
              )}
              <button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend Verification Email (${resendCooldown}s)` : resending ? 'Resending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}

          <div className="pt-2 text-[11px] text-muted font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Server-side cryptographic token verification
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmailPage;
