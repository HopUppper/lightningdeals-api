import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReferralAnnouncementBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in session or local storage
    const dismissed = localStorage.getItem('ld_referral_banner_dismissed_v1');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    localStorage.setItem('ld_referral_banner_dismissed_v1', 'true');
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="relative z-50 overflow-hidden bg-gradient-to-r from-violet-950 via-indigo-900 to-amber-950 border-b border-amber-500/30 text-white shadow-md font-sans"
      >
        {/* Shimmer Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-page mx-auto px-4 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left relative z-10">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            {/* Live Indicator Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950" />
              </span>
              <span>NOW LIVE</span>
            </span>

            {/* Announcement Copy */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-amber-200 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Referral Program is Live!</span>
              </span>
              <span className="text-slate-300 text-xs hidden md:inline-block">
                Invite friends and earn 10% matching credits (up to ₹500/order).
              </span>
            </div>
          </div>

          {/* Action Link & Dismiss */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/dashboard/referrals"
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-sm hover:shadow-amber-500/20 active:scale-95 group cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>Go to Referrals</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
