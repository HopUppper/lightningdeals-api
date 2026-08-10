import React, { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, CheckCircle2, XCircle, ShieldAlert, Edit2, Code } from 'lucide-react';

interface VendorProviderItem {
  id: string;
  name: string;
  providerType: string;
  protocol: string;
  baseUrl: string;
  displayMasterKey: string;
  status: string;
  isPrimary: boolean;
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

  // Form State
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

  // Test Connection State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/providers');
      if (res.ok) {
        setProviders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
        fetchProviders();
      } else {
        setFormError(resData?.error?.message || 'Failed to save vendor configuration.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Network error saving vendor configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestConnection = async (providerId: string, masterKey?: string, url?: string, proto?: string) => {
    setTestingId(providerId);
    try {
      const res = await fetch('/api/admin/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          masterApiKey: masterKey,
          baseUrl: url,
          protocol: proto,
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [providerId]: data }));
      fetchProviders();
    } catch (e: any) {
      setTestResults((prev) => ({ ...prev, [providerId]: { status: 'unavailable', message: e.message } }));
    } finally {
      setTestingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'connected') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">CONNECTED</span>;
    }
    if (s === 'ssrf_blocked') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">SSRF BLOCKED</span>;
    }
    if (s === 'invalid_credential') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">AUTH FAILED</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">{s.toUpperCase()}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Server className="w-6 h-6 text-amber-500" />
            <span>Multi-Vendor Provider System</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Configure custom vendor Base URLs, encrypted master keys, protocol adapters, model mappings, and SSRF security checks.
          </p>
        </div>

        <button onClick={openCreateModal} className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold">
          <Plus className="w-4 h-4" />
          <span>Add Custom Vendor</span>
        </button>
      </div>

      {/* Providers Grid / Cards */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted font-mono">Loading vendor providers...</div>
        ) : providers.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted font-mono">No vendor providers configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Base URL</th>
                  <th className="py-3 px-4">Master Key</th>
                  <th className="py-3 px-4">Primary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Tested</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-bg/40">
                    <td className="py-3.5 px-4 font-semibold font-sans text-fg">{p.name}</td>
                    <td className="py-3.5 px-4 uppercase text-amber-500 font-bold">{p.protocol || p.providerType}</td>
                    <td className="py-3.5 px-4 text-muted max-w-[220px] truncate">{p.baseUrl}</td>
                    <td className="py-3.5 px-4 text-fg font-bold">{p.displayMasterKey}</td>
                    <td className="py-3.5 px-4">
                      {p.isPrimary && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          PRIMARY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-4 text-muted">
                      {p.lastTestedAt ? new Date(p.lastTestedAt).toLocaleTimeString() : 'Never'}
                    </td>
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
                        className="px-3 py-1.5 rounded text-xs font-semibold border border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
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

      {/* Test Results Alert Banner */}
      {Object.keys(testResults).map((id) => {
        const res = testResults[id];
        return (
          <div
            key={id}
            className={`p-4 rounded-control border text-xs font-mono flex items-center gap-3 ${
              res.status === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}
          >
            {res.status === 'connected' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>Connection Test Result: <strong>{res.status.toUpperCase()}</strong> — {res.message}</span>
          </div>
        );
      })}

      {/* Add / Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-bold text-fg font-mono">
                {editingProvider ? 'Edit Vendor Provider' : 'Add Custom Vendor Provider'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm font-mono">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-fg mb-1 font-mono uppercase">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anthropic Official Vendor / Custom Proxy"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 text-fg font-mono"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg mb-1 font-mono uppercase">Protocol Adapter</label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 text-fg font-mono"
                  >
                    <option value="anthropic">Anthropic Native (/v1/messages)</option>
                    <option value="openai-compatible">OpenAI Compatible (/chat/completions)</option>
                    <option value="custom_http">Custom HTTP Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-fg mb-1 font-mono uppercase">Base URL (SSRF Protected)</label>
                  <input
                    type="text"
                    required
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.vendor.com/v1"
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 text-fg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1 font-mono uppercase">Master API Key (Stored Encrypted Server-Side)</label>
                <input
                  type="password"
                  value={masterApiKey}
                  onChange={(e) => setMasterApiKey(e.target.value)}
                  placeholder={editingProvider ? 'Leave blank to keep existing key' : 'sk-ant-api03-...'}
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 text-fg"
                />
                <p className="text-[10px] text-muted mt-1 font-mono">Encrypted at rest with server secret. Never sent unmasked to client.</p>
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1 font-mono uppercase flex items-center justify-between">
                  <span>Model Mappings JSON</span>
                  <span className="text-[9px] text-muted">Internal ──&gt; Vendor Model</span>
                </label>
                <textarea
                  rows={3}
                  value={modelMappingsJson}
                  onChange={(e) => setModelMappingsJson(e.target.value)}
                  placeholder='{"claude-sonnet-5": "vendor-sonnet-v2"}'
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 text-fg"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1 font-mono uppercase">Optional Custom HTTP Headers JSON</label>
                <textarea
                  rows={2}
                  value={headersJson}
                  onChange={(e) => setHeadersJson(e.target.value)}
                  placeholder='{"x-vendor-organization": "org_123"}'
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 text-fg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimaryToggle"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="isPrimaryToggle" className="text-xs font-semibold text-fg font-mono">Set as Primary Active Production Vendor</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs bg-bg border border-border text-muted hover:text-fg rounded-control">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-xs bg-amber-500 text-black font-bold rounded-control hover:bg-amber-400 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Vendor Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
