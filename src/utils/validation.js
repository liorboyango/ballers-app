/**
 * Client-side validation utilities using Zod schemas.
 * Used for form validation across the application.
 */
import { z } from 'zod';

// ─── Customization Schema ─────────────────────────────────────────────────────
export const customizationSchema = z.object({
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
    errorMap: () => ({ message: 'Please select a valid size' }),
  }),
  number: z
    .string()
    .optional()
    .refine(
      (val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 99),
      { message: 'Jersey number must be between 1 and 99' }
    ),
  name: z
    .string()
    .max(20, 'Name must be 20 characters or less')
    .regex(/^[a-zA-Z0-9\s'-]*$/, 'Name contains invalid characters')
    .optional(),
});

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be 50 characters or less'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ─── Checkout Schema ──────────────────────────────────────────────────────────
export const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(1, 'City is required'),
  zip: z.string().min(3, 'Please enter a valid ZIP/postal code'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  paymentMethod: z.enum(['card', 'paypal']),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
});

/**
 * Validate data against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {Object} data - Data to validate
 * @returns {{ success: boolean, errors: Object }}
 */
export const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, errors: {}, data: result.data };
  }

  const errors = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return { success: false, errors, data: null };
};
