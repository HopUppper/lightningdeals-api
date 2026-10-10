import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Coins, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminFetch } from '../utils/api';

export const LightningRewardsHighlight: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [activeOffer, setActiveOffer] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOffer = async () => {
      try {
        const res = await fetch('/api/rewards/active-offer');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.active && data.offer) {
            setActiveOffer(data.offer);
          }
        }
      } catch (e) {
        // Silently continue
      }
    };
    fetchOffer();

    if (user) {
      const fetchBalance = async () => {
        try {
          setLoadingBalance(true);
          const res = await adminFetch('/api/user/rewards/balance');
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.success) {
              setBalance(data.availableCredits ?? 0);
            }
          }
        } catch (e) {
          // Non-blocking fallback
        } finally {
          if (isMounted) setLoadingBalance(false);
        }
      };
      fetchBalance();
    } else {
      setBalance(null);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isPromo = Boolean(activeOffer);

  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 bg-white border-b border-[#e5e7eb] font-sans">
      <div className="max-w-page mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#f4f4f0] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] uppercase tracking-wider">
              {isPromo ? (activeOffer.badge || 'PROMOTION') : 'REWARDS PROGRAM'}
            </div>

            <div className="space-y-3">
              {isPromo ? (
                <>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827] tracking-tight">
                    {activeOffer.title}
                  </h2>
                  <p className="text-sm sm:text-base text-[#4b5563] leading-relaxed max-w-xl">
                    {activeOffer.subtitle}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827] tracking-tight">
                    Power your projects. Earn 10% back in credits.
                  </h2>
                  <p className="text-sm sm:text-base text-[#4b5563] leading-relaxed max-w-xl">
                    Receive 10% back in Lightning Credits on eligible plan recharges. Every ₹1 credit equals a ₹1 discount applied automatically toward your renewals.
                  </p>
                </>
              )}
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="bg-[#fbfbfa] p-4 rounded-lg border border-[#e5e7eb] space-y-1">
                <p className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{isPromo ? `${activeOffer.multiplier}X Multiplier` : '10% Cash Back'}</span>
                </p>
                <p className="text-[11px] text-[#6b7280]">
                  {isPromo ? (activeOffer.minPurchaseAmount > 0 ? `Orders of ₹${activeOffer.minPurchaseAmount.toLocaleString()}+` : 'All plan orders') : 'On first ₹5,000 per order'}
                </p>
              </div>

              <div className="bg-[#fbfbfa] p-4 rounded-lg border border-[#e5e7eb] space-y-1">
                <p className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>No Expiration</span>
                </p>
                <p className="text-[11px] text-[#6b7280]">
                  {isPromo ? `Cap: ₹${activeOffer.maxCredits} bonus` : 'Your credits never expire'}
                </p>
              </div>

              <div className="bg-[#fbfbfa] p-4 rounded-lg border border-[#e5e7eb] space-y-1">
                <p className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Auto-Applied</span>
                </p>
                <p className="text-[11px] text-[#6b7280]">
                  Redeem with 1 click at checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Link
                to={user ? '/dashboard/rewards' : '/register?redirect=rewards'}
                className="ui-button-primary text-xs font-medium px-5 py-2.5"
              >
                <span>{user ? 'Open Rewards Wallet' : 'Create Free Account to Earn'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Digital Wallet Preview */}
          <div className="lg:col-span-5">
            <div className="bg-[#fbfbfa] border border-[#e5e7eb] rounded-xl p-6 sm:p-7 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#1e40af]" />
                  <span className="text-sm font-bold text-[#111827]">Lightning Credit Wallet</span>
                </div>
                <span className="text-xs font-medium text-[#6b7280]">1 Credit = ₹1 INR</span>
              </div>

              <div className="p-5 rounded-lg bg-white border border-[#e5e7eb] space-y-2">
                <div className="text-xs font-medium text-[#6b7280]">Available Credit Balance</div>
                <div className="text-3xl font-bold text-[#111827]">
                  {loadingBalance ? (
                    '...'
                  ) : user ? (
                    `₹${(balance ?? 0).toLocaleString()}`
                  ) : (
                    '₹0'
                  )}
                </div>
                <div className="text-xs text-[#6b7280]">
                  {user ? 'Ready for your next subscription renewal' : 'Sign in to inspect and apply your credits'}
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs text-[#4b5563]">
                <div className="flex justify-between">
                  <span>Base Earning Rate</span>
                  <span className="font-semibold text-[#111827]">10% of purchase value</span>
                </div>
                <div className="flex justify-between">
                  <span>Referral Matching Bonus</span>
                  <span className="font-semibold text-[#111827]">10% lifetime match</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage Scope</span>
                  <span className="font-semibold text-[#111827]">All prepaid token tiers</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
