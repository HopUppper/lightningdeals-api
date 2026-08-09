import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, MessageSquare } from 'lucide-react';

export const PricingSection: React.FC = () => {
  const tokenPackages = [
    {
      planName: 'Claude Max 5x',
      tokens: '5 Million Tokens',
      allocation: '5M / 5h',
      tagline: 'Ideal for starter projects & light coding',
      featured: false,
    },
    {
      planName: 'Claude Max 20x',
      tokens: '20 Million Tokens',
      allocation: '20M / 5h',
      tagline: 'Great for active daily coding assistance',
      featured: true,
    },
    {
      planName: 'Claude Max 40x',
      tokens: '40 Million Tokens',
      allocation: '40M / 5h',
      tagline: 'Best value for heavy IDE power users & builders',
      featured: false,
    },
    {
      planName: 'Claude Max 100x',
      tokens: '100 Million Tokens',
      allocation: '100M / 5h',
      tagline: 'High volume allocation for full engineering squads',
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 border-b border-border bg-bg">
      <div className="max-w-page mx-auto px-5 sm:px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="ui-kicker justify-center">Claude Max Rolling Window Plans</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
            Flexible Claude Max Packages
          </h2>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Every key receives a 5-hour rolling token window that auto-resets on cycle. Contact LightningDeals for current availability.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tokenPackages.map((pkg, idx) => (
            <div
              key={idx}
              className={`relative rounded-panel p-6 bg-card border flex flex-col justify-between transition-all ${
                pkg.featured
                  ? 'border-amber-500 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500'
                  : 'border-border hover:border-border/80'
              }`}
            >
              {pkg.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>Most Popular</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="border-b border-border pb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {pkg.planName}
                  </span>
                  <h3 className="text-xl font-extrabold text-fg mt-2">{pkg.tokens}</h3>
                  <p className="text-xs text-muted mt-1 min-h-[32px]">{pkg.tagline}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-2xl font-extrabold font-mono text-fg">{pkg.allocation}</span>
                  <p className="text-[11px] text-emerald-600 font-semibold">✓ 5-Hour Rolling Window — Resets on cycle</p>
                </div>

                <ul className="space-y-2 text-xs text-muted pt-2 border-t border-border">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Full Claude model family</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Full IDE tool support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Dedicated rate limit</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  to="/request-quote"
                  className={`w-full justify-center text-xs py-2.5 font-semibold gap-1.5 ${
                    pkg.featured ? 'ui-button-primary' : 'ui-button-secondary'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Request Quote</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Enterprise Banner */}
        <div className="p-6 bg-card border border-border rounded-panel flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div>
            <h4 className="text-sm font-bold text-fg">Need Claude Max 250x or Custom Enterprise Capacity?</h4>
            <p className="text-xs text-muted mt-0.5">We provide custom enterprise allocations with dedicated upstream rate limits and priority support.</p>
          </div>
          <Link to="/request-quote" className="ui-button-primary text-xs py-2.5 px-5 whitespace-nowrap font-bold">
            Contact Sales Team
          </Link>
        </div>
      </div>
    </section>
  );
};
