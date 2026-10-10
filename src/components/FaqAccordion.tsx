import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FaqAccordion: React.FC = () => {
  const faqs = [
    {
      question: 'What is LightningAPI in simple terms?',
      answer: 'LightningAPI is a unified, high-speed API gateway for the latest Claude model family (including Claude Opus 5.5, Sonnet 5.5, Fable 5, and Haiku 5.5). Instead of maintaining separate accounts or worrying about surprise monthly overage bills, you use a single master key that connects directly to Claude Code CLI, Cursor, Windsurf, or your custom applications.',
    },
    {
      question: 'How does the 5-hour rolling token quota work?',
      answer: 'Every plan allocates a token balance over a continuous 5-hour rolling window. As you code and prompt, usage draws from this allowance. Past usage automatically expires out of the calculation as it passes the 5-hour mark, replenishing your balance throughout the day so you never get locked out mid-project.',
    },
    {
      question: 'How easy is the setup? Do I need complex configuration?',
      answer: 'Setup takes under 60 seconds. You can run our verified helper utility `npx lightningdeals` in your terminal to automatically configure Claude Code, Cursor, and Windsurf. If you use Python or TypeScript, simply set `base_url="https://lightningapi.pro/v1"` in your official Anthropic client.',
    },
    {
      question: 'Is my data and source code kept strictly private?',
      answer: 'Yes, 100%. LightningAPI operates as a zero-retention passthrough proxy. Your prompts, source code files, and model completions stream token-by-token directly to your client without disk persistence, database logging, or training data sharing.',
    },
    {
      question: 'How can I try the platform before buying?',
      answer: 'You can claim a free 1-Day Trial pass containing 1,000,000 tokens directly on our trial page. No credit card or upfront billing information is required.',
    },
    {
      question: 'Which models are supported through the gateway?',
      answer: 'The gateway supports the Top 10 latest Claude models including Claude Opus 5.5, Claude Sonnet 5.5, Claude Opus 5, Claude Sonnet 5, Claude Fable 5, Claude Fable 5 Flash, Claude Opus 5 Extended Thinking, Claude Sonnet 5 Extended Thinking, Claude Haiku 5.5, and Claude Haiku 5—all via standard Anthropic /v1/messages endpoints.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="border-b border-[#e5e7eb] bg-white py-16 lg:py-24 font-sans" aria-labelledby="faq-title">
      <div className="mx-auto max-w-page px-4 sm:px-6 space-y-12">
        
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
            Questions & Answers
          </div>
          <h2 id="faq-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111827]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
            Everything you need to know about token windows, tool setup, privacy standards, and models.
          </p>
        </div>

        <div className="max-w-3xl divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between text-left transition-colors cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-[#111827] group-hover:text-[#1e40af] transition-colors pr-4">
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <p className="pt-3 text-sm text-[#4b5563] leading-relaxed pr-6">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
