import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, ShieldCheck, Plus, Trash2, AlertTriangle, X, Lock } from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface ApiKeyItem {
  id: string;
  name: string;
  displayKey: string;
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

  // New Key Modal & State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);

  // Revoke Confirmation State
  const [revokingKey, setRevokingKey] = useState<ApiKeyItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  const [copiedText, setCopiedText] = useState(false);

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

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);

    try {
      const res = await adminFetch('/api/user/keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedSecretKey(data.key.secretKey);
        fetchKeys();
      } else {
        alert('Failed to generate API key. Please check your email verification status.');
      }
    } catch (err) {
      alert('Error creating API key.');
    } finally {
      setCreating(false);
    }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Key className="w-6 h-6 text-violet-600" />
            <span>API Key Management</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Manage your personal Anthropic gateway API keys, inspect statuses, and revoke key credentials.
          </p>
        </div>

        <button
          onClick={() => {
            setNewKeyName('');
            setCreatedSecretKey(null);
            setShowCreateModal(true);
          }}
          className="ui-button-primary text-xs py-2.5 px-4 font-bold gap-2 shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New API Key</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-panel bg-violet-50 border border-violet-200 text-xs text-violet-700 flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
        <span>
          Your API keys grant access to your 5-hour rolling token allowance. Keep keys secure and never expose them in client-side code.
        </span>
      </div>

      {/* Keys List Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted font-mono">Loading API keys...</div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500 font-mono">{error}</div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted space-y-3">
            <p>No API keys created yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="ui-button-primary text-xs py-2 px-4 inline-flex items-center gap-2 font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First API Key</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4">Masked Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">5-Hour Allowance</th>
                  <th className="py-3 px-4">Consumed</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3 px-4 font-bold font-sans text-fg">{k.name}</td>
                    <td className="py-3 px-4 text-violet-600 font-bold">{k.displayKey}</td>
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
                    <td className="py-3 px-4 text-fg">{formatTokens(k.purchasedTokens)}</td>
                    <td className="py-3 px-4 text-amber-600">{formatTokens(k.tokensUsed)}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{formatTokens(k.tokensRemaining)}</td>
                    <td className="py-3 px-4 text-muted text-[10px]">{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {k.status === 'active' && (
                        <button
                          onClick={() => setRevokingKey(k)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <Key className="w-4 h-4 text-violet-600" /> Create New API Key
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-fg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdSecretKey ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-control bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Save this API key securely now.</span>
                    <p className="mt-0.5 text-[11px]">For security reasons, you will not be able to view this full secret key again.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Secret Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdSecretKey}
                      className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control text-fg font-bold"
                    />
                    <button
                      onClick={() => copyToClipboard(createdSecretKey)}
                      className="px-3 py-2 bg-violet-600 text-white rounded-control text-xs font-bold shrink-0 hover:bg-violet-700 flex items-center gap-1"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-2.5 bg-accent text-white text-xs font-bold rounded-control"
                >
                  I Have Saved My Secret Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1.5">Key Description Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Claude Code CLI Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control text-fg focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-control transition-colors disabled:opacity-50"
                >
                  {creating ? 'Generating Key...' : 'Generate API Key'}
                </button>
              </form>
            )}
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
