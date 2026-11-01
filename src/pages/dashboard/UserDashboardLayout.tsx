import React, { useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../../components/NotificationCenter';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  end?: boolean;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const UserDashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navGroups: NavGroup[] = [
    {
      title: 'HOME',
      items: [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
      ],
    },
    {
      title: 'DEVELOP',
      items: [
        { name: 'AI Chat Studio', path: '/dashboard/studio', icon: Bot, badge: 'Studio' },
        { name: 'API Keys', path: '/dashboard/keys', icon: Key },
        { name: 'Models & Rates', path: '/dashboard/models', icon: Cpu, badge: '74 Models' },
        { name: 'API Console', path: '/dashboard/api-test', icon: Play },
        { name: 'Documentation', path: '/dashboard/docs', icon: BookOpen },
        { name: 'AI Website Builder', path: '/dashboard/builder', icon: Sparkles },
      ],
    },
    {
      title: 'USAGE & BILLING',
      items: [
        { name: 'Usage & Quota', path: '/dashboard/usage', icon: Activity },
        { name: 'Active Plans', path: '/dashboard/plan', icon: CreditCard },
        { name: 'Subscriptions', path: '/dashboard/subscriptions', icon: Layers },
        { name: 'Orders & Receipts', path: '/dashboard/orders', icon: CreditCard },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { name: 'Rewards & Wallet', path: '/dashboard/rewards', icon: Zap },
        { name: 'Referral Program', path: '/dashboard/referrals', icon: Users },
        { name: 'Support Desk', path: '/dashboard/support', icon: LifeBuoy },
        { name: 'Feedback & Reviews', path: '/dashboard/feedback', icon: Star },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  const location = useLocation();
  const isStudio =
    location.pathname.startsWith('/dashboard/studio') ||
    location.pathname.startsWith('/dashboard/chat') ||
    location.pathname.startsWith('/dashboard/builder') ||
    location.pathname.startsWith('/dashboard/websites');

  React.useEffect(() => {
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
      {/* Top Header (omitted in Studio workspace for dedicated full-height experience) */}
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
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-[240px_1fr] gap-6 items-start">
          {/* Sidebar Navigation */}
          <aside
            className={`md:block ${
              mobileNavOpen ? 'block' : 'hidden'
            } space-y-4 bg-white p-3 rounded-2xl border border-[#e5e7eb] shadow-xs sticky top-20`}
          >
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] px-2.5 py-1">
                  {group.title}
                </p>
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
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#7136E8]' : 'text-gray-400 group-hover:text-gray-700'
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
            ))}

            <div className="pt-3 border-t border-[#e5e7eb] px-2.5 text-[11px] text-[#6b7280]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111827]">Gateway v1.4</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-gray-400 text-[10px] mt-0.5 font-mono">Anthropic &amp; OpenAI edge mesh</p>
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
