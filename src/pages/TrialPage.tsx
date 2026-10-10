import React, { useState, useEffect } from 'react';
import { Key, ArrowRight, Check, AlertCircle, RefreshCw, Shield, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <Navbar />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 sm:py-16 flex items-center justify-center">
        <div className="w-full bg-white border border-[#e7e5e4] rounded-2xl p-8 sm:p-10 shadow-warm space-y-6">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#6d28d9] text-white flex items-center justify-center mx-auto shadow-xs">
              <Key className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
              <Sparkles className="w-3 h-3 text-[#6d28d9]" />
              <span>Free 1-Day Pass</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">
              Claim Free 1M Token Trial
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed max-w-sm mx-auto">
              Test Claude Opus 5, Sonnet 5, and Haiku directly in your tools with zero upfront payment.
            </p>
          </div>

          {/* Trial Feature Inclusions Box */}
          <div className="p-4 sm:p-5 bg-[#fdfbf7] border border-[#e7e5e4] rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e7e5e4]">
              <span className="text-[#78716c]">Token Allocation:</span>
              <span className="font-semibold text-[#1c1917] font-mono">1,000,000 Tokens / 5-Hour Window</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e7e5e4]">
              <span className="text-[#78716c]">Trial Duration:</span>
              <span className="font-semibold text-[#1c1917]">24 Hours</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e7e5e4]">
              <span className="text-[#78716c]">Included Models:</span>
              <span className="font-semibold text-[#6d28d9]">Sonnet 5, Opus 5, Haiku 4.5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#78716c]">Payment Required:</span>
              <span className="font-semibold text-[#047857] flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#059669]" /> None (Free evaluation)
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-700 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* User Status & Action CTA */}
          {authLoading ? (
            <div className="py-6 text-center text-xs text-[#78716c] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#6d28d9]" />
              <span>Verifying account eligibility...</span>
            </div>
          ) : user ? (
            trialStatus && !trialStatus.canClaim ? (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-[#f0fdf4] border border-[#a7f3d0] rounded-xl text-xs text-[#047857] space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-semibold">
                    <Check className="w-4 h-4 text-[#059669]" />
                    <span>Free Trial Already Active</span>
                  </div>
                  <p className="text-[11px] text-[#047857] leading-relaxed">
                    Your key is active. Open your dashboard to view usage and rolling quota top-ups.
                  </p>
                </div>
                <Link
                  to="/dashboard/plan"
                  className="w-full py-3 rounded-xl bg-[#1c1917] hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-[#fdfbf7] border border-[#e7e5e4] rounded-xl text-xs text-[#78716c] space-y-1">
                  <p>Signed in as: <strong className="text-[#1c1917]">{user.email}</strong></p>
                  <p className="text-[11px] text-[#047857] font-medium">✓ Eligible for immediate activation</p>
                </div>

                <button
                  onClick={handleClaimTrial}
                  disabled={claiming}
                  className="w-full py-3 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-plum"
                >
                  <Key className="w-4 h-4" />
                  <span>{claiming ? 'Generating API Key...' : 'Activate Free 1-Day Trial Key'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[#fdfbf7] border border-[#e7e5e4] rounded-xl text-xs text-[#57534e] leading-relaxed">
                <p className="font-semibold text-[#1c1917] mb-1">Create an Account to Claim</p>
                <p>
                  Your free key is issued immediately upon registration. No credit card required.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  to="/register?redirect=trial"
                  className="w-full py-3 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-plum text-center"
                >
                  <span>Sign Up & Claim Trial Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login?redirect=trial"
                  className="w-full py-2.5 rounded-xl text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] font-medium text-xs text-center transition-colors"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Trust reassurance */}
          <div className="pt-2 border-t border-[#e7e5e4] text-center text-[11px] text-[#78716c]">
            Passthrough proxy • No billing commitments • Instant 60s setup
          </div>
        </div>
      </main>

      <Footer />

      {revealedKeyData && (
        <ApiKeyRevealModal
          isOpen={true}
          apiKey={revealedKeyData.key}
          planName={revealedKeyData.planName}
          quotaDisplay={revealedKeyData.quotaDisplay}
          windowHours={revealedKeyData.windowHours}
          onClose={() => setRevealedKeyData(null)}
        />
      )}
    </div>
  );
};

export default TrialPage;
