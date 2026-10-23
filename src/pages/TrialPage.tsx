import React, { useState, useEffect } from 'react';
import {
  Key,
  ArrowRight,
  Check,
  AlertCircle,
  RefreshCw,
  Shield,
  Sparkles,
  Clock,
  Zap,
  PauseCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { userFetch } from '../utils/api';
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

  const fetchTrialStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await userFetch('/api/user/trial/status');
      if (res.ok) {
        const data = await res.json();
        setTrialStatus(data);
      }
    } catch (err) {
      console.error('Error fetching trial status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchTrialStatus();
  }, [user]);

  const handleClaimTrial = async () => {
    if (!user) {
      navigate('/register?redirect=trial');
      return;
    }

    setClaiming(true);
    setErrorMessage(null);

    try {
      const res = await userFetch('/api/user/trial/claim', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message || 'Failed to activate trial.');
        if (data.isPaused) {
          setTrialStatus((prev: any) => ({ ...prev, isPaused: true, trialsDisabled: true, status: 'PAUSED' }));
        }
      } else {
        const rawKey = data.trial?.rawKeySecret || data.trial?.apiKey || data.key || data.rawKeySecret;
        if (rawKey) {
          setRevealedKeyData({
            key: rawKey,
            planName: 'Free 1-Day Trial',
            quotaDisplay: '200K TOKENS / 5 HOURS',
            windowHours: 5,
          });
        }
        setTrialStatus({
          isPaused: false,
          trialsDisabled: false,
          canClaim: false,
          hasClaimed: true,
          status: 'ACTIVE',
          message: 'Free Trial Active',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error activating free trial.');
    } finally {
      setClaiming(false);
    }
  };

  const isPaused = Boolean(trialStatus?.isPaused || trialStatus?.trialsDisabled || trialStatus?.status === 'PAUSED');

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col font-sans antialiased selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <Navbar />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 sm:py-16 flex items-center justify-center">
        <div className="w-full bg-white border border-[#e7e5e4] rounded-2xl p-7 sm:p-10 shadow-warm space-y-6">

          {/* PAUSED STATE VIEW */}
          {isPaused ? (
            <div className="space-y-6 text-center">
              {/* Header Badge */}
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-300/80 flex items-center justify-center mx-auto shadow-xs">
                  <PauseCircle className="w-7 h-7 text-amber-600" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Capacity Allocation Notice</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1c1917]">
                  Free Trial is Currently Paused for All Customers
                </h1>
                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed max-w-md mx-auto">
                  To protect guaranteed ultra-low latency and peak token capacity for active members, complimentary 1-day trial key activations are temporarily on hold.
                </p>
              </div>

              {/* Informative Value Cards */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-[#fefbf6] to-[#fbf9f5] border border-amber-200/70 rounded-xl space-y-3.5 text-xs text-left">
                <div className="flex items-start gap-3 pb-3 border-b border-[#e7e5e4]">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 fill-current text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1c1917]">Instant Capacity Plans Available</h4>
                    <p className="text-[11px] text-[#78716c] mt-0.5">
                      Standard, Pro, and Max plans are 100% active with immediate automated key delivery and generous 5-hour rolling quotas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-3 border-b border-[#e7e5e4]">
                  <div className="p-1.5 rounded-lg bg-violet-50 text-violet-700 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1c1917]">Existing Subscriptions Unaffected</h4>
                    <p className="text-[11px] text-[#78716c] mt-0.5">
                      All currently issued keys and active customer dashboards continue running at full speed without restriction.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1c1917]">Automated Resumption</h4>
                    <p className="text-[11px] text-[#78716c] mt-0.5">
                      Free trials will automatically reactivate once provider capacity overhead returns to baseline.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <Link
                  to="/pricing"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-plum cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  <span>Browse Available Capacity Plans</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {user ? (
                  <Link
                    to="/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Go to Customer Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    to="/login?redirect=trial"
                    className="w-full py-2.5 px-4 rounded-xl border border-[#e7e5e4] hover:bg-[#f5f2eb] text-[#1c1917] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Sign In to Existing Account</span>
                  </Link>
                )}

                <div className="pt-2">
                  <button
                    onClick={fetchTrialStatus}
                    disabled={loadingStatus}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#78716c] hover:text-[#6d28d9] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                    <span>Check If Trials Resumed</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE TRIAL VIEW */
            <>
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
                  Claim Free 200k Token Trial
                </h1>
                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed max-w-sm mx-auto">
                  Test Claude Opus 5, Sonnet 5, and Haiku directly in your tools with zero upfront payment.
                </p>
              </div>

              {/* Trial Feature Inclusions Box */}
              <div className="p-4 sm:p-5 bg-[#fdfbf7] border border-[#e7e5e4] rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e7e5e4]">
                  <span className="text-[#78716c]">Token Allocation:</span>
                  <span className="font-semibold text-[#1c1917] font-mono">200,000 Tokens / 5-Hour Window</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e7e5e4]">
                  <span className="text-[#78716c]">Trial Duration:</span>
                  <span className="font-semibold text-[#1c1917]">24 Hours</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#e7e5e4]">
                  <span className="text-[#78716c]">Included Models:</span>
                  <span className="font-semibold text-[#6d28d9]">Claude Sonnet 5.5, Opus 5.5, Haiku 5.5</span>
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
              {authLoading || loadingStatus ? (
                <div className="py-6 text-center text-xs text-[#78716c] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#6d28d9]" />
                  <span>Checking trial availability...</span>
                </div>
              ) : user ? (
                /* Authenticated User Status */
                trialStatus && !trialStatus.canClaim ? (
                  <div className="space-y-4 text-center">
                    {trialStatus.status === 'EXPIRED' ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 font-semibold">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Free Trial Has Expired</span>
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          Your 24-hour evaluation has ended. Upgrade to a capacity plan for uninterrupted high-speed access.
                        </p>
                      </div>
                    ) : trialStatus.status === 'IP_ALREADY_CLAIMED' ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                        <div className="flex items-center justify-center gap-1.5 font-semibold">
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span>Network Limit Reached</span>
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          A trial key has already been issued for this network. Explore paid plans with dedicated limits.
                        </p>
                      </div>
                    ) : trialStatus.status === 'HAS_EXISTING_SUBSCRIPTION' ? (
                      <div className="p-4 bg-[#f0fdf4] border border-[#a7f3d0] rounded-xl text-xs text-[#047857] space-y-1">
                        <div className="flex items-center justify-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                          <span>Active Subscription Detected</span>
                        </div>
                        <p className="text-[11px] text-[#047857] leading-relaxed">
                          You already have an active subscription with full quota limits.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#f0fdf4] border border-[#a7f3d0] rounded-xl text-xs text-[#047857] space-y-1">
                        <div className="flex items-center justify-center gap-1.5 font-semibold">
                          <Check className="w-4 h-4 text-[#059669]" />
                          <span>Free Trial Already Active</span>
                        </div>
                        <p className="text-[11px] text-[#047857] leading-relaxed">
                          Your key is active. Open your dashboard to view usage and rolling quota top-ups.
                        </p>
                      </div>
                    )}

                    <Link
                      to={trialStatus.status === 'EXPIRED' || trialStatus.status === 'IP_ALREADY_CLAIMED' ? '/pricing' : '/dashboard/plan'}
                      className="w-full py-3 rounded-xl bg-[#1c1917] hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>
                        {trialStatus.status === 'EXPIRED' || trialStatus.status === 'IP_ALREADY_CLAIMED'
                          ? 'Browse Capacity Plans'
                          : 'Open Dashboard Plan'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-[#fdfbf7] border border-[#e7e5e4] rounded-xl text-xs text-[#78716c] space-y-1">
                      <p>
                        Signed in as: <strong className="text-[#1c1917]">{user.email}</strong>
                      </p>
                      <p className="text-[11px] text-[#047857] font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-[#059669]" /> Eligible for immediate 1-click activation
                      </p>
                    </div>

                    <button
                      onClick={handleClaimTrial}
                      disabled={claiming}
                      className="w-full py-3.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-plum"
                    >
                      {claiming ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating API Key...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Activate Free 1-Day Trial Key</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : (
                /* Unauthenticated Guest View */
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
            </>
          )}
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
