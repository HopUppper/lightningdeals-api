import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Check, Clock, Zap, Shield, Sparkles } from 'lucide-react';
import { adminFetch } from '../../utils/api';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  tokenAllowance: string;
  windowHours: number;
  validityDays: number;
  rateLimitRpm: number;
  status: string;
  description: string;
  createdAt: string;
}

export const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form State
  const [name, setName] = useState('Claude Max 20x');
  const [tokenAllowance, setTokenAllowance] = useState('20000000');
  const [windowHours, setWindowHours] = useState('5');
  const [validityDays, setValidityDays] = useState('30');
  const [rateLimitRpm, setRateLimitRpm] = useState('60');
  const [description, setDescription] = useState('20 Million tokens per 5-hour rolling window');
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await adminFetch('/api/admin/plans');
      if (res.ok) {
        setPlans(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('Claude Max 20x');
    setTokenAllowance('20000000');
    setWindowHours('5');
    setValidityDays('30');
    setRateLimitRpm('60');
    setDescription('20 Million tokens per 5-hour rolling window');
    setShowModal(true);
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setName(p.name);
    setTokenAllowance(p.tokenAllowance);
    setWindowHours(p.windowHours.toString());
    setValidityDays(p.validityDays.toString());
    setRateLimitRpm(p.rateLimitRpm.toString());
    setDescription(p.description || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, {
        method,
        body: JSON.stringify({
          name,
          displayName: `${name} (${(Number(tokenAllowance) / 1000000).toFixed(0)}M / ${windowHours}h)`,
          tokenAllowance,
          windowHours,
          validityDays,
          rateLimitRpm,
          description,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchPlans();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await adminFetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPlans();
      }
    } catch (e) {
      console.error(e);
    }
  };



  const formatTokens = (tokensStr: string) => {
    const val = Number(tokensStr);
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Plan Management</h1>
          <p className="text-xs text-muted mt-1">
            Configure Claude 5-hour rolling window plan tiers, token allowances, rate limits, and validity periods.
          </p>
        </div>

        <button onClick={openCreateModal} className="ui-button-primary text-xs py-2 px-4 gap-2">
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-panel p-5 space-y-4 hover:border-accent/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-wider">
                {p.name}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => openEditModal(p)} className="p-1.5 rounded text-muted hover:text-fg hover:bg-bg">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-2xl font-black text-fg font-mono tracking-tight">
                {formatTokens(p.tokenAllowance)}
              </p>
              <p className="text-xs text-muted font-mono mt-0.5">
                per {p.windowHours}-hour rolling window
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3 font-mono">
              <div className="flex items-center gap-1.5 text-muted">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{p.windowHours}h Window</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{p.rateLimitRpm} RPM</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>{p.validityDays} Days Plan</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Auto-Resets</span>
              </div>
            </div>

            {p.description && (
              <p className="text-[11px] text-muted italic border-t border-border/50 pt-2">
                "{p.description}"
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Create/Edit Plan */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-fg">
                {editingPlan ? 'Edit Plan Definition' : 'Create Plan Definition'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Claude Max 20x"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Token Allowance</label>
                  <input
                    type="number"
                    required
                    value={tokenAllowance}
                    onChange={(e) => setTokenAllowance(e.target.value)}
                    placeholder="20000000"
                    className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                  />
                  <p className="text-[10px] text-amber-500 font-mono font-bold mt-1">
                    {formatTokens(tokenAllowance)} tokens
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Window (Hours)</label>
                  <input
                    type="number"
                    required
                    value={windowHours}
                    onChange={(e) => setWindowHours(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                  />
                </div>
              </div>

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
                  <label className="block text-xs font-semibold text-fg mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    required
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="20 Million tokens per 5-hour rolling window"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4">
                  {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
