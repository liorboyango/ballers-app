/**
 * Tests for the useProducts hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts, useProduct } from '../../hooks/useProducts';
import * as productsApi from '../../services/productsApi';

jest.mock('../../services/productsApi');

describe('useProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches products on mount', async () => {
    const mockProducts = [
      { _id: '1', name: 'Brazil Home Kit', price: 129.99 },
      { _id: '2', name: 'Argentina Away Kit', price: 119.99 },
    ];
    productsApi.getProducts.mockResolvedValueOnce({
      data: mockProducts,
      pagination: { total: 2, page: 1, limit: 12, totalPages: 1 },
    });

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors gracefully', async () => {
    productsApi.getProducts.mockRejectedValueOnce({ message: 'Network error' });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.products).toEqual([]);
  });

  it('returns empty array when no products found', async () => {
    productsApi.getProducts.mockResolvedValueOnce({ data: [], pagination: {} });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
  });
});

describe('useProduct', () => {
  it('fetches single product by ID', async () => {
    const mockProduct = { _id: '1', name: 'Brazil Home Kit', price: 129.99 };
    productsApi.getProductById.mockResolvedValueOnce({ data: mockProduct });

    const { result } = renderHook(() => useProduct('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product).toEqual(mockProduct);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when id is not provided', async () => {
    const { result } = renderHook(() => useProduct(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(productsApi.getProductById).not.toHaveBeenCalled();
    expect(result.current.product).toBeNull();
  });
});
