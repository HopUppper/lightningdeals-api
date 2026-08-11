import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const FinalCta: React.FC = () => {
  return (
    <section className="relative border-b border-border bg-fg py-20 text-white overflow-hidden">
      <div className="relative mx-auto max-w-page px-5 text-center sm:px-6 z-10 space-y-6">
        
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Ready to start building?</span>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl max-w-2xl mx-auto leading-tight">
          Power your AI tools with <span className="text-amber-400">LightningDeals</span>.
        </h2>

        <p className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-muted font-sans">
          Claim a trial API key or request custom 5-hour rolling window package quotes. Connect your favorite tools in seconds with <code className="font-mono text-amber-400 font-bold bg-white/10 px-2 py-0.5 rounded">npx lightningdeals</code>.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
          <Link
            to="/trial"
            className="ui-button-primary bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-3 px-6 gap-2"
          >
            <span>Claim Free 1M Token Trial Key</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/request-quote"
            className="ui-button-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs py-3 px-6 font-semibold"
          >
            <span>Request Custom Enterprise Quote</span>
          </Link>
        </div>

      </div>
    </section>
  );
};
