import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Clock, ShieldCheck, Key, RefreshCw, ArrowRight, ExternalLink, X, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminFetch } from '../../utils/api';

export const UserOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
          const matching = loadedOrders.find((o: any) => o.internalOrderId === orderIdParam || o.id === orderIdParam);
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

  const latestFulfilledOrder = orders.find(o => o.fulfillmentStatus === 'FULFILLED' && o.displayKey);

  return (
    <div className="space-y-6">
      {/* SUCCESS CELEBRATION BANNER */}
      {paymentStatusParam === 'success' && (
        <div className="p-5 rounded-panel bg-emerald-500/10 border border-emerald-500/30 space-y-3 shadow-md animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-base">
              <Sparkles className="w-5 h-5 text-emerald-600 fill-emerald-500/20" />
              <span>Payment Verified & Subscription Activated!</span>
            </div>
            <button
              onClick={() => {
                searchParams.delete('payment');
                searchParams.delete('order_id');
                searchParams.delete('key_revealed');
                setSearchParams(searchParams);
              }}
              className="text-muted hover:text-fg text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Your payment has been captured and your Claude Max API Key has been provisioned. You have full access to our sub-50ms high-throughput gateway.
          </p>

          {latestFulfilledOrder && (
            <div className="p-3.5 bg-white border border-emerald-200 rounded-control flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">Your Live API Key ({latestFulfilledOrder.planName})</span>
                <p className="font-mono text-xs font-bold text-fg select-all">{latestFulfilledOrder.secretKey || latestFulfilledOrder.displayKey}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleCopyKey(latestFulfilledOrder.secretKey || latestFulfilledOrder.displayKey, 'banner-key')}
                  className="px-3 py-1.5 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  {copiedKeyId === 'banner-key' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Copied Full Key!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full API Key</span>
                    </>
                  )}
                </button>
                <Link
                  to="/dashboard/keys"
                  className="px-3 py-1.5 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Manage Keys</span>
                </Link>
                <Link
                  to="/docs"
                  className="px-3 py-1.5 rounded-control border border-border bg-subtle hover:bg-border text-fg font-bold text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Setup Guide</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAYMENT FAILED BANNER */}
      {paymentStatusParam === 'failed' && (
        <div className="p-4 rounded-panel bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-rose-800">Payment Transaction Unsuccessful</p>
            <p className="text-rose-700">{errorParam ? decodeURIComponent(errorParam) : 'The payment transaction was cancelled or could not be completed.'}</p>
          </div>
        </div>
      )}

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
                  <th className="py-3 px-4">Fulfillment / API Key</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-fg">
                      {o.internalOrderId || o.gatewayOrderId || o.id?.slice(0, 12)}
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
                      {Number(o.amountInr || o.amount || o.priceInr || 0).toLocaleString()}
                      {o.discountAmountInr > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-mono">
                          -₹{o.discountAmountInr.toLocaleString()} ({o.couponCode})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {getPaymentStatusBadge(o.status || o.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {o.displayKey ? (
                        <div className="space-y-1">
                          {getFulfillmentStatusBadge('FULFILLED')}
                          <div className="text-[11px] font-mono text-muted flex items-center gap-1.5">
                            <Key className="w-3 h-3 text-violet-500 shrink-0" />
                            <span className="font-bold text-fg">{o.displayKey}</span>
                            <button
                              onClick={() => handleCopyKey(o.secretKey || o.displayKey, o.id)}
                              className="px-1.5 py-0.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-[10px] border border-violet-200 shrink-0 flex items-center gap-0.5 transition-colors"
                              title="Copy Full API Key"
                            >
                              {copiedKeyId === o.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : o.paymentStatus === 'CAPTURED' && o.fulfillmentStatus !== 'FULFILLED' ? (
                        <button
                          onClick={() => handleRetryFulfillment(o.id)}
                          disabled={fulfillingOrderId === o.id}
                          className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                        >
                          <RefreshCw className={`w-3 h-3 ${fulfillingOrderId === o.id ? 'animate-spin' : ''}`} />
                          <span>Provision Key Now</span>
                        </button>
                      ) : (
                        getFulfillmentStatusBadge(o.fulfillmentStatus || o.status)
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.displayKey && (
                          <Link
                            to="/dashboard/keys"
                            className="ui-button-primary py-1 px-2.5 text-[11px] font-mono gap-1"
                          >
                            <Key className="w-3 h-3" />
                            <span>Keys</span>
                          </Link>
                        )}
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="ui-button-secondary py-1 px-2.5 text-[11px] font-mono"
                        >
                          Receipt
                        </button>
                      </div>
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
                <span>Order Receipt & Key Details</span>
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
                <span className="font-bold text-fg">₹{Number(selectedOrder.amountInr || selectedOrder.amount || selectedOrder.priceInr || 0).toLocaleString()}</span>
              </div>
              {selectedOrder.discountAmountInr > 0 && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Coupon Savings:</span>
                  <span className="font-bold text-emerald-600">-₹{selectedOrder.discountAmountInr.toLocaleString()} ({selectedOrder.couponCode})</span>
                </div>
              )}
              {selectedOrder.displayKey && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-control space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-violet-700">Provisioned API Key</span>
                    <button
                      onClick={() => handleCopyKey(selectedOrder.displayKey, 'modal')}
                      className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                    >
                      {copiedKeyId === 'modal' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-fg select-all break-all">{selectedOrder.displayKey}</p>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Validity Duration:</span>
                <span className="font-bold text-fg">30 Days (Fixed)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Created Timestamp:</span>
                <span className="text-fg">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {selectedOrder.displayKey ? (
                <Link
                  to="/dashboard/keys"
                  className="px-3 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Configure API Keys</span>
                </Link>
              ) : <div />}
              <button
                onClick={() => setSelectedOrder(null)}
                className="ui-button-secondary text-xs py-2 px-4 font-bold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-panel bg-subtle/50 border border-border text-xs text-muted flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>All transactions are secured with TLS 1.3 encryption and automated instant key provisioning.</span>
      </div>
    </div>
  );
};

export default UserOrders;
