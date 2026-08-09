import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Key, Activity, Zap, Server, ShieldCheck, DollarSign, Clock } from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetch('/api/admin/overview');
        if (res.ok) {
          setOverview(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-muted">Loading LightningDeals metrics...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">LightningDeals Control Center</h1>
          <p className="text-xs text-muted mt-1">
            Real-time analytics for revenue, active customers, API keys, prepaid token accounting, and vendor connectivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/providers" className="ui-button-secondary text-xs py-2 px-3.5 gap-2 border-amber-500/30 text-amber-500">
            <Server className="w-3.5 h-3.5" />
            <span>Manage Vendor Master Keys</span>
          </Link>
          <Link to="/admin/keys" className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold">
            + Create API Key
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-panel">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-mono uppercase">Prepaid Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-fg">₹{(overview?.revenueInr || 0).toLocaleString()}</p>
          <p className="text-xs text-muted mt-2 font-medium">{overview?.totalOrders || 0} orders paid</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-panel">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-mono uppercase">Customers</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-fg">{overview?.totalUsers || 0}</p>
          <p className="text-xs text-emerald-600 mt-2 font-medium">{overview?.activeUsers || 0} active</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-panel">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-mono uppercase">Tokens Sold</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-fg">{formatTokens(overview?.tokensSold)}</p>
          <p className="text-xs text-muted mt-2">Available: {formatTokens(overview?.tokensRemaining)}</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-panel">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-mono uppercase">Tokens Consumed</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-fg">{formatTokens(overview?.tokensConsumed)}</p>
          <p className="text-xs text-muted mt-2">Requests: {(overview?.totalRequests || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Health & Vendor Status */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-panel flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted uppercase">Vendor Connectivity</p>
            <p className="text-lg font-bold font-mono text-fg mt-1 uppercase">{overview?.vendorStatus}</p>
          </div>
          <Server className="w-6 h-6 text-amber-500 opacity-80" />
        </div>

        <div className="bg-card border border-border p-5 rounded-panel flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted uppercase">Gateway Error Rate</p>
            <p className="text-lg font-bold font-mono text-fg mt-1">{overview?.errorRate || '0.0%'}</p>
          </div>
          <ShieldCheck className="w-6 h-6 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-card border border-border p-5 rounded-panel flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted uppercase">Average Latency</p>
            <p className="text-lg font-bold font-mono text-fg mt-1">{overview?.avgLatencyMs || 0} ms</p>
          </div>
          <Clock className="w-6 h-6 text-accent opacity-80" />
        </div>
      </div>
    </div>
  );
};
