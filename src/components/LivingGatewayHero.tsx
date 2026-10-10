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
  latencyBadge: string;
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
    latencyBadge: '28ms TTFT',
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
      '+   return stream.pipe(res); // 28ms first-token latency',
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
    accent: '#d97706',
    accentLight: '#fffbeb',
    accentBorder: '#fde68a',
    badge: 'Architecture RFCs · Mathematical Proofs',
    latencyBadge: '38ms TTFT',
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
    latencyBadge: '34ms TTFT',
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
    badge: 'Sub-25ms TTFT · High Concurrency',
    latencyBadge: '22ms TTFT',
    description: 'Sub-second response speeds with extreme throughput for classification, automated triage, and persistent agent loops.',
    envCommand: 'export ANTHROPIC_BASE_URL="https://lightningapi.pro"',
    sampleCurl: `curl https://lightningapi.pro/v1/messages \\\n  -H "x-api-key: ld_live_your_key" \\\n  -d '{"model": "claude-fable-5", "messages": [{"role": "user", "content": "Classify webhook payload"}]}'`,
    verifiedTools: ['CI/CD Runners', 'Triage Linters', 'Real-time Webhook Bots', 'Data Extraction'],
    streamSimulation: [
      '⚡ [conduit] Routing to Claude Fable 5 · Sub-25ms TTFT achieved',
      '⚡ [triage] Incoming webhook: GitHub Pull Request #84',
      '↳ Classification: SECURITY_PATCH · Urgency: HIGH · Reviewers: assigned',
      '↳ Parallel throughput: 180 tokens/sec · Total latency: 38ms',
      '✓ [complete] Webhook dispatched · Token burn rate: 0.02% of 5h rolling window'
    ],
  },
];

