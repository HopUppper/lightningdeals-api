import React, { useState, useEffect } from 'react';
import { Check, Sparkles, MessageSquare, Table, LayoutGrid, ShieldCheck, Zap, ArrowRight, Gift } from 'lucide-react';
import { ThreeDCard } from './ThreeDCard';
import { CheckoutModal } from './CheckoutModal';
import { useAuth } from '../context/AuthContext';
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
  currency: string;
  tagline: string;
  featured: boolean;
}

export const PricingSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanItem | null>(null);

  const fallbackPlans: PlanItem[] = [
    {
      id: 'pro',
      name: 'PRO',
      displayName: 'PRO (5M / 5h Window)',
      tokenAllowance: '5000000',
      tokenDisplay: '5M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      priceInr: 2499,
      currency: 'INR',
      tagline: 'High-performance access for active daily coding assistance',
      featured: true,
    },
    {
      id: 'max',
      name: 'MAX',
      displayName: 'MAX (20M / 5h Window)',
      tokenAllowance: '20000000',
      tokenDisplay: '20M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      priceInr: 5499,
      currency: 'INR',
      tagline: 'Best value for heavy IDE power users & builders',
      featured: false,
    },
    {
      id: 'ultra',
      name: 'ULTRA',
      displayName: 'ULTRA (40M / 5h Window)',
      tokenAllowance: '40000000',
      tokenDisplay: '40M TOKENS / 5 HOURS',
      windowHours: 5,
      validityDays: 30,
      priceInr: 9999,
      currency: 'INR',
      tagline: 'Maximum high-volume capacity for engineering teams',
      featured: false,
    },
  ];

  useEffect(() => {
    fetch('/api/checkout/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        } else {
          setPlans(fallbackPlans);
        }
      })
      .catch(() => setPlans(fallbackPlans));
  }, []);

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  const handleSelectPlan = (pkg: PlanItem) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'select_item', {
        items: [{ item_id: pkg.id, item_name: pkg.name }],
      });
    }

    if (!user) {
      navigate('/login?redirect=pricing');
    } else {
      setSelectedPlanForCheckout(pkg);
    }
  };

  return (
    <section id="pricing" className="py-16 sm:py-24 border-b border-border bg-white">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
              CLAUDE MAX
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              High-performance AI access for demanding workloads
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Select your 5-hour rolling token capacity. Automatic quota refresh every 5 hours with 30 days full validity.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-bg border border-border p-1 rounded-control shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white text-fg shadow-xs font-bold' : 'text-muted hover:text-fg'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-fg shadow-xs font-bold' : 'text-muted hover:text-fg'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Compare Table</span>
            </button>
          </div>
        </div>

        {/* Free Trial Banner */}
        <div className="p-6 sm:p-8 rounded-panel bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
              <Gift className="w-3 h-3" />
              <span>TRY BEFORE YOU BUY</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">FREE 1-DAY TRIAL</h3>
            <p className="text-xs sm:text-sm text-violet-100 font-mono">
              1M TOKENS / 5 HOURS • 24 HOURS VALIDITY • No payment required
            </p>
          </div>

          <Link
            to={user ? '/dashboard/plan' : '/register?redirect=trial'}
            className="w-full md:w-auto px-6 py-3.5 rounded-control bg-white text-violet-700 hover:bg-violet-50 font-bold text-xs shadow-md transition-all text-center flex items-center justify-center gap-2 shrink-0"
          >
            <span>START FREE TRIAL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Paid Plans Cards */}
        {viewMode === 'grid' && (
          <div className="grid sm:grid-cols-3 gap-6">
            {displayPlans.map((pkg) => (
              <ThreeDCard key={pkg.id} intensity={pkg.featured ? 15 : 8} className="h-full">
                <div
                  className={`glass-3d-card relative rounded-panel p-6 sm:p-8 flex flex-col justify-between h-full transition-all ${
                    pkg.featured ? 'border-violet-500 shadow-2xl ring-2 ring-violet-500/20 bg-violet-500/5' : ''
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3 fill-current" />
                      <span>MOST POPULAR</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-fg">{pkg.name}</h3>
                      <p className="text-xs text-muted min-h-[32px] leading-relaxed">{pkg.tagline}</p>
                    </div>

                    <div className="py-4 border-y border-border space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-violet-700">
                          ₹{pkg.priceInr.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-fg">
                        {pkg.tokenDisplay}
                      </div>
                      <div className="text-[11px] font-mono text-muted flex items-center gap-1 pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>30 DAYS VALIDITY</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-muted">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-fg">AUTOMATIC QUOTA REFRESH</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Every {pkg.windowHours} Hours Reset Window</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Full Claude 3.7 Sonnet & Opus Access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Instant Cashfree Payments Gateway</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleSelectPlan(pkg)}
                      className={`w-full py-3.5 rounded-control font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                        pkg.featured
                          ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white shadow-violet-500/25'
                          : 'bg-fg text-bg hover:bg-fg/90'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>BUY NOW</span>
                    </button>
                  </div>
                </div>
              </ThreeDCard>
            ))}
          </div>
        )}

        {/* View Mode: Compare Table */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto rounded-panel border border-border shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-border text-xs font-mono font-bold uppercase tracking-wider text-muted">
                  <th className="p-4">Plan</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quota / 5 Hours</th>
                  <th className="p-4">Validity</th>
                  <th className="p-4">Refresh Interval</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium">
                {displayPlans.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-4 font-bold text-fg flex items-center gap-2">
                      <span>{pkg.name}</span>
                      {pkg.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-mono font-bold">
                          MOST POPULAR
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-violet-700">₹{pkg.priceInr.toLocaleString()}</td>
                    <td className="p-4 font-mono font-semibold text-fg">{pkg.tokenDisplay}</td>
                    <td className="p-4 font-mono text-muted">{pkg.validityDays} Days</td>
                    <td className="p-4 font-mono text-muted">Every 5 Hours</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSelectPlan(pkg)}
                        className="px-4 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" /> BUY NOW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* WhatsApp Contact Note */}
        <div className="text-center text-xs text-muted font-mono pt-4 border-t border-border/60">
          Need custom volume enterprise allocations?{' '}
          <a
            href="https://wa.me/917695956938?text=Hi%20LightningDeals!%20I%20need%20a%20custom%20Claude%20enterprise%20plan."
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-700 hover:underline font-bold inline-flex items-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Contact on WhatsApp
          </a>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
        />
      )}
    </section>
  );
};

export default PricingSection;
