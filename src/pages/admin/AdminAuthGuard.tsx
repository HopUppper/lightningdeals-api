import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLoginPage } from './AdminLoginPage';
import { Shield } from 'lucide-react';

export const AdminAuthGuard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { adminUser, adminLoading } = useAuth();

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] text-slate-300 flex flex-col items-center justify-center font-sans space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono tracking-wider uppercase text-slate-400">
          🔒 Verifying Admin Security Credentials...
        </p>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'admin') {
    return <AdminLoginPage />;
  }

  return children;
};
