import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  X,
  Phone,
  HelpCircle,
} from 'lucide-react';
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
    <div className="space-y-8 font-sans pb-10">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-rose-900 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="p-1 hover:text-emerald-950 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                  Support & Help Desk
                </h1>
                <span className="text-[11px] font-bold text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-full border border-violet-200">
                  Friendly Team
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Have questions or need assistance? Open a ticket or chat with us on WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchTickets()}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold cursor-pointer"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setShowCreateModal(true);
            }}
            className="ui-button-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Ticket</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Quick Assistance Banner */}
      <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-emerald-950">
              Need Instant Help? Chat on WhatsApp
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Our support team answers questions in real time on WhatsApp.
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/917695956938?text=Hi%20LightningDeals!%20I%20need%20help%20with%20my%20account."
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <span>Open WhatsApp Chat</span>
        </a>
      </div>

      {/* Main Container: Ticket Details Thread OR Ticket List */}
      {activeTicketId && activeTicket ? (
        <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-6">
          {/* Thread Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTicketId(null)}
                className="p-2.5 rounded-2xl bg-subtle/80 border border-border/80 text-muted hover:text-fg transition-colors cursor-pointer"
                title="Back to tickets list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-fg">
                    {activeTicket.subject}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      activeTicket.status === 'Open'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : activeTicket.status === 'Awaiting Customer'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : activeTicket.status === 'Resolved'
                        ? 'bg-violet-100 text-violet-800 border border-violet-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {activeTicket.status?.toUpperCase() || 'OPEN'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-subtle/60 border border-border/80 text-muted">
                    {activeTicket.priority || 'Normal'} Priority
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  Category: <span className="text-fg font-medium">{activeTicket.category}</span> · Ticket ID:{' '}
                  <span className="font-mono text-fg">{activeTicket.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchTicketDetails(activeTicketId)}
              disabled={loadingDetails}
              className="text-xs text-muted hover:text-fg flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDetails ? 'animate-spin' : ''}`} />
              <span>Update Thread</span>
            </button>
          </div>

          {/* Conversation Messages Thread */}
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
            {!activeTicket.messages || activeTicket.messages.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">No messages in this ticket yet.</div>
            ) : (
              activeTicket.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-4 sm:p-5 rounded-3xl space-y-2 border text-xs leading-relaxed ${
                    msg.senderRole === 'admin'
                      ? 'bg-violet-50/70 border-violet-200 text-fg ml-4 sm:ml-8'
                      : 'bg-subtle/40 border-border/80 text-fg mr-4 sm:mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] border-b border-border/40 pb-2">
                    <span
                      className={`font-bold ${
                        msg.senderRole === 'admin' ? 'text-violet-700' : 'text-fg'
                      }`}
                    >
                      {msg.sender?.name || (msg.senderRole === 'admin' ? 'Support Team' : user?.name)}{' '}
                      {msg.senderRole === 'admin' ? '(LightningAPI Specialist)' : '(You)'}
                    </span>
                    <span className="text-muted tabular-nums">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs sm:text-sm text-fg leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Reply Form */}
          {activeTicket.status !== 'Closed' ? (
            <form onSubmit={handleSendReply} className="space-y-3 border-t border-border/60 pt-4">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response here..."
                className="w-full bg-white border border-border/80 rounded-2xl p-4 text-xs sm:text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:border-violet-500 shadow-2xs resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="ui-button-primary text-xs py-2.5 px-5 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-subtle/50 border border-border/80 text-center text-xs text-muted">
              This ticket is marked as closed. You can create a new support ticket if you need further help.
            </div>
          )}
        </div>
      ) : (
        /* Ticket List Table */
        <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-fg">Your Support Tickets</h3>
              <p className="text-xs text-muted mt-0.5">
                Track status and chat history with customer support.
              </p>
            </div>
            <span className="text-xs text-muted font-bold">{tickets.length} Total Tickets</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-600" />
              Loading your tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-100">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-fg">No Support Tickets Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Have a question or running into an issue? Create a support ticket and our team will get right on it!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="ui-button-primary text-xs py-2 px-4 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Support Ticket</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-muted uppercase text-[11px] font-bold">
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Last Updated</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-subtle/40 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-fg max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-3 text-muted">{t.category}</td>
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-subtle text-muted border border-border">
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            t.status === 'Open'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : t.status === 'Awaiting Customer'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : t.status === 'Resolved'
                              ? 'bg-violet-100 text-violet-800 border border-violet-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-muted text-[11px]">
                        {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setActiveTicketId(t.id)}
                          className="text-violet-700 hover:text-violet-900 font-bold hover:underline cursor-pointer"
                        >
                          View Thread →
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-fg">Create Support Ticket</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-subtle text-muted hover:text-fg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-fg uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question about model token usage"
                  className="w-full bg-white border border-border/80 rounded-2xl px-4 py-2.5 text-xs text-fg focus:outline-none focus:border-violet-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-fg uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-border/80 rounded-2xl px-3.5 py-2.5 text-xs text-fg focus:outline-none focus:border-violet-500 shadow-2xs cursor-pointer"
                  >
                    <option value="Technical issue">Technical issue</option>
                    <option value="Billing / Payment">Billing / Payment</option>
                    <option value="Model routing">Model routing</option>
                    <option value="Quota increase">Quota increase</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-fg uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white border border-border/80 rounded-2xl px-3.5 py-2.5 text-xs text-fg focus:outline-none focus:border-violet-500 shadow-2xs cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-fg uppercase tracking-wider mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Describe your inquiry in detail..."
                  className="w-full bg-white border border-border/80 rounded-2xl p-4 text-xs text-fg focus:outline-none focus:border-violet-500 shadow-2xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-border/80 text-muted font-bold text-xs hover:bg-subtle cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !initialMessage.trim()}
                  className="ui-button-primary text-xs py-2.5 px-5 font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSupport;
