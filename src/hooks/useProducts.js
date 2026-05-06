/**
 * useProducts Hook
 * Custom hook for fetching products data with loading and error states.
 */
import { useState, useEffect, useCallback } from 'react';
import { getProducts, getProductById } from '../services/productsApi';

/**
 * Hook to fetch a list of products
 * @param {Object} initialParams - Initial query parameters
 * @returns {Object} - { products, pagination, loading, error, refetch, setParams }
 */
export const useProducts = (initialParams = {}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts(params);
      setProducts(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      const msg = typeof err?.message === 'string' ? err.message : 'Failed to load products';
      setError(msg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    refetch: fetchProducts,
    setParams,
  };
};

/**
 * Hook to fetch a single product by ID
 * @param {string} id - Product ID
 * @returns {Object} - { product, loading, error, refetch }
 */
export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getProductById(id);
      setProduct(result.data || null);
    } catch (err) {
      const msg = typeof err?.message === 'string' ? err.message : 'Failed to load product';
      setError(msg);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
};

export default useProducts;
