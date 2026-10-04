import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Calendar, CheckCircle, AlertTriangle, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { userFetch } from '../../utils/api';
import { ThreeDCard } from '../../components/ThreeDCard';

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

      // If checkout URL provided, redirect to PayU gateway
      if (data.order?.checkoutUrl) {
        window.location.href = data.order.checkoutUrl;
      } else if (data.order?.metadata?.checkoutUrl) {
        window.location.href = data.order.metadata.checkoutUrl;
      } else if (data.fulfillment?.success) {
        // Zero amount paid / instant renewal
        setSelectedSub(null);
        await fetchSubscriptions();
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          ACTIVE
        </span>
      );
    }
    if (status === 'EXPIRING' || (daysRemaining <= 7 && daysRemaining > 0)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          EXPIRING SOON
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          EXPIRED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-600" />
            My Subscriptions
          </h1>
          <p className="text-xs text-muted mt-1">
            Track your active service entitlements, validity periods, and manage seamless 1-click renewals.
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="ui-button-secondary text-xs py-2 px-3 self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-control text-xs text-rose-700 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && subscriptions.length === 0 && (
        <div className="py-20 text-center font-mono text-xs text-muted flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
          <span>Loading your subscriptions...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && subscriptions.length === 0 && !error && (
        <div className="text-center py-16 bg-white border border-border rounded-panel p-8 space-y-4">
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-fg">No Active Subscriptions Yet</h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            You don't have any active subscriptions. Purchase an AI API plan or subscription to view real-time entitlements and automated renewals here.
          </p>
          <a
            href="/pricing"
            className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold inline-flex items-center"
          >
            <span>Explore Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Subscriptions Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {subscriptions.map((sub) => (
          <ThreeDCard key={sub.id} className="p-6 bg-white border border-border rounded-panel shadow-xs space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold">
                  Entitlement ID: {sub.id.substring(0, 8)}
                </span>
                <h3 className="text-base font-extrabold text-fg mt-0.5">{sub.planName}</h3>
              </div>
              {getStatusBadge(sub.status, sub.daysRemaining)}
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-subtle/50 rounded-control border border-border/60 text-xs">
              <div>
                <p className="text-[10px] text-muted font-mono uppercase">Activated On</p>
                <p className="font-bold text-fg mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  {new Date(sub.activationTime).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted font-mono uppercase">Expires On</p>
                <p className="font-bold text-fg mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  {new Date(sub.expiryTime).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Days Remaining Meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">Days Remaining</span>
                <span className="font-bold text-fg">{sub.daysRemaining} days</span>
              </div>
              <div className="w-full bg-subtle rounded-full h-2 overflow-hidden border border-border/40">
                <div
                  className={`h-full transition-all rounded-full ${
                    sub.daysRemaining <= 3
                      ? 'bg-rose-500'
                      : sub.daysRemaining <= 7
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, (sub.daysRemaining / (sub.durationDays || 30)) * 100))}%` }}
                />
              </div>
            </div>

            {/* API Key Connection if present */}
            {sub.apiKey && (
              <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-control text-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-violet-700 font-bold uppercase">Linked API Key</p>
                  <p className="font-mono text-fg text-xs font-bold mt-0.5">{sub.apiKey.displayKey}</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
            )}

            {/* Renewal CTA */}
            <div className="pt-2 flex items-center justify-between border-t border-border/80">
              <div className="text-[11px] text-muted">
                {sub.renewalCount > 0 && (
                  <span>Renewed {sub.renewalCount} time{sub.renewalCount > 1 ? 's' : ''}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedSub(sub)}
                className={`text-xs py-2 px-4 rounded-control font-bold flex items-center gap-2 transition-all ${
                  sub.status === 'EXPIRING' || sub.daysRemaining <= 7
                    ? 'ui-button-primary bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : 'ui-button-primary'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{sub.status === 'EXPIRED' ? 'Reactivate Plan' : 'Renew Now'}</span>
              </button>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {/* Renewal Confirmation Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-panel max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600" />
                Renew Subscription
              </h3>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-muted hover:text-fg text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-subtle/60 rounded-control border border-border/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Plan:</span>
                <span className="font-bold text-fg">{selectedSub.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Current Expiry:</span>
                <span className="font-mono text-fg">{new Date(selectedSub.expiryTime).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">New Expiry (Extended):</span>
                <span className="font-mono text-emerald-600 font-bold">
                  +{selectedSub.durationDays || 30} days from current expiration
                </span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2">
                <span className="text-muted">Reward Cash Back:</span>
                <span className="font-bold text-amber-600">⚡ 10% Lightning Credits earned</span>
              </div>
            </div>

            {renewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-control flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{renewError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="ui-button-secondary text-xs py-2 px-3"
                disabled={renewing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenew}
                disabled={renewing}
                className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold flex items-center"
              >
                {renewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{renewing ? 'Redirecting to Gateway...' : 'Proceed to Checkout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubscriptions;
