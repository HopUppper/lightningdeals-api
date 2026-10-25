import React from 'react';
import { ArrowRight, Terminal, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinalCTA: React.FC = () => {
  return (
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[#F8F6F2] text-[#191719] font-sans overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Final Callout Box */}
        <div className="p-8 sm:p-14 lg:p-16 rounded-[24px] bg-white border border-[#E6E1E8] shadow-xs space-y-8 max-w-4xl mx-auto text-center relative overflow-hidden">
          
          {/* Subtle Accent Glow */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[350px] h-[200px] bg-[#7136E8]/10 blur-[90px] rounded-full pointer-events-none"
            aria-hidden="true"
          />

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7136E8]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7136E8] font-semibold">
              THE INTELLIGENCE LAYER
            </span>
          </div>

          {/* Signature Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#191719] font-display tracking-tight leading-[1.08]">
            Less integration overhead.
            <br />
            <span className="text-[#191719]/80">More time to build.</span>
          </h2>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-[#68636B] leading-relaxed max-w-2xl mx-auto">
            Start with the documentation, explore supported models, and connect LightningAPI to a
            compatible workflow.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[12px] bg-[#7136E8] hover:bg-[#4F21B5] text-white text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[12px] bg-white hover:bg-black/[0.04] text-[#191719] border border-[#E6E1E8] text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-[#68636B]" />
              <span>Explore Documentation</span>
            </Link>
          </div>

          {/* Edge Technical Detail */}
          <div className="pt-6 border-t border-[#E6E1E8]/70 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#68636B]">
            <span>ENDPOINT: https://lightningapi.pro/v1/messages</span>
            <span>·</span>
            <span>INSTANT AUTOMATED ISSUANCE</span>
          </div>

        </div>

      </div>
    </section>
  );
};
