import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FaqAccordion: React.FC = () => {
  const faqs = [
    {
      question: 'How does the 5-hour rolling token window work?',
      answer: 'Every key is assigned a 5-hour rolling token window. As you send API calls, token usage drains your window allowance. The window automatically resets on cycle, giving you fresh token capacity continuously.',
    },
    {
      question: 'How does the npx lightningdeals CLI work?',
      answer: 'Run npx lightningdeals in your terminal. The CLI verifies your API key, detects installed developer tools (Claude Code, Cursor, Windsurf, VS Code, Cline, Roo Code), creates .lightningdeals.backup files, and merges environment variables safely.',
    },
    {
      question: 'Do I need to install a custom SDK?',
      answer: 'No. Use standard Anthropic or OpenAI SDKs with base URL set to your LightningDeals gateway (e.g. http://localhost:3001). The gateway handles drop-in message requests seamlessly.',
    },
    {
      question: 'How are tokens counted?',
      answer: 'Token usage is recorded directly from the underlying model input and output token response metadata. Every request is recorded in your dashboard Token Ledger in real time.',
    },
    {
      question: 'How do I obtain a LightningDeals API key or Trial?',
      answer: 'To get a trial API key or full rolling window allocation, connect directly with our team on WhatsApp (+91 7695956938) or request a quote in your portal.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="border-b border-border bg-card/30 py-16 sm:py-24 relative overflow-hidden" aria-labelledby="faq-title">
      <div className="mx-auto max-w-page px-5 sm:px-6 space-y-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl space-y-3"
        >
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Frequently Asked Questions
          </span>
          <h2 id="faq-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Everything you need to know.
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Answers to common questions regarding 5-hour rolling token windows, WhatsApp key setup, CLI setup, API routing, and security controls.
          </p>
        </motion.div>

        <div className="max-w-3xl space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="rounded-panel border border-border/80 bg-bg overflow-hidden shadow-md transition-all hover:border-amber-500/40"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-fg hover:text-amber-500 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-5 w-5 text-amber-500 shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed text-muted border-t border-border/40"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
