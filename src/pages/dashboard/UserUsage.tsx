import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, FileText, Zap, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const UserUsage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'ledger'>('requests');
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  const loadStats = async () => {
    try {
      const res = await adminFetch('/api/user/usage');
      if (res.ok) {
        setStats(await res.json());
      } else {
        setError('Unable to load your account data.');
      }
    } catch (e) {
      setError('Unable to load your account data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 5-Hour Rolling Window Live Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nextWindow = new Date(now);
      const currentHour = now.getHours();
      const nextHour = Math.ceil((currentHour + 1) / 5) * 5;
      nextWindow.setHours(nextHour % 24, 0, 0, 0);
      if (nextHour >= 24) nextWindow.setDate(nextWindow.getDate() + 1);

      const diff = Math.max(0, nextWindow.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

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
    return <div className="py-12 text-center text-xs text-muted font-mono">Loading usage analytics...</div>;
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-card border border-border rounded-panel text-center space-y-4">
        <p className="text-xs text-red-500 font-mono">{error || 'Unable to load your account data.'}</p>
        <button onClick={loadStats} className="ui-button-secondary text-xs px-4 py-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-600" />
            <span>Usage & Token Ledger</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Detailed API request logs, model token consumption, and rolling allowance history.
          </p>
        </div>

        <button onClick={loadStats} className="ui-button-secondary text-xs px-3 py-1.5 font-bold gap-1.5 shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* 5-Hour Window Card */}
      <div className="bg-card border border-border p-6 rounded-panel space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-fg">
            <Zap className="w-4 h-4 text-violet-600 fill-current" />
            <span>5-HOUR ROLLING ALLOWANCE METRICS</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Next Refresh: {timeLeft}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-bg border border-border p-4 rounded-control space-y-1">
            <p className="text-[11px] font-mono text-muted uppercase">Purchased Allowance</p>
            <p className="text-2xl font-bold font-mono text-fg">{formatTokens(stats?.totalPurchased)}</p>
          </div>
          <div className="bg-bg border border-border p-4 rounded-control space-y-1">
            <p className="text-[11px] font-mono text-muted uppercase">Consumed Tokens</p>
            <p className="text-2xl font-bold font-mono text-amber-600">{formatTokens(stats?.totalUsed)}</p>
          </div>
          <div className="bg-bg border border-border p-4 rounded-control space-y-1">
            <p className="text-[11px] font-mono text-muted uppercase">Tokens Available</p>
            <p className="text-2xl font-bold font-mono text-emerald-600">{formatTokens(stats?.totalRemaining)}</p>
          </div>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-control text-xs font-bold transition-all ${
            activeTab === 'requests' ? 'bg-violet-600 text-white shadow-xs' : 'text-muted hover:text-fg hover:bg-subtle'
          }`}
        >
          API Request History
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-control text-xs font-bold transition-all ${
            activeTab === 'ledger' ? 'bg-violet-600 text-white shadow-xs' : 'text-muted hover:text-fg hover:bg-subtle'
          }`}
        >
          Token Ledger History
        </button>
      </div>

      {/* Request Log History */}
      {activeTab === 'requests' && (
        <div className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-xs font-bold text-fg uppercase tracking-wider font-mono">Recent Gateway Requests</h3>

          {!stats?.recentRequests || stats.recentRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted border border-dashed border-border rounded-control font-mono">
              No API request activity recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted uppercase bg-bg/50">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Model Target</th>
                    <th className="py-2.5 px-3">Tokens Used</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentRequests.map((req: any, i: number) => (
                    <tr key={i} className="hover:bg-bg/40">
                      <td className="py-2.5 px-3 text-muted text-[11px]">{new Date(req.createdAt).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3 text-fg font-bold">{req.model}</td>
                      <td className="py-2.5 px-3 text-amber-600 font-bold">{formatTokens(req.totalTokens)}</td>
                      <td className="py-2.5 px-3 text-emerald-600">{req.latencyMs}ms</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">200 OK</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Token Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-card border border-border rounded-panel p-6 space-y-4">
          <h3 className="text-xs font-bold text-fg uppercase tracking-wider font-mono">Token Ledger Audit Entries</h3>

          {!stats?.ledgerEntries || stats.ledgerEntries.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted border border-dashed border-border rounded-control font-mono">
              No token ledger entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-muted uppercase bg-bg/50">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Token Amount</th>
                    <th className="py-2.5 px-3">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.ledgerEntries.map((l: any, i: number) => (
                    <tr key={i} className="hover:bg-bg/40">
                      <td className="py-2.5 px-3 text-muted text-[11px]">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-fg">{l.type}</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">+{formatTokens(l.amount)}</td>
                      <td className="py-2.5 px-3 text-fg font-bold">{formatTokens(l.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserUsage;
