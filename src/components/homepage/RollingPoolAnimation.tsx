import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface RollOffInfo {
  minutes: number;
  tokens: number;
  id: string;
}

interface SimulatedRequest {
  id: string;
  minuteSent: number; // minutes from epoch (10:00 AM)
  tokens: number;
  model: string;
  description: string;
}

const TOTAL_POOL_TOKENS = 5_000_000; // 5.0M Illustrative pool allowance
const FIVE_HOURS_MINUTES = 300; // 5 hours = 300 minutes

// Deterministic initial sample requests
const INITIAL_REQUESTS: SimulatedRequest[] = [
  {
    id: 'req_01',
    minuteSent: 0, // 10:00 AM
    tokens: 850_000,
    model: 'Claude 3.7 Sonnet',
    description: 'Extended reasoning refactor',
  },
  {
    id: 'req_02',
    minuteSent: 90, // 11:30 AM
    tokens: 1_200_000,
    model: 'Claude 3.7 Sonnet',
    description: 'Full-repo architectural indexing',
  },
  {
    id: 'req_03',
    minuteSent: 180, // 01:00 PM
    tokens: 950_000,
    model: 'Claude 3.5 Opus',
    description: 'Deep mathematical proof verification',
  },
];

// Helper to format minutes into AM/PM clock time
function formatClockTime(minutesFromEpoch: number): string {
  const totalMinutes = 10 * 60 + minutesFromEpoch; // 10:00 AM epoch
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = Math.floor(totalMinutes % 60);
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const padMin = mins.toString().padStart(2, '0');
  return `${hours12}:${padMin} ${period}`;
}

// Helper to format token numbers
function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString('en-US');
}

function formatTokenShort(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  return `${Math.round(tokens / 1000)}K`;
}

