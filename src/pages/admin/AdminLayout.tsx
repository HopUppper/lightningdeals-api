import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, LayoutDashboard, Users, Key, Zap, ShoppingBag, Server, Activity, Settings, LogOut, Search, X, FileText, Globe, LifeBuoy, ShieldAlert, Award, CheckCircle2, Layers, Gift, MessageSquare, Bot, Star, ShieldCheck, DollarSign } from 'lucide-react';
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
  const { adminUser, adminLogout } = useAuth();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
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
    { name: 'Overview', path: '/deez', icon: LayoutDashboard, end: true },
    { name: 'Fulfillment', path: '/deez/fulfillment', icon: CheckCircle2, badge: 'SLA' },
    { name: 'Customer Feedback', path: '/deez/feedback', icon: Star, badge: 'FEEDBACK' },
    { name: 'Subscriptions', path: '/deez/subscriptions', icon: Layers, badge: 'CYCLES' },
    { name: 'Plans & Offers', path: '/deez/plans', icon: Zap },
    { name: 'Pricing & Margins', path: '/deez/pricing', icon: DollarSign, badge: 'MARGIN' },
    { name: 'Orders & Sales', path: '/deez/orders', icon: ShoppingBag },
    { name: 'WhatsApp Desk', path: '/deez/whatsapp', icon: MessageSquare },
    { name: 'AI Control', path: '/deez/ai-control', icon: Bot },
    { name: 'Rewards', path: '/deez/rewards', icon: Award },
    { name: 'Referrals', path: '/deez/referrals', icon: Gift },
    { name: 'Customers', path: '/deez/customers', icon: Users },
    { name: 'Live Analytics', path: '/deez/analytics', icon: Globe },
    { name: 'Support Tickets', path: '/deez/support', icon: LifeBuoy },
    { name: 'API Keys', path: '/deez/keys', icon: Key },
    { name: 'Providers', path: '/deez/providers', icon: Server },
    { name: 'ScaleMax Live Keys', path: '/deez/scalemax', icon: ShieldCheck, badge: 'LIVE' },
    { name: 'Usage', path: '/deez/usage', icon: Activity },
    { name: 'Audit Logs', path: '/deez/logs', icon: FileText },
    { name: 'Emergency Controls', path: '/deez/emergency', icon: ShieldAlert },
    { name: 'Settings', path: '/deez/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-950 flex flex-col font-sans antialiased">
      {/* Top Bar */}
      <header className="h-16 border-b border-[#ede8e1] bg-white sticky top-0 z-40 px-5 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/deez" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 fill-current text-white" />
            </div>
            <div className="flex items-baseline">
              <span className="text-base font-extrabold text-zinc-950 tracking-tight font-display">
                LightningAPI
              </span>
              <span className="text-xs font-semibold text-violet-600 ml-1 font-mono uppercase tracking-wider">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Global Admin Search Bar */}
        <div className="relative max-w-md w-full hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowSearchDropdown(true);
              }}
              placeholder="Search keys, customers, orders... (⌘K)"
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#fafaf9] border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/15 text-zinc-900 transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#ede8e1] rounded-2xl p-4 z-50 space-y-3 max-h-[400px] overflow-y-auto text-xs shadow-lg">
              <div className="flex items-center justify-between border-b border-[#ede8e1] pb-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">Search Results</span>
                <button
                  onClick={() => setShowSearchDropdown(false)}
                  className="text-zinc-500 hover:text-zinc-950 text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>

              {searchResults.customers?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-violet-700 font-mono tracking-wider mb-1">Customers</p>
                  {searchResults.customers.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        navigate('/deez/customers');
                        setShowSearchDropdown(false);
                      }}
                      className="p-2 hover:bg-violet-50/50 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <span className="font-semibold text-zinc-900">{c.email}</span>
                      <span className="text-zinc-500 text-[11px]">{c.name || 'User'}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.keys?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-violet-700 font-mono tracking-wider mb-1">API Keys</p>
                  {searchResults.keys.map((k: any) => (
                    <div
                      key={k.id}
                      onClick={() => {
                        navigate('/deez/keys');
                        setShowSearchDropdown(false);
                      }}
                      className="p-2 hover:bg-violet-50/50 rounded-xl cursor-pointer flex justify-between items-center transition-colors font-mono"
                    >
                      <span>{k.maskedKey}</span>
                      <span className="text-zinc-500 text-[11px]">{k.user?.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Admin Profile & Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200"
          >
            <span>View Site</span>
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-[#ede8e1]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-950">{adminUser?.name || 'Administrator'}</p>
              <p className="text-[10px] text-zinc-500 font-mono">{adminUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Sign Out of Admin Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Body Container */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-[230px_1fr] gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="space-y-1 bg-white p-3 rounded-2xl border border-[#ede8e1] shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2.5 py-1 mb-1 font-mono">
            Admin Management
          </p>
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-violet-50 text-violet-700 font-semibold border border-violet-200/70 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9.5px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-zinc-100 text-zinc-600">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </aside>

        {/* Content Outlet */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
