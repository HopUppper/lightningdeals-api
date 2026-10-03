import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  CreditCard,
  Users,
  Settings,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowUpRight,
  Sliders,
  DollarSign,
  FileText,
  Clock,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminRewards: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    rewardPercentage: 10,
    maxEligiblePurchaseAmount: 5000,
    maxRewardPerTransaction: 500,
    isActive: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Manual Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Customer Search for Adjustment
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Load Overview Data
  const loadOverview = async () => {
    try {
      const res = await adminFetch('/api/admin/rewards/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        if (data.settings) {
          setSettingsForm({
            rewardPercentage: data.settings.rewardPercentage,
            maxEligiblePurchaseAmount: data.settings.maxEligiblePurchaseAmount,
            maxRewardPerTransaction: data.settings.maxRewardPerTransaction,
            isActive: data.settings.isActive,
          });
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Load Ledger Data
  const loadLedger = async (page = 1) => {
    try {
      setLedgerLoading(true);
      const url = `/api/admin/rewards/ledger?page=${page}&limit=20&type=${typeFilter}&search=${encodeURIComponent(searchQuery)}`;
      const res = await adminFetch(url);
      if (res.ok) {
        const data = await res.json();
        setLedger(data.transactions || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadOverview(), loadLedger(1)]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadLedger(1);
  }, [typeFilter, searchQuery]);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    setError(null);

    try {
      const res = await adminFetch('/api/admin/rewards/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3500);
        await loadOverview();
      } else {
        setError(data.error?.message || 'Failed to update settings.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Search Users for Manual Adjustment
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await adminFetch(`/api/admin/search?q=${encodeURIComponent(userSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Handle Submit Adjustment
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser) {
      setAdjustError('Please select a customer.');
      return;
    }

    const val = Number(adjustAmount);
    if (!val || val <= 0) {
      setAdjustError('Please enter a valid positive amount.');
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('Mandatory reason is required for compliance audit logs.');
      return;
    }

    setAdjusting(true);
    setAdjustError(null);

    try {
      const finalAmount = adjustType === 'CREDIT' ? val : -val;
      const res = await adminFetch('/api/admin/rewards/adjust', {
        method: 'POST',
        body: JSON.stringify({
          userId: adjustTargetUser.id,
          amount: finalAmount,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAdjustModal(false);
        setAdjustTargetUser(null);
        setAdjustAmount('');
        setAdjustReason('');
        await Promise.all([loadOverview(), loadLedger(pagination.page)]);
      } else {
        setAdjustError(data.error?.message || 'Failed to adjust credits.');
      }
    } catch (e: any) {
      setAdjustError(e.message);
    } finally {
      setAdjusting(false);
    }
  };

  const kpis = overview?.kpis || {};

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-extrabold text-fg tracking-tight">
              ⚡ Lightning Rewards Management
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              Loyalty Engine
            </span>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            Global metrics, customer credit ledger, manual adjustments, and configurable rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadOverview();
              loadLedger(pagination.page);
            }}
            disabled={loading || ledgerLoading}
            className="ui-button-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ledgerLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => {
              setShowAdjustModal(true);
              setAdjustTargetUser(null);
              setAdjustError(null);
            }}
            className="ui-button-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Credit / Debit</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
          {error}
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-panel border border-border bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-mono font-bold uppercase">Outstanding Liability</span>
            <Zap className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-fg font-mono mt-2">
            ₹{loading ? '...' : (kpis.totalOutstandingLiability || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted font-mono mt-1">
            {kpis.totalCustomersWithCredits || 0} customers with active credits
          </p>
        </div>

        <div className="rounded-panel border border-border bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-mono font-bold uppercase">Lifetime Issued</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-2">
            ₹{loading ? '...' : (kpis.totalCreditsIssued || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted font-mono mt-1">
            +₹{(kpis.thisMonthIssued || 0).toLocaleString()} this month
          </p>
        </div>

        <div className="rounded-panel border border-border bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-mono font-bold uppercase">Lifetime Redeemed</span>
            <CreditCard className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-cyan-700 font-mono mt-2">
            ₹{loading ? '...' : (kpis.totalCreditsRedeemed || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted font-mono mt-1">
            -₹{(kpis.thisMonthRedeemed || 0).toLocaleString()} this month
          </p>
        </div>

        <div className="rounded-panel border border-border bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-mono font-bold uppercase">Eligible Volume</span>
            <DollarSign className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-fg font-mono mt-2">
            ₹{loading ? '...' : (kpis.totalEligiblePurchaseVolume || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted font-mono mt-1">
            {kpis.totalEligibleOrders || 0} paid transactions
          </p>
        </div>
      </div>

      {/* Reward Settings Panel */}
      <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-extrabold text-fg">Reward Configuration</h2>
          </div>
          <span className="text-xs font-mono text-muted">
            Changes apply to future orders only. Historical transactions are never recalculated.
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-fg uppercase">
                Reward Percentage (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={settingsForm.rewardPercentage}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, rewardPercentage: Number(e.target.value) })
                }
                className="w-full ui-input text-xs font-mono py-2"
                required
              />
              <p className="text-[10px] text-muted font-mono">Default: 10% back in credits</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-fg uppercase">
                Max Eligible Purchase (₹)
              </label>
              <input
                type="number"
                min={100}
                step={100}
                value={settingsForm.maxEligiblePurchaseAmount}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, maxEligiblePurchaseAmount: Number(e.target.value) })
                }
                className="w-full ui-input text-xs font-mono py-2"
                required
              />
              <p className="text-[10px] text-muted font-mono">Default: ₹5,000 eligible per transaction</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-fg uppercase">
                Max Reward Per Transaction (₹)
              </label>
              <input
                type="number"
                min={10}
                step={10}
                value={settingsForm.maxRewardPerTransaction}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, maxRewardPerTransaction: Number(e.target.value) })
                }
                className="w-full ui-input text-xs font-mono py-2"
                required
              />
              <p className="text-[10px] text-muted font-mono">Default: ₹500 maximum credits per order</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-fg">
              <input
                type="checkbox"
                checked={settingsForm.isActive}
                onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })}
                className="rounded text-violet-600 focus:ring-violet-500"
              />
              <span>Enable Lightning Rewards Program</span>
            </label>

            <div className="flex items-center gap-3">
              {settingsSuccess && (
                <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved!
                </span>
              )}
              <button
                type="submit"
                disabled={savingSettings}
                className="ui-button-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5"
              >
                {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Global Credit Ledger Table */}
      <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-extrabold text-fg flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-600" />
              <span>Global Credit Ledger</span>
            </h2>
            <p className="text-xs text-muted font-mono mt-0.5">
              Complete chronological audit trail of all credit events across customers.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search email, order, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ui-input text-xs font-mono pl-8 py-1.5 w-60"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="ui-input text-xs font-mono py-1.5 px-3 bg-white"
            >
              <option value="ALL">All Event Types</option>
              <option value="PURCHASE_REWARD">Purchase Rewards</option>
              <option value="CREDIT_REDEMPTION">Redemptions</option>
              <option value="MANUAL_CREDIT">Manual Credits</option>
              <option value="MANUAL_DEBIT">Manual Debits</option>
              <option value="REFUND_REVERSAL">Refund Reversals</option>
            </select>
          </div>
        </div>

        {ledgerLoading ? (
          <div className="py-12 text-center text-xs font-mono text-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-600" />
            Loading credit ledger...
          </div>
        ) : ledger.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted space-y-2">
            <Zap className="w-6 h-6 mx-auto text-muted/60" />
            <p>No credit transactions match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description / Reason</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ledger.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-3 text-muted whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-fg font-bold">{tx.user?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-muted">{tx.user?.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.type === 'PURCHASE_REWARD'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.type === 'CREDIT_REDEMPTION'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : tx.type === 'MANUAL_CREDIT'
                              ? 'bg-violet-50 text-violet-700 border border-violet-200'
                              : tx.type === 'MANUAL_DEBIT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-fg max-w-sm">
                        <div className="truncate">{tx.description}</div>
                        {tx.reason && (
                          <div className="text-[10px] text-muted italic">Reason: {tx.reason}</div>
                        )}
                        {tx.order?.internalOrderId && (
                          <div className="text-[10px] text-violet-600 font-bold">
                            Order: {tx.order.internalOrderId}
                          </div>
                        )}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                      </td>
                      <td className="py-3 px-3 text-right text-fg font-bold whitespace-nowrap">
                        ₹{tx.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-mono">
          <span className="text-muted">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total transactions)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => loadLedger(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="ui-button-secondary text-xs py-1 px-3 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => loadLedger(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="ui-button-secondary text-xs py-1 px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Manual Credit / Debit Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-lg shadow-2xl overflow-hidden font-sans space-y-0 relative">
            <div className="p-5 border-b border-border flex items-center justify-between bg-bg/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-600 text-white">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg">Manual Credit / Debit Adjustment</h3>
                  <p className="text-[11px] text-muted font-mono">
                    Mandatory reason logged for compliance audit trail
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded hover:bg-subtle text-muted hover:text-fg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="p-6 space-y-4">
              {adjustError && (
                <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              {/* Customer Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Select Customer
                </label>
                {adjustTargetUser ? (
                  <div className="p-3 rounded border border-border bg-subtle/60 flex items-center justify-between text-xs font-mono">
                    <div>
                      <p className="font-bold text-fg">{adjustTargetUser.name}</p>
                      <p className="text-muted text-[11px]">{adjustTargetUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdjustTargetUser(null)}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type customer name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full ui-input text-xs font-mono py-2"
                    />
                    {searchingUsers && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted absolute right-3 top-1/2 -translate-y-1/2" />
                    )}

                    {userSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-control shadow-xl max-h-48 overflow-y-auto divide-y divide-border">
                        {userSearchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setAdjustTargetUser(u);
                              setUserSearchResults([]);
                              setUserSearchQuery('');
                            }}
                            className="p-2.5 hover:bg-subtle cursor-pointer text-xs font-mono flex justify-between items-center"
                          >
                            <div>
                              <p className="font-bold text-fg">{u.name}</p>
                              <p className="text-[11px] text-muted">{u.email}</p>
                            </div>
                            <span className="text-[10px] text-violet-700 font-bold">Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Adjustment Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setAdjustType('CREDIT')}
                    className={`p-3 rounded-control border flex items-center justify-center gap-2 font-bold transition-all ${
                      adjustType === 'CREDIT'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'border-border text-muted hover:bg-subtle'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Grant Credits (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEBIT')}
                    className={`p-3 rounded-control border flex items-center justify-center gap-2 font-bold transition-all ${
                      adjustType === 'DEBIT'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                        : 'border-border text-muted hover:bg-subtle'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>Deduct Credits (-)</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Amount in Lightning Credits (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted text-xs">₹</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="e.g. 500"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full ui-input text-xs font-mono pl-7 py-2"
                    required
                  />
                </div>
              </div>

              {/* Mandatory Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Audit Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Customer support goodwill grant for downtime, promotional concession, or correction..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full ui-input text-xs font-mono py-2"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="ui-button-secondary text-xs py-2 px-4 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting || !adjustTargetUser || !adjustAmount}
                  className="ui-button-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5"
                >
                  {adjusting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewards;
