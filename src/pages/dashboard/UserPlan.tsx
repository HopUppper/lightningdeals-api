import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, CheckCircle2, Clock, Activity, Gift, CreditCard, RefreshCw, AlertCircle, ShoppingBag, Sparkles, Copy, Check, Cpu, Coins, DollarSign, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { userFetch } from '../../utils/api';
import { CheckoutModal } from '../../components/CheckoutModal';
import { ApiKeyRevealModal } from '../../components/ApiKeyRevealModal';

export const UserPlan: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [data, setData] = useState<any>(null);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
  const [revealedKeyData, setRevealedKeyData] = useState<{
    key: string;
    planName: string;
    quotaDisplay: string;
    windowHours: number;
  } | null>(null);

  // Time remaining states for live countdown
  const [resetCountdown, setResetCountdown] = useState<string>('');
  const [expiryCountdown, setExpiryCountdown] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<'claude' | 'openai' | 'local'>('claude');
  const [selectedBillingMode, setSelectedBillingMode] = useState<'window' | 'credit' | 'token'>('window');

  const fetchSubscriptions = async () => {
    try {
      const [subRes, trialRes, plansRes] = await Promise.all([
        userFetch('/api/user/subscriptions'),
        userFetch('/api/user/trial/status').catch(() => null),
        fetch(`/api/checkout/plans?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }).catch(() => null),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setData(subData);
      }

      if (trialRes && trialRes.ok) {
        const tData = await trialRes.json();
        setTrialStatus(tData);
      }

      if (plansRes && plansRes.ok) {
        const pData = await plansRes.json();
        if (pData.plans && Array.isArray(pData.plans)) {
          setAvailablePlans(pData.plans);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleClaimTrial = async () => {
    setClaimingTrial(true);
    setTrialError(null);
    try {
      const res = await userFetch('/api/user/trial/claim', {
        method: 'POST',
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setTrialError(resData.error?.message || 'Failed to claim trial.');
        if (resData.isPaused) {
          setTrialStatus((prev: any) => ({ ...prev, isPaused: true, trialsDisabled: true, status: 'PAUSED' }));
        }
      } else {
        const rawKey = resData.trial?.rawKeySecret || resData.trial?.apiKey || resData.key || resData.rawKeySecret;
        if (rawKey) {
          setRevealedKeyData({
            key: rawKey,
            planName: '1-Day Free Trial',
            quotaDisplay: '200K Tokens / 5h Window',
            windowHours: 5,
          });
        }
        fetchSubscriptions();
      }
    } catch (err: any) {
      setTrialError(err.message || 'Network error claiming trial.');
    } finally {
      setClaimingTrial(false);
    }
  };

  // Live countdown to next 5-hour reset & plan expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nextWindow = new Date(now);
      const currentHour = now.getHours();
      const nextHour = Math.ceil((currentHour + 1) / 5) * 5;
      nextWindow.setHours(nextHour % 24, 0, 0, 0);
      if (nextHour >= 24) nextWindow.setDate(nextWindow.getDate() + 1);

      const diff = Math.max(0, nextWindow.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setResetCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );

      if (data?.activeSubscription?.expiryTime) {
        const expDiff = Math.max(0, new Date(data.activeSubscription.expiryTime).getTime() - now.getTime());
        const days = Math.floor(expDiff / (1000 * 60 * 60 * 24));
        const expHours = Math.floor((expDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setExpiryCountdown(`${days}d ${expHours}h`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-[#64607d]">Loading plan capacity...</span>
      </div>
    );
  }

  const activeSub = data?.activeSubscription;
  const quotaLimit = Number(activeSub?.quotaLimit || 0);
  const currentUsage = Number(activeSub?.currentUsage || 0);
  const remainingTokens = Math.max(0, quotaLimit - currentUsage);
  const usagePercentage = quotaLimit > 0 ? Math.min(100, Math.round((currentUsage / quotaLimit) * 100)) : 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ede8e1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800 bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
              SUBSCRIPTION CAPACITY
            </span>
            <span className="text-xs text-[#64607d]">30-DAY ACTIVE VALIDITY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b2e] tracking-tight">
            Active Plan & Token Capacity
          </h1>
          <p className="text-xs text-[#64607d] mt-1">
            Manage your rolling 5-hour quota, token limits, and instant plan activations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const planToSelect = (availablePlans.length > 0 ? availablePlans.find((p: any) => p.priceInr > 0) : null) || {
              id: 'pro',
              name: 'Max 5x',
              priceInr: 2499,
              tokenDisplay: '5M TOKENS / 5 HOURS',
              windowHours: 5,
              validityDays: 30,
            };
            setSelectedPlanForCheckout(planToSelect);
          }}
          className="ui-button-primary text-xs py-2.5 px-5 gap-2 font-bold self-start sm:self-auto shadow-xs cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
          <span>Purchase / Upgrade Plan</span>
        </button>
      </div>

      {/* Free Trial Paused Notice */}
      {!activeSub && (trialStatus?.isPaused || trialStatus?.trialsDisabled || trialStatus?.status === 'PAUSED') && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-300/80 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-playful">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-[10.5px] font-bold uppercase tracking-wider border border-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-800" />
              <span>FREE TRIALS TEMPORARILY PAUSED</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1e1b2e]">Free Trial Activations Paused for All Customers</h2>
            <p className="text-xs text-[#64607d] max-w-xl">
              Complimentary trial activations are temporarily on hold to safeguard gateway bandwidth and guarantee ultra-low latency for active subscriptions. You can activate any capacity plan instantly below.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const planToSelect = (availablePlans.length > 0 ? availablePlans.find((p: any) => p.priceInr > 0) : null) || {
                id: 'pro',
                name: 'Max 5x',
                priceInr: 2499,
                tokenDisplay: '5M TOKENS / 5 HOURS',
                windowHours: 5,
                validityDays: 30,
              };
              setSelectedPlanForCheckout(planToSelect);
            }}
            className="ui-button-primary text-xs px-6 py-3 font-bold shrink-0 self-stretch sm:self-auto shadow-md cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>Explore Capacity Plans</span>
          </button>
        </div>
      )}

      {/* Free Trial Eligibility Card */}
      {!activeSub && trialStatus?.isEligible && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-rose-50 to-violet-50 border border-amber-300/80 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-playful">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-[10.5px] font-bold uppercase tracking-wider border border-amber-300">
              <Gift className="w-3.5 h-3.5 text-amber-800" />
              <span>FREE TRIAL READY</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1e1b2e]">Claim Your Free 1-Day Evaluation Pass</h2>
            <p className="text-xs text-[#64607d]">
              200,000 Tokens / 5-Hour Window • 24 Hours Duration • Zero Credit Card Required
            </p>
            {trialError && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">{trialError}</p>}
          </div>

          <button
            type="button"
            onClick={handleClaimTrial}
            disabled={claimingTrial}
            className="ui-button-primary text-xs px-6 py-3 font-bold shrink-0 self-stretch sm:self-auto shadow-md cursor-pointer"
          >
            {claimingTrial ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
            <span>{claimingTrial ? 'Provisioning Key...' : 'Claim 200k Free Trial'}</span>
          </button>
        </div>
      )}

      {/* ACTIVE PLAN SECTION */}
      {activeSub ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#ede8e1] space-y-6 shadow-playful">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ede8e1] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ACTIVE SUBSCRIPTION
                </span>
                <span className="text-xs text-[#64607d]">ID: {activeSub.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1e1b2e] tracking-tight">{activeSub.planName}</h2>
              <p className="text-xs font-bold text-violet-700">
                ⚡ {formatTokens(activeSub.quotaLimit)} TOKENS / {activeSub.quotaWindowHours} HOURS
              </p>
            </div>

            <div className="flex flex-col sm:items-end text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[#64607d]">Status: <strong className="text-emerald-700 uppercase">ACTIVE</strong></span>
                {activeSub.billingPeriod === 'yearly' && (
                  <span className="text-[10px] font-mono font-bold text-violet-800 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">
                    Annual (365 Days)
                  </span>
                )}
              </div>
              <span className="text-[#64607d]">Expiry Date: <strong className="text-[#1e1b2e]">{new Date(activeSub.expiryTime).toLocaleDateString()}</strong></span>
              <span className="text-[11px] text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">{expiryCountdown} remaining</span>
            </div>
          </div>

          {/* TOKEN USAGE PROGRESS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e1b2e] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-600" />
                  Rolling Cycle Usage
                </h3>
                <p className="text-xs text-[#64607d] mt-0.5">
                  {formatTokens(currentUsage)} / {formatTokens(quotaLimit)} Tokens Spent ({usagePercentage}%)
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-700">
                  {formatTokens(remainingTokens)} tokens available
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-[#faf8f5] rounded-full overflow-hidden p-0.5 border border-[#ede8e1]">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#64607d]">
                <span>0 Tokens</span>
                <span>{formatTokens(quotaLimit)} Quota Limit</span>
              </div>
            </div>
          </div>

          {/* RESET & API KEY SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#ede8e1]">
            <div className="p-4 bg-[#faf8f5] border border-[#ede8e1] rounded-2xl space-y-1">
              <p className="text-[11px] text-[#64607d] font-bold flex items-center gap-1.5 uppercase">
                <Clock className="w-3.5 h-3.5 text-violet-600" /> Next Cycle Reset
              </p>
              <p className="text-lg font-extrabold text-[#1e1b2e]">{resetCountdown || 'Calculating...'}</p>
              <p className="text-[10px] text-[#64607d]">Restores 100% tokens every {activeSub.quotaWindowHours}h</p>
            </div>

            <div className="p-4 bg-[#faf8f5] border border-[#ede8e1] rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#64607d] font-bold flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active API Key
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const keyToCopy = activeSub.apiKeySecret || activeSub.apiKeyDisplay;
                    if (keyToCopy) {
                      navigator.clipboard.writeText(keyToCopy);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }
                  }}
                  className="px-2 py-0.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-2.5 h-2.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-bold font-mono text-[#1e1b2e] truncate">{activeSub.apiKeyDisplay || 'Key Assigned'}</p>
              <Link to="/dashboard/keys" className="text-[11px] text-violet-700 font-bold hover:underline inline-block">
                Manage Keys & Reveal Secret →
              </Link>
            </div>

            <div className="p-4 bg-[#faf8f5] border border-[#ede8e1] rounded-2xl space-y-1">
              <p className="text-[11px] text-[#64607d] font-bold flex items-center gap-1.5 uppercase">
                <CreditCard className="w-3.5 h-3.5 text-violet-600" /> Order Reference
              </p>
              <p className="text-xs font-bold text-[#1e1b2e] truncate">{activeSub.orderId ? activeSub.orderId.slice(0, 16) : 'Trial Provisioning'}</p>
              <p className="text-[10px] text-[#64607d]">Activated: {new Date(activeSub.activationTime).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-[#ede8e1] text-center space-y-3 max-w-lg mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-base font-bold text-[#1e1b2e]">No Active Plan Detected</h2>
          <p className="text-xs text-[#64607d] leading-relaxed">
            Select a capacity tier below to receive an active key and enjoy sub-50ms streaming.
          </p>
        </div>
      )}

      {/* AVAILABLE PLANS CATALOG (2-Stage Segregated) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-[#1e1b2e] flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600 fill-current" />
            <span>Select Model Ecosystem & Capacity Plan</span>
          </h2>
          <p className="text-xs text-[#64607d] mt-1">
            Choose your model family, then pick the billing architecture that matches your development workflow.
          </p>
        </div>

        {/* STEP 1: Model Ecosystem */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#64607d] font-bold">
            Step 1: Select Model Family
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedFamily('claude')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedFamily === 'claude'
                  ? 'bg-white border-violet-600 shadow-sm ring-2 ring-violet-500/20'
                  : 'bg-white/70 border-[#ede8e1] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#1e1b2e] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  Claude (Anthropic)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 text-violet-700 font-bold">
                  All 3 Modes
                </span>
              </div>
              <p className="text-[11px] text-[#64607d]">Sonnet 5.5, Opus 5.5, Haiku 5.5, and many more... Supports 5h rolling pool, credits, and tokens.</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFamily('openai');
                if (selectedBillingMode === 'window') setSelectedBillingMode('credit');
              }}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedFamily === 'openai'
                  ? 'bg-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white/70 border-[#ede8e1] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#1e1b2e] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  OpenAI Frontier
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Credits & Tokens
                </span>
              </div>
              <p className="text-[11px] text-[#64607d]">o1, o3-mini, GPT-4o, and many more... Drop-in OpenAI API compatibility.</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFamily('local');
                if (selectedBillingMode === 'window') setSelectedBillingMode('credit');
              }}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedFamily === 'local'
                  ? 'bg-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-white/70 border-[#ede8e1] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#1e1b2e] flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  Local & Open Weights
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  7x Multiplier
                </span>
              </div>
              <p className="text-[11px] text-[#64607d]">DeepSeek V3, Grok 3, Gemini 2.5, and many more... High-throughput wholesale economy.</p>
            </button>
          </div>
        </div>

        {/* STEP 2: Billing Architecture */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#64607d] font-bold">
            Step 2: Select Billing Architecture
          </div>
          <div className="inline-flex flex-wrap items-center p-1 rounded-2xl bg-white border border-[#ede8e1] shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedBillingMode('window');
                setSelectedFamily('claude');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBillingMode === 'window'
                  ? 'bg-[#1e1b2e] text-white shadow-xs'
                  : 'text-[#64607d] hover:text-[#1e1b2e]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span>5-Hour Rolling Window</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300">
                Claude Only
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedBillingMode('credit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBillingMode === 'credit'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-[#64607d] hover:text-[#1e1b2e]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Usage Credits</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                7x Value
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedBillingMode('token')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBillingMode === 'token'
                  ? 'bg-[#1e1b2e] text-white shadow-xs'
                  : 'text-[#64607d] hover:text-[#1e1b2e]'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prepaid Token Packs</span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/20">
                No 5h Reset
              </span>
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        {selectedBillingMode === 'window' && (
          <div className="p-4 rounded-2xl bg-white border border-[#ede8e1] text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-violet-600 shrink-0" />
              <div>
                <strong className="text-[#1e1b2e]">5-Hour Continuous Rolling Window (Claude Exclusive):</strong> Tokens continuously refill as requests age past 5 hours. Fixed 30-day validity. Ideal for active developers on Cursor and Claude Code CLI.
              </div>
            </div>
          </div>
        )}

        {selectedBillingMode === 'credit' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <strong className="text-amber-300">{selectedFamily === 'claude' ? 'Claude API Credits' : selectedFamily === 'openai' ? 'OpenAI API Credits' : 'Local Models API Credits'} (7x Multiplier):</strong> Deposit funds in INR and unlock up to 7x–8.75x in API Credits (e.g. Pay ₹100 → Receive $7.00 USD in Credits). Atomically deducted per token at published USD rates. Dedicated access to {selectedFamily === 'claude' ? 'Claude' : selectedFamily === 'openai' ? 'OpenAI' : 'Local'} models. 365-day validity.
              </div>
            </div>
            <span className="font-mono text-amber-300 text-[11px] shrink-0 font-bold bg-white/10 px-2.5 py-1 rounded-lg">
              Pay ₹100 → Get $7.00 Credits
            </span>
          </div>
        )}

        {selectedBillingMode === 'token' && (
          <div className="p-4 rounded-2xl bg-white border border-[#ede8e1] text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-[#1e1b2e]">{selectedFamily === 'claude' ? 'Claude Prepaid Tokens' : selectedFamily === 'openai' ? 'OpenAI Prepaid Tokens' : 'Local Models Prepaid Tokens'}:</strong> Fixed allocation of 5M to 50M tokens that does NOT reset every 5 hours. Spend at your own speed over 365 days. Dedicated to {selectedFamily === 'claude' ? 'Claude' : selectedFamily === 'openai' ? 'OpenAI' : 'Local'} models.
              </div>
            </div>
            <span className="font-mono text-emerald-700 text-[11px] shrink-0 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              365d Fixed Term
            </span>
          </div>
        )}

        {/* Non-Claude Rolling Guard */}
        {selectedFamily !== 'claude' && selectedBillingMode === 'window' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Rolling 5-hour plans are exclusive to Claude models. For {selectedFamily === 'openai' ? 'OpenAI' : 'Local'} models, please choose Usage Credits or Token Packs.</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBillingMode('credit')}
              className="px-3 py-1.5 rounded-lg bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              Switch to Credits
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {availablePlans
            .filter((p: any) => {
              const name = (p.name || '').toLowerCase();
              const slug = (p.slug || '').toLowerCase();
              if (name.includes('trial') || slug.includes('trial')) return false;

              const targetCategory = (() => {
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
              })();

              if (p.planCategory) {
                return p.planCategory === targetCategory;
              }
              const pType = p.planType || (p.windowHours === 5 ? 'window' : 'window');
              if (targetCategory === 'claude_max_rolling') return pType === 'window' && p.priceInr >= 1000;
              if (targetCategory === 'claude_openai_credits') return pType === 'credit';
              if (targetCategory === 'openai_tokens') return pType === 'token' && (name.includes('openai') || slug.includes('openai'));
              if (targetCategory === 'claude_tokens') return pType === 'token' && (name.includes('claude') || slug.includes('claude'));
              if (targetCategory === 'local_models_tokens') return pType === 'token' && (name.includes('local') || slug.includes('local'));
              return false;
            })
            .sort((a: any, b: any) => a.priceInr - b.priceInr)
            .map((p: any) => {
              const allowanceNum = Number(p.tokenAllowance || 0);
              const allowanceMillions = (allowanceNum / 1_000_000).toFixed(0);

              return (
                <div
                  key={p.id}
                  className={`p-6 rounded-3xl bg-white flex flex-col justify-between space-y-5 relative transition-all shadow-2xs border ${
                    p.featured
                      ? 'border-violet-500 shadow-playful ring-2 ring-violet-500/20'
                      : 'border-[#ede8e1] hover:border-violet-300'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-6 bg-violet-600 text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider">
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-violet-800 bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-[#64607d]">{p.validityDays || 30} Days</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-[#1e1b2e]">{p.displayName || p.name}</h3>
                      <p className="text-xs text-[#64607d] line-clamp-2 mt-0.5">{p.tagline}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] font-mono text-center">
                      {selectedBillingMode === 'window' && (
                        <>
                          <div className="text-base font-bold text-[#1e1b2e]">{allowanceMillions}M TOKENS</div>
                          <div className="text-[9px] text-violet-700 uppercase font-bold tracking-wider">PER 5-HOUR WINDOW</div>
                        </>
                      )}
                      {selectedBillingMode === 'credit' && (
                        <>
                          <div className="text-base font-bold text-[#1e1b2e]">${Number(p.creditAmountUsd || ((p.priceInr * (p.creditMultiplier || 7.0)) / 100)).toFixed(2)} CREDITS</div>
                          <div className="text-[9px] text-amber-600 uppercase font-bold tracking-wider">{p.creditMultiplier || 7.0}x MULTIPLIER</div>
                        </>
                      )}
                      {selectedBillingMode === 'token' && (
                        <>
                          <div className="text-base font-bold text-[#1e1b2e]">{allowanceMillions}M TOKENS</div>
                          <div className="text-[9px] text-emerald-700 uppercase font-bold tracking-wider">CONSUMABLE QUOTA</div>
                        </>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#ede8e1] flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-[#1e1b2e]">
                        ₹{p.priceInr.toLocaleString()}
                      </span>
                      {p.originalPriceInr && (
                        <span className="text-xs text-[#64607d] line-through">
                          ₹{p.originalPriceInr.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[11px] text-[#64607d]">
                        {selectedBillingMode === 'window' ? '/ 30d' : ' deposit'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#ede8e1]">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPlanForCheckout({
                          id: p.id,
                          name: p.name,
                          priceInr: p.priceInr,
                          tokenDisplay: p.tokenDisplay,
                          windowHours: p.windowHours || 5,
                          validityDays: p.validityDays || 30,
                        })
                      }
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        p.featured
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : 'bg-[#1e1b2e] hover:bg-black text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Select {selectedBillingMode === 'credit' ? 'Credits' : 'Plan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          id: p.id,
                          planId: p.id,
                          name: p.name,
                          priceInr: p.priceInr,
                          originalPriceInr: p.originalPriceInr,
                          tokenDisplay: p.tokenDisplay,
                          windowHours: p.windowHours || 5,
                          validityDays: p.validityDays || 30,
                          tagline: p.tagline,
                          badge: p.badge,
                        })
                      }
                      className="w-full py-2 rounded-xl font-semibold text-xs border border-[#ede8e1] text-[#64607d] hover:text-[#1e1b2e] hover:bg-[#faf8f5] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* PURCHASE HISTORY TABLE */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-[#1e1b2e] flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-violet-600" />
          <span>Purchase & Order History</span>
        </h2>

        {data?.orders && data.orders.length > 0 ? (
          <div className="bg-white rounded-3xl border border-[#ede8e1] overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#faf8f5] border-b border-[#ede8e1] text-[10.5px] font-bold uppercase tracking-wider text-[#64607d]">
                  <th className="py-3.5 px-5">Order Reference</th>
                  <th className="py-3.5 px-5">Plan Allotted</th>
                  <th className="py-3.5 px-5 text-right">Amount (INR)</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ede8e1]">
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#1e1b2e]">{o.internalOrderId}</td>
                    <td className="py-3.5 px-5 font-bold text-violet-700">{o.planName}</td>
                    <td className="py-3.5 px-5 text-right font-extrabold text-[#1e1b2e]">₹{o.amountInr.toLocaleString()}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.paymentStatus === 'CAPTURED' || o.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : o.paymentStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right text-[#64607d]">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-[#ede8e1] text-center text-xs text-[#64607d]">
            No previous order transactions recorded yet.
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          onClose={() => {
            setSelectedPlanForCheckout(null);
            fetchSubscriptions();
          }}
        />
      )}

      {/* API Key Revealed Modal */}
      {revealedKeyData && (
        <ApiKeyRevealModal
          isOpen={!!revealedKeyData}
          apiKey={revealedKeyData.key}
          planName={revealedKeyData.planName}
          quotaDisplay={revealedKeyData.quotaDisplay}
          windowHours={revealedKeyData.windowHours}
          onClose={() => {
            setRevealedKeyData(null);
            fetchSubscriptions();
          }}
        />
      )}
    </div>
  );
};

export default UserPlan;
