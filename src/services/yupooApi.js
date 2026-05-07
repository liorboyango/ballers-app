/**
 * Yupoo API Service
 * Handles calls to the admin Yupoo crawler endpoints.
 */
import apiClient from './api';

/**
 * Fetch the Yupoo category tree.
 * GET /admin/yupoo/categories
 * @returns {Promise<{data: {categories: CategoryNode[], cached: boolean, cachedAt: string|null}}>}
 */
export const getYupooCategories = () =>
  apiClient.get('/admin/yupoo/categories').then((res) => res.data);

/**
 * Start a crawl job for the selected categories.
 * POST /admin/yupoo/crawl
 * @param {Object[]} selectedCategories - Array of CategoryNode objects to crawl
 * @param {Object} defaults - Defaults applied to all imported products
 * @param {number} defaults.price - Default price
 * @param {string} defaults.kitType - Default kit type (home|away|third|goalkeeper)
 * @param {number} defaults.stock - Default stock quantity
 * @param {string[]} defaults.sizes - Default sizes array
 * @returns {Promise<{data: {created: number, skipped: number, errors: CrawlError[], ids: string[]}}>}
 */
export const crawlCategories = (selectedCategories, defaults) =>
  apiClient
    .post('/admin/yupoo/crawl', { selectedCategories, defaults }, { timeout: 300000 })
    .then((res) => res.data);
