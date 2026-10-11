import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

// Helper to check if a JWT token exists, is well-formed, and not expired
const getValidAdminToken = () => {
  try {
    const savedToken = localStorage.getItem('adminToken');
    if (!savedToken) return null;
    const parts = savedToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      return null;
    }
    return savedToken;
  } catch {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    return null;
  }
};

const getValidAdminUser = () => {
  try {
    const validToken = getValidAdminToken();
    if (!validToken) return null;
    const saved = localStorage.getItem('adminUser');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getValidAdminToken());
  const [user, setUser] = useState(() => getValidAdminUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Synchronize and re-validate token
    const validToken = getValidAdminToken();
    if (!validToken) {
      setToken(null);
      setUser(null);
    } else {
      setToken(validToken);
      setUser(getValidAdminUser());
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      
      if (data.role !== 'admin') {
        throw new Error('Access denied: You must be an administrator to access this portal.');
      }

      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify({ userId: data.userId, role: data.role, email }));
      
      setToken(data.accessToken);
      setUser({ userId: data.userId, role: data.role, email });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token && user?.role === 'admin', loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
