/**
 * Zod validation schemas for all forms in the Ballers application.
 * Used with React Hook Form's zodResolver.
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

export const checkoutSchema = z.object({
  // Contact / Shipping
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

  // Payment
  paymentMethod: z.enum(['card', 'paypal'], {
    required_error: 'Please select a payment method',
  }),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'card') {
    // Card number: 16 digits (spaces allowed)
    if (!data.cardNumber || data.cardNumber.replace(/\s/g, '').length < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid 16-digit card number',
        path: ['cardNumber'],
      });
    }
    if (!data.cardHolder || data.cardHolder.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Card holder name is required',
        path: ['cardHolder'],
      });
    }
    if (!data.expiryMonth || !/^(0[1-9]|1[0-2])$/.test(data.expiryMonth)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid month (MM)',
        path: ['expiryMonth'],
      });
    }
    const currentYear = new Date().getFullYear() % 100;
    if (
      !data.expiryYear ||
      !/^\d{2}$/.test(data.expiryYear) ||
      parseInt(data.expiryYear, 10) < currentYear
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid expiry year (YY)',
        path: ['expiryYear'],
      });
    }
    if (!data.cvv || !/^\d{3,4}$/.test(data.cvv)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid CVV (3-4 digits)',
        path: ['cvv'],
      });
    }
  }
});

// Country list for the checkout form
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
