import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, CheckCircle2, Clock, Activity, Gift, CreditCard, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';
import { CheckoutModal } from '../../components/CheckoutModal';

export const UserPlan: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);

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
        <div className="p-8 bg-card border border-border rounded-panel text-center space-y-4 max-w-xl mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center mx-auto border border-violet-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-fg">No Active Claude Plan</h2>
          <p className="text-xs text-muted leading-relaxed">
            You currently have no active Claude Max plan. Choose from PRO (5M/5h), MAX (20M/5h), or ULTRA (40M/5h) to get instant API access.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
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
              className="ui-button-primary text-xs py-3 px-6 font-bold"
            >
              BROWSE PAID PLANS
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default UserPlan;
