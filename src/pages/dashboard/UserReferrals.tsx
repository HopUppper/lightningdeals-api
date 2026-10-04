import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { userFetch } from '../../utils/api';
import { ThreeDCard } from '../../components/ThreeDCard';

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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Rewarded
        </span>
      );
    }
    if (status === 'REVERSED' || rewardStatus === 'REVERSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          Reversed
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
          <Clock className="w-3 h-3" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock className="w-3 h-3" />
        Pending Purchase
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Refer & Earn Lightning Credits
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Referral Program</h1>
        <p className="text-neutral-400 mt-1 max-w-2xl text-sm leading-relaxed">
          Invite fellow developers to LightningAPI.pro. When they complete their first qualifying purchase, they get their normal Lightning Rewards and you receive matching Referral Credits!
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Main Hero Card: Link & Code */}
          <ThreeDCard className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900/90 via-neutral-900/60 to-amber-950/20 border border-neutral-800 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Gift className="w-6 h-6 text-amber-400" />
                  Your Unique Referral Invite Link
                </h2>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Share this link anywhere — friends who register through your link are attributed to you for{' '}
                  <span className="text-white font-medium">30 days</span>. Minimum qualifying purchase is ₹
                  {data?.settings?.minPurchaseAmountInr || 500}.
                </p>

                {/* Referral Link Box */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-2">
                  <div className="flex-1 bg-black/50 border border-neutral-800 rounded-xl px-4 py-3 font-mono text-xs md:text-sm text-neutral-300 truncate select-all flex items-center">
                    {data?.referralUrl}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs md:text-sm transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copied Link!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center justify-center p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors border border-neutral-700 cursor-pointer"
                      title="Share link"
                    >
                      {shared ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Referral Code Backup */}
                <div className="flex items-center gap-3 pt-2 text-xs text-neutral-400">
                  <span>Referral Code:</span>
                  <span className="font-mono text-white font-bold bg-neutral-800/80 px-2.5 py-1 rounded-md border border-neutral-700">
                    {data?.referralCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-amber-400 hover:text-amber-300 font-medium underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? 'Copied code!' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {/* Stats Highlights */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                  <div className="text-xs text-neutral-400">Total Referrals</div>
                  <div className="text-2xl font-bold text-white mt-1">{data?.stats?.totalReferrals || 0}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Friends attributed</div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                  <div className="text-xs text-emerald-400 font-medium">Successful</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{data?.stats?.successfulReferrals || 0}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Made 1st purchase</div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                  <div className="text-xs text-amber-400 font-medium">Pending</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{data?.stats?.pendingReferrals || 0}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Waiting for purchase</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs text-amber-300 font-medium">Credits Earned</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    ₹{(data?.stats?.creditsEarned || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Added to your balance</div>
                </div>
              </div>
            </div>
          </ThreeDCard>

          {/* How It Works Section */}
          <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800/80 p-6">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              How Referrals Work
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/60 relative">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xs mb-2">
                  1
                </div>
                <h4 className="text-sm font-semibold text-white">Share Your Link</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Send your unique invite link or 8-character code to friends, coworkers, or your team.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/60 relative">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xs mb-2">
                  2
                </div>
                <h4 className="text-sm font-semibold text-white">Friend Registers</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  They create a free LightningAPI.pro account. Attribution is securely recorded for 30 days.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/60 relative">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-xs mb-2">
                  3
                </div>
                <h4 className="text-sm font-semibold text-white">Qualifying Purchase</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Your friend makes their first purchase (min ₹{data?.settings?.minPurchaseAmountInr || 500}).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/60 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs mb-2">
                  4
                </div>
                <h4 className="text-sm font-semibold text-white">Both Earn Credits ⚡</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Your friend receives their purchase reward, and you receive matching Referral Credits!
                </p>
              </div>
            </div>
          </div>

          {/* Referrals List Table */}
          <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800/80 overflow-hidden">
            <div className="p-6 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Your Referrals
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time status of all friends attributed to your account.
                </p>
              </div>

              {/* Enter an invite code form */}
              <form onSubmit={handleClaim} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Enter a friend's code"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 uppercase font-mono w-44"
                />
                <button
                  type="submit"
                  disabled={claiming || !claimCode.trim()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-medium transition-colors border border-neutral-700 cursor-pointer"
                >
                  {claiming ? 'Claiming...' : 'Claim'}
                </button>
              </form>
            </div>

            {claimStatus && (
              <div
                className={`p-3 text-xs border-b ${
                  claimStatus.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {claimStatus.message}
              </div>
            )}

            {!data?.referrals || data.referrals.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white">No Referrals Yet</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Share your link with fellow developers to start earning matching credits on their first purchase!
                </p>
                <button
                  onClick={handleCopyLink}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Invite Link
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/60 text-neutral-400 border-b border-neutral-800 font-medium">
                    <tr>
                      <th className="py-3 px-4">Friend</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">First Purchase</th>
                      <th className="py-3 px-4 text-right">Credits Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {data.referrals.map((refItem: any) => (
                      <tr key={refItem.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{refItem.displayName}</td>
                        <td className="py-3 px-4">{getStatusBadge(refItem.status, refItem.rewardStatus)}</td>
                        <td className="py-3 px-4 text-neutral-400">
                          {new Date(refItem.joinedDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {refItem.firstPurchaseAmount !== null
                            ? `₹${refItem.firstPurchaseAmount.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-amber-400">
                          {refItem.creditsEarned > 0 ? `+₹${refItem.creditsEarned.toLocaleString()}` : '₹0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default UserReferrals;
