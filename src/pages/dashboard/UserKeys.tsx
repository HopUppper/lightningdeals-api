import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Trash2, AlertTriangle, Mail, Copy, Check, Eye, EyeOff, Terminal, Sparkles, ExternalLink, Activity, HelpCircle } from 'lucide-react';
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
        setError('Unable to load assigned keys.');
      }
    } catch (e) {
      setError('Unable to load assigned keys.');
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
    const snippet = `export ANTHROPIC_BASE_URL="https://lightningapi.pro/v1"\nexport ANTHROPIC_AUTH_TOKEN="${keyText}"`;
    navigator.clipboard.writeText(snippet);
    setCopiedEnvId(id);
    setTimeout(() => setCopiedEnvId(null), 2500);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRevokeKey = async () => {
    if (!revokingKey) return;
    setRevoking(true);

    try {
      const res = await adminFetch(`/api/user/keys/${revokingKey.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setKeys((prev) => prev.map((k) => (k.id === revokingKey.id ? { ...k, status: 'revoked' } : k)));
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

  const activeKey = keys.find((k) => k.status === 'active');

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ede8e1] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e1b2e] tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-violet-100 text-violet-700">
              <Key className="w-5 h-5" />
            </div>
            <span>Your Personal API Keys</span>
          </h1>
          <p className="text-xs text-[#64607d] mt-1">
            Your secure credentials for connecting Claude Code CLI, Cursor, and custom applications.
          </p>
        </div>

        <Link
          to="/dashboard/support"
          className="ui-button-secondary text-xs px-4 py-2 font-bold gap-1.5 shrink-0"
        >
          <Mail className="w-3.5 h-3.5 text-violet-600" />
          <span>Need Custom Key Limits?</span>
        </Link>
      </div>

      {/* Friendly Plain-Language Guide Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-white border border-violet-200/80 p-4.5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3 text-[#1e1b2e]">
          <div className="p-2 rounded-xl bg-violet-600 text-white shadow-2xs shrink-0">
            <Sparkles className="w-4 h-4 fill-current text-amber-300" />
          </div>
          <div>
            <p className="font-bold text-[#1e1b2e]">How your API key works:</p>
            <p className="text-[#64607d] text-[11.5px] mt-0.5">
              Copy your secret key once and paste it into Cursor, Windsurf, or your environment file. Your requests automatically draw from your 5-hour rolling token pool.
            </p>
          </div>
        </div>
        <Link
          to="/docs"
          className="font-bold text-violet-700 hover:text-violet-900 whitespace-nowrap flex items-center gap-1 text-xs shrink-0 bg-white px-3 py-1.5 rounded-full border border-violet-200 shadow-2xs"
        >
          <span>Step-by-step Guides</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Keys List Table */}
      <div className="bg-white rounded-3xl border border-[#ede8e1] overflow-hidden shadow-playful">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#64607d]">Loading your assigned API keys...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-rose-500 font-medium">{error}</div>
        ) : keys.length === 0 ? (
          <div className="py-14 text-center text-xs text-[#64607d] space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 mx-auto flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-[#1e1b2e]">No active API keys found</p>
            <p className="text-xs">Claim a free 1M token trial key or purchase a capacity plan to get your first key immediately.</p>
            <Link
              to="/trial"
              className="ui-button-primary text-xs px-5 py-2.5 font-bold shadow-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Claim Free 1M Trial Key</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ede8e1] text-[#64607d] uppercase bg-[#faf8f5] text-[10.5px] font-bold">
                  <th className="py-3.5 px-5">Key Name & Plan</th>
                  <th className="py-3.5 px-5 min-w-[280px]">Secret Key Token</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">5h Quota</th>
                  <th className="py-3.5 px-5">Spent</th>
                  <th className="py-3.5 px-5">Remaining</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ede8e1] text-xs">
                {keys.map((k) => {
                  const isRevealed = Boolean(revealedKeys[k.id]);
                  const rawKey = k.secretKey || k.displayKey;
                  return (
                    <tr key={k.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-[#1e1b2e]">{k.name}</div>
                        <div className="text-[11px] text-[#64607d] mt-0.5">
                          {k.plan} • {new Date(k.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 bg-[#faf8f5] px-3 py-1.5 rounded-2xl border border-[#ede8e1] max-w-sm">
                          <span className="font-mono text-xs font-semibold text-[#1e1b2e] select-all break-all flex-1">
                            {isRevealed ? rawKey : k.displayKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(k.id)}
                            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
                            title={isRevealed ? 'Hide Key' : 'Reveal Key'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(rawKey, k.id)}
                            className="px-2.5 py-1 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10.5px] flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                            title="Copy Key Token"
                          >
                            {copiedKeyId === k.id ? (
                              <>
                                <Check className="w-3 h-3 text-white" />
                                <span>Copied</span>
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
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            k.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-[#1e1b2e]">{formatTokens(k.purchasedTokens)}</td>
                      <td className="py-4 px-5 text-amber-600 font-semibold">{formatTokens(k.tokensUsed)}</td>
                      <td className="py-4 px-5 font-bold text-emerald-700">{formatTokens(k.tokensRemaining)}</td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {k.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => setRevokingKey(k)}
                              className="p-2 rounded-full text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
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
        <div className="bg-white p-6 rounded-3xl border border-[#ede8e1] space-y-4 shadow-playful">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ede8e1] pb-3">
            <h2 className="text-sm font-bold text-[#1e1b2e] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-600" />
              <span>Ready to use this key? Pick your preferred setup:</span>
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Universal Drop-in
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: CLI Interactive */}
            <div className="p-4.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2.5">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>Option 1: Automated Terminal Helper</span>
              </span>
              <p className="text-xs text-[#64607d] leading-relaxed">
                Run this once. It wires Cursor, Claude Code CLI, and Windsurf automatically:
              </p>
              <div className="p-3 rounded-xl bg-white border border-[#ede8e1] font-mono text-xs text-[#1e1b2e] flex items-center justify-between">
                <code>npx lightningdeals</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('npx lightningdeals');
                    alert('Copied npx lightningdeals to clipboard!');
                  }}
                  className="text-violet-700 hover:text-violet-900 font-sans font-bold text-xs cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Option B: Copy Environment Snippet */}
            <div className="p-4.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>Option 2: Copy Environment Variables</span>
              </span>
              <p className="text-xs text-[#64607d] leading-relaxed">
                Copy and paste these exports into your terminal, <code className="text-xs">.bashrc</code>, or <code className="text-xs">.env</code>:
              </p>
              <button
                type="button"
                onClick={() => handleCopyEnv(activeKey.secretKey || activeKey.displayKey, activeKey.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#ede8e1] hover:border-violet-300 font-sans text-xs font-bold text-[#1e1b2e] flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                {copiedEnvId === activeKey.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-violet-600" />}
                <span>{copiedEnvId === activeKey.id ? 'Copied to Clipboard!' : 'Copy Shell Export Snippet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokingKey && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#ede8e1] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1e1b2e]">Revoke API Key?</h3>
                <p className="text-xs text-[#64607d]">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#64607d] leading-relaxed">
              Are you sure you want to revoke key <strong className="text-[#1e1b2e] font-mono">{revokingKey.name}</strong>? Any tools or apps currently connected to this key will immediately lose access.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ede8e1]">
              <button
                type="button"
                onClick={() => setRevokingKey(null)}
                disabled={revoking}
                className="px-4 py-2 rounded-full border border-[#ede8e1] text-xs font-semibold text-[#64607d] hover:bg-[#faf8f5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeKey}
                disabled={revoking}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {revoking ? 'Revoking...' : 'Yes, Revoke Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserKeys;
