import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ElectricFinalCta: React.FC = () => {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#fbf9f5] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Warm Editorial Invitation Card */}
        <div className="rounded-3xl border border-[#e7e5e4] bg-white p-8 sm:p-12 md:p-16 text-center space-y-8 shadow-warm relative overflow-hidden">
          
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#6d28d9]/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

          <div className="max-w-2xl mx-auto space-y-4">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ff] text-[#6d28d9] text-xs font-mono font-medium uppercase tracking-wider border border-[#ddd6fe]">
              <Sparkles className="w-3.5 h-3.5 text-[#6d28d9]" />
              <span>START CODING IN UNDER 60 SECONDS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1c1917] leading-[1.1]">
              Uninterrupted intelligence for your daily workflow.
            </h2>

            <p className="text-base text-[#57534e] leading-relaxed max-w-xl mx-auto">
              Claim your free 1,000,000 token trial pass today. Zero billing commitment, instant key delivery, and native compatibility with Claude Code, Cursor, and Windsurf.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
              <Link
                to="/trial"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-bold text-sm transition-all shadow-plum flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <span>Claim Free 1M Trial Pass</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#pricing"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#f5f2eb] hover:bg-[#ebe6dc] border border-[#e7e5e4] text-[#1c1917] font-semibold text-sm transition-colors flex items-center justify-center cursor-pointer"
              >
                <span>Explore Capacity Plans</span>
              </a>
            </div>

            {/* Reassurance Row */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#78716c]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Instant 60s activation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>5-hour rolling renewal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Strict zero retention SLA</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
