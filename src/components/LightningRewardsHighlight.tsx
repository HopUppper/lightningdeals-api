import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Sparkles, CheckCircle2, TrendingUp, ShieldCheck, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminFetch } from '../utils/api';

export const LightningRewardsHighlight: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [activeOffer, setActiveOffer] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch active promotional offer
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

    // Fetch customer balance if logged in
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
    <section className="py-20 px-5 sm:px-6 relative overflow-hidden bg-gradient-to-b from-bg via-violet-50/20 to-bg border-y border-border/60">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-500/10 via-indigo-500/10 to-amber-500/10 blur-3xl pointer-events-none rounded-full -z-10" />

      <div className="max-w-page mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            {isPromo ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400 text-amber-800 text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-600 animate-pulse" />
                <span>{activeOffer.badge || 'FLASH OFFER ACTIVE'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100/80 border border-violet-300 text-violet-800 text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-current text-violet-600 animate-pulse" />
                <span>Customer Loyalty Program</span>
              </div>
            )}

            <div className="space-y-3">
              {isPromo ? (
                <>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-fg tracking-tight leading-tight">
                    {activeOffer.title}
                  </h2>
                  <p className="text-base sm:text-lg text-muted font-normal leading-relaxed max-w-xl">
                    {activeOffer.subtitle}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight leading-tight">
                    Spend with Lightning. <br />
                    <span className="animated-gradient-text">Earn 10% Back in Credits.</span>
                  </h2>
                  <p className="text-base text-muted font-normal leading-relaxed max-w-xl">
                    Get <strong className="text-fg font-semibold">10% back in Lightning Credits</strong> on eligible purchases.
                    Earn up to <strong className="text-fg font-semibold">₹500 Lightning Credits per transaction</strong> and use your accumulated credits toward future subscriptions and renewals.
                  </p>
                </>
              )}
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-fg">
                    {isPromo ? `${activeOffer.multiplier}X Boost` : '10% Back'}
                  </p>
                  <p className="text-[11px] text-muted font-mono">
                    {isPromo ? `On orders of ₹${activeOffer.minPurchaseAmount.toLocaleString()}+` : 'On first ₹5,000 per order'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-fg">
                    {isPromo ? `Up to ₹${activeOffer.maxCredits.toLocaleString()} Max` : 'Unlimited Wallet'}
                  </p>
                  <p className="text-[11px] text-muted font-mono">
                    {isPromo ? 'Per transaction cap' : 'No balance cap restriction'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-fg">Instant Redemption</p>
                  <p className="text-[11px] text-muted font-mono">Apply directly at checkout</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <Link
                  to="/dashboard/rewards"
                  className="ui-button-primary text-xs py-3 px-6 font-bold flex items-center gap-2 shadow-lg shadow-violet-500/20"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>View Your Lightning Rewards</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/pricing"
                  className="ui-button-primary text-xs py-3 px-6 font-bold flex items-center gap-2 shadow-lg shadow-violet-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Explore Plans & Claim Offer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <Link
                to={user ? "/dashboard/plan" : "/pricing"}
                className="ui-button-secondary text-xs py-3 px-5 font-bold"
              >
                Browse Plans & Offers
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Dynamic Live Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className={`relative rounded-2xl border-2 ${isPromo ? 'border-amber-400/90 shadow-amber-500/15' : 'border-violet-300/80 shadow-violet-500/10'} bg-white p-7 shadow-2xl space-y-6`}>
              
              {/* Badge & Program Header */}
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isPromo ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600' : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500'} text-white font-extrabold shadow-md`}>
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-fg tracking-tight">
                      ⚡ LIGHTNING REWARDS
                    </h3>
                    <p className="text-[10px] text-muted font-mono uppercase tracking-wider">
                      {isPromo ? 'Flash Promotion Active' : 'Authoritative Member Benefits'}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isPromo ? 'text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-400 border border-amber-300 shadow-xs' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'} px-2.5 py-1 rounded-full`}>
                  {isPromo ? `${activeOffer.multiplier}X Multiplier` : '10% Back'}
                </span>
              </div>

              {/* Center Content: Logged-in vs Public */}
              {user ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-mono text-muted uppercase font-bold">
                      Your Available Balance
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl sm:text-5xl font-extrabold text-fg font-mono tracking-tight">
                        ₹{loadingBalance ? '...' : (balance !== null ? balance.toLocaleString() : '0')}
                      </span>
                      <span className="text-xs font-mono font-bold text-violet-700">Lightning Credits</span>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl ${isPromo ? 'bg-amber-50/90 border border-amber-200' : 'bg-violet-50/80 border border-violet-200/80'} text-xs font-mono space-y-1`}>
                    <p className={`${isPromo ? 'text-amber-950' : 'text-violet-900'} font-bold flex items-center gap-1.5`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isPromo ? 'text-amber-600' : 'text-violet-600'}`} />
                      <span>{isPromo ? `Boost Active: Earn ${activeOffer.multiplier}X on orders of ₹${activeOffer.minPurchaseAmount.toLocaleString()}+` : 'Ready for Instant Redemption'}</span>
                    </p>
                    <p className="text-muted text-[11px]">
                      {isPromo ? `Cap up to ${activeOffer.maxCredits} credits! Credits never expire and apply directly to renewals.` : 'Apply these credits at checkout to discount your next Claude plan.'}
                    </p>
                  </div>

                  <Link
                    to="/dashboard/rewards"
                    className="w-full py-2.5 rounded-control bg-subtle hover:bg-violet-50 text-violet-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-violet-200 transition-colors"
                  >
                    <span>Open Rewards Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-muted uppercase font-bold">
                      {isPromo ? 'Flash Promotion Potential' : 'Example Customer Earnings'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl sm:text-5xl font-extrabold ${isPromo ? 'text-amber-600' : 'text-emerald-600'} font-mono tracking-tight`}>
                        +{isPromo ? activeOffer.maxCredits.toLocaleString() : '500'}
                      </span>
                      <span className="text-xs font-mono font-bold text-muted">Credits / Order</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono border-t border-border/60 pt-3">
                    {isPromo ? (
                      <>
                        <div className="flex justify-between text-muted">
                          <span>Standard 10% on ₹5,000:</span>
                          <span className="font-bold text-fg line-through">₹500 Credits</span>
                        </div>
                        <div className="flex justify-between text-amber-800 font-extrabold bg-amber-50/80 p-1.5 rounded">
                          <span>{activeOffer.multiplier}X Flash Reward:</span>
                          <span className="text-amber-700">+{activeOffer.maxCredits.toLocaleString()} Credits!</span>
                        </div>
                        <div className="flex justify-between text-muted text-[11px]">
                          <span>Qualifying Threshold:</span>
                          <span className="font-bold text-fg">₹{activeOffer.minPurchaseAmount.toLocaleString()}+ purchase</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-muted">
                          <span>₹1,000 Purchase:</span>
                          <span className="font-bold text-fg">+₹100 Credits</span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>₹3,000 Purchase:</span>
                          <span className="font-bold text-fg">+₹300 Credits</span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>₹5,000 Purchase:</span>
                          <span className="font-bold text-emerald-600">+₹500 Credits (Max)</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-subtle/80 text-[11px] font-mono text-muted leading-relaxed">
                    Credits accumulate indefinitely without expiry or wallet balance cap.
                  </div>

                  <Link
                    to="/pricing"
                    className="w-full py-2.5 rounded-control bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                  >
                    <span>Browse Plans & Claim Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Bottom Guarantee */}
              <div className="pt-3 border-t border-border/80 flex items-center justify-between text-[11px] font-mono text-muted">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Authoritative Server-Verified</span>
                </span>
                <span>₹1 Credit = ₹1 INR</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default LightningRewardsHighlight;
