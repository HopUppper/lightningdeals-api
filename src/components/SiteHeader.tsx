import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Menu,
  X,
  Key,
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  User as UserIcon,
  Settings,
  CreditCard,
  Activity,
  LifeBuoy,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ReferralAnnouncementBanner } from './ReferralAnnouncementBanner';

export const SiteHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Outside click to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/');
  };

  // Primary Navigation Hierarchy (First 5 options, Why Us & FAQ moved to footer)
  const navLinks = [
    { name: 'Models', href: '/models' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'AI Builder', href: '/builder', badge: 'New' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Docs', href: '/docs' },
  ];

  // User initials calculation
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.name && user.name.trim()) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Determine CTA destination & label
  const ctaDestination = !user ? '/register' : '/dashboard';
  const ctaLabel = !user ? 'Get Started' : 'Dashboard';

  return (
    <header
      className={`sticky top-0 z-50 font-sans transition-all duration-200 ${
        scrolled
          ? 'bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#E6E1E8] shadow-xs'
          : 'bg-[#F8F6F2] border-b border-[#E6E1E8]/60'
      }`}
    >
      <ReferralAnnouncementBanner />
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* ============================================================ */}
          {/* LEFT: Symbol & Wordmark                                      */}
          {/* ============================================================ */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7136E8] rounded-lg p-0.5"
              aria-label="LightningAPI Homepage"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#7136E8] text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Zap className="w-4 h-4 fill-current text-white" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="text-base font-bold tracking-tight text-[#191719] font-display">
                  LightningAPI
                </span>
                <span className="text-xs font-semibold text-[#68636B] ml-0.5">
                  .pro
                </span>
              </div>
            </Link>
          </div>

          {/* ============================================================ */}
          {/* CENTRE: Primary Navigation Links (Desktop >= lg)             */}
          {/* ============================================================ */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#7136E8] bg-[#EEE6FF] font-semibold'
                      : 'text-[#68636B] hover:text-[#191719] hover:bg-black/[0.03]'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded bg-violet-100 text-violet-700">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ============================================================ */}
          {/* RIGHT: Verify Key, Cart, Profile Experience & Primary CTA     */}
          {/* ============================================================ */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Cart Trigger if items present */}
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-lg text-[#68636B] hover:text-[#191719] hover:bg-black/[0.03] border border-[#E6E1E8] transition-colors cursor-pointer"
                title="View cart"
                aria-label={`Cart with ${cartItems.length} items`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#7136E8] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold">
                  {cartItems.length}
                </span>
              </button>
            )}

            {/* Verify Key Link */}
            <Link
              to="/check-key"
              className="text-xs font-medium text-[#68636B] hover:text-[#191719] px-2.5 py-1.5 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#68636B]" />
              <span className="hidden md:inline">Verify Key</span>
            </Link>

            {/* Authenticated Profile Experience vs Logged-Out State */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-white hover:bg-[#F3F0E8] border border-[#E6E1E8] text-[#191719] transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#7136E8]/30"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* Customer Initials Avatar */}
                  <div className="w-7 h-7 rounded-full bg-[#EEE6FF] text-[#7136E8] font-bold text-xs flex items-center justify-center border border-[#7136E8]/20 shrink-0">
                    {getUserInitials()}
                  </div>

                  {/* Customer Identifier */}
                  <span className="text-xs font-semibold text-[#191719] max-w-[120px] truncate hidden md:inline">
                    {user.name || user.email.split('@')[0]}
                  </span>

                  <ChevronDown className={`w-3.5 h-3.5 text-[#68636B] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border border-[#E6E1E8] shadow-xl py-2 z-50 font-sans"
                    >
                      {/* User Header Summary */}
                      <div className="px-4 py-3 border-b border-[#E6E1E8]/70 bg-[#F8F6F2]/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#EEE6FF] text-[#7136E8] font-bold text-sm flex items-center justify-center border border-[#7136E8]/30 shrink-0">
                            {getUserInitials()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#191719] truncate">
                              {user.name || 'LightningAPI User'}
                            </p>
                            <p className="text-[11px] text-[#68636B] truncate font-mono">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            Signed In
                          </span>
                          <span className="text-[#68636B] uppercase">
                            {user.role === 'admin' ? 'Administrator' : 'Customer'}
                          </span>
                        </div>
                      </div>

                      {/* Navigation Destinations */}
                      <div className="py-1">
                        <Link
                          to={user.role === 'admin' ? '/admin' : '/dashboard'}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#191719] hover:bg-[#EEE6FF]/50 hover:text-[#7136E8] transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#7136E8]" />
                          <span>Control Dashboard</span>
                        </Link>

                        <Link
                          to="/dashboard/keys"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#191719] hover:bg-[#EEE6FF]/50 hover:text-[#7136E8] transition-colors"
                        >
                          <Key className="w-4 h-4 text-[#68636B]" />
                          <span>API Keys</span>
                        </Link>

                        <Link
                          to="/dashboard/plan"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#191719] hover:bg-[#EEE6FF]/50 hover:text-[#7136E8] transition-colors"
                        >
                          <CreditCard className="w-4 h-4 text-[#68636B]" />
                          <span>My Plans & Subscriptions</span>
                        </Link>

                        <Link
                          to="/dashboard/usage"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#191719] hover:bg-[#EEE6FF]/50 hover:text-[#7136E8] transition-colors"
                        >
                          <Activity className="w-4 h-4 text-[#68636B]" />
                          <span>Usage & Quota</span>
                        </Link>

                        <Link
                          to="/dashboard/settings"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#191719] hover:bg-[#EEE6FF]/50 hover:text-[#7136E8] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#68636B]" />
                          <span>Account Settings</span>
                        </Link>

                        <Link
                          to="/dashboard/support"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#191719] hover:bg-[#EEE6FF]/50 hover:text-[#7136E8] transition-colors"
                        >
                          <LifeBuoy className="w-4 h-4 text-[#68636B]" />
                          <span>Help & Support</span>
                        </Link>
                      </div>

                      {/* Sign Out Divider & Button */}
                      <div className="pt-1 mt-1 border-t border-[#E6E1E8]/70">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-medium text-[#68636B] hover:text-[#191719] px-2.5 py-1.5 transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
            )}

            {/* Primary Contextual CTA */}
            <Link
              to={ctaDestination}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[11px] bg-[#7136E8] hover:bg-[#4F21B5] text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ============================================================ */}
          {/* MOBILE MENU TOGGLE BUTTON (<= sm)                             */}
          {/* ============================================================ */}
          <div className="flex items-center gap-2 lg:hidden">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 rounded-lg text-[#68636B] hover:text-[#191719] border border-[#E6E1E8] transition-colors"
                aria-label="View cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#7136E8] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold">
                  {cartItems.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#191719] hover:bg-black/[0.04] transition-colors focus:outline-none focus:ring-2 focus:ring-[#7136E8] cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE ACCESSIBLE DRAWER                                      */}
      {/* ============================================================ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-b border-[#E6E1E8] bg-[#F8F6F2] overflow-hidden"
            id="mobile-navigation"
          >
            <div className="max-w-[1360px] mx-auto px-4 py-4 space-y-3">
              {/* Signed-In Mobile Account Card */}
              {user ? (
                <div className="p-3 rounded-xl bg-white border border-[#E6E1E8] shadow-2xs space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEE6FF] text-[#7136E8] font-bold text-sm flex items-center justify-center border border-[#7136E8]/30 shrink-0">
                      {getUserInitials()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#191719] truncate">{user.name || 'LightningAPI User'}</p>
                      <p className="text-[11px] text-[#68636B] truncate font-mono">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E6E1E8]/70 text-[11px] font-medium">
                    <Link
                      to="/dashboard/keys"
                      className="px-2.5 py-1.5 rounded-lg bg-[#F8F6F2] text-[#191719] hover:bg-[#EEE6FF] transition-colors text-center"
                    >
                      API Keys
                    </Link>
                    <Link
                      to="/dashboard/plan"
                      className="px-2.5 py-1.5 rounded-lg bg-[#F8F6F2] text-[#191719] hover:bg-[#EEE6FF] transition-colors text-center"
                    >
                      My Plan
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between pb-2 border-b border-[#E6E1E8]/60">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#68636B]">
                  Navigation
                </span>
                <Link
                  to="/status"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-800"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>All Systems Operational</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[#191719] hover:bg-black/[0.04] rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{link.name}</span>
                      {link.badge && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded bg-violet-100 text-violet-700">
                          {link.badge}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#68636B]" />
                  </Link>
                ))}
                <Link
                  to="/check-key"
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[#68636B] hover:text-[#191719] hover:bg-black/[0.04] rounded-lg transition-colors"
                >
                  <span>Verify Key Balance</span>
                  <Key className="w-3.5 h-3.5 text-[#68636B]" />
                </Link>
              </div>

              <div className="pt-3 border-t border-[#E6E1E8] flex flex-col gap-2">
                {user ? (
                  <div className="flex items-center justify-between">
                    <Link
                      to={user.role === 'admin' ? '/admin' : '/dashboard'}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-black/[0.05] text-[#191719]"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#7136E8]" />
                      <span>Control Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-3 py-2 text-sm text-rose-600 font-medium cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="w-full text-center py-2 text-sm font-medium text-[#191719] hover:bg-black/[0.04] rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                )}

                <Link
                  to={ctaDestination}
                  className="w-full text-center py-2.5 rounded-[11px] bg-[#7136E8] text-white text-sm font-semibold shadow-xs"
                >
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
