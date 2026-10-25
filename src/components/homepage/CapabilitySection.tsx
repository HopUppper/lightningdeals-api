import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, Terminal, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CapabilitySection: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
              CAPABILITIES & ARCHITECTURE
            </span>
          </div>

          <h2 className="section-headline text-[#191719] font-display">
            Infrastructure that stays out of your way.
          </h2>

          <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
            Engineered specifically to solve the friction points developers face when integrating
            frontier models into their production pipelines.
          </p>
        </div>

        {/* ============================================================ */}
        {/* ASYMMETRICAL EDITORIAL BLOCKS COMPOSITION                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ============================================================ */}
          {/* BLOCK 1: ONE INTEGRATION (Large Focal Block - 7 cols)         */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-[20px] bg-white border border-[#E6E1E8] shadow-xs flex flex-col justify-between space-y-8 hover:border-[#7136E8]/40 transition-colors">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                01 / UNIFIED ARCHITECTURE
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#191719] font-display tracking-tight">
                One integration.
              </h3>
              <p className="text-base text-[#68636B] leading-relaxed max-w-xl">
                Access supported models through the gateway's documented interface. Rather than
                maintaining fragmented provider libraries, managing separate billing relationships,
                or rewriting endpoints, your code routes through a single connection.
              </p>
            </div>

            {/* Micro Architecture Visual */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] font-mono text-xs text-[#191719] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#68636B]">
                <span>UNIFIED INGRESS PIPELINE</span>
                <span className="text-[#087F5B]">PORT 443 / HTTPS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[11px] pt-1">
                <div className="p-2.5 rounded bg-white border border-[#E6E1E8]">Client Code</div>
                <div className="p-2.5 rounded bg-[#EEE6FF] text-[#7136E8] font-bold border border-[#7136E8]/20">LightningAPI</div>
                <div className="p-2.5 rounded bg-white border border-[#E6E1E8]">Target Model</div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7136E8] hover:text-[#4F21B5] transition-colors"
              >
                <span>Read how the routing engine works</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BLOCK 2: FOCUSED DEVELOPER WORKFLOW (5 cols)                  */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 p-8 sm:p-10 rounded-[20px] bg-white border border-[#E6E1E8] shadow-xs flex flex-col justify-between space-y-8 hover:border-[#7136E8]/40 transition-colors">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                02 / TOOL ERGONOMICS
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#191719] font-display tracking-tight">
                A focused developer workflow.
              </h3>
              <p className="text-base text-[#68636B] leading-relaxed">
                Use compatible developer tools and IDE extensions—such as Cursor, Windsurf, and Claude
                Code CLI—without modifying your local workflow habits or installing proprietary wrapper
                software.
              </p>
            </div>

            {/* Checklist of Verified Toolchains */}
            <div className="space-y-2.5 pt-2 font-mono text-xs text-[#191719]">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8]">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Cursor IDE native baseURL override</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8]">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Claude Code CLI environment token</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F8F6F2] border border-[#E6E1E8]">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Standard Anthropic Python & TS SDKs</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/docs#integration"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7136E8] hover:text-[#4F21B5] transition-colors"
              >
                <span>View integration quickstart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BLOCK 3: CLEAR USAGE & CAPACITY RULES (Full Width - 12 cols)  */}
          {/* ============================================================ */}
          <div className="lg:col-span-12 p-8 sm:p-10 rounded-[20px] bg-white border border-[#E6E1E8] shadow-xs space-y-6 hover:border-[#7136E8]/40 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E6E1E8]/70">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                  03 / CONTINUOUS ROLLING CAPACITY
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#191719] font-display tracking-tight">
                  Clear usage and capacity rules.
                </h3>
                <p className="text-base text-[#68636B] leading-relaxed">
                  Understand the limits, capacity, and renewal terms associated with your chosen plan.
                  LightningAPI uses a continuous 5-hour rolling pool rather than arbitrary hard cutoffs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#EEE6FF]/50 border border-[#7136E8]/20 self-start lg:self-center font-mono text-xs text-[#4F21B5] space-y-1">
                <div className="font-bold">5-HOUR ROLLING ENGINE</div>
                <div>Continuous sliding-window token replenishment</div>
              </div>
            </div>

            {/* Visual Timeline of 5-Hour Sliding Window */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                <span className="text-[11px] font-mono text-[#68636B] uppercase font-semibold">
                  01 · Dynamic Token Pool
                </span>
                <p className="text-xs text-[#191719] leading-relaxed">
                  Your token allowance applies across a rolling 5-hour window. Active coding prompts
                  draw tokens directly from this allowance in real time.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                <span className="text-[11px] font-mono text-[#68636B] uppercase font-semibold">
                  02 · Continuous Replenishment
                </span>
                <p className="text-xs text-[#191719] leading-relaxed">
                  As historical requests age past the 5-hour mark, their tokens automatically replenish
                  back into your pool. You do not wait until the next calendar month.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-2">
                <span className="text-[11px] font-mono text-[#68636B] uppercase font-semibold">
                  03 · Transparent Accountability
                </span>
                <p className="text-xs text-[#191719] leading-relaxed">
                  Verify remaining tokens anytime via the balance endpoint or the web key checker. No
                  hidden overages or unexpected bills.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
