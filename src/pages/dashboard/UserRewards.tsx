import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
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
  };
  transactions: any[];
  orders: any[];
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

  const eligiblePortion = Math.min(calcAmount, maxEligible);
  const calculatedReward = Math.min(
    Math.round((eligiblePortion * (rewardRate / 100)) * 100) / 100,
    maxReward
  );

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'What are Lightning Credits?',
      a: 'Lightning Credits are promotional loyalty credits earned on eligible LightningAPI.pro purchases. Each credit equals ₹1 toward future subscription and token package purchases.',
    },
    {
      q: 'How many Lightning Credits do I earn per order?',
      a: `You receive ${rewardRate}% back in Lightning Credits on eligible purchases. The reward applies to the first ₹${maxEligible.toLocaleString()} of each individual transaction, giving you up to ₹${maxReward.toLocaleString()} Lightning Credits per transaction.`,
    },
    {
      q: 'Is there a limit on how many credits I can accumulate?',
      a: 'No! There is NO maximum wallet balance cap. You can accumulate Lightning Credits from across multiple orders and let your balance grow without restrictions.',
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
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-2xl font-extrabold text-fg tracking-tight">
              ⚡ Lightning Rewards
            </h1>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            Spend with Lightning. Earn 10% back in Lightning Credits on every eligible purchase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRewards}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/pricing"
            className="ui-button-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
          >
            <span>Upgrade / Purchase Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Available Credits (Hero Highlight) */}
        <div className="md:col-span-2 relative overflow-hidden rounded-panel border-2 border-violet-500/40 bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-cyan-500/10 p-6 shadow-lg shadow-violet-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-full border border-violet-300">
              Usable Balance
            </span>
            <Zap className="w-5 h-5 text-violet-600 fill-violet-600 animate-pulse" />
          </div>

          <div className="mt-4">
            <p className="text-xs font-mono text-muted">Your Available Lightning Credits</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-fg font-mono tracking-tight">
                ₹{loading ? '...' : (data?.availableCredits || 0).toLocaleString()}
              </span>
              <span className="text-xs font-mono font-bold text-violet-700">Credits</span>
            </div>
            <p className="text-[11px] text-muted font-mono mt-2">
              Ready to be applied at checkout toward any plan or token renewal.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-violet-200/60 flex items-center justify-between text-xs">
            <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> No wallet balance limit
            </span>
            <Link
              to="/pricing"
              className="text-violet-700 hover:text-violet-800 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Redeem on Next Order</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Lifetime Earned */}
        <div className="rounded-panel border border-border bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase font-bold">Lifetime Earned</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-fg font-mono">
              ₹{loading ? '...' : (data?.lifetimeCreditsEarned || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted font-mono mt-1">Total rewards accumulated</p>
          </div>
          <div className="pt-3 border-t border-border/60 text-[11px] font-mono text-muted">
            10% back on purchases
          </div>
        </div>

        {/* Lifetime Redeemed */}
        <div className="rounded-panel border border-border bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase font-bold">Total Redeemed</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-fg font-mono">
              ₹{loading ? '...' : (data?.lifetimeCreditsRedeemed || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted font-mono mt-1">Saved on past checkouts</p>
          </div>
          <div className="pt-3 border-t border-border/60 text-[11px] font-mono text-muted">
            {data?.eligiblePurchasesCount || 0} Eligible Orders
          </div>
        </div>
      </div>

      {/* Critical Distinction & Rules Information Banner */}
      <div className="rounded-panel border border-violet-200/80 bg-gradient-to-r from-violet-50 via-indigo-50/50 to-cyan-50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-600 text-white shrink-0 mt-0.5">
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
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-control border border-violet-100">
            <span className="font-mono font-bold text-violet-700 block mb-1">1. Earn Rate</span>
            <p className="text-muted leading-relaxed">
              Earn 10% back on the first ₹5,000 of every order (up to ₹500 credits per order).
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-control border border-violet-100">
            <span className="font-mono font-bold text-emerald-700 block mb-1">2. Unlimited Accumulation</span>
            <p className="text-muted leading-relaxed">
              There is <strong>no wallet balance cap</strong>. Accumulate ₹500, ₹1,500, ₹5,000+ credits over time!
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-control border border-violet-100">
            <span className="font-mono font-bold text-cyan-700 block mb-1">3. Next-Order Redemption</span>
            <p className="text-muted leading-relaxed">
              Credits earned become active immediately upon payment completion for use on your next purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Reward Calculator */}
      <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-fg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Interactive Lightning Credits Calculator</span>
            </h2>
            <p className="text-xs text-muted font-mono mt-0.5">
              Simulate how many credits you will earn on your next order.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-subtle text-muted border border-border">
            Formula: MIN(Amount, ₹5,000) × 10%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-2">
          {/* Slider & Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-fg font-mono uppercase">
                Purchase Amount
              </label>
              <div className="flex items-center gap-1 border border-border rounded-control px-3 py-1 bg-subtle">
                <span className="text-xs font-mono font-bold text-muted">₹</span>
                <input
                  type="number"
                  min={100}
                  max={50000}
                  step={100}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 text-sm font-extrabold text-fg bg-transparent outline-none font-mono text-right"
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
              className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            <div className="flex justify-between text-[11px] font-mono text-muted">
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
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-control border transition-all ${
                    calcAmount === preset
                      ? 'bg-violet-600 text-white border-violet-600 font-bold'
                      : 'bg-white border-border text-muted hover:text-fg hover:bg-subtle'
                  }`}
                >
                  ₹{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          <div className="p-5 rounded-control bg-subtle/80 border border-border space-y-4 font-mono">
            <div className="space-y-2 text-xs">
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
                <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  Note: Purchases above ₹{maxEligible.toLocaleString()} earn the maximum ₹{maxReward} per transaction.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted block">You Will Earn</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                  +₹{calculatedReward.toLocaleString()}
                </span>
                <span className="text-xs text-muted ml-1.5 font-bold">Credits</span>
              </div>
              <Link
                to="/pricing"
                className="ui-button-primary text-xs py-2 px-3 font-bold flex items-center gap-1"
              >
                <span>Choose Plan</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Activity Ledger */}
      <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-extrabold text-fg">Credit Activity Ledger</h2>
            <p className="text-xs text-muted font-mono mt-0.5">
              Authoritative transaction history of all earned and redeemed credits.
            </p>
          </div>
          <span className="text-xs font-mono text-muted">
            {data?.transactions?.length || 0} Transactions Recorded
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-600" />
            Loading credit ledger...
          </div>
        ) : !data?.transactions || data.transactions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-fg">No Credit Transactions Yet</h3>
            <p className="text-xs text-muted font-mono max-w-sm mx-auto">
              Purchase your first Claude Max subscription to earn 10% back in Lightning Credits!
            </p>
            <Link to="/pricing" className="ui-button-primary text-xs py-2 px-4 inline-block font-bold">
              Explore Plans
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.transactions.map((tx: any) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-3 text-muted">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-fg max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className={`py-3 px-3 text-right font-extrabold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                      </td>
                      <td className="py-3 px-3 text-right text-fg font-bold">
                        ₹{tx.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
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

      {/* Eligible Purchases History */}
      {data?.orders && data.orders.length > 0 && (
        <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <h2 className="text-base font-extrabold text-fg">Eligible Purchases History</h2>
              <p className="text-xs text-muted font-mono mt-0.5">
                Breakdown of purchase amounts, eligible portions, and rewards earned.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted uppercase">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Purchase Value</th>
                  <th className="py-2.5 px-3 text-right">Eligible Amount</th>
                  <th className="py-2.5 px-3 text-right">Credits Earned</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="py-3 px-3 text-violet-700 font-bold">
                      {o.internalOrderId}
                    </td>
                    <td className="py-3 px-3 text-fg font-semibold">
                      {o.planName}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {new Date(o.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right text-fg font-bold">
                      ₹{o.purchaseAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      ₹{o.eligibleAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-extrabold">
                      {o.creditsEarned > 0 ? `+₹${o.creditsEarned.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Frequently Asked Questions */}
      <div className="rounded-panel border border-border bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-fg flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-violet-600" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-border rounded-control overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-fg hover:bg-subtle/50"
              >
                <span>{faq.q}</span>
                {expandedFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                )}
              </button>
              {expandedFaq === idx && (
                <div className="p-4 pt-0 text-xs text-muted font-mono leading-relaxed border-t border-border/40 bg-subtle/30">
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
