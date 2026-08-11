import React, { useState } from 'react';
import { Terminal, Copy, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThreeDCard } from './ThreeDCard';

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
      
      {/* Dynamic Background Light Beam */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Automated Developer Setup</span>
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            From API key to coding in seconds.
          </h2>

          <p className="text-sm text-muted leading-relaxed">
            Eliminate manual config edits. One terminal command configures all your favorite AI developer tools.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-3 bg-white border border-violet-200 px-5 py-2.5 rounded-control font-mono text-xs text-fg shadow-md hover:border-violet-500 transition-all group">
              <span className="text-violet-600 font-bold">$</span>
              <span className="font-bold text-fg animated-gradient-text">npx lightningdeals</span>
              <button
                onClick={handleCopyCmd}
                className="p-1.5 text-muted hover:text-violet-700 rounded bg-violet-50 border border-violet-200 hover:border-violet-400 transition-all"
                title="Copy setup command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3 Step Illustrated 3D Visual Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <ThreeDCard intensity={12} className="h-full">
                <div className="glass-3d-card p-6 rounded-panel space-y-4 relative h-full flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold font-mono animated-gradient-text">
                        {s.step}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                        Step {idx + 1}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-fg group-hover:text-violet-600 transition-colors">{s.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-control font-mono text-[11px] text-cyan-400 font-semibold flex items-center justify-between shadow-inner">
                    <span className="truncate">{s.code}</span>
                    <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
                  </div>
                </div>
              </ThreeDCard>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
