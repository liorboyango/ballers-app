/**
 * Application-wide constants.
 */

/** API base URL */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/** Available jersey sizes */
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Kit types */
export const KIT_TYPES = [
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
  { value: 'third', label: 'Third' },
];

/** World Cup groups */
export const WC_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 12;

/** Free shipping threshold */
export const FREE_SHIPPING_THRESHOLD = 100;

/** Standard shipping cost */
export const SHIPPING_COST = 9.99;

/** Tax rate (applied server-side, shown client-side for display) */
export const TAX_RATE = 0.08;

/** localStorage keys */
export const STORAGE_KEYS = {
  TOKEN: 'ballers_token',
  USER: 'ballers_user',
  GUEST_CART: 'ballers_guest_cart',
};

/** Sort options for products */
export const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A-Z' },
];
