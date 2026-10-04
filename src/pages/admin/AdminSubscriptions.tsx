import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Search, CheckCircle, Clock, AlertTriangle, Play, ShieldAlert, Package, Zap } from 'lucide-react';
import { adminFetch } from '../../utils/api';
import { ThreeDCard } from '../../components/ThreeDCard';

export const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [runningJob, setRunningJob] = useState(false);
  const [jobResult, setJobResult] = useState<string | null>(null);

  const fetchSubscriptionsAndMetrics = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(search.trim() && { search: search.trim() }),
      });

      const [subsRes, metricsRes] = await Promise.all([
        adminFetch(`/api/admin/subscriptions?${q.toString()}`),
        adminFetch('/api/admin/subscriptions/metrics'),
      ]);

      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubscriptions(data.subscriptions || []);
      }

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionsAndMetrics();
  }, [statusFilter]);

  const handleRunAutomation = async () => {
    setRunningJob(true);
    setJobResult(null);
    try {
      const res = await adminFetch('/api/admin/automation/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setJobResult(`Lifecycle Engine executed: Expiries evaluated, reminders sent.`);
        fetchSubscriptionsAndMetrics();
      } else {
        setJobResult(`Failed: ${data.error?.message}`);
      }
    } catch (e: any) {
      setJobResult(`Error: ${e.message}`);
    } finally {
      setRunningJob(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-600" />
            Subscription Lifecycle Engine
          </h1>
          <p className="text-xs text-muted mt-1">
            Centrally monitor active customer subscriptions, upcoming expiries, renewal rates, and trigger automation routines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAutomation}
            disabled={runningJob}
            className="ui-button-primary text-xs py-2 px-3 gap-2 font-bold inline-flex items-center bg-violet-600 hover:bg-violet-700 text-white"
          >
            {runningJob ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Run Lifecycle Engine</span>
          </button>
          <button
            onClick={fetchSubscriptionsAndMetrics}
            className="ui-button-secondary text-xs py-2 px-3 gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {jobResult && (
        <div className="p-3 bg-violet-50 border border-violet-200 text-violet-800 text-xs rounded-control font-mono">
          {jobResult}
        </div>
      )}

      {/* Metrics Row (Real DB Figures) */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ThreeDCard className="p-4 bg-white border border-border rounded-panel shadow-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted font-bold">Active Subscriptions</span>
            <p className="text-2xl font-extrabold text-emerald-600">{metrics.subscriptions?.active || 0}</p>
            <span className="text-[10px] text-muted">Currently active</span>
          </ThreeDCard>

          <ThreeDCard className="p-4 bg-white border border-border rounded-panel shadow-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted font-bold">Expiring in 7 Days</span>
            <p className="text-2xl font-extrabold text-amber-600">{metrics.subscriptions?.expiringIn7Days || 0}</p>
            <span className="text-[10px] text-muted">Renewal reminders queued</span>
          </ThreeDCard>

          <ThreeDCard className="p-4 bg-white border border-border rounded-panel shadow-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted font-bold">Expired Subscriptions</span>
            <p className="text-2xl font-extrabold text-rose-600">{metrics.subscriptions?.expired || 0}</p>
            <span className="text-[10px] text-muted">Awaiting reactivation</span>
          </ThreeDCard>

          <ThreeDCard className="p-4 bg-white border border-border rounded-panel shadow-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-muted font-bold">Fulfilled Today</span>
            <p className="text-2xl font-extrabold text-violet-600">{metrics.fulfillment?.completedToday || 0}</p>
            <span className="text-[10px] text-muted">Delivered successfully</span>
          </ThreeDCard>
        </div>
      )}

      {/* Low Stock Warning Banner if any */}
      {metrics?.lowStock && metrics.lowStock.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-panel text-xs text-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">⚠️ Low Stock Inventory Alert</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {metrics.lowStock.map((alert: any) => (
                <span
                  key={alert.planId}
                  className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-mono font-bold"
                >
                  {alert.displayName}: {alert.availableCount} left (Threshold: {alert.threshold})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'EXPIRING', label: 'Expiring Soon' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-white border border-border text-muted hover:text-fg hover:bg-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSubscriptionsAndMetrics();
          }}
          className="relative max-w-xs w-full"
        >
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plan or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-border rounded-control focus:outline-none focus:border-violet-500 font-mono"
          />
        </form>
      </div>

      {/* Subscriptions Table */}
      <ThreeDCard className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle/60 border-b border-border text-[10px] uppercase font-mono tracking-wider text-muted font-bold">
                <th className="py-3 px-4">Subscription ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Activated</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Days Left</th>
                <th className="py-3 px-4 text-right">Renewals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {loading && subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-violet-600" />
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-fg">{sub.id.substring(0, 8)}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-fg">{sub.user?.name}</p>
                      <p className="text-[10px] text-muted font-mono">{sub.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-fg">{sub.planName}</td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.status === 'EXPIRING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted">
                      {new Date(sub.activationTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-fg">
                      {new Date(sub.expiryTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`font-bold ${sub.daysRemaining <= 7 ? 'text-amber-600' : 'text-fg'}`}>
                        {sub.daysRemaining}d
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-fg">
                      {sub.renewalCount}x
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ThreeDCard>
    </div>
  );
};

export default AdminSubscriptions;
