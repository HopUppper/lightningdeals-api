import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, ShieldCheck, Key } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Account Settings</h1>
        <p className="text-xs text-muted mt-1">
          Manage profile details, security settings, and session credentials.
        </p>
      </div>

      <div className="bg-card border border-border rounded-panel p-6 space-y-6 max-w-xl">
        <div className="space-y-4 border-b border-border pb-6">
          <h3 className="text-sm font-bold text-fg">Profile Information</h3>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-bg border border-border rounded-control text-fg opacity-80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-bg border border-border rounded-control text-fg opacity-80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg mb-1">Account Role</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                disabled
                value={user?.role?.toUpperCase() || 'USER'}
                className="w-full pl-9 pr-4 py-2 text-xs font-mono font-bold bg-bg border border-border rounded-control text-accent uppercase opacity-80"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-fg">Security & Sessions</h3>
          <p className="text-xs text-muted leading-relaxed">
            Your session is secured using HTTP-only JWT cookies and SHA-256 hashed API key authentication.
          </p>

          <div className="p-4 rounded-control bg-bg border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">Active Session</p>
              <p className="text-[11px] text-muted">Current Web Dashboard Session</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
