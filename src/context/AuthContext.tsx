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
    return localStorage.getItem('apexscale_token') || '';
  };

  const getStoredAdminToken = () => {
    return localStorage.getItem('ld_admin_token') || '';
  };

  const refreshUser = async () => {
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
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
      const headers: Record<string, string> = {};
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
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
    refreshUser();
    refreshAdmin();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('apexscale_token', token);
    setUser(userData);
  };

  const adminLogin = (token: string, userData: User) => {
    localStorage.setItem('ld_admin_token', token);
    setAdminUser(userData);
    window.location.href = '/admin';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem('apexscale_token');
    setUser(null);
  };

  const adminLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem('ld_admin_token');
    setAdminUser(null);
    window.location.href = '/admin/login';
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
