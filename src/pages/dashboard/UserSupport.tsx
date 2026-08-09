import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, MessageSquare, Clock, Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserSupport: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical issue');
  const [initialMessage, setInitialMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply Message State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/user/tickets');
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/user/tickets/${id}`);
      if (res.ok) {
        setActiveTicket(await res.json());
      }
    } catch (e) {
      console.error(e);
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
    setSubmitting(true);

    try {
      const res = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          category,
          message: initialMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setSubject('');
        setInitialMessage('');
        fetchTickets();
        setActiveTicketId(data.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/user/tickets/${activeTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });

      if (res.ok) {
        setReplyText('');
        fetchTicketDetails(activeTicketId);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-amber-500" />
            <span>Developer Support & Help Desk</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Submit technical questions, request custom token allocations, or report gateway issues directly to LightningDeals engineers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="ui-button-primary text-xs py-2 px-4 gap-2 font-bold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Main Grid: Ticket List or Ticket Thread View */}
      {activeTicketId && activeTicket ? (
        <div className="bg-card border border-border rounded-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTicketId(null)}
                className="p-1.5 rounded text-muted hover:text-fg hover:bg-bg"
                title="Back to tickets list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-fg">{activeTicket.subject}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTicket.status === 'Open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    activeTicket.status === 'Awaiting Customer' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    'bg-muted/30 text-muted'
                  }`}>
                    {activeTicket.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted font-mono mt-0.5">
                  Category: <span className="text-fg font-medium">{activeTicket.category}</span> · Ticket ID: {activeTicket.id}
                </p>
              </div>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {activeTicket.messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`p-4 rounded-control space-y-2 border text-xs leading-relaxed ${
                  msg.senderRole === 'admin'
                    ? 'bg-amber-500/10 border-amber-500/30 text-fg ml-4 sm:ml-8'
                    : 'bg-bg border-border/80 text-fg mr-4 sm:mr-8'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-border/40 pb-1.5">
                  <span className="font-bold text-fg">
                    {msg.sender?.name} {msg.senderRole === 'admin' ? '(LightningDeals Engineer)' : '(You)'}
                  </span>
                  <span className="text-muted">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Reply Input Box */}
          <form onSubmit={handleSendReply} className="space-y-3 border-t border-border pt-4">
            <textarea
              rows={3}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply message..."
              className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="ui-button-primary text-xs py-2.5 px-5 font-bold gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-panel overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted">Loading support tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted space-y-3">
              <p>No support tickets created yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="ui-button-primary text-xs py-2 px-4 inline-flex items-center gap-2 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
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
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Messages</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-bg/40">
                      <td className="py-3.5 px-4 font-semibold text-fg">{t.subject}</td>
                      <td className="py-3.5 px-4 font-mono text-muted">{t.category}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          t.status === 'Awaiting Customer' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          'bg-muted/30 text-muted'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-fg">{t._count?.messages || 1}</td>
                      <td className="py-3.5 px-4 font-mono text-muted">{new Date(t.updatedAt).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveTicketId(t.id)}
                          className="ui-button-secondary py-1.5 px-3 text-xs gap-1 font-semibold"
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
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-fg">Create Support Ticket</h3>
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
                  placeholder="e.g. Request 100M Token Top-Up for Cursor IDE"
                  className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
                >
                  <option value="Technical issue">Technical issue</option>
                  <option value="API issue">API Gateway issue</option>
                  <option value="Payment">Payment & Top-Up</option>
                  <option value="API key">API Key Assignment</option>
                  <option value="Account">Account Security</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Initial Message Details *</label>
                <textarea
                  rows={4}
                  required
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Describe your issue or request in detail..."
                  className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
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
                  className="ui-button-primary text-xs py-2 px-4 font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
