import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RollingPoolAnimation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [restoredCount, setRestoredCount] = useState<number>(14);
  const animationFrameRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Smooth, continuous clock rotation loop
  useEffect(() => {
    if (prefersReducedMotion) {
      setIsPlaying(false);
      return;
    }

    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setRotationAngle((prev) => {
        const next = (prev + delta * 24) % 360; // 24 degrees per second (smooth orbital rotation)
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, prefersReducedMotion]);

  // Increment restored capacity counter subtly on threshold revolutions
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && !prefersReducedMotion) {
        setRestoredCount((prev) => (prev >= 99 ? 12 : prev + 1));
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, prefersReducedMotion]);

  return (
    <section
      id="rolling-pool"
      className="relative py-24 sm:py-32 lg:py-40 bg-[#0E0C13] text-[#F8F6F2] font-sans overflow-hidden border-b border-[#26222C]"
    >
      {/* Subtle Atmospheric Radial Violet Diffusion */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#7136E8]/10 via-[#4F21B5]/05 to-transparent rounded-full blur-[160px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-20">
        
        {/* ============================================================ */}
        {/* EDITORIAL SECTION HEADER (Integrated Directly, No Box)       */}
        {/* ============================================================ */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#EEE6FF]/70 font-semibold">
              QUOTA ARCHITECTURE
            </span>
          </div>

          <h2 className="section-headline text-white font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Your capacity replenishes as you work.
          </h2>

          <p className="text-base sm:text-lg text-[#A39EAA] leading-relaxed max-w-2xl font-normal">
            Understand how LightningAPI's continuous five-hour rolling pool works, and how previously
            consumed capacity becomes available again as eligible requests age beyond the rolling window.
          </p>
        </div>

        {/* ============================================================ */}
        {/* THE EVOLVING RING OF CAPACITY (Sculptural Orbital Artwork)   */}
        {/* ============================================================ */}
        <div className="relative flex flex-col items-center justify-center py-6 sm:py-10">
          
          <div className="relative w-full max-w-[560px] aspect-square flex items-center justify-center">
            
            <svg
              viewBox="0 0 520 520"
              className="w-full h-full select-none overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Active 5-Hour Window Violet Arc Gradient */}
                <linearGradient id="ringActiveViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7136E8" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#7136E8" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#A77DFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#087F5B" stopOpacity="0.8" />
                </linearGradient>

                {/* Restored Inflow Emerald Shimmer */}
                <linearGradient id="inflowEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#087F5B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
                </linearGradient>

                {/* Central Core Breathing Aura */}
                <radialGradient id="coreAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7136E8" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#7136E8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>

                {/* Luminous Glow Filter */}
                <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ambient Core Lighting */}
              <circle cx="260" cy="260" r="170" fill="url(#coreAura)" />

              {/* Background Orbital Guide Rings */}
              <circle
                cx="260"
                cy="260"
                r="210"
                fill="none"
                stroke="#1F1C26"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />
              <circle
                cx="260"
                cy="260"
                r="165"
                fill="none"
                stroke="#1B1822"
                strokeWidth="1"
              />

              {/* Static Background Time Horizon Track */}
              <circle
                cx="260"
                cy="260"
                r="190"
                fill="none"
                stroke="#1C1924"
                strokeWidth="5"
              />

              {/* ======================================================== */}
              {/* ROTATING 5-HOUR ACTIVE WINDOW ORBITAL SEGMENT            */}
              {/* ======================================================== */}
              <g
                transform={`rotate(${rotationAngle} 260 260)`}
                style={{
                  transition: prefersReducedMotion ? 'none' : 'transform 0.05s linear',
                }}
              >
                {/* Active 5-Hour Arc (approx 150 degrees of 360 circle) */}
                <path
                  d="M 260 70 A 190 190 0 0 1 424 355"
                  fill="none"
                  stroke="url(#ringActiveViolet)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  filter="url(#ringGlow)"
                />

                {/* Luminous Arc Trailing Edge Indicator */}
                <circle cx="424" cy="355" r="5" fill="#087F5B" filter="url(#ringGlow)" />

                {/* Inbound Request Droplets along the Arc */}
                <circle cx="260" cy="70" r="4.5" fill="#FFFFFF" />
                <circle cx="340" cy="98" r="4" fill="#A77DFF" />
                <circle cx="400" cy="155" r="4" fill="#7136E8" />
                <circle cx="438" cy="250" r="3.5" fill="#7136E8" />

                {/* Flow Lines Inward from Aged Horizon to Core */}
                <path
                  d="M 424 355 C 380 340, 330 300, 260 260"
                  fill="none"
                  stroke="url(#inflowEmerald)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              </g>

              {/* ======================================================== */}
              {/* CENTRAL SCULPTURAL REPLENISHMENT CORE                    */}
              {/* ======================================================== */}
              {/* Outer Core Glass Boundary */}
              <circle
                cx="260"
                cy="260"
                r="92"
                fill="#121016"
                stroke="#2A2634"
                strokeWidth="1.5"
              />

              {/* Breathing Inner Capacity Wave */}
              <circle
                cx="260"
                cy="260"
                r="74"
                fill="#17141E"
                stroke="#7136E8"
                strokeWidth="1.5"
                strokeDasharray="2 4"
                opacity="0.8"
              />

              {/* Central Typographic Heartbeat */}
              <text
                x="260"
                y="244"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#087F5B"
                fontFamily="monospace"
                letterSpacing="0.18em"
              >
                ● REPLENISHING
              </text>
              <text
                x="260"
                y="266"
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill="#FFFFFF"
                fontFamily="sans-serif"
                letterSpacing="-0.02em"
              >
                Continuous Flow
              </text>
              <text
                x="260"
                y="284"
                textAnchor="middle"
                fontSize="9"
                fill="#A39EAA"
                fontFamily="monospace"
              >
                5-Hour Rolling Horizon
              </text>

              {/* Floating Aesthetic Compass Marks */}
              <text x="260" y="44" textAnchor="middle" fontSize="9" fill="#68636B" fontFamily="monospace">
                T-0h (Now)
              </text>
              <text x="475" y="264" textAnchor="start" fontSize="9" fill="#7136E8" fontFamily="monospace">
                5h Boundary
              </text>
              <text x="260" y="482" textAnchor="middle" fontSize="9" fill="#087F5B" fontFamily="monospace">
                Capacity Restored
              </text>
              <text x="45" y="264" textAnchor="end" fontSize="9" fill="#68636B" fontFamily="monospace">
                Available Pool
              </text>
            </svg>

          </div>

          {/* ============================================================ */}
          {/* SATELLITE EDITORIAL ANNOTATIONS (Organic & Balanced)          */}
          {/* ============================================================ */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#26222C]/70">
            
            {/* Left Annotation */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-bold block">
                01 / IN-FLIGHT ALLOCATION
              </span>
              <h3 className="text-lg font-bold text-white font-display">
                Prompts Debit The Rolling Pool
              </h3>
              <p className="text-xs sm:text-sm text-[#A39EAA] leading-relaxed">
                When you initiate a prompt in Cursor or Claude Code, tokens are deducted from your
                active five-hour allowance immediately.
              </p>
            </div>

            {/* Center: Quiet, Discreet Motion Control */}
            <div className="flex flex-col items-center justify-center space-y-3 py-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-[#2E2838] text-xs font-mono text-[#EEE6FF] transition-all cursor-pointer shadow-2xs"
                aria-label={isPlaying ? 'Pause orbital motion' : 'Resume orbital motion'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#7136E8]" />
                    <span>Pause Orbital Motion</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-[#7136E8] text-[#7136E8]" />
                    <span>Resume Orbital Motion</span>
                  </>
                )}
              </button>

              <div className="text-[11px] font-mono text-[#087F5B] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B] animate-pulse" />
                <span>Simulated quota cycles continuously</span>
              </div>
            </div>

            {/* Right Annotation */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#087F5B] font-bold block">
                02 / CONTINUOUS RESTORATION
              </span>
              <h3 className="text-lg font-bold text-white font-display">
                Replenishment Without Cliff Resets
              </h3>
              <p className="text-xs sm:text-sm text-[#A39EAA] leading-relaxed">
                As individual requests age past 5 hours, their consumed capacity returns to your
                available pool. High-throughput workflows never stall waiting for a monthly renewal.
              </p>
            </div>

          </div>

        </div>

        {/* Section Footer Specification Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[#A39EAA] pt-4 border-t border-[#26222C]/40">
          <span>
            Accurately models LightningAPI sliding-window quota verification logic.
          </span>
          <Link
            to="/how-it-works#rolling-window"
            className="text-[#EEE6FF] hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Read Complete Algorithm Specification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};
