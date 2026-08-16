import React, { useState, useEffect } from 'react';
import { LifeBuoy, MessageSquare, Send, ArrowLeft, CheckCircle2, Clock, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await adminFetch('/api/admin/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : data.tickets || []);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error?.message || 'Failed to fetch admin tickets.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error loading tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await adminFetch(`/api/admin/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data.ticket || data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error?.message || 'Failed to fetch ticket details.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error fetching ticket details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (activeTicketId) {
      fetchTicketDetails(activeTicketId);
    } else {
      setActiveTicket(null);
    }
  }, [activeTicketId]);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;

    setSendingReply(true);
    setErrorMessage(null);

    try {
      const res = await adminFetch(`/api/admin/tickets/${activeTicketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText('');
        setSuccessMessage('Reply dispatched to customer.');
        await fetchTicketDetails(activeTicketId);
        await fetchTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error?.message || 'Failed to send admin reply.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error sending admin reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await adminFetch(`/api/admin/tickets/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSuccessMessage(`Ticket status set to '${status}'.`);
        await fetchTickets();
        if (activeTicketId === id) await fetchTicketDetails(id);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error?.message || 'Failed to update ticket status.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error updating ticket status.');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'OPEN' && (t.status === 'Open' || t.status === 'Awaiting Support')) ||
      (statusFilter === 'WAITING' && t.status === 'Awaiting Customer') ||
      (statusFilter === 'RESOLVED' && (t.status === 'Resolved' || t.status === 'Closed'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control flex items-center justify-between text-xs text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-control flex items-center justify-between text-xs text-emerald-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-amber-500" />
            <span>Customer Support Help Desk</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Review customer support tickets, send official engineering replies, and manage resolution lifecycles.
          </p>
        </div>

        <button
          onClick={() => fetchTickets()}
          disabled={loading}
          className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Main View: Single Ticket Thread OR Filterable Tickets Table */}
      {activeTicketId && activeTicket ? (
        <div className="bg-card border border-border rounded-panel p-6 space-y-6 shadow-sm">
          {/* Thread Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTicketId(null)}
                className="p-2 rounded-lg text-muted hover:text-fg hover:bg-bg border border-border transition-colors"
                title="Back to tickets list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-fg">{activeTicket.subject}</h2>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleUpdateStatus(activeTicket.id, e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-bg border border-border text-fg focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Awaiting Customer">Awaiting Customer</option>
                    <option value="Awaiting Support">Awaiting Support</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <p className="text-xs text-muted font-mono mt-1">
                  Customer: <span className="text-fg font-bold">{activeTicket.user?.name}</span> ({activeTicket.user?.email}) · Category: {activeTicket.category} · Priority: {activeTicket.priority || 'Normal'}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchTicketDetails(activeTicketId)}
              disabled={loadingDetails}
              className="text-xs font-mono text-muted hover:text-fg flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3 h-3 ${loadingDetails ? 'animate-spin' : ''}`} />
              <span>Refresh Thread</span>
            </button>
          </div>

          {/* Messages Thread */}
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
            {(!activeTicket.messages || activeTicket.messages.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted">No messages found.</div>
            ) : (
              activeTicket.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-control space-y-2 border text-xs leading-relaxed ${
                    msg.senderRole === 'admin'
                      ? 'bg-amber-500/10 border-amber-500/30 text-fg mr-4 sm:mr-8'
                      : 'bg-bg border-border text-fg ml-4 sm:ml-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono border-b border-border/40 pb-1.5">
                    <span className={`font-bold ${msg.senderRole === 'admin' ? 'text-amber-600' : 'text-fg'}`}>
                      {msg.sender?.name || (msg.senderRole === 'admin' ? 'Admin Staff' : activeTicket.user?.name)} {msg.senderRole === 'admin' ? '(Admin Engineer)' : '(Customer)'}
                    </span>
                    <span className="text-muted">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Admin Reply Form */}
          <form onSubmit={handleSendAdminReply} className="space-y-3 border-t border-border pt-4">
            <textarea
              rows={3}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type official admin engineer reply to customer..."
              className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 text-fg"
            />
            <div className="flex justify-between items-center">
              <p className="text-[11px] text-muted font-mono">Replies notify customer and set ticket to 'Awaiting Customer'</p>
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="ui-button-primary text-xs py-2.5 px-5 font-bold gap-2 disabled:opacity-50 flex items-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingReply ? 'Dispatching Reply...' : 'Send Engineer Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 border border-border rounded-panel">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, subject, or ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded transition-colors ${
                  statusFilter === 'ALL' ? 'bg-fg text-bg font-bold' : 'text-muted hover:text-fg'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setStatusFilter('OPEN')}
                className={`px-3 py-1 rounded transition-colors ${
                  statusFilter === 'OPEN' ? 'bg-fg text-bg font-bold' : 'text-muted hover:text-fg'
                }`}
              >
                Open ({tickets.filter((t) => t.status === 'Open' || t.status === 'Awaiting Support').length})
              </button>
              <button
                onClick={() => setStatusFilter('WAITING')}
                className={`px-3 py-1 rounded transition-colors ${
                  statusFilter === 'WAITING' ? 'bg-fg text-bg font-bold' : 'text-muted hover:text-fg'
                }`}
              >
                Awaiting Customer ({tickets.filter((t) => t.status === 'Awaiting Customer').length})
              </button>
              <button
                onClick={() => setStatusFilter('RESOLVED')}
                className={`px-3 py-1 rounded transition-colors ${
                  statusFilter === 'RESOLVED' ? 'bg-fg text-bg font-bold' : 'text-muted hover:text-fg'
                }`}
              >
                Resolved ({tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length})
              </button>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-card border border-border rounded-panel overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-16 text-center text-xs text-muted font-mono flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading customer tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted font-mono">
                No support tickets match the current filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-bg/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-fg">
                          {t.user?.name || 'Unknown User'}
                          <p className="text-[11px] font-mono text-muted">{t.user?.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-fg">
                          {t.subject}
                          <p className="text-[10px] font-mono text-muted">ID: {t.id?.slice(0, 8)}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted">{t.category}</td>
                        <td className="py-3.5 px-4 font-mono">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-bg border border-border text-fg focus:outline-none"
                          >
                            <option value="Open">Open</option>
                            <option value="Awaiting Customer">Awaiting Customer</option>
                            <option value="Awaiting Support">Awaiting Support</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-[11px] font-semibold text-fg">{t.priority || 'Normal'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted">{new Date(t.updatedAt).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setActiveTicketId(t.id)}
                            className="ui-button-secondary py-1.5 px-3 text-xs gap-1 font-semibold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Inspect & Reply</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
