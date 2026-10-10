import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Layers,
  Clock,
  TrendingDown,
  Calculator,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CheckoutModal } from './CheckoutModal';

export interface PlanItem {
  id: string;
  name: string;
  displayName?: string;
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
  featured?: boolean;
}

export const ElectricCapacitySection: React.FC = () => {
  const { user } = useAuth();
  const { addToCart, openCart } = useCart();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compare'>('grid');
  
  // Interactive Token Velocity Calculator State
  const [dailyHours, setDailyHours] = useState<number>(4);

  const fallbackPlans: PlanItem[] = [
    {
      id: 'plan_5x',
      name: 'Claude Max 5x',
      displayName: 'Claude Max 5x (5M / 5h)',
      tokenAllowance: '5000000',
      tokenDisplay: '5M Tokens / 5h',
      windowHours: 5,
      validityDays: 30,
      priceInr: 299,
      originalPriceInr: 499,
      currency: 'INR',
      tagline: 'Ideal for light coding, CLI experiments, and small individual scripts with Sonnet 3.5.',
      badge: 'Starter Pass',
      featured: false,
      features: [
        '5,000,000 Tokens / 5h Rolling Window',
        '30-Day Fixed Active Validity',
        'Claude Sonnet 3.5 & Haiku 4.5 Access',
        'Sub-35ms Gateway Ingress',
        'Instant Key Delivery via Dashboard',
      ],
    },
    {
      id: 'plan_20x',
      name: 'Claude Max 20x',
      displayName: 'Claude Max 20x (20M / 5h)',
      tokenAllowance: '20000000',
      tokenDisplay: '20M Tokens / 5h',
      windowHours: 5,
      validityDays: 30,
      priceInr: 899,
      originalPriceInr: 1499,
      currency: 'INR',
      tagline: 'Great for daily coding assistance, Cursor Composer, and persistent Claude Code sessions.',
      badge: 'Most Popular',
      featured: true,
      features: [
        '20,000,000 Tokens / 5h Rolling Window',
        '30-Day Fixed Active Validity',
        'Full Model Access: Opus 5, Sonnet & Haiku',
        'Priority Gateway Routing',
        'Standard Developer Support Desk',
      ],
    },
    {
      id: 'plan_40x',
      name: 'Claude Max 40x',
      displayName: 'Claude Max 40x (40M / 5h)',
      tokenAllowance: '40000000',
      tokenDisplay: '40M Tokens / 5h',
      windowHours: 5,
      validityDays: 30,
      priceInr: 1699,
      originalPriceInr: 2499,
      currency: 'INR',
      tagline: 'Popular choice for active professional developers and deep architectural refactoring.',
      badge: 'High Velocity',
      featured: false,
      features: [
        '40,000,000 Tokens / 5h Rolling Window',
        '30-Day Fixed Active Validity',
        'All Top Claude 5 & Extended Thinking Models',
        'Cursor, Windsurf & CLI Ready',
        'Priority Ticket Support Desk',
      ],
    },
    {
      id: 'plan_100x',
      name: 'Claude Max 100x',
      displayName: 'Claude Max 100x (100M / 5h)',
      tokenAllowance: '100000000',
      tokenDisplay: '100M Tokens / 5h',
      windowHours: 5,
      validityDays: 30,
      priceInr: 3999,
      originalPriceInr: 5999,
      currency: 'INR',
      tagline: 'Best value for heavy IDE power users, complex codebases, and production engineering.',
      badge: 'Maximum Headroom',
      featured: false,
      features: [
        '100,000,000 Tokens / 5h Rolling Window',
        '30-Day Fixed Active Validity',
        'All Claude Models with 1M Context Window',
        'Sub-20ms Time-to-First-Token Ingress',
        'VIP Direct Engineering Support',
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

  const handleAddToCart = (pkg: PlanItem) => {
    addToCart({
      id: pkg.id,
      planId: pkg.id,
      name: pkg.name,
      priceInr: pkg.priceInr,
      originalPriceInr: pkg.originalPriceInr,
      tokenDisplay: `${(Number(pkg.tokenAllowance || 0) / 1_000_000).toFixed(0)}M Tokens`,
      windowHours: pkg.windowHours,
      validityDays: pkg.validityDays,
      tagline: pkg.tagline,
      badge: pkg.badge,
    });
    openCart();
  };

  // Calculator recommendation
  const recommendedTier = dailyHours <= 3 ? 'PRO CREATOR' : dailyHours <= 7 ? 'STUDIO MAX' : 'ENTERPRISE SCALE';
  const estimatedCloudBill = Math.round(dailyHours * 30 * 240); // Approx INR cost on metered cloud
  const savingsPercent = Math.round(((estimatedCloudBill - (dailyHours <= 3 ? 2499 : dailyHours <= 7 ? 6999 : 14999)) / estimatedCloudBill) * 100);

  return (
    <section id="pricing" className="py-20 sm:py-24 lg:py-28 bg-[#f7f4ec] border-b border-[#e7e5e4] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Masthead with Grid/Compare Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e7e5e4]">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e7e5e4] text-xs font-mono font-medium text-[#6d28d9] uppercase tracking-wider shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>PREDICTABLE CAPACITY · TRANSPARENT PRICING</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1c1917] leading-[1.1]">
              Guaranteed token flow on a 5-hour rolling cycle.
            </h2>

            <p className="text-base text-[#57534e] leading-relaxed">
              Every key is assigned a generous token allowance that reloads continuously every 5 hours. Zero auto-renewing credit card traps.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl text-xs font-medium border border-[#e7e5e4] shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#6d28d9] text-white font-semibold' : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              Tier Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'compare' ? 'bg-[#6d28d9] text-white font-semibold' : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              Side-by-Side Compare
            </button>
          </div>
        </div>

        {/* Free 1,000,000 Token Trial Pass Banner */}
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-[#ecfdf5] via-[#f0fdf4] to-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluate Free for 24 Hours</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1c1917]">
              Start with 1,000,000 Complimentary Tokens
            </h3>
            <p className="text-xs sm:text-sm text-[#57534e]">
              Full access to Sonnet 3.5 and Haiku 4.5. Valid for 24 hours. No credit card required.
            </p>
          </div>

          <Link
            to={user ? '/dashboard/plan' : '/register?redirect=trial'}
            className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Claim Free 1M Pass</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive Token Velocity Calculator */}
        <div className="rounded-2xl border border-[#e7e5e4] bg-white p-6 sm:p-8 space-y-6 shadow-warm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7e5e4]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#f5f3ff] text-[#6d28d9]">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#6d28d9] font-bold uppercase tracking-wider block">INTERACTIVE SIZING ESTIMATOR</span>
                <h4 className="text-base font-bold text-[#1c1917]">How much do you code or synthesize each day?</h4>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#78716c]">Recommended Tier:</span>
              <span className="text-sm font-bold text-[#6d28d9] block">{recommendedTier}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-semibold">
              <span className="text-[#57534e]">Average Daily AI Coding & Synthesis:</span>
              <span className="font-mono text-base text-[#1c1917] font-bold">{dailyHours} Hours / Day</span>
            </div>
            
            <input
              type="range"
              min="1"
              max="16"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full accent-[#6d28d9] cursor-pointer"
            />
            
            <div className="flex justify-between text-[11px] font-mono text-[#78716c]">
              <span>1h (Casual Light)</span>
              <span>4h (Daily Full-Stack)</span>
              <span>8h (Heavy Agentic)</span>
              <span>16h (Team / Multi-Agent)</span>
            </div>
          </div>

          {/* Savings Projection Callout */}
          <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#e7e5e4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#1c1917] block">Estimated Metered Cloud Cost: ~₹{estimatedCloudBill.toLocaleString()}/mo</span>
              <span className="text-[#78716c]">With LightningAPI prepaid rolling capacity, you eliminate surprise spikes.</span>
            </div>
            {savingsPercent > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono shrink-0">
                Save ~{savingsPercent}% vs Metered Overages
              </span>
            )}
          </div>
        </div>

        {/* Paid Plans Display: Grid Mode */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {displayPlans.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white p-7 rounded-3xl flex flex-col h-full relative transition-all shadow-xs ${
                  pkg.featured
                    ? 'border-2 border-[#6d28d9] shadow-warm ring-2 ring-[#6d28d9]/10'
                    : 'border border-[#e7e5e4] hover:border-[#d6d3d1]'
                }`}
              >
                {pkg.badge && (
                  <div
                    className={`absolute -top-3.5 left-7 px-3.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      pkg.featured
                        ? 'bg-[#6d28d9] text-white shadow-plum'
                        : 'bg-[#1c1917] text-white'
                    }`}
                  >
                    {pkg.badge}
                  </div>
                )}

                {/* Card Title & Tagline */}
                <div className="min-h-[80px] flex flex-col justify-start space-y-1.5 pt-1">
                  <h3 className="text-xl font-extrabold text-[#1c1917] tracking-tight">{pkg.name}</h3>
                  <p className="text-xs text-[#78716c] leading-relaxed line-clamp-2">{pkg.tagline}</p>
                </div>

                {/* Price Block */}
                <div className="py-4 border-y border-[#e7e5e4] my-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#1c1917] tracking-tight font-mono">
                      ₹{pkg.priceInr.toLocaleString()}
                    </span>
                    {pkg.originalPriceInr && (
                      <span className="text-xs text-[#78716c] line-through font-mono">
                        ₹{pkg.originalPriceInr.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#6d28d9] font-mono">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{pkg.tokenDisplay}</span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-2.5 text-xs text-[#57534e] flex-1 pb-6">
                  {(pkg.features || fallbackPlans[0].features!).map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Buttons */}
                <div className="mt-auto pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(pkg)}
                    className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      pkg.featured
                        ? 'bg-[#6d28d9] hover:bg-[#581c87] text-white shadow-plum'
                        : 'bg-[#1c1917] hover:bg-black text-white shadow-xs'
                    }`}
                  >
                    <span>Select Plan — ₹{pkg.priceInr.toLocaleString()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(pkg)}
                    className="w-full py-2.5 rounded-xl border border-[#e7e5e4] bg-white hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#78716c]" />
                    <span>Add to Cart</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Compare Mode Table */}
        {viewMode === 'compare' && (
          <div className="bg-white rounded-3xl border border-[#e7e5e4] overflow-hidden shadow-warm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fbf9f5] border-b border-[#e7e5e4]">
                    <th className="p-4 sm:p-5 font-bold text-[#1c1917]">Feature Specification</th>
                    <th className="p-4 sm:p-5 font-bold text-[#1c1917]">PRO CREATOR</th>
                    <th className="p-4 sm:p-5 font-bold text-[#6d28d9]">STUDIO MAX</th>
                    <th className="p-4 sm:p-5 font-bold text-[#1c1917]">ENTERPRISE SCALE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e5e4]">
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Price (30 Days)</td>
                    <td className="p-4 font-mono">₹2,499</td>
                    <td className="p-4 font-mono font-bold text-[#6d28d9]">₹6,999</td>
                    <td className="p-4 font-mono">₹14,999</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Rolling Quota (Every 5 Hours)</td>
                    <td className="p-4 font-mono">5,000,000 Tokens</td>
                    <td className="p-4 font-mono font-bold text-[#6d28d9]">20,000,000 Tokens</td>
                    <td className="p-4 font-mono">50,000,000 Tokens</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Supported Models</td>
                    <td className="p-4">Sonnet 3.5 & Haiku 4.5</td>
                    <td className="p-4 font-medium text-[#6d28d9]">All Models (Opus, Sonnet, Haiku)</td>
                    <td className="p-4">All Models + Priority Concurrency</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Protocol Compatibility</td>
                    <td className="p-4">Anthropic /v1/messages</td>
                    <td className="p-4">Anthropic /v1/messages</td>
                    <td className="p-4">Anthropic /v1/messages</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#1c1917]">Data Privacy SLA</td>
                    <td className="p-4 text-emerald-600 font-semibold">Zero Prompt Logging</td>
                    <td className="p-4 text-emerald-600 font-semibold">Zero Prompt Logging</td>
                    <td className="p-4 text-emerald-600 font-semibold">Zero Prompt Logging</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {selectedPlanForCheckout && (
        <CheckoutModal
          onClose={() => setSelectedPlanForCheckout(null)}
          plan={{
            id: selectedPlanForCheckout.id,
            name: selectedPlanForCheckout.name,
            priceInr: selectedPlanForCheckout.priceInr,
            tokenDisplay: `${(Number(selectedPlanForCheckout.tokenAllowance || 0) / 1_000_000).toFixed(0)}M Tokens`,
            windowHours: selectedPlanForCheckout.windowHours,
            validityDays: selectedPlanForCheckout.validityDays,
            tagline: selectedPlanForCheckout.tagline,
          }}
        />
      )}
    </section>
  );
};
