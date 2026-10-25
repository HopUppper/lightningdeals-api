import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IllustrativeRequest {
  id: string;
  name: string;
  timestampHours: number; // e.g. 1.0 = 01:00
  timeLabel: string;
  tokens: number; // in tokens
  tokensLabel: string;
  description: string;
}

const SAMPLE_REQUESTS: IllustrativeRequest[] = [
  {
    id: 'req-1',
    name: 'Req 1: Code Review Burst',
    timestampHours: 1.0,
    timeLabel: '01:00',
    tokens: 800_000,
    tokensLabel: '800k',
    description: 'Autonomous multi-file refactoring in Cursor',
  },
  {
    id: 'req-2',
    name: 'Req 2: Test Generation',
    timestampHours: 2.5,
    timeLabel: '02:30',
    tokens: 1_200_000,
    tokensLabel: '1.2M',
    description: 'Full test suite synthesis in Claude Code CLI',
  },
  {
    id: 'req-3',
    name: 'Req 3: Architecture Audit',
    timestampHours: 4.0,
    timeLabel: '04:00',
    tokens: 600_000,
    tokensLabel: '600k',
    description: 'System boundary formal verification',
  },
  {
    id: 'req-4',
    name: 'Req 4: CI/CD Pipeline',
    timestampHours: 6.2,
    timeLabel: '06:12',
    tokens: 900_000,
    tokensLabel: '900k',
    description: 'Automated PR triage and inline diffing',
  },
];

const TOTAL_POOL_CAPACITY = 5_000_000; // 5M illustrative tokens for Max 5x plan
const WINDOW_DURATION_HOURS = 5.0; // Continuous 5-hour rolling window

