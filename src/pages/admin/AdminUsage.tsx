import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Clock, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { adminFetch } from '../../utils/api';

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
  errorCode?: string | null;
  errorMessage?: string | null;
  exactFailureReason?: string | null;
  isEstimated: boolean;
  usageSource: string;
  clientPlatform?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
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
      const res = await adminFetch('/api/admin/usage');
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

  const [reconciliationResult, setReconciliationResult] = useState<any>(null);
  const [reconciling, setReconciling] = useState(false);

  const handleReconcileUsage = async () => {
    setReconciling(true);
    try {
      const res = await adminFetch('/api/admin/usage/reconcile');
      if (res.ok) {
        setReconciliationResult(await res.json());
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setReconciling(false);
    }
  };

  const renderPlatformBadge = (platform?: string, userAgent?: string | null) => {
    if (!platform || platform === 'Unknown Client') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-subtle text-muted border border-border" title={userAgent || 'Unknown'}>
          HTTP Client
        </span>
      );
    }

    const pLower = platform.toLowerCase();

    if (pLower.includes('claude code')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>⚡</span> {platform}
        </span>
      );
    }

    if (pLower.includes('cursor')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-700 border border-cyan-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🎯</span> {platform}
        </span>
      );
    }

    if (pLower.includes('vscode') || pLower.includes('vs code') || pLower.includes('cline') || pLower.includes('roo')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>💻</span> {platform}
        </span>
      );
    }

    if (pLower.includes('windsurf')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-700 border border-teal-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🌊</span> {platform}
        </span>
      );
    }

    if (pLower.includes('python')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🐍</span> {platform}
        </span>
      );
    }

    if (pLower.includes('node') || pLower.includes('typescript') || pLower.includes('js')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🟢</span> {platform}
        </span>
      );
    }

    if (pLower.includes('curl')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 border border-slate-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>⌨️</span> {platform}
        </span>
      );
    }

    if (pLower.includes('playground')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-700 border border-violet-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🧪</span> {platform}
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-subtle text-fg border border-border" title={userAgent || platform}>
        {platform}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-fg flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            <span>Real-Time Token Accounting & Usage Analytics</span>
          </h2>
          <p className="text-xs font-mono text-muted mt-1">
            Authoritative rolling 5-hour consumption window ledger and historical audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastUpdated && (
            <span className="text-[11px] font-mono text-muted">
              Updated: <span className="text-fg">{lastUpdated}</span>
            </span>
          )}
          <button
            onClick={handleReconcileUsage}
            disabled={reconciling}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-border bg-subtle hover:bg-subtle/80 text-fg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Reconcile key token usage balances against API request logs"
          >
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>{reconciling ? 'Reconciling...' : 'Reconcile'}</span>
          </button>
          <button
            onClick={loadUsageData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-border bg-subtle hover:bg-subtle/80 text-fg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {reconciliationResult && (
        <div className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
          reconciliationResult.isReconciled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {reconciliationResult.isReconciled
                ? `Token Ledger Verified! Logged request tokens match accounting totals across ${reconciliationResult.checkedCount} records.`
                : `Discrepancy detected across ${reconciliationResult.discrepancies?.length || 0} records.`}
            </span>
          </div>
          <button onClick={() => setReconciliationResult(null)} className="text-muted hover:text-fg font-mono text-xs p-1">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="technical-panel p-5 flex flex-col justify-between space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Total Platform Tokens</p>
          <p className="text-2xl font-bold font-mono text-accent tabular-nums">
            {data ? formatNum(data.totalTokensConsumed) : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted">Lifetime tokens routed</p>
        </div>

        <div className="technical-panel p-5 flex flex-col justify-between space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Total Requests Logged</p>
          <p className="text-2xl font-bold font-mono text-fg tabular-nums">
            {data ? data.totalRequests.toLocaleString() : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted">Completed API proxy calls</p>
        </div>

        <div className="technical-panel p-5 flex flex-col justify-between space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Rolling 5-Hour Tokens</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {data ? formatNum(data.rolling5hTokens) : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted">Active window consumption</p>
        </div>

        <div className="technical-panel p-5 flex flex-col justify-between space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Rolling 5-Hour Calls</p>
          <p className="text-2xl font-bold font-mono text-accent tabular-nums">
            {data ? data.rolling5hRequests.toLocaleString() : '...'}
          </p>
          <p className="text-[11px] font-mono text-muted">Recent window throughput</p>
        </div>
      </div>

      {/* Recent Request Activity Ledger */}
      <div className="technical-panel overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-subtle/30">
          <h3 className="text-xs font-mono font-bold text-fg uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span>Recent API Request Activity Log & Client Detection Audit</span>
          </h3>
          <span className="text-[11px] font-mono text-muted">Last 50 edge requests</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading request logs...
          </div>
        ) : !data?.recentRequests || data.recentRequests.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted">No API request activity recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted uppercase bg-subtle/50 text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Model</th>
                  <th className="py-3 px-4 font-bold">Key & Customer</th>
                  <th className="py-3 px-4 font-bold">Client / Platform</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold">Failure / Success Reason</th>
                  <th className="py-3 px-4 font-bold text-right">Tokens Consumed</th>
                  <th className="py-3 px-4 text-right font-bold">Latency / Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.recentRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-fg text-xs">
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-muted tabular-nums">
                        {new Date(r.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-accent">{r.model}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-fg">{r.keyName}</p>
                      <p className="text-[10px] text-muted">{r.displayKey} · {r.customer}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderPlatformBadge(r.clientPlatform, r.userAgent)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.statusCode >= 200 && r.statusCode < 300
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}>
                        {r.statusCode || 200}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs font-sans">
                      {r.statusCode >= 400 ? (
                        <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-700 text-[11px] flex items-start gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{r.exactFailureReason || r.errorMessage || r.errorCode || 'Request Failed'}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Request Completed Successfully</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-fg font-bold tabular-nums">
                      {r.totalTokens.toLocaleString()} <span className="text-[10px] text-muted font-normal">({r.inputTokens}in / {r.outputTokens}out)</span>
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold tabular-nums">
                      {r.latencyMs >= 1000 ? `${(r.latencyMs / 1000).toFixed(1)} s` : `${r.latencyMs} ms`}
                      {r.outputTokens > 50 && r.latencyMs >= 1000 && (
                        <span className="text-[10px] text-muted font-normal block">
                          {Math.round(r.outputTokens / (r.latencyMs / 1000))} tok/s
                        </span>
                      )}
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

export default AdminUsage;
