/**
 * CartContext — manages shopping cart state across the application.
 *
 * Behavior:
 *  - When user is authenticated: syncs cart with backend API
 *  - When user is a guest: stores cart in localStorage
 *  - On login: merges guest cart with backend cart
 *
 * Provides:
 *  - items: array of cart item objects
 *  - totalItems: total quantity count
 *  - totalPrice: total price as number
 *  - isLoading: true while fetching/updating cart
 *  - isCartOpen: controls cart drawer visibility
 *  - addToCart(productId, quantity, customization): add item
 *  - removeFromCart(itemId): remove item
 *  - updateCartItem(itemId, updates): update quantity or customization
 *  - clearCart(): empty the cart
 *  - openCart(): show cart drawer
 *  - closeCart(): hide cart drawer
 *  - toggleCart(): toggle cart drawer
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

/** localStorage key for guest cart */
const GUEST_CART_KEY = 'ballers_guest_cart';

/** Context object */
export const CartContext = createContext(null);

/**
 * CartProvider component — wraps the app and provides cart state.
 * @param {React.ReactNode} children
 */
export const CartProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [error, setError] = useState(null);

  /** Track previous auth state to detect login/logout transitions */
  const prevAuthRef = useRef(isAuthenticated);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Compute totals from items array.
   * @param {Array} cartItems
   */
  const computeTotals = useCallback((cartItems) => {
    const qty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const price = cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
    setTotalItems(qty);
    setTotalPrice(price);
  }, []);

  /**
   * Load guest cart from localStorage.
   * @returns {Array} guest cart items
   */
  const loadGuestCart = useCallback(() => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Save guest cart to localStorage.
   * @param {Array} cartItems
   */
  const saveGuestCart = useCallback((cartItems) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
  }, []);

  /**
   * Clear guest cart from localStorage.
   */
  const clearGuestCart = useCallback(() => {
    localStorage.removeItem(GUEST_CART_KEY);
  }, []);

  // ─── Backend Cart Operations ─────────────────────────────────────────────────

  /**
   * Fetch cart from backend API.
   */
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/cart');
      if (response.data.success) {
        const cartData = response.data.data;
        const cartItems = cartData.items || [];
        setItems(cartItems);
        setTotalItems(cartData.totalItems || 0);
        setTotalPrice(cartData.totalPrice || 0);
      }
    } catch (err) {
      setError('Failed to load cart. Please try again.');
      console.error('Cart fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Add item to backend cart.
   * @param {string} productId
   * @param {number} quantity
   * @param {object} customization - { size, number, name }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const addToCartAuthenticated = useCallback(
    async (productId, quantity, customization) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post('/cart/add', {
          productId,
          quantity,
          customization,
        });
        if (response.data.success) {
          const cartData = response.data.data;
          const cartItems = cartData.items || [];
          setItems(cartItems);
          setTotalItems(cartData.totalItems || 0);
          setTotalPrice(cartData.totalPrice || 0);
          return { success: true };
        }
        return { success: false, error: 'Failed to add item to cart.' };
      } catch (err) {
        const message =
          err.response?.data?.error || 'Failed to add item to cart.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update cart item on backend.
   * @param {string} itemId
   * @param {object} updates - { quantity?, customization? }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateCartItemAuthenticated = useCallback(async (itemId, updates) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put('/cart/update', { itemId, ...updates });
      if (response.data.success) {
        const cartData = response.data.data;
        const cartItems = cartData.items || [];
        setItems(cartItems);
        setTotalItems(cartData.totalItems || 0);
        setTotalPrice(cartData.totalPrice || 0);
        return { success: true };
      }
      return { success: false, error: 'Failed to update cart item.' };
    } catch (err) {
      const message =
        err.response?.data?.error || 'Failed to update cart item.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Remove item from backend cart.
   * @param {string} itemId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const removeFromCartAuthenticated = useCallback(async (itemId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.delete('/cart/item', { data: { itemId } });
      if (response.data.success) {
        const cartData = response.data.data;
        const cartItems = cartData.items || [];
        setItems(cartItems);
        setTotalItems(cartData.totalItems || 0);
        setTotalPrice(cartData.totalPrice || 0);
        return { success: true };
      }
      return { success: false, error: 'Failed to remove item from cart.' };
    } catch (err) {
      const message =
        err.response?.data?.error || 'Failed to remove item from cart.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Guest Cart Operations ───────────────────────────────────────────────────

  /**
   * Add item to guest cart (localStorage).
   * @param {object} product - product object with _id, name, price, images
   * @param {number} quantity
   * @param {object} customization - { size, number, name }
   * @returns {{ success: boolean }}
   */
  const addToCartGuest = useCallback(
    (product, quantity, customization) => {
      const guestCart = loadGuestCart();
      // Check if same product+customization already exists
      const existingIndex = guestCart.findIndex(
        (item) =>
          item.productId === (product._id || product.id) &&
          item.customization?.size === customization?.size &&
          item.customization?.number === customization?.number &&
          item.customization?.name === customization?.name
      );

      let updatedCart;
      if (existingIndex >= 0) {
        updatedCart = guestCart.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem = {
          _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product._id || product.id,
          product: {
            _id: product._id || product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            team: product.team,
            slug: product.slug,
          },
          quantity,
          price: product.price,
          customization: customization || {},
        };
        updatedCart = [...guestCart, newItem];
      }

      saveGuestCart(updatedCart);
      setItems(updatedCart);
      computeTotals(updatedCart);
      return { success: true };
    },
    [loadGuestCart, saveGuestCart, computeTotals]
  );

  /**
   * Update guest cart item.
   * @param {string} itemId
   * @param {object} updates - { quantity?, customization? }
   * @returns {{ success: boolean }}
   */
  const updateCartItemGuest = useCallback(
    (itemId, updates) => {
      const guestCart = loadGuestCart();
      const updatedCart = guestCart.map((item) =>
        item._id === itemId ? { ...item, ...updates } : item
      );
      saveGuestCart(updatedCart);
      setItems(updatedCart);
      computeTotals(updatedCart);
      return { success: true };
    },
    [loadGuestCart, saveGuestCart, computeTotals]
  );

  /**
   * Remove item from guest cart.
   * @param {string} itemId
   * @returns {{ success: boolean }}
   */
  const removeFromCartGuest = useCallback(
    (itemId) => {
      const guestCart = loadGuestCart();
      const updatedCart = guestCart.filter((item) => item._id !== itemId);
      saveGuestCart(updatedCart);
      setItems(updatedCart);
      computeTotals(updatedCart);
      return { success: true };
    },
    [loadGuestCart, saveGuestCart, computeTotals]
  );

  // ─── Merge Guest Cart on Login ───────────────────────────────────────────────

  /**
   * Merge guest cart items into the authenticated backend cart.
   * Called when user logs in with items in guest cart.
   */
  const mergeGuestCartWithBackend = useCallback(async () => {
    const guestCart = loadGuestCart();
    if (guestCart.length === 0) return;

    // Add each guest item to backend cart
    for (const item of guestCart) {
      try {
        await api.post('/cart/add', {
          productId: item.productId,
          quantity: item.quantity,
          customization: item.customization,
        });
      } catch (err) {
        console.error('Failed to merge guest cart item:', err);
      }
    }

    clearGuestCart();
    // Fetch updated cart from backend
    await fetchCart();
  }, [loadGuestCart, clearGuestCart, fetchCart]);

  // ─── Auth State Change Effects ───────────────────────────────────────────────

  /**
   * React to authentication state changes:
   * - On login: merge guest cart, then fetch backend cart
   * - On logout: load guest cart from localStorage
   */
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated) {
      // User just logged in
      mergeGuestCartWithBackend();
    } else if (!isAuthenticated && wasAuthenticated) {
      // User just logged out — load guest cart
      const guestCart = loadGuestCart();
      setItems(guestCart);
      computeTotals(guestCart);
    } else if (isAuthenticated) {
      // Already authenticated on mount — fetch cart
      fetchCart();
    } else {
      // Guest on mount — load from localStorage
      const guestCart = loadGuestCart();
      setItems(guestCart);
      computeTotals(guestCart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Add item to cart.
   * Routes to authenticated or guest implementation based on auth state.
   *
   * @param {string|object} productOrId - product object (guest) or productId string (auth)
   * @param {number} quantity
   * @param {object} customization - { size, number, name }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const addToCart = useCallback(
    async (productOrId, quantity = 1, customization = {}) => {
      if (isAuthenticated) {
        const productId =
          typeof productOrId === 'string'
            ? productOrId
            : productOrId._id || productOrId.id;
        return addToCartAuthenticated(productId, quantity, customization);
      } else {
        if (typeof productOrId === 'string') {
          console.warn(
            'addToCart: pass full product object for guest cart, not just ID'
          );
          return { success: false, error: 'Product data required for guest cart.' };
        }
        return addToCartGuest(productOrId, quantity, customization);
      }
    },
    [isAuthenticated, addToCartAuthenticated, addToCartGuest]
  );

  /**
   * Update a cart item's quantity or customization.
   * @param {string} itemId
   * @param {object} updates - { quantity?, customization? }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateCartItem = useCallback(
    async (itemId, updates) => {
      if (isAuthenticated) {
        return updateCartItemAuthenticated(itemId, updates);
      } else {
        return updateCartItemGuest(itemId, updates);
      }
    },
    [isAuthenticated, updateCartItemAuthenticated, updateCartItemGuest]
  );

  /**
   * Remove an item from the cart.
   * @param {string} itemId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const removeFromCart = useCallback(
    async (itemId) => {
      if (isAuthenticated) {
        return removeFromCartAuthenticated(itemId);
      } else {
        return removeFromCartGuest(itemId);
      }
    },
    [isAuthenticated, removeFromCartAuthenticated, removeFromCartGuest]
  );

  /**
   * Clear all items from the cart.
   */
  const clearCart = useCallback(() => {
    setItems([]);
    setTotalItems(0);
    setTotalPrice(0);
    if (!isAuthenticated) {
      clearGuestCart();
    }
  }, [isAuthenticated, clearGuestCart]);

  /** Open the cart drawer */
  const openCart = useCallback(() => setIsCartOpen(true), []);

  /** Close the cart drawer */
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  /** Toggle the cart drawer */
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const value = {
    items,
    totalItems,
    totalPrice,
    isLoading,
    isCartOpen,
    error,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * useCart hook — access cart context from any component.
 * Must be used within a CartProvider.
 * @returns {object} cart context value
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
