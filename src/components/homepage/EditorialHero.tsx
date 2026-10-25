import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Copy, Check, Play, ShieldCheck, Zap, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditorialHero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://lightningapi.pro');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScrollToRollingPool = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('rolling-pool');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = 'rolling-pool';
    }
  };

  return (
    <section className="relative pt-10 pb-20 sm:pt-14 sm:pb-24 lg:pt-20 lg:pb-32 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      {/* Background Architectural Grid */}
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
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#7136E8]/35 to-transparent"
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        
        {/* ============================================================ */}
        {/* TOP TECHNICAL ANNOTATIONS (Restrained edge telemetry)         */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.4 }}
          className="flex flex-wrap items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-[#E6E1E8]/80"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#7136E8]">
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
            <span>ANTHROPIC /V1 COMPATIBLE</span>
            <span className="text-[#E6E1E8]">/</span>
            <span className="text-[#191719] font-medium">CONTINUOUS 5-HOUR POOL</span>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* ASYMMETRICAL TWO-COLUMN HERO COMPOSITION                      */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Typography, Narrative, & CTAs (7 Cols) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-8 text-left">
            
            {/* Signature Editorial Headline */}
            <motion.h1
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.45 }}
              className="hero-headline text-[#191719] font-display max-w-3xl"
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

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.45, delay: 0.1 }}
              className="text-base sm:text-lg lg:text-[1.14rem] text-[#68636B] leading-relaxed max-w-xl"
            >
              A unified API gateway connecting your development workflow directly to supported frontier
              AI models through a consolidated, drop-in Anthropic-compatible interface with continuous rolling capacity renewal.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.45, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3 pt-1"
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
                onClick={handleScrollToRollingPool}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[12px] bg-white hover:bg-black/[0.03] text-[#191719] border border-[#E6E1E8] text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-[#7136E8] text-[#7136E8]" />
                <span>Watch How It Works</span>
              </a>
            </motion.div>

            {/* Ingress Gateway Pill with 1-Click Copy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.4, delay: 0.2 }}
              className="pt-2 max-w-lg"
            >
              <div className="flex items-center justify-between gap-3 p-3 rounded-[12px] bg-white border border-[#E6E1E8] shadow-2xs font-mono text-xs">
                <div className="flex items-center gap-2 truncate">
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

          {/* Right Column: The Living Gateway Product-Led Motion (5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.55, delay: 0.15 }}
              className="relative p-5 sm:p-6 rounded-[22px] bg-white border border-[#E6E1E8] shadow-md overflow-hidden"
            >
              {/* Card Ambient Glow */}
              <div
                className="absolute -top-12 -right-12 w-48 h-48 bg-[#7136E8]/10 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              {/* Card Header Telemetry */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E6E1E8] font-mono text-[11px] text-[#68636B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#7136E8] animate-ping" />
                  <span className="font-semibold text-[#191719] uppercase tracking-wider">The Living Gateway</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#EEE6FF] text-[#7136E8] font-medium text-[10px]">
                  PORT 443 / LIVE INGRESS
                </span>
              </div>

              {/* Interactive SVG Motion Diagram */}
              <div className="relative w-full aspect-[4/3] bg-[#F8F6F2] rounded-xl border border-[#E6E1E8] p-3 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 460 300"
                  className="w-full h-full select-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Linear Gradient for Connection Paths */}
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7136E8" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#7136E8" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#7136E8" stopOpacity="0.2" />
                    </linearGradient>

                    {/* Radial Glow for Gateway Core */}
                    <radialGradient id="gatewayGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#7136E8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#7136E8" stopOpacity="0" />
                    </radialGradient>

                    {/* Particle Glow Filter */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Connection Lines from Client to Gateway */}
                  <path
                    d="M 85 150 C 145 150, 165 150, 220 150"
                    fill="none"
                    stroke="#E6E1E8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Active Request Path Overlay */}
                  <path
                    d="M 85 150 C 145 150, 165 150, 220 150"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="2"
                  />

                  {/* Connection Lines from Gateway to Models */}
                  {/* To Model 1: Sonnet (Top Right) */}
                  <path
                    d="M 240 150 C 290 150, 310 70, 370 70"
                    fill="none"
                    stroke="#E6E1E8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 240 150 C 290 150, 310 70, 370 70"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="1.5"
                  />

                  {/* To Model 2: Opus (Middle Right) */}
                  <path
                    d="M 240 150 C 290 150, 310 150, 370 150"
                    fill="none"
                    stroke="#E6E1E8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 240 150 C 290 150, 310 150, 370 150"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="1.5"
                  />

                  {/* To Model 3: Haiku (Bottom Right) */}
                  <path
                    d="M 240 150 C 290 150, 310 230, 370 230"
                    fill="none"
                    stroke="#E6E1E8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 240 150 C 290 150, 310 230, 370 230"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="1.5"
                  />

                  {/* ======================================================== */}
                  {/* ANIMATED PARTICLES (CSS / SVG Keyframes)                  */}
                  {/* ======================================================== */}
                  {!prefersReducedMotion && (
                    <>
                      {/* Inbound Request Particle: Client -> Gateway */}
                      <circle r="4" fill="#7136E8" filter="url(#glow)">
                        <animateMotion
                          path="M 85 150 C 145 150, 165 150, 220 150"
                          dur="2.4s"
                          repeatCount="indefinite"
                          keyPoints="0;1"
                          keyTimes="0;1"
                        />
                      </circle>

                      {/* Second Inbound Particle with Offset */}
                      <circle r="3" fill="#4F21B5">
                        <animateMotion
                          path="M 85 150 C 145 150, 165 150, 220 150"
                          dur="2.4s"
                          begin="1.2s"
                          repeatCount="indefinite"
                          keyPoints="0;1"
                          keyTimes="0;1"
                        />
                      </circle>

                      {/* Outbound Forwarded Particle: Gateway -> Sonnet */}
                      <circle r="3.5" fill="#7136E8" filter="url(#glow)">
                        <animateMotion
                          path="M 240 150 C 290 150, 310 70, 370 70"
                          dur="2.4s"
                          begin="0.6s"
                          repeatCount="indefinite"
                          keyPoints="0;1"
                          keyTimes="0;1"
                        />
                      </circle>

                      {/* Outbound Forwarded Particle: Gateway -> Opus */}
                      <circle r="3.5" fill="#7136E8" filter="url(#glow)">
                        <animateMotion
                          path="M 240 150 C 290 150, 310 150, 370 150"
                          dur="2.4s"
                          begin="1.8s"
                          repeatCount="indefinite"
                          keyPoints="0;1"
                          keyTimes="0;1"
                        />
                      </circle>

                      {/* Return Response Particle: Model -> Gateway -> Client */}
                      <circle r="3.5" fill="#087F5B" filter="url(#glow)">
                        <animateMotion
                          path="M 370 70 C 310 70, 290 150, 240 150"
                          dur="2.4s"
                          begin="1.4s"
                          repeatCount="indefinite"
                          keyPoints="0;1"
                          keyTimes="0;1"
                        />
                      </circle>
                      <circle r="3.5" fill="#087F5B" filter="url(#glow)">
                        <animateMotion
                          path="M 220 150 C 165 150, 145 150, 85 150"
                          dur="2.4s"
                          begin="1.9s"
                          repeatCount="indefinite"
                          keyPoints="0;1"
                          keyTimes="0;1"
                        />
                      </circle>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* NODE 1: CLIENT / WORKFLOW (Left)                         */}
                  {/* ======================================================== */}
                  <g transform="translate(20, 115)">
                    <rect
                      x="0"
                      y="0"
                      width="75"
                      height="70"
                      rx="12"
                      fill="#FFFFFF"
                      stroke="#E6E1E8"
                      strokeWidth="1.5"
                    />
                    <text x="37.5" y="26" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#191719" fontFamily="monospace">
                      CLIENT
                    </text>
                    <text x="37.5" y="42" textAnchor="middle" fontSize="8" fill="#68636B" fontFamily="monospace">
                      Cursor / CLI
                    </text>
                    <circle cx="37.5" cy="56" r="3" fill="#087F5B" />
                  </g>

                  {/* ======================================================== */}
                  {/* NODE 2: CENTRAL LIGHTNINGAPI GATEWAY (Center Hub)         */}
                  {/* ======================================================== */}
                  {/* Gateway Aura Glow */}
                  <circle cx="230" cy="150" r="48" fill="url(#gatewayGlow)" />
                  <circle
                    cx="230"
                    cy="150"
                    r="34"
                    fill="#FFFFFF"
                    stroke="#7136E8"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="230"
                    cy="150"
                    r="26"
                    fill="#EEE6FF"
                    stroke="#7136E8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Lightning Bolt Symbol */}
                  <path
                    d="M 233 138 L 223 150 L 229 150 L 227 162 L 237 149 L 231 149 Z"
                    fill="#7136E8"
                  />
                  <text x="230" y="196" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#191719" fontFamily="monospace">
                    LightningAPI
                  </text>
                  <text x="230" y="208" textAnchor="middle" fontSize="7.5" fill="#7136E8" fontFamily="monospace">
                    Router · Auth · Pool
                  </text>

                  {/* ======================================================== */}
                  {/* NODES 3, 4, 5: MODEL ENDPOINTS (Right)                    */}
                  {/* ======================================================== */}
                  {/* Model 1: Sonnet */}
                  <g transform="translate(370, 42)">
                    <rect
                      x="0"
                      y="0"
                      width="75"
                      height="56"
                      rx="10"
                      fill="#FFFFFF"
                      stroke="#E6E1E8"
                      strokeWidth="1.5"
                    />
                    <text x="37.5" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#191719" fontFamily="monospace">
                      Sonnet 3.7
                    </text>
                    <text x="37.5" y="36" textAnchor="middle" fontSize="7.5" fill="#68636B" fontFamily="monospace">
                      Agentic Coding
                    </text>
                    <circle cx="65" cy="12" r="2.5" fill="#087F5B" />
                  </g>

                  {/* Model 2: Opus */}
                  <g transform="translate(370, 122)">
                    <rect
                      x="0"
                      y="0"
                      width="75"
                      height="56"
                      rx="10"
                      fill="#FFFFFF"
                      stroke="#E6E1E8"
                      strokeWidth="1.5"
                    />
                    <text x="37.5" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#191719" fontFamily="monospace">
                      Opus 3.5
                    </text>
                    <text x="37.5" y="36" textAnchor="middle" fontSize="7.5" fill="#68636B" fontFamily="monospace">
                      Frontier Logic
                    </text>
                    <circle cx="65" cy="12" r="2.5" fill="#087F5B" />
                  </g>

                  {/* Model 3: Haiku */}
                  <g transform="translate(370, 202)">
                    <rect
                      x="0"
                      y="0"
                      width="75"
                      height="56"
                      rx="10"
                      fill="#FFFFFF"
                      stroke="#E6E1E8"
                      strokeWidth="1.5"
                    />
                    <text x="37.5" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#191719" fontFamily="monospace">
                      Haiku 3.5
                    </text>
                    <text x="37.5" y="36" textAnchor="middle" fontSize="7.5" fill="#68636B" fontFamily="monospace">
                      Fast Stream
                    </text>
                    <circle cx="65" cy="12" r="2.5" fill="#087F5B" />
                  </g>
                </svg>
              </div>

              {/* Lower Status Legend */}
              <div className="pt-4 grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                <div className="p-2 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8]">
                  <span className="text-[#68636B] block">PROTOCOL</span>
                  <span className="font-bold text-[#191719]">Anthropic /v1</span>
                </div>
                <div className="p-2 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8]">
                  <span className="text-[#68636B] block">PASSTHROUGH</span>
                  <span className="font-bold text-[#087F5B]">Zero Logging</span>
                </div>
                <div className="p-2 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8]">
                  <span className="text-[#68636B] block">REPLENISHMENT</span>
                  <span className="font-bold text-[#7136E8]">5h Rolling</span>
                </div>
              </div>

            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};
