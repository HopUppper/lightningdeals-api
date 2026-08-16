import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/user/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (e) {
        console.error('Failed to load customer orders:', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'CAPTURED':
      case 'AUTHORIZED':
      case 'PAID':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">VERIFIED & PAID</span>;
      case 'PENDING':
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">PAYMENT PENDING</span>;
      case 'VERIFICATION_FAILED':
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">PAYMENT FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getFulfillmentStatusBadge = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> API KEY ISSUED</span>;
      case 'FULFILLMENT_FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">KEY CREATION RETRY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-violet-600" />
            <span>Order & Payment History</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Track your purchases, verified payment receipts, and provisioned API key entitlements.
          </p>
        </div>

        <Link
          to="/#pricing"
          className="px-4 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          + Buy New Token Package
        </Link>
      </div>

      <div className="bg-card border border-border rounded-panel overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-600" /> Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-muted mx-auto" />
            <div>
              <p className="text-sm font-bold text-fg">No orders found</p>
              <p className="text-xs text-muted mt-1">Select a prepaid package to activate your first production API key.</p>
            </div>
            <Link
              to="/#pricing"
              className="px-4 py-2 rounded-control bg-subtle hover:bg-border text-fg text-xs font-bold inline-block"
            >
              Browse Packages →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50 text-[11px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Plan Package</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Fulfillment State</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-fg">
                      {o.internalOrderId || o.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-fg">{o.planName || 'Claude Max'}</div>
                      <div className="text-[11px] font-mono text-violet-600">+{formatTokens(o.tokenQuantity)} / {o.windowHours || 5}h</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-fg">
                      ₹{(o.paidAmountInr || o.amountInr || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {getPaymentStatusBadge(o.paymentStatus || o.status)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {getFulfillmentStatusBadge(o.fulfillmentStatus || (o.tokensCredited ? 'FULFILLED' : 'NOT_FULFILLED'))}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 rounded-panel bg-subtle/50 border border-border text-xs text-muted flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>All orders are independently verified server-side. Customer API keys inherit exact purchased token allowances.</span>
      </div>
    </div>
  );
};

export default UserOrders;
