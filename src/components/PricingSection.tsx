import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, MessageSquare, Table, LayoutGrid, ArrowRight } from 'lucide-react';
import { ThreeDCard } from './ThreeDCard';

export const PricingSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const WHATSAPP_URL = "https://wa.me/917695956938?text=Hi%2C%20I%20want%20to%20buy%20a%20LightningDeals%20API%20key%20package";

  const tokenPackages = [
    {
      planName: 'Claude Max 5x',
      priceLabel: 'WhatsApp for Price',
      tokens: '5 Million Tokens',
      allocation: '5M / 5h Window',
      tagline: 'Ideal for starter projects & light coding',
      featured: false,
    },
    {
      planName: 'Claude Max 20x',
      priceLabel: 'WhatsApp for Price',
      tokens: '20 Million Tokens',
      allocation: '20M / 5h Window',
      tagline: 'Great for active daily coding assistance',
      featured: true,
    },
    {
      planName: 'Claude Max 40x',
      priceLabel: 'WhatsApp for Price',
      tokens: '40 Million Tokens',
      allocation: '40M / 5h Window',
      tagline: 'Best value for heavy IDE power users & builders',
      featured: false,
    },
    {
      planName: 'Claude Max 100x',
      priceLabel: 'WhatsApp for Price',
      tokens: '100 Million Tokens',
      allocation: '100M / 5h Window',
      tagline: 'High volume allocation for full engineering squads',
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 border-b border-border bg-white">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12">
        
        {/* Section Header & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
              Prepaid Token Packages
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
              Prepaid Token Packages & Pricing
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Every key receives a 5-hour rolling token window that auto-resets on cycle. Contact our WhatsApp help desk for instant key allocation & customized package deals.
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
            {tokenPackages.map((pkg, idx) => (
              <ThreeDCard key={idx} intensity={pkg.featured ? 15 : 8} className="h-full">
                <div
                  className={`glass-3d-card relative rounded-panel p-6 flex flex-col justify-between h-full transition-all ${
                    pkg.featured
                      ? 'border-violet-500 shadow-xl ring-2 ring-violet-500/20'
                      : ''
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3 fill-current" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="border-b border-border/80 pb-4">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                        {pkg.planName}
                      </span>
                      <div className="mt-3">
                        <span className="text-base font-extrabold text-emerald-600 font-mono flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>WhatsApp for Pricing</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1.5 min-h-[32px]">{pkg.tagline}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-lg font-extrabold font-mono text-fg">{pkg.allocation}</span>
                      <p className="text-[11px] text-emerald-600 font-semibold">✓ 5-Hour Rolling Window</p>
                    </div>

                    <ul className="space-y-2 text-xs text-muted pt-2 border-t border-border/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>Full Claude Model Family</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>Claude Code, Cursor & Windsurf</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>Dedicated Rate Limit Pool</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full justify-center text-xs py-2.5 font-bold gap-1.5 flex items-center rounded-control transition-all ${
                        pkg.featured
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:brightness-110'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Us to Purchase</span>
                    </a>
                  </div>
                </div>
              </ThreeDCard>
            ))}
          </div>
        )}

        {/* View Mode: Comparison Table */}
        {viewMode === 'table' && (
          <div className="bg-white border border-border rounded-panel overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-mono uppercase bg-bg">
                    <th className="py-3.5 px-4 font-bold">Package Tier</th>
                    <th className="py-3.5 px-4 font-bold">Pricing Policy</th>
                    <th className="py-3.5 px-4 font-bold">5-Hour Allowance</th>
                    <th className="py-3.5 px-4 font-bold">Context Window</th>
                    <th className="py-3.5 px-4 font-bold">IDE Tools Support</th>
                    <th className="py-3.5 px-4 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {tokenPackages.map((pkg) => (
                    <tr key={pkg.planName} className="hover:bg-subtle">
                      <td className="py-3.5 px-4 font-bold text-fg font-sans">{pkg.planName}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">Contact on WhatsApp</td>
                      <td className="py-3.5 px-4 font-bold text-fg">{pkg.allocation}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">1,000,000 Tokens</td>
                      <td className="py-3.5 px-4 text-muted font-sans">Claude Code, Cursor, Windsurf</td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 font-bold rounded inline-flex items-center gap-1"
                        >
                          <span>WhatsApp</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Custom Enterprise Banner */}
        <div className="p-6 bg-bg border border-border rounded-panel flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div>
            <h4 className="text-sm font-bold text-fg">Need Custom Enterprise Capacity?</h4>
            <p className="text-xs text-muted mt-0.5">Custom enterprise allocations with dedicated upstream rate limits and SLA support.</p>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-button-primary text-xs py-2.5 px-5 whitespace-nowrap font-bold flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
};
