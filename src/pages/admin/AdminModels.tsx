import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Plus,
  Edit2,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  History,
  Eye,
  Layers,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminModels: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [changeLogs, setChangeLogs] = useState<any[]>([]);
  const [historyTab, setHistoryTab] = useState<'syncs' | 'changes'>('syncs');
  const [editingModel, setEditingModel] = useState<any | null>(null);
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Approval modal state
  const [approvingModel, setApprovingModel] = useState<any | null>(null);
  const [approveInputPrice, setApproveInputPrice] = useState('3.0');
  const [approveOutputPrice, setApproveOutputPrice] = useState('15.0');
  const [approvingSubmitting, setApprovingSubmitting] = useState(false);

  // Price discrepancy modal state
  const [priceReviewModel, setPriceReviewModel] = useState<any | null>(null);
  const [ackInputPrice, setAckInputPrice] = useState('');
  const [ackOutputPrice, setAckOutputPrice] = useState('');
  const [priceSubmitting, setPriceSubmitting] = useState(false);

  // Model Form State
  const [modelId, setModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [family, setFamily] = useState('claude');
  const [provider, setProvider] = useState('Anthropic');
  const [planCategory, setPlanCategory] = useState('claude_max_rolling');
  const [description, setDescription] = useState('');
  const [contextWindow, setContextWindow] = useState('1000000');
  const [inputPrice, setInputPrice] = useState('3.0');
  const [outputPrice, setOutputPrice] = useState('15.0');
  const [supplierCostInput, setSupplierCostInput] = useState('2.0');
  const [supplierCostOutput, setSupplierCostOutput] = useState('8.0');
  const [isOnDemand, setIsOnDemand] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await adminFetch('/api/admin/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryAndLogs = async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        adminFetch('/api/admin/models/sync-history'),
        adminFetch('/api/admin/models/changes'),
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setSyncHistory(hData);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setChangeLogs(cData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await adminFetch('/api/admin/models/sync', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data);
      if (res.ok && data.success) {
        await fetchModels();
      } else {
        alert(data.error?.message || data.error || 'Sync returned an issue');
      }
    } catch (e: any) {
      alert(e.message || 'Network error triggering sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenApproveModal = (m: any) => {
    setApprovingModel(m);
    setApproveInputPrice(String(m.inputPrice || (m.supplierCostInput ? Math.max(0.5, m.supplierCostInput * 1.35) : 3.0)));
    setApproveOutputPrice(String(m.outputPrice || (m.supplierCostOutput ? Math.max(1.5, m.supplierCostOutput * 1.35) : 15.0)));
  };

  const handleApproveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingModel) return;
    setApprovingSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/models/${approvingModel.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          inputPrice: Number(approveInputPrice),
          outputPrice: Number(approveOutputPrice),
        }),
      });
      if (res.ok) {
        setApprovingModel(null);
        await fetchModels();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to approve model');
      }
    } catch (err: any) {
      alert(err.message || 'Network error approving model');
    } finally {
      setApprovingSubmitting(false);
    }
  };

  const handleOpenPriceReviewModal = (m: any) => {
    setPriceReviewModel(m);
    setAckInputPrice(String(m.inputPrice || ''));
    setAckOutputPrice(String(m.outputPrice || ''));
  };

  const handleAcknowledgePriceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceReviewModel) return;
    setPriceSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/models/${priceReviewModel.id}/acknowledge-price`, {
        method: 'POST',
        body: JSON.stringify({
          inputPrice: Number(ackInputPrice),
          outputPrice: Number(ackOutputPrice),
        }),
      });
      if (res.ok) {
        setPriceReviewModel(null);
        await fetchModels();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to acknowledge price change');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating price');
    } finally {
      setPriceSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingModel(null);
    setModelId('');
    setDisplayName('');
    setFamily('claude');
    setProvider('Anthropic');
    setPlanCategory('claude_max_rolling');
    setDescription('');
    setContextWindow('1000000');
    setInputPrice('3.0');
    setOutputPrice('15.0');
    setSupplierCostInput('2.0');
    setSupplierCostOutput('8.0');
    setIsOnDemand(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (m: any) => {
    setEditingModel(m);
    setModelId(m.modelId);
    setDisplayName(m.displayName);
    setFamily(m.family || 'claude');
    setProvider(m.providerName || m.provider || 'Anthropic');
    setPlanCategory(m.planCategory || 'claude_max_rolling');
    setDescription(m.description || '');
    setContextWindow(String(m.contextWindow || 128000));
    setInputPrice(String(m.inputPrice || 0));
    setOutputPrice(String(m.outputPrice || 0));
    setSupplierCostInput(String(m.supplierCostInput || m.providerCostInput || 0));
    setSupplierCostOutput(String(m.supplierCostOutput || m.providerCostOutput || 0));
    setIsOnDemand(Boolean(m.isOnDemand));
    setShowModal(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        modelId,
        displayName,
        family,
        provider,
        planCategory,
        description,
        contextWindow: Number(contextWindow),
        inputPrice: Number(inputPrice),
        outputPrice: Number(outputPrice),
        providerCostInput: Number(supplierCostInput),
        providerCostOutput: Number(supplierCostOutput),
        supplierCostInput: Number(supplierCostInput),
        supplierCostOutput: Number(supplierCostOutput),
        isOnDemand,
      };

      const url = editingModel ? `/api/admin/models/${editingModel.id}` : '/api/admin/models';
      const method = editingModel ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchModels();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to save model');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      await adminFetch(`/api/admin/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      fetchModels();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleOnDemand = async (id: string, currentOnDemand: boolean) => {
    try {
      await adminFetch(`/api/admin/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isOnDemand: !currentOnDemand }),
      });
      fetchModels();
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = models.length;
    const active = models.filter((m) => m.validationStatus === 'ACTIVE' || (m.enabled && !m.validationStatus)).length;
    const pending = models.filter((m) => m.validationStatus === 'PENDING_VALIDATION' || m.validationStatus === 'DISCOVERED').length;
    const priceAlerts = models.filter((m) => m.hasUpstreamPriceChange).length;
    const unavailable = models.filter((m) => m.validationStatus === 'TEMPORARILY_UNAVAILABLE' || m.validationStatus === 'REMOVED_UPSTREAM').length;
    
    // Find latest sync timestamp
    let lastSync: Date | null = null;
    models.forEach((m) => {
      if (m.lastSyncAt) {
        const d = new Date(m.lastSyncAt);
        if (!lastSync || d > lastSync) lastSync = d;
      }
    });

    return { total, active, pending, priceAlerts, unavailable, lastSync: lastSync as Date | null };
  }, [models]);

  const pendingModels = useMemo(() => {
    return models.filter((m) => m.validationStatus === 'PENDING_VALIDATION' || m.validationStatus === 'DISCOVERED');
  }, [models]);

  const priceAlertModels = useMemo(() => {
    return models.filter((m) => m.hasUpstreamPriceChange);
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      // Family filter
      if (familyFilter !== 'ALL') {
        if (familyFilter === 'ONDEMAND') {
          if (!m.isOnDemand) return false;
        } else if ((m.family || '').toLowerCase() !== familyFilter.toLowerCase()) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE') {
          if (m.validationStatus !== 'ACTIVE' && !(m.enabled && !m.validationStatus)) return false;
        } else if (statusFilter === 'PENDING') {
          if (m.validationStatus !== 'PENDING_VALIDATION' && m.validationStatus !== 'DISCOVERED') return false;
        } else if (statusFilter === 'PRICE_ALERT') {
          if (!m.hasUpstreamPriceChange) return false;
        } else if (statusFilter === 'UNAVAILABLE') {
          if (m.validationStatus !== 'TEMPORARILY_UNAVAILABLE' && m.validationStatus !== 'REMOVED_UPSTREAM') return false;
        }
      }
      return true;
    });
  }, [models, familyFilter, statusFilter]);

  const uniqueFamilies = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.family) set.add(m.family.toLowerCase());
    });
    return Array.from(set).sort();
  }, [models]);

  return (
    <div className="space-y-6">
      {/* Top Header & Sync Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-purple-50 text-[#6d28d9] border border-purple-200">
            <Sparkles className="w-3 h-3 text-[#6d28d9]" />
            <span>Automated Model Synchronizer &amp; Routing Authority</span>
          </div>
          <h1 className="text-2xl font-bold text-fg mt-1">Model Catalog &amp; Routing Management</h1>
          <p className="text-xs text-muted mt-0.5">
            Synchronise ScaleMax upstream models, review staging approvals, enforce customer price margins, and configure multi-provider routes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchHistoryAndLogs();
              setShowHistoryModal(true);
            }}
            className="px-3 py-2 rounded-control border border-border bg-subtle hover:bg-card text-fg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="View sync history and differential change logs"
          >
            <History className="w-3.5 h-3.5 text-muted" />
            <span>Sync Audit Logs</span>
          </button>

          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="ui-button-primary text-xs py-2 px-4 gap-2 flex items-center shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronising ScaleMax...' : 'Sync ScaleMax Now'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-3 py-2 rounded-control border border-border bg-subtle hover:bg-card text-fg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner (if just triggered) */}
      {syncResult && (
        <div
          className={`p-3.5 rounded-panel border text-xs font-mono flex items-start justify-between gap-3 ${
            syncResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {syncResult.success
                  ? `Sync Completed Successfully in ${(syncResult.durationMs / 1000).toFixed(1)}s`
                  : 'Sync Encountered Issues'}
              </p>
              <p className="text-[11px] mt-0.5 opacity-90">
                Discovered: <strong>{syncResult.modelsDiscovered}</strong> · Added (Staged):{' '}
                <strong>{syncResult.modelsAdded}</strong> · Updated: <strong>{syncResult.modelsUpdated}</strong> ·
                Unavailable: <strong>{syncResult.modelsUnavailable}</strong> · Upstream Price Discrepancies:{' '}
                <strong>{syncResult.priceChangesCount}</strong>
              </p>
            </div>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-muted hover:text-fg text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-panel p-3.5 shadow-xs">
          <p className="text-[11px] font-mono text-muted uppercase">Total Catalog</p>
          <p className="text-2xl font-bold font-mono text-fg mt-1">{metrics.total}</p>
          <p className="text-[10px] text-muted mt-0.5 font-mono">Registered models</p>
        </div>

        <div className="bg-card border border-border rounded-panel p-3.5 shadow-xs">
          <p className="text-[11px] font-mono text-emerald-600 uppercase">Active In-Prod</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{metrics.active}</p>
          <p className="text-[10px] text-muted mt-0.5 font-mono">Live customer routing</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`cursor-pointer border rounded-panel p-3.5 shadow-xs transition-colors ${
            metrics.pending > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/60'
              : 'bg-card border-border'
          }`}
        >
          <p className="text-[11px] font-mono text-amber-700 uppercase flex items-center justify-between">
            <span>Staged Pending</span>
            {metrics.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-800 mt-1">{metrics.pending}</p>
          <p className="text-[10px] text-amber-700 mt-0.5 font-mono">Awaiting admin review</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'PRICE_ALERT' ? 'ALL' : 'PRICE_ALERT')}
          className={`cursor-pointer border rounded-panel p-3.5 shadow-xs transition-colors ${
            metrics.priceAlerts > 0
              ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100/60'
              : 'bg-card border-border'
          }`}
        >
          <p className="text-[11px] font-mono text-rose-700 uppercase flex items-center justify-between">
            <span>Price Discrepancy</span>
            {metrics.priceAlerts > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
          </p>
          <p className="text-2xl font-bold font-mono text-rose-800 mt-1">{metrics.priceAlerts}</p>
          <p className="text-[10px] text-rose-700 mt-0.5 font-mono">Upstream cost alerts</p>
        </div>

        <div className="bg-card border border-border rounded-panel p-3.5 shadow-xs">
          <p className="text-[11px] font-mono text-muted uppercase">Last Sync Run</p>
          <p className="text-sm font-bold font-mono text-fg mt-2 truncate">
            {metrics.lastSync ? metrics.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
          </p>
          <p className="text-[10px] text-muted mt-0.5 font-mono">
            {metrics.lastSync ? metrics.lastSync.toLocaleDateString() : 'Auto-scheduled 12m'}
          </p>
        </div>
      </div>

      {/* Staged Models Approval Alert Banner */}
      {pendingModels.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-panel p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs font-mono uppercase">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{pendingModels.length} Newly Discovered Model(s) Awaiting Activation</span>
            </div>
            <span className="text-[11px] font-mono text-amber-700">Staged Validation Workflow</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {pendingModels.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-amber-200 rounded-lg p-3 text-xs font-mono space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="font-bold text-fg text-sm">{m.displayName}</p>
                    <p className="text-[11px] text-muted font-mono">{m.modelId}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    Staged
                  </span>
                </div>

                <div className="text-[11px] text-muted space-y-0.5 border-t border-border/40 pt-1.5">
                  <p>
                    Upstream Cost: In <strong>${Number(m.supplierCostInput || 0).toFixed(2)}</strong> / Out{' '}
                    <strong>${Number(m.supplierCostOutput || 0).toFixed(2)}</strong>
                  </p>
                  <p>
                    Suggested Price: In <strong>${Number(m.inputPrice || 0).toFixed(2)}</strong> / Out{' '}
                    <strong>${Number(m.outputPrice || 0).toFixed(2)}</strong>
                  </p>
                  <p>
                    Context: <strong>{(m.contextWindow / 1000).toFixed(0)}k tokens</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenApproveModal(m)}
                  className="w-full ui-button-primary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Review &amp; Approve</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upstream Price Discrepancy Banner */}
      {priceAlertModels.length > 0 && (
        <div className="bg-rose-50/90 border border-rose-300 rounded-panel p-4 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs font-mono uppercase">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>
              {priceAlertModels.length} Model(s) with Upstream Price Changes (Selling Prices Preserved)
            </span>
          </div>
          <p className="text-xs text-rose-700">
            ScaleMax rates changed upstream. Per business invariants, customer selling prices were preserved to maintain margins. Review and acknowledge to clear alerts.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {priceAlertModels.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleOpenPriceReviewModal(m)}
                className="bg-white border border-rose-300 hover:border-rose-400 rounded px-2.5 py-1 text-xs font-mono text-rose-900 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <TrendingUp className="w-3 h-3 text-rose-600" />
                <span>
                  {m.displayName}: {m.upstreamPriceChangeDetails || 'Upstream rate change'}
                </span>
                <span className="text-rose-500 font-bold ml-1">→ Review</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFamilyFilter('ALL')}
            className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-colors ${
              familyFilter === 'ALL' ? 'bg-accent text-white' : 'bg-subtle text-muted hover:text-fg'
            }`}
          >
            All Models ({models.length})
          </button>
          <button
            type="button"
            onClick={() => setFamilyFilter('ONDEMAND')}
            className={`px-3 py-1.5 rounded-control text-xs font-mono font-bold transition-colors ${
              familyFilter === 'ONDEMAND' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            ⚡ On-Demand ({models.filter((m) => m.isOnDemand).length})
          </button>
          {uniqueFamilies.map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setFamilyFilter(fam)}
              className={`px-3 py-1.5 rounded-control text-xs font-mono uppercase font-bold transition-colors ${
                familyFilter === fam ? 'bg-accent text-white' : 'bg-subtle text-muted hover:text-fg'
              }`}
            >
              {fam} ({models.filter((m) => (m.family || '').toLowerCase() === fam).length})
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-muted text-[11px] mr-1">Status:</span>
          {['ALL', 'ACTIVE', 'PENDING', 'PRICE_ALERT', 'UNAVAILABLE'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors ${
                statusFilter === st ? 'bg-fg text-bg' : 'text-muted hover:text-fg'
              }`}
            >
              {st === 'PRICE_ALERT' ? 'Price Alert' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading models...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Model &amp; ID</th>
                  <th className="py-3 px-4">Capabilities</th>
                  <th className="py-3 px-4">Staged Status</th>
                  <th className="py-3 px-4">Context Window</th>
                  <th className="py-3 px-4">Selling Price (In / Out)</th>
                  <th className="py-3 px-4">Supplier Cost (In / Out)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredModels.map((m) => {
                  const inPrice = Number(m.inputPrice || 0);
                  const outPrice = Number(m.outputPrice || 0);
                  const inCost = Number(m.supplierCostInput || m.providerCostInput || 0);
                  const outCost = Number(m.supplierCostOutput || m.providerCostOutput || 0);
                  const marginIn = inPrice > inCost ? Math.round(((inPrice - inCost) / inPrice) * 100) : 0;

                  const isPending = m.validationStatus === 'PENDING_VALIDATION' || m.validationStatus === 'DISCOVERED';
                  const isUnavailable = m.validationStatus === 'TEMPORARILY_UNAVAILABLE' || m.validationStatus === 'REMOVED_UPSTREAM';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-bg/40 ${
                        isPending ? 'bg-amber-50/30' : m.hasUpstreamPriceChange ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Model & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-fg">{m.displayName}</p>
                          {m.modelId.includes('argon') && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-[#6d28d9] uppercase">
                              New
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-muted">{m.modelId}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-subtle text-muted uppercase font-mono">
                            {m.family || 'custom'}
                          </span>
                          <span className="text-[10px] text-muted/70 font-mono">
                            via {m.providerSlug === 'scalemax' ? 'ScaleMax' : 'Opus Max'}
                          </span>
                        </div>
                      </td>

                      {/* Capabilities */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {m.supportsVision && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 font-mono font-medium">
                              Vision
                            </span>
                          )}
                          {m.supportsTools && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-50 text-purple-700 font-mono font-medium">
                              Tools
                            </span>
                          )}
                          {m.supportsReasoning && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 font-mono font-medium">
                              Reasoning
                            </span>
                          )}
                          {m.supportsStreaming && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-mono font-medium">
                              Stream
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Staged Status */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : isUnavailable
                                ? 'bg-slate-200 text-slate-700'
                                : m.enabled
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {m.validationStatus || (m.enabled ? 'ACTIVE' : 'DISABLED')}
                          </span>

                          {m.hasUpstreamPriceChange && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 uppercase flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Price Alert
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Context Window */}
                      <td className="py-3 px-4 font-mono text-muted">
                        {(m.contextWindow / 1000).toFixed(0)}k tokens
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-mono">
                        <p className="font-semibold text-fg">
                          ${inPrice.toFixed(2)} / ${outPrice.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-medium">
                          {marginIn}% gross margin
                        </p>
                      </td>

                      {/* Supplier Cost */}
                      <td className="py-3 px-4 font-mono text-muted">
                        <p>
                          ${inCost.toFixed(2)} / ${outCost.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted/70">Upstream wholesale</p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(m)}
                              className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs"
                              title="Approve and activate model for customers"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          ) : m.hasUpstreamPriceChange ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPriceReviewModal(m)}
                              className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 flex items-center gap-1 border border-rose-300"
                              title="Review upstream price change"
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span>Review Cost</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleEnabled(m.id, m.enabled)}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${
                                m.enabled
                                  ? 'border-border bg-bg hover:bg-card text-muted hover:text-fg'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {m.enabled ? 'Disable' : 'Enable'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleOnDemand(m.id, m.isOnDemand)}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                              m.isOnDemand
                                ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                                : 'border-border text-muted hover:text-fg'
                            }`}
                            title="Toggle On-Demand Status"
                          >
                            {m.isOnDemand ? '⚡ On-Demand' : 'On-Demand'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1 rounded border border-border hover:bg-subtle text-fg"
                            title="Edit Model"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Approve Model Modal */}
      {approvingModel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto text-xs font-mono">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-fg">Approve &amp; Activate Model</h3>
                <p className="text-[11px] text-muted">Assign production pricing to enable customer routing</p>
              </div>
              <button onClick={() => setApprovingModel(null)} className="text-muted hover:text-fg text-sm">
                ✕
              </button>
            </div>

            <div className="bg-subtle/50 border border-border rounded-lg p-3 space-y-1.5">
              <p className="font-bold text-fg text-sm">{approvingModel.displayName}</p>
              <p className="text-[11px] text-muted">{approvingModel.modelId}</p>
              <div className="border-t border-border/40 pt-1.5 flex justify-between text-[11px]">
                <span>Upstream Wholesale Cost:</span>
                <span className="font-bold">
                  In ${Number(approvingModel.supplierCostInput || 0).toFixed(2)} / Out $
                  {Number(approvingModel.supplierCostOutput || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleApproveModel} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Customer Input Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={approveInputPrice}
                    onChange={(e) => setApproveInputPrice(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1">Customer Output Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={approveOutputPrice}
                    onChange={(e) => setApproveOutputPrice(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApprovingModel(null)}
                  className="px-3 py-1.5 rounded-control border border-border hover:bg-subtle text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approvingSubmitting}
                  className="ui-button-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{approvingSubmitting ? 'Activating...' : 'Activate for Customers'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price Discrepancy Review Modal */}
      {priceReviewModel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto text-xs font-mono">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-fg">Upstream Price Change Review</h3>
                <p className="text-[11px] text-muted">Preserve margin or adjust customer pricing</p>
              </div>
              <button onClick={() => setPriceReviewModel(null)} className="text-muted hover:text-fg text-sm">
                ✕
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-1 text-rose-900">
              <p className="font-bold">{priceReviewModel.displayName}</p>
              <p className="text-[11px]">{priceReviewModel.upstreamPriceChangeDetails}</p>
              <p className="text-[11px] opacity-80 pt-1">
                Current Upstream Cost: In ${Number(priceReviewModel.supplierCostInput || 0).toFixed(2)} / Out $
                {Number(priceReviewModel.supplierCostOutput || 0).toFixed(2)}
              </p>
            </div>

            <form onSubmit={handleAcknowledgePriceChange} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Selling Input Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ackInputPrice}
                    onChange={(e) => setAckInputPrice(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1">Selling Output Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ackOutputPrice}
                    onChange={(e) => setAckOutputPrice(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPriceReviewModel(null)}
                  className="px-3 py-1.5 rounded-control border border-border hover:bg-subtle text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={priceSubmitting}
                  className="ui-button-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{priceSubmitting ? 'Updating...' : 'Acknowledge & Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync History & Audit Logs Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col text-xs font-mono">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-fg">Model Synchronizer Audit Trail</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-muted hover:text-fg text-sm">
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-border pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setHistoryTab('syncs')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  historyTab === 'syncs' ? 'bg-accent text-white' : 'bg-subtle text-muted hover:text-fg'
                }`}
              >
                Sync Executions ({syncHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('changes')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  historyTab === 'changes' ? 'bg-accent text-white' : 'bg-subtle text-muted hover:text-fg'
                }`}
              >
                Differential Changes ({changeLogs.length})
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-border/60">
              {historyTab === 'syncs' ? (
                syncHistory.length === 0 ? (
                  <p className="text-center py-8 text-muted">No sync history recorded yet.</p>
                ) : (
                  syncHistory.map((h) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              h.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {h.status}
                          </span>
                          <span className="font-bold text-fg">{h.syncTrigger}</span>
                          <span className="text-muted text-[11px]">
                            {new Date(h.startedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-1">
                          Discovered: {h.modelsDiscovered} · Added: {h.modelsAdded} · Updated: {h.modelsUpdated} ·
                          Unavailable: {h.modelsUnavailable} · Duration: {(h.durationMs / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : changeLogs.length === 0 ? (
                <p className="text-center py-8 text-muted">No model changes recorded yet.</p>
              ) : (
                changeLogs.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            c.changeType === 'ADDED'
                              ? 'bg-purple-100 text-[#6d28d9]'
                              : c.changeType === 'PRICE_CHANGED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-subtle text-fg'
                          }`}
                        >
                          {c.changeType}
                        </span>
                        <span className="font-bold text-fg">{c.modelId}</span>
                        <span className="text-muted text-[11px]">
                          {new Date(c.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-1">
                        Field: <strong>{c.fieldName}</strong> · {c.oldValue ? `From: ${c.oldValue} → ` : ''}
                        To: <strong>{c.newValue}</strong>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding / Editing Model */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col overflow-hidden text-xs font-mono">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-bold text-fg">
                {editingModel ? `Edit Model: ${editingModel.displayName}` : 'Add Model to Catalog'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-muted mb-1">Model Identifier (API model id)</label>
                <input
                  type="text"
                  required
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  disabled={!!editingModel}
                  className="ui-input w-full font-mono"
                  placeholder="e.g. claude-sonnet-5.5 or gemini-4-argon"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="ui-input w-full"
                  placeholder="e.g. Gemini 4 Argon"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Family</label>
                  <select
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                    className="ui-input w-full font-mono uppercase"
                  >
                    <option value="claude">Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="grok">Grok</option>
                    <option value="qwen">Qwen</option>
                    <option value="glm">GLM</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted mb-1">Provider Name</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="ui-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1">Context Window (Tokens)</label>
                <input
                  type="number"
                  value={contextWindow}
                  onChange={(e) => setContextWindow(e.target.value)}
                  className="ui-input w-full font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Selling Input Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1">Selling Output Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={outputPrice}
                    onChange={(e) => setOutputPrice(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Wholesale Supplier Cost Input ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={supplierCostInput}
                    onChange={(e) => setSupplierCostInput(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1">Wholesale Supplier Cost Output ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={supplierCostOutput}
                    onChange={(e) => setSupplierCostOutput(e.target.value)}
                    className="ui-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnDemand}
                    onChange={(e) => setIsOnDemand(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-fg font-medium">⚡ On-Demand Only</span>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-control border border-border hover:bg-subtle text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-button-primary text-xs py-1.5 px-4"
                >
                  {submitting ? 'Saving...' : 'Save Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminModels;
