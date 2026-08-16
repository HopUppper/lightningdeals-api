import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, ShieldCheck, Key, RefreshCw, ArrowRight, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../utils/api';

export const UserOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/user/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || (Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error('Failed to load customer orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatTokens = (val: string | number) => {
    const num = Number(val || 0);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'CAPTURED':
      case 'AUTHORIZED':
      case 'PAID':
      case 'SUCCESS':
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> ACTIVE / PROVISIONED</span>;
      case 'FULFILLMENT_FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">RETRY PROVISIONING</span>;
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
            Track your Claude Max plan subscriptions, payment gateway receipts, and allocated token entitlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3 gap-1.5 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/pricing"
            className="px-4 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>+ Buy New Plan</span>
          </Link>
        </div>
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
              <p className="text-xs text-muted mt-1">Select a Claude Max plan or start a free 1-day trial to activate your API access.</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                to="/pricing"
                className="px-4 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-block"
              >
                Explore Claude Max Plans →
              </Link>
              <Link
                to="/dashboard/plan"
                className="px-4 py-2 rounded-control bg-subtle hover:bg-border text-fg text-xs font-bold inline-block"
              >
                Claim Free Trial
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted font-mono uppercase bg-bg/50 text-[11px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Plan / Package</th>
                  <th className="py-3 px-4 font-mono">5h Rolling Quota</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-fg">
                      {o.internalOrderId || o.cashfreeOrderId || o.id?.slice(0, 12)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-fg">{o.planName || (o.planId?.toUpperCase()) || 'Claude Max'}</div>
                      <div className="text-[11px] font-mono text-muted">30-Day Fixed Validity</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-700">
                      {formatTokens(o.tokensPurchased || o.tokenQuantity)} / 5h
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-fg">
                      {o.currency === 'INR' || !o.currency ? '₹' : o.currency + ' '}
                      {Number(o.amount || o.priceInr || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {getPaymentStatusBadge(o.status || o.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {getFulfillmentStatusBadge(o.fulfillmentStatus || (o.status === 'PAID' || o.tokensCredited ? 'FULFILLED' : 'PENDING'))}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="ui-button-secondary py-1 px-2.5 text-[11px] font-mono"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-panel max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-violet-600" />
                <span>Order Receipt</span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-muted hover:text-fg text-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Order Reference:</span>
                <span className="font-bold text-fg">{selectedOrder.internalOrderId || selectedOrder.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Plan Selected:</span>
                <span className="font-bold text-violet-600">{selectedOrder.planName || selectedOrder.planId?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Quota Allocated:</span>
                <span className="font-bold text-fg">{formatTokens(selectedOrder.tokensPurchased || selectedOrder.tokenQuantity)} / 5 Hours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Total Paid:</span>
                <span className="font-bold text-fg">₹{Number(selectedOrder.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Payment Gateway:</span>
                <span className="font-bold text-emerald-600">Cashfree Payments (Verified)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Validity Duration:</span>
                <span className="font-bold text-fg">30 Days (Fixed)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Created Timestamp:</span>
                <span className="text-fg">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="ui-button-primary text-xs py-2 px-4 font-bold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-panel bg-subtle/50 border border-border text-xs text-muted flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>All transactions are secured with TLS 1.3 encryption and settled via Cashfree Payments gateway.</span>
      </div>
    </div>
  );
};

export default UserOrders;
