/**
 * useAuth Hook
 * Custom hook to access authentication context.
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook to access auth state and actions
 * @returns {Object} - { user, token, isAuthenticated, loading, login, logout, register }
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
