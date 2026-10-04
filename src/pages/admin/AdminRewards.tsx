import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  CreditCard,
  Users,
  Settings,
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
  ShoppingBag,
  MessageSquare,
  Edit2,
  ExternalLink,
  Sparkles,
  Flame,
  Eye,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';
import { RecordPurchaseModal } from '../../components/admin/RecordPurchaseModal';
import { EditPurchaseModal } from '../../components/admin/EditPurchaseModal';
import { CustomerRewardsDrawer } from '../../components/admin/CustomerRewardsDrawer';

export const AdminRewards: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'purchases' | 'ledger' | 'settings'>('purchases');

  // Overview & KPIs
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Universal Purchases State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesPagination, setPurchasesPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [purchaseChannelFilter, setPurchaseChannelFilter] = useState('ALL');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('ALL');
  const [purchaseSearch, setPurchaseSearch] = useState('');

  // Credit Ledger State
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPagination, setLedgerPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    rewardPercentage: 10,
    maxEligiblePurchaseAmount: 5000,
    maxRewardPerTransaction: 500,
    isActive: true,
    promoActive: false,
    promoMultiplier: 2.0,
    promoMinPurchaseAmount: 0,
    promoMaxCredits: 1000,
    promoTitle: '⚡ SUNDAY SPECIAL: 2X LIGHTNING CREDITS',
    promoSubtitle: 'Get 2X credits on ALL purchases today (up to 1,000 credits max on purchases up to ₹5,000)!',
    promoBadge: 'SUNDAY BOOST',
    promoShowPopup: true,
    promoShowBanner: true,
    promoEndsAt: null as string | null,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Modals & Drawers
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordCustomer, setRecordCustomer] = useState<any>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);

  const [customerDrawerUserId, setCustomerDrawerUserId] = useState<string | null>(null);
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);

  // Manual Credit Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Customer search for adjustment
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Toast Notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Escape key to close adjustment modal
  useEffect(() => {
    if (!showAdjustModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAdjustModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAdjustModal]);

  // Load Overview Data
  const loadOverview = async () => {
    try {
      const res = await adminFetch('/api/admin/rewards/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        if (data.settings) {
          setSettingsForm({
            rewardPercentage: data.settings.rewardPercentage ?? 10,
            maxEligiblePurchaseAmount: data.settings.maxEligiblePurchaseAmount ?? 5000,
            maxRewardPerTransaction: data.settings.maxRewardPerTransaction ?? 500,
            isActive: Boolean(data.settings.isActive),
            promoActive: Boolean(data.settings.promoActive),
            promoMultiplier: data.settings.promoMultiplier ?? 2.0,
            promoMinPurchaseAmount: data.settings.promoMinPurchaseAmount ?? 0,
            promoMaxCredits: data.settings.promoMaxCredits ?? 1000,
            promoTitle: data.settings.promoTitle ?? '⚡ SUNDAY SPECIAL: 2X LIGHTNING CREDITS',
            promoSubtitle: data.settings.promoSubtitle ?? 'Get 2X credits on ALL purchases today (up to 1,000 credits max on purchases up to ₹5,000)!',
            promoBadge: data.settings.promoBadge ?? 'SUNDAY BOOST',
            promoShowPopup: data.settings.promoShowPopup ?? true,
            promoShowBanner: data.settings.promoShowBanner ?? true,
            promoEndsAt: data.settings.promoEndsAt ?? null,
          });
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Load Universal Purchases
  const loadPurchases = async (page = 1) => {
    try {
      setPurchasesLoading(true);
      const url = `/api/admin/rewards/purchases?page=${page}&limit=20&channel=${purchaseChannelFilter}&status=${purchaseStatusFilter}&search=${encodeURIComponent(purchaseSearch)}`;
      const res = await adminFetch(url);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
        if (data.pagination) {
          setPurchasesPagination(data.pagination);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPurchasesLoading(false);
    }
  };

  // Load Credit Ledger
  const loadLedger = async (page = 1) => {
    try {
      setLedgerLoading(true);
      const url = `/api/admin/rewards/ledger?page=${page}&limit=20&type=${typeFilter}&search=${encodeURIComponent(ledgerSearch)}`;
      const res = await adminFetch(url);
      if (res.ok) {
        const data = await res.json();
        setLedger(data.transactions || []);
        if (data.pagination) {
          setLedgerPagination(data.pagination);
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
      await Promise.all([loadOverview(), loadPurchases(1), loadLedger(1)]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    loadPurchases(1);
  }, [purchaseChannelFilter, purchaseStatusFilter, purchaseSearch]);

  useEffect(() => {
    loadLedger(1);
  }, [typeFilter, ledgerSearch]);

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
        showToast('✓ Reward settings updated successfully.');
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

  // Customer search for adjustment modal
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      setSearchAttempted(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await adminFetch(`/api/admin/rewards/customers-search?q=${encodeURIComponent(userSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || data.customers || []);
          setSearchAttempted(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingUsers(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Submit Manual Adjustment
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    let target = adjustTargetUser;

    // Auto-select if there's only 1 search result
    if (!target && userSearchResults.length === 1) {
      target = userSearchResults[0];
      setAdjustTargetUser(target);
    }

    if (!target) {
      setAdjustError('Please search and click on a customer from the dropdown list to select them.');
      return;
    }

    const val = Number(adjustAmount);
    if (!val || val <= 0) {
      setAdjustError('Please enter a valid positive credit amount.');
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
          userId: target.id,
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
        setUserSearchQuery('');
        setUserSearchResults([]);
        setSearchAttempted(false);
        showToast(`✓ Successfully ${adjustType === 'CREDIT' ? 'added' : 'deducted'} ₹${val.toLocaleString()} credits for ${target.name || target.email}.`);
        await Promise.all([loadOverview(), loadLedger(ledgerPagination.page)]);
      } else {
        setAdjustError(data.error?.message || 'Failed to adjust credits.');
      }
    } catch (e: any) {
      setAdjustError(e.message || 'Network error occurred while saving adjustment.');
    } finally {
      setAdjusting(false);
    }
  };

  const kpis = overview?.kpis || {};
  const channelBreakdown = kpis.channelBreakdown || {};

  return (
    <div className="space-y-8 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-panel bg-emerald-600 text-white shadow-xl flex items-center gap-2 font-mono text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 text-white shadow-md shadow-violet-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-fg tracking-tight">
                  ⚡ Lightning Rewards & Universal Purchases
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  WhatsApp + Store
                </span>
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">
                Centralized control center for WhatsApp purchases, web orders, credit balances, and configurable rules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              loadOverview();
              loadPurchases(purchasesPagination.page);
              loadLedger(ledgerPagination.page);
            }}
            disabled={loading || purchasesLoading || ledgerLoading}
            className="ui-button-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${purchasesLoading || ledgerLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => {
              setShowAdjustModal(true);
              setAdjustTargetUser(null);
              setAdjustError(null);
            }}
            className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Adjust</span>
          </button>

          {/* Quick Action: Record Purchase (Prompt Section 5 & 23) */}
          <button
            onClick={() => {
              setRecordCustomer(null);
              setShowRecordModal(true);
            }}
            className="ui-button-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Purchase</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* KPI Overview Grid (with Universal Purchases & Channel Breakdown) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-panel border border-border bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-mono font-bold uppercase">Outstanding Liability</span>
            <Zap className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-violet-900 font-mono mt-2">
            ₹{loading ? '...' : (kpis.totalOutstandingLiability || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted font-mono mt-1">
            {kpis.totalCustomersWithCredits || 0} customers with active credits
          </p>
        </div>

        <div className="rounded-panel border border-border bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-mono font-bold uppercase">Total Purchases Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-fg font-mono mt-2">
            ₹{loading ? '...' : (kpis.totalEligiblePurchaseVolume || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted font-mono mt-1">
            {kpis.totalEligiblePurchases || 0} universal purchases recorded
          </p>
        </div>

        <div className="rounded-panel border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex justify-between items-center text-emerald-800">
            <span className="text-xs font-mono font-bold uppercase">💬 WhatsApp Sales</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono mt-2">
            ₹{loading ? '...' : (channelBreakdown.WHATSAPP?.volume || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-800 font-mono mt-1">
            {channelBreakdown.WHATSAPP?.count || 0} orders completed via WhatsApp
          </p>
        </div>

        <div className="rounded-panel border border-border bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-mono font-bold uppercase">Lifetime Credits Issued</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-2">
            ₹{loading ? '...' : (kpis.totalCreditsIssued || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted font-mono mt-1">
            +₹{(kpis.thisMonthIssued || 0).toLocaleString()} issued this month
          </p>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'purchases'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>All Purchases ({purchasesPagination.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Credit Activity Ledger ({ledgerPagination.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Reward & Promo Offers</span>
          {settingsForm.promoActive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
              <Flame className="w-3 h-3 text-amber-600 fill-current" />
              <span>{settingsForm.promoMultiplier}X LIVE</span>
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ALL PURCHASES (Section 22) */}
      {activeTab === 'purchases' && (
        <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-extrabold text-fg flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-violet-600" />
                <span>Universal Purchases Ledger</span>
              </h2>
              <p className="text-xs text-muted font-mono mt-0.5">
                Every purchase made through WhatsApp, Website, or Manual sales connected to customer accounts.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer, product, reference..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  className="ui-input text-xs font-mono pl-8 py-1.5 w-64"
                />
              </div>

              <select
                value={purchaseChannelFilter}
                onChange={(e) => setPurchaseChannelFilter(e.target.value)}
                className="ui-input text-xs font-mono py-1.5 px-3 bg-white"
              >
                <option value="ALL">All Channels</option>
                <option value="WHATSAPP">💬 WhatsApp</option>
                <option value="WEBSITE">🌐 Website</option>
                <option value="MANUAL">✍️ Manual</option>
                <option value="OTHER">📦 Other</option>
              </select>

              <select
                value={purchaseStatusFilter}
                onChange={(e) => setPurchaseStatusFilter(e.target.value)}
                className="ui-input text-xs font-mono py-1.5 px-3 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {purchasesLoading ? (
            <div className="py-16 text-center text-xs font-mono text-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-600" />
              Loading universal purchases...
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-muted space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto text-muted/60" />
              <p className="font-bold">No purchases found matching your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setRecordCustomer(null);
                  setShowRecordModal(true);
                }}
                className="ui-button-primary text-xs py-1.5 px-3.5 font-bold inline-flex items-center gap-1.5 mt-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record a Purchase</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-muted uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Channel</th>
                    <th className="py-2.5 px-3 text-right">Credits Earned</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {purchases.map((p: any) => (
                    <tr key={p.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-3 text-muted whitespace-nowrap">
                        {new Date(p.purchaseDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerDrawerUserId(p.user?.id);
                            setShowCustomerDrawer(true);
                          }}
                          className="text-left group"
                        >
                          <div className="text-fg font-bold group-hover:text-violet-700 transition-colors flex items-center gap-1">
                            <span>{p.user?.name || 'Unknown'}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[10px] text-muted">{p.user?.email}</div>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-fg font-semibold max-w-xs truncate">
                        {p.productName}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-fg whitespace-nowrap">
                        ₹{p.amountPaid?.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.channel === 'WHATSAPP'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.channel === 'WEBSITE'
                              ? 'bg-violet-50 text-violet-700 border border-violet-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {p.channel === 'WHATSAPP' ? '💬 WhatsApp' : p.channel === 'WEBSITE' ? '🌐 Website' : p.channel}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                        {p.creditsEarned > 0 ? `+₹${p.creditsEarned.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.status === 'COMPLETED'
                              ? 'text-emerald-700 bg-emerald-50'
                              : p.status === 'PENDING'
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-muted text-[11px] whitespace-nowrap">
                        {p.referenceId || '—'}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPurchase(p);
                            setShowEditModal(true);
                          }}
                          className="ui-button-secondary text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-mono">
            <span className="text-muted">
              Page {purchasesPagination.page} of {purchasesPagination.totalPages} ({purchasesPagination.total} total purchases)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => loadPurchases(purchasesPagination.page - 1)}
                disabled={purchasesPagination.page <= 1}
                className="ui-button-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => loadPurchases(purchasesPagination.page + 1)}
                disabled={purchasesPagination.page >= purchasesPagination.totalPages}
                className="ui-button-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREDIT ACTIVITY LEDGER */}
      {activeTab === 'ledger' && (
        <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4 animate-fadeIn">
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
                  placeholder="Search email, product, reason..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
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
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerDrawerUserId(tx.user?.id);
                              setShowCustomerDrawer(true);
                            }}
                            className="text-left group"
                          >
                            <div className="text-fg font-bold group-hover:text-violet-700 transition-colors">
                              {tx.user?.name || 'Unknown'}
                            </div>
                            <div className="text-[10px] text-muted">{tx.user?.email}</div>
                          </button>
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
                          {tx.purchase?.referenceId && (
                            <div className="text-[10px] text-violet-600 font-bold">
                              Ref: {tx.purchase.referenceId} ({tx.purchase.channel})
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

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-mono">
            <span className="text-muted">
              Page {ledgerPagination.page} of {ledgerPagination.totalPages} ({ledgerPagination.total} total transactions)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => loadLedger(ledgerPagination.page - 1)}
                disabled={ledgerPagination.page <= 1}
                className="ui-button-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => loadLedger(ledgerPagination.page + 1)}
                disabled={ledgerPagination.page >= ledgerPagination.totalPages}
                className="ui-button-secondary text-xs py-1 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REWARD CONFIGURATION & FLASH PROMOTIONS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fadeIn">
          {/* CARD 1: PROMOTIONAL FLASH OFFERS & MULTIPLIERS */}
          <div className="rounded-panel border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-white to-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-fg">
                    Promotional Flash Offers & Multipliers
                  </h2>
                  <p className="text-xs font-mono text-muted">
                    Temporarily enable/disable, boost multipliers (e.g. 2X), set order caps & customize announcements
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                {settingsForm.promoActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>● FLASH PROMO IS LIVE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-500 border border-slate-300">
                    <span>○ PROMO IS INACTIVE</span>
                  </span>
                )}
              </div>
            </div>

            {/* Master Toggle & Quick Preset Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-control bg-amber-50/80 border border-amber-200">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.promoActive}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, promoActive: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <div>
                  <span className="text-xs font-extrabold text-fg block">
                    {settingsForm.promoActive
                      ? 'Flash Promotional Offer is Active (Live on Website & Dashboard)'
                      : 'Flash Promotional Offer is Disabled'}
                  </span>
                  <span className="text-[11px] text-muted font-mono">
                    Flip this switch anytime to immediately launch or pause the promotional boost
                  </span>
                </div>
              </div>

              {/* Quick Preset Button */}
              <button
                type="button"
                onClick={() => {
                  setSettingsForm({
                    ...settingsForm,
                    promoActive: true,
                    promoMultiplier: 2.0,
                    promoMinPurchaseAmount: 0,
                    promoMaxCredits: 1000,
                    promoTitle: '⚡ SUNDAY SPECIAL: 2X LIGHTNING CREDITS',
                    promoSubtitle:
                      'Get 2X credits on ALL purchases today (up to 1,000 credits max on purchases up to ₹5,000)!',
                    promoBadge: 'SUNDAY BOOST',
                    promoShowPopup: true,
                    promoShowBanner: true,
                  });
                  showToast('⚡ Preset Applied: Sunday 2X Special (2x on ALL orders, Capped at 1,000 Credits on ₹5,000 purchase)');
                }}
                className="ui-button-secondary text-xs py-2 px-3.5 font-bold flex items-center justify-center gap-1.5 shrink-0 bg-white hover:bg-amber-100/50 border-amber-300 text-amber-900"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Load Sunday 2X Deal Preset</span>
              </button>
            </div>

            {/* Configurable Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase flex items-center gap-1">
                  <span>Multiplier Boost</span>
                  <span className="text-amber-600 font-bold">(e.g. 2 for 2X)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.1}
                    value={settingsForm.promoMultiplier}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, promoMultiplier: Number(e.target.value) })
                    }
                    className="w-full ui-input text-xs font-mono py-2 pr-8 font-bold"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted">
                    X
                  </span>
                </div>
                <p className="text-[10px] text-muted font-mono">2.0 = Double credits</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase flex items-center gap-1">
                  <span>Min Purchase Qualifying (₹)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={settingsForm.promoMinPurchaseAmount}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        promoMinPurchaseAmount: Number(e.target.value),
                      })
                    }
                    className="w-full ui-input text-xs font-mono py-2 pl-7 font-bold"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted font-mono">0 = All purchases qualify (even below ₹5,000)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase flex items-center gap-1">
                  <span>Max Promo Credits Cap</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={settingsForm.promoMaxCredits}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        promoMaxCredits: Number(e.target.value),
                      })
                    }
                    className="w-full ui-input text-xs font-mono py-2 pr-14 font-bold"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-muted">
                    Credits
                  </span>
                </div>
                <p className="text-[10px] text-muted font-mono">Maximum reward ceiling (0 = no cap)</p>
              </div>
            </div>

            {/* Offer Texts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Promotional Title / Headline
                </label>
                <input
                  type="text"
                  value={settingsForm.promoTitle}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, promoTitle: e.target.value })
                  }
                  placeholder="e.g. ⚡ SUNDAY SPECIAL: 2X LIGHTNING CREDITS"
                  className="w-full ui-input text-xs font-mono py-2"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={settingsForm.promoBadge}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, promoBadge: e.target.value })
                  }
                  placeholder="e.g. SUNDAY BOOST"
                  className="w-full ui-input text-xs font-mono py-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-fg uppercase">
                Promotional Subtitle / Customer Pitch
              </label>
              <input
                type="text"
                value={settingsForm.promoSubtitle}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, promoSubtitle: e.target.value })
                }
                placeholder="e.g. Earn double credits (up to 1,000 credits) on all purchases of ₹5,000 or above today!"
                className="w-full ui-input text-xs font-mono py-2"
                required
              />
            </div>

            {/* Customer Display Channels */}
            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-fg">
                <input
                  type="checkbox"
                  checked={settingsForm.promoShowPopup}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, promoShowPopup: e.target.checked })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Show Animated Pop-up Modal to Website Visitors</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-fg">
                <input
                  type="checkbox"
                  checked={settingsForm.promoShowBanner}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, promoShowBanner: e.target.checked })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Show Top Announcement Banner on Homepage</span>
              </label>
            </div>

            {/* Live Customer Preview Box */}
            <div className="p-4 rounded-control bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Customer Preview (How it appears to buyers)</span>
                </span>
                <span className="text-[10px] text-amber-300 font-bold uppercase">
                  {settingsForm.promoBadge}
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-white">
                  {settingsForm.promoTitle}
                </h4>
                <p className="text-xs text-slate-300">
                  {settingsForm.promoSubtitle}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2 text-amber-300">
                  <span>⚡ Example 1: ₹1,000 purchase earns <strong>200 Credits</strong> (Standard: 100)</span>
                  <span className="text-emerald-400 font-bold">{settingsForm.promoMultiplier}X Applied</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-amber-300">
                  <span>⚡ Example 2: ₹5,000 purchase earns <strong>1,000 Credits</strong> (Standard: 500)</span>
                  <span className="text-emerald-400 font-bold">{settingsForm.promoMultiplier}X Applied</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                  <span>⚡ Example 3: ₹6,000+ purchase earns <strong className="text-white">1,000 Credits</strong> (Capped at {settingsForm.promoMaxCredits.toLocaleString()} max on ₹5,000 purchase cap)</span>
                  <span className="text-amber-400 font-bold">Capped at {settingsForm.promoMaxCredits.toLocaleString()} Max</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: BASE REWARD PROGRAM SETTINGS */}
          <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-600" />
                <h2 className="text-base font-extrabold text-fg">Base Reward Program Settings</h2>
              </div>
              <span className="text-xs font-mono text-muted">
                Standard non-promotional reward parameters
              </span>
            </div>

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
                    setSettingsForm({
                      ...settingsForm,
                      maxEligiblePurchaseAmount: Number(e.target.value),
                    })
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
                    setSettingsForm({
                      ...settingsForm,
                      maxRewardPerTransaction: Number(e.target.value),
                    })
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
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, isActive: e.target.checked })
                  }
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <span>Enable Lightning Rewards Program</span>
              </label>

              <div className="flex items-center gap-3">
                {settingsSuccess && (
                  <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Settings Saved & Deployed!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="ui-button-primary text-xs py-2 px-6 font-bold flex items-center gap-1.5 shadow-md"
                >
                  {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save All Settings & Deploy Live</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Record Purchase Modal (Step 1 + Step 2 Confirmation) */}
      <RecordPurchaseModal
        isOpen={showRecordModal}
        onClose={() => {
          setShowRecordModal(false);
          setRecordCustomer(null);
        }}
        preselectedCustomer={recordCustomer}
        onSuccess={(result) => {
          showToast(`✓ Purchase recorded! +₹${result.creditsAwarded?.toLocaleString()} Lightning Credits awarded.`);
          loadOverview();
          loadPurchases(1);
          loadLedger(1);
        }}
      />

      {/* Edit Purchase Modal */}
      <EditPurchaseModal
        isOpen={showEditModal}
        purchase={editingPurchase}
        onClose={() => {
          setShowEditModal(false);
          setEditingPurchase(null);
        }}
        onSuccess={() => {
          showToast('✓ Purchase updated successfully.');
          loadOverview();
          loadPurchases(purchasesPagination.page);
          loadLedger(ledgerPagination.page);
        }}
      />

      {/* Customer Profile Drawer */}
      <CustomerRewardsDrawer
        isOpen={showCustomerDrawer}
        userId={customerDrawerUserId}
        onClose={() => {
          setShowCustomerDrawer(false);
          setCustomerDrawerUserId(null);
        }}
        onRecordPurchase={(cust) => {
          setShowCustomerDrawer(false);
          setRecordCustomer(cust);
          setShowRecordModal(true);
        }}
        onAdjustCredits={(cust, type) => {
          setShowCustomerDrawer(false);
          setAdjustTargetUser(cust);
          setAdjustType(type);
          setShowAdjustModal(true);
        }}
      />

      {/* Manual Credit / Debit Adjustment Modal */}
      {showAdjustModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdjustModal(false);
          }}
        >
          <div className="min-h-full flex items-center justify-center py-4">
            <div
              className="bg-white border border-border rounded-panel w-full max-w-lg shadow-2xl overflow-hidden font-sans space-y-0 relative flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-bg/50 shrink-0 sticky top-0 z-10">
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

              <form onSubmit={handleSubmitAdjustment} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {adjustError && (
                <div className="p-3 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              {/* Customer Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase flex items-center justify-between">
                  <span>Target Customer *</span>
                  {adjustTargetUser && (
                    <button
                      type="button"
                      onClick={() => setAdjustTargetUser(null)}
                      className="text-xs text-violet-600 hover:text-violet-700 underline font-mono font-normal"
                    >
                      (change customer)
                    </button>
                  )}
                </label>

                {adjustTargetUser ? (
                  <div className="p-3 rounded-control bg-violet-50/70 border border-violet-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {adjustTargetUser.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-fg flex items-center gap-1.5">
                          <span>{adjustTargetUser.name}</span>
                          <button
                            type="button"
                            title="View Customer Profile"
                            onClick={() => {
                              setShowAdjustModal(false);
                              setCustomerDrawerUserId(adjustTargetUser.id);
                              setShowCustomerDrawer(true);
                            }}
                            className="text-violet-600 hover:text-violet-800 text-[11px] font-mono flex items-center gap-0.5 underline ml-1"
                          >
                            <span>view account</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-muted font-mono">
                          {adjustTargetUser.email} {adjustTargetUser.phone ? `• ${adjustTargetUser.phone}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-muted uppercase font-mono">Current Balance</div>
                      <div className="text-xs font-extrabold text-violet-700 font-mono">
                        ₹{(adjustTargetUser.availableCredits || 0).toLocaleString()} Credits
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search customer email or name (e.g. prime)..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          setAdjustError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                        autoComplete="off"
                        className="ui-input text-xs font-mono pl-8 pr-8 py-2 w-full"
                        autoFocus
                      />
                      {searchingUsers && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Customer Dropdown Results */}
                    {userSearchResults.length > 0 && (
                      <div className="border border-border rounded-control bg-white shadow-lg overflow-hidden divide-y divide-border/60 max-h-48 overflow-y-auto">
                        {userSearchResults.map((u) => (
                          <div
                            key={u.id}
                            className="p-2.5 hover:bg-violet-50/70 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                            onClick={() => {
                              setAdjustTargetUser(u);
                              setUserSearchResults([]);
                              setUserSearchQuery('');
                              setAdjustError(null);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {u.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-fg block group-hover:text-violet-800">{u.name}</span>
                                <span className="text-[11px] text-muted font-mono">
                                  {u.email} {u.phone ? `• ${u.phone}` : ''}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <span className="text-[9px] text-muted uppercase block font-mono">Balance</span>
                                <span className="text-xs font-mono font-bold text-violet-700">
                                  ₹{(u.availableCredits || 0).toLocaleString()}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                                Select
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchAttempted && userSearchResults.length === 0 && userSearchQuery.trim() && (
                      <div className="p-3 rounded-control bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>No customer found matching "{userSearchQuery}"</span>
                        </div>
                        <p className="text-[11px] text-amber-700 mt-1">
                          The customer must have a registered account on LightningAPI.pro.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('CREDIT')}
                  className={`py-2 px-3 rounded-control text-xs font-bold font-mono border flex items-center justify-center gap-1.5 ${
                    adjustType === 'CREDIT'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                      : 'bg-white border-border text-muted hover:text-fg'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Credits (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('DEBIT')}
                  className={`py-2 px-3 rounded-control text-xs font-bold font-mono border flex items-center justify-center gap-1.5 ${
                    adjustType === 'DEBIT'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                      : 'bg-white border-border text-muted hover:text-fg'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>Deduct Credits (-)</span>
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Amount (Credits in INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="100"
                    className="ui-input text-xs font-mono pl-7 py-2 w-full font-bold"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono text-fg uppercase">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Goodwill compensation, loyalty bonus, manual correction"
                  className="ui-input text-xs font-mono py-2 w-full"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="ui-button-secondary text-xs py-2 px-4 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="ui-button-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adjusting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{adjusting ? 'Saving Adjustment...' : 'Confirm Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default AdminRewards;
