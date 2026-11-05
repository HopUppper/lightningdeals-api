import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  Key,
  Activity,
  LifeBuoy,
  Settings,
  LogOut,
  BookOpen,
  CreditCard,
  Layers,
  Users,
  Menu,
  X,
  Play,
  Star,
  Bot,
  Sparkles,
  Cpu,
  ChevronDown,
  ChevronRight,
  Code2,
  Scale,
  ChevronsUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../../components/NotificationCenter';
import { OrbitIcon } from '../../components/brand/OrbitIcon';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  end?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  icon: any;
  items: NavItem[];
}

export const UserDashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (user && user.role !== 'admin' && !user.emailVerified) {
      navigate(`/verify-email?email=${encodeURIComponent(user.email)}`, { replace: true });
    }
  }, [user, navigate]);

  const navGroups: NavGroup[] = [
    {
      id: 'home',
      title: 'HOME',
      icon: LayoutDashboard,
      items: [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      id: 'develop',
      title: 'DEVELOP',
      icon: Cpu,
      items: [
        { name: 'Orbit Builder', path: '/dashboard/builder', icon: Sparkles, badge: 'Builder' },
        { name: 'Orbit Workspace', path: '/dashboard/studio', icon: OrbitIcon, badge: 'All-in-One' },
        { name: 'API Keys', path: '/dashboard/keys', icon: Key },
        { name: 'Models & Rates', path: '/dashboard/models', icon: Cpu, badge: '82 Models' },
        { name: 'API Console', path: '/dashboard/api-test', icon: Play },
        { name: 'Migration Guide', path: '/dashboard/migration', icon: Code2, badge: 'New' },
        { name: 'Model Benchmarks', path: '/dashboard/benchmarks', icon: Scale },
        { name: 'Documentation', path: '/dashboard/docs', icon: BookOpen },
      ],
    },
    {
      id: 'billing',
      title: 'USAGE & BILLING',
      icon: CreditCard,
      items: [
        { name: 'Usage & Quota', path: '/dashboard/usage', icon: Activity },
        { name: 'Active Plans', path: '/dashboard/plan', icon: CreditCard },
        { name: 'Subscriptions', path: '/dashboard/subscriptions', icon: Layers },
        { name: 'Orders & Receipts', path: '/dashboard/orders', icon: CreditCard },
      ],
    },
    {
      id: 'account',
      title: 'ACCOUNT',
      icon: Users,
      items: [
        { name: 'Teams & Workspace', path: '/dashboard/teams', icon: Users, badge: 'Teams' },
        { name: 'Rewards & Wallet', path: '/dashboard/rewards', icon: Zap },
        { name: 'Referral Program', path: '/dashboard/referrals', icon: Users },
        { name: 'Support Desk', path: '/dashboard/support', icon: LifeBuoy },
        { name: 'Feedback & Reviews', path: '/dashboard/feedback', icon: Star },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  // Helper to determine which group owns the current route
  const getActiveGroupId = (pathname: string): string => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.end ? pathname === item.path : pathname.startsWith(item.path)) {
          return group.id;
        }
      }
    }
    return 'home';
  };

  // Keep track of which categories are open in dropdown boxes
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('lightning_dashboard_open_categories_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default open state: HOME is open, plus active group
    return {
      home: true,
      develop: true,
      billing: false,
      account: false,
    };
  });

  // When route changes, auto-expand the category containing the active route
  useEffect(() => {
    const activeGroupId = getActiveGroupId(location.pathname);
    if (activeGroupId && !openCategories[activeGroupId]) {
      setOpenCategories((prev) => {
        const next = { ...prev, [activeGroupId]: true };
        try {
          localStorage.setItem('lightning_dashboard_open_categories_v2', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [location.pathname]);

  const toggleCategory = (groupId: string) => {
    setOpenCategories((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('lightning_dashboard_open_categories_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleAllCategories = () => {
    const allOpen = Object.values(openCategories).every(Boolean);
    const nextState: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      nextState[g.id] = !allOpen;
    });
    setOpenCategories(nextState);
    try {
      localStorage.setItem('lightning_dashboard_open_categories_v2', JSON.stringify(nextState));
    } catch {}
  };

  const isStudio =
    location.pathname.startsWith('/dashboard/studio') ||
    location.pathname.startsWith('/dashboard/chat') ||
    location.pathname.startsWith('/dashboard/builder') ||
    location.pathname.startsWith('/dashboard/websites');

  useEffect(() => {
    if (isStudio) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [isStudio]);

  return (
    <div
      className={`bg-[#fbfbfa] text-[#111827] flex flex-col font-sans ${
        isStudio ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Header */}
      {!isStudio && (
        <header className="h-14 sm:h-16 border-b border-[#e5e7eb] bg-white sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 md:hidden border border-[#e5e7eb] bg-[#fbfbfa]"
              aria-label="Toggle Navigation"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7136E8] text-white shadow-xs">
                <Zap className="w-4 h-4 fill-current text-white" />
              </div>
              <div className="flex items-baseline">
                <span className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                  LightningAPI
                </span>
                <span className="text-xs text-[#7136E8] font-semibold ml-1 hidden sm:inline">
                  Console
                </span>
              </div>
            </Link>

            <span className="text-[11px] font-medium text-emerald-800 bg-[#f0fdf4] border border-emerald-200 px-2 py-0.5 rounded-md hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Operational</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="flex items-center gap-2.5 border-l border-[#e5e7eb] pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[#111827]">{user?.name || 'Account'}</p>
                <p className="text-[11px] text-[#6b7280] font-mono">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      {isStudio ? (
        <div className="flex-1 w-full min-h-0 flex overflow-hidden">
          <Outlet />
        </div>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-[250px_1fr] gap-6 items-start">
          {/* Sidebar Navigation */}
          <aside
            className={`md:block ${
              mobileNavOpen ? 'block' : 'hidden'
            } space-y-2.5 bg-white p-3 rounded-2xl border border-[#e5e7eb] shadow-xs sticky top-20`}
          >
            {/* Quick Accordion Collapse / Expand Toggle */}
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-[#f3f4f6]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
                Categories
              </span>
              <button
                type="button"
                onClick={toggleAllCategories}
                className="text-[10px] font-medium text-[#7136E8] hover:underline flex items-center gap-1 cursor-pointer"
                title="Expand or collapse all category sections"
              >
                <ChevronsUpDown className="w-3 h-3" />
                <span>
                  {Object.values(openCategories).every(Boolean) ? 'Collapse All' : 'Expand All'}
                </span>
              </button>
            </div>

            {/* Collapsible Category Groups */}
            <div className="space-y-1.5">
              {navGroups.map((group) => {
                const isOpen = Boolean(openCategories[group.id]);
                const isGroupActive = group.items.some((item) =>
                  item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
                );

                return (
                  <div
                    key={group.id}
                    className={`rounded-xl border transition-all ${
                      isGroupActive
                        ? 'border-[#7136E8]/20 bg-[#7136E8]/[0.02]'
                        : 'border-transparent hover:border-[#f3f4f6]'
                    }`}
                  >
                    {/* Category Dropdown Header Box */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(group.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${
                        isGroupActive
                          ? 'text-[#7136E8] bg-[#7136E8]/8'
                          : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f4f4f0]'
                      }`}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <group.icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isGroupActive ? 'text-[#7136E8]' : 'text-gray-400'
                          }`}
                        />
                        <span className="truncate">{group.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                            isGroupActive
                              ? 'bg-[#7136E8] text-white font-bold'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {group.items.length}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isGroupActive ? 'text-[#7136E8]' : 'text-gray-400'
                          } ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                        />
                      </div>
                    </button>

                    {/* Respective Features / Settings inside Dropdown */}
                    {isOpen && (
                      <div className="pt-1 pb-1 space-y-0.5 px-1 border-t border-[#f3f4f6]/60 mt-0.5">
                        {group.items.map((item) => (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => setMobileNavOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                                isActive
                                  ? 'bg-[#7136E8]/10 text-[#7136E8] font-semibold shadow-2xs'
                                  : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f4f4f0]'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon
                                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                    isActive
                                      ? 'text-[#7136E8]'
                                      : 'text-gray-400 group-hover:text-gray-700'
                                  }`}
                                />
                                <span className="flex-1 truncate">{item.name}</span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                      isActive
                                        ? 'bg-[#7136E8] text-white'
                                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Gateway Status Badge */}
            <div className="pt-3 border-t border-[#e5e7eb] px-2.5 text-[11px] text-[#6b7280]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111827]">Gateway v2.0</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-gray-400 text-[10px] mt-0.5 font-mono">
                Multi-provider intelligent mesh
              </p>
            </div>
          </aside>

          {/* Content Outlet */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
};

export default UserDashboardLayout;
