import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Menu,
  X,
  Key,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const SiteHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Models', href: '/models' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Documentation', href: '/docs' },
    { name: 'FAQ', href: '/faq' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 font-sans transition-all duration-200 ${
        scrolled
          ? 'bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#E6E1E8] shadow-xs'
          : 'bg-[#F8F6F2] border-b border-[#E6E1E8]/60'
      }`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* ============================================================ */}
          {/* LEFT: Symbol, Wordmark & Architectural Descriptor             */}
          {/* ============================================================ */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7136E8] rounded-lg p-0.5"
              aria-label="LightningAPI Homepage"
            >
              {/* LightningAPI Monogram Symbol */}
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#7136E8] text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Zap className="w-4 h-4 fill-current text-white" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>

              {/* Wordmark */}
              <div className="flex items-baseline">
                <span className="text-base font-bold tracking-tight text-[#191719] font-display">
                  LightningAPI
                </span>
                <span className="text-xs font-semibold text-[#68636B] ml-0.5">
                  .pro
                </span>
              </div>
            </Link>

            {/* Optional Small Descriptor: THE INTELLIGENCE LAYER */}
            <div className="hidden lg:flex items-center border-l border-[#E6E1E8] pl-3 ml-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#68636B] font-medium">
                The Intelligence Layer
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CENTRE: Concise Editorial Nav Links (Desktop >= lg)           */}
          {/* ============================================================ */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-[#7136E8] bg-[#EEE6FF] font-semibold'
                      : 'text-[#68636B] hover:text-[#191719] hover:bg-black/[0.03]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Subtle Website Builder Link */}
            <Link
              to="/builder"
              className="px-2.5 py-1 text-[11px] font-mono text-[#68636B] hover:text-[#191719] hover:bg-black/[0.03] rounded-md transition-colors whitespace-nowrap"
            >
              Builder
            </Link>
          </nav>

          {/* ============================================================ */}
          {/* RIGHT: Verify Key, Sign In & Primary CTA                       */}
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

            {/* Auth / Sign In State */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/[0.04] text-[#191719] hover:bg-black/[0.08] transition-colors border border-[#E6E1E8]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#7136E8]" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[#68636B] hover:text-rose-600 transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-medium text-[#68636B] hover:text-[#191719] px-2.5 py-1.5 transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
            )}

            {/* Primary CTA: Get Started */}
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[11px] bg-[#7136E8] hover:bg-[#4F21B5] text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Get Started</span>
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
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E1E8]/60">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#68636B]">
                  Navigation
                </span>
                <Link
                  to="/status"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-800"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>100% Operational</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[#191719] hover:bg-black/[0.04] rounded-lg transition-colors"
                  >
                    <span>{link.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#68636B]" />
                  </Link>
                ))}
                <Link
                  to="/builder"
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium text-[#68636B] hover:text-[#191719] hover:bg-black/[0.04] rounded-lg transition-colors"
                >
                  <span>Website Builder</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#68636B]" />
                </Link>
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
                      className="px-3 py-2 text-sm text-rose-600 font-medium"
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
                  to="/pricing"
                  className="w-full text-center py-2.5 rounded-[11px] bg-[#7136E8] text-white text-sm font-semibold shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
