import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Copy,
  Check,
  Zap,
  Terminal,
  Cpu,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Workflow,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Conduit {
  id: string;
  name: string;
  category: string;
  model: string;
  latency: string;
  speed: string;
  context: string;
  icon: React.ElementType;
  accent: string;
  accentBg: string;
  accentBorder: string;
  tagline: string;
  samplePrompt: string;
  sampleOutput: string;
  toolsUsed: string[];
}

export const ElectricHero: React.FC = () => {
  const [activeConduitId, setActiveConduitId] = useState<string>('coding');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const baseUrl = 'https://lightningapi.pro/v1';

  const conduits: Record<string, Conduit> = {
    coding: {
      id: 'coding',
      name: 'Agentic Coding',
      category: 'Software Engineering',
      model: 'Claude Sonnet 5.5',
      latency: '28ms TTFT',
      speed: '82 tokens/sec',
      context: '1,000,000 Tokens',
      icon: Terminal,
      accent: 'text-[#6d28d9]',
      accentBg: 'bg-[#f5f3ff]',
      accentBorder: 'border-[#ddd6fe]',
      tagline: 'Native drop-in routing for Cursor, Windsurf, and Claude Code CLI',
      samplePrompt: '> Refactor express gateway to stream chunked SSE deltas directly to IDE composer',
      sampleOutput: 'export async function streamProxy(req: Request, res: Response) {\n  const stream = await anthropic.messages.stream({ ...req.body });\n  res.setHeader("Content-Type", "text/event-stream");\n  return stream.pipe(res); // 28ms first-token latency\n}',
      toolsUsed: ['Cursor IDE', 'Claude Code CLI', 'Windsurf', 'VS Code'],
    },
    reasoning: {
      id: 'reasoning',
      name: 'Deep Reasoning',
      category: 'Frontier Heavyweight',
      model: 'Claude Opus 5.5',
      latency: '42ms TTFT',
      speed: '64 tokens/sec',
      context: '1,000,000 Tokens',
      icon: Cpu,
      accent: 'text-[#2563eb]',
      accentBg: 'bg-[#eff6ff]',
      accentBorder: 'border-[#bfdbfe]',
      tagline: 'Exhaustive multi-step problem solving, math, and architecture review',
      samplePrompt: '> Synthesize 80-page financial disclosure into risk factor delta matrices',
      sampleOutput: '1. Foreign currency exposure mitigated via hedged forward contracts.\n2. Cloud compute expenditure reduced by 34% by switching to rolling quota.\n3. Counterparty concentration risk below statutory 5% threshold.',
      toolsUsed: ['Research Suites', 'Financial Models', 'Architecture RFCs'],
    },
    thinking: {
      id: 'thinking',
      name: 'Hybrid Thinking',
      category: 'Extended Chain-of-Thought',
      model: 'Claude Sonnet 5 Extended Thinking',
      latency: '35ms TTFT',
      speed: '76 tokens/sec',
      context: '1,000,000 Tokens (64k Out)',
      icon: Sparkles,
      accent: 'text-[#ea580c]',
      accentBg: 'bg-[#fff7ed]',
      accentBorder: 'border-[#fed7aa]',
      tagline: 'Internal reasoning tokens for complex algorithmic puzzles and verification',
      samplePrompt: '> Formulate formal invariant proof for distributed consensus ring topology',
      sampleOutput: '<thinking>\nEvaluating leader election invariant across dynamic membership partitions.\nVerifying heartbeat decay threshold does not trigger split-brain states.\n</thinking>\nTheorem: Partition tolerance holds under condition t_election > 2 * delta_ping.',
      toolsUsed: ['Algorithmic Proofs', 'Smart Contracts', 'Security Audits'],
    },
    velocity: {
      id: 'velocity',
      name: 'High Velocity',
      category: 'Instant Dispatch',
      model: 'Claude Haiku 5.5',
      latency: '18ms TTFT',
      speed: '142 tokens/sec',
      context: '500,000 Tokens',
      icon: Zap,
      accent: 'text-[#059669]',
      accentBg: 'bg-[#ecfdf5]',
      accentBorder: 'border-[#a7f3d0]',
      tagline: 'Sub-second classification, triage, automated linters, and triage bots',
      samplePrompt: '> Categorize incoming customer telemetry payload and assign priority tier',
      sampleOutput: '{\n  "classification": "high_concurrency_surge",\n  "routing_action": "allocate_rolling_buffer",\n  "dispatch_latency_ms": 14\n}',
      toolsUsed: ['CI/CD Bots', 'Triage Pipelines', 'High-Volume Agents'],
    },
  };

  const current = conduits[activeConduitId];
  const ActiveIcon = current.icon;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <section className="relative overflow-hidden bg-[#fbf9f5] pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 border-b border-[#e7e5e4] font-sans">
      
      {/* Subtle Luminous Canvas Geometry */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#6d28d9]/5 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Masthead Header: Bold Editorial Typography */}
        <div className="max-w-4xl space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-xs font-semibold text-[#6d28d9]">
            <Zap className="w-3.5 h-3.5 fill-current text-[#6d28d9]" />
            <span>FRONTIER AI GATEWAY · SUB-35MS TTFT</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold tracking-tight text-[#1c1917] leading-[1.04]">
            One master connection.<br />
            <span className="text-[#6d28d9]">Four parallel frontiers.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#57534e] leading-relaxed max-w-2xl font-normal">
            A single drop-in Anthropic API key routing directly to Claude Opus 5.5, Sonnet 5.5, and Haiku 5.5. Dedicated 5-hour rolling token renewal protects your flow from sudden midday rate lockouts and unpredictable cloud bills.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              to="/trial"
              className="px-7 py-4 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-sm transition-all shadow-plum flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>Claim Free 1M Token Pass</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#pricing"
              className="px-6 py-4 rounded-xl bg-white hover:bg-[#f5f2eb] border border-[#e7e5e4] text-[#1c1917] font-semibold text-sm transition-colors flex items-center justify-center shadow-xs cursor-pointer"
            >
              <span>Explore Capacity Packages</span>
            </a>
          </div>

          {/* Integrated Base URL Snippet & Trust Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center border border-[#e7e5e4] bg-white rounded-lg overflow-hidden shadow-xs max-w-md">
              <span className="px-2.5 py-1.5 text-[10px] font-mono text-[#78716c] bg-[#f5f2eb] border-r border-[#e7e5e4] shrink-0 font-bold">
                ENDPOINT
              </span>
              <code className="px-3 py-1.5 font-mono text-xs text-[#1c1917] whitespace-nowrap overflow-x-auto">
                {baseUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1.5 text-xs text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] border-l border-[#e7e5e4] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="Copy base URL"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 text-[11px] font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#78716c]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant activation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero prompt retention
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No credit card needed
              </span>
            </div>
          </div>
        </div>

        {/* Central Visual Motif: The Interactive Gateway Nexus */}
        <div className="pt-4">
          
          <div className="rounded-3xl border border-[#e7e5e4] bg-white p-6 sm:p-8 lg:p-10 shadow-warm relative overflow-hidden">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#e7e5e4]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#6d28d9] font-bold">
                  THE LIGHTNING GATEWAY ARCHITECTURE
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1c1917] tracking-tight mt-0.5">
                  Select a cognitive conduit to inspect live routing
                </h3>
              </div>

              {/* 4 Conduit Switcher Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#f5f2eb] p-1.5 rounded-2xl border border-[#e7e5e4]">
                {Object.values(conduits).map((c) => {
                  const Icon = c.icon;
                  const isActive = activeConduitId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConduitId(c.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#1c1917] shadow-xs'
                          : 'text-[#57534e] hover:text-[#1c1917]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? c.accent : 'text-[#78716c]'}`} />
                      <span className="whitespace-nowrap">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Conduit Display Grid */}
            <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Architectural Specs & Metrics */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="space-y-2">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${current.accentBg} ${current.accentBorder} ${current.accent} border`}>
                    <ActiveIcon className="w-3.5 h-3.5" />
                    <span>{current.category}</span>
                  </div>
                  <h4 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                    {current.model}
                  </h4>
                  <p className="text-sm text-[#57534e] leading-relaxed">
                    {current.tagline}
                  </p>
                </div>

                {/* 3 Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <span className="text-[10px] font-mono text-[#78716c] uppercase block">LATENCY</span>
                    <span className="text-sm font-bold text-[#1c1917] mt-0.5 block">{current.latency}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <span className="text-[10px] font-mono text-[#78716c] uppercase block">THROUGHPUT</span>
                    <span className="text-sm font-bold text-[#1c1917] mt-0.5 block">{current.speed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4]">
                    <span className="text-[10px] font-mono text-[#78716c] uppercase block">CONTEXT</span>
                    <span className="text-sm font-bold text-[#1c1917] mt-0.5 block truncate" title={current.context}>{current.context}</span>
                  </div>
                </div>

                {/* Compatible Workflows */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-[#78716c] uppercase tracking-wider block">
                    Verified Tools & Environments:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {current.toolsUsed.map((tool) => (
                      <span
                        key={tool}
                        className="px-2.5 py-1 rounded-md bg-[#f5f2eb] border border-[#e7e5e4] text-xs font-medium text-[#1c1917]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Live Stream Payload Telemetry */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-[#292524] bg-[#141210] p-5 text-white font-mono space-y-4 shadow-xl">
                  
                  {/* Console Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#292524] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-neutral-400">POST /v1/messages</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      HTTP 200 Streaming
                    </span>
                  </div>

                  {/* Input Request */}
                  <div className="space-y-1 text-xs">
                    <span className="text-neutral-500 block text-[11px] uppercase tracking-wider">REQUEST PAYLOAD</span>
                    <p className="text-amber-200/90 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 leading-relaxed font-sans text-xs">
                      {current.samplePrompt}
                    </p>
                  </div>

                  {/* Stream Response Output */}
                  <div className="space-y-1 text-xs">
                    <span className="text-neutral-500 block text-[11px] uppercase tracking-wider">OUTPUT DELTA STREAM</span>
                    <pre className="text-neutral-200 bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 leading-relaxed text-xs overflow-x-auto whitespace-pre-wrap">
                      {current.sampleOutput}
                    </pre>
                  </div>

                  {/* Footer Stats */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-[#292524]">
                    <span>Quota: 5-Hour Continuous Rolling Renewal</span>
                    <span className="text-[#a78bfa]">Zero Disk Logging</span>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
