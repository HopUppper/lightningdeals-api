import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, Terminal, Clock, ShieldCheck, CheckCircle2, ArrowRight, Coins, Sparkles, DollarSign } from 'lucide-react';
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
              WHY DEVELOPERS CHOOSE LIGHTNINGAPI
            </span>
          </div>

          <h2 className="section-headline text-[#191719] font-display">
            Built for developers who want simplicity and savings.
          </h2>

          <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
            Everything you need to run top AI models in your tools, scripts, and apps without the typical markup.
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
                01 / ALL TOP MODELS IN ONE PLACE
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#191719] font-display tracking-tight">
                One key for Claude, OpenAI & DeepSeek.
              </h3>
              <p className="text-base text-[#68636B] leading-relaxed max-w-xl">
                Access Claude Sonnet 5.5, Claude Opus 5.5, OpenAI o1, GPT-4o, and DeepSeek through a single connection.
                No need to manage multiple billing accounts, credit cards, or separate provider accounts.
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
                02 / ZERO SETUP FRICTION
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#191719] font-display tracking-tight">
                Works in your favorite tools.
              </h3>
              <p className="text-base text-[#68636B] leading-relaxed">
                100% compatible with Cursor, Windsurf, Claude Code CLI, VS Code, and Python. Just paste your Base URL and API key and start coding immediately.
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
          {/* BLOCK 3: THREE BILLING ARCHITECTURES (Full Width - 12 cols)  */}
          {/* ============================================================ */}
          <div className="lg:col-span-12 p-8 sm:p-10 rounded-[20px] bg-white border border-[#E6E1E8] shadow-xs space-y-6 hover:border-[#7136E8]/40 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E6E1E8]/70">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                  03 / THREE BILLING ARCHITECTURES
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#191719] font-display tracking-tight">
                  Choose the economic model that matches how you build.
                </h3>
                <p className="text-base text-[#68636B] leading-relaxed">
                  Whether you code 10 hours a day in Cursor, need flexible pay-as-you-go credits across multiple providers, or run non-stop batch evaluation pipelines, LightningAPI offers three purpose-built architectures.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#EEE6FF]/50 border border-[#7136E8]/20 self-start lg:self-center font-mono text-xs text-[#4F21B5] space-y-1">
                <div className="font-bold">ZERO LOCK-IN &bull; PREPAID INR</div>
                <div>Transparent telemetry &bull; Real-time quota balance</div>
              </div>
            </div>

            {/* Three Architectures Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Architecture 1: 5-Hour Rolling Pool */}
              <div className="p-5 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#7136E8] uppercase font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      01 &middot; 5-Hour Rolling Pool
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 text-[#7136E8] font-bold">
                      CLAUDE EXCLUSIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#191719]">Continuous 300-Min Refill</h4>
                  <p className="text-xs text-[#68636B] leading-relaxed">
                    Tokens automatically regenerate as requests pass 5 hours. Never wait for month-end resets. Perfect for full-time engineers coding daily in Cursor and Claude Code CLI.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E6E1E8]/70 text-[11px] font-mono text-[#191719] flex justify-between">
                  <span>Capacity: 5M &ndash; 100M / 5h</span>
                  <span className="text-[#7136E8] font-semibold">From ₹2,999/mo</span>
                </div>
              </div>

              {/* Architecture 2: Usage Credits */}
              <div className="p-5 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-amber-700 uppercase font-bold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      02 &middot; Usage Credits
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      7X&ndash;8.75X MULTIPLIER
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#191719]">Universal Pay-As-You-Go</h4>
                  <p className="text-xs text-[#68636B] leading-relaxed">
                    Deposit INR and receive massive USD credit multipliers (e.g. ₹100 &rarr; $7.00 USD). Tokens deduct atomically per request across all 74 Claude, OpenAI, and DeepSeek models. Valid for 365 days.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E6E1E8]/70 text-[11px] font-mono text-[#191719] flex justify-between">
                  <span>Balance: $7 &ndash; $350 USD</span>
                  <span className="text-amber-700 font-semibold">From ₹100</span>
                </div>
              </div>

              {/* Architecture 3: Prepaid Token Packs */}
              <div className="p-5 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-700 uppercase font-bold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      03 &middot; Prepaid Token Packs
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      NO 5H RESET
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#191719]">Consumable Quota Buckets</h4>
                  <p className="text-xs text-[#68636B] leading-relaxed">
                    Fixed prepaid buckets of 10M to 500M tokens that do not reset every 5 hours. Spend at your own speed across 365 days. Ideal for autonomous agents, evaluations, and project bursts.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E6E1E8]/70 text-[11px] font-mono text-[#191719] flex justify-between">
                  <span>Quota: 10M &ndash; 500M Tokens</span>
                  <span className="text-emerald-700 font-semibold">From ₹799</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-[#68636B]">
                Verify remaining tokens, rolling resets, and credit balances anytime via our public key verification tool.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7136E8] hover:text-[#4F21B5] transition-colors shrink-0"
              >
                <span>Compare plans and pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
