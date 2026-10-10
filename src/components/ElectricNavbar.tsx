import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Menu,
  X,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  Key,
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ReferralAnnouncementBanner } from './ReferralAnnouncementBanner';

export const ElectricNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Models', href: '/#models' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Why LightningAPI', href: '/#why-us' },
    { name: 'Demo', href: '/#demo' },
    { name: 'Capacity Plans', href: '/#pricing' },
    { name: 'Documentation', href: '/docs' },
    { name: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 font-sans border-b border-[#e7e5e4] bg-[#fbf9f5]/90 backdrop-blur-md transition-all">
      <ReferralAnnouncementBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Wordmark & Luminous Signal */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#6d28d9] text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Zap className="w-4 h-4 fill-current text-white" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="text-base font-bold tracking-tight text-[#1c1917]">
                  LightningAPI
                </span>
                <span className="text-xs font-semibold text-[#78716c] ml-0.5">
                  .pro
                </span>
              </div>
            </Link>

            {/* Gateway Telemetry Pill */}
            <Link
              to="/status"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[11px] font-medium text-[#047857] hover:bg-[#d1fae5] transition-colors"
              title="Live Gateway Status: TLS 1.3 Active"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#059669] shrink-0" />
              <span>Gateway Operational</span>
            </Link>
          </div>

          {/* Editorial Nav Links (>= xl) */}
          <nav className="hidden xl:flex items-center gap-1.5" aria-label="Primary">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 text-xs font-medium text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] transition-colors rounded-lg whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action Suite (>= xl) */}
          <div className="hidden xl:flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Shopping Cart Pill */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] border border-[#e7e5e4] transition-colors cursor-pointer"
              title="Shopping Cart"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#6d28d9] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 bg-[#f5f2eb] border border-[#e7e5e4] rounded-lg p-1 pl-3 text-xs">
                <span className="font-medium text-[#1c1917] truncate max-w-[130px]" title={user.email}>
                  {user.name || user.email.split('@')[0]}
                </span>
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 rounded-md bg-[#1c1917] hover:bg-black text-white font-medium text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/check-key"
                  className="text-xs font-medium text-[#57534e] hover:text-[#1c1917] px-2.5 py-1.5 transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-[#78716c]" />
                  <span>Verify Key</span>
                </Link>

                <Link
                  to="/login"
                  className="text-xs font-medium text-[#1c1917] hover:text-[#6d28d9] px-2.5 py-1.5 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>

                <Link
                  to="/trial"
                  className="px-3.5 py-2 rounded-lg bg-[#6d28d9] hover:bg-[#581c87] text-white font-medium text-xs transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap hover:shadow-plum cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Claim 1M Trial</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile & Tablet Screen Controls (< xl) */}
          <div className="flex items-center gap-2 xl:hidden">
            <Link
              to="/trial"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-[#6d28d9] hover:bg-[#581c87] text-white font-medium text-xs transition-colors items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Claim 1M Trial</span>
            </Link>

            <button
              onClick={openCart}
              className="relative p-2 rounded-lg text-[#57534e] hover:text-[#1c1917] border border-[#e7e5e4] bg-white cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#6d28d9] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7e5e4] bg-white text-[#1c1917] transition-colors hover:bg-[#f5f2eb] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-[#e7e5e4] bg-[#fbf9f5] px-5 py-6 space-y-5 overflow-hidden"
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#1c1917] hover:bg-[#f5f2eb] transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/status"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-[#1c1917] hover:bg-[#f5f2eb] transition-colors"
              >
                <span>System Status</span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  34ms TTFT
                </span>
              </Link>
            </div>

            <div className="pt-3 border-t border-[#e7e5e4] space-y-2">
              <Link
                to="/check-key"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg border border-[#e7e5e4] bg-white text-xs font-semibold text-[#1c1917]"
              >
                <span>Verify Master Key Balance</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#78716c]" />
              </Link>

              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#1c1917] text-white text-xs font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Customer Dashboard</span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-[#e7e5e4] bg-white text-xs font-semibold text-[#1c1917]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/trial"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#6d28d9] text-white text-xs font-semibold shadow-plum"
                  >
                    Free Trial (1M)
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
