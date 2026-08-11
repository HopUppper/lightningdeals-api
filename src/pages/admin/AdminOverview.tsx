import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Key, Activity, Zap, Server, ShieldCheck, DollarSign, Clock } from 'lucide-react';
import { ThreeDCard } from '../../components/ThreeDCard';

export const AdminOverview: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState(false);

  const loadOverview = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setUpdateError(false);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        setOverview(await res.json());
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setUpdateError(true);
      }
    } catch (e) {
      setUpdateError(true);
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

  if (loading) {
    return <div className="py-12 text-center text-xs font-mono text-muted">Loading LightningDeals metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">LightningDeals Operations Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted">
              Authoritative real-time metrics for prepaid orders, active customer keys, token ledgers, and vendor connection status.
            </p>
            {lastUpdated && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                updateError
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-violet-50 border-violet-200 text-violet-700'
              }`}>
                {updateError ? `Update Failed (Data as of ${lastUpdated})` : `Last updated: ${lastUpdated} (Auto-refreshes 15s)`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/providers" className="ui-button-secondary text-xs py-2 px-3.5 gap-2 border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100">
            <Server className="w-3.5 h-3.5" />
            <span>Manage Vendor Master Keys</span>
          </Link>
          <Link to="/admin/keys" className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold">
            + Create API Key
          </Link>
        </div>
      </div>

      {/* KPI 3D Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Prepaid Revenue</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-fg">₹{(overview?.revenueInr || 0).toLocaleString()}</p>
            <p className="text-xs text-muted mt-1 font-medium">{overview?.totalOrders || 0} orders paid</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Customers</span>
              <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-fg">{overview?.totalUsers || 0}</p>
            <p className="text-xs text-violet-700 mt-1 font-semibold">{overview?.activeUsers || 0} active accounts</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Tokens Sold</span>
              <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-200">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-fg">{formatTokens(overview?.tokensSold)}</p>
            <p className="text-xs text-muted mt-1 font-mono">Available: {formatTokens(overview?.tokensRemaining)}</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Tokens Consumed</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-fg">{formatTokens(overview?.tokensConsumed)}</p>
            <p className="text-xs text-muted mt-1 font-mono">Requests: {(overview?.totalRequests || 0).toLocaleString()}</p>
          </div>
        </ThreeDCard>
      </div>

      {/* Health & Vendor Status 3D Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <ThreeDCard intensity={6}>
          <div className="glass-3d-card p-5 rounded-panel flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Vendor Connectivity</p>
              <p className="text-base font-bold font-mono text-fg mt-1 uppercase">{overview?.vendorStatus}</p>
            </div>
            <Server className="w-6 h-6 text-violet-600 opacity-80" />
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={6}>
          <div className="glass-3d-card p-5 rounded-panel flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Gateway Error Rate</p>
              <p className="text-base font-bold font-mono text-emerald-600 mt-1">{overview?.errorRate || '0.0%'}</p>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-600 opacity-80" />
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={6}>
          <div className="glass-3d-card p-5 rounded-panel flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Average Latency</p>
              <p className="text-base font-bold font-mono text-fg mt-1">{overview?.avgLatencyMs || 0} ms</p>
            </div>
            <Clock className="w-6 h-6 text-cyan-600 opacity-80" />
          </div>
        </ThreeDCard>
      </div>
    </div>
  );
};
