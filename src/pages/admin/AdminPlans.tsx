import React, { useState, useEffect } from 'react';
import {
  Zap,
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Percent,
  Copy,
  Check,
  Power,
  Sparkles,
  DollarSign,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminPlans: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons' | 'subscriptions' | 'trials'>('plans');
  const [loading, setLoading] = useState(true);

  // Plans State
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<any>({
    name: '',
    displayName: '',
    tokenAllowance: 5000000,
    tokenDisplay: '',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 2499,
    originalPriceInr: 3499,
    tagline: '',
    badge: '',
    features: ['5,000,000 Tokens / 5h Window', '30-Day Fixed Validity', 'Claude Sonnet 5 & Haiku 4.5 Access'],
    featured: false,
    enabled: true,
    sortOrder: 1,
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState<any | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<any>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmountInr: 2000,
    maxDiscountInr: 2000,
    maxUses: 100,
    maxUsesPerUser: 1,
    expiresAt: '',
    description: '',
    status: 'ACTIVE',
  });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  // Subscriptions & Trials State
  const [overview, setOverview] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals for Subscriptions
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
      const [plansRes, couponsRes, ovRes, subRes, trialRes] = await Promise.all([
        adminFetch('/api/admin/plans-catalog').catch(() => null),
        adminFetch('/api/admin/coupons').catch(() => null),
        adminFetch('/api/admin/claude-plans/overview').catch(() => null),
        adminFetch(`/api/admin/subscriptions?search=${encodeURIComponent(searchQuery)}&planFilter=${planFilter}&statusFilter=${statusFilter}`).catch(() => null),
        adminFetch('/api/admin/trials').catch(() => null),
      ]);

      if (plansRes && plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }
      if (couponsRes && couponsRes.ok) {
        const cData = await couponsRes.json();
        setCoupons(cData.coupons || []);
      }
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

  // Plan Management Handlers
  const handleOpenNewPlanModal = () => {
    setSelectedPlanForEdit(null);
    setPlanForm({
      name: '',
      displayName: '',
      tokenAllowance: 5000000,
      tokenDisplay: '',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 100,
      priceInr: 2499,
      originalPriceInr: 3499,
      tagline: '',
      badge: '',
      features: ['5,000,000 Tokens / 5h Window', '30-Day Fixed Validity', 'Claude Sonnet 5 & Haiku 4.5 Access'],
      featured: false,
      enabled: true,
      sortOrder: plans.length + 1,
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlanModal = (plan: any) => {
    setSelectedPlanForEdit(plan);
    setPlanForm({
      name: plan.name,
      displayName: plan.displayName,
      tokenAllowance: Number(plan.tokenAllowance),
      tokenDisplay: plan.tokenDisplay || '',
      windowHours: plan.windowHours,
      validityDays: plan.validityDays,
      rateLimitRpm: plan.rateLimitRpm || 100,
      priceInr: plan.priceInr,
      originalPriceInr: plan.originalPriceInr || '',
      tagline: plan.tagline || '',
      badge: plan.badge || '',
      features: plan.features && plan.features.length > 0 ? plan.features : ['30-Day Fixed Validity', 'Instant Automated Key Delivery'],
      featured: plan.featured,
      enabled: plan.enabled,
      sortOrder: plan.sortOrder || 0,
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const url = selectedPlanForEdit
        ? `/api/admin/plans-catalog/${selectedPlanForEdit.id}`
        : '/api/admin/plans-catalog';
      const method = selectedPlanForEdit ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify({
          ...planForm,
          tokenDisplay: planForm.tokenDisplay || `${Number(planForm.tokenAllowance) / 1000000}M TOKENS / ${planForm.windowHours} HOURS`,
          features: Array.isArray(planForm.features) ? planForm.features : planForm.features.split('\n').filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsPlanModalOpen(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to save plan');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleTogglePlan = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/plans-catalog/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete or archive the plan "${name}"?`)) return;
    try {
      const res = await adminFetch(`/api/admin/plans-catalog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to delete plan');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting plan');
    }
  };

  // Coupon Handlers
  const handleOpenNewCouponModal = () => {
    setSelectedCouponForEdit(null);
    setCouponForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmountInr: 2000,
      maxDiscountInr: 2000,
      maxUses: 100,
      maxUsesPerUser: 1,
      expiresAt: '',
      description: '',
      status: 'ACTIVE',
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCouponModal = (c: any) => {
    setSelectedCouponForEdit(c);
    setCouponForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmountInr: c.minOrderAmountInr,
      maxDiscountInr: c.maxDiscountInr || '',
      maxUses: c.maxUses || '',
      maxUsesPerUser: c.maxUsesPerUser || 1,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '',
      description: c.description || '',
      status: c.status,
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCoupon(true);
    try {
      const url = selectedCouponForEdit
        ? `/api/admin/coupons/${selectedCouponForEdit.id}`
        : '/api/admin/coupons';
      const method = selectedCouponForEdit ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(couponForm),
      });

      if (res.ok) {
        setIsCouponModalOpen(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to save coupon');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/coupons/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      const res = await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2000);
  };

  // Subscription Handlers
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

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            Plans, Offers & Coupons Center
          </h1>
          <p className="text-xs text-muted font-mono mt-0.5">
            Manage dynamic pricing, discount offers, promo codes, and live customer quotas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'plans' && (
            <button
              onClick={handleOpenNewPlanModal}
              className="ui-button-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE NEW PLAN
            </button>
          )}

          {activeTab === 'coupons' && (
            <button
              onClick={handleOpenNewCouponModal}
              className="ui-button-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE PROMO CODE
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 border border-border rounded-control bg-card text-muted hover:text-fg hover:bg-subtle"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-panel bg-card border border-border space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Active Plans</span>
          <div className="text-xl font-extrabold font-mono text-fg">
            {plans.filter((p) => p.enabled).length} / {plans.length}
          </div>
          <p className="text-[10px] text-muted">Configured in database</p>
        </div>

        <div className="p-4 rounded-panel bg-card border border-border space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Active Promo Codes</span>
          <div className="text-xl font-extrabold font-mono text-emerald-600">
            {coupons.filter((c) => c.status === 'ACTIVE').length}
          </div>
          <p className="text-[10px] text-muted">Ready for checkout</p>
        </div>

        <div className="p-4 rounded-panel bg-card border border-border space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Live Subscriptions</span>
          <div className="text-xl font-extrabold font-mono text-violet-700">
            {overview?.activeSubscriptions || 0}
          </div>
          <p className="text-[10px] text-muted">Paying customer keys</p>
        </div>

        <div className="p-4 rounded-panel bg-card border border-border space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Today's Revenue</span>
          <div className="text-xl font-extrabold font-mono text-fg">
            ₹{(overview?.todayRevenueInr || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-muted">{overview?.todaySalesCount || 0} orders today</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-6 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'plans'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Zap className="w-4 h-4" />
          PLANS & OFFER PRICING ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'coupons'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Tag className="w-4 h-4" />
          COUPONS & PROMO CODES ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'subscriptions'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Users className="w-4 h-4" />
          CUSTOMER SUBSCRIPTIONS ({subscriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('trials')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'trials'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          FREE TRIAL CLAIMS ({trials.length})
        </button>
      </div>

      {/* TAB 1: PLANS CATALOG */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`p-5 rounded-panel bg-card border flex flex-col justify-between space-y-4 shadow-xs transition-all relative ${
                  p.featured
                    ? 'border-2 border-violet-500 shadow-md shadow-violet-500/10'
                    : 'border-border hover:border-violet-300'
                } ${!p.enabled ? 'opacity-60 bg-subtle/40' : ''}`}
              >
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.badge && (
                      <span className="text-[10px] font-mono font-bold uppercase text-white bg-violet-600 px-2 py-0.5 rounded shadow-xs">
                        {p.badge}
                      </span>
                    )}
                    {p.featured && (
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      p.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {p.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                {/* Plan Info */}
                <div className="space-y-2">
                  <div>
                    <h3 className="text-xl font-extrabold text-fg">{p.name}</h3>
                    <p className="text-xs text-muted font-mono">{p.displayName}</p>
                  </div>

                  <p className="text-xs text-muted min-h-[32px] line-clamp-2">
                    {p.tagline || 'Custom high-performance Claude quota plan'}
                  </p>

                  <div className="pt-2 border-t border-border flex items-baseline gap-2 font-mono">
                    <span className="text-2xl font-extrabold text-fg">₹{p.priceInr.toLocaleString()}</span>
                    {p.originalPriceInr && (
                      <span className="text-xs text-muted line-through">₹{p.originalPriceInr.toLocaleString()}</span>
                    )}
                    <span className="text-xs text-muted">/ {p.validityDays}d</span>
                  </div>

                  <div className="p-2.5 rounded bg-subtle/70 text-xs font-mono space-y-1 text-muted">
                    <div>Tokens: <strong>{p.tokenDisplay || `${Number(p.tokenAllowance) / 1000000}M / ${p.windowHours}h`}</strong></div>
                    <div>Rate Limit: <strong>{p.rateLimitRpm} RPM</strong></div>
                    <div>Active Subscribers: <strong className="text-violet-700">{p.activeSubCount || 0}</strong></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePlan(p.id)}
                    className={`p-2 rounded-control border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                      p.enabled
                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                    title={p.enabled ? 'Disable Plan' : 'Enable Plan'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{p.enabled ? 'DISABLE' : 'ENABLE'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditPlanModal(p)}
                      className="p-2 rounded-control border border-border text-fg hover:bg-subtle text-xs font-mono font-bold flex items-center gap-1"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>

                    <button
                      onClick={() => handleDeletePlan(p.id, p.name)}
                      className="p-2 rounded-control border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                      title="Delete / Archive Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COUPONS & PROMO CODES */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-panel border border-border shadow-xs bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-border text-xs font-mono font-bold uppercase tracking-wider text-muted">
                  <th className="p-3.5">Promo Code</th>
                  <th className="p-3.5">Discount</th>
                  <th className="p-3.5">Min Order / Cap</th>
                  <th className="p-3.5">Redemptions</th>
                  <th className="p-3.5">Per-User</th>
                  <th className="p-3.5">Expiry</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted">
                      No coupon codes found. Click "CREATE PROMO CODE" above to create one.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="p-3.5 font-bold text-fg">
                        <div className="flex items-center gap-2">
                          <span className="bg-violet-50 text-violet-800 border border-violet-200/80 px-2 py-0.5 rounded font-extrabold">
                            {c.code}
                          </span>
                          <button
                            onClick={() => handleCopyCoupon(c.code)}
                            className="text-muted hover:text-fg"
                            title="Copy code"
                          >
                            {copiedCouponCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {c.description && (
                          <p className="text-[10px] text-muted font-sans mt-0.5">{c.description}</p>
                        )}
                      </td>

                      <td className="p-3.5 font-bold text-emerald-700">
                        {c.discountType === 'PERCENTAGE' ? (
                          <span className="flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5" /> {c.discountValue}% OFF
                          </span>
                        ) : (
                          <span>₹{c.discountValue} FLAT OFF</span>
                        )}
                      </td>

                      <td className="p-3.5 text-muted">
                        <div>Min: ₹{c.minOrderAmountInr.toLocaleString()}</div>
                        {c.maxDiscountInr && <div>Cap: ₹{c.maxDiscountInr.toLocaleString()}</div>}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-fg">
                          {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : 'uses'}
                        </div>
                        {c.maxUses && (
                          <div className="w-20 h-1.5 bg-subtle rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, (c.usedCount / c.maxUses) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-muted">{c.maxUsesPerUser}x max</td>

                      <td className="p-3.5 text-muted">
                        {c.expiresAt ? (
                          new Date(c.expiresAt) < new Date() ? (
                            <span className="text-rose-600 font-bold">Expired</span>
                          ) : (
                            new Date(c.expiresAt).toLocaleDateString()
                          )
                        ) : (
                          'Never'
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleToggleCoupon(c.id)}
                          className="p-1.5 rounded-control border border-border text-muted hover:text-fg hover:bg-subtle"
                          title={c.status === 'ACTIVE' ? 'Disable coupon' : 'Enable coupon'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditCouponModal(c)}
                          className="p-1.5 rounded-control border border-border text-muted hover:text-fg hover:bg-subtle"
                          title="Edit coupon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-1.5 rounded-control border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 3: CUSTOMER SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-panel border border-border shadow-xs bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-border text-xs font-mono font-bold uppercase tracking-wider text-muted">
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">API Key</th>
                  <th className="p-3.5">Tokens Used / Quota</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-fg">{s.user?.name || 'Customer'}</div>
                      <div className="text-muted text-[11px]">{s.user?.email}</div>
                    </td>
                    <td className="p-3.5 font-bold text-violet-700">{s.planName}</td>
                    <td className="p-3.5 font-mono text-muted">{s.apiKey?.displayKey || 'N/A'}</td>
                    <td className="p-3.5">
                      <div>{(Number(s.currentUsage) / 1000000).toFixed(2)}M / {(Number(s.quotaLimit) / 1000000).toFixed(0)}M</div>
                      <div className="text-[10px] text-muted">Resets in {s.quotaWindowHours}h</div>
                    </td>
                    <td className="p-3.5 text-muted">{new Date(s.expiryTime).toLocaleDateString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedSubForExtend(s)}
                        className="px-2 py-1 rounded-control border border-border text-muted hover:text-fg hover:bg-subtle text-[11px]"
                      >
                        Extend
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubForStatus(s);
                          setNewStatus(s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                        }}
                        className="px-2 py-1 rounded-control border border-border text-muted hover:text-fg hover:bg-subtle text-[11px]"
                      >
                        Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FREE TRIAL CLAIMS */}
      {activeTab === 'trials' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-panel border border-border shadow-xs bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-border text-xs font-mono font-bold uppercase tracking-wider text-muted">
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Risk Score</th>
                  <th className="p-3.5">Decision</th>
                  <th className="p-3.5">Claimed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {trials.map((t) => (
                  <tr key={t.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-3.5 font-bold text-fg">{t.email}</td>
                    <td className="p-3.5 text-muted">{t.ipAddress}</td>
                    <td className="p-3.5">{t.riskScore}</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t.decision}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PLAN CREATE / EDIT */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600" />
                {selectedPlanForEdit ? `Edit Plan: ${selectedPlanForEdit.name}` : 'Create New Subscription Plan'}
              </h2>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-muted hover:text-fg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Plan Identifier (Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ULTRA"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Display Title</label>
                  <input
                    type="text"
                    placeholder="e.g. ULTRA (40M / 5h Window)"
                    value={planForm.displayName}
                    onChange={(e) => setPlanForm({ ...planForm, displayName: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Offer Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={planForm.priceInr}
                    onChange={(e) => setPlanForm({ ...planForm, priceInr: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Original Price (₹ INR Strikethrough)</label>
                  <input
                    type="number"
                    placeholder="e.g. 7499"
                    value={planForm.originalPriceInr}
                    onChange={(e) => setPlanForm({ ...planForm, originalPriceInr: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted mb-1">Tokens Quota</label>
                  <input
                    type="number"
                    required
                    placeholder="20000000"
                    value={planForm.tokenAllowance}
                    onChange={(e) => setPlanForm({ ...planForm, tokenAllowance: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Window Hours</label>
                  <input
                    type="number"
                    required
                    value={planForm.windowHours}
                    onChange={(e) => setPlanForm({ ...planForm, windowHours: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    required
                    value={planForm.validityDays}
                    onChange={(e) => setPlanForm({ ...planForm, validityDays: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Badge (e.g. 50% OFF)</label>
                  <input
                    type="text"
                    placeholder="e.g. MOST POPULAR"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Best for high-velocity teams"
                    value={planForm.tagline}
                    onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.featured}
                    onChange={(e) => setPlanForm({ ...planForm, featured: e.target.checked })}
                    className="rounded border-border text-violet-600"
                  />
                  <span>Featured Plan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.enabled}
                    onChange={(e) => setPlanForm({ ...planForm, enabled: e.target.checked })}
                    className="rounded border-border text-violet-600"
                  />
                  <span>Enabled on Website</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="ui-button-secondary text-xs py-2 px-4"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="ui-button-primary text-xs py-2 px-5 font-bold"
                >
                  {savingPlan ? 'SAVING...' : 'SAVE PLAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COUPON CREATE / EDIT */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                {selectedCouponForEdit ? `Edit Promo Code: ${selectedCouponForEdit.code}` : 'Create Promo Code'}
              </h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-muted hover:text-fg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAUNCH50"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="w-full ui-input text-xs py-2 px-3 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  >
                    <option value="PERCENTAGE">Percentage (%) Off</option>
                    <option value="FLAT_INR">Flat Rupee (₹) Off</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">
                    Discount Value ({couponForm.discountType === 'PERCENTAGE' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmountInr}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmountInr: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Max Total Redemptions</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Per-User Limit</label>
                  <input
                    type="number"
                    value={couponForm.maxUsesPerUser}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUsesPerUser: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                  className="w-full ui-input text-xs py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Internal Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount for Twitter launch campaign"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full ui-input text-xs py-2 px-3"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="ui-button-secondary text-xs py-2 px-4"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="ui-button-primary text-xs py-2 px-5 font-bold bg-emerald-600 hover:bg-emerald-700"
                >
                  {savingCoupon ? 'SAVING...' : 'SAVE COUPON'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND SUBSCRIPTION MODAL */}
      {selectedSubForExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-fg">Extend Customer Subscription</h3>
            <p className="text-xs text-muted">Customer: {selectedSubForExtend.user?.email}</p>
            <form onSubmit={handleExtendSubscription} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-muted mb-1">Additional Days</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full ui-input text-xs py-2 px-3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubForExtend(null)}
                  className="ui-button-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extending}
                  className="ui-button-primary text-xs py-1.5 px-4 font-bold"
                >
                  {extending ? 'Extending...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS UPDATE MODAL */}
      {selectedSubForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-fg">Update Subscription Status</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-muted mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full ui-input text-xs py-2 px-3"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-muted mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="Reason for change"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full ui-input text-xs py-2 px-3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubForStatus(null)}
                  className="ui-button-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="ui-button-primary text-xs py-1.5 px-4 font-bold"
                >
                  {updatingStatus ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
