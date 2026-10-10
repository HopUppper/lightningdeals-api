import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Terminal,
  Code2,
  Workflow,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface GatewayBranch {
  id: string;
  name: string;
  modelIdentifier: string;
  tagline: string;
  contextWindow: string;
  recommendedFor: string;
  color: string;
  borderColor: string;
  bgColor: string;
  pillColor: string;
}

const GATEWAY_BRANCHES: GatewayBranch[] = [
  {
    id: 'opus-55',
    name: 'Claude Opus 5.5',
    modelIdentifier: 'claude-opus-5.5',
    tagline: 'Deep Cognitive Reasoning & Architecture',
    contextWindow: '1,000,000 tokens',
    recommendedFor: 'Complex systems, formal proofs & theorem solving',
    color: 'text-[#2563eb]',
    borderColor: 'border-[#bfdbfe]',
    bgColor: 'bg-[#eff6ff]',
    pillColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'sonnet-55',
    name: 'Claude Sonnet 5.5',
    modelIdentifier: 'claude-sonnet-5.5',
    tagline: 'Flagship Autonomous Coding & Refactoring',
    contextWindow: '1,000,000 tokens',
    recommendedFor: 'Cursor Composer, Windsurf & Claude Code CLI',
    color: 'text-[#6d28d9]',
    borderColor: 'border-[#c4b5fd]',
    bgColor: 'bg-[#f5f3ff]',
    pillColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'fable-5',
    name: 'Claude Fable 5',
    modelIdentifier: 'claude-fable-5',
    tagline: 'Ultra-Fast Response & Streaming Velocity',
    contextWindow: '1,000,000 tokens',
    recommendedFor: 'Interactive IDE autocompletion & CI/CD bots',
    color: 'text-[#059669]',
    borderColor: 'border-[#a7f3d0]',
    bgColor: 'bg-[#ecfdf5]',
    pillColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'opus-thinking',
    name: 'Claude Opus 5 Extended Thinking',
    modelIdentifier: 'claude-opus-5-thinking',
    tagline: 'Auditable Deliberation with Visible Reflection',
    contextWindow: '1,000,000 tokens',
    recommendedFor: 'Kernel invariants, security audits & edge cases',
    color: 'text-[#ea580c]',
    borderColor: 'border-[#fed7aa]',
    bgColor: 'bg-[#fff7ed]',
    pillColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'haiku-55',
    name: 'Claude Haiku 5.5',
    modelIdentifier: 'claude-haiku-5.5',
    tagline: 'High-Concurrency Lightweight Routing',
    contextWindow: '1,000,000 tokens',
    recommendedFor: 'High-volume text triage & parallel classification',
    color: 'text-[#0891b2]',
    borderColor: 'border-[#a5f3fc]',
    bgColor: 'bg-[#ecfeff]',
    pillColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
];

export const ProductHero: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('sonnet-55');
  const prefersReducedMotion = useReducedMotion();

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://lightningapi.pro');
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const activeBranch = GATEWAY_BRANCHES.find(b => b.id === selectedBranch) || GATEWAY_BRANCHES[1];

  return (
    <section className="relative pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans overflow-hidden">
      {/* Subtle Architectural Dot Matrix Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]" 
        style={{
          backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        aria-hidden="true"
      />

      {/* Warm Ambient Gradients */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#6d28d9]/10 via-[#6d28d9]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Masthead Section A */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          
          {/* Editorial Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
            <span className="flex h-2 w-2 rounded-full bg-[#6d28d9] animate-pulse" />
            <span className="text-[#6d28d9] font-bold">UNIFIED DEVELOPER GATEWAY</span>
            <span className="text-[#d6d3d1]">·</span>
            <span>ANTHROPIC CLAUDE ECOSYSTEM</span>
          </div>

          {/* Monumental Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1c1917] leading-[1.1]">
            One API.{' '}
            <span className="text-[#6d28d9] inline-block">
              Access to the models that move your work forward.
            </span>
          </h1>

          {/* Supporting Value Proposition Copy */}
          <p className="text-sm sm:text-base md:text-lg text-[#57534e] max-w-2xl mx-auto leading-relaxed">
            A single drop-in Anthropic endpoint (<code className="px-1.5 py-0.5 rounded bg-white border border-[#e7e5e4] font-mono text-xs text-[#1c1917]">/v1/messages</code>) routing seamlessly to Claude Opus 5.5, Sonnet 5.5, and Fable 5. Backed by automatic 5-hour rolling token renewal and zero disk-retention security.
          </p>

          {/* Dual CTAs & Base URL Copy Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/trial"
              className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-sm transition-all shadow-plum hover:shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Claim Free 1M Trial</span>
              <ArrowRight className="w-4 h-4 text-purple-200" />
            </Link>

            <Link
              to="/models"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#f5f2eb] text-[#1c1917] border border-[#e7e5e4] font-semibold text-sm transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#78716c]" />
              <span>Explore Model Catalog</span>
            </Link>

            {/* Ingress Endpoint 1-Click Copy Bar */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono text-[#57534e]">
              <span className="text-[10px] uppercase font-bold text-[#78716c] tracking-wider">BASE URL:</span>
              <span className="text-[#1c1917] font-semibold">https://lightningapi.pro</span>
              <button
                type="button"
                onClick={handleCopyEndpoint}
                className="ml-1 p-1 hover:bg-[#f5f2eb] rounded text-[#6d28d9] transition-colors cursor-pointer"
                title="Copy Base URL"
                aria-label="Copy Base URL"
              >
                {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Verified Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-1 text-xs text-[#78716c]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant 60s Key Issuance</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Disk-Retention Security</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>5-Hour Rolling Replenishment</span>
            </span>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* SOPHISTICATED GATEWAY BRANCHING VISUAL (SECTION A FOCAL PIECE)  */}
        {/* ------------------------------------------------------------- */}
        <div className="relative rounded-3xl border border-[#e7e5e4] bg-white p-5 sm:p-8 lg:p-10 shadow-warm">
          
          {/* Top Label & Telemetry Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e7e5e4] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f5f3ff] border border-[#c4b5fd] flex items-center justify-center text-[#6d28d9]">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] font-semibold block">
                  ARCHITECTURE SCHEMATIC
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#1c1917] tracking-tight">
                  One Ingress Hub · Five Specialised Frontier Conduits
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-[#57534e] bg-[#fbf9f5] px-3 py-1.5 rounded-lg border border-[#e7e5e4]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Gateway Live: TLS 1.3 · Volatile RAM Buffer</span>
            </div>
          </div>

          {/* Schematic Content: Left Entry -> Center Hub -> Right Branching Models */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center pt-6">
            
            {/* Left 4 Cols: Developer Entry Ingress & Configuration */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-[#e7e5e4] bg-[#fbf9f5] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#6d28d9] uppercase tracking-wider">
                    DEVELOPER INGRESS
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#e7e5e4] text-[#78716c]">
                    HTTP / 2 POST
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#e7e5e4] font-mono text-xs text-[#1c1917] space-y-1 overflow-x-auto">
                  <div className="text-[#78716c] text-[10px]">// Universal Anthropic Target</div>
                  <div><span className="text-[#6d28d9] font-semibold">https://lightningapi.pro</span>/v1/messages</div>
                  <div className="text-[11px] text-[#57534e] pt-1">
                    <span className="text-[#059669]">x-api-key:</span> <span className="text-[#78716c]">ld_live_...</span>
                  </div>
                </div>
                <p className="text-xs text-[#57534e] leading-relaxed">
                  Point any Anthropic client, Cursor, Claude Code, or Windsurf directly to LightningAPI. Zero code adaptations or custom schemas needed.
                </p>
              </div>

              {/* Ingress Features */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4] text-[#57534e]">
                  <div className="text-[10px] text-[#78716c] uppercase">AUTH PROTOCOL</div>
                  <div className="font-semibold text-[#1c1917] pt-0.5">Anthropic Bearer & Header</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#fdfbf7] border border-[#e7e5e4] text-[#57534e]">
                  <div className="text-[10px] text-[#78716c] uppercase">STREAM PROTOCOL</div>
                  <div className="font-semibold text-[#1c1917] pt-0.5">Native SSE Chunking</div>
                </div>
              </div>
            </div>

            {/* Center 1 Col (Desktop): Visual Ingress Node */}
            <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#6d28d9] text-white flex items-center justify-center shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#78716c] rotate-90 my-2">
                  DISPATCH
                </span>
              </div>
            </div>

            {/* Right 7 Cols: Interactive Branching Model Cards */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-mono font-bold text-[#78716c] uppercase tracking-wider">
                  SELECT A CONDUIT TO INSPECT ROUTING:
                </span>
                <span className="text-[11px] font-mono text-[#6d28d9] font-medium">
                  {GATEWAY_BRANCHES.length} Models Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {GATEWAY_BRANCHES.map((branch) => {
                  const isSelected = selectedBranch === branch.id;
                  return (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.id)}
                      className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                        isSelected
                          ? `bg-white ${branch.borderColor} shadow-md ring-2 ring-[#6d28d9]/15`
                          : 'bg-[#faf8f5]/80 border-[#e7e5e4] hover:bg-white hover:border-[#d6d3d1]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#6d28d9]' : 'bg-[#a8a29e]'}`} />
                            <h3 className="text-sm font-bold text-[#1c1917] tracking-tight">
                              {branch.name}
                            </h3>
                          </div>
                          <span className="text-[10px] font-mono text-[#78716c] block pt-0.5">
                            {branch.modelIdentifier}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${branch.pillColor}`}>
                          1M Context
                        </span>
                      </div>
                      <p className="text-[11px] text-[#57534e] line-clamp-2 pt-2 leading-snug">
                        {branch.recommendedFor}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Active Branch Dynamic Summary Ribbon */}
              <div className={`mt-3 p-3.5 rounded-2xl border ${activeBranch.borderColor} ${activeBranch.bgColor} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors`}>
                <div className="space-y-0.5">
                  <div className="font-bold text-[#1c1917] flex items-center gap-1.5">
                    <span className={activeBranch.color}>●</span>
                    <span>Routing Request: <code className="font-mono text-xs">{activeBranch.modelIdentifier}</code></span>
                  </div>
                  <p className="text-[#57534e] text-xs">
                    {activeBranch.tagline}
                  </p>
                </div>
                <Link
                  to="/models"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#6d28d9] hover:text-[#581c87] shrink-0 self-start sm:self-auto"
                >
                  <span>Model Specs</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
