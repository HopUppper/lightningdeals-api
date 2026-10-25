import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Copy, Check, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditorialHero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://lightningapi.pro');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScrollToFlow = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('rolling-pool');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = 'rolling-pool';
    }
  };

  return (
    <section className="relative pt-12 pb-24 sm:pt-16 sm:pb-32 lg:pt-24 lg:pb-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      {/* Background Architectural Canvas Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#191719 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* Signature Electric Violet Line Transition Across Composition */}
      <div
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7136E8]/40 to-transparent"
        aria-hidden="true"
      />

      {/* Ambient Violet Diffusion behind Ribbon Artwork */}
      <div
        className="absolute top-1/4 right-0 w-[620px] h-[620px] bg-gradient-to-br from-[#7136E8]/12 via-[#EEE6FF]/30 to-transparent rounded-full blur-[140px] pointer-events-none -z-0"
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 z-10">
        
        {/* ============================================================ */}
        {/* TOP TECHNICAL ANNOTATIONS (Restrained edge telemetry)         */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.4 }}
          className="flex flex-wrap items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-[#E6E1E8]"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-[#7136E8]">
              THE INTELLIGENCE LAYER
            </span>
          </div>

          {/* Technical Edge Annotations */}
          <div className="hidden sm:flex items-center gap-6 text-[11px] font-mono text-[#68636B]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
              <span>TLS 1.3 INGRESS</span>
            </span>
            <span className="text-[#E6E1E8]">/</span>
            <span>ANTHROPIC /V1 MESSAGES</span>
            <span className="text-[#E6E1E8]">/</span>
            <span className="text-[#191719] font-medium">CONTINUOUS 5-HOUR POOL</span>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* ASYMMETRICAL EDITORIAL COMPOSITION (Typography & Ribbon Art)  */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Dominant Editorial Typography (7 Cols) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Signature Editorial Headline */}
            <motion.h1
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.5 }}
              className="hero-headline text-[#191719] font-display max-w-2xl tracking-tight"
            >
              Intelligence,{' '}
              <br className="hidden sm:inline" />
              <span className="relative inline-block text-[#191719]">
                without the friction.
                <span
                  className="absolute bottom-1 sm:bottom-2 left-0 w-full h-[3px] sm:h-[4px] bg-[#7136E8]/35 rounded-full -z-10"
                  aria-hidden="true"
                />
              </span>
            </motion.h1>

            {/* Narrative Copy */}
            <motion.p
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: 0.1 }}
              className="text-base sm:text-lg lg:text-[1.16rem] text-[#68636B] leading-relaxed max-w-xl font-normal"
            >
              A unified API gateway connecting your development workflow directly to supported frontier
              models through a drop-in Anthropic connection with continuous rolling quota renewal.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[12px] bg-[#7136E8] hover:bg-[#4F21B5] text-white text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#rolling-pool"
                onClick={handleScrollToFlow}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[12px] bg-white hover:bg-black/[0.03] text-[#191719] border border-[#E6E1E8] text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-[#7136E8] text-[#7136E8]" />
                <span>Explore the Flow</span>
              </a>
            </motion.div>

            {/* Ingress Gateway Pill with 1-Click Copy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.4, delay: 0.2 }}
              className="pt-2 max-w-md"
            >
              <div className="flex items-center justify-between gap-3 p-3 rounded-[12px] bg-white border border-[#E6E1E8] shadow-2xs font-mono text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse shrink-0" />
                  <span className="text-[#68636B] shrink-0 font-medium">INGRESS:</span>
                  <span className="text-[#191719] font-semibold truncate select-all">https://lightningapi.pro</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEndpoint}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#7136E8] hover:bg-[#EEE6FF] transition-colors shrink-0 cursor-pointer"
                  title="Copy base URL"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#087F5B]" />
                      <span className="text-[#087F5B]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Signature Flowing Ribbon Artwork (5 Cols) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.65, delay: 0.15 }}
              className="relative w-full max-w-[500px] aspect-square flex items-center justify-center"
            >
              {/* Studio Flowing Ribbon Canvas (Custom SVG Graphic) */}
              <svg
                viewBox="0 0 500 500"
                className="w-full h-full select-none overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Fluid Electric Violet Gradient */}
                  <linearGradient id="ribbonMainGradient" x1="0%" y1="20%" x2="100%" y2="80%">
                    <stop offset="0%" stopColor="#7136E8" stopOpacity="0.1" />
                    <stop offset="35%" stopColor="#7136E8" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#9D6BFF" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#4F21B5" stopOpacity="0.2" />
                  </linearGradient>

                  {/* Secondary Harmonic Gradient */}
                  <linearGradient id="ribbonHarmonicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9D6BFF" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#7136E8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#EEE6FF" stopOpacity="0.1" />
                  </linearGradient>

                  {/* Gateway Aperture Gradient */}
                  <radialGradient id="apertureGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7136E8" stopOpacity="0.25" />
                    <stop offset="60%" stopColor="#7136E8" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#7136E8" stopOpacity="0" />
                  </radialGradient>

                  {/* Subtle Filter for Floating Light Embers */}
                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Soft Ambient Radial Light Behind Gateway Aperture */}
                <circle cx="250" cy="250" r="140" fill="url(#apertureGlow)" />

                {/* Background Geometric Coordinate Circles (Subtle studio guides) */}
                <circle
                  cx="250"
                  cy="250"
                  r="180"
                  fill="none"
                  stroke="#E6E1E8"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  opacity="0.6"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="110"
                  fill="none"
                  stroke="#E6E1E8"
                  strokeWidth="1"
                  strokeDasharray="2 6"
                  opacity="0.4"
                />

                {/* ======================================================== */}
                {/* FLOWING VIOLET RIBBON PATHS                              */}
                {/* ======================================================== */}
                
                {/* Path 1: Harmonic Background Wave */}
                <path
                  d="M 40 310 C 130 350, 180 180, 250 250 C 320 320, 380 150, 470 190"
                  fill="none"
                  stroke="url(#ribbonHarmonicGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Path 2: Primary Sculptural Ribbon (Splits and Weaves) */}
                <path
                  d="M 30 250 C 120 180, 160 320, 250 250 C 340 180, 390 310, 470 230"
                  fill="none"
                  stroke="url(#ribbonMainGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                />

                {/* Path 3: Refracted Upper Arc (Emerging towards Frontier Models) */}
                <path
                  d="M 250 250 C 290 190, 350 110, 440 90"
                  fill="none"
                  stroke="url(#ribbonMainGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                  opacity="0.8"
                />

                {/* Path 4: Refracted Lower Arc (High-Velocity Stream) */}
                <path
                  d="M 250 250 C 310 290, 360 380, 450 370"
                  fill="none"
                  stroke="url(#ribbonHarmonicGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                  opacity="0.7"
                />

                {/* ======================================================== */}
                {/* ANIMATED PULSE PARTICLES (Graceful Flow Along Splines)   */}
                {/* ======================================================== */}
                {!prefersReducedMotion && (
                  <>
                    {/* Primary Pulse Entering Gateway */}
                    <circle r="4" fill="#7136E8" filter="url(#softGlow)">
                      <animateMotion
                        path="M 30 250 C 120 180, 160 320, 250 250 C 340 180, 390 310, 470 230"
                        dur="5s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Secondary Pulse Offset along Upper Arc */}
                    <circle r="3" fill="#A77DFF" filter="url(#softGlow)">
                      <animateMotion
                        path="M 250 250 C 290 190, 350 110, 440 90"
                        dur="3.8s"
                        begin="1.2s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Returning Response Particle (Emerald Shimmer) */}
                    <circle r="3" fill="#087F5B" filter="url(#softGlow)">
                      <animateMotion
                        path="M 470 230 C 390 310, 340 180, 250 250 C 160 320, 120 180, 30 250"
                        dur="5s"
                        begin="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                {/* ======================================================== */}
                {/* CENTRAL SCULPTURAL GATEWAY APERTURE                      */}
                {/* ======================================================== */}
                {/* Outer Glass Ring */}
                <circle
                  cx="250"
                  cy="250"
                  r="52"
                  fill="#FFFFFF"
                  stroke="#E6E1E8"
                  strokeWidth="2"
                  className="shadow-sm"
                />
                {/* Violet Core Ring */}
                <circle
                  cx="250"
                  cy="250"
                  r="40"
                  fill="#EEE6FF"
                  stroke="#7136E8"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                {/* Sculptural Aperture Symbol */}
                <circle cx="250" cy="250" r="14" fill="#7136E8" />
                <circle cx="250" cy="250" r="6" fill="#FFFFFF" />

                {/* Central Status Annotation */}
                <text
                  x="250"
                  y="322"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#191719"
                  fontFamily="monospace"
                  letterSpacing="0.1em"
                >
                  LIGHTNINGAPI
                </text>
                <text
                  x="250"
                  y="336"
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#7136E8"
                  fontFamily="monospace"
                >
                  Unified Gateway Core
                </text>

                {/* Model Terminal Nodes (Right side convergence points) */}
                <g transform="translate(440, 90)">
                  <circle cx="0" cy="0" r="4" fill="#7136E8" />
                  <circle cx="0" cy="0" r="9" fill="none" stroke="#7136E8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="14" y="3" fontSize="9" fontWeight="bold" fill="#191719" fontFamily="monospace">
                    Sonnet 5.5
                  </text>
                </g>

                <g transform="translate(470, 230)">
                  <circle cx="0" cy="0" r="4" fill="#7136E8" />
                  <circle cx="0" cy="0" r="9" fill="none" stroke="#7136E8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="14" y="3" fontSize="9" fontWeight="bold" fill="#191719" fontFamily="monospace">
                    Opus 5.5
                  </text>
                </g>

                <g transform="translate(450, 370)">
                  <circle cx="0" cy="0" r="4" fill="#7136E8" />
                  <circle cx="0" cy="0" r="9" fill="none" stroke="#7136E8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="14" y="3" fontSize="9" fontWeight="bold" fill="#191719" fontFamily="monospace">
                    Haiku 5.5
                  </text>
                </g>

                {/* Client Ingress Origin (Left side) */}
                <g transform="translate(30, 250)">
                  <circle cx="0" cy="0" r="4" fill="#191719" />
                  <circle cx="0" cy="0" r="8" fill="none" stroke="#191719" strokeWidth="1" opacity="0.3" />
                  <text x="-10" y="-12" textAnchor="end" fontSize="9" fontWeight="bold" fill="#68636B" fontFamily="monospace">
                    Client Ingress
                  </text>
                </g>
              </svg>

              {/* Discreet Edge Indicator */}
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-xs border border-[#E6E1E8] text-[10px] font-mono text-[#68636B] shadow-2xs">
                <span>Continuous In-Stream Flow</span>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};
