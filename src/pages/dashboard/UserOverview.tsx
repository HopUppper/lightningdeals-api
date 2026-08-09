import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Key, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [usageRes, keysRes] = await Promise.all([
          fetch('/api/user/usage'),
          fetch('/api/user/keys'),
        ]);

        if (usageRes.ok) setStats(await usageRes.json());
        if (keysRes.ok) setKeys(await keysRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-muted">Loading account overview...</div>;
  }

  const purchased = Number(stats?.totalPurchased || 0);
  const used = Number(stats?.totalUsed || 0);
  const remaining = Number(stats?.totalRemaining || 0);
  const percentUsed = purchased > 0 ? ((used / purchased) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Welcome back, {user?.name}</h1>
          <p className="text-xs text-muted mt-1">
            5-Hour Rolling Window Token Allowance & Assigned API Keys Overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/request-quote" className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold">
            <Mail className="w-4 h-4" />
            <span>Request Additional Capacity</span>
          </Link>
        </div>
      </div>

      {/* Main Token Balance Card */}
      <div className="bg-card border border-border rounded-panel p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-current" />
            <h2 className="text-lg font-bold text-fg">5-Hour Rolling Window Allowance</h2>
          </div>
          <span className="text-xs font-mono text-emerald-600 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ 5-Hour Rolling Cycle — Auto-Resets
          </span>
        </div>


        <div className="grid sm:grid-cols-3 gap-6">
          <div className="p-5 bg-bg border border-border/80 rounded-control space-y-1">
            <p className="text-xs font-mono text-muted uppercase">Purchased Tokens</p>
            <p className="text-3xl font-extrabold font-mono text-fg">{formatTokens(purchased)}</p>
          </div>

          <div className="p-5 bg-bg border border-border/80 rounded-control space-y-1">
            <p className="text-xs font-mono text-muted uppercase">Tokens Consumed</p>
            <p className="text-3xl font-extrabold font-mono text-amber-500">{formatTokens(used)}</p>
          </div>

          <div className="p-5 bg-bg border border-border/80 rounded-control space-y-1">
            <p className="text-xs font-mono text-muted uppercase">Tokens Remaining</p>
            <p className="text-3xl font-extrabold font-mono text-emerald-500">{formatTokens(remaining)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted font-mono">
            <span>Consumed: {percentUsed}%</span>
            <span>Available: {(100 - Number(percentUsed)).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Number(percentUsed))}%` }}
            />
          </div>
        </div>
      </div>

      {/* API Keys Table Summary */}
      <div className="bg-card border border-border rounded-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-sm font-bold text-fg">Assigned API Keys</h3>
          <Link to="/dashboard/keys" className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
            <span>View All Assigned Keys</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {keys.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">No API keys assigned to your account yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Masked Key</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remaining Tokens</th>
                  <th className="py-2.5 px-3">RPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-bg/40">
                    <td className="py-2.5 px-3 font-semibold text-fg">{k.name}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{k.displayKey}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-fg">{formatTokens(k.tokensRemaining)}</td>
                    <td className="py-2.5 px-3 font-mono text-muted">{k.rateLimitRpm} RPM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
