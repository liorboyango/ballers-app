/**
 * Tests for the Orders API service — Rapyd integration.
 *
 * Covers:
 *   - createPaymentIntent: response normalisation (camelCase, snake_case, direct)
 *   - createPaymentIntent: error handling (network, 400, 401, 502)
 *   - createOrder: request payload (rapydPaymentId, strips legacy paymentIntentId)
 *   - createOrder: response unwrapping
 *   - createOrder: duplicate-order 409 error
 *   - getOrders / getOrderById: basic fetching
 */
import apiClient from '../../services/api';
import {
  createPaymentIntent,
  createOrder,
  getOrders,
  getOrderById,
} from '../../services/ordersApi';

// ── Mock apiClient ─────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a fake successful axios response wrapping the given data
 * in the backend envelope: { status: 'success', data: <payload> }.
 */
function makeApiResponse(payload) {
  return { data: { status: 'success', data: payload } };
}

/**
 * Build an error object matching the shape produced by the axios
 * response interceptor in src/services/api.js.
 */
function makeApiError(status, message, errors = []) {
  return { status, message, errors, originalError: new Error(message) };
}

// ── createPaymentIntent ────────────────────────────────────────────────────

describe('createPaymentIntent', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Happy path: response normalisation ───────────────────────────────────

  it('returns camelCase fields directly from the backend envelope', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({
        clientToken: 'tok_abc123',
        paymentId: 'payment_ABCDEF',
        amount: 9999,
        currency: 'USD',
        orderSummary: { subtotal: 89.99, shippingCost: 9.99, total: 99.99, itemCount: 2 },
      })
    );

    const result = await createPaymentIntent();

    expect(apiClient.post).toHaveBeenCalledWith('/orders/create-payment-intent');
    expect(result.clientToken).toBe('tok_abc123');
    expect(result.paymentId).toBe('payment_ABCDEF');
    expect(result.amount).toBe(9999);
    expect(result.currency).toBe('usd'); // normalised to lowercase
    expect(result.orderSummary).toEqual(
      expect.objectContaining({ total: 99.99, itemCount: 2 })
    );
  });

  it('normalises snake_case field names (legacy backend variants)', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({
        client_token: 'tok_snake',
        payment_id: 'payment_SNAKE1',
        amount: 5000,
        currency: 'USD',
        order_summary: { total: 50.0 },
      })
    );

    const result = await createPaymentIntent();

    expect(result.clientToken).toBe('tok_snake');
    expect(result.paymentId).toBe('payment_SNAKE1');
    expect(result.orderSummary).toEqual({ total: 50.0 });
  });

  it('normalises PascalCase field names', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({
        ClientToken: 'tok_pascal',
        PaymentId: 'payment_PASCAL1',
        Amount: 2000,
        Currency: 'USD',
      })
    );

    const result = await createPaymentIntent();

    expect(result.clientToken).toBe('tok_pascal');
    expect(result.paymentId).toBe('payment_PASCAL1');
    expect(result.amount).toBe(2000);
  });

  it('normalises currency to lowercase', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({ clientToken: 't', paymentId: 'p', amount: 0, currency: 'USD' })
    );
    const result = await createPaymentIntent();
    expect(result.currency).toBe('usd');
  });

  it('defaults currency to "usd" when absent', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({ clientToken: 't', paymentId: 'p', amount: 0 })
    );
    const result = await createPaymentIntent();
    expect(result.currency).toBe('usd');
  });

  it('defaults amount to 0 when absent', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({ clientToken: 't', paymentId: 'p' })
    );
    const result = await createPaymentIntent();
    expect(result.amount).toBe(0);
  });

  it('defaults orderSummary to null when absent', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({ clientToken: 't', paymentId: 'p', amount: 0 })
    );
    const result = await createPaymentIntent();
    expect(result.orderSummary).toBeNull();
  });

  it('handles flat (non-enveloped) response shape', async () => {
    // Some backend versions return data directly without the `data` wrapper.
    apiClient.post.mockResolvedValueOnce({
      data: { clientToken: 'tok_flat', paymentId: 'payment_FLAT', amount: 100 },
    });
    const result = await createPaymentIntent();
    expect(result.clientToken).toBe('tok_flat');
    expect(result.paymentId).toBe('payment_FLAT');
  });

  it('coerces string amount to number', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({ clientToken: 't', paymentId: 'p', amount: '3500' })
    );
    const result = await createPaymentIntent();
    expect(typeof result.amount).toBe('number');
    expect(result.amount).toBe(3500);
  });

  // ── Error scenarios ───────────────────────────────────────────────────────

  it('re-throws 400 error (empty cart)', async () => {
    const err = makeApiError(400, 'Cart is empty');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(createPaymentIntent()).rejects.toMatchObject({ message: 'Cart is empty' });
  });

  it('re-throws 401 error (not authenticated)', async () => {
    const err = makeApiError(401, 'Unauthorized');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(createPaymentIntent()).rejects.toMatchObject({ status: 401 });
  });

  it('re-throws 502 error (Rapyd API unavailable)', async () => {
    const err = makeApiError(502, 'Rapyd API unavailable');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(createPaymentIntent()).rejects.toMatchObject({ status: 502 });
  });

  it('re-throws network errors (status 0)', async () => {
    const err = makeApiError(0, 'Network error. Please check your connection.');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(createPaymentIntent()).rejects.toMatchObject({ status: 0 });
  });
});

