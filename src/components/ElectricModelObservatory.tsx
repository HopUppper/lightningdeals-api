import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Cpu,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  Code2,
  Terminal,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModelInfo {
  id: string;
  name: string;
  apiIdentifier: string;
  badge: string;
  accent: string;
  accentBg: string;
  description: string;
  strengths: string[];
  contextTokens: string;
  maxOutput: string;
  reasoningScore: number; // 0-100
  codingScore: number;    // 0-100
  speedScore: number;     // 0-100
  recommendedTools: string[];
  sampleRequest: string;
}

export const ElectricModelObservatory: React.FC = () => {
  const [selectedModelId, setSelectedModelId] = useState<string>('sonnet55');
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);

  const models: Record<string, ModelInfo> = {
    sonnet55: {
      id: 'sonnet55',
      name: 'Claude Sonnet 5.5',
      apiIdentifier: 'claude-sonnet-5.5',
      badge: 'Autonomous Multi-File Coding',
      accent: 'text-[#6d28d9]',
      accentBg: 'bg-[#f5f3ff]',
      description: 'Next-generation flagship coding workhorse engineered for Cursor, Windsurf, and Claude Code CLI with unprecedented multi-file refactoring precision.',
      strengths: [
        'Unmatched agentic coding precision in Cursor, Windsurf & Claude Code',
        'Flawless multi-file code synthesis with 1,000,000 context window',
        'Complex AST parsing and automated zero-regression test generation',
      ],
      contextTokens: '1,000,000 Tokens',
      maxOutput: '16,384 Tokens',
      reasoningScore: 98,
      codingScore: 99,
      speedScore: 92,
      recommendedTools: ['Cursor IDE', 'Windsurf', 'Claude Code CLI', 'Multi-Repo Engineering'],
      sampleRequest: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-sonnet-5.5", "messages": [{"role": "user", "content": "Refactor router across 8 files"}]}'`,
    },
    opus55: {
      id: 'opus55',
      name: 'Claude Opus 5.5',
      apiIdentifier: 'claude-opus-5.5',
      badge: 'Frontier Cognitive Heavyweight',
      accent: 'text-[#2563eb]',
      accentBg: 'bg-[#eff6ff]',
      description: 'Pinnacle frontier intelligence model for ultra-complex architectural proofs, deep mathematical verification, and autonomous systems design.',
      strengths: [
        'Pinnacle frontier reasoning for mission-critical enterprise systems',
        'Formal verification of distributed algorithms and smart contracts',
        'Academic-grade multi-disciplinary synthesis with 1M token context',
      ],
      contextTokens: '1,000,000 Tokens',
      maxOutput: '16,384 Tokens',
      reasoningScore: 100,
      codingScore: 97,
      speedScore: 82,
      recommendedTools: ['Deep Research', 'Systems Architecture', 'Contract Verification', 'Formal Proofs'],
      sampleRequest: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-opus-5.5", "messages": [{"role": "user", "content": "Verify distributed consensus invariant"}]}'`,
    },
    fable5: {
      id: 'fable5',
      name: 'Claude Fable 5',
      apiIdentifier: 'claude-fable-5',
      badge: 'Ultra-Fast IDE Specialist',
      accent: 'text-[#059669]',
      accentBg: 'bg-[#ecfdf5]',
      description: 'Highly tuned, lightning-fast response model optimized for real-time IDE completion, inline diff generation, and rapid developer interaction loops.',
      strengths: [
        'Sub-25ms first-token latency with streaming velocity over 180 tok/s',
        'Instant inline autocomplete and git patch diff generation',
        'Lightweight token economics for 24/7 background agent execution',
      ],
      contextTokens: '1,000,000 Tokens',
      maxOutput: '8,192 Tokens',
      reasoningScore: 94,
      codingScore: 98,
      speedScore: 99,
      recommendedTools: ['IDE Inline Completion', 'Real-time Diffing', 'Automated CI Linters', 'Interactive REPL'],
      sampleRequest: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-fable-5", "messages": [{"role": "user", "content": "Generate inline typescript diff"}]}'`,
    },
    opusThinking: {
      id: 'opusThinking',
      name: 'Claude Opus 5 Extended Thinking',
      apiIdentifier: 'claude-opus-5-thinking',
      badge: 'Hybrid Deliberative Logic',
      accent: 'text-[#ea580c]',
      accentBg: 'bg-[#fff7ed]',
      description: 'Deep reflective reasoning engine featuring explicit internal thought buffers for auditing intricate edge-case bugs and compiler invariants.',
      strengths: [
        'Controllable reasoning token budget for formal theorem proving',
        'Visible internal reflection buffers for auditing edge-case bugs',
        'Zero-hallucination verification of complex distributed state machines',
      ],
      contextTokens: '1,000,000 Tokens',
      maxOutput: '64,000 Tokens',
      reasoningScore: 99,
      codingScore: 98,
      speedScore: 85,
      recommendedTools: ['Compiler Debugging', 'Security Audits', 'Logic Verification', 'Vulnerability Discovery'],
      sampleRequest: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-opus-5-thinking", "thinking": {"type": "enabled", "budget_tokens": 4096}, "messages": [{"role": "user", "content": "Audit kernel memory safety"}]}'`,
    },
  };

  const current = models[selectedModelId];

  const handleCopyIdentifier = (idStr: string) => {
    navigator.clipboard.writeText(idStr);
    setCopiedIdentifier(idStr);
    setTimeout(() => setCopiedIdentifier(null), 2000);
  };

  return (
    <section id="models" className="py-20 sm:py-24 lg:py-28 bg-[#f8f6f0] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Masthead */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e7e5e4]">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] text-xs font-mono font-medium text-[#6d28d9] uppercase tracking-wider shadow-xs">
              <span>THE FRONTIER MODEL OBSERVATORY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.1]">
              Switch models instantly with one universal key.
            </h2>
            <p className="text-base text-[#57534e] leading-relaxed">
              Every LightningAPI subscription grants complete access across the entire Anthropic Claude family. Never maintain multiple provider subscriptions again.
            </p>
          </div>

          <Link
            to="/models"
            className="text-xs font-bold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1.5 transition-colors shrink-0 bg-white px-4 py-2.5 rounded-xl border border-[#e7e5e4] shadow-xs"
          >
            <span>View Full Model Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Model Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(models).map((m) => {
            const isSelected = selectedModelId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`p-4 sm:p-5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-white border-[#6d28d9] shadow-warm ring-2 ring-[#6d28d9]/10'
                    : 'bg-white/60 border-[#e7e5e4] hover:bg-white hover:border-[#d6d3d1]'
                }`}
              >
                <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${m.accentBg} ${m.accent} mb-2`}>
                  {m.badge}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#1c1917] tracking-tight">
                  {m.name}
                </h3>
                <span className="text-xs text-[#78716c] font-mono mt-1 block truncate">
                  {m.contextTokens}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Model Deep Dive Canvas */}
        <div className="rounded-3xl border border-[#e7e5e4] bg-white p-6 sm:p-8 lg:p-10 shadow-warm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left 7 Cols: Narrative & Capability Benchmarks */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
                    {current.name}
                  </h3>
                  
                  {/* Copyable Identifier Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f5f2eb] border border-[#e7e5e4] text-xs font-mono text-[#1c1917]">
                    <span>{current.apiIdentifier}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyIdentifier(current.apiIdentifier)}
                      className="text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer"
                      title="Copy model identifier"
                    >
                      {copiedIdentifier === current.apiIdentifier ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#57534e] leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Cognitive Strength Checkpoints */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-bold text-[#78716c] uppercase tracking-wider block">
                  VERIFIED STRENGTHS & ARCHITECTURAL FOCUS:
                </span>
                <ul className="space-y-2">
                  {current.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1c1917]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Benchmark Gauges */}
              <div className="space-y-3 pt-4 border-t border-[#e7e5e4]">
                <span className="text-xs font-bold text-[#78716c] uppercase tracking-wider block">
                  CAPABILITY PROFILE:
                </span>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between font-medium text-[#1c1917] mb-1">
                      <span>Complex Reasoning & Logic</span>
                      <span className="font-mono text-[#6d28d9] font-bold">{current.reasoningScore}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#f5f2eb] overflow-hidden">
                      <div className="h-full bg-[#6d28d9] rounded-full transition-all duration-500" style={{ width: `${current.reasoningScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-[#1c1917] mb-1">
                      <span>Code Synthesis & Multi-File Editing</span>
                      <span className="font-mono text-[#2563eb] font-bold">{current.codingScore}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#f5f2eb] overflow-hidden">
                      <div className="h-full bg-[#2563eb] rounded-full transition-all duration-500" style={{ width: `${current.codingScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-[#1c1917] mb-1">
                      <span>Streaming Speed & First-Token Velocity</span>
                      <span className="font-mono text-[#059669] font-bold">{current.speedScore}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#f5f2eb] overflow-hidden">
                      <div className="h-full bg-[#059669] rounded-full transition-all duration-500" style={{ width: `${current.speedScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right 5 Cols: Drop-in Configuration & Verified Environments */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="rounded-2xl border border-[#292524] bg-[#141210] p-5 text-white font-mono space-y-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#292524] text-xs">
                  <span className="text-neutral-400">cURL INITIALIZATION</span>
                  <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    NATIVE ANTHROPIC SDK
                  </span>
                </div>
                <pre className="text-xs text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {current.sampleRequest}
                </pre>
              </div>

              {/* Recommended Workflows */}
              <div className="p-5 rounded-2xl bg-[#fbf9f5] border border-[#e7e5e4] space-y-3">
                <span className="text-xs font-bold text-[#78716c] uppercase tracking-wider block">
                  OPTIMAL WORKFLOW ENVIRONMENTS:
                </span>
                <div className="flex flex-wrap gap-2">
                  {current.recommendedTools.map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#e7e5e4] text-xs font-semibold text-[#1c1917] shadow-xs"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
