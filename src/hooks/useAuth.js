import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth hook
 * Provides access to auth state and actions from AuthContext.
 * Must be used within an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
