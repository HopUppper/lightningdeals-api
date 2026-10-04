import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Sliders,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Gift,
  DollarSign,
  AlertCircle,
  FileText,
  Award,
  X,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';
import { ThreeDCard } from '../../components/ThreeDCard';

export const AdminReferrals: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Detail Modal
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Leaderboard Tab
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
        // Update selected referral in view
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Rewarded
        </span>
      );
    }
    if (status === 'REVERSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          Reversed
        </span>
      );
    }
    if (status === 'DISQUALIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-600/20 text-neutral-400 border border-neutral-600/30">
          Disqualified
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getRiskBadge = (risk: string) => {
    if (risk === 'REVIEW_REQUIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
          <AlertTriangle className="w-2.5 h-2.5" />
          REVIEW
        </span>
      );
    }
    if (risk === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
          <AlertTriangle className="w-2.5 h-2.5" />
          SUSPICIOUS
        </span>
      );
    }
    if (risk === 'DISQUALIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
          BLOCKED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
        NORMAL
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            <Gift className="w-3.5 h-3.5" />
            Growth & Rewards Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Referral Management</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monitor referral attribution, fraud indicators, reward disbursements, and customer growth telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors border border-neutral-700 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Settings
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors border border-neutral-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => fetchData()}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <ThreeDCard className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Total Referrals</div>
          <div className="text-xl font-bold text-white mt-1">{analytics?.metrics?.totalReferrals || 0}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            Clicks: {analytics?.metrics?.clicksCount || 0}
          </div>
        </ThreeDCard>

        <ThreeDCard className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Successful</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {analytics?.metrics?.successfulReferrals || 0}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Purchases completed</div>
        </ThreeDCard>

        <ThreeDCard className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Pending</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {analytics?.metrics?.pendingReferrals || 0}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Awaiting 1st purchase</div>
        </ThreeDCard>

        <ThreeDCard className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Conversion</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {analytics?.metrics?.conversionRate || 0}%
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            Click Conv: {analytics?.metrics?.clickConversionRate || 0}%
          </div>
        </ThreeDCard>

        <ThreeDCard className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Credits Issued</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            ₹{(analytics?.metrics?.totalCreditsIssued || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-red-400/80 mt-0.5">
            Reversed: ₹{(analytics?.metrics?.totalCreditsReversed || 0).toLocaleString()}
          </div>
        </ThreeDCard>

        <ThreeDCard className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Revenue Gen</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ₹{(analytics?.metrics?.revenueGenerated || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            AOV: ₹{(analytics?.metrics?.averageOrderValue || 0).toLocaleString()}
          </div>
        </ThreeDCard>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('REFERRALS')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'REFERRALS'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Referral Records ({pagination.total})
        </button>
        <button
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'LEADERBOARD'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          Top Referrers Leaderboard
        </button>
      </div>

      {activeTab === 'LEADERBOARD' ? (
        /* Top Referrers Leaderboard */
        <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800 overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Top Referral Drivers
            </h3>
            <span className="text-xs text-neutral-500">Ranked by verified successful orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800 font-medium">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Referrer Account</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4 text-right">Successful Referrals</th>
                  <th className="py-3 px-4 text-right">Credits Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {!analytics?.topReferrers || analytics.topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      No referral rewards issued yet.
                    </td>
                  </tr>
                ) : (
                  analytics.topReferrers.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-400">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{row.user?.name || 'Customer'}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">{row.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-300">{row.user?.referralCode || '—'}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">{row.successfulReferrals}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        ₹{(row.creditsEarned || 0).toLocaleString()}
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
        <>
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by code, referrer, referred email, or order ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium border border-neutral-700 cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
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
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="REVIEW_REQUIRED">Review Required</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="NORMAL">Normal</option>
                <option value="DISQUALIFIED">Blocked</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800 font-medium">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Referrer</th>
                    <th className="py-3 px-4">Referred Customer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Risk Flag</th>
                    <th className="py-3 px-4 text-right">Order Amount</th>
                    <th className="py-3 px-4 text-right">Credits Earned</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-500">
                        No referral records match your filters.
                      </td>
                    </tr>
                  ) : (
                    referrals.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{item.referralCode}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{item.referrer?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-neutral-500 font-mono truncate max-w-[140px]">
                            {item.referrer?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{item.referredUser?.name || 'Awaiting Signup'}</div>
                          <div className="text-[11px] text-neutral-500 font-mono truncate max-w-[140px]">
                            {item.referredUser?.email || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(item.status, item.rewardStatus)}</td>
                        <td className="py-3 px-4">{getRiskBadge(item.riskStatus)}</td>
                        <td className="py-3 px-4 text-right">
                          {item.qualifyingOrder
                            ? `₹${(item.qualifyingOrder.paidAmountInr ?? item.qualifyingOrder.amountInr).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-amber-400">
                          {item.rewardCreditsEarned > 0 ? `+₹${item.rewardCreditsEarned.toLocaleString()}` : '₹0'}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedReferral(item);
                              setActionReason('');
                              setActionMessage(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors border border-neutral-700 cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <div>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="px-2.5 py-1 rounded bg-neutral-800 disabled:opacity-40 text-white cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="px-2.5 py-1 rounded bg-neutral-800 disabled:opacity-40 text-white cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Referral Detail & Action Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  Referral Investigation: {selectedReferral.referralCode}
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">ID: {selectedReferral.id}</p>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two Customer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Referrer (Person A)</div>
                <div className="font-bold text-white text-sm">{selectedReferral.referrer?.name}</div>
                <div className="text-xs text-neutral-400 font-mono">{selectedReferral.referrer?.email}</div>
                <div className="text-[11px] text-neutral-500 font-mono">ID: {selectedReferral.referrer?.id}</div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Referred (Person B)</div>
                <div className="font-bold text-white text-sm">
                  {selectedReferral.referredUser?.name || 'Unregistered'}
                </div>
                <div className="text-xs text-neutral-400 font-mono">{selectedReferral.referredUser?.email || '—'}</div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  ID: {selectedReferral.referredUser?.id || '—'}
                </div>
              </div>
            </div>

            {/* Attribution & Order Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Status</div>
                <div className="font-bold text-white mt-0.5">{selectedReferral.status}</div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Risk Assessment</div>
                <div className="font-bold text-white mt-0.5">{selectedReferral.riskStatus}</div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Attribution Expiry</div>
                <div className="font-bold text-white mt-0.5">
                  {new Date(selectedReferral.attributionExpiresAt).toLocaleDateString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Qualifying Order</div>
                <div className="font-bold text-amber-400 mt-0.5">
                  {selectedReferral.qualifyingOrder?.internalOrderId || 'None'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Credits Awarded</div>
                <div className="font-bold text-amber-400 mt-0.5">₹{selectedReferral.rewardCreditsEarned}</div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Reward Status</div>
                <div className="font-bold text-white mt-0.5">{selectedReferral.rewardStatus}</div>
              </div>
            </div>

            {selectedReferral.notes && (
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
                <span className="text-neutral-500 block mb-1 font-mono">INTERNAL NOTES:</span>
                <p className="whitespace-pre-wrap">{selectedReferral.notes}</p>
              </div>
            )}

            {/* Admin Action Box */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Administrative Actions
              </h4>

              <input
                type="text"
                placeholder="Enter mandatory reason for audit logs..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('APPROVE')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Approve / Clear Risk
                </button>
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('MARK_REVIEW')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Flag for Review
                </button>
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('DISQUALIFY')}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Disqualify
                </button>
                {selectedReferral.rewardStatus === 'CREDITED' && (
                  <button
                    disabled={processingAction}
                    onClick={() => handleAdminAction('REVERSE_REWARD')}
                    className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reverse Reward
                  </button>
                )}
                <button
                  disabled={processingAction}
                  onClick={() => handleAdminAction('ADD_NOTE')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors border border-neutral-700 cursor-pointer"
                >
                  Add Note
                </button>
              </div>

              {actionMessage && (
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-amber-300">
                  {actionMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral Program Configuration Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Referral Engine Configuration
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Adjust qualification rules, reward caps, and attribution windows.</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <div className="font-semibold text-white">Enable Referral System</div>
                  <div className="text-neutral-500 text-[11px]">When disabled, new attribution and rewards are paused.</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settingsForm.enabled)}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Min Qualifying Purchase (INR)</label>
                  <input
                    type="number"
                    value={settingsForm.minPurchaseAmountInr ?? 500}
                    onChange={(e) => setSettingsForm({ ...settingsForm, minPurchaseAmountInr: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Max Reward Per Purchase (INR)</label>
                  <input
                    type="number"
                    value={settingsForm.maxRewardPerOrder ?? 500}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maxRewardPerOrder: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Attribution Window (Days)</label>
                  <input
                    type="number"
                    value={settingsForm.attributionWindowDays ?? 30}
                    onChange={(e) => setSettingsForm({ ...settingsForm, attributionWindowDays: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Qualification Rule</label>
                  <select
                    value={settingsForm.qualificationRule || 'FIRST_PURCHASE_ONLY'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, qualificationRule: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="FIRST_PURCHASE_ONLY">First Purchase Only</option>
                    <option value="EVERY_QUALIFYING_PURCHASE">Every Qualifying Purchase</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Reward Calculation Method</label>
                <select
                  value={settingsForm.rewardMethod || 'MATCH_PURCHASE_REWARD'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, rewardMethod: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="MATCH_PURCHASE_REWARD">Match Purchase Reward (Existing Engine)</option>
                  <option value="PERCENTAGE">Custom Percentage (e.g. 10%)</option>
                  <option value="FIXED_AMOUNT">Custom Flat Amount (INR)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.allowExistingCustomerWithoutPurchase)}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, allowExistingCustomerWithoutPurchase: e.target.checked })
                    }
                    className="w-4 h-4 accent-amber-400 rounded"
                  />
                  <span>Allow existing registered accounts with zero prior purchases to be attributed</span>
                </label>

                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.firstAttributionWins)}
                    onChange={(e) => setSettingsForm({ ...settingsForm, firstAttributionWins: e.target.checked })}
                    className="w-4 h-4 accent-amber-400 rounded"
                  />
                  <span>First valid attribution wins (do not overwrite with subsequent referral links)</span>
                </label>
              </div>

              {settingsMsg && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {settingsMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-colors cursor-pointer"
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
export default AdminReferrals;
