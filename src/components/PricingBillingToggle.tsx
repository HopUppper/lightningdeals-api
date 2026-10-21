import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export type BillingPeriod = 'monthly' | 'yearly';

export interface PricingBillingToggleProps {
  billingPeriod: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  savingsBadgeText?: string;
  className?: string;
}

export const PricingBillingToggle: React.FC<PricingBillingToggleProps> = ({
  billingPeriod,
  onChange,
  savingsBadgeText = 'Save ~17% (2 Months Free)',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent, targetPeriod: BillingPeriod) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(targetPeriod);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChange('yearly');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange('monthly');
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      {/* Segmented Control Container */}
      <div
        role="tablist"
        aria-label="Billing cycle selector"
        className="relative inline-flex items-center p-1.5 rounded-2xl bg-white border border-[#e7e5e4] shadow-xs select-none"
      >
        {/* Monthly Option */}
        <button
          type="button"
          role="tab"
          id="billing-tab-monthly"
          aria-selected={billingPeriod === 'monthly'}
          aria-controls="pricing-cards-container"
          tabIndex={billingPeriod === 'monthly' ? 0 : -1}
          onClick={() => onChange('monthly')}
          onKeyDown={(e) => handleKeyDown(e, 'monthly')}
          className={`relative z-10 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9] focus-visible:ring-offset-2 cursor-pointer ${
            billingPeriod === 'monthly' ? 'text-white' : 'text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          {billingPeriod === 'monthly' && (
            <motion.div
              layoutId={shouldReduceMotion ? undefined : 'billing-toggle-pill'}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute inset-0 bg-[#6d28d9] rounded-xl shadow-plum -z-10"
            />
          )}
          <span>Monthly Billing</span>
        </button>

        {/* Yearly Option */}
        <button
          type="button"
          role="tab"
          id="billing-tab-yearly"
          aria-selected={billingPeriod === 'yearly'}
          aria-controls="pricing-cards-container"
          tabIndex={billingPeriod === 'yearly' ? 0 : -1}
          onClick={() => onChange('yearly')}
          onKeyDown={(e) => handleKeyDown(e, 'yearly')}
          className={`relative z-10 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9] focus-visible:ring-offset-2 cursor-pointer ${
            billingPeriod === 'yearly' ? 'text-white' : 'text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          {billingPeriod === 'yearly' && (
            <motion.div
              layoutId={shouldReduceMotion ? undefined : 'billing-toggle-pill'}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute inset-0 bg-[#6d28d9] rounded-xl shadow-plum -z-10"
            />
          )}
          <span>Annual Billing</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono transition-colors tracking-wide uppercase ${
              billingPeriod === 'yearly'
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            365 Days
          </span>
        </button>
      </div>

      {/* Trust & Value Assurance Sub-Badge */}
      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#57534e]">
        <Sparkles className="w-3.5 h-3.5 text-[#6d28d9] shrink-0" />
        {billingPeriod === 'yearly' ? (
          <span>
            <strong className="text-[#6d28d9] font-semibold">{savingsBadgeText}</strong> · 365 days of uninterrupted rolling quota
          </span>
        ) : (
          <span>
            Standard 30-day fixed duration · Switch to <strong className="text-[#6d28d9] cursor-pointer hover:underline" onClick={() => onChange('yearly')}>Annual</strong> to save up to 17%
          </span>
        )}
      </div>
    </div>
  );
};
