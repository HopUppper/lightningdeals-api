import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  adminUser: User | null;
  loading: boolean;
  adminLoading: boolean;
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

  const getStoredToken = () => {
    return sessionStorage.getItem('apexscale_token') || '';
  };

  const getStoredAdminToken = () => {
    return sessionStorage.getItem('ld_admin_token') || '';
  };

  const refreshUser = async () => {
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
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAdmin = async () => {
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
      } else {
        setAdminUser(null);
      }
    } catch (e) {
      setAdminUser(null);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    // Clear legacy persistent localStorage tokens to enforce strict session login
    localStorage.removeItem('apexscale_token');
    localStorage.removeItem('ld_admin_token');
    refreshUser();
    refreshAdmin();
  }, []);

  const login = (token: string, userData: User) => {
    sessionStorage.setItem('apexscale_token', token);
    localStorage.removeItem('apexscale_token');
    setUser(userData);
  };

  const adminLogin = (token: string, userData: User) => {
    sessionStorage.setItem('ld_admin_token', token);
    sessionStorage.setItem('apexscale_token', token);
    localStorage.removeItem('ld_admin_token');
    localStorage.removeItem('apexscale_token');
    setAdminUser(userData);
    setUser(userData);
    window.location.href = '/admin';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    sessionStorage.removeItem('apexscale_token');
    sessionStorage.removeItem('ld_admin_token');
    localStorage.removeItem('apexscale_token');
    localStorage.removeItem('ld_admin_token');
    setUser(null);
  };

  const adminLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    sessionStorage.removeItem('ld_admin_token');
    sessionStorage.removeItem('apexscale_token');
    localStorage.removeItem('ld_admin_token');
    localStorage.removeItem('apexscale_token');
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        loading,
        adminLoading,
        login,
        adminLogin,
        logout,
        adminLogout,
        refreshUser,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
