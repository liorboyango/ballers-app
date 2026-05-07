/**
 * Orders API Service
 *
 * Handles all order-related API calls to the backend.
 * All endpoints require the user to be authenticated (JWT in Authorization header).
 *
 * Rapyd integration notes:
 *   - createPaymentIntent() returns { clientToken, paymentId, ... }
 *     where clientToken is passed to rapyd.confirmPayment().
 *   - createOrder() accepts rapydPaymentId (not paymentIntentId).
 *   - Field normalisation handles both camelCase and snake_case variants
 *     that different backend versions might return.
 */
import apiClient from './api';

/**
 * Create a Rapyd Payment for the current authenticated user's cart.
 *
 * The backend:
 *   1. Fetches the cart server-side (prevents client-side price tampering)
 *   2. Validates stock availability
 *   3. Calls Rapyd API to create a Payment object
 *   4. Returns the clientToken and paymentId needed to confirm the payment
 *
 * @returns {Promise<{
 *   clientToken: string,   - Rapyd client token for confirmPayment()
 *   paymentId:   string,   - Rapyd Payment ID (stored on order)
 *   amount:      number,   - Total amount in smallest currency unit (cents)
 *   currency:    string,   - ISO 4217 currency code (e.g. 'usd')
 *   orderSummary: {
 *     items:        Array,
 *     subtotal:     number,
 *     shippingCost: number,
 *     total:        number,
 *     itemCount:    number
 *   } | null
 * }>}
 * @throws {Error} 400 – cart is empty or items are out of stock
 * @throws {Error} 401 – user is not authenticated
 * @throws {Error} 502 – Rapyd API is unavailable
 */
export const createPaymentIntent = async () => {
  // No request body — cart is fetched server-side from the authenticated session.
  const response = await apiClient.post('/orders/create-payment-intent');

  // Backend response envelope: { status: 'success', data: { ... } }
  // Flatten either shape so callers always get a plain object.
  const payload = response.data?.data || response.data;

  return {
    // Handle both camelCase (preferred) and snake_case (legacy) field names
    clientToken: payload.clientToken || payload.client_token || '',
    paymentId:   payload.paymentId   || payload.payment_id   || '',
    amount:      payload.amount      || 0,
    currency:    (payload.currency   || 'usd').toLowerCase(),
    orderSummary: payload.orderSummary || payload.order_summary || null,
  };
};

/**
 * Create a new order after a successful Rapyd payment confirmation.
 *
 * Called after rapyd.confirmPayment() resolves with status SUCCEEDED / ACTIVATED.
 * The backend re-verifies the Rapyd Payment independently before persisting the order:
 *   - Status must be SUCCEEDED or ACTIVATED
 *   - Amount must match the server-side cart total
 *   - userId in metadata must match the authenticated user
 *
 * @param {Object} orderData
 * @param {string} orderData.rapydPaymentId          - Rapyd Payment ID from confirmPayment()
 * @param {Object} orderData.shippingAddress          - Shipping address
 * @param {string} orderData.shippingAddress.firstName
 * @param {string} orderData.shippingAddress.lastName
 * @param {string} orderData.shippingAddress.email
 * @param {string} orderData.shippingAddress.address  - Street address
 * @param {string} orderData.shippingAddress.city
 * @param {string} orderData.shippingAddress.zip
 * @param {string} orderData.shippingAddress.country  - ISO 3166-1 alpha-2
 * @param {string} [orderData.shippingAddress.phone]
 *
 * @returns {Promise<{ message: string, order: Order }>}
 * @throws {Error} 400 – payment not verified or amount mismatch
 * @throws {Error} 401 – user is not authenticated
 * @throws {Error} 404 – rapydPaymentId not found in Rapyd
 * @throws {Error} 409 – order already exists for this paymentId (duplicate)
 */
export const createOrder = async (orderData) => {
  const response = await apiClient.post('/orders/create', orderData);
  return response.data;
};

/**
 * Get the current user's order history.
 *
 * @param {Object} [params={}]           - Query parameters
 * @param {number} [params.page=1]       - Page number (1-indexed)
 * @param {number} [params.limit=10]     - Items per page
 * @param {string} [params.status]       - Filter by order status
 * @returns {Promise<{ orders: Order[], pagination: Pagination }>}
 */
export const getOrders = async (params = {}) => {
  const response = await apiClient.get('/orders', { params });
  return response.data;
};

/**
 * Get a single order by ID.
 *
 * @param {string} id - Order document ID
 * @returns {Promise<{ success: boolean, data: Order }>}
 */
export const getOrderById = async (id) => {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data;
};
