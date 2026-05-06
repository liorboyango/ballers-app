/**
 * Ballers API Service
 * Axios instance configured with base URL and auth interceptors.
 * All API calls go through this service.
 */
import axios from 'axios';

// Base URL from environment variable with fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Axios instance with default configuration.
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - attach auth token to every request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ballers_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle global errors.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      localStorage.removeItem('ballers_token');
      localStorage.removeItem('ballers_user');
      delete api.defaults.headers.common['Authorization'];
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Teams API ───────────────────────────────────────────────────────────────

/**
 * Fetch all teams.
 * @returns {Promise<Array>} List of teams
 */
export const getTeams = () => api.get('/teams');

/**
 * Fetch a single team by ID.
 * @param {string} teamId
 * @returns {Promise<Object>} Team data
 */
export const getTeamById = (teamId) => api.get(`/teams/${teamId}`);

// ─── Products API ─────────────────────────────────────────────────────────────

/**
 * Fetch products with optional filters.
 * @param {Object} params - { teamId, kitType, size, page, limit }
 * @returns {Promise<Object>} { products, total, page, limit }
 */
export const getProducts = (params = {}) => api.get('/products', { params });

/**
 * Fetch a single product by ID.
 * @param {string} productId
 * @returns {Promise<Object>} Product data
 */
export const getProductById = (productId) => api.get(`/products/${productId}`);

// ─── Cart API ─────────────────────────────────────────────────────────────────

/**
 * Get the current user's cart.
 * @returns {Promise<Object>} Cart data
 */
export const getCart = () => api.get('/cart');

/**
 * Add an item to the cart.
 * @param {Object} item - { productId, size, quantity, customization }
 * @returns {Promise<Object>} Updated cart
 */
export const addToCartAPI = (item) => api.post('/cart/add', item);

/**
 * Update a cart item.
 * @param {string} itemId
 * @param {Object} updates - { quantity, customization }
 * @returns {Promise<Object>} Updated cart
 */
export const updateCartItem = (itemId, updates) => api.put(`/cart/update/${itemId}`, updates);

/**
 * Remove an item from the cart.
 * @param {string} itemId
 * @returns {Promise<Object>} Updated cart
 */
export const removeCartItem = (itemId) => api.delete(`/cart/item/${itemId}`);

// ─── Orders API ───────────────────────────────────────────────────────────────

/**
 * Create a new order.
 * @param {Object} orderData - { items, billing, shipping, payment }
 * @returns {Promise<Object>} Created order
 */
export const createOrder = (orderData) => api.post('/orders', orderData);

/**
 * Get the current user's orders.
 * @returns {Promise<Array>} List of orders
 */
export const getOrders = () => api.get('/orders');

/**
 * Get a single order by ID.
 * @param {string} orderId
 * @returns {Promise<Object>} Order data
 */
export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

// ─── Auth API ─────────────────────────────────────────────────────────────────

/**
 * Login with email and password.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { token, user }
 */
export const loginUser = (credentials) => api.post('/auth/login', credentials);

/**
 * Register a new user.
 * @param {Object} userData - { name, email, password }
 * @returns {Promise<Object>} { token, user }
 */
export const registerUser = (userData) => api.post('/auth/register', userData);

export default api;
