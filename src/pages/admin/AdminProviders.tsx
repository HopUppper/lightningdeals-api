import React, { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, CheckCircle2, XCircle, ShieldAlert, Edit2, Code, DollarSign, Activity, Layers, FileText, ArrowUpRight, CloudDownload } from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface VendorProviderItem {
  id: string;
  name: string;
  providerType: string;
  protocol: string;
  baseUrl: string;
  baseUrlHostname?: string;
  displayMasterKey: string;
  status: string;
  isPrimary: boolean;
  isDefault?: boolean;
  availableTokens: string;
  purchasedTokens: string;
  consumedTokens: string;
  reservedTokens?: string;
  warningThresholdTokens: string;
  criticalThresholdTokens: string;
  modelMappingsJson?: string;
  headersJson?: string;
  lastTestedAt?: string;
  lastError?: string;
  notes?: string;
  activeKeyCount?: number;
  totalKeyCount?: number;
  requestCount?: number;
  errorRate?: number;
  avgLatencyMs?: number;
}

export const AdminProviders: React.FC = () => {
  const [providers, setProviders] = useState<VendorProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<VendorProviderItem | null>(null);

  // Vendor Form State
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState('anthropic');
  const [protocol, setProtocol] = useState('anthropic');
  const [masterApiKey, setMasterApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.anthropic.com');
  const [isPrimary, setIsPrimary] = useState(false);
  const [status, setStatus] = useState('connected');
  const [warningThresholdTokens, setWarningThresholdTokens] = useState('20000000');
  const [criticalThresholdTokens, setCriticalThresholdTokens] = useState('5000000');
  const [availableTokens, setAvailableTokens] = useState('100000000');
  const [modelMappingsJson, setModelMappingsJson] = useState('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
  const [headersJson, setHeadersJson] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Master Balance & Top-Up State
  const [balanceMetrics, setBalanceMetrics] = useState<any | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('100000000'); // 100M default
  const [topUpReference, setTopUpReference] = useState('');
  const [topUpNotes, setTopUpNotes] = useState('');
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  // Master Ledger State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [reconcileResult, setReconcileResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'providers' | 'ledger'>('providers');

  // Sync Vendor Balance State
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [showProbeLogs, setShowProbeLogs] = useState(false);

  // Test Connection State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});

  // Failover & Routing State
  const [failoverConfig, setFailoverConfig] = useState<any>({
    enableAutoFailover: true,
    primaryProviderId: '',
    fallbackProviderId: '',
    defaultProviderId: '',
  });
  const [savingFailover, setSavingFailover] = useState(false);

  // Key Migration State
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [migrateSourceId, setMigrateSourceId] = useState('');
  const [migrateTargetId, setMigrateTargetId] = useState('');
  const [migrateReason, setMigrateReason] = useState('');
  const [migratingKeys, setMigratingKeys] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any>(null);

  const fetchProviders = async () => {
    try {
      const res = await adminFetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
        const primary = data.find((p: any) => p.isPrimary) || data[0];
        if (primary) {
          fetchBalanceMetrics(primary.id);
          fetchLedger(primary.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFailoverConfig = async () => {
    try {
      const res = await adminFetch('/api/admin/providers/failover-config');
      if (res.ok) {
        setFailoverConfig(await res.json());
      }
    } catch (e) {}
  };

  const handleSetDefaultProvider = async (providerId: string) => {
    try {
      const res = await adminFetch(`/api/admin/providers/${providerId}/set-default`, { method: 'POST' });
      if (res.ok) {
        await fetchProviders();
        await fetchFailoverConfig();
      }
    } catch (e) {}
  };

  const handleUpdateFailover = async (newConfig: any) => {
    setSavingFailover(true);
    try {
      const res = await adminFetch('/api/admin/providers/failover-config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setFailoverConfig(data.config);
      }
    } catch (e) {} finally {
      setSavingFailover(false);
    }
  };

  const handleExecuteMigration = async () => {
    if (!migrateTargetId) return;
    setMigratingKeys(true);
    setMigrateResult(null);
    try {
      const res = await adminFetch('/api/admin/providers/migrate-keys', {
        method: 'POST',
        body: JSON.stringify({
          sourceProviderId: migrateSourceId || undefined,
          targetProviderId: migrateTargetId,
          reason: migrateReason || 'Admin console migration',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMigrateResult(data);
        await fetchProviders();
      } else {
        setMigrateResult({ error: data?.error?.message || 'Migration failed' });
      }
    } catch (e: any) {
      setMigrateResult({ error: e.message });
    } finally {
      setMigratingKeys(false);
    }
  };

  const fetchBalanceMetrics = async (providerId: string) => {
    try {
      const res = await adminFetch(`/api/admin/providers/${providerId}/balance`);
      if (res.ok) {
        setBalanceMetrics(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLedger = async (providerId: string) => {
    try {
      const res = await adminFetch(`/api/admin/providers/${providerId}/ledger`);
      if (res.ok) {
        setLedgerEntries(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchFailoverConfig();
  }, []);

  const openCreateModal = () => {
    setEditingProvider(null);
    setName('Opus Max');
    setProviderType('custom_http');
    setProtocol('anthropic');
    setMasterApiKey('');
    setBaseUrl('');
    setIsPrimary(false);
    setStatus('connected');
    setWarningThresholdTokens('20000000');
    setCriticalThresholdTokens('5000000');
    setAvailableTokens('100000000');
    setModelMappingsJson('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
    setHeadersJson('');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const applyPreset = (preset: 'opus_max' | 'scalemax' | 'anthropic_direct' | 'openai_compat') => {
    if (preset === 'opus_max') {
      setName('Opus Max');
      setProviderType('custom_http');
      setProtocol('anthropic');
      setModelMappingsJson('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
    } else if (preset === 'scalemax') {
      setName('ScaleMax');
      setProviderType('custom_http');
      setProtocol('anthropic');
      setBaseUrl('https://api2.scalemax.pro');
      setModelMappingsJson('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
    } else if (preset === 'anthropic_direct') {
      setName('Anthropic Official');
      setProviderType('anthropic');
      setProtocol('anthropic');
      setBaseUrl('https://api.anthropic.com');
      setModelMappingsJson('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
    } else if (preset === 'openai_compat') {
      setName('OpenAI Gateway');
      setProviderType('openai');
      setProtocol('openai-compatible');
      setModelMappingsJson('{\n  "claude-sonnet-5": "gpt-4o",\n  "claude-opus-5": "o3-mini"\n}');
    }
  };

  const openEditModal = (p: VendorProviderItem) => {
    setEditingProvider(p);
    setName(p.name);
    setProviderType(p.providerType || 'anthropic');
    setProtocol(p.protocol || p.providerType || 'anthropic');
    setMasterApiKey('');
    setBaseUrl(p.baseUrl);
    setIsPrimary(p.isPrimary);
    setStatus(p.status || 'connected');
    setWarningThresholdTokens(p.warningThresholdTokens || '20000000');
    setCriticalThresholdTokens(p.criticalThresholdTokens || '5000000');
    setAvailableTokens(p.availableTokens || '100000000');
    setModelMappingsJson(p.modelMappingsJson || '');
    setHeadersJson(p.headersJson || '');
    setNotes(p.notes || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleToggleStatus = async (provider: VendorProviderItem) => {
    const newStatus = provider.status === 'disabled' ? 'connected' : 'disabled';
    try {
      const res = await adminFetch(`/api/admin/providers/${provider.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchProviders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const url = editingProvider ? `/api/admin/providers/${editingProvider.id}` : '/api/admin/providers';
    const method = editingProvider ? 'PUT' : 'POST';

    try {
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify({
          name: name.trim(),
          providerType,
          protocol,
          masterApiKey: masterApiKey ? masterApiKey.trim() : undefined,
          baseUrl: baseUrl.trim(),
          isPrimary,
          status,
          warningThresholdTokens,
          criticalThresholdTokens,
          availableTokens,
          modelMappingsJson: modelMappingsJson.trim() || undefined,
          headersJson: headersJson.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setShowModal(false);
        await fetchProviders();
      } else {
        setFormError(resData?.error?.message || 'Failed to save vendor configuration.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error saving vendor configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpSubmitting(true);
    setTopUpError(null);

    const primary = providers.find((p) => p.isPrimary) || providers[0];
    if (!primary) {
      setTopUpError('No active vendor provider found to top up.');
      setTopUpSubmitting(false);
      return;
    }

    try {
      const res = await adminFetch(`/api/admin/providers/${primary.id}/topup`, {
        method: 'POST',
        body: JSON.stringify({
          amountTokens: topUpAmount,
          reference: topUpReference.trim(),
          notes: topUpNotes.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setShowTopUpModal(false);
        setTopUpReference('');
        setTopUpNotes('');
        await fetchProviders();
        await fetchBalanceMetrics(primary.id);
        await fetchLedger(primary.id);
      } else {
        setTopUpError(resData?.error?.message || 'Failed to process master top-up.');
      }
    } catch (e: any) {
      setTopUpError(e.message || 'Network error executing top-up.');
    } finally {
      setTopUpSubmitting(false);
    }
  };

  const handleReconcileLedger = async (autoFix = false) => {
    const primary = providers.find((p) => p.isPrimary) || providers[0];
    if (!primary) return;

    try {
      const res = await adminFetch(`/api/admin/providers/${primary.id}/reconcile`, {
        method: 'POST',
        body: JSON.stringify({ autoFix }),
      });
      if (res.ok) {
        const data = await res.json();
        setReconcileResult(data);
        if (data.fixed) {
          await fetchProviders();
          await fetchBalanceMetrics(primary.id);
          await fetchLedger(primary.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncVendorBalance = async (providerId: string) => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${providerId}/sync-balance`, {
        method: 'POST',
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.synced) {
        await fetchProviders();
      }
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async (providerId: string, masterKey?: string, url?: string, proto?: string) => {
    setTestingId(providerId);
    try {
      const res = await adminFetch('/api/admin/providers/test', {
        method: 'POST',
        body: JSON.stringify({
          providerId,
          masterApiKey: masterKey,
          baseUrl: url,
          protocol: proto,
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [providerId]: data }));
      await fetchProviders();
    } catch (e: any) {
      setTestResults((prev) => ({ ...prev, [providerId]: { status: 'unavailable', message: e.message } }));
    } finally {
      setTestingId(null);
    }
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const getStatusBadge = (status: string, hasKey = true, availableTokensVal?: string | number) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONNECTED' || s === 'HEALTHY' || s === 'OPERATIONAL' || s === 'ACTIVE') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">● CONNECTED</span>;
    }
    if (s === 'AUTHENTICATION_FAILED' || s === 'INVALID_CREDENTIAL' || s === 'INVALID_KEY') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30">❌ AUTHENTICATION_FAILED</span>;
    }
    if (s === 'UNREACHABLE' || s === 'UNAVAILABLE' || s === 'SSRF_BLOCKED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">⚠️ UNREACHABLE</span>;
    }
    if (s === 'INVALID_RESPONSE' || s === 'PROVIDER_ERROR') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30">⚠️ INVALID_RESPONSE</span>;
    }
    if (s === 'DISABLED' || s === 'NOT_CONFIGURED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/30 text-muted border border-border">⚪ DISABLED</span>;
    }
    if (s === 'WARNING') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">⚠️ WARNING (LOW)</span>;
    }
    if (s === 'CRITICAL') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 font-mono animate-pulse">🚨 CRITICAL</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/30 text-muted border border-border">{s}</span>;
  };

  const primaryProvider = providers.find((p) => p.isPrimary) || providers[0];
  const primaryHasKey = Boolean(primaryProvider && primaryProvider.displayMasterKey && primaryProvider.displayMasterKey !== 'Not Set');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Server className="w-6 h-6 text-violet-600" />
            <span>Master Vendor Balance & Capacity Control</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Authoritative database token ledger, master balance top-ups, customer entitlement exposure, and SSRF-hardened provider routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTopUpModal(true)}
            className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs"
          >
            <DollarSign className="w-4 h-4" />
            <span>Top Up Master Balance</span>
          </button>
          <button onClick={openCreateModal} className="ui-button-secondary text-xs py-2 px-3.5 gap-2 font-bold">
            <Plus className="w-4 h-4" />
            <span>Add Custom Vendor</span>
          </button>
        </div>
      </div>

      {/* Universal Multi-Provider Gateway Control Bar */}
      <div className="bg-gradient-to-r from-violet-950/20 via-background to-indigo-950/20 border border-violet-500/30 rounded-panel p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-fg font-sans">Multi-Provider API Gateway Routing</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 border border-violet-500/20">
                SCALEMAX + OPUS MAX
              </span>
            </div>
            <p className="text-xs text-muted">
              Configure default provider for newly issued keys, monitor connection status, and configure automated zero-downtime failover.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setShowMigrateModal(true);
                setMigrateResult(null);
                const sm = providers.find((p) => p.name.toLowerCase().includes('scale'));
                const op = providers.find((p) => p.name.toLowerCase().includes('opus'));
                if (sm) setMigrateSourceId(sm.id);
                if (op) setMigrateTargetId(op.id);
              }}
              className="px-3 py-1.5 rounded-control text-xs font-bold border border-indigo-500/30 text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Bulk Migrate Keys</span>
            </button>
          </div>
        </div>

        {/* Provider Status & Routing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/60">
          {/* Default Provider Switcher */}
          <div className="p-3.5 rounded-control bg-bg/60 border border-border space-y-2">
            <span className="text-[11px] font-mono text-muted uppercase font-bold">Default Provider for New Keys</span>
            <div className="flex items-center gap-2">
              <select
                value={failoverConfig.defaultProviderId || providers.find((p) => p.isDefault)?.id || ''}
                onChange={(e) => handleSetDefaultProvider(e.target.value)}
                className="w-full text-xs font-mono font-bold py-1.5 px-2.5 rounded border border-border bg-card text-fg focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status === 'connected' ? '● Online' : '○ ' + p.status}) {p.isDefault ? '★ (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-muted">
              New customer API keys will be provisioned using this upstream provider.
            </p>
          </div>

          {/* Failover Mode */}
          <div className="p-3.5 rounded-control bg-bg/60 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted uppercase font-bold">Automated Provider Failover</span>
              <button
                disabled={savingFailover}
                onClick={() => handleUpdateFailover({ ...failoverConfig, enableAutoFailover: !failoverConfig.enableAutoFailover })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                  failoverConfig.enableAutoFailover
                    ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                    : 'bg-muted/40 text-muted border border-border'
                }`}
              >
                {failoverConfig.enableAutoFailover ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted text-[11px]">Primary:</span>
              <select
                value={failoverConfig.primaryProviderId || ''}
                onChange={(e) => handleUpdateFailover({ ...failoverConfig, primaryProviderId: e.target.value })}
                className="text-[11px] font-mono py-1 px-2 rounded border border-border bg-card text-fg"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted text-[11px]">Fallback:</span>
              <select
                value={failoverConfig.fallbackProviderId || ''}
                onChange={(e) => handleUpdateFailover({ ...failoverConfig, fallbackProviderId: e.target.value })}
                className="text-[11px] font-mono py-1 px-2 rounded border border-border bg-card text-fg"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Connection Diagnostics */}
          <div className="p-3.5 rounded-control bg-bg/60 border border-border space-y-2">
            <span className="text-[11px] font-mono text-muted uppercase font-bold">Live Provider Health</span>
            <div className="space-y-1.5">
              {providers.map((p) => {
                const res = testResults[p.id];
                return (
                  <div key={p.id} className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-fg flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${p.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {p.name}
                    </span>
                    <button
                      onClick={() => handleTestConnection(p.id)}
                      disabled={testingId === p.id}
                      className="px-2 py-0.5 rounded text-[10px] font-bold border border-border hover:bg-card text-muted hover:text-fg transition-colors inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${testingId === p.id ? 'animate-spin' : ''}`} />
                      <span>{testingId === p.id ? 'Pinging...' : res ? `${res.status} (${res.latencyMs || 0}ms)` : 'Ping'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Master Vendor Balance Control Center Card */}
      <div className="bg-card border border-border rounded-panel p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-fg font-mono">Vendor Master Token Balance</h2>
              {getStatusBadge(balanceMetrics?.status || primaryProvider?.status || 'NOT_CONFIGURED', primaryHasKey)}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Active Upstream Provider: <span className="font-semibold text-fg">{primaryProvider?.name || 'No Provider Configured'}</span> ({primaryProvider?.displayMasterKey || 'Not Set'})
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {primaryProvider && (
              <button
                onClick={() => handleSyncVendorBalance(primaryProvider.id)}
                disabled={syncing}
                className="ui-button-primary text-xs py-1.5 px-3 gap-1.5 font-mono bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs disabled:opacity-50"
              >
                <CloudDownload className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Vendor Balance'}</span>
              </button>
            )}
            <button
              onClick={() => handleReconcileLedger(false)}
              className="ui-button-secondary text-xs py-1.5 px-3 gap-1.5 font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Audit Reconcile Ledger</span>
            </button>
          </div>
        </div>

        {/* Master Balance KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-control bg-bg border border-border space-y-1">
            <p className="text-[11px] text-muted uppercase font-bold">Available Master Tokens</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatTokens(balanceMetrics?.availableTokens ?? primaryProvider?.availableTokens ?? 0)}
            </p>
            <p className="text-[10px] text-muted">Prepaid capacity available for customer completions</p>
          </div>

          <div className="p-4 rounded-control bg-bg border border-border space-y-1">
            <p className="text-[11px] text-muted uppercase font-bold font-mono">Active 5h Entitlement Exposure</p>
            <p className="text-2xl font-bold text-violet-600">
              {formatTokens(balanceMetrics?.exposure?.active5hWindowAllowance || '0')}
            </p>
            <p className="text-[10px] text-muted">Sum of active customer 5-hour rolling allowances</p>
          </div>

          <div className="p-4 rounded-control bg-bg border border-border space-y-1">
            <p className="text-[11px] text-muted uppercase font-bold font-mono">Consumed Upstream Tokens</p>
            <p className="text-2xl font-bold text-amber-600">
              {formatTokens(balanceMetrics?.consumedTokens ?? primaryProvider?.consumedTokens ?? 0)}
            </p>
            <p className="text-[10px] text-muted">Total tokens used by customer requests</p>
          </div>

          <div className="p-4 rounded-control bg-bg border border-border space-y-1">
            <p className="text-[11px] text-muted uppercase font-bold font-mono">Lifetime Purchased Tokens</p>
            <p className="text-2xl font-bold text-fg">
              {formatTokens(balanceMetrics?.purchasedTokens ?? primaryProvider?.purchasedTokens ?? 0)}
            </p>
            <p className="text-[10px] text-muted">Total master tokens topped up across {balanceMetrics?.topUpCount || 0} top-ups</p>
          </div>
        </div>


        {reconcileResult && (
          <div className={`p-3.5 rounded-control border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            reconcileResult.isReconciled ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-700' : 'bg-red-500/5 border-red-500/30 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {reconcileResult.fixed
                  ? `✅ Ledger auto-reconciled! Database balance adjusted to ${formatTokens(reconcileResult.dbBalance)} with verified ledger records.`
                  : reconcileResult.isReconciled
                  ? `Ledger Reconciled Perfectly! Database Balance: ${formatTokens(reconcileResult.dbBalance)} matches sum of ${reconcileResult.transactionCount} transactions.`
                  : `Ledger Discrepancy Detected! DB: ${formatTokens(reconcileResult.dbBalance)}, Calculated: ${formatTokens(reconcileResult.calculatedBalance)}.`}
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!reconcileResult.isReconciled && !reconcileResult.fixed && (
                <button
                  onClick={() => handleReconcileLedger(true)}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-mono transition-colors shadow-xs"
                >
                  ⚡ Auto-Fix Discrepancy
                </button>
              )}
              <button onClick={() => setReconcileResult(null)} className="text-muted hover:text-fg font-mono text-xs">✕</button>
            </div>
          </div>
        )}

        {/* Upstream Key Expired / Actionable Warning Alert */}
        {syncResult?.probeResults?.some((p: any) => p.body && typeof p.body === 'object' && p.body.error?.code === 'key_expired') && (
          <div className="p-4 rounded-control border border-amber-500/40 bg-amber-500/10 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
            <div className="space-y-1">
              <p className="font-bold flex items-center gap-2 text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Upstream Master API Key Expired on Provider ({primaryProvider?.name})</span>
              </p>
              <p className="text-[11px] text-amber-700">
                The master vendor key (<code className="bg-amber-500/20 px-1 py-0.5 rounded">{primaryProvider?.displayMasterKey}</code>) returned <code>403 key_expired</code> from {primaryProvider?.baseUrl}. Click &quot;Edit Vendor&quot; below to update the master API key.
              </p>
            </div>
            <button
              onClick={() => primaryProvider && openEditModal(primaryProvider)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shrink-0 self-start sm:self-auto"
            >
              Update Master Key
            </button>
          </div>
        )}

        {syncResult && (
          <div className="space-y-2">
            <div className={`p-3.5 rounded-control border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              syncResult.synced ? 'bg-blue-500/5 border-blue-500/30 text-blue-700' : 'bg-amber-500/5 border-amber-500/30 text-amber-700'
            }`}>
              <div className="flex items-center gap-2">
                <CloudDownload className="w-4 h-4 shrink-0" />
                <span>
                  {syncResult.synced
                    ? `✅ Vendor balance synced! Total: ${formatTokens(syncResult.balance?.totalTokens || '0')}, Available: ${formatTokens(syncResult.balance?.availableTokens || '0')}, Used: ${formatTokens(syncResult.balance?.usedTokens || '0')} (source: ${syncResult.balance?.source || 'vendor API'})`
                    : `⚠️ ${syncResult.message}`}
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {syncResult.probeResults && (
                  <button
                    onClick={() => setShowProbeLogs(!showProbeLogs)}
                    className="px-2 py-1 rounded text-xs font-bold bg-muted/50 hover:bg-muted text-fg border border-border flex items-center gap-1 font-mono"
                  >
                    <Code className="w-3 h-3" />
                    <span>{showProbeLogs ? 'Hide Diagnostics' : `View Diagnostics (${syncResult.probeResults.length} probes)`}</span>
                  </button>
                )}
                <button onClick={() => { setSyncResult(null); setShowProbeLogs(false); }} className="text-muted hover:text-fg font-mono text-xs">✕</button>
              </div>
            </div>

            {showProbeLogs && syncResult.probeResults && (
              <div className="p-4 rounded-control border border-border bg-black/90 text-emerald-400 font-mono text-[11px] space-y-2 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-white font-bold">
                  <span>⚡ Upstream Vendor Diagnostic Probe Log ({syncResult.probeResults.length} Endpoints Tested)</span>
                  <span className="text-[10px] text-muted font-normal">Base URL: {primaryProvider?.baseUrl}</span>
                </div>
                {syncResult.probeResults.map((pr: any, idx: number) => (
                  <div key={idx} className="border-b border-white/5 pb-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        pr.status === 200 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        pr.status === 401 || pr.status === 403 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-muted'
                      }`}>
                        {pr.method || 'GET'} {pr.status || 'ERR'}
                      </span>
                      <span className="font-bold text-white">{pr.path}</span>
                    </div>
                    {pr.headers && Object.keys(pr.headers).length > 0 && (
                      <div className="text-[10px] text-violet-300 pl-4 mt-0.5">
                        Headers: {JSON.stringify(pr.headers)}
                      </div>
                    )}
                    {pr.body && (
                      <div className="text-[10px] text-gray-400 pl-4 mt-0.5 truncate">
                        Body: {typeof pr.body === 'object' ? JSON.stringify(pr.body) : String(pr.body)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtab Toggle Buttons */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-all flex items-center gap-2 ${
            activeTab === 'providers' ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs' : 'bg-white text-muted hover:text-fg border border-border'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Vendor Providers ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-all flex items-center gap-2 ${
            activeTab === 'ledger' ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs' : 'bg-white text-muted hover:text-fg border border-border'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Master Token Accounting Ledger ({ledgerEntries.length})</span>
        </button>
      </div>

      {/* Subtab Content */}
      {activeTab === 'providers' ? (
        <div className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted font-mono">Loading vendor providers...</div>
          ) : providers.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted font-mono">No vendor providers configured yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg">
                    <th className="py-3 px-3 font-bold">Vendor Name</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-3 font-bold">Protocol</th>
                    <th className="py-3 px-3 font-bold">Host</th>
                    <th className="py-3 px-3 font-bold text-center">Keys</th>
                    <th className="py-3 px-3 font-bold text-center">Requests</th>
                    <th className="py-3 px-3 font-bold text-center">Error Rate</th>
                    <th className="py-3 px-3 font-bold text-center">Latency</th>
                    <th className="py-3 px-3 font-bold">Tokens (Avail / Consumed)</th>
                    <th className="py-3 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {providers.map((p) => {
                    const testRes = testResults[p.id];
                    return (
                      <React.Fragment key={p.id}>
                        <tr className="hover:bg-bg/40">
                          <td className="py-3.5 px-3 font-semibold font-sans text-fg">
                            <div className="flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.isPrimary && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  PRIMARY
                                </span>
                              )}
                              {p.isDefault && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted font-mono mt-0.5">{p.displayMasterKey}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            {getStatusBadge(p.status, Boolean(p.displayMasterKey && p.displayMasterKey !== 'Not Set'), p.availableTokens)}
                          </td>
                          <td className="py-3.5 px-3 uppercase text-amber-600 font-bold">{p.protocol || p.providerType}</td>
                          <td className="py-3.5 px-3 text-muted max-w-[140px] truncate" title={p.baseUrl}>
                            {p.baseUrlHostname || (p.baseUrl ? p.baseUrl.replace(/^https?:\/\//, '').split('/')[0] : '—')}
                          </td>
                          <td className="py-3.5 px-3 text-center text-fg font-bold">{p.activeKeyCount ?? 0}</td>
                          <td className="py-3.5 px-3 text-center text-fg">{p.requestCount ?? 0}</td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={Number(p.errorRate || 0) > 5 ? 'text-red-600 font-bold' : 'text-muted'}>
                              {p.errorRate !== undefined ? `${p.errorRate}%` : '0%'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center text-muted">
                            {p.avgLatencyMs !== undefined && p.avgLatencyMs > 0 ? `${p.avgLatencyMs}ms` : '—'}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="text-emerald-600 font-bold">{formatTokens(p.availableTokens || '0')}</span>
                            <span className="text-muted text-[10px] ml-1">/ {formatTokens(p.consumedTokens || '0')}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                                p.status === 'disabled'
                                  ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/15'
                                  : 'border-muted text-muted hover:text-fg hover:bg-bg'
                              }`}
                              title={p.status === 'disabled' ? 'Enable Provider' : 'Disable Provider'}
                            >
                              {p.status === 'disabled' ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded border border-border text-muted hover:text-fg hover:bg-bg transition-colors inline-flex items-center"
                              title="Edit Configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTestConnection(p.id)}
                              disabled={testingId === p.id}
                              className="px-2.5 py-1 rounded text-xs font-semibold border border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3 h-3 ${testingId === p.id ? 'animate-spin' : ''}`} />
                              <span>{testingId === p.id ? 'Testing...' : 'Test'}</span>
                            </button>
                          </td>
                        </tr>
                        {testRes && (
                          <tr className="bg-muted/5 border-b border-border/40">
                            <td colSpan={10} className="py-2 px-4 text-xs font-mono">
                              <span className={`font-bold mr-2 ${testRes.status === 'CONNECTED' ? 'text-emerald-600' : 'text-red-600'}`}>
                                [{testRes.status}]
                              </span>
                              <span className="text-muted">{testRes.message}</span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg">
                  <th className="py-3 px-4 font-bold">Transaction Type</th>
                  <th className="py-3 px-4 font-bold">Amount</th>
                  <th className="py-3 px-4 font-bold">Master Balance After</th>
                  <th className="py-3 px-4 font-bold">Reference</th>
                  <th className="py-3 px-4 font-bold">Notes</th>
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">No master token ledger transactions recorded yet.</td>
                  </tr>
                ) : (
                  ledgerEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-bg/40">
                      <td className="py-3.5 px-4 font-bold uppercase">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          e.type === 'TOP_UP' || e.type === 'INITIAL_ALLOCATION'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-bold ${Number(e.amount) >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {Number(e.amount) >= 0 ? `+${formatTokens(e.amount)}` : formatTokens(e.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-fg font-bold">{formatTokens(e.balanceAfter)}</td>
                      <td className="py-3.5 px-4 text-fg font-semibold">{e.reference || '—'}</td>
                      <td className="py-3.5 px-4 text-muted max-w-xs truncate">{e.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-muted">{new Date(e.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Up Master Balance Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-bold text-fg font-mono flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Top Up Master Vendor Balance</span>
              </h3>
              <button onClick={() => setShowTopUpModal(false)} className="text-muted hover:text-fg text-sm font-mono">✕</button>
            </div>

            {topUpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono flex items-center gap-2 shrink-0">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{topUpError}</span>
              </div>
            )}

            <form onSubmit={handleTopUpSubmit} className="space-y-4 text-xs font-mono overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Top-Up Token Amount (Exact Integer) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="100000000"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-emerald-500 text-fg font-bold"
                />
                <p className="text-[11px] text-muted mt-1 font-sans">
                  Formatted preview: <span className="font-mono font-bold text-emerald-600">{formatTokens(topUpAmount)} tokens</span>
                </p>
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Payment / Invoice Reference *</label>
                <input
                  type="text"
                  required
                  value={topUpReference}
                  onChange={(e) => setTopUpReference(e.target.value)}
                  placeholder="Vendor Invoice #2026-08 / UPI Ref 849302194"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-emerald-500 text-fg"
                />
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Notes / Internal Context</label>
                <textarea
                  rows={2}
                  value={topUpNotes}
                  onChange={(e) => setTopUpNotes(e.target.value)}
                  placeholder="Prepaid vendor token purchase after settlement..."
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-emerald-500 text-fg font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border font-sans shrink-0">
                <button type="button" onClick={() => setShowTopUpModal(false)} className="px-4 py-2 text-xs bg-bg border border-border text-muted hover:text-fg rounded-control">
                  Cancel
                </button>
                <button type="submit" disabled={topUpSubmitting} className="ui-button-primary text-xs py-2 px-4 font-bold bg-gradient-to-tr from-emerald-600 to-teal-600 text-white disabled:opacity-50">
                  {topUpSubmitting ? 'Recording Top-Up...' : 'Confirm Top-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-bold text-fg font-mono">
                {editingProvider ? 'Edit Vendor Credentials' : 'Add Custom Vendor Provider'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm font-mono">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono flex items-center gap-2 shrink-0">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs font-mono overflow-y-auto flex-1 pr-1">
              {/* Presets Bar */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded bg-muted/10 border border-border">
                <span className="text-[10px] font-bold text-muted uppercase">Quick Presets:</span>
                <button type="button" onClick={() => applyPreset('opus_max')} className="px-2 py-0.5 text-[10px] font-bold rounded bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 transition-colors">
                  Opus Max
                </button>
                <button type="button" onClick={() => applyPreset('scalemax')} className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 transition-colors">
                  ScaleMax
                </button>
                <button type="button" onClick={() => applyPreset('anthropic_direct')} className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-600/10 text-amber-600 hover:bg-amber-600/20 transition-colors">
                  Anthropic Direct
                </button>
                <button type="button" onClick={() => applyPreset('openai_compat')} className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 transition-colors">
                  OpenAI Compat
                </button>
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Opus Max"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-sans font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-fg mb-1 uppercase">Provider Type</label>
                  <select
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
                  >
                    <option value="custom_http">Custom HTTP Proxy</option>
                    <option value="anthropic">Anthropic Official</option>
                    <option value="openai">OpenAI Compatible</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-fg mb-1 uppercase">Protocol Adapter</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
                  >
                    <option value="anthropic">Anthropic Native (/v1/messages)</option>
                    <option value="openai-compatible">OpenAI Compatible (/v1/chat/completions)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-fg mb-1 uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-bold"
                  >
                    <option value="connected">Enabled / Connected</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-fg mb-1 uppercase">Initial Prepaid Tokens</label>
                  <input
                    type="number"
                    min="0"
                    value={availableTokens}
                    onChange={(e) => setAvailableTokens(e.target.value)}
                    placeholder="100000000"
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Base URL (HTTPS Only) *</label>
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.upstream-provider.com"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">
                  {editingProvider ? 'Update Master API Key (Leave blank to keep existing)' : 'Master API Key *'}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  value={masterApiKey}
                  onChange={(e) => setMasterApiKey(e.target.value)}
                  placeholder={editingProvider ? '•••••••• (Encrypted in DB - leave blank to keep)' : 'sm_live_•••••••• or sk-ant-•••••••• (Vendor Master Key)'}
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
                <p className="text-[10px] text-muted mt-1 font-sans">
                  Encrypted at rest with AES-256-GCM. Never exposed in API responses or customer telemetry.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-fg mb-1 uppercase">Warning Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={warningThresholdTokens}
                    onChange={(e) => setWarningThresholdTokens(e.target.value)}
                    placeholder="20000000"
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-fg mb-1 uppercase">Critical Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={criticalThresholdTokens}
                    onChange={(e) => setCriticalThresholdTokens(e.target.value)}
                    placeholder="5000000"
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-fg uppercase">Model Mappings (JSON Format)</label>
                  <span className="text-[10px] text-muted font-sans">Maps LightningAPI model to upstream model ID</span>
                </div>
                <textarea
                  rows={4}
                  value={modelMappingsJson}
                  onChange={(e) => setModelMappingsJson(e.target.value)}
                  placeholder={'{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}'}
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Notes / Internal Context</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Primary enterprise upstream provider configuration..."
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-sans"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-border text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="isPrimary" className="text-xs font-bold text-fg font-sans cursor-pointer">
                  Set as Primary Default Upstream Vendor Provider
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border font-sans shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs bg-bg border border-border text-muted hover:text-fg rounded-control">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 font-bold disabled:opacity-50">
                  {submitting ? 'Saving Configuration...' : 'Save Vendor Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Key Migration Modal */}
      {showMigrateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-panel w-full max-w-lg p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-fg">Bulk API Key Provider Migration</h3>
              </div>
              <button onClick={() => setShowMigrateModal(false)} className="text-muted hover:text-fg font-mono">✕</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <p className="text-muted">
                Reassign customer API keys from one upstream provider to another with zero downtime. Customer keys and credentials remain unchanged.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-muted uppercase text-[11px]">Source Provider</label>
                <select
                  value={migrateSourceId}
                  onChange={(e) => setMigrateSourceId(e.target.value)}
                  className="w-full py-2 px-3 rounded border border-border bg-bg text-fg font-bold"
                >
                  <option value="">-- All Active Providers --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.activeKeyCount ?? 0} active keys)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted uppercase text-[11px]">Target Destination Provider</label>
                <select
                  value={migrateTargetId}
                  onChange={(e) => setMigrateTargetId(e.target.value)}
                  className="w-full py-2 px-3 rounded border border-border bg-bg text-fg font-bold"
                >
                  <option value="">-- Select Destination Provider --</option>
                  {providers.filter((p) => p.id !== migrateSourceId).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.status === 'connected' ? '● Online' : '○ ' + p.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted uppercase text-[11px]">Audit Reason (Recorded in AdminLog)</label>
                <input
                  type="text"
                  placeholder="e.g. Load rebalancing / Provider optimization"
                  value={migrateReason}
                  onChange={(e) => setMigrateReason(e.target.value)}
                  className="w-full py-2 px-3 rounded border border-border bg-bg text-fg"
                />
              </div>

              {migrateResult && (
                <div className={`p-3 rounded border text-xs ${
                  migrateResult.error ? 'bg-rose-500/10 border-rose-500/30 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                }`}>
                  {migrateResult.error ? `Error: ${migrateResult.error}` : `✅ Successfully migrated ${migrateResult.migratedCount} API keys to ${migrateResult.targetProviderName}!`}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowMigrateModal(false)}
                className="px-4 py-2 rounded text-xs font-bold text-muted hover:text-fg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={migratingKeys || !migrateTargetId}
                onClick={handleExecuteMigration}
                className="px-4 py-2 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
              >
                {migratingKeys ? 'Migrating...' : 'Confirm Bulk Migration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
