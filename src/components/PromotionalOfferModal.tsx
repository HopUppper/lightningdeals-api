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
  maxEligiblePurchaseAmount?: number;
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
        className="fixed inset-0 z-50 overflow-y-auto bg-[#1c1917]/50 backdrop-blur-xs p-4 flex items-center justify-center font-sans"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-2xl bg-white border border-[#e7e5e4] shadow-warm overflow-hidden font-sans text-[#1c1917] p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button with generous touch target */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 min-h-[40px] min-w-[40px] p-2 rounded-lg text-[#78716c] hover:text-[#1c1917] hover:bg-[#f5f2eb] transition-colors z-20 cursor-pointer flex items-center justify-center"
            aria-label="Close promotion modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">
                <Zap className="w-3 h-3 fill-current text-[#6d28d9]" />
                <span>{offer.badge || 'PROMOTION'}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917] leading-tight">
              {offer.title}
            </h2>

            <p className="text-sm text-[#57534e] leading-relaxed">
              {offer.subtitle}
            </p>
          </div>

          {/* Metric Breakdown Row */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-y border-[#e7e5e4] py-4 bg-[#fdfbf7] -mx-6 px-6 sm:-mx-8 sm:px-8">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-[#78716c]">Multiplier</p>
              <p className="text-2xl font-bold text-[#6d28d9] tracking-tight">{offer.multiplier}X</p>
              <p className="text-[11px] text-[#a8a29e]">All Orders</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-[#78716c]">Purchase Cap</p>
              <p className="text-base sm:text-lg font-bold text-[#1c1917]">₹{(offer.maxEligiblePurchaseAmount || 5000).toLocaleString()}</p>
              <p className="text-[11px] text-[#a8a29e]">Per transaction</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-[#78716c]">Max Credits</p>
              <p className="text-base sm:text-lg font-bold text-[#059669]">{offer.maxCredits.toLocaleString()}</p>
              <p className="text-[11px] text-[#a8a29e]">Reward limit</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-[#78716c]">
            1 Lightning Credit = ₹1. Multiplier applies to all tiers during the promotional window.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/pricing"
              onClick={handleClose}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl font-semibold text-xs text-white bg-[#6d28d9] hover:bg-[#581c87] shadow-plum flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore Plans</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleClose}
              className="w-full sm:w-auto py-3 px-4 rounded-xl font-medium text-xs text-[#78716c] hover:text-[#1c1917] hover:bg-[#f5f2eb] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
