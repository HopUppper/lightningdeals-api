import React from 'react';
import { Wallet, RefreshCw, Search, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThreeDCard } from './ThreeDCard';

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
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
            Why LightningDeals
          </span>
          <h2 id="why-us-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
            Built for developers who demand reliability.
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            High-performance API infrastructure designed for speed, clarity, and zero lock-in.
          </p>
        </div>

        {/* 4 Feature 3D Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => {
            const IconComp = b.icon;
            return (
              <motion.div
                key={b.num}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <ThreeDCard intensity={12} className="h-full">
                  <div className="glass-3d-card p-6 rounded-panel space-y-3 h-full flex flex-col justify-between group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-muted">{b.num}</span>
                        <div className="p-2 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-xs">
                          <IconComp className="h-4 w-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-fg group-hover:text-violet-600 transition-colors">{b.title}</h3>
                      <p className="text-xs leading-relaxed text-muted font-normal">{b.desc}</p>
                    </div>
                  </div>
                </ThreeDCard>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
