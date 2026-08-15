import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export const UserAuthGuard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-fg flex flex-col items-center justify-center font-sans space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-600 flex items-center justify-center animate-pulse">
          <Shield className="w-5 h-5" />
        </div>
        <p className="text-xs font-mono tracking-wider uppercase text-muted">
          Verifying Customer Authentication...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
