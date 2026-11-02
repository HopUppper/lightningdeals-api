import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, Coins, Check, Zap } from 'lucide-react';

export const PricingTeaserCard: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-[#fafaf9] border-b border-zinc-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-200/60">
            <Zap className="w-3.5 h-3.5" />
            <span>FLEXIBLE BILLING ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-950 font-display tracking-tight">
            Choose the plan that fits your workflow.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Whether you want continuous 5-hour rolling pool refills for nonstop coding, pay-as-you-go credit deposits with 7x purchasing value, or fixed non-expiring token packs.
          </p>
        </div>

        {/* 3 Simple Plan Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: 5-Hour Rolling Pool */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border-2 border-violet-600 shadow-sm flex flex-col justify-between space-y-6 relative hover:shadow-md transition-shadow">
            <span className="absolute -top-3 left-6 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-violet-600 text-white shadow-xs">
              Continuous Refills
            </span>

            <div className="space-y-4">
              <div className="flex items-center justify-between pt-1">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-700">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-violet-600">Claude &amp; OpenAI</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-950 font-display">
                  5-Hour Rolling Pool
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Used tokens automatically regenerate every 5 hours. Never wait for month-end resets.
                </p>
              </div>

              <div className="space-y-2 text-xs text-zinc-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5M to 100M tokens continuously available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Claude Max &amp; OpenAI 5-Hour rolling quotas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live reset countdown in dashboard &amp; /check-key</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 block">Starting from</span>
                <span className="text-2xl font-bold text-zinc-950">₹1,799<span className="text-xs text-zinc-500 font-normal"> / mo</span></span>
              </div>
              <Link
                to="/pricing?tab=window"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>

          {/* Card 2: Pay-As-You-Go Credits */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-6 hover:border-zinc-300 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Most Popular
                </span>
                <span className="text-xs font-bold text-violet-600">7x Purchasing Value</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-950 font-display">
                  API Credit Wallet
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Deposit funds in INR and unlock up to 7x in usage credits. Spend at each model's standard rate.
                </p>
              </div>

              <div className="space-y-2 text-xs text-zinc-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Deposit ₹100 → Get $7.00 USD in API Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Universal: Claude, OpenAI &amp; DeepSeek</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Valid for 365 days; atomic pay-per-token deduction</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 block">Starting from</span>
                <span className="text-2xl font-bold text-zinc-950">₹100<span className="text-xs text-zinc-500 font-normal"> ($7 USD value)</span></span>
              </div>
              <Link
                to="/pricing?tab=credits"
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Add Credits
              </Link>
            </div>
          </div>

          {/* Card 3: Consumable Token Packs */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between space-y-6 hover:border-zinc-300 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-700">Non-Expiring</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-950 font-display">
                  Consumable Token Packs
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  Fixed token packs with no rolling time windows. Spend tokens at your own pace whenever you build.
                </p>
              </div>

              <div className="space-y-2 text-xs text-zinc-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>10M, 50M, 100M fixed token allowances</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dedicated Claude, OpenAI, or Local packs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero 5-hour resets; balance remains until consumed</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 block">Starting from</span>
                <span className="text-2xl font-bold text-zinc-950">₹499<span className="text-xs text-zinc-500 font-normal"> / 10M tokens</span></span>
              </div>
              <Link
                to="/pricing?tab=token_packs"
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Browse Packs
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-violet-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
            <span>Need a custom high-concurrency enterprise allocation or team workspace?</span>
          </div>
          <Link
            to="/request-quote"
            className="font-semibold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1 shrink-0"
          >
            <span>Request Custom Allocation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default PricingTeaserCard;