import React from 'react';
import {
  Layers,
  Clock,
  CreditCard,
  Zap,
  Activity,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export const DocsSectionF: React.FC = () => {
  return (
    <section id="sec-usage-billing" className="scroll-mt-24 space-y-8 pt-4">
      <div className="border-b border-[#ede8e1] pb-3">
        <span className="text-xs font-bold text-violet-700 uppercase tracking-widest font-mono">
          Section F
        </span>
        <h2 className="text-2xl font-bold text-[#1c1917] tracking-tight">
          Usage, Billing &amp; Quotas
        </h2>
      </div>

      {/* F1: Six Billing Architectures */}
      <article
        id="billing-architectures"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-600" />
          <span>1. The Six Billing Architectures Explained</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI routes all requests through immutable ledger accounting. Depending on your purchase, your key operates under one of these models:
        </p>
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="font-bold text-[#1c1917]">1. Claude Max (5-Hour Rolling Window):</span>
            <span className="text-[#64607d] ml-1">Tokens continuously replenish every minute as older usage rolls past the 5-hour boundary.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="font-bold text-[#1c1917]">2. OpenAI (5-Hour Rolling Window):</span>
            <span className="text-[#64607d] ml-1">Rolling window access dedicated to OpenAI Frontier workloads.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="font-bold text-[#1c1917]">3. Prepaid Credit Wallet:</span>
            <span className="text-[#64607d] ml-1">USD balance valid for 365 days across all models. Top up anytime.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="font-bold text-[#1c1917]">4. Claude Consumable Token Packs:</span>
            <span className="text-[#64607d] ml-1">10M, 50M, 100M token blocks for Claude Frontier models.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="font-bold text-[#1c1917]">5. OpenAI Consumable Token Packs:</span>
            <span className="text-[#64607d] ml-1">Bulk token blocks dedicated to GPT-4o and reasoning models.</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#ede8e1]">
            <span className="font-bold text-[#1c1917]">6. Open-Weights Token Packs:</span>
            <span className="text-[#64607d] ml-1">Cost-efficient token blocks for DeepSeek, Qwen, and Grok.</span>
          </div>
        </div>
      </article>

      {/* F2: 5-Hour Rolling Windows */}
      <article
        id="billing-rolling-window"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          <span>2. 5-Hour Rolling Windows: Continuous Replenishment</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Unlike traditional monthly subscriptions that cut off access when exhausted, a 5-hour rolling plan evaluates your usage over a moving 300-minute window. As each minute ticks forward, tokens consumed exactly 5 hours ago roll off your tally and become available again immediately.
        </p>
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 space-y-1.5">
          <div className="font-bold text-sm">Example: Continuous Refill in Action</div>
          <p className="leading-relaxed">
            If you consume 50,000 tokens at 10:00 AM, that exact 50,000-token capacity automatically returns to your available allowance at 3:00 PM without requiring any action or subscription reset.
          </p>
        </div>
      </article>

      {/* F3: Prepaid Credit Wallet */}
      <article
        id="billing-credits"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <span>3. Prepaid Credit Wallet: Pay-As-You-Go</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          The Prepaid Credit Wallet provides maximum flexibility:
        </p>
        <ul className="list-disc list-inside text-xs text-[#44403c] space-y-1.5 leading-relaxed">
          <li><strong>Universal Model Access:</strong> Use your credits across Claude, OpenAI, Gemini, and DeepSeek with no restrictions.</li>
          <li><strong>365-Day Balance Validity:</strong> Unused credits roll over and remain valid for a full calendar year.</li>
          <li><strong>Zero Overages:</strong> Requests stop safely if your balance reaches $0.00; you will never receive an unexpected bill.</li>
        </ul>
      </article>

      {/* F4: Consumable Token Packs */}
      <article
        id="billing-tokens"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <span>4. Consumable Token Packs for Burst &amp; Agent Workloads</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Purchased in fixed allotments (10M, 50M, 100M tokens) with zero rolling window rate caps. Ideal for batch data extraction, CI/CD code verification pipelines, and high-concurrency multi-agent swarms.
        </p>
      </article>

      {/* F5: Dashboard Telemetry */}
      <article
        id="billing-dashboard"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-600" />
          <span>5. Dashboard Telemetry &amp; Real-Time Analytics</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Monitor your API traffic in real-time at <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">/dashboard/usage</code>. Review token consumption per model, average latency graphs, and per-request settlement logs.
        </p>
      </article>

      {/* F6: Validity & Expiry Rules */}
      <article
        id="billing-expiry"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>6. Validity, Renewal Cycles &amp; Expiry Rules</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          Subscriptions renew automatically every 30 days unless canceled in the Customer Dashboard. If canceled, your active key retains its rolling quota until the end of the current billing period.
        </p>
      </article>

      {/* F7: Fair Billing Guarantee */}
      <article
        id="billing-guarantee"
        className="scroll-mt-24 bg-white p-6 rounded-3xl border border-[#ede8e1] shadow-2xs space-y-4"
      >
        <h3 className="text-lg font-bold text-[#1c1917] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>7. Fair Billing Guarantee</span>
        </h3>
        <p className="text-sm text-[#44403c] leading-relaxed">
          LightningAPI enforces strict transactional fairness:
        </p>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
          <div className="font-bold">Zero Charges on Upstream Failures</div>
          <p className="leading-relaxed">
            If an API request terminates with HTTP 500, 502, 503, 504, or if the client drops the TCP connection before receiving the first token chunk, zero tokens and zero credits are billed.
          </p>
        </div>
      </article>
    </section>
  );
};
