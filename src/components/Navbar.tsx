import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Zap,
  Menu,
  X,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  Key,
  ShieldCheck,
  Gift,
  Users,
  Activity,
  FileCode2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ReferralAnnouncementBanner } from './ReferralAnnouncementBanner';

export const Navbar: React.FC = () => {
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
    { name: 'Capacity & Plans', href: '/#pricing' },
    { name: 'Integration', href: '/#integration' },
    { name: 'Documentation', href: '/docs' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e5e4] bg-[#fbf9f5]/95 backdrop-blur-sm font-sans">
      <ReferralAnnouncementBanner />
      
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Primary">
        
        {/* Brand Wordmark & Operational Status */}
        <div className="flex items-center gap-3 lg:gap-4 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6d28d9] text-white shadow-xs transition-opacity group-hover:opacity-90">
              <Zap className="w-4 h-4 fill-current text-white" />
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

          {/* Calm Operational Status Dot */}
          <Link
            to="/status"
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ecfdf5] border border-[#a7f3d0] text-xs font-medium text-[#047857] hover:bg-[#d1fae5] transition-colors"
            title="Gateway Operational"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#059669] shrink-0" />
            <span>Operational</span>
          </Link>
        </div>

        {/* 4 Focused Primary Nav Links */}
        <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-2.5 py-1.5 text-xs font-medium text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] transition-colors rounded-md whitespace-nowrap"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
          {/* Cart Trigger */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-md text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5f2eb] border border-[#e7e5e4] transition-colors cursor-pointer"
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
                className="text-xs font-medium text-[#57534e] hover:text-[#1c1917] px-2.5 py-1.5 transition-colors whitespace-nowrap"
              >
                Verify Key
              </Link>

              <Link
                to="/login"
                className="text-xs font-medium text-[#1c1917] hover:text-[#6d28d9] px-2.5 py-1.5 transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>

              <Link
                to="/trial"
                className="px-3.5 py-2 rounded-md bg-[#6d28d9] hover:bg-[#581c87] text-white font-medium text-xs transition-colors shadow-xs whitespace-nowrap"
              >
                <span>Start Free Trial</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Screen Controls (Hidden on md and up) */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={openCart}
            className="relative p-2 rounded-md text-[#57534e] hover:text-[#1c1917] border border-[#e7e5e4] bg-white"
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e7e5e4] bg-white text-[#1c1917] transition-colors hover:bg-[#f5f2eb] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

      </nav>

      {/* Responsive Mobile Drawer (Only on small screens < md) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#e7e5e4] bg-[#fbf9f5] px-5 py-6 space-y-5 animate-in fade-in duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-[#1c1917] hover:bg-[#f5f2eb] rounded-md transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-[#e7e5e4] space-y-2">
            <Link
              to="/check-key"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#57534e]"
            >
              <Key className="w-4 h-4" />
              <span>Verify API Key Balance</span>
            </Link>

            <Link
              to="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#047857]"
            >
              <Activity className="w-4 h-4 text-[#059669]" />
              <span>System Health & Node Status</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-[#e7e5e4] space-y-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-md bg-[#1c1917] text-white font-medium text-xs text-center block"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-md border border-[#e7e5e4] text-xs text-[#57534e] text-center"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/trial"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-md bg-[#6d28d9] text-white font-medium text-xs text-center block"
                >
                  Start Free Trial (1M Tokens)
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 rounded-md border border-[#e7e5e4] text-xs font-medium text-[#1c1917] text-center block"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
