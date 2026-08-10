import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, HelpCircle, Key, RefreshCw } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'leads' | 'tickets'>('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, leadRes, ticketRes] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/leads').catch(() => null),
        fetch('/api/admin/tickets').catch(() => null),
      ]);

      if (custRes.ok) setCustomers(await custRes.json());
      if (leadRes && leadRes.ok) setLeads(await leadRes.json());
      if (ticketRes && ticketRes.ok) setTickets(await ticketRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLeads = leads.filter(
    (l) => l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Customers & Leads Hub</h1>
          <p className="text-xs text-muted mt-1">
            Manage customer accounts, custom quote requests, and incoming support tickets in one place.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="ui-button-secondary text-xs py-2 px-3.5 gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Sub Tab Buttons */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-colors flex items-center gap-2 ${
            activeSubTab === 'customers' ? 'bg-amber-500 text-black shadow-sm' : 'bg-card text-muted hover:text-fg'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Accounts ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leads')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-colors flex items-center gap-2 ${
            activeSubTab === 'leads' ? 'bg-amber-500 text-black shadow-sm' : 'bg-card text-muted hover:text-fg'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Quote Requests ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-colors flex items-center gap-2 ${
            activeSubTab === 'tickets' ? 'bg-amber-500 text-black shadow-sm' : 'bg-card text-muted hover:text-fg'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Support Inquiries ({tickets.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter records by name, email, or details..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-card border border-border rounded-control focus:outline-none focus:border-accent text-fg"
        />
      </div>

      {/* Subtab Content */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading records...</div>
        ) : activeSubTab === 'customers' ? (
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
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted font-mono">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeSubTab === 'leads' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Expected Monthly Volume</th>
                  <th className="py-3 px-4">Message / Requirements</th>
                  <th className="py-3 px-4">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted font-mono">No custom quote leads submitted yet.</td>
                  </tr>
                ) : (
                  filteredLeads.map((l: any) => (
                    <tr key={l.id} className="hover:bg-bg/40">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-fg">{l.name}</p>
                        <p className="font-mono text-[11px] text-muted">{l.email}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-fg">{l.company || '—'}</td>
                      <td className="py-3 px-4 font-mono text-amber-500 font-bold">{l.volume || '100M+ tokens/mo'}</td>
                      <td className="py-3 px-4 text-muted max-w-xs truncate">{l.notes || l.message || 'Custom enterprise tier request'}</td>
                      <td className="py-3 px-4 font-mono text-muted">{new Date(l.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Ticket / Inquiry</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted font-mono">No open support tickets.</td>
                  </tr>
                ) : (
                  tickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-bg/40">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-fg">{t.subject}</p>
                        <p className="text-muted text-[11px] max-w-sm truncate">{t.message}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted">{t.customerEmail}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500 font-bold">
                          {t.status?.toUpperCase() || 'OPEN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

