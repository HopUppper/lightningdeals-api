import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { Zap, LayoutDashboard, Key, Activity, ShieldCheck, LifeBuoy, Settings, LogOut, BookOpen, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserDashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'API Keys', path: '/dashboard/keys', icon: Key },
    { name: 'Usage', path: '/dashboard/usage', icon: Activity },
    { name: 'Plan', path: '/dashboard/plan', icon: CreditCard },
    { name: 'Documentation', path: '/dashboard/docs', icon: BookOpen },
    { name: 'Support', path: '/dashboard/support', icon: LifeBuoy },
    { name: 'Account', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold shadow-md shadow-violet-500/20 transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-base font-extrabold text-fg tracking-tight">
              Lightning<span className="animated-gradient-text">Deals</span>
            </span>
          </Link>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200/80 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
            Customer Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 border-l border-border pl-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-fg">{user?.name}</p>
              <p className="text-[10px] text-muted font-mono">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-control text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar Navigation */}
        <aside className="space-y-1">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted px-3 mb-2">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-control text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-xs font-extrabold'
                    : 'text-muted hover:text-fg hover:bg-subtle'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
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

export default UserDashboardLayout;
