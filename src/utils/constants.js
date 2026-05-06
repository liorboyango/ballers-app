/**
 * Application-wide constants for the Ballers app.
 */

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const KIT_TYPES = [
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
  { value: 'third', label: 'Third' },
];

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A-Z' },
];

export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_COST = 9.99;
export const TAX_RATE = 0.08;

export const MAX_JERSEY_NUMBER = 99;
export const MIN_JERSEY_NUMBER = 1;
export const MAX_NAME_LENGTH = 20;

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const ROUTES = {
  HOME: '/',
  TEAMS: '/teams',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/product/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  LOGIN: '/login',
  REGISTER: '/register',
  ACCOUNT: '/account',
};
