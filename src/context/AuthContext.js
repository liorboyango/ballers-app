/**
 * AuthContext — manages authentication state across the application.
 *
 * Provides:
 *  - user: current authenticated user object or null
 *  - token: JWT token string or null
 *  - isAuthenticated: boolean derived from token presence
 *  - isLoading: true while verifying stored token on mount
 *  - login(email, password): authenticates user, stores token
 *  - register(name, email, password): creates account, stores token
 *  - logout(): clears auth state
 *  - updateUser(userData): updates user data in state and storage
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api from '../services/api';

/** Storage keys for persistence */
const TOKEN_KEY = 'ballers_token';
const USER_KEY = 'ballers_user';

/** Context object */
export const AuthContext = createContext(null);

/**
 * AuthProvider component — wraps the app and provides auth state.
 * @param {React.ReactNode} children
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Persist auth data to localStorage and update state.
   * @param {string} newToken - JWT token
   * @param {object} newUser - user object
   */
  const persistAuth = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * Clear auth data from localStorage and state.
   */
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * On mount: restore auth state from localStorage and verify token
   * with the backend to ensure it's still valid.
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid with backend
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setToken(storedToken);
            setUser(response.data.user);
          } else {
            clearAuth();
          }
        } catch (error) {
          // Token invalid or expired
          clearAuth();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [clearAuth]);

  /**
   * Login with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = useCallback(
    async (email, password) => {
      try {
        const response = await api.post('/auth/login', { email, password });
        const { token: newToken, user: newUser } = response.data;
        persistAuth(newToken, newUser);
        return { success: true };
      } catch (error) {
        const message =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Login failed. Please try again.';
        return { success: false, error: message };
      }
    },
    [persistAuth]
  );

  /**
   * Register a new account.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const register = useCallback(
    async (name, email, password) => {
      try {
        const response = await api.post('/auth/register', {
          name,
          email,
          password,
        });
        const { token: newToken, user: newUser } = response.data;
        persistAuth(newToken, newUser);
        return { success: true };
      } catch (error) {
        const message =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Registration failed. Please try again.';
        // Handle field-level validation errors
        const errors = error.response?.data?.errors;
        return { success: false, error: message, errors };
      }
    },
    [persistAuth]
  );

  /**
   * Logout the current user.
   */
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  /**
   * Update user data (e.g., after profile edit).
   * @param {object} userData - partial or full user object
   */
  const updateUser = useCallback(
    (userData) => {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    [user]
  );

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook — access auth context from any component.
 * Must be used within an AuthProvider.
 * @returns {object} auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
