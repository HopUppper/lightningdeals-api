import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const FinalCta: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#fbf9f5] border-b border-[#e7e5e4] px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Warm, Balanced Editorial Invitation (Replaced giant dark panel) */}
        <div className="rounded-3xl bg-white p-8 sm:p-12 md:p-16 text-[#1c1917] border border-[#e7e5e4] text-center space-y-6 shadow-warm relative overflow-hidden">
          
          <div className="max-w-2xl mx-auto space-y-4">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ff] text-[#6d28d9] text-xs font-medium uppercase tracking-wider border border-[#ddd6fe]">
              <Sparkles className="w-3.5 h-3.5 text-[#6d28d9]" />
              <span>Get Started in 60 Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.12]">
              Uninterrupted intelligence for your daily workflow.
            </h2>

            <p className="text-sm sm:text-base text-[#57534e] leading-relaxed max-w-xl mx-auto">
              Claim your free 1,000,000 token trial pass today. Zero billing commitment, instant key reveal, and native compatibility with Claude Code, Cursor, and custom tools.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-3">
              <Link
                to="/trial"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white font-semibold text-sm transition-all shadow-plum flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim Free 1M Trial Pass</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#pricing"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-[#f5f2eb] border border-[#e7e5e4] text-[#1c1917] font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>View Capacity Plans</span>
              </a>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#78716c]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Zero credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>5-hour rolling renewal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Strict zero retention SLA</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
