import React, { useState, useEffect } from 'react';
import {
  Layers,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  X,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { userFetch } from '../../utils/api';

export const UserSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Renewal Modal State
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [redeemCredits, setRedeemCredits] = useState<number>(0);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userFetch('/api/user/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        const err = await res.json();
        setError(err.error?.message || 'Failed to load your subscriptions.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error fetching subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleRenew = async () => {
    if (!selectedSub) return;
    setRenewing(true);
    setRenewError(null);
    try {
      const res = await userFetch(`/api/user/subscriptions/${selectedSub.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: couponCode.trim() || undefined,
          redeemCredits: redeemCredits > 0 ? redeemCredits : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to process renewal.');
      }

      // If checkout URL provided, redirect to gateway
      if (data.order?.checkoutUrl) {
        window.location.href = data.order.checkoutUrl;
      } else if (data.order?.metadata?.checkoutUrl) {
        window.location.href = data.order.metadata.checkoutUrl;
      } else {
        setSelectedSub(null);
        await fetchSubscriptions();
      }
    } catch (e: any) {
      setRenewError(e.message || 'Renewal initiation failed.');
    } finally {
      setRenewing(false);
    }
  };

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Active
        </span>
      );
    }
    if (status === 'EXPIRING' || (daysRemaining <= 7 && daysRemaining > 0)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Expiring Soon ({daysRemaining} days left)
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-subtle text-muted border border-border">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                  Subscriptions & Renewals
                </h1>
                <span className="text-[11px] font-bold text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-full border border-violet-200">
                  Rolling 5h Quota
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Manage your active subscription allocations and easily renew or apply promotional credits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            to="/pricing"
            className="ui-button-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
          >
            <span>Explore Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Subscriptions Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
          Loading your subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-border/80 text-center shadow-playful space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-100">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-fg">No Active Subscriptions</h3>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            You don't have an active subscription yet. Check out our capacity plans to enjoy unlimited rolling 5-hour Claude intelligence!
          </p>
          <Link to="/pricing" className="ui-button-primary text-xs py-2.5 px-6 font-bold inline-block">
            View Plans & Pricing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions.map((sub) => {
            const daysRemaining = Math.max(
              0,
              Math.ceil(
                (new Date(sub.currentPeriodEnd).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
            return (
              <div
                key={sub.id}
                className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-fg">
                        {sub.planName || 'Active Capacity Plan'}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {sub.quotaDisplay || `${sub.rollingWindowTokens || '2.5M'} tokens / 5 hours`}
                      </p>
                    </div>
                    {getStatusBadge(sub.status, daysRemaining)}
                  </div>

                  <div className="mt-5 p-4 rounded-2xl bg-subtle/40 border border-border/80 space-y-2 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>Billing Period:</span>
                      <span className="font-bold text-fg">
                        {sub.periodType || '30-Day Cycle'}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Renews / Expires:</span>
                      <span className="font-bold text-fg">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()} ({daysRemaining} days left)
                      </span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Plan Price:</span>
                      <span className="font-black text-fg">
                        ₹{Number(sub.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted font-medium">
                    Auto-renew with discount
                  </span>
                  <button
                    onClick={() => {
                      setSelectedSub(sub);
                      setCouponCode('');
                      setRedeemCredits(0);
                    }}
                    className="ui-button-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Renew Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Renewal Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-fg">Renew Subscription</h3>
                  <p className="text-xs text-muted">{selectedSub.planName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-xl hover:bg-subtle text-muted hover:text-fg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renewError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {renewError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-200 flex justify-between items-center">
                <span className="font-bold text-violet-900">Renewal Total:</span>
                <span className="text-lg font-black text-violet-900">
                  ₹{Number(selectedSub.price || 0).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block font-bold text-fg uppercase tracking-wider mb-1.5">
                  Coupon Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter discount coupon..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-border/80 rounded-2xl px-4 py-2.5 text-xs text-fg uppercase focus:outline-none focus:border-violet-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-fg uppercase tracking-wider mb-1.5">
                  Redeem Lightning Credits (₹1 = 1 Credit)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={redeemCredits || ''}
                  onChange={(e) => setRedeemCredits(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-border/80 rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-violet-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2.5 rounded-2xl border border-border/80 text-muted font-bold text-xs hover:bg-subtle cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenew}
                disabled={renewing}
                className="ui-button-primary text-xs py-2.5 px-5 font-bold cursor-pointer disabled:opacity-50"
              >
                {renewing ? 'Processing Renewal...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubscriptions;
