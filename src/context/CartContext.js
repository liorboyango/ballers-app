import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

/**
 * CartContext
 * Manages shopping cart state globally.
 * Syncs with backend API when user is authenticated.
 * Falls back to localStorage for guest users.
 */
export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch cart from API (authenticated users)
  const fetchCart = useCallback(async () => {
    if (!token) {
      // Load from localStorage for guests
      const stored = localStorage.getItem('ballers_guest_cart');
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch {
          setCart({ items: [], totalItems: 0, totalPrice: 0 });
        }
      } else {
        setCart({ items: [], totalItems: 0, totalPrice: 0 });
      }
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await cartAPI.getCart();
      setCart(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load cart');
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch cart on mount and when auth changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /**
   * Add item to cart
   * @param {Object} params - { productId, quantity, customization: { size, number, name } }
   */
  const addToCart = useCallback(
    async ({ productId, quantity = 1, customization = {} }) => {
      if (!token) {
        // Guest cart: store locally
        setCart((prev) => {
          const items = prev?.items || [];
          const existingIdx = items.findIndex(
            (i) =>
              i.productId === productId &&
              i.customization?.size === customization.size &&
              i.customization?.number === customization.number &&
              i.customization?.name === customization.name
          );

          let newItems;
          if (existingIdx >= 0) {
            newItems = items.map((item, idx) =>
              idx === existingIdx
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [
              ...items,
              {
                _id: `guest_${Date.now()}`,
                productId,
                quantity,
                customization,
                price: 0,
              },
            ];
          }

          const newCart = {
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          };
          localStorage.setItem('ballers_guest_cart', JSON.stringify(newCart));
          return newCart;
        });
        return;
      }

      setLoading(true);
      try {
        const response = await cartAPI.addToCart({ productId, quantity, customization });
        setCart(response.data.data);
      } catch (err) {
        const message = err.response?.data?.error || 'Failed to add to cart';
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  /**
   * Update cart item quantity or customization
   * @param {Object} params - { itemId, quantity?, customization? }
   */
  const updateCartItem = useCallback(
    async ({ itemId, quantity, customization }) => {
      if (!token) {
        setCart((prev) => {
          const newItems = (prev?.items || []).map((item) =>
            item._id === itemId
              ? {
                  ...item,
                  ...(quantity !== undefined ? { quantity } : {}),
                  ...(customization ? { customization } : {}),
                }
              : item
          );
          const newCart = {
            ...prev,
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          };
          localStorage.setItem('ballers_guest_cart', JSON.stringify(newCart));
          return newCart;
        });
        return;
      }

      setLoading(true);
      try {
        const response = await cartAPI.updateCart({ itemId, quantity, customization });
        setCart(response.data.data);
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to update cart');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  /**
   * Remove item from cart
   * @param {string} itemId - Cart item ID
   */
  const removeFromCart = useCallback(
    async (itemId) => {
      if (!token) {
        setCart((prev) => {
          const newItems = (prev?.items || []).filter((i) => i._id !== itemId);
          const newCart = {
            ...prev,
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          };
          localStorage.setItem('ballers_guest_cart', JSON.stringify(newCart));
          return newCart;
        });
        return;
      }

      setLoading(true);
      try {
        const response = await cartAPI.removeFromCart(itemId);
        setCart(response.data.data);
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to remove item');
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  /**
   * Clear the entire cart
   */
  const clearCart = useCallback(() => {
    setCart({ items: [], totalItems: 0, totalPrice: 0 });
    localStorage.removeItem('ballers_guest_cart');
  }, []);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    totalItems: cart?.totalItems || 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
