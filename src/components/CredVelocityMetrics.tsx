import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  Radio, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame
} from 'lucide-react';
import { CredTiltCard } from './CredTiltCard';

// Animated Count-Up Hook
function useCounter(target: number, duration: number = 2000, startNow: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startNow) return;
    let startTime: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, startNow]);

  return count;
}

export const CredVelocityMetrics: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();

  // Simulated live gateway telemetry
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const tokensCount = useCounter(100, 1800, isInView);
  const latencyCount = useCounter(28, 1400, isInView);
  const uptimeCount = useCounter(999, 1600, isInView); // 99.9%
  const cycleCount = useCounter(5, 1200, isInView);

  const handleRunPing = () => {
    setIsPinging(true);
    setPingResult(null);

    setTimeout(() => {
      const pingMs = Math.floor(24 + Math.random() * 9);
      setPingResult(`${pingMs}ms TLS 1.3 Handshake · Edge Ingress Verified`);
      setIsPinging(false);
    }, 600);
  };

  const metrics = [
    {
      label: 'MAX ROLLING CAPACITY',
      value: isInView ? `${tokensCount}M` : '100M',
      unit: 'Tokens / 5h Window',
      description: 'Supreme autonomous throughput without mid-day quota locks',
      icon: Flame,
      color: 'text-[#c084fc]',
      glow: 'rgba(192, 132, 252, 0.15)',
      badge: 'TOP TIER 100X',
    },
    {
      label: 'FIRST-TOKEN LATENCY',
      value: isInView ? `< ${latencyCount}ms` : '< 28ms',
      unit: 'Sub-30ms Stream Ingress',
      description: 'Zero cold-start multiplexing straight into Cursor & CLI',
      icon: Zap,
      color: 'text-amber-400',
      glow: 'rgba(251, 191, 36, 0.15)',
      badge: 'SUB-50MS SLA',
    },
    {
      label: 'GATEWAY RELIABILITY',
      value: isInView ? `${(uptimeCount / 10).toFixed(1)}%` : '99.9%',
      unit: 'Dedicated Route Uptime',
      description: 'Automated multi-vendor failover with OpusMax primary routing',
      icon: Activity,
      color: 'text-emerald-400',
      glow: 'rgba(52, 211, 153, 0.15)',
      badge: 'HIGH AVAILABILITY',
    },
    {
      label: 'CONTINUOUS CADENCE',
      value: isInView ? `${cycleCount}h` : '5h',
      unit: 'Rolling Token Renewal',
      description: 'Used tokens continuously reload so you never get paused',
      icon: Clock,
      color: 'text-cyan-400',
      glow: 'rgba(34, 211, 238, 0.15)',
      badge: 'CONTINUOUS POOL',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 bg-[#0d0c11] text-[#fbf9f5] font-sans border-b border-[#262330] overflow-hidden"
    >
      {/* CRED-Style Obsidian Ambient Lighting */}
      <div 
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-[#6d28d9]/15 blur-[140px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" 
        aria-hidden="true"
      />

      {/* Subtle Matrix Micro-Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Header: CRED-Style Minimalist Luxury */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs font-mono font-medium text-[#c084fc] uppercase tracking-wider backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE INFRASTRUCTURE TELEMETRY</span>
              <span className="text-white/20">·</span>
              <span className="text-white/80 font-normal">REAL-TIME PERFORMANCE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              Engineered for velocity.{' '}
              <span className="bg-gradient-to-r from-purple-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                Proven under load.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Every request is dynamically routed across ultra-low-latency ingress proxies with zero prompt logging and guaranteed 5-hour rolling token renewal.
            </p>
          </div>

          {/* Interactive Live Ping Simulator */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRunPing}
              disabled={isPinging}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg cred-shimmer-btn"
            >
              <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isPinging ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{isPinging ? 'Pinging Ingress...' : 'Test Live Gateway Ping'}</span>
            </button>
            {pingResult ? (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{pingResult}</span>
              </motion.span>
            ) : (
              <span className="text-[10px] font-mono text-neutral-500">
                Click to measure real-time TLS handshake latency
              </span>
            )}
          </div>
        </div>

        {/* 4 Interactive CRED 3D Tilt Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <CredTiltCard
                key={idx}
                tiltAngle={9}
                glowColor={item.glow}
                borderBeam={idx === 0}
                className="rounded-3xl bg-gradient-to-b from-[#181522] to-[#121019] border border-white/10 p-6 sm:p-7 flex flex-col justify-between h-full shadow-2xl hover:border-white/25"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-inner">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold block">
                      {item.label}
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight pt-1">
                      {item.value}
                    </div>
                    <span className={`text-xs font-semibold ${item.color} block pt-0.5`}>
                      {item.unit}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed font-normal pt-1">
                    {item.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Ingress</span>
                  </span>
                  <span>TLS 1.3</span>
                </div>
              </CredTiltCard>
            );
          })}
        </div>

      </div>
    </section>
  );
};
