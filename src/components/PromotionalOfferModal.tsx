import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sparkles, ArrowRight, X, Flame, ShieldCheck, CheckCircle2, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveOffer {
  title: string;
  subtitle: string;
  badge: string;
  multiplier: number;
  minPurchaseAmount: number;
  maxCredits: number;
  showPopup: boolean;
  showBanner: boolean;
  endsAt: string | null;
  baseRewardPercentage: number;
  currency: string;
}

export const PromotionalOfferModal: React.FC = () => {
  const [offer, setOffer] = useState<ActiveOffer | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveOffer = async () => {
      try {
        const res = await fetch('/api/rewards/active-offer');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.active && data.offer && data.offer.showPopup) {
            // Check if dismissed within the last 4 hours
            const storageKey = `ld_promo_popup_dismissed_${data.offer.title}`;
            const dismissedAt = localStorage.getItem(storageKey);
            const now = Date.now();
            const fourHours = 4 * 60 * 60 * 1000;

            if (!dismissedAt || now - Number(dismissedAt) > fourHours) {
              setOffer(data.offer);
              // Small delay for smooth entry after initial page paint
              const timer = setTimeout(() => {
                if (isMounted) setIsOpen(true);
              }, 1200);
              return () => clearTimeout(timer);
            }
          }
        }
      } catch (err) {
        // Silently fail if network unavailable
      }
    };

    fetchActiveOffer();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (offer) {
      localStorage.setItem(`ld_promo_popup_dismissed_${offer.title}`, String(Date.now()));
    }
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, offer]);

  if (!isOpen || !offer) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/50 shadow-[0_0_50px_-10px_rgba(245,158,11,0.35)] overflow-hidden font-sans text-white p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glowing Highlights */}
          <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors z-20"
            aria-label="Close promotion modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="text-center space-y-3 relative z-10">
            {/* Floating Glowing Icon */}
            <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-violet-600/30 border border-amber-400/40 shadow-lg shadow-amber-500/20 mx-auto">
              <Zap className="w-8 h-8 text-amber-400 fill-amber-400 animate-pulse" />
            </div>

            {/* Live Badge */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{offer.badge || 'LIMITED TIME FLASH OFFER'}</span>
              </span>
            </div>

            {/* Bold Headline */}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {offer.title}
            </h2>

            {/* Subhead Pitch */}
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              {offer.subtitle}
            </p>
          </div>

          {/* Offer Metric Breakdown Cards */}
          <div className="mt-6 grid grid-cols-3 gap-3 relative z-10">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-amber-500/30 text-center space-y-1">
              <p className="text-[10px] font-mono uppercase text-amber-300/80 font-bold">Multiplier</p>
              <p className="text-xl sm:text-2xl font-black font-mono text-amber-400">{offer.multiplier}X</p>
              <p className="text-[10px] text-slate-400 font-mono">Bonus Boost</p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Min Purchase</p>
              <p className="text-base sm:text-lg font-black font-mono text-white">₹{offer.minPurchaseAmount.toLocaleString()}+</p>
              <p className="text-[10px] text-slate-400 font-mono">Qualifying Order</p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Max Reward</p>
              <p className="text-base sm:text-lg font-black font-mono text-emerald-400">{offer.maxCredits.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-mono">Credits Cap</p>
            </div>
          </div>

          {/* Value Guarantee Note */}
          <div className="mt-4 p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-center gap-2.5 text-xs text-violet-200 relative z-10 font-mono">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <span>1 Lightning Credit = ₹1. Instant credit to your wallet, valid on all future plans & renewals!</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 relative z-10">
            <Link
              to="/pricing"
              onClick={handleClose}
              className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm font-mono text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all group"
            >
              <span>Explore Plans & Get {offer.multiplier}X Credits</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={handleClose}
              className="w-full sm:w-auto py-3 px-5 rounded-2xl font-bold text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-center"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
