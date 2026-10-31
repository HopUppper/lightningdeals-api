import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Zap,
  Sliders,
  Check,
  Edit2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Layers,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Power,
  Save,
  HelpCircle,
  X,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminPricing: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [supplierRates, setSupplierRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Quick Edit Modal State
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [quickForm, setQuickForm] = useState({
    priceInr: 100,
    creditMultiplier: 7.0,
    creditAmountUsd: 7.00,
    creditAmountInr: 700,
    supplierCostInr: 50,
    tokenAllowance: 10000000,
    tokenDisplay: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Interactive Live Simulator State
  const [simPrice, setSimPrice] = useState<number>(250);
  const [simMultiplier, setSimMultiplier] = useState<number>(6.0);
  const [simSupplierCost, setSimSupplierCost] = useState<number>(150);
  const [simWholesalePool, setSimWholesalePool] = useState<number>(25); // $25 upstream pool

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, ratesRes] = await Promise.all([
        adminFetch('/api/admin/plans-catalog').catch(() => null),
        adminFetch('/api/admin/supplier-rates').catch(() => null),
      ]);

      if (plansRes && plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }
      if (ratesRes && ratesRes.ok) {
        const rData = await ratesRes.json();
        setSupplierRates(rData.rates || []);
      }
    } catch (err) {
      console.error('Failed to load admin pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Simulator calculations
  const simCustomerCreditsUsd = Math.round((simPrice / 100) * simMultiplier * 100) / 100;
  const simCustomerCredits = Math.round(simPrice * simMultiplier);
  const simNetProfit = simPrice - simSupplierCost;
  const simMarginPct = simPrice > 0 ? Math.round((simNetProfit / simPrice) * 100) : 0;
  const simIsHealthy = simMarginPct >= 20;

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (selectedCategory === 'ALL') return plans;
    return plans.filter((p) => p.planCategory === selectedCategory);
  }, [plans, selectedCategory]);

  // Overall statistics
  const stats = useMemo(() => {
    const active = plans.filter((p) => p.enabled);
    const withCost = active.filter((p) => p.supplierCostInr != null && p.supplierCostInr > 0);
    const avgMargin =
      withCost.length > 0
        ? Math.round(
            withCost.reduce((sum, p) => {
              const margin = p.priceInr - p.supplierCostInr;
              return sum + (margin / p.priceInr) * 100;
            }, 0) / withCost.length
          )
        : 0;

    const creditPlans = active.filter((p) => p.planCategory === 'claude_openai_credits');
    const multipliers = creditPlans.map((p) => Number(p.creditMultiplier) || 7.0);
    const minMult = multipliers.length > 0 ? Math.min(...multipliers) : 7.0;
    const maxMult = multipliers.length > 0 ? Math.max(...multipliers) : 8.75;

    return {
      totalPlans: plans.length,
      activePlans: active.length,
      avgMargin,
      multiplierRange: `${minMult}x – ${maxMult}x`,
    };
  }, [plans]);

  // Open quick edit modal
  const handleOpenQuickEdit = (plan: any) => {
    setEditingPlan(plan);
    const price = Number(plan.priceInr) || 0;
    const mult = Number(plan.creditMultiplier) || 7.0;
    const creditsUsd = plan.creditAmountUsd != null
      ? Number(plan.creditAmountUsd)
      : plan.creditAmountInr != null && plan.creditAmountInr > 100
      ? Number((Number(plan.creditAmountInr) / 100).toFixed(2))
      : +((price * mult) / 100).toFixed(2);
    const cost = plan.supplierCostInr != null ? Number(plan.supplierCostInr) : 0;

    setQuickForm({
      priceInr: price,
      creditMultiplier: mult,
      creditAmountUsd: creditsUsd,
      creditAmountInr: Math.round(creditsUsd * 100),
      supplierCostInr: cost,
      tokenAllowance: Number(plan.tokenAllowance) || 10000000,
      tokenDisplay: plan.tokenDisplay || '',
    });
    setIsQuickEditOpen(true);
  };

  // Save quick edit
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);

    try {
      const payload = {
        ...editingPlan,
        priceInr: quickForm.priceInr,
        creditMultiplier: quickForm.creditMultiplier,
        creditAmountUsd: quickForm.creditAmountUsd,
        creditAmountInr: quickForm.creditAmountInr,
        supplierCostInr: quickForm.supplierCostInr,
        tokenAllowance: quickForm.tokenAllowance,
        tokenDisplay: quickForm.tokenDisplay || (editingPlan.planType === 'credit'
          ? `${Number(quickForm.creditAmountUsd).toFixed(2)} API CREDITS`
          : editingPlan.planType === 'token'
          ? `${(Number(quickForm.tokenAllowance) / 1000000).toFixed(0)}M TOKENS (Consumable)`
          : editingPlan.tokenDisplay),
      };

      const res = await adminFetch(`/api/admin/plans-catalog/${editingPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsQuickEditOpen(false);
        setSaveSuccessNotice(`Successfully updated ${editingPlan.name}! Changes applied live to the website.`);
        setTimeout(() => setSaveSuccessNotice(null), 4000);
        await loadData();

        // Broadcast real-time update event across frontend
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lightning_plans_updated'));
        }
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to update plan');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating plan');
    } finally {
      setSaving(false);
    }
  };

  // Toggle plan active status
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

  // Quick edit modal margin calculation
  const modalMargin = quickForm.priceInr - quickForm.supplierCostInr;
  const modalMarginPct = quickForm.priceInr > 0 ? Math.round((modalMargin / quickForm.priceInr) * 100) : 0;

  const categoryNames: Record<string, string> = {
    claude_max_rolling: 'Plan 1: Claude Max (5h Rolling)',
    claude_openai_credits: 'Plan 2: Claude + OpenAI (Credits)',
    openai_tokens: 'Plan 3: OpenAI (Tokens)',
    claude_tokens: 'Plan 4: Claude (Tokens)',
    local_models_tokens: 'Plan 5: Local Models (Tokens)',
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
            <DollarSign className="w-3 h-3 text-amber-700" />
            <span>Real-Time Profit Margin &amp; Multiplier Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight mt-1">
            Pricing, Multipliers &amp; Profit Margins
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Configure retail prices, credit multiplier purchasing value, wholesale acquisition costs, and profit margins. Changes update the live website and checkout in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 rounded-control bg-card border border-border text-fg hover:bg-subtle flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="px-3 py-1.5 rounded-control bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync Active</span>
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessNotice && (
        <div className="p-4 rounded-panel bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button onClick={() => setSaveSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-panel bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase font-bold">Active Plans</span>
          <div className="text-2xl font-extrabold text-fg">{stats.activePlans} / {stats.totalPlans}</div>
          <p className="text-[10px] text-muted font-mono">Across all 5 distinct categories</p>
        </div>

        <div className="p-4 rounded-panel bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase font-bold">Avg. Gross Profit Margin</span>
          <div className="text-2xl font-extrabold text-emerald-600">{stats.avgMargin}%</div>
          <p className="text-[10px] text-emerald-700 font-mono">Calculated from retail vs wholesale</p>
        </div>

        <div className="p-4 rounded-panel bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase font-bold">Credit Multipliers</span>
          <div className="text-2xl font-extrabold text-violet-600">{stats.multiplierRange}</div>
          <p className="text-[10px] text-violet-700 font-mono">Purchasing value delivered to users</p>
        </div>

        <div className="p-4 rounded-panel bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase font-bold">Upstream Provider</span>
          <div className="text-2xl font-extrabold text-fg">ScaleMax + OpusMax</div>
          <p className="text-[10px] text-muted font-mono">Isolated wholesale billing pools</p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INTERACTIVE REAL-TIME PROFIT MARGIN & MULTIPLIER SIMULATOR           */}
      {/* ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-panel bg-gradient-to-br from-amber-50/80 via-white to-purple-50/50 border border-amber-200 shadow-warm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span>Interactive Real-Time Economics Simulator</span>
            </div>
            <h2 className="text-lg font-bold text-fg mt-0.5">
              Wholesale vs. Retail Multiplier &amp; Profit Margin Model
            </h2>
            <p className="text-xs text-muted">
              Model how supplier wholesale cost ($2.50 for $25 credits) translates into retail customer pricing (e.g. ₹250 for ₹1,500 credits at 6x), capturing the difference as net profit margin.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold self-start sm:self-auto">
            Live Math Engine
          </span>
        </div>

        {/* Simulator Controls & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-fg mb-1">
                  Customer Retail Price (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono">₹</span>
                  <input
                    type="number"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Math.max(10, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2 rounded-control border border-border bg-white font-mono font-bold text-fg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-muted font-mono mt-0.5">Approx ${(simPrice / 100).toFixed(2)} USD</p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-fg mb-1">
                  Supplier Wholesale Cost (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono">₹</span>
                  <input
                    type="number"
                    value={simSupplierCost}
                    onChange={(e) => setSimSupplierCost(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2 rounded-control border border-border bg-white font-mono font-bold text-fg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-muted font-mono mt-0.5">ScaleMax vendor quota cost</p>
              </div>
            </div>

            {/* Credit Multiplier Slider */}
            <div className="space-y-2 bg-white/80 p-3.5 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-fg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Customer Credit Multiplier:</span>
                </label>
                <span className="text-base font-extrabold text-violet-700 font-mono bg-violet-100 px-2.5 py-0.5 rounded border border-violet-200">
                  {simMultiplier.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min="2.0"
                max="12.0"
                step="0.5"
                value={simMultiplier}
                onChange={(e) => setSimMultiplier(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                <span>2.0x (High Margin)</span>
                <span>6.0x (Balanced)</span>
                <span>7.5x (Aggressive)</span>
                <span>12.0x (Wholesale Limit)</span>
              </div>
            </div>

            {/* Preset Multipliers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-muted uppercase font-bold mr-1">Quick Presets:</span>
              {[4.0, 5.0, 6.0, 7.0, 7.5, 8.0, 10.0].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSimMultiplier(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                    simMultiplier === m
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-fg border-border hover:bg-subtle'
                  }`}
                >
                  {m.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>

          {/* Results Output Column */}
          <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted block border-b border-border pb-1">
              Live Projected Economics
            </span>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted">Customer Retail Payment:</span>
                <span className="font-extrabold text-fg text-sm">₹{simPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-violet-700 bg-violet-50 p-2 rounded border border-violet-200">
                <span className="font-bold">Customer Credits Received:</span>
                <span className="font-extrabold text-sm font-mono">${simCustomerCreditsUsd.toFixed(2)} USD Credits ({simMultiplier}x value)</span>
              </div>

              <div className="flex justify-between items-center text-muted">
                <span>ScaleMax Wholesale Cost:</span>
                <span className="font-bold text-fg">₹{simSupplierCost.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center text-sm">
                <span className="font-bold text-fg">Net Profit Margin:</span>
                <span className={`font-extrabold ${simNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{simNetProfit.toLocaleString()} ({simMarginPct}%)
                </span>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                simIsHealthy
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                  : 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {simIsHealthy ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{simIsHealthy ? 'Healthy Profit Margin' : 'Warning: Low or Negative Margin'}</span>
              </div>
              <span>{simMarginPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* LIVE PLAN MATRIX ACROSS ALL 5 CATEGORIES                             */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-fg">Live Plan Catalog &amp; Active Multipliers</h2>
            <p className="text-xs text-muted">
              Click &quot;Quick Adjust&quot; on any plan to change retail price, multiplier, or wholesale cost with immediate live publishing.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-control text-xs font-mono overflow-x-auto">
            {['ALL', 'claude_openai_credits', 'claude_max_rolling', 'openai_tokens', 'claude_tokens', 'local_models_tokens'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-fg text-bg shadow-xs'
                    : 'text-muted hover:text-fg'
                }`}
              >
                {cat === 'ALL'
                  ? 'All Plans'
                  : cat === 'claude_openai_credits'
                  ? 'Credits'
                  : cat === 'claude_max_rolling'
                  ? 'Claude 5h'
                  : cat === 'openai_tokens'
                  ? 'OpenAI Tokens'
                  : cat === 'claude_tokens'
                  ? 'Claude Tokens'
                  : 'Local Tokens'}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Table */}
        <div className="border border-border rounded-panel bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-subtle border-b border-border text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Plan &amp; Category</th>
                  <th className="py-3 px-4 font-bold">Retail Price</th>
                  <th className="py-3 px-4 font-bold">Multiplier / Customer Value</th>
                  <th className="py-3 px-4 font-bold">Wholesale Cost</th>
                  <th className="py-3 px-4 font-bold">Gross Margin</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPlans.map((plan) => {
                  const margin = plan.supplierCostInr != null ? plan.priceInr - plan.supplierCostInr : null;
                  const marginPct = margin != null && plan.priceInr > 0 ? Math.round((margin / plan.priceInr) * 100) : null;
                  const isCreditPlan = plan.planCategory === 'claude_openai_credits';

                  return (
                    <tr key={plan.id} className="hover:bg-subtle/50 transition-colors">
                      {/* Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-fg text-sm">{plan.name}</div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-subtle text-muted border border-border/80 inline-block mt-0.5">
                          {categoryNames[plan.planCategory] || plan.planCategory}
                        </span>
                      </td>

                      {/* Retail Price */}
                      <td className="py-3.5 px-4 font-extrabold text-fg text-sm">
                        ₹{plan.priceInr.toLocaleString()}
                      </td>

                      {/* Multiplier / Value */}
                      <td className="py-3.5 px-4">
                        {isCreditPlan ? (
                          <div className="space-y-0.5">
                            <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                              {plan.creditMultiplier || 7.0}x Multiplier
                            </span>
                            <p className="text-[10px] text-emerald-600 font-mono font-bold mt-1">
                              ${(plan.creditAmountUsd || ((plan.priceInr * (plan.creditMultiplier || 7.0)) / 100)).toFixed(2)} USD Credits
                            </p>
                          </div>
                        ) : plan.planType === 'token' ? (
                          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {plan.tokenDisplay || `${Number(plan.tokenAllowance) / 1000000}M Tokens`}
                          </span>
                        ) : (
                          <span className="text-stone-700 font-bold bg-subtle px-2 py-0.5 rounded border border-border">
                            {plan.tokenDisplay || `${Number(plan.tokenAllowance) / 1000000}M / 5h`}
                          </span>
                        )}
                      </td>

                      {/* Wholesale Cost */}
                      <td className="py-3.5 px-4 text-muted">
                        ₹{(plan.supplierCostInr || 0).toLocaleString()}
                      </td>

                      {/* Gross Margin */}
                      <td className="py-3.5 px-4">
                        {margin != null ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              margin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            ₹{margin.toLocaleString()} ({marginPct}%)
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            plan.enabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {plan.enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenQuickEdit(plan)}
                            className="px-2.5 py-1 rounded bg-fg text-bg hover:bg-fg/90 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Quick edit price and multiplier"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Quick Adjust</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePlan(plan.id)}
                            className="p-1 rounded text-muted hover:text-fg hover:bg-subtle transition-colors cursor-pointer"
                            title={plan.enabled ? 'Disable plan' : 'Enable plan'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SCALEMAX WHOLESALE BENCHMARK REFERENCE TABLE                        */}
      {/* ===================================================================== */}
      <div className="p-5 rounded-panel bg-card border border-border space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-fg">
              ScaleMax Vendor Wholesale Reference Benchmarks (17 Official Rates)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-muted">Supplier Baseline Economics</span>
        </div>
        <p className="text-xs text-muted">
          These rates represent the exact baseline costs quoted by ScaleMax for API credits and token packages. Retail margins and credit multipliers operate relative to these wholesale baselines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-lg bg-subtle/70 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase">Credit Pack Starter</span>
            <div className="text-sm font-bold text-fg">$25 Credits → ₹250 Cost</div>
            <p className="text-[10px] text-muted">Wholesale 10.0x baseline</p>
          </div>

          <div className="p-3 rounded-lg bg-subtle/70 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase">Credit Pack Growth</span>
            <div className="text-sm font-bold text-fg">$105 Credits → ₹1,000 Cost</div>
            <p className="text-[10px] text-muted">Wholesale 10.5x baseline</p>
          </div>

          <div className="p-3 rounded-lg bg-subtle/70 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase">Credit Pack Power</span>
            <div className="text-sm font-bold text-fg">$535 Credits → ₹5,000 Cost</div>
            <p className="text-[10px] text-muted">Wholesale 10.7x baseline</p>
          </div>

          <div className="p-3 rounded-lg bg-subtle/70 border border-border space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase">Credit Pack Scale</span>
            <div className="text-sm font-bold text-fg">$1,100 Credits → ₹10,000 Cost</div>
            <p className="text-[10px] text-muted">Wholesale 11.0x baseline</p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* QUICK EDIT MODAL (REAL-TIME LIVE UPDATE)                              */}
      {/* ===================================================================== */}
      {isQuickEditOpen && editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                  Quick Live Adjuster
                </span>
                <h3 className="text-base font-bold text-fg">{editingPlan.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="text-muted hover:text-fg p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-4">
              {/* Retail Price */}
              <div>
                <label className="block text-xs font-mono font-bold text-fg mb-1">
                  Customer Retail Price (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  value={quickForm.priceInr}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    const mult = quickForm.creditMultiplier;
                    const newUsd = +((newPrice * mult) / 100).toFixed(2);
                    setQuickForm({
                      ...quickForm,
                      priceInr: newPrice,
                      creditAmountUsd: newUsd,
                      creditAmountInr: Math.round(newUsd * 100),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-control border border-border bg-bg font-mono font-bold text-fg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              {/* Credit Multiplier Section (For credit plans) */}
              {editingPlan.planCategory === 'claude_openai_credits' && (
                <div className="p-3.5 bg-violet-50/70 border border-violet-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-violet-900">
                      Credit Purchasing Multiplier
                    </label>
                    <span className="font-mono font-extrabold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                      {quickForm.creditMultiplier}x
                    </span>
                  </div>

                  <input
                    type="range"
                    min="3.0"
                    max="12.0"
                    step="0.5"
                    value={quickForm.creditMultiplier}
                    onChange={(e) => {
                      const mult = Number(e.target.value);
                      const newUsd = +((quickForm.priceInr * mult) / 100).toFixed(2);
                      setQuickForm({
                        ...quickForm,
                        creditMultiplier: mult,
                        creditAmountUsd: newUsd,
                        creditAmountInr: Math.round(newUsd * 100),
                      });
                    }}
                    className="w-full accent-violet-600 cursor-pointer"
                  />

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5.0, 6.0, 7.0, 7.5, 8.0, 8.75, 10.0].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          const newUsd = +((quickForm.priceInr * m) / 100).toFixed(2);
                          setQuickForm({
                            ...quickForm,
                            creditMultiplier: m,
                            creditAmountUsd: newUsd,
                            creditAmountInr: Math.round(newUsd * 100),
                          });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          quickForm.creditMultiplier === m
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-fg border-border hover:bg-subtle'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>

                  {/* Customer Credit Allocation in Dollars */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-violet-900 mb-1">
                      Credits Customer Receives ($ USD Credits)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-mono font-bold text-fg text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={quickForm.creditAmountUsd}
                        onChange={(e) => {
                          const creditsUsd = Number(e.target.value);
                          const mult = quickForm.priceInr > 0 ? +((creditsUsd / (quickForm.priceInr / 100))).toFixed(2) : 7.0;
                          setQuickForm({
                            ...quickForm,
                            creditAmountUsd: creditsUsd,
                            creditAmountInr: Math.round(creditsUsd * 100),
                            creditMultiplier: mult,
                          });
                        }}
                        className="w-full pl-7 pr-3 py-1.5 rounded-control border border-border bg-white font-mono font-bold text-fg text-xs focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-violet-900 font-bold">
                    → User pays ₹{quickForm.priceInr.toLocaleString()} and receives ${Number(quickForm.creditAmountUsd || 0).toFixed(2)} USD in API Credits ({quickForm.creditMultiplier}x value).
                  </p>
                </div>
              )}

              {/* Wholesale Cost */}
              <div>
                <label className="block text-xs font-mono font-bold text-fg mb-1">
                  Supplier Wholesale Acquisition Cost (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  value={quickForm.supplierCostInr}
                  onChange={(e) => setQuickForm({ ...quickForm, supplierCostInr: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-control border border-border bg-bg font-mono font-bold text-fg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              {/* Live Margin Output */}
              <div
                className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                  modalMarginPct >= 20
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                    : 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                }`}
              >
                <span>Projected Gross Margin:</span>
                <span>₹{modalMargin.toLocaleString()} ({modalMarginPct}%)</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-3 py-2 rounded-control border border-border text-xs font-mono font-bold text-fg hover:bg-subtle cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Publishing Live...' : 'Apply & Publish Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPricing;
