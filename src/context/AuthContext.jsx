import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin]               = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]           = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token  = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('admin');
    if (token && stored) {
      try {
        setAdmin(JSON.parse(stored));
        setIsAuthenticated(true);
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, admin: adminData } = data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('admin', JSON.stringify(adminData));

    setAdmin(adminData);
    setIsAuthenticated(true);
    return adminData;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Silently fail — clear storage regardless
    }
    localStorage.clear();
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Persist an updated admin object in both React state and localStorage.
   * Call this after any operation that changes the admin record
   * (e.g. avatar upload) so every component that reads `admin` updates instantly.
   */
  const updateAdmin = useCallback((partial) => {
    setAdmin((prev) => {
      const merged = { ...prev, ...partial };
      localStorage.setItem('admin', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = { admin, isAuthenticated, loading, login, logout, updateAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
