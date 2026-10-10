import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingDown,
  Lock,
  RefreshCw,
  Coins,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ElectricEditorialContrast: React.FC = () => {
  const contrasts = [
    {
      label: 'BILLING & COMMITMENT',
      problemTitle: 'The Per-Token Billing Trap',
      problemDetail: 'Pay-as-you-go metering turns automated agentic loops and parallel test suites into unexpected $300–$800 monthly surprise charges.',
      solutionTitle: 'Prepaid Fixed Capacity',
      solutionDetail: 'Pay once for a guaranteed monthly token allocation. Zero auto-charges, zero credit-card risk, zero surprise cloud invoices.',
    },
    {
      label: 'DAILY VELOCITY',
      problemTitle: 'Midday Quota Freezes',
      problemDetail: 'Hitting a rigid monthly allowance on day 8 locks you out of your editor for 22 days until the next calendar billing cycle resets.',
      solutionTitle: '5-Hour Rolling Replenishment',
      solutionDetail: 'Used tokens age out and reload every 5 hours. An intensive morning refactoring session never prevents productive afternoon coding.',
    },
    {
      label: 'TOOL COMPATIBILITY',
      problemTitle: 'Provider Key Fragmentation',
      problemDetail: 'Juggling separate billing portals, token balances, and API endpoints for Sonnet, Opus, and secondary agentic utilities.',
      solutionTitle: 'One Sovereign Master Key',
      solutionDetail: 'Drop-in Anthropic protocol compatibility (/v1/messages) routing seamlessly to Claude Opus 5.5, Sonnet 5.5, and Fable 5 with zero code changes.',
    },
    {
      label: 'DATA GOVERNANCE',
      problemTitle: 'Ambiguous Cloud Retention',
      problemDetail: 'Cloud providers routinely retain prompts, intermediate thoughts, and completion logs on disk for 30+ days for internal audit and evaluation.',
      solutionTitle: 'Volatile In-Stream Transit',
      solutionDetail: 'Zero prompt logging. Payloads stream through volatile RAM directly to upstream frontier models over TLS 1.3 and vanish instantly.',
    },
  ];

  return (
    <section className="bg-[#141210] text-[#fbf9f5] py-20 sm:py-24 lg:py-32 font-sans border-b border-[#292524] relative overflow-hidden">
      
      {/* Editorial Ambient Light */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#6d28d9]/10 blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ea580c]/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24 relative z-10">
        
        {/* Editorial Section Masthead */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-medium text-[#fed7aa] uppercase tracking-wider">
            <span>THE PARADIGM SHIFT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
            Built for creators who cannot afford rate-limit downtime.
          </h2>

          <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-2xl font-normal">
            Frontier AI should feel like reliable utility electricity: immediate, uninterrupted, and predictable. We dismantled the frustrating hurdles of conventional metered cloud access.
          </p>
        </div>

        {/* The Comparative Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Column A: The Fragile Status Quo (5 Cols) */}
          <div className="lg:col-span-5 space-y-8 rounded-3xl bg-neutral-900/40 p-6 sm:p-8 border border-neutral-800">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-amber-400/90 font-bold uppercase tracking-wider block">THE FRAGILE STATUS QUO</span>
                <h3 className="text-lg font-bold text-neutral-200">Metered Cloud Volatility</h3>
              </div>
            </div>

            <div className="space-y-6">
              {contrasts.map((item, idx) => (
                <div key={idx} className="space-y-1.5 pb-5 border-b border-neutral-800/60 last:border-0 last:pb-0">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{item.label}</span>
                  <h4 className="text-sm font-semibold text-neutral-300">{item.problemTitle}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.problemDetail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column B: The Sovereign Lightning Standard (7 Cols) */}
          <div className="lg:col-span-7 space-y-8 rounded-3xl bg-gradient-to-br from-[#1f1633] via-[#1a1426] to-[#141210] p-6 sm:p-10 border border-[#6d28d9]/40 shadow-2xl relative">
            
            <div className="flex items-center gap-3 pb-4 border-b border-purple-900/40">
              <div className="p-2 rounded-xl bg-purple-500/20 text-[#c084fc]">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#c084fc] font-bold uppercase tracking-wider block">THE LIGHTNING STANDARD</span>
                <h3 className="text-xl font-bold text-white">Continuous Rolling Quota</h3>
              </div>
            </div>

            <div className="space-y-6">
              {contrasts.map((item, idx) => (
                <div key={idx} className="space-y-1.5 pb-5 border-b border-purple-900/30 last:border-0 last:pb-0">
                  <span className="text-[10px] font-mono text-[#a78bfa] uppercase tracking-widest">{item.label}</span>
                  <h4 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item.solutionTitle}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed pl-3.5">{item.solutionDetail}</p>
                </div>
              ))}
            </div>

            {/* Quick CTA inside contrast block */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-purple-900/40">
              <span className="text-xs text-neutral-400">Fixed prepaid pricing starts at ₹2,499 for 5,000,000 tokens / 5h.</span>
              <a
                href="#pricing"
                className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-plum cursor-pointer"
              >
                <span>Compare Plan Allocations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
