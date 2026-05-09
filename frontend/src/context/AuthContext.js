import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('hoodie_token');
    const storedUser = localStorage.getItem('hoodie_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('hoodie_user');
      }
    }

    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('hoodie_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('hoodie_token');
          localStorage.removeItem('hoodie_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('hoodie_token', res.data.token);
    localStorage.setItem('hoodie_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('hoodie_token', res.data.token);
    localStorage.setItem('hoodie_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('hoodie_token');
    localStorage.removeItem('hoodie_user');
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('hoodie_user', JSON.stringify(nextUser));
  };

  const isAdmin = user?.role === 'admin';
  const isOwnerAdmin = isAdmin && (user?.adminType === 'owner' || !user?.adminType);
  const hasPermission = (permission) =>
    isOwnerAdmin || user?.adminPermissions?.includes(permission);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isOwnerAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
