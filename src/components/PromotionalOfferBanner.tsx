import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sparkles, ArrowRight, X, Flame } from 'lucide-react';
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

export const PromotionalOfferBanner: React.FC = () => {
  const [offer, setOffer] = useState<ActiveOffer | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveOffer = async () => {
      try {
        const res = await fetch('/api/rewards/active-offer');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.active && data.offer && data.offer.showBanner) {
            // Check if dismissed in this browser session
            const dismissed = sessionStorage.getItem(`ld_promo_banner_dismissed_${data.offer.title}`);
            if (!dismissed) {
              setOffer(data.offer);
              setVisible(true);
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

  const handleDismiss = () => {
    setVisible(false);
    if (offer) {
      sessionStorage.setItem(`ld_promo_banner_dismissed_${offer.title}`, 'true');
    }
  };

  if (!visible || !offer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-50 overflow-hidden bg-gradient-to-r from-violet-950 via-indigo-900 to-amber-950 border-b border-amber-500/30 text-white shadow-lg"
      >
        {/* Shimmer Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-page mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative z-10">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            {/* Live Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm animate-pulse">
              <Flame className="w-3 h-3 fill-current" />
              <span>{offer.badge || 'FLASH DEAL'}</span>
            </span>

            {/* Offer Title & Summary */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-amber-200">
                {offer.title}
              </span>
              <span className="hidden md:inline-block text-slate-300 text-xs">
                • {offer.subtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-sm hover:shadow-amber-500/20 group"
            >
              <span>Claim {offer.multiplier}X Credits</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
