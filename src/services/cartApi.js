/**
 * Cart API Service
 * Handles all cart-related API calls. All endpoints require authentication.
 */
import apiClient from './api';

/**
 * Get current user's cart
 * @returns {Promise<{success: boolean, data: Cart}>}
 */
export const getCart = async () => {
  const response = await apiClient.get('/cart');
  return response.data;
};

/**
 * Add item to cart
 * @param {Object} item - Cart item data
 * @param {string} item.productId - Product ID
 * @param {number} item.quantity - Quantity (1-99)
 * @param {Object} item.customization - Customization options
 * @param {string} item.customization.size - Size (XS|S|M|L|XL|XXL)
 * @param {number} [item.customization.number] - Jersey number (1-99)
 * @param {string} [item.customization.name] - Jersey name
 * @returns {Promise<{success: boolean, data: Cart}>}
 */
export const addToCart = async (item) => {
  const response = await apiClient.post('/cart/add', item);
  return response.data;
};

/**
 * Update cart item
 * @param {Object} update - Update data
 * @param {string} update.itemId - Cart item ID
 * @param {number} [update.quantity] - New quantity
 * @param {Object} [update.customization] - New customization
 * @returns {Promise<{success: boolean, data: Cart}>}
 */
export const updateCartItem = async (update) => {
  const response = await apiClient.put('/cart/update', update);
  return response.data;
};

/**
 * Remove item from cart
 * @param {string} itemId - Cart item ID
 * @returns {Promise<{success: boolean, data: Cart}>}
 */
export const removeFromCart = async (itemId) => {
  const response = await apiClient.delete('/cart/item', { data: { itemId } });
  return response.data;
};
