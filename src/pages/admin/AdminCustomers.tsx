import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, HelpCircle, Key, RefreshCw, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminCustomers: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'leads' | 'tickets'>('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Issue API Key Modal State
  const [showIssueKeyModal, setShowIssueKeyModal] = useState(false);
  const [selectedKeyCustomer, setSelectedKeyCustomer] = useState<any | null>(null);
  const [issuePlanId, setIssuePlanId] = useState('20000000');
  const [issueKeyName, setIssueKeyName] = useState('Primary Production Key');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issuedSecretKey, setIssuedSecretKey] = useState<string | null>(null);

  const openIssueKeyModal = (cust: any) => {
    setSelectedKeyCustomer(cust);
    setIssuePlanId('20000000');
    setIssueKeyName(`${cust.name.split(' ')[0]}'s Production Key`);
    setIssueError(null);
    setIssuedSecretKey(null);
    setShowIssueKeyModal(true);
  };

  const handleIssueKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyCustomer) return;
    setIssueSubmitting(true);
    setIssueError(null);

    const tokenLimitNum = Number(issuePlanId);
    const numM = Math.round(tokenLimitNum / 1000000);
    const planName = `${numM}M Tokens / 5h Window`;

    try {
      const res = await adminFetch('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedKeyCustomer.id,
          name: issueKeyName.trim(),
          tokenLimit: tokenLimitNum,
          plan: planName,
          isTrial: false,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.rawKey) {
        setIssuedSecretKey(resData.rawKey);
        fetchData();
      } else {
        setIssueError(resData?.error?.message || 'Failed to issue API key to customer.');
      }
    } catch (err: any) {
      setIssueError(err.message || 'Network error issuing API key.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, leadRes, ticketRes] = await Promise.all([
        adminFetch('/api/admin/customers'),
        adminFetch('/api/admin/leads').catch(() => null),
        adminFetch('/api/admin/tickets').catch(() => null),
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

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setStatus('active');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (cust: any) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setEmail(cust.email);
    setPassword('');
    setRole(cust.role || 'user');
    setStatus(cust.status || 'active');
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const url = editingCustomer ? `/api/admin/customers/${editingCustomer.id}` : '/api/admin/customers';
    const method = editingCustomer ? 'PUT' : 'POST';

    try {
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          role,
          status,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setShowModal(false);
        await fetchData();
      } else {
        setFormError(resData?.error?.message || 'Failed to save customer account.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Network error saving customer account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to permanently delete customer "${customerName}"?`)) return;

    try {
      const res = await adminFetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error?.message || 'Failed to delete customer.');
      }
    } catch (e: any) {
      alert(e.message || 'Network error deleting customer.');
    }
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
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
            Manage persistent customer accounts, custom quote requests, and incoming support tickets in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
          <button
            onClick={fetchData}
            className="ui-button-secondary text-xs py-2 px-3.5 gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Buttons */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-all flex items-center gap-2 ${
            activeSubTab === 'customers' ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs' : 'bg-white text-muted hover:text-fg border border-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Accounts ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leads')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-all flex items-center gap-2 ${
            activeSubTab === 'leads' ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs' : 'bg-white text-muted hover:text-fg border border-border'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Quote Requests ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`px-4 py-2 text-xs font-bold rounded-control transition-all flex items-center gap-2 ${
            activeSubTab === 'tickets' ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs' : 'bg-white text-muted hover:text-fg border border-border'
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
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted font-mono">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-bg/40">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-fg font-sans">{c.name}</p>
                        <p className="font-mono text-[11px] text-muted">{c.email}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold uppercase">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          c.role === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-violet-50 text-violet-700'
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
                      <td className="py-3 px-4 font-mono text-amber-600">{formatTokens(c.tokensUsed)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">{formatTokens(c.tokensRemaining)}</td>
                      <td className="py-3 px-4 font-mono text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openIssueKeyModal(c)}
                          className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs font-mono"
                          title="Issue API Key & Plan Allocation"
                        >
                          <Key className="w-3 h-3" /> Issue Key
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded border border-border text-muted hover:text-fg hover:bg-bg transition-colors inline-flex items-center"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors inline-flex items-center"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
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
                  <th className="py-3 px-4">Requested Allowance</th>
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
                      <td className="py-3 px-4 font-mono text-violet-700 font-bold">{l.tokenAmount || l.volume || '20M / 5h Window'}</td>
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

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-bold text-fg font-mono">
                {editingCustomer ? 'Edit Customer Account' : 'Add New Customer Account'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-fg text-sm font-mono">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-fg mb-1 font-mono uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Developer"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1 font-mono uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@enterprise.com"
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1 font-mono uppercase">
                  {editingCustomer ? 'Reset Password (Optional)' : 'Initial Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingCustomer ? 'Leave blank to keep existing password' : '••••••••'}
                  className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-fg mb-1 font-mono uppercase">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                  >
                    <option value="user">Customer (user)</option>
                    <option value="admin">Administrator (admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-fg mb-1 font-mono uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs bg-bg border border-border text-muted hover:text-fg rounded-control">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ui-button-primary text-xs py-2 px-4 font-bold disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue API Key Modal */}
      {showIssueKeyModal && selectedKeyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-border rounded-panel p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-600" />
                <h2 className="text-base font-bold text-fg">Issue API Key & Plan</h2>
              </div>
              <button onClick={() => setShowIssueKeyModal(false)} className="text-muted hover:text-fg">✕</button>
            </div>

            {issuedSecretKey ? (
              <div className="space-y-4">
                <div className="p-4 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <p className="font-bold">✅ API Key Generated & Attached to {selectedKeyCustomer.name}!</p>
                  <p className="font-mono text-[11px]">Send this secret key to the customer on WhatsApp:</p>
                  <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded border border-emerald-500/30 flex items-center justify-between select-all">
                    <span className="truncate max-w-[240px]">{issuedSecretKey}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(issuedSecretKey)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shrink-0 ml-2"
                    >
                      Copy Key
                    </button>
                  </div>
                </div>

                <a
                  href={`https://wa.me/917695956938?text=${encodeURIComponent(`Hi ${selectedKeyCustomer.name}! Here is your LightningDeals API key: ${issuedSecretKey}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-control font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Key on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => { setShowIssueKeyModal(false); setIssuedSecretKey(null); fetchData(); }}
                  className="w-full py-2 rounded-control text-xs font-bold bg-bg border border-border hover:bg-subtle text-fg"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleIssueKeySubmit} className="space-y-4">
                <div className="p-3 bg-subtle rounded-control border border-border text-xs space-y-1">
                  <p className="font-bold text-fg">Target Customer: {selectedKeyCustomer.name}</p>
                  <p className="font-mono text-muted">{selectedKeyCustomer.email}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Select Plan Capacity</label>
                  <select
                    value={issuePlanId}
                    onChange={(e) => setIssuePlanId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                  >
                    <option value="5000000">5M Tokens / 5h Window (Basic Plan)</option>
                    <option value="20000000">20M Tokens / 5h Window (Pro Plan)</option>
                    <option value="40000000">40M Tokens / 5h Window (Max Plan)</option>
                    <option value="100000000">100M Tokens / 5h Window (Ultra Plan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Key Name / Tag</label>
                  <input
                    type="text"
                    required
                    value={issueKeyName}
                    onChange={(e) => setIssueKeyName(e.target.value)}
                    placeholder="e.g. Primary Production Key"
                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono"
                  />
                </div>

                {issueError && (
                  <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-mono">{issueError}</div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowIssueKeyModal(false)}
                    className="px-4 py-2 rounded-control text-xs font-semibold text-muted hover:text-fg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issueSubmitting}
                    className="px-4 py-2 rounded-control text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {issueSubmitting ? 'Generating...' : 'Generate & Attach API Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
