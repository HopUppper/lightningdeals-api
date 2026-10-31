import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  ShieldCheck,
  FileText,
  Zap,
  RefreshCw,
  BarChart2,
  CheckCircle2,
  ArrowUpRight,
  Check,
  AlertCircle,
  Receipt,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { userFetch } from '../../utils/api';

export const UserUsage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'ledger' | 'transactions'>('requests');
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  // Pagination for Requests
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadStats = async () => {
    try {
      const res = await userFetch('/api/user/usage?limit=50&offset=0');
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

  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await userFetch('/api/user/transactions?limit=50');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.warn('Failed to fetch transactions:', e);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab]);

  // 5-Hour Rolling Window Live Countdown (only relevant for rolling window)
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
      <div className="py-20 text-center space-y-3 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#64607d]">Synchronizing account usage ledger...</p>
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

  const isCreditPlan = stats?.billingType === 'credit' || Boolean(stats?.hasCreditKey);
  const isTokenPlan = stats?.billingType === 'token';
  const isWindowPlan = !isCreditPlan && !isTokenPlan;

  const purchased = Number(stats?.totalPurchased || 0);
  const used = Number(stats?.totalUsed || 0);
  const remaining = Number(stats?.totalRemaining || Math.max(0, purchased - used));
  const usagePct = purchased > 0 ? Math.min(100, Math.round((used / purchased) * 100)) : 0;

  const recentRequests: any[] = stats?.recentRequests || [];
  const creditLedgers: any[] = stats?.creditLedgerEntries || [];
  const tokenLedgers: any[] = stats?.ledgerEntries || [];

  const avgLatency = recentRequests.length > 0
    ? `${Math.round(recentRequests.reduce((acc: number, r: any) => acc + (Number(r.latencyMs) || 0), 0) / recentRequests.length)}ms`
    : '—';
  const successfulReqs = recentRequests.filter((r: any) => r.statusCode >= 200 && r.statusCode < 400).length;
  const successRate = recentRequests.length > 0
    ? `${((successfulReqs / recentRequests.length) * 100).toFixed(1)}%`
    : '—';

  // Slice requests for client-side pagination
  const totalPages = Math.ceil(recentRequests.length / pageSize) || 1;
  const paginatedRequests = recentRequests.slice((page - 1) * pageSize, page * pageSize);

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
            <span>Usage & Audit Ledger</span>
          </h1>
          <p className="text-xs text-[#64607d] mt-1">
            Real-time API gateway request history, completion tokens, and immutable balance accounting.
          </p>
        </div>

        <button 
          type="button"
          onClick={() => {
            loadStats();
            if (activeTab === 'transactions') loadTransactions();
          }} 
          className="ui-button-secondary text-xs px-4 py-2 font-bold gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* Primary Balance / Allowance Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#ede8e1] space-y-6 shadow-playful">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ede8e1] pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b2e]">
            {isTokenPlan ? <Layers className="w-4 h-4 text-violet-600 fill-current" /> : <Zap className="w-4 h-4 text-violet-600 fill-current" />}
            <span>
              {isCreditPlan
                ? 'Pay-As-You-Go Credit Metrics'
                : isTokenPlan
                ? 'Prepaid Token Pack Pool Metrics'
                : 'Active 5-Hour Window Metrics'}
            </span>
          </div>
          {isWindowPlan ? (
            <div className="inline-flex items-center gap-2 text-xs bg-violet-50 text-violet-800 px-3 py-1 rounded-full border border-violet-200 self-start sm:self-auto font-semibold">
              <Clock className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
              <span>Next Window Reset:</span>
              <span className="font-bold font-mono text-[#1e1b2e]">{timeLeft}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Non-Expiring Quota Balance</span>
            </div>
          )}
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isCreditPlan ? (
            <>
              <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Credits Granted</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1e1b2e]">
                  ${((Number(stats.creditBalanceUsd) || 0) + (Number(stats.totalCreditsUsedUsd) || 0)).toFixed(2)}
                </p>
                <p className="text-[11px] text-[#64607d]">Total purchased credits</p>
              </div>

              <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Usage Charges</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                  ${(Number(stats.totalCreditsUsedUsd) || 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-[#64607d]">Deducted across models</p>
              </div>

              <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Available Balance</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  ${(Number(stats.creditBalanceUsd) || 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">Ready to spend</p>
              </div>
            </>
          ) : isTokenPlan ? (
            <>
              <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Pack Capacity</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1e1b2e]">{formatTokens(purchased)}</p>
                <p className="text-[11px] text-[#64607d]">Prepaid token pool</p>
              </div>

              <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Tokens Consumed</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{formatTokens(used)}</p>
                <p className="text-[11px] text-[#64607d]">Completed queries</p>
              </div>

              <div className="bg-[#faf8f5] border border-[#ede8e1] p-4.5 rounded-2xl space-y-1">
                <span className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Tokens Remaining</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{formatTokens(remaining)}</p>
                <p className="text-[11px] text-emerald-700 font-medium">Available now</p>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ede8e1] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-[#64607d] hover:text-[#1e1b2e] hover:bg-[#faf8f5]'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>API Request History ({recentRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-[#64607d] hover:text-[#1e1b2e] hover:bg-[#faf8f5]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Usage Ledger Audits ({isCreditPlan ? creditLedgers.length : tokenLedgers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-[#64607d] hover:text-[#1e1b2e] hover:bg-[#faf8f5]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Transaction & Grant History</span>
        </button>
      </div>

      {/* Tab 1: API Request History */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-[#ede8e1] overflow-hidden shadow-playful">
          <div className="p-4.5 border-b border-[#ede8e1] flex items-center justify-between bg-[#faf8f5]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b2e]">
              <BarChart2 className="w-4 h-4 text-violet-600" />
              <span>Recent Gateway Request Stream</span>
            </div>
            <span className="text-xs text-[#64607d]">Showing up to 50 recent events</span>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64607d] space-y-2">
              <p className="font-bold text-[#1e1b2e]">No API requests logged yet.</p>
              <p>Make a request using Cursor, Claude Code, or our interactive playground to view real-time telemetry.</p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#ede8e1] text-[#64607d] uppercase bg-[#faf8f5] text-[10px] font-bold">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Target Model</th>
                      <th className="py-3 px-4 text-right">Prompt / Output</th>
                      <th className="py-3 px-4 text-right">Total Tokens</th>
                      <th className="py-3 px-4 text-center">Usage Source</th>
                      <th className="py-3 px-4 text-right">Latency / Speed</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ede8e1]">
                    {paginatedRequests.map((req: any, i: number) => {
                      const isEstimated = req.isEstimated || req.usageSource === 'LOCAL_CALCULATED';
                      const inTok = req.promptTokens || req.inputTokens || 0;
                      const outTok = req.completionTokens || req.outputTokens || 0;
                      const totTok = req.totalTokens || inTok + outTok;
                      return (
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
                          <td className="py-3 px-4 text-right text-[11px] text-[#64607d]">
                            {formatTokens(inTok)} / {formatTokens(outTok)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#1e1b2e]">
                            {formatTokens(totTok)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-sans font-bold ${
                              isEstimated
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isEstimated ? 'Estimated' : 'Provider Reported'}
                            </span>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-3.5 border-t border-[#ede8e1] flex items-center justify-between text-xs font-sans bg-[#faf8f5]">
                  <span className="text-[#64607d]">
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-[#ede8e1] bg-white text-[#1e1b2e] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-[#ede8e1] bg-white text-[#1e1b2e] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Usage Ledger Audits */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-[#ede8e1] overflow-hidden shadow-playful">
          <div className="p-4.5 border-b border-[#ede8e1] flex items-center justify-between bg-[#faf8f5]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b2e]">
              <FileText className="w-4 h-4 text-violet-600" />
              <span>
                {isCreditPlan ? 'Credit Deduction & Grant Ledger' : 'Token Ledger Movements'}
              </span>
            </div>
            <span className="text-xs text-[#64607d]">Cryptographically verified entries</span>
          </div>

          {isCreditPlan ? (
            creditLedgers.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#64607d] space-y-2">
                <p className="font-bold text-[#1e1b2e]">No credit ledger records found.</p>
                <p>Every credit deduction or grant is registered with atomic transaction guarantees.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#ede8e1] text-[#64607d] uppercase bg-[#faf8f5] text-[10px] font-bold">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Amount Charged</th>
                      <th className="py-3 px-4 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ede8e1]">
                    {creditLedgers.map((entry: any, i: number) => (
                      <tr key={i} className="hover:bg-[#faf8f5]/60 transition-colors">
                        <td className="py-3 px-4 text-[#1e1b2e]">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            entry.entryType === 'GRANT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.entryType === 'REFUND'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {entry.entryType || 'USAGE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-violet-700">
                          {entry.description || 'API Model Completion'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">
                          {entry.entryType === 'GRANT' ? '+' : '-'}${Number(entry.customerCostUsd || 0).toFixed(5)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          ${Number(entry.balanceAfterUsd || 0).toFixed(5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            tokenLedgers.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#64607d] space-y-2">
                <p className="font-bold text-[#1e1b2e]">No token ledger records found.</p>
                <p>Every token deduction is registered and verified in real time.</p>
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
                    {tokenLedgers.map((entry: any, i: number) => (
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
            )
          )}
        </div>
      )}

      {/* Tab 3: Unified Transactions & Grant History */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-[#ede8e1] overflow-hidden shadow-playful">
          <div className="p-4.5 border-b border-[#ede8e1] flex items-center justify-between bg-[#faf8f5]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e1b2e]">
              <Receipt className="w-4 h-4 text-violet-600" />
              <span>Unified Account Transactions & Purchase Grants</span>
            </div>
            <span className="text-xs text-[#64607d]">IDOR protected customer audit view</span>
          </div>

          {loadingTx ? (
            <div className="py-16 text-center text-xs text-[#64607d] space-y-2">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64607d] space-y-2">
              <p className="font-bold text-[#1e1b2e]">No transactions recorded yet.</p>
              <p>Purchases, refunds, and balance adjustments will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#ede8e1] text-[#64607d] uppercase bg-[#faf8f5] text-[10px] font-bold">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount / Tokens</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ede8e1]">
                  {transactions.map((tx: any, i: number) => {
                    const isCredit = tx.category === 'credit_ledger';
                    const isToken = tx.category === 'token_ledger';
                    const isPurchase = tx.category === 'purchase';
                    return (
                      <tr key={i} className="hover:bg-[#faf8f5]/60 transition-colors">
                        <td className="py-3 px-4 text-[#1e1b2e] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold font-sans uppercase bg-[#faf8f5] border border-[#ede8e1] text-[#4b4763]">
                            {isCredit ? 'Credit Movement' : isToken ? 'Token Quota' : 'Plan Purchase'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-violet-700">
                          {tx.description || tx.type || 'Transaction'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#1e1b2e]">
                          {isCredit
                            ? `$${Number(tx.amount || 0).toFixed(2)} USD Credits`
                            : isToken
                            ? `${formatTokens(tx.amount)} Tokens`
                            : `₹${Number(tx.amount || 0).toLocaleString()} INR`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-sans ${
                            tx.status === 'COMPLETED' || tx.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : tx.status === 'REFUNDED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : tx.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {tx.status || 'SETTLED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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