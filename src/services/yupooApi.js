/**
 * Yupoo API Service
 * Handles calls to the admin Yupoo crawler endpoints.
 *
 * Endpoints (per backend API contract):
 *   GET  /admin/yupoo-categories          → category tree
 *   POST /admin/yupoo/crawl               → bulk import job
 */
import apiClient from './api';

/**
 * Fetch the Yupoo category tree from the backend.
 *
 * The backend fetches https://micom0078.x.yupoo.com/categories/ and parses
 * the HTML into a structured tree. Results may be cached server-side (1h).
 *
 * Backend response shape:
 * {
 *   status: string,
 *   fetchedAt: string,
 *   cached: boolean,
 *   count: number,
 *   data: [
 *     { id, name, path, subcategoryCount, subcategories: [{id, name, path, isSubCate}] }
 *   ]
 * }
 *
 * @param {boolean} [refresh=false] - Bypass server-side cache
 * @returns {Promise<{ categories: CategoryNode[], cached: boolean, cachedAt: string|null }>}
 *
 * @typedef {Object} CategoryNode
 * @property {string} id                    - Category ID (from Yupoo URL path)
 * @property {string} name                  - Human-readable category name
 * @property {string} path                  - URL path on Yupoo
 * @property {number} [subcategoryCount]    - Number of subcategories
 * @property {number} [itemCount]           - Number of albums/products (alias)
 * @property {CategoryNode[]} subcategories - Child categories
 */
export const getYupooCategories = (refresh = false) =>
  apiClient
    .get('/admin/yupoo-categories', {
      params: refresh ? { refresh: 'true' } : undefined,
    })
    .then((res) => {
      // Normalize the response: backend returns categories at res.data.data
      const payload = res?.data ?? res;

      // Normalize subcategory count to itemCount for tree display
      const normalizeNode = (node) => ({
        ...node,
        itemCount:
          node.itemCount ??
          node.subcategoryCount ??
          (Array.isArray(node.subcategories) ? node.subcategories.length : 0),
        subcategories: Array.isArray(node.subcategories)
          ? node.subcategories.map(normalizeNode)
          : [],
      });

      const rawCategories =
        payload?.data ??
        payload?.categories ??
        [];

      return {
        categories: Array.isArray(rawCategories)
          ? rawCategories.map(normalizeNode)
          : [],
        cached: payload?.cached ?? false,
        cachedAt: payload?.fetchedAt ?? payload?.cachedAt ?? null,
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
 * Request body:
 * {
 *   selectedCategories: CategoryNode[],  // categories to crawl
 *   defaults: ImportDefaults             // default product fields
 * }
 *
 * @param {CategoryNode[]} selectedCategories - Array of category nodes to crawl
 * @param {ImportDefaults}  defaults          - Default product fields
 * @returns {Promise<CrawlResult>}
 *
 * @typedef {Object} ImportDefaults
 * @property {number}   price       - Default price (USD)
 * @property {string}   kitType     - Kit type: home|away|third|goalkeeper
 * @property {number}   stock       - Default stock quantity
 * @property {string[]} sizes       - Default sizes array
 * @property {boolean}  [customizable] - Whether product is customizable (default: true)
 *
 * @typedef {Object} CrawlResult
 * @property {number}       created  - Number of products created
 * @property {number}       skipped  - Number skipped (duplicates)
 * @property {string[]}     ids      - IDs of created products
 * @property {CrawlError[]} errors   - Per-item errors
 *
 * @typedef {Object} CrawlError
 * @property {string} category - Category name or ID
 * @property {string} message  - Error description
 */
export const crawlCategories = (selectedCategories, defaults) =>
  apiClient
    .post(
      '/admin/yupoo/crawl',
      {
        selectedCategories,
        defaults: {
          price: defaults.price,
          kitType: defaults.kitType,
          stock: defaults.stock,
          sizes: defaults.sizes,
          customizable: defaults.customizable ?? true,
        },
      },
      // Long timeout — crawl jobs can take several minutes
      { timeout: 300_000 }
    )
    .then((res) => res?.data ?? res);
