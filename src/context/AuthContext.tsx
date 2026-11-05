import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { attemptTokenRefresh } from '../utils/api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'user' | 'admin';
  emailVerified?: boolean;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  adminUser: User | null;
  loading: boolean;
  adminLoading: boolean;
  sessionExpiredNotice: boolean;
  clearSessionExpiredNotice: () => void;
  login: (token: string, user: User) => void;
  adminLogin: (token: string, user: User) => void;
  logout: () => Promise<void>;
  adminLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminUser: null,
  loading: true,
  adminLoading: true,
  sessionExpiredNotice: false,
  clearSessionExpiredNotice: () => {},
  login: () => {},
  adminLogin: () => {},
  logout: async () => {},
  adminLogout: async () => {},
  refreshUser: async () => {},
  refreshAdmin: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const getStoredToken = () => {
    return sessionStorage.getItem('apexscale_token') || localStorage.getItem('apexscale_token') || '';
  };

  const getStoredAdminToken = () => {
    return sessionStorage.getItem('ld_admin_token') || localStorage.getItem('ld_admin_token') || '';
  };

  const clearSessionExpiredNotice = useCallback(() => {
    setSessionExpiredNotice(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await fetch('/api/auth/me', { headers, credentials: 'include' });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setSessionExpiredNotice(false);
        }
      } else if (res.status === 401) {
        // Attempt silent proactive token refresh before giving up
        const refreshedToken = await attemptTokenRefresh();
        if (refreshedToken) {
          const retryRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${refreshedToken}` },
            credentials: 'include',
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            if (data.user) {
              setUser(data.user);
              setSessionExpiredNotice(false);
              return;
            }
          }
        }
        // Genuine expiration: only clear if refresh failed definitively
        sessionStorage.removeItem('apexscale_token');
        localStorage.removeItem('apexscale_token');
        setUser(null);
      }
      // If server returned 500/502/503/timeout, DO NOT purge existing logged-in session!
    } catch (e) {
      // Network drop: do not purge user if we already have an active state
      if (!userRef.current) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    try {
      const adminToken = getStoredAdminToken();
      if (!adminToken) {
        setAdminUser(null);
        setAdminLoading(false);
        return;
      }
      const headers: Record<string, string> = { Authorization: `Bearer ${adminToken}` };
      const res = await fetch('/api/admin/auth/me', { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.user);
      } else if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('ld_admin_token');
        localStorage.removeItem('ld_admin_token');
        setAdminUser(null);
      }
    } catch (e) {
      // Retain admin session on network glitches
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Cross-tab synchronization via storage event
    const syncAcrossTabs = (e: StorageEvent) => {
      if (e.key === 'apexscale_token') {
        if (!e.newValue) {
          setUser(null);
        } else {
          sessionStorage.setItem('apexscale_token', e.newValue);
          refreshUser();
        }
      }
      if (e.key === 'ld_admin_token') {
        if (!e.newValue) {
          setAdminUser(null);
        } else {
          sessionStorage.setItem('ld_admin_token', e.newValue);
          refreshAdmin();
        }
      }
    };
    window.addEventListener('storage', syncAcrossTabs);

    // 2. Synchronize localStorage and sessionStorage within current window
    const userTok = localStorage.getItem('apexscale_token');
    if (userTok && !sessionStorage.getItem('apexscale_token')) {
      sessionStorage.setItem('apexscale_token', userTok);
    }
    const adminTok = localStorage.getItem('ld_admin_token');
    if (adminTok && !sessionStorage.getItem('ld_admin_token')) {
      sessionStorage.setItem('ld_admin_token', adminTok);
    }

    refreshUser();
    refreshAdmin();

    // 3. Handle graceful session expiry event
    const handleSessionExpired = () => {
      sessionStorage.removeItem('apexscale_token');
      localStorage.removeItem('apexscale_token');
      setUser(null);
      setSessionExpiredNotice(true);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    // 4. Proactive background session refresh timer (every 20 minutes)
    const refreshTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && userRef.current) {
        attemptTokenRefresh().catch(() => {});
      }
    }, 20 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', syncAcrossTabs);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      clearInterval(refreshTimer);
    };
  }, [refreshUser, refreshAdmin]);

  const login = (token: string, userData: User) => {
    sessionStorage.setItem('apexscale_token', token);
    localStorage.setItem('apexscale_token', token);
    setUser(userData);
    setSessionExpiredNotice(false);
  };

  const adminLogin = (token: string, userData: User) => {
    sessionStorage.setItem('ld_admin_token', token);
    localStorage.setItem('ld_admin_token', token);
    setAdminUser(userData);
    window.location.href = '/deez';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    sessionStorage.removeItem('apexscale_token');
    localStorage.removeItem('apexscale_token');
    setUser(null);
    setSessionExpiredNotice(false);
  };

  const adminLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    sessionStorage.removeItem('ld_admin_token');
    localStorage.removeItem('ld_admin_token');
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        loading,
        adminLoading,
        sessionExpiredNotice,
        clearSessionExpiredNotice,
        login,
        adminLogin,
        logout,
        adminLogout,
        refreshUser,
        refreshAdmin,
      }}
    >
      {/* Session Expired Graceful Modal/Notice */}
      {sessionExpiredNotice && !user && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-[#191719] text-white p-4 rounded-2xl shadow-2xl border border-violet-500/40 flex items-center justify-between gap-3 font-sans">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-400">⚡ Session Expired</p>
              <p className="text-[11px] text-neutral-300">Your session has expired. Please sign in to resume.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                className="px-3 py-1.5 rounded-lg bg-[#7136E8] hover:bg-[#5b22d6] text-white text-xs font-semibold transition-colors"
              >
                Sign In
              </a>
              <button
                type="button"
                onClick={clearSessionExpiredNotice}
                className="text-neutral-400 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
