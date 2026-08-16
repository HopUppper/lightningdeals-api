import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Lock, AlertCircle, CheckCircle2, RefreshCw, CreditCard, ExternalLink } from 'lucide-react';
import { adminFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  if (!plan) return null;

  const handleInitiatePayment = async () => {
    if (!user) {
      navigate('/login?redirect=checkout');
      return;
    }

    setPaymentState('PROCESSING');
    setErrorMessage(null);

    // Track GA Event: Checkout Started
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'begin_checkout', {
        currency: 'INR',
        value: plan.priceInr,
        items: [{ item_id: plan.id, item_name: plan.name }],
      });
    }

    try {
      // 1. Create Server-Side Order (Zero Frontend Price Trust)
      const res = await adminFetch('/api/checkout/create-order', {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPaymentState('FAILED');
        setErrorMessage(data.error?.message || 'Failed to initialize payment order.');
        return;
      }

      const { internalOrderId, gatewayOrderId, checkoutUrl } = data.order;

      setPaymentState('PENDING');

      // Execute Cashfree Checkout or Test verification
      if (checkoutUrl && !checkoutUrl.includes('TEST_FALLBACK')) {
        // Direct to Cashfree Gateway Checkout URL
        window.location.href = checkoutUrl;
      } else {
        // Simulate/Execute Server Verification for local/staging
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
              setTimeout(() => {
                onClose();
                navigate('/dashboard/plan');
              }, 1500);
            } else {
              setPaymentState('VERIFICATION_FAILED');
              setErrorMessage(verifyData.error || 'We couldn\'t verify the payment. Please contact support.');
            }
          } catch (err: any) {
            setPaymentState('VERIFICATION_FAILED');
            setErrorMessage('Payment verification error. Contact support if charged.');
          }
        }, 1200);
      }
    } catch (err: any) {
      setPaymentState('FAILED');
      setErrorMessage(err.message || 'Network error initializing payment gateway.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-border rounded-panel w-full max-w-lg shadow-2xl overflow-hidden font-sans space-y-0 relative">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Claude Max Checkout</h2>
              <p className="text-[11px] text-muted font-mono">Secured by Cashfree Payments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-control text-muted hover:text-fg hover:bg-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content based on Payment State */}
        <div className="p-6 space-y-6">
          {paymentState === 'IDLE' && (
            <>
              {/* Plan Summary Card */}
              <div className="p-4 rounded-panel bg-violet-500/5 border border-violet-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded">
                    Selected Plan
                  </span>
                  <span className="text-xs font-mono text-muted">{plan.validityDays} Days Validity</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-fg">{plan.name}</h3>
                    <p className="text-xs text-muted font-mono mt-0.5">{plan.tokenDisplay}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold font-mono text-violet-700">
                      ₹{plan.priceInr.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted uppercase font-mono">All inclusive</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automatic {plan.windowHours}-Hour Quota Refresh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant Automated API Key Provisioning</span>
                  </div>
                </div>
              </div>

              {/* Order Breakdown */}
              <div className="space-y-2 font-mono text-xs text-muted border-t border-border pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{plan.priceInr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway Fee</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-fg font-bold text-sm pt-2 border-t border-border">
                  <span>Total Amount</span>
                  <span className="text-violet-700">₹{plan.priceInr.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleInitiatePayment}
                className="w-full py-3.5 rounded-control bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <CreditCard className="w-4 h-4" />
                <span>PAY ₹{plan.priceInr.toLocaleString()} (Cashfree Payments)</span>
              </button>
            </>
          )}

          {paymentState === 'PROCESSING' && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-fg">Initializing Secure Checkout...</h3>
              <p className="text-xs text-muted font-mono">Connecting to Cashfree Payments gateway</p>
            </div>
          )}

          {paymentState === 'PENDING' && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-fg">Your payment is being verified</h3>
              <p className="text-xs text-muted font-mono leading-relaxed">
                Please do not close or refresh this page. Confirming transaction with Cashfree Payments...
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
        <div className="p-4 border-t border-border bg-bg/50 text-[10px] text-muted space-y-2 font-mono">
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
  );
};
