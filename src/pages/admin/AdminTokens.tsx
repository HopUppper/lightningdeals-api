import React, { useState, useEffect } from 'react';
import { Zap, Plus, ArrowRight } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminTokens: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [addTokens, setAddTokens] = useState('10000000');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await adminFetch('/api/admin/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
        if (data.length > 0) setSelectedKeyId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAdjustTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);

    try {
      const res = await adminFetch(`/api/admin/keys/${selectedKeyId}`, {
        method: 'PUT',
        body: JSON.stringify({ addTokens }),
      });

      if (res.ok) {
        setSuccess(`Successfully added ${Number(addTokens).toLocaleString()} tokens to API key.`);
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500 fill-current" />
          <span>Token Balance Management & Adjustments</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Manually allocate or adjust token balances for customer API keys. Creates immutable ledger audit logs.
        </p>
      </div>

      <div className="bg-card border border-border rounded-panel p-6 sm:p-8 max-w-xl space-y-6">
        <form onSubmit={handleAdjustTokens} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Select Target API Key</label>
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.plan || 'Claude Max 20x'}) — {k.displayKey} — Remaining: {Number(k.tokensRemaining).toLocaleString()}
                </option>

              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Tokens to Add (ANY Amount)</label>
            <input
              type="number"
              required
              value={addTokens}
              onChange={(e) => setAddTokens(e.target.value)}
              placeholder="10000000"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Reason / Internal Reference</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Manual UPI Payment Verified (Ref #LD-INV-1024)"
              className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
          </div>

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-control text-emerald-600 text-xs">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedKeyId}
            className="ui-button-primary w-full justify-center text-xs py-3 font-bold disabled:opacity-50"
          >
            {submitting ? 'Updating Ledger...' : 'Add Tokens & Append Ledger Entry'}
          </button>
        </form>
      </div>
    </div>
  );
};
