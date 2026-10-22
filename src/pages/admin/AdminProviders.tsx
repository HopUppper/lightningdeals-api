import React, { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Edit2,
  Code,
  DollarSign,
  Activity,
  Layers,
  FileText,
  ArrowUpRight,
  CloudDownload,
  Clock,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from 'lucide-react';
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
  capacityModel?: string;
  windowHours?: number;
  windowAllowance?: string;
  windowTokensUsed?: number;
  nextResetAt?: string | null;
  windowResetSeconds?: number | null;
  availableTokens: string;
  purchasedTokens: string;
  consumedTokens: string;
  reservedTokens?: string;
  warningThresholdTokens: string;
  criticalThresholdTokens: string;
  discoverySource?: string;
  discoveryStatus?: string;
  discoveryConfidence?: string;
  discoveredLimitTokens?: string | null;
  discoveredRemainingTokens?: string | null;
  lastDiscoveredAt?: string | null;
  configuredLimitTokens?: string | null;
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

  // Main navigation tab
  const [mainTab, setMainTab] = useState<'capacity' | 'providers' | 'routing' | 'ledger'>('capacity');
  const [showAccountingDetails, setShowAccountingDetails] = useState(false);

  // Vendor Form State
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState('anthropic');
  const [protocol, setProtocol] = useState('anthropic');
  const [masterApiKey, setMasterApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.anthropic.com');
  const [isPrimary, setIsPrimary] = useState(false);
  const [status, setStatus] = useState('connected');
  const [capacityModel, setCapacityModel] = useState<'lifetime_prepaid' | 'rolling_window'>('rolling_window');
  const [windowHours, setWindowHours] = useState('5');
  const [windowAllowance, setWindowAllowance] = useState('5000000');
  const [warningThresholdTokens, setWarningThresholdTokens] = useState('1000000');
  const [criticalThresholdTokens, setCriticalThresholdTokens] = useState('250000');
  const [availableTokens, setAvailableTokens] = useState('5000000');
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

  // Sync Vendor Balance State
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

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
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [migrateResult, setMigrateResult] = useState<any>(null);

  const fetchProviders = async () => {
    try {
      const res = await adminFetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
        const target = (selectedProviderId && data.find((p: any) => p.id === selectedProviderId)) ||
          data.find((p: any) => p.isDefault && p.status === 'connected') ||
          data.find((p: any) => p.isPrimary && p.status === 'connected') ||
          data.find((p: any) => p.isDefault) ||
          data.find((p: any) => p.isPrimary) ||
          data[0];
        if (target) {
          if (!selectedProviderId) setSelectedProviderId(target.id);
          fetchBalanceMetrics(target.id);
          fetchLedger(target.id);
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFailover = async (updatedConfig: any) => {
    setSavingFailover(true);
    try {
      const res = await adminFetch('/api/admin/providers/failover-config', {
        method: 'POST',
        body: JSON.stringify(updatedConfig),
      });
      if (res.ok) {
        setFailoverConfig(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
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
          reason: migrateReason || 'Admin bulk migration',
        }),
      });
      const data = await res.json();
      setMigrateResult(data);
      if (data.success) {
        await fetchProviders();
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
    setBaseUrl('https://api.opusmax.pro');
    setIsPrimary(false);
    setStatus('connected');
    setCapacityModel('rolling_window');
    setWindowHours('5');
    setWindowAllowance('5000000');
    setWarningThresholdTokens('1000000');
    setCriticalThresholdTokens('250000');
    setAvailableTokens('5000000');
    setModelMappingsJson('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
    setHeadersJson('');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const applyPreset = (preset: 'opus_max' | 'anthropic_direct' | 'openai_compat') => {
    if (preset === 'opus_max') {
      setName('Opus Max');
      setProviderType('custom_http');
      setProtocol('anthropic');
      setBaseUrl('https://api.opusmax.pro');
      setCapacityModel('rolling_window');
      setWindowHours('5');
      setWindowAllowance('5000000');
      setAvailableTokens('5000000');
      setWarningThresholdTokens('1000000');
      setCriticalThresholdTokens('250000');
      setModelMappingsJson('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
    } else if (preset === 'anthropic_direct') {
      setName('Anthropic Official');
      setProviderType('anthropic');
      setProtocol('anthropic');
      setBaseUrl('https://api.anthropic.com');
      setCapacityModel('lifetime_prepaid');
      setWarningThresholdTokens('20000000');
      setCriticalThresholdTokens('5000000');
      setModelMappingsJson('{\n  "claude-sonnet-5.5": "claude-sonnet-5.5",\n  "claude-opus-5.5": "claude-opus-5.5"\n}');
    } else if (preset === 'openai_compat') {
      setName('OpenAI Gateway');
      setProviderType('openai');
      setProtocol('openai-compatible');
      setCapacityModel('lifetime_prepaid');
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
    setCapacityModel((p.capacityModel as any) || (Number(p.windowAllowance || 0) > 0 ? 'rolling_window' : 'lifetime_prepaid'));
    setWindowHours(String(p.windowHours || 5));
    setWindowAllowance(p.windowAllowance || '5000000');
    setWarningThresholdTokens(p.warningThresholdTokens || '1000000');
    setCriticalThresholdTokens(p.criticalThresholdTokens || '250000');
    setAvailableTokens(p.availableTokens || '5000000');
    setModelMappingsJson(p.modelMappingsJson || '');
    setHeadersJson(p.headersJson || '');
    setNotes(p.notes || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        name,
        providerType,
        protocol,
        baseUrl,
        isPrimary,
        status,
        capacityModel,
        windowHours: parseInt(windowHours) || 5,
        windowAllowance,
        warningThresholdTokens,
        criticalThresholdTokens,
        availableTokens,
        modelMappingsJson: modelMappingsJson || null,
        headersJson: headersJson || null,
        notes: notes || null,
      };

      if (masterApiKey.trim()) {
        payload.masterApiKey = masterApiKey.trim();
      }

      const url = editingProvider
        ? `/api/admin/providers/${editingProvider.id}`
        : '/api/admin/providers';
      const method = editingProvider ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchProviders();
      } else {
        const data = await res.json();
        setFormError(data.error?.message || 'Failed to save provider configuration.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error saving provider.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (p: VendorProviderItem) => {
    const newStatus = p.status === 'disabled' ? 'connected' : 'disabled';
    try {
      const res = await adminFetch(`/api/admin/providers/${p.id}`, {
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

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpSubmitting(true);
    setTopUpError(null);

    const primary = providers.find((p) => p.isPrimary) || providers[0];
    if (!primary) {
      setTopUpError('No provider available to top up.');
      setTopUpSubmitting(false);
      return;
    }

    try {
      const res = await adminFetch('/api/admin/providers/top-up', {
        method: 'POST',
        body: JSON.stringify({
          providerId: primary.id,
          amountTokens: topUpAmount,
          reference: topUpReference,
          notes: topUpNotes,
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
    const primary = (selectedProviderId && providers.find((p) => p.id === selectedProviderId)) || providers[0];
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
        await fetchBalanceMetrics(providerId);
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
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30">❌ AUTH_FAILED</span>;
    }
    if (s === 'UNREACHABLE' || s === 'UNAVAILABLE' || s === 'SSRF_BLOCKED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">⚠️ UNREACHABLE</span>;
    }
    if (s === 'INVALID_RESPONSE' || s === 'PROVIDER_ERROR') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30">⚠️ ERROR</span>;
    }
    if (s === 'DISABLED' || s === 'NOT_CONFIGURED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/30 text-muted border border-border">⚪ DISABLED</span>;
    }
    if (s === 'WARNING') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">⚠️ WARNING</span>;
    }
    if (s === 'DEPLETED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30">⛔ DEPLETED</span>;
    }
    if (s === 'CRITICAL') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse">🚨 CRITICAL</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/30 text-muted border border-border">{s}</span>;
  };

  const primaryProvider =
    (selectedProviderId && providers.find((p) => p.id === selectedProviderId)) ||
    providers.find((p) => p.isDefault && p.status === 'connected') ||
    providers.find((p) => p.isPrimary && p.status === 'connected') ||
    providers.find((p) => p.isDefault) ||
    providers.find((p) => p.isPrimary) ||
    providers[0];
  const primaryHasKey = Boolean(primaryProvider && primaryProvider.displayMasterKey && primaryProvider.displayMasterKey !== 'Not Set');

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 shadow-xs">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-fg tracking-tight">Providers & Capacity Hub</h1>
              {primaryProvider && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {primaryProvider.name} (Active)
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Live vendor token quota, rolling-window headroom, and multi-provider failover routing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowTopUpModal(true)}
            className="ui-button-secondary text-xs py-1.5 px-3.5 gap-1.5 font-medium border-border hover:bg-card shadow-xs"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Top Up Balance</span>
          </button>
          <button
            onClick={openCreateModal}
            className="ui-button-primary text-xs py-1.5 px-3.5 gap-1.5 font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Provider</span>
          </button>
        </div>
      </div>

      {/* 2. Elevated Modern Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMainTab('capacity')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mainTab === 'capacity'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-muted hover:text-fg hover:bg-card border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Capacity & Headroom</span>
          {balanceMetrics?.discoverySource === 'OFFICIAL_QUOTA_API' && (
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${mainTab === 'capacity' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600'}`}>
              Verified ✓
            </span>
          )}
        </button>

        <button
          onClick={() => setMainTab('providers')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mainTab === 'providers'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-muted hover:text-fg hover:bg-card border border-transparent'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Configured Providers</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${mainTab === 'providers' ? 'bg-white/20 text-white' : 'bg-muted/30 text-muted'}`}>
            {providers.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('routing')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mainTab === 'routing'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-muted hover:text-fg hover:bg-card border border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Gateway Routing & Failover</span>
          {failoverConfig.enableAutoFailover && (
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${mainTab === 'routing' ? 'bg-white/20 text-white' : 'bg-violet-500/10 text-violet-600'}`}>
              Auto
            </span>
          )}
        </button>

        <button
          onClick={() => setMainTab('ledger')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mainTab === 'ledger'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-muted hover:text-fg hover:bg-card border border-transparent'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Token Accounting Ledger</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${mainTab === 'ledger' ? 'bg-white/20 text-white' : 'bg-muted/30 text-muted'}`}>
            {ledgerEntries.length}
          </span>
        </button>
      </div>

      {/* Sync / Diagnostic Toast Feedback */}
      {syncResult && (
        <div className={`p-3.5 rounded-control border text-xs font-mono flex items-center justify-between gap-3 ${
          syncResult.synced || syncResult.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
        }`}>
          <div className="flex items-center gap-2">
            {syncResult.synced || syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>{syncResult.message || 'Provider discovery completed.'}</span>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-muted hover:text-fg font-bold">✕</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: LIVE CAPACITY & ROLLING-WINDOW HEADROOM                   */}
      {/* ============================================================== */}
      {mainTab === 'capacity' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Hero Rolling Window Card */}
          <div className="bg-card border border-border rounded-panel p-6 shadow-sm space-y-6">
            {/* Card Header & Provider Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-fg font-sans">Active Upstream Master Balance</h2>
                  {getStatusBadge(balanceMetrics?.status || primaryProvider?.status || 'NOT_CONFIGURED', primaryHasKey)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>Selected Vendor:</span>
                  <select
                    value={primaryProvider?.id || ''}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedProviderId(newId);
                      fetchBalanceMetrics(newId);
                      fetchLedger(newId);
                    }}
                    className="py-1 px-2.5 text-xs font-semibold text-fg bg-bg border border-border rounded shadow-xs focus:outline-none focus:border-violet-500 font-sans"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.displayMasterKey || 'Not Set'}) {p.status === 'connected' ? '✓' : ''} {p.isDefault ? '[DEFAULT]' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted font-mono">· {primaryProvider?.baseUrl}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {primaryProvider && (
                  <button
                    onClick={() => handleSyncVendorBalance(primaryProvider.id)}
                    disabled={syncing}
                    className="ui-button-primary text-xs py-2 px-3.5 gap-2 font-mono bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs disabled:opacity-50"
                  >
                    <CloudDownload className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Discovering...' : 'Discover Provider Limits'}</span>
                  </button>
                )}
                <button
                  onClick={() => handleReconcileLedger(false)}
                  className="ui-button-secondary text-xs py-2 px-3.5 gap-2 font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Audit Reconcile</span>
                </button>
              </div>
            </div>

            {/* Visual Capacity & Rolling Window Progress Gauge */}
            <div className="p-5 rounded-control bg-gradient-to-r from-violet-500/5 via-card to-indigo-500/5 border border-violet-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
                <div>
                  <p className="text-[11px] text-muted uppercase font-bold tracking-wider">5-Hour Rolling Master Capacity</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-fg">
                      {formatTokens(balanceMetrics?.exposure?.upstreamRemainingMasterCapacity || balanceMetrics?.availableTokens || primaryProvider?.availableTokens || 0)}
                    </span>
                    <span className="text-xs text-muted">
                      / {formatTokens(balanceMetrics?.windowAllowance || primaryProvider?.windowAllowance || 5000000)} Tokens Available
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {balanceMetrics?.nextResetAt ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 text-xs font-bold font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Resets in {Math.floor((balanceMetrics.windowResetSeconds || 0) / 3600)}h {Math.floor(((balanceMetrics.windowResetSeconds || 0) % 3600) / 60)}m ({new Date(balanceMetrics.nextResetAt).toLocaleTimeString()})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Full Capacity Ready (0 Consumed)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modern Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-bg border border-border overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, 100 - (Number(balanceMetrics?.windowTokensUsed || 0) / Math.max(1, Number(balanceMetrics?.windowAllowance || 5000000))) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-muted">
                  <span>Used in 5h: <strong className="text-amber-600">{formatTokens(balanceMetrics?.windowTokensUsed || 0)}</strong></span>
                  <span>Remaining: <strong className="text-emerald-600">{formatTokens(balanceMetrics?.exposure?.upstreamRemainingMasterCapacity || balanceMetrics?.availableTokens || 0)} ({(100 - (Number(balanceMetrics?.windowTokensUsed || 0) / Math.max(1, Number(balanceMetrics?.windowAllowance || 5000000))) * 100).toFixed(1)}%)</strong></span>
                </div>
              </div>

              {/* Verified Upstream Quota Telemetry (OpusMax API) */}
              {balanceMetrics?.discoveryDetails && (
                <div className="pt-3 border-t border-violet-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Upstream Plan</span>
                    <span className="font-bold text-fg flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {balanceMetrics.discoveryDetails.upstreamPlan || 'Max 5x Trial'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Rate Limit</span>
                    <span className="font-bold text-fg">
                      {balanceMetrics.discoveryDetails.rateLimitRpm ? `${balanceMetrics.discoveryDetails.rateLimitRpm} req/min` : '60 req/min'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Total Upstream Requests</span>
                    <span className="font-bold text-fg">
                      {balanceMetrics.discoveryDetails.totalRequests ?? '—'} all time
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Last 24 Hours</span>
                    <span className="font-bold text-fg">
                      {balanceMetrics.discoveryDetails.last24hRequests ?? 0} requests
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3 Clear Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              {/* Card 1: Master Upstream Headroom */}
              <div className="p-4 rounded-control bg-bg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted uppercase font-bold">Remaining Headroom</p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    LAYER A HEADROOM
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatTokens(balanceMetrics?.exposure?.upstreamRemainingMasterCapacity || balanceMetrics?.availableTokens || 0)}
                </p>
                <p className="text-[10px] text-muted">
                  5H limit ({formatTokens(balanceMetrics?.windowAllowance || 5000000)}) minus current window consumption
                </p>
              </div>

              {/* Card 2: Active Customer Entitlement Exposure */}
              <div className="p-4 rounded-control bg-bg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted uppercase font-bold">Customer 5H Exposure</p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                    LAYER C EXPOSURE
                  </span>
                </div>
                <p className="text-2xl font-bold text-violet-600">
                  {formatTokens(balanceMetrics?.exposure?.active5hWindowAllowance || '0')}
                </p>
                <p className="text-[10px] text-muted">
                  Total potential concurrent ceiling across {balanceMetrics?.exposure?.activeKeyCount || 0} active keys
                </p>
              </div>

              {/* Card 3: Upstream Consumption */}
              <div className="p-4 rounded-control bg-bg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted uppercase font-bold">Consumed Upstream</p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    ACTUAL USAGE
                  </span>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {formatTokens(balanceMetrics?.windowTokensUsed || 0)}
                </p>
                <p className="text-[10px] text-muted">
                  In 5h window · Lifetime: {formatTokens(balanceMetrics?.consumedTokens ?? primaryProvider?.consumedTokens ?? 0)}
                </p>
              </div>
            </div>

            {/* Clean Collapsible Accounting Principles Accordion */}
            <div className="border border-border rounded-control overflow-hidden">
              <button
                onClick={() => setShowAccountingDetails(!showAccountingDetails)}
                className="w-full py-2.5 px-4 bg-muted/5 hover:bg-muted/10 transition-colors flex items-center justify-between text-xs font-medium text-muted hover:text-fg font-sans"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-violet-500" />
                  <span>Understanding 5-Hour Rolling Window & Entitlement Exposure</span>
                </div>
                {showAccountingDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAccountingDetails && (
                <div className="p-4 bg-bg text-xs space-y-2 border-t border-border text-muted font-sans leading-relaxed">
                  <p>
                    <strong className="text-fg">Layer A (Upstream Master Headroom):</strong> Your vendor key supplies an allocation of {formatTokens(balanceMetrics?.windowAllowance || 5000000)} tokens that rolls continuously every 5 hours. Tokens consumed roll off 5 hours after request completion, constantly replenishing master capacity.
                  </p>
                  <p>
                    <strong className="text-fg">Layer B (Customer Quotas):</strong> Each customer API key has an independent 5-hour rolling allowance (e.g. 5M or 20M tokens).
                  </p>
                  <p>
                    <strong className="text-fg">Layer C (Entitlement Exposure):</strong> {formatTokens(balanceMetrics?.exposure?.active5hWindowAllowance || '0')} is the theoretical concurrent demand ceiling if every active customer utilized 100% of their quota simultaneously. It is tracked for capacity planning and never subtracted from upstream available tokens.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CONFIGURED PROVIDERS LIST                                 */}
      {/* ============================================================== */}
      {mainTab === 'providers' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-fg font-sans">Configured Upstream Providers</h2>
              <p className="text-xs text-muted">Manage master API keys, health status, and test connection latency.</p>
            </div>
            <button onClick={openCreateModal} className="ui-button-primary text-xs py-1.5 px-3.5 gap-1.5 font-medium">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Provider</span>
            </button>
          </div>

          <div className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg">
                    <th className="py-3 px-3 font-bold">Vendor Name</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-3 font-bold">Protocol</th>
                    <th className="py-3 px-3 font-bold">Host</th>
                    <th className="py-3 px-3 font-bold text-center">Active Keys</th>
                    <th className="py-3 px-3 font-bold text-center">Requests</th>
                    <th className="py-3 px-3 font-bold text-center">Latency</th>
                    <th className="py-3 px-3 font-bold">Tokens (Avail / Used)</th>
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
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted font-mono">{p.displayMasterKey}</span>
                              {p.capacityModel === 'rolling_window' && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20 font-mono">
                                  {p.windowHours || 5}H ROLLING ({formatTokens(p.windowAllowance || 5000000)})
                                </span>
                              )}
                            </div>
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
                          <td className="py-3.5 px-3 text-center text-muted">
                            {p.avgLatencyMs !== undefined && p.avgLatencyMs > 0 ? `${p.avgLatencyMs}ms` : '—'}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="text-emerald-600 font-bold">{formatTokens(p.availableTokens || '0')}</span>
                            <span className="text-muted text-[10px] ml-1">/ {formatTokens(p.consumedTokens || '0')}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedProviderId(p.id);
                                handleSyncVendorBalance(p.id);
                              }}
                              disabled={syncing}
                              className="px-2.5 py-1 rounded text-xs font-semibold border border-blue-500/30 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              title="Discover live upstream limits from provider API"
                            >
                              <CloudDownload className={`w-3 h-3 ${syncing && primaryProvider?.id === p.id ? 'animate-spin' : ''}`} />
                              <span>Discover</span>
                            </button>
                            <button
                              onClick={() => handleTestConnection(p.id)}
                              disabled={testingId === p.id}
                              className="px-2.5 py-1 rounded text-xs font-semibold border border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3 h-3 ${testingId === p.id ? 'animate-spin' : ''}`} />
                              <span>{testingId === p.id ? 'Testing...' : 'Test'}</span>
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded border border-border text-muted hover:text-fg hover:bg-bg transition-colors inline-flex items-center"
                              title="Edit Configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
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
                          </td>
                        </tr>
                        {testRes && (
                          <tr className="bg-muted/5 border-b border-border/40">
                            <td colSpan={9} className="py-2.5 px-4 text-xs font-mono">
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
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GATEWAY ROUTING & AUTOMATED FAILOVER                      */}
      {/* ============================================================== */}
      {mainTab === 'routing' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-panel p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-fg font-sans flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-600" />
                  <span>Gateway Provider Routing & Failover</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Configure default provider for newly issued keys, monitor live connection status, and configure automated zero-downtime failover.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowMigrateModal(true);
                  setMigrateResult(null);
                  const op = providers.find((p) => p.name.toLowerCase().includes('opus') || p.isPrimary);
                  if (op) setMigrateTargetId(op.id);
                }}
                className="px-3.5 py-1.5 rounded-control text-xs font-bold border border-indigo-500/30 text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Bulk Migrate Keys</span>
              </button>
            </div>

            {/* Provider Status & Routing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Default Provider Switcher */}
              <div className="p-4 rounded-control bg-bg border border-border space-y-2">
                <span className="text-[11px] font-mono text-muted uppercase font-bold">Default Provider for New Keys</span>
                <select
                  value={failoverConfig.defaultProviderId || providers.find((p) => p.isDefault)?.id || ''}
                  onChange={(e) => handleSetDefaultProvider(e.target.value)}
                  className="w-full text-xs font-mono font-bold py-2 px-2.5 rounded border border-border bg-card text-fg focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status === 'connected' ? '● Online' : '○ ' + p.status}) {p.isDefault ? '★ (Default)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted">
                  New customer API keys will be provisioned using this upstream provider.
                </p>
              </div>

              {/* Failover Mode */}
              <div className="p-4 rounded-control bg-bg border border-border space-y-3">
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
                  <span className="text-muted text-[11px] w-16">Primary:</span>
                  <select
                    value={failoverConfig.primaryProviderId || ''}
                    onChange={(e) => handleUpdateFailover({ ...failoverConfig, primaryProviderId: e.target.value })}
                    className="flex-1 text-[11px] font-mono py-1.5 px-2 rounded border border-border bg-card text-fg"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-muted text-[11px] w-16">Fallback:</span>
                  <select
                    value={failoverConfig.fallbackProviderId || ''}
                    onChange={(e) => handleUpdateFailover({ ...failoverConfig, fallbackProviderId: e.target.value })}
                    className="flex-1 text-[11px] font-mono py-1.5 px-2 rounded border border-border bg-card text-fg"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Connection Diagnostics */}
              <div className="p-4 rounded-control bg-bg border border-border space-y-2.5">
                <span className="text-[11px] font-mono text-muted uppercase font-bold">Live Provider Health</span>
                <div className="space-y-2">
                  {providers.map((p) => {
                    const res = testResults[p.id];
                    return (
                      <div key={p.id} className="flex items-center justify-between text-xs font-mono p-1.5 rounded bg-card border border-border/50">
                        <span className="font-semibold text-fg flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${p.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {p.name}
                        </span>
                        <button
                          onClick={() => handleTestConnection(p.id)}
                          disabled={testingId === p.id}
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-muted hover:text-fg hover:bg-bg border border-border/60 transition-colors flex items-center gap-1"
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
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: TOKEN ACCOUNTING LEDGER                                  */}
      {/* ============================================================== */}
      {mainTab === 'ledger' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-fg font-sans">Authoritative Token Accounting Ledger</h2>
              <p className="text-xs text-muted">Immutable transaction log of master top-ups and customer allocations.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReconcileLedger(false)}
                className="ui-button-secondary text-xs py-1.5 px-3 gap-1.5 font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Audit Reconcile</span>
              </button>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="ui-button-primary text-xs py-1.5 px-3 gap-1.5 font-mono bg-gradient-to-tr from-emerald-600 to-teal-600 text-white"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Top Up Master Balance</span>
              </button>
            </div>
          </div>

          {reconcileResult && (
            <div className={`p-3.5 rounded-control border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              reconcileResult.isReconciled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : 'bg-red-500/10 border-red-500/30 text-red-700'
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
              {!reconcileResult.isReconciled && !reconcileResult.fixed && (
                <button
                  onClick={() => handleReconcileLedger(true)}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-mono transition-colors shadow-xs"
                >
                  Auto-Fix Discrepancy
                </button>
              )}
            </div>
          )}

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
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS: TOP-UP, EDIT/ADD PROVIDER, BULK MIGRATION              */}
      {/* ============================================================== */}

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
                  <label className="block font-bold text-fg mb-1 uppercase">Capacity Model</label>
                  <select
                    value={capacityModel}
                    onChange={(e) => setCapacityModel(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-bold"
                  >
                    <option value="rolling_window">5h Rolling Window (Auto-Renew)</option>
                    <option value="lifetime_prepaid">Lifetime Prepaid (Static Pool)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-fg mb-1 uppercase">
                    {capacityModel === 'rolling_window' ? 'Window Allowance (Tokens)' : 'Prepaid Capacity (Tokens)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={capacityModel === 'rolling_window' ? windowAllowance : availableTokens}
                    onChange={(e) => {
                      if (capacityModel === 'rolling_window') {
                        setWindowAllowance(e.target.value);
                        setAvailableTokens(e.target.value);
                      } else {
                        setAvailableTokens(e.target.value);
                      }
                    }}
                    placeholder={capacityModel === 'rolling_window' ? '5000000' : '100000000'}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted mt-0.5 font-sans">
                    Formatted: <span className="text-emerald-600 font-bold font-mono">{formatTokens(capacityModel === 'rolling_window' ? windowAllowance : availableTokens)} tokens</span>
                  </p>
                </div>

                {capacityModel === 'rolling_window' ? (
                  <div>
                    <label className="block font-bold text-fg mb-1 uppercase">Rolling Window Period</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={windowHours}
                        onChange={(e) => setWindowHours(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono font-bold"
                      />
                      <span className="text-muted font-bold">Hours</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-fg mb-1 uppercase">Purchased Tokens</label>
                    <input
                      type="number"
                      min="0"
                      value={availableTokens}
                      onChange={(e) => setAvailableTokens(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Provider Base URL *</label>
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.opusmax.pro"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">
                  Master API Key {editingProvider ? '(Leave blank to keep existing encrypted key)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingProvider}
                  value={masterApiKey}
                  onChange={(e) => setMasterApiKey(e.target.value)}
                  placeholder={editingProvider ? '••••••••••••••••' : 'sk-ant-api03-...'}
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Internal Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Primary upstream vendor account"
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
