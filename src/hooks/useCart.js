/**
 * useCart Hook
 * Custom hook to access cart context.
 */
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

/**
 * Hook to access cart state and actions
 * @returns {Object} - { items, totalItems, totalPrice, addItem, removeItem, updateItem, clearCart, loading, error }
 */
const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default useCart;
