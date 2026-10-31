import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  Coins,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminPlans: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons' | 'subscriptions' | 'trials' | 'supplier-rates'>('plans');
  const [loading, setLoading] = useState(true);
  const [trialsDisabled, setTrialsDisabled] = useState(false);
  const [togglingTrials, setTogglingTrials] = useState(false);

  // Category filter for plans tab
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Plans State
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<any>({
    name: '',
    displayName: '',
    planCategory: 'claude_max_rolling',
    planType: 'window',
    tokenAllowance: 5000000,
    tokenDisplay: '',
    windowHours: 5,
    validityDays: 30,
    rateLimitRpm: 100,
    priceInr: 2499,
    originalPriceInr: 3499,
    annualPriceInr: 24990,
    annualOriginalPriceInr: 29988,
    annualValidityDays: 365,
    tagline: '',
    badge: '',
    features: ['5,000,000 Tokens / 5h Window', '30-Day Fixed Validity', 'Claude Sonnet 5.5 & Haiku 5.5 Access'],
    featured: false,
    enabled: true,
    sortOrder: 1,
    creditMultiplier: 7.0,
    creditAmountInr: 0,
    creditBalanceDenomination: 'INR',
    supplierCostInr: 0,
    supplierCostUsd: '',
    supplierAllocation: '',
    minGrossMarginPct: 20,
    providerScope: 'all',
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // Supplier Rates State
  const [supplierRates, setSupplierRates] = useState<any[]>([]);
  const [selectedRateForEdit, setSelectedRateForEdit] = useState<any | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateForm, setRateForm] = useState<any>({
    supplierCostInr: 0,
    notes: '',
  });
  const [savingRate, setSavingRate] = useState(false);

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
  const [extendReason, setExtendReason] = useState('Administrative manual extension');
  const [extending, setExtending] = useState(false);

  const [selectedSubForStatus, setSelectedSubForStatus] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<'SUSPENDED' | 'CANCELLED' | 'ACTIVE'>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, couponsRes, ovRes, subRes, trialRes, emergencyRes, ratesRes] = await Promise.all([
        adminFetch('/api/admin/plans-catalog').catch(() => null),
        adminFetch('/api/admin/coupons').catch(() => null),
        adminFetch('/api/admin/claude-plans/overview').catch(() => null),
        adminFetch(`/api/admin/subscriptions?search=${encodeURIComponent(searchQuery)}&planFilter=${planFilter}&statusFilter=${statusFilter}`).catch(() => null),
        adminFetch('/api/admin/trials').catch(() => null),
        adminFetch('/api/admin/emergency/status').catch(() => null),
        adminFetch('/api/admin/supplier-rates').catch(() => null),
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
      if (emergencyRes && emergencyRes.ok) {
        const eData = await emergencyRes.json();
        setTrialsDisabled(!!eData.trialsDisabled);
      }
      if (ratesRes && ratesRes.ok) {
        const rData = await ratesRes.json();
        setSupplierRates(rData.rates || []);
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

  // Plan Handlers
  const handleOpenNewPlanModal = () => {
    setSelectedPlanForEdit(null);
    setPlanForm({
      name: '',
      displayName: '',
      planCategory: 'claude_max_rolling',
      planType: 'window',
      tokenAllowance: 5000000,
      tokenDisplay: '',
      windowHours: 5,
      validityDays: 30,
      rateLimitRpm: 100,
      priceInr: 2499,
      originalPriceInr: 3499,
      annualPriceInr: 24990,
      annualOriginalPriceInr: 29988,
      annualValidityDays: 365,
      tagline: '',
      badge: '',
      features: ['5,000,000 Tokens / 5h Window', '30-Day Fixed Validity', 'Claude Sonnet 5.5 & Haiku 5.5 Access'],
      featured: false,
      enabled: true,
      sortOrder: plans.length + 1,
      creditMultiplier: 7.0,
      creditAmountInr: 0,
      creditBalanceDenomination: 'INR',
      supplierCostInr: 0,
      supplierCostUsd: '',
      supplierAllocation: '',
      minGrossMarginPct: 20,
      providerScope: 'all',
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlanModal = (plan: any) => {
    setSelectedPlanForEdit(plan);
    setPlanForm({
      name: plan.name,
      displayName: plan.displayName,
      planCategory: plan.planCategory || 'claude_max_rolling',
      planType: plan.planType || 'window',
      tokenAllowance: Number(plan.tokenAllowance),
      tokenDisplay: plan.tokenDisplay || '',
      windowHours: plan.windowHours,
      validityDays: plan.validityDays,
      rateLimitRpm: plan.rateLimitRpm || 100,
      priceInr: plan.priceInr,
      originalPriceInr: plan.originalPriceInr || '',
      annualPriceInr: plan.annualPriceInr !== null && plan.annualPriceInr !== undefined ? plan.annualPriceInr : '',
      annualOriginalPriceInr: plan.annualOriginalPriceInr !== null && plan.annualOriginalPriceInr !== undefined ? plan.annualOriginalPriceInr : '',
      annualValidityDays: plan.annualValidityDays || 365,
      tagline: plan.tagline || '',
      badge: plan.badge || '',
      features: plan.features && plan.features.length > 0 ? plan.features : ['30-Day Fixed Validity', 'Instant Automated Key Delivery'],
      featured: plan.featured,
      enabled: plan.enabled,
      sortOrder: plan.sortOrder || 0,
      creditMultiplier: plan.creditMultiplier ? Number(plan.creditMultiplier) : 7.0,
      creditAmountInr: plan.creditAmountInr ? Number(plan.creditAmountInr) : 0,
      creditBalanceDenomination: plan.creditBalanceDenomination || 'INR',
      supplierCostInr: plan.supplierCostInr != null ? Number(plan.supplierCostInr) : 0,
      supplierCostUsd: plan.supplierCostUsd || '',
      supplierAllocation: plan.supplierAllocation || '',
      minGrossMarginPct: plan.minGrossMarginPct ? Number(plan.minGrossMarginPct) : 20,
      providerScope: plan.providerScope || 'all',
    });
    setIsPlanModalOpen(true);
  };

  const handleCategoryChange = (newCat: string) => {
    let pType = 'window';
    let defaultMultiplier = 7.0;
    let defaultCreditAmount = 0;
    let defaultSupplierCost = 0;

    if (newCat === 'claude_max_rolling') {
      pType = 'window';
    } else if (newCat === 'claude_openai_credits') {
      pType = 'credit';
      defaultMultiplier = 7.0;
      defaultCreditAmount = planForm.priceInr * 7;
      defaultSupplierCost = 250;
    } else if (newCat === 'openai_tokens') {
      pType = 'token';
      defaultSupplierCost = 230;
    } else if (newCat === 'claude_tokens') {
      pType = 'token';
      defaultSupplierCost = 250;
    } else if (newCat === 'local_models_tokens') {
      pType = 'token';
      defaultSupplierCost = 220;
    }

    setPlanForm({
      ...planForm,
      planCategory: newCat,
      planType: pType,
      creditMultiplier: defaultMultiplier,
      creditAmountInr: defaultCreditAmount || planForm.creditAmountInr,
      supplierCostInr: defaultSupplierCost || planForm.supplierCostInr,
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const url = selectedPlanForEdit
        ? `/api/admin/plans-catalog/${selectedPlanForEdit.id}`
        : '/api/admin/plans-catalog';
      const method = selectedPlanForEdit ? 'PUT' : 'POST';

      const payload = {
        ...planForm,
        tokenDisplay: planForm.tokenDisplay || (planForm.planType === 'token'
          ? `${(Number(planForm.tokenAllowance) / 1000000).toFixed(0)}M TOKENS (Consumable)`
          : `${(Number(planForm.tokenAllowance) / 1000000).toFixed(0)}M TOKENS / ${planForm.windowHours} HOURS`),
        features: Array.isArray(planForm.features) ? planForm.features : planForm.features.split('\n').filter(Boolean),
      };

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsPlanModalOpen(false);
        await loadData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lightning_plans_updated'));
        }
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lightning_plans_updated'));
        }
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lightning_plans_updated'));
        }
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to delete plan');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting plan');
    }
  };

  // Supplier Rates Handlers
  const handleOpenEditRateModal = (rate: any) => {
    setSelectedRateForEdit(rate);
    setRateForm({
      supplierCostInr: rate.supplierCostInr,
      notes: rate.notes || '',
    });
    setIsRateModalOpen(true);
  };

  const handleSaveSupplierRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRateForEdit) return;
    setSavingRate(true);
    try {
      const res = await adminFetch(`/api/admin/supplier-rates/${selectedRateForEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(rateForm),
      });
      if (res.ok) {
        setIsRateModalOpen(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to update supplier rate');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving rate');
    } finally {
      setSavingRate(false);
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

  // Subscriptions Handlers
  const handleExtendSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForExtend) return;
    setExtending(true);
    try {
      const res = await adminFetch(`/api/admin/subscriptions/${selectedSubForExtend.id}/extend`, {
        method: 'POST',
        body: JSON.stringify({ days: extendDays, reason: extendReason }),
      });
      if (res.ok) {
        setSelectedSubForExtend(null);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to extend subscription');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
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
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to update subscription status');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Category Helper Functions
  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'claude_max_rolling':
        return { label: 'Claude Max (5h Rolling)', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'claude_openai_credits':
        return { label: 'Claude + OpenAI Credits', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'openai_tokens':
        return { label: 'OpenAI Tokens', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'claude_tokens':
        return { label: 'Claude Tokens', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'local_models_tokens':
        return { label: 'Local Models Tokens', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Claude Max (Rolling)', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const filteredPlans = useMemo(() => {
    if (categoryFilter === 'ALL') return plans;
    return plans.filter((p) => p.planCategory === categoryFilter);
  }, [plans, categoryFilter]);

  // Margin calculation in modal
  const computedMargin = useMemo(() => {
    const price = Number(planForm.priceInr) || 0;
    const cost = Number(planForm.supplierCostInr) || 0;
    const margin = price - cost;
    const marginPct = price > 0 ? Number(((margin / price) * 100).toFixed(1)) : 0;
    const isHealthy = marginPct >= (Number(planForm.minGrossMarginPct) || 20);
    return { margin, marginPct, isHealthy };
  }, [planForm.priceInr, planForm.supplierCostInr, planForm.minGrossMarginPct]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            Plans, Offers & Pricing Engine
          </h1>
          <p className="text-xs text-muted font-mono mt-0.5">
            Admin single source of truth: 5 distinct plan categories, wholesale economics, margins, and active quotas
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
        <div className="technical-panel p-4 space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Active Plans</span>
          <div className="text-xl font-bold font-mono text-fg tabular-nums">
            {plans.filter((p) => p.enabled).length} <span className="text-xs text-muted font-normal">/ {plans.length}</span>
          </div>
          <p className="text-[10px] text-muted font-mono">5 Distinct Categories</p>
        </div>

        <div className="technical-panel p-4 space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Wholesale Rates</span>
          <div className="text-xl font-bold font-mono text-fg tabular-nums">
            {supplierRates.length}
          </div>
          <p className="text-[10px] text-muted font-mono">17 Reference Baselines</p>
        </div>

        <div className="technical-panel p-4 space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Live Subscriptions</span>
          <div className="text-xl font-bold font-mono text-accent tabular-nums">
            {overview?.activeSubscriptions || 0}
          </div>
          <p className="text-[10px] text-muted font-mono">Active customer keys</p>
        </div>

        <div className="technical-panel p-4 space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase">Today's Revenue</span>
          <div className="text-xl font-bold font-mono text-fg tabular-nums">
            ₹{(overview?.todayRevenueInr || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-muted font-mono">{overview?.todaySalesCount || 0} orders today</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-6 text-xs font-mono font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'plans'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Zap className="w-4 h-4" />
          FIVE-PLAN CATALOG ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('supplier-rates')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'supplier-rates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          SUPPLIER WHOLESALE RATES ({supplierRates.length})
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'coupons'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Tag className="w-4 h-4" />
          COUPONS & PROMO CODES ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'subscriptions'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Users className="w-4 h-4" />
          CUSTOMER SUBSCRIPTIONS ({subscriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('trials')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'trials'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          FREE TRIAL CLAIMS ({trials.length})
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: FIVE-PLAN CATALOG                                     */}
      {/* ============================================================ */}
      {activeTab === 'plans' && (
        <div className="space-y-5">
          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-subtle/50 rounded-control border border-border">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-fg shadow-xs border border-border'
                  : 'text-muted hover:text-fg'
              }`}
            >
              All Plans ({plans.length})
            </button>
            <button
              onClick={() => setCategoryFilter('claude_max_rolling')}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-all ${
                categoryFilter === 'claude_max_rolling'
                  ? 'bg-purple-100 text-purple-900 shadow-xs border border-purple-300'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Plan 1: Claude Max (5h Rolling) ({plans.filter((p) => p.planCategory === 'claude_max_rolling').length})
            </button>
            <button
              onClick={() => setCategoryFilter('claude_openai_credits')}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-all ${
                categoryFilter === 'claude_openai_credits'
                  ? 'bg-emerald-100 text-emerald-900 shadow-xs border border-emerald-300'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Plan 2: Claude + OpenAI (Credits) ({plans.filter((p) => p.planCategory === 'claude_openai_credits').length})
            </button>
            <button
              onClick={() => setCategoryFilter('openai_tokens')}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-all ${
                categoryFilter === 'openai_tokens'
                  ? 'bg-blue-100 text-blue-900 shadow-xs border border-blue-300'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Plan 3: OpenAI (Tokens) ({plans.filter((p) => p.planCategory === 'openai_tokens').length})
            </button>
            <button
              onClick={() => setCategoryFilter('claude_tokens')}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-all ${
                categoryFilter === 'claude_tokens'
                  ? 'bg-indigo-100 text-indigo-900 shadow-xs border border-indigo-300'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Plan 4: Claude (Tokens) ({plans.filter((p) => p.planCategory === 'claude_tokens').length})
            </button>
            <button
              onClick={() => setCategoryFilter('local_models_tokens')}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-all ${
                categoryFilter === 'local_models_tokens'
                  ? 'bg-amber-100 text-amber-900 shadow-xs border border-amber-300'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Plan 5: Local Models (Tokens) ({plans.filter((p) => p.planCategory === 'local_models_tokens').length})
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredPlans.map((p) => {
              const catBadge = getCategoryBadge(p.planCategory);
              const margin = p.supplierCostInr != null ? p.priceInr - p.supplierCostInr : null;
              const marginPct = p.grossMarginPct != null ? p.grossMarginPct : null;

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-panel bg-card border flex flex-col justify-between space-y-4 shadow-xs transition-all relative ${
                    p.featured
                      ? 'border-2 border-violet-500 shadow-md shadow-violet-500/10'
                      : 'border-border hover:border-violet-300'
                  } ${!p.enabled ? 'opacity-60 bg-subtle/40' : ''}`}
                >
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${catBadge.bg}`}>
                      {catBadge.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {p.badge && (
                        <span className="text-[10px] font-mono font-bold uppercase text-white bg-violet-600 px-2 py-0.5 rounded shadow-xs">
                          {p.badge}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          p.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xl font-extrabold text-fg">{p.name}</h3>
                      <p className="text-xs text-muted font-mono">{p.displayName}</p>
                    </div>

                    <p className="text-xs text-muted min-h-[32px] line-clamp-2">
                      {p.tagline || 'Custom AI compute quota architecture'}
                    </p>

                    {/* Customer Pricing */}
                    <div className="pt-2 border-t border-border flex items-baseline gap-2 font-mono">
                      <span className="text-2xl font-extrabold text-fg">₹{p.priceInr.toLocaleString()}</span>
                      {p.originalPriceInr && (
                        <span className="text-xs text-muted line-through">₹{p.originalPriceInr.toLocaleString()}</span>
                      )}
                      <span className="text-xs text-muted">
                        {p.planType === 'token' ? '(One-time)' : `/ ${p.validityDays}d`}
                      </span>
                    </div>

                    {/* Category-Specific Highlight */}
                    {p.planCategory === 'claude_openai_credits' && (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 space-y-0.5">
                        <div className="font-bold flex items-center justify-between">
                          <span>Pay ₹{p.priceInr.toLocaleString()} → Get ₹{(p.creditAmountInr || (p.priceInr * 7)).toLocaleString()} API Credits</span>
                          <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
                            {p.creditMultiplier || 7.0}x
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700">Strictly INR-denominated balances</p>
                      </div>
                    )}

                    {p.planType === 'token' && (
                      <div className="p-2 rounded bg-blue-50 border border-blue-200 text-xs font-mono text-blue-900 space-y-0.5">
                        <div className="font-bold">
                          {p.tokenDisplay || `${(Number(p.tokenAllowance) / 1000000).toFixed(0)}M Consumable Tokens`}
                        </div>
                        <p className="text-[10px] text-blue-700">Non-expiring high-capacity token pack</p>
                      </div>
                    )}

                    {p.planType === 'window' && (
                      <div className="p-2.5 rounded bg-subtle/70 text-xs font-mono space-y-1 text-muted">
                        <div>Quota: <strong>{p.tokenDisplay || `${Number(p.tokenAllowance) / 1000000}M / ${p.windowHours}h`}</strong></div>
                        <div>Rate Limit: <strong>{p.rateLimitRpm} RPM</strong></div>
                      </div>
                    )}

                    {/* Wholesale Cost & Margin Row */}
                    <div className="p-2.5 rounded bg-amber-50/80 border border-amber-200 text-xs font-mono space-y-1 text-amber-950">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-800 uppercase font-bold">Wholesale Cost:</span>
                        <span className="font-bold">₹{(p.supplierCostInr || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-800 uppercase font-bold">Gross Margin:</span>
                        <span className={`font-bold ${margin != null && margin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ₹{(margin || 0).toLocaleString()} ({marginPct != null ? `${marginPct}%` : 'N/A'})
                        </span>
                      </div>
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
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SUPPLIER COST REFERENCE RATES                         */}
      {/* ============================================================ */}
      {activeTab === 'supplier-rates' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-panel text-xs font-mono text-indigo-950 space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-700" />
              ScaleMax Wholesale Acquisition Reference Rates (17 Authoritative Baselines)
            </h3>
            <p className="text-indigo-800">
              Internal benchmark costs directly quoted by vendor. Customer prices, multipliers, and retail margins are calculated relative to these baseline costs.
            </p>
          </div>

          <div className="overflow-x-auto rounded-panel border border-border shadow-xs bg-card">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-subtle border-b border-border font-bold uppercase tracking-wider text-muted">
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Allocation Tier</th>
                  <th className="p-3.5">Wholesale Cost (₹ INR)</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {supplierRates.map((r) => (
                  <tr key={r.id} className="hover:bg-bg/40">
                    <td className="p-3.5 font-bold uppercase text-fg">
                      <span className="px-2 py-0.5 rounded bg-subtle text-fg">
                        {r.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted uppercase">{r.allocationType}</td>
                    <td className="p-3.5 font-bold text-fg">{r.allocationAmount}</td>
                    <td className="p-3.5 text-accent font-bold text-sm">
                      ₹{Number(r.supplierCostInr).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-muted max-w-xs truncate">{r.notes || 'Vendor baseline quotation'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEditRateModal(r)}
                        className="px-2.5 py-1 rounded text-xs font-bold border border-border bg-bg hover:bg-card text-fg inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Rate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: COUPONS & PROMO CODES                                 */}
      {/* ============================================================ */}
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
                      <td className="p-3.5 font-bold text-fg flex items-center gap-1.5">
                        <span className="font-mono text-sm tracking-wider uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          {c.code}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(c.code);
                            setCopiedCouponCode(c.code);
                            setTimeout(() => setCopiedCouponCode(null), 2000);
                          }}
                          className="text-muted hover:text-fg p-1 rounded"
                          title="Copy Code"
                        >
                          {copiedCouponCode === c.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-fg">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted">
                        Min: ₹{c.minOrderAmountInr}
                        {c.maxDiscountInr && ` / Cap: ₹${c.maxDiscountInr}`}
                      </td>
                      <td className="p-3.5 font-mono">
                        {c.usedCount} / {c.maxUses || '∞'}
                      </td>
                      <td className="p-3.5 text-muted">{c.maxUsesPerUser || 1}</td>
                      <td className="p-3.5 text-muted">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
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
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleCoupon(c.id)}
                          className="text-muted hover:text-fg font-bold"
                          title={c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleOpenEditCouponModal(c)}
                          className="text-muted hover:text-fg font-bold"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="text-rose-600 hover:text-rose-800"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
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

      {/* ============================================================ */}
      {/* TAB 4: CUSTOMER SUBSCRIPTIONS                                */}
      {/* ============================================================ */}
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
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      No active customer subscriptions matching the current filter.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-fg">{s.user?.email || 'Unknown User'}</p>
                        <p className="text-[10px] text-muted">ID: {s.userId}</p>
                      </td>
                      <td className="p-3.5 font-bold text-fg">{s.plan?.name || s.planId}</td>
                      <td className="p-3.5 text-muted font-mono">{s.apiKey?.maskedKey || 'No Key Bound'}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-fg">
                          {(Number(s.apiKey?.tokensUsed || 0) / 1000000).toFixed(2)}M
                        </p>
                        <p className="text-[10px] text-muted">
                          Quota: {(Number(s.apiKey?.tokensRemaining || 0) / 1000000).toFixed(2)}M
                        </p>
                      </td>
                      <td className="p-3.5 text-muted">
                        {s.expiryTime ? new Date(s.expiryTime).toLocaleDateString() : 'No Expiry'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSubForExtend(s);
                            setExtendDays(30);
                          }}
                          className="px-2 py-1 rounded text-xs font-bold border border-border bg-bg hover:bg-card text-fg inline-flex items-center gap-1"
                          title="Extend Days"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Extend</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubForStatus(s);
                            setNewStatus(s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                          }}
                          className="px-2 py-1 rounded text-xs font-bold border border-border bg-bg hover:bg-card text-fg inline-flex items-center gap-1"
                          title="Change Status"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Status</span>
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

      {/* ============================================================ */}
      {/* TAB 5: FREE TRIAL CLAIMS                                     */}
      {/* ============================================================ */}
      {activeTab === 'trials' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-panel border border-border shadow-xs bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-border text-xs font-mono font-bold uppercase tracking-wider text-muted">
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Claimed At</th>
                  <th className="p-3.5">API Key</th>
                  <th className="p-3.5">Tokens Used</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {trials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      No trial claims recorded.
                    </td>
                  </tr>
                ) : (
                  trials.map((t) => (
                    <tr key={t.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="p-3.5 font-bold text-fg">{t.user?.email || t.userId}</td>
                      <td className="p-3.5 text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-muted font-mono">{t.apiKey?.maskedKey || 'Trial Key'}</td>
                      <td className="p-3.5 font-bold text-fg">
                        {(Number(t.apiKey?.tokensUsed || 0) / 1000).toFixed(0)}k
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                          {t.status || 'CLAIMED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PLAN CREATE / EDIT                                    */}
      {/* ============================================================ */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-2xl w-full p-4 sm:p-6 shadow-2xl my-auto flex flex-col max-h-[94vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600" />
                {selectedPlanForEdit ? `Edit Plan: ${selectedPlanForEdit.name}` : 'Create New Subscription Plan'}
              </h2>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-muted hover:text-fg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs font-mono overflow-y-auto flex-1 pr-1 pt-2">
              {/* Plan Category Selector */}
              <div className="p-3 bg-violet-50/70 rounded-xl border border-violet-200 space-y-2">
                <span className="text-[11px] font-bold text-violet-900 uppercase tracking-wider block">
                  ⚡ 1. Primary Plan Category (Exact Architecture)
                </span>
                <select
                  value={planForm.planCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full ui-input text-xs py-2 px-3 bg-white font-bold text-fg"
                >
                  <option value="claude_max_rolling">Plan 1: Claude Max (5-Hour Rolling Window - OpusMax)</option>
                  <option value="claude_openai_credits">Plan 2: Claude + OpenAI (API Credit Plans - ScaleMax INR Credits)</option>
                  <option value="openai_tokens">Plan 3: OpenAI (Token Plans - ScaleMax Consumable Tokens)</option>
                  <option value="claude_tokens">Plan 4: Claude (Token Plans - ScaleMax Consumable Tokens)</option>
                  <option value="local_models_tokens">Plan 5: Local Models (Token Plans - ScaleMax Dedicated Local Tokens)</option>
                </select>
              </div>

              {/* Plan Identifier and Display Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1 font-bold">Plan Identifier (Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CREDIT_STARTER"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1 font-bold">Display Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. API Credits Starter (₹700 Credits)"
                    value={planForm.displayName}
                    onChange={(e) => setPlanForm({ ...planForm, displayName: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              {/* Customer Pricing and Strikethrough */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1 font-bold">Offer Retail Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={planForm.priceInr}
                    onChange={(e) => {
                      const newPrice = Number(e.target.value);
                      const mult = planForm.creditMultiplier || 7.0;
                      setPlanForm({
                        ...planForm,
                        priceInr: newPrice,
                        creditAmountInr: planForm.planCategory === 'claude_openai_credits' ? Math.round(newPrice * mult) : planForm.creditAmountInr,
                      });
                    }}
                    className="w-full ui-input text-xs py-2 px-3 font-bold text-fg"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1">Original Price (₹ Strikethrough)</label>
                  <input
                    type="number"
                    placeholder="e.g. 7499"
                    value={planForm.originalPriceInr}
                    onChange={(e) => setPlanForm({ ...planForm, originalPriceInr: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              {/* Category-Specific Settings */}
              {planForm.planCategory === 'claude_openai_credits' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                      💳 API Credit Multiplier & Margin Configuration
                    </span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      Real-Time Retail & Wholesale
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-emerald-800 mb-1 text-xs font-semibold">Credit Multiplier (e.g. 7.0x)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={planForm.creditMultiplier}
                        onChange={(e) => {
                          const mult = Number(e.target.value);
                          setPlanForm({
                            ...planForm,
                            creditMultiplier: mult,
                            creditAmountInr: Math.round(planForm.priceInr * mult),
                          });
                        }}
                        className="w-full ui-input text-xs py-2 px-3 bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-800 mb-1 text-xs font-semibold">Customer Credit Allocation (₹ INR)</label>
                      <input
                        type="number"
                        value={planForm.creditAmountInr}
                        onChange={(e) => {
                          const credits = Number(e.target.value);
                          const mult = planForm.priceInr > 0 ? +(credits / planForm.priceInr).toFixed(2) : 0;
                          setPlanForm({
                            ...planForm,
                            creditAmountInr: credits,
                            creditMultiplier: mult,
                          });
                        }}
                        className="w-full ui-input text-xs py-2 px-3 bg-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Multiplier Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Preset Multipliers:</span>
                    {[5.0, 6.0, 7.0, 7.5, 8.0, 8.75, 10.0].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setPlanForm({
                            ...planForm,
                            creditMultiplier: m,
                            creditAmountInr: Math.round(planForm.priceInr * m),
                          });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          Math.abs(Number(planForm.creditMultiplier) - m) < 0.05
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        }`}
                      >
                        {m.toFixed(1)}x
                      </button>
                    ))}
                  </div>

                  {/* Economics & Margin Analysis */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                    <div>
                      <label className="block text-emerald-800 text-[11px] font-semibold mb-1">
                        Supplier Wholesale Cost (₹ INR)
                      </label>
                      <input
                        type="number"
                        value={planForm.supplierCostInr || 0}
                        onChange={(e) => setPlanForm({ ...planForm, supplierCostInr: Number(e.target.value) })}
                        className="w-full ui-input text-xs py-1.5 px-3 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-800 text-[11px] font-semibold mb-1">
                        Net Profit Margin (₹ INR / %)
                      </label>
                      <div className="text-xs py-1.5 px-3 bg-emerald-100/90 rounded border border-emerald-200 font-mono font-bold text-emerald-950 flex justify-between items-center">
                        <span>₹{Math.max(0, planForm.priceInr - (planForm.supplierCostInr || 0)).toLocaleString()}</span>
                        <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-bold">
                          {planForm.priceInr > 0 ? Math.round(((planForm.priceInr - (planForm.supplierCostInr || 0)) / planForm.priceInr) * 100) : 0}% Margin
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800 font-bold">
                    → Customer pays ₹{planForm.priceInr.toLocaleString()} and receives ₹{(planForm.creditAmountInr || 0).toLocaleString()} in API Credits ({planForm.creditMultiplier}x multiplier).
                  </p>
                </div>
              )}

              {/* Token Quota / Rolling Settings */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted mb-1 font-bold">Tokens Quota</label>
                  <input
                    type="number"
                    required
                    value={planForm.tokenAllowance}
                    onChange={(e) => setPlanForm({ ...planForm, tokenAllowance: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1 font-bold">Window (Hours)</label>
                  <input
                    type="number"
                    required
                    value={planForm.windowHours}
                    onChange={(e) => setPlanForm({ ...planForm, windowHours: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1 font-bold">Validity (Days)</label>
                  <input
                    type="number"
                    required
                    value={planForm.validityDays}
                    onChange={(e) => setPlanForm({ ...planForm, validityDays: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              {/* Wholesale Supplier Economics & Margin */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  📊 Wholesale Economics & Margin Analysis
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-amber-900 mb-1">Supplier Acquisition Cost (₹ INR)</label>
                    <input
                      type="number"
                      required
                      value={planForm.supplierCostInr}
                      onChange={(e) => setPlanForm({ ...planForm, supplierCostInr: Number(e.target.value) })}
                      className="w-full ui-input text-xs py-2 px-3 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-900 mb-1">Supplier Allocation Tier Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. $25 credit allocation or 10M tokens"
                      value={planForm.supplierAllocation}
                      onChange={(e) => setPlanForm({ ...planForm, supplierAllocation: e.target.value })}
                      className="w-full ui-input text-xs py-2 px-3 bg-white"
                    />
                  </div>
                </div>

                {/* Margin Calculator Badge */}
                <div className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                  computedMargin.isHealthy ? 'bg-emerald-100 border-emerald-300 text-emerald-950' : 'bg-rose-100 border-rose-300 text-rose-950'
                }`}>
                  <div className="font-bold">
                    Gross Margin: ₹{computedMargin.margin.toLocaleString()} ({computedMargin.marginPct}%)
                  </div>
                  <div className="text-[10px] uppercase font-bold">
                    {computedMargin.isHealthy ? '✓ HEALTHY MARGIN' : '⚠ LOW / NEGATIVE MARGIN'}
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3 bg-subtle rounded-xl border border-border space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
                  👁 Live Card Preview
                </span>
                <div className="p-4 rounded-panel bg-white border border-border shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-fg">{planForm.displayName || planForm.name || 'Plan Preview'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                      {planForm.badge || 'OFFER'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-xl font-extrabold text-fg">₹{(planForm.priceInr || 0).toLocaleString()}</span>
                    <span className="text-xs text-muted">
                      {planForm.planType === 'token' ? '(One-time)' : `/ ${planForm.validityDays}d`}
                    </span>
                  </div>
                  {planForm.planCategory === 'claude_openai_credits' && (
                    <div className="text-xs text-emerald-700 font-bold">
                      Pay ₹{planForm.priceInr} → Receive ₹{planForm.creditAmountInr || (planForm.priceInr * 7)} API Credits
                    </div>
                  )}
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

              <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
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

      {/* ============================================================ */}
      {/* MODAL: SUPPLIER RATE EDIT                                    */}
      {/* ============================================================ */}
      {isRateModalOpen && selectedRateForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto text-xs font-mono">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-fg">Edit Supplier Wholesale Rate</h3>
              <button onClick={() => setIsRateModalOpen(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            <form onSubmit={handleSaveSupplierRate} className="space-y-4">
              <div>
                <label className="block text-muted mb-1">Tier / Allocation</label>
                <input
                  type="text"
                  disabled
                  value={selectedRateForEdit.allocationAmount}
                  className="w-full ui-input text-xs py-2 px-3 bg-subtle text-muted"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-bold">Wholesale Cost (₹ INR)</label>
                <input
                  type="number"
                  required
                  value={rateForm.supplierCostInr}
                  onChange={(e) => setRateForm({ ...rateForm, supplierCostInr: Number(e.target.value) })}
                  className="w-full ui-input text-xs py-2 px-3 font-bold text-fg"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={rateForm.notes}
                  onChange={(e) => setRateForm({ ...rateForm, notes: e.target.value })}
                  className="w-full ui-input text-xs py-2 px-3"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="ui-button-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRate}
                  className="ui-button-primary text-xs py-2 px-5 font-bold"
                >
                  {savingRate ? 'Saving...' : 'Update Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: COUPON CREATE / EDIT                                  */}
      {/* ============================================================ */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-lg w-full p-4 sm:p-6 shadow-xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                {selectedCouponForEdit ? `Edit Promo Code: ${selectedCouponForEdit.code}` : 'Create Promo Code'}
              </h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-mono overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-muted mb-1 font-bold">Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH50"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full ui-input text-xs py-2 px-3 font-mono uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full ui-input text-xs py-2 px-3"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_INR">Flat INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full ui-input text-xs py-2 px-3 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
                <button type="button" onClick={() => setIsCouponModalOpen(false)} className="ui-button-secondary text-xs py-2 px-4">
                  CANCEL
                </button>
                <button type="submit" disabled={savingCoupon} className="ui-button-primary text-xs py-2 px-5 font-bold">
                  {savingCoupon ? 'SAVING...' : 'SAVE PROMO CODE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBSCRIPTION EXTEND                                   */}
      {/* ============================================================ */}
      {selectedSubForExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel max-w-sm w-full p-4 sm:p-5 shadow-xl space-y-4 text-xs font-mono">
            <h3 className="font-bold text-fg">Extend Customer Subscription</h3>
            <form onSubmit={handleExtendSub} className="space-y-3">
              <div>
                <label className="block text-muted mb-1">Add Days</label>
                <input
                  type="number"
                  required
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full ui-input text-xs py-2 px-3 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setSelectedSubForExtend(null)} className="ui-button-secondary text-xs py-1.5 px-3">
                  Cancel
                </button>
                <button type="submit" disabled={extending} className="ui-button-primary text-xs py-1.5 px-4 font-bold">
                  {extending ? 'Extending...' : 'Extend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBSCRIPTION STATUS                                   */}
      {/* ============================================================ */}
      {selectedSubForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-panel max-w-sm w-full p-4 sm:p-5 shadow-xl space-y-4 text-xs font-mono">
            <h3 className="font-bold text-fg">Update Subscription Status</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-muted mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full ui-input text-xs py-2 px-3 font-bold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setSelectedSubForStatus(null)} className="ui-button-secondary text-xs py-1.5 px-3">
                  Cancel
                </button>
                <button type="submit" disabled={updatingStatus} className="ui-button-primary text-xs py-1.5 px-4 font-bold">
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
