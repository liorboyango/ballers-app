/**
 * Zod validation schemas for all forms in the Ballers application.
 * Used with React Hook Form's zodResolver.
 *
 * Note: Card field validation has been removed from checkoutSchema.
 * Rapyd's RapydCardElement handles all card validation client-side in a
 * PCI-compliant manner via a hosted iframe. The checkout form only
 * validates contact/shipping fields.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

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

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be less than 100 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ---------------------------------------------------------------------------
// Checkout schema
// ---------------------------------------------------------------------------
// Card fields are intentionally excluded — Rapyd's RapydCardElement handles
// card number, expiry, and CVV validation in a PCI-compliant hosted iframe.
// The checkout schema only covers contact and shipping fields.

export const checkoutSchema = z.object({
  // Contact
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[\d\s\-()]{7,20}$/.test(val),
      'Please enter a valid phone number'
    ),
  // Shipping
  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address is too long'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City is too long'),
  zip: z
    .string()
    .min(1, 'ZIP / Postal code is required')
    .max(20, 'ZIP code is too long'),
  country: z
    .string()
    .min(1, 'Country is required'),
});

// Country list for the checkout form select input
export const COUNTRIES = [
  { value: '', label: 'Select country...' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'BR', label: 'Brazil' },
  { value: 'AR', label: 'Argentina' },
  { value: 'MX', label: 'Mexico' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'PT', label: 'Portugal' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'AT', label: 'Austria' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'MA', label: 'Morocco' },
  { value: 'SN', label: 'Senegal' },
  { value: 'OTHER', label: 'Other' },
];
