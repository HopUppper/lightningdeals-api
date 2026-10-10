import React, { useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrustAndFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does the 5-hour rolling token renewal work in practice?',
      answer: 'Rather than cutting off your access with hard monthly walls or invoicing unexpected per-token overages, your token allowance operates on a continuous 5-hour rolling cycle. Tokens consumed earlier in the day automatically reload as they age out of the 5-hour window, providing consistent, dependable throughput every single day of your 30-day term.',
    },
    {
      question: 'Does LightningAPI work natively with Claude Code CLI and Cursor?',
      answer: 'Yes. LightningAPI strictly mirrors official Anthropic protocol specifications (/v1/messages). Native features—including token-by-token streaming, multi-file code editing, tool execution, and extended reasoning—work out of the box with zero SDK code modifications.',
    },
    {
      question: 'Do you inspect, log, or train on my prompt contents?',
      answer: 'No. LightningAPI enforces a strict Zero Prompt Retention SLA. Prompt data passes through transient memory in-stream and is routed directly to authoritative model providers over encrypted TLS 1.3. We maintain zero disk logs, zero database storage of prompt contents, and zero data sharing for AI training.',
    },
    {
      question: 'How quickly is my API key delivered after checkout?',
      answer: 'Instantly. Once your prepaid order is confirmed via UPI, Card, Net Banking, or Credits, your master key is immediately revealed on screen with 1-click terminal setup commands and stored in your private customer dashboard.',
    },
    {
      question: 'What happens if my 5-hour quota is exhausted during intensive coding?',
      answer: 'Your key pauses new requests until older tokens exit the 5-hour window. If your daily workflow expands, you can easily top up, upgrade your allocation tier, or stack allocations with no loss of unused term days.',
    },
    {
      question: 'How do I claim and evaluate the 1,000,000 token trial pass?',
      answer: 'Simply create a free account. Your 1,000,000 token trial pass is automatically generated and ready to test with Claude Code, Cursor, or your custom applications. No credit card or billing commitment is required.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-[#fbf9f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Governance & Privacy SLA Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#e7e5e4] space-y-4 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-xs font-medium text-[#047857]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Institutional Governance SLA</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
            Zero prompt retention. Complete data confidentiality.
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs text-[#57534e]">
            <div className="space-y-1">
              <strong className="text-[#1c1917] block">Transient In-Stream Transit</strong>
              <p className="leading-relaxed text-[#78716c]">
                All prompt payloads pass directly through volatile memory over TLS 1.3 with zero intermediate disk persistence.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-[#1c1917] block">No Content Logging</strong>
              <p className="leading-relaxed text-[#78716c]">
                We track token counts exclusively for rolling quota accounting. Prompts, completions, and code files are never logged.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-[#1c1917] block">No Machine Learning Training</strong>
              <p className="leading-relaxed text-[#78716c]">
                Customer requests are never used to train, evaluate, or tune machine learning models.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
            Frequently Answered
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
            Answers to common questions.
          </h2>
          <p className="text-sm sm:text-base text-[#57534e]">
            Everything you need to know about quotas, rolling renewal, privacy, and IDE integration.
          </p>
        </div>

        {/* Editorial Accordion */}
        <div className="divide-y divide-[#e7e5e4] border-y border-[#e7e5e4]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="py-5">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between text-left gap-4 cursor-pointer group"
                >
                  <span className="text-sm sm:text-base font-semibold text-[#1c1917] group-hover:text-[#6d28d9] transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#78716c] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#6d28d9]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pt-3 pr-6 text-xs sm:text-sm text-[#57534e] leading-relaxed animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
