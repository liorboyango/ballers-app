/**
 * CartContext
 * Provides cart state and actions throughout the app.
 * Syncs with backend cart API when user is authenticated.
 * Falls back to localStorage for guest users.
 */
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../services/cartApi';
import { AuthContext } from './AuthContext';

export const CartContext = createContext(null);

/**
 * CartProvider component
 */
export const CartProvider = ({ children }) => {
  const { isAuthenticated, token } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cartId, setCartId] = useState(null);

  /**
   * Update totals from items array
   */
  const updateTotals = useCallback((cartItems) => {
    const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const price = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    setTotalItems(itemCount);
    setTotalPrice(price);
  }, []);

  /**
   * Sync cart from backend when authenticated
   */
  const syncCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCart();
      const cartData = result.data;
      setCartId(cartData._id);
      setItems(cartData.items || []);
      setTotalItems(cartData.totalItems || 0);
      setTotalPrice(cartData.totalPrice || 0);
    } catch (err) {
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Sync cart when auth state changes
   */
  useEffect(() => {
    if (isAuthenticated) {
      syncCart();
    } else {
      // Load guest cart from localStorage
      try {
        const guestCart = JSON.parse(localStorage.getItem('ballers_guest_cart') || '[]');
        setItems(guestCart);
        updateTotals(guestCart);
      } catch {
        setItems([]);
        setTotalItems(0);
        setTotalPrice(0);
      }
    }
  }, [isAuthenticated, token, syncCart, updateTotals]);

  /**
   * Add item to cart
   * @param {Object} item - { productId, quantity, customization: { size, number, name } }
   */
  const addItem = useCallback(async (item) => {
    setError(null);
    if (isAuthenticated) {
      setLoading(true);
      try {
        const result = await addToCart(item);
        const cartData = result.data;
        setCartId(cartData._id);
        setItems(cartData.items || []);
        setTotalItems(cartData.totalItems || 0);
        setTotalPrice(cartData.totalPrice || 0);
        return result;
      } catch (err) {
        setError(err.message || 'Failed to add item to cart');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest cart - store in localStorage
      const guestItem = {
        _id: `guest_${Date.now()}`,
        product: item.product || { _id: item.productId },
        quantity: item.quantity || 1,
        price: item.price || 0,
        customization: item.customization || {},
      };
      const newItems = [...items, guestItem];
      setItems(newItems);
      updateTotals(newItems);
      localStorage.setItem('ballers_guest_cart', JSON.stringify(newItems));
    }
  }, [isAuthenticated, items, updateTotals]);

  /**
   * Update cart item quantity or customization
   * @param {string} itemId - Cart item ID
   * @param {Object} updates - { quantity?, customization? }
   */
  const updateItem = useCallback(async (itemId, updates) => {
    setError(null);
    if (isAuthenticated) {
      setLoading(true);
      try {
        const result = await updateCartItem({ itemId, ...updates });
        const cartData = result.data;
        setItems(cartData.items || []);
        setTotalItems(cartData.totalItems || 0);
        setTotalPrice(cartData.totalPrice || 0);
        return result;
      } catch (err) {
        setError(err.message || 'Failed to update cart item');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      const newItems = items.map((item) =>
        item._id === itemId ? { ...item, ...updates } : item
      );
      setItems(newItems);
      updateTotals(newItems);
      localStorage.setItem('ballers_guest_cart', JSON.stringify(newItems));
    }
  }, [isAuthenticated, items, updateTotals]);

  /**
   * Remove item from cart
   * @param {string} itemId - Cart item ID
   */
  const removeItem = useCallback(async (itemId) => {
    setError(null);
    if (isAuthenticated) {
      setLoading(true);
      try {
        const result = await removeFromCart(itemId);
        const cartData = result.data;
        setItems(cartData.items || []);
        setTotalItems(cartData.totalItems || 0);
        setTotalPrice(cartData.totalPrice || 0);
        return result;
      } catch (err) {
        setError(err.message || 'Failed to remove item from cart');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      const newItems = items.filter((item) => item._id !== itemId);
      setItems(newItems);
      updateTotals(newItems);
      localStorage.setItem('ballers_guest_cart', JSON.stringify(newItems));
    }
  }, [isAuthenticated, items, updateTotals]);

  /**
   * Clear cart (used after successful order)
   */
  const clearCart = useCallback(() => {
    setItems([]);
    setTotalItems(0);
    setTotalPrice(0);
    setCartId(null);
    localStorage.removeItem('ballers_guest_cart');
  }, []);

  const value = {
    items,
    totalItems,
    totalPrice,
    cartId,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    syncCart,
    clearError: () => setError(null),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
