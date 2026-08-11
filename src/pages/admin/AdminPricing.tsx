import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, Check, Sparkles } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminPricing: React.FC = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [tokenAmount, setTokenAmount] = useState('10000000');
  const [priceInr, setPriceInr] = useState('499');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = async () => {
    try {
      const res = await adminFetch('/api/admin/pricing');
      if (res.ok) {
        setPackages(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await adminFetch('/api/admin/pricing', {
        method: 'POST',
        body: JSON.stringify({
          tokenAmount,
          priceInr,
          displayName: displayName || `${Number(tokenAmount) / 1000000}M Tokens`,
          description,
          featured,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTokenAmount('10000000');
        setPriceInr('499');
        setDisplayName('');
        setDescription('');
        fetchPackages();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing package?')) return;
    try {
      await adminFetch(`/api/admin/pricing/${id}`, { method: 'DELETE' });
      fetchPackages();
    } catch (e) {
      console.error(e);
    }
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)} Billion`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} Million`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-500" />
            <span>Token Pricing Package Manager</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Configure prepaid token packages, prices in INR, featured options, and public availability.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Token Package</span>
        </button>
      </div>

      {/* Packages Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading pricing packages...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Package Name</th>
                  <th className="py-3 px-4">Token Allocation</th>
                  <th className="py-3 px-4">Price (INR)</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {packages.map((p) => (
                  <tr key={p.id} className="hover:bg-bg/40">
                    <td className="py-3.5 px-4 font-semibold text-fg">
                      {p.displayName}
                      {p.description && <p className="text-[11px] text-muted font-normal">{p.description}</p>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-fg">{formatTokens(p.tokenAmount)} Tokens</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">₹{p.priceInr.toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      {p.featured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          FEATURED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {p.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeletePackage(p.id)}
                        className="p-1 rounded text-muted hover:text-red-500 hover:bg-red-500/10"
                        title="Delete package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adding Pricing Package */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-fg">Add Token Package</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Token Allocation (e.g. 10000000)</label>
                <input
                  type="number"
                  required
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="10000000"
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
                <p className="text-[10px] text-muted mt-1">Formatted: {formatTokens(tokenAmount)} Tokens</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Price in INR (₹)</label>
                <input
                  type="number"
                  required
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                  placeholder="499"
                  className="w-full px-3 py-2 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Display Title</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Claude Max 20x (20M / 5h)"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ideal for daily developer coding"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="featured" className="text-xs font-semibold text-fg">Mark as Most Popular / Featured</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="ui-button-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 font-bold disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
