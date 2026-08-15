import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Mail, ArrowRight, CheckCircle2, Clock, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';

export const UserPlan: React.FC = () => {
  const { user } = useAuth();
  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await adminFetch('/api/user/plan');
        if (res.ok) {
          const data = await res.json();
          setPlanData(data);
        } else {
          setError('Unable to load your account plan data.');
        }
      } catch (err) {
        setError('Unable to load your account plan data.');
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-muted font-mono">Loading plan details...</div>;
  }

  if (error || !planData) {
    return (
      <div className="p-6 bg-card border border-border rounded-panel text-center space-y-4">
        <p className="text-xs text-red-500 font-mono">{error || 'Unable to load your account data.'}</p>
        <button onClick={() => window.location.reload()} className="ui-button-secondary text-xs px-4 py-2">
          Retry
        </button>
      </div>
    );
  }

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Account Plan & Entitlements</h1>
        <p className="text-xs text-muted mt-1">
          View your current subscription tier, 5-hour rolling allowance, and active entitlement status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Plan Details */}
        <div className="lg:col-span-2 bg-card border border-border rounded-panel p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
                CURRENT TIER
              </span>
              <h2 className="text-xl font-bold text-fg mt-2">{planData.planName || 'Enterprise Rolling Gateway'}</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
              ● {planData.status?.toUpperCase() || 'ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-bg border border-border rounded-control space-y-1">
              <p className="text-[11px] text-muted font-mono">5-Hour Allowance</p>
              <p className="text-xl font-extrabold font-mono text-fg">{formatTokens(planData.windowAllowance)}</p>
            </div>

            <div className="p-4 bg-bg border border-border rounded-control space-y-1">
              <p className="text-[11px] text-muted font-mono">Current Remaining</p>
              <p className="text-xl font-extrabold font-mono text-emerald-600">{formatTokens(planData.tokensRemaining)}</p>
            </div>

            <div className="p-4 bg-bg border border-border rounded-control space-y-1">
              <p className="text-[11px] text-muted font-mono">Window Interval</p>
              <p className="text-xl font-extrabold font-mono text-violet-600">5 Hours</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-fg uppercase tracking-wider font-mono">Plan Inclusions</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full Claude Lineup Access (Claude Sonnet 3.7/3.5, Claude Opus 3.5, Claude Fable 5)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Anthropic API Drop-in Compatibility (`/v1/messages`)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sub-45ms Gateway Streaming Latency</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Automatic 5-Hour Rolling Allowance Resets</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Upgrade / Support Card */}
        <div className="bg-card border border-border rounded-panel p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white w-fit shadow-md">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Need Higher Capacity?</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                If your team requires custom 5-hour window allowances, dedicated rate limits, or enterprise SLA agreements, contact our engineering support team.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <Link
              to="/dashboard/support"
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-control transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support for Upgrade</span>
            </Link>

            <a
              href="https://wa.me/917695956938?text=Hi%20LightningDeals!%20I%20want%20to%20upgrade%20my%20API%20plan."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-control transition-colors flex items-center justify-center gap-2"
            >
              <span>WhatsApp Support (+91 7695956938)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPlan;
