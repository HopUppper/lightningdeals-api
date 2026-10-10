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
  CheckCircle2,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModelDestination {
  id: string;
  name: string;
  identifier: string;
  badge: string;
  summary: string;
  accent: string;
  accentBg: string;
  borderColor: string;
}

const DESTINATIONS: ModelDestination[] = [
  {
    id: 'sonnet-55',
    name: 'Claude Sonnet 5.5',
    identifier: 'claude-sonnet-5.5',
    badge: 'Flagship Coding',
    summary: 'Multi-file refactoring in Cursor & Claude Code',
    accent: 'text-[#6d28d9]',
    accentBg: 'bg-[#f5f3ff]',
    borderColor: 'border-[#c4b5fd]',
  },
  {
    id: 'opus-55',
    name: 'Claude Opus 5.5',
    identifier: 'claude-opus-5.5',
    badge: 'Deep Reasoning',
    summary: 'Systems architecture & formal logic synthesis',
    accent: 'text-[#2563eb]',
    accentBg: 'bg-[#eff6ff]',
    borderColor: 'border-[#bfdbfe]',
  },
  {
    id: 'fable-5',
    name: 'Claude Fable 5',
    identifier: 'claude-fable-5',
    badge: 'Streaming Velocity',
    summary: 'Low-latency inline completion & git diffs',
    accent: 'text-[#059669]',
    accentBg: 'bg-[#ecfdf5]',
    borderColor: 'border-[#a7f3d0]',
  },
  {
    id: 'opus-thinking',
    name: 'Claude Opus 5 Thinking',
    identifier: 'claude-opus-5-thinking',
    badge: 'Extended Reflection',
    summary: 'Visible internal thinking for kernel invariants',
    accent: 'text-[#ea580c]',
    accentBg: 'bg-[#fff7ed]',
    borderColor: 'border-[#fed7aa]',
  },
];

export const ProductHero: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);
  const [activeModelId, setActiveModelId] = useState<string>('sonnet-55');
  const prefersReducedMotion = useReducedMotion();

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://lightningapi.pro');
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const activeDestination = DESTINATIONS.find(d => d.id === activeModelId) || DESTINATIONS[0];

  return (
    <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24 bg-[#faf8f5] border-b border-[#e7e5e4] font-sans overflow-hidden">
      {/* Subtle Dot Grid Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]" 
        style={{
          backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        aria-hidden="true"
      />

      {/* Soft Ambient Glow */}
      <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-gradient-to-br from-[#6d28d9]/10 via-[#6d28d9]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Balanced Two-Column Grid on Desktop, Natural Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 xl:gap-16 items-center">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: Concise Headline, Benefit & Primary Actions      */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6 text-left">
            
            {/* Editorial Category Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono font-medium text-[#57534e]">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#6d28d9]" />
              <span className="text-[#6d28d9] font-bold">UNIFIED DEVELOPER GATEWAY</span>
              <span className="text-[#d6d3d1]">·</span>
              <span>DROP-IN ANTHROPIC COMPATIBLE</span>
            </div>

            {/* Confident Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold tracking-tight text-[#1c1917] leading-[1.12]">
              Your AI stack,{' '}
              <span className="text-[#6d28d9] inline">beautifully connected.</span>
            </h1>

            {/* Clear Customer-Benefit Supporting Text (Simplified to 2 concise sentences) */}
            <p className="text-base sm:text-lg text-[#57534e] leading-relaxed max-w-xl">
              Access the frontier Claude models your engineering workflow depends on through a single reliable connection. Keep your coding agents and IDE tools moving forward without midday quota freezes.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/trial"
                className="px-5 py-3 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-sm transition-all shadow-plum hover:shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Claim Free 1M Trial</span>
                <ArrowRight className="w-4 h-4 text-purple-200" />
              </Link>

              <Link
                to="/models"
                className="px-4 py-3 rounded-xl bg-white hover:bg-[#f5f2eb] text-[#1c1917] border border-[#e7e5e4] font-semibold text-sm transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-[#78716c]" />
                <span>Explore Model Catalog</span>
              </Link>
            </div>

            {/* Ingress Endpoint 1-Click Copy Bar */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e7e5e4] shadow-xs text-xs font-mono text-[#57534e]">
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

            {/* Evidence-Based Trust Guarantees */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 pt-1 text-xs text-[#78716c]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Key Issuance</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Prompt Logging SLA</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>5-Hour Rolling Pool</span>
              </span>
            </div>

          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: Polished, Uncluttered Gateway Visualization     */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="relative rounded-3xl border border-[#e7e5e4] bg-white p-6 sm:p-7 shadow-warm space-y-4">
              
              {/* Visual Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#e7e5e4]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#f5f3ff] border border-[#c4b5fd] flex items-center justify-center text-[#6d28d9]">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1c1917] tracking-tight">
                      LightningAPI Gateway
                    </h3>
                    <span className="text-[10px] font-mono text-[#78716c] block">
                      Drop-in Anthropic connection
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Single Master Key</span>
                </div>
              </div>

              {/* Subtle Lightweight Connection Graphic */}
              <div className="relative py-1 flex items-center justify-center" aria-hidden="true">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c4b5fd] to-transparent" />
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute w-2 h-2 rounded-full bg-[#6d28d9] shadow-[0_0_8px_#6d28d9]"
                    animate={{ x: [-100, 100] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  />
                )}
              </div>

              {/* Verified Destination Model Cards Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#78716c] px-0.5">
                  <span>VERIFIED DESTINATIONS</span>
                  <span className="text-[10px] text-[#6d28d9]">Select to preview</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DESTINATIONS.map((dest) => {
                    const isSelected = activeModelId === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setActiveModelId(dest.id)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative ${
                          isSelected
                            ? `bg-white ${dest.borderColor} shadow-md ring-2 ring-[#6d28d9]/15`
                            : 'bg-[#faf8f5]/80 border-[#e7e5e4] hover:bg-white hover:border-[#d6d3d1]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 pb-1">
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${dest.accentBg} ${dest.accent}`}>
                            {dest.badge}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#1c1917] tracking-tight pt-0.5">
                          {dest.name}
                        </h4>
                        <p className="text-[11px] text-[#57534e] line-clamp-2 pt-1 leading-snug">
                          {dest.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Concise Route Indicator */}
              <div className="p-3 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[#6d28d9] font-bold shrink-0">Selected:</span>
                  <code className="font-mono text-xs font-semibold text-[#1c1917] bg-white px-2 py-0.5 rounded border border-[#e7e5e4] truncate">
                    {activeDestination.identifier}
                  </code>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  Drop-In Ready
                </span>
              </div>

              {/* Clean Footer Link */}
              <div className="flex items-center justify-between pt-1 border-t border-[#f0eee9] text-xs">
                <span className="text-[11px] text-[#78716c]">
                  All 10 Claude models accessible via one key
                </span>
                <Link
                  to="/models"
                  className="font-bold text-[#6d28d9] hover:text-[#581c87] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Model Directory</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
