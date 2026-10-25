import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ArrowRight, Clock, Shield, Sparkles, ShoppingBag, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { usePlans, PlanItem } from '../../context/PlansContext';
import { CheckoutModal } from '../CheckoutModal';

export const CapacityPlans: React.FC = () => {
  const { user } = useAuth();
  const { addToCart, openCart } = useCart();
  const { plans, loading } = usePlans();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanItem | null>(null);

  // Filter for regular capacity tiers (excluding trial passes) and sort by price
  const capacityPlans = useMemo(() => {
    const valid = plans.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const isTrial = name.includes('trial') || slug.includes('trial') || id.includes('trial') || slug.includes('test');
      return !isTrial && p.priceInr >= 500;
    });
    return (valid.length > 0 ? valid : plans).sort((a, b) => a.priceInr - b.priceInr);
  }, [plans]);

  const handleSelectPlan = (pkg: PlanItem) => {
    const isYearly = billingPeriod === 'yearly';
    const activePrice = isYearly ? (pkg.annualPriceInr || pkg.priceInr) : pkg.priceInr;
    const activeValidity = isYearly ? (pkg.annualValidityDays || 365) : pkg.validityDays;

    if (user) {
      setSelectedPlanForCheckout({
        ...pkg,
        priceInr: activePrice,
        validityDays: activeValidity,
      });
    } else {
      navigate(`/register?plan=${pkg.id}&billing=${billingPeriod}`);
    }
  };

  const handleAddToCart = (pkg: PlanItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isYearly = billingPeriod === 'yearly';
    const activePrice = isYearly ? (pkg.annualPriceInr || pkg.priceInr) : pkg.priceInr;
    const activeOriginalPrice = isYearly ? pkg.annualOriginalPriceInr : pkg.originalPriceInr;
    const activeValidity = isYearly ? (pkg.annualValidityDays || 365) : pkg.validityDays;

    addToCart({
      id: pkg.id,
      planId: pkg.id,
      name: pkg.name,
      priceInr: activePrice,
      originalPriceInr: activeOriginalPrice,
      tokenDisplay: pkg.tokenDisplay || `${(Number(pkg.tokenAllowance || 0) / 1_000_000).toFixed(0)}M Tokens`,
      windowHours: pkg.windowHours,
      validityDays: activeValidity,
      tagline: pkg.tagline,
      badge: pkg.badge,
      billingPeriod,
    });
    openCart();
  };

  return (
    <section
      id="capacity-plans"
      className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden border-b border-[#E6E1E8]"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E1E8]/70">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
                CAPACITY & COMMITMENT
              </span>
            </div>

            <h2 className="section-headline text-[#191719] font-display">
              Choose the capacity your workflow needs.
            </h2>

            <p className="text-base sm:text-lg text-[#68636B] leading-relaxed">
              Predictable allowances powered by continuous 5-hour rolling token replenishment.
              No arbitrary hard cutoffs.
            </p>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs self-start lg:self-end">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-[#191719] text-white shadow-xs'
                  : 'text-[#68636B] hover:text-[#191719]'
              }`}
            >
              Monthly Term
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'yearly'
                  ? 'bg-[#7136E8] text-white shadow-xs'
                  : 'text-[#68636B] hover:text-[#191719]'
              }`}
            >
              <span>Annual Term</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/20">
                12 Months
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5-HOUR ROLLING POOL EXPLAINER NOTICE                         */}
        {/* ============================================================ */}
        <div className="p-5 sm:p-6 rounded-[16px] bg-white border border-[#E6E1E8] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#EEE6FF] text-[#7136E8] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[#191719] font-display">
                How the continuous 5-hour rolling pool works
              </div>
              <p className="text-xs text-[#68636B] leading-relaxed max-w-3xl">
                Your token allowance is calculated over a continuous 5-hour rolling window. Used tokens
                automatically replenish as past requests age past the 5-hour mark. If you exhaust your
                allowance during peak bursts, tokens regenerate continuously without waiting for a new
                billing cycle.
              </p>
            </div>
          </div>

          <Link
            to="/how-it-works#rolling-window"
            className="text-xs font-semibold text-[#7136E8] hover:text-[#4F21B5] whitespace-nowrap self-start md:self-center inline-flex items-center gap-1"
          >
            <span>Read full specification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ============================================================ */}
        {/* COMPACT COMPARISON TIERS (Clear, Structured, Restrained)      */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {capacityPlans.map((plan) => {
            const isYearly = billingPeriod === 'yearly';
            const price = isYearly ? (plan.annualPriceInr || plan.priceInr) : plan.priceInr;
            const validity = isYearly ? (plan.annualValidityDays || 365) : plan.validityDays;
            const allowanceNum = Number(plan.tokenAllowance || 0);
            const allowanceMillions = (allowanceNum / 1_000_000).toFixed(0);

            return (
              <div
                key={plan.id}
                className="p-6 sm:p-7 rounded-[18px] bg-white border border-[#E6E1E8] shadow-2xs flex flex-col justify-between space-y-6 hover:border-[#7136E8]/40 transition-all hover:shadow-xs"
              >
                {/* Header & Pricing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#7136E8] uppercase tracking-wider">
                      {plan.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F6F2] text-[#68636B] border border-[#E6E1E8]">
                      {validity} Days Term
                    </span>
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#191719] font-display">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-mono text-[#68636B]">
                        /{isYearly ? 'yr' : 'mo'}
                      </span>
                    </div>
                    <p className="text-xs text-[#68636B] leading-relaxed line-clamp-2">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Token Allowance Badge */}
                  <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E6E1E8] font-mono text-center space-y-0.5">
                    <div className="text-lg font-bold text-[#191719] font-display">
                      {allowanceMillions}M TOKENS
                    </div>
                    <div className="text-[10px] text-[#68636B] uppercase font-semibold">
                      PER 5-HOUR WINDOW
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-2 border-t border-[#E6E1E8]/70 text-xs text-[#191719]">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                      <span>Continuous 5-Hour Refill</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                      <span>Drop-In Anthropic Protocol</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                      <span>Cursor & Claude Code CLI Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#087F5B] shrink-0" />
                      <span>Instant API Key Issuance</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Direct Checkout & Add to Cart */}
                <div className="space-y-2 pt-4 border-t border-[#E6E1E8]">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full py-2.5 rounded-[11px] bg-[#191719] hover:bg-[#7136E8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Select Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(plan, e)}
                    className="w-full py-2 rounded-[11px] bg-white hover:bg-[#F8F6F2] text-[#191719] border border-[#E6E1E8] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#68636B]" />
                    <span>Add to Cart</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Free Trial Callout */}
        <div className="p-6 rounded-[18px] bg-white border border-[#E6E1E8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold text-[#7136E8] uppercase tracking-wider">
              FREE DEVELOPER TRIAL
            </span>
            <div className="text-base font-bold text-[#191719] font-display">
              Want to verify performance before selecting a plan?
            </div>
            <p className="text-xs text-[#68636B]">
              Claim an instant 200,000 token test key with zero credit card required.
            </p>
          </div>

          <Link
            to="/trial"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#7136E8] hover:bg-[#4F21B5] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-center"
          >
            <span>Claim Free 200k Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Render Checkout Modal if a plan is actively selected */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          onClose={() => setSelectedPlanForCheckout(null)}
          plan={{
            ...selectedPlanForCheckout,
            billingPeriod,
          }}
        />
      )}
    </section>
  );
};
