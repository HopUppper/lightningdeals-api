import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Check, Copy, Server, Sparkles, Cpu, Layers, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThreeDCard } from './ThreeDCard';

export const HeroSection: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const baseUrl = 'https://lightningapi.pro/v1';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border bg-bg hero-grid-3d">
      
      {/* Background Animated Gradient Glowing Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.12, 0.25, 0.12],
          rotate: [0, 45, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
          rotate: [0, -45, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500 via-indigo-600 to-violet-600 blur-3xl pointer-events-none"
      />

      <div className="max-w-page mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Announcement Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-violet-200/80 text-xs font-mono font-bold text-fg shadow-xs backdrop-blur-md"
            >
              <span className="h-2 w-2 rounded-full bg-violet-600 animate-ping" />
              <span className="uppercase text-[11px] tracking-wider text-violet-700">● CLAUDE FABLE 5 & SONNET 5 ARE LIVE</span>
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            </motion.div>

            {/* 3D Animated Gradient Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-fg leading-[1.08]"
            >
              One base URL. <br />
              <span className="animated-gradient-text">The entire Claude lineup.</span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-muted font-normal leading-relaxed max-w-xl"
            >
              Drop-in Anthropic API gateway for Claude Code CLI, Cursor, Windsurf, and VS Code. Point your existing client to our endpoint — same SDK, same request shape, zero code changes required.
            </motion.p>

            {/* Side-by-Side CTAs with Shimmer Animations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto"
            >
              <Link to="/trial" className="ui-button-primary text-sm px-6 py-3.5 font-bold gap-2 justify-center w-full sm:w-auto text-center shadow-md">
                <span>Claim Free 1M Token Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/docs" className="ui-button-secondary text-sm px-6 py-3.5 font-semibold gap-2 justify-center w-full sm:w-auto text-center">
                <span>Read Setup Guide</span>
              </Link>
            </motion.div>

            {/* Copyable Base-URL Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-2 max-w-md"
            >
              <div className="flex items-center border border-violet-200/80 bg-white/90 rounded-panel overflow-hidden shadow-xs backdrop-blur-md hover:border-violet-400 transition-colors">
                <span className="flex shrink-0 items-center border-r border-violet-200/80 px-3.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50">
                  <Server className="w-3.5 h-3.5 mr-1.5 text-violet-600" />
                  BASE URL
                </span>
                <code className="flex-1 overflow-x-auto whitespace-nowrap px-3.5 py-2.5 font-mono text-xs font-semibold text-fg">
                  {baseUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex shrink-0 items-center border-l border-violet-200/80 px-3.5 py-2.5 text-muted hover:text-violet-600 hover:bg-violet-50 transition-colors"
                  title="Copy base URL"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

          </div>

          {/* Right 3D Perspective Spec Cards Deck */}
          <div className="lg:col-span-5 relative space-y-4">
            
            {/* 3D Card 1 */}
            <ThreeDCard intensity={12}>
              <div className="glass-3d-card rounded-panel p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-violet-600" />
                    <span className="font-mono font-bold text-xs text-fg">claude-sonnet-5</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200">
                    Active Gateway
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Context</span>
                    <span className="font-bold text-fg">1,000,000</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Tools</span>
                    <span className="font-bold text-fg">Web & Vision</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Latency</span>
                    <span className="font-bold text-emerald-600">&lt;45ms</span>
                  </div>
                </div>
              </div>
            </ThreeDCard>

            {/* 3D Card 2 */}
            <ThreeDCard intensity={15}>
              <div className="glass-3d-card rounded-panel p-5 space-y-3 border-cyan-200">
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-600 fill-cyan-600" />
                    <span className="font-mono font-bold text-xs text-fg">claude-fable-5</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-50 text-cyan-700 border border-cyan-200">
                    High Speed
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Reasoning</span>
                    <span className="font-bold text-fg">Sub-Second</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Max Tokens</span>
                    <span className="font-bold text-fg">200k Output</span>
                  </div>
                  <div>
                    <span className="text-muted block text-[9px] uppercase">Window</span>
                    <span className="font-bold text-violet-600">5h Rolling</span>
                  </div>
                </div>
              </div>
            </ThreeDCard>

            {/* 3D Card 3 */}
            <ThreeDCard intensity={10}>
              <div className="glass-3d-card rounded-panel p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="font-mono font-bold text-xs text-fg">claude-opus-5</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Deep Intelligence
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
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
            </ThreeDCard>

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
