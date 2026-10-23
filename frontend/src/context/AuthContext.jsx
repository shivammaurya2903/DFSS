import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/auth.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const localUser = authService.getCurrentUser();
      if (localUser) {
        setUser(localUser);
        try {
          const freshUser = await authService.fetchMe();
          setUser(freshUser);
        } catch (err) {
          console.error("Failed to fetch fresh user data", err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.fetchMe();
      setUser(freshUser);
    } catch (err) {}
  };

  const updateUser = async (payload) => {
    const data = await authService.updateMe(payload);
    setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
