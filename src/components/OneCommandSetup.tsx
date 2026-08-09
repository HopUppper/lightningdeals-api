import React, { useState } from 'react';
import { Terminal, Copy, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const OneCommandSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npx lightningdeals');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      step: '01',
      title: 'Get your API Key',
      description: 'Receive your LightningDeals API key upon access approval or token allocation.',
    },
    {
      step: '02',
      title: 'Run CLI Setup',
      description: 'Open your terminal and run npx lightningdeals in any directory.',
    },
    {
      step: '03',
      title: 'Enter API Key',
      description: 'Paste your key securely into the masked prompt. Your key is validated live.',
    },
    {
      step: '04',
      title: 'Select your Tools',
      description: 'Choose Claude Code, Cursor, Windsurf, VS Code, Cline, or Roo Code.',
    },
    {
      step: '05',
      title: 'Safe Configuration',
      description: 'LightningDeals creates a .backup file and merges settings without touching unrelated config.',
    },
    {
      step: '06',
      title: 'Verify & Build',
      description: 'Run npx lightningdeals doctor to verify gateway connection latency and start building.',
    },
  ];

  return (
    <section className="py-24 border-b border-border bg-card/40 relative overflow-hidden">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-14 relative z-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated Developer Onboarding</span>
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight"
          >
            From API key to ready in seconds.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-muted leading-relaxed"
          >
            Eliminate manual configuration files. The official LightningDeals CLI configures all your favorite AI developer tools in one step.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <div className="inline-flex items-center gap-3 bg-bg/90 border border-border px-5 py-2.5 rounded-control font-mono text-xs text-fg shadow-lg backdrop-blur-md hover:border-amber-500/50 transition-colors group">
              <span className="text-muted font-bold">$</span>
              <span className="font-bold text-amber-500">npx lightningdeals</span>
              <button
                onClick={handleCopyCmd}
                className="p-1.5 text-muted hover:text-fg rounded bg-card/60 border border-border/50 hover:border-amber-500/30 transition-all"
                title="Copy setup command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        </div>

        {/* 6 Step Cards Grid with Framer Motion Animation */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-card/90 border border-border p-7 rounded-panel space-y-3.5 relative hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all group backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold font-mono text-amber-500/80 group-hover:text-amber-500 transition-colors">
                  {s.step}
                </span>
                <span className="w-2 h-2 rounded-full bg-border group-hover:bg-amber-500 transition-colors" />
              </div>
              <h3 className="text-base font-bold text-fg group-hover:text-amber-400 transition-colors">{s.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
