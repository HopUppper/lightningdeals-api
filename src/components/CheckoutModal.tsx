import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Copy, Check, ArrowRight, Zap, Lock, RefreshCw } from 'lucide-react';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    displayName: string;
    tokenDisplay: string;
    windowHours: number;
    priceInr: number;
    currency: string;
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, plan }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'CONFIRM' | 'PAYING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('CONFIRM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderData, setOrderData] = useState<{
    internalOrderId: string;
    gatewayOrderId: string;
    amountInr: number;
  } | null>(null);

  const [fulfillmentData, setFulfillmentData] = useState<{
    displayKey: string;
    rawKeySecret?: string;
    tokenAllowance: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleStartCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Internal Order & Gateway Order (Zero Frontend Price Trust)
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Redirect unauthenticated customers to login
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Failed to initialize payment checkout.');
        setStep('ERROR');
        return;
      }

      setOrderData({
        internalOrderId: data.order.internalOrderId,
        gatewayOrderId: data.order.gatewayOrderId,
        amountInr: data.order.amountInr,
      });

      setStep('PAYING');
    } catch (err: any) {
      setError('Network error connecting to checkout server.');
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderData) return;
    setLoading(true);
    setStep('VERIFYING');
    setError(null);

    try {
      // 2. Execute Payment Verification & Atomic Key Provisioning
      const res = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalOrderId: orderData.internalOrderId,
          gatewayOrderId: orderData.gatewayOrderId,
          gatewayPaymentId: `test_pay_${Date.now()}`,
          gatewaySignature: `test_sig_valid_${Date.now()}`,
          payload: { amount: orderData.amountInr },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Payment verification failed.');
        setStep('ERROR');
        return;
      }

      setFulfillmentData({
        displayKey: data.fulfillment.displayKey,
        rawKeySecret: data.fulfillment.rawKeySecret,
        tokenAllowance: data.fulfillment.tokenAllowance,
      });

      setStep('SUCCESS');
    } catch (err: any) {
      setError('Network error verifying payment credentials.');
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (fulfillmentData?.rawKeySecret) {
      navigator.clipboard.writeText(fulfillmentData.rawKeySecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-panel p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-fg rounded-full hover:bg-subtle transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: CONFIRM ORDER */}
        {step === 'CONFIRM' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-mono font-bold border border-violet-200">
                <Zap className="w-3.5 h-3.5 fill-current" /> LightningDeals Checkout
              </div>
              <h2 className="text-2xl font-extrabold text-fg tracking-tight">Confirm Your Selection</h2>
              <p className="text-xs text-muted">
                Server-side verified pricing & automatic API key provisioning upon payment.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-bg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted font-medium">Selected Package</span>
                <span className="text-sm font-bold text-fg">{plan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted font-medium">Token Allocation</span>
                <span className="text-xs font-mono font-bold text-violet-600">{plan.tokenDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted font-medium">Rolling Reset Window</span>
                <span className="text-xs font-mono text-slate-700">Every {plan.windowHours} Hours</span>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-bold text-fg">Total Price</span>
                <span className="text-xl font-extrabold text-violet-600 font-mono">₹{plan.priceInr.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleStartCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Initializing Secure Order...
                </>
              ) : (
                <>
                  Proceed to Payment (₹{plan.priceInr.toLocaleString()}) <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[11px] text-muted text-center font-mono flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Independent Server-Side Order Verification
            </div>
          </div>
        )}

        {/* Step 2: PAYING */}
        {step === 'PAYING' && orderData && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-fg">Complete Online Payment</h2>
              <p className="text-xs text-muted font-mono">
                Order ID: <span className="font-bold text-violet-600">{orderData.internalOrderId}</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-violet-50/50 border border-violet-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Gateway Order:</span>
                <span className="text-xs font-mono text-slate-900 font-bold">{orderData.gatewayOrderId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Amount Due:</span>
                <span className="text-base font-extrabold text-violet-700 font-mono">₹{orderData.amountInr.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed pt-2 border-t border-violet-200/60">
                ⚡ Once payment is captured, the server will independently verify the transaction signature and generate your active production API key instantly.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-full py-3.5 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Payment Signature...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Authorize & Pay ₹{orderData.amountInr.toLocaleString()}
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-control text-xs font-semibold text-muted hover:text-fg transition-all"
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}

        {/* Step 3: VERIFYING */}
        {step === 'VERIFYING' && (
          <div className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-violet-50 text-violet-600 border border-violet-200">
                <RefreshCw className="w-10 h-10 animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-fg">Verifying Payment Server-Side...</h2>
              <p className="text-xs text-muted font-mono mt-1">
                Checking payment signature, currency matching, and provisioning entitlement...
              </p>
            </div>
          </div>
        )}

        {/* Step 4: SUCCESS */}
        {step === 'SUCCESS' && fulfillmentData && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-fg tracking-tight">Payment Verified & Plan Activated!</h2>
              <p className="text-xs text-muted font-mono mt-1">
                Your LightningDeals API key has been automatically generated and provisioned.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-bg border border-border text-left space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted font-semibold">Purchased Entitlement:</span>
                <span className="font-bold text-violet-600 font-mono">{plan.displayName}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your New Production API Key
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-control bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400">
                  <span className="flex-1 truncate">{fulfillmentData.rawKeySecret || fulfillmentData.displayKey}</span>
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all shrink-0"
                    title="Copy API Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-rose-500 font-semibold mt-1">
                  ⚠️ Save this key securely. You can also view and manage it anytime in your Customer Dashboard.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to="/dashboard/keys"
                onClick={onClose}
                className="flex-1 py-3 rounded-control bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs text-center shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Step 5: ERROR */}
        {step === 'ERROR' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200">
                <AlertCircle className="w-10 h-10" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-fg">Payment Checkout Error</h2>
              <p className="text-xs text-rose-600 font-mono mt-1">
                {error || 'An unexpected error occurred during payment processing.'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('CONFIRM')}
                className="flex-1 py-3 rounded-control bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-control bg-subtle text-fg font-bold text-xs hover:bg-border transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
