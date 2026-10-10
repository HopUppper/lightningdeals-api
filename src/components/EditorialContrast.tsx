import React from 'react';
import { ArrowRight, Check, X, ShieldAlert, Sparkles, RefreshCw, Key, ShieldCheck, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditorialContrast: React.FC = () => {
  const comparisons = [
    {
      dimension: 'Billing Model',
      statusQuoTitle: 'Post-Paid Metered Overage',
      statusQuoDesc: 'Automated agentic loops or parallel tests easily generate surprise $300-$500 cloud charges at month-end.',
      lightningTitle: 'Fixed Upfront Prepaid Allocation',
      lightningDesc: 'Predictable pricing paid once. Zero credit card auto-charges, zero hidden fees, zero runaway billing risk.',
    },
    {
      dimension: 'Daily Availability',
      statusQuoTitle: 'Hard Monthly Cutoffs & Rate Lockouts',
      statusQuoDesc: 'Hitting your monthly quota on day 10 freezes your tools until the next calendar month begins.',
      lightningTitle: 'Continuous 5-Hour Rolling Replenishment',
      lightningDesc: 'Consumed tokens continuously age out and reload every 5 hours. Peak morning work never stalls afternoon output.',
    },
    {
      dimension: 'Gateway Access',
      statusQuoTitle: 'Provider Fragmentation & Multiple Keys',
      statusQuoDesc: 'Separate developer accounts, invoices, and token consoles across individual AI model providers.',
      lightningTitle: 'One Master Key for Claude Family',
      lightningDesc: 'Claude Opus 5.5, Sonnet 5.5, and Fable 5 accessible through one unified Anthropic-compatible endpoint.',
    },
    {
      dimension: 'Data Privacy',
      statusQuoTitle: 'Ambiguous Intermediate Storage',
      statusQuoDesc: 'Uncertain retention policies, token caching persistence, and third-party inspection vectors.',
      lightningTitle: 'Strict Zero Prompt Retention SLA',
      lightningDesc: 'Requests stream token-by-token directly through volatile memory. Zero disk logging, zero database storage, zero model training.',
    },
  ];

  return (
    <section id="why-lightning" className="py-16 sm:py-20 lg:py-24 bg-[#fbf9f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Open Editorial Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            The Core Difference
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.12]">
            Why creators and engineers switch to LightningAPI.
          </h2>
          <p className="text-base sm:text-lg text-[#57534e] leading-relaxed">
            Frontier AI model access without unpredictable cloud invoices, midday rate limit lockouts, or prompt logging.
          </p>
        </div>

        {/* Open Comparative Editorial Layout (No repetitive boxed card wrappers) */}
        <div className="border-t border-[#e7e5e4] pt-8 space-y-10">
          
          {/* Column Header Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 pb-4 border-b border-[#e7e5e4]">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#ea580c] font-semibold">
                01 / The Status Quo
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#1c1917]">
                Traditional Cloud API Billing
              </h3>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6d28d9] font-semibold">
                02 / The Lightning Standard
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#1c1917]">
                Predictable Flow & 5-Hour Renewal
              </h3>
            </div>
          </div>

          {/* Comparative Editorial Rows */}
          <div className="divide-y divide-[#e7e5e4]">
            {comparisons.map((item, idx) => (
              <div key={idx} className="py-7 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start">
                
                {/* Left: Status Quo */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0" />
                    <h4 className="text-sm sm:text-base font-semibold text-[#1c1917]">
                      {item.statusQuoTitle}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed pl-3.5">
                    {item.statusQuoDesc}
                  </p>
                </div>

                {/* Right: Lightning Standard */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6d28d9] shrink-0" />
                    <h4 className="text-sm sm:text-base font-semibold text-[#1c1917]">
                      {item.lightningTitle}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed pl-3.5">
                    {item.lightningDesc}
                  </p>
                </div>

              </div>
            ))}
          </div>

          {/* Open Sub-Footer Link */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#78716c] border-t border-[#e7e5e4]">
            <span>Transparent fixed billing with zero unexpected cloud overages.</span>
            <a
              href="#pricing"
              className="text-[#6d28d9] hover:text-[#581c87] font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Explore prepaid capacity plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};
