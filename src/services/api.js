import axios from 'axios';

/**
 * Axios instance configured for the Ballers API.
 * Base URL from environment variable with fallback to localhost.
 * Automatically attaches JWT token from localStorage.
 */
const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach JWT token
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

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth
      localStorage.removeItem('ballers_token');
      // Only redirect if not already on auth pages
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Teams API ───────────────────────────────────────────────────────────────
export const teamsAPI = {
  /**
   * Get all teams with optional filters
   * @param {Object} params - { page, limit, group, search, sort }
   */
  getAll: (params = {}) => api.get('/teams', { params }),

  /**
   * Get a single team by ID
   * @param {string} id - Team ID
   */
  getById: (id) => api.get(`/teams/${id}`),
};

// ─── Products API ─────────────────────────────────────────────────────────────
export const productsAPI = {
  /**
   * Get all products with optional filters
   * @param {Object} params - { teamId, kitType, size, minPrice, maxPrice, page, limit, sort, search, inStock }
   */
  getAll: (params = {}) => api.get('/products', { params }),

  /**
   * Get a single product by ID
   * @param {string} id - Product ID
   */
  getById: (id) => api.get(`/products/${id}`),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  /**
   * Register a new user
   * @param {Object} data - { name, email, password }
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * Login user
   * @param {Object} data - { email, password }
   */
  login: (data) => api.post('/auth/login', data),

  /**
   * Get current authenticated user
   */
  getMe: () => api.get('/auth/me'),
};

// ─── Cart API ─────────────────────────────────────────────────────────────────
export const cartAPI = {
  /**
   * Get current user's cart
   */
  getCart: () => api.get('/cart'),

  /**
   * Add item to cart
   * @param {Object} data - { productId, quantity, customization: { size, number, name } }
   */
  addToCart: (data) => api.post('/cart/add', data),

  /**
   * Update cart item
   * @param {Object} data - { itemId, quantity?, customization? }
   */
  updateCart: (data) => api.put('/cart/update', data),

  /**
   * Remove item from cart
   * @param {string} itemId - Cart item ID
   */
  removeFromCart: (itemId) => api.delete('/cart/item', { data: { itemId } }),
};

// ─── Orders API ───────────────────────────────────────────────────────────────
export const ordersAPI = {
  /**
   * Create a new order
   * @param {Object} data - { shippingAddress, paymentInfo }
   */
  createOrder: (data) => api.post('/orders/create', data),

  /**
   * Get user's orders
   * @param {Object} params - { page, limit }
   */
  getOrders: (params = {}) => api.get('/orders', { params }),

  /**
   * Get a single order by ID
   * @param {string} id - Order ID
   */
  getOrderById: (id) => api.get(`/orders/${id}`),
};

export default api;
