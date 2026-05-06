/**
 * Application Constants
 * Shared constants used across the frontend.
 */

// API base URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Kit types
export const KIT_TYPES = [
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
  { value: 'third', label: 'Third' },
  { value: 'goalkeeper', label: 'Goalkeeper' },
];

// Available sizes
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// World Cup 2026 groups
export const WC_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 12;

// Price range
export const PRICE_RANGE = { min: 0, max: 300 };

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'ballers_token',
  USER: 'ballers_user',
  CART: 'ballers_cart',
};

// Navigation links
export const NAV_LINKS = [
  { label: 'Teams', path: '/teams' },
  { label: 'Shop', path: '/products' },
  { label: 'WC2026', path: '/teams' },
];

// Footer links
export const FOOTER_LINKS = {
  shop: [
    { label: 'Teams', path: '/teams' },
    { label: 'New Arrivals', path: '/products?sort=newest' },
    { label: 'Sale', path: '/products?sale=true' },
  ],
  help: [
    { label: 'FAQ', path: '/faq' },
    { label: 'Size Guide', path: '/size-guide' },
    { label: 'Returns', path: '/returns' },
  ],
  about: [
    { label: 'Our Story', path: '/about' },
    { label: 'WC 2026', path: '/wc2026' },
    { label: 'Contact', path: '/contact' },
  ],
};

// Social links
export const SOCIAL_LINKS = [
  { label: 'Instagram', url: 'https://instagram.com/ballers', icon: 'instagram' },
  { label: 'Twitter/X', url: 'https://twitter.com/ballers', icon: 'twitter' },
  { label: 'TikTok', url: 'https://tiktok.com/@ballers', icon: 'tiktok' },
];

// Toast duration
export const TOAST_DURATION = 3000;

// Scroll threshold for back-to-top button
export const SCROLL_THRESHOLD = 400;
