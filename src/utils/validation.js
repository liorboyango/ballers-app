/**
 * Client-side validation schemas using Zod.
 * Used with React Hook Form for form validation.
 */
import { z } from 'zod';

/** Login form schema */
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

/** Registration form schema */
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
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be less than 100 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** Checkout shipping address schema */
export const shippingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
});

/** Payment info schema */
export const paymentSchema = z.object({
  method: z.enum(['card', 'paypal']),
  cardNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{16}$/.test(val.replace(/\s/g, '')),
      'Card number must be 16 digits'
    ),
  cardHolder: z.string().optional(),
  expiryMonth: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(0[1-9]|1[0-2])$/.test(val),
      'Invalid expiry month (MM)'
    ),
  expiryYear: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{4}$/.test(val),
      'Invalid expiry year (YYYY)'
    ),
  cvv: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{3,4}$/.test(val),
      'CVV must be 3 or 4 digits'
    ),
});

/** Jersey customization schema */
export const customizationSchema = z.object({
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
    errorMap: () => ({ message: 'Please select a size' }),
  }),
  number: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) => !val || (Number(val) >= 1 && Number(val) <= 99),
      'Jersey number must be between 1 and 99'
    ),
  name: z
    .string()
    .max(20, 'Name must be 20 characters or less')
    .optional(),
});
