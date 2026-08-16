import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, MessageSquare, Table, LayoutGrid, ArrowRight, ShoppingCart, ShieldCheck } from 'lucide-react';
import { ThreeDCard } from './ThreeDCard';
import { CheckoutModal } from './CheckoutModal';

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const WHATSAPP_URL = 'https://wa.me/917695956938?text=Hi%2C%20I%20want%20to%20buy%20a%20custom%20LightningDeals%20API%20key%20package';

  useEffect(() => {
    fetch('/api/checkout/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.plans && Array.isArray(data.plans)) {
          setPlans(data.plans);
        }
      })
      .catch((err) => console.error('Failed to load pricing plans:', err));
  }, []);

  const handleBuyClick = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  return (
    <section id="pricing" className="py-16 sm:py-24 border-b border-border bg-white">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12">
        {/* Section Header & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
              Automated Online Checkout
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              Prepaid Token Packages & Instant Activation
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Select your plan to start checkout. Payment signatures are independently verified server-side to provision your API key instantly.
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

        {/* View Mode: Cards */}
        {viewMode === 'grid' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((pkg) => (
              <ThreeDCard key={pkg.id} intensity={pkg.featured ? 15 : 8} className="h-full">
                <div
                  className={`glass-3d-card relative rounded-panel p-6 flex flex-col justify-between h-full transition-all ${
                    pkg.featured ? 'border-violet-500 shadow-xl ring-2 ring-violet-500/20' : ''
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3 fill-current" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-fg">{pkg.name}</h3>
                      <p className="text-xs text-muted min-h-[36px]">{pkg.tagline}</p>
                    </div>

                    <div className="py-3 border-y border-border">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight font-mono text-fg">
                          ₹{pkg.priceInr.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted font-medium">/ 30 days</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-violet-700 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{pkg.tokenDisplay} ({pkg.windowHours}h window)</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-muted">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Full Claude 3.7 Sonnet & Opus Access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{pkg.windowHours}-Hour Auto-Rolling Reset</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Instant Server API Key Provisioning</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 space-y-2">
                    <button
                      onClick={() => handleBuyClick(pkg)}
                      className={`w-full py-2.5 rounded-control font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                        pkg.featured
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110'
                          : 'bg-fg text-bg hover:bg-slate-800'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Buy Now</span>
                    </button>

                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-control font-semibold text-[11px] text-muted hover:text-fg hover:bg-subtle border border-border transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-500" />
                      <span>WhatsApp Desk</span>
                    </a>
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
                  <th className="p-4">Package</th>
                  <th className="p-4">Token Allocation</th>
                  <th className="p-4">Rolling Window</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium">
                {plans.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-subtle/50 transition-colors">
                    <td className="p-4 font-bold text-fg">{pkg.name}</td>
                    <td className="p-4 font-mono font-semibold text-violet-700">{pkg.tokenDisplay}</td>
                    <td className="p-4 font-mono text-muted">{pkg.windowHours} Hours</td>
                    <td className="p-4 font-mono font-extrabold text-fg">₹{pkg.priceInr.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleBuyClick(pkg)}
                        className="px-4 py-2 rounded-control bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Buy Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={selectedPlan}
        />
      )}
    </section>
  );
};

export default PricingSection;