// ── createOrder ────────────────────────────────────────────────────────────

describe('createOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  const SHIPPING = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    address: '123 Main St',
    city: 'New York',
    zip: '10001',
    country: 'US',
  };

  // ── Payload construction ─────────────────────────────────────────────────

  it('sends rapydPaymentId and shippingAddress to POST /orders/create', async () => {
    apiClient.post.mockResolvedValueOnce(
      makeApiResponse({
        orderId: 'order-123',
        orderNumber: 'ORD-0001',
        status: 'pending',
        rapydPaymentId: 'payment_XYZ',
        paymentMethod: 'rapyd',
        total: 99.99,
      })
    );

    await createOrder({ rapydPaymentId: 'payment_XYZ', shippingAddress: SHIPPING });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/orders/create',
      expect.objectContaining({
        rapydPaymentId: 'payment_XYZ',
        shippingAddress: SHIPPING,
      })
    );
  });

  it('strips legacy paymentIntentId from the request payload', async () => {
    apiClient.post.mockResolvedValueOnce(makeApiResponse({ orderId: 'o1' }));

    await createOrder({
      rapydPaymentId: 'payment_NEW',
      paymentIntentId: 'pi_old_stripe_id', // legacy field — must be removed
      shippingAddress: SHIPPING,
    });

    const sentPayload = apiClient.post.mock.calls[0][1];
    expect(sentPayload).not.toHaveProperty('paymentIntentId');
    expect(sentPayload.rapydPaymentId).toBe('payment_NEW');
  });

  it('includes optional notes when provided', async () => {
    apiClient.post.mockResolvedValueOnce(makeApiResponse({ orderId: 'o2' }));

    await createOrder({
      rapydPaymentId: 'payment_N',
      shippingAddress: SHIPPING,
      notes: 'Leave at door',
    });

    const sentPayload = apiClient.post.mock.calls[0][1];
    expect(sentPayload.notes).toBe('Leave at door');
  });

  // ── Response handling ────────────────────────────────────────────────────

  it('returns the full raw response.data', async () => {
    const mockResponseData = {
      status: 'success',
      data: {
        orderId: 'order-456',
        orderNumber: 'ORD-0042',
        status: 'pending',
        rapydPaymentId: 'payment_ABC',
        paymentMethod: 'rapyd',
        total: 149.99,
        shippingAddress: SHIPPING,
      },
    };
    apiClient.post.mockResolvedValueOnce({ data: mockResponseData });

    const result = await createOrder({
      rapydPaymentId: 'payment_ABC',
      shippingAddress: SHIPPING,
    });

    // createOrder returns response.data (the full envelope)
    expect(result).toEqual(mockResponseData);
    expect(result.data.rapydPaymentId).toBe('payment_ABC');
    expect(result.data.paymentMethod).toBe('rapyd');
  });

  // ── Error scenarios ──────────────────────────────────────────────────────

  it('re-throws 400 error (payment not verified)', async () => {
    const err = makeApiError(400, 'Payment not verified or amount mismatch');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(
      createOrder({ rapydPaymentId: 'payment_bad', shippingAddress: SHIPPING })
    ).rejects.toMatchObject({ message: 'Payment not verified or amount mismatch' });
  });

  it('re-throws 409 error (duplicate order for same paymentId)', async () => {
    const err = makeApiError(409, 'Order already exists for this paymentId');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(
      createOrder({ rapydPaymentId: 'payment_dup', shippingAddress: SHIPPING })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('re-throws 404 error (rapydPaymentId not found in Rapyd)', async () => {
    const err = makeApiError(404, 'Payment not found');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(
      createOrder({ rapydPaymentId: 'payment_missing', shippingAddress: SHIPPING })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('re-throws network errors', async () => {
    const err = makeApiError(0, 'Network error. Please check your connection.');
    apiClient.post.mockRejectedValueOnce(err);
    await expect(
      createOrder({ rapydPaymentId: 'payment_net', shippingAddress: SHIPPING })
    ).rejects.toMatchObject({ status: 0 });
  });
});

// ── getOrders ──────────────────────────────────────────────────────────────

describe('getOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /orders with no params by default', async () => {
    const mockData = { orders: [], pagination: { total: 0, page: 1 } };
    apiClient.get.mockResolvedValueOnce({ data: mockData });

    const result = await getOrders();

    expect(apiClient.get).toHaveBeenCalledWith('/orders', { params: {} });
    expect(result).toEqual(mockData);
  });

  it('passes query params to GET /orders', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { orders: [] } });

    await getOrders({ page: 2, limit: 5, status: 'paid' });

    expect(apiClient.get).toHaveBeenCalledWith('/orders', {
      params: { page: 2, limit: 5, status: 'paid' },
    });
  });

  it('re-throws errors', async () => {
    apiClient.get.mockRejectedValueOnce(makeApiError(500, 'Server error'));
    await expect(getOrders()).rejects.toMatchObject({ status: 500 });
  });
});

// ── getOrderById ───────────────────────────────────────────────────────────

describe('getOrderById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /orders/:id', async () => {
    const orderData = {
      success: true,
      data: {
        id: 'order-xyz',
        rapydPaymentId: 'payment_XYZ',
        paymentMethod: 'rapyd',
        status: 'paid',
        total: 89.99,
      },
    };
    apiClient.get.mockResolvedValueOnce({ data: orderData });

    const result = await getOrderById('order-xyz');

    expect(apiClient.get).toHaveBeenCalledWith('/orders/order-xyz');
    expect(result).toEqual(orderData);
    expect(result.data.rapydPaymentId).toBe('payment_XYZ');
    expect(result.data.paymentMethod).toBe('rapyd');
  });

  it('re-throws 404 error when order not found', async () => {
    apiClient.get.mockRejectedValueOnce(makeApiError(404, 'Order not found'));
    await expect(getOrderById('not-found')).rejects.toMatchObject({
      status: 404,
      message: 'Order not found',
    });
  });

  it('re-throws 401 error when not authenticated', async () => {
    apiClient.get.mockRejectedValueOnce(makeApiError(401, 'Unauthorized'));
    await expect(getOrderById('order-123')).rejects.toMatchObject({ status: 401 });
  });
});