export const RollingPoolAnimation: React.FC = () => {
  const [currentHour, setCurrentHour] = useState<number>(5.5); // starting at 05:30
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const animationRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Playback timer
  useEffect(() => {
    if (prefersReducedMotion) {
      setIsPlaying(false);
      return;
    }

    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    let lastTime = performance.now();
    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000; // seconds
      lastTime = now;

      // Advance by ~0.35 hours per real second
      setCurrentHour((prev) => {
        const next = prev + delta * 0.35;
        if (next >= 9.5) {
          return 1.5; // loop back smoothly
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, prefersReducedMotion]);

  // Rolling window calculations
  const windowStart = Math.max(0, currentHour - WINDOW_DURATION_HOURS);
  const windowEnd = currentHour;

  // Requests currently inside the 5-hour window
  const activeInWindow = SAMPLE_REQUESTS.filter(
    (r) => r.timestampHours >= windowStart && r.timestampHours <= windowEnd
  );

  // Requests that have aged beyond the 5-hour window
  const expiredAndRestored = SAMPLE_REQUESTS.filter(
    (r) => r.timestampHours < windowStart
  );

  // Requests that haven't happened yet
  const futureRequests = SAMPLE_REQUESTS.filter(
    (r) => r.timestampHours > windowEnd
  );

  // Tokens currently consumed inside the window
  const activeTokensConsumed = activeInWindow.reduce((acc, r) => acc + r.tokens, 0);

  // Remaining available tokens right now
  const availableTokens = Math.max(0, TOTAL_POOL_CAPACITY - activeTokensConsumed);

  // Capacity percentage available
  const availablePercent = Math.round((availableTokens / TOTAL_POOL_CAPACITY) * 100);

  // Format hour into HH:MM
  const formatTime = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.floor((h - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setCurrentHour(2.0);
    setIsPlaying(true);
  };

  return (
    <section
      id="rolling-pool"
      className="relative py-20 sm:py-28 lg:py-36 bg-[#141217] text-[#F8F6F2] font-sans overflow-hidden border-b border-[#26222C]"
    >
      {/* Background Subtle Atmosphere */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#7136E8]/10 blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#EEE6FF]/70">
              CONTINUOUS 5-HOUR QUOTA ENGINE
            </span>
          </div>

          <h2 className="section-headline text-white font-display">
            Your capacity replenishes as you work.
          </h2>

          <p className="text-base sm:text-lg text-[#A39EAA] leading-relaxed">
            Understand how LightningAPI's continuous five-hour rolling pool works, and how previously
            consumed capacity becomes available again as eligible requests age beyond the rolling window.
          </p>
        </div>

        {/* ============================================================ */}
        {/* MAIN INTERACTIVE TIMELINE WORKSPACE                           */}
        {/* ============================================================ */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#18161D] border border-[#2A2631] shadow-xl space-y-8">
          
          {/* Top Telemetry Bar: Live Clock & Real-Time Capacity Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-6 border-b border-[#26222C] items-center">
            
            {/* Clock Indicator */}
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#221E2A] text-[#7136E8] border border-[#2E2838]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#A39EAA] uppercase block">
                  Illustrative Simulation Time
                </span>
                <span className="text-2xl font-bold font-mono text-white tracking-wider">
                  {formatTime(currentHour)}
                </span>
              </div>
            </div>

            {/* Rolling Window Range Annotation */}
            <div className="md:col-span-4 font-mono text-xs text-[#A39EAA] space-y-1">
              <div className="flex items-center justify-between">
                <span>Active 5h Window:</span>
                <span className="text-[#EEE6FF] font-semibold">
                  {formatTime(windowStart)} – {formatTime(windowEnd)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Window Allowance:</span>
                <span className="text-white">5,000,000 Tokens</span>
              </div>
            </div>

            {/* Current Available Gauge */}
            <div className="md:col-span-4 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A39EAA]">Available Allowance:</span>
                <span className="text-[#087F5B] font-bold">
                  {(availableTokens / 1_000_000).toFixed(2)}M ({availablePercent}%)
                </span>
              </div>
              {/* Meter bar */}
              <div className="w-full h-2 rounded-full bg-[#110F14] overflow-hidden border border-[#26222C]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#7136E8] via-[#087F5B] to-[#087F5B]"
                  style={{ width: `${availablePercent}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* VISUAL TIMELINE SVG GRAPHIC                                   */}
          {/* ============================================================ */}
          <div className="relative w-full aspect-[16/7] min-h-[260px] bg-[#110F14] rounded-xl border border-[#26222C] p-4 flex flex-col justify-between overflow-hidden">
            
            {/* Timeline Coordinate Scale (0h to 10h) */}
            <div className="relative w-full h-full flex flex-col justify-center">
              
              {/* Baseline Horizontal Axis */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#26222C] -translate-y-1/2" />

              {/* 5-Hour Rolling Window Highlight Box */}
              <div
                className="absolute top-3 bottom-3 rounded-lg border-2 border-[#7136E8] bg-[#7136E8]/10 transition-all duration-75 pointer-events-none"
                style={{
                  left: `${(windowStart / 10) * 100}%`,
                  width: `${(WINDOW_DURATION_HOURS / 10) * 100}%`,
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#7136E8] text-white text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 whitespace-nowrap shadow-xs">
                  Continuous 5-Hour Active Boundary
                </div>
              </div>

              {/* Current Time Playhead Line */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-white transition-all duration-75 pointer-events-none z-10"
                style={{ left: `${(windowEnd / 10) * 100}%` }}
              >
                <div className="absolute -bottom-2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-white text-[#141217] text-[10px] font-mono font-bold whitespace-nowrap">
                  Now: {formatTime(currentHour)}
                </div>
              </div>

              {/* Request Event Nodes Placed on Timeline */}
              {SAMPLE_REQUESTS.map((req) => {
                const isInside = req.timestampHours >= windowStart && req.timestampHours <= windowEnd;
                const isExpired = req.timestampHours < windowStart;
                const isFuture = req.timestampHours > windowEnd;

                const leftPercent = (req.timestampHours / 10) * 100;

                return (
                  <div
                    key={req.id}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
                    style={{ left: `${leftPercent}%` }}
                  >
                    {/* Node Dot */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isInside
                          ? 'bg-[#7136E8] border-white text-white shadow-md scale-110'
                          : isExpired
                          ? 'bg-[#087F5B] border-[#087F5B] text-white'
                          : 'bg-[#1C1920] border-[#3D3746] text-[#68636B]'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold">
                        {req.id.replace('req-', '')}
                      </span>
                    </div>

                    {/* Tooltip Card Showing State */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col p-2.5 rounded-lg bg-[#1C1920] border border-[#2E2838] text-left font-mono text-[11px] whitespace-nowrap shadow-lg z-30">
                      <span className="font-bold text-white">{req.name}</span>
                      <span className="text-[#A39EAA]">Time: {req.timeLabel} · Quota: {req.tokensLabel}</span>
                      <span
                        className={`text-[10px] font-bold mt-1 ${
                          isInside
                            ? 'text-[#7136E8]'
                            : isExpired
                            ? 'text-[#087F5B]'
                            : 'text-[#68636B]'
                        }`}
                      >
                        {isInside
                          ? '● Active in 5-Hour Window'
                          : isExpired
                          ? '✓ Aged beyond 5h: Capacity Restored'
                          : 'Pending Request'}
                      </span>
                    </div>

                    {/* Below Label */}
                    <div className="absolute top-7 left-1/2 -translate-x-1/2 text-center font-mono text-[10px] whitespace-nowrap">
                      <span className="text-[#A39EAA] block">{req.timeLabel}</span>
                      <span
                        className={`font-semibold ${
                          isInside
                            ? 'text-[#EEE6FF]'
                            : isExpired
                            ? 'text-[#087F5B]'
                            : 'text-[#68636B]'
                        }`}
                      >
                        {req.tokensLabel}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Scale Hours Markers (00:00 to 10:00) */}
            <div className="flex justify-between font-mono text-[10px] text-[#68636B] pt-2 border-t border-[#26222C]">
              <span>00:00</span>
              <span>02:00</span>
              <span>04:00</span>
              <span>06:00</span>
              <span>08:00</span>
              <span>10:00</span>
            </div>

          </div>

          {/* ============================================================ */}
          {/* INTERACTIVE PLAYBACK & SCRUBBER CONTROLS                     */}
          {/* ============================================================ */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#110F14] border border-[#26222C]">
            
            {/* Play/Pause & Reset Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#7136E8] hover:bg-[#4F21B5] text-white text-xs font-semibold font-mono transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-mono text-[#A39EAA] hover:text-white transition-colors cursor-pointer"
                title="Reset simulation to beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Interactive Timeline Scrubber Slider */}
            <div className="flex items-center gap-3 w-full sm:max-w-md">
              <span className="text-[11px] font-mono text-[#A39EAA] shrink-0">Scrub Time:</span>
              <input
                type="range"
                min="0.5"
                max="9.5"
                step="0.05"
                value={currentHour}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentHour(parseFloat(e.target.value));
                }}
                className="w-full accent-[#7136E8] cursor-pointer"
                aria-label="Timeline scrubber"
              />
              <span className="text-xs font-mono font-bold text-white shrink-0">
                {formatTime(currentHour)}
              </span>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 5-STAGE EXPLANATORY BREAKDOWN                                */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            <div className="p-4 rounded-xl bg-[#110F14] border border-[#26222C] space-y-2 text-left">
              <span className="text-[10px] font-mono font-bold text-[#7136E8] uppercase tracking-wider block">
                01 / IN-WINDOW CONSUMPTION
              </span>
              <h4 className="text-sm font-bold text-white font-display">
                Requests Consume Allowance
              </h4>
              <p className="text-xs text-[#A39EAA] leading-relaxed">
                When you initiate a prompt in Cursor or Claude Code, its token count is debited against
                your current 5-hour rolling allowance.
              </p>
              <div className="text-[11px] font-mono text-[#EEE6FF]">
                Active now: {(activeTokensConsumed / 1_000_000).toFixed(2)}M Tokens
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#110F14] border border-[#26222C] space-y-2 text-left">
              <span className="text-[10px] font-mono font-bold text-[#087F5B] uppercase tracking-wider block">
                02 / CONTINUOUS RECOVERY
              </span>
              <h4 className="text-sm font-bold text-white font-display">
                Replenishment As You Work
              </h4>
              <p className="text-xs text-[#A39EAA] leading-relaxed">
                As soon as an individual request ages beyond the 5-hour threshold, its exact tokens are
                restored. You do not wait for a calendar month reset.
              </p>
              <div className="text-[11px] font-mono text-[#087F5B]">
                Restored count: {expiredAndRestored.length} request(s) aged out
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#110F14] border border-[#26222C] space-y-2 text-left">
              <span className="text-[10px] font-mono font-bold text-[#A39EAA] uppercase tracking-wider block">
                03 / STEADY HIGH CAPACITY
              </span>
              <h4 className="text-sm font-bold text-white font-display">
                No Surprise Lockouts
              </h4>
              <p className="text-xs text-[#A39EAA] leading-relaxed">
                Because replenishment is ongoing, active developers experience continuous capacity
                throughput throughout long engineering sessions.
              </p>
              <div className="text-[11px] font-mono text-white">
                Available: {availablePercent}% of pool ready
              </div>
            </div>

          </div>

        </div>

        {/* Footer Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[#A39EAA] pt-2">
          <span>
            Accurately models LightningAPI sliding-window quota verification logic. Zero periodic cutoff cliffs.
          </span>
          <Link
            to="/how-it-works"
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
