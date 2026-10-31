import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, Coins, Check } from 'lucide-react';

export const PricingTeaserCard: React.FC = () => {
  return (
    <section className="py-14 sm:py-18 bg-[#F8F6F2] border-b border-[#E6E1E8]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEE6FF] text-[#7136E8] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FLEXIBLE BILLING ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#191719] font-display tracking-tight">
            Choose the plan that fits your workflow.
          </h2>
          <p className="text-sm sm:text-base text-[#57534e] leading-relaxed">
            Whether you want continuous 5-hour refills for nonstop coding, pay-as-you-go credits with 7x purchasing value, or fixed non-expiring token packs.
          </p>
        </div>

        {/* 3 Simple Plan Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: API Credits */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E6E1E8] shadow-xs flex flex-col justify-between space-y-6 hover:border-[#7136E8]/40 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Most Popular
                </span>
                <span className="text-xs font-bold text-[#7136E8]">7x–8.75x Value</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#191719] font-display">
                  Pay-As-You-Go Credits
                </h3>
                <p className="text-xs text-[#57534e] mt-1 leading-relaxed">
                  Deposit funds in INR and unlock up to 7x–8.75x in usage credits. Spend at each model's standard rate.
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#191719]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Deposit ₹100 → Get ₹700 in API Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Universal: Claude, OpenAI & DeepSeek</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Valid for 365 days; atomic deduction</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E6E1E8]">
              <span className="text-xs text-[#78716c] block">Starting from</span>
              <span className="text-2xl font-bold text-[#191719]">₹100</span>
            </div>
          </div>

          {/* Card 2: 5-Hour Rolling Window */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border-2 border-[#7136E8] shadow-md flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 left-6 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#7136E8] text-white">
              Continuous Refills
            </span>

            <div className="space-y-4">
              <div className="flex items-center justify-between pt-1">
                <div className="p-2 rounded-xl bg-violet-50 text-[#7136E8]">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#7136E8]">Claude Exclusive</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#191719] font-display">
                  5-Hour Rolling Pool
                </h3>
                <p className="text-xs text-[#57534e] mt-1 leading-relaxed">
                  Used tokens automatically regenerate every 5 hours. Never wait for month-end resets.
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#191719]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5M to 20M tokens continuously available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Perfect for full-time coding in Cursor & Claude</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fixed monthly or annual billing</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E6E1E8]">
              <span className="text-xs text-[#78716c] block">Starting from</span>
              <span className="text-2xl font-bold text-[#7136E8]">₹2,499</span>
              <span className="text-[11px] text-[#78716c]"> / month</span>
            </div>
          </div>

          {/* Card 3: Prepaid Token Packs */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E6E1E8] shadow-xs flex flex-col justify-between space-y-6 hover:border-[#7136E8]/40 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-700">No Time Limit</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#191719] font-display">
                  Prepaid Token Packs
                </h3>
                <p className="text-xs text-[#57534e] mt-1 leading-relaxed">
                  Fixed token allowances (10M to 1B) that never reset every 5 hours. Spend at your own pace over 365 days.
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#191719]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>10M, 50M, 100M, or 1B Consumable Tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Scoped by provider (Claude, OpenAI, or Local)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ideal for batch scripts & project bursts</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E6E1E8]">
              <span className="text-xs text-[#78716c] block">Starting from</span>
              <span className="text-2xl font-bold text-[#191719]">₹299</span>
            </div>
          </div>

        </div>

        {/* Action Link to Full Dedicated Pricing Page */}
        <div className="p-6 rounded-2xl bg-[#EEE6FF]/50 border border-[#DDD6FE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#191719]">
              Looking for exact prices, models rates, or token calculators?
            </h4>
            <p className="text-xs text-[#57534e]">
              View our complete pricing matrix with real-time rate comparisons and 1-click checkout.
            </p>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7136E8] hover:bg-[#581c87] text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Explore All Pricing Plans</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
