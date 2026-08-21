import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Key, CheckCircle2, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { adminFetch } from '../utils/api';
import { ApiKeyRevealModal } from '../components/ApiKeyRevealModal';

export const TrialPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [claiming, setClaiming] = useState(false);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [revealedKeyData, setRevealedKeyData] = useState<{
    key: string;
    planName: string;
    quotaDisplay: string;
    windowHours: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      adminFetch('/api/user/trial/status')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setTrialStatus(data);
        })
        .catch(() => {})
        .finally(() => setLoadingStatus(false));
    } else {
      setLoadingStatus(false);
    }
  }, [user]);

  const handleClaimTrial = async () => {
    if (!user) {
      navigate('/register?redirect=trial');
      return;
    }

    setClaiming(true);
    setErrorMessage(null);

    try {
      const res = await adminFetch('/api/user/trial/claim', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message || 'Failed to activate trial.');
      } else {
        const rawKey = data.trial?.rawKeySecret || data.trial?.apiKey || data.rawKeySecret || data.apiKey;
        if (rawKey) {
          setRevealedKeyData({
            key: rawKey,
            planName: 'Free 1-Day Trial',
            quotaDisplay: '1M TOKENS / 5 HOURS',
            windowHours: 5,
          });
        }
        setTrialStatus({ canClaim: false, message: 'Free Trial Active' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error activating free trial.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-12 sm:py-16 flex items-center justify-center">
        <div className="w-full bg-white border border-border rounded-panel p-8 sm:p-10 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="space-y-2 text-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Instant Developer Free Trial
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
              Claim Free 1M Token Trial Key
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Test the entire Claude model lineup (Claude Opus 5, Fable 5, Sonnet 5, Haiku 4.5) directly inside your IDE with zero payment.
            </p>
          </div>

          {/* Trial Feature Inclusions Box */}
          <div className="p-5 bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-cyan-500/5 border border-violet-200 rounded-control space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-violet-100">
              <span className="text-muted">Token Quota:</span>
              <span className="font-bold text-fg">1M TOKENS / 5 HOURS</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-violet-100">
              <span className="text-muted">Validity Duration:</span>
              <span className="font-bold text-fg">24 Hours (1 Day)</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-violet-100">
              <span className="text-muted">Model Support:</span>
              <span className="font-bold text-violet-700">Claude Opus 5, Sonnet 5, Haiku 4.5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Credit Card Required:</span>
              <span className="font-bold text-emerald-600">No (100% Free)</span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control flex items-center justify-between text-xs text-red-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-red-500 font-bold">✕</button>
            </div>
          )}

          {/* User Status & Action CTA */}
          {authLoading ? (
            <div className="py-6 text-center text-xs text-muted font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
              <span>Verifying account status...</span>
            </div>
          ) : user ? (
            trialStatus && !trialStatus.canClaim ? (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-control text-xs text-emerald-800 space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Free Trial Already Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Your trial quota is active. Visit your customer dashboard to monitor usage and next quota reset.
                  </p>
                </div>
                <Link
                  to="/dashboard/plan"
                  className="w-full py-3.5 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>Go to Customer Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-bg border border-border rounded-control text-xs text-muted font-mono space-y-1">
                  <p>Signed in as: <strong className="text-fg">{user.email}</strong></p>
                  <p className="text-[11px] text-emerald-600">✓ Eligible for instant 1-Day Trial Key</p>
                </div>

                <button
                  onClick={handleClaimTrial}
                  disabled={claiming}
                  className="w-full py-3.5 rounded-control bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>{claiming ? 'Activating & Generating Key...' : 'Activate Free 1-Day Trial Key'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-subtle/60 border border-border rounded-control text-xs text-muted leading-relaxed">
                <p className="font-semibold text-fg mb-1">Sign Up to Get Your Trial Key</p>
                <p>
                  Create your free developer account in under 30 seconds to instantly activate and receive your 1M token trial key inside your dashboard.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register?redirect=trial"
                  className="flex-1 py-3.5 rounded-control bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 text-center"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login?redirect=trial"
                  className="py-3.5 px-6 rounded-control bg-bg border border-border text-fg hover:bg-subtle font-bold text-xs flex items-center justify-center text-center"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="pt-2 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant self-service issuance · Zero credit card required</span>
          </div>

        </div>
      </main>

      {/* Reveal Modal for Newly Claimed Key */}
      {revealedKeyData && (
        <ApiKeyRevealModal
          isOpen={!!revealedKeyData}
          apiKey={revealedKeyData.key}
          planName={revealedKeyData.planName}
          quotaDisplay={revealedKeyData.quotaDisplay}
          windowHours={revealedKeyData.windowHours}
          onClose={() => {
            setRevealedKeyData(null);
            navigate('/dashboard/plan');
          }}
        />
      )}

      <Footer />
    </div>
  );
};
