/**
 * Utility functions for formatting values in the UI.
 */

/**
 * Format a number as currency (USD).
 * @param {number} amount
 * @param {string} [currency='USD']
 * @returns {string} formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string to a human-readable format.
 * @param {string|Date} date
 * @param {object} [options] - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
};

/**
 * Truncate a string to a maximum length with ellipsis.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (str, maxLength = 100) => {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Build a full image URL from a relative path or return as-is if absolute.
 * @param {string} imagePath
 * @returns {string}
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${apiUrl}${imagePath}`;
};
