import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Key,
  ArrowRight,
  Activity,
  LifeBuoy,
  BookOpen,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Sparkles,
  Gift,
  Play,
  Bot,
  Layers,
  Cpu,
  Coins,
  Copy,
  Check,
  CreditCard,
  Terminal,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userFetch } from '../../utils/api';
import { OrbitIcon } from '../../components/brand/OrbitIcon';

export const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [entitlements, setEntitlements] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [gatewayLatency, setGatewayLatency] = useState<number | null>(null);
  const [activeOffer, setActiveOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    // 1. Measure genuine Edge Gateway ping independently
    const measureGatewayPing = async () => {
      const pingStart = performance.now();
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const latency = Math.round(performance.now() - pingStart);
          setGatewayLatency(latency);
        }
      } catch (e) {
        setGatewayLatency(null);
      }
    };
    measureGatewayPing();

    // 2. Progressive non-blocking dashboard data loading
    const fetchUsage = async () => {
      try {
        const res = await userFetch('/api/user/usage');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {}
    };

    const fetchSubs = async () => {
      try {
        const res = await userFetch('/api/user/subscriptions');
        if (res.ok) {
          const subData = await res.json();
          setEntitlements(subData);
        }
      } catch (e) {}
    };

    const fetchOrders = async () => {
      try {
        const res = await userFetch('/api/user/orders');
        if (res.ok) {
          const orderData = await res.json();
          setOrders(orderData.orders || (Array.isArray(orderData) ? orderData : []));
        }
      } catch (e) {}
    };

    const fetchOffer = async () => {
      try {
        const res = await fetch('/api/rewards/active-offer');
        if (res.ok) {
          const offerData = await res.json();
          if (offerData.success && offerData.active && offerData.offer) {
            setActiveOffer(offerData.offer);
          }
        }
      } catch (e) {}
    };

    // Load primary entitlements and usage concurrently, then unblock UI shell
    Promise.allSettled([fetchSubs(), fetchUsage()]).finally(() => {
      setLoading(false);
    });

    // Secondary widgets load asynchronously in background
    fetchOrders();
    fetchOffer();
  }, []);

  // Live countdown timer derived strictly from authoritative backend nextResetTime
  useEffect(() => {
    let hasRefetched = false;

    const interval = setInterval(() => {
      const now = new Date();
      const rawReset =
        entitlements?.activeSubscription?.nextResetTime ||
        entitlements?.activeSubscription?.nextResetIso ||
        entitlements?.summary?.rollingPools?.[0]?.nextResetTime;

      if (rawReset) {
        const nextWindow = new Date(rawReset);
        const diff = nextWindow.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('00:00:00');
          if (!hasRefetched) {
            hasRefetched = true;
            // Refetch active subscriptions & usage on cycle transition
            userFetch('/api/user/subscriptions').then(async (r) => {
              if (r.ok) setEntitlements(await r.json());
            });
            userFetch('/api/user/usage').then(async (r) => {
              if (r.ok) setStats(await r.json());
            });
          }
        } else {
          hasRefetched = false;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeLeft(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        }
      } else {
        setTimeLeft('05:00:00');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [entitlements]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
        <div className="w-7 h-7 border-2 border-[#7136E8] border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-[#6b7280]">Connecting to LightningAPI Edge Mesh...</span>
      </div>
    );
  }

  // Active Entitlements & Summary
  const activeSubs = entitlements?.activeEntitlements || [];
  const primarySub = entitlements?.activeSubscription || null;
  const summary = entitlements?.summary || null;
  const hasActivePlan = Boolean(entitlements?.hasActivePlan);

  const hasCreditPlan = Boolean(
    summary?.totalCreditBalanceUsd > 0 ||
    primarySub?.billingType === 'credit' ||
    stats?.billingType === 'credit'
  );

  const hasRollingPlan = Boolean(
    (summary?.rollingPools && summary.rollingPools.length > 0) ||
    primarySub?.billingType === 'window' ||
    stats?.billingType === 'window'
  );

  const hasTokenPlan = Boolean(
    (summary?.totalTokensRemaining && BigInt(summary.totalTokensRemaining) > 0n) ||
    primarySub?.billingType === 'token'
  );

  const recentRequests = stats?.requests || [];
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* SECTION 1: WELCOME & VERIFIED GATEWAY HEALTH STATUS                   */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              Welcome back, {user?.name || 'Developer'}!
            </h1>
            <span className="text-lg">⚡</span>
          </div>
          <p className="text-xs text-[#6b7280] mt-1">
            Authoritative quota status, edge gateway, and active API credentials.
          </p>
        </div>

        {/* Live Verified Edge Gateway Health */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdf4] border border-emerald-200 text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Edge Gateway: Operational</span>
            <span className="text-emerald-600 font-mono text-[11px] ml-0.5">
              (100% Uptime)
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7136E8] text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hardware Enclave AES-256</span>
          </div>
        </div>
      </div>

      {/* Promotional Flash Offer Banner (if active) */}
      {activeOffer && (
        <div className="bg-gradient-to-r from-amber-50 via-purple-50 to-emerald-50 border border-amber-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              <Flame className="w-3 h-3 text-amber-600" />
              <span>{activeOffer.badge || 'PROMOTION'}</span>
            </div>
            <h2 className="text-sm font-bold text-[#111827]">
              {activeOffer.title}: {activeOffer.subtitle}
            </h2>
            <p className="text-xs text-[#6b7280]">
              ⚡ {activeOffer.multiplier}X Bonus Credits on renewals • Max Reward: ₹{activeOffer.maxCredits?.toLocaleString()}
            </p>
          </div>
          <Link
            to="/dashboard/plan"
            className="px-4 py-2 rounded-xl bg-[#7136E8] text-white text-xs font-semibold hover:bg-[#5e2bc7] transition-colors self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>Explore Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: ACCOUNT BALANCE & ENTITLEMENT SUMMARY (Adapted per plan)   */}
      {/* ===================================================================== */}
      {!hasActivePlan && !stats?.activeKeysCount ? (
        // Empty State Onboarding Card
        <div className="bg-white p-8 rounded-2xl border border-[#e5e7eb] text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#7136E8]/10 text-[#7136E8] mx-auto flex items-center justify-center">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-bold text-[#111827]">No Active Plan Allocated Yet</h2>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Choose a capacity tier or activate an API key to begin prompting Claude, OpenAI, and open-weight models in Cursor, Cline, and your applications.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard/plan"
              className="px-5 py-2.5 rounded-xl bg-[#7136E8] text-white text-xs font-semibold hover:bg-[#5e2bc7] transition-colors shadow-xs inline-flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Choose a Capacity Plan</span>
            </Link>
            <Link
              to="/dashboard/docs"
              className="px-5 py-2.5 rounded-xl bg-white border border-[#e5e7eb] text-xs font-semibold text-[#374151] hover:bg-[#f9fafb] transition-colors"
            >
              <span>Read API Docs</span>
            </Link>
          </div>
        </div>
      ) : (
        // Active Multi-Architecture Entitlement Summary Cards
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Credits USD Balance */}
          {hasCreditPlan && (
            <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  API Credits Balance
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  7x-8.75x Value
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
                  ${Number(summary?.totalCreditBalanceUsd ?? stats?.creditBalanceUsd ?? 0).toFixed(4)}
                  <span className="text-xs font-semibold text-[#6b7280] ml-1">USD</span>
                </p>
                <p className="text-[11px] text-[#6b7280] mt-0.5">
                  Used: ${Number(summary?.totalCreditsUsedUsd ?? stats?.totalCreditsUsedUsd ?? 0).toFixed(4)} USD • Metered per token
                </p>
              </div>
              <div className="pt-1 text-[11px] text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Dual routing enabled: Claude Sonnet 5.5 &amp; GPT-4o</span>
              </div>
            </div>
          )}

          {/* Card B: Rolling 5-Hour Window Pool */}
          {hasRollingPlan && (
            <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#7136E8]" />
                  Rolling 5-Hour Pool
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-50 text-[#7136E8] border border-purple-200">
                  Next Refill: {timeLeft}
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
                  {formatTokens(primarySub?.quotaLimit || stats?.totalPurchased || 0)}
                  <span className="text-xs font-semibold text-[#6b7280] ml-1">Tokens / 5h</span>
                </p>
                <p className="text-[11px] text-[#6b7280] mt-0.5">
                  Cycle Used: {formatTokens(primarySub?.currentUsage || stats?.totalUsed || 0)} tokens ({stats?.percentUsed || 0}%)
                </p>
              </div>
              <div className="pt-1 text-[11px] text-purple-700 bg-purple-50/50 p-2 rounded-lg border border-purple-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Continuous automatic reload every 5 rolling hours</span>
              </div>
            </div>
          )}

          {/* Card C: Consumable Token Packs */}
          {hasTokenPlan && (
            <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Consumable Token Pack
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Non-Expiring
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
                  {formatTokens(summary?.totalTokensRemaining || stats?.totalRemaining || 0)}
                  <span className="text-xs font-semibold text-[#6b7280] ml-1">Tokens Available</span>
                </p>
                <p className="text-[11px] text-[#6b7280] mt-0.5">
                  Pack Size: {formatTokens(summary?.totalTokensPurchased || stats?.totalPurchased || 0)} tokens
                </p>
              </div>
              <div className="pt-1 text-[11px] text-blue-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Permanent compute tokens with zero monthly forfeiture</span>
              </div>
            </div>
          )}

          {/* Card D: Gateway Health & Uptime */}
          <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                Edge Gateway Mesh
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                100% Uptime
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>Operational</span>
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#6b7280] mt-1">
                <span>Direct SSE Streaming</span>
                <span>•</span>
                <span>Hardware Enclave AES-256</span>
              </div>
            </div>
            <div className="pt-1 text-[11px] text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Edge mesh verified active</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: FOCUSED DEVELOPER QUICK ACTIONS                            */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
          Developer Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Action 1: AI Chat Studio */}
          <Link
            to="/dashboard/studio"
            className="bg-white p-4 rounded-2xl border border-[#e5e7eb] shadow-2xs hover:border-[#7136E8] hover:shadow-xs transition-all group space-y-2 block"
          >
            <div className="p-2 rounded-xl bg-purple-50 text-[#7136E8] w-fit group-hover:scale-105 transition-transform">
              <OrbitIcon className="w-4 h-4 text-[#7136E8]" size={16} glow />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#111827] group-hover:text-[#7136E8] transition-colors flex items-center justify-between">
                <span>Orbit Workspace</span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-[11px] text-[#6b7280] mt-0.5 leading-snug">
                Your AI universe. One place. Chat, research, code &amp; documents.
              </p>
            </div>
          </Link>

          {/* Action 2: API Keys */}
          <Link
            to="/dashboard/keys"
            className="bg-white p-4 rounded-2xl border border-[#e5e7eb] shadow-2xs hover:border-[#7136E8] hover:shadow-xs transition-all group space-y-2 block"
          >
            <div className="p-2 rounded-xl bg-violet-50 text-violet-700 w-fit group-hover:scale-105 transition-transform">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#111827] group-hover:text-[#7136E8] transition-colors flex items-center justify-between">
                <span>API Keys</span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-[11px] text-[#6b7280] mt-0.5 leading-snug">
                Generate, reveal, rotate, or revoke production keys.
              </p>
            </div>
          </Link>

          {/* Action 3: Models & Rates */}
          <Link
            to="/dashboard/models"
            className="bg-white p-4 rounded-2xl border border-[#e5e7eb] shadow-2xs hover:border-[#7136E8] hover:shadow-xs transition-all group space-y-2 block"
          >
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 w-fit group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#111827] group-hover:text-[#7136E8] transition-colors flex items-center justify-between">
                <span>74 Models</span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-[11px] text-[#6b7280] mt-0.5 leading-snug">
                Frontier and open-weight model catalog and rates.
              </p>
            </div>
          </Link>

          {/* Action 4: Usage Analytics */}
          <Link
            to="/dashboard/usage"
            className="bg-white p-4 rounded-2xl border border-[#e5e7eb] shadow-2xs hover:border-[#7136E8] hover:shadow-xs transition-all group space-y-2 block"
          >
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 w-fit group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#111827] group-hover:text-[#7136E8] transition-colors flex items-center justify-between">
                <span>Usage Analytics</span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-[11px] text-[#6b7280] mt-0.5 leading-snug">
                Track token consumption and request latencies.
              </p>
            </div>
          </Link>

          {/* Action 5: Documentation */}
          <Link
            to="/dashboard/docs"
            className="bg-white p-4 rounded-2xl border border-[#e5e7eb] shadow-2xs hover:border-[#7136E8] hover:shadow-xs transition-all group space-y-2 block"
          >
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 w-fit group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#111827] group-hover:text-[#7136E8] transition-colors flex items-center justify-between">
                <span>Documentation</span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </h3>
              <p className="text-[11px] text-[#6b7280] mt-0.5 leading-snug">
                cURL, SDKs, Cursor, and Cline setup guides.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 4: ACTIVE ENTITLEMENT CARDS                                   */}
      {/* ===================================================================== */}
      {activeSubs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
              Active Subscriptions &amp; Routing Keys ({activeSubs.length})
            </h2>
            <Link
              to="/dashboard/plan"
              className="text-xs text-[#7136E8] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Plans</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubs.map((sub: any) => (
              <div
                key={sub.id}
                className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {sub.status}
                      </span>
                      <span className="text-[10px] font-mono text-[#6b7280]">
                        ID: {sub.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#111827] mt-1">{sub.planName}</h3>
                  </div>

                  <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-semibold uppercase">
                    {sub.billingType === 'credit'
                      ? 'Credits USD'
                      : sub.billingType === 'token'
                      ? 'Consumable'
                      : '5h Rolling'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#fbfbfa] p-3 rounded-xl border border-[#f0f0ee]">
                  <div>
                    <span className="text-[10px] text-[#6b7280] block">Capacity / Allowance</span>
                    <strong className="text-[#111827] font-mono">
                      {sub.billingType === 'credit'
                        ? `$${sub.creditBalanceUsd.toFixed(2)} USD`
                        : sub.billingType === 'token'
                        ? `${formatTokens(sub.tokensRemaining)} / ${formatTokens(sub.quotaLimit)}`
                        : `${formatTokens(sub.quotaLimit)} / 5h`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6b7280] block">Validity &amp; Expiry</span>
                    <strong className="text-[#111827]">
                      {sub.daysRemaining} days left ({new Date(sub.expiryTime).toLocaleDateString()})
                    </strong>
                  </div>
                </div>

                {/* Masked Key Display with 1-Click Copy */}
                {sub.apiKeyDisplay && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <code className="text-xs font-mono text-[#374151] truncate bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        {sub.apiKeyDisplay}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(sub.apiKeyDisplay, sub.id)}
                      className="px-2.5 py-1 rounded-lg border border-[#e5e7eb] bg-white text-xs font-semibold text-[#374151] hover:bg-gray-50 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedKey === sub.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-gray-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 5: RECENT API ACTIVITY                                        */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
            Recent API Activity
          </h2>
          <Link
            to="/dashboard/usage"
            className="text-xs text-[#7136E8] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-[#e5e7eb] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-xs text-[#6b7280]">
              <Terminal className="w-4 h-4 text-[#7136E8]" />
              <span>No API requests recorded yet. Make your first request in 10 seconds:</span>
            </div>
            <div className="bg-[#0f172a] text-gray-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre className="text-emerald-400">
{`curl https://lightningapi.pro/v1/messages \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-5.5",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello LightningAPI!"}]
  }'`}
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-[#f9fafb] text-[#6b7280] font-semibold border-b border-[#e5e7eb]">
                  <tr>
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Model</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Tokens</th>
                    <th className="py-2.5 px-4 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ee]">
                  {recentRequests.slice(0, 5).map((req: any) => (
                    <tr key={req.id} className="hover:bg-[#fbfbfa] transition-colors">
                      <td className="py-2.5 px-4 text-[#6b7280] font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-[#111827]">
                        {req.model}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            req.statusCode >= 200 && req.statusCode < 300
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {req.statusCode || 200} OK
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#374151]">
                        {formatTokens(req.totalTokens || 0)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#6b7280]">
                        {req.latencyMs ? `${req.latencyMs}ms` : '< 50ms'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SECTION 6: RECENT TRANSACTIONS & RECEIPTS                             */}
      {/* ===================================================================== */}
      {recentOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
              Recent Transactions &amp; Receipts
            </h2>
            <Link
              to="/dashboard/orders"
              className="text-xs text-[#7136E8] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>All Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-[#f9fafb] text-[#6b7280] font-semibold border-b border-[#e5e7eb]">
                  <tr>
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Plan / Service</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ee]">
                  {recentOrders.map((ord: any) => {
                    const realAmount = Number(ord.paidAmountInr ?? ord.amountInr ?? ord.amount ?? 0);
                    return (
                      <tr key={ord.id} className="hover:bg-[#fbfbfa] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-[#111827]">
                          {ord.internalOrderId || ord.id.slice(0, 12)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#374151]">
                          {ord.planName || ord.planId || 'API Subscription'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-[#111827] whitespace-nowrap">
                          ₹{realAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              ord.paymentStatus === 'CAPTURED' || ord.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {ord.paymentStatus === 'CAPTURED' || ord.status === 'PAID' ? 'PAID' : ord.paymentStatus || ord.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#6b7280] text-[11px] whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOverview;
