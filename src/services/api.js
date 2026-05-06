/**
 * Axios API Service
 * Central Axios instance with interceptors for auth, error handling, and base URL configuration.
 */
import axios from 'axios';

// Base URL from environment variable, fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Create Axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - attach JWT token to every request
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ballers_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle common error cases
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized - clear token and redirect to login
      if (status === 401) {
        localStorage.removeItem('ballers_token');
        localStorage.removeItem('ballers_user');
        // Dispatch custom event so AuthContext can react
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Normalize error message
      const message =
        data?.error ||
        data?.message ||
        (data?.errors && data.errors[0]?.message) ||
        'An unexpected error occurred';

      return Promise.reject({
        status,
        message,
        errors: data?.errors || [],
        originalError: error,
      });
    }

    if (error.request) {
      // Network error - no response received
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        errors: [],
        originalError: error,
      });
    }

    return Promise.reject({
      status: -1,
      message: error.message || 'An unexpected error occurred',
      errors: [],
      originalError: error,
    });
  }
);

export default apiClient;
export { API_BASE_URL };
