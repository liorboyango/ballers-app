/**
 * AuthContext
 * Provides authentication state and actions throughout the app.
 * Handles JWT token storage, user session, and auth API calls.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../services/authApi';

export const AuthContext = createContext(null);

/**
 * Hook to access auth state and actions.
 * Must be used within an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider component
 * Wraps the app and provides auth state/actions via context.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ballers_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Persist token and user to localStorage
   */
  const persistAuth = useCallback((newToken, newUser) => {
    localStorage.setItem('ballers_token', newToken);
    localStorage.setItem('ballers_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * Clear auth state and localStorage
   */
  const clearAuth = useCallback(() => {
    localStorage.removeItem('ballers_token');
    localStorage.removeItem('ballers_user');
    setToken(null);
    setUser(null);
  }, []);

  /**
   * On mount: verify existing token by fetching current user
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ballers_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const result = await getMe();
        setUser(result.user);
        setToken(storedToken);
      } catch {
        // Token invalid or expired
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [clearAuth]);

  /**
   * Listen for auth:logout events dispatched by the API interceptor
   */
  useEffect(() => {
    const handleLogout = () => clearAuth();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [clearAuth]);

  /**
   * Login action
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await loginApi({ email, password });
      persistAuth(result.token, result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  }, [persistAuth]);

  /**
   * Register action
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const result = await registerApi({ name, email, password });
      persistAuth(result.token, result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  }, [persistAuth]);

  /**
   * Logout action
   */
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    error,
    login,
    logout,
    register,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
