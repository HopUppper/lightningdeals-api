import React from 'react';
import { Check, X, Shield, RefreshCw, Zap, Layers } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const comparisonItems = [
    {
      feature: 'API Key Management',
      traditional: 'Separate accounts, keys, and billing cycles for every model provider',
      lightning: 'One master key providing access to the entire Claude model lineup',
    },
    {
      feature: 'Quota & Billing Model',
      traditional: 'Sudden rate limit lockouts or unexpected monthly usage overage invoices',
      lightning: 'Predictable prepaid packages with automated 5-hour rolling replenishment',
    },
    {
      feature: 'Tool Integration',
      traditional: 'Manual editing of hidden configuration files, shell exports, and paths',
      lightning: '1-command automated configuration via npx lightningdeals in 60 seconds',
    },
    {
      feature: 'Data Confidentiality',
      traditional: 'Opaque retention policies and potential training on prompt completions',
      lightning: 'Zero retention passthrough proxy; prompts stream unlogged directly to you',
    },
    {
      feature: 'Getting Started',
      traditional: 'Credit card verification required before any API access is granted',
      lightning: 'Immediate 1,000,000 token trial pass available with zero payment required',
    },
  ];

  return (
    <section id="why-us" className="border-b border-[#e5e7eb] bg-white py-16 lg:py-24 font-sans" aria-labelledby="why-us-title">
      <div className="mx-auto max-w-page px-4 sm:px-6 space-y-12">
        
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
            Comparison
          </div>
          <h2 id="why-us-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111827]">
            Built for developers and teams who value clarity.
          </h2>
          <p className="text-sm sm:text-base text-[#4b5563] leading-relaxed">
            High-performance model access without complicated cloud consoles, sudden monthly billing spikes, or setup frustration.
          </p>
        </div>

        {/* Clean Editorial Comparison Matrix */}
        <div className="border border-[#e5e7eb] rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#e5e7eb] bg-[#f8f7f4] text-xs font-semibold text-[#111827]">
            <div className="md:col-span-4 p-4 text-[#6b7280] uppercase tracking-wider">
              Capability
            </div>
            <div className="md:col-span-4 p-4 text-[#6b7280] uppercase tracking-wider border-t md:border-t-0 md:border-l border-[#e5e7eb]">
              Traditional API Providers
            </div>
            <div className="md:col-span-4 p-4 text-[#1e40af] uppercase tracking-wider border-t md:border-t-0 md:border-l border-[#e5e7eb] bg-[#eff6ff]/50">
              LightningAPI Standard
            </div>
          </div>

          <div className="divide-y divide-[#e5e7eb]">
            {comparisonItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 text-xs">
                <div className="md:col-span-4 p-4 font-semibold text-[#111827] bg-[#fbfbfa]/50">
                  {item.feature}
                </div>
                <div className="md:col-span-4 p-4 text-[#6b7280] md:border-l border-[#e5e7eb] flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">—</span>
                  <span>{item.traditional}</span>
                </div>
                <div className="md:col-span-4 p-4 text-[#111827] font-medium md:border-l border-[#e5e7eb] bg-[#eff6ff]/20 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{item.lightning}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