export const RollingPoolAnimation: React.FC = () => {
  // Simulation Clock state: starts at 240 minutes (4 hours after 10:00 AM -> 02:00 PM)
  const [simTimeMinutes, setSimTimeMinutes] = useState<number>(240);
  const [requests, setRequests] = useState<SimulatedRequest[]>(INITIAL_REQUESTS);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>('req_01');
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  // --------------------------------------------------------------------------
  // Authoritative Rolling Window Simulation Calculations
  // Strictly mirrors server/accounting/customerAccounting.ts
  // --------------------------------------------------------------------------
  const {
    activeRequests,
    expiredRequests,
    consumedTokens,
    availableTokens,
    nextRollOff,
    consumptionPercent,
  } = useMemo<{
    activeRequests: Array<SimulatedRequest & { ageMinutes: number; minutesUntilRollOff: number }>;
    expiredRequests: Array<SimulatedRequest & { ageMinutes: number }>;
    consumedTokens: number;
    availableTokens: number;
    nextRollOff: RollOffInfo | null;
    consumptionPercent: number;
  }>(() => {
    const active: Array<SimulatedRequest & { ageMinutes: number; minutesUntilRollOff: number }> = [];
    const expired: Array<SimulatedRequest & { ageMinutes: number }> = [];
    let consumed = 0;
    let earliestRollOff: RollOffInfo | null = null;

    // Process all requests against current simulated clock
    requests.forEach((r) => {
      const ageMinutes = simTimeMinutes - r.minuteSent;
      if (ageMinutes < FIVE_HOURS_MINUTES) {
        // Inside the active 5-hour rolling pool [simTime - 5h, simTime]
        const minutesUntilRollOff = FIVE_HOURS_MINUTES - ageMinutes;
        active.push({ ...r, ageMinutes, minutesUntilRollOff });
        consumed += r.tokens;

        if (!earliestRollOff || minutesUntilRollOff < earliestRollOff.minutes) {
          earliestRollOff = {
            minutes: minutesUntilRollOff,
            tokens: r.tokens,
            id: r.id,
          };
        }
      } else {
        // Outside the 5-hour rolling pool -> Expired / Restored exactly once
        expired.push({ ...r, ageMinutes });
      }
    });

    const available = Math.max(0, TOTAL_POOL_TOKENS - consumed);
    const percent = Math.min(100, Math.round((consumed / TOTAL_POOL_TOKENS) * 100));

    return {
      activeRequests: active,
      expiredRequests: expired,
      consumedTokens: consumed,
      availableTokens: available,
      nextRollOff: earliestRollOff,
      consumptionPercent: percent,
    };
  }, [simTimeMinutes, requests]);

  // Smooth continuous auto-play clock progression
  useEffect(() => {
    if (prefersReducedMotion || !isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTickTimeRef.current = performance.now();
    const animate = (now: number) => {
      const deltaMs = now - lastTickTimeRef.current;
      // 100ms real time = 1 minute simulated time (1 hour passes in 6 seconds)
      if (deltaMs >= 100) {
        setSimTimeMinutes((prev) => prev + 1);
        lastTickTimeRef.current = now;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, prefersReducedMotion]);

  // --------------------------------------------------------------------------
  // User Actions: Send Request, Advance Time, Replay
  // --------------------------------------------------------------------------
  const handleSendRequest = (tokensToConsume: number = 800_000) => {
    // Stage 5 check: demonstrate authentic quota enforcement
    if (availableTokens < tokensToConsume) {
      const waitMsg = nextRollOff
        ? `Roll-off of ${formatTokenShort(nextRollOff.tokens)} tokens occurs in ${nextRollOff.minutes}m.`
        : 'Allowance exhausted.';
      setQuotaError(`HTTP 429 Quota Exceeded · ${formatTokenShort(availableTokens)} available, ${formatTokenShort(tokensToConsume)} requested. ${waitMsg}`);
      setTimeout(() => setQuotaError(null), 4000);
      return;
    }

    setQuotaError(null);
    setIsSending(true);

    // Animate flow through gateway before committing request to ring
    setTimeout(() => {
      const newId = `req_${(requests.length + 1).toString().padStart(2, '0')}`;
      const newReq: SimulatedRequest = {
        id: newId,
        minuteSent: simTimeMinutes,
        tokens: tokensToConsume,
        model: 'Claude 3.7 Sonnet',
        description: 'Autonomous agent sub-task',
      };
      setRequests((prev) => [...prev, newReq]);
      setSelectedRequestId(newId);
      setIsSending(false);
    }, 600);
  };

  const handleAdvanceTime = (minutesToAdd: number) => {
    setSimTimeMinutes((prev) => prev + minutesToAdd);
    setQuotaError(null);
  };

  const handleResetSimulation = () => {
    setSimTimeMinutes(240); // 02:00 PM
    setRequests(INITIAL_REQUESTS);
    setSelectedRequestId('req_01');
    setQuotaError(null);
    setIsPlaying(false);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText('export ANTHROPIC_BASE_URL="https://api.lightningapi.pro"\nexport ANTHROPIC_AUTH_TOKEN="lightning_live_7x9q4k2m9p"');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // --------------------------------------------------------------------------
  // SVG Geometry Calculations
  // Center: (270, 270), Radius: 195
  // Active 5-Hour Arc: 0° (top) -> 270° (9 o'clock)
  // Restoration Arc: 270° (9 o'clock) -> 360° (top)
  // --------------------------------------------------------------------------
  const cx = 270;
  const cy = 270;
  const radius = 195;

  const getMarkerCoords = (ageMinutes: number) => {
    let theta: number;
    if (ageMinutes < FIVE_HOURS_MINUTES) {
      // 0 to 300 minutes maps to 0 to 270 degrees
      theta = (ageMinutes / FIVE_HOURS_MINUTES) * 270;
    } else {
      // Beyond 300 minutes maps into restoration arc (270° to 360°)
      const overflow = Math.min(120, ageMinutes - FIVE_HOURS_MINUTES);
      theta = 270 + (overflow / 120) * 90;
    }
    const rad = (theta - 90) * (Math.PI / 180);
    const x = cx + radius * Math.cos(rad);
    const y = cy + radius * Math.sin(rad);
    return { x, y, theta };
  };

  return (
    <section
      id="rolling-pool"
      className="relative py-24 sm:py-32 lg:py-40 bg-[#0E0C13] text-[#F8F6F2] font-sans overflow-hidden border-b border-[#26222C]"
    >
      {/* Ambient Radial Violet Diffusion */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-[#7136E8]/12 via-[#4F21B5]/05 to-transparent rounded-full blur-[170px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-20">
        
        {/* ============================================================ */}
        {/* SECTION EDITORIAL HEADER                                     */}
        {/* ============================================================ */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#EEE6FF]/70 font-semibold">
              QUOTA ARCHITECTURE & PRODUCT DEMONSTRATION
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
        {/* STAGE 1: API KEY CONFIGURATION SNIPPET                       */}
        {/* ============================================================ */}
        <div className="bg-[#141219] border border-[#2B2735] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7136E8]/15 border border-[#7136E8]/30 flex items-center justify-center shrink-0 text-[#9F75FF]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#EEE6FF]/80 font-semibold">
                  Stage 1 — Client Authentication
                </span>
                <span className="text-[10px] font-mono text-[#087F5B] bg-[#087F5B]/15 px-2 py-0.5 rounded-full">
                  Zero Client Code Changes
                </span>
              </div>
              <p className="text-xs text-[#A39EAA] mt-0.5">
                Configure your environment variables. Your client connects directly to the LightningAPI gateway.
              </p>
            </div>
          </div>

          {/* Elegant Command Snippet */}
          <div className="flex items-center gap-3 bg-[#0E0C13] border border-[#231F2D] rounded-lg px-3.5 py-2 font-mono text-xs text-[#E6E1E8] overflow-x-auto">
            <span className="text-[#68636B] select-none">$</span>
            <span className="text-[#9F75FF]">export</span>
            <span>ANTHROPIC_BASE_URL="https://api.lightningapi.pro"</span>
            <span className="text-[#68636B] hidden lg:inline">·</span>
            <span className="text-[#9F75FF] hidden lg:inline">export</span>
            <span className="hidden lg:inline">ANTHROPIC_AUTH_TOKEN="lightning_live_7x9q..."</span>
            <button
              type="button"
              onClick={handleCopyKey}
              className="ml-auto pl-2 text-[#A39EAA] hover:text-white transition-colors cursor-pointer shrink-0"
              title="Copy environment configuration"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-[#087F5B]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LIVE STATE METRICS STRIP (Unified Coherent Simulation State) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Simulated Clock */}
          <div className="bg-[#141219]/80 border border-[#231F2D] rounded-xl p-4 sm:p-5 text-left">
            <div className="flex items-center justify-between text-xs text-[#A39EAA] font-mono mb-2">
              <span className="uppercase tracking-wider">Simulated Clock</span>
              <Clock className="w-3.5 h-3.5 text-[#7136E8]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {formatClockTime(simTimeMinutes)}
            </div>
            <div className="text-[11px] font-mono text-[#A39EAA] mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
              <span>T+{Math.floor(simTimeMinutes / 60)}h {(simTimeMinutes % 60).toString().padStart(2, '0')}m relative</span>
            </div>
          </div>

          {/* Available Capacity */}
          <div className="bg-[#141219]/80 border border-[#231F2D] rounded-xl p-4 sm:p-5 text-left">
            <div className="flex items-center justify-between text-xs text-[#A39EAA] font-mono mb-2">
              <span className="uppercase tracking-wider">Available Capacity</span>
              <span className="text-[10px] font-bold text-[#087F5B] bg-[#087F5B]/15 px-1.5 py-0.5 rounded">
                {100 - consumptionPercent}% Free
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#10B981] tracking-tight">
              {formatTokenCount(availableTokens)}
            </div>
            <div className="text-[11px] font-mono text-[#A39EAA] mt-1.5">
              of {formatTokenShort(TOTAL_POOL_TOKENS)} illustrative pool
            </div>
          </div>

          {/* In-Flight Consumed */}
          <div className="bg-[#141219]/80 border border-[#231F2D] rounded-xl p-4 sm:p-5 text-left">
            <div className="flex items-center justify-between text-xs text-[#A39EAA] font-mono mb-2">
              <span className="uppercase tracking-wider">In-Flight Consumed</span>
              <span className="text-[10px] font-bold text-[#9F75FF] bg-[#7136E8]/20 px-1.5 py-0.5 rounded">
                {activeRequests.length} Active
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#EEE6FF] tracking-tight">
              {formatTokenCount(consumedTokens)}
            </div>
            <div className="text-[11px] font-mono text-[#A39EAA] mt-1.5">
              within current 5-hour window
            </div>
          </div>

          {/* Next Dynamic Roll-Off */}
          <div className="bg-[#141219]/80 border border-[#231F2D] rounded-xl p-4 sm:p-5 text-left">
            <div className="flex items-center justify-between text-xs text-[#A39EAA] font-mono mb-2">
              <span className="uppercase tracking-wider">Next Roll-off</span>
              <Sparkles className="w-3.5 h-3.5 text-[#087F5B]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {nextRollOff ? `+${formatTokenShort(nextRollOff.tokens)}` : 'Full Quota'}
            </div>
            <div className="text-[11px] font-mono text-[#087F5B] mt-1.5">
              {nextRollOff ? `in ${nextRollOff.minutes}m (${nextRollOff.id})` : 'All requests restored'}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* INTERACTIVE SIMULATION CONTROL BAR                           */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#141219]/90 border border-[#282433]">
          {/* Action: Send Request */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSendRequest(800_000)}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7136E8] hover:bg-[#5B24D0] active:scale-95 text-white font-mono text-xs font-semibold shadow-lg shadow-[#7136E8]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 fill-current ${isSending ? 'animate-bounce' : ''}`} />
              <span>{isSending ? 'Sending Request...' : 'Send Request (+800K Tokens)'}</span>
            </button>
            <span className="text-[11px] font-mono text-[#A39EAA] hidden sm:inline">
              Simulates prompt through gateway
            </span>
          </div>

          {/* Action: Advance Time */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#A39EAA] mr-1 hidden sm:inline">Advance Time:</span>
            <button
              type="button"
              onClick={() => handleAdvanceTime(30)}
              className="px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-[#2E2838] text-xs font-mono text-[#EEE6FF] transition-all cursor-pointer"
            >
              +30m
            </button>
            <button
              type="button"
              onClick={() => handleAdvanceTime(60)}
              className="px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-[#2E2838] text-xs font-mono text-[#EEE6FF] transition-all cursor-pointer"
            >
              +1h (Roll-off)
            </button>
            <button
              type="button"
              onClick={() => handleAdvanceTime(300)}
              className="px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-[#2E2838] text-xs font-mono text-[#EEE6FF] transition-all cursor-pointer"
            >
              +5h (Restore All)
            </button>
          </div>

          {/* Action: Play / Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-[#2E2838] text-xs font-mono text-[#EEE6FF] transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#7136E8]" /> : <Play className="w-3.5 h-3.5 fill-[#7136E8] text-[#7136E8]" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-[#2E2838] text-xs font-mono text-[#A39EAA] hover:text-white transition-all cursor-pointer"
              title="Reset simulation to default state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Quota Exhaustion / 429 Alert Banner */}
        <AnimatePresence>
          {quotaError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-[#3D141C] border border-[#7A2433] rounded-xl p-3.5 text-xs font-mono text-[#FFB3BA] flex items-center gap-2.5 shadow-lg"
            >
              <AlertCircle className="w-4 h-4 text-[#FF4D6D] shrink-0" />
              <span>{quotaError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* THE ORBITAL VISUAL (The Centrepiece Product Demonstration)   */}
        {/* ============================================================ */}
        <div className="relative flex flex-col items-center justify-center py-4 sm:py-6">
          <div className="relative w-full max-w-[580px] aspect-square flex items-center justify-center">
            
            <svg
              viewBox="0 0 540 540"
              className="w-full h-full select-none overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Active 5-Hour Arc Gradient */}
                <linearGradient id="orbitalActiveViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7136E8" stopOpacity="0.4" />
                  <stop offset="30%" stopColor="#7136E8" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#A77DFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#087F5B" stopOpacity="0.9" />
                </linearGradient>

                {/* Replenishment Inflow Stream Gradient */}
                <linearGradient id="streamInflow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#087F5B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
                </linearGradient>

                {/* Central Core Breathing Aura */}
                <radialGradient id="coreAura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7136E8" stopOpacity="0.3" />
                  <stop offset="60%" stopColor="#4F21B5" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>

                {/* Marker Luminous Glow Filter */}
                <filter id="orbitalGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ambient Core Lighting */}
              <circle cx={cx} cy={cy} r="180" fill="url(#coreAura)" />

              {/* Background Guide Tracks */}
              <circle cx={cx} cy={cy} r="215" fill="none" stroke="#1F1C26" strokeWidth="1.5" strokeDasharray="4 8" />
              <circle cx={cx} cy={cy} r="170" fill="none" stroke="#181520" strokeWidth="1" />

              {/* Base Horizon Track (360 degrees) */}
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1D1A25" strokeWidth="6" />

              {/* ======================================================== */}
              {/* ACTIVE 5-HOUR WINDOW ARC (0° to 270°, 12 o'clock to 9)   */}
              {/* ======================================================== */}
              <path
                d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`}
                fill="none"
                stroke="url(#orbitalActiveViolet)"
                strokeWidth="7"
                strokeLinecap="round"
                filter="url(#orbitalGlow)"
              />

              {/* Replenishment Arc Guide (270° to 360°, 9 o'clock to 12) */}
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx} ${cy - radius}`}
                fill="none"
                stroke="#087F5B"
                strokeWidth="2.5"
                strokeDasharray="4 6"
                opacity="0.6"
              />

              {/* ======================================================== */}
              {/* 5-HOUR BOUNDARY THRESHOLD (9 o'clock: 270°)              */}
              {/* ======================================================== */}
              <line
                x1={cx - radius - 14}
                y1={cy}
                x2={cx - radius + 14}
                y2={cy}
                stroke="#087F5B"
                strokeWidth="3"
                filter="url(#orbitalGlow)"
              />
              <circle cx={cx - radius} cy={cy} r="5" fill="#087F5B" />

              {/* Restoration stream line from 5h boundary into Central Gateway */}
              <path
                d={`M ${cx - radius} ${cy} Q ${cx - 100} ${cy - 50} ${cx - 60} ${cy}`}
                fill="none"
                stroke="url(#streamInflow)"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                className={isPlaying ? 'animate-pulse' : ''}
              />

              {/* Ingress Animated Packet (When user sends simulated request) */}
              {isSending && (
                <circle cx={cx} cy={cy - radius} r="7" fill="#FFFFFF" filter="url(#orbitalGlow)">
                  <animate attributeName="r" values="4;9;4" dur="0.6s" repeatCount="indefinite" />
                </circle>
              )}

              {/* ======================================================== */}
              {/* REQUEST EVENT MARKERS ON THE ORBITAL RING                */}
              {/* ======================================================== */}
              {requests.map((req) => {
                const age = simTimeMinutes - req.minuteSent;
                const isExpired = age >= FIVE_HOURS_MINUTES;
                const { x, y } = getMarkerCoords(age);
                const isSelected = selectedRequestId === req.id;

                return (
                  <g
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className="cursor-pointer transition-transform duration-200 hover:scale-125"
                  >
                    {/* Pulsing selection ring */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="14"
                        fill="none"
                        stroke={isExpired ? '#087F5B' : '#7136E8'}
                        strokeWidth="1.5"
                        strokeDasharray="2 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '6s' }}
                      />
                    )}

                    {/* Outer glow core */}
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill={isExpired ? '#087F5B' : '#7136E8'}
                      filter="url(#orbitalGlow)"
                      opacity={isExpired ? 0.8 : 1}
                    />

                    {/* Inner high-contrast center */}
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={isExpired ? '#A7F3D0' : '#FFFFFF'}
                    />

                    {/* Micro-label on ring */}
                    <text
                      x={x + (x > cx ? 12 : -12)}
                      y={y + (y > cy ? 14 : -12)}
                      textAnchor={x > cx ? 'start' : 'end'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill={isExpired ? '#087F5B' : '#EEE6FF'}
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {req.id} · {formatTokenShort(req.tokens)}
                    </text>
                  </g>
                );
              })}

              {/* ======================================================== */}
              {/* CENTRAL LIGHTNINGAPI GATEWAY CORE                        */}
              {/* ======================================================== */}
              {/* Outer Core Housing */}
              <circle cx={cx} cy={cy} r="88" fill="#121016" stroke="#2B2735" strokeWidth="2" />

              {/* Dynamic Capacity Gauge Ring */}
              <circle
                cx={cx}
                cy={cy}
                r="78"
                fill="#16131D"
                stroke={availableTokens < 800_000 ? '#FF4D6D' : '#7136E8'}
                strokeWidth="3.5"
                strokeDasharray={`${(availableTokens / TOTAL_POOL_TOKENS) * 490} 490`}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
              />

              {/* Gateway Core Heartbeat Text */}
              <text
                x={cx}
                y={cy - 28}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill={availableTokens < 800_000 ? '#FF4D6D' : '#087F5B'}
                fontFamily="monospace"
                letterSpacing="0.16em"
              >
                ● {availableTokens < 800_000 ? 'QUOTA LIMIT' : 'GATEWAY ACTIVE'}
              </text>

              <text
                x={cx}
                y={cy - 2}
                textAnchor="middle"
                fontSize="22"
                fontWeight="bold"
                fill="#FFFFFF"
                fontFamily="sans-serif"
                letterSpacing="-0.03em"
              >
                {formatTokenShort(availableTokens)}
              </text>

              <text
                x={cx}
                y={cy + 18}
                textAnchor="middle"
                fontSize="9"
                fill="#A39EAA"
                fontFamily="monospace"
                letterSpacing="0.08em"
              >
                Available Capacity
              </text>

              <text
                x={cx}
                y={cy + 36}
                textAnchor="middle"
                fontSize="8"
                fill="#68636B"
                fontFamily="monospace"
              >
                TLS 1.3 Passthrough
              </text>

              {/* Horizon Milestone Labels */}
              <text x={cx} y="44" textAnchor="middle" fontSize="9" fill="#9F75FF" fontFamily="monospace" fontWeight="bold">
                T-0h (Now)
              </text>
              <text x="50" y={cy - 10} textAnchor="start" fontSize="9" fill="#087F5B" fontFamily="monospace" fontWeight="bold">
                5h Boundary
              </text>
              <text x="50" y={cy + 14} textAnchor="start" fontSize="8" fill="#68636B" fontFamily="monospace">
                Capacity Released
              </text>
              <text x={cx + radius + 15} y={cy} textAnchor="start" fontSize="8" fill="#68636B" fontFamily="monospace">
                Rolling Horizon
              </text>
            </svg>
          </div>

          {/* ============================================================ */}
          {/* SELECTED REQUEST INSPECTOR PANEL (Shows Expiry & Dynamics)   */}
          {/* ============================================================ */}
          {selectedRequestId && (
            <div className="w-full max-w-[640px] mt-4 p-4 rounded-xl bg-[#141219] border border-[#2B2735] text-left text-xs font-mono">
              {(() => {
                const req = requests.find((r) => r.id === selectedRequestId);
                if (!req) return null;
                const age = simTimeMinutes - req.minuteSent;
                const isExpired = age >= FIVE_HOURS_MINUTES;
                const minutesUntilRollOff = Math.max(0, FIVE_HOURS_MINUTES - age);

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{req.id}</span>
                        <span className="text-[#A39EAA]">·</span>
                        <span className="text-[#EEE6FF]">{req.model}</span>
                        <span className="text-[#A39EAA]">·</span>
                        <span className="text-[#9F75FF] font-semibold">{formatTokenCount(req.tokens)} tokens</span>
                      </div>
                      <div className="text-[11px] text-[#A39EAA] mt-1">
                        Sent at {formatClockTime(req.minuteSent)} (Age: {Math.floor(age / 60)}h {(age % 60).toString().padStart(2, '0')}m)
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isExpired ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#087F5B]/20 border border-[#087F5B]/40 text-[#10B981] text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Restored (+{formatTokenShort(req.tokens)} back to pool)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7136E8]/20 border border-[#7136E8]/40 text-[#EEE6FF] text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-[#9F75FF]" />
                          <span>Rolls off in {Math.floor(minutesUntilRollOff / 60)}h {(minutesUntilRollOff % 60).toString().padStart(2, '0')}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ============================================================ */}
          {/* SATELLITE EDITORIAL ANNOTATIONS                              */}
          {/* ============================================================ */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 mt-6 border-t border-[#26222C]/70">
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

            {/* Center: Real Mechanics Guarantee */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A77DFF] font-bold block">
                02 / PER-REQUEST EXPIRY
              </span>
              <h3 className="text-lg font-bold text-white font-display">
                Individual 5-Hour Clocks
              </h3>
              <p className="text-xs sm:text-sm text-[#A39EAA] leading-relaxed">
                Each API call carries its own timestamp. Consumption does not pool into a single calendar
                expiry; every request rolls off exactly 5 hours after completion.
              </p>
            </div>

            {/* Right Annotation */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#087F5B] font-bold block">
                03 / CONTINUOUS RESTORATION
              </span>
              <h3 className="text-lg font-bold text-white font-display">
                Replenishment Without Cliff Resets
              </h3>
              <p className="text-xs sm:text-sm text-[#A39EAA] leading-relaxed">
                As individual requests cross the 5-hour boundary, their consumed capacity returns to your
                available pool second-by-second. High-throughput workflows never stall.
              </p>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* COMPACT RECENT ACTIVITY EVENT STREAM                         */}
        {/* ============================================================ */}
        <div className="bg-[#141219]/90 border border-[#26222C] rounded-xl p-5 sm:p-6 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7136E8]" />
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Simulated Event Log ({requests.length} Total Requests)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-[#A39EAA]">
              Derived strictly from simulation state
            </span>
          </div>

          <div className="divide-y divide-[#231F2D] overflow-x-auto">
            {requests.map((r) => {
              const age = simTimeMinutes - r.minuteSent;
              const isExpired = age >= FIVE_HOURS_MINUTES;
              const isSelected = selectedRequestId === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRequestId(r.id)}
                  className={`py-3 flex items-center justify-between gap-4 font-mono text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-white/[0.04] px-2 rounded-lg' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{r.id}</span>
                    <span className="text-[#A39EAA] hidden sm:inline">[{r.model}]</span>
                    <span className="text-[#68636B]">{formatClockTime(r.minuteSent)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#EEE6FF]">
                      {formatTokenCount(r.tokens)} tokens
                    </span>
                    {isExpired ? (
                      <span className="text-[10px] font-bold text-[#087F5B] bg-[#087F5B]/15 px-2 py-0.5 rounded-full">
                        Restored to Pool
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#7136E8] bg-[#7136E8]/20 px-2 py-0.5 rounded-full">
                        Active in 5h Window
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* STAGE 6: API-KEY SECURITY EXPLANATION & ARCHITECTURE FLOW    */}
        {/* ============================================================ */}
        <div className="bg-[#141219]/90 border border-[#2B2735] rounded-xl p-6 sm:p-8 text-left space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#087F5B]">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider">Non-Custodial Architecture</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
              Your key authenticates the request. The gateway handles the connection.
            </h3>
            <p className="text-xs sm:text-sm text-[#A39EAA] leading-relaxed">
              When you configure your LightningAPI key in Cursor, Claude Code, or an official Anthropic SDK,
              every inference request is verified in memory at the gateway before streaming directly to the
              upstream model infrastructure.
            </p>
          </div>

          {/* Tiny Animated Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#0E0C13] border border-[#231F2D] space-y-1">
              <span className="text-[10px] text-[#68636B] block">01 / CLIENT</span>
              <span className="font-bold text-white">Cursor · Claude Code</span>
              <span className="text-[11px] text-[#A39EAA] block">Authenticates with your key</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E0C13] border border-[#7136E8]/40 space-y-1 shadow-sm shadow-[#7136E8]/10">
              <span className="text-[10px] text-[#7136E8] font-bold block">02 / GATEWAY</span>
              <span className="font-bold text-white">LightningAPI Edge</span>
              <span className="text-[11px] text-[#A39EAA] block">SHA-256 & Quota checked</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E0C13] border border-[#231F2D] space-y-1">
              <span className="text-[10px] text-[#68636B] block">03 / UPSTREAM</span>
              <span className="font-bold text-white">Claude 3.7 Sonnet</span>
              <span className="text-[11px] text-[#A39EAA] block">Inference executed</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E0C13] border border-[#087F5B]/40 space-y-1 shadow-sm shadow-[#087F5B]/10">
              <span className="text-[10px] text-[#087F5B] font-bold block">04 / RESPONSE</span>
              <span className="font-bold text-white">In-Stream TLS 1.3</span>
              <span className="text-[11px] text-[#A39EAA] block">Zero prompt logging SLA</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#68636B] pt-2 border-t border-[#231F2D]/60 flex items-center justify-between">
            <span>* Illustrative interactive demonstration running in browser memory. No live credentials or real quota balances modified.</span>
            <Link
              to="/how-it-works#security"
              className="text-[#EEE6FF] hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>Security Whitepaper</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
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
