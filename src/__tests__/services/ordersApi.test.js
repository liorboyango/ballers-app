/**
 * Tests for the Orders API service - Rapyd integration.
 *
 * Covers:
 *   - createPaymentIntent: response field normalisation (camelCase, snake_case,
 *     nested envelope), missing fields, error propagation
 *   - createOrder: request payload shape (rapydPaymentId, no paymentIntentId),
 *     response passthrough, legacy field stripping
 *   - getOrders: pagination, query params, error handling
 *   - getOrderById: success, 404 handling
 */
import apiClient from '../../services/api';
import {
  createPaymentIntent,
  createOrder,
  getOrders,
  getOrderById,
} from '../../services/ordersApi';

// -- Mock the Axios API client ------------------------------------------------
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  API_BASE_URL: 'http://localhost:5000/api',
}));

// -- Shared fixtures ----------------------------------------------------------

/** Standard Rapyd payment intent backend response (camelCase) */
const RAPYD_INTENT_PAYLOAD_CAMEL = {
  paymentId: 'payment_abc123',
  clientToken: 'rapyd_ct_test_abc',
  amount: 8999,
  currency: 'USD',
  orderSummary: {
    items: [{ productId: 'p1', quantity: 1, price: 79.99 }],
    subtotal: 79.99,
    shippingCost: 9.99,
    total: 89.99,
    itemCount: 1,
  },
};

/** Same data using snake_case field names (legacy backend variant) */
const RAPYD_INTENT_PAYLOAD_SNAKE = {
  payment_id: 'payment_snake456',
  client_token: 'rapyd_ct_snake_456',
  amount: 5000,
  currency: 'usd',
  order_summary: {
    subtotal: 40,
    shippingCost: 10,
    total: 50,
    itemCount: 2,
  },
};

/** Standard Rapyd create-order response */
const RAPYD_ORDER_RESPONSE = {
  status: 'success',
  data: {
    orderId: 'order_xyz789',
    orderNumber: 'ORD-20260507-0001',
    status: 'paid',
    rapydPaymentId: 'payment_abc123',
    paymentMethod: 'rapyd',
    items: [{ productId: 'p1', quantity: 1, price: 79.99 }],
    subtotal: 79.99,
    shippingCost: 9.99,
    total: 89.99,
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      address: '123 Main St',
      city: 'New York',
      zip: '10001',
      country: 'US',
    },
    createdAt: '2026-05-07T15:13:42.000Z',
  },
};

// -- Tests --------------------------------------------------------------------

