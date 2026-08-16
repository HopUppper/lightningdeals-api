import React, { useState } from 'react';
import { Cpu, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDCard } from './ThreeDCard';

export const ModelCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'flagship' | 'fast'>('all');

  const catalog = [
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      family: 'Claude 5 Generation',
      category: 'flagship',
      description: 'Premier heavy-lifting flagship for complex agentic coding and deep enterprise architecture tasks with adaptive thinking.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Premier Flagship',
    },
    {
      id: 'claude-fable-5',
      name: 'Claude Fable 5',
      family: 'Claude 5 Generation',
      category: 'flagship',
      description: 'Elite Mythos-class intelligence model optimized for long-running, complex multi-step workflows and agentic loops.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Mythos Class',
    },
    {
      id: 'claude-sonnet-5',
      name: 'Claude Sonnet 5',
      family: 'Claude 5 Generation',
      category: 'flagship',
      description: 'Default everyday balance of speed and high-end intelligence for active software development.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Everyday Flagship',
    },
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      family: 'Claude Generation',
      category: 'fast',
      description: 'Fastest budget model optimized for high-volume, lightweight tasks, automated linting, and quick edits.',
      contextWindow: '500,000 Tokens (500K)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Ultra Fast Budget',
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet',
      family: 'Claude Generation',
      category: 'flagship',
      description: 'Hybrid reasoning model featuring extended thinking mode for complex engineering tasks.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Extended Thinking',
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      family: 'Claude Generation',
      category: 'flagship',
      description: 'Primary workhorse model for high-confidence software engineering and Claude Code CLI.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Workhorse',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      family: 'Claude Generation',
      category: 'fast',
      description: 'Lightweight high-speed model for automated completions and fast response loops.',
      contextWindow: '500,000 Tokens (500K)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Fast Response',
    },
  ];

  const filteredModels = catalog.filter((m) => activeTab === 'all' || m.category === activeTab);

  return (
    <section id="models" className="py-16 sm:py-24 border-b border-border bg-card/30">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 inline-flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Latest Model Lineup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              The Entire Latest Claude Model Generation
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Featuring <strong>Claude Opus 5</strong>, <strong>Claude Fable 5</strong>, <strong>Claude Sonnet 5</strong>, <strong>Claude Haiku 4.5</strong>... and many more.
            </p>
          </div>

          {/* Filter Pill Tabs */}
          <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-control shadow-xs font-mono text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded transition-all ${
                activeTab === 'all' ? 'bg-fg text-bg shadow-xs font-bold' : 'text-muted hover:text-fg'
              }`}
            >
              All Models ({catalog.length}+)
            </button>
            <button
              onClick={() => setActiveTab('flagship')}
              className={`px-3.5 py-1.5 rounded transition-all ${
                activeTab === 'flagship' ? 'bg-fg text-bg shadow-xs font-bold' : 'text-muted hover:text-fg'
              }`}
            >
              Flagship Reasoning
            </button>
            <button
              onClick={() => setActiveTab('fast')}
              className={`px-3.5 py-1.5 rounded transition-all ${
                activeTab === 'fast' ? 'bg-fg text-bg shadow-xs font-bold' : 'text-muted hover:text-fg'
              }`}
            >
              High Speed
            </button>
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredModels.map((model) => (
              <motion.div
                key={model.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ThreeDCard intensity={8} className="h-full">
                  <div className="glass-3d-card relative rounded-panel p-6 border border-border bg-white flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                          {model.family}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-fg bg-subtle px-2 py-0.5 rounded border border-border">
                          {model.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-fg tracking-tight">{model.name}</h3>
                        <p className="text-xs font-mono text-muted mt-0.5">{model.id}</p>
                      </div>

                      <p className="text-xs text-muted leading-relaxed min-h-[40px]">{model.description}</p>
                    </div>

                    <div className="pt-4 border-t border-border space-y-2 font-mono text-xs text-muted">
                      <div className="flex justify-between">
                        <span>Context Window</span>
                        <span className="font-bold text-fg">{model.contextWindow}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Protocol</span>
                        <span className="text-emerald-600 font-semibold">{model.protocol}</span>
                      </div>
                    </div>
                  </div>
                </ThreeDCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* AND MANY MORE CARD / BANNER */}
        <div className="p-6 sm:p-8 rounded-panel bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-cyan-500/10 border border-violet-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-violet-600 text-white shadow-md">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-fg">...and Many More Top Models Supported!</h3>
              <p className="text-xs text-muted mt-0.5">
                New models are automatically provisioned and routed seamlessly through your single API endpoint.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/917695956938?text=Hi%20LightningDeals!%20I%20want%20to%20inquire%20about%20the%20latest%20Claude%20models."
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-control bg-fg text-bg hover:bg-fg/90 font-bold text-xs font-mono shrink-0 shadow-sm"
          >
            Inquire Model Support →
          </a>
        </div>
      </div>
    </section>
  );
};
