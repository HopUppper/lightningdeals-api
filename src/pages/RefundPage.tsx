import React from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ElectricNavbar } from '../components/ElectricNavbar';
import { ElectricFooter } from '../components/ElectricFooter';

export const RefundPage: React.FC = () => {
  const lastUpdatedDate = 'October 10, 2026';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col font-sans selection:bg-[#6d28d9]/10 selection:text-[#6d28d9]">
      <ElectricNavbar />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10 bg-white border border-[#e7e5e4] p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-3xl shadow-warm">
          
          {/* Header */}
          <div className="border-b border-[#e7e5e4] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                REFUND &amp; CANCELLATION
              </span>
              <span className="text-xs font-mono text-[#78716c]">Effective Date: {lastUpdatedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1c1917] tracking-tight">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
              Clear, Fair, and Transparent Commercial Rules for LightningAPI.pro Digital Subscriptions and Token Packages.
            </p>
          </div>

          {/* Quick Summary Pill Box */}
          <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] text-xs text-[#57534e] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1c1917]">
              <Clock className="w-4 h-4 text-[#6d28d9]" />
              <span>Summary: Instant Digital Delivery &amp; Fair Protection</span>
            </div>
            <p className="leading-relaxed">
              Capacity plans are delivered electronically within 60 seconds of checkout. In cases of technical delivery failure, invalid keys, or duplicate billing, we provide 100% full refunds within 3–7 business days. Plans where significant token quota has already been consumed are non-refundable.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-xs sm:text-sm text-[#57534e] leading-relaxed">
            
            {/* 1. Digital Product Delivery */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6d28d9]" />
                <span>1. Digital Product Delivery &amp; Nature of Service</span>
              </h2>
              <p>
                LightningAPI.pro provides digital compute allocations and API key credentials (<code className="font-mono text-[#1c1917]">ld_live_...</code>). Because digital compute credentials and proxy network capacity are reserved and provisioned immediately upon transaction confirmation, our refund evaluation is tied to key delivery verification and token consumption records.
              </p>
            </section>

            {/* 2. Qualifying Refund Conditions */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>2. Qualifying Conditions for Full Refund</span>
              </h2>
              <p>Customers are eligible for a complete refund or replacement under any of the following verified conditions:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-[#57534e]">
                <li><strong className="text-[#1c1917]">Technical Non-Delivery:</strong> Your payment was successfully captured, but the gateway failed to generate or deliver your API key within 30 minutes due to an internal server issue.</li>
                <li><strong className="text-[#1c1917]">Defective Credentials:</strong> An assigned key fails authentication on initial connection due to a database provisioning anomaly and cannot be remedied by our team within 12 hours.</li>
                <li><strong className="text-[#1c1917]">Duplicate Billing:</strong> You were charged multiple times for the same order reference due to a payment gateway timeout or double submission.</li>
                <li><strong className="text-[#1c1917]">Persistent Outage:</strong> Severe technical gateway failure on our platform prevents delivery of services for more than 48 consecutive hours during your plan's active window.</li>
              </ul>
            </section>

            {/* 3. Non-Refundable Scenarios */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>3. Non-Refundable Scenarios</span>
              </h2>
              <p>Refunds cannot be issued under the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-[#57534e]">
                <li><strong className="text-[#1c1917]">Substantial Usage:</strong> Your API key has been activated and significant token quota has already been consumed through model queries.</li>
                <li><strong className="text-[#1c1917]">Change of Mind:</strong> A refund request submitted simply due to personal preference after successful key delivery and usage.</li>
                <li><strong className="text-[#1c1917]">Suspension for Misconduct:</strong> Account access was revoked due to violations of our Terms of Service (e.g. rate-limit abuse, credential reselling, or DDoS attacks).</li>
                <li><strong className="text-[#1c1917]">Upstream Provider AI Behavior:</strong> Dissatisfaction with inherent AI model reasoning style, refusal guardrails, or standard probabilistic model answers.</li>
              </ul>
            </section>

            {/* 4. Plan Tiers & Free Trial Policy */}
            <section className="space-y-3 bg-[#faf8f5] p-5 rounded-2xl border border-[#e7e5e4]">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#6d28d9]" />
                <span>4. Plan Tiers &amp; Free Trial Policy</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-white rounded-lg border border-[#e7e5e4]">
                  <p className="font-bold text-[#6d28d9]">Production Plans (PRO, MAX, ULTRA)</p>
                  <p className="text-[#57534e]">Full refund for non-delivery or duplicate charge. Non-refundable after active quota utilization.</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e7e5e4]">
                  <p className="font-bold text-emerald-700">Free 1M Trial Pass</p>
                  <p className="text-[#57534e]">₹0 cost complimentary allocation. Non-financial with no payment required.</p>
                </div>
              </div>
            </section>

            {/* 5. Refund Request Workflow */}
            <section className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#6d28d9]" />
                <span>5. Refund Request Workflow &amp; Banking Timeline</span>
              </h2>
              <p>To submit a refund claim:</p>
              <ol className="list-decimal pl-5 space-y-2 text-xs text-[#57534e]">
                <li>Email <a href="mailto:support@lightningapi.pro" className="text-[#6d28d9] underline font-bold">support@lightningapi.pro</a> or open a ticket from your Customer Dashboard within <strong>48 hours</strong> of the billing event.</li>
                <li>Include your <strong>Order ID</strong> (or payment transaction reference) and registered account email address.</li>
                <li>Our billing team will review system delivery logs and token consumption telemetry within <strong>24 business hours</strong>.</li>
                <li>Upon approval, refunds are issued directly to your original payment method. Banking settlement typically credits within <strong>3–7 business days</strong> depending on your financial institution.</li>
              </ol>
            </section>

            {/* Support Desk */}
            <section className="space-y-3 border-t border-[#e7e5e4] pt-6">
              <h2 className="text-sm sm:text-base font-bold text-[#1c1917] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#6d28d9]" />
                <span>Assistance &amp; Billing Desk</span>
              </h2>
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e5e4] text-xs font-mono space-y-1 text-[#57534e]">
                <p><strong>Official Support Email:</strong> <a href="mailto:support@lightningapi.pro" className="text-[#6d28d9] underline">support@lightningapi.pro</a></p>
                <p><strong>Response Time Commitment:</strong> Billing inquiries reviewed within 24 hours.</p>
              </div>
            </section>

          </div>

        </div>
      </main>

      <ElectricFooter />
    </div>
  );
};

export default RefundPage;
