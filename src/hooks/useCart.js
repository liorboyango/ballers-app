import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

/**
 * useCart hook
 * Provides access to cart state and actions from CartContext.
 * Must be used within a CartProvider.
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default useCart;
