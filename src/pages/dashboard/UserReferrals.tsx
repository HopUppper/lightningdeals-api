import React, { useState, useEffect } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  RefreshCw,
  ShoppingBag,
  Zap,
  ChevronDown,
  ShieldCheck,
  DollarSign,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { userFetch } from '../../utils/api';

export const UserReferrals: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [shared, setShared] = useState(false);

  // Manual Claim input
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // FAQ Accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userFetch('/api/user/referrals/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setError(err.error?.message || 'Failed to load referral overview.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error fetching referral data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleCopyLink = () => {
    if (!data?.referralUrl) return;
    navigator.clipboard.writeText(data.referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShare = async () => {
    if (!data?.referralUrl) return;
    const shareText = `Join LightningAPI.pro and get rewarded on your purchases! ⚡\nUse my referral link:\n${data.referralUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LightningDeals — Refer & Earn',
          text: shareText,
          url: data.referralUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // fallback to copy
        }
      }
    }

    navigator.clipboard.writeText(shareText);
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode.trim()) return;

    setClaiming(true);
    setClaimStatus(null);
    try {
      const res = await userFetch('/api/user/referrals/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: claimCode.trim() }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setClaimStatus({ success: true, message: 'Referral code attributed successfully!' });
        setClaimCode('');
        await fetchOverview();
      } else {
        setClaimStatus({ success: false, message: result.error?.message || 'Failed to claim referral code.' });
      }
    } catch (e: any) {
      setClaimStatus({ success: false, message: e.message || 'Network error.' });
    } finally {
      setClaiming(false);
    }
  };

  const getStatusBadge = (status: string, rewardStatus: string) => {
    if (status === 'REWARDED' || rewardStatus === 'CREDITED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Rewarded
        </span>
      );
    }
    if (status === 'REVERSED' || rewardStatus === 'REVERSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Reversed
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <Clock className="w-3 h-3 text-slate-500" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Pending Purchase
      </span>
    );
  };

  const faqs = [
    {
      q: 'How does the Referral Reward Program work?',
      a: 'When someone registers using your referral link and completes a qualifying purchase (min. ₹500), they receive their regular 10% Lightning Rewards, and you receive matching Referral Credits deposited directly into your account!',
    },
    {
      q: 'How much do I earn per referral?',
      a: `You earn 10% back on their qualifying purchase, up to ₹${(data?.settings?.maxRewardPerOrder || 500).toLocaleString()} in Lightning Credits per transaction. For example, if your friend purchases a ₹3,500 plan, you receive +₹350 Lightning Credits!`,
    },
    {
      q: 'When do I receive my referral credits?',
      a: 'Referral Credits are credited automatically and instantaneously the moment your referred friend completes their payment and their order is verified.',
    },
    {
      q: 'Is there a limit on how many friends I can refer?',
      a: 'No limit! You can invite as many developers, colleagues, or teams as you wish. There is also no maximum ceiling on how many referral credits you can accumulate in your balance.',
    },
    {
      q: 'How can I spend my earned Referral Credits?',
      a: 'Referral Credits are standard Lightning Credits and are saved in your unified wallet balance. You can apply them directly at checkout toward any subscription renewal, token refill, or plan upgrade, reducing your order total down to ₹0.',
    },
  ];

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Gift className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-fg tracking-tight">
                  🤝 Referral Program
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  10% REWARD MATCH
                </span>
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">
                Invite friends and teams to LightningAPI.pro. Earn matching Lightning Credits on their purchases!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/dashboard/rewards"
            className="ui-button-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold"
          >
            <Zap className="w-3.5 h-3.5 text-violet-600" />
            <span>My Credits Balance</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Main Hero Card: Link & Code */}
      <div className="relative overflow-hidden rounded-panel border-2 border-violet-500/40 bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-cyan-500/10 p-6 sm:p-8 shadow-lg shadow-violet-500/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-400/10 blur-3xl rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>GIVE 10%, GET 10% (UP TO ₹500 PER ORDER)</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
              Share Your Referral Invite Link
            </h2>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Anyone who creates an account using your referral link is attributed to you for{' '}
              <span className="font-bold text-fg font-mono">30 days</span>. When they complete their first
              purchase of ₹{data?.settings?.minPurchaseAmountInr || 500} or more, you both get rewarded!
            </p>

            {/* Link Box */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
              <div className="flex-1 bg-white border border-border rounded-control px-4 py-2.5 font-mono text-xs sm:text-sm text-fg truncate select-all flex items-center shadow-xs">
                {data?.referralUrl || 'Loading referral link...'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-violet-600/20 active:scale-95 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="ui-button-secondary p-2.5 rounded-control flex items-center justify-center"
                  title="Share link"
                >
                  {shared ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Code Backup Badge */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted font-mono">
              <span>Your Referral Code:</span>
              <span className="font-bold text-violet-800 bg-violet-50 border border-violet-200 px-3 py-1 rounded-control text-xs">
                {data?.referralCode || '...'}
              </span>
              <button
                onClick={handleCopyCode}
                className="text-violet-600 hover:text-violet-800 font-bold underline inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? '✓ Copied code' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Quick Performance Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-panel bg-white/90 border border-border shadow-xs">
              <div className="text-[11px] font-mono text-muted uppercase font-bold">Total Invited</div>
              <div className="text-2xl font-extrabold text-fg font-mono mt-1">
                {loading ? '...' : (data?.stats?.totalReferrals || 0)}
              </div>
              <div className="text-[10px] text-muted font-mono mt-0.5">Friends attributed</div>
            </div>

            <div className="p-4 rounded-panel bg-emerald-50/60 border border-emerald-200 shadow-xs">
              <div className="text-[11px] font-mono text-emerald-800 uppercase font-bold">Purchases</div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                {loading ? '...' : (data?.stats?.successfulReferrals || 0)}
              </div>
              <div className="text-[10px] text-emerald-800 font-mono mt-0.5">Completed orders</div>
            </div>

            <div className="p-4 rounded-panel bg-amber-50/60 border border-amber-200 shadow-xs">
              <div className="text-[11px] font-mono text-amber-800 uppercase font-bold">Pending</div>
              <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
                {loading ? '...' : (data?.stats?.pendingReferrals || 0)}
              </div>
              <div className="text-[10px] text-amber-800 font-mono mt-0.5">Awaiting first order</div>
            </div>

            <div className="p-4 rounded-panel bg-violet-50/60 border border-violet-200 shadow-xs">
              <div className="text-[11px] font-mono text-violet-800 uppercase font-bold">Earned Credits</div>
              <div className="text-2xl font-extrabold text-violet-700 font-mono mt-1">
                ₹{loading ? '...' : (data?.stats?.totalCreditsEarned || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-violet-800 font-mono mt-0.5">Direct into balance</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step "How It Works" Walkthrough */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
            HOW IT WORKS
          </span>
          <h2 className="text-xl font-extrabold text-fg mt-2">Earn Matching Credits in 4 Simple Steps</h2>
          <p className="text-xs text-muted font-mono mt-1">
            Both parties win every time a referred customer makes a purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-panel border border-border bg-card p-5 shadow-xs relative">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-mono font-bold text-xs mb-3.5">
              01
            </div>
            <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-violet-600" />
              <span>Share Your Link</span>
            </h3>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Send your personal referral invite link to developers, coworkers, or communities.
            </p>
          </div>

          <div className="rounded-panel border border-border bg-card p-5 shadow-xs relative">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-mono font-bold text-xs mb-3.5">
              02
            </div>
            <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Friend Signs Up</span>
            </h3>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              When they register, attribution is locked to your account for a 30-day window.
            </p>
          </div>

          <div className="rounded-panel border border-border bg-card p-5 shadow-xs relative">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center font-mono font-bold text-xs mb-3.5">
              03
            </div>
            <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-cyan-600" />
              <span>Qualifying Order</span>
            </h3>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              They complete any plan or token package of ₹{data?.settings?.minPurchaseAmountInr || 500} or more.
            </p>
          </div>

          <div className="rounded-panel border border-emerald-200 bg-emerald-50/30 p-5 shadow-xs relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-mono font-bold text-xs mb-3.5">
              04
            </div>
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Instant Credits!</span>
            </h3>
            <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
              They receive their 10% purchase rewards, and you receive matching referral credits!
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Claim Code & Friends Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Friends You've Referred Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span>Friends You've Invited</span>
                <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  {data?.referrals?.length || 0}
                </span>
              </h3>
              <p className="text-xs text-muted font-mono mt-0.5">
                Privacy protected: friend emails and details are safely masked.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
            {!data?.referrals || data.referrals.length === 0 ? (
              <div className="py-16 text-center text-muted text-xs font-mono">
                You haven't referred any friends yet. Share your invite link above to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50 text-[11px]">
                      <th className="py-3 px-4">Friend</th>
                      <th className="py-3 px-4">Attributed Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Credits Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {data.referrals.map((r: any) => (
                      <tr key={r.id} className="hover:bg-bg/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-fg">
                          <div>{r.referredName || 'Referred User'}</div>
                          <div className="text-[11px] text-muted font-normal">{r.referredEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(r.status, r.rewardStatus)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {r.rewardCreditsEarned > 0 ? (
                            <span className="text-emerald-600">+₹{r.rewardCreditsEarned.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Manual Referral Code Claim Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-panel border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-fg">Have a Referral Code?</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              If you signed up directly without a link, you can attach a friend's referral code to your account here:
            </p>

            <form onSubmit={handleClaim} className="space-y-2.5 pt-1">
              <input
                type="text"
                placeholder="Enter 8-digit Code (e.g. PCB53JGK)"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                className="w-full bg-white border border-border rounded-control px-3.5 py-2 text-xs font-mono font-bold text-fg placeholder:text-muted/60 uppercase focus:outline-none focus:border-violet-500 shadow-xs"
              />
              <button
                type="submit"
                disabled={claiming || !claimCode.trim()}
                className="w-full ui-button-primary bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2 rounded-control shadow-md shadow-violet-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {claiming ? 'Verifying...' : 'Claim Referral Code'}
              </button>
            </form>

            {claimStatus && (
              <div
                className={`p-3 rounded-control text-xs font-mono ${
                  claimStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {claimStatus.message}
              </div>
            )}
          </div>

          {/* Guarantee / Safe Anti-Abuse Badge */}
          <div className="p-4 rounded-panel bg-subtle/80 border border-border space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-fg font-mono text-[11px] uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified & Audited Rewards</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Credits earned from referrals never expire and can be combined with other promotional credits on any plan.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="rounded-panel border border-border bg-card p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <HelpCircle className="w-5 h-5 text-violet-600" />
          <h2 className="text-base font-extrabold text-fg tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div
                key={index}
                className="rounded-control border border-border overflow-hidden transition-all bg-bg/20"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-fg hover:bg-subtle transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'rotate-180 text-violet-600' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted leading-relaxed border-t border-border/40 font-mono">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
