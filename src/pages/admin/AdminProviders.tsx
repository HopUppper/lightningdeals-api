import React, { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, CheckCircle2, XCircle, ShieldAlert, Edit2, Code, DollarSign, Activity, Layers, FileText, ArrowUpRight } from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface VendorProviderItem {
  id: string;
  name: string;
  providerType: string;
  protocol: string;
  baseUrl: string;
  displayMasterKey: string;
  status: string;
  isPrimary: boolean;
  availableTokens: string;
  purchasedTokens: string;
  consumedTokens: string;
  warningThresholdTokens: string;
  criticalThresholdTokens: string;
  modelMappingsJson?: string;
  headersJson?: string;
  lastTestedAt?: string;
  lastError?: string;
  notes?: string;
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
  const [isPrimary, setIsPrimary] = useState(true);
  const [modelMappingsJson, setModelMappingsJson] = useState('{\n  "claude-sonnet-5": "claude-3-5-sonnet-20241022",\n  "claude-opus-5": "claude-3-opus-20240229"\n}');
  const [headersJson, setHeadersJson] = useState('{\n  "x-custom-vendor-id": "lightningdeals-prod"\n}');
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

  // Test Connection State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});

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
  }, []);

  const openCreateModal = () => {
    setEditingProvider(null);
    setName('Anthropic Official Vendor');
    setProviderType('anthropic');
    setProtocol('anthropic');
    setMasterApiKey('');
    setBaseUrl('https://api.anthropic.com');
    setIsPrimary(true);
    setModelMappingsJson('{\n  "claude-sonnet-5": "claude-3-5-sonnet-20241022",\n  "claude-opus-5": "claude-3-opus-20240229"\n}');
    setHeadersJson('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (p: VendorProviderItem) => {
    setEditingProvider(p);
    setName(p.name);
    setProviderType(p.providerType || 'anthropic');
    setProtocol(p.protocol || p.providerType || 'anthropic');
    setMasterApiKey('');
    setBaseUrl(p.baseUrl);
    setIsPrimary(p.isPrimary);
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

    const url = editingProvider ? `/api/admin/providers/${editingProvider.id}` : '/api/admin/providers';
    const method = editingProvider ? 'PUT' : 'POST';

    try {
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify({
          name,
          providerType,
          protocol,
          masterApiKey: masterApiKey || undefined,
          baseUrl,
          isPrimary,
          modelMappingsJson,
          headersJson,
          notes,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setShowModal(false);
        await fetchProviders();
      } else {
        setFormError(resData?.error?.message || 'Failed to save vendor configuration.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Network error saving vendor configuration.');
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

  const handleReconcileLedger = async () => {
    const primary = providers.find((p) => p.isPrimary) || providers[0];
    if (!primary) return;

    try {
      const res = await adminFetch(`/api/admin/providers/${primary.id}/reconcile`, { method: 'POST' });
      if (res.ok) {
        setReconcileResult(await res.json());
      }
    } catch (e) {
      console.error(e);
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

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'HEALTHY' || s === 'CONNECTED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">● HEALTHY</span>;
    }
    if (s === 'WARNING') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">⚠️ WARNING (LOW)</span>;
    }
    if (s === 'CRITICAL') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 font-mono animate-pulse">🚨 CRITICAL</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30">⛔ DEPLETED</span>;
  };

  const primaryProvider = providers.find((p) => p.isPrimary) || providers[0];

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

      {/* Master Vendor Balance Control Center Card */}
      <div className="bg-card border border-border rounded-panel p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-fg font-mono">Vendor Master Token Balance</h2>
              {getStatusBadge(balanceMetrics?.status || 'HEALTHY')}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Active Upstream Provider: <span className="font-semibold text-fg">{primaryProvider?.name || 'Anthropic Official Vendor'}</span> ({primaryProvider?.displayMasterKey || 'Not Set'})
            </p>
          </div>

          <button
            onClick={handleReconcileLedger}
            className="ui-button-secondary text-xs py-1.5 px-3 gap-1.5 font-mono self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Audit Reconcile Ledger</span>
          </button>
        </div>

        {/* Master Balance KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-control bg-bg border border-border space-y-1">
            <p className="text-[11px] text-muted uppercase font-bold">Available Master Tokens</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatTokens(balanceMetrics?.availableTokens || primaryProvider?.availableTokens || '100000000')}
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
              {formatTokens(balanceMetrics?.consumedTokens || primaryProvider?.consumedTokens || '0')}
            </p>
            <p className="text-[10px] text-muted">Total tokens used by customer requests</p>
          </div>

          <div className="p-4 rounded-control bg-bg border border-border space-y-1">
            <p className="text-[11px] text-muted uppercase font-bold font-mono">Lifetime Purchased Tokens</p>
            <p className="text-2xl font-bold text-fg">
              {formatTokens(balanceMetrics?.purchasedTokens || primaryProvider?.purchasedTokens || '100000000')}
            </p>
            <p className="text-[10px] text-muted">Total master tokens topped up across {balanceMetrics?.topUpCount || 0} top-ups</p>
          </div>
        </div>

        {reconcileResult && (
          <div className={`p-3.5 rounded-control border text-xs font-mono flex items-center justify-between gap-3 ${
            reconcileResult.isReconciled ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-700' : 'bg-red-500/5 border-red-500/30 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {reconcileResult.isReconciled
                  ? `Ledger Reconciled Perfectly! Database Balance: ${formatTokens(reconcileResult.dbBalance)} matches sum of ${reconcileResult.transactionCount} transactions.`
                  : `Ledger Discrepancy Detected! DB: ${formatTokens(reconcileResult.dbBalance)}, Calculated: ${formatTokens(reconcileResult.calculatedBalance)}.`}
              </span>
            </div>
            <button onClick={() => setReconcileResult(null)} className="text-muted hover:text-fg font-mono text-xs">✕</button>
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
                    <th className="py-3 px-4 font-bold">Vendor Name</th>
                    <th className="py-3 px-4 font-bold">Protocol</th>
                    <th className="py-3 px-4 font-bold">Base URL</th>
                    <th className="py-3 px-4 font-bold">Master Key</th>
                    <th className="py-3 px-4 font-bold">Available Tokens</th>
                    <th className="py-3 px-4 font-bold">Primary</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-bg/40">
                      <td className="py-3.5 px-4 font-semibold font-sans text-fg">{p.name}</td>
                      <td className="py-3.5 px-4 uppercase text-amber-600 font-bold">{p.protocol || p.providerType}</td>
                      <td className="py-3.5 px-4 text-muted max-w-[200px] truncate">{p.baseUrl}</td>
                      <td className="py-3.5 px-4 text-fg font-bold">{p.displayMasterKey}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">{formatTokens(p.availableTokens || '100000000')}</td>
                      <td className="py-3.5 px-4">
                        {p.isPrimary && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            PRIMARY
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded border border-border text-muted hover:text-fg hover:bg-bg transition-colors"
                          title="Edit Configuration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTestConnection(p.id)}
                          disabled={testingId === p.id}
                          className="px-3 py-1.5 rounded text-xs font-semibold border border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${testingId === p.id ? 'animate-spin' : ''}`} />
                          <span>{testingId === p.id ? 'Testing...' : 'Test Connection'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-bold text-fg font-mono flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Top Up Master Vendor Balance</span>
              </h3>
              <button onClick={() => setShowTopUpModal(false)} className="text-muted hover:text-fg text-sm font-mono">✕</button>
            </div>

            {topUpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{topUpError}</span>
              </div>
            )}

            <form onSubmit={handleTopUpSubmit} className="space-y-4 text-xs font-mono">
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

              <div className="flex justify-end gap-3 pt-4 border-t border-border font-sans">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-bold text-fg font-mono">
                {editingProvider ? 'Edit Vendor Credentials' : 'Add Custom Vendor Provider'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm font-mono">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anthropic Official Vendor"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-sans"
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
                    <option value="anthropic">Anthropic Official</option>
                    <option value="openai">OpenAI Compatible</option>
                    <option value="custom_http">Custom HTTP Proxy</option>
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

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">Base URL (HTTPS Only) *</label>
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.anthropic.com"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
                />
              </div>

              <div>
                <label className="block font-bold text-fg mb-1 uppercase">
                  {editingProvider ? 'Update Master API Key (Leave blank to keep existing)' : 'Master API Key *'}
                </label>
                <input
                  type="password"
                  value={masterApiKey}
                  onChange={(e) => setMasterApiKey(e.target.value)}
                  placeholder={editingProvider ? 'sm_live_•••••••• or sk-ant-••••••••' : 'sm_live_•••••••• (Vendor Master Key)'}
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
                <p className="text-[10px] text-muted mt-1 font-sans">
                  Supports custom vendor keys (<code className="text-violet-600 font-mono">sm_live_...</code>), Anthropic (<code className="text-violet-600 font-mono">sk-ant-...</code>), OpenAI, and HTTP proxies.
                </p>
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

              <div className="flex justify-end gap-3 pt-4 border-t border-border font-sans">
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
    </div>
  );
};
