import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, FileText } from 'lucide-react';

export const UserUsage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'ledger'>('requests');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/user/usage');
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-muted">Loading usage analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Usage & Token Ledger</h1>
        <p className="text-xs text-muted mt-1">
          Detailed request history, model consumption metrics, and immutable token ledger entries.
        </p>
      </div>

      {/* Aggregate Usage Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-panel">
          <p className="text-xs font-mono text-muted uppercase">Total Purchased</p>
          <p className="text-2xl font-bold font-mono text-fg mt-1">
            {formatTokens(stats?.totalPurchased)}
          </p>
        </div>
        <div className="bg-card border border-border p-5 rounded-panel">
          <p className="text-xs font-mono text-muted uppercase">Tokens Consumed</p>
          <p className="text-2xl font-bold font-mono text-amber-500 mt-1">
            {formatTokens(stats?.totalUsed)}
          </p>
        </div>
        <div className="bg-card border border-border p-5 rounded-panel">
          <p className="text-xs font-mono text-muted uppercase">Tokens Available</p>
          <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">
            {formatTokens(stats?.totalRemaining)}
          </p>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-control text-xs font-semibold ${
            activeTab === 'requests' ? 'bg-amber-500 text-black' : 'text-muted hover:text-fg'
          }`}
        >
          API Request History
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-control text-xs font-semibold ${
            activeTab === 'ledger' ? 'bg-amber-500 text-black' : 'text-muted hover:text-fg'
          }`}
        >
          Immutable Token Ledger
        </button>
      </div>

      {/* Request Log History */}
      {activeTab === 'requests' && (
        <div className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg">Recent API Requests</h3>

          {stats?.recentRequests?.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted border border-dashed border-border rounded-control">
              No API request activity recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                    <th className="py-2.5 px-3">Request ID</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Input</th>
                    <th className="py-2.5 px-3">Output</th>
                    <th className="py-2.5 px-3">Total Tokens</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats?.recentRequests?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-bg/40">
                      <td className="py-2.5 px-3 font-mono text-muted text-[11px] truncate max-w-[100px]">{r.requestId}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-fg">{r.model}</td>
                      <td className="py-2.5 px-3 font-mono text-muted">{r.inputTokens}</td>
                      <td className="py-2.5 px-3 font-mono text-muted">{r.outputTokens}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-fg">{r.totalTokens}</td>
                      <td className="py-2.5 px-3 font-mono text-muted">{r.latencyMs} ms</td>
                      <td className="py-2.5 px-3 font-mono">
                        {r.statusCode < 400 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Success</span>
                          </span>
                        ) : (
                          <div className="flex flex-col font-sans" title={r.errorMessage || r.errorCode || 'Failed'}>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 inline-flex items-center gap-1 w-fit font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span>
                                {r.statusCode === 503
                                  ? '503 (Upstream Outage)'
                                  : r.statusCode === 429
                                  ? '429 (Rate Limit)'
                                  : `${r.statusCode} (${r.errorCode || 'Failed'})`}
                              </span>
                            </span>
                            {r.errorMessage && (
                              <span className="text-[9px] text-red-400 truncate max-w-[180px] mt-0.5 font-normal">
                                {r.errorMessage}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Immutable Token Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-fg">Immutable Token Balance Ledger</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Token Amount</th>
                  <th className="py-2.5 px-3">Balance After</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats?.ledgerEntries?.map((l: any) => (
                  <tr key={l.id} className="hover:bg-bg/40">
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        Number(l.amount) > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {Number(l.amount) > 0 ? `+${formatTokens(l.amount)}` : formatTokens(l.amount)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-fg font-semibold">{formatTokens(l.balanceAfter)}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{l.reference || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{l.notes || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-muted whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
