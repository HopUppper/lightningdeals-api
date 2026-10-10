import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Zap, 
  Cpu, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Terminal,
  ExternalLink,
  Code2,
  Workflow
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface WorkflowConduit {
  id: string;
  title: string;
  category: string;
  modelName: string;
  modelId: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  badge: string;
  capabilityBadge: string;
  description: string;
  envCommand: string;
  sampleCurl: string;
  verifiedTools: string[];
  streamSimulation: string[];
}

const WORKFLOWS: WorkflowConduit[] = [
  {
    id: 'agentic',
    title: 'Agentic Coding & CLI',
    category: 'IDE SYNTHESIS & REFACTORING',
    modelName: 'Claude Sonnet 5.5',
    modelId: 'claude-sonnet-5.5',
    accent: '#7c3aed',
    accentLight: '#f5f3ff',
    accentBorder: '#c4b5fd',
    badge: 'Cursor · Windsurf · Claude Code',
    capabilityBadge: 'Native SSE Streaming',
    description: 'Multi-file code synthesis, automated terminal execution, and rapid diff application across deep projects.',
    envCommand: 'curl -fsSL https://lightningapi.pro/setup.sh | bash',
    sampleCurl: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-sonnet-5.5", "stream": true, "messages": [{"role": "user", "content": "Refactor express proxy"}]}'`,
    verifiedTools: ['Claude Code CLI', 'Cursor Composer', 'Windsurf Cascade', 'VS Code'],
    streamSimulation: [
      '⚡ [conduit] Routing to Claude Sonnet 5.5 via TLS 1.3 volatile RAM...',
      '⚡ [tool_call] analyze_ast: src/gateway/proxy.ts',
      '+ export async function forwardStream(req: Request, res: Response) {',
      '+   const stream = await anthropic.messages.stream(req.body);',
      '+   res.setHeader("Content-Type", "text/event-stream");',
      '+   return stream.pipe(res); // in-memory stream transit',
      '+ }',
      '✓ [complete] Refactor verified · Tests passing · 0 disk logs written'
    ],
  },
  {
    id: 'reasoning',
    title: 'Deep Cognitive Reasoning',
    category: 'FORMAL LOGIC & ARCHITECTURE',
    modelName: 'Claude Opus 5.5',
    modelId: 'claude-opus-5.5',
    accent: '#2563eb',
    accentLight: '#eff6ff',
    accentBorder: '#bfdbfe',
    badge: 'Architecture RFCs · Mathematical Proofs',
    capabilityBadge: '1M Context Window',
    description: 'Exhaustive multi-step problem solving, architectural invariants, formal proofs, and complex contracts.',
    envCommand: 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"',
    sampleCurl: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-opus-5.5", "messages": [{"role": "user", "content": "Formally verify state machine"}]}'`,
    verifiedTools: ['Deep Research Suites', 'Architecture Reviewers', 'Financial Models', 'Security Auditors'],
    streamSimulation: [
      '⚡ [conduit] Routing to Claude Opus 5.5 with 1M context window...',
      '⚡ [analysis] Formally decomposing distributed consensus boundaries...',
      '1. Mutual exclusion holds across all 16 concurrent transitions.',
      '2. Leader election terminates in O(log N) rounds with zero partition splits.',
      '3. Quorum intersection property verified mathematically.',
      '✓ [complete] Invariant holds · Formal proof constructed without approximations'
    ],
  },
  {
    id: 'thinking',
    title: 'Extended Hybrid Thinking',
    category: 'VISIBLE CONTROLLABLE REASONING',
    modelName: 'Claude Opus 5 Extended Thinking',
    modelId: 'claude-opus-5-thinking',
    accent: '#ea580c',
    accentLight: '#fff7ed',
    accentBorder: '#ffedd5',
    badge: 'Internal Reflection · Bug Hunters',
    capabilityBadge: 'Visible Thinking Tokens',
    description: 'Pioneering hybrid architecture with visible thinking tokens for auditing intricate edge-case bugs and compiler logic.',
    envCommand: 'export ANTHROPIC_MODEL="claude-opus-5-thinking"',
    sampleCurl: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-opus-5-thinking", "thinking": {"type": "enabled", "budget_tokens": 4096}, "messages": [{"role": "user", "content": "Audit kernel lock"}]}'`,
    verifiedTools: ['Kernel Bug Hunters', 'Compiler Design', 'Smart Contract Audits', 'Logic Puzzles'],
    streamSimulation: [
      '⚡ [conduit] Routing to Claude Opus 5 Extended Thinking · Thinking budget: 4,096 tokens',
      '⚡ [thinking: 1,482 tokens] Inspecting lock acquisition order in spinlock.c...',
      '↳ Potential inverted lock hierarchy detected on line 142 under CPU preemption.',
      '↳ Drafting memory barrier self-correction before output emission...',
      '✓ [output] Memory order acquire/release barriers inserted. Deadlock resolved.'
    ],
  },
  {
    id: 'velocity',
    title: 'High-Velocity Background Bots',
    category: 'REAL-TIME TRIAGE & CI/CD',
    modelName: 'Claude Fable 5',
    modelId: 'claude-fable-5',
    accent: '#059669',
    accentLight: '#ecfdf5',
    accentBorder: '#a7f3d0',
    badge: 'High Concurrency · Rapid Diffing',
    capabilityBadge: 'Low-Latency Stream',
    description: 'Sub-second response speeds with extreme throughput for classification, automated triage, and persistent agent loops.',
    envCommand: 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"',
    sampleCurl: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-fable-5", "messages": [{"role": "user", "content": "Classify webhook payload"}]}'`,
    verifiedTools: ['CI/CD Runners', 'Triage Linters', 'Real-time Webhook Bots', 'Data Extraction'],
    streamSimulation: [
      '⚡ [conduit] Routing to Claude Fable 5 · High concurrency mode active',
      '⚡ [triage] Incoming webhook: GitHub Pull Request #84',
      '↳ Classification: SECURITY_PATCH · Urgency: HIGH · Reviewers: assigned',
      '↳ Streaming SSE packets dispatched directly to client',
      '✓ [complete] Webhook dispatched · Token burn rate: 0.02% of 5h rolling window'
    ],
  },
];

