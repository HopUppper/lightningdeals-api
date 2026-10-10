import React, { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModelInfo {
  id: string;
  name: string;
  category: 'flagship' | 'fast';
  descriptor: string;
  contextWindow: string;
  strengths: string;
  bestFor: string;
  maxOutput: string;
}

export const ModelRoster: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'flagship' | 'fast'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const models: ModelInfo[] = [
    {
      id: 'claude-opus-5.5',
      name: 'Claude Opus 5.5',
      category: 'flagship',
      descriptor: 'Cognitive Frontier',
      contextWindow: '1,000,000 Tokens',
      strengths: 'Pinnacle frontier intelligence for mission-critical architectural proofs, distributed consensus, and formal logic synthesis.',
      bestFor: 'Systems architecture, formal verification, deep research, academic proofs.',
      maxOutput: '16,384 Tokens',
    },
    {
      id: 'claude-sonnet-5.5',
      name: 'Claude Sonnet 5.5',
      category: 'flagship',
      descriptor: 'Flagship Engineering',
      contextWindow: '1,000,000 Tokens',
      strengths: 'Benchmark model for autonomous multi-file code synthesis, agent loops in Claude Code CLI, Cursor, and Windsurf.',
      bestFor: 'Cursor, Windsurf, Claude Code CLI, multi-repository production engineering.',
      maxOutput: '16,384 Tokens',
    },
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      category: 'flagship',
      descriptor: 'Cognitive Heavyweight',
      contextWindow: '1,000,000 Tokens',
      strengths: 'Deep reasoning depth for distributed systems architecture, complex legal contracts, and enterprise system designs.',
      bestFor: 'Deep architectural reviews, algorithmic invariants, enterprise synthesis.',
      maxOutput: '16,384 Tokens',
    },
    {
      id: 'claude-sonnet-5',
      name: 'Claude Sonnet 5',
      category: 'flagship',
      descriptor: 'Production Workhorse',
      contextWindow: '1,000,000 Tokens',
      strengths: 'Daily engineering workhorse combining fast generation velocity with deep multi-modal software comprehension.',
      bestFor: 'Full-stack engineering, API design, rapid feature scaffolding.',
      maxOutput: '16,384 Tokens',
    },
    {
      id: 'claude-fable-5',
      name: 'Claude Fable 5',
      category: 'fast',
      descriptor: 'Ultra-Fast IDE Specialist',
      contextWindow: '1,000,000 Tokens',
      strengths: 'Highly tuned response model for real-time IDE completion, inline git diff generation, and rapid developer interaction.',
      bestFor: 'IDE inline autocomplete, real-time diffing, interactive REPL.',
      maxOutput: '8,192 Tokens',
    },
    {
      id: 'claude-fable-5-flash',
      name: 'Claude Fable 5 Flash',
      category: 'fast',
      descriptor: 'Sub-Second Autopilot',
      contextWindow: '500,000 Tokens',
      strengths: 'Ultra-lightweight execution model tailored for automated CI/CD triage, linting engines, and high-concurrency bot loops.',
      bestFor: 'CI/CD checks, automated linters, webhook bots, event classification.',
      maxOutput: '8,192 Tokens',
    },
    {
      id: 'claude-opus-5-thinking',
      name: 'Claude Opus 5 Extended Thinking',
      category: 'flagship',
      descriptor: 'Hybrid Deliberative Logic',
      contextWindow: '1,000,000 Tokens',
      strengths: 'Deep reflective reasoning engine featuring explicit thought buffers for auditing intricate edge-case bugs and compiler logic.',
      bestFor: 'Compiler debugging, security vulnerability audits, formal theorem proving.',
      maxOutput: '64,000 Tokens',
    },
    {
      id: 'claude-sonnet-5-thinking',
      name: 'Claude Sonnet 5 Extended Thinking',
      category: 'flagship',
      descriptor: 'Extended Deliberation',
      contextWindow: '1,000,000 Tokens',
      strengths: 'Controllable thinking tokens for zero-hallucination verification of complex algorithms and vulnerability discovery.',
      bestFor: 'Complex algorithmic synthesis, vulnerability discovery, deep audits.',
      maxOutput: '64,000 Tokens',
    },
    {
      id: 'claude-haiku-5.5',
      name: 'Claude Haiku 5.5',
      category: 'fast',
      descriptor: 'High-Throughput Streaming',
      contextWindow: '500,000 Tokens',
      strengths: 'Next-gen high-velocity streaming model delivering rapid completions for high-traffic developer tools and webhooks.',
      bestFor: 'Real-time chat interfaces, live telemetry stream processing, micro-agents.',
      maxOutput: '8,192 Tokens',
    },
    {
      id: 'claude-haiku-5',
      name: 'Claude Haiku 5',
      category: 'fast',
      descriptor: 'High-Speed Background Utility',
      contextWindow: '500,000 Tokens',
      strengths: 'Compact execution model for high-frequency token streaming, automated test generation, and classification pipelines.',
      bestFor: 'Background batch jobs, triage classifiers, automated ticket routers.',
      maxOutput: '8,192 Tokens',
    },
  ];

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = filter === 'all' ? models : models.filter((m) => m.category === filter);

  return (
    <section id="models" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#e7e5e4] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header with Category Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e7e5e4]">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
              The Model Family
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
              Frontier intelligence on demand.
            </h2>
            <p className="text-sm sm:text-base text-[#57534e]">
              Switch seamlessly between deep reasoning powerhouses and high-throughput execution engines using one key.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#f5f2eb] p-1 rounded-xl text-xs self-start md:self-end border border-[#e7e5e4]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#1c1917] shadow-xs font-semibold'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              All Models
            </button>
            <button
              type="button"
              onClick={() => setFilter('flagship')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'flagship'
                  ? 'bg-white text-[#1c1917] shadow-xs font-semibold'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              Flagship & Reasoning
            </button>
            <button
              type="button"
              onClick={() => setFilter('fast')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === 'fast'
                  ? 'bg-white text-[#1c1917] shadow-xs font-semibold'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              High-Velocity
            </button>
          </div>
        </div>

        {/* Editorial Tabular Model List */}
        <div className="divide-y divide-[#e7e5e4]">
          {filtered.map((model) => (
            <div
              key={model.id}
              className="py-7 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-baseline transition-colors group"
            >
              {/* Col 1: Model Name, Descriptor & Identifier */}
              <div className="md:col-span-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1c1917] tracking-tight">
                    {model.name}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f5f3ff] text-[#6d28d9] font-medium border border-[#ddd6fe]">
                    {model.descriptor}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 max-w-full">
                  <code className="text-xs font-mono text-[#57534e] bg-[#f5f2eb] px-2 py-0.5 rounded border border-[#e7e5e4] truncate max-w-[240px]">
                    {model.id}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(model.id)}
                    className="p-1 rounded text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer shrink-0"
                    title="Copy model identifier"
                  >
                    {copiedId === model.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Col 2: Strengths & Primary Application */}
              <div className="md:col-span-5 space-y-1.5 text-xs sm:text-sm text-[#57534e] leading-relaxed">
                <p className="font-normal text-[#1c1917]">
                  {model.strengths}
                </p>
                <p className="text-xs text-[#78716c]">
                  <strong className="text-[#57534e] font-semibold">Recommended for:</strong> {model.bestFor}
                </p>
              </div>

              {/* Col 3: Specifications */}
              <div className="md:col-span-3 md:text-right space-y-1 text-xs">
                <div className="font-mono text-[#1c1917] font-semibold text-sm">
                  {model.contextWindow}
                </div>
                <div className="text-[11px] text-[#78716c]">
                  Max Output: {model.maxOutput}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle Footer Note */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#78716c] border-t border-[#e7e5e4]">
          <span>All models mirror official Anthropic specifications with zero modification to weights or completions.</span>
          <Link
            to="/models"
            className="text-[#6d28d9] hover:text-[#581c87] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>Explore full specifications catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};
