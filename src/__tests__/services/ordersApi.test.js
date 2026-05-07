/**
 * Tests for the Orders API service — Rapyd Hosted Checkout.
 *
 * Covers:
 *   - createCheckoutSession: request payload (shippingAddress)
 *   - createCheckoutSession: response normalisation (camelCase + snake_case)
 *   - createCheckoutSession: throws on missing fields
 *   - finalizeCheckout: request payload + response unwrapping
 *   - getOrders / getOrderById: basic fetching
 */
import apiClient from '../../services/api';
import {
  createCheckoutSession,
  finalizeCheckout,
  getOrders,
  getOrderById,
} from '../../services/ordersApi';

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

function envelope(payload) {
  return { data: { status: 'success', data: payload } };
}

const SHIPPING = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  address: '123 Main St',
  city: 'New York',
  zip: '10001',
  country: 'US',
};

describe('createCheckoutSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POSTs to /orders/create-checkout-session with shippingAddress', async () => {
    apiClient.post.mockResolvedValueOnce(
      envelope({ checkoutId: 'ck_123', redirectUrl: 'https://sandboxcheckout.rapyd.net/?token=ck_123' })
    );

    await createCheckoutSession({ shippingAddress: SHIPPING });

    expect(apiClient.post).toHaveBeenCalledWith('/orders/create-checkout-session', {
      shippingAddress: SHIPPING,
    });
  });

  it('includes notes when provided', async () => {
    apiClient.post.mockResolvedValueOnce(
      envelope({ checkoutId: 'ck_1', redirectUrl: 'https://x' })
    );

    await createCheckoutSession({ shippingAddress: SHIPPING, notes: 'gift wrap' });

    expect(apiClient.post).toHaveBeenCalledWith('/orders/create-checkout-session', {
      shippingAddress: SHIPPING,
      notes: 'gift wrap',
    });
  });

  it('returns { checkoutId, redirectUrl } from camelCase payload', async () => {
    apiClient.post.mockResolvedValueOnce(
      envelope({ checkoutId: 'ck_abc', redirectUrl: 'https://pay.rapyd.net/abc' })
    );

    const result = await createCheckoutSession({ shippingAddress: SHIPPING });

    expect(result).toEqual({ checkoutId: 'ck_abc', redirectUrl: 'https://pay.rapyd.net/abc' });
  });

  it('normalises snake_case payload', async () => {
    apiClient.post.mockResolvedValueOnce(
      envelope({ checkout_id: 'ck_snake', redirect_url: 'https://pay.rapyd.net/snake' })
    );

    const result = await createCheckoutSession({ shippingAddress: SHIPPING });

    expect(result).toEqual({ checkoutId: 'ck_snake', redirectUrl: 'https://pay.rapyd.net/snake' });
  });

  it('throws when redirectUrl is missing', async () => {
    apiClient.post.mockResolvedValueOnce(envelope({ checkoutId: 'ck_1' }));

    await expect(
      createCheckoutSession({ shippingAddress: SHIPPING })
    ).rejects.toThrow(/invalid checkout response/i);
  });

  it('throws when checkoutId is missing', async () => {
    apiClient.post.mockResolvedValueOnce(envelope({ redirectUrl: 'https://x' }));

    await expect(
      createCheckoutSession({ shippingAddress: SHIPPING })
    ).rejects.toThrow(/invalid checkout response/i);
  });

  it('propagates API errors (e.g. cart empty)', async () => {
    apiClient.post.mockRejectedValueOnce({ status: 400, message: 'Cart is empty' });

    await expect(
      createCheckoutSession({ shippingAddress: SHIPPING })
    ).rejects.toMatchObject({ message: 'Cart is empty' });
  });
});

describe('finalizeCheckout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POSTs to /orders/finalize-checkout with checkoutId', async () => {
    apiClient.post.mockResolvedValueOnce(envelope({ id: 'order-1', status: 'paid' }));

    await finalizeCheckout({ checkoutId: 'ck_xyz' });

    expect(apiClient.post).toHaveBeenCalledWith('/orders/finalize-checkout', {
      checkoutId: 'ck_xyz',
    });
  });

  it('returns the order from the envelope', async () => {
    apiClient.post.mockResolvedValueOnce(
      envelope({ id: 'order-1', status: 'paid', rapydPaymentId: 'pay_1' })
    );

    const order = await finalizeCheckout({ checkoutId: 'ck_xyz' });

    expect(order).toEqual({ id: 'order-1', status: 'paid', rapydPaymentId: 'pay_1' });
  });

  it('unwraps a nested { order } shape', async () => {
    apiClient.post.mockResolvedValueOnce(
      envelope({ order: { id: 'order-2', status: 'paid' } })
    );

    const order = await finalizeCheckout({ checkoutId: 'ck_xyz' });

    expect(order).toEqual({ id: 'order-2', status: 'paid' });
  });

  it('propagates 400 when payment was not completed', async () => {
    apiClient.post.mockRejectedValueOnce({ status: 400, message: 'Payment not completed' });

    await expect(
      finalizeCheckout({ checkoutId: 'ck_fail' })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('getOrders / getOrderById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getOrders forwards query params', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { orders: [], pagination: { total: 0 } } });

    await getOrders({ page: 2, limit: 5 });

    expect(apiClient.get).toHaveBeenCalledWith('/orders', { params: { page: 2, limit: 5 } });
  });

  it('getOrderById hits /orders/:id', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { success: true, data: { id: 'o1' } } });

    const result = await getOrderById('o1');

    expect(apiClient.get).toHaveBeenCalledWith('/orders/o1');
    expect(result).toEqual({ success: true, data: { id: 'o1' } });
  });
});
