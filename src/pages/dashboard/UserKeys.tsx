import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Mail,
  Copy,
  Check,
  Eye,
  EyeOff,
  Terminal,
  Sparkles,
  ExternalLink,
  Activity,
  HelpCircle,
  RefreshCw,
  LogIn,
  Plus,
  RotateCw,
  Layers,
  Zap,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { userFetch } from '../../utils/api';

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
  billingType?: string;
  creditBalanceUsd?: number;
  creditBalanceInr?: number;
  creditBalanceDenomination?: string;
  totalCreditsUsedUsd?: number;
  lastPlatform?: string | null;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export const UserKeys: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedEnvId, setCopiedEnvId] = useState<string | null>(null);

  // Create Key Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyBillingType, setNewKeyBillingType] = useState<'window' | 'credit' | 'token'>('window');
  const [creatingKey, setCreatingKey] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Rotate Confirmation State
  const [rotatingKey, setRotatingKey] = useState<ApiKeyItem | null>(null);
  const [rotating, setRotating] = useState(false);

  // Revoke Confirmation State
  const [revokingKey, setRevokingKey] = useState<ApiKeyItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  // One-Time Secret Key Reveal State
  const [revealedSecretModal, setRevealedSecretModal] = useState<{
    secretKey: string;
    keyName: string;
    displayKey: string;
    billingType?: string;
    isRotation?: boolean;
  } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await userFetch('/api/user/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      } else {
        setError(res.status === 401 || res.status === 403 ? 'Your login session has expired. Please sign in again.' : 'Unable to load assigned keys.');
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

  const handleCopyEnv = (keyText: string, id: string, type: 'anthropic' | 'openai' = 'anthropic') => {
    const snippet = type === 'anthropic'
      ? `export ANTHROPIC_BASE_URL="https://lightningapi.pro"\nexport ANTHROPIC_AUTH_TOKEN="${keyText}"`
      : `export OPENAI_BASE_URL="https://lightningapi.pro/v1"\nexport OPENAI_API_KEY="${keyText}"`;
    navigator.clipboard.writeText(snippet);
    setCopiedEnvId(id + '_' + type);
    setTimeout(() => setCopiedEnvId(null), 2500);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setCreateError('Please provide a key name.');
      return;
    }

    setCreatingKey(true);
    setCreateError(null);
    try {
      const res = await userFetch('/api/user/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          billingType: newKeyBillingType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error?.message || 'Failed to create API key.');
      } else {
        setShowCreateModal(false);
        setNewKeyName('');
        await fetchKeys();

        // Reveal the secret key ONCE
        if (data.key?.secretKey) {
          setRevealedSecretModal({
            secretKey: data.key.secretKey,
            keyName: data.key.name,
            displayKey: data.key.displayKey,
            billingType: data.key.billingType,
            isRotation: false,
          });
        }
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error creating API key.');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRotateKey = async () => {
    if (!rotatingKey) return;
    setRotating(true);
    try {
      const res = await userFetch(`/api/user/keys/${rotatingKey.id}/rotate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRotatingKey(null);
        await fetchKeys();
        if (data.key?.secretKey) {
          setRevealedSecretModal({
            secretKey: data.key.secretKey,
            keyName: data.key.name,
            displayKey: data.key.displayKey,
            isRotation: true,
          });
        }
      } else {
        alert(data.error?.message || 'Failed to rotate API key.');
      }
    } catch (err) {
      alert('Error rotating API key.');
    } finally {
      setRotating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!revokingKey) return;
    setRevoking(true);

    try {
      const res = await userFetch(`/api/user/keys/${revokingKey.id}`, {
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
            Secure client credentials for connecting Claude Code CLI, Cursor, and custom applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="ui-button-primary text-xs px-4 py-2 font-bold gap-1.5 shadow-xs cursor-pointer inline-flex items-center"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Key</span>
          </button>
          <Link
            to="/dashboard/support"
            className="ui-button-secondary text-xs px-3.5 py-2 font-semibold gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-violet-600" />
            <span className="hidden sm:inline">Custom Limits?</span>
          </Link>
        </div>
      </div>

      {/* Friendly Plain-Language Guide Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-white border border-violet-200/80 p-4.5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3 text-[#1e1b2e]">
          <div className="p-2 rounded-xl bg-violet-600 text-white shadow-2xs shrink-0">
            <Sparkles className="w-4 h-4 fill-current text-amber-300" />
          </div>
          <div>
            <p className="font-bold text-[#1e1b2e]">Universal Drop-in Architecture:</p>
            <p className="text-[#64607d] text-[11.5px] mt-0.5">
              Paste your key into Cursor, Windsurf, or terminal exports. Requests authenticate against your plan and deduct from your balance without exposing provider keys.
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
          <div className="py-12 text-center space-y-3 px-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Link to="/login" className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-2xs">Sign In Again</Link>
              <button type="button" onClick={fetchKeys} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer">Retry</button>
            </div>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-14 text-center text-xs text-[#64607d] space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 mx-auto flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-[#1e1b2e]">No active API keys found</p>
            <p className="text-xs">Generate an API key or claim a free trial pass to begin using LightningAPI.</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="ui-button-primary text-xs px-4 py-2 font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Key</span>
              </button>
              <Link
                to="/trial"
                className="ui-button-secondary text-xs px-4 py-2 font-semibold inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>Claim Free Pass</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ede8e1] text-[#64607d] uppercase bg-[#faf8f5] text-[10.5px] font-bold">
                  <th className="py-3.5 px-5">Key Name & Plan</th>
                  <th className="py-3.5 px-5 min-w-[240px]">Key Identifier</th>
                  <th className="py-3.5 px-5">Billing Type</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Spent</th>
                  <th className="py-3.5 px-5">Remaining</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ede8e1] text-xs">
                {keys.map((k) => {
                  const isCredit = k.billingType === 'credit';
                  const isToken = k.billingType === 'token';
                  return (
                    <tr key={k.id} className="hover:bg-[#faf8f5]/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-[#1e1b2e]">{k.name}</div>
                        <div className="text-[11px] text-[#64607d] mt-0.5">
                          {k.plan} • {new Date(k.createdAt).toLocaleDateString()}
                          {k.expiresAt && (
                            <span className="block text-[10.5px] font-mono text-emerald-700 font-semibold mt-0.5">
                              Expires: {new Date(k.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {k.lastPlatform && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Active on {k.lastPlatform}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 bg-[#faf8f5] px-3 py-1.5 rounded-2xl border border-[#ede8e1] max-w-sm">
                          <span className="font-mono text-xs font-semibold text-[#1e1b2e] select-all break-all flex-1">
                            {k.displayKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(k.displayKey, k.id)}
                            className="px-2.5 py-1 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10.5px] flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                            title="Copy Key Identifier"
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#faf8f5] border border-[#ede8e1] text-[#4b4763] uppercase">
                          {isCredit ? 'Credit Wallet' : isToken ? 'Token Pack' : '5h Rolling'}
                        </span>
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
                      <td className="py-4 px-5 text-amber-600 font-semibold font-mono">
                        {isCredit
                          ? `$${(Number(k.totalCreditsUsedUsd) || 0).toFixed(2)} Credits`
                          : formatTokens(k.tokensUsed)}
                      </td>
                      <td className="py-4 px-5 font-bold text-emerald-700 font-mono">
                        {isCredit
                          ? `$${(Number(k.creditBalanceUsd) || Number(k.creditBalanceInr) || 0).toFixed(2)} Credits`
                          : formatTokens(k.tokensRemaining)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {k.status === 'active' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setRotatingKey(k)}
                                className="p-2 rounded-full text-violet-600 hover:bg-violet-50 border border-violet-200 transition-colors cursor-pointer"
                                title="Rotate Key (Generates new secret)"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRevokingKey(k)}
                                className="p-2 rounded-full text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                                title="Revoke Key"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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
              <span>Configure Your IDE or CLI Client</span>
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Universal Drop-in
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Anthropic Format */}
            <div className="p-4.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2.5">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>Anthropic Protocol (Cursor / Claude Code)</span>
              </span>
              <p className="text-xs text-[#64607d] leading-relaxed">
                Export these environment variables or configure them in your settings:
              </p>
              <div className="p-3 rounded-xl bg-white border border-[#ede8e1] font-mono text-[11px] text-[#1e1b2e] space-y-1">
                <div>export ANTHROPIC_BASE_URL="https://lightningapi.pro"</div>
                <div>export ANTHROPIC_AUTH_TOKEN="your_key_secret"</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyEnv(activeKey.displayKey, activeKey.id, 'anthropic')}
                className="w-full py-2 px-3 rounded-xl bg-white border border-[#ede8e1] hover:border-violet-300 font-sans text-xs font-bold text-[#1e1b2e] flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                {copiedEnvId === activeKey.id + '_anthropic' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-violet-600" />}
                <span>{copiedEnvId === activeKey.id + '_anthropic' ? 'Copied Template!' : 'Copy Anthropic Snippet'}</span>
              </button>
            </div>

            {/* Option B: OpenAI Compatible Format */}
            <div className="p-4.5 rounded-2xl bg-[#faf8f5] border border-[#ede8e1] space-y-2.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>OpenAI Compatible Format</span>
              </span>
              <p className="text-xs text-[#64607d] leading-relaxed">
                Use with OpenAI-compatible clients, LangChain, or custom SDK wrappers:
              </p>
              <div className="p-3 rounded-xl bg-white border border-[#ede8e1] font-mono text-[11px] text-[#1e1b2e] space-y-1">
                <div>export OPENAI_BASE_URL="https://lightningapi.pro/v1"</div>
                <div>export OPENAI_API_KEY="your_key_secret"</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyEnv(activeKey.displayKey, activeKey.id, 'openai')}
                className="w-full py-2 px-3 rounded-xl bg-white border border-[#ede8e1] hover:border-violet-300 font-sans text-xs font-bold text-[#1e1b2e] flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                {copiedEnvId === activeKey.id + '_openai' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                <span>{copiedEnvId === activeKey.id + '_openai' ? 'Copied Template!' : 'Copy OpenAI Snippet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#ede8e1] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 text-violet-700 rounded-2xl">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1e1b2e]">Generate New API Key</h3>
                <p className="text-xs text-[#64607d]">Create a separate credential for an IDE or project.</p>
              </div>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateKey} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#1e1b2e] mb-1">
                  Key Name / Description *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Cursor Work Laptop"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ede8e1] text-xs font-medium text-[#1e1b2e] focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e1b2e] mb-1">
                  Billing & Quota Model
                </label>
                <select
                  value={newKeyBillingType}
                  onChange={(e) => setNewKeyBillingType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ede8e1] text-xs font-medium text-[#1e1b2e] focus:outline-none focus:border-violet-600 bg-white"
                >
                  <option value="window">5-Hour Rolling Window Plan</option>
                  <option value="credit">Pay-As-You-Go Usage Credit Wallet</option>
                  <option value="token">Prepaid Non-Expiring Token Pack</option>
                </select>
                <p className="text-[11px] text-[#64607d] mt-1">
                  Key will draw consumption from the chosen account balance category.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ede8e1]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingKey}
                  className="px-4 py-2 rounded-full border border-[#ede8e1] text-xs font-semibold text-[#64607d] hover:bg-[#faf8f5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingKey}
                  className="ui-button-primary text-xs px-5 py-2 font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {creatingKey ? 'Creating Key...' : 'Generate API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Time Secret Key Reveal Modal */}
      {revealedSecretModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#ede8e1] max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1e1b2e]">
                  {revealedSecretModal.isRotation ? 'Key Rotated Successfully' : 'Your New Secret API Key'}
                </h3>
                <p className="text-xs text-[#64607d]">
                  Key: <strong>{revealedSecretModal.keyName}</strong>
                </p>
              </div>
            </div>

            {/* Strict Security Alert */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Save this key now — it will never be displayed again!</span>
              </div>
              <p className="text-[11.5px] text-amber-800 leading-relaxed">
                For security, LightningAPI does not store raw plaintext keys. If you lose this key, you will need to rotate it to generate a new secret.
              </p>
            </div>

            {/* Secret Key Display Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1e1b2e]">Raw Secret Key</label>
              <div className="p-3.5 bg-[#faf8f5] border border-[#ede8e1] rounded-2xl font-mono text-xs text-[#1e1b2e] select-all break-all flex items-center justify-between gap-2">
                <span>{revealedSecretModal.secretKey}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(revealedSecretModal.secretKey);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-sans font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecret ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#ede8e1]">
              <button
                type="button"
                onClick={() => setRevealedSecretModal(null)}
                className="ui-button-primary text-xs px-6 py-2.5 font-bold shadow-xs cursor-pointer"
              >
                I Have Saved My Secret Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotate Confirmation Modal */}
      {rotatingKey && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#ede8e1] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-violet-700">
              <div className="p-3 bg-violet-100 rounded-2xl">
                <RotateCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1e1b2e]">Rotate API Key?</h3>
                <p className="text-xs text-[#64607d]">Invalidate previous secret and generate new material.</p>
              </div>
            </div>

            <p className="text-xs text-[#64607d] leading-relaxed">
              Rotating key <strong className="text-[#1e1b2e] font-mono">{rotatingKey.name}</strong> will immediately disable the old secret key. Any active CLI, Cursor, or app sessions using the old key will fail until updated.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ede8e1]">
              <button
                type="button"
                onClick={() => setRotatingKey(null)}
                disabled={rotating}
                className="px-4 py-2 rounded-full border border-[#ede8e1] text-xs font-semibold text-[#64607d] hover:bg-[#faf8f5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRotateKey}
                disabled={rotating}
                className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {rotating ? 'Rotating...' : 'Yes, Rotate Key'}
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
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
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