export const LivingGatewayHero: React.FC = () => {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('agentic');
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [snippetMode, setSnippetMode] = useState<'cli' | 'curl'>('cli');
  const prefersReducedMotion = useReducedMotion();

  const activeWorkflow = WORKFLOWS.find((w) => w.id === activeWorkflowId) || WORKFLOWS[0];

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://lightningapi.pro');
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopySnippet = () => {
    const textToCopy = snippetMode === 'cli' ? activeWorkflow.envCommand : activeWorkflow.sampleCurl;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <section id="hero" className="relative pt-5 pb-12 sm:pt-7 sm:pb-16 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans overflow-hidden">
      {/* Subtle Architectural Dot Matrix Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]" 
        style={{
          backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        
        {/* Masthead Headline Block (Compact, Balanced & Centered) */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          
          {/* Editorial Category Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-[11px] font-mono font-medium text-[#57534e]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#6d28d9] animate-pulse" />
            <span className="text-[#6d28d9] font-bold">THE LIVING GATEWAY</span>
            <span className="text-[#d6d3d1]">·</span>
            <span>UNIVERSAL ANTHROPIC MASTER CONNECTION</span>
          </div>

          {/* Monumental Centered Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-extrabold tracking-tight text-[#1c1917] leading-[1.12]">
            One master connection.{' '}
            <span className="text-[#6d28d9] inline-block">Four AI frontiers in continuous flow.</span>
          </h1>

          {/* Editorial Subtitle */}
          <p className="text-xs sm:text-sm text-[#57534e] max-w-xl mx-auto leading-relaxed">
            Drop-in Anthropic compatibility (<code className="px-1 py-0.5 rounded bg-white border border-[#e7e5e4] font-mono text-[11px] text-[#1c1917]">/v1/messages</code>) routing seamlessly to Claude Opus 5.5, Sonnet 5.5, and Fable 5. Dedicated 5-hour rolling renewal keeps you coding without midday quota freezes.
          </p>

          {/* Quick Action Suite & Verified Endpoint Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-0.5">
            <Link
              to="/trial"
              className="px-4 py-2 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-xs transition-all shadow-plum hover:shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Claim 1,000,000 Free Token Pass</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-200" />
            </Link>

            <a
              href="#pricing"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f5f2eb] text-[#1c1917] border border-[#e7e5e4] font-medium text-xs transition-colors cursor-pointer shadow-xs"
            >
              Explore Capacity Plans
            </a>

            {/* Ingress Endpoint 1-Click Copy Bar */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono text-[#57534e]">
              <span className="text-[10px] uppercase font-bold text-[#78716c] tracking-wider">BASE URL:</span>
              <span className="text-[#1c1917] font-semibold text-xs">https://lightningapi.pro</span>
              <button
                type="button"
                onClick={handleCopyEndpoint}
                className="ml-1 p-0.5 hover:bg-[#f5f2eb] rounded text-[#6d28d9] transition-colors cursor-pointer"
                title="Copy Base URL"
                aria-label="Copy Base URL"
              >
                {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-[#78716c]">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant 60s Key Delivery</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Prompt Logging SLA</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>5-Hour Rolling Replenishment</span>
            </span>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* THE LIVING GATEWAY CIRCUIT (ORIGINAL VISUAL FOCAL POINT)        */}
        {/* ------------------------------------------------------------- */}
        <div id="workflows" className="relative rounded-2xl sm:rounded-3xl border border-[#e7e5e4] bg-white p-4 sm:p-5 lg:p-6 shadow-warm space-y-4">
          
          {/* Top Bar: Visual Circuit Header & Telemetry Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e7e5e4]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#059669] animate-pulse" />
                <h2 className="text-sm sm:text-base font-bold text-[#1c1917] tracking-tight">
                  The Living Gateway Circuit
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
                  DYNAMIC ROUTING TOPOLOGY
                </span>
              </div>
              <p className="text-[11px] text-[#78716c]">
                Click any workflow conduit to route photon telemetry and inspect the live drop-in integration.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#78716c] bg-[#fbf9f5] px-2.5 py-1 rounded-lg border border-[#e7e5e4] self-start sm:self-auto">
              <span>ACTIVE MODEL:</span>
              <span className="text-[#6d28d9] font-bold">{activeWorkflow.modelName}</span>
              <span>·</span>
              <span className="text-emerald-600 font-bold">{activeWorkflow.latencyBadge}</span>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* THE CENTRAL LIGHTNING DYNAMO & 4 RADIATING CONDUIT CARDS      */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-2.5">
            
            {/* The Central Master Ingress Core */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#6d28d9] shadow-warm text-[#1c1917] z-10">
                <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#6d28d9] to-[#8b5cf6] text-white shadow-xs">
                  <Zap className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1c1917]">
                      MASTER INGRESS NODE
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      TLS 1.3 IN-STREAM
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#78716c] block">
                    https://lightningapi.pro/v1
                  </span>
                </div>
              </div>

              {/* Pulsing Energy Radiator Lines on Desktop */}
              <div className="hidden lg:block w-full max-w-3xl h-5 relative -mt-0.5 pointer-events-none" aria-hidden="true">
                <svg className="w-full h-full" viewBox="0 0 800 20" fill="none">
                  {/* Subtle Grid Track Lines */}
                  <path d="M400 0 L100 20" stroke="#e7e5e4" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M400 0 L300 20" stroke="#e7e5e4" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M400 0 L500 20" stroke="#e7e5e4" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M400 0 L700 20" stroke="#e7e5e4" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Active Illuminated Path */}
                  <path 
                    d={
                      activeWorkflowId === 'agentic' ? 'M400 0 L100 20' :
                      activeWorkflowId === 'reasoning' ? 'M400 0 L300 20' :
                      activeWorkflowId === 'thinking' ? 'M400 0 L500 20' : 'M400 0 L700 20'
                    }
                    stroke={activeWorkflow.accent}
                    strokeWidth="2.5"
                    className="transition-all duration-300"
                  />
                </svg>
              </div>
            </div>

            {/* The 4 Conduit Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {WORKFLOWS.map((wf, idx) => {
                const isSelected = activeWorkflowId === wf.id;
                return (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => setActiveWorkflowId(wf.id)}
                    className={`relative p-3 sm:p-3.5 rounded-xl text-left border transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#fbf9f5] border-2 shadow-warm ring-2 ring-offset-1'
                        : 'bg-white border-[#e7e5e4] hover:bg-[#faf8f5] hover:border-[#d6d3d1]'
                    }`}
                    style={{
                      borderColor: isSelected ? wf.accent : undefined,
                    }}
                    aria-pressed={isSelected}
                  >
                    {/* Top Conductor Header */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span 
                        className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: wf.accentLight,
                          color: wf.accent,
                          borderColor: wf.accentBorder,
                        }}
                      >
                        CONDUIT 0{idx + 1}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#78716c] font-semibold">
                          {wf.latencyBadge}
                        </span>
                        <span 
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? wf.accent : '#d6d3d1' }}
                        />
                      </div>
                    </div>

                    {/* Title & Model */}
                    <div className="space-y-0.5 mb-2">
                      <h3 className="text-xs sm:text-sm font-bold text-[#1c1917] tracking-tight group-hover:text-black">
                        {wf.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#78716c]" />
                        <span className="text-[11px] font-semibold text-[#1c1917]">{wf.modelName}</span>
                      </div>
                      <p className="text-[11px] text-[#78716c] line-clamp-2 leading-snug pt-0.5">
                        {wf.description}
                      </p>
                    </div>

                    {/* Footer Badge */}
                    <div className="pt-2 border-t border-[#e7e5e4]/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#78716c] truncate max-w-[120px]">{wf.badge}</span>
                      <span 
                        className="font-bold shrink-0 transition-transform group-hover:translate-x-0.5 text-[11px]"
                        style={{ color: wf.accent }}
                      >
                        {isSelected ? 'Active ●' : 'Select →'}
                      </span>
                    </div>

                    {/* Subtle Active Accent Gradient Fill */}
                    {isSelected && (
                      <div 
                        className="absolute inset-0 rounded-xl pointer-events-none opacity-[0.03]"
                        style={{ backgroundColor: wf.accent }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* THE INTEGRATED DEMONSTRATION WORKBENCH (REALISTIC FEEDBACK)     */}
          {/* ------------------------------------------------------------- */}
          <div className="rounded-xl border border-neutral-800 bg-[#0c0d10] p-3 sm:p-4 text-neutral-200 font-mono shadow-xl space-y-2.5">
            
            {/* Console Masthead */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-800 text-xs">
              
              {/* Left: Active Stream Channel */}
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-neutral-400">INGRESS:</span>
                <span className="font-bold text-white bg-neutral-800 px-1.5 py-0.5 rounded">
                  {activeWorkflow.modelId}
                </span>
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-300">{activeWorkflow.title}</span>
              </div>

              {/* Right: Snippet Switcher & Copy Trigger */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-md p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSnippetMode('cli')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      snippetMode === 'cli' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    CLI Setup
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnippetMode('curl')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      snippetMode === 'curl' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    cURL Request
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="px-2.5 py-1 rounded bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="space-y-1">
              <span className="text-[9px] text-neutral-500 block uppercase tracking-wider">
                {snippetMode === 'cli' ? 'ONE-LINE SHELL CONFIGURATION:' : 'DROP-IN ANTHROPIC COMPATIBLE INGRESS PAYLOAD:'}
              </span>
              <pre className="text-xs text-neutral-100 p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {snippetMode === 'cli' ? activeWorkflow.envCommand : activeWorkflow.sampleCurl}
              </pre>
            </div>

            {/* Live Streaming Delta Simulation (Clearly labeled as demonstration) */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[9px] text-neutral-400">
                <span className="uppercase tracking-wider">
                  VISUAL TELEMETRY SIMULATION (DROP-IN ANTHROPIC VERIFIED)
                </span>
                <span className="text-emerald-400 font-bold">200 OK STREAMING</span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800/60 text-[11px] space-y-1 overflow-x-auto text-neutral-300 font-mono">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeWorkflow.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-0.5"
                  >
                    {activeWorkflow.streamSimulation.map((line, lIdx) => (
                      <div 
                        key={lIdx} 
                        className={`leading-normal ${
                          line.startsWith('+') ? 'text-emerald-400 font-bold' :
                          line.startsWith('✓') ? 'text-emerald-300 font-bold' :
                          line.startsWith('↳') ? 'text-amber-300' :
                          line.startsWith('⚡') ? 'text-purple-300' : 'text-neutral-300'
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Verified Tool Ecosystem Pills */}
            <div className="pt-1.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-neutral-500">VERIFIED ENVIRONMENTS:</span>
                {activeWorkflow.verifiedTools.map((tool) => (
                  <span key={tool} className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px]">
                    {tool}
                  </span>
                ))}
              </div>

              <Link
                to="/docs"
                className="text-[#a78bfa] hover:text-white transition-colors inline-flex items-center gap-1 text-[11px]"
              >
                <span>Read Integration Specs</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
