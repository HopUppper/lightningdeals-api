import React, { useState, useEffect, useMemo } from 'react';
import { Check, ArrowRight, ShieldCheck, ShoppingBag, LayoutGrid, Table, Sparkles } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { PricingBillingToggle, BillingPeriod } from './PricingBillingToggle';

import { usePlans, PlanItem } from '../context/PlansContext';

export const PricingSection: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const { plans, loading } = usePlans();
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);

  const displayPlans = useMemo(() => {
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
    if (isYearly && !pkg.annualPriceInr) return;
    const activePrice = isYearly ? (pkg.annualPriceInr || pkg.priceInr) : pkg.priceInr;
    const activeValidity = isYearly ? (pkg.annualValidityDays || 365) : pkg.validityDays;

    const selected = {
      ...pkg,
      priceInr: activePrice,
      validityDays: activeValidity,
      billingPeriod,
    };
    if (user) {
      setSelectedPlanForCheckout(selected);
    } else {
      navigate(`/register?plan=${pkg.id}&billing=${billingPeriod}`);
    }
  };

  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 border-b border-[#e7e5e4] bg-[#fbf9f5] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Header with Cards/Compare Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#e7e5e4] pb-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
              Token Allocation
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1917]">
              Predictable capacity. Straightforward pricing.
            </h2>
            <p className="text-sm sm:text-base text-[#57534e] leading-relaxed">
              Every key is assigned a generous token allowance on a continuous 5-hour rolling cycle.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#f5f2eb] p-1 rounded-xl text-xs font-medium border border-[#e7e5e4]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#1c1917] shadow-xs font-semibold' : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#1c1917] shadow-xs font-semibold' : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* Free Trial Banner */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#e7e5e4] flex flex-col md:flex-row items-center justify-between gap-5 shadow-xs">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0]">
              <Sparkles className="w-3 h-3 text-[#059669]" />
              <span>Free 1-Day Trial Pass</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1c1917]">Evaluate with 200,000 Tokens</h3>
            <p className="text-xs text-[#78716c]">
              200,000 tokens / 5-hour window • 24 hours duration • No credit card required to start
            </p>
          </div>

          <Link
            to={user ? '/dashboard/plan' : '/register?redirect=trial'}
            className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <span>Claim Free 200k Trial Pass</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Authoritative Monthly / Annual Billing Toggle */}
        <div className="flex flex-col items-center justify-center pt-2 pb-1">
          <PricingBillingToggle
            billingPeriod={billingPeriod}
            onChange={setBillingPeriod}
          />
        </div>

        {/* Paid Plans Cards with Strict Geometric Alignment */}
        {viewMode === 'grid' && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${displayPlans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 items-stretch`}>
            {displayPlans.map((pkg) => {
              const isYearly = billingPeriod === 'yearly';
              const hasAnnual = Boolean(pkg.annualPriceInr && pkg.annualPriceInr > 0);
              const activePrice = isYearly ? (pkg.annualPriceInr || 0) : pkg.priceInr;
              const activeOriginalPrice = isYearly ? pkg.annualOriginalPriceInr : pkg.originalPriceInr;
              const monthlyEquivalent = isYearly && hasAnnual ? Math.round(activePrice / 12) : null;
              const yearly12xMonthly = pkg.priceInr * 12;
              const annualSavings = hasAnnual ? yearly12xMonthly - (pkg.annualPriceInr || 0) : 0;
              const annualSavingsPercent = hasAnnual && yearly12xMonthly > 0 ? Math.round((annualSavings / yearly12xMonthly) * 100) : 0;
              const isAnnualUnavailable = isYearly && !hasAnnual;

              return (
                <div
                  key={pkg.id}
                  className={`bg-white p-6 sm:p-7 rounded-2xl flex flex-col h-full relative transition-all shadow-xs ${
                    pkg.featured
                      ? 'border-2 border-[#6d28d9] shadow-warm'
                      : 'border border-[#e7e5e4] hover:border-[#d6d3d1]'
                  }`}
                >
                  {pkg.badge && (
                    <div
                      className={`absolute -top-3 left-6 px-3 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                        pkg.featured
                          ? 'bg-[#6d28d9] text-white shadow-xs'
                          : 'bg-[#1c1917] text-white'
                      }`}
                    >
                      {pkg.badge}
                    </div>
                  )}

                  {/* Card Header (Fixed height block to lock title baseline) */}
                  <div className="min-h-[72px] sm:min-h-[80px] flex flex-col justify-start space-y-1 pt-1">
                    <h3 className="text-lg font-bold text-[#1c1917] tracking-tight">{pkg.name}</h3>
                    <p className="text-xs text-[#78716c] leading-relaxed line-clamp-2">{pkg.tagline}</p>
                  </div>

                  {/* Price Block (Fixed height block to lock price baseline) */}
                  <div className="py-4 border-y border-[#e7e5e4] space-y-1.5 bg-[#fdfbf7] -mx-6 px-6 sm:-mx-7 sm:px-7">
                    {isAnnualUnavailable ? (
                      <div className="py-2.5 text-center">
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Annual billing unavailable
                        </span>
                        <p className="text-[11px] text-[#78716c] mt-0.5">Available on monthly cycle</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-bold text-[#1c1917] font-mono">
                            ₹{activePrice.toLocaleString()}
                          </span>
                          <span className="text-xs font-mono text-[#78716c]">
                            {isYearly ? '/ year' : '/ month'}
                          </span>
                          {activeOriginalPrice && (
                            <span className="text-xs text-[#a8a29e] line-through font-mono ml-auto">
                              ₹{activeOriginalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Yearly equivalent monthly breakdown & savings */}
                        {isYearly && monthlyEquivalent && (
                          <div className="space-y-0.5 pt-0.5">
                            <div className="text-[11px] font-mono text-[#57534e]">
                              Equivalent to <strong className="text-[#1c1917]">₹{monthlyEquivalent.toLocaleString()}</strong> / month · billed annually
                            </div>
                            {annualSavings > 0 && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Save ₹{annualSavings.toLocaleString()} ({annualSavingsPercent}%) vs 12 monthly payments</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div className="text-xs font-semibold text-[#6d28d9] font-mono pt-0.5">
                      {pkg.tokenDisplay}
                    </div>
                    <div className="text-[11px] text-[#78716c] flex items-center gap-1 pt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                      <span>
                        {isYearly ? '365 Days Extended Validity' : `${pkg.validityDays} Days Validity`} • 5h Rolling Cycle
                      </span>
                    </div>
                  </div>

                  {/* Feature List (Expands with flex-1 so buttons pin to bottom evenly) */}
                  <ul className="flex-1 space-y-2.5 py-5 text-xs text-[#57534e]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span>
                        {isYearly ? (
                          <strong className="text-[#1c1917]">365-Day Validity (1 Full Year)</strong>
                        ) : (
                          `${pkg.validityDays}-Day Fixed Validity`
                        )}
                      </span>
                    </li>
                    {pkg.features && pkg.features.length > 0 ? (
                      pkg.features
                        .filter((f) => !f.toLowerCase().includes('validity'))
                        .map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                          <span className="font-medium text-[#1c1917]">Automatic Rolling Refresh</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                          <span>Every {pkg.windowHours} Hours Reset Window</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                          <span>Claude Opus 5, Sonnet 5 & Haiku</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                          <span>Instant API Key Delivery</span>
                        </li>
                      </>
                    )}
                  </ul>

                  {/* Action Buttons (Pinned to bottom via mt-auto) */}
                  <div className="mt-auto pt-4 space-y-2 border-t border-[#f5f2eb]">
                    <button
                      type="button"
                      disabled={isAnnualUnavailable}
                      onClick={() => handleSelectPlan(pkg)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        isAnnualUnavailable
                          ? 'bg-[#e7e5e4] text-[#a8a29e] cursor-not-allowed'
                          : pkg.featured
                          ? 'bg-[#6d28d9] hover:bg-[#581c87] text-white shadow-plum cursor-pointer'
                          : 'bg-[#1c1917] hover:bg-black text-white cursor-pointer'
                      }`}
                    >
                      <span>
                        {isAnnualUnavailable
                          ? 'Unavailable for Annual'
                          : `Select ${isYearly ? 'Annual ' : ''}Plan — ₹${activePrice.toLocaleString()}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isAnnualUnavailable}
                      onClick={() =>
                        addToCart({
                          id: pkg.id,
                          planId: pkg.id,
                          name: pkg.displayName || pkg.name,
                          priceInr: activePrice,
                          originalPriceInr: activeOriginalPrice,
                          tokenDisplay: pkg.tokenDisplay || `${(Number(pkg.tokenAllowance || 0) / 1_000_000).toFixed(0)}M Tokens`,
                          windowHours: pkg.windowHours,
                          validityDays: isYearly ? (pkg.annualValidityDays || 365) : pkg.validityDays,
                          tagline: pkg.tagline,
                          badge: pkg.badge,
                          billingPeriod,
                        })
                      }
                      className={`w-full py-2 rounded-xl font-medium text-xs border border-[#e7e5e4] flex items-center justify-center gap-1.5 transition-colors ${
                        isAnnualUnavailable
                          ? 'bg-[#f5f5f4] text-[#a8a29e] cursor-not-allowed'
                          : 'text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] cursor-pointer'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Comparison Table View */}
        {viewMode === 'table' && (
          <div className="border border-[#e7e5e4] rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fdfbf7] border-b border-[#e7e5e4] text-[#78716c] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Plan Specification</th>
                    {displayPlans.map((pkg) => (
                      <th key={pkg.id} className="p-4 border-l border-[#e7e5e4]">
                        {pkg.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e5e4] text-[#57534e]">
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">
                      Price ({billingPeriod === 'yearly' ? '365 Days Extended' : '30 Days'})
                    </td>
                    {displayPlans.map((pkg) => {
                      const isYearly = billingPeriod === 'yearly';
                      const price = isYearly ? pkg.annualPriceInr : pkg.priceInr;
                      return (
                        <td key={pkg.id} className="p-4 border-l border-[#e7e5e4] font-bold text-[#1c1917]">
                          {price ? (
                            <div>
                              <span>₹{price.toLocaleString()}</span>
                              {isYearly && (
                                <span className="block text-[10px] font-normal text-[#78716c]">
                                  (₹{Math.round(price / 12).toLocaleString()}/mo)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#a8a29e] font-normal">Unavailable</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">5-Hour Token Quota</td>
                    {displayPlans.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-[#e7e5e4] font-mono text-[#6d28d9] font-semibold">
                        {pkg.tokenDisplay}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Validity</td>
                    {displayPlans.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-[#e7e5e4]">
                        {billingPeriod === 'yearly' ? '365 Days Extended' : `${pkg.validityDays} Days Fixed`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Models Supported</td>
                    {displayPlans.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-[#e7e5e4]">
                        Sonnet 5, Opus 5, Haiku
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Action</td>
                    {displayPlans.map((pkg) => {
                      const isYearly = billingPeriod === 'yearly';
                      const isUnavailable = isYearly && !pkg.annualPriceInr;
                      return (
                        <td key={pkg.id} className="p-4 border-l border-[#e7e5e4]">
                          <button
                            type="button"
                            disabled={isUnavailable}
                            onClick={() => handleSelectPlan(pkg)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isUnavailable
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                : 'bg-[#1c1917] text-white hover:bg-black cursor-pointer'
                            }`}
                          >
                            {isUnavailable ? 'Unavailable' : 'Select'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {selectedPlanForCheckout && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
        />
      )}
    </section>
  );
};
