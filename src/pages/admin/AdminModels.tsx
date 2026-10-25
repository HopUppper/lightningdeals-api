import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Plus,
  Edit2,
  Check,
  X,
  RefreshCw,
  Server,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Filter,
  Trash2,
  Layers,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface ModelItem {
  id: string;
  modelId: string;
  displayName: string;
  family: string;
  protocol: string;
  providerSlug: string;
  providerId: string | null;
  providerName: string;
  providerStatus: string;
  upstreamModelId: string;
  description?: string;
  contextWindow: number;
  inputPrice: number;
  outputPrice: number;
  providerCostInput: number;
  providerCostOutput: number;
  inputMargin: number;
  outputMargin: number;
  marginPercent: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportedPlans: string[];
  enabled: boolean;
  isCustomerAvailable: boolean;
  createdAt: string;
}

export const AdminModels: React.FC = () => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelItem | null>(null);

  // Form State
  const [modelId, setModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [family, setFamily] = useState('openai');
  const [protocol, setProtocol] = useState('openai-compatible');
  const [providerSlug, setProviderSlug] = useState('scalemax');
  const [upstreamModelId, setUpstreamModelId] = useState('');
  const [description, setDescription] = useState('');
  const [contextWindow, setContextWindow] = useState('128000');
  const [inputPrice, setInputPrice] = useState('2.50');
  const [outputPrice, setOutputPrice] = useState('10.00');
  const [providerCostInput, setProviderCostInput] = useState('2.00');
  const [providerCostOutput, setProviderCostOutput] = useState('8.00');
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (e) {
      console.error('Error fetching models:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const openCreateModal = () => {
    setEditingModel(null);
    setModelId('');
    setDisplayName('');
    setFamily('openai');
    setProtocol('openai-compatible');
    setProviderSlug('scalemax');
    setUpstreamModelId('');
    setDescription('');
    setContextWindow('128000');
    setInputPrice('2.50');
    setOutputPrice('10.00');
    setProviderCostInput('2.00');
    setProviderCostOutput('8.00');
    setShowModal(true);
  };

  const openEditModal = (m: ModelItem) => {
    setEditingModel(m);
    setModelId(m.modelId);
    setDisplayName(m.displayName);
    setFamily(m.family || 'claude');
    setProtocol(m.protocol || 'anthropic');
    setProviderSlug(m.providerSlug || 'opus_max');
    setUpstreamModelId(m.upstreamModelId || m.modelId);
    setDescription(m.description || '');
    setContextWindow(String(m.contextWindow || 128000));
    setInputPrice(String(m.inputPrice));
    setOutputPrice(String(m.outputPrice));
    setProviderCostInput(String(m.providerCostInput));
    setProviderCostOutput(String(m.providerCostOutput));
    setShowModal(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      modelId,
      displayName,
      family,
      protocol,
      providerSlug,
      upstreamModelId: upstreamModelId || modelId,
      description,
      contextWindow: Number(contextWindow),
      inputPrice: Number(inputPrice),
      outputPrice: Number(outputPrice),
      providerCostInput: Number(providerCostInput),
      providerCostOutput: Number(providerCostOutput),
    };

    try {
      const url = editingModel ? `/api/admin/models/${editingModel.id}` : '/api/admin/models';
      const method = editingModel ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchModels();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickProviderChange = async (modelItem: ModelItem, newSlug: string) => {
    setUpdatingId(modelItem.id);
    try {
      const res = await adminFetch(`/api/admin/models/${modelItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          providerSlug: newSlug,
          protocol: newSlug === 'scalemax' ? 'openai-compatible' : 'anthropic',
        }),
      });
      if (res.ok) {
        await fetchModels();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    setUpdatingId(id);
    try {
      const res = await adminFetch(`/api/admin/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        await fetchModels();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteModel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete model "${name}"?`)) return;
    try {
      const res = await adminFetch(`/api/admin/models/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchModels();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const families = useMemo(() => {
    const famSet = new Set<string>();
    models.forEach((m) => famSet.add(m.family || 'other'));
    return Array.from(famSet);
  }, [models]);

  const filteredModels = useMemo(() => {
    if (selectedFamily === 'all') return models;
    return models.filter((m) => (m.family || 'other').toLowerCase() === selectedFamily.toLowerCase());
  }, [models, selectedFamily]);

  const totalModels = models.length;
  const activeModels = models.filter((m) => m.enabled).length;
  const opusModels = models.filter((m) => m.providerSlug === 'opus_max').length;
  const scaleModels = models.filter((m) => m.providerSlug === 'scalemax').length;

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Multi-Provider Model Routing & Catalog</h1>
          <p className="text-xs text-muted mt-1">
            Assign models dynamically between OpusMax and ScaleMax. Monitor customer pricing, provider costs, and margin accounting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchModels}
            disabled={loading}
            className="p-2 border border-border rounded-control hover:bg-bg text-muted hover:text-fg text-xs flex items-center gap-1.5"
            title="Refresh models"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="ui-button-primary text-xs py-2 px-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-panel p-3.5">
          <p className="text-[11px] font-mono uppercase text-muted">Total Models</p>
          <p className="text-xl font-bold text-fg mt-1">{totalModels}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{activeModels} active for routing</p>
        </div>
        <div className="bg-card border border-border rounded-panel p-3.5">
          <p className="text-[11px] font-mono uppercase text-muted">OpusMax Models</p>
          <p className="text-xl font-bold text-violet-600 mt-1">{opusModels}</p>
          <p className="text-[10px] text-muted mt-0.5">Claude 5-Hour Rolling</p>
        </div>
        <div className="bg-card border border-border rounded-panel p-3.5">
          <p className="text-[11px] font-mono uppercase text-muted">ScaleMax Models</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{scaleModels}</p>
          <p className="text-[10px] text-muted mt-0.5">OpenAI, DeepSeek, Gemini</p>
        </div>
        <div className="bg-card border border-border rounded-panel p-3.5">
          <p className="text-[11px] font-mono uppercase text-muted">Average Margin</p>
          <p className="text-xl font-bold text-fg mt-1">
            {models.length > 0
              ? `${Math.round(models.reduce((acc, m) => acc + (m.marginPercent || 0), 0) / models.length)}%`
              : '0%'}
          </p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Gross Spread</p>
        </div>
      </div>

      {/* Family Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setSelectedFamily('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedFamily === 'all'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'border border-border text-muted hover:text-fg hover:bg-bg'
          }`}
        >
          All Families ({models.length})
        </button>
        {families.map((fam) => {
          const count = models.filter((m) => (m.family || 'other') === fam).length;
          return (
            <button
              key={fam}
              onClick={() => setSelectedFamily(fam)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                selectedFamily === fam
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'border border-border text-muted hover:text-fg hover:bg-bg'
              }`}
            >
              {fam} ({count})
            </button>
          );
        })}
      </div>

      {/* Models Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
            <span>Loading model catalog and provider routes...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted">
            No models found in this family.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/60 text-[11px]">
                  <th className="py-3 px-4">Model & Upstream</th>
                  <th className="py-3 px-4">Family</th>
                  <th className="py-3 px-4">Active Provider Route</th>
                  <th className="py-3 px-4">Customer Rate / 1M</th>
                  <th className="py-3 px-4">Provider Cost / 1M</th>
                  <th className="py-3 px-4">Margin Spread</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredModels.map((m) => {
                  const isOpus = m.providerSlug === 'opus_max';
                  return (
                    <tr key={m.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-fg">{m.displayName}</p>
                            <p className="font-mono text-[11px] text-muted">{m.modelId}</p>
                            {m.upstreamModelId && m.upstreamModelId !== m.modelId && (
                              <p className="font-mono text-[10px] text-violet-600">→ {m.upstreamModelId}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-bg border border-border text-fg">
                          {m.family || 'general'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={m.providerSlug || 'opus_max'}
                            disabled={updatingId === m.id}
                            onChange={(e) => handleQuickProviderChange(m, e.target.value)}
                            className={`px-2.5 py-1 text-[11px] font-semibold font-mono rounded-lg border transition-all ${
                              isOpus
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <option value="opus_max">OpusMax</option>
                            <option value="scalemax">ScaleMax</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-fg">
                        <div>
                          <span className="text-muted text-[10px]">In: </span>
                          <span>${m.inputPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted text-[10px]">Out: </span>
                          <span>${m.outputPrice.toFixed(2)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-muted">
                        <div>
                          <span className="text-[10px]">In: </span>
                          <span>${m.providerCostInput.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px]">Out: </span>
                          <span>${m.providerCostOutput.toFixed(2)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.marginPercent >= 20
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : m.marginPercent > 0
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          +{m.marginPercent}%
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {m.enabled ? 'ACTIVE' : 'OFFLINE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded hover:bg-bg text-muted hover:text-fg"
                            title="Edit Model"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleEnabled(m.id, m.enabled)}
                            className="px-2 py-1 rounded text-[11px] font-medium border border-border bg-bg hover:bg-card text-fg"
                          >
                            {m.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteModel(m.id, m.displayName)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal for Adding/Editing Model */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-bold text-fg">
                {editingModel ? `Edit Model: ${editingModel.displayName}` : 'Add Model to Catalog'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Model ID (Internal)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingModel}
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="gpt-4o or claude-opus-5.5"
                    className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Upstream Model ID</label>
                  <input
                    type="text"
                    value={upstreamModelId}
                    onChange={(e) => setUpstreamModelId(e.target.value)}
                    placeholder="gpt-4o"
                    className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="OpenAI GPT-4o"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Provider Route</label>
                  <select
                    value={providerSlug}
                    onChange={(e) => {
                      setProviderSlug(e.target.value);
                      if (e.target.value === 'scalemax') {
                        setProtocol('openai-compatible');
                      } else {
                        setProtocol('anthropic');
                      }
                    }}
                    className="w-full px-2.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
                  >
                    <option value="opus_max">OpusMax (Claude)</option>
                    <option value="scalemax">ScaleMax (OpenAI/Gemini/etc)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Model Family</label>
                  <select
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg capitalize"
                  >
                    <option value="claude">Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="grok">Grok</option>
                    <option value="qwen">Qwen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Context Window</label>
                  <input
                    type="number"
                    value={contextWindow}
                    onChange={(e) => setContextWindow(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
                  />
                </div>
              </div>

              {/* Customer Pricing */}
              <div className="p-3 bg-bg/50 border border-border rounded-lg space-y-2">
                <p className="text-[11px] font-semibold text-fg uppercase font-mono">Customer Retail Pricing ($/1M Tokens)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Input Price ($)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={inputPrice}
                      onChange={(e) => setInputPrice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:border-violet-600 text-fg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Output Price ($)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={outputPrice}
                      onChange={(e) => setOutputPrice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:border-violet-600 text-fg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Provider Cost */}
              <div className="p-3 bg-bg/50 border border-border rounded-lg space-y-2">
                <p className="text-[11px] font-semibold text-fg uppercase font-mono">Internal Provider Cost ($/1M Tokens)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Provider Input Cost ($)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={providerCostInput}
                      onChange={(e) => setProviderCostInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:border-violet-600 text-fg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted mb-1">Provider Output Cost ($)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={providerCostOutput}
                      onChange={(e) => setProviderCostOutput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded focus:outline-none focus:border-violet-600 text-fg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Model capabilities, specializations, and benchmark speed."
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-600 text-fg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 shrink-0 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 disabled:opacity-50">
                  {submitting ? 'Saving...' : editingModel ? 'Save Changes' : 'Create Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
