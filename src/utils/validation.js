/**
 * Validation Schemas
 * Zod schemas for form validation throughout the app.
 */
import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

/**
 * Login form validation schema.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Registration form validation schema.
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Checkout Schema ──────────────────────────────────────────────────────────

/**
 * Checkout form validation schema.
 */
export const checkoutSchema = z.object({
  // Contact info
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),

  // Shipping
  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address is too long'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City name is too long'),
  zipCode: z
    .string()
    .min(1, 'ZIP code is required')
    .regex(/^[A-Z0-9\s-]{3,10}$/i, 'Please enter a valid ZIP/postal code'),
  country: z
    .string()
    .min(1, 'Country is required'),

  // Payment (basic validation - in production use Stripe)
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, 'Please enter a valid 16-digit card number'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Please enter a valid expiry date (MM/YY)'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'Please enter a valid CVV'),
});

// ─── Customization Schema ─────────────────────────────────────────────────────

/**
 * Jersey customization validation schema.
 */
export const customizationSchema = z.object({
  playerName: z
    .string()
    .max(20, 'Name must be 20 characters or less')
    .regex(/^[A-Za-z\s'-]*$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional()
    .or(z.literal('')),
  playerNumber: z
    .string()
    .regex(/^([1-9]|[1-9][0-9]|99)?$/, 'Number must be between 1 and 99')
    .optional()
    .or(z.literal('')),
});

/**
 * Sanitize a string input to prevent XSS.
 * @param {string} input
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Format a card number with spaces every 4 digits.
 * @param {string} value
 * @returns {string} Formatted card number
 */
export function formatCardNumber(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  return parts.length ? parts.join(' ') : value;
}

/**
 * Format expiry date as MM/YY.
 * @param {string} value
 * @returns {string} Formatted expiry date
 */
export function formatExpiryDate(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
  }
  return v;
}
