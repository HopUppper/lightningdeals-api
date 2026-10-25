import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Copy, Check, Terminal, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditorialHero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://lightningapi.pro');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    const demoElement = document.getElementById('gateway-demo');
    if (demoElement) {
      demoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = 'gateway-demo';
    }
  };

  return (
    <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-24 lg:pb-32 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      {/* Background Architectural Canvas Grid Lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#191719 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      {/* Signature Electric Violet Line Transition Across Composition */}
      <div
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7136E8]/30 to-transparent"
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ============================================================ */}
        {/* TOP TECHNICAL ANNOTATIONS (Restrained edge telemetry)         */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.4 }}
          className="flex flex-wrap items-center justify-between gap-4 pb-8 sm:pb-12 border-b border-[#E6E1E8]/70"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#7136E8]">
              ONE GATEWAY. A WORLD OF MODELS.
            </span>
          </div>

          {/* Technical Edge Annotations */}
          <div className="hidden sm:flex items-center gap-6 text-[11px] font-mono text-[#68636B]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
              <span>TLS 1.3 IN-STREAM</span>
            </span>
            <span className="text-[#E6E1E8]">/</span>
            <span>ANTHROPIC /V1 COMPATIBLE</span>
            <span className="text-[#E6E1E8]">/</span>
            <span className="text-[#191719] font-medium">SUB-50MS LATENCY</span>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* SIGNATURE EDITORIAL HEADLINE (Dominates Visual Attention)     */}
        {/* ============================================================ */}
        <div className="pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-8">
          <motion.h1
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: 0.1 }}
            className="hero-headline text-[#191719] font-display max-w-5xl text-left"
          >
            Intelligence,{' '}
            <br className="hidden sm:inline" />
            <span className="relative inline-block text-[#191719]">
              without the friction.
              {/* Subtle deliberate violet baseline accent */}
              <span
                className="absolute bottom-1 sm:bottom-2 left-0 w-full h-[3px] sm:h-[4px] bg-[#7136E8]/35 rounded-full -z-10"
                aria-hidden="true"
              />
            </span>
          </motion.h1>
        </div>

        {/* ============================================================ */}
        {/* SUPPORTING NARRATIVE & PRIMARY CALLS TO ACTION                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-2">
          
          {/* Left Column: Narrative Copy */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: 0.2 }}
            className="lg:col-span-7 xl:col-span-8 space-y-6"
          >
            <p className="text-base sm:text-lg lg:text-[1.18rem] text-[#68636B] leading-relaxed max-w-2xl text-left">
              Access supported AI models through one unified API connection. Keep your development
              workflow focused on building, not managing multiple integrations.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#gateway-demo"
                onClick={handleScrollToDemo}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[12px] bg-[#7136E8] hover:bg-[#4F21B5] text-white text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Explore the Gateway</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                to="/docs"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[12px] bg-white hover:bg-black/[0.03] text-[#191719] border border-[#E6E1E8] text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <span>Read the Documentation</span>
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Base URL & Ingress Telemetry Box */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: 0.3 }}
            className="lg:col-span-5 xl:col-span-4"
          >
            <div className="p-4 sm:p-5 rounded-[14px] bg-white border border-[#E6E1E8] shadow-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#68636B]">
                <span className="uppercase tracking-wider font-semibold">GATEWAY INGRESS BASE URL</span>
                <span className="flex items-center gap-1 text-[#087F5B] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
                  ACTIVE
                </span>
              </div>

              {/* Endpoint with 1-Click Copy */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8] font-mono text-xs text-[#191719]">
                <span className="select-all truncate">https://lightningapi.pro</span>
                <button
                  type="button"
                  onClick={handleCopyEndpoint}
                  className="p-1 rounded text-[#7136E8] hover:bg-black/[0.05] transition-colors shrink-0 cursor-pointer"
                  title="Copy Gateway Endpoint URL"
                  aria-label="Copy Gateway Endpoint URL"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#087F5B]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#68636B] pt-1">
                <span>Default Port: 443 (HTTPS)</span>
                <span>Format: Anthropic /v1</span>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
