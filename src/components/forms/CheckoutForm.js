/**
 * CheckoutForm — collects contact + shipping, then redirects to Airwallex Hosted Checkout.
 *
 * Flow:
 *   1. Validate contact/shipping fields (react-hook-form + zod)
 *   2. POST /api/orders/create-checkout-session { shippingAddress }
 *      -> { checkoutId, redirectUrl }
 *   3. window.location.assign(redirectUrl)
 *
 * Card data is collected on Airwallex's hosted page; this form never sees it.
 * After payment, Airwallex redirects to /checkout/complete?checkoutId=<id>,
 * which finalizes the order. The cart is cleared at that point, not here —
 * users who abandon the hosted page should still see their cart.
 */
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { makeCheckoutSchema, getCountries } from '../../utils/validation';
import { FormInput, FormSelect, SectionHeading } from './FormField';
import { createCheckoutSession } from '../../services/ordersApi';
import { useTranslation } from '../../context/LanguageContext';

const PAYMENT_PROVIDER = 'Airwallex';

/**
 * @param {object} props
 * @param {number} [props.orderTotal] - Total order amount for display on submit button
 */
export default function CheckoutForm({ orderTotal }) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutSchema = useMemo(() => makeCheckoutSchema(t), [t]);
  const countries = useMemo(() => getCountries(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      zip: '',
      country: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');

    const shippingAddress = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      address: data.address,
      city: data.city,
      zip: data.zip,
      country: data.country,
      ...(data.phone ? { phone: data.phone } : {}),
    };

    try {
      const { redirectUrl } = await createCheckoutSession({ shippingAddress });
      window.location.assign(redirectUrl);
    } catch (err) {
      const message =
        err.message ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        t('checkout.startFailed');
      setServerError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={t('checkout.title')}
      className="flex flex-col gap-8"
    >
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0
                 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414
                 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414
                 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {serverError}
        </div>
      )}

      {/* ── Section 1: Contact Info ── */}
      <section aria-labelledby="section-contact">
        <SectionHeading number="1" title={t('checkout.contactInfo')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label={t('checkout.firstName')}
            id="checkout-firstName"
            type="text"
            placeholder={t('checkout.firstNamePlaceholder')}
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <FormInput
            label={t('checkout.lastName')}
            id="checkout-lastName"
            type="text"
            placeholder={t('checkout.lastNamePlaceholder')}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
          <FormInput
            label={t('checkout.emailAddress')}
            id="checkout-email"
            type="email"
            placeholder={t('checkout.emailPlaceholder')}
            autoComplete="email"
            error={errors.email?.message}
            className="sm:col-span-2"
            {...register('email')}
          />
          <FormInput
            label={t('checkout.phoneOptional')}
            id="checkout-phone"
            type="tel"
            placeholder={t('checkout.phonePlaceholder')}
            autoComplete="tel"
            error={errors.phone?.message}
            className="sm:col-span-2"
            {...register('phone')}
          />
        </div>
      </section>

      {/* ── Section 2: Shipping Address ── */}
      <section aria-labelledby="section-shipping">
        <SectionHeading number="2" title={t('checkout.shippingAddress')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label={t('checkout.streetAddress')}
            id="checkout-address"
            type="text"
            placeholder={t('checkout.streetPlaceholder')}
            autoComplete="street-address"
            error={errors.address?.message}
            className="sm:col-span-2"
            {...register('address')}
          />
          <FormInput
            label={t('checkout.city')}
            id="checkout-city"
            type="text"
            placeholder={t('checkout.cityPlaceholder')}
            autoComplete="address-level2"
            error={errors.city?.message}
            {...register('city')}
          />
          <FormInput
            label={t('checkout.zip')}
            id="checkout-zip"
            type="text"
            placeholder={t('checkout.zipPlaceholder')}
            autoComplete="postal-code"
            error={errors.zip?.message}
            {...register('zip')}
          />
          <FormSelect
            label={t('checkout.country')}
            id="checkout-country"
            options={countries}
            error={errors.country?.message}
            className="sm:col-span-2"
            autoComplete="country"
            {...register('country')}
          />
        </div>
      </section>

      {/* ── Section 3: Payment (Airwallex Hosted Checkout) ── */}
      <section aria-labelledby="section-payment">
        <SectionHeading number="3" title={t('checkout.payment')} />

        <div
          className="flex items-start gap-3 p-4 rounded-lg border border-[#E8C547] bg-[#E8C547]/10 mb-4"
          role="status"
          aria-label={t('checkout.paymentMethodAria', { provider: PAYMENT_PROVIDER })}
        >
          <svg
            className="w-5 h-5 text-[#E8C547] flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-[#E8C547] text-sm font-semibold">
              {t('checkout.creditCard')}
            </span>
            <span className="text-xs text-[#A8B2C1]">
              {t('checkout.redirectNotice', { provider: PAYMENT_PROVIDER })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A8B2C1]">
          <svg
            className="w-4 h-4 text-[#27AE60] flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0
                 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          {t('checkout.securedBy')}{' '}
          <span className="font-semibold text-white">{PAYMENT_PROVIDER}</span>
        </div>
      </section>

      {/* ── Submit button ── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider rounded-lg hover:bg-[#D4A800] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {t('checkout.redirecting')}
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {orderTotal != null
              ? t('checkout.continueToPaymentAmount', { amount: `$${orderTotal.toFixed(2)}` })
              : t('checkout.continueToPayment')}
          </>
        )}
      </button>
    </form>
  );
}
