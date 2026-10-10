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
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      category: 'flagship',
      descriptor: 'Production Workhorse',
      contextWindow: '200,000 Tokens',
      strengths: 'Industry-leading software development, complex full-stack refactoring, and multi-file reasoning.',
      bestFor: 'Cursor, Windsurf, Claude Code CLI, everyday production engineering.',
      maxOutput: '8,192 Tokens',
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude Opus 5',
      category: 'flagship',
      descriptor: 'Cognitive Heavyweight',
      contextWindow: '200,000 Tokens',
      strengths: 'Exhaustive multi-step problem solving, difficult mathematics, nuanced legal analysis, and architecture review.',
      bestFor: 'Deep research, critical algorithmic logic, academic review.',
      maxOutput: '4,096 Tokens',
    },
    {
      id: 'claude-3-7-sonnet',
      name: 'Claude 3.7 Sonnet',
      category: 'flagship',
      descriptor: 'Hybrid Extended Thinking',
      contextWindow: '200,000 Tokens',
      strengths: 'Controllable reasoning depth with internal reasoning tokens for intricate logic puzzles and verification.',
      bestFor: 'Deep algorithmic synthesis, complex formal proofs, step-by-step logic.',
      maxOutput: '64,000 Tokens',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude Haiku 4.5',
      category: 'fast',
      descriptor: 'High-Velocity Execution',
      contextWindow: '200,000 Tokens',
      strengths: 'Sub-second response speeds with exceptional accuracy on classification, triage, and brief code edits.',
      bestFor: 'CI/CD checks, automated linters, quick completions, high-volume agents.',
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
