import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [providerHealth, setProviderHealth] = useState<any>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, healthRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/checkout/provider-health'),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setProviderHealth(healthData.provider || null);
      }
    } catch (e) {
      console.error('Failed to load admin orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetryFulfillment = async (internalOrderId: string) => {
    setRetryingId(internalOrderId);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${internalOrderId}/fulfill`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`✓ Order ${internalOrderId} fulfilled successfully! API Key: ${data.fulfillment?.displayKey}`);
        loadData();
      } else {
        setActionMessage(`❌ Fulfillment retry failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch {
      setActionMessage('❌ Network error retrying fulfillment.');
    } finally {
      setRetryingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      o.internalOrderId?.toLowerCase().includes(query) ||
      o.id?.toLowerCase().includes(query) ||
      o.user?.email?.toLowerCase().includes(query) ||
      o.user?.name?.toLowerCase().includes(query) ||
      o.gatewayPaymentId?.toLowerCase().includes(query) ||
      o.planName?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && (o.paymentStatus === 'CAPTURED' || o.paymentStatus === 'PAID')) ||
      (statusFilter === 'PENDING' && o.paymentStatus === 'PENDING') ||
      (statusFilter === 'FAILED' && (o.paymentStatus === 'FAILED' || o.paymentStatus === 'VERIFICATION_FAILED')) ||
      (statusFilter === 'FULFILLED' && o.fulfillmentStatus === 'FULFILLED') ||
      (statusFilter === 'FULFILLMENT_FAILED' && o.fulfillmentStatus === 'FULFILLMENT_FAILED');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Provider Health Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-fg flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-violet-600" />
            <span>Payments & Order Control Center</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time audit log of customer orders, payment signatures, and automated key provisioning.
          </p>
        </div>

        {/* Provider Health Card */}
        {providerHealth && (
          <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-fg">{providerHealth.providerName}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  {providerHealth.status}
                </span>
              </div>
              <p className="text-[11px] text-muted font-mono">{providerHealth.message}</p>
            </div>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-control bg-violet-50 border border-violet-200 text-violet-800 text-xs font-mono">
          {actionMessage}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, Email, Payment ID, or Plan..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-card border border-border rounded-control text-fg focus:outline-none focus:border-violet-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-card border border-border rounded-control text-fg font-medium focus:outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Verified Paid</option>
            <option value="PENDING">Pending Payment</option>
            <option value="FAILED">Payment Failed</option>
            <option value="FULFILLED">Fulfilled (Key Issued)</option>
            <option value="FULFILLMENT_FAILED">Fulfillment Failed (Needs Retry)</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 rounded-control bg-subtle hover:bg-border text-fg transition-all"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-600" /> Loading payment records...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted">No orders match your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50 text-[11px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-fg">
                      <div>{o.internalOrderId || o.id}</div>
                      <div className="text-[10px] text-muted">{o.paymentGateway}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-fg">{o.user?.name || 'Customer'}</div>
                      <div className="text-[11px] font-mono text-muted">{o.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-violet-600">{o.planName || 'Claude Max'}</div>
                      <div className="text-fg font-extrabold">₹{(o.paidAmountInr || o.amountInr || 0).toLocaleString()}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.paymentStatus === 'CAPTURED' || o.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.paymentStatus === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {o.paymentStatus || o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.fulfillmentStatus === 'FULFILLED'
                          ? 'bg-violet-50 text-violet-700 border border-violet-200'
                          : o.fulfillmentStatus === 'FULFILLMENT_FAILED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {o.fulfillmentStatus || 'NOT_FULFILLED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {o.fulfillmentStatus !== 'FULFILLED' && (o.paymentStatus === 'CAPTURED' || o.paymentStatus === 'AUTHORIZED') && (
                        <button
                          onClick={() => handleRetryFulfillment(o.internalOrderId)}
                          disabled={retryingId === o.internalOrderId}
                          className="px-2.5 py-1 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] transition-all inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {retryingId === o.internalOrderId ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Retry Fulfillment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
