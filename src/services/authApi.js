/**
 * Auth API Service
 * Handles authentication-related API calls.
 */
import apiClient from './api';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - Full name
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password
 * @returns {Promise<{success: boolean, message: string, token: string, user: User}>}
 */
export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email address
 * @param {string} credentials.password - Password
 * @returns {Promise<{success: boolean, message: string, token: string, user: User}>}
 */
export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

/**
 * Get current authenticated user
 * @returns {Promise<{success: boolean, user: User}>}
 */
export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
