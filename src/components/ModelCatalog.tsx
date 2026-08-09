import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ModelCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'flagship' | 'fast'>('all');

  const catalog = [
    {
      id: 'claude-fable-5',
      name: 'Claude Fable 5',
      family: 'Claude Family',
      category: 'fast',
      description: 'Sub-second response completion model for instant IDE edits and real-time agentic loop execution.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'New & Fast',
    },
    {
      id: 'claude-sonnet-5',
      name: 'Claude Sonnet 5',
      family: 'Claude Family',
      category: 'flagship',
      description: 'Next-generation hybrid reasoning model with supreme coding benchmark performance.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Flagship',
    },
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      family: 'Claude Family',
      category: 'flagship',
      description: 'Maximum intelligence model for large codebase architecture and deep multi-file refactoring.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Deep Reasoning',
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      family: 'Claude Family',
      category: 'flagship',
      description: 'Primary workhorse model for high-confidence software engineering and Claude Code CLI.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Recommended',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      family: 'Claude Family',
      category: 'flagship',
      description: 'High-capability reasoning model for complex logical synthesis and architectural design.',
      contextWindow: '200,000 Tokens (200K)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Architectural',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      family: 'Claude Family',
      category: 'fast',
      description: 'Lightweight high-speed model for automated linting, documentation, and inline completions.',
      contextWindow: '500,000 Tokens (500K)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Fast Response',
    },
  ];

  const filteredModels = catalog.filter((m) => activeTab === 'all' || m.category === activeTab);

  return (
    <section id="models" className="py-16 sm:py-24 border-b border-border bg-card/30 relative overflow-hidden">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Dedicated Claude Gateway</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              The Full Claude Model Lineup
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Exact public API IDs and gateway routing specifications for the Claude family. All models consume from your 5-hour rolling token window.
            </p>
          </div>

          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 bg-bg/80 border border-border p-1.5 rounded-panel backdrop-blur-md overflow-x-auto">
            {[
              { id: 'all', label: 'All Claude Models' },
              { id: 'flagship', label: 'Flagship & Reasoning' },
              { id: 'fast', label: 'Ultra-Fast & Edits' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-muted hover:text-fg hover:bg-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Models Cards Grid */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredModels.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-panel p-6 space-y-4 hover:border-amber-500/50 hover:shadow-xl transition-all shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-fg">{m.name}</h3>
                      <code className="text-xs font-mono text-amber-500 font-semibold block mt-0.5">{m.id}</code>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      {m.badge}
                    </span>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">{m.description}</p>
                </div>

                <div className="pt-4 border-t border-border/60 space-y-2 font-mono text-xs text-muted">
                  <div className="flex justify-between items-center">
                    <span>Protocol:</span>
                    <span className="text-fg font-semibold">{m.protocol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Context Window:</span>
                    <span className="text-emerald-400 font-bold">{m.contextWindow}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Availability:</span>
                    <span className="text-amber-500 font-bold">{m.availability}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};
