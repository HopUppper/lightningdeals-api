import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FaqAccordion: React.FC = () => {
  const faqs = [
    {
      question: 'What is LightningAPI in simple terms?',
      answer: 'LightningAPI is a unified, high-speed API gateway for premier frontier models—including Claude Opus 5.5, Claude Sonnet 5.5, OpenAI o1, GPT-4o, and DeepSeek. Instead of juggling separate accounts or worrying about surprise monthly overage bills, you use a single master key that connects directly to Claude Code CLI, Cursor, Windsurf, VS Code, or custom backend software.',
    },
    {
      question: 'What are the 3 billing architectures available?',
      answer: 'We provide 3 distinct billing modes: (1) 5-Hour Continuous Rolling Pool Refills (Claude exclusive, replenishes 5M to 100M tokens continuously every 5 hours), (2) Pay-As-You-Go Credits (deposit in INR and receive up to 7x–8.75x bonus purchasing power in USD credits, valid 365 days across all models), and (3) Prepaid Consumable Token Packs (fixed consumable token buckets that never reset every 5 hours).',
    },
    {
      question: 'How easy is the setup? Do I need complex configuration?',
      answer: 'Setup takes under 30 seconds. For Claude Code CLI, simply run `export ANTHROPIC_BASE_URL="https://lightningapi.pro"` and `export ANTHROPIC_API_KEY="ld_live_your_key"`. For Cursor or Windsurf, paste `https://lightningapi.pro` into your editor’s API Base URL setting. For Python or Node SDKs, initialize the official Anthropic or OpenAI clients with your key.',
    },
    {
      question: 'What is the base latency, and why does "xhigh" thinking take 10–12s?',
      answer: 'Base round-trip latency to our Claude clusters is 420ms to 620ms. In Claude Code CLI, if thinking mode is set to "xhigh", the model generates thousands of internal reasoning tokens (chain-of-thought) before outputting text, which takes 8–10 seconds on deep architectural proofs. For fast sub-2s responses, toggle thinking mode to normal or off in Claude Code CLI via /config, or switch to Claude Sonnet 5.5.',
    },
    {
      question: 'Is my data and source code kept strictly private?',
      answer: 'Yes, 100%. LightningAPI operates under a strict Zero Prompt Retention SLA. Your prompts, source code files, and model completions stream token-by-token directly through volatile server memory over TLS 1.3 without disk persistence, database storage of prompt bodies, or AI training on your data.',
    },
    {
      question: 'Does the model return its authentic identity when asked?',
      answer: 'Yes. When you ask "What model are you?", it reports its genuine frontier model name (e.g. Claude Opus 5.5, Claude Sonnet 5.5). Our gateway preserves authentic model identities with zero internal supplier or proxy leaks.',
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
            Questions &amp; Answers
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
