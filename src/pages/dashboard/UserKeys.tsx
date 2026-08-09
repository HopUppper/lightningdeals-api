import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserKeys: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('apexscale_token');
      const res = await fetch('/api/user/keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchKeys();
  }, []);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Key className="w-6 h-6 text-amber-500" />
            <span>View Assigned API Keys</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            View your LightningDeals API keys and token balances assigned by your account manager.
          </p>
        </div>

        <Link to="/request-quote" className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold whitespace-nowrap">
          <Mail className="w-4 h-4" />
          <span>Request Token Top-Up</span>
        </Link>
      </div>

      {/* Security Note Banner */}
      <div className="p-4 rounded-panel bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>API keys are assigned directly by LightningDeals administrators upon token package purchase.</span>
        </div>
        <Link to="/request-quote" className="underline font-bold whitespace-nowrap hover:text-fg">
          Request Additional Key
        </Link>
      </div>

      {/* Keys List Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading assigned API keys...</div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted space-y-3">
            <p>No active API keys currently assigned to your account.</p>
            <Link to="/request-quote" className="ui-button-primary text-xs py-2 px-4 inline-flex items-center gap-2 font-bold">
              <Mail className="w-3.5 h-3.5" />
              <span>Contact LightningDeals for Key Assignment</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Masked Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">5h Reset Timer</th>
                  <th className="py-3 px-4">Rolling Allowance</th>
                  <th className="py-3 px-4">Consumed</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">RPM</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-bg/40">
                    <td className="py-3.5 px-4 font-semibold text-fg">{k.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-500">{k.plan || 'Claude Max 20x'}</td>
                    <td className="py-3.5 px-4 font-mono text-muted flex items-center gap-2">
                      <span>{k.displayKey}</span>
                      <button
                        onClick={() => copyText(k.displayKey, k.id)}
                        className="p-1 text-muted hover:text-fg"
                        title="Copy key format"
                      >
                        {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {k.windowActive && k.windowResetSeconds != null ? (
                        <span className="text-amber-500 font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Resets in {Math.floor(k.windowResetSeconds / 3600)}h {Math.floor((k.windowResetSeconds % 3600) / 60)}m
                        </span>
                      ) : (
                        <span className="text-muted text-[10px] bg-subtle px-2 py-0.5 rounded">
                          Starts on 1st use
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-fg">{formatTokens(k.purchasedTokens)} / 5h</td>
                    <td className="py-3.5 px-4 font-mono text-amber-500">{formatTokens(k.tokensUsed)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">{formatTokens(k.tokensRemaining)}</td>
                    <td className="py-3.5 px-4 font-mono text-muted">{k.rateLimitRpm} RPM</td>
                    <td className="py-3.5 px-4 font-mono text-muted">{new Date(k.createdAt).toLocaleDateString()}</td>
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
