import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Trash2, AlertTriangle, Mail, Copy, Check, Eye, EyeOff, Terminal, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../utils/api';

interface ApiKeyItem {
  id: string;
  name: string;
  displayKey: string;
  secretKey?: string;
  keyPrefix: string;
  status: string;
  plan: string;
  purchasedTokens: string;
  tokensUsed: string;
  tokensRemaining: string;
  createdAt: string;
}

export const UserKeys: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedEnvId, setCopiedEnvId] = useState<string | null>(null);

  // Revoke Confirmation State
  const [revokingKey, setRevokingKey] = useState<ApiKeyItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await adminFetch('/api/user/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      } else {
        setError('Unable to load your account data.');
      }
    } catch (e) {
      setError('Unable to load your account data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopyKey = (keyText: string, id: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleCopyEnv = (keyText: string, id: string) => {
    const snippet = `export ANTHROPIC_BASE_URL="https://lightningapi.pro"\nexport ANTHROPIC_AUTH_TOKEN="${keyText}"`;
    navigator.clipboard.writeText(snippet);
    setCopiedEnvId(id);
    setTimeout(() => setCopiedEnvId(null), 2500);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRevokeKey = async () => {
    if (!revokingKey) return;
    setRevoking(true);

    try {
      const res = await adminFetch(`/api/user/keys/${revokingKey.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setKeys(prev => prev.map(k => k.id === revokingKey.id ? { ...k, status: 'revoked' } : k));
        setRevokingKey(null);
      } else {
        alert('Failed to revoke API key.');
      }
    } catch (err) {
      alert('Error revoking API key.');
    } finally {
      setRevoking(false);
    }
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const activeKey = keys.find(k => k.status === 'active');

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Key className="w-6 h-6 text-violet-600" />
            <span>Assigned API Keys</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Access your full, unmasked API keys for Claude Code CLI, Cursor, Windsurf, and custom SDK applications.
          </p>
        </div>

        <Link
          to="/dashboard/support"
          className="ui-button-primary text-xs py-2.5 px-4 font-bold gap-2 shadow-md shrink-0"
        >
          <Mail className="w-4 h-4" />
          <span>Request Additional Key</span>
        </Link>
      </div>

      {/* Security & Key Access Banner */}
      <div className="p-4 rounded-panel bg-violet-500/10 border border-violet-500/20 text-xs text-fg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
          <span>
            <strong>Instant Key Access:</strong> You can copy your <strong>full secret API key</strong> or reveal it below anytime to configure your developer tools.
          </span>
        </div>
        <Link to="/docs" className="font-bold underline text-violet-700 whitespace-nowrap hover:text-violet-900 flex items-center gap-1">
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Quick Setup Guide</span>
        </Link>
      </div>

      {/* Keys List Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted font-mono">Loading API keys...</div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500 font-mono">{error}</div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted space-y-3">
            <p>No active API keys currently assigned to your account.</p>
            <Link
              to="/pricing"
              className="ui-button-primary text-xs py-2 px-4 inline-flex items-center gap-2 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get a Claude Max Plan</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50 text-[11px]">
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4 min-w-[280px]">Secret API Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 font-mono">5-Hour Allowance</th>
                  <th className="py-3 px-4 font-mono">Consumed</th>
                  <th className="py-3 px-4 font-mono">Remaining</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {keys.map((k) => {
                  const isRevealed = Boolean(revealedKeys[k.id]);
                  const rawKey = k.secretKey || k.displayKey;
                  return (
                    <tr key={k.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4 font-bold font-sans text-fg">
                        <div>{k.name}</div>
                        <div className="text-[10px] text-muted font-mono font-normal">{k.plan} · {new Date(k.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 bg-subtle/70 px-2.5 py-1.5 rounded-control border border-border/80 max-w-sm">
                          <span className="font-mono text-xs font-bold text-fg select-all break-all flex-1">
                            {isRevealed ? rawKey : k.displayKey}
                          </span>
                          <button
                            onClick={() => toggleReveal(k.id)}
                            className="p-1 hover:bg-border rounded text-muted hover:text-fg transition-colors"
                            title={isRevealed ? 'Mask Key' : 'Reveal Full Key'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopyKey(rawKey, k.id)}
                            className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs shrink-0"
                            title="Copy Full Key to Clipboard"
                          >
                            {copiedKeyId === k.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-300" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            k.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-fg font-bold">{formatTokens(k.purchasedTokens)}</td>
                      <td className="py-3 px-4 text-amber-600">{formatTokens(k.tokensUsed)}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{formatTokens(k.tokensRemaining)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {k.status === 'active' && (
                            <button
                              onClick={() => setRevokingKey(k)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK TERMINAL & IDE CONFIGURATION WIDGET */}
      {activeKey && (
        <div className="p-6 rounded-panel bg-card border border-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h2 className="text-sm font-bold text-fg flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-600" />
              <span>Quick Terminal & Developer Setup</span>
            </h2>
            <span className="text-[11px] font-mono text-muted">Drop-in Anthropic API Compatible</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: CLI 1-Click Interactive Config */}
            <div className="p-4 rounded-control bg-bg border border-border space-y-2.5">
              <span className="text-[11px] font-mono font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Option A: Auto-Configure via CLI</span>
              </span>
              <p className="text-xs text-muted">
                Run our official interactive CLI tool in your terminal to automatically connect Claude Code, Cursor, and Windsurf:
              </p>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 text-slate-100 font-mono text-xs shadow-inner">
                <code>npx lightningdeals</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npx lightningdeals');
                    setCopiedKeyId('cli-cmd');
                    setTimeout(() => setCopiedKeyId(null), 2000);
                  }}
                  className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-[10px]"
                >
                  {copiedKeyId === 'cli-cmd' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Option B: Environment Variables */}
            <div className="p-4 rounded-control bg-bg border border-border space-y-2.5">
              <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Option B: Environment Variables</span>
              </span>
              <p className="text-xs text-muted">
                Export these variables in your terminal (`~/.bashrc` or `~/.zshrc`) to route traffic through LightningDeals:
              </p>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 text-slate-100 font-mono text-[11px] shadow-inner">
                <code className="truncate max-w-[240px] sm:max-w-xs">
                  export ANTHROPIC_AUTH_TOKEN="{(activeKey.secretKey || activeKey.displayKey).slice(0, 16)}..."
                </code>
                <button
                  onClick={() => handleCopyEnv(activeKey.secretKey || activeKey.displayKey, activeKey.id)}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shrink-0"
                >
                  {copiedEnvId === activeKey.id ? 'Copied Env!' : 'Copy Env'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Key Modal */}
      {revokingKey && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Confirm Key Revocation
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to revoke API key <span className="font-bold text-fg font-mono">{revokingKey.name}</span> ({revokingKey.displayKey})? Any active Claude client using this key will immediately be denied gateway access.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setRevokingKey(null)}
                className="px-4 py-2 rounded-control border border-border text-xs font-bold text-muted hover:text-fg"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeKey}
                disabled={revoking}
                className="px-4 py-2 rounded-control bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                {revoking ? 'Revoking...' : 'Revoke API Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserKeys;
