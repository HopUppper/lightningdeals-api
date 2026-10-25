import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Settings2,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Save,
  RefreshCw,
  Key,
  Lock,
  Unlock,
  ArrowRight,
  Sparkles,
  Server,
  Zap,
  Info,
  Check,
  Eye,
  Sliders,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminPricing: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'wholesale' | 'retail' | 'models' | 'calculator' | 'ledgers'>('overview');
  const [ledgersData, setLedgersData] = useState<any>(null);
  const [ledgersLoading, setLedgersLoading] = useState(false);

  // Economics State from API
  const [providers, setProviders] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    defaultExchangeRate: 86.5,
    defaultRetailMultiplier: 7.0,
    defaultWholesaleMultiplier: 10.0,
    defaultCashCostPerCredit: 0.10,
    blendedRealizedMarginPct: 58.0,
  });

  // Selected Provider for Wholesale Edit
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerForm, setProviderForm] = useState<any>({});
  const [creditKeyInput, setCreditKeyInput] = useState('');
  const [tokenKeyInput, setTokenKeyInput] = useState('');

  // Selected Plan for Retail Edit
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState<any>({});

  // Calculator State
  const [calcDepositInr, setCalcDepositInr] = useState(1000);
  const [calcExchangeRate, setCalcExchangeRate] = useState(86.5);
  const [calcRetailMultiplier, setCalcRetailMultiplier] = useState(7.0);
  const [calcWholesaleMultiplier, setCalcWholesaleMultiplier] = useState(10.0);
  const [calcCostRatio, setCalcCostRatio] = useState(0.60);
  const [calcPaymentFeePct, setCalcPaymentFeePct] = useState(2.5);
  const [calcResult, setCalcResult] = useState<any>(null);

  const fetchEconomics = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/economics');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        setPlans(data.plans || []);
        setModels(data.models || []);
        if (data.summary) {
          setSummary(data.summary);
          setCalcExchangeRate(data.summary.defaultExchangeRate || 86.5);
          setCalcRetailMultiplier(data.summary.defaultRetailMultiplier || 7.0);
          setCalcWholesaleMultiplier(data.summary.defaultWholesaleMultiplier || 10.0);
        }
      }
    } catch (err) {
      console.error('Error fetching economics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedgers = async () => {
    try {
      setLedgersLoading(true);
      const res = await adminFetch('/api/admin/economics/ledgers');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setLedgersData(data);
        }
      }
    } catch (err) {
      console.error('Error fetching ledgers:', err);
    } finally {
      setLedgersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledgers' && !ledgersData) {
      loadLedgers();
    }
  }, [activeTab]);

  const runPreviewCalc = async () => {
    try {
      const res = await adminFetch('/api/admin/economics/preview', {
        method: 'POST',
        body: JSON.stringify({
          depositAmountInr: calcDepositInr,
          exchangeRate: calcExchangeRate,
          retailMultiplier: calcRetailMultiplier,
          wholesaleMultiplier: calcWholesaleMultiplier,
          providerCostRatio: calcCostRatio,
          paymentFeePct: calcPaymentFeePct,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalcResult(data.results);
      }
    } catch (e) {
      console.error('Preview calculator error:', e);
    }
  };

  useEffect(() => {
    fetchEconomics();
  }, []);

  useEffect(() => {
    runPreviewCalc();
  }, [calcDepositInr, calcExchangeRate, calcRetailMultiplier, calcWholesaleMultiplier, calcCostRatio, calcPaymentFeePct]);

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    setSaving(true);
    try {
      const payload: any = { ...providerForm };
      if (creditKeyInput.trim()) payload.creditApiKey = creditKeyInput.trim();
      if (tokenKeyInput.trim()) payload.tokenApiKey = tokenKeyInput.trim();

      const res = await adminFetch(`/api/admin/economics/provider/${selectedProvider.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchEconomics();
        setSelectedProvider(null);
        setCreditKeyInput('');
        setTokenKeyInput('');
      }
    } catch (e) {
      console.error('Error saving provider economics:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/economics/plan/${selectedPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify(planForm),
      });
      if (res.ok) {
        await fetchEconomics();
        setSelectedPlan(null);
      }
    } catch (e) {
      console.error('Error saving plan economics:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModelAvailable = async (model: any) => {
    try {
      const res = await adminFetch(`/api/admin/economics/model/${model.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isCustomerAvailable: !model.isCustomerAvailable }),
      });
      if (res.ok) fetchEconomics();
    } catch (e) {
      console.error('Error toggling model:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-mono text-muted">Loading Authoritative Credit Economics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4 font-bold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-fg flex items-center gap-2">
                Credit Economics & Pricing Hub
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  WHOLESALE → RETAIL
                </span>
              </h1>
              <p className="text-xs text-muted">
                Authoritative multi-provider wholesale margins, customer retail multipliers, and automated gross margin safeguards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEconomics}
            className="px-3 py-1.5 text-xs font-mono font-bold text-muted hover:text-fg border border-border rounded-control hover:bg-bg/60 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-mono uppercase">Wholesale Multiplier</span>
            <Server className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">{summary.defaultWholesaleMultiplier || 10.0}x</div>
          <p className="text-[11px] text-muted">
            $1 USD Cash = <span className="text-violet-600 font-bold">$10 upstream credits</span> (Cash cost: $0.10/credit)
          </p>
        </div>

        <div className="bg-card border border-border rounded-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-mono uppercase">Customer Retail Multiplier</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">{summary.defaultRetailMultiplier || 7.0}x</div>
          <p className="text-[11px] text-muted">
            $1 USD Cash = <span className="text-amber-600 font-bold">$7 retail credits</span> (~0.081 credits / ₹1 INR)
          </p>
        </div>

        <div className="bg-card border border-border rounded-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-mono uppercase">Actual Cash Exchange Rate</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-fg">₹{summary.defaultExchangeRate || 86.5}</div>
          <p className="text-[11px] text-muted">Monetary FX conversion only (independent of credit multipliers)</p>
        </div>

        <div className="bg-card border border-border rounded-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-mono uppercase">Blended Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">+{summary.blendedRealizedMarginPct || 58.0}%</div>
          <p className="text-[11px] text-emerald-600/80 font-medium">Real cash margin on wholesale conversion</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-bold">
        {[
          { id: 'overview', label: 'Executive Overview', icon: Eye },
          { id: 'wholesale', label: '1. Upstream Wholesale', icon: Server },
          { id: 'retail', label: '2. Customer Retail Plans', icon: Zap },
          { id: 'models', label: '3. Model Costs & Prices', icon: Layers },
          { id: 'calculator', label: '4. Margin Calculator', icon: Calculator },
          { id: 'ledgers', label: '5. Financial Ledgers', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-600 font-bold'
                  : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & EXPLANATION */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-panel p-5 space-y-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>How LightningAPI Wholesale-to-Retail Economics Work</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              We purchase usage credits from upstream providers (like ScaleMax) at a discounted wholesale rate and sell usable credits to retail customers at our own commercial rate in Indian Rupees (INR) or USD.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/80 p-3 rounded-lg border border-border">
                <div className="text-[11px] font-mono text-muted uppercase font-bold">1. Wholesale Acquisition</div>
                <div className="text-sm font-bold text-fg mt-1">$1.00 USD Cash = $10.00 Upstream Credits</div>
                <p className="text-[11px] text-muted mt-1">Real cash cost is only <strong>$0.10 per $1 credit</strong>.</p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-border">
                <div className="text-[11px] font-mono text-muted uppercase font-bold">2. Retail Conversion</div>
                <div className="text-sm font-bold text-fg mt-1">Customer Pays ₹86.5 ($1 USD) = Gets $7.00 Credits</div>
                <p className="text-[11px] text-muted mt-1">Retail multiplier yields <strong>7.0x usable credits</strong>.</p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-border">
                <div className="text-[11px] font-mono text-muted uppercase font-bold">3. Real Gross Margin</div>
                <div className="text-sm font-bold text-emerald-600 mt-1">Customer Pays $1.00 → Upstream Costs $0.42</div>
                <p className="text-[11px] text-muted mt-1">Real cash profit is $0.58 (<strong>+58.0% Gross Margin</strong>).</p>
              </div>
            </div>
          </div>

          {/* Quick Status of Providers */}
          <div className="bg-card border border-border rounded-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-500" />
              <span>Provider Billing Surfaces & Verification Status</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => (
                <div key={p.id} className="p-4 rounded-lg border border-border bg-bg/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-fg">{p.name}</h4>
                      <p className="text-[10px] font-mono text-muted">{p.slug || 'default'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      p.status === 'connected' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600'
                    }`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 font-mono text-muted border-t border-border pt-2">
                    <div className="flex justify-between">
                      <span>Credit Plan Surface:</span>
                      <span className={p.creditPlanEnabled ? 'text-emerald-600 font-bold' : 'text-amber-500'}>
                        {p.creditPlanEnabled ? 'ACTIVE (Live API Key Configured)' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Token Pack Surface:</span>
                      <span className={p.tokenPlanEnabled ? 'text-emerald-600 font-bold' : 'text-muted'}>
                        {p.tokenPlanEnabled ? 'ACTIVE' : 'Unconfigured (Credit key isolated)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wholesale Multiplier:</span>
                      <span className="text-fg font-bold">{p.wholesaleMultiplier || 10.0}x ($0.10/credit)</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedProvider(p);
                        setProviderForm({
                          wholesalePurchaseAmount: p.wholesalePurchaseAmount || 100,
                          wholesaleCreditsReceived: p.wholesaleCreditsReceived || 1000,
                          usdToInrExchangeRate: p.usdToInrExchangeRate || 86.5,
                          costPerMillionInput: p.costPerMillionInput || 0,
                          costPerMillionOutput: p.costPerMillionOutput || 0,
                          isEconomicsVerified: p.isEconomicsVerified ?? true,
                          allowCustomerSales: p.allowCustomerSales ?? true,
                        });
                        setActiveTab('wholesale');
                      }}
                      className="text-xs text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1"
                    >
                      <span>Configure Economics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPSTREAM WHOLESALE */}
      {activeTab === 'wholesale' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                  <Server className="w-4 h-4 text-violet-500" />
                  <span>Upstream Provider Wholesale Settings</span>
                </h3>
                <p className="text-xs text-muted">
                  Configure wholesale acquisition cash ratios, token unit costs, and API credentials per upstream vendor.
                </p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-border/60">
              {providers.map((p) => (
                <div key={p.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-fg">{p.name}</h4>
                      <p className="text-[11px] text-muted font-mono">
                        Base URL: {p.apiCreditBaseUrl || p.baseUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProvider(p);
                        setProviderForm({
                          wholesalePurchaseAmount: p.wholesalePurchaseAmount || 100,
                          wholesaleCreditsReceived: p.wholesaleCreditsReceived || 1000,
                          usdToInrExchangeRate: p.usdToInrExchangeRate || 86.5,
                          costPerMillionInput: p.costPerMillionInput || 0,
                          costPerMillionOutput: p.costPerMillionOutput || 0,
                          costPerMillionCached: p.costPerMillionCached || 0,
                          isEconomicsVerified: p.isEconomicsVerified ?? true,
                          allowCustomerSales: p.allowCustomerSales ?? true,
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-500/10 hover:bg-violet-500/20 rounded-control border border-violet-500/20 flex items-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Edit Wholesale Settings</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg/40 p-3 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-muted block text-[10px]">PURCHASE CASH ($)</span>
                      <span className="font-bold text-fg">${p.wholesalePurchaseAmount || 100} USD</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">CREDITS RECEIVED</span>
                      <span className="font-bold text-fg">${p.wholesaleCreditsReceived || 1000}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">WHOLESALE MULTIPLIER</span>
                      <span className="font-bold text-violet-600">{p.wholesaleMultiplier || 10.0}x</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">CASH COST / CREDIT</span>
                      <span className="font-bold text-emerald-600">${p.cashCostPerCredit || 0.10}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Modal / Drawer */}
          {selectedProvider && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-panel max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-base text-fg flex items-center gap-2">
                    <Server className="w-4 h-4 text-violet-500" />
                    <span>Configure {selectedProvider.name} Economics</span>
                  </h3>
                  <button onClick={() => setSelectedProvider(null)} className="text-muted hover:text-fg text-sm">✕</button>
                </div>

                <form onSubmit={handleSaveProvider} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-fg mb-1">Wholesale Cash Spent (USD)</label>
                      <input
                        type="number"
                        step="1"
                        value={providerForm.wholesalePurchaseAmount}
                        onChange={(e) => setProviderForm({ ...providerForm, wholesalePurchaseAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                        placeholder="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-fg mb-1">Usable Credits Received (USD)</label>
                      <input
                        type="number"
                        step="1"
                        value={providerForm.wholesaleCreditsReceived}
                        onChange={(e) => setProviderForm({ ...providerForm, wholesaleCreditsReceived: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                        placeholder="1000"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-violet-500/5 border border-violet-500/20 p-3 rounded-lg space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>Calculated Wholesale Multiplier:</span>
                      <span className="font-bold text-violet-600">
                        {providerForm.wholesalePurchaseAmount > 0
                          ? (providerForm.wholesaleCreditsReceived / providerForm.wholesalePurchaseAmount).toFixed(1)
                          : '0'}x
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Actual Cash Cost Per Credit:</span>
                      <span className="font-bold text-emerald-600">
                        ${providerForm.wholesaleCreditsReceived > 0
                          ? (providerForm.wholesalePurchaseAmount / providerForm.wholesaleCreditsReceived).toFixed(4)
                          : '0.10'} USD
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-fg mb-1">USD / INR Exchange Rate</label>
                      <input
                        type="number"
                        step="0.1"
                        value={providerForm.usdToInrExchangeRate}
                        onChange={(e) => setProviderForm({ ...providerForm, usdToInrExchangeRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                        placeholder="86.5"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="isEconomicsVerified"
                        checked={providerForm.isEconomicsVerified}
                        onChange={(e) => setProviderForm({ ...providerForm, isEconomicsVerified: e.target.checked })}
                        className="rounded border-border text-emerald-600 focus:ring-0"
                      />
                      <label htmlFor="isEconomicsVerified" className="font-bold text-fg">Economics Verified</label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-3">
                    <h4 className="font-bold text-fg flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>API Credentials Management</span>
                    </h4>
                    <div>
                      <label className="block font-bold text-fg mb-1">Credit Plan Master API Key (api.scalemax.pro/v1)</label>
                      <input
                        type="password"
                        value={creditKeyInput}
                        onChange={(e) => setCreditKeyInput(e.target.value)}
                        placeholder="Leave blank to preserve existing active key"
                        className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono text-[11px]"
                      />
                      <p className="text-[10px] text-muted mt-0.5">Key provided for credit-based plans and chat completions.</p>
                    </div>

                    <div>
                      <label className="block font-bold text-fg mb-1">Token Pack API Key (Optional)</label>
                      <input
                        type="password"
                        value={tokenKeyInput}
                        onChange={(e) => setTokenKeyInput(e.target.value)}
                        placeholder="Leave blank if unconfigured (Token plans remain isolated)"
                        className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono text-[11px]"
                      />
                      <p className="text-[10px] text-muted mt-0.5">ScaleMax token pack surface (/token/v1) requires a dedicated token key.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider(null)}
                      className="px-4 py-2 text-xs font-bold text-muted hover:text-fg border border-border rounded-control"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-control flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Wholesale Economics'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER RETAIL PLANS */}
      {activeTab === 'retail' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-panel p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Customer Retail Plans & Multipliers</span>
              </h3>
              <p className="text-xs text-muted">
                Admin-controlled retail plans with automatic gross profit safeguards and margin thresholds.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                    <th className="py-2.5 px-3">Plan Name</th>
                    <th className="py-2.5 px-3">Price (INR)</th>
                    <th className="py-2.5 px-3">Revenue (USD)</th>
                    <th className="py-2.5 px-3">Multiplier</th>
                    <th className="py-2.5 px-3">Credits Issued</th>
                    <th className="py-2.5 px-3">Est. Wholesale Cost</th>
                    <th className="py-2.5 px-3">Gross Margin</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {plans.map((p) => (
                    <tr key={p.id} className="hover:bg-bg/40 font-mono">
                      <td className="py-3 px-3 font-sans font-bold text-fg">
                        {p.displayName || p.name}
                        <span className="block text-[10px] font-mono text-muted">{p.planType}</span>
                      </td>
                      <td className="py-3 px-3 text-fg font-bold">₹{p.priceInr.toLocaleString()}</td>
                      <td className="py-3 px-3 text-muted">${p.revenueUsd.toFixed(2)}</td>
                      <td className="py-3 px-3 text-amber-600 font-bold">{p.retailMultiplier}x</td>
                      <td className="py-3 px-3 text-fg font-bold">${p.creditsIssued.toFixed(2)}</td>
                      <td className="py-3 px-3 text-muted">${p.estimatedCashCostUsd.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.estimatedGrossMarginPct >= (p.minGrossMarginPct || 15)
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          +{p.estimatedGrossMarginPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted/10 text-muted'
                        }`}>
                          {p.enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => {
                            setSelectedPlan(p);
                            setPlanForm({
                              priceInr: p.priceInr,
                              retailMultiplier: p.retailMultiplier,
                              bonusCreditsUsd: p.bonusCreditsUsd || 0,
                              minGrossMarginPct: p.minGrossMarginPct || 15.0,
                              minContributionMarginPct: p.minContributionMarginPct || 10.0,
                              enabled: p.enabled,
                            });
                          }}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Plan Modal */}
          {selectedPlan && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-base text-fg">Edit Plan: {selectedPlan.displayName}</h3>
                  <button onClick={() => setSelectedPlan(null)} className="text-muted hover:text-fg text-sm">✕</button>
                </div>

                <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-fg mb-1">Price (INR)</label>
                    <input
                      type="number"
                      value={planForm.priceInr}
                      onChange={(e) => setPlanForm({ ...planForm, priceInr: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-fg mb-1">Retail Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={planForm.retailMultiplier}
                        onChange={(e) => setPlanForm({ ...planForm, retailMultiplier: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-fg mb-1">Bonus Credits (USD)</label>
                      <input
                        type="number"
                        step="1"
                        value={planForm.bonusCreditsUsd}
                        onChange={(e) => setPlanForm({ ...planForm, bonusCreditsUsd: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-fg mb-1">Min Gross Margin Safeguard (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={planForm.minGrossMarginPct}
                      onChange={(e) => setPlanForm({ ...planForm, minGrossMarginPct: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      className="px-4 py-2 text-xs font-bold text-muted hover:text-fg border border-border rounded-control"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-control flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Plan'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MODEL COSTS & PRICES */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-panel p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-500" />
                <span>Model Rates & Upstream Wholesale Costs</span>
              </h3>
              <p className="text-xs text-muted">
                Model pricing per 1M tokens, provider wholesale cash costs, and realized margins.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Retail Price / 1M</th>
                    <th className="py-2.5 px-3">Nominal Cost / 1M</th>
                    <th className="py-2.5 px-3">Actual Wholesale Cash Cost</th>
                    <th className="py-2.5 px-3">Gross Margin</th>
                    <th className="py-2.5 px-3 text-right">Customer Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border/60">
                  {models.map((m) => (
                    <tr key={m.id} className="hover:bg-bg/40 font-mono">
                      <td className="py-3 px-3 font-sans font-bold text-fg">
                        {m.displayName}
                        <span className="block text-[10px] font-mono text-muted">{m.modelId}</span>
                      </td>
                      <td className="py-3 px-3 font-sans text-muted">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bg border border-border">
                          {m.providerSlug || 'opus_max'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-fg font-bold">
                        ${m.inputPrice.toFixed(2)} in / ${m.outputPrice.toFixed(2)} out
                      </td>
                      <td className="py-3 px-3 text-muted">
                        ${m.providerCostInput.toFixed(2)} / ${m.providerCostOutput.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">
                        ${m.actualCashCostInput.toFixed(3)} in / ${m.actualCashCostOutput.toFixed(3)} out
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          m.grossMarginPct >= 15
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          +{m.grossMarginPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleModelAvailable(m)}
                          className={`px-2.5 py-1 rounded text-[10px] font-sans font-bold ${
                            m.isCustomerAvailable
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-muted/10 text-muted border border-border'
                          }`}
                        >
                          {m.isCustomerAvailable ? 'AVAILABLE' : 'RESTRICTED'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MARGIN CALCULATOR & SCENARIO ENGINE */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Controls */}
            <div className="bg-card border border-border rounded-panel p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-500" />
                  <span>Interactive Margin Scenario Simulator</span>
                </h3>
                <p className="text-xs text-muted">
                  Simulate retail deposits, wholesale acquisition multipliers, and real cash profit outcomes.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Customer Deposit (INR):</span>
                    <span className="font-mono text-emerald-600">₹{calcDepositInr.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={calcDepositInr}
                    onChange={(e) => setCalcDepositInr(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted font-mono">
                    <span>₹100</span>
                    <span>₹5,000</span>
                    <span>₹10,000</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-fg mb-1">Exchange Rate (₹/$)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcExchangeRate}
                      onChange={(e) => setCalcExchangeRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-fg mb-1">Retail Multiplier ($/$)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcRetailMultiplier}
                      onChange={(e) => setCalcRetailMultiplier(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-fg mb-1">Wholesale Multiplier ($/$)</label>
                    <input
                      type="number"
                      step="1"
                      value={calcWholesaleMultiplier}
                      onChange={(e) => setCalcWholesaleMultiplier(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-fg mb-1">Vendor Nominal Cost Ratio</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={calcCostRatio}
                      onChange={(e) => setCalcCostRatio(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-bg border border-border rounded-control font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Breakdown */}
            <div className="bg-card border border-border rounded-panel p-5 space-y-4">
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Financial Outcome & Margin Analysis</span>
              </h3>

              {calcResult ? (
                <div className="space-y-3 text-xs font-mono">
                  <div className="bg-bg/40 p-3 rounded-lg space-y-2 border border-border">
                    <div className="flex justify-between">
                      <span className="text-muted">Customer Payment:</span>
                      <span className="font-bold text-fg">₹{calcDepositInr.toLocaleString()} (≈ ${calcResult.revenueUsd} USD)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Retail Credits Issued:</span>
                      <span className="font-bold text-amber-600">${calcResult.totalCreditsIssued} Credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Nominal Vendor Credits Used:</span>
                      <span className="font-bold text-muted">${calcResult.upstreamNominalCreditsConsumed} Credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Actual Wholesale Cash Cost:</span>
                      <span className="font-bold text-fg">${calcResult.upstreamActualCashCostUsd} USD (₹{calcResult.upstreamActualCashCostInr.toFixed(0)})</span>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-fg">Real Gross Profit:</span>
                      <span className="font-bold text-emerald-600 font-mono text-base">
                        +${calcResult.grossProfitUsd} USD (₹{calcResult.grossProfitInr.toFixed(0)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted font-sans">Gross Profit Margin:</span>
                      <span className="font-bold text-emerald-600 font-mono text-base">+{calcResult.grossMarginPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted font-sans">Contribution Margin (after 2.5% fee):</span>
                      <span className="font-bold text-emerald-600 font-mono">+{calcResult.contributionMarginPct}%</span>
                    </div>
                  </div>

                  {calcResult.isSafe ? (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20 font-sans text-xs">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span><strong>SAFE MARGIN:</strong> Realized margin exceeds the minimum required threshold (+15%).</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 bg-red-500/10 p-2.5 rounded border border-red-500/20 font-sans text-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span><strong>WARNING:</strong> Margin is below the safe threshold of 15%!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted">Calculating scenario outcome...</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* TAB 5: FINANCIAL & USAGE LEDGERS */}
      {activeTab === 'ledgers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Separate Financial & Usage Credit Ledgers</span>
              </h3>
              <p className="text-xs text-muted">
                Audit-ready independent ledgers for customer usage credits, upstream vendor charges, and realized margins.
              </p>
            </div>
            <button
              onClick={loadLedgers}
              disabled={ledgersLoading}
              className="px-3 py-1.5 bg-bg border border-border hover:bg-card text-xs font-semibold rounded-control transition-colors"
            >
              {ledgersLoading ? 'Refreshing...' : 'Refresh Ledgers'}
            </button>
          </div>

          {/* Section A: Customer Usage Credit Ledger */}
          <div className="bg-card border border-border rounded-panel overflow-hidden">
            <div className="p-4 border-b border-border bg-bg/50">
              <h4 className="text-sm font-bold text-fg">Customer Usage Credit Ledger</h4>
              <p className="text-xs text-muted">Independent customer usage credits granted, bonuses, and usage deductions.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bg border-b border-border text-muted">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Balance (Before ➔ After)</th>
                    <th className="py-2.5 px-3">Model / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ledgersData?.customerLedgers?.length > 0 ? (
                    ledgersData.customerLedgers.map((l: any) => (
                      <tr key={l.id} className="hover:bg-bg/40">
                        <td className="py-2 px-3 text-muted">{new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.type === 'CREDITS_GRANTED'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : l.type === 'PROMOTIONAL_BONUS'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}>
                            {l.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-fg">{l.user?.email || l.userId?.substring(0, 8)}</td>
                        <td className={`py-2 px-3 font-bold ${l.amount >= 0 ? 'text-emerald-600' : 'text-fg'}`}>
                          {l.amount >= 0 ? `+${l.amount.toFixed(2)}` : `-${Math.abs(l.amount).toFixed(4)}`}
                        </td>
                        <td className="py-2 px-3 text-muted">
                          ${l.balanceBefore.toFixed(2)} ➔ <strong className="text-fg">${l.balanceAfter.toFixed(2)}</strong>
                        </td>
                        <td className="py-2 px-3 text-muted">{l.model || l.reference || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted">No customer usage credit entries recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Upstream Vendor Credit Ledger */}
          <div className="bg-card border border-border rounded-panel overflow-hidden">
            <div className="p-4 border-b border-border bg-bg/50">
              <h4 className="text-sm font-bold text-fg">Upstream Provider Credit Ledger</h4>
              <p className="text-xs text-muted">Wholesale credits received, payments, and actual provider usage charges.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bg border-b border-border text-muted">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Cost / Credits</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Model / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ledgersData?.vendorLedgers?.length > 0 ? (
                    ledgersData.vendorLedgers.map((v: any) => (
                      <tr key={v.id} className="hover:bg-bg/40">
                        <td className="py-2 px-3 text-muted">{new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td className="py-2 px-3 font-semibold text-fg">{v.provider?.name || 'Upstream'}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-600">
                            {v.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-fg">${Number(v.creditAmount || v.cashAmount || 0).toFixed(4)}</td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] text-muted">{v.isEstimated ? 'ESTIMATED' : 'CONFIRMED'}</span>
                        </td>
                        <td className="py-2 px-3 text-muted">{v.model || v.reference || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted">No provider usage entries recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
