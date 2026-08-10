import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, Users, Key, Zap, ShoppingBag, DollarSign, Cpu, Server, Activity, ShieldAlert, FileText, Settings, Terminal, AlertTriangle, LogOut, ArrowLeft, Mail, Search, LifeBuoy, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: string;
  alert?: boolean;
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          setSearchResults(await res.json());
          setShowSearchDropdown(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }

    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const primaryNavItems: NavItem[] = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Customer API Keys', path: '/admin/keys', icon: Key, badge: 'KEYS' },
    { name: 'Master Supplier Keys', path: '/admin/providers', icon: Server, badge: 'VENDOR' },
    { name: 'Customers & Leads', path: '/admin/customers', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-border bg-card sticky top-0 z-40 px-5 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-black font-extrabold transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-base font-bold text-fg tracking-tight">LightningDeals</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold uppercase tracking-wider">
              Control Center
            </span>
          </Link>
        </div>

        {/* Global Admin Search Bar */}
        <div className="relative max-w-md w-full hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults) setShowSearchDropdown(true); }}
              placeholder="Search keys, customers, emails..."
              className="w-full pl-10 pr-8 py-2 text-xs bg-bg border border-border rounded-control focus:outline-none focus:border-accent text-fg font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-panel shadow-2xl p-4 z-50 space-y-4 max-h-[400px] overflow-y-auto text-xs font-sans">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[10px] uppercase font-bold text-muted">Global Search Results</span>
                <button onClick={() => setShowSearchDropdown(false)} className="text-muted hover:text-fg text-xs">Close</button>
              </div>

              {searchResults.customers?.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase text-amber-500 mb-1">Customers</p>
                  {searchResults.customers.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => { navigate('/admin/customers'); setShowSearchDropdown(false); }}
                      className="p-2 hover:bg-bg rounded cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-semibold text-fg">{c.name} ({c.email})</span>
                      <span className="text-[10px] font-mono text-muted uppercase">{c.role}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.keys?.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase text-amber-500 mb-1">API Keys</p>
                  {searchResults.keys.map((k: any) => (
                    <div
                      key={k.id}
                      onClick={() => { navigate('/admin/keys'); setShowSearchDropdown(false); }}
                      className="p-2 hover:bg-bg rounded cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-mono text-fg">{k.name} ({k.displayKey})</span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">{Number(k.tokensRemaining).toLocaleString()} tokens</span>
                    </div>
                  ))}
                </div>
              )}

              {!searchResults.customers?.length && !searchResults.keys?.length && (
                <div className="py-4 text-center text-muted font-mono">No matching records found.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-fg">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-muted font-mono">{user?.email || 'sidhjain9002@gmail.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-control text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Sign out of Admin Panel"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 grid lg:grid-cols-[230px_1fr] gap-8">
        {/* Simplified Sidebar */}
        <aside className="space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted px-3 mb-2">
            ADMIN NAVIGATION
          </p>
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-control text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md font-bold'
                    : 'text-muted hover:text-fg hover:bg-card border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </aside>

        {/* Dynamic Outlet */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

