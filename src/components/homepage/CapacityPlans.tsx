import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Check,
  ArrowRight,
  Clock,
  Shield,
  Sparkles,
  ShoppingBag,
  HelpCircle,
  Zap,
  Cpu,
  Layers,
  Terminal,
  Code2,
  Copy,
  Info,
  DollarSign,
  Coins
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { usePlans, PlanItem } from '../../context/PlansContext';
import { CheckoutModal } from '../CheckoutModal';

export type ModelFamily = 'claude' | 'openai' | 'local';
export type BillingMode = 'window' | 'credit' | 'token';

export const CapacityPlans: React.FC = () => {
  const { user } = useAuth();
  const { addToCart, openCart } = useCart();
  const { plans, loading } = usePlans();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Two-stage segregation state
  const [selectedFamily, setSelectedFamily] = useState<ModelFamily>('claude');
  const [selectedBillingMode, setSelectedBillingMode] = useState<BillingMode>('window');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanItem | null>(null);

  // Active guide tab
  const [guideTab, setGuideTab] = useState<'comparison' | 'endpoints' | 'quickstart' | 'models'>('comparison');
  const [codeTab, setCodeTab] = useState<'curl' | 'python' | 'claude_cli' | 'cursor'>('claude_cli');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Map selected model family and billing mode directly to the 5 distinct plan categories
  const targetCategory = useMemo(() => {
    if (selectedFamily === 'claude') {
      if (selectedBillingMode === 'window') return 'claude_max_rolling';
      if (selectedBillingMode === 'credit') return 'claude_openai_credits';
      if (selectedBillingMode === 'token') return 'claude_tokens';
    } else if (selectedFamily === 'openai') {
      if (selectedBillingMode === 'credit') return 'claude_openai_credits';
      if (selectedBillingMode === 'token') return 'openai_tokens';
    } else if (selectedFamily === 'local') {
      if (selectedBillingMode === 'token') return 'local_models_tokens';
      if (selectedBillingMode === 'credit') return 'claude_openai_credits';
    }
    return 'claude_max_rolling';
  }, [selectedFamily, selectedBillingMode]);

  const activePlans = useMemo(() => {
    return plans.filter((p) => {
      if (p.enabled === false) return false;
      const name = (p.name || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();
      if (name.includes('trial') || slug.includes('trial')) return false;

      if (p.planCategory) {
        return p.planCategory === targetCategory;
      }
      if (targetCategory === 'claude_max_rolling') return (p.planType === 'window' || !p.planType) && p.priceInr >= 1000;
      if (targetCategory === 'claude_openai_credits') return p.planType === 'credit';
      if (targetCategory === 'openai_tokens') return p.planType === 'token' && (name.includes('openai') || slug.includes('openai'));
      if (targetCategory === 'claude_tokens') return p.planType === 'token' && (name.includes('claude') || slug.includes('claude'));
      if (targetCategory === 'local_models_tokens') return p.planType === 'token' && (name.includes('local') || slug.includes('local'));
      return false;
    }).sort((a, b) => a.priceInr - b.priceInr);
  }, [plans, targetCategory]);

  const handleSelectPlan = (pkg: PlanItem) => {
    const isYearly = billingPeriod === 'yearly' && selectedBillingMode === 'window';
    const activePrice = isYearly ? (pkg.annualPriceInr || pkg.priceInr) : pkg.priceInr;
    const activeValidity = isYearly ? (pkg.annualValidityDays || 365) : pkg.validityDays;

    if (user) {
      setSelectedPlanForCheckout({
        ...pkg,
        priceInr: activePrice,
        validityDays: activeValidity,
        planType: pkg.planType || selectedBillingMode,
        creditMultiplier: pkg.creditMultiplier,
        creditAmountUsd: pkg.creditAmountUsd,
      });
    } else {
      navigate(`/register?plan=${pkg.id}&billing=${billingPeriod}`);
    }
  };

  const handleAddToCart = (pkg: PlanItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isYearly = billingPeriod === 'yearly' && selectedBillingMode === 'window';
    const activePrice = isYearly ? (pkg.annualPriceInr || pkg.priceInr) : pkg.priceInr;
    const activeOriginalPrice = isYearly ? pkg.annualOriginalPriceInr : pkg.originalPriceInr;
    const activeValidity = isYearly ? (pkg.annualValidityDays || 365) : pkg.validityDays;

    addToCart({
      id: pkg.id,
      planId: pkg.id,
      name: pkg.name,
      priceInr: activePrice,
      originalPriceInr: activeOriginalPrice,
      tokenDisplay: pkg.tokenDisplay || `${(Number(pkg.tokenAllowance || 0) / 1_000_000).toFixed(0)}M Tokens`,
      windowHours: pkg.windowHours,
      validityDays: activeValidity,
      tagline: pkg.tagline,
      badge: pkg.badge,
      billingPeriod: isYearly ? 'yearly' : 'monthly',
      planType: pkg.planType || selectedBillingMode,
      planCategory: pkg.planCategory || (pkg as any).category || selectedBillingMode,
      creditMultiplier: pkg.creditMultiplier,
      creditAmountUsd: pkg.creditAmountUsd,
    });
    openCart();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <section
      id="capacity-plans"
      className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="space-y-4 max-w-3xl text-left">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
              CAPACITY & ARCHITECTURE
            </span>
          </div>

          <h2 className="section-headline text-[#191719] font-display">
            Select your model ecosystem & billing mode.
          </h2>

          <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
            First choose your target AI models, then pick the billing architecture that fits your workload.
            From continuous 5-hour rolling pools to 7x credit multipliers and non-expiring token packs.
          </p>
        </div>

        {/* ============================================================ */}
        {/* STAGE 1: MODEL ECOSYSTEM SELECTOR                            */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[#68636B] font-semibold flex items-center gap-2">
            <span>STEP 1: SELECT MODEL ECOSYSTEM</span>
            <span className="h-px flex-1 bg-[#E6E1E8]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Claude Ecosystem */}
            <button
              type="button"
              onClick={() => setSelectedFamily('claude')}
              className={`p-5 rounded-[18px] text-left transition-all border cursor-pointer flex flex-col justify-between space-y-4 ${
                selectedFamily === 'claude'
                  ? 'bg-white border-[#7136E8] shadow-md ring-2 ring-[#7136E8]/20'
                  : 'bg-white/60 border-[#E6E1E8] hover:bg-white hover:border-[#7136E8]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${selectedFamily === 'claude' ? 'bg-[#EEE6FF] text-[#7136E8]' : 'bg-[#F8F6F2] text-[#68636B]'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#191719] font-display">Claude (Anthropic)</h3>
                    <p className="text-[11px] text-[#68636B]">Sonnet 5.5, Opus 5.5, Haiku 5.5, and many more...</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EEE6FF] text-[#7136E8]">
                  ALL 3 MODES
                </span>
              </div>
              <p className="text-xs text-[#68636B] leading-relaxed">
                Flagship coding architecture. Exclusive home of continuous 5-hour rolling pool refills + usage credits + token packs.
              </p>
            </button>

            {/* OpenAI Ecosystem */}
            <button
              type="button"
              onClick={() => {
                setSelectedFamily('openai');
                if (selectedBillingMode === 'window') setSelectedBillingMode('credit');
              }}
              className={`p-5 rounded-[18px] text-left transition-all border cursor-pointer flex flex-col justify-between space-y-4 ${
                selectedFamily === 'openai'
                  ? 'bg-white border-[#7136E8] shadow-md ring-2 ring-[#7136E8]/20'
                  : 'bg-white/60 border-[#E6E1E8] hover:bg-white hover:border-[#7136E8]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${selectedFamily === 'openai' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F8F6F2] text-[#68636B]'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#191719] font-display">OpenAI Frontier</h3>
                    <p className="text-[11px] text-[#68636B]">o1, o3-mini, GPT-4o, and many more...</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  CREDITS & TOKENS
                </span>
              </div>
              <p className="text-xs text-[#68636B] leading-relaxed">
                Direct drop-in OpenAI-compatible inference with full reasoning token support and tool-calling parity.
              </p>
            </button>

            {/* Local Models Ecosystem */}
            <button
              type="button"
              onClick={() => {
                setSelectedFamily('local');
                if (selectedBillingMode === 'window') setSelectedBillingMode('credit');
              }}
              className={`p-5 rounded-[18px] text-left transition-all border cursor-pointer flex flex-col justify-between space-y-4 ${
                selectedFamily === 'local'
                  ? 'bg-white border-[#7136E8] shadow-md ring-2 ring-[#7136E8]/20'
                  : 'bg-white/60 border-[#E6E1E8] hover:bg-white hover:border-[#7136E8]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${selectedFamily === 'local' ? 'bg-amber-50 text-amber-700' : 'bg-[#F8F6F2] text-[#68636B]'}`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#191719] font-display">Local & Open Weights</h3>
                    <p className="text-[11px] text-[#68636B]">DeepSeek V3, Gemini 2.5, Grok 3, and many more...</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  7X MULTIPLIER
                </span>
              </div>
              <p className="text-xs text-[#68636B] leading-relaxed">
                Ultra-high-throughput open models at wholesale economic rates. Maximum performance for large batch loops.
              </p>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STAGE 2: BILLING ARCHITECTURE SELECTOR                       */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-[#68636B] font-semibold flex items-center gap-2">
            <span>STEP 2: SELECT BILLING ARCHITECTURE</span>
            <span className="h-px flex-1 bg-[#E6E1E8]" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
            {/* Mode Tabs */}
            <div className="inline-flex flex-wrap items-center p-1 rounded-2xl bg-white border border-[#E6E1E8] shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedBillingMode('window');
                  setSelectedFamily('claude'); // Rolling window is Claude exclusive
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedBillingMode === 'window'
                    ? 'bg-[#191719] text-white shadow-xs'
                    : 'text-[#68636B] hover:text-[#191719]'
                }`}
              >
                <Clock className="w-4 h-4 text-[#7136E8]" />
                <span>5-Hour Rolling Window</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300">
                  Claude Only
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBillingMode('credit')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedBillingMode === 'credit'
                    ? 'bg-[#7136E8] text-white shadow-xs'
                    : 'text-[#68636B] hover:text-[#191719]'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Usage Credits</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                  7x Value Multiplier
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBillingMode('token')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedBillingMode === 'token'
                    ? 'bg-[#191719] text-white shadow-xs'
                    : 'text-[#68636B] hover:text-[#191719]'
                }`}
              >
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Prepaid Token Packs</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/20">
                  No 5h Reset
                </span>
              </button>
            </div>

            {/* Monthly / Annual Cycle Toggle (Active for Window Plans) */}
            {selectedBillingMode === 'window' && (
              <div className="inline-flex items-center p-1 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    billingPeriod === 'monthly'
                      ? 'bg-[#191719] text-white shadow-xs'
                      : 'text-[#68636B] hover:text-[#191719]'
                  }`}
                >
                  Monthly Cycle
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingPeriod === 'yearly'
                      ? 'bg-[#7136E8] text-white shadow-xs'
                      : 'text-[#68636B] hover:text-[#191719]'
                  }`}
                >
                  <span>Annual (Save ~20%)</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/20">
                    365d
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ARCHITECTURE EXPLAINER BANNER (Clear Guidance)                */}
        {/* ============================================================ */}
        {selectedBillingMode === 'window' && (
          <div className="p-5 sm:p-6 rounded-[18px] bg-white border border-[#E6E1E8] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#EEE6FF] text-[#7136E8] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#191719] font-display flex items-center gap-2">
                  <span>How the 5-Hour Continuous Rolling Pool Works</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 text-[#7136E8] font-bold">
                    Claude Exclusive
                  </span>
                </div>
                <p className="text-xs text-[#68636B] leading-relaxed max-w-3xl">
                  Your token allowance continuously refills over a 5-hour rolling window. Used tokens automatically
                  regenerate as past requests age out. No waiting for month-end resets. Native drop-in Anthropic protocol
                  replacement for Cursor, Windsurf, and Claude Code CLI. All plans include full access to every Claude model (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5) — tiers differ only in 5-hour rolling token capacity.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGuideTab('comparison')}
              className="text-xs font-semibold text-[#7136E8] hover:text-[#4F21B5] whitespace-nowrap inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Compare with Credits & Tokens</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {selectedBillingMode === 'credit' && (
          <div className="p-5 sm:p-6 rounded-[18px] bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-white/10 text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold font-display flex items-center gap-2">
                  <span>{selectedFamily === 'claude' ? 'Claude API Credits' : selectedFamily === 'openai' ? 'OpenAI API Credits' : 'Local Models API Credits'} — 7x Purchasing Power Multiplier</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-neutral-950 font-bold">
                    7X VALUE
                  </span>
                </div>
                <p className="text-xs text-violet-200 leading-relaxed max-w-3xl">
                  Deposit funds in INR and receive up to <strong>7x–8.75x</strong> value in USD API Credits (e.g. Pay ₹100 → Receive $7.00 USD in Credits).
                  Tokens are atomically deducted per request at published model rates in USD. Valid for <strong>365 full days</strong>.
                  {selectedFamily === 'claude' && ' Dedicated access for all Claude models (Opus 5.5, Sonnet 5.5, Haiku 5.5, and many more...).'}{selectedFamily === 'openai' && ' Dedicated access for all OpenAI models (o1, o3-mini, GPT-4o, and many more...).'}{selectedFamily === 'local' && ' Dedicated access for all Local & Open-Weight models (DeepSeek V3, Gemini 2.5, Grok 3, and many more...).'}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-amber-300 shrink-0 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              Pay ₹100 → Get $7.00 Credits
            </div>
          </div>
        )}

        {selectedBillingMode === 'token' && (
          <div className="p-5 sm:p-6 rounded-[18px] bg-white border border-[#E6E1E8] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#191719] font-display flex items-center gap-2">
                  <span>{selectedFamily === 'claude' ? 'Claude Prepaid Tokens' : selectedFamily === 'openai' ? 'OpenAI Prepaid Tokens' : 'Local Models Prepaid Tokens'} — No 5-Hour Rolling Resets</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    CONSUMABLE QUOTA
                  </span>
                </div>
                <p className="text-xs text-[#68636B] leading-relaxed max-w-3xl">
                  A guaranteed allowance of 5M to 50M tokens that does <strong>NOT</strong> reset every 5 hours. Spend as fast
                  or as slow as needed over 365 days. Perfect for heavy batch jobs, multi-agent evaluation pipelines, and project bursts.{selectedFamily === 'claude' && ' Dedicated consumable tokens for Claude models (Opus 5.5, Sonnet 5.5, Haiku 5.5, and many more...).'}{selectedFamily === 'openai' && ' Dedicated consumable tokens for OpenAI models (o1, o3-mini, GPT-4o, and many more...).'}{selectedFamily === 'local' && ' Dedicated consumable tokens for Local models (DeepSeek V3, Gemini 2.5, Grok 3, and many more...).'}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start md:self-center">
              1-Year Fixed Expiration
            </span>
          </div>
        )}

        {/* ============================================================ */}
        {/* NON-CLAUDE ROLLING WINDOW GUARD NOTICE                       */}
        {/* ============================================================ */}
        {selectedFamily !== 'claude' && selectedBillingMode === 'window' && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">
                The 5-Hour Rolling Window plan is exclusively engineered for Claude models. For {selectedFamily === 'openai' ? 'OpenAI' : 'Local'} models, please choose <strong>Usage Credits</strong> or <strong>Token Packs</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBillingMode('credit')}
                className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold shadow-xs hover:bg-amber-800 transition-colors"
              >
                View Usage Credits
              </button>
              <button
                type="button"
                onClick={() => setSelectedFamily('claude')}
                className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100 transition-colors"
              >
                Switch to Claude
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PLAN CARDS GRID (Properly Segregated)                        */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {activePlans.map((plan) => {
            const isYearly = billingPeriod === 'yearly' && selectedBillingMode === 'window';
            const price = isYearly ? (plan.annualPriceInr || plan.priceInr) : plan.priceInr;
            const validity = isYearly ? (plan.annualValidityDays || 365) : (plan.validityDays || 30);
            const allowanceNum = Number(plan.tokenAllowance || 0);
            const allowanceMillions = (allowanceNum / 1_000_000).toFixed(0);

            return (
              <div
                key={plan.id}
                className={`p-6 sm:p-7 rounded-[20px] bg-white border shadow-2xs flex flex-col justify-between space-y-6 transition-all hover:shadow-md ${
                  plan.featured
                    ? 'border-[#7136E8] ring-2 ring-[#7136E8]/20'
                    : 'border-[#E6E1E8] hover:border-[#7136E8]/40'
                }`}
              >
                {/* Header & Pricing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                      {plan.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F6F2] text-[#68636B] border border-[#E6E1E8]">
                      {validity} Days Term
                    </span>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#191719] font-display">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-mono text-[#68636B]">
                        {selectedBillingMode === 'window' ? (isYearly ? '/yr' : '/mo') : ' deposit'}
                      </span>
                      {plan.originalPriceInr && (
                        <span className="text-xs text-[#68636B] line-through font-mono ml-auto">
                          ₹{plan.originalPriceInr.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#68636B] leading-relaxed line-clamp-2">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Allowance & Architecture Badge */}
                  <div className="p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] font-mono text-center space-y-1">
                    {selectedBillingMode === 'window' && (
                      <>
                        <div className="text-lg font-bold text-[#191719] font-display">
                          {allowanceMillions}M TOKENS
                        </div>
                        <div className="text-[10px] text-[#7136E8] uppercase font-bold tracking-wider">
                          PER 5-HOUR WINDOW
                        </div>
                      </>
                    )}

                    {selectedBillingMode === 'credit' && (
                      <>
                        <div className="text-lg font-bold text-[#191719] font-display">
                          ${Number(plan.creditAmountUsd || ((plan.priceInr * (plan.creditMultiplier || 7.0)) / 100)).toFixed(2)} CREDITS
                        </div>
                        <div className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">
                          {plan.creditMultiplier || 7.0}x PURCHASING MULTIPLIER
                        </div>
                      </>
                    )}

                    {selectedBillingMode === 'token' && (
                      <>
                        <div className="text-lg font-bold text-[#191719] font-display">
                          {allowanceMillions}M TOKENS
                        </div>
                        <div className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">
                          CONSUMABLE (NO 5H RESET)
                        </div>
                      </>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-2 border-t border-[#E6E1E8]/70 text-xs text-[#191719]">
                    {selectedBillingMode === 'window' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span className="font-semibold text-[#7136E8]">All Latest Claude Models Included</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>Continuous 5-Hour Refill</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>Drop-In Anthropic Protocol</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>Cursor & Claude Code CLI Ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>Sub-50ms Gateway Routing</span>
                        </div>
                      </>
                    )}

                    {selectedBillingMode === 'credit' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span><strong>{plan.creditMultiplier || 7.0}x Value Multiplier</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span className="font-semibold text-[#7136E8]">{selectedFamily === 'claude' ? 'Dedicated Claude Models Access' : selectedFamily === 'openai' ? 'Dedicated OpenAI Models Access' : 'Dedicated Local Models Access'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>Atomic Token-by-Token Deduction</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>365-Day Validity (No 5h Reset)</span>
                        </div>
                      </>
                    )}

                    {selectedBillingMode === 'token' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>Guaranteed Prepaid Allowance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>No 5-Hour Reset Windows</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span className="font-semibold text-emerald-700">{selectedFamily === 'claude' ? 'Claude Native Messages API' : selectedFamily === 'openai' ? 'OpenAI Chat Completions API' : 'Local Models / OpenAI API'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                          <span>Full 365-Day Token Validity</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-[#E6E1E8]">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full py-2.5 rounded-[12px] bg-[#191719] hover:bg-[#7136E8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Select {selectedBillingMode === 'credit' ? 'Credits' : 'Plan'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(plan, e)}
                    className="w-full py-2 rounded-[12px] bg-white hover:bg-[#F8F6F2] text-[#191719] border border-[#E6E1E8] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#68636B]" />
                    <span>Add to Cart</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* EDUCATIONAL DOCUMENTATION & GUIDANCE (How It Works)          */}
        {/* ============================================================ */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E6E1E8] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E1E8] pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#7136E8] font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>INTEGRATION & ARCHITECTURE GUIDE</span>
              </div>
              <h3 className="text-xl font-bold text-[#191719] font-display">
                How LightningAPI Works — Guidance & Reference
              </h3>
            </div>

            {/* Guide Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F8F6F2] rounded-xl border border-[#E6E1E8] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGuideTab('comparison')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  guideTab === 'comparison' ? 'bg-[#191719] text-white shadow-2xs' : 'text-[#68636B] hover:text-[#191719]'
                }`}
              >
                Plan Comparison
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('endpoints')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  guideTab === 'endpoints' ? 'bg-[#191719] text-white shadow-2xs' : 'text-[#68636B] hover:text-[#191719]'
                }`}
              >
                Endpoints
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('quickstart')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  guideTab === 'quickstart' ? 'bg-[#191719] text-white shadow-2xs' : 'text-[#68636B] hover:text-[#191719]'
                }`}
              >
                Quick Start
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('models')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  guideTab === 'models' ? 'bg-[#191719] text-white shadow-2xs' : 'text-[#68636B] hover:text-[#191719]'
                }`}
              >
                Model Catalog
              </button>
            </div>
          </div>

          {/* Guide Content: Comparison */}
          {guideTab === 'comparison' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E1E8] text-[11px] font-mono uppercase text-[#68636B]">
                    <th className="py-3 px-4 font-bold">Feature</th>
                    <th className="py-3 px-4 font-bold text-[#7136E8]">5-Hour Rolling Window</th>
                    <th className="py-3 px-4 font-bold text-amber-600">Usage Credits (7x Multiplier)</th>
                    <th className="py-3 px-4 font-bold text-emerald-700">Prepaid Token Packs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1E8]/70 text-[#191719]">
                  <tr>
                    <td className="py-3 px-4 font-bold">Best For</td>
                    <td className="py-3 px-4">Daily developers in Cursor & Claude Code</td>
                    <td className="py-3 px-4">Pay-as-you-go flexibility across all models</td>
                    <td className="py-3 px-4">Heavy batch jobs & autonomous background agents</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold">Replenishment</td>
                    <td className="py-3 px-4">Continuous automatic refill every 5 hours</td>
                    <td className="py-3 px-4">Atomic per-token deduction against credit pool</td>
                    <td className="py-3 px-4">Consumable quota that never resets early</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold">Model Support</td>
                    <td className="py-3 px-4">Claude Opus, Sonnet, Haiku</td>
                    <td className="py-3 px-4">Claude + OpenAI + Local Models (Universal)</td>
                    <td className="py-3 px-4">Claude + OpenAI + Local Models</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold">Validity</td>
                    <td className="py-3 px-4">30 Days (Monthly) or 365 Days (Annual)</td>
                    <td className="py-3 px-4">365 Days (Full 1-Year Active Balance)</td>
                    <td className="py-3 px-4">365 Days (Full 1-Year Expiration)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold">Base URL</td>
                    <td className="py-3 px-4 font-mono text-[#7136E8]">https://api.lightningapi.pro</td>
                    <td className="py-3 px-4 font-mono text-amber-600">https://api.lightningapi.pro/v1</td>
                    <td className="py-3 px-4 font-mono text-emerald-700">https://api.lightningapi.pro/token/v1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Guide Content: Endpoints */}
          {guideTab === 'endpoints' && (
            <div className="space-y-4">
              <p className="text-xs text-[#68636B] leading-relaxed">
                Connect any SDK or client by configuring your base URL and your LightningAPI key (<code className="font-mono text-[#7136E8]">sk_live_...</code>):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#7136E8] block">Claude Native SDKs</span>
                  <div className="p-2 rounded bg-white border border-[#E6E1E8] font-bold text-[#191719] break-all">
                    https://api.lightningapi.pro
                  </div>
                  <p className="text-[11px] text-[#68636B] font-sans">
                    Drop-in origin for Anthropic client SDK, Claude Code CLI, and 5-hour rolling pool traffic.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-600 block">OpenAI & Credit Route</span>
                  <div className="p-2 rounded bg-white border border-[#E6E1E8] font-bold text-[#191719] break-all">
                    https://api.lightningapi.pro/v1
                  </div>
                  <p className="text-[11px] text-[#68636B] font-sans">
                    Universal OpenAI-compatible chat completions (<code className="font-mono">/v1/chat/completions</code>) for Credits.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Token Packs Route</span>
                  <div className="p-2 rounded bg-white border border-[#E6E1E8] font-bold text-[#191719] break-all">
                    https://api.lightningapi.pro/token/v1
                  </div>
                  <p className="text-[11px] text-[#68636B] font-sans">
                    Dedicated endpoint for consuming prepaid token pack allowances (<code className="font-mono">/token/v1/chat/completions</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guide Content: Quick Start */}
          {guideTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E6E1E8] pb-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCodeTab('claude_cli')}
                  className={`px-3 py-1 rounded-md transition-colors ${codeTab === 'claude_cli' ? 'bg-[#7136E8] text-white' : 'text-[#68636B] hover:text-[#191719]'}`}
                >
                  Claude Code CLI
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('cursor')}
                  className={`px-3 py-1 rounded-md transition-colors ${codeTab === 'cursor' ? 'bg-[#7136E8] text-white' : 'text-[#68636B] hover:text-[#191719]'}`}
                >
                  Cursor / Windsurf
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('python')}
                  className={`px-3 py-1 rounded-md transition-colors ${codeTab === 'python' ? 'bg-[#7136E8] text-white' : 'text-[#68636B] hover:text-[#191719]'}`}
                >
                  Python SDK
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('curl')}
                  className={`px-3 py-1 rounded-md transition-colors ${codeTab === 'curl' ? 'bg-[#7136E8] text-white' : 'text-[#68636B] hover:text-[#191719]'}`}
                >
                  cURL
                </button>
              </div>

              <div className="relative p-4 rounded-xl bg-[#191719] text-white font-mono text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    const text =
                      codeTab === 'claude_cli'
                        ? 'export ANTHROPIC_BASE_URL="https://api.lightningapi.pro"\nexport ANTHROPIC_API_KEY="sk_live_your_lightning_key"\nclaude'
                        : codeTab === 'cursor'
                        ? 'Base URL: https://api.lightningapi.pro\nAPI Key: sk_live_your_lightning_key\nOverride Model: claude-sonnet-5.5'
                        : codeTab === 'python'
                        ? 'from openai import OpenAI\n\nclient = OpenAI(\n    base_url="https://api.lightningapi.pro/v1",\n    api_key="sk_live_your_lightning_key"\n)\n\nresponse = client.chat.completions.create(\n    model="claude-sonnet-5.5",\n    messages=[{"role": "user", "content": "Hello!"}]\n)'
                        : 'curl "https://api.lightningapi.pro/v1/chat/completions" \\\n  -H "Authorization: Bearer sk_live_your_lightning_key" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"model": "claude-sonnet-5.5", "messages": [{"role": "user", "content": "Hi"}]}\'';
                    copyToClipboard(text);
                  }}
                  className="absolute top-3 right-3 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSnippet ? 'Copied!' : 'Copy'}</span>
                </button>

                {codeTab === 'claude_cli' && (
                  <pre className="text-violet-300">
{`# 1. Point Anthropic base URL to LightningAPI
export ANTHROPIC_BASE_URL="https://api.lightningapi.pro"

# 2. Set your LightningAPI key
export ANTHROPIC_API_KEY="sk_live_your_lightning_key"

# 3. Launch Claude Code CLI
claude`}
                  </pre>
                )}

                {codeTab === 'cursor' && (
                  <pre className="text-emerald-300">
{`# Cursor & Windsurf Custom API Key Settings:
1. Open Cursor Settings -> Models
2. Under "Anthropic API Key":
   - Base URL: https://api.lightningapi.pro
   - API Key: sk_live_your_lightning_key
3. Add model: claude-sonnet-5.5 or claude-opus-5.5`}
                  </pre>
                )}

                {codeTab === 'python' && (
                  <pre className="text-amber-300">
{`from openai import OpenAI

client = OpenAI(
    base_url="https://api.lightningapi.pro/v1",
    api_key="sk_live_your_lightning_key"
)

response = client.chat.completions.create(
    model="claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Optimize this SQL query..."}]
)
print(response.choices[0].message.content)`}
                  </pre>
                )}

                {codeTab === 'curl' && (
                  <pre className="text-neutral-200">
{`curl "https://api.lightningapi.pro/v1/chat/completions" \\
  -H "Authorization: Bearer sk_live_your_lightning_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'`}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Guide Content: Models */}
          {guideTab === 'models' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                <span className="font-bold text-[#7136E8] block">Claude Models</span>
                <ul className="space-y-1 text-[#68636B]">
                  <li>• Claude Sonnet 5.5 (1M context)</li>
                  <li>• Claude Opus 5.5 & Opus 5</li>
                  <li>• Claude Haiku 5.5 & Fable 5</li>
                  <li>• And many more...</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                <span className="font-bold text-emerald-700 block">OpenAI Models</span>
                <ul className="space-y-1 text-[#68636B]">
                  <li>• OpenAI o1 & o1-mini</li>
                  <li>• OpenAI o3-mini (Reasoning)</li>
                  <li>• GPT-4o & GPT-4o mini</li>
                  <li>• And many more...</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                <span className="font-bold text-amber-700 block">Local & Open Weights</span>
                <ul className="space-y-1 text-[#68636B]">
                  <li>• DeepSeek v3.2 & v4-flash</li>
                  <li>• Gemini 3.8-flash & 3.5-lite</li>
                  <li>• Grok 4.5 & 4.6 (xAI)</li>
                  <li>• Qwen 3.7/3.8, GLM 5.3, MiniMax</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Free Developer Trial Callout */}
        <div className="p-6 rounded-[20px] bg-white border border-[#E6E1E8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold text-[#7136E8] uppercase tracking-wider">
              FREE DEVELOPER TRIAL
            </span>
            <div className="text-base font-bold text-[#191719] font-display">
              Want to verify performance before selecting a plan?
            </div>
            <p className="text-xs text-[#68636B]">
              Claim an instant 200,000 token test key with zero credit card required.
            </p>
          </div>

          <Link
            to="/trial"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#7136E8] hover:bg-[#4F21B5] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-center"
          >
            <span>Claim Free 200k Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Render Checkout Modal if a plan is actively selected */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          onClose={() => setSelectedPlanForCheckout(null)}
          plan={{
            ...selectedPlanForCheckout,
            billingPeriod: billingPeriod === 'yearly' && selectedBillingMode === 'window' ? 'yearly' : 'monthly',
          }}
        />
      )}
    </section>
  );
};
