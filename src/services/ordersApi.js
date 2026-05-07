/**
 * Orders API Service — Rapyd Hosted Checkout (redirect flow).
 *
 * The frontend never handles card data. The flow is:
 *   1. createCheckoutSession({ shippingAddress })
 *      Backend reads the cart, calls Rapyd /v1/checkout, persists a pending
 *      order keyed by checkoutId, and returns { checkoutId, redirectUrl }.
 *   2. window.location.assign(redirectUrl)
 *      User completes payment on Rapyd's hosted page.
 *   3. Rapyd redirects back to /checkout/complete?checkoutId=<id>.
 *      finalizeCheckout({ checkoutId }) verifies the payment with Rapyd
 *      server-side and returns the created/updated order.
 *
 * Backend contract (POST /api/orders/create-checkout-session):
 *   Request:  { shippingAddress, notes? }
 *   Response: { status: 'success', data: { checkoutId, redirectUrl } }
 *
 * Backend contract (POST /api/orders/finalize-checkout):
 *   Request:  { checkoutId }
 *   Response: { status: 'success', data: <Order> }
 */
import apiClient from './api';

function firstDefined(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/**
 * Create a Rapyd Hosted Checkout session for the authenticated user's cart.
 *
 * @param {Object} params
 * @param {Object} params.shippingAddress
 * @param {string} [params.notes]
 * @returns {Promise<{ checkoutId: string, redirectUrl: string }>}
 * @throws {Error} 400 - cart empty / out of stock / invalid address
 * @throws {Error} 401 - not authenticated
 * @throws {Error} 502 - Rapyd unavailable
 */
export const createCheckoutSession = async ({ shippingAddress, notes } = {}) => {
  const response = await apiClient.post('/orders/create-checkout-session', {
    shippingAddress,
    ...(notes ? { notes } : {}),
  });

  const payload = response.data?.data || response.data || {};

  const checkoutId = firstDefined(
    payload.checkoutId,
    payload.checkout_id,
    payload.id
  ) || '';

  const redirectUrl = firstDefined(
    payload.redirectUrl,
    payload.redirect_url,
    payload.url
  ) || '';

  if (!checkoutId || !redirectUrl) {
    throw new Error('Invalid checkout response from server.');
  }

  return { checkoutId, redirectUrl };
};

/**
 * Finalize a Hosted Checkout after the user returns from Rapyd.
 * The backend re-fetches the checkout from Rapyd, verifies status/amount/user,
 * and either confirms the existing pending order or returns a failure status.
 *
 * @param {Object} params
 * @param {string} params.checkoutId
 * @returns {Promise<Object>} The order object (id, status, rapydPaymentId, ...)
 * @throws {Error} 400 - payment not completed
 * @throws {Error} 404 - checkoutId unknown
 */
export const finalizeCheckout = async ({ checkoutId }) => {
  const response = await apiClient.post('/orders/finalize-checkout', {
    checkoutId,
  });
  const payload = response.data?.data || response.data || {};
  return payload.order || payload;
};

/**
 * Get the current user's order history.
 */
export const getOrders = async (params = {}) => {
  const response = await apiClient.get('/orders', { params });
  return response.data;
};

/**
 * Get a single order by ID.
 */
export const getOrderById = async (id) => {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data;
};
