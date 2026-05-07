/**
 * Yupoo API Service
 * Handles calls to the admin Yupoo crawler endpoints.
 *
 * Endpoints:
 *   GET  /admin/yupoo/categories   → category tree
 *   POST /admin/yupoo/crawl        → bulk import job
 */
import apiClient from './api';

/**
 * Fetch the Yupoo category tree from the backend.
 *
 * The backend fetches https://micom0078.x.yupoo.com/categories/ and parses
 * the HTML into a structured tree. Results may be cached server-side.
 *
 * @returns {Promise<{
 *   categories: CategoryNode[],
 *   cached: boolean,
 *   cachedAt: string | null
 * }>}
 *
 * @typedef {Object} CategoryNode
 * @property {string} id          - Category ID (from Yupoo URL path)
 * @property {string} name        - Human-readable category name
 * @property {string} path        - URL path on Yupoo (e.g. "/categories/5066922")
 * @property {number} [itemCount] - Number of albums/products in the category
 * @property {CategoryNode[]} subcategories - Child categories
 */
export const getYupooCategories = () =>
  apiClient
    .get('/admin/yupoo/categories')
    .then((res) => {
      // Normalize the response: backend may return the tree at different paths
      const payload = res?.data ?? res;
      return {
        categories: payload?.categories ?? payload?.data?.categories ?? [],
        cached: payload?.cached ?? false,
        cachedAt: payload?.cachedAt ?? payload?.data?.cachedAt ?? null,
      };
    });

/**
 * Start a crawl / import job for the selected categories.
 *
 * The backend will:
 * 1. For each selected category, fetch the Yupoo album page
 * 2. Parse album titles and image URLs
 * 3. Create products via POST /api/products with images array
 * 4. Return a summary of created / skipped / errored products
 *
 * @param {CategoryNode[]} selectedCategories - Array of category nodes to crawl
 * @param {ImportDefaults}  defaults          - Default product fields
 * @returns {Promise<CrawlResult>}
 *
 * @typedef {Object} ImportDefaults
 * @property {number}   price   - Default price (USD)
 * @property {string}   kitType - Kit type: home|away|third|goalkeeper
 * @property {number}   stock   - Default stock quantity
 * @property {string[]} sizes   - Default sizes array
 *
 * @typedef {Object} CrawlResult
 * @property {number}      created  - Number of products created
 * @property {number}      skipped  - Number skipped (duplicates)
 * @property {string[]}    ids      - IDs of created products
 * @property {CrawlError[]} errors  - Per-item errors
 *
 * @typedef {Object} CrawlError
 * @property {string} category - Category name or ID
 * @property {string} message  - Error description
 */
export const crawlCategories = (selectedCategories, defaults) =>
  apiClient
    .post(
      '/admin/yupoo/crawl',
      { selectedCategories, defaults },
      // Long timeout — crawl jobs can take several minutes
      { timeout: 300_000 }
    )
    .then((res) => res?.data ?? res);
