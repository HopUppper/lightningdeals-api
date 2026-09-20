import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, CheckCircle2, Clock, Activity, Gift, CreditCard, RefreshCw, AlertCircle, ShoppingBag, Sparkles, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { adminFetch } from '../../utils/api';
import { CheckoutModal } from '../../components/CheckoutModal';
import { ApiKeyRevealModal } from '../../components/ApiKeyRevealModal';

export const UserPlan: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [data, setData] = useState<any>(null);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
  const [revealedKeyData, setRevealedKeyData] = useState<{
    key: string;
    planName: string;
    quotaDisplay: string;
    windowHours: number;
  } | null>(null);

  // Time remaining states for live countdown
  const [resetCountdown, setResetCountdown] = useState<string>('');
  const [expiryCountdown, setExpiryCountdown] = useState<string>('');

  const fetchSubscriptions = async () => {
    try {
      const [subRes, trialRes, plansRes] = await Promise.all([
        adminFetch('/api/user/subscriptions'),
        adminFetch('/api/user/trial/status').catch(() => null),
        fetch(`/api/checkout/plans?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }).catch(() => null),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setData(subData);
      }

      if (trialRes && trialRes.ok) {
        const tData = await trialRes.json();
        setTrialStatus(tData);
      }

      if (plansRes && plansRes.ok) {
        const pData = await plansRes.json();
        if (pData.plans && Array.isArray(pData.plans)) {
          setAvailablePlans(pData.plans);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    const interval = setInterval(fetchSubscriptions, 30000); // Poll every 30s
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        fetchSubscriptions();
      }
    };
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, []);

  // Live timer tick for reset and expiry countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      const activeSub = data?.activeSubscription;
      if (!activeSub) return;

      const now = Date.now();

      // Next reset countdown
      if (activeSub.nextResetTime) {
        const resetDiff = new Date(activeSub.nextResetTime).getTime() - now;
        if (resetDiff > 0) {
          const hours = Math.floor(resetDiff / (1000 * 3600));
          const mins = Math.floor((resetDiff % (1000 * 3600)) / (1000 * 60));
          const secs = Math.floor((resetDiff % (1000 * 60)) / 1000);
          setResetCountdown(`${hours}h ${mins}m ${secs}s`);
        } else {
          setResetCountdown('Refreshing quota...');
        }
      }

      // Expiry countdown
      if (activeSub.expiryTime) {
        const expiryDiff = new Date(activeSub.expiryTime).getTime() - now;
        if (expiryDiff > 0) {
          const days = Math.floor(expiryDiff / (1000 * 3600 * 24));
          const hours = Math.floor((expiryDiff % (1000 * 3600 * 24)) / (1000 * 3600));
          const mins = Math.floor((expiryDiff % (1000 * 3600)) / (1000 * 60));
          setExpiryCountdown(`${days}d ${hours}h ${mins}m`);
        } else {
          setExpiryCountdown('Expired');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data]);

  const handleClaimTrial = async () => {
    setClaimingTrial(true);
    setTrialError(null);
    try {
      const res = await adminFetch('/api/user/trial/claim', { method: 'POST' });
      const trialData = await res.json();
      if (!res.ok || !trialData.success) {
        setTrialError(trialData.error?.message || 'Failed to claim trial.');
      } else {
        const rawKey = trialData.trial?.rawKeySecret || trialData.trial?.apiKey || trialData.rawKeySecret || trialData.apiKey;
        if (rawKey) {
          setRevealedKeyData({
            key: rawKey,
            planName: 'Free 1-Day Trial',
            quotaDisplay: '1M TOKENS / 5 HOURS',
            windowHours: 5,
          });
        }
        await fetchSubscriptions();
      }
    } catch (e: any) {
      setTrialError(e.message || 'Network error claiming trial.');
    } finally {
      setClaimingTrial(false);
    }
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-muted font-mono">Loading My Claude Plans...</div>;
  }

  const activeSub = data?.activeSubscription;
  const quotaLimit = Number(activeSub?.quotaLimit || 0);
  const currentUsage = Number(activeSub?.currentUsage || 0);
  const remainingTokens = Math.max(0, quotaLimit - currentUsage);
  const usagePercentage = quotaLimit > 0 ? Math.min(100, Math.round((currentUsage / quotaLimit) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">MY CLAUDE PLANS</h1>
          <p className="text-xs text-muted mt-1">
            Authoritative quota tracking, rolling 5-hour resets, plan validity, and purchase history.
          </p>
        </div>

        <button
          onClick={() => {
            const planToSelect = (availablePlans.length > 0 ? availablePlans.find((p: any) => p.priceInr > 0) : null) || {
              id: 'pro',
              name: 'PRO',
              priceInr: 2499,
              tokenDisplay: '5M TOKENS / 5 HOURS',
              windowHours: 5,
              validityDays: 30,
            };
            setSelectedPlanForCheckout(planToSelect);
          }}
          className="ui-button-primary text-xs py-2.5 px-4 gap-2 font-bold self-start sm:self-auto shadow-md"
        >
          <Zap className="w-4 h-4" />
          <span>UPGRADE / BUY PLAN</span>
        </button>
      </div>

      {/* Free Trial Eligibility Card if eligible */}
      {!activeSub && trialStatus?.isEligible && (
        <div className="p-6 rounded-panel bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" />
              <span>TRY BEFORE YOU BUY</span>
            </div>
            <h2 className="text-xl font-extrabold">FREE 1-DAY TRIAL</h2>
            <p className="text-xs text-violet-100 font-mono">
              1M TOKENS / 5 HOURS • 24 HOURS VALIDITY • No payment required
            </p>
            {trialError && <p className="text-xs font-mono text-rose-200 bg-rose-900/40 p-2 rounded">{trialError}</p>}
          </div>

          <button
            onClick={handleClaimTrial}
            disabled={claimingTrial}
            className="w-full sm:w-auto px-6 py-3.5 rounded-control bg-white text-violet-700 hover:bg-violet-50 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {claimingTrial ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            <span>START FREE TRIAL</span>
          </button>
        </div>
      )}

      {/* ACTIVE PLAN SECTION */}
      {activeSub ? (
        <div className="bg-card border border-border rounded-panel p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  ACTIVE PLAN
                </span>
                <span className="text-xs font-mono text-muted">ID: {activeSub.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-fg tracking-tight">CLAUDE MAX {activeSub.planName}</h2>
              <p className="text-xs font-mono font-bold text-violet-700">
                {formatTokens(activeSub.quotaLimit)} TOKENS / {activeSub.quotaWindowHours} HOURS
              </p>
            </div>

            <div className="flex flex-col sm:items-end font-mono text-xs space-y-1">
              <span className="text-muted">Status: <strong className="text-emerald-600 uppercase">ACTIVE</strong></span>
              <span className="text-muted">Plan Expiry: <strong className="text-fg">{new Date(activeSub.expiryTime).toLocaleDateString()}</strong></span>
              <span className="text-[11px] text-violet-600 font-bold">{expiryCountdown} remaining</span>
            </div>
          </div>

          {/* TOKEN USAGE PROGRESS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-600" />
                  CURRENT USAGE
                </h3>
                <p className="text-xs text-muted font-mono mt-0.5">
                  {formatTokens(currentUsage)} / {formatTokens(quotaLimit)} TOKENS ({usagePercentage}%)
                </p>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold font-mono text-emerald-600">
                  {formatTokens(remainingTokens)} tokens remaining
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-subtle rounded-full overflow-hidden p-0.5 border border-border">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-muted">
                <span>0 Tokens</span>
                <span>{formatTokens(quotaLimit)} Quota Limit</span>
              </div>
            </div>
          </div>

          {/* RESET & API KEY SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="p-4 bg-bg border border-border rounded-control space-y-1">
              <p className="text-[11px] text-muted font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-600" /> NEXT RESET
              </p>
              <p className="text-lg font-extrabold font-mono text-violet-700">{resetCountdown || 'Calculating...'}</p>
              <p className="text-[10px] text-muted font-mono">Refreshes every {activeSub.quotaWindowHours}h</p>
            </div>

            <div className="p-4 bg-bg border border-border rounded-control space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ASSIGNED KEY
                </p>
                <button
                  onClick={() => {
                    const keyToCopy = activeSub.apiKeySecret || activeSub.apiKeyDisplay;
                    if (keyToCopy) {
                      navigator.clipboard.writeText(keyToCopy);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy Full Key</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-bold font-mono text-fg">{activeSub.apiKeyDisplay || 'Key Issued'}</p>
              <Link to="/dashboard/keys" className="text-[11px] text-violet-600 font-bold hover:underline">
                Manage & Reveal Keys →
              </Link>
            </div>

            <div className="p-4 bg-bg border border-border rounded-control space-y-1">
              <p className="text-[11px] text-muted font-mono flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-cyan-600" /> ORDER REFERENCE
              </p>
              <p className="text-sm font-bold font-mono text-fg">{activeSub.orderId ? activeSub.orderId.slice(0, 12) : 'Trial Grant'}</p>
              <p className="text-[10px] text-muted font-mono">Activated: {new Date(activeSub.activationTime).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-card border border-border rounded-panel text-center space-y-3 max-w-xl mx-auto my-2 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center mx-auto border border-violet-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-fg">No Active Subscription</h2>
          <p className="text-xs text-muted leading-relaxed">
            Select a plan below to activate your high-speed Claude 3.5 & 3.7 API key instantly.
          </p>
        </div>
      )}

      {/* AVAILABLE PLANS CATALOG */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-fg flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-600" />
            Available Claude Max Plans
          </h2>
          <p className="text-xs text-muted font-mono">
            30-day fixed validity · 5-hour rolling token refresh · Instant automated key delivery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(availablePlans.length > 0
            ? availablePlans
            : [
                {
                  id: 'pro',
                  name: 'PRO',
                  displayName: 'PRO (5M / 5h Window)',
                  tokenAllowance: '5000000',
                  tokenDisplay: '5M TOKENS / 5 HOURS',
                  windowHours: 5,
                  validityDays: 30,
                  priceInr: 2499,
                  originalPriceInr: 3499,
                  badge: 'STARTER CHOICE',
                  featured: false,
                  features: ['5,000,000 Tokens / 5h', 'Claude 3.5 Sonnet & Haiku', 'Instant Automated Delivery'],
                },
                {
                  id: 'max',
                  name: 'MAX',
                  displayName: 'MAX (20M / 5h Window)',
                  tokenAllowance: '20000000',
                  tokenDisplay: '20M TOKENS / 5 HOURS',
                  windowHours: 5,
                  validityDays: 30,
                  priceInr: 5999,
                  originalPriceInr: 7499,
                  badge: 'MOST POPULAR',
                  featured: true,
                  features: ['20,000,000 Tokens / 5h', 'Claude 3.5 Sonnet, Opus & Fable', 'Sub-50ms Gateway Routing'],
                },
                {
                  id: 'ultra',
                  name: 'ULTRA',
                  displayName: 'ULTRA (40M / 5h Window)',
                  tokenAllowance: '40000000',
                  tokenDisplay: '40M TOKENS / 5 HOURS',
                  windowHours: 5,
                  validityDays: 30,
                  priceInr: 8999,
                  originalPriceInr: 12999,
                  badge: 'BEST VALUE',
                  featured: false,
                  features: ['40,000,000 Tokens / 5h', 'Max Concurrency & Throughput', 'VIP Priority Support'],
                },
              ]
          ).map((p: any) => (
            <div
              key={p.id}
              className={`p-6 rounded-panel bg-card border flex flex-col justify-between space-y-5 shadow-xs relative transition-all ${
                p.featured
                  ? 'border-2 border-violet-500 shadow-lg shadow-violet-500/10'
                  : 'border-border hover:border-violet-300'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-[10px] font-mono font-extrabold uppercase px-3 py-0.5 rounded-full shadow-sm">
                  {p.badge}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200/60">
                    {p.name}
                  </span>
                  <span className="text-xs font-mono text-muted">{p.validityDays || 30} Days</span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-fg">{p.displayName || p.name}</h3>
                  <p className="text-xs text-muted font-mono mt-0.5">{p.tokenDisplay}</p>
                </div>
                <div className="pt-2 border-t border-border flex items-baseline gap-2">
                  <span className={`text-2xl font-extrabold font-mono ${p.featured ? 'text-violet-700' : 'text-fg'}`}>
                    ₹{p.priceInr.toLocaleString()}
                  </span>
                  {p.originalPriceInr && (
                    <span className="text-xs text-muted line-through font-mono">
                      ₹{p.originalPriceInr.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-muted font-mono"> / month</span>
                </div>

                <ul className="space-y-2 text-xs font-mono text-muted pt-2">
                  {p.features && p.features.length > 0 ? (
                    p.features.map((feat: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{p.tokenDisplay}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{p.windowHours || 5}h Refresh Window</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Instant Automated Delivery</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() =>
                    setSelectedPlanForCheckout({
                      id: p.id,
                      name: p.name,
                      priceInr: p.priceInr,
                      tokenDisplay: p.tokenDisplay,
                      windowHours: p.windowHours || 5,
                      validityDays: p.validityDays || 30,
                    })
                  }
                  className={`w-full py-3 rounded-control font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                    p.featured
                      ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white shadow-violet-500/25'
                      : 'bg-fg text-bg hover:bg-fg/90'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>BUY {p.name} — ₹{p.priceInr.toLocaleString()}</span>
                </button>

                <button
                  onClick={() =>
                    addToCart({
                      id: p.id,
                      planId: p.id,
                      name: p.name,
                      priceInr: p.priceInr,
                      originalPriceInr: p.originalPriceInr,
                      tokenDisplay: p.tokenDisplay,
                      windowHours: p.windowHours || 5,
                      validityDays: p.validityDays || 30,
                      tagline: p.tagline,
                      badge: p.badge,
                    })
                  }
                  className="w-full py-2 rounded-control font-bold text-xs border border-border text-muted hover:text-fg hover:bg-subtle flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>ADD TO CART</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PURCHASE HISTORY TABLE */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-fg flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-violet-600" />
          Purchase & Order History
        </h2>

        {data?.orders && data.orders.length > 0 ? (
          <div className="overflow-x-auto rounded-panel border border-border shadow-xs bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-border text-xs font-mono font-bold uppercase tracking-wider text-muted">
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3.5 font-bold text-fg">{o.internalOrderId}</td>
                    <td className="p-3.5 text-violet-700 font-semibold">{o.planName}</td>
                    <td className="p-3.5 font-bold">₹{o.amountInr.toLocaleString()}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          o.paymentStatus === 'CAPTURED' || o.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : o.paymentStatus === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-card border border-border rounded-panel text-center text-xs font-mono text-muted">
            No previous order history.
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          onClose={() => {
            setSelectedPlanForCheckout(null);
            fetchSubscriptions();
          }}
        />
      )}

      {/* API Key Revealed Modal */}
      {revealedKeyData && (
        <ApiKeyRevealModal
          isOpen={!!revealedKeyData}
          apiKey={revealedKeyData.key}
          planName={revealedKeyData.planName}
          quotaDisplay={revealedKeyData.quotaDisplay}
          windowHours={revealedKeyData.windowHours}
          onClose={() => {
            setRevealedKeyData(null);
            fetchSubscriptions();
          }}
        />
      )}
    </div>
  );
};

export default UserPlan;
