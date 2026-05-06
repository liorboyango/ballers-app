/**
 * Orders API Service
 * Handles all order-related API calls. All endpoints require authentication.
 */
import apiClient from './api';

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {Object} orderData.shippingAddress - Shipping address
 * @param {string} orderData.shippingAddress.firstName - First name
 * @param {string} orderData.shippingAddress.lastName - Last name
 * @param {string} orderData.shippingAddress.email - Email
 * @param {string} orderData.shippingAddress.address - Street address
 * @param {string} orderData.shippingAddress.city - City
 * @param {string} orderData.shippingAddress.zip - ZIP code
 * @param {string} orderData.shippingAddress.country - Country
 * @param {string} [orderData.shippingAddress.phone] - Phone number
 * @param {Object} orderData.paymentInfo - Payment information
 * @param {string} orderData.paymentInfo.method - Payment method (card|paypal)
 * @param {string} [orderData.paymentInfo.cardNumber] - Card number
 * @param {string} [orderData.paymentInfo.cardHolder] - Card holder name
 * @param {string} [orderData.paymentInfo.expiryMonth] - Expiry month
 * @param {string} [orderData.paymentInfo.expiryYear] - Expiry year
 * @returns {Promise<{message: string, order: Order}>}
 */
export const createOrder = async (orderData) => {
  const response = await apiClient.post('/orders/create', orderData);
  return response.data;
};

/**
 * Get user's orders
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @returns {Promise<{orders: Order[], pagination: Object}>}
 */
export const getOrders = async (params = {}) => {
  const response = await apiClient.get('/orders', { params });
  return response.data;
};

/**
 * Get a single order by ID
 * @param {string} id - Order ID
 * @returns {Promise<{success: boolean, data: Order}>}
 */
export const getOrderById = async (id) => {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data;
};
