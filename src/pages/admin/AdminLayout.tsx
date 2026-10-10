import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Key, Zap, ShoppingBag, Server, Activity, Settings, LogOut, Search, X, FileText, Globe, LifeBuoy, ShieldAlert, Award, CheckCircle2, Layers, Gift, MessageSquare, Bot, Star } from 'lucide-react';
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
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Fulfillment', path: '/admin/fulfillment', icon: CheckCircle2, badge: 'SLA' },
    { name: 'Customer Feedback', path: '/admin/feedback', icon: Star, badge: 'FEEDBACK' },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: Layers, badge: 'CYCLES' },
    { name: 'Plans & Offers', path: '/admin/plans', icon: Zap },
    { name: 'Orders & Sales', path: '/admin/orders', icon: ShoppingBag },
    { name: 'WhatsApp Desk', path: '/admin/whatsapp', icon: MessageSquare },
    { name: 'AI Control', path: '/admin/ai-control', icon: Bot },
    { name: 'Rewards', path: '/admin/rewards', icon: Award },
    { name: 'Referrals', path: '/admin/referrals', icon: Gift },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Live Analytics', path: '/admin/analytics', icon: Globe },
    { name: 'Support Tickets', path: '/admin/support', icon: LifeBuoy },
    { name: 'API Keys', path: '/admin/keys', icon: Key },
    { name: 'Providers', path: '/admin/providers', icon: Server },
    { name: 'Usage', path: '/admin/usage', icon: Activity },
    { name: 'Audit Logs', path: '/admin/logs', icon: FileText },
    { name: 'Emergency Controls', path: '/admin/emergency', icon: ShieldAlert },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-[#e5e7eb] bg-white sticky top-0 z-40 px-5 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0f172a] text-white flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-current text-white" />
            </div>
            <span className="text-base font-bold text-[#111827] tracking-tight">
              LightningAPI<span className="text-gray-400 font-normal ml-0.5">Admin</span>
            </span>
          </Link>
        </div>

        {/* Global Admin Search Bar */}
        <div className="relative max-w-md w-full hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowSearchDropdown(true);
              }}
              placeholder="Search keys, customers, orders... (⌘K)"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#fbfbfa] border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1e40af] text-[#111827] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e5e7eb] rounded-xl p-4 z-50 space-y-3 max-h-[400px] overflow-y-auto text-xs shadow-lg">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2">
                <span className="text-[11px] uppercase font-semibold text-[#6b7280]">Search Results</span>
                <button
                  onClick={() => setShowSearchDropdown(false)}
                  className="text-[#6b7280] hover:text-[#111827] text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>

              {searchResults.customers?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[#1e40af] mb-1">Customers</p>
                  {searchResults.customers.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        navigate('/admin/customers');
                        setShowSearchDropdown(false);
                      }}
                      className="p-2 hover:bg-[#f4f4f0] rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <span className="font-medium text-[#111827]">{c.email}</span>
                      <span className="text-[#6b7280] text-[11px]">{c.name || 'User'}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.keys?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase text-[#1e40af] mb-1">API Keys</p>
                  {searchResults.keys.map((k: any) => (
                    <div
                      key={k.id}
                      onClick={() => {
                        navigate('/admin/keys');
                        setShowSearchDropdown(false);
                      }}
                      className="p-2 hover:bg-[#f4f4f0] rounded-lg cursor-pointer flex justify-between items-center transition-colors font-mono"
                    >
                      <span>{k.maskedKey}</span>
                      <span className="text-[#6b7280] text-[11px]">{k.user?.email}</span>
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
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#4b5563] hover:text-[#111827] hover:bg-[#f4f4f0] rounded-lg transition-colors border border-[#e5e7eb]"
          >
            <span>View Site</span>
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-[#e5e7eb]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#111827]">{adminUser?.name || 'Administrator'}</p>
              <p className="text-[10px] text-[#6b7280] font-mono">{adminUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
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
        <aside className="space-y-1 bg-white p-3 rounded-xl border border-[#e5e7eb] shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] px-2.5 py-1 mb-1">
            Admin Management
          </p>
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0f172a] text-white font-semibold'
                    : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f4f4f0]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-medium bg-gray-100 text-gray-600">
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
