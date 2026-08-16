import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { RefreshCw, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, FileText, HelpCircle } from 'lucide-react';

export const RefundPage: React.FC = () => {
  const lastUpdatedDate = "August 16, 2026";

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1 py-12 px-5 sm:px-6">
        <div className="max-w-reading mx-auto space-y-10 bg-card border border-border p-8 sm:p-12 rounded-panel shadow-sm">
          
          {/* Header */}
          <div className="border-b border-border pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> REFUND & CANCELLATION
              </span>
              <span className="text-xs font-mono text-muted">Effective Date: {lastUpdatedDate}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">Refund & Cancellation Policy</h1>
            <p className="text-xs text-muted leading-relaxed font-mono">
              Clear, Fair, and Transparent Refund Rules for Lightning Deals Digital Subscriptions and Token Packages.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-sm text-muted leading-relaxed font-sans">
            
            {/* Overview */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                <span>1. Digital Product Delivery & Policy Overview</span>
              </h2>
              <p>
                Lightning Deals provides digital products, software access passes, and Claude Max API token subscriptions (`ld_live_...`). Because digital access credentials and server bandwidth allocations are delivered electronically immediately after successful payment verification, refund eligibility depends on delivery status and token usage.
              </p>
            </section>

            {/* Qualifying Refund Conditions */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>2. Qualifying Refund Conditions</span>
              </h2>
              <p>You are eligible for a full refund or replacement under the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono">
                <li><strong>Technical Non-Delivery:</strong> Your payment was successfully captured, but an API key or access pass was not provisioned due to a technical server error.</li>
                <li><strong>Defective Credentials:</strong> An assigned key fails to authenticate or connect upon initial setup due to a system gateway issue.</li>
                <li><strong>Duplicate Billing:</strong> You were accidentally charged multiple times for the same order reference.</li>
                <li><strong>Persistent Outage:</strong> Severe technical gateway failure on our platform prevents delivery of services for more than 48 consecutive hours.</li>
              </ul>
            </section>

            {/* Non-Refundable Conditions */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>3. Non-Refundable Situations</span>
              </h2>
              <p>Refunds will NOT be granted in the following scenarios:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Substantial Usage:</strong> The API key has already been activated and significant token quota has been consumed.</li>
                <li><strong>Change of Mind:</strong> Customer requests a refund due to personal preference after successful credential delivery and usage.</li>
                <li><strong>Account Termination for Misconduct:</strong> Service access was suspended or terminated due to prohibited activity, key reselling, or rate-limit abuse.</li>
                <li><strong>Third-Party Model Behavior:</strong> Customer expresses dissatisfaction with standard AI model responses or non-gateway upstream behavior.</li>
              </ul>
            </section>

            {/* Claude Max Specific Handling */}
            <section className="space-y-3 bg-bg border border-border p-5 rounded-panel">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-600" />
                <span>4. Claude Max Subscription Refund Rules</span>
              </h2>
              <div className="space-y-2 text-xs font-mono">
                <p><strong className="text-emerald-600">Full Refund / Re-issue:</strong> Payment successful but key delivery failed, invalid key, or duplicate charge.</p>
                <p><strong className="text-rose-600">Non-Refundable:</strong> Plan activated, credentials delivered, and significant quota consumed on PRO (5M/5h), MAX (20M/5h), or ULTRA (40M/5h).</p>
                <p><strong className="text-violet-600">Free Trial:</strong> Free trial claims carry ₹0 cost and are non-financial.</p>
              </div>
            </section>

            {/* Refund Process */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <span>5. Refund Request & Processing Workflow</span>
              </h2>
              <p>To request a refund:</p>
              <ol className="list-decimal pl-5 space-y-2 text-xs font-mono">
                <li>Submit a support ticket in your Customer Portal or email <a href="mailto:support@lightningdeals.in" className="text-violet-600 underline font-bold">support@lightningdeals.in</a>.</li>
                <li>Provide your <strong>Order ID</strong> (e.g., `ORD_...` or Cashfree transaction reference) and registered email address.</li>
                <li>Our team will inspect transaction records and key token consumption metrics within 24 hours.</li>
                <li>If approved, refunds are initiated directly to your original payment method via Cashfree Payments. Refund crediting timing depends on your bank (typically 3–7 business days).</li>
              </ol>
            </section>

            {/* Anti-Abuse Provisions */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>6. Protection Against Refund Abuse</span>
              </h2>
              <p className="text-xs leading-relaxed">
                Lightning Deals reserves the right to deny refund requests from accounts exhibiting patterns of repeated purchase-and-refund requests, fraudulent chargeback attempts after full quota usage, or false delivery non-delivery claims.
              </p>
            </section>

            {/* Contact Information */}
            <section className="space-y-3 border-t border-border pt-6">
              <h2 className="text-base font-bold text-fg flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <span>7. Contact Refund Desk</span>
              </h2>
              <div className="p-4 bg-bg border border-border rounded-control font-mono text-xs space-y-1">
                <p className="font-bold text-fg">Support & Refund Email: <a href="mailto:support@lightningdeals.in" className="text-violet-600 underline">support@lightningdeals.in</a></p>
                <p className="text-muted">WhatsApp Support: +91 7695956938</p>
              </div>
            </section>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPage;
