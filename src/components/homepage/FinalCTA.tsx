import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const FinalCTA: React.FC = () => {
  const { user } = useAuth();
  const ctaDest = !user ? '/register' : '/dashboard';
  const ctaLabel = !user ? 'Get Started' : 'Dashboard';

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-[#fafaf9] text-zinc-950 font-sans overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Final Callout Box */}
        <div className="p-8 sm:p-14 lg:p-16 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-8 max-w-4xl mx-auto text-center relative overflow-hidden">
          
          {/* Signature Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-950 font-display tracking-tight leading-[1.08]">
            Less integration overhead.
            <br />
            <span className="text-zinc-500">More time to build.</span>
          </h2>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Get instant access to every top frontier model. Start in minutes with your existing developer tools and drop-in SDK compatibility.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={ctaDest}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-zinc-500" />
              <span>Explore Documentation</span>
            </Link>
          </div>

          {/* Edge Technical Detail */}
          <div className="pt-6 border-t border-zinc-100 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-500 px-2 text-center">
            <span className="break-all">BASE URL: https://lightningapi.pro</span>
            <span className="hidden sm:inline">·</span>
            <span>INSTANT AUTOMATED ISSUANCE</span>
          </div>

        </div>

      </div>
    </section>
  );
};

export default FinalCTA;