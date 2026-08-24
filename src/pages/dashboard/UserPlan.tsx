import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, CheckCircle2, Clock, Activity, Gift, CreditCard, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';
import { CheckoutModal } from '../../components/CheckoutModal';
import { ApiKeyRevealModal } from '../../components/ApiKeyRevealModal';

export const UserPlan: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
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
      const [subRes, trialRes] = await Promise.all([
        adminFetch('/api/user/subscriptions'),
        adminFetch('/api/user/trial/status').catch(() => null),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setData(subData);
      }

      if (trialRes && trialRes.ok) {
        const tData = await trialRes.json();
        setTrialStatus(tData);
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
    return () => clearInterval(interval);
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
          onClick={() =>
            setSelectedPlanForCheckout({
              id: 'pro',
              name: 'PRO',
              priceInr: 2499,
              tokenDisplay: '5M TOKENS / 5 HOURS',
              windowHours: 5,
              validityDays: 30,
            })
          }
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

            <div className="p-4 bg-bg border border-border rounded-control space-y-1">
              <p className="text-[11px] text-muted font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ASSIGNED KEY
              </p>
              <p className="text-sm font-bold font-mono text-fg">{activeSub.apiKeyDisplay || 'Key Issued'}</p>
              <Link to="/dashboard/keys" className="text-[11px] text-violet-600 font-bold hover:underline">
                Manage Keys →
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
          {/* PRO PLAN */}
          <div className="p-6 rounded-panel bg-card border border-border flex flex-col justify-between space-y-5 shadow-xs hover:border-violet-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200/60">
                  Daily Coding
                </span>
                <span className="text-xs font-mono text-muted">30 Days</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-fg">PRO</h3>
                <p className="text-xs text-muted font-mono mt-0.5">5M Tokens / 5 Hours</p>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-2xl font-extrabold font-mono text-fg">₹2,499</span>
                <span className="text-xs text-muted font-mono"> / month</span>
              </div>
              <ul className="space-y-2 text-xs font-mono text-muted pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5,000,000 Tokens / 5h</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Claude 3.5 Sonnet & Haiku</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Automated Delivery</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() =>
                setSelectedPlanForCheckout({
                  id: 'pro',
                  name: 'PRO',
                  priceInr: 2499,
                  tokenDisplay: '5M TOKENS / 5 HOURS',
                  windowHours: 5,
                  validityDays: 30,
                })
              }
              className="w-full py-3 rounded-control bg-fg text-bg hover:bg-fg/90 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Zap className="w-4 h-4" />
              <span>BUY PRO — ₹2,499</span>
            </button>
          </div>

          {/* MAX PLAN (FEATURED) */}
          <div className="p-6 rounded-panel bg-card border-2 border-violet-500 relative flex flex-col justify-between space-y-5 shadow-lg shadow-violet-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-[10px] font-mono font-extrabold uppercase px-3 py-0.5 rounded-full shadow-sm">
              MOST POPULAR
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200/60">
                  Power Users
                </span>
                <span className="text-xs font-mono text-muted">30 Days</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-fg">MAX (20x)</h3>
                <p className="text-xs text-muted font-mono mt-0.5">20M Tokens / 5 Hours</p>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-2xl font-extrabold font-mono text-violet-700">₹4,999</span>
                <span className="text-xs text-muted font-mono"> / month</span>
              </div>
              <ul className="space-y-2 text-xs font-mono text-muted pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>20,000,000 Tokens / 5h</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Claude 3.5 Sonnet, Opus & Fable</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sub-50ms Gateway Routing</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() =>
                setSelectedPlanForCheckout({
                  id: 'max',
                  name: 'MAX (20x)',
                  priceInr: 4999,
                  tokenDisplay: '20M TOKENS / 5 HOURS',
                  windowHours: 5,
                  validityDays: 30,
                })
              }
              className="w-full py-3 rounded-control bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-500/25"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>BUY MAX — ₹4,999</span>
            </button>
          </div>

          {/* ULTRA PLAN */}
          <div className="p-6 rounded-panel bg-card border border-border flex flex-col justify-between space-y-5 shadow-xs hover:border-violet-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200/60">
                  Engineering Teams
                </span>
                <span className="text-xs font-mono text-muted">30 Days</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-fg">ULTRA</h3>
                <p className="text-xs text-muted font-mono mt-0.5">40M Tokens / 5 Hours</p>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-2xl font-extrabold font-mono text-fg">₹8,999</span>
                <span className="text-xs text-muted font-mono"> / month</span>
              </div>
              <ul className="space-y-2 text-xs font-mono text-muted pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>40,000,000 Tokens / 5h</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Max Concurrency & Dedicated Throughput</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>VIP Priority Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() =>
                setSelectedPlanForCheckout({
                  id: 'ultra',
                  name: 'ULTRA',
                  priceInr: 8999,
                  tokenDisplay: '40M TOKENS / 5 HOURS',
                  windowHours: 5,
                  validityDays: 30,
                })
              }
              className="w-full py-3 rounded-control bg-fg text-bg hover:bg-fg/90 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Zap className="w-4 h-4" />
              <span>BUY ULTRA — ₹8,999</span>
            </button>
          </div>
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
