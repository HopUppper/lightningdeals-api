import React, { useState, useEffect } from 'react';
import { Zap, Search, Filter, Calendar, AlertTriangle, ShieldCheck, Clock, RefreshCw, UserCheck, CheckCircle2, XCircle, Ban, ExternalLink } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminPlans: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'trials'>('subscriptions');
  const [overview, setOverview] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedSubForExtend, setSelectedSubForExtend] = useState<any | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);

  const [selectedSubForStatus, setSelectedSubForStatus] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<'SUSPENDED' | 'CANCELLED' | 'ACTIVE'>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, subRes, trialRes] = await Promise.all([
        adminFetch('/api/admin/claude-plans/overview').catch(() => null),
        adminFetch(`/api/admin/subscriptions?search=${encodeURIComponent(searchQuery)}&planFilter=${planFilter}&statusFilter=${statusFilter}`).catch(() => null),
        adminFetch('/api/admin/trials').catch(() => null),
      ]);

      if (ovRes && ovRes.ok) setOverview(await ovRes.json());
      if (subRes && subRes.ok) {
        const sData = await subRes.json();
        setSubscriptions(sData.subscriptions || []);
      }
      if (trialRes && trialRes.ok) {
        const tData = await trialRes.json();
        setTrials(tData.trials || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [planFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForExtend) return;
    setExtending(true);
    try {
      const res = await adminFetch(`/api/admin/subscriptions/${selectedSubForExtend.id}/extend`, {
        method: 'POST',
        body: JSON.stringify({ additionalDays: extendDays }),
      });
      if (res.ok) {
        setSelectedSubForExtend(null);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExtending(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await adminFetch(`/api/admin/subscriptions/${selectedSubForStatus.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      if (res.ok) {
        setSelectedSubForStatus(null);
        setStatusReason('');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRevokeTrial = async (trialId: string) => {
    if (!window.confirm('Are you sure you want to revoke this free trial claim?')) return;
    try {
      const res = await adminFetch(`/api/admin/trials/${trialId}/revoke`, { method: 'POST' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            <span>CLAUDE PLANS CONTROL CENTER</span>
          </h1>
          <p className="text-xs text-muted">
            Manage active subscriptions, PRO/MAX/ULTRA quotas, free trials, manual validity extensions, and revocation audit logs.
          </p>
        </div>

        <button
          onClick={loadData}
          className="ui-button-secondary text-xs py-2 px-3.5 gap-2 font-mono self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-panel p-4 space-y-1 shadow-xs">
          <p className="text-[11px] font-mono text-muted uppercase">Active Subscriptions</p>
          <p className="text-2xl font-extrabold font-mono text-emerald-600">
            {overview?.activeSubscriptions || 0}
          </p>
          <p className="text-[10px] text-muted font-mono">Running 5h window quotas</p>
        </div>

        <div className="bg-card border border-border rounded-panel p-4 space-y-1 shadow-xs">
          <p className="text-[11px] font-mono text-muted uppercase">Today's Sales Revenue</p>
          <p className="text-2xl font-extrabold font-mono text-violet-700">
            ₹{(overview?.todayRevenueInr || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted font-mono">{overview?.todaySalesCount || 0} sales today</p>
        </div>

        <div className="bg-card border border-border rounded-panel p-4 space-y-1 shadow-xs">
          <p className="text-[11px] font-mono text-muted uppercase">Free Trial Claims</p>
          <p className="text-2xl font-extrabold font-mono text-cyan-600">
            {overview?.freeTrialsCount || 0}
          </p>
          <p className="text-[10px] text-muted font-mono">1M / 5h (24h validity)</p>
        </div>

        <div className="bg-card border border-border rounded-panel p-4 space-y-1 shadow-xs">
          <p className="text-[11px] font-mono text-muted uppercase">Expired / Cancelled</p>
          <p className="text-2xl font-extrabold font-mono text-muted">
            {overview?.expiredSubscriptions || 0}
          </p>
          <p className="text-[10px] text-muted font-mono">{overview?.pendingPayments || 0} pending payments</p>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2.5 text-xs font-bold font-mono border-b-2 transition-colors ${
            activeTab === 'subscriptions'
              ? 'border-violet-600 text-violet-700 bg-violet-50/50'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          Customer Subscriptions ({subscriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('trials')}
          className={`px-4 py-2.5 text-xs font-bold font-mono border-b-2 transition-colors ${
            activeTab === 'trials'
              ? 'border-violet-600 text-violet-700 bg-violet-50/50'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          Free Trial Claims ({trials.length})
        </button>
      </div>

      {/* SUBSCRIPTIONS TAB */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer email or name..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-card border border-border rounded-control focus:outline-none focus:border-violet-500 font-mono text-fg"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-card border border-border rounded-control font-mono text-fg focus:outline-none"
            >
              <option value="ALL">All Plans (PRO, MAX, ULTRA)</option>
              <option value="pro">PRO (₹2,499)</option>
              <option value="max">MAX (₹5,499)</option>
              <option value="ultra">ULTRA (₹9,999)</option>
              <option value="free_trial">FREE TRIAL</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-card border border-border rounded-control font-mono text-fg focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <button type="submit" className="ui-button-primary text-xs py-2 px-4 font-bold shrink-0">
              Apply Filters
            </button>
          </form>

          {/* SUBSCRIPTIONS TABLE */}
          <div className="overflow-x-auto rounded-panel border border-border bg-card shadow-xs">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-subtle border-b border-border text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Quota Limit</th>
                  <th className="p-3.5">Tokens Used</th>
                  <th className="p-3.5">Assigned Key</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted">
                      No customer subscriptions found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-fg font-sans">{s.user?.name || 'Customer'}</p>
                        <p className="text-[10px] text-muted">{s.user?.email}</p>
                      </td>
                      <td className="p-3.5 font-bold text-violet-700 uppercase">{s.planName}</td>
                      <td className="p-3.5 font-semibold text-fg">{formatTokens(s.quotaLimit)} / 5h</td>
                      <td className="p-3.5 font-semibold text-emerald-600">{formatTokens(s.currentUsage)}</td>
                      <td className="p-3.5 text-muted">{s.displayKey}</td>
                      <td className="p-3.5 text-muted">{new Date(s.expiryTime).toLocaleDateString()}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : s.status === 'EXPIRED'
                              ? 'bg-subtle text-muted border border-border'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedSubForExtend(s)}
                          className="px-2.5 py-1 rounded bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 font-bold text-[11px]"
                        >
                          + Extend
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubForStatus(s);
                            setNewStatus(s.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED');
                          }}
                          className="px-2.5 py-1 rounded bg-subtle hover:bg-border text-fg border border-border font-bold text-[11px]"
                        >
                          Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRIALS TAB */}
      {activeTab === 'trials' && (
        <div className="overflow-x-auto rounded-panel border border-border bg-card shadow-xs">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-subtle border-b border-border text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
                <th className="p-3.5">Customer / Email</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Assigned Key</th>
                <th className="p-3.5">Tokens Used</th>
                <th className="p-3.5">Decision</th>
                <th className="p-3.5">Claimed Date</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-mono">
              {trials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No free trial claims found.
                  </td>
                </tr>
              ) : (
                trials.map((t) => (
                  <tr key={t.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-fg font-sans">{t.user?.name || 'Customer'}</p>
                      <p className="text-[10px] text-muted">{t.email}</p>
                    </td>
                    <td className="p-3.5 text-muted">{t.ipAddress}</td>
                    <td className="p-3.5 text-fg">{t.displayKey}</td>
                    <td className="p-3.5 font-semibold text-emerald-600">{formatTokens(t.tokensUsed)}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.decision === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {t.decision}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 text-right">
                      {t.decision === 'APPROVED' && (
                        <button
                          onClick={() => handleRevokeTrial(t.id)}
                          className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold text-[11px]"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* EXTEND VALIDITY MODAL */}
      {selectedSubForExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-fg">Extend Subscription Validity</h2>
            <p className="text-xs text-muted font-mono">
              User: {selectedSubForExtend.user?.email} | Plan: {selectedSubForExtend.planName}
            </p>

            <form onSubmit={handleExtendSubscription} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-fg block mb-1">Additional Validity Days</label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full p-2 text-xs bg-bg border border-border rounded-control font-mono"
                >
                  <option value={7}>+7 Days</option>
                  <option value={15}>+15 Days</option>
                  <option value={30}>+30 Days (1 Month)</option>
                  <option value={60}>+60 Days (2 Months)</option>
                  <option value={90}>+90 Days (3 Months)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubForExtend(null)}
                  className="ui-button-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extending}
                  className="ui-button-primary text-xs py-2 px-4 font-bold"
                >
                  {extending ? 'Extending...' : 'Confirm Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {selectedSubForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-fg">Update Subscription Status</h2>
            <p className="text-xs text-muted font-mono">User: {selectedSubForStatus.user?.email}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-fg block mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-2 text-xs bg-bg border border-border rounded-control font-mono"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-fg block mb-1">Audit Reason</label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Reason for status change..."
                  className="w-full p-2 text-xs bg-bg border border-border rounded-control font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubForStatus(null)}
                  className="ui-button-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="ui-button-primary text-xs py-2 px-4 font-bold"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
