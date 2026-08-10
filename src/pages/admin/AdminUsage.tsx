import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Clock, Zap, RefreshCw, Server } from 'lucide-react';

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
    const timer = setInterval(loadUsageData, 15000);
    return () => clearInterval(timer);
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
            <Activity className="w-6 h-6 text-amber-500" />
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
            className="px-3 py-1.5 text-xs bg-bg border border-border hover:bg-card text-fg rounded-control flex items-center gap-1.5 font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-control text-xs text-red-400 font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border p-5 rounded-panel">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Total Platform Tokens</p>
          <p className="text-2xl font-bold font-mono text-amber-500 mt-2">
            {data ? formatNum(data.totalTokensConsumed) : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted mt-1">
            {data ? `${formatNum(data.totalInputTokens)} in / ${formatNum(data.totalOutputTokens)} out` : 'Calculated aggregate'}
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-panel">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Total Requests Logged</p>
          <p className="text-2xl font-bold font-mono text-fg mt-2">
            {data ? data.totalRequests.toLocaleString() : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted mt-1">Completed API calls</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-panel">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Rolling 5-Hour Tokens</p>
          <p className="text-2xl font-bold font-mono text-emerald-500 mt-2">
            {data ? formatNum(data.rolling5hTokens) : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted mt-1">Active window tokens</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-panel">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Rolling 5-Hour Requests</p>
          <p className="text-2xl font-bold font-mono text-blue-500 mt-2">
            {data ? data.rolling5hRequests.toLocaleString() : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted mt-1">Window API requests</p>
        </div>
      </div>

      {/* Recent Request Ledger Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg font-mono uppercase tracking-wider">Latest API Request Ledgers</h2>
          <span className="text-[10px] font-mono text-muted">Showing top 50 recent requests</span>
        </div>

        {loading && !data ? (
          <div className="py-12 text-center text-xs text-muted font-mono">Loading request ledgers...</div>
        ) : !data || data.recentRequests.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted font-mono">No API requests logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Customer / Key</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Tokens (In / Out)</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Source Verification</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.recentRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-bg/40 font-mono">
                    <td className="py-3 px-4 text-muted text-[11px] font-bold">{r.requestId.slice(0, 12)}...</td>
                    <td className="py-3 px-4">
                      <p className="text-fg font-semibold">{r.keyName}</p>
                      <p className="text-[10px] text-muted">{r.customer}</p>
                    </td>
                    <td className="py-3 px-4 text-amber-500 font-bold">{r.model}</td>
                    <td className="py-3 px-4 font-bold text-fg">
                      {r.totalTokens.toLocaleString()} ({r.inputTokens} / {r.outputTokens})
                    </td>
                    <td className="py-3 px-4 text-muted">{r.latencyMs}ms</td>
                    <td className="py-3 px-4">
                      {r.usageSource === 'PROVIDER_REPORTED' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          PROVIDER REPORTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          LOCAL CALCULATED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </td>
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
