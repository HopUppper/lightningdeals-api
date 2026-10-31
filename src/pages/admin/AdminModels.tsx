import React, { useState, useEffect, useMemo } from 'react';
import { Cpu, Plus, Edit2, Check, X, Sparkles, Zap, Shield, HelpCircle } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminModels: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<any | null>(null);
  const [familyFilter, setFamilyFilter] = useState<string>('ALL');

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

  useEffect(() => {
    fetchModels();
  }, []);

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

  const filteredModels = useMemo(() => {
    if (familyFilter === 'ALL') return models;
    if (familyFilter === 'ONDEMAND') return models.filter((m) => m.isOnDemand);
    return models.filter((m) => (m.family || '').toLowerCase() === familyFilter.toLowerCase());
  }, [models, familyFilter]);

  const uniqueFamilies = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.family) set.add(m.family.toLowerCase());
    });
    return Array.from(set).sort();
  }, [models]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Model Catalog & Routing Management</h1>
          <p className="text-xs text-muted mt-1">
            Configure upstream providers, context windows, wholesale costs, on-demand activation, and category associations.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="ui-button-primary text-xs py-2 px-4 gap-2 flex items-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Model</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
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
          ⚡ On-Demand Only ({models.filter((m) => m.isOnDemand).length})
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

      {/* Models Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading models...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Model & ID</th>
                  <th className="py-3 px-4">Family / Category</th>
                  <th className="py-3 px-4">Mode & Status</th>
                  <th className="py-3 px-4">Context Window</th>
                  <th className="py-3 px-4">Customer Rates (In / Out)</th>
                  <th className="py-3 px-4">Wholesale Cost (In / Out)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredModels.map((m) => (
                  <tr key={m.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-fg">{m.displayName}</p>
                      <p className="font-mono text-[11px] text-muted">{m.modelId}</p>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-subtle text-fg uppercase">
                        {m.family || 'custom'}
                      </span>
                      {m.planCategory && (
                        <p className="text-[10px] text-muted mt-0.5 font-mono">{m.planCategory}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.isOnDemand ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {m.isOnDemand ? 'ON-DEMAND' : 'STANDARD'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {m.enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted">
                      {(m.contextWindow / 1000).toFixed(0)}k tokens
                    </td>
                    <td className="py-3 px-4 font-mono text-fg">
                      ${Number(m.inputPrice || 0).toFixed(2)} / ${Number(m.outputPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted">
                      ${Number(m.supplierCostInput || m.providerCostInput || 0).toFixed(2)} / ${Number(m.supplierCostOutput || m.providerCostOutput || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
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
                          {m.isOnDemand ? '⚡ On-Demand' : 'Set On-Demand'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(m.id, m.enabled)}
                          className="px-2 py-1 rounded text-[10px] font-mono font-bold border border-border bg-bg hover:bg-card text-fg"
                        >
                          {m.enabled ? 'Disable' : 'Enable'}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adding / Editing Model */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-border rounded-panel max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col overflow-hidden text-xs font-mono">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="text-base font-bold text-fg">
                {editingModel ? `Edit Model: ${editingModel.displayName}` : 'Add Model to Catalog'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-muted mb-1">Model Identifier (API model id)</label>
                <input
                  type="text"
                  required
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="e.g. claude-sonnet-5.5 or deepseek-v3.2"
                  className="w-full ui-input text-xs py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Display Title</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Claude Sonnet 5.5 (Autonomous Coding)"
                  className="w-full ui-input text-xs py-2 px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Family</label>
                  <select
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                    className="w-full ui-input text-xs py-2 px-3"
                  >
                    <option value="claude">Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="gemini">Gemini</option>
                    <option value="grok">Grok</option>
                    <option value="qwen">Qwen</option>
                    <option value="glm">GLM</option>
                    <option value="minimax">MiniMax</option>
                    <option value="kimi">Kimi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted mb-1">Plan Category</label>
                  <select
                    value={planCategory}
                    onChange={(e) => setPlanCategory(e.target.value)}
                    className="w-full ui-input text-xs py-2 px-3"
                  >
                    <option value="claude_max_rolling">Plan 1: Claude Max (5h Rolling)</option>
                    <option value="claude_openai_credits">Plan 2: Claude + OpenAI (Credits)</option>
                    <option value="openai_tokens">Plan 3: OpenAI (Tokens)</option>
                    <option value="claude_tokens">Plan 4: Claude (Tokens)</option>
                    <option value="local_models_tokens">Plan 5: Local Models (Tokens)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1">Context Window (Tokens)</label>
                  <input
                    type="number"
                    required
                    value={contextWindow}
                    onChange={(e) => setContextWindow(e.target.value)}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1">Provider Display</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full ui-input text-xs py-2 px-3"
                  />
                </div>
              </div>

              <div className="p-3 bg-subtle/50 rounded-control border border-border space-y-3">
                <span className="text-[11px] font-bold text-fg block">Rates & Economics ($ / 1M Tokens)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted text-[10px]">Customer Input ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={inputPrice}
                      onChange={(e) => setInputPrice(e.target.value)}
                      className="w-full ui-input text-xs py-1.5 px-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-muted text-[10px]">Customer Output ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={outputPrice}
                      onChange={(e) => setOutputPrice(e.target.value)}
                      className="w-full ui-input text-xs py-1.5 px-2.5 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted text-[10px]">Wholesale Cost Input ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={supplierCostInput}
                      onChange={(e) => setSupplierCostInput(e.target.value)}
                      className="w-full ui-input text-xs py-1.5 px-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-muted text-[10px]">Wholesale Cost Output ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={supplierCostOutput}
                      onChange={(e) => setSupplierCostOutput(e.target.value)}
                      className="w-full ui-input text-xs py-1.5 px-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnDemand}
                    onChange={(e) => setIsOnDemand(e.target.checked)}
                    className="rounded border-border text-amber-600"
                  />
                  <span className="text-fg font-semibold">Flag as On-Demand Model</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-5 font-bold">
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
