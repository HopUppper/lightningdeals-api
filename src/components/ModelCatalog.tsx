import React, { useState } from 'react';
import { Cpu, ArrowRight, Check, Layers, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ModelCatalog: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'flagship' | 'fast'>('all');

  const models = [
    {
      id: 'claude-3-5-sonnet-20241022',
      alias: 'sonnet',
      name: 'Claude 3.5 Sonnet',
      tier: 'Flagship Engineering',
      type: 'flagship',
      context: '1,000,000 Tokens',
      strengths: 'Industry benchmark for multi-file code synthesis, agent loops in Claude Code CLI, Cursor, and Windsurf.',
      latency: '28ms TTFT',
    },
    {
      id: 'claude-opus-5',
      alias: 'opus',
      name: 'Claude Opus 5',
      tier: 'Cognitive Frontier',
      type: 'flagship',
      context: '1,000,000 Tokens',
      strengths: 'Deepest reasoning depth for distributed architecture RFCs, formal logic invariants, and system proofs.',
      latency: '42ms TTFT',
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      alias: 'sonnet-3-7',
      name: 'Claude 3.7 Sonnet',
      tier: 'Hybrid Extended Thinking',
      type: 'flagship',
      context: '1,000,000 Tokens',
      strengths: 'Controllable visible reasoning depth via budget_tokens. Exceptional for subtle race-conditions and compiler bugs.',
      latency: '34ms TTFT',
    },
    {
      id: 'claude-sonnet-5',
      alias: 'sonnet-5',
      name: 'Claude Sonnet 5',
      tier: 'Next-Gen Inference',
      type: 'flagship',
      context: '1,000,000 Tokens',
      strengths: 'Next-generation cognitive inference with high semantic comprehension and multi-modal tool calling.',
      latency: '30ms TTFT',
    },
    {
      id: 'claude-fable-5',
      alias: 'fable',
      name: 'Claude Fable 5',
      tier: 'Creative Synthesis',
      type: 'flagship',
      context: '1,000,000 Tokens',
      strengths: 'Specialized for extensive long-context narrative synthesis and open-ended technical documentation.',
      latency: '35ms TTFT',
    },
    {
      id: 'claude-3-opus-20240229',
      alias: 'opus-3',
      name: 'Claude 3 Opus',
      tier: 'Deep Architecture',
      type: 'flagship',
      context: '200,000 Tokens',
      strengths: 'Proven foundation for complex academic research, philosophical analysis, and nuanced multi-turn evaluations.',
      latency: '48ms TTFT',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      alias: 'haiku',
      name: 'Claude 3.5 Haiku',
      tier: 'High-Throughput Fast',
      type: 'fast',
      context: '500,000 Tokens',
      strengths: 'Blazing sub-20ms response time designed for CI/CD runners, real-time webhook triage, and classification.',
      latency: '18ms TTFT',
    },
  ];

  const filtered = filter === 'all' ? models : models.filter((m) => m.type === filter);

  return (
    <section id="models" className="border-b border-[#e7e5e4] bg-[#faf8f5] py-16 sm:py-24 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e7e5e4] pb-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
              <Sparkles className="w-3.5 h-3.5 text-[#6d28d9]" />
              <span className="text-[#6d28d9] font-bold">MODEL INTELLIGENCE</span>
              <span className="text-[#d6d3d1]">·</span>
              <span>LIVE REPERTOIRE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1c1917]">
              The Claude Model Family
            </h2>
            <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
              Switch freely between reasoning powerhouses and high-throughput execution through a single master key.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#e7e5e4] p-1 rounded-xl text-xs font-medium shadow-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#1c1917] text-white shadow-xs font-semibold'
                  : 'text-[#57534e] hover:text-[#1c1917]'
              }`}
            >
              All Models ({models.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('flagship')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'flagship'
                  ? 'bg-[#1c1917] text-white shadow-xs font-semibold'
                  : 'text-[#57534e] hover:text-[#1c1917]'
              }`}
            >
              Flagship &amp; Reasoning
            </button>
            <button
              type="button"
              onClick={() => setFilter('fast')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'fast'
                  ? 'bg-[#1c1917] text-white shadow-xs font-semibold'
                  : 'text-[#57534e] hover:text-[#1c1917]'
              }`}
            >
              High-Throughput
            </button>
          </div>
        </div>

        {/* Model Comparison Table */}
        <div className="border border-[#e7e5e4] rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-warm">
          <div className="hidden md:grid md:grid-cols-12 border-b border-[#e7e5e4] bg-[#faf8f5] px-6 py-3.5 text-xs font-mono font-bold text-[#78716c] uppercase tracking-wider">
            <div className="md:col-span-3">Model &amp; Canonical ID</div>
            <div className="md:col-span-2">Classification</div>
            <div className="md:col-span-2">Context &amp; Speed</div>
            <div className="md:col-span-5">Primary Use Case &amp; Capabilities</div>
          </div>

          <div className="divide-y divide-[#f5f2eb]">
            {filtered.map((model) => (
              <div
                key={model.id}
                className="grid grid-cols-1 md:grid-cols-12 px-6 py-5 gap-3 md:gap-0 items-center text-xs hover:bg-[#faf8f5]/60 transition-colors"
              >
                {/* Model Name & ID */}
                <div className="md:col-span-3 space-y-1">
                  <div className="text-sm font-bold text-[#1c1917] flex items-center gap-2">
                    <span>{model.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#f5f2eb] text-[#78716c]">
                      alias: {model.alias}
                    </span>
                  </div>
                  <code className="text-[11px] font-mono text-[#6d28d9] block">
                    {model.id}
                  </code>
                </div>

                {/* Tier */}
                <div className="md:col-span-2">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-[#faf8f5] border border-[#e7e5e4] text-[11px] font-medium text-[#57534e]">
                    {model.tier}
                  </span>
                </div>

                {/* Context Window & Latency */}
                <div className="md:col-span-2 space-y-0.5">
                  <div className="font-mono text-xs font-bold text-[#1c1917]">
                    {model.context}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700">
                    {model.latency}
                  </div>
                </div>

                {/* Primary Use Case */}
                <div className="md:col-span-5 text-[#57534e] leading-relaxed pr-2">
                  {model.strengths}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 px-1">
          <span className="text-[#78716c]">
            Need complete parameters or token limits? Inspect full documentation.
          </span>
          <Link
            to="/docs"
            className="font-semibold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Read Complete Developer API Reference</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};