describe('ordersApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- createPaymentIntent ----------------------------------------------------

  describe('createPaymentIntent', () => {
    it('calls POST /orders/create-payment-intent with no body', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { data: RAPYD_INTENT_PAYLOAD_CAMEL } });

      await createPaymentIntent();

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith('/orders/create-payment-intent');
    });

    it('normalises camelCase Rapyd fields from nested data envelope', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { status: 'success', data: RAPYD_INTENT_PAYLOAD_CAMEL },
      });

      const result = await createPaymentIntent();

      expect(result.clientToken).toBe('rapyd_ct_test_abc');
      expect(result.paymentId).toBe('payment_abc123');
      expect(result.amount).toBe(8999);
      expect(result.currency).toBe('usd'); // normalised to lowercase
      expect(result.orderSummary).toEqual(RAPYD_INTENT_PAYLOAD_CAMEL.orderSummary);
    });

    it('normalises snake_case Rapyd fields (legacy backend variant)', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { status: 'success', data: RAPYD_INTENT_PAYLOAD_SNAKE },
      });

      const result = await createPaymentIntent();

      expect(result.clientToken).toBe('rapyd_ct_snake_456');
      expect(result.paymentId).toBe('payment_snake456');
      expect(result.amount).toBe(5000);
      expect(result.currency).toBe('usd');
      // order_summary fallback to snake_case key
      expect(result.orderSummary).toEqual(RAPYD_INTENT_PAYLOAD_SNAKE.order_summary);
    });

    it('handles flat response (no nested data envelope)', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: RAPYD_INTENT_PAYLOAD_CAMEL,
      });

      const result = await createPaymentIntent();

      expect(result.clientToken).toBe('rapyd_ct_test_abc');
      expect(result.paymentId).toBe('payment_abc123');
    });

    it('returns empty strings for missing clientToken and paymentId', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { data: { amount: 100, currency: 'usd' } },
      });

      const result = await createPaymentIntent();

      expect(result.clientToken).toBe('');
      expect(result.paymentId).toBe('');
    });

    it('returns 0 for missing amount', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { data: { clientToken: 'ct', paymentId: 'pay_id' } },
      });

      const result = await createPaymentIntent();

      expect(result.amount).toBe(0);
    });

    it('returns null for missing orderSummary', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { data: { clientToken: 'ct', paymentId: 'pay_id', amount: 100 } },
      });

      const result = await createPaymentIntent();

      expect(result.orderSummary).toBeNull();
    });

    it('defaults currency to "usd" when missing', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { data: { clientToken: 'ct', paymentId: 'pay_id' } },
      });

      const result = await createPaymentIntent();

      expect(result.currency).toBe('usd');
    });

    it('normalises uppercase currency to lowercase', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { data: { clientToken: 'ct', paymentId: 'pay_id', currency: 'USD' } },
      });

      const result = await createPaymentIntent();

      expect(result.currency).toBe('usd');
    });

    it('propagates network errors', async () => {
      const networkErr = { status: 0, message: 'Network error. Please check your connection.' };
      apiClient.post.mockRejectedValueOnce(networkErr);

      await expect(createPaymentIntent()).rejects.toEqual(networkErr);
    });

    it('propagates 401 authentication errors', async () => {
      const authErr = { status: 401, message: 'Unauthorized' };
      apiClient.post.mockRejectedValueOnce(authErr);

      await expect(createPaymentIntent()).rejects.toEqual(authErr);
    });

    it('propagates 400 cart validation errors (empty cart, out of stock)', async () => {
      const cartErr = { status: 400, message: 'Cart is empty' };
      apiClient.post.mockRejectedValueOnce(cartErr);

      await expect(createPaymentIntent()).rejects.toEqual(cartErr);
    });

    it('propagates 502 Rapyd API unavailable errors', async () => {
      const gatewayErr = { status: 502, message: 'Rapyd API unavailable' };
      apiClient.post.mockRejectedValueOnce(gatewayErr);

      await expect(createPaymentIntent()).rejects.toEqual(gatewayErr);
    });
  });

  // -- createOrder ------------------------------------------------------------

  describe('createOrder', () => {
    const VALID_ORDER_DATA = {
      rapydPaymentId: 'payment_abc123',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'New York',
        zip: '10001',
        country: 'US',
      },
    };

    it('calls POST /orders/create with the provided data', async () => {
      apiClient.post.mockResolvedValueOnce({ data: RAPYD_ORDER_RESPONSE });

      await createOrder(VALID_ORDER_DATA);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/orders/create',
        expect.objectContaining({
          rapydPaymentId: 'payment_abc123',
          shippingAddress: expect.objectContaining({ firstName: 'John' }),
        })
      );
    });

    it('sends rapydPaymentId (not paymentIntentId) to the backend', async () => {
      apiClient.post.mockResolvedValueOnce({ data: RAPYD_ORDER_RESPONSE });

      await createOrder(VALID_ORDER_DATA);

      const sentPayload = apiClient.post.mock.calls[0][1];
      expect(sentPayload).toHaveProperty('rapydPaymentId', 'payment_abc123');
      expect(sentPayload).not.toHaveProperty('paymentIntentId');
    });

    it('strips legacy paymentIntentId field if accidentally included', async () => {
      apiClient.post.mockResolvedValueOnce({ data: RAPYD_ORDER_RESPONSE });

      await createOrder({
        ...VALID_ORDER_DATA,
        paymentIntentId: 'pi_old_stripe_intent', // legacy field - must be stripped
      });

      const sentPayload = apiClient.post.mock.calls[0][1];
      expect(sentPayload).not.toHaveProperty('paymentIntentId');
      expect(sentPayload).toHaveProperty('rapydPaymentId', 'payment_abc123');
    });

    it('returns the raw response data from the backend', async () => {
      apiClient.post.mockResolvedValueOnce({ data: RAPYD_ORDER_RESPONSE });

      const result = await createOrder(VALID_ORDER_DATA);

      expect(result).toEqual(RAPYD_ORDER_RESPONSE);
    });

    it('response data contains rapydPaymentId and paymentMethod=rapyd', async () => {
      apiClient.post.mockResolvedValueOnce({ data: RAPYD_ORDER_RESPONSE });

      const result = await createOrder(VALID_ORDER_DATA);

      expect(result.data.rapydPaymentId).toBe('payment_abc123');
      expect(result.data.paymentMethod).toBe('rapyd');
    });

    it('includes optional notes when provided', async () => {
      apiClient.post.mockResolvedValueOnce({ data: RAPYD_ORDER_RESPONSE });

      await createOrder({ ...VALID_ORDER_DATA, notes: 'Leave at door' });

      const sentPayload = apiClient.post.mock.calls[0][1];
      expect(sentPayload).toHaveProperty('notes', 'Leave at door');
    });

    it('propagates 400 errors (payment not verified or amount mismatch)', async () => {
      const err = { status: 400, message: 'Payment amount mismatch' };
      apiClient.post.mockRejectedValueOnce(err);

      await expect(createOrder(VALID_ORDER_DATA)).rejects.toEqual(err);
    });

    it('propagates 404 errors (rapydPaymentId not found in Rapyd)', async () => {
      const err = { status: 404, message: 'Payment not found' };
      apiClient.post.mockRejectedValueOnce(err);

      await expect(createOrder(VALID_ORDER_DATA)).rejects.toEqual(err);
    });

    it('propagates 409 errors (duplicate order for paymentId)', async () => {
      const err = { status: 409, message: 'Order already exists for this payment' };
      apiClient.post.mockRejectedValueOnce(err);

      await expect(createOrder(VALID_ORDER_DATA)).rejects.toEqual(err);
    });
  });

  // -- getOrders --------------------------------------------------------------

  describe('getOrders', () => {
    it('calls GET /orders with no params when called with defaults', async () => {
      const mockResponse = {
        orders: [],
        pagination: { page: 1, limit: 10, total: 0 },
      };
      apiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getOrders();

      expect(apiClient.get).toHaveBeenCalledWith('/orders', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('passes page and limit query params', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { orders: [], pagination: { page: 2, limit: 5, total: 15 } },
      });

      await getOrders({ page: 2, limit: 5 });

      expect(apiClient.get).toHaveBeenCalledWith('/orders', {
        params: { page: 2, limit: 5 },
      });
    });

    it('passes status filter param', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { orders: [], pagination: {} },
      });

      await getOrders({ status: 'paid' });

      expect(apiClient.get).toHaveBeenCalledWith('/orders', {
        params: { status: 'paid' },
      });
    });

    it('returns list of orders with Rapyd payment fields', async () => {
      const mockOrders = [
        {
          id: 'order_1',
          rapydPaymentId: 'payment_111',
          paymentMethod: 'rapyd',
          status: 'paid',
          total: 89.99,
        },
        {
          id: 'order_2',
          rapydPaymentId: 'payment_222',
          paymentMethod: 'rapyd',
          status: 'shipped',
          total: 129.99,
        },
      ];
      apiClient.get.mockResolvedValueOnce({
        data: { orders: mockOrders, pagination: { page: 1, limit: 10, total: 2 } },
      });

      const result = await getOrders();

      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].rapydPaymentId).toBe('payment_111');
      expect(result.orders[0].paymentMethod).toBe('rapyd');
      expect(result.orders[1].rapydPaymentId).toBe('payment_222');
    });

    it('propagates 401 authentication errors', async () => {
      const authErr = { status: 401, message: 'Unauthorized' };
      apiClient.get.mockRejectedValueOnce(authErr);

      await expect(getOrders()).rejects.toEqual(authErr);
    });
  });

  // -- getOrderById -----------------------------------------------------------

  describe('getOrderById', () => {
    it('calls GET /orders/:id with the provided ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'order_xyz789',
          rapydPaymentId: 'payment_abc123',
          paymentMethod: 'rapyd',
          status: 'paid',
        },
      };
      apiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getOrderById('order_xyz789');

      expect(apiClient.get).toHaveBeenCalledWith('/orders/order_xyz789');
      expect(result).toEqual(mockResponse);
    });

    it('response data includes rapydPaymentId and paymentMethod=rapyd', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'order_rapyd_1',
          rapydPaymentId: 'payment_rapyd_001',
          paymentMethod: 'rapyd',
          status: 'paid',
          total: 99.99,
        },
      };
      apiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getOrderById('order_rapyd_1');

      expect(result.data.rapydPaymentId).toBe('payment_rapyd_001');
      expect(result.data.paymentMethod).toBe('rapyd');
    });

    it('propagates 404 errors for unknown order IDs', async () => {
      const notFoundErr = { status: 404, message: 'Order not found' };
      apiClient.get.mockRejectedValueOnce(notFoundErr);

      await expect(getOrderById('non_existent_id')).rejects.toEqual(notFoundErr);
    });

    it('propagates 401 authentication errors', async () => {
      const authErr = { status: 401, message: 'Unauthorized' };
      apiClient.get.mockRejectedValueOnce(authErr);

      await expect(getOrderById('order_1')).rejects.toEqual(authErr);
    });

    it('propagates 403 errors for orders belonging to other users', async () => {
      const forbiddenErr = { status: 403, message: 'Forbidden' };
      apiClient.get.mockRejectedValueOnce(forbiddenErr);

      await expect(getOrderById('other_users_order')).rejects.toEqual(forbiddenErr);
    });
  });
});
