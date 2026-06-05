/**
 * Zod validation schemas for all forms in the Ballers application.
 * Used with React Hook Form's zodResolver.
 *
 * Note: Card field validation has been removed from checkoutSchema.
 * Airwallex's hosted checkout handles all card validation in a
 * PCI-compliant manner on its own payment page. The checkout form only
 * validates contact/shipping fields.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------
// Factory functions take the translation function `t` so validation messages
// follow the active language. Static exports below use an identity fallback
// (returns the key) and are kept for any non-localized callers/tests.

const identity = (key) => key;

export const makeLoginSchema = (t = identity) =>
  z.object({
    email: z
      .string()
      .min(1, t('auth.validationEmailRequired'))
      .email(t('auth.validationEmail')),
    password: z
      .string()
      .min(1, t('auth.validationPasswordRequired'))
      .min(6, t('auth.validationPasswordMin')),
  });

export const makeRegisterSchema = (t = identity) =>
  z
    .object({
      name: z
        .string()
        .min(1, t('auth.validationNameRequired'))
        .min(2, t('auth.validationNameMin'))
        .max(50, t('auth.validationNameMax')),
      email: z
        .string()
        .min(1, t('auth.validationEmailRequired'))
        .email(t('auth.validationEmail')),
      password: z
        .string()
        .min(1, t('auth.validationPasswordRequired'))
        .min(6, t('auth.validationPasswordMin'))
        .max(100, t('auth.validationPasswordMax')),
      confirmPassword: z.string().min(1, t('auth.validationConfirmRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validationPasswordsMatch'),
      path: ['confirmPassword'],
    });

export const loginSchema = makeLoginSchema();

export const registerSchema = makeRegisterSchema();

// ---------------------------------------------------------------------------
// Checkout schema
// ---------------------------------------------------------------------------
// Card fields are intentionally excluded — Airwallex's hosted checkout handles
// card number, expiry, and CVV validation in a PCI-compliant manner on its own
// payment page. The checkout schema only covers contact and shipping fields.

export const makeCheckoutSchema = (t = identity) =>
  z.object({
    // Contact
    firstName: z
      .string()
      .min(1, t('checkout.valFirstNameRequired'))
      .max(50, t('checkout.valFirstNameMax')),
    lastName: z
      .string()
      .min(1, t('checkout.valLastNameRequired'))
      .max(50, t('checkout.valLastNameMax')),
    email: z
      .string()
      .min(1, t('checkout.valEmailRequired'))
      .email(t('checkout.valEmailInvalid')),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[+]?[\d\s\-()]{7,20}$/.test(val),
        t('checkout.valPhoneInvalid')
      ),
    // Shipping
    address: z
      .string()
      .min(1, t('checkout.valAddressRequired'))
      .max(200, t('checkout.valAddressMax')),
    city: z
      .string()
      .min(1, t('checkout.valCityRequired'))
      .max(100, t('checkout.valCityMax')),
    zip: z
      .string()
      .min(1, t('checkout.valZipRequired'))
      .max(20, t('checkout.valZipMax')),
    country: z.string().min(1, t('checkout.valCountryRequired')),
  });

export const checkoutSchema = makeCheckoutSchema();

// Country options for the checkout form select input. The placeholder and
// country labels are localized via `t`; values stay stable (ISO codes).
export const getCountries = (t = identity) => [
  { value: '', label: t('checkout.selectCountry') },
  { value: 'IL', label: t('checkout.countryIsrael') },
];

// Static country list kept for non-localized callers/tests.
export const COUNTRIES = [
  { value: '', label: 'Select country...' },
  { value: 'IL', label: 'Israel' },
  // { value: 'US', label: 'United States' },
  // { value: 'GB', label: 'United Kingdom' },
  // { value: 'CA', label: 'Canada' },
  // { value: 'AU', label: 'Australia' },
  // { value: 'DE', label: 'Germany' },
  // { value: 'FR', label: 'France' },
  // { value: 'ES', label: 'Spain' },
  // { value: 'IT', label: 'Italy' },
  // { value: 'BR', label: 'Brazil' },
  // { value: 'AR', label: 'Argentina' },
  // { value: 'MX', label: 'Mexico' },
  // { value: 'JP', label: 'Japan' },
  // { value: 'KR', label: 'South Korea' },
  // { value: 'NL', label: 'Netherlands' },
  // { value: 'PT', label: 'Portugal' },
  // { value: 'BE', label: 'Belgium' },
  // { value: 'CH', label: 'Switzerland' },
  // { value: 'SE', label: 'Sweden' },
  // { value: 'NO', label: 'Norway' },
  // { value: 'DK', label: 'Denmark' },
  // { value: 'PL', label: 'Poland' },
  // { value: 'CZ', label: 'Czech Republic' },
  // { value: 'AT', label: 'Austria' },
  // { value: 'NZ', label: 'New Zealand' },
  // { value: 'ZA', label: 'South Africa' },
  // { value: 'NG', label: 'Nigeria' },
  // { value: 'MA', label: 'Morocco' },
  // { value: 'SN', label: 'Senegal' },
  // { value: 'OTHER', label: 'Other' },
];
