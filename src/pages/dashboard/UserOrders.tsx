import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Key,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  X,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminFetch } from '../../utils/api';

export const UserOrders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [fulfillingOrderId, setFulfillingOrderId] = useState<string | null>(null);

  const paymentStatusParam = searchParams.get('payment');
  const orderIdParam = searchParams.get('order_id');
  const errorParam = searchParams.get('error');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/user/orders');
      if (res.ok) {
        const data = await res.json();
        const loadedOrders = data.orders || (Array.isArray(data) ? data : []);
        setOrders(loadedOrders);

        // If order_id param was passed, auto-select it
        if (orderIdParam) {
          const matching = loadedOrders.find(
            (o: any) => o.internalOrderId === orderIdParam || o.id === orderIdParam
          );
          if (matching) {
            setSelectedOrder(matching);
          }
        }
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

  const handleCopyKey = (keyText: string, id: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleRetryFulfillment = async (orderId: string) => {
    setFulfillingOrderId(orderId);
    try {
      const res = await adminFetch(`/api/user/orders/${orderId}/retry-fulfill`, {
        method: 'POST',
      });
      if (res.ok) {
        await loadOrders();
      }
    } catch (e) {
      console.error('Retry fulfillment failed:', e);
    } finally {
      setFulfillingOrderId(null);
    }
  };

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
      case 'SUCCESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Paid & Active
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Processing
          </span>
        );
      case 'VERIFICATION_FAILED':
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-subtle text-muted border border-border">
            {status}
          </span>
        );
    }
  };

  const getFulfillmentStatusBadge = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Ready
          </span>
        );
      case 'FULFILLMENT_FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Retry Needed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-subtle text-muted border border-border">
            {status || 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Payment Feedback Banner */}
      {paymentStatusParam === 'success' && (
        <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-playful space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black">Payment Confirmed!</h3>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Your payment was successful and your API access has been activated! Click on your order below to view your key.
          </p>
        </div>
      )}

      {errorParam && (
        <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-playful space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-black">Payment Issue</h3>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            There was a problem processing your payment. Please try again or reach out to support on WhatsApp.
          </p>
        </div>
      )}

      {/* Playful Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <ShoppingBag className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                  Orders & Receipts
                </h1>
                <span className="text-[11px] font-bold text-violet-700 bg-violet-100/80 px-2.5 py-0.5 rounded-full border border-violet-200">
                  Instant Access
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                View your complete order history, payment receipts, and provisioned keys.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="ui-button-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            to="/pricing"
            className="ui-button-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
          >
            <span>Browse Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-7 shadow-playful space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-fg">Your Order History</h3>
            <p className="text-xs text-muted mt-0.5">
              Select any order to inspect details or copy the provisioned key.
            </p>
          </div>
          <span className="text-xs text-muted font-bold">{orders.length} Total Orders</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-600" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-100">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-fg">No Orders Found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              You haven't placed any orders yet. Choose a plan to unlock Claude access today!
            </p>
            <Link to="/pricing" className="ui-button-primary text-xs py-2 px-4 font-bold inline-block">
              Choose a Plan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Plan / Item</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-center">Key Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-fg whitespace-nowrap">
                      {o.internalOrderId || o.id.slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-fg">
                      <div>{o.planName || o.productName || 'Claude Max Plan'}</div>
                      {o.tokensAllocated && (
                        <div className="text-[11px] text-violet-700 font-bold">
                          {formatTokens(o.tokensAllocated)} tokens
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-muted whitespace-nowrap text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-fg whitespace-nowrap">
                      ₹{Number(o.amount || o.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getPaymentStatusBadge(o.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getFulfillmentStatusBadge(o.fulfillmentStatus)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-violet-700 hover:text-violet-900 font-bold hover:underline cursor-pointer"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-fg">Order Details</h3>
                  <p className="text-xs text-muted font-mono">{selectedOrder.internalOrderId || selectedOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl hover:bg-subtle text-muted hover:text-fg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-subtle/40 border border-border/80">
                <div>
                  <span className="text-muted block text-[11px]">Product</span>
                  <span className="font-bold text-fg text-sm">
                    {selectedOrder.planName || 'Claude Max'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Total Paid</span>
                  <span className="font-bold text-fg text-sm">
                    ₹{Number(selectedOrder.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Payment Status</span>
                  <div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Date</span>
                  <span className="font-medium text-fg">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Key Secret Display if fulfilled */}
              {selectedOrder.apiKeySecret && (
                <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-200 space-y-2">
                  <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider block">
                    Your API Key
                  </span>
                  <div className="flex items-center gap-2 bg-white border border-violet-200 rounded-xl px-3 py-2 font-mono text-xs text-fg shadow-2xs select-all">
                    <span className="truncate flex-1">{selectedOrder.apiKeySecret}</span>
                    <button
                      onClick={() => handleCopyKey(selectedOrder.apiKeySecret, selectedOrder.id)}
                      className="text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKeyId === selectedOrder.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copiedKeyId === selectedOrder.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Retry fulfillment if failed */}
              {selectedOrder.fulfillmentStatus === 'FULFILLMENT_FAILED' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Automatic Key Generation Paused</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    The automatic provisioning timed out. Click below to retry immediate key allocation.
                  </p>
                  <button
                    onClick={() => handleRetryFulfillment(selectedOrder.id)}
                    disabled={fulfillingOrderId === selectedOrder.id}
                    className="ui-button-primary text-xs py-2 px-4 font-bold cursor-pointer"
                  >
                    {fulfillingOrderId === selectedOrder.id ? 'Retrying...' : 'Retry Key Allocation'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-2xl bg-subtle text-fg font-bold text-xs hover:bg-subtle/80 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrders;
