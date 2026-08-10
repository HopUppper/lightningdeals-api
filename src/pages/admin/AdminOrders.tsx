import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';

interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  amountInr: number;
  tokenQuantity: string;
  status: string;
  paymentReference: string;
  paymentGateway: string;
  createdAt: string;
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/orders?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 w-max">
          <CheckCircle2 className="w-3 h-3" /> PAID
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1 w-max">
          <Clock className="w-3 h-3" /> PENDING
        </span>
      );
    }
    if (s === 'REFUNDED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/30 flex items-center gap-1 w-max">
          <RefreshCw className="w-3 h-3" /> REFUNDED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30 flex items-center gap-1 w-max">
        <XCircle className="w-3 h-3" /> {s}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            <span>Order Management & Fulfillment Ledger</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time backend ledger for customer token package orders, UPI payments, and backend status updates.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="px-3 py-1.5 text-xs bg-bg border border-border hover:bg-card text-fg rounded-control flex items-center gap-1.5 font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border p-4 rounded-panel">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <span className="text-xs font-mono font-semibold text-muted uppercase">Status:</span>
          {['all', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs rounded-control font-mono font-bold uppercase transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'bg-bg text-muted hover:text-fg border border-border'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, email, reference..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-amber-500 font-mono text-fg"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 text-xs bg-amber-500 text-black font-bold rounded-control hover:bg-amber-400">
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-panel overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted font-mono">Loading purchase orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted font-mono">No matching orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Tokens</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Ref / Gateway</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-bg/40">
                    <td className="py-3 px-4 font-mono text-muted text-[11px] font-bold">{o.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-fg">{o.customerName || 'Customer'}</p>
                      <p className="text-[10px] text-muted font-mono">{o.customerEmail}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-fg">{o.packageName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">{formatTokens(o.tokenQuantity)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-500">₹{o.amountInr.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-muted text-[11px]">
                      <p className="text-fg">{o.paymentReference}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted">{o.paymentGateway}</p>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(o.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <select
                        disabled={updatingId === o.id}
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        className="bg-bg border border-border text-fg text-[11px] font-mono rounded px-2 py-1 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      >
                        <option value="PAID">Mark PAID</option>
                        <option value="PENDING">Mark PENDING</option>
                        <option value="FAILED">Mark FAILED</option>
                        <option value="REFUNDED">Mark REFUNDED</option>
                      </select>
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
