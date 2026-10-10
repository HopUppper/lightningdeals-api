import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Key, ArrowRight, Activity, LifeBuoy, BookOpen, ShieldCheck, Clock, CheckCircle2, AlertCircle, Flame, Sparkles, Gift, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';

export const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activeOffer, setActiveOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  useEffect(() => {
    async function loadData() {
      try {
        const [usageRes, offerRes] = await Promise.all([
          adminFetch('/api/user/usage'),
          fetch('/api/rewards/active-offer'),
        ]);

        if (usageRes.ok) {
          const data = await usageRes.json();
          setStats(data);
        } else {
          setError('Unable to load account usage.');
        }

        if (offerRes.ok) {
          const offerData = await offerRes.json();
          if (offerData.success && offerData.active && offerData.offer) {
            setActiveOffer(offerData.offer);
          }
        }
      } catch (e) {
        setError('Unable to load account usage.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Live countdown timer to next 5-hour window refresh
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

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-7 h-7 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#64607d] font-medium">Loading your studio overview...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-[#ede8e1] shadow-2xs text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-[#1e1b2e]">Unable to load studio stats</h3>
        <p className="text-xs text-[#64607d] max-w-sm mx-auto">{error || 'Please verify your internet connection.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ui-button-secondary text-xs px-4 py-2 cursor-pointer font-bold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const purchased = Number(stats?.totalPurchased || 0);
  const used = Number(stats?.totalUsed || 0);
  const remaining = Number(stats?.totalRemaining || 0);
  const percentUsed = purchased > 0 ? ((used / purchased) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ede8e1] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b2e] tracking-tight">
              Welcome back, {user?.name || 'Creator'}!
            </h1>
            <span className="text-lg">✨</span>
          </div>
          <p className="text-xs text-[#64607d] mt-1">
            Here is your live quota, token balance, and active routing keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gateway Online</span>
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated</span>
          </span>
        </div>
      </div>

      {/* Promotional Flash Offer Card */}
      {activeOffer && (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-violet-50 border border-amber-300/80 p-5 rounded-3xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
              <Flame className="w-3.5 h-3.5 fill-current text-amber-600" />
              <span>{activeOffer.badge || 'PROMO BOOST'}</span>
            </div>
            <h2 className="text-sm font-bold text-[#1e1b2e]">
              {activeOffer.title}: {activeOffer.subtitle}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64607d]">
              <span className="font-bold text-amber-900">
                ⚡ {activeOffer.multiplier}X Bonus Credits
              </span>
              <span>•</span>
              <span>Max Reward: ₹{activeOffer.maxCredits.toLocaleString()} Credits</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/dashboard/plan"
              className="ui-button-primary text-xs px-4 py-2 font-bold shadow-xs"
            >
              <span>Explore Plans</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Main 5-Hour Window Token Allowance Card OR Keyless Empty State */}
      {purchased === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-[#ede8e1] text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 mx-auto flex items-center justify-center shadow-2xs">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-lg font-extrabold text-[#1e1b2e]">No Active API Key Allocated Yet</h2>
            <p className="text-xs text-[#64607d] leading-relaxed">
              Activate your free 1,000,000 token trial or choose a capacity tier to start prompting in Cursor, Claude Code, and Windsurf.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/trial"
              className="ui-button-primary text-xs px-5 py-2.5 font-bold shadow-xs"
            >
              <Key className="w-3.5 h-3.5 mr-1.5" />
              <span>Claim Free 1M Trial Key</span>
            </Link>
            <Link
              to="/pricing"
              className="ui-button-secondary text-xs px-5 py-2.5 font-semibold"
            >
              <span>Browse Capacity Plans</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#ede8e1] space-y-6 shadow-playful">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ede8e1] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-violet-100 text-violet-700">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1e1b2e]">Rolling 5-Hour Token Allowance</h2>
                <p className="text-xs text-[#64607d]">Automatic reset cycle guarantees continuous compute</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#faf8f5] border border-[#ede8e1] text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-[#64607d]">Next Reload:</span>
              <span className="font-bold font-mono text-[#1e1b2e]">{timeLeft}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4.5 bg-[#faf8f5] border border-[#ede8e1] rounded-2xl space-y-1">
              <p className="text-xs font-bold text-[#64607d] uppercase tracking-wider">5-Hour Quota</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1e1b2e]">{formatTokens(purchased)}</p>
              <p className="text-[11px] text-[#64607d]">Tokens per cycle</p>
            </div>

            <div className="p-4.5 bg-[#faf8f5] border border-[#ede8e1] rounded-2xl space-y-1">
              <p className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Used in Cycle</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{formatTokens(used)}</p>
              <p className="text-[11px] text-[#64607d]">Active queries & prompts</p>
            </div>

            <div className="p-4.5 bg-[#faf8f5] border border-[#ede8e1] rounded-2xl space-y-1">
              <p className="text-xs font-bold text-[#64607d] uppercase tracking-wider">Tokens Remaining</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{formatTokens(remaining)}</p>
              <p className="text-[11px] text-emerald-700 font-medium">Ready to spend</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs font-medium text-[#64607d]">
              <span>Spent: <strong className="text-[#1e1b2e]">{percentUsed}%</strong></span>
              <span>Available: <strong className="text-emerald-700">{(100 - Number(percentUsed)).toFixed(1)}%</strong></span>
            </div>
            <div className="h-3 w-full bg-[#faf8f5] rounded-full overflow-hidden border border-[#ede8e1] p-0.5">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, Number(percentUsed)))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Console Shortcuts */}
      <div className="space-y-3.5 pt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#64607d]">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/keys"
            className="bg-white p-5 rounded-3xl border border-[#ede8e1] shadow-2xs hover:border-violet-300 hover:shadow-xs transition-all group space-y-3 block"
          >
            <div className="p-2.5 rounded-2xl bg-violet-100 text-violet-700 w-fit group-hover:scale-105 transition-transform">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1e1b2e] group-hover:text-violet-700 transition-colors">Your API Keys</h4>
              <p className="text-xs text-[#64607d] mt-1 leading-snug">Copy key, reveal secrets, or generate env snippets.</p>
            </div>
          </Link>

          <Link
            to="/dashboard/api-test"
            className="bg-white p-5 rounded-3xl border border-[#ede8e1] shadow-2xs hover:border-violet-300 hover:shadow-xs transition-all group space-y-3 block"
          >
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 w-fit group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1e1b2e] group-hover:text-violet-700 transition-colors">Test in Playground</h4>
              <p className="text-xs text-[#64607d] mt-1 leading-snug">Prompt Claude models and inspect real output live.</p>
            </div>
          </Link>

          <Link
            to="/dashboard/usage"
            className="bg-white p-5 rounded-3xl border border-[#ede8e1] shadow-2xs hover:border-violet-300 hover:shadow-xs transition-all group space-y-3 block"
          >
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 w-fit group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1e1b2e] group-hover:text-violet-700 transition-colors">Usage & Ledger</h4>
              <p className="text-xs text-[#64607d] mt-1 leading-snug">Inspect token deductions and cache hits.</p>
            </div>
          </Link>

          <Link
            to="/dashboard/support"
            className="bg-white p-5 rounded-3xl border border-[#ede8e1] shadow-2xs hover:border-violet-300 hover:shadow-xs transition-all group space-y-3 block"
          >
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 w-fit group-hover:scale-105 transition-transform">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1e1b2e] group-hover:text-violet-700 transition-colors">Customer Support</h4>
              <p className="text-xs text-[#64607d] mt-1 leading-snug">Direct help desk with instant WhatsApp chat.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserOverview;
