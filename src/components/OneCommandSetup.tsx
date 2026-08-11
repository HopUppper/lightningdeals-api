import React, { useState } from 'react';
import { Terminal, Copy, Check, Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
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
      title: 'Install / Run CLI',
      desc: 'Execute single-command setup in terminal to automatically detect Claude Code, Cursor, and Windsurf.',
      code: 'npx lightningdeals',
    },
    {
      step: '02',
      title: 'Configure API Key',
      desc: 'Paste your active API key into the secure prompt. Config files are merged safely with automatic backups.',
      code: 'ld_live_••••••••••••••••',
    },
    {
      step: '03',
      title: 'Build & Code Immediately',
      desc: 'Start coding with Claude Code CLI, Cursor, or VS Code using sub-50ms latency routing.',
      code: 'claude --model claude-sonnet-5',
    },
  ];

  return (
    <section className="py-20 sm:py-24 border-b border-border bg-white relative overflow-hidden">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated Developer Setup</span>
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            From API key to coding in seconds.
          </h2>

          <p className="text-sm text-muted leading-relaxed">
            Eliminate manual config edits. One terminal command configures all your favorite AI developer tools.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-3 bg-bg border border-border px-5 py-2.5 rounded-control font-mono text-xs text-fg shadow-xs hover:border-amber-500/50 transition-colors">
              <span className="text-muted font-bold">$</span>
              <span className="font-bold text-fg">npx lightningdeals</span>
              <button
                onClick={handleCopyCmd}
                className="p-1.5 text-muted hover:text-fg rounded bg-white border border-border hover:border-amber-500/40 transition-all"
                title="Copy setup command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3 Step Illustrated Visual */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-bg border border-border p-6 rounded-panel space-y-4 relative hover:border-amber-500/60 transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold font-mono text-amber-500">
                  {s.step}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase text-muted bg-white px-2 py-0.5 rounded border border-border">
                  Step {idx + 1}
                </span>
              </div>
              <h3 className="text-base font-bold text-fg group-hover:text-amber-600 transition-colors">{s.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
              <div className="bg-white border border-border p-2.5 rounded font-mono text-[11px] text-fg font-semibold flex items-center justify-between">
                <span className="truncate">{s.code}</span>
                <Terminal className="w-3.5 h-3.5 text-muted shrink-0 ml-2" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
