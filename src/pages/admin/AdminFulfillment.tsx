import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, Search, Filter, ShieldAlert, User, Zap, ChevronRight, Play, X } from 'lucide-react';
import { adminFetch } from '../../utils/api';

export const AdminFulfillment: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING_AND_ACTIVE');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: statusFilter,
        ...(search.trim() && { search: search.trim() }),
      });
      const res = await adminFetch(`/api/admin/fulfillment/queue?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleAction = async (action: 'fulfill' | 'processing' | 'fail' | 'manual-review' | 'retry') => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      let body: any = { notes: actionNotes };
      if (action === 'fail') body = { reason: actionNotes || 'Failed by admin' };

      const res = await adminFetch(`/api/admin/fulfillment/${selectedOrder.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Failed to perform ${action}.`);
      }

      setActionMessage(`Order ${selectedOrder.internalOrderId} updated successfully.`);
      setTimeout(() => {
        setSelectedOrder(null);
        setActionNotes('');
        setActionMessage(null);
        fetchQueue();
      }, 1000);
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getSlaBadge = (slaColor: 'GREEN' | 'YELLOW' | 'RED', waitingMinutes: number) => {
    if (slaColor === 'GREEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <Clock className="w-3 h-3 text-emerald-500" />
          <span>{waitingMinutes}m (&lt;15m)</span>
        </span>
      );
    }
    if (slaColor === 'YELLOW') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>{waitingMinutes}m (15-60m)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse">
        <AlertTriangle className="w-3 h-3 text-rose-500" />
        <span>{waitingMinutes}m (&gt;60m)</span>
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">FULFILLED</span>;
      case 'FULFILLMENT_PROCESSING':
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/10 text-accent border border-accent/20">PROCESSING</span>;
      case 'MANUAL_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">MANUAL REVIEW</span>;
      case 'FULFILLMENT_FAILED':
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-subtle text-muted border border-border">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              OPERATIONAL SLA PIPELINE
            </span>
            <span className="text-xs text-muted font-mono">AUTOMATED ORDER PROCESSING</span>
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span>Universal Fulfillment Queue</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time manual & automated order fulfillment SLA pipeline. Green (&lt;15m), Yellow (15-60m), Red (&gt;60m).
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="ui-button-secondary text-xs py-2 px-3.5 self-start sm:self-auto gap-2 font-mono font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'PENDING_AND_ACTIVE', label: 'Active & Pending' },
            { id: 'MANUAL_REVIEW', label: '⚠️ Manual Review' },
            { id: 'FULFILLMENT_FAILED', label: '❌ Failed' },
            { id: 'FULFILLED', label: '✓ Fulfilled' },
            { id: 'ALL', label: 'All Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-control text-xs font-mono font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-bg border border-border text-muted hover:text-fg hover:bg-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchQueue();
          }}
          className="relative max-w-xs w-full"
        >
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent font-mono text-fg"
          />
        </form>
      </div>

      {/* Orders Table */}
      <div className="technical-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-subtle/50 border-b border-border text-[10px] uppercase tracking-wider text-muted font-bold">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4 text-right">Amount (INR)</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Fulfillment Status</th>
                <th className="py-3 px-4">SLA Aging</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted font-mono">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying fulfillment queue...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted">
                    No orders matching this fulfillment filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <p className="font-bold text-fg">{order.internalOrderId}</p>
                      <p className="text-[10px] text-muted tabular-nums">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-fg">{order.customer.name}</p>
                      <p className="text-[10px] text-muted font-mono">{order.customer.email}</p>
                      {order.customer.phone && (
                        <p className="text-[10px] text-muted font-mono">{order.customer.phone}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-fg">{order.product.planName}</td>
                    <td className="py-3 px-4 text-right font-bold text-fg tabular-nums">₹{order.amountInr?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'CAPTURED' || order.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(order.fulfillmentStatus)}</td>
                    <td className="py-3 px-4">{getSlaBadge(order.slaColor, order.waitingMinutes)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="ui-button-secondary text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1 font-mono"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Action Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted font-bold">
                  Order Management
                </span>
                <h3 className="text-base font-bold text-fg">{selectedOrder.internalOrderId}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted hover:text-fg p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-bg/80 p-3 rounded-control border border-border font-mono">
              <div>
                <p className="text-[10px] text-muted uppercase">Customer</p>
                <p className="font-bold text-fg">{selectedOrder.customer.name}</p>
                <p className="text-muted text-[10px]">{selectedOrder.customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Product & Amount</p>
                <p className="font-bold text-fg">{selectedOrder.product.planName}</p>
                <p className="text-accent font-bold tabular-nums">₹{selectedOrder.amountInr?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Payment Status</p>
                <p className="font-bold">{selectedOrder.paymentStatus}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase">Current Fulfillment</p>
                <p className="font-bold">{selectedOrder.fulfillmentStatus}</p>
              </div>
            </div>

            {selectedOrder.failureReason && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-control text-xs text-rose-600 space-y-1 font-mono">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Failure Reason:
                </p>
                <p className="text-[11px]">{selectedOrder.failureReason}</p>
              </div>
            )}

            {/* Notes Input */}
            <div className="space-y-1.5 font-mono">
              <label className="text-xs font-semibold text-fg uppercase text-[11px]">Fulfillment / Operational Notes</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter serial key, access token, credentials, or internal notes..."
                rows={3}
                className="w-full p-2.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg resize-none"
              />
            </div>

            {actionMessage && (
              <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-xs rounded-control font-mono">
                {actionMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleAction('retry')}
                disabled={actionLoading}
                className="ui-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-mono"
              >
                <Play className="w-3 h-3 text-accent" />
                <span>Retry Auto</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction('processing')}
                  disabled={actionLoading}
                  className="px-2.5 py-1.5 rounded-control text-xs font-mono font-bold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
                >
                  Set Processing
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('manual-review')}
                  disabled={actionLoading}
                  className="px-2.5 py-1.5 rounded-control text-xs font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  Flag Review
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('fulfill')}
                  disabled={actionLoading}
                  className="ui-button-primary text-xs py-1.5 px-3 font-mono font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Fulfilled</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFulfillment;
