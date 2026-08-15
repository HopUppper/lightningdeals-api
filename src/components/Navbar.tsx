import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Zap, Sparkles, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Why Us', href: isHomePage ? '#why-us' : '/#why-us' },
    { name: 'API Gateway', href: isHomePage ? '#api' : '/#api' },
    { name: 'Models', href: '/models', isPage: true },
    { name: 'Pricing', href: '/pricing', isPage: true },
    { name: 'Check Key', href: '/check-key', isPage: true },
    { name: 'Docs', href: '/docs', isPage: true },
    { name: 'Status', href: '/status', isPage: true },
    { name: 'Sign In', href: '/login', isPage: true, isHighlight: true },
    { name: 'Sign Up', href: '/register', isPage: true, isHighlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/85 backdrop-blur-xl shadow-xs">
      <nav className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6" aria-label="Primary">
        
        {/* Brand Logo with 3D Glowing Icon */}
        <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-fg group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white transition-transform group-hover:scale-105 font-extrabold shadow-md shadow-violet-500/25">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-base font-extrabold text-fg tracking-tight">
            Lightning<span className="animated-gradient-text">Deals</span>
          </span>
        </Link>

        {/* Navigation Links — Includes Sign In & Sign Up Tabs */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            link.isPage ? (
              <Link
                key={link.name}
                to={link.href}
                className={`inline-flex min-h-[36px] items-center rounded-control px-3 text-xs font-bold transition-all ${
                  link.isHighlight
                    ? 'bg-violet-600 text-white shadow-xs hover:bg-violet-700 font-extrabold px-3.5 ml-1'
                    : location.pathname === link.href
                    ? 'bg-violet-50 text-violet-700 font-bold border border-violet-200/60'
                    : 'text-muted hover:text-fg hover:bg-subtle'
                }`}
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="inline-flex min-h-[36px] items-center rounded-control px-3 text-xs font-semibold text-muted transition-colors hover:text-fg hover:bg-subtle"
              >
                {link.name}
              </a>
            )
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {user && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control text-xs font-semibold text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to="/check-key"
            className="ui-button-secondary text-xs px-3 py-1.5 font-semibold"
          >
            Check Key
          </Link>

          <Link
            to="/trial"
            className="ui-button-primary text-xs px-3.5 py-1.5 font-bold gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Get Free Trial</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/login"
            className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-control border border-violet-200"
          >
            Sign In
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-white text-fg transition-colors hover:bg-subtle"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 h-[calc(100vh-4rem)] z-[100] flex flex-col bg-white/95 backdrop-blur-2xl border-b border-border p-6 overflow-y-auto md:hidden shadow-2xl font-sans">
          <div className="flex flex-col gap-1 border-b border-border/80 pb-6">
            {navLinks.map((link) => (
              link.isPage ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3.5 px-3 text-base font-semibold text-fg hover:text-violet-600 hover:bg-violet-50/60 rounded-control transition-colors border-b border-border/30 last:border-0"
                >
                  <span>{link.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3.5 px-3 text-base font-semibold text-fg hover:text-violet-600 hover:bg-violet-50/60 rounded-control transition-colors border-b border-border/30 last:border-0"
                >
                  <span>{link.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </a>
              )
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3.5 rounded-control bg-violet-600 text-white font-bold text-sm text-center shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Account</span>
            </Link>

            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3.5 rounded-control bg-violet-50 border border-violet-200 text-violet-700 font-bold text-sm text-center flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
            </Link>

            <Link
              to="/trial"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full justify-center text-center text-xs font-bold py-3 rounded-control border border-border text-muted hover:text-fg"
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              <span>Claim Free 1M Token Trial</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
