import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

/**
 * AuthContext
 * Manages user authentication state globally.
 * Persists JWT token in localStorage.
 */
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ballers_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verify token and load user on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('ballers_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
        setToken(storedToken);
      } catch (err) {
        // Token invalid or expired
        localStorage.removeItem('ballers_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   */
  const login = useCallback(async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('ballers_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new user
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  const register = useCallback(async (name, email, password) => {
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.register({ name, email, password });
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('ballers_token', newToken);
      setToken(newToken);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    localStorage.removeItem('ballers_token');
    setToken(null);
    setUser(null);
    setError('');
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
