/**
 * useCart Hook
 * Convenience hook to access cart context.
 */
import { useCart as useCartContext } from '../context/CartContext';

/**
 * Hook to access cart state and actions.
 * @returns {Object} Cart state and methods
 */
export function useCart() {
  return useCartContext();
}

export default useCart;
