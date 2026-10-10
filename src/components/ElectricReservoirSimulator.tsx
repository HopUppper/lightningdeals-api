import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SimulationStep {
  time: string;
  hourOffset: number;
  label: string;
  actionTitle: string;
  actionDetail: string;
  consumedThisStep: number;
  tokensRestored: number;
  activeBalance: number; // Max 5,000,000
  totalCapacity: number;
  reservoirPercent: number;
  statusBadge: string;
}

export const ElectricReservoirSimulator: React.FC = () => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const steps: SimulationStep[] = [
    {
      time: '10:00 AM',
      hourOffset: 0,
      label: 'Morning Sprint',
      actionTitle: 'Heavy Multi-File Refactor in Cursor',
      actionDetail: 'You edit 18 components across your repository. Agentic completions consume 2,000,000 tokens during deep focus.',
      consumedThisStep: 2000000,
      tokensRestored: 0,
      activeBalance: 3000000,
      totalCapacity: 5000000,
      reservoirPercent: 60,
      statusBadge: 'Active Usage',
    },
    {
      time: '01:00 PM',
      hourOffset: 3,
      label: 'Midday Continuation',
      actionTitle: 'Writing Integration Tests & Verifying APIs',
      actionDetail: 'You run test generation with Claude 3.5 Sonnet, consuming an additional 1,000,000 tokens. Available balance reaches 2,000,000 tokens.',
      consumedThisStep: 1000000,
      tokensRestored: 0,
      activeBalance: 2000000,
      totalCapacity: 5000000,
      reservoirPercent: 40,
      statusBadge: 'Continuous Flow',
    },
    {
      time: '03:00 PM',
      hourOffset: 5,
      label: 'First 5-Hour Reload',
      actionTitle: 'Morning Tokens Age Out & Reload Automatically',
      actionDetail: 'Exactly 5 hours after your 10:00 AM sprint, all 2,000,000 morning tokens age out of the rolling ledger and reload into your balance!',
      consumedThisStep: 0,
      tokensRestored: 2000000,
      activeBalance: 4000000,
      totalCapacity: 5000000,
      reservoirPercent: 80,
      statusBadge: '⚡ Quota Restored',
    },
    {
      time: '06:00 PM',
      hourOffset: 8,
      label: 'Second 5-Hour Reload',
      actionTitle: 'Midday Tokens Age Out & Reservoir Fully Replenished',
      actionDetail: 'Exactly 5 hours after your 1:00 PM session, the remaining 1,000,000 tokens reload. Your balance returns to 100% capacity for evening work!',
      consumedThisStep: 0,
      tokensRestored: 1000000,
      activeBalance: 5000000,
      totalCapacity: 5000000,
      reservoirPercent: 100,
      statusBadge: '⚡ Full 100% Reservoir',
    },
  ];

  const current = steps[activeStepIdx];

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#f6f2fd] border-b border-[#e7e5e4] font-sans relative overflow-hidden">
      
      {/* Subtle Ambient Plum Bloom */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[#6d28d9]/10 blur-[130px] pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 relative z-10">
        
        {/* Section Masthead */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#ddd6fe] text-xs font-mono font-medium text-[#6d28d9] uppercase tracking-wider shadow-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>CONTINUOUS ROLLING REPLENISHMENT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.1]">
            Why rolling replenishment changes everything.
          </h2>

          <p className="text-base sm:text-lg text-[#57534e] leading-relaxed">
            Instead of a rigid monthly bucket that freezes your workspace on Day 5, your allocation behaves like a flowing reservoir that continuously replenishes every 5 hours.
          </p>
        </div>

        {/* The Interactive Simulation Canvas */}
        <div className="rounded-3xl border border-[#ddd6fe] bg-white p-6 sm:p-8 lg:p-10 shadow-warm space-y-10">
          
          {/* Step Timeline Rail */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#78716c] font-medium">
              <span>STEP THROUGH A TYPICAL WORKDAY:</span>
              <span className="font-mono text-[#6d28d9] font-bold">5-HOUR ROLLING CYCLE</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {steps.map((st, idx) => {
                const isActive = activeStepIdx === idx;
                return (
                  <button
                    key={st.time}
                    onClick={() => setActiveStepIdx(idx)}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-[#f5f3ff] border-[#6d28d9] shadow-xs ring-2 ring-[#6d28d9]/20'
                        : 'bg-[#fbf9f5] border-[#e7e5e4] hover:bg-white hover:border-[#d6d3d1]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-bold text-[#6d28d9]">{st.time}</span>
                      <span className="text-[10px] text-[#78716c] font-medium">Step {idx + 1}/4</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1c1917] tracking-tight">{st.label}</h4>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fluid Reservoir Tank & Explanation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2">
            
            {/* Left 6 Cols: Reservoir Tank Visualization */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="rounded-2xl border border-[#e7e5e4] bg-[#fbf9f5] p-6 space-y-5">
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#78716c] uppercase">ACTIVE RESERVOIR LEVEL</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6d28d9] text-white">
                    {current.statusBadge}
                  </span>
                </div>

                {/* Animated Reservoir Bar */}
                <div className="space-y-2">
                  <div className="h-8 rounded-xl bg-[#e7e5e4] p-1 overflow-hidden relative shadow-inner">
                    <motion.div
                      className="h-full rounded-lg bg-gradient-to-r from-[#6d28d9] via-[#8b5cf6] to-[#a78bfa] relative flex items-center justify-end pr-3"
                      initial={false}
                      animate={{ width: `${current.reservoirPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    >
                      <span className="text-xs font-bold font-mono text-white drop-shadow-sm">
                        {current.reservoirPercent}%
                      </span>
                    </motion.div>
                  </div>

                  <div className="flex justify-between text-xs font-mono text-[#78716c]">
                    <span>0 Tokens</span>
                    <span>2.5M Midpoint</span>
                    <span className="font-bold text-[#1c1917]">5,000,000 Full Quota</span>
                  </div>
                </div>

                {/* Active Numbers Callout */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-white border border-[#e7e5e4]">
                    <span className="text-[10px] font-mono text-[#78716c] uppercase block">AVAILABLE RIGHT NOW</span>
                    <span className="text-xl font-bold font-mono text-[#6d28d9] block mt-0.5">
                      {current.activeBalance.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#78716c]">Tokens ready for requests</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#e7e5e4]">
                    <span className="text-[10px] font-mono text-[#78716c] uppercase block">ROLLING STATUS</span>
                    <span className="text-base font-bold text-[#1c1917] block mt-1">
                      {current.tokensRestored > 0 ? `+${current.tokensRestored.toLocaleString()} Reloaded` : 'Consuming in flow'}
                    </span>
                    <span className="text-[11px] text-[#059669] font-medium">Auto-refreshes every 5h</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right 6 Cols: Narrative Breakdown & Structural Contrast */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs font-mono text-[#6d28d9] font-bold uppercase tracking-wider block">
                  {current.time} · {current.label}
                </span>
                <h3 className="text-2xl font-bold text-[#1c1917] tracking-tight">
                  {current.actionTitle}
                </h3>
                <p className="text-sm text-[#57534e] leading-relaxed">
                  {current.actionDetail}
                </p>
              </div>

              {/* Contrast with Old Monthly Systems */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#ea580c]">
                    <AlertCircle className="w-4 h-4" />
                    <span>Rigid Monthly Bucket</span>
                  </div>
                  <p className="text-xs text-[#78716c] leading-relaxed">
                    If an intensive sprint burns your monthly tokens, you are locked out for up to 25 days until the next calendar month.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lightning 5-Hour Renewal</span>
                  </div>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    Tokens reload continuously throughout every single day. A busy morning never prevents you from shipping in the afternoon.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
