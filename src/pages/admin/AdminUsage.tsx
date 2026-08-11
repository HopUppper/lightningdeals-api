import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Clock, Zap, RefreshCw } from 'lucide-react';
import { ThreeDCard } from '../../components/ThreeDCard';

interface RequestItem {
  id: string;
  requestId: string;
  model: string;
  endpoint: string;
  keyName: string;
  displayKey: string;
  customer: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  statusCode: number;
  isEstimated: boolean;
  usageSource: string;
  createdAt: string;
}

interface UsageSummary {
  totalTokensConsumed: string;
  totalInputTokens: string;
  totalOutputTokens: string;
  totalRequests: number;
  rolling5hTokens: string;
  rolling5hRequests: number;
  recentRequests: RequestItem[];
}

export const AdminUsage: React.FC = () => {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadUsageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/usage');
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setError(`Failed to fetch usage metrics (HTTP ${res.status})`);
      }
    } catch (e: any) {
      setError(e.message || 'Network error fetching usage metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageData();
    const interval = setInterval(loadUsageData, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatNum = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-600" />
            <span>Platform Usage & Token Accounting Ledger</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Authoritative token consumption analytics, 5-hour rolling usage metrics, and source-verified API request ledgers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] font-mono text-muted">Last updated: {lastUpdated}</span>
          )}
          <button
            onClick={loadUsageData}
            className="px-3 py-1.5 text-xs bg-white border border-border hover:bg-subtle text-fg rounded-control flex items-center gap-1.5 font-mono shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-control text-xs text-red-700 font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3D Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Total Platform Tokens</p>
            <p className="text-2xl font-bold font-mono text-violet-700 mt-2">
              {data ? formatNum(data.totalTokensConsumed) : '...'}
            </p>
            <p className="text-[11px] font-mono text-muted mt-1">
              {data ? `${formatNum(data.totalInputTokens)} in / ${formatNum(data.totalOutputTokens)} out` : 'Calculated aggregate'}
            </p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Total Requests Logged</p>
            <p className="text-2xl font-bold font-mono text-fg mt-2">
              {data ? data.totalRequests.toLocaleString() : '...'}
            </p>
            <p className="text-[11px] font-mono text-muted mt-1">Completed API calls</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Rolling 5-Hour Tokens</p>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">
              {data ? formatNum(data.rolling5hTokens) : '...'}
            </p>
            <p className="text-[11px] font-mono text-muted mt-1">Active window tokens</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="glass-3d-card p-5 rounded-panel h-full flex flex-col justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Rolling 5-Hour Calls</p>
            <p className="text-2xl font-bold font-mono text-cyan-600 mt-2">
              {data ? data.rolling5hRequests.toLocaleString() : '...'}
            </p>
            <p className="text-[11px] font-mono text-muted mt-1">Recent 5h volume</p>
          </div>
        </ThreeDCard>
      </div>

      {/* Recent Request Activity Ledger */}
      <div className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-600" />
            <span>Recent API Request Activity Log</span>
          </h3>
          <span className="text-[11px] font-mono text-muted">Showing latest 20 requests</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-muted">Loading request logs...</div>
        ) : !data?.recentRequests || data.recentRequests.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted">No API request activity recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg">
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Request ID</th>
                  <th className="py-3 px-4 font-bold">Model</th>
                  <th className="py-3 px-4 font-bold">Key Name</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Input / Output</th>
                  <th className="py-3 px-4 font-bold">Total Tokens</th>
                  <th className="py-3 px-4 text-right font-bold">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {data.recentRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-subtle">
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-fg">{r.requestId || r.id.substring(0, 8)}</td>
                    <td className="py-3 px-4 font-bold text-violet-700">{r.model}</td>
                    <td className="py-3 px-4 text-fg font-sans font-medium">{r.keyName}</td>
                    <td className="py-3 px-4 text-muted font-sans">{r.customer}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.statusCode >= 200 && r.statusCode < 300
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {r.statusCode || 200}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {r.inputTokens} / {r.outputTokens}
                    </td>
                    <td className="py-3 px-4 font-bold text-fg">{r.totalTokens.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold">{r.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
