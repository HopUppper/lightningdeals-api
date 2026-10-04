import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, Search, Filter, ShieldAlert, User, Zap, ChevronRight, Play } from 'lucide-react';
import { adminFetch } from '../../utils/api';
import { ThreeDCard } from '../../components/ThreeDCard';

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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Clock className="w-3 h-3 text-emerald-600" />
          {waitingMinutes}m (Green &lt;15m)
        </span>
      );
    }
    if (slaColor === 'YELLOW') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          {waitingMinutes}m (Yellow 15-60m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        {waitingMinutes}m (Critical &gt;60m)
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">FULFILLED</span>;
      case 'FULFILLMENT_PROCESSING':
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">PROCESSING</span>;
      case 'MANUAL_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">MANUAL REVIEW</span>;
      case 'FULFILLMENT_FAILED':
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-fg flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            ⚡ Universal Fulfillment Queue
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time manual & automated order fulfillment SLA pipeline. Green (&lt;15m), Yellow (15-60m), Red (&gt;60m).
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="ui-button-secondary text-xs py-2 px-3 self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
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
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-white border border-border text-muted hover:text-fg hover:bg-subtle'
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
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-border rounded-control focus:outline-none focus:border-violet-500 font-mono"
          />
        </form>
      </div>

      {/* Orders Table */}
      <ThreeDCard className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle/60 border-b border-border text-[10px] uppercase font-mono tracking-wider text-muted font-bold">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product / Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4">SLA Aging</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-violet-600" />
                    Loading fulfillment queue...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No orders matching this fulfillment filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <p className="font-bold text-fg">{order.internalOrderId}</p>
                      <p className="text-[10px] text-muted">
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
                    <td className="py-3 px-4 font-mono font-bold text-fg">₹{order.amountInr?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'CAPTURED' || order.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{getStatusBadge(order.fulfillmentStatus)}</td>
                    <td className="py-3 px-4">{getSlaBadge(order.slaColor, order.waitingMinutes)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="ui-button-secondary text-[11px] py-1 px-2.5 font-bold inline-flex items-center gap-1"
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
      </ThreeDCard>

      {/* Order Action Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-panel max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted font-bold">
                  Order Management
                </span>
                <h3 className="text-base font-bold text-fg">{selectedOrder.internalOrderId}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted hover:text-fg text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-subtle/50 p-3 rounded-control border border-border/60">
              <div>
                <p className="text-[10px] text-muted uppercase font-mono">Customer</p>
                <p className="font-bold text-fg">{selectedOrder.customer.name}</p>
                <p className="text-muted font-mono text-[10px]">{selectedOrder.customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase font-mono">Product & Amount</p>
                <p className="font-bold text-fg">{selectedOrder.product.planName}</p>
                <p className="text-muted font-mono font-bold">₹{selectedOrder.amountInr?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase font-mono">Payment Status</p>
                <p className="font-bold font-mono">{selectedOrder.paymentStatus}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase font-mono">Current Fulfillment</p>
                <p className="font-bold font-mono">{selectedOrder.fulfillmentStatus}</p>
              </div>
            </div>

            {selectedOrder.failureReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-control text-xs text-rose-700 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Failure Reason:
                </p>
                <p className="font-mono text-[11px]">{selectedOrder.failureReason}</p>
              </div>
            )}

            {/* Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-fg">Fulfillment / Operational Notes</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter serial key, access URL, credentials, or internal operator notes..."
                rows={3}
                className="w-full p-2.5 text-xs bg-white border border-border rounded-control focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            {actionMessage && (
              <div className="p-3 bg-violet-50 border border-violet-200 text-violet-800 text-xs rounded-control font-mono">
                {actionMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleAction('retry')}
                disabled={actionLoading}
                className="ui-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 text-violet-600" />
                Retry Auto
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction('processing')}
                  disabled={actionLoading}
                  className="px-2.5 py-1.5 rounded-control text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Set Processing
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('manual-review')}
                  disabled={actionLoading}
                  className="px-2.5 py-1.5 rounded-control text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  Flag Review
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('fulfill')}
                  disabled={actionLoading}
                  className="ui-button-primary text-xs py-1.5 px-3 font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Fulfilled
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
