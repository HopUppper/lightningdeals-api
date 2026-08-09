import React, { useState, useEffect } from 'react';
import { Server, Plus, Check, RefreshCw, Key, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const AdminProviders: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState('anthropic');
  const [masterApiKey, setMasterApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.anthropic.com');
  const [isPrimary, setIsPrimary] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          providerType,
          masterApiKey,
          baseUrl,
          isPrimary,
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName('');
        setMasterApiKey('');
        fetchProviders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestConnection = async (providerId: string, masterKey?: string, url?: string) => {
    setTestingId(providerId);
    try {
      const res = await fetch('/api/admin/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          masterApiKey: masterKey,
          baseUrl: url,
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [providerId]: data }));
      fetchProviders();
    } catch (e: any) {
      setTestResults((prev) => ({ ...prev, [providerId]: { status: 'configuration_error', message: e.message } }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Server className="w-6 h-6 text-amber-500" />
            <span>Vendor Master Key Management</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Securely configure vendor upstream credentials, base URLs, and test real API connectivity.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor Credential</span>
        </button>
      </div>

      {/* Providers Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading vendor credentials...</div>
        ) : providers.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">No vendor credentials configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Base URL</th>
                  <th className="py-3 px-4">Master API Key</th>
                  <th className="py-3 px-4">Primary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Tested</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-bg/40">
                    <td className="py-3.5 px-4 font-semibold text-fg">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-muted">{p.baseUrl}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-500 font-bold">{p.displayMasterKey}</td>
                    <td className="py-3.5 px-4">
                      {p.isPrimary && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          PRIMARY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted">
                      {p.lastTestedAt ? new Date(p.lastTestedAt).toLocaleTimeString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
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
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                : 'bg-red-500/10 border-red-500/30 text-red-600'
            }`}
          >
            {res.status === 'connected' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>Health Check Status: <strong>{res.status.toUpperCase()}</strong> — {res.message}</span>
          </div>
        );
      })}

      {/* Modal for Adding Vendor Master Key */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-fg">Add Vendor Master Credentials</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anthropic Official Vendor"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Master API Key (Stored Encrypted Server-Side)</label>
                <input
                  type="password"
                  required
                  value={masterApiKey}
                  onChange={(e) => setMasterApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
                <p className="text-[10px] text-muted mt-1">Key is encrypted with AES-256 and never sent to clients.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Base URL</label>
                <input
                  type="text"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.anthropic.com"
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="primary" className="text-xs font-semibold text-fg">Set as Primary Active Vendor</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 font-bold disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
