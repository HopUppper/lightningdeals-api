import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Key, Zap, ShoppingBag, Server, Activity, Settings, LogOut, Search, X, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminFetch } from '../../utils/api';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: string;
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
        const res = await adminFetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
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
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Products / Keys', path: '/admin/keys', icon: Key, badge: 'KEYS' },
    { name: 'Providers', path: '/admin/providers', icon: Server, badge: 'VENDOR' },
    { name: 'Usage', path: '/admin/usage', icon: Activity },
    { name: 'Audit Logs', path: '/admin/logs', icon: FileText, badge: 'LOGS' },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-border/80 bg-white/90 backdrop-blur-xl sticky top-0 z-40 px-5 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold shadow-md shadow-violet-500/20 transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-base font-extrabold text-fg tracking-tight">
              Lightning<span className="animated-gradient-text">Deals</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold font-mono uppercase tracking-wider border border-violet-200">
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
              placeholder="Search keys, customers, orders... (⌘K)"
              className="w-full pl-10 pr-8 py-2 text-xs bg-white border border-violet-200 rounded-control focus:outline-none focus:border-violet-500 text-fg font-mono shadow-xs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-violet-200 rounded-panel shadow-2xl p-4 z-50 space-y-4 max-h-[400px] overflow-y-auto text-xs font-sans">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[10px] uppercase font-bold text-muted">Search Results</span>
                <button onClick={() => setShowSearchDropdown(false)} className="text-muted hover:text-fg text-xs font-mono">Close</button>
              </div>

              {searchResults.customers?.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase text-violet-700 mb-1">Customers</p>
                  {searchResults.customers.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => { navigate('/admin/customers'); setShowSearchDropdown(false); }}
                      className="p-2 hover:bg-violet-50/60 rounded cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-semibold text-fg">{c.name} ({c.email})</span>
                      <span className="text-[10px] font-mono text-muted uppercase">{c.role}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.keys?.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase text-violet-700 mb-1">API Keys</p>
                  {searchResults.keys.map((k: any) => (
                    <div
                      key={k.id}
                      onClick={() => { navigate('/admin/keys'); setShowSearchDropdown(false); }}
                      className="p-2 hover:bg-violet-50/60 rounded cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-mono text-fg">{k.name} ({k.displayKey})</span>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold">{Number(k.tokensRemaining).toLocaleString()} tokens</span>
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
              <p className="text-[10px] text-muted font-mono">{user?.email || 'admin@lightningapi.pro'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-control text-muted hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Sign out of Admin Control Center"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-1.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted px-3 mb-2">
            ADMIN OPERATIONS
          </p>
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-control text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold shadow-md shadow-violet-500/20'
                    : 'text-muted hover:text-fg hover:bg-white border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200">
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
