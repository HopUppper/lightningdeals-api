import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Key, ArrowRight, Activity, LifeBuoy, BookOpen, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';

export const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminFetch('/api/user/usage');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError('Unable to load your account data.');
        }
      } catch (e) {
        setError('Unable to load your account data.');
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
    return <div className="py-12 text-center text-xs text-muted font-mono">Loading account overview...</div>;
  }

  if (error || !stats) {
    return (
      <div className="p-8 bg-card border border-border rounded-panel text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <p className="text-sm font-semibold text-fg">{error || 'Unable to load your account data.'}</p>
        <button onClick={() => window.location.reload()} className="ui-button-secondary text-xs px-4 py-2">
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
    <div className="space-y-8">
      {/* Header & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Welcome back, {user?.name}</h1>
          <p className="text-xs text-muted mt-1">
            Overview of your active API keys, token consumption, and rolling allowance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> API Status: ACTIVE
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
          </span>
        </div>
      </div>

      {/* Main 5-Hour Window Token Allowance Card OR Keyless Empty State */}
      {purchased === 0 ? (
        <div className="bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-cyan-500/5 border border-violet-500/20 rounded-panel p-8 text-center space-y-5 shadow-lg">
          <div className="inline-flex p-3 rounded-2xl bg-violet-50 text-violet-600 border border-violet-200">
            <Zap className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-fg tracking-tight">No Active Plan / API Key Allocated</h2>
            <p className="text-xs text-muted leading-relaxed">
              Your account currently has no active API key allocations. Select a prepaid token capacity plan or contact our engineering team on WhatsApp to activate your key.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/917695956938?text=${encodeURIComponent(`Hi LightningDeals Team! I just created my account (${user?.email || ''}) and need an API key allocation.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-control font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 shadow-md"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Contact on WhatsApp</span>
            </a>
            <a
              href="/#pricing"
              className="px-5 py-2.5 rounded-control font-bold text-xs bg-violet-600 hover:bg-violet-700 text-white inline-flex items-center gap-2 shadow-md"
            >
              <Key className="w-4 h-4" />
              <span>Browse Token Plans</span>
            </a>
            <Link
              to="/docs"
              className="px-5 py-2.5 rounded-control font-bold text-xs bg-white text-fg border border-border hover:bg-subtle inline-flex items-center gap-2 shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Documentation</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-panel p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-200">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-fg">CURRENT 5-HOUR WINDOW</h2>
                <p className="text-xs text-muted font-mono">Resets automatically every 5 rolling hours</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-bg border border-border text-xs font-mono">
              <Clock className="w-4 h-4 text-violet-600 animate-pulse" />
              <span className="text-muted">Next Window Refresh:</span>
              <span className="font-extrabold text-fg">{timeLeft}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 bg-bg border border-border/80 rounded-control space-y-1">
              <p className="text-[11px] font-mono text-muted uppercase">5-Hour Allowance</p>
              <p className="text-3xl font-extrabold font-mono text-fg">{formatTokens(purchased)}</p>
            </div>

            <div className="p-5 bg-bg border border-border/80 rounded-control space-y-1">
              <p className="text-[11px] font-mono text-muted uppercase">Tokens Consumed</p>
              <p className="text-3xl font-extrabold font-mono text-amber-600">{formatTokens(used)}</p>
            </div>

            <div className="p-5 bg-bg border border-border/80 rounded-control space-y-1">
              <p className="text-[11px] font-mono text-muted uppercase">Tokens Remaining</p>
              <p className="text-3xl font-extrabold font-mono text-emerald-600">{formatTokens(remaining)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted font-mono">
              <span>Consumed: {percentUsed}%</span>
              <span>Available: {(100 - Number(percentUsed)).toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full bg-bg border border-border rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, Number(percentUsed)))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted mb-4">Quick Dashboard Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/api-keys"
            className="p-5 bg-card border border-border rounded-panel hover:border-violet-300 hover:shadow-md transition-all group space-y-3"
          >
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 w-fit border border-violet-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg group-hover:text-violet-600 transition-colors">Manage API Keys</h4>
              <p className="text-xs text-muted mt-1">View, generate, and revoke your API keys.</p>
            </div>
            <div className="text-xs font-bold text-violet-600 flex items-center gap-1 font-mono pt-1">
              <span>Go to API Keys</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/dashboard/usage"
            className="p-5 bg-card border border-border rounded-panel hover:border-violet-300 hover:shadow-md transition-all group space-y-3"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 w-fit border border-emerald-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg group-hover:text-violet-600 transition-colors">View Usage</h4>
              <p className="text-xs text-muted mt-1">Inspect consumption logs and ledger details.</p>
            </div>
            <div className="text-xs font-bold text-violet-600 flex items-center gap-1 font-mono pt-1">
              <span>Go to Usage</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/docs"
            className="p-5 bg-card border border-border rounded-panel hover:border-violet-300 hover:shadow-md transition-all group space-y-3"
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 w-fit border border-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg group-hover:text-violet-600 transition-colors">Documentation</h4>
              <p className="text-xs text-muted mt-1">Setup guides for Claude Code, Cursor, & VS Code.</p>
            </div>
            <div className="text-xs font-bold text-violet-600 flex items-center gap-1 font-mono pt-1">
              <span>Read Docs</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/dashboard/support"
            className="p-5 bg-card border border-border rounded-panel hover:border-violet-300 hover:shadow-md transition-all group space-y-3"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 w-fit border border-amber-200">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-fg group-hover:text-violet-600 transition-colors">Contact Support</h4>
              <p className="text-xs text-muted mt-1">Create and track support tickets with our team.</p>
            </div>
            <div className="text-xs font-bold text-violet-600 flex items-center gap-1 font-mono pt-1">
              <span>Open Help Desk</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserOverview;
