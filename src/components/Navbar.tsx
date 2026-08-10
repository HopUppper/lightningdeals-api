import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck, User, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Why Us', href: isHomePage ? '#why-us' : '/#why-us' },
    { name: 'API Gateway', href: isHomePage ? '#api' : '/#api' },
    { name: 'Models', href: isHomePage ? '#models' : '/#models' },
    { name: 'Token Packages', href: '/pricing', isPage: true },

    { name: 'Check Key', href: '/check-key', isPage: true },
    { name: 'Docs', href: '/docs', isPage: true },
    { name: 'Status', href: '/status', isPage: true },
  ];


  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-page items-center justify-between px-5 sm:px-6" aria-label="Primary">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-fg group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-black transition-transform group-hover:scale-105 font-extrabold shadow-sm">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-base font-bold text-fg tracking-tight">LightningDeals</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            link.isPage ? (
              <Link
                key={link.name}
                to={link.href}
                className="inline-flex min-h-[44px] items-center border-b-2 border-transparent px-2.5 text-xs font-semibold text-muted transition-colors hover:text-accent hover:border-accent/40 xl:px-3 xl:text-sm"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="inline-flex min-h-[44px] items-center border-b-2 border-transparent px-2.5 text-xs font-semibold text-muted transition-colors hover:text-accent hover:border-accent/40 xl:px-3 xl:text-sm"
              >
                {link.name}
              </a>
            )
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          {user && user.role === 'admin' ? (
            <Link to="/admin" className="ui-button-primary">
              <User className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex min-h-[44px] items-center px-3 text-sm font-semibold text-fg transition-colors hover:text-accent"
              >
                Sign in
              </Link>
              <a
                href="https://wa.me/917695956938?text=Hi%20LightningDeals%20Team!%20I%20would%20like%20to%20get%20a%20free%20trial%20API%20key."
                target="_blank"
                rel="noopener noreferrer"
                className="ui-button-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
              >
                Get Free Trial
              </a>
            </>
          )}
        </div>

        {/* Mobile Menu Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          {user && user.role === 'admin' ? (
            <Link to="/admin" className="ui-button-primary px-3 text-xs sm:text-sm">
              Admin
            </Link>
          ) : (
            <a
              href="https://wa.me/917695956938?text=Hi%20LightningDeals%20Team!%20I%20would%20like%20to%20get%20a%20free%20trial%20API%20key."
              target="_blank"
              rel="noopener noreferrer"
              className="ui-button-primary px-3 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
            >
              Get Trial
            </a>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control border border-border bg-card px-3 text-sm font-medium text-fg transition-colors hover:border-accent/40 hover:text-accent"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 h-[calc(100vh-4rem)] z-[100] flex flex-col bg-card border-b border-border p-6 overflow-y-auto lg:hidden shadow-2xl">
          <div className="flex flex-col gap-1 border-b border-border pb-6">
            {navLinks.map((link) => (
              link.isPage ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-base font-semibold text-fg hover:text-accent border-b border-border/40 last:border-0"
                >
                  <span>{link.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-base font-semibold text-fg hover:text-accent border-b border-border/40 last:border-0"
                >
                  <span>{link.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </a>
              )
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {user && user.role === 'admin' ? (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="ui-button-primary w-full justify-center text-center text-sm font-semibold"
              >
                Go to Admin Panel
              </Link>
            ) : (
              <>
                <Link
                  to="/trial"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ui-button-primary w-full justify-center text-center text-sm font-semibold"

                >
                  Get Free Trial Key (1M Tokens)
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ui-button-secondary w-full justify-center text-center text-sm font-semibold"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
