import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Send,
  User,
  CreditCard,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  Zap,
  Tag,
  Gift,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminWhatsApp: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Active conversation details
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerSubs, setCustomerSubs] = useState<any[]>([]);

  // Chat message input
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Negotiate Price Modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({
    productId: 'claude_max_5x',
    productName: 'Claude Max 5x',
    amount: '',
    notes: '',
    expiresInHours: 48,
  });
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const q = new URLSearchParams({
        limit: '50',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(search.trim() && { search: search.trim() }),
      });

      const [resConv, resAnalytics] = await Promise.all([
        adminFetch(`/api/admin/whatsapp/conversations?${q.toString()}`),
        adminFetch('/api/admin/whatsapp/analytics'),
      ]);

      if (resConv.ok) {
        const data = await resConv.json();
        setConversations(data.conversations || []);
        setTotalCount(data.totalCount || 0);
        // If nothing selected and conversations exist, select first
        if (!selectedId && data.conversations?.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
      }

      if (resAnalytics.ok) {
        setAnalytics(await resAnalytics.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await adminFetch(`/api/admin/whatsapp/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConv(data.conversation);
        setCustomerOrders(data.customerOrders || []);
        setCustomerSubs(data.customerSubscriptions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !chatMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const res = await adminFetch(`/api/admin/whatsapp/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatMessage.trim() }),
      });

      if (res.ok) {
        setChatMessage('');
        fetchDetail(selectedId);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send message');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleToggleHandoff = async () => {
    if (!selectedId || !activeConv) return;
    const isCurrentlyHandoff = activeConv.status === 'HUMAN_HANDOFF';
    try {
      const res = await adminFetch(`/api/admin/whatsapp/conversations/${selectedId}/toggle-handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableHandoff: !isCurrentlyHandoff }),
      });

      if (res.ok) {
        fetchDetail(selectedId);
        fetchConversations();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveNegotiatedPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !activeConv.customerId || !priceForm.amount) return;

    setSubmittingPrice(true);
    setActionNotice(null);
    try {
      const res = await adminFetch('/api/admin/whatsapp/negotiate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeConv.customerId,
          whatsappConversationId: activeConv.id,
          productId: priceForm.productId,
          productName: priceForm.productName,
          amount: parseFloat(priceForm.amount),
          notes: priceForm.notes,
          expiresInHours: Number(priceForm.expiresInHours),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowPriceModal(false);
        setActionNotice(`Negotiated price ₹${priceForm.amount} set successfully! You can now generate the PayU payment order.`);
        fetchDetail(selectedId!);
        fetchConversations();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to set price');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingPrice(false);
    }
  };

  const handleCreateOrderAndSendPayLink = async (negotiatedPriceId: string) => {
    if (!confirm('Generate PayU payment link and send directly to customer on WhatsApp?')) return;

    try {
      const res = await adminFetch('/api/admin/whatsapp/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negotiatedPriceId }),
      });

      if (res.ok) {
        setActionNotice('⚡ PayU order generated and payment link sent to customer on WhatsApp!');
        fetchDetail(selectedId!);
        fetchConversations();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate order');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting Price
          </span>
        );
      case 'HUMAN_HANDOFF':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3 h-3" /> Human Handoff
          </span>
        );
      case 'PAYMENT_PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Pay Pending
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'PRICE_APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Price Set
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            WhatsApp Commerce Engine
          </h1>
          <p className="text-sm text-muted mt-1">
            Zero public price exposure. Personal negotiation, PayU link generation, and automated fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchConversations();
              if (selectedId) fetchDetail(selectedId);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-card border border-border text-fg hover:bg-slate-50 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="text-xs text-muted font-medium">Conversations</div>
          <div className="text-xl font-bold text-fg mt-1">
            {analytics?.totalConversations ?? totalCount}
          </div>
          <div className="text-[11px] text-muted mt-0.5">Total inbound chats</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm">
          <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Awaiting Admin
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {analytics?.awaitingAdminCount ?? 0}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Price quotes needed</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-sm">
          <div className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Payment Pending
          </div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            {analytics?.paymentPendingCount ?? 0}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Links sent to customer</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-sm">
          <div className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Human Handoffs
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1">
            {analytics?.humanHandoffCount ?? 0}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5">Direct admin chats</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm">
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> WhatsApp Sales
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ₹{(analytics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {analytics?.completedPaymentCount ?? 0} orders verified
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 shadow-sm">
          <div className="text-xs text-violet-700 font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Conversion Rate
          </div>
          <div className="text-xl font-bold text-violet-700 mt-1">
            {analytics?.conversionRate ?? 0}%
          </div>
          <div className="text-[11px] text-violet-600 mt-0.5">Quote to PayU paid</div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Two-Pane Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left Pane: Conversation List (4 cols) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {/* Search & Status Filters */}
          <div className="p-3.5 border-b border-border space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                placeholder="Search phone, name, email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['ALL', 'WAITING_ADMIN', 'PAYMENT_PENDING', 'HUMAN_HANDOFF', 'ACTIVE', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-50 text-muted hover:text-fg hover:bg-slate-100'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs">
                No conversations found.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3.5 transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected ? 'bg-violet-50/60 border-l-4 border-l-violet-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-fg flex items-center gap-1.5 truncate">
                        <span>{c.customerName || c.customer?.name || `+${c.whatsappNumber}`}</span>
                        {c.unreadCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-violet-600 inline-block" />
                        )}
                      </div>
                      <div className="text-[10px] text-muted">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="text-[11px] text-muted truncate">
                      {c.lastMessageSnippet || 'No messages'}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {getStatusBadge(c.status)}
                      <span className="text-[10px] font-mono text-muted">+{c.whatsappNumber}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Conversation Details, Chat, & Actions (8 cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {activeConv ? (
            <>
              {/* Conversation Header Bar */}
              <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                    {activeConv.customerName?.[0] || activeConv.customer?.name?.[0] || 'W'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-fg flex items-center gap-2">
                      <span>{activeConv.customerName || activeConv.customer?.name || `+${activeConv.whatsappNumber}`}</span>
                      {getStatusBadge(activeConv.status)}
                    </div>
                    <div className="text-xs text-muted flex items-center gap-3 mt-0.5">
                      <span className="font-mono">+{activeConv.whatsappNumber}</span>
                      {activeConv.customer?.email && (
                        <span>• {activeConv.customer.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleHandoff}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                      activeConv.status === 'HUMAN_HANDOFF'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        : 'bg-card text-fg border-border hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {activeConv.status === 'HUMAN_HANDOFF' ? 'Release to Bot' : 'Take Over Chat'}
                  </button>

                  <button
                    onClick={() => {
                      setPriceForm({
                        productId: activeConv.currentProductId || 'claude_max_5x',
                        productName: activeConv.currentProductName || 'Claude Max 5x',
                        amount: '',
                        notes: '',
                        expiresInHours: 48,
                      });
                      setShowPriceModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Set Customer Price
                  </button>
                </div>
              </div>

              {/* Customer Dossier Bar (if identified) */}
              {activeConv.customer && (
                <div className="px-4 py-2.5 bg-violet-50/40 border-b border-violet-100 flex flex-wrap items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-4 text-violet-950">
                    <span>
                      <strong className="text-violet-700">Account:</strong> {activeConv.customer.email}
                    </span>
                    <span>
                      <strong className="text-violet-700">Credits:</strong> ₹{activeConv.customer.availableCredits || 0}
                    </span>
                    {activeConv.customer.referralCode && (
                      <span>
                        <strong className="text-violet-700">Ref Code:</strong> {activeConv.customer.referralCode}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-violet-600">
                    {customerOrders.length} previous orders • {customerSubs.length} active subs
                  </div>
                </div>
              )}

              {/* Active Negotiated Price Banner (if exists) */}
              {activeConv.negotiatedPrices?.length > 0 && activeConv.negotiatedPrices[0].status === 'ACTIVE' && (
                <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 fill-current" />
                    <div>
                      <span className="font-bold text-amber-900">
                        Active Price Quote: ₹{activeConv.negotiatedPrices[0].amount.toLocaleString('en-IN')}
                      </span>{' '}
                      for {activeConv.negotiatedPrices[0].productName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateOrderAndSendPayLink(activeConv.negotiatedPrices[0].id)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <CreditCard className="w-3 h-3" /> Send PayU Link
                  </button>
                </div>
              )}

              {/* Chat Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30">
                {activeConv.messages?.map((msg: any) => {
                  const isCustomer = msg.direction === 'INBOUND';
                  const isAdmin = msg.sentBy === 'ADMIN';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div className="text-[10px] text-muted mb-0.5 px-1">
                        {isCustomer ? activeConv.customerName || 'Customer' : isAdmin ? 'Admin' : 'Lightning Bot'} •{' '}
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                          isCustomer
                            ? 'bg-white text-fg border border-border rounded-tl-sm'
                            : isAdmin
                            ? 'bg-violet-600 text-white rounded-tr-sm'
                            : 'bg-slate-800 text-slate-100 rounded-tr-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={
                    activeConv.status === 'HUMAN_HANDOFF'
                      ? 'Type message as Admin to WhatsApp customer...'
                      : 'Send manual reply or override to customer...'
                  }
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || sendingMsg}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <div className="font-semibold text-sm text-fg">No Conversation Selected</div>
              <p className="text-xs max-w-sm mt-1">
                Select a conversation from the left to view customer details, message history, negotiate deals, and dispatch PayU links.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Set Negotiated Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-2xl overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50">
              <div className="font-bold text-sm text-fg flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600 fill-current" />
                Set Negotiated Customer Price
              </div>
              <button
                onClick={() => setShowPriceModal(false)}
                className="text-muted hover:text-fg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNegotiatedPrice} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-fg mb-1">Customer</label>
                <input
                  type="text"
                  disabled
                  value={`${activeConv?.customer?.name || activeConv?.customerName || 'Customer'} (${activeConv?.customer?.email || activeConv?.whatsappNumber})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-border rounded-xl text-muted text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1">Product</label>
                <select
                  value={priceForm.productName}
                  onChange={(e) =>
                    setPriceForm({
                      ...priceForm,
                      productName: e.target.value,
                      productId: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-border rounded-xl text-fg text-xs focus:ring-1 focus:ring-violet-500"
                >
                  <option value="Claude Max 5x">Claude Max 5x (20M Tokens)</option>
                  <option value="Claude Pro Account">Claude Pro Account</option>
                  <option value="Cursor Pro AI IDE">Cursor Pro AI IDE</option>
                  <option value="ChatGPT Team Workspace">ChatGPT Team Workspace</option>
                  <option value="Midjourney Mega Plan">Midjourney Mega Plan</option>
                  <option value="Custom Developer Bundle">Custom Developer Bundle</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1">
                  Agreed Price (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={priceForm.amount}
                    onChange={(e) => setPriceForm({ ...priceForm, amount: e.target.value })}
                    placeholder="e.g. 1499"
                    className="w-full pl-7 pr-3 py-2 bg-white border border-border rounded-xl text-fg font-bold text-sm focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  This exact amount will be locked into the order. Customer cannot modify it.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1">Quote Validity (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={priceForm.expiresInHours}
                  onChange={(e) => setPriceForm({ ...priceForm, expiresInHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-xl text-fg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-fg mb-1">Internal Notes (Optional)</label>
                <input
                  type="text"
                  value={priceForm.notes}
                  onChange={(e) => setPriceForm({ ...priceForm, notes: e.target.value })}
                  placeholder="e.g. Special student discount agreed on phone"
                  className="w-full px-3 py-2 bg-white border border-border rounded-xl text-fg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-muted hover:text-fg cursor-pointer text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPrice || !priceForm.amount}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  {submittingPrice ? 'Confirming...' : 'Confirm Negotiated Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
