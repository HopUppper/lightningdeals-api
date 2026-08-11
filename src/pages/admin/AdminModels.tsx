import React, { useState, useEffect } from 'react';
import { Cpu, Plus, Edit2, Check, X } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminModels: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Model Form State
  const [modelId, setModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [provider, setProvider] = useState('Anthropic');
  const [description, setDescription] = useState('');
  const [contextWindow, setContextWindow] = useState('1000000');
  const [inputPrice, setInputPrice] = useState('3.0');
  const [outputPrice, setOutputPrice] = useState('15.0');
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

  useEffect(() => {
    fetchModels();
  }, []);

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await adminFetch('/api/admin/models', {
        method: 'POST',
        body: JSON.stringify({
          modelId,
          displayName,
          provider,
          description,
          contextWindow: Number(contextWindow),
          inputPrice: Number(inputPrice),
          outputPrice: Number(outputPrice),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setModelId('');
        setDisplayName('');
        setDescription('');
        fetchModels();
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Model Catalog Management</h1>
          <p className="text-xs text-muted mt-1">
            Add models, configure upstream providers, context windows, pricing, and availability.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="ui-button-primary text-xs py-2 px-4 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Model</span>
        </button>
      </div>

      {/* Models Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading models...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Model Name & ID</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Context Window</th>
                  <th className="py-3 px-4">Input Rate / 1M</th>
                  <th className="py-3 px-4">Output Rate / 1M</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-bg/40">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-fg">{m.displayName}</p>
                      <p className="font-mono text-[11px] text-muted">{m.modelId}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-fg">{m.provider}</td>
                    <td className="py-3.5 px-4 font-mono text-muted">{(m.contextWindow / 1000000).toFixed(1)}M</td>
                    <td className="py-3.5 px-4 font-mono text-fg">${m.inputPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-fg">${m.outputPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {m.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleEnabled(m.id, m.enabled)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold border border-border bg-bg hover:bg-card text-fg"
                      >
                        {m.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adding Model */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-fg">Add Model to Catalog</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateModel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Model ID</label>
                <input
                  type="text"
                  required
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="claude-3-5-sonnet-20241022 or claude-opus-5"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Claude Opus 5"
                  className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                >
                  <option value="Anthropic">Anthropic</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Google">Google</option>
                  <option value="xAI">xAI</option>
                  <option value="DeepSeek">DeepSeek</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Input $/1M Tokens</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Output $/1M Tokens</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={outputPrice}
                    onChange={(e) => setOutputPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
