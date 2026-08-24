import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, Tag, ShieldCheck, Zap, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminFetch } from '../utils/api';

export const CheckoutCartDrawer: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    clearCart,
    appliedCoupon,
    couponLoading,
    couponError,
    applyCoupon,
    removeCoupon,
    subtotal,
    discountAmount,
    totalPayable,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const item = cartItems[0];

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const success = await applyCoupon(inputCode);
    if (success) {
      setInputCode('');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      closeCart();
      navigate('/login?redirect=checkout');
      return;
    }

    if (!item) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await adminFetch('/api/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({
          planId: item.planId || item.id,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCheckoutError(data.error?.message || 'Failed to initialize payment.');
        setCheckoutLoading(false);
        return;
      }

      const { metadata, checkoutUrl } = data.order;

      // 1. PayU Auto-Form Submit
      if (metadata?.paymentGateway === 'PAYU' && metadata?.action) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = metadata.action;

        const fields: Record<string, string> = {
          key: metadata.key,
          txnid: metadata.txnid,
          amount: metadata.amount,
          productinfo: metadata.productinfo,
          firstname: metadata.firstname,
          email: metadata.email,
          phone: metadata.phone || '9999999999',
          surl: metadata.surl,
          furl: metadata.furl,
          hash: metadata.hash,
          udf1: metadata.udf1 || '',
          udf2: metadata.udf2 || '',
          udf3: metadata.udf3 || '',
        };

        for (const [k, val] of Object.entries(fields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = val;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // 2. Direct Checkout URL
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Payment network error.');
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-border shadow-2xl flex flex-col font-sans">
          
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-bg/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-fg">Your Checkout Cart</h2>
                <p className="text-[11px] text-muted font-mono">
                  {cartItems.length} {cartItems.length === 1 ? 'Subscription' : 'Items'} Selected
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-subtle transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-200">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-fg">Your Cart is Empty</h3>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    Select a Claude Max plan to activate high-performance API access instantly.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/pricing');
                  }}
                  className="ui-button-primary text-xs py-2.5 px-5 font-bold"
                >
                  BROWSE CLAUDE PLANS
                </button>
              </div>
            ) : (
              <>
                {/* Item Card */}
                <div className="p-4 rounded-control bg-subtle/70 border border-border space-y-3 relative group">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {item.badge && (
                        <span className="text-[10px] font-mono font-bold uppercase text-violet-700 bg-violet-100 px-2 py-0.5 rounded mr-2">
                          {item.badge}
                        </span>
                      )}
                      <span className="font-extrabold text-sm text-fg">Claude Max {item.name}</span>
                      <p className="text-xs text-muted font-mono mt-0.5">{item.tokenDisplay}</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.planId || item.id)}
                      className="p-1.5 text-muted hover:text-rose-600 rounded-control hover:bg-rose-50 transition-colors"
                      title="Remove plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted pt-2 border-t border-border/60">
                    <div>Window: <strong>{item.windowHours}h Refresh</strong></div>
                    <div>Validity: <strong>{item.validityDays} Days</strong></div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-border/60">
                    <span className="text-xs text-muted font-mono">Plan Price</span>
                    <div className="text-right">
                      {item.originalPriceInr && (
                        <span className="text-xs text-muted line-through mr-2 font-mono">
                          ₹{item.originalPriceInr.toLocaleString()}
                        </span>
                      )}
                      <span className="text-base font-extrabold font-mono text-fg">
                        ₹{item.priceInr.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promo Code / Coupon Section */}
                <div className="p-4 rounded-control bg-bg border border-border space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-fg">
                    <Tag className="w-3.5 h-3.5 text-violet-600" />
                    <span>Have a Coupon or Promo Code?</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>COUPON APPLIED: {appliedCoupon.code}</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-mono">
                          You saved ₹{discountAmount.toLocaleString()} ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} OFF`})
                        </p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-[11px] font-bold text-rose-600 hover:underline ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. LAUNCH20"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                          className="flex-1 ui-input text-xs font-mono py-2 px-3 uppercase"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !inputCode.trim()}
                          className="ui-button-secondary text-xs py-2 px-4 font-bold disabled:opacity-50 flex items-center gap-1"
                        >
                          {couponLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'APPLY'}
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-mono flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{couponError}</span>
                        </p>
                      )}
                    </form>
                  )}
                </div>

                {/* Order Cost Breakdown */}
                <div className="space-y-2.5 font-mono text-xs text-muted border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Platform & Gateway Fee</span>
                    <span className="text-emerald-600">FREE</span>
                  </div>

                  <div className="flex justify-between text-fg font-extrabold text-base pt-2 border-t border-border">
                    <span>Total Payable</span>
                    <span className="text-violet-700">₹{totalPayable.toLocaleString()}</span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-600 font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-border bg-bg/50 space-y-3">
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full py-3.5 rounded-control bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>CONNECTING TO GATEWAY...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>PROCEED TO SECURE PAYMENT — ₹{totalPayable.toLocaleString()}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-muted text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>256-Bit Encrypted · Instant Key Delivery · No Auto-Renewal</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
