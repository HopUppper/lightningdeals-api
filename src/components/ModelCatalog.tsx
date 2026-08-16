import React, { useState } from 'react';
import { Sparkles, Cpu, Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDCard } from './ThreeDCard';

export const ModelCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'flagship' | 'fast'>('all');

  const catalog = [
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet',
      family: 'Claude Family',
      category: 'flagship',
      description: 'Latest hybrid reasoning model featuring extended thinking mode for complex engineering & agentic tasks.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Latest & Best',
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      family: 'Claude Family',
      category: 'flagship',
      description: 'Flagship workhorse model for high-confidence software engineering and Claude Code CLI.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Recommended',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      family: 'Claude Family',
      category: 'fast',
      description: 'Lightweight ultra-fast completion model for automated linting, inline suggestions & quick responses.',
      contextWindow: '500,000 Tokens (500K)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Ultra Fast',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      family: 'Claude Family',
      category: 'flagship',
      description: 'High-capability reasoning model for complex architectural design and deep codebase refactoring.',
      contextWindow: '200,000 Tokens (200K)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Architectural',
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
      badge: 'Next Gen',
    },
    {
      id: 'claude-fable-5',
      name: 'Claude Fable 5',
      family: 'Claude Family',
      category: 'fast',
      description: 'Sub-second response completion model for instant IDE edits and real-time agentic loops.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'New & Fast',
    },
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      family: 'Claude Family',
      category: 'flagship',
      description: 'Maximum intelligence model for large codebase architecture and multi-file reasoning.',
      contextWindow: '1,000,000 Tokens (1M)',
      availability: 'Self-service',
      protocol: 'Anthropic Messages API',
      badge: 'Deep Reasoning',
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
              <Cpu className="w-3.5 h-3.5" /> Model Catalog & Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              Latest Best AI Models & Beyond
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Access the newest flagship models including <strong>Claude 3.7 Sonnet</strong>, <strong>Claude 3.5 Sonnet</strong>, <strong>Claude 3.5 Haiku</strong>, <strong>Claude Opus</strong>... and many more.
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
            href="https://wa.me/917695956938?text=Hi%20LightningDeals!%20I%20want%20to%20inquire%20about%20model%20support."
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
