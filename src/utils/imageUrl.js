/**
 * Image URL helpers.
 * Backend products expose either:
 *   - `imageUrl`: a single absolute URL (current shape, e.g. Firebase Storage)
 *   - `images`: legacy array of strings (absolute or `/uploads/...` paths)
 */
import { API_BASE_URL } from '../services/api';

const API_ROOT = (API_BASE_URL || '').replace(/\/api\/?$/, '');

/**
 * Resolve a single image string to an absolute URL.
 * @param {string} src
 * @returns {string|null}
 */
export const resolveImageUrl = (src) => {
  if (!src) return null;
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  if (src.startsWith('/')) return `${API_ROOT}${src}`;
  return `${API_ROOT}/${src}`;
};

/**
 * Get the primary image URL for a product.
 * Prefers `product.imageUrl` (current backend shape); falls back to `product.images[index]`.
 * @param {{ imageUrl?: string, images?: string[] }} product
 * @param {number} [index=0]
 * @returns {string|null}
 */
export const getProductImage = (product, index = 0) => {
  if (!product) return null;
  if (index === 0 && product.imageUrl) return resolveImageUrl(product.imageUrl);
  const list = product.images;
  if (Array.isArray(list) && list.length > index) return resolveImageUrl(list[index]);
  if (index === 0 && product.imageUrl) return resolveImageUrl(product.imageUrl);
  return null;
};

/**
 * Return all resolved image URLs for a product.
 * @param {{ imageUrl?: string, images?: string[] }} product
 * @returns {string[]}
 */
export const getProductImages = (product) => {
  if (!product) return [];
  const list = Array.isArray(product.images) ? product.images : [];
  if (list.length > 0) return list.map(resolveImageUrl).filter(Boolean);
  if (product.imageUrl) {
    const resolved = resolveImageUrl(product.imageUrl);
    return resolved ? [resolved] : [];
  }
  return [];
};
