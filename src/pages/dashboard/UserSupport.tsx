import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, MessageSquare, Clock, Send, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';

export const UserSupport: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical issue');
  const [priority, setPriority] = useState('Normal');
  const [initialMessage, setInitialMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply Message State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await adminFetch('/api/user/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : data.tickets || []);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error?.message || 'Failed to load support tickets.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error fetching tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await adminFetch(`/api/user/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data.ticket || data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error?.message || 'Failed to load ticket details.');
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await adminFetch('/api/user/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          message: initialMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data) {
        const newTicket = data.ticket || data;
        setShowCreateModal(false);
        setSubject('');
        setInitialMessage('');
        setSuccessMessage(`Ticket #${(newTicket.id || '').slice(0, 8)} created successfully.`);
        await fetchTickets();
        if (newTicket.id) {
          setActiveTicketId(newTicket.id);
        }
      } else {
        setErrorMessage(data.error?.message || 'Failed to create support ticket.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error creating ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;

    setSendingReply(true);
    setErrorMessage(null);

    try {
      const res = await adminFetch(`/api/user/tickets/${activeTicketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText.trim() }),
      });

      if (res.ok) {
        setReplyText('');
        await fetchTicketDetails(activeTicketId);
        await fetchTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error?.message || 'Failed to send reply.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error sending reply.');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-control flex items-center justify-between text-xs text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-control flex items-center justify-between text-xs text-emerald-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-violet-600" />
            <span>Customer Support & Help Desk</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Submit questions, report gateway issues, or request custom quotas directly to Lightning Deals engineers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets()}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-semibold"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setShowCreateModal(true);
            }}
            className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Container: Ticket Details Thread OR Ticket List Table */}
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-fg">{activeTicket.subject}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTicket.status === 'Open' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                    activeTicket.status === 'Awaiting Customer' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    activeTicket.status === 'Resolved' ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20' :
                    'bg-muted/20 text-muted border border-border'
                  }`}>
                    {activeTicket.status?.toUpperCase() || 'OPEN'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-bg border border-border text-muted">
                    {activeTicket.priority || 'Normal'} Priority
                  </span>
                </div>
                <p className="text-xs text-muted font-mono mt-1">
                  Category: <span className="text-fg font-medium">{activeTicket.category}</span> · Ticket ID: <span className="text-fg">{activeTicket.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchTicketDetails(activeTicketId)}
              disabled={loadingDetails}
              className="text-xs font-mono text-muted hover:text-fg flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3 h-3 ${loadingDetails ? 'animate-spin' : ''}`} />
              <span>Update Thread</span>
            </button>
          </div>

          {/* Conversation Messages Thread */}
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
            {(!activeTicket.messages || activeTicket.messages.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted">No messages in this ticket yet.</div>
            ) : (
              activeTicket.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-control space-y-2 border text-xs leading-relaxed ${
                    msg.senderRole === 'admin'
                      ? 'bg-violet-500/5 border-violet-500/20 text-fg ml-4 sm:ml-8'
                      : 'bg-bg border-border text-fg mr-4 sm:mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono border-b border-border/40 pb-1.5">
                    <span className={`font-bold ${msg.senderRole === 'admin' ? 'text-violet-600' : 'text-fg'}`}>
                      {msg.sender?.name || (msg.senderRole === 'admin' ? 'Support Engineer' : user?.name)} {msg.senderRole === 'admin' ? '(Lightning Deals Staff)' : '(You)'}
                    </span>
                    <span className="text-muted">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Reply Form */}
          {activeTicket.status !== 'Closed' ? (
            <form onSubmit={handleSendReply} className="space-y-3 border-t border-border pt-4">
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to Lightning Deals support..."
                className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
              />
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-muted font-mono">Replies update ticket status to 'Awaiting Support'</p>
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="ui-button-primary text-xs py-2.5 px-5 font-bold gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Sending Reply...' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-subtle border border-border rounded-control text-center text-xs text-muted font-mono">
              This ticket has been marked as Closed. Create a new ticket if you have further inquiries.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-panel overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted font-mono flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading support tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted space-y-4">
              <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center mx-auto">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-fg text-sm">No support tickets created yet</p>
                <p className="text-muted mt-0.5">Need help with your Claude Max API key, quota refresh, or billing? Open a ticket.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="ui-button-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Create Support Ticket</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Messages</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-fg">
                        {t.subject}
                        <p className="text-[10px] font-mono text-muted">ID: {t.id?.slice(0, 8)}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted">{t.category}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-[11px] font-semibold text-fg">{t.priority || 'Normal'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Open' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          t.status === 'Awaiting Customer' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          t.status === 'Resolved' ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20' :
                          'bg-muted/20 text-muted border border-border'
                        }`}>
                          {t.status?.toUpperCase() || 'OPEN'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-fg font-semibold">{t._count?.messages ?? t.messages?.length ?? 1}</td>
                      <td className="py-3.5 px-4 font-mono text-muted">{new Date(t.updatedAt).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveTicketId(t.id)}
                          className="ui-button-secondary py-1.5 px-3 text-xs gap-1.5 font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Thread</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for Creating New Support Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-violet-600" />
                <span>Open New Support Ticket</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-fg text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Requesting quota guidance for Claude Code CLI integration"
                  className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
                  >
                    <option value="Technical issue">Technical issue</option>
                    <option value="API issue">API Gateway issue</option>
                    <option value="Payment">Payment & Billing</option>
                    <option value="API key">API Key Assignment</option>
                    <option value="Account">Account Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-violet-500 text-fg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="ui-button-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !initialMessage.trim()}
                  className="ui-button-primary text-xs py-2.5 px-5 font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
