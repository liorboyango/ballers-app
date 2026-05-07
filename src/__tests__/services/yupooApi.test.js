/**
 * Tests for the Yupoo API service.
 *
 * Covers:
 * - Correct API endpoint URLs (matching backend contract)
 * - Auth token is attached via axios interceptor
 * - Response normalization (nested data, itemCount alias)
 * - crawlCategories sends correct request body
 * - Error propagation
 */
import apiClient from '../../services/api';
import { getYupooCategories, crawlCategories } from '../../services/yupooApi';

// Mock the axios client
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('yupooApi – getYupooCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the correct admin endpoint GET /admin/yupoo-categories', async () => {
    apiClient.get.mockResolvedValue({
      data: { status: 'success', fetchedAt: '2026-01-01T00:00:00.000Z', cached: false, count: 0, data: [] },
    });

    await getYupooCategories();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/yupoo-categories', {
      params: undefined,
    });
  });

  it('passes ?refresh=true when refresh flag is set', async () => {
    apiClient.get.mockResolvedValue({
      data: { status: 'success', fetchedAt: null, cached: false, count: 0, data: [] },
    });

    await getYupooCategories(true);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/yupoo-categories', {
      params: { refresh: 'true' },
    });
  });

  it('normalizes the backend response into { categories, cached, cachedAt }', async () => {
    const mockData = [
      {
        id: '5066922',
        name: 'Brasileiro Série A',
        path: '/categories/5066922',
        subcategoryCount: 2,
        subcategories: [
          { id: '729135', name: 'Atlético Mineiro', path: '/categories/729135', isSubCate: true },
          { id: '729147', name: 'Sport Recife',     path: '/categories/729147', isSubCate: true },
        ],
      },
    ];

    apiClient.get.mockResolvedValue({
      data: {
        status: 'success',
        fetchedAt: '2026-05-07T12:00:00.000Z',
        cached: true,
        count: 1,
        data: mockData,
      },
    });

    const result = await getYupooCategories();

    expect(result.cached).toBe(true);
    expect(result.cachedAt).toBe('2026-05-07T12:00:00.000Z');
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Brasileiro Série A');
    // itemCount should be aliased from subcategoryCount
    expect(result.categories[0].itemCount).toBe(2);
    // subcategories should be normalized too
    expect(result.categories[0].subcategories).toHaveLength(2);
    expect(result.categories[0].subcategories[0].name).toBe('Atlético Mineiro');
  });

  it('returns empty categories array when data is missing', async () => {
    apiClient.get.mockResolvedValue({ data: {} });
    const result = await getYupooCategories();
    expect(result.categories).toEqual([]);
    expect(result.cached).toBe(false);
    expect(result.cachedAt).toBeNull();
  });

  it('propagates errors from apiClient', async () => {
    const err = { status: 403, message: 'Forbidden – admin only' };
    apiClient.get.mockRejectedValue(err);

    await expect(getYupooCategories()).rejects.toMatchObject({ status: 403 });
  });
});

describe('yupooApi – crawlCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the correct admin endpoint POST /admin/crawl-products', async () => {
    apiClient.post.mockResolvedValue({
      data: { status: 'success', data: { created: 5, skipped: 1, errors: [], ids: [] } },
    });

    const cats = [{ id: '5066922', name: 'Brasileiro Série A', path: '/categories/5066922', subcategories: [] }];
    const defaults = { price: 99.99, kitType: 'home', stock: 10, sizes: ['S', 'M', 'L', 'XL', 'XXL'], customizable: true };

    await crawlCategories(cats, defaults);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/crawl-products',
      {
        selectedCategories: cats,
        defaults: {
          price:        99.99,
          kitType:      'home',
          stock:        10,
          sizes:        ['S', 'M', 'L', 'XL', 'XXL'],
          customizable: true,
        },
      },
      { timeout: 300_000 }
    );
  });

  it('defaults customizable to true when not supplied', async () => {
    apiClient.post.mockResolvedValue({
      data: { status: 'success', data: { created: 0, skipped: 0, errors: [], ids: [] } },
    });

    const cats = [];
    const defaults = { price: 49.99, kitType: 'away', stock: 5, sizes: ['M', 'L'] };
    // No customizable field

    await crawlCategories(cats, defaults);

    const callArgs = apiClient.post.mock.calls[0];
    expect(callArgs[1].defaults.customizable).toBe(true);
  });

  it('sets a 5-minute timeout on the request', async () => {
    apiClient.post.mockResolvedValue({ data: { data: {} } });

    await crawlCategories([], { price: 99, kitType: 'home', stock: 10, sizes: ['M'] });

    const callOptions = apiClient.post.mock.calls[0][2];
    expect(callOptions.timeout).toBe(300_000);
  });

  it('normalizes the response and returns the data payload', async () => {
    const payload = { created: 12, skipped: 3, errors: [], ids: ['abc', 'def'] };
    apiClient.post.mockResolvedValue({
      data: { status: 'success', data: payload },
    });

    const result = await crawlCategories([], {
      price: 99.99,
      kitType: 'home',
      stock: 10,
      sizes: ['M'],
    });

    // crawlCategories unwraps res.data
    expect(result.data).toEqual(payload);
  });

  it('propagates 401 errors (unauthenticated)', async () => {
    const err = { status: 401, message: 'Unauthorized' };
    apiClient.post.mockRejectedValue(err);

    await expect(
      crawlCategories([], { price: 99, kitType: 'home', stock: 10, sizes: ['M'] })
    ).rejects.toMatchObject({ status: 401 });
  });

  it('propagates 403 errors (non-admin user)', async () => {
    const err = { status: 403, message: 'Forbidden' };
    apiClient.post.mockRejectedValue(err);

    await expect(
      crawlCategories([], { price: 99, kitType: 'home', stock: 10, sizes: ['M'] })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('propagates network errors', async () => {
    const err = { status: 0, message: 'Network error. Please check your connection.' };
    apiClient.post.mockRejectedValue(err);

    await expect(
      crawlCategories([], { price: 99, kitType: 'home', stock: 10, sizes: ['M'] })
    ).rejects.toMatchObject({ status: 0 });
  });
});
