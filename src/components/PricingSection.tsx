import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, ShieldCheck, ShoppingBag, LayoutGrid, Table, Sparkles } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';

export interface PlanItem {
  id: string;
  name: string;
  displayName: string;
  tokenAllowance: string;
  tokenDisplay: string;
  windowHours: number;
  validityDays: number;
  priceInr: number;
  originalPriceInr?: number;
  currency: string;
  tagline: string;
  badge?: string;
  features?: string[];
  featured: boolean;
}

export const PricingSection: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanItem | null>(null);

  const fallbackPlans: PlanItem[] = [
    {
      id: 'pro',
      name: 'PRO CREATOR',
      displayName: 'PRO (5M / 5h Window)',
      tokenAllowance: '5000000',
      tokenDisplay: '5M Tokens / 5h',
      windowHours: 5,
      validityDays: 30,
      priceInr: 2499,
      originalPriceInr: 3499,
      currency: 'INR',
      tagline: 'Ideal for creators, writers, and daily coding assistance with Sonnet 3.5',
      badge: 'Starter Choice',
      featured: false,
      features: [
        '5,000,000 Tokens / 5h Rolling Window',
        '30-Day Fixed Active Validity',
        'Claude Sonnet 5 & Haiku 4.5 Access',
        'Sub-50ms Gateway Routing',
        'Instant Automated Key Delivery',
      ],
    },
    {
      id: 'max',
      name: 'STUDIO MAX',
      displayName: 'MAX (20M / 5h Window)',
      tokenAllowance: '20000000',
      tokenDisplay: '20M Tokens / 5h',
      windowHours: 5,
      validityDays: 30,
      priceInr: 6999,
      originalPriceInr: 9999,
      currency: 'INR',
      tagline: 'High-power access for professional engineering, agentic loops, and heavy workflows',
      badge: 'Most Popular',
      featured: true,
      features: [
        '20,000,000 Tokens / 5h Rolling Window',
        '30-Day Fixed Active Validity',
        'Full Access: Opus 5, Sonnet 5 & Haiku',
        'Priority Gateway Routing',
        'Dedicated Technical Support Desk',
      ],
    },
    {
      id: 'ultra',
      name: 'ENTERPRISE SCALE',
      displayName: 'ULTRA (50M / 5h Window)',
      tokenAllowance: '50000000',
      tokenDisplay: '50M Tokens / 5h',
      windowHours: 5,
      validityDays: 30,
      priceInr: 14999,
      originalPriceInr: 19999,
      currency: 'INR',
      tagline: 'Engineered for production workloads, agencies, and high-concurrency dev teams',
      badge: 'Team Power',
      featured: false,
      features: [
        '50,000,000 Tokens / 5h Rolling Window',
        '30-Day Fixed Active Validity',
        'All Claude Generation Models',
        'Multi-Key Management & Isolation',
        'Direct Engineering Priority SLAs',
      ],
    },
  ];

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load plans');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PlanItem[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            displayName: p.displayName || p.name,
            tokenAllowance: String(p.tokenAllowance || 5000000),
            tokenDisplay: `${(Number(p.tokenAllowance || 5000000) / 1000000).toFixed(0)}M Tokens / 5h`,
            windowHours: p.windowHours || 5,
            validityDays: p.validityDays || 30,
            priceInr: p.priceInr || 2499,
            originalPriceInr: p.originalPriceInr,
            currency: 'INR',
            tagline: p.description || 'Prepaid token access with 5-hour rolling renewal',
            badge: p.badge || undefined,
            features: p.features || undefined,
            featured: p.isPopular || false,
          }));
          setPlans(mapped);
        } else {
          setPlans(fallbackPlans);
        }
      })
      .catch(() => {
        setPlans(fallbackPlans);
      });
  }, []);

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  const handleSelectPlan = (pkg: PlanItem) => {
    if (user) {
      setSelectedPlanForCheckout(pkg);
    } else {
      navigate(`/register?plan=${pkg.id}`);
    }
  };

  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-24 border-b border-[#e7e5e4] bg-[#fbf9f5] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
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
            <h3 className="text-lg sm:text-xl font-bold text-[#1c1917]">Evaluate with 1,000,000 Tokens</h3>
            <p className="text-xs text-[#78716c]">
              1,000,000 tokens / 5-hour window • 24 hours duration • No credit card required to start
            </p>
          </div>

          <Link
            to={user ? '/dashboard/plan' : '/register?redirect=trial'}
            className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#581c87] text-white text-xs font-semibold shadow-plum flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <span>Claim Free 1M Trial Pass</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Paid Plans Cards with Strict Geometric Alignment */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {displayPlans.map((pkg) => (
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
                <div className="py-4 border-y border-[#e7e5e4] space-y-1 bg-[#fdfbf7] -mx-6 px-6 sm:-mx-7 sm:px-7">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-[#1c1917]">
                      ₹{pkg.priceInr.toLocaleString()}
                    </span>
                    {pkg.originalPriceInr && (
                      <span className="text-xs text-[#a8a29e] line-through">
                        ₹{pkg.originalPriceInr.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[#6d28d9]">
                    {pkg.tokenDisplay}
                  </div>
                  <div className="text-[11px] text-[#78716c] flex items-center gap-1 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                    <span>{pkg.validityDays} Days Validity • 5h Rolling Cycle</span>
                  </div>
                </div>

                {/* Feature List (Expands with flex-1 so buttons pin to bottom evenly) */}
                <ul className="flex-1 space-y-2.5 py-5 text-xs text-[#57534e]">
                  {pkg.features && pkg.features.length > 0 ? (
                    pkg.features.map((f, i) => (
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
                    onClick={() => handleSelectPlan(pkg)}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      pkg.featured
                        ? 'bg-[#6d28d9] hover:bg-[#581c87] text-white shadow-plum'
                        : 'bg-[#1c1917] hover:bg-black text-white'
                    }`}
                  >
                    <span>Select Plan — ₹{pkg.priceInr.toLocaleString()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        id: pkg.id,
                        planId: pkg.id,
                        name: pkg.displayName || pkg.name,
                        priceInr: pkg.priceInr,
                        originalPriceInr: pkg.originalPriceInr,
                        tokenDisplay: pkg.tokenDisplay || `${(Number(pkg.tokenAllowance || 0) / 1_000_000).toFixed(0)}M Tokens`,
                        windowHours: pkg.windowHours,
                        validityDays: pkg.validityDays,
                        tagline: pkg.tagline,
                        badge: pkg.badge,
                      })
                    }
                    className="w-full py-2 rounded-xl font-medium text-xs text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] border border-[#e7e5e4] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>

              </div>
            ))}
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
                    <td className="p-4 font-semibold text-[#1c1917]">Price</td>
                    {displayPlans.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-[#e7e5e4] font-bold text-[#1c1917]">
                        ₹{pkg.priceInr.toLocaleString()}
                      </td>
                    ))}
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
                        {pkg.validityDays} Days Fixed
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
                    {displayPlans.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-[#e7e5e4]">
                        <button
                          type="button"
                          onClick={() => handleSelectPlan(pkg)}
                          className="px-3 py-1.5 rounded-lg bg-[#1c1917] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      </td>
                    ))}
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
