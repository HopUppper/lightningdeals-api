import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferralAnnouncementBannerProps {
  isDark?: boolean;
}

export const ReferralAnnouncementBanner: React.FC<ReferralAnnouncementBannerProps> = ({ isDark }) => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const effectiveDark = isDark !== undefined ? isDark : location.pathname === '/';

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
        className={`relative z-50 overflow-hidden font-sans text-xs transition-colors duration-200 ${
          effectiveDark
            ? 'bg-[#120d09] border-b border-[#2e190d] text-[#fdba74]'
            : 'bg-[#fef5ee] border-b border-[#fed7aa] text-[#7c2d12]'
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                effectiveDark
                  ? 'bg-[#251509] border border-[#4d260f] text-[#fed7aa]'
                  : 'bg-[#ffedd5] border border-[#fdba74] text-[#9a3412]'
              }`}
            >
              REFERRAL REWARDS
            </span>

            <span className={`font-normal text-xs ${effectiveDark ? 'text-zinc-300' : 'text-[#9a3412]'}`}>
              Earn 10% matching credits on active subscriptions referred by you.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/dashboard/referrals"
              className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                effectiveDark ? 'text-[#fb923c] hover:text-[#fed7aa]' : 'text-[#9a3412] hover:text-[#7c2d12]'
              }`}
            >
              <span>Get invite link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              className={`p-1 rounded-full transition-colors ${
                effectiveDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/10' : 'text-[#9a3412] hover:text-[#7c2d12] hover:bg-[#ffedd5]'
              }`}
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReferralAnnouncementBanner;
