import React, { useState, useEffect } from 'react';
import { LifeBuoy, MessageSquare, Send, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/tickets');
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
      const res = await fetch(`/api/admin/tickets/${id}`);
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

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/tickets/${activeTicketId}/messages`, {
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchTickets();
        if (activeTicketId === id) fetchTicketDetails(id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-amber-500" />
            <span>Customer Support Help Desk</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Review customer support tickets, send engineer replies, and manage issue resolution statuses.
          </p>
        </div>
      </div>

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
                <p className="text-xs text-muted font-mono mt-0.5">
                  Customer: <span className="text-fg font-bold">{activeTicket.user?.name}</span> ({activeTicket.user?.email}) · Category: {activeTicket.category}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {activeTicket.messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`p-4 rounded-control space-y-2 border text-xs leading-relaxed ${
                  msg.senderRole === 'admin'
                    ? 'bg-amber-500/10 border-amber-500/30 text-fg mr-4 sm:mr-8'
                    : 'bg-bg border-border/80 text-fg ml-4 sm:ml-8'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-border/40 pb-1.5">
                  <span className="font-bold text-fg">
                    {msg.sender?.name} {msg.senderRole === 'admin' ? '(Admin Engineer)' : '(Customer)'}
                  </span>
                  <span className="text-muted">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendAdminReply} className="space-y-3 border-t border-border pt-4">
            <textarea
              rows={3}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type official admin engineer reply..."
              className="w-full p-3 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg"
            />
            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="ui-button-primary text-xs py-2.5 px-5 font-bold gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingReply ? 'Sending Reply...' : 'Send Engineer Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-panel overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted">Loading customer tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">No support tickets logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-bg/40">
                      <td className="py-3.5 px-4 font-semibold text-fg">
                        {t.user?.name}
                        <p className="text-[11px] font-mono text-muted">{t.user?.email}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-fg">{t.subject}</td>
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
                      <td className="py-3.5 px-4 font-mono text-muted">{new Date(t.updatedAt).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveTicketId(t.id)}
                          className="ui-button-secondary py-1.5 px-3 text-xs gap-1 font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Inspect Thread</span>
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
    </div>
  );
};
