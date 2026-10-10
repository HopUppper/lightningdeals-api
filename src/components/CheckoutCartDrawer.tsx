import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, Tag, ShieldCheck, Zap, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, CreditCard, Sparkles, Flame } from 'lucide-react';
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

  // Active Promotional Offer state
  const [activeOffer, setActiveOffer] = useState<{
    title: string;
    subtitle: string;
    badge: string;
    multiplier: number;
    minPurchaseAmount: number;
    maxCredits: number;
    baseRewardPercentage: number;
    maxEligiblePurchaseAmount?: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveOffer = async () => {
      try {
        const res = await fetch('/api/rewards/active-offer');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.active && data.offer) {
            setActiveOffer(data.offer);
          }
        }
      } catch (e) {
        // Silently continue
      }
    };
    fetchActiveOffer();
    return () => {
      isMounted = false;
    };
  }, []);

  const maxEligible = activeOffer?.maxEligiblePurchaseAmount || 5000;
  const rewardRate = activeOffer?.baseRewardPercentage || 10;
  const eligibleAmount = Math.min(totalPayable, maxEligible);
  const baseRewardCredits = Math.round((eligibleAmount * (rewardRate / 100)) * 100) / 100;

  const isPromo = Boolean(activeOffer && (activeOffer.multiplier || 1) > 1);
  const meetsMinPurchase = totalPayable >= (activeOffer?.minPurchaseAmount || 0);

  let estimatedEarnedCredits = baseRewardCredits;
  let isPromoApplied = false;

  if (isPromo && meetsMinPurchase && totalPayable > 0) {
    isPromoApplied = true;
    const multiplier = Number(activeOffer!.multiplier) || 1;
    const boosted = Math.round((baseRewardCredits * multiplier) * 100) / 100;
    const maxCap = activeOffer!.maxCredits > 0 ? activeOffer!.maxCredits : boosted;
    estimatedEarnedCredits = Math.min(boosted, maxCap);
  }

  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const item = cartItems[0];

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const success = await applyCoupon(inputCode);
    if (success) setInputCode('');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: item.planId || item.id,
          couponCode: appliedCoupon?.code || undefined,
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
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1c1917]/50 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#fbf9f5] border-l border-[#e7e5e4] shadow-warm flex flex-col font-sans h-full max-h-screen">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#e7e5e4] flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#6d28d9] text-white shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1c1917]">Your Checkout Cart</h2>
                <p className="text-[11px] text-[#78716c] font-mono">
                  {cartItems.length} {cartItems.length === 1 ? 'Plan' : 'Plans'} Selected
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="min-h-[40px] min-w-[40px] p-2 rounded-lg text-[#78716c] hover:text-[#1c1917] hover:bg-[#f5f2eb] transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#f5f3ff] text-[#6d28d9] flex items-center justify-center mx-auto border border-[#ddd6fe]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#1c1917]">Your Cart is Empty</h3>
                  <p className="text-xs text-[#78716c] max-w-xs mx-auto">
                    Select a Claude capacity plan to activate high-performance API access instantly.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/pricing');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum transition-all cursor-pointer"
                >
                  BROWSE CAPACITY PLANS
                </button>
              </div>
            ) : (
              <>
                {/* Item Card */}
                <div className="p-4 rounded-xl bg-white border border-[#e7e5e4] space-y-3 relative shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {item.badge && (
                        <span className="text-[10px] font-mono font-semibold uppercase text-[#6d28d9] bg-[#f5f3ff] border border-[#ddd6fe] px-2 py-0.5 rounded mr-2">
                          {item.badge}
                        </span>
                      )}
                      <span className="font-bold text-sm text-[#1c1917]">{item.name}</span>
                      <p className="text-xs text-[#78716c] font-mono mt-0.5">{item.tokenDisplay}</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.planId || item.id)}
                      className="p-1.5 text-[#78716c] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#78716c] pt-2 border-t border-[#f5f2eb]">
                    <div>Window: <strong className="text-[#1c1917]">{item.windowHours}h Refresh</strong></div>
                    <div>Validity: <strong className="text-[#1c1917]">{item.validityDays} Days</strong></div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-[#f5f2eb]">
                    <span className="text-xs text-[#78716c] font-mono">Plan Price</span>
                    <div className="text-right">
                      {item.originalPriceInr && (
                        <span className="text-xs text-[#a8a29e] line-through mr-2 font-mono">
                          ₹{item.originalPriceInr.toLocaleString()}
                        </span>
                      )}
                      <span className="text-base font-bold font-mono text-[#1c1917]">
                        ₹{item.priceInr.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promo Code / Coupon Section */}
                <div className="p-4 rounded-xl bg-white border border-[#e7e5e4] space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1c1917]">
                    <Tag className="w-3.5 h-3.5 text-[#6d28d9]" />
                    <span>Have a Coupon or Promo Code?</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#065f46] font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                          <span>COUPON APPLIED: {appliedCoupon.code}</span>
                        </div>
                        <p className="text-[11px] text-[#047857] font-mono">
                          You saved ₹{discountAmount.toLocaleString()} ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} OFF`})
                        </p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-[11px] font-bold text-rose-600 hover:underline ml-2 cursor-pointer"
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
                          className="flex-1 text-xs font-mono py-2 px-3 uppercase border border-[#e7e5e4] rounded-lg bg-[#fdfbf7] text-[#1c1917] focus:outline-none focus:border-[#6d28d9]"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !inputCode.trim()}
                          className="text-xs py-2 px-4 font-semibold rounded-lg bg-[#1c1917] text-white hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
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
                <div className="space-y-2.5 font-mono text-xs text-[#78716c] border-t border-[#e7e5e4] pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#1c1917]">₹{subtotal.toLocaleString()}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#059669] font-bold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Platform & Gateway Fee</span>
                    <span className="text-[#059669]">FREE</span>
                  </div>

                  <div className="flex justify-between text-[#1c1917] font-bold text-base pt-2 border-t border-[#e7e5e4]">
                    <span>Total Payable</span>
                    <span className="text-[#6d28d9]">₹{totalPayable.toLocaleString()}</span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#e7e5e4] bg-white space-y-3 shrink-0">
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full py-3 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-plum disabled:opacity-50 transition-all"
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

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#78716c] text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>256-Bit Encrypted · Instant Key Delivery · No Auto-Renewal</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
