import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, UserX, UserCheck, ShieldCheck } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Customer Accounts</h1>
        <p className="text-xs text-muted mt-1">
          Manage registered accounts, view token consumption, and manage account statuses.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer name or email..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
        />
      </div>

      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">API Keys</th>
                  <th className="py-3 px-4">Purchased</th>
                  <th className="py-3 px-4">Used</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-fg">{c.name}</p>
                      <p className="font-mono text-[11px] text-muted">{c.email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold uppercase">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        c.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted/40 text-muted'
                      }`}>
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-fg">{c.keyCount}</td>
                    <td className="py-3 px-4 font-mono text-fg">{formatTokens(c.purchasedTokens)}</td>
                    <td className="py-3 px-4 font-mono text-amber-500">{formatTokens(c.tokensUsed)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-500">{formatTokens(c.tokensRemaining)}</td>
                    <td className="py-3 px-4 font-mono text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
