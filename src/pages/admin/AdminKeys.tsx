import React, { useState, useEffect } from 'react';
import { Key, Plus, Sparkles, Filter, Search, Copy, Check, Trash2, ShieldAlert, RefreshCw, Clock, ArrowRight, Activity } from 'lucide-react';
import { adminFetch } from '../../utils/api';

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
      const res = await adminFetch(`/api/admin/keys/${key.id}/usage`);
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
  const [billingType, setBillingType] = useState<'credit' | 'window' | 'token'>('credit');
  const [creditBalanceUsd, setCreditBalanceUsd] = useState('7.00');
  const [tokenAllowance, setTokenAllowance] = useState('50000000'); // 50M PRO default
  const [rateLimitRpm, setRateLimitRpm] = useState('60');
  const [expiryDays, setExpiryDays] = useState('');
  const [plan, setPlan] = useState('Credit Starter ($7.00 USD)');
  const [isTrial, setIsTrial] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [keyPrefix, setKeyPrefix] = useState('sk_live_');
  const [modelScope, setModelScope] = useState('all');

  // Providers list state
  const [providers, setProviders] = useState<any[]>([]);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  // Create Trial Key Dedicated Workflow State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialCustomerName, setTrialCustomerName] = useState('');
  const [trialCustomerEmail, setTrialCustomerEmail] = useState('');
  const [trialTokens, setTrialTokens] = useState('200000'); // 200k default
  const [trialExpiryDays, setTrialExpiryDays] = useState('7');
  const [trialRpm, setTrialRpm] = useState('100');
  const [trialProvider, setTrialProvider] = useState('');

  // Output generated raw key state
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit API Key Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editPlan, setEditPlan] = useState('PRO');
  const [editAddTokens, setEditAddTokens] = useState('');
  const [editWithdrawTokens, setEditWithdrawTokens] = useState('');
  const [editAddCreditsUsd, setEditAddCreditsUsd] = useState('');
  const [editWithdrawCreditsUsd, setEditWithdrawCreditsUsd] = useState('');
  const [editOverrideCreditsUsd, setEditOverrideCreditsUsd] = useState('');
  const [editModelScope, setEditModelScope] = useState('all');
  const [editBillingType, setEditBillingType] = useState('window');
  const [editExpiryMode, setEditExpiryMode] = useState('unchanged');
  const [editExpiryDays, setEditExpiryDays] = useState('');
  const [editExpiresAtDate, setEditExpiresAtDate] = useState('');
  const [editRpm, setEditRpm] = useState('60');
  const [editConcurrency, setEditConcurrency] = useState('5');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const openEditModal = (key: any) => {
    setEditingKey(key);
    setEditName(key.name || '');
    setEditStatus(key.status || 'active');
    setEditPlan(key.plan || 'PRO');
    setEditBillingType(key.billingType || 'window');
    setEditModelScope(
      key.allowedModelFamilies && key.allowedModelFamilies.includes('claude') && !key.allowedModelFamilies.includes('deepseek')
        ? 'claude'
        : key.allowedModelFamilies && key.allowedModelFamilies.includes('openai') && !key.allowedModelFamilies.includes('claude')
        ? 'openai'
        : key.allowedModelFamilies && key.allowedModelFamilies.includes('local')
        ? 'local'
        : 'all'
    );
    setEditAddTokens('');
    setEditWithdrawTokens('');
    setEditAddCreditsUsd('');
    setEditWithdrawCreditsUsd('');
    setEditOverrideCreditsUsd('');
    setEditExpiryMode('unchanged');
    setEditExpiryDays('');
    setEditExpiresAtDate(key.expiresAt ? new Date(key.expiresAt).toISOString().split('T')[0] : '');
    setEditRpm(String(key.rateLimitRpm || 60));
    setEditConcurrency(String(key.maxConcurrency || 5));
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveEditKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const payload: any = {
        name: editName,
        status: editStatus,
        plan: editPlan,
        rateLimitRpm: Number(editRpm),
        maxConcurrency: Number(editConcurrency),
      };

      if (editAddTokens && Number(editAddTokens) > 0) {
        payload.addTokens = editAddTokens;
      }

      if (editWithdrawTokens && Number(editWithdrawTokens) > 0) {
        payload.withdrawTokens = editWithdrawTokens;
      }

      if (editAddCreditsUsd && Number(editAddCreditsUsd) > 0) {
        payload.addCreditsUsd = editAddCreditsUsd;
      }

      if (editWithdrawCreditsUsd && Number(editWithdrawCreditsUsd) > 0) {
        payload.withdrawCreditsUsd = editWithdrawCreditsUsd;
      }

      if (editOverrideCreditsUsd !== '') {
        payload.overrideCreditBalanceUsd = editOverrideCreditsUsd;
      }

      if (editBillingType) {
        payload.billingType = editBillingType;
      }

      if (editModelScope === 'claude') {
        payload.allowedModelFamilies = JSON.stringify(['claude']);
      } else if (editModelScope === 'openai') {
        payload.allowedModelFamilies = JSON.stringify(['openai']);
      } else if (editModelScope === 'local') {
        payload.allowedModelFamilies = JSON.stringify(['local', 'deepseek', 'gemini', 'grok', 'glm', 'minimax', 'kimi', 'qwen']);
      } else {
        payload.allowedModelFamilies = 'all';
      }

      if (editExpiryMode !== 'unchanged') {
        payload.expiryMode = editExpiryMode;
        if (editExpiryDays) payload.expiryDays = Number(editExpiryDays);
        if (editExpiresAtDate) payload.expiresAtDate = editExpiresAtDate;
      }

      const res = await adminFetch(`/api/admin/keys/${editingKey.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowEditModal(false);
        await fetchKeys();
      } else {
        const data = await res.json();
        setEditError(data.error?.message || 'Failed to update API key.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error updating API key.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const fetchKeys = async () => {
    try {
      let url = `/api/admin/keys?filter=${filter}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await adminFetch(url);
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
      const res = await adminFetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await adminFetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await adminFetch('/api/admin/plans-catalog');
      if (res.ok) {
        const data = await res.json();
        if (data.plans && Array.isArray(data.plans)) {
          setAvailablePlans(data.plans);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchUsers();
    fetchProviders();
    fetchPlans();
  }, [filter, search]);


  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreatedRawKey(null);
    setModalError(null);

    try {
      let finalAllowedFamilies = 'all';
      if (modelScope === 'claude') {
        finalAllowedFamilies = JSON.stringify(['claude']);
      } else if (modelScope === 'openai') {
        finalAllowedFamilies = JSON.stringify(['openai']);
      } else if (modelScope === 'local') {
        finalAllowedFamilies = JSON.stringify(['local', 'deepseek', 'gemini', 'grok', 'glm', 'minimax', 'kimi', 'qwen']);
      }

      const res = await adminFetch('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify({
          name: keyName,
          userId: selectedUser || null,
          providerId: selectedProvider || undefined,
          billingType,
          creditBalanceUsd: billingType === 'credit' ? Number(creditBalanceUsd || 0) : undefined,
          tokenLimit: billingType !== 'credit' ? tokenAllowance : undefined,
          rateLimitRpm,
          expiryDays,
          plan,
          isTrial,
          keyPrefix,
          allowedModelFamilies: finalAllowedFamilies,
          allowedModels: 'all',
        }),
      });

      const data = await res.json();
      if (res.ok && data.rawKey) {
        setCreatedRawKey(data.rawKey);
        await fetchKeys();
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
      const res = await adminFetch('/api/admin/keys/trial', {
        method: 'POST',
        body: JSON.stringify({
          customerName: trialCustomerName,
          customerEmail: trialCustomerEmail,
          providerId: trialProvider || undefined,
          tokenAllowance: trialTokens,
          expiryDays: trialExpiryDays,
          rateLimitRpm: trialRpm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.rawKey) {
        setCreatedRawKey(data.rawKey);
        await fetchKeys();
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
      const res = await adminFetch(`/api/admin/keys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this API key?')) return;
    try {
      const res = await adminFetch(`/api/admin/keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchKeys();
      }
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
      const res = await adminFetch(`/api/admin/keys/${key.id}/rotate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.rawKey) {
        setCreatedRawKey(data.rawKey);
        setShowCreateModal(true);
        await fetchKeys();
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

  const renderPlatformBadge = (platform?: string, userAgent?: string) => {
    if (!platform) {
      return (
        <span className="text-muted text-[10px] italic">Not detected yet</span>
      );
    }

    const pLower = platform.toLowerCase();

    if (pLower.includes('claude code') || pLower.includes('claude-code')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🤖</span> {platform}
        </span>
      );
    }

    if (pLower.includes('cursor')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-700 border border-cyan-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🎯</span> {platform}
        </span>
      );
    }

    if (pLower.includes('vscode') || pLower.includes('vs code') || pLower.includes('cline') || pLower.includes('roo')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>💻</span> {platform}
        </span>
      );
    }

    if (pLower.includes('windsurf')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-700 border border-teal-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🌊</span> {platform}
        </span>
      );
    }

    if (pLower.includes('python')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🐍</span> {platform}
        </span>
      );
    }

    if (pLower.includes('node') || pLower.includes('typescript') || pLower.includes('js')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🟢</span> {platform}
        </span>
      );
    }

    if (pLower.includes('curl')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 border border-slate-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>⌨️</span> {platform}
        </span>
      );
    }

    if (pLower.includes('playground')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-700 border border-violet-500/20 inline-flex items-center gap-1" title={userAgent || platform}>
          <span>🧪</span> {platform}
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-subtle text-fg border border-border" title={userAgent || platform}>
        {platform}
      </span>
    );
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
            onClick={() => { setShowTrialModal(true); setTrialProvider(''); setCreatedRawKey(null); setModalError(null); }}
            className="ui-button-secondary text-xs py-2 px-3.5 gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Create Trial Key</span>
          </button>

          <button
            onClick={() => { setShowCreateModal(true); setSelectedProvider(''); setCreatedRawKey(null); setModalError(null); }}
            className="ui-button-primary text-xs py-2 px-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create API Key</span>
          </button>

        </div>
      </div>

      {/* Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 technical-panel p-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'suspended', 'trial', 'production'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                filter === tab ? 'bg-accent text-white shadow-xs' : 'text-muted hover:text-fg hover:bg-subtle'
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
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg font-mono"
          />
        </div>
      </div>

      {/* Keys Table */}
      <div className="technical-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-muted">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted">No API keys matching current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted uppercase bg-subtle/50 text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Key Name & Prefix</th>
                  <th className="py-3 px-4 font-bold">Plan Name</th>
                  <th className="py-3 px-4 font-bold">Provider</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Last Platform</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Allowance / Balance</th>
                  <th className="py-3 px-4 font-bold">RPM</th>
                  <th className="py-3 px-4 font-bold">Expiry</th>
                  <th className="py-3 px-4 font-bold">Requests</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <p className="font-bold text-fg">{k.name}</p>
                      <p className="text-[11px] text-muted">{k.displayKey}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={k.billingType === 'credit' ? 'text-emerald-700' : 'text-accent'}>
                        {k.plan || (k.billingType === 'credit' ? 'API Credits' : 'PRO')}
                      </span>
                      {k.billingType === 'credit' && (
                        <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-sans uppercase">
                          Credit
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                        {k.providerName || 'Opus Max'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted">{k.customer}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderPlatformBadge(k.lastPlatform)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        k.type === 'trial' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-accent/10 text-accent border border-accent/20'
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
                      {k.billingType === 'credit' ? (
                        <div>
                          <span className="text-emerald-600 font-extrabold text-xs">
                            ${Number(k.creditBalanceUsd || 0).toFixed(2)} USD
                          </span>
                          <p className="text-[10px] text-muted">Used: ${Number(k.totalCreditsUsedUsd || 0).toFixed(2)} USD</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-fg font-semibold">{formatTokens(k.tokensUsed)}</span> / {formatTokens(k.tokenLimit || k.purchasedTokens)}
                          <p className="text-[10px] text-muted">Remaining: {formatTokens(k.tokensRemaining)}</p>
                        </div>
                      )}
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
                          onClick={() => openEditModal(k)}
                          className="px-2 py-1 rounded text-[10px] font-bold border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 font-sans"
                          title="Edit token balance, validity duration, rate limits, and key settings"
                        >
                          <span>Edit</span>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-panel max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
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
                              <th className="py-2.5 px-3">Platform</th>
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
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {renderPlatformBadge(req.clientPlatform, req.userAgent)}
                                </td>
                                <td className="py-2.5 px-3">
                                  {req.statusCode < 400 ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      <span>Success</span>
                                    </span>
                                  ) : (
                                    <div className="flex flex-col font-sans" title={req.errorMessage || req.errorCode || 'Failed'}>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 inline-flex items-center gap-1 w-fit font-mono">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                        <span>
                                          {req.statusCode === 503
                                            ? '503 (Upstream Outage)'
                                            : req.statusCode === 429
                                            ? '429 (Rate Limit)'
                                            : `${req.statusCode} (${req.errorCode || 'Failed'})`}
                                        </span>
                                      </span>
                                      {req.errorMessage && (
                                        <span className="text-[9px] text-red-400 truncate max-w-[200px] mt-0.5 font-normal">
                                          {req.errorMessage}
                                        </span>
                                      )}
                                    </div>
                                  )}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            {!createdRawKey ? (
              <>
                <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                  <h3 className="text-lg font-bold text-fg">Create Custom API Key</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
                </div>

                {modalError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control text-red-600 text-xs font-semibold shrink-0">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleCreateApiKey} className="space-y-4 overflow-y-auto flex-1 pr-1">

                  {/* 1. Key Identity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Key Name / Description</label>
                      <input
                        type="text"
                        required
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        placeholder="e.g. Customer - Rahul (Credits $25)"
                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Assign to Customer (Optional)</label>
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
                  </div>

                  {/* 2. Key Type / Billing Model Selector */}
                  <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-control space-y-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-violet-900">
                      1. Key Billing Model / Plan Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBillingType('credit');
                          setPlan('Claude + OpenAI Credits ($7.00 USD)');
                          setSelectedProvider(providers.find(p => p.slug === 'scalemax')?.id || '');
                        }}
                        className={`p-2.5 rounded-control border text-left transition-all ${
                          billingType === 'credit'
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-bg text-fg border-border hover:bg-subtle'
                        }`}
                      >
                        <div className="font-bold text-xs">💳 Credit Balance</div>
                        <div className="text-[10px] opacity-80 mt-0.5">$ USD Balance Deductions</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBillingType('window');
                          setPlan('MAX 20X (20M / 5h)');
                          setTokenAllowance('20000000');
                        }}
                        className={`p-2.5 rounded-control border text-left transition-all ${
                          billingType === 'window'
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-bg text-fg border-border hover:bg-subtle'
                        }`}
                      >
                        <div className="font-bold text-xs">🔄 Rolling Pool</div>
                        <div className="text-[10px] opacity-80 mt-0.5">5-Hour Sliding Window</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBillingType('token');
                          setPlan('Local 100M Token Pack');
                          setTokenAllowance('100000000');
                        }}
                        className={`p-2.5 rounded-control border text-left transition-all ${
                          billingType === 'token'
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-bg text-fg border-border hover:bg-subtle'
                        }`}
                      >
                        <div className="font-bold text-xs">📦 Token Pack</div>
                        <div className="text-[10px] opacity-80 mt-0.5">Consumable Lifetime Tokens</div>
                      </button>
                    </div>
                  </div>

                  {/* 3. Dynamic Balance / Allowance Input */}
                  {billingType === 'credit' ? (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-control space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-emerald-800">
                          Initial Credit Balance ($ USD)
                        </label>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">
                          Current: $${Number(creditBalanceUsd || 0).toFixed(2)} USD
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 font-mono font-bold text-fg text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={creditBalanceUsd}
                          onChange={(e) => {
                            setCreditBalanceUsd(e.target.value);
                            setPlan(`API Credits ($${Number(e.target.value || 0).toFixed(2)} USD)`);
                          }}
                          placeholder="e.g. 7.00, 25.00, 50.00"
                          className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-bg border border-border rounded-control focus:outline-none focus:border-emerald-500 text-fg"
                        />
                      </div>
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {['7.00', '25.00', '38.50', '50.00', '100.00', '160.00', '350.00'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setCreditBalanceUsd(preset);
                              setPlan(`API Credits ($${preset} USD)`);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                              creditBalanceUsd === preset
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-bg text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            +$${preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : billingType === 'window' ? (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-control space-y-2">
                      <label className="block text-xs font-semibold text-fg">5-Hour Rolling Token Allowance</label>
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
                      <p className="text-[10px] text-amber-600 font-bold font-mono">
                        Computed: {plan} ({formatTokens(Number(tokenAllowance))} / 5h)
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-control space-y-2">
                      <label className="block text-xs font-semibold text-fg">Consumable Token Quota (Lifetime)</label>
                      <input
                        type="number"
                        required
                        value={tokenAllowance}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTokenAllowance(val);
                          const numM = Math.round(Number(val || 0) / 1000000);
                          if (numM > 0) setPlan(`Token Pack ${numM}M`);
                        }}
                        placeholder="e.g. 100000000 for 100M Consumable"
                        className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                      <p className="text-[10px] text-blue-600 font-bold font-mono">
                        Computed: {plan} ({formatTokens(Number(tokenAllowance))} Lifetime)
                      </p>
                    </div>
                  )}

                  {/* 4. Upstream Provider & Key Format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Upstream Provider</label>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      >
                        <option value="">Default Provider (System Default)</option>
                        {providers.filter((p) => p.status !== 'disabled').map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.status === 'connected' ? 'Connected' : p.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Key Prefix Convention</label>
                      <select
                        value={keyPrefix}
                        onChange={(e) => setKeyPrefix(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      >
                        <option value="sk_live_">sk_live_ (Standard Anthropic / OpenAI Compatible)</option>
                        <option value="ld_live_">ld_live_ (Lightning Deals Standard)</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. Model Scope Permissions */}
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Ecosystem & Model Permissions</label>
                    <select
                      value={modelScope}
                      onChange={(e) => setModelScope(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg font-medium"
                    >
                      <option value="all">Universal (All Models: Claude, OpenAI, Local Models)</option>
                      <option value="claude">Claude Frontier Only (Sonnet 3.7, Opus 4, Sonnet 4, Fable 5)</option>
                      <option value="openai">OpenAI Frontier Only (GPT-4o, o1, o3-mini, GPT-4.5)</option>
                      <option value="local">Local Models Only (DeepSeek V3/R1, Grok, Qwen, GLM)</option>
                    </select>
                    <p className="text-[10px] text-muted mt-1">
                      Enforces gateway authorization. Requests to other model families will be rejected.
                    </p>
                  </div>

                  {/* 6. Rate Limits & Expiry */}
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  <div className="flex justify-end gap-3 pt-2 shrink-0">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            {!createdRawKey ? (
              <>
                <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-fg">Create Dedicated Trial Key</h3>
                  </div>
                  <button onClick={() => setShowTrialModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
                </div>

                {modalError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control text-red-600 text-xs font-semibold shrink-0">
                    {modalError}
                  </div>
                )}

                <form onSubmit={handleCreateTrialKey} className="space-y-4 overflow-y-auto flex-1 pr-1">

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
                    <label className="block text-xs font-semibold text-fg mb-1">Upstream Provider</label>
                    <select
                      value={trialProvider}
                      onChange={(e) => setTrialProvider(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    >
                      <option value="">Default Provider (System Default)</option>
                      {providers.filter((p) => p.status !== 'disabled').map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.status === 'connected' ? 'Connected' : p.status})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted mt-1">
                      Trial key will be bound to this provider ({trialProvider && providers.find(p => p.id === trialProvider)?.name.toLowerCase().includes('opus') ? 'sk_trial_' : 'ld_trial_'}).
                    </p>
                  </div>


                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">5-Hour Rolling Token Allowance</label>
                    <input
                      type="number"
                      required
                      value={trialTokens}
                      onChange={(e) => setTrialTokens(e.target.value)}
                      placeholder="200000"
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


                  <div className="flex justify-end gap-3 pt-2 shrink-0">
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

      {/* Modal 3: Complete API Key Editor (Add/Withdraw Tokens, Modify Expiry/Validity, Status & Settings) */}
      {showEditModal && editingKey && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-panel max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0 sticky top-0 bg-card z-10">
              <div>
                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <span>Edit API Key Configuration</span>
                </h3>
                <p className="text-xs font-mono text-muted mt-1">
                  Key: <span className="text-fg font-bold">{editingKey.displayKey}</span> ({editingKey.name})
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-fg text-sm font-bold">✕</button>
            </div>

            {editError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control text-red-600 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditKey} className="space-y-5">
              {/* Section 1: General Settings */}
              <div className="space-y-3 p-4 rounded-control bg-bg border border-border">
                <h4 className="text-xs font-mono font-bold uppercase text-fg">1. Key Identity & Status</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Key Name / Description</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Key Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    >
                      <option value="active">ACTIVE (Operational)</option>
                      <option value="suspended">SUSPENDED (Temporarily Blocked)</option>
                      <option value="revoked">REVOKED (Permanently Blocked)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Plan Package Tier</label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg font-mono"
                    >
                      {availablePlans.length > 0 ? (
                        availablePlans.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.tokenDisplay || `${Number(p.tokenAllowance) / 1000000}M`})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Max 5x">Max 5x (5M / 5h Window)</option>
                          <option value="MAX 20X">MAX 20X (20M / 5h Window)</option>
                          <option value="MAX 40X">MAX 40X (40M / 5h Window)</option>
                          <option value="MAX 100x">MAX 100x (100M / 5h Window)</option>
                        </>
                      )}
                      <option value="Trial Key">Trial Key</option>
                      <option value="Custom Enterprise">Custom Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Rate Limit (RPM)</label>
                    <input
                      type="number"
                      value={editRpm}
                      onChange={(e) => setEditRpm(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Max Concurrency</label>
                    <input
                      type="number"
                      value={editConcurrency}
                      onChange={(e) => setEditConcurrency(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Token Allowance Management (Add / Withdraw Tokens) */}
              <div className="space-y-3 p-4 rounded-control bg-bg border border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-fg">2. Token Balance Adjustments</h4>
                  <span className="text-[11px] font-mono text-muted">
                    Remaining: <strong className="text-emerald-600">{formatTokens(Number(editingKey.tokensRemaining || 0))}</strong> / {formatTokens(Number(editingKey.purchasedTokens || 0))}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-control space-y-2">
                    <label className="block text-xs font-bold text-emerald-700">Add / Top Up Tokens (+)</label>
                    <input
                      type="number"
                      value={editAddTokens}
                      onChange={(e) => setEditAddTokens(e.target.value)}
                      placeholder="e.g. 5000000 to add +5M"
                      className="w-full px-3 py-2 text-xs font-mono bg-card border border-emerald-500/30 rounded-control focus:outline-none text-fg"
                    />
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => setEditAddTokens('1000000')} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-mono">+1M</button>
                      <button type="button" onClick={() => setEditAddTokens('5000000')} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-mono">+5M</button>
                      <button type="button" onClick={() => setEditAddTokens('20000000')} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-mono">+20M</button>
                      <button type="button" onClick={() => setEditAddTokens('50000000')} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-mono">+50M</button>
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-control space-y-2">
                    <label className="block text-xs font-bold text-red-700">Withdraw / Deduct Tokens (-)</label>
                    <input
                      type="number"
                      value={editWithdrawTokens}
                      onChange={(e) => setEditWithdrawTokens(e.target.value)}
                      placeholder="e.g. 2000000 to remove -2M"
                      className="w-full px-3 py-2 text-xs font-mono bg-card border border-red-500/30 rounded-control focus:outline-none text-fg"
                    />
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => setEditWithdrawTokens('1000000')} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-700 font-mono">-1M</button>
                      <button type="button" onClick={() => setEditWithdrawTokens('5000000')} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-700 font-mono">-5M</button>
                      <button type="button" onClick={() => setEditWithdrawTokens('10000000')} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-700 font-mono">-10M</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Validity & Expiration Controls */}
              <div className="space-y-3 p-4 rounded-control bg-bg border border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-fg">3. Validity & Expiration Date Controls</h4>
                  <span className="text-[11px] font-mono text-muted">
                    Current: <strong className="text-fg">{editingKey.expiresAt ? new Date(editingKey.expiresAt).toLocaleDateString() : 'Permanent (Never Expires)'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-fg mb-1">Validity Action</label>
                    <select
                      value={editExpiryMode}
                      onChange={(e) => setEditExpiryMode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                    >
                      <option value="unchanged">Keep Current Expiry</option>
                      <option value="add_days">Extend Validity (+Days)</option>
                      <option value="reduce_days">Decrease Validity (-Days)</option>
                      <option value="set_date">Set Specific Expiration Date</option>
                      <option value="never">Make Permanent (Never Expires)</option>
                    </select>
                  </div>

                  {editExpiryMode === 'add_days' && (
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Days to Add (+)</label>
                      <input
                        type="number"
                        value={editExpiryDays}
                        onChange={(e) => setEditExpiryDays(e.target.value)}
                        placeholder="e.g. 30 for +30 days"
                        className="w-full px-3 py-2 text-xs font-mono bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>
                  )}

                  {editExpiryMode === 'reduce_days' && (
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Days to Subtract (-)</label>
                      <input
                        type="number"
                        value={editExpiryDays}
                        onChange={(e) => setEditExpiryDays(e.target.value)}
                        placeholder="e.g. 7 for -7 days"
                        className="w-full px-3 py-2 text-xs font-mono bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>
                  )}

                  {editExpiryMode === 'set_date' && (
                    <div>
                      <label className="block text-xs font-semibold text-fg mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={editExpiresAtDate}
                        onChange={(e) => setEditExpiresAtDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting} className="ui-button-primary text-xs py-2.5 px-6 font-bold disabled:opacity-50">
                  {editSubmitting ? 'Saving Changes...' : 'Save API Key Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
