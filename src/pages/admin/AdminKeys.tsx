import React, { useState, useEffect } from 'react';
import { Key, Plus, Sparkles, Filter, Search, Copy, Check, Trash2, ShieldAlert, RefreshCw, Clock, ArrowRight, Activity } from 'lucide-react';

export const AdminKeys: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Usage Inspector State
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedUsageKey, setSelectedUsageKey] = useState<any | null>(null);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const handleInspectUsage = async (key: any) => {
    setSelectedUsageKey(key);
    setShowUsageModal(true);
    setUsageLoading(true);
    setUsageLogs([]);

    try {
      const res = await fetch(`/api/admin/keys/${key.id}/usage`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsageLogs(data.usage || []);
        if (data.key) setSelectedUsageKey((prev: any) => ({ ...prev, ...data.key }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUsageLoading(false);
    }
  };



  // Create Key Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [tokenAllowance, setTokenAllowance] = useState('20000000'); // 20M default
  const [rateLimitRpm, setRateLimitRpm] = useState('60');
  const [expiryDays, setExpiryDays] = useState('');
  const [plan, setPlan] = useState('Claude Max 20x');
  const [isTrial, setIsTrial] = useState(false);


  // Create Trial Key Dedicated Workflow State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialCustomerName, setTrialCustomerName] = useState('');
  const [trialCustomerEmail, setTrialCustomerEmail] = useState('');
  const [trialTokens, setTrialTokens] = useState('1000000'); // 1M default
  const [trialExpiryDays, setTrialExpiryDays] = useState('7');
  const [trialRpm, setTrialRpm] = useState('30');

  // Output generated raw key state
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('apexscale_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchKeys = async () => {
    try {
      let url = `/api/admin/keys?filter=${filter}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchUsers();
  }, [filter, search]);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreatedRawKey(null);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: keyName,
          userId: selectedUser || null,
          tokenLimit: tokenAllowance,
          rateLimitRpm,
          expiryDays,
          plan,
          isTrial,
        }),
      });

      const data = await res.json();
      if (res.ok && data.rawKey) {
        setCreatedRawKey(data.rawKey);
        fetchKeys();
      } else {
        setModalError(data.error?.message || 'Failed to generate API key.');
      }
    } catch (e: any) {
      setModalError(e.message || 'Network error generating API key.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTrialKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreatedRawKey(null);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/keys/trial', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customerName: trialCustomerName,
          customerEmail: trialCustomerEmail,
          tokenAllowance: trialTokens,
          expiryDays: trialExpiryDays,
          rateLimitRpm: trialRpm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.rawKey) {
        setCreatedRawKey(data.rawKey);
        fetchKeys();
      } else {
        setModalError(data.error?.message || 'Failed to generate trial key.');
      }
    } catch (e: any) {
      setModalError(e.message || 'Network error generating trial key.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleUpdateKey = async (id: string, payload: any) => {
    try {
      await fetch(`/api/admin/keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this API key?')) return;
    try {
      await fetch(`/api/admin/keys/${id}`, { method: 'DELETE' });
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRotateKey = async (key: any) => {
    if (!confirm(`Are you sure you want to rotate key "${key.name}"? The previous key secret will be permanently invalidated.`)) return;
    setSubmitting(true);
    setCreatedRawKey(null);
    setModalError(null);

    try {
      const res = await fetch(`/api/admin/keys/${key.id}/rotate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.rawKey) {
        setCreatedRawKey(data.rawKey);
        setShowCreateModal(true);
        fetchKeys();
      } else {
        alert(data.error?.message || 'Failed to rotate API key.');
      }
    } catch (e: any) {
      alert(e.message || 'Network error rotating API key.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };


  const formatTokens = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val?.toLocaleString() || '0';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">API Key Management</h1>
          <p className="text-xs text-muted mt-1">
            Generate unlimited API keys, create trial keys, configure custom token allowances, and adjust rate limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowTrialModal(true); setCreatedRawKey(null); setModalError(null); }}
            className="ui-button-secondary text-xs py-2 px-3.5 gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Create Trial Key</span>
          </button>

          <button
            onClick={() => { setShowCreateModal(true); setCreatedRawKey(null); setModalError(null); }}
            className="ui-button-primary text-xs py-2 px-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create API Key</span>
          </button>

        </div>
      </div>

      {/* Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-border p-4 rounded-panel shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'suspended', 'trial', 'production'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === tab ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs' : 'text-muted hover:text-fg hover:bg-subtle'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search key, customer..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
          />
        </div>
      </div>

      {/* Keys Table */}
      <div className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-muted">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted">No API keys matching current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg">
                  <th className="py-3 px-4 font-bold">Key Name & Prefix</th>
                  <th className="py-3 px-4 font-bold">Plan Name</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Allowance (5h Window)</th>
                  <th className="py-3 px-4 font-bold">RPM</th>
                  <th className="py-3 px-4 font-bold">Expiry</th>
                  <th className="py-3 px-4 font-bold">Requests</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-subtle">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-fg">{k.name}</p>
                      <p className="font-mono text-[11px] text-muted">{k.displayKey}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-700">{k.plan || 'Claude Max 20x'}</td>
                    <td className="py-3.5 px-4 font-mono text-muted">{k.customer}</td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        k.type === 'trial' ? 'bg-amber-500/10 text-amber-600' : 'bg-accent/10 text-accent'
                      }`}>
                        {k.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-fg font-semibold">{formatTokens(k.tokensUsed)}</span> / {formatTokens(k.tokenLimit)}
                      <p className="text-[10px] text-muted">Remaining: {formatTokens(k.tokensRemaining)}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted">{k.rateLimitRpm} RPM</td>
                    <td className="py-3.5 px-4 font-mono text-muted">
                      {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-fg">{k.totalRequests}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInspectUsage(k)}
                          className="px-2 py-1 rounded text-[10px] font-semibold border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 flex items-center gap-1"
                          title="Inspect 20 latest requests and model token usage"
                        >
                          <Activity className="w-3 h-3" />
                          <span>View Usage</span>
                        </button>

                        <button
                          onClick={() => handleRotateKey(k)}
                          className="px-2 py-1 rounded text-[10px] font-semibold border border-violet-200 bg-white hover:bg-violet-50 text-violet-700 font-mono"
                          title="Generate new cryptographically secure key material"
                        >
                          Rotate
                        </button>

                        <button
                          onClick={() => handleUpdateKey(k.id, { status: k.status === 'active' ? 'suspended' : 'active' })}
                          className="px-2 py-1 rounded text-[10px] font-semibold border border-border bg-white hover:bg-subtle text-fg"
                        >
                          {k.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>

                        {k.status !== 'revoked' && (
                          <button
                            onClick={() => {
                              if (confirm(`Revoke key "${k.name}"? This action cannot be undone.`)) {
                                handleUpdateKey(k.id, { status: 'revoked' });
                              }
                            }}
                            className="px-2 py-1 rounded text-[10px] font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            title="Permanently revoke key"
                          >
                            Revoke
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1 rounded text-muted hover:text-red-600 hover:bg-red-50"
                          title="Delete key record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Activity Modal */}
      {showUsageModal && selectedUsageKey && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <span>Key Usage Activity: {selectedUsageKey.name}</span>
                </h3>
                <p className="text-xs font-mono text-muted mt-1">
                  Key: <span className="text-fg font-bold">{selectedUsageKey.displayKey}</span> | Customer: <span className="text-amber-500 font-semibold">{selectedUsageKey.customer}</span>
                </p>
              </div>
              <button onClick={() => setShowUsageModal(false)} className="text-muted hover:text-fg text-sm font-bold">✕</button>
            </div>

            {usageLoading ? (
              <div className="py-16 text-center text-xs text-muted font-mono">Loading recent 20 request logs...</div>
            ) : (
              <div className="space-y-6 overflow-y-auto pr-1">
                {/* Summary Pill Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg border border-border p-4 rounded-control text-xs font-mono">
                  <div>
                    <span className="text-muted uppercase text-[10px]">Total Requests</span>
                    <p className="font-bold text-fg text-base mt-0.5">{selectedUsageKey.totalRequests?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <span className="text-muted uppercase text-[10px]">Input Tokens</span>
                    <p className="font-bold text-fg text-base mt-0.5">{formatTokens(Number(selectedUsageKey.totalInputTokens || 0))}</p>
                  </div>
                  <div>
                    <span className="text-muted uppercase text-[10px]">Output Tokens</span>
                    <p className="font-bold text-fg text-base mt-0.5">{formatTokens(Number(selectedUsageKey.totalOutputTokens || 0))}</p>
                  </div>
                  <div>
                    <span className="text-muted uppercase text-[10px]">5h Window Remaining</span>
                    <p className="font-bold text-emerald-500 text-base mt-0.5">{formatTokens(Number(selectedUsageKey.tokensRemaining || 0))}</p>
                  </div>
                </div>

                {/* Latest 20 Requests Table */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-fg mb-3 flex items-center justify-between">
                    <span>Latest 20 API Requests</span>
                    <span className="text-[11px] text-muted font-normal">Real-time gateway ledger</span>
                  </h4>

                  <div className="border border-border rounded-panel overflow-hidden bg-bg">
                    {usageLogs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted font-mono">
                        No request logs recorded for this key yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border text-muted font-mono uppercase bg-card/60">
                              <th className="py-2.5 px-3">Timestamp</th>
                              <th className="py-2.5 px-3">Model</th>
                              <th className="py-2.5 px-3">Endpoint</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Input</th>
                              <th className="py-2.5 px-3">Output</th>
                              <th className="py-2.5 px-3">Total Tokens</th>
                              <th className="py-2.5 px-3">Latency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50 font-mono">
                            {usageLogs.map((req: any) => (
                              <tr key={req.id} className="hover:bg-card/50">
                                <td className="py-2.5 px-3 text-muted text-[11px] whitespace-nowrap">
                                  {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-amber-500">{req.model}</td>
                                <td className="py-2.5 px-3 text-fg text-[11px]">{req.endpoint}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    req.statusCode === 200 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                                  }`}>
                                    {req.statusCode} OK
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-muted">{req.inputTokens?.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-muted">{req.outputTokens?.toLocaleString()}</td>
                                <td className="py-2.5 px-3 font-bold text-fg">
                                  <span>{req.totalTokens?.toLocaleString()}</span>
                                  {req.isEstimated && (
                                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-sans" title="Estimated via length heuristics">
                                      ESTIMATED
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-muted">{req.latencyMs} ms</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Modal 1: Create Standard API Key */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-6 shadow-2xl space-y-6">
            {!createdRawKey ? (
              <>
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="text-lg font-bold text-fg">Create Custom API Key</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
                </div>

                {modalError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control text-red-600 text-xs font-semibold">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleCreateApiKey} className="space-y-4">

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Key Name / Description</label>
                    <input
                      type="text"
                      required
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="e.g. Customer - Rahul (Enterprise Pack)"
                      className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Assign to Customer / User (Optional)</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    >
                      <option value="">Unassigned / Direct Key</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">5-Hour Rolling Token Allowance</label>
                      <input
                        type="number"
                        required
                        value={tokenAllowance}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTokenAllowance(val);
                          const numM = Math.round(Number(val || 0) / 1000000);
                          if (numM > 0) setPlan(`Claude Max ${numM}x`);
                        }}
                        placeholder="e.g. 20000000 for 20M / 5h"
                        className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                      <p className="text-[10px] text-amber-500 font-bold font-mono mt-1">
                        Computed: {plan} ({formatTokens(Number(tokenAllowance))} / 5h)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Rate Limit (RPM)</label>
                      <input
                        type="number"
                        required
                        value={rateLimitRpm}
                        onChange={(e) => setRateLimitRpm(e.target.value)}
                        placeholder="60"
                        className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Expiry (Days)</label>
                      <input
                        type="number"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        placeholder="Leave blank for Never"
                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Claude Max Plan Tier</label>
                      <select
                        value={plan}
                        onChange={(e) => {
                          const sel = e.target.value;
                          setPlan(sel);
                          if (sel === 'Claude Max 5x') setTokenAllowance('5000000');
                          else if (sel === 'Claude Max 20x') setTokenAllowance('20000000');
                          else if (sel === 'Claude Max 40x') setTokenAllowance('40000000');
                          else if (sel === 'Claude Max 100x') setTokenAllowance('100000000');
                          else if (sel === 'Claude Max 250x') setTokenAllowance('250000000');
                          else if (sel === 'Trial Key') setTokenAllowance('1000000');
                        }}
                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg font-mono font-bold"
                      >
                        <option value="Claude Max 5x">Claude Max 5x (5M / 5h)</option>
                        <option value="Claude Max 20x">Claude Max 20x (20M / 5h)</option>
                        <option value="Claude Max 40x">Claude Max 40x (40M / 5h)</option>
                        <option value="Claude Max 100x">Claude Max 100x (100M / 5h)</option>
                        <option value="Claude Max 250x">Claude Max 250x (250M / 5h)</option>
                        <option value="Trial Key">Trial Key (1M / 7-day)</option>
                        <option value="Custom Enterprise">Custom Enterprise Allocation</option>
                      </select>
                    </div>
                  </div>


                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 disabled:opacity-50">
                      {submitting ? 'Generating...' : 'Create API Key'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-fg">API Key Generated!</h3>
                <p className="text-xs text-muted">
                  The API key has been created. Copy this key now—it will not be displayed again.
                </p>

                <div className="p-4 bg-bg border border-accent/40 rounded-control font-mono text-xs text-accent break-all select-all flex items-center justify-between gap-2">
                  <span>{createdRawKey}</span>
                  <button onClick={() => copyToClipboard(createdRawKey)} className="p-1 text-muted hover:text-fg">
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button onClick={() => setShowCreateModal(false)} className="ui-button-primary w-full justify-center text-xs py-2.5">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Create Dedicated Trial Key */}
      {showTrialModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-6 shadow-2xl space-y-6">
            {!createdRawKey ? (
              <>
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-fg">Create Dedicated Trial Key</h3>
                  </div>
                  <button onClick={() => setShowTrialModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
                </div>

                {modalError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control text-red-600 text-xs font-semibold">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleCreateTrialKey} className="space-y-4">

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Customer Name (Optional)</label>
                      <input
                        type="text"
                        value={trialCustomerName}
                        onChange={(e) => setTrialCustomerName(e.target.value)}
                        placeholder="e.g. Rahul"
                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Customer Email (Optional)</label>
                      <input
                        type="text"
                        value={trialCustomerEmail}
                        onChange={(e) => setTrialCustomerEmail(e.target.value)}
                        placeholder="e.g. rahul@company.com"
                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>

                  </div>


                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">5-Hour Rolling Token Allowance</label>
                    <input
                      type="number"
                      required
                      value={trialTokens}
                      onChange={(e) => setTrialTokens(e.target.value)}
                      placeholder="1000000"
                      className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                    <p className="text-[10px] text-amber-500 font-mono font-bold mt-1">
                      Computed: Trial Key ({formatTokens(Number(trialTokens))} / 5h window)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Expiry (Days)</label>
                      <input
                        type="number"
                        required
                        value={trialExpiryDays}
                        onChange={(e) => setTrialExpiryDays(e.target.value)}
                        placeholder="7"
                        className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Rate Limit (RPM)</label>
                      <input
                        type="number"
                        required
                        value={trialRpm}
                        onChange={(e) => setTrialRpm(e.target.value)}
                        placeholder="30"
                        className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-control text-[11px] text-amber-500 font-mono">
                    ⚡ 5-hour rolling timer activates upon first customer API call.
                  </div>


                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowTrialModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50">
                      {submitting ? 'Generating...' : 'Generate Trial Key'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-fg">Trial Key Generated!</h3>
                <p className="text-xs text-muted">
                  Send this trial key to your customer. It has been marked as <strong>TRIAL</strong>.
                </p>

                <div className="p-4 bg-bg border border-amber-500/40 rounded-control font-mono text-xs text-amber-600 dark:text-amber-400 break-all select-all flex items-center justify-between gap-2">
                  <span>{createdRawKey}</span>
                  <button onClick={() => copyToClipboard(createdRawKey)} className="p-1 text-muted hover:text-fg">
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button onClick={() => setShowTrialModal(false)} className="ui-button-primary w-full justify-center text-xs py-2.5">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
