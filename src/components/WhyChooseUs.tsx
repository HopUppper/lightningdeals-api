import React from 'react';
import { CreditCard, Layers, Key, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export const WhyChooseUs: React.FC = () => {
  const benefits = [
    {
      num: '01',
      title: '5-hour rolling window',
      desc: 'Every key receives its allowance on a rolling five-hour window. Watch it drain in real time; it resets automatically on cycle.',
      icon: CreditCard,
    },
    {
      num: '02',
      title: 'One API for all AI tools',
      desc: 'Use your LightningDeals key across Claude Code CLI, Cursor IDE, Windsurf, VS Code, Cline, and custom applications.',
      icon: Layers,
    },
    {
      num: '03',
      title: 'One-command CLI onboarding',
      desc: 'Run npx lightningdeals to automatically detect installed tools, merge environment variables safely, and verify latency.',
      icon: Key,
    },
    {
      num: '04',
      title: 'Transparent real-time tracking',
      desc: 'Track API calls, prompt tokens, output tokens, remaining rolling window balance, and request status from your dashboard without guessing.',
      icon: Eye,
    },
  ];

  return (
    <section id="why-us" className="border-b border-border bg-bg py-16 sm:py-24 relative overflow-hidden" aria-labelledby="why-us-title">
      <div className="mx-auto max-w-page px-5 sm:px-6 space-y-12 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl space-y-3"
        >
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Why LightningDeals
          </span>
          <h2 id="why-us-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg">
            A simpler way to power your AI tools.
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Keep the developer tools you love, use a 5-hour rolling window allowance, and route requests to leading model families through one unified API gateway.
          </p>
        </motion.div>

        {/* 4 Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {benefits.map((b, idx) => {
            const IconComp = b.icon;
            return (
              <motion.article
                key={b.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="bg-card/90 border border-border p-7 rounded-panel space-y-4 hover:border-amber-500/50 hover:shadow-xl shadow-md transition-all group backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-extrabold text-amber-500">{b.num}</span>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform">
                    <IconComp className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-fg group-hover:text-amber-400 transition-colors">{b.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted">{b.desc}</p>
              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
};
