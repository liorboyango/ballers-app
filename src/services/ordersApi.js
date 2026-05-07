/**
 * Orders API Service
 * Handles all order-related API calls. All endpoints require authentication.
 */
import apiClient from './api';

/**
 * Create a Stripe PaymentIntent for the current cart.
 * The backend fetches the cart server-side and calculates the total,
 * preventing client-side price tampering.
 *
 * @returns {Promise<{
 *   clientSecret: string,
 *   paymentIntentId: string,
 *   amount: number,
 *   currency: string,
 *   orderSummary: {
 *     items: Array,
 *     subtotal: number,
 *     shippingCost: number,
 *     total: number,
 *     itemCount: number
 *   }
 * }>}
 * @throws {Error} 400 if cart is empty or items out of stock
 * @throws {Error} 401 if unauthenticated
 * @throws {Error} 502 if Stripe is unavailable
 */
export const createPaymentIntent = async () => {
  // No request body needed — cart is fetched server-side from the authenticated user's session
  const response = await apiClient.post('/orders/create-payment-intent');
  // Backend returns: { status: 'success', data: { clientSecret, paymentIntentId, amount, currency, orderSummary } }
  const payload = response.data?.data || response.data;
  return {
    clientSecret: payload.clientSecret || payload.client_secret,
    paymentIntentId: payload.paymentIntentId || payload.payment_intent_id,
    amount: payload.amount,
    currency: payload.currency || 'usd',
    orderSummary: payload.orderSummary || null,
  };
};

/**
 * Create a new order after successful Stripe payment.
 * Called after stripe.confirmCardPayment succeeds.
 *
 * @param {Object} orderData - Order data
 * @param {string} orderData.paymentIntentId - Stripe PaymentIntent ID
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
 * @param {string} orderData.paymentInfo.method - Payment method (card)
 * @param {string} orderData.paymentInfo.paymentIntentId - Stripe PaymentIntent ID
 * @param {string} orderData.paymentInfo.status - Payment status
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