export const InteractiveGatewayDemo: React.FC = () => {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('agentic');
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [snippetMode, setSnippetMode] = useState<'cli' | 'curl'>('cli');
  const prefersReducedMotion = useReducedMotion();

  const activeWorkflow = WORKFLOWS.find((w) => w.id === activeWorkflowId) || WORKFLOWS[0];

  const handleCopySnippet = () => {
    const textToCopy = snippetMode === 'cli' ? activeWorkflow.envCommand : activeWorkflow.sampleCurl;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <section id="demo" className="py-20 sm:py-24 lg:py-28 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
        
        {/* Section Masthead */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#6d28d9] animate-pulse" />
            <span className="text-[#6d28d9] font-bold">INTERACTIVE DEMONSTRATION</span>
            <span className="text-[#d6d3d1]">·</span>
            <span>LIVE CONDUIT PLAYGROUND</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.12]">
            Simulate real-time gateway routing across models.
          </h2>

          <p className="text-sm sm:text-base text-[#57534e] max-w-2xl mx-auto leading-relaxed">
            Test how the unified gateway directs requests to specific models, streams output via standard Anthropic SSE payloads, and maintains zero disk-logging security.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* THE INTERACTIVE GATEWAY CIRCUIT CONTAINER                      */}
        {/* ------------------------------------------------------------- */}
        <div className="relative rounded-3xl border border-[#e7e5e4] bg-white p-5 sm:p-7 lg:p-8 shadow-warm space-y-5">
          
          {/* Top Bar: Circuit Header & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e7e5e4] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#f5f3ff] border border-[#c4b5fd] flex items-center justify-center text-[#6d28d9]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] font-semibold block">
                  CONDUIT SELECTOR
                </span>
                <span className="text-sm font-bold text-[#1c1917]">
                  Active Route: <span className="font-mono text-[#6d28d9]">{activeWorkflow.modelId}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-[#57534e] bg-[#fbf9f5] px-3 py-1.5 rounded-lg border border-[#e7e5e4]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TLS 1.3 · Volatile Transit · Zero Prompt Retention</span>
            </div>
          </div>

          {/* 4 Workflow Conduit Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {WORKFLOWS.map((wf) => {
              const isSelected = activeWorkflowId === wf.id;
              return (
                <button
                  key={wf.id}
                  onClick={() => setActiveWorkflowId(wf.id)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-white shadow-md ring-2 ring-[#6d28d9]/15'
                      : 'bg-[#faf8f5]/80 border-[#e7e5e4] hover:bg-white hover:border-[#d6d3d1]'
                  }`}
                  style={{ borderColor: isSelected ? wf.accent : undefined }}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: wf.accentLight, color: wf.accent }}>
                      {wf.capabilityBadge}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#6d28d9] animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1c1917] tracking-tight pt-1">
                    {wf.title}
                  </h3>
                  <span className="text-[11px] font-mono text-[#78716c] block pt-0.5">
                    {wf.modelName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Conduit Dual Console: Execution Config (Left) + Simulated Stream (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-2">
            
            {/* Left 5 Cols: Drop-in Configuration */}
            <div className="lg:col-span-5 rounded-2xl border border-[#e7e5e4] bg-[#fbf9f5] p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e7e5e4]">
                  <span className="text-[11px] font-mono font-bold text-[#78716c] uppercase tracking-wider">
                    TARGET WORKFLOW
                  </span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#e7e5e4] text-[10px] font-mono">
                    <button
                      onClick={() => setSnippetMode('cli')}
                      className={`px-2 py-0.5 rounded ${snippetMode === 'cli' ? 'bg-[#6d28d9] text-white' : 'text-[#78716c] hover:text-[#1c1917]'}`}
                    >
                      CLI Setup
                    </button>
                    <button
                      onClick={() => setSnippetMode('curl')}
                      className={`px-2 py-0.5 rounded ${snippetMode === 'curl' ? 'bg-[#6d28d9] text-white' : 'text-[#78716c] hover:text-[#1c1917]'}`}
                    >
                      cURL
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#1c1917]">{activeWorkflow.title}</h4>
                  <p className="text-xs text-[#57534e] pt-1 leading-relaxed">
                    {activeWorkflow.description}
                  </p>
                </div>

                {/* Snippet Card */}
                <div className="p-3 bg-white rounded-xl border border-[#e7e5e4] font-mono text-xs text-[#1c1917] relative">
                  <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-[#292524] leading-relaxed">
                    {snippetMode === 'cli' ? activeWorkflow.envCommand : activeWorkflow.sampleCurl}
                  </pre>
                  <button
                    onClick={handleCopySnippet}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#fbf9f5] hover:bg-[#f5f2eb] border border-[#e7e5e4] text-[#6d28d9] transition-colors cursor-pointer"
                    title="Copy command"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Supported Tools Tag Row */}
              <div className="pt-2 border-t border-[#e7e5e4]">
                <span className="text-[10px] font-mono uppercase text-[#78716c] block pb-1.5 font-semibold">
                  VERIFIED INTEGRATIONS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeWorkflow.verifiedTools.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-white border border-[#e7e5e4] text-[11px] font-medium text-[#1c1917]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Real-Time Stream Terminal Simulation */}
            <div className="lg:col-span-7 rounded-2xl border border-[#292524] bg-[#141210] p-4 sm:p-5 flex flex-col justify-between shadow-xl text-neutral-200 font-mono">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#292524] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-neutral-400 pl-2 text-[11px]">stream_output.log</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    STATUS 200 OK
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-300 py-1 font-mono">
                  {activeWorkflow.streamSimulation.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.startsWith('+')
                          ? 'text-emerald-400'
                          : line.startsWith('✓')
                          ? 'text-purple-400 font-semibold'
                          : line.startsWith('⚡')
                          ? 'text-amber-300'
                          : 'text-neutral-400'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#292524] flex items-center justify-between text-[11px] text-neutral-400">
                <span>Protocol: Anthropic SSE v1</span>
                <span className="text-neutral-300">Transit: Ephemeral RAM</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
