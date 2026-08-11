import React from 'react';
import { Wallet, RefreshCw, Search, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const WhyChooseUs: React.FC = () => {
  const benefits = [
    {
      num: '01',
      title: 'Permanent Prepaid Token Balance',
      desc: 'Pay per token allowance without monthly subscriptions, recurring seats, or expiring credits.',
      icon: Wallet,
    },
    {
      num: '02',
      title: 'Drop-in Anthropic /v1 Endpoint',
      desc: 'Identical request/response payload shape for Claude Code CLI, Cursor, Windsurf, and VS Code.',
      icon: RefreshCw,
    },
    {
      num: '03',
      title: 'Built-in Web Search & Vision Tools',
      desc: 'Native web search and image understanding tools supported natively out of the box.',
      icon: Search,
    },
    {
      num: '04',
      title: 'Full 13-Model Catalog Access',
      desc: 'Seamlessly switch between Claude Fable 5, Sonnet 5, Sonnet 3.5, Opus 3, and Haiku 3.5.',
      icon: Layers,
    },
  ];

  return (
    <section id="why-us" className="border-b border-border bg-bg py-16 sm:py-24 relative overflow-hidden" aria-labelledby="why-us-title">
      <div className="mx-auto max-w-page px-5 sm:px-6 space-y-12 relative z-10">
        
        {/* Header */}
        <div className="max-w-xl space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Why LightningDeals
          </span>
          <h2 id="why-us-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Built for developers who demand reliability.
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            High-performance API infrastructure designed for speed, clarity, and zero lock-in.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => {
            const IconComp = b.icon;
            return (
              <motion.article
                key={b.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white border border-border p-6 rounded-panel space-y-3 hover:border-amber-500/60 transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-muted">{b.num}</span>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
                    <IconComp className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-fg group-hover:text-amber-600 transition-colors">{b.title}</h3>
                <p className="text-xs leading-relaxed text-muted font-normal">{b.desc}</p>
              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
};
