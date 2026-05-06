/**
 * Axios API service with authentication interceptors.
 * Handles JWT token injection and error responses globally.
 */
import axios from 'axios';

/** Base URL for all API requests. Falls back to localhost for development. */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/** Axios instance configured with base URL and default headers */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Request interceptor: attaches JWT Bearer token from localStorage
 * to every outgoing request if available.
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
 * Response interceptor: handles 401 Unauthorized responses globally.
 * Clears stored auth data and redirects to login if token is invalid/expired.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state
      localStorage.removeItem('ballers_token');
      localStorage.removeItem('ballers_user');
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

export default api;
