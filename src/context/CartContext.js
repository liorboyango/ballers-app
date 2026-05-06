/**
 * CartContext - Shopping Cart State Management
 * Manages cart items, quantities, customizations, and totals.
 * Persists cart to localStorage for session continuity.
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  UPDATE_CUSTOMIZATION: 'UPDATE_CUSTOMIZATION',
  CLEAR_CART: 'CLEAR_CART',
  RESTORE_CART: 'RESTORE_CART',
  TOGGLE_DRAWER: 'TOGGLE_DRAWER',
};

// Initial cart state
const initialState = {
  items: [],
  isDrawerOpen: false,
};

/**
 * Calculate cart totals from items array.
 */
function calculateTotals(items) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { itemCount, subtotal };
}

/**
 * Generate a unique cart item key based on product + customization.
 */
function generateCartKey(productId, size, customization) {
  const custStr = customization
    ? `${customization.playerName || ''}-${customization.playerNumber || ''}`
    : '';
  return `${productId}-${size}-${custStr}`;
}

/**
 * Cart reducer - handles all cart state transitions.
 */
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product, size, quantity = 1, customization } = action.payload;
      const cartKey = generateCartKey(product._id, size, customization);
      const existingIndex = state.items.findIndex((item) => item.cartKey === cartKey);

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = state.items.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return { ...state, items: updatedItems };
      }

      // Add new item
      const newItem = {
        cartKey,
        productId: product._id,
        name: product.name,
        teamName: product.teamName,
        price: product.price,
        image: product.images?.[0] || '',
        size,
        quantity,
        customization: customization || null,
      };

      return { ...state, items: [...state.items, newItem] };
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      return {
        ...state,
        items: state.items.filter((item) => item.cartKey !== action.payload),
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { cartKey, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.cartKey !== cartKey),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity } : item
        ),
      };
    }

    case CART_ACTIONS.UPDATE_CUSTOMIZATION: {
      const { cartKey, customization } = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.cartKey === cartKey ? { ...item, customization } : item
        ),
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return { ...state, items: [] };

    case CART_ACTIONS.RESTORE_CART:
      return { ...state, items: action.payload };

    case CART_ACTIONS.TOGGLE_DRAWER:
      return {
        ...state,
        isDrawerOpen: action.payload !== undefined ? action.payload : !state.isDrawerOpen,
      };

    default:
      return state;
  }
}

// Create context
export const CartContext = createContext(null);

/**
 * CartProvider - wraps the app and provides cart state.
 */
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Restore cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ballers_cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: CART_ACTIONS.RESTORE_CART, payload: items });
        }
      } catch (err) {
        localStorage.removeItem('ballers_cart');
      }
    }
  }, []);

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('ballers_cart', JSON.stringify(state.items));
  }, [state.items]);

  // Computed totals
  const { itemCount, subtotal } = calculateTotals(state.items);

  /**
   * Add a product to the cart.
   */
  const addToCart = useCallback((product, size, quantity = 1, customization = null) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product, size, quantity, customization },
    });
  }, []);

  /**
   * Remove an item from the cart by cartKey.
   */
  const removeFromCart = useCallback((cartKey) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartKey });
  }, []);

  /**
   * Update the quantity of a cart item.
   */
  const updateQuantity = useCallback((cartKey, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { cartKey, quantity } });
  }, []);

  /**
   * Update customization (name/number) for a cart item.
   */
  const updateCustomization = useCallback((cartKey, customization) => {
    dispatch({ type: CART_ACTIONS.UPDATE_CUSTOMIZATION, payload: { cartKey, customization } });
  }, []);

  /**
   * Clear all items from the cart.
   */
  const clearCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  }, []);

  /**
   * Toggle the cart drawer open/closed.
   */
  const toggleDrawer = useCallback((open) => {
    dispatch({ type: CART_ACTIONS.TOGGLE_DRAWER, payload: open });
  }, []);

  const value = {
    items: state.items,
    isDrawerOpen: state.isDrawerOpen,
    itemCount,
    subtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCustomization,
    clearCart,
    toggleDrawer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * useCart hook - consume cart context.
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
