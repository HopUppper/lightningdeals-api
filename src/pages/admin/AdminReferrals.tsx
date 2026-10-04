import React, { useState, useEffect } from 'react';
import {
  Gift,
  Sliders,
  Download,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  DollarSign,
  Award,
  Search,
  Filter,
  AlertTriangle,
  X,
  ShieldAlert,
  Check,
  Eye,
  ArrowUpRight,
  HelpCircle,
  Info,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminReferrals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Detail Modal / Drawer
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'REFERRALS' | 'LEADERBOARD'>('REFERRALS');

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(riskFilter !== 'ALL' && { riskStatus: riskFilter }),
        ...(search.trim() && { search: search.trim() }),
      });

      const [listRes, analyticsRes] = await Promise.all([
        adminFetch(`/api/admin/referrals?${q.toString()}`),
        adminFetch('/api/admin/referrals/analytics'),
      ]);

      if (listRes.ok) {
        const json = await listRes.json();
        setReferrals(json.items || []);
        if (json.pagination) setPagination(json.pagination);
      }

      if (analyticsRes.ok) {
        const aJson = await analyticsRes.json();
        setAnalytics(aJson);
        if (aJson.settings) setSettingsForm(aJson.settings);
      }
    } catch (e) {
      console.error('[ADMIN REFERRALS FETCH ERROR]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, statusFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleAdminAction = async (action: 'APPROVE' | 'DISQUALIFY' | 'MARK_REVIEW' | 'ADD_NOTE' | 'REVERSE_REWARD') => {
    if (!selectedReferral) return;
    if (!actionReason.trim()) {
      alert('Please provide a mandatory reason for this administrative action.');
      return;
    }

    setProcessingAction(true);
    setActionMessage(null);
    try {
      const res = await adminFetch(`/api/admin/referrals/${selectedReferral.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: actionReason.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Action '${action}' executed successfully.`);
        setActionReason('');
        await fetchData();
        if (json.referral) {
          setSelectedReferral((prev: any) => ({ ...prev, ...json.referral }));
        }
      } else {
        setActionMessage(json.error?.message || 'Action failed.');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Network error.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const res = await adminFetch('/api/admin/referrals/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSettingsMsg('Referral configuration updated successfully!');
        await fetchData();
        setTimeout(() => setShowSettings(false), 1500);
      } else {
        setSettingsMsg(json.error?.message || 'Failed to update settings.');
      }
    } catch (err: any) {
      setSettingsMsg(err.message || 'Network error.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await adminFetch('/api/admin/referrals/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `referrals_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getStatusBadge = (status: string, rewardStatus: string) => {
    if (status === 'REWARDED' || rewardStatus === 'CREDITED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Rewarded
        </span>
      );
    }
    if (status === 'REVERSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Reversed
        </span>
      );
    }
    if (status === 'DISQUALIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Disqualified
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        {status}
      </span>
    );
  };

  const getRiskBadge = (risk: string) => {
    if (risk === 'REVIEW_REQUIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
          REVIEW
        </span>
      );
    }
    if (risk === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-orange-900 border border-orange-300">
          <AlertTriangle className="w-2.5 h-2.5 text-orange-700" />
          SUSPICIOUS
        </span>
      );
    }
    if (risk === 'DISQUALIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
          BLOCKED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        NORMAL
      </span>
    );
  };

  const metrics = analytics?.metrics || {};

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Gift className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-fg tracking-tight">
                  ⚡ Referral & Growth Engine
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  VIRAL ACQUISITION
                </span>
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">
                Centralized telemetry for customer referrals, anti-abuse indicators, automated rewards, and conversions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
            title="Sync telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-600" />
            <span>Rules & Settings</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="ui-button-primary bg-violet-600 hover:bg-violet-700 text-white text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-md shadow-violet-600/20 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Referrals */}
        <div className="rounded-panel border border-border bg-card p-4 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-[11px] font-mono font-bold uppercase">Total Referrals</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-extrabold text-fg font-mono mt-1.5">
            {loading ? '...' : (metrics.totalReferrals || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted font-mono mt-0.5">
            Clicks recorded: {metrics.clicksCount || 0}
          </p>
        </div>

        {/* Successful */}
        <div className="rounded-panel border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex justify-between items-center text-emerald-800">
            <span className="text-[11px] font-mono font-bold uppercase">Successful</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1.5">
            {loading ? '...' : (metrics.successfulReferrals || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-800 font-mono mt-0.5">
            Completed 1st orders
          </p>
        </div>

        {/* Pending */}
        <div className="rounded-panel border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex justify-between items-center text-amber-800">
            <span className="text-[11px] font-mono font-bold uppercase">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 font-mono mt-1.5">
            {loading ? '...' : (metrics.pendingReferrals || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-amber-800 font-mono mt-0.5">
            Awaiting 1st purchase
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-panel border border-border bg-card p-4 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-[11px] font-mono font-bold uppercase">Conversion</span>
            <TrendingUp className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-extrabold text-cyan-700 font-mono mt-1.5">
            {loading ? '...' : `${metrics.conversionRate || 0}%`}
          </p>
          <p className="text-[10px] text-muted font-mono mt-0.5">
            Click conv: {metrics.clickConversionRate || 0}%
          </p>
        </div>

        {/* Credits Issued */}
        <div className="rounded-panel border border-violet-200 bg-violet-50/30 p-4 shadow-xs">
          <div className="flex justify-between items-center text-violet-800">
            <span className="text-[11px] font-mono font-bold uppercase">Credits Issued</span>
            <Zap className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-extrabold text-violet-700 font-mono mt-1.5">
            ₹{loading ? '...' : (metrics.totalCreditsIssued || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-rose-600 font-mono mt-0.5">
            Reversed: ₹{(metrics.totalCreditsReversed || 0).toLocaleString()}
          </p>
        </div>

        {/* Revenue Generated */}
        <div className="rounded-panel border border-border bg-card p-4 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-[11px] font-mono font-bold uppercase">Revenue Gen</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1.5">
            ₹{loading ? '...' : (metrics.revenueGenerated || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted font-mono mt-0.5">
            AOV: ₹{(metrics.averageOrderValue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('REFERRALS')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'REFERRALS'
              ? 'border-violet-600 text-violet-700 font-extrabold'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Referral Records ({pagination.total})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'LEADERBOARD'
              ? 'border-violet-600 text-violet-700 font-extrabold'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Top Referrers Leaderboard</span>
        </button>
      </div>

      {activeTab === 'LEADERBOARD' ? (
        /* Top Referrers Leaderboard */
        <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-bg/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Top Customer Advocates</span>
              </h3>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                Ranked by volume of verified customer purchases generated.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
              LEADERBOARD
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg/60 text-muted font-mono uppercase text-[11px] border-b border-border font-medium">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Referrer Account</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4 text-right">Successful Purchases</th>
                  <th className="py-3 px-4 text-right">Credits Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {!analytics?.topReferrers || analytics.topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted font-mono">
                      No referral purchases completed yet.
                    </td>
                  </tr>
                ) : (
                  analytics.topReferrers.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs">
                            🥇
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 border border-slate-300 text-xs">
                            🥈
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-muted font-bold text-xs ml-1.5">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-fg">{row.user?.name || 'Customer'}</div>
                        <div className="text-[11px] text-muted font-mono">{row.user?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-violet-700">
                        {row.user?.referralCode || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-fg">
                        {row.successfulReferrals}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        +₹{(row.creditsEarned || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Referrals Records Table */
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by referral code, referrer email, customer email, or order ID..."
                className="w-full pl-9 pr-20 py-2 text-xs bg-card border border-border rounded-control text-fg placeholder:text-muted focus:outline-none focus:border-violet-500 font-medium shadow-xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-mono font-bold rounded-md bg-subtle hover:bg-border text-fg transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 text-xs bg-card border border-border rounded-control text-fg font-medium focus:outline-none shadow-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="REWARDED">Rewarded</option>
                <option value="REGISTERED">Registered</option>
                <option value="ATTRIBUTED">Attributed</option>
                <option value="REVERSED">Reversed</option>
                <option value="DISQUALIFIED">Disqualified</option>
                <option value="EXPIRED">Expired</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 text-xs bg-card border border-border rounded-control text-fg font-medium focus:outline-none shadow-xs"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="REVIEW_REQUIRED">Review Required</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="NORMAL">Normal</option>
                <option value="DISQUALIFIED">Blocked</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-16 text-center text-xs font-mono text-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-600" /> Loading referral records...
              </div>
            ) : referrals.length === 0 ? (
              <div className="py-16 text-center text-xs font-mono text-muted">
                No referral records match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50 text-[11px]">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Referrer (A)</th>
                      <th className="py-3 px-4">Customer (B)</th>
                      <th className="py-3 px-4">Reward Status</th>
                      <th className="py-3 px-4">Risk Flag</th>
                      <th className="py-3 px-4 text-right">Order Paid</th>
                      <th className="py-3 px-4 text-right">Credits Earned</th>
                      <th className="py-3 px-4">Attributed Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {referrals.map((item) => (
                      <tr key={item.id} className="hover:bg-bg/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-700">
                          {item.referralCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-fg">{item.referrer?.name || 'Customer'}</div>
                          <div className="text-[11px] font-mono text-muted truncate max-w-[150px]">
                            {item.referrer?.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-fg">
                            {item.referredUser?.name || 'Awaiting Signup'}
                          </div>
                          <div className="text-[11px] font-mono text-muted truncate max-w-[150px]">
                            {item.referredUser?.email || '—'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(item.status, item.rewardStatus)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getRiskBadge(item.riskStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          {item.qualifyingOrder ? (
                            <span className="font-bold text-fg">
                              ₹{(item.qualifyingOrder.paidAmountInr ?? item.qualifyingOrder.amountInr).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {item.rewardCreditsEarned > 0 ? (
                            <span className="text-emerald-600">+₹{item.rewardCreditsEarned.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted">₹0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedReferral(item);
                              setActionReason('');
                              setActionMessage(null);
                            }}
                            className="px-2.5 py-1 rounded-control bg-subtle hover:bg-border text-fg font-mono text-xs font-bold transition-all border border-border flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-violet-600" />
                            <span>Manage</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-3 border-t border-border bg-bg/20 flex items-center justify-between text-xs text-muted font-mono">
                <div>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="px-3 py-1 rounded-control border border-border bg-card hover:bg-subtle disabled:opacity-40 text-fg cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="px-3 py-1 rounded-control border border-border bg-card hover:bg-subtle disabled:opacity-40 text-fg cursor-pointer transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referral Investigation & Actions Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
                    <Gift className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-fg tracking-tight">
                    Referral Relationship: {selectedReferral.referralCode}
                  </h3>
                </div>
                <p className="text-xs text-muted font-mono mt-0.5">ID: {selectedReferral.id}</p>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two Customer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-control bg-subtle/70 border border-border space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-violet-700 uppercase tracking-wider">
                  Referrer (Person A)
                </div>
                <div className="font-extrabold text-fg text-sm">{selectedReferral.referrer?.name}</div>
                <div className="text-xs text-muted font-mono">{selectedReferral.referrer?.email}</div>
                <div className="text-[10px] text-muted font-mono">User ID: {selectedReferral.referrer?.id}</div>
              </div>

              <div className="p-4 rounded-control bg-subtle/70 border border-border space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-cyan-700 uppercase tracking-wider">
                  Referred Customer (Person B)
                </div>
                <div className="font-extrabold text-fg text-sm">
                  {selectedReferral.referredUser?.name || 'Awaiting Account Creation'}
                </div>
                <div className="text-xs text-muted font-mono">{selectedReferral.referredUser?.email || '—'}</div>
                <div className="text-[10px] text-muted font-mono">
                  User ID: {selectedReferral.referredUser?.id || '—'}
                </div>
              </div>
            </div>

            {/* Attribution & Order Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-control bg-card border border-border">
                <div className="text-muted font-mono text-[11px]">Status</div>
                <div className="font-extrabold text-fg mt-1">
                  {getStatusBadge(selectedReferral.status, selectedReferral.rewardStatus)}
                </div>
              </div>

              <div className="p-3 rounded-control bg-card border border-border">
                <div className="text-muted font-mono text-[11px]">Risk Flag</div>
                <div className="font-extrabold text-fg mt-1">
                  {getRiskBadge(selectedReferral.riskStatus)}
                </div>
              </div>

              <div className="p-3 rounded-control bg-card border border-border">
                <div className="text-muted font-mono text-[11px]">Attribution Expiry</div>
                <div className="font-bold font-mono text-fg mt-1">
                  {new Date(selectedReferral.attributionExpiresAt).toLocaleDateString()}
                </div>
              </div>

              <div className="p-3 rounded-control bg-card border border-border">
                <div className="text-muted font-mono text-[11px]">Qualifying Order</div>
                <div className="font-bold font-mono text-violet-700 mt-1">
                  {selectedReferral.qualifyingOrder?.internalOrderId || 'None yet'}
                </div>
              </div>

              <div className="p-3 rounded-control bg-card border border-border">
                <div className="text-muted font-mono text-[11px]">Credits Awarded</div>
                <div className="font-extrabold font-mono text-emerald-600 mt-1">
                  ₹{selectedReferral.rewardCreditsEarned.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-control bg-card border border-border">
                <div className="text-muted font-mono text-[11px]">Reward Status</div>
                <div className="font-bold font-mono text-fg mt-1">{selectedReferral.rewardStatus}</div>
              </div>
            </div>

            {selectedReferral.notes && (
              <div className="p-3.5 rounded-control bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
                <span className="text-amber-800 font-bold block mb-1 font-mono text-[10px] uppercase">
                  INVESTIGATION / ADMIN NOTES:
                </span>
                <p className="whitespace-pre-wrap font-sans">{selectedReferral.notes}</p>
              </div>
            )}

            {/* Admin Action Box */}
            <div className="p-4 rounded-control bg-card border border-border shadow-xs space-y-3">
              <h4 className="text-xs font-mono font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-violet-600" />
                Administrative Actions
              </h4>

              <input
                type="text"
                placeholder="Enter mandatory reason for audit logs..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full bg-white border border-border rounded-control px-3.5 py-2 text-xs text-fg placeholder:text-muted focus:outline-none focus:border-violet-500 font-medium shadow-xs"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('APPROVE')}
                  className="px-3 py-1.5 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Approve / Clear Risk
                </button>
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('MARK_REVIEW')}
                  className="px-3 py-1.5 rounded-control bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Flag for Review
                </button>
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('DISQUALIFY')}
                  className="px-3 py-1.5 rounded-control bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Disqualify
                </button>
                {selectedReferral.rewardStatus === 'CREDITED' && (
                  <button
                    disabled={processingAction}
                    onClick={() => handleAdminAction('REVERSE_REWARD')}
                    className="px-3 py-1.5 rounded-control bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reverse Reward
                  </button>
                )}
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('ADD_NOTE')}
                  className="px-3 py-1.5 rounded-control bg-subtle hover:bg-border text-fg font-bold transition-colors border border-border cursor-pointer disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>

              {actionMessage && (
                <div className="p-3 rounded-control bg-violet-50 border border-violet-200 text-xs font-mono text-violet-800">
                  {actionMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral Program Configuration Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-border rounded-panel w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-violet-600" />
                  Referral Engine Configuration
                </h3>
                <p className="text-xs text-muted font-mono mt-0.5">
                  Adjust qualification rules, reward caps, and attribution windows.
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between p-3.5 rounded-control bg-subtle border border-border">
                <div>
                  <div className="font-extrabold text-fg">Enable Referral Program</div>
                  <div className="text-muted text-[11px] font-mono">
                    When disabled, link attribution and rewards are paused.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settingsForm.enabled)}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                  className="w-4 h-4 accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-fg font-bold font-mono text-[11px] mb-1">
                    Min Qualifying Order (₹)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.minPurchaseAmountInr ?? 500}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, minPurchaseAmountInr: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-border rounded-control px-3 py-2 text-xs font-mono text-fg focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-fg font-bold font-mono text-[11px] mb-1">
                    Max Reward Cap Per Order (₹)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.maxRewardPerOrder ?? 500}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, maxRewardPerOrder: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-border rounded-control px-3 py-2 text-xs font-mono text-fg focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-fg font-bold font-mono text-[11px] mb-1">
                    Reward Calculation Method
                  </label>
                  <select
                    value={settingsForm.rewardMethod || 'MATCH_PURCHASE_REWARD'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, rewardMethod: e.target.value })}
                    className="w-full bg-white border border-border rounded-control px-3 py-2 text-xs text-fg focus:outline-none focus:border-violet-500"
                  >
                    <option value="MATCH_PURCHASE_REWARD">Match Purchase Reward (10%)</option>
                    <option value="PERCENTAGE">Custom Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Credit Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-fg font-bold font-mono text-[11px] mb-1">
                    Qualification Rule
                  </label>
                  <select
                    value={settingsForm.qualificationRule || 'FIRST_PURCHASE_ONLY'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, qualificationRule: e.target.value })}
                    className="w-full bg-white border border-border rounded-control px-3 py-2 text-xs text-fg focus:outline-none focus:border-violet-500"
                  >
                    <option value="FIRST_PURCHASE_ONLY">First Qualifying Purchase Only</option>
                    <option value="EVERY_QUALIFYING_PURCHASE">Every Qualifying Purchase</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-fg font-bold font-mono text-[11px] mb-1">
                  Attribution Window (Days)
                </label>
                <input
                  type="number"
                  value={settingsForm.attributionWindowDays ?? 30}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, attributionWindowDays: Number(e.target.value) })
                  }
                  className="w-full bg-white border border-border rounded-control px-3 py-2 text-xs font-mono text-fg focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-control bg-subtle border border-border">
                <div>
                  <div className="font-extrabold text-fg">Self-Referral Anti-Abuse Protection</div>
                  <div className="text-muted text-[11px] font-mono">
                    Blocks signups using identical email, phone, or account identities.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settingsForm.blockSelfReferral)}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, blockSelfReferral: e.target.checked })
                  }
                  className="w-4 h-4 accent-violet-600 cursor-pointer"
                />
              </div>

              {settingsMsg && (
                <div className="p-3 rounded-control bg-violet-50 border border-violet-200 text-xs font-mono text-violet-800">
                  {settingsMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="ui-button-secondary text-xs py-2 px-3.5 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="ui-button-primary bg-violet-600 hover:bg-violet-700 text-white text-xs py-2 px-4 font-bold shadow-md shadow-violet-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
