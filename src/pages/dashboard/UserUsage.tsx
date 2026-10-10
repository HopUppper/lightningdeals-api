import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, FileText, Zap, RefreshCw, BarChart2, CheckCircle2, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
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
        setError('Unable to load your account telemetry data.');
      }
    } catch (e) {
      setError('Unable to load your account telemetry data.');
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
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#64607d]">Synchronizing token usage ledger...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-[#ede8e1] shadow-2xs text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-[#1e1b2e]">{error || 'Unable to load account usage'}</h3>
        <button
          type="button"
          onClick={loadStats}
          className="ui-button-secondary text-xs px-4 py-2 font-bold cursor-pointer"
        >
          Retry Sync
        </button>
      </div>
    );
  }

  const purchased = Number(stats?.totalPurchased || 0);
  const used = Number(stats?.totalUsed || 0);
  const remaining = Number(stats?.totalRemaining || Math.max(0, purchased - used));
  const usagePct = purchased > 0 ? Math.min(100, Math.round((used / purchased) * 100)) : 0;

  const recentRequests: any[] = stats?.recentRequests || [];
  const avgLatency = recentRequests.length > 0
    ? `${Math.round(recentRequests.reduce((acc: number, r: any) => acc + (Number(r.latencyMs) || 0), 0) / recentRequests.length)}ms`
    : '—';
  const successfulReqs = recentRequests.filter((r: any) => r.statusCode >= 200 && r.statusCode < 400).length;
  const successRate = recentRequests.length > 0
    ? `${((successfulReqs / recentRequests.length) * 100).toFixed(1)}%`
    : '—';

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#ede8e1]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800 bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
              AUDIT TELEMETRY
            </span>
            <span className="text-xs text-[#64607d]">EDGE REGION: ASIA-PACIFIC</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b2e] tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-100 text-blue-700">
              <Activity className="w-5 h-5" />
            </div>
            <span>Usage & Token Ledger</span>
          </h1>
          <p className="text-xs text-[#64607d] mt-1">
            Real-time API gateway request history, completion tokens, and rolling 5-hour quota accounting.
          </p>
        </div>

        <button 
          type="button"
          onClick={loadStats} 
          className="ui-button-secondary text-xs px-4 py-2 font-bold gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* 5-Hour Rolling Window Allowance Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#ede8e1] space-y-6 shadow-playful">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ede8e1] pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b2e]">
            <Zap className="w-4 h-4 text-violet-600 fill-current" />
            <span>Active 5-Hour Cycle Metrics</span>
          </div>
          <div className="inline-flex items-center gap-2 text-xs bg-violet-50 text-violet-800 px-3 py-1 rounded-full border border-violet-200 self-start sm:self-auto font-semibold">
            <Clock className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
            <span>Next Window Reset:</span>
            <span className="font-bold font-mono text-[#1e1b2e]">{timeLeft}</span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Window Allowance</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1e1b2e]">{formatTokens(purchased)}</p>
            <p className="text-[11px] text-[#64607d]">Tokens allotted per cycle</p>
          </div>

          <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Spent in Cycle</span>
              <span className="text-xs text-amber-600 font-bold">{usagePct}%</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{formatTokens(used)}</p>
            <div className="w-full bg-[#ede8e1] h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-amber-500 h-full transition-all duration-300" 
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>

          <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Available Capacity</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{formatTokens(remaining)}</p>
            <p className="text-[11px] text-[#64607d]">Restores to full at next reset</p>
          </div>
        </div>

        {/* Sub-telemetry strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#ede8e1] text-xs">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="text-[#64607d] text-xs font-semibold">Active Keys</span>
            <span className="font-extrabold text-[#1e1b2e]">{stats.activeKeysCount ?? 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="text-[#64607d] text-xs font-semibold">Avg Latency</span>
            <span className="font-extrabold text-emerald-700 font-mono">{avgLatency}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="text-[#64607d] text-xs font-semibold">Success Rate</span>
            <span className="font-extrabold text-[#1e1b2e] font-mono">{successRate}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="text-[#64607d] text-xs font-semibold">Transport</span>
            <span className="font-extrabold text-violet-700">SSE (HTTP/2)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ede8e1] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-[#64607d] hover:text-[#1e1b2e] hover:bg-[#faf8f5]'
          }`}
        >
          API Request History ({stats?.recentRequests?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-[#64607d] hover:text-[#1e1b2e] hover:bg-[#faf8f5]'
          }`}
        >
          Token Ledger Audits ({stats?.ledgerEntries?.length || 0})
        </button>
      </div>

      {/* API Request History Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-[#ede8e1] overflow-hidden shadow-playful">
          <div className="p-4.5 border-b border-[#ede8e1] flex items-center justify-between bg-[#faf8f5]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b2e]">
              <BarChart2 className="w-4 h-4 text-violet-600" />
              <span>Recent Gateway Request Stream</span>
            </div>
            <span className="text-xs text-[#64607d]">Last 50 requests</span>
          </div>

          {!stats?.recentRequests || stats.recentRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64607d] space-y-2">
              <p className="font-bold text-[#1e1b2e]">No API requests logged yet in this rolling window.</p>
              <p>Make a request using Cursor, Claude Code, or our interactive playground to view real-time logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#ede8e1] text-[#64607d] uppercase bg-[#faf8f5] text-[10px] font-bold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Target Model</th>
                    <th className="py-3 px-4 text-right">Tokens Consumed</th>
                    <th className="py-3 px-4 text-right">Latency</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede8e1]">
                  {stats.recentRequests.map((req: any, i: number) => (
                    <tr key={i} className="hover:bg-[#faf8f5]/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#1e1b2e]">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-[#64607d]">
                          {new Date(req.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-violet-700">
                        {req.model}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#1e1b2e]">
                        {formatTokens(req.totalTokens || (req.promptTokens + req.completionTokens))}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {req.latencyMs ? `${req.latencyMs}ms` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.statusCode >= 200 && req.statusCode < 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {req.statusCode || 200}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ledger Entries Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-[#ede8e1] overflow-hidden shadow-playful">
          <div className="p-4.5 border-b border-[#ede8e1] flex items-center justify-between bg-[#faf8f5]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b2e]">
              <FileText className="w-4 h-4 text-violet-600" />
              <span>Immutable Token Ledger Entries</span>
            </div>
            <span className="text-xs text-[#64607d]">Deduction auditing</span>
          </div>

          {!stats?.ledgerEntries || stats.ledgerEntries.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64607d] space-y-2">
              <p className="font-bold text-[#1e1b2e]">No ledger transactions in this window.</p>
              <p>Every token deduction is registered and verified cryptographically in real time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#ede8e1] text-[#64607d] uppercase bg-[#faf8f5] text-[10px] font-bold">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4 text-right">Tokens Charged</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede8e1]">
                  {stats.ledgerEntries.map((entry: any, i: number) => (
                    <tr key={i} className="hover:bg-[#faf8f5]/60 transition-colors">
                      <td className="py-3 px-4 text-[#1e1b2e]">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-violet-700">
                        {entry.reason || 'Completion Deduction'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">
                        -{formatTokens(entry.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatTokens(entry.balanceAfter)}
                      </td>
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
