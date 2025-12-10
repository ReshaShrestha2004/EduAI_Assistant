import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = authService.getUser();

    if (token && storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);
  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.data);
    }
    return result;
  };
  const register = async (email, password, fullName) => {
    return await authService.register(email, password, fullName);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};