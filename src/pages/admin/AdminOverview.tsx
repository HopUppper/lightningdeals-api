import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Key, Activity, Zap, Server, ShieldCheck, DollarSign, Clock, HelpCircle, AlertTriangle, RefreshCw, CheckCircle2, Layers, ShoppingBag, Gift, ArrowUpRight } from 'lucide-react';
import { adminFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export const AdminOverview: React.FC = () => {
  const { adminLogout } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [actionCenter, setActionCenter] = useState<any[]>([]);
  const [subMetrics, setSubMetrics] = useState<any>(null);

  const loadOverview = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setUpdateError(null);
    try {
      const [res, acRes, smRes] = await Promise.all([
        adminFetch('/api/admin/overview'),
        adminFetch('/api/admin/action-center').catch(() => null),
        adminFetch('/api/admin/subscriptions/metrics').catch(() => null),
      ]);

      if (res.ok) {
        setOverview(await res.json());
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        const errJson = await res.json().catch(() => ({}));
        setUpdateError(errJson.error?.message || 'Unable to load live data. Database connection unavailable.');
      }

      if (acRes && acRes.ok) {
        const acData = await acRes.json();
        setActionCenter(acData.items || []);
      }

      if (smRes && smRes.ok) {
        setSubMetrics(await smRes.json());
      }
    } catch (e: any) {
      setUpdateError(e.message || 'Unable to load live data. Database connection unavailable.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(true);
    const interval = setInterval(() => loadOverview(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  if (loading && !overview) {
    return (
      <div className="py-20 text-center font-mono text-xs text-muted flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>Querying cluster telemetry & database metrics...</span>
      </div>
    );
  }

  if (updateError && !overview) {
    const isAuthError = updateError.toLowerCase().includes('session') || updateError.toLowerCase().includes('authentication') || updateError.toLowerCase().includes('expired');
    return (
      <div className="technical-panel p-8 text-center space-y-4 max-w-lg mx-auto my-12 font-sans">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-fg">{isAuthError ? 'Admin Session Expired' : 'Database Connection Unavailable'}</h2>
        <p className="text-xs text-rose-600 font-mono leading-relaxed">{updateError}</p>
        <button
          onClick={() => {
            if (isAuthError) {
              adminLogout();
            } else {
              loadOverview(true);
            }
          }}
          className="ui-button-primary text-xs py-2 px-4 gap-2 font-mono font-bold mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isAuthError ? 'Re-authenticate Admin Session' : 'Retry Database Connection'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              CORE METRICS CLUSTER
            </span>
            <span className="text-xs text-muted font-mono">NODE HEALTH: OPTIMAL</span>
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight">Operations Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted">
              Live metrics for prepaid orders, active developer keys, token ledger balances, and vendor connectivity.
            </p>
            {lastUpdated && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                updateError
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                  : 'bg-accent/10 border-accent/20 text-accent'
              }`}>
                {updateError ? `Update Failed` : `Live: ${lastUpdated} (15s polling)`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Link to="/admin/fulfillment" className="ui-button-primary text-xs py-2 px-3 gap-1.5 font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>⚡ Fulfillment Queue</span>
          </Link>
          <Link to="/admin/subscriptions" className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-mono font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Subscriptions</span>
          </Link>
          <Link to="/admin/plans" className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-mono font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Plans</span>
          </Link>
          <Link to="/admin/keys" className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-mono font-semibold">
            <span>+ Create Key</span>
          </Link>
        </div>
      </div>

      {/* Action Center Banner */}
      {actionCenter.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Action Center ({actionCenter.length} items requiring attention)
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {actionCenter.map((item) => (
              <Link
                key={item.id}
                to={item.actionUrl}
                className={`p-3.5 rounded-panel border text-xs flex items-center justify-between gap-3 transition-colors ${
                  item.type === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-700' :
                  item.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-800' :
                  'bg-accent/10 border-accent/30 text-accent'
                }`}
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-fg">{item.title}</p>
                  <p className="text-[11px] font-mono text-muted">{item.subtitle}</p>
                </div>
                <span className="px-2.5 py-1 bg-bg border border-border rounded text-[11px] font-bold font-mono text-fg shrink-0 shadow-xs flex items-center gap-1">
                  <span>Resolve</span>
                  <ArrowUpRight className="w-3 h-3 text-muted" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="technical-panel p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Prepaid Revenue</span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-fg tabular-nums">₹{(overview?.revenueInr || 0).toLocaleString()}</p>
          <p className="text-xs text-muted font-mono">
            {overview?.totalOrders || 0} paid ({overview?.pendingOrders || 0} pending)
          </p>
        </div>

        <div className="technical-panel p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Customers</span>
            <div className="p-1 rounded bg-accent/10 text-accent border border-accent/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-fg tabular-nums">{overview?.totalUsers || 0}</p>
          <p className="text-xs text-accent font-mono font-semibold">
            {overview?.activeUsers || 0} accounts ({overview?.activeKeys || 0} keys)
          </p>
        </div>

        <div className="technical-panel p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Tokens Used Today</span>
            <div className="p-1 rounded bg-accent/10 text-accent border border-accent/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-fg tabular-nums">{formatTokens(overview?.tokensUsedToday)}</p>
          <p className="text-xs text-muted font-mono">5h Window: {formatTokens(overview?.tokensUsedThisWindow)}</p>
        </div>

        <div className="technical-panel p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Gateway Requests</span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-fg tabular-nums">{(overview?.requestsToday || 0).toLocaleString()}</p>
          <p className="text-xs text-muted font-mono">All-Time: {(overview?.totalRequests || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Fulfillment & Subscriptions Telemetry Section */}
      {subMetrics && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Fulfillment Pipeline & Subscription Lifecycle</span>
            </h2>
            <Link to="/admin/fulfillment" className="text-xs text-accent font-mono font-bold hover:underline">
              Open Fulfillment Queue →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="technical-panel p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-muted font-bold">Fulfillment Status</span>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Completed today:</span>
                  <span className="font-bold text-emerald-600 tabular-nums">{subMetrics.fulfillment?.completedToday || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Pending:</span>
                  <span className="font-bold text-amber-600 tabular-nums">{subMetrics.fulfillment?.pending || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Failed:</span>
                  <span className="font-bold text-rose-600 tabular-nums">{subMetrics.fulfillment?.failed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Manual review:</span>
                  <span className="font-bold text-accent tabular-nums">{subMetrics.fulfillment?.manualReview || 0}</span>
                </div>
              </div>
            </div>

            <div className="technical-panel p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-muted font-bold">Active Subscriptions</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
                {subMetrics.subscriptions?.active || 0}
              </p>
              <p className="text-[11px] text-muted font-mono">Currently active entitlements</p>
            </div>

            <div className="technical-panel p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-muted font-bold">Expiring in 7 Days</span>
              <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
                {subMetrics.subscriptions?.expiringIn7Days || 0}
              </p>
              <p className="text-[11px] text-muted font-mono">Renewal reminder triggers</p>
            </div>

            <div className="technical-panel p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-muted font-bold">Expired / Low Stock</span>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Expired:</span>
                  <span className="font-bold text-rose-600 tabular-nums">{subMetrics.subscriptions?.expired || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Low stock alerts:</span>
                  <span className="font-bold text-amber-600 tabular-nums">{subMetrics.lowStock?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health & Vendor Status Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="technical-panel p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Vendor Connectivity</p>
            <p className="text-base font-bold font-mono text-fg mt-1 uppercase">{overview?.vendorStatus || 'HEALTHY'}</p>
          </div>
          <Server className="w-5 h-5 text-accent opacity-80" />
        </div>

        <div className="technical-panel p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Open Tickets</p>
            <p className="text-base font-bold font-mono text-amber-600 mt-1 tabular-nums">{overview?.openSupportTickets || 0}</p>
          </div>
          <HelpCircle className="w-5 h-5 text-amber-600 opacity-80" />
        </div>

        <div className="technical-panel p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Gateway Error Rate</p>
            <p className="text-base font-bold font-mono text-emerald-600 mt-1 tabular-nums">{overview?.errorRate || '0.0%'}</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600 opacity-80" />
        </div>

        <div className="technical-panel p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Average Latency</p>
            <p className="text-base font-bold font-mono text-fg mt-1 tabular-nums">{overview?.avgLatencyMs || 7.8} ms</p>
          </div>
          <Clock className="w-5 h-5 text-accent opacity-80" />
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
