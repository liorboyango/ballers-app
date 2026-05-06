/**
 * Products API Service
 * Handles all product-related API calls.
 */
import apiClient from './api';

/**
 * Fetch all products with optional filters
 * @param {Object} params - Query parameters
 * @param {string} [params.teamId] - Filter by team ObjectId
 * @param {string} [params.kitType] - Filter by kit type (home|away|third)
 * @param {string} [params.size] - Filter by size (XS|S|M|L|XL|XXL)
 * @param {number} [params.minPrice] - Minimum price
 * @param {number} [params.maxPrice] - Maximum price
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=12] - Items per page
 * @param {string} [params.sort] - Sort field
 * @param {string} [params.search] - Search term
 * @param {boolean} [params.inStock] - Filter in-stock only
 * @returns {Promise<{data: Product[], pagination: Object}>}
 */
export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response.data;
};

/**
 * Fetch a single product by ID
 * @param {string} id - Product ID
 * @returns {Promise<{data: Product}>}
 */
export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

/**
 * Fetch a product by slug
 * @param {string} slug - Product slug
 * @returns {Promise<{data: Product}>}
 */
export const getProductBySlug = async (slug) => {
  const response = await apiClient.get(`/products/slug/${slug}`);
  return response.data;
};
