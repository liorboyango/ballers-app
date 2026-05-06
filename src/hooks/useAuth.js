/**
 * useAuth Hook
 * Convenience hook to access authentication context.
 */
import { useAuth as useAuthContext } from '../context/AuthContext';

/**
 * Hook to access auth state and actions.
 * @returns {Object} Auth state and methods
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
