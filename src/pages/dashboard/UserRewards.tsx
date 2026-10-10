import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Gift,
  Coins,
  CheckCircle2,
  Info,
  Flame,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface RewardSummary {
  availableCredits: number;
  lifetimeCreditsEarned: number;
  lifetimeCreditsRedeemed: number;
  eligiblePurchasesCount: number;
  settings: {
    rewardPercentage: number;
    maxEligiblePurchaseAmount: number;
    maxRewardPerTransaction: number;
    currency: string;
    isActive: boolean;
    promoActive?: boolean;
    promoMultiplier?: number;
    promoMinPurchaseAmount?: number;
    promoMaxCredits?: number;
    promoTitle?: string;
    promoSubtitle?: string;
    promoBadge?: string;
    promoShowPopup?: boolean;
    promoShowBanner?: boolean;
    promoEndsAt?: string | null;
  };
  transactions: any[];
  orders: any[];
  purchases?: any[];
}

export const UserRewards: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<RewardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(5000);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/user/rewards/summary');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error?.message || 'Failed to load rewards.');
        }
      } else {
        setError('Failed to fetch rewards details.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error fetching rewards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  // Calculator computations
  const maxEligible = data?.settings?.maxEligiblePurchaseAmount || 5000;
  const rewardRate = data?.settings?.rewardPercentage || 10;
  const maxReward = data?.settings?.maxRewardPerTransaction || 500;

  const isPromo = Boolean(data?.settings?.promoActive);
  const promoMultiplier = Number(data?.settings?.promoMultiplier) || 2.0;
  const promoMinPurchase =
    data?.settings?.promoMinPurchaseAmount !== undefined && data?.settings?.promoMinPurchaseAmount !== null
      ? Number(data?.settings?.promoMinPurchaseAmount)
      : 0;
  const promoMaxCredits = Number(data?.settings?.promoMaxCredits) || 1000;

  const eligiblePortion = Math.min(calcAmount, maxEligible);
  const baseReward = Math.min(
    Math.round(eligiblePortion * (rewardRate / 100) * 100) / 100,
    maxReward
  );

  const isPromoQualifying = isPromo && calcAmount >= promoMinPurchase && promoMultiplier > 1;
  const calculatedReward = isPromoQualifying
    ? Math.min(
        Math.round(baseReward * promoMultiplier * 100) / 100,
        promoMaxCredits > 0 ? promoMaxCredits : Infinity
      )
    : baseReward;

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'What are Lightning Credits?',
      a: 'Lightning Credits are your loyalty reward balance earned on every eligible purchase. Each credit equals ₹1.00 directly off future subscriptions, renewals, or token package orders.',
    },
    {
      q: 'How many Lightning Credits do I earn per order?',
      a: `You receive ${rewardRate}% back in Lightning Credits on eligible purchases. The reward applies to the first ₹${maxEligible.toLocaleString()} of each individual transaction, giving you up to ₹${maxReward.toLocaleString()} Lightning Credits per transaction.`,
    },
    {
      q: 'Is there a limit on how many credits I can accumulate?',
      a: 'No! There is NO maximum wallet balance cap. You can accumulate Lightning Credits across multiple orders and let your balance grow without restrictions.',
    },
    {
      q: 'When do my earned credits become available to use?',
      a: 'Credits are deposited into your account immediately upon successful payment completion, and are available for instant redemption on your next purchase at checkout.',
    },
    {
      q: 'How do I redeem Lightning Credits?',
      a: 'During checkout, you will see a "Redeem Lightning Credits" option. You can apply all or any portion of your available balance directly to reduce the order total, down to ₹0.',
    },
  ];

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Playful Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                  Lightning Rewards
                </h1>
                <span className="text-[11px] font-bold text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-full border border-violet-200">
                  10% Back
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Earn 10% back in Lightning Credits on every purchase. No limits, instant savings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRewards}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            to="/pricing"
            className="ui-button-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
          >
            <span>Upgrade Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Active Flash Promotional Offer Card */}
      {isPromo && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-violet-500/10 to-indigo-500/15 border-2 border-amber-500/40 p-6 sm:p-7 shadow-playful">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/15 blur-3xl rounded-full pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{data?.settings?.promoBadge || 'FLASH OFFER ACTIVE'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-fg tracking-tight">
                {data?.settings?.promoTitle || '⚡ SPECIAL FLASH OFFER'}
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {data?.settings?.promoSubtitle}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                <span className="font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-xl">
                  ⚡ {promoMultiplier}X Flash Multiplier
                </span>
                <span className="text-muted bg-white/90 border border-border px-3 py-1 rounded-xl">
                  {promoMinPurchase > 0
                    ? `Qualifying Order: ₹${promoMinPurchase.toLocaleString()}+`
                    : 'Applies to ALL Orders'}
                </span>
                <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl font-bold">
                  Max Reward: ₹{promoMaxCredits.toLocaleString()} Credits (₹{maxEligible.toLocaleString()} Cap)
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                to="/pricing"
                className="px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Claim {promoMultiplier}X Credits</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Usable Balance (Playful Highlight Card) */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl border-2 border-violet-500/30 bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-cyan-500/10 p-6 sm:p-7 shadow-playful flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-800 bg-violet-100/90 px-3 py-1 rounded-full border border-violet-200">
                Usable Credit Balance
              </span>
              <div className="w-9 h-9 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <Coins className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-muted">Your Available Lightning Credits</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-fg tracking-tight">
                  ₹{loading ? '...' : (data?.availableCredits || 0).toLocaleString()}
                </span>
                <span className="text-sm font-bold text-violet-700">Credits</span>
              </div>
              <p className="text-xs text-muted mt-2">
                Ready to be applied at checkout toward any plan renewal or token reload.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-violet-200/60 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No wallet balance limit
            </span>
            <Link
              to="/pricing"
              className="text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Redeem Now</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Lifetime Earned */}
        <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-playful flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Lifetime Earned</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-black text-fg">
              ₹{loading ? '...' : (data?.lifetimeCreditsEarned || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-1">Total rewards earned</p>
          </div>
          <div className="pt-3 border-t border-border/60 text-xs text-muted">
            10% rewards on purchases
          </div>
        </div>

        {/* Lifetime Redeemed */}
        <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-playful flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase">Total Redeemed</span>
            <div className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-3xl font-black text-fg">
              ₹{loading ? '...' : (data?.lifetimeCreditsRedeemed || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-1">Saved on past checkouts</p>
          </div>
          <div className="pt-3 border-t border-border/60 text-xs text-muted">
            {data?.eligiblePurchasesCount || 0} Eligible Orders
          </div>
        </div>
      </div>

      {/* Rules Explainer Capsule */}
      <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 via-indigo-50/50 to-pink-50/60 p-6 space-y-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-violet-600 text-white shrink-0 mt-0.5 shadow-sm">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-fg">
              How Lightning Rewards Works — Clear, Fair & Unlimited Accumulation
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Earn <strong className="text-violet-700">10% back in Lightning Credits</strong> on eligible purchases.
              The only restriction is a maximum of <strong className="text-fg">₹500 Lightning Credits earned per single transaction</strong> (calculated on up to ₹5,000 purchase value).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-violet-200/60 text-xs">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-violet-100 shadow-2xs">
            <span className="font-bold text-violet-700 block mb-1">1. Earn Rate</span>
            <p className="text-muted leading-relaxed">
              Earn 10% back on the first ₹5,000 of every order (up to ₹500 credits per order).
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-violet-100 shadow-2xs">
            <span className="font-bold text-emerald-700 block mb-1">2. Unlimited Accumulation</span>
            <p className="text-muted leading-relaxed">
              There is <strong>no wallet balance cap</strong>. Accumulate ₹500, ₹1,500, ₹5,000+ credits over time!
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-violet-100 shadow-2xs">
            <span className="font-bold text-cyan-700 block mb-1">3. Next-Order Redemption</span>
            <p className="text-muted leading-relaxed">
              Credits earned become active immediately upon payment completion for use on your next purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Reward Calculator */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-fg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <span>Interactive Lightning Credits Calculator</span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Simulate how many credits you will earn on your next order.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 self-start sm:self-auto">
            MIN(Amount, ₹5,000) × 10%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Slider & Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-fg uppercase tracking-wider">
                Purchase Amount
              </label>
              <div className="flex items-center gap-1 border border-border/80 rounded-xl px-3 py-1.5 bg-subtle/50">
                <span className="text-xs font-bold text-muted">₹</span>
                <input
                  type="number"
                  min={100}
                  max={50000}
                  step={100}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 text-sm font-extrabold text-fg bg-transparent outline-none text-right"
                />
              </div>
            </div>

            <input
              type="range"
              min={500}
              max={20000}
              step={500}
              value={calcAmount}
              onChange={(e) => setCalcAmount(Number(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg"
            />

            <div className="flex justify-between text-[11px] text-muted">
              <span>₹500</span>
              <span>₹2,500</span>
              <span>₹5,000 (Max Cap)</span>
              <span>₹10,000</span>
              <span>₹20,000+</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[500, 1000, 2000, 4000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCalcAmount(preset)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    calcAmount === preset
                      ? 'bg-violet-600 text-white border-violet-600 font-bold shadow-sm'
                      : 'bg-white border-border/80 text-muted hover:text-fg hover:bg-subtle'
                  }`}
                >
                  ₹{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/50 border border-violet-200/80 space-y-4 shadow-sm">
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Purchase Amount:</span>
                <span className="text-fg font-bold">₹{calcAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Reward-Eligible Portion:</span>
                <span className="text-violet-700 font-bold">₹{eligiblePortion.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Reward Percentage:</span>
                <span className="text-fg font-bold">{rewardRate}%</span>
              </div>
              {calcAmount > maxEligible && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Note: Purchases above ₹{maxEligible.toLocaleString()} are calculated on the ₹{maxEligible.toLocaleString()} purchase cap (capping rewards at ₹{isPromoQualifying ? promoMaxCredits.toLocaleString() : maxReward.toLocaleString()} credits).
                </p>
              )}
              {isPromoQualifying && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                    <Flame className="w-4 h-4 fill-current text-amber-600" />
                    <span>⚡ {promoMultiplier}X Flash Multiplier Applied!</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Base ₹{baseReward} × {promoMultiplier}X = ₹{calculatedReward} Lightning Credits{promoMaxCredits > 0 ? ` (capped at ₹${promoMaxCredits.toLocaleString()})` : ''}!
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-violet-200/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold block">You Will Earn</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                  +₹{calculatedReward.toLocaleString()}
                </span>
                <span className="text-xs text-muted ml-1.5 font-bold">Credits</span>
              </div>
              <Link
                to="/pricing"
                className="ui-button-primary text-xs py-2.5 px-4 font-bold flex items-center gap-1"
              >
                <span>Choose Plan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Activity Ledger */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-fg">Credit Activity Ledger</h2>
            <p className="text-xs text-muted mt-0.5">
              Complete transaction history of all earned and redeemed credits.
            </p>
          </div>
          <span className="text-xs text-muted font-bold">
            {data?.transactions?.length || 0} Transactions
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-600" />
            Loading credit ledger...
          </div>
        ) : !data?.transactions || data.transactions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-100">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-fg">No Credit Transactions Yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Purchase your first subscription or token package to earn 10% back in Lightning Credits!
            </p>
            <Link to="/pricing" className="ui-button-primary text-xs py-2 px-4 inline-block font-bold">
              Explore Plans
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[11px] text-muted uppercase font-bold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Balance After</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.transactions.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  const channel = tx.purchase?.channel || tx.channel;
                  const ref = tx.purchase?.referenceId || tx.referenceId || tx.order?.internalOrderId;
                  return (
                    <tr key={tx.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-3 text-muted whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            tx.type === 'PURCHASE_REWARD'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.type === 'CREDIT_REDEMPTION'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : tx.type === 'MANUAL_CREDIT'
                              ? 'bg-violet-50 text-violet-700 border border-violet-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-fg max-w-sm">
                        <div className="font-semibold text-fg">{tx.description}</div>
                        <div className="text-[10px] text-muted flex items-center gap-2 mt-0.5">
                          {channel && (
                            <span className={`px-1.5 py-0.5 rounded-md font-bold ${
                              channel === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                            }`}>
                              {channel === 'WHATSAPP' ? '💬 WhatsApp' : channel === 'WEBSITE' ? '🌐 LightningAPI.pro' : channel}
                            </span>
                          )}
                          {ref && <span>Ref: {ref}</span>}
                          {tx.reason && <span className="italic">Reason: {tx.reason}</span>}
                        </div>
                      </td>
                      <td className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                      </td>
                      <td className="py-3 px-3 text-right text-fg font-bold whitespace-nowrap">
                        ₹{tx.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
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
      </div>

      {/* Universal Purchase History */}
      {((data?.purchases && data.purchases.length > 0) || (data?.orders && data.orders.length > 0)) && (
        <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-fg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-violet-600" />
                <span>Universal Purchase History</span>
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Every purchase made through WhatsApp, Website, or direct channels with rewards earned.
              </p>
            </div>
            <span className="text-xs text-muted font-bold">
              {(data.purchases?.length || data.orders?.length || 0)} Purchases
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[11px] text-muted uppercase font-bold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Product / Service</th>
                  <th className="py-3 px-3 text-center">Channel</th>
                  <th className="py-3 px-3 text-right">Amount Paid</th>
                  <th className="py-3 px-3 text-right">Eligible Amount</th>
                  <th className="py-3 px-3 text-right">Credits Earned</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(data.purchases || data.orders).map((p: any) => {
                  const channel = p.channel || 'WEBSITE';
                  return (
                    <tr key={p.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-3 text-muted whitespace-nowrap">
                        {new Date(p.date || p.purchaseDate || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-fg font-bold">
                        {p.productName || p.planName}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            channel === 'WHATSAPP'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : channel === 'WEBSITE'
                              ? 'bg-violet-50 text-violet-700 border border-violet-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {channel === 'WHATSAPP'
                            ? '💬 WhatsApp'
                            : channel === 'WEBSITE'
                            ? '🌐 LightningAPI.pro'
                            : channel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-fg font-bold whitespace-nowrap">
                        ₹{(p.amountPaid ?? p.purchaseAmount)?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-muted whitespace-nowrap">
                        ₹{p.eligibleAmount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-extrabold whitespace-nowrap">
                        {p.creditsEarned > 0 ? `+₹${p.creditsEarned.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted text-[11px] whitespace-nowrap">
                        {p.referenceId || p.internalOrderId || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Frequently Asked Questions */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
        <h2 className="text-base sm:text-lg font-extrabold text-fg flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-violet-600" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-border/80 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-fg hover:bg-subtle/50 cursor-pointer"
              >
                <span>{faq.q}</span>
                {expandedFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                )}
              </button>
              {expandedFaq === idx && (
                <div className="p-4 pt-0 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/40 bg-subtle/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserRewards;
