import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Zap, Lock, AlertCircle, CheckCircle2, RefreshCw, CreditCard, ExternalLink, Tag, Phone, Sparkles } from 'lucide-react';
import { adminFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ApiKeyRevealModal } from './ApiKeyRevealModal';

export interface CheckoutModalProps {
  plan: {
    id: string;
    name: string;
    priceInr: number;
    tokenDisplay: string;
    windowHours: number;
    validityDays: number;
    tagline?: string;
  } | null;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ plan, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentState, setPaymentState] = useState<
    'IDLE' | 'PROCESSING' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'VERIFICATION_FAILED'
  >('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  // Phone state (Required for UPI by NPCI & PayU)
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Lightning Credits state
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [useCredits, setUseCredits] = useState<boolean>(false);
  const [loadingCredits, setLoadingCredits] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      try {
        setLoadingCredits(true);
        const res = await adminFetch('/api/user/rewards/balance');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAvailableCredits(data.availableCredits || 0);
          }
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoadingCredits(false);
      }
    };
    fetchBalance();
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!plan) return null;

  const subtotal = plan.priceInr;
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const amountAfterCoupon = Math.max(0, subtotal - discountAmount);
  const maxUsableCredits = Math.min(availableCredits, amountAfterCoupon);
  const appliedCredits = useCredits ? maxUsableCredits : 0;
  const totalPayable = Math.max(0, amountAfterCoupon - appliedCredits);

  // Authoritative reward rule: MIN(payable, 5000) * 10%, max 500
  const estimatedEarnedCredits = Math.min(
    Math.round(Math.min(totalPayable, 5000) * 0.10 * 100) / 100,
    500
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await adminFetch('/api/checkout/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim(), planId: plan.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCouponError(data.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data.coupon);
        setCouponCode('');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!user) {
      navigate('/login?redirect=checkout');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number for UPI confirmation.');
      return;
    }
    setPhoneError(null);

    setPaymentState('PROCESSING');
    setErrorMessage(null);

    // Track GA Event: Checkout Started
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'begin_checkout', {
        currency: 'INR',
        value: totalPayable,
        items: [{ item_id: plan.id, item_name: plan.name }],
      });
    }

    try {
      // 1. Create Server-Side Order (Zero Frontend Price Trust)
      const res = await adminFetch('/api/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({
          planId: plan.id,
          couponCode: appliedCoupon?.code,
          phone: cleanPhone,
          redeemCredits: appliedCredits,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPaymentState('FAILED');
        setErrorMessage(data.error?.message || 'Failed to initialize payment order.');
        return;
      }

      // Handle 100% Credit Payment (Instant Fulfillment, No Gateway Needed)
      if (data.order?.zeroAmountPaid || data.order?.amountInr === 0) {
        setPaymentState('SUCCESSFUL');
        const keySecret = data.fulfillment?.rawKeySecret;
        if (keySecret) {
          setRevealedKey(keySecret);
        } else {
          setTimeout(() => {
            onClose();
            navigate('/dashboard/plan');
          }, 1200);
        }
        return;
      }

      const { internalOrderId, gatewayOrderId, checkoutUrl, metadata } = data.order;

      setPaymentState('PENDING');

      // 1. PayU Hosted Checkout Form Submission
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

      // 2. Direct Checkout URL (Cashfree or Hosted URL)
      if (checkoutUrl && !checkoutUrl.includes('TEST_FALLBACK')) {
        window.location.href = checkoutUrl;
        return;
      }

      // 3. Simulate/Execute Server Verification for local/staging
      setTimeout(async () => {
        try {
          const verifyRes = await adminFetch('/api/checkout/verify', {
            method: 'POST',
            body: JSON.stringify({
              internalOrderId,
              gatewayOrderId: gatewayOrderId || internalOrderId,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            setPaymentState('SUCCESSFUL');
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'purchase', {
                transaction_id: internalOrderId,
                value: plan.priceInr,
                currency: 'INR',
                items: [{ item_id: plan.id, item_name: plan.name }],
              });
            }
            const keySecret = verifyData.fulfillment?.rawKeySecret || verifyData.rawKeySecret;
            if (keySecret) {
              setRevealedKey(keySecret);
            } else {
              setTimeout(() => {
                onClose();
                navigate('/dashboard/plan');
              }, 1200);
            }
          } else {
            setPaymentState('VERIFICATION_FAILED');
            setErrorMessage(verifyData.error || 'We couldn\'t verify the payment. Please contact support.');
          }
        } catch (err: any) {
          setPaymentState('VERIFICATION_FAILED');
          setErrorMessage('Payment verification error. Contact support if charged.');
        }
      }, 1200);
    } catch (err: any) {
      setPaymentState('FAILED');
      setErrorMessage(err.message || 'Network error initializing payment gateway.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-center justify-center py-4">
        <div
          className="bg-white border border-border rounded-panel w-full max-w-lg shadow-2xl overflow-hidden font-sans relative flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-bg/50 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-fg">Claude Max Checkout</h2>
                <p className="text-[11px] text-muted font-mono">Instant Automated Activation · 256-Bit Encrypted Checkout</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-subtle transition-colors"
              title="Close checkout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
            {paymentState === 'IDLE' && (
            <>
              {/* Plan Summary Card */}
              <div className="p-4 rounded-control bg-subtle/70 border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-fg">{plan.name}</span>
                  <span className="text-base font-extrabold text-violet-700 font-mono">₹{plan.priceInr.toLocaleString()}</span>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {plan.tagline || `Includes ${plan.tokenDisplay} Tokens with ${plan.windowHours}-hour refresh window.`}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-[11px] font-mono text-muted">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Allowance: <strong>{plan.tokenDisplay}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Window: <strong>{plan.windowHours} Hours</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant API Key Issue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Claude Opus 5, Fable 5 & Sonnet 5</span>
                  </div>
                </div>
              </div>

              {/* Customer Mobile Number Field (Required by UPI & NPCI) */}
              <div className="p-3.5 rounded-control bg-bg border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-fg">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-violet-600" />
                    <span>Mobile Number</span>
                  </div>
                  <span className="text-[10px] text-muted font-mono uppercase">Required for UPI</span>
                </div>
                <div className={`flex rounded-control border overflow-hidden bg-white focus-within:border-violet-500 transition-colors ${phoneError ? 'border-rose-400' : 'border-border'}`}>
                  <span className="px-3 py-1.5 bg-subtle text-xs font-mono font-bold text-muted border-r border-border flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (phoneError) setPhoneError(null);
                    }}
                    className="flex-1 text-xs font-mono py-1.5 px-3 bg-transparent outline-none text-fg"
                  />
                </div>
                {phoneError ? (
                  <p className="text-[11px] text-rose-600 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-muted font-mono">
                    Used by NPCI & PayU to deliver instant UPI collect requests & key confirmation.
                  </p>
                )}
              </div>

              {/* Coupon / Promo Code Field */}
              <div className="p-3.5 rounded-control bg-bg border border-border space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-fg">
                  <Tag className="w-3.5 h-3.5 text-violet-600" />
                  <span>Promo Code or Coupon</span>
                </div>

                {appliedCoupon ? (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{appliedCoupon.code} APPLIED</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Saved ₹{discountAmount.toLocaleString()} ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`})
                      </p>
                    </div>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. LAUNCH20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 ui-input text-xs font-mono py-1.5 px-3 uppercase"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCode.trim()}
                        className="ui-button-secondary text-xs py-1.5 px-3 font-bold disabled:opacity-50 flex items-center gap-1"
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

              {/* Lightning Credits Redemption Section */}
              {availableCredits > 0 && (
                <div className="p-3.5 rounded-control bg-gradient-to-r from-violet-50/70 via-indigo-50/40 to-cyan-50/70 border border-violet-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-fg">
                      <Zap className="w-3.5 h-3.5 text-violet-600 fill-current" />
                      <span>⚡ Redeem Lightning Credits</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-violet-700 bg-violet-100/80 px-2 py-0.5 rounded-full border border-violet-200">
                      Balance: ₹{availableCredits.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-fg">
                      <input
                        type="checkbox"
                        checked={useCredits}
                        onChange={(e) => setUseCredits(e.target.checked)}
                        className="rounded text-violet-600 focus:ring-violet-500"
                      />
                      <span>Apply ₹{maxUsableCredits.toLocaleString()} Credits toward this order</span>
                    </label>
                    {useCredits && (
                      <span className="text-xs font-mono font-extrabold text-emerald-700">
                        -₹{appliedCredits.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted font-mono">
                    Lightning Credits discount applied directly to your purchase total.
                  </p>
                </div>
              )}

              {/* Order Breakdown */}
              <div className="space-y-2 font-mono text-xs text-muted border-t border-border pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{plan.priceInr.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                {appliedCredits > 0 && (
                  <div className="flex justify-between text-violet-700 font-bold">
                    <span>Lightning Credits Redeemed</span>
                    <span>-₹{appliedCredits.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Processing & Gateway Fee</span>
                  <span className="text-emerald-600">FREE</span>
                </div>

                {/* Reward Earn Teaser */}
                <div className="p-2.5 rounded bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs font-mono text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Reward on this order:</span>
                  </div>
                  <span className="font-extrabold text-emerald-700">
                    +₹{estimatedEarnedCredits.toLocaleString()} Credits
                  </span>
                </div>

                <div className="flex justify-between text-fg font-bold text-sm pt-2 border-t border-border">
                  <span>Total Payable</span>
                  <span className="text-violet-700">₹{totalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-2">
                <button
                  onClick={handleInitiatePayment}
                  className="w-full py-3.5 rounded-control bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {totalPayable === 0
                      ? 'COMPLETE ORDER (₹0 — FULLY COVERED BY CREDITS)'
                      : `PAY ₹${totalPayable.toLocaleString()} — PROCEED TO PAYMENT`}
                  </span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-muted font-mono pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="hover:text-fg underline transition-colors cursor-pointer"
                  >
                    ← Cancel & Close
                  </button>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Supports UPI, Cards & Net Banking</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {paymentState === 'PROCESSING' && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-fg">Initializing Secure Checkout...</h3>
              <p className="text-xs text-muted font-mono">Connecting to secure payment gateway...</p>
            </div>
          )}

          {paymentState === 'PENDING' && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-fg">Your payment is being verified</h3>
              <p className="text-xs text-muted font-mono leading-relaxed">
                Please do not close or refresh this page. Confirming transaction and activating API key...
              </p>
            </div>
          )}

          {paymentState === 'SUCCESSFUL' && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-fg">Payment Successful!</h3>
              <p className="text-xs text-muted font-mono">Activating your {plan.name} subscription...</p>
            </div>
          )}

          {paymentState === 'FAILED' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-fg">Payment Could Not Be Completed</h3>
              <p className="text-xs text-rose-600 font-mono bg-rose-50 p-3 rounded border border-rose-200">
                {errorMessage || 'Payment could not be completed.'}
              </p>
              <button
                onClick={() => setPaymentState('IDLE')}
                className="ui-button-secondary text-xs py-2 px-4 font-bold mx-auto"
              >
                Try Again
              </button>
            </div>
          )}

          {paymentState === 'VERIFICATION_FAILED' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-fg">Payment Verification Failed</h3>
              <p className="text-xs text-amber-800 font-mono bg-amber-50 p-3 rounded border border-amber-200 leading-relaxed">
                We couldn't verify the payment automatically. Please contact support if your account was charged.
              </p>
              <a
                href="https://wa.me/917695956938?text=Hi%20LightningDeals%20Support!%20My%20payment%20needs%20manual%20verification."
                target="_blank"
                rel="noopener noreferrer"
                className="ui-button-primary text-xs py-2 px-4 font-bold inline-flex items-center gap-2"
              >
                <span>Contact Support on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Legal Links & Agreement Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-bg/50 text-[10px] text-muted space-y-1.5 font-mono shrink-0">
          <p className="text-center text-muted">
            By completing your purchase, you agree to our{' '}
            <a href="/terms-and-conditions" target="_blank" className="text-violet-600 underline font-bold">
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a href="/refund-policy" target="_blank" className="text-violet-600 underline font-bold">
              Refund Policy
            </a>
            . Access our{' '}
            <a href="/privacy-policy" target="_blank" className="text-violet-600 underline font-bold">
              Privacy Policy
            </a>
            .
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>256-bit SSL Encrypted</span>
            </div>
            <div className="flex gap-2">
              <a href="/terms-and-conditions" target="_blank" className="hover:text-fg underline">Terms</a>
              <span>•</span>
              <a href="/privacy-policy" target="_blank" className="hover:text-fg underline">Privacy</a>
              <span>•</span>
              <a href="/refund-policy" target="_blank" className="hover:text-fg underline">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Render Key Revealed Modal upon successful verification */}
      {revealedKey && (
        <ApiKeyRevealModal
          isOpen={!!revealedKey}
          apiKey={revealedKey}
          planName={plan.name}
          quotaDisplay={plan.tokenDisplay}
          windowHours={plan.windowHours}
          onClose={() => {
            setRevealedKey(null);
            onClose();
            navigate('/dashboard/plan');
          }}
        />
      )}
    </div>
  );
};
