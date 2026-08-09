import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { Zap, LayoutDashboard, Key, Activity, ShoppingBag, Terminal, BookOpen, Settings, LogOut, ArrowLeft, ShieldCheck, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserDashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'API Keys', path: '/dashboard/keys', icon: Key },
    { name: 'Usage & Ledger', path: '/dashboard/usage', icon: Activity },
    { name: 'Token Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { name: 'API Test Console', path: '/dashboard/api-test', icon: Terminal },
    { name: 'Documentation', path: '/docs', icon: BookOpen },
    { name: 'Support Help Desk', path: '/dashboard/support', icon: LifeBuoy },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 px-5 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-black font-extrabold transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-base font-bold text-fg tracking-tight">LightningDeals</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold uppercase tracking-wider">
              Customer Portal
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <Link to="/admin" className="ui-button-secondary text-xs py-1.5 px-3 border-amber-500/30 text-amber-500 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          )}

          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-fg">{user?.name}</p>
              <p className="text-[10px] text-muted font-mono">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-control text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-control text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-muted hover:text-fg hover:bg-card border border-transparent'
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
