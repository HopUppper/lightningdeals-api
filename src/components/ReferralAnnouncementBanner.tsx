import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReferralAnnouncementBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
        transition={{ duration: 0.15 }}
        className="relative z-50 overflow-hidden bg-[#fef5ee] border-b border-[#fed7aa] text-[#7c2d12] font-sans text-xs"
      >
        <div className="max-w-page mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-[#ffedd5] border border-[#fdba74] text-[#9a3412]">
              REFERRAL REWARDS
            </span>

            <span className="font-normal text-xs text-[#9a3412]">
              Earn 10% matching credits on active subscriptions referred by you.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/dashboard/referrals"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9a3412] hover:text-[#7c2d12] transition-colors"
            >
              <span>Get invite link</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <button
              onClick={handleDismiss}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors cursor-pointer"
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
