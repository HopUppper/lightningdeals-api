import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { Zap, LayoutDashboard, Key, Activity, LifeBuoy, Settings, LogOut, BookOpen, CreditCard, Layers, Users, Menu, X, Play, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../../components/NotificationCenter';

export const UserDashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'API Keys', path: '/dashboard/keys', icon: Key },
    { name: 'Playground', path: '/dashboard/api-test', icon: Play },
    { name: 'Usage & Quota', path: '/dashboard/usage', icon: Activity },
    { name: 'Active Plans', path: '/dashboard/plan', icon: CreditCard },
    { name: 'Subscriptions', path: '/dashboard/subscriptions', icon: Layers },
    { name: 'Rewards & Wallet', path: '/dashboard/rewards', icon: Zap },
    { name: 'Referral Program', path: '/dashboard/referrals', icon: Users },
    { name: 'Orders & Receipts', path: '/dashboard/orders', icon: CreditCard },
    { name: 'Documentation', path: '/dashboard/docs', icon: BookOpen },
    { name: 'Support Desk', path: '/dashboard/support', icon: LifeBuoy },
    { name: 'Feedback & Reviews', path: '/dashboard/feedback', icon: Star },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#111827] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-[#e5e7eb] bg-white sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f172a] text-white">
              <Zap className="w-3.5 h-3.5 fill-current text-white" />
            </div>
            <div className="flex items-baseline">
              <span className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                LightningAPI
              </span>
              <span className="text-xs text-gray-400 ml-0.5 hidden sm:inline">
                Console
              </span>
            </div>
          </Link>

          <span className="text-[11px] font-medium text-emerald-800 bg-[#f0fdf4] border border-emerald-200 px-2 py-0.5 rounded hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
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

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className={`md:block ${mobileNavOpen ? 'block' : 'hidden'} space-y-1 bg-white p-3 rounded-xl border border-[#e5e7eb] shadow-xs`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] px-2.5 py-1 mb-1">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0f172a] text-white font-semibold'
                    : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#f4f4f0]'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}

          <div className="pt-3 mt-3 border-t border-[#e5e7eb] px-2.5 text-[11px] text-[#6b7280]">
            <p className="font-semibold text-[#111827]">Gateway v1.4</p>
            <p className="text-emerald-700 mt-0.5">● Anthropic /v1/messages</p>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
