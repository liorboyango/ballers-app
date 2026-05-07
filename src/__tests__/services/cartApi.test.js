/**
 * Tests for the Cart API service
 */
import apiClient from '../../services/api';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../../services/cartApi';

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

describe('cartApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('calls GET /cart', async () => {
      const mockCart = { success: true, data: { items: [], totalItems: 0, totalPrice: 0 } };
      apiClient.get.mockResolvedValueOnce({ data: mockCart });

      const result = await getCart();

      expect(apiClient.get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockCart);
    });
  });

  describe('addToCart', () => {
    it('calls POST /cart/add with item data', async () => {
      const item = { productId: 'prod1', quantity: 1, customization: { size: 'M', number: 10, name: 'MESSI' } };
      const mockCart = { success: true, data: { items: [item], totalItems: 1, totalPrice: 129.99 } };
      apiClient.post.mockResolvedValueOnce({ data: mockCart });

      const result = await addToCart(item);

      expect(apiClient.post).toHaveBeenCalledWith('/cart/add', item);
      expect(result).toEqual(mockCart);
    });
  });

  describe('updateCartItem', () => {
    it('calls PUT /cart/update with update data', async () => {
      const update = { itemId: 'item1', quantity: 2 };
      const mockCart = { success: true, data: { items: [], totalItems: 2, totalPrice: 259.98 } };
      apiClient.put.mockResolvedValueOnce({ data: mockCart });

      const result = await updateCartItem(update);

      expect(apiClient.put).toHaveBeenCalledWith('/cart/update', update);
      expect(result).toEqual(mockCart);
    });
  });

  describe('removeFromCart', () => {
    it('calls DELETE /cart/item with itemId', async () => {
      const mockCart = { success: true, data: { items: [], totalItems: 0, totalPrice: 0 } };
      apiClient.delete.mockResolvedValueOnce({ data: mockCart });

      const result = await removeFromCart('item1');

      expect(apiClient.delete).toHaveBeenCalledWith('/cart/item', { params: { itemId: 'item1' } });
      expect(result).toEqual(mockCart);
    });
  });
});
