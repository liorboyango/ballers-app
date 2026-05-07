/**
 * Yupoo API Service
 * Handles calls to the admin Yupoo crawler endpoints.
 *
 * Endpoints (per backend API contract):
 *   GET  /admin/yupoo-categories   → category tree
 *   POST /admin/crawl-products     → bulk import (sync, may take several minutes)
 *
 * Authentication:
 *   Both endpoints require a valid admin JWT token.
 *   The token is automatically attached by the axios request interceptor
 *   in src/services/api.js (reads from localStorage 'ballers_token').
 *   Non-admin requests will receive a 403 and are caught by the response
 *   interceptor which dispatches 'auth:logout'.
 */
import apiClient from './api';

/**
 * Fetch the Yupoo category tree from the backend.
 *
 * The backend fetches https://micom0078.x.yupoo.com/categories/ and parses
 * the HTML into a structured tree. Results are cached server-side (1 hour).
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
 * @param {boolean} [refresh=false] - Bypass server-side 1h cache (passes ?refresh=true)
 * @returns {Promise<{ categories: CategoryNode[], cached: boolean, cachedAt: string|null }>}
 *
 * @typedef {Object} CategoryNode
 * @property {string}        id               - Category ID extracted from Yupoo URL path
 * @property {string}        name             - Human-readable category name
 * @property {string}        path             - URL path on Yupoo (e.g. /categories/5066922)
 * @property {number}        [subcategoryCount] - Number of direct subcategories
 * @property {number}        [itemCount]      - Alias; number of albums/products
 * @property {CategoryNode[]} subcategories   - Child categories (empty array if none)
 * @property {boolean}       [isSubCate]      - True when this is a subcategory node
 */
export const getYupooCategories = (refresh = false) =>
  apiClient
    .get('/admin/yupoo-categories', {
      params: refresh ? { refresh: 'true' } : undefined,
    })
    .then((res) => {
      // Normalize: backend wraps the array in res.data.data
      const payload = res?.data ?? res;

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

      const rawCategories = payload?.data ?? payload?.categories ?? [];

      return {
        categories: Array.isArray(rawCategories)
          ? rawCategories.map(normalizeNode)
          : [],
        cached: payload?.cached ?? false,
        cachedAt: payload?.fetchedAt ?? payload?.cachedAt ?? null,
      };
    });

/**
 * Start a synchronous crawl / bulk-import job for the selected categories.
 *
 * The backend will, for each selected category:
 *  1. Fetch the Yupoo album listing page
 *  2. Parse album titles and image URLs (.showalbum__imagecardwrap img[data-src])
 *  3. Create products via POST /api/products with images[] (bulk-mode)
 *  4. Return a summary of created / skipped / errored products
 *
 * ⚠ This call is SYNCHRONOUS and may take several minutes for large batches.
 *   A 5-minute client timeout is set. Users should not close the tab.
 *
 * Backend API endpoint: POST /api/admin/crawl-products
 *
 * Request body:
 * {
 *   selectedCategories: CategoryNode[],  // flat or nested — backend flattens internally
 *   defaults?: ImportDefaults
 * }
 *
 * Response:
 * {
 *   status: 'success',
 *   data: {
 *     created: number,
 *     skipped: number,
 *     errors: [{ category, product?, message }],
 *     ids:    string[]
 *   }
 * }
 *
 * @param {CategoryNode[]} selectedCategories - Categories (with nested subcategories) to crawl
 * @param {ImportDefaults}  defaults          - Default product field values
 * @returns {Promise<CrawlResult>}
 *
 * @typedef {Object} ImportDefaults
 * @property {number}   price         - Default price in USD (must be > 0)
 * @property {string}   kitType       - Kit type: 'home' | 'away' | 'third' | 'goalkeeper'
 * @property {number}   stock         - Default stock quantity (must be >= 0)
 * @property {string[]} sizes         - Default sizes array (must have at least 1)
 * @property {boolean}  [customizable] - Whether product is customizable (default: true)
 *
 * @typedef {Object} CrawlResult
 * @property {number}       created  - Number of products successfully created
 * @property {number}       skipped  - Number skipped (duplicate name detected)
 * @property {string[]}     ids      - Document IDs of created products
 * @property {CrawlError[]} errors   - Per-item error details
 *
 * @typedef {Object} CrawlError
 * @property {string} category - Category name or ID where the error occurred
 * @property {string} [product] - Album/product title if known
 * @property {string} message  - Human-readable error description
 */
export const crawlCategories = (selectedCategories, defaults) =>
  apiClient
    .post(
      '/admin/crawl-products',
      {
        selectedCategories,
        defaults: {
          price:        defaults.price,
          kitType:      defaults.kitType,
          stock:        defaults.stock,
          sizes:        defaults.sizes,
          customizable: defaults.customizable ?? true,
        },
      },
      // Long timeout — synchronous crawl jobs can take several minutes
      { timeout: 300_000 }
    )
    .then((res) => res?.data ?? res);
