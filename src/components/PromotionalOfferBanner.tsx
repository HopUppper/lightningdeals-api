import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
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
        transition={{ duration: 0.15 }}
        className="relative z-50 overflow-hidden bg-[#0f172a] text-white font-sans text-xs border-b border-[#1e293b]"
      >
        <div className="max-w-page mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-white/10 border border-white/20 text-gray-200">
              {offer.badge || 'PROMOTION'}
            </span>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-200">
              <span className="font-semibold text-white">{offer.title}:</span>
              <span className="text-gray-300">{offer.subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-gray-900 font-medium text-xs hover:bg-gray-100 transition-colors"
            >
              <span>View Plans</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <button
              onClick={handleDismiss}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss promotion"
              aria-label="Dismiss promotion"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
