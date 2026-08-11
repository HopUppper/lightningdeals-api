import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Check, Copy, Server, Sparkles, Cpu, Layers, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const baseUrl = 'https://lightningapi.pro/v1';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border bg-bg hero-grid">
      <div className="max-w-page mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border text-xs font-mono font-bold text-fg shadow-xs">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="uppercase text-[11px] tracking-wider text-muted">● CLAUDE FABLE 5 & SONNET 5 ARE LIVE</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-fg leading-[1.08]">
              One base URL. <br />
              <span className="text-amber-500">The entire Claude lineup.</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-muted font-normal leading-relaxed max-w-xl">
              Drop-in Anthropic API gateway for Claude Code CLI, Cursor, Windsurf, and VS Code. Point your existing client to our endpoint — same SDK, same request shape, zero code changes required.
            </p>

            {/* Side-by-Side CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/trial" className="ui-button-primary text-sm px-6 py-3 font-bold gap-2">
                <span>Claim Free 1M Token Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/docs" className="ui-button-secondary text-sm px-6 py-3 font-semibold gap-2">
                <span>Read Setup Guide</span>
              </Link>
            </div>

            {/* Copyable Base-URL Box */}
            <div className="pt-2 max-w-md">
              <div className="flex items-center border border-border bg-white rounded-panel overflow-hidden shadow-xs">
                <span className="flex shrink-0 items-center border-r border-border px-3.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50">
                  <Server className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  BASE URL
                </span>
                <code className="flex-1 overflow-x-auto whitespace-nowrap px-3.5 py-2.5 font-mono text-xs font-semibold text-fg">
                  {baseUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex shrink-0 items-center border-l border-border px-3.5 py-2.5 text-muted hover:text-fg hover:bg-subtle transition-colors"
                  title="Copy base URL"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {/* Right Floating Spec Cards */}
          <div className="lg:col-span-5 relative">
            <div className="space-y-4">
              
              {/* Spec Card 1 */}
              <div className="bg-white border border-border rounded-panel p-4 shadow-sm hover:shadow-md transition-shadow relative transform lg:-rotate-1">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span className="font-mono font-bold text-xs text-fg">claude-sonnet-5</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 text-[11px] font-mono">
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Context</span>
                    <span className="font-bold text-fg">1,000,000</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Tools</span>
                    <span className="font-bold text-fg">Web & Image</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Latency</span>
                    <span className="font-bold text-emerald-600">&lt;45ms</span>
                  </div>
                </div>
              </div>

              {/* Spec Card 2 */}
              <div className="bg-white border border-border rounded-panel p-4 shadow-sm hover:shadow-md transition-shadow relative lg:translate-x-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-mono font-bold text-xs text-fg">claude-fable-5</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    High Speed
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 text-[11px] font-mono">
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Reasoning</span>
                    <span className="font-bold text-fg">Ultra Fast</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Max Tokens</span>
                    <span className="font-bold text-fg">200k Output</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Window</span>
                    <span className="font-bold text-fg">5h Rolling</span>
                  </div>
                </div>
              </div>

              {/* Spec Card 3 */}
              <div className="bg-white border border-border rounded-panel p-4 shadow-sm hover:shadow-md transition-shadow relative transform lg:rotate-1">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span className="font-mono font-bold text-xs text-fg">claude-opus-5</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    Deep Intelligence
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 text-[11px] font-mono">
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Protocol</span>
                    <span className="font-bold text-fg">Anthropic /v1</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">IDE</span>
                    <span className="font-bold text-fg">Cursor/CLI</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Status</span>
                    <span className="font-bold text-emerald-600">100% Up</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom-of-hero Stat Strip */}
        <div className="mt-16 pt-8 border-t border-border/80 grid grid-cols-3 gap-6 text-left font-mono">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-fg block tracking-tight">13</span>
            <span className="text-xs text-muted font-sans font-medium">models, one endpoint</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-fg block tracking-tight">1M</span>
            <span className="text-xs text-muted font-sans font-medium">token context, up to</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-fg block tracking-tight">Prepaid</span>
            <span className="text-xs text-muted font-sans font-medium">tokens, no subscription</span>
          </div>
        </div>

      </div>
    </section>
  );
};
