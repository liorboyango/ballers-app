/**
 * CheckoutForm component.
 * Multi-section form: Contact Info, Shipping Address, Payment.
 * Uses React Hook Form + Zod for validation.
 * Submits to POST /api/orders/create.
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { checkoutSchema, COUNTRIES } from '../../utils/validation';
import { FormInput, FormSelect, SectionHeading } from './FormField';
import { useCart } from '../../hooks/useCart';
import api from '../../services/api';

/**
 * @param {object} props
 * @param {function} [props.onOrderSuccess] - Called with order data after successful placement
 */
export default function CheckoutForm({ onOrderSuccess }) {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [serverError, setServerError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
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
      paymentMethod: 'card',
      cardNumber: '',
      cardHolder: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
    },
  });

  // Keep local state in sync with form value
  const watchedPayment = watch('paymentMethod', 'card');

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setValue('paymentMethod', method, { shouldValidate: true });
  };

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          address: data.address,
          city: data.city,
          zip: data.zip,
          country: data.country,
          ...(data.phone ? { phone: data.phone } : {}),
        },
        paymentInfo: {
          method: data.paymentMethod,
          ...(data.paymentMethod === 'card'
            ? {
                cardNumber: data.cardNumber?.replace(/\s/g, ''),
                cardHolder: data.cardHolder,
                expiryMonth: data.expiryMonth,
                expiryYear: data.expiryYear,
              }
            : {}),
        },
      };

      const response = await api.post('/orders/create', payload);
      const { order } = response.data;

      // Clear cart after successful order
      if (clearCart) clearCart();

      if (onOrderSuccess) {
        onOrderSuccess(order);
      } else {
        navigate(`/order-success/${order.id || order._id}`);
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to place order. Please try again.';
      setServerError(message);
      // Scroll to top of form to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Checkout form"
      className="flex flex-col gap-8"
    >
      {/* Server-level error */}
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
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {serverError}
        </div>
      )}

      {/* ── Section 1: Contact Info ── */}
      <section aria-labelledby="section-contact">
        <SectionHeading number="1" title="Contact Info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="First name"
            id="checkout-firstName"
            type="text"
            placeholder="John"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <FormInput
            label="Last name"
            id="checkout-lastName"
            type="text"
            placeholder="Doe"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
          <FormInput
            label="Email address"
            id="checkout-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            className="sm:col-span-2"
            {...register('email')}
          />
          <FormInput
            label="Phone (optional)"
            id="checkout-phone"
            type="tel"
            placeholder="+1 555 000 0000"
            autoComplete="tel"
            error={errors.phone?.message}
            className="sm:col-span-2"
            {...register('phone')}
          />
        </div>
      </section>

      {/* ── Section 2: Shipping Address ── */}
      <section aria-labelledby="section-shipping">
        <SectionHeading number="2" title="Shipping Address" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Street address"
            id="checkout-address"
            type="text"
            placeholder="123 Main St"
            autoComplete="street-address"
            error={errors.address?.message}
            className="sm:col-span-2"
            {...register('address')}
          />
          <FormInput
            label="City"
            id="checkout-city"
            type="text"
            placeholder="New York"
            autoComplete="address-level2"
            error={errors.city?.message}
            {...register('city')}
          />
          <FormInput
            label="ZIP / Postal code"
            id="checkout-zip"
            type="text"
            placeholder="10001"
            autoComplete="postal-code"
            error={errors.zip?.message}
            {...register('zip')}
          />
          <FormSelect
            label="Country"
            id="checkout-country"
            options={COUNTRIES}
            error={errors.country?.message}
            className="sm:col-span-2"
            autoComplete="country"
            {...register('country')}
          />
        </div>
      </section>

      {/* ── Section 3: Payment ── */}
      <section aria-labelledby="section-payment">
        <SectionHeading number="3" title="Payment" />

        {/* Payment method selector */}
        <div className="flex gap-3 mb-5" role="group" aria-label="Payment method">
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('card')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              watchedPayment === 'card'
                ? 'border-[#E8C547] bg-[#E8C547]/10 text-[#E8C547]'
                : 'border-[#2A3550] text-[#A8B2C1] hover:border-[#E8C547]/50'
            }`}
            aria-pressed={watchedPayment === 'card'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Credit Card
          </button>
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('paypal')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              watchedPayment === 'paypal'
                ? 'border-[#E8C547] bg-[#E8C547]/10 text-[#E8C547]'
                : 'border-[#2A3550] text-[#A8B2C1] hover:border-[#E8C547]/50'
            }`}
            aria-pressed={watchedPayment === 'paypal'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
            </svg>
            PayPal
          </button>
        </div>

        {/* Card fields */}
        {watchedPayment === 'card' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="checkout-cardNumber" className="text-sm font-medium text-white">
                Card number
              </label>
              <input
                id="checkout-cardNumber"
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                autoComplete="cc-number"
                aria-invalid={!!errors.cardNumber}
                aria-describedby={errors.cardNumber ? 'checkout-cardNumber-error' : undefined}
                className={`w-full px-4 py-3 rounded-lg bg-[#1A1A2E] border text-white placeholder-[#A8B2C1] text-sm font-mono transition-colors focus:outline-none focus:ring-1 ${
                  errors.cardNumber
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-[#2A3550] focus:border-[#E8C547] focus:ring-[#E8C547]/30'
                }`}
                {...register('cardNumber', {
                  onChange: (e) => {
                    e.target.value = formatCardNumber(e.target.value);
                  },
                })}
              />
              {errors.cardNumber && (
                <p id="checkout-cardNumber-error" role="alert" className="text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.cardNumber.message}
                </p>
              )}
            </div>

            <FormInput
              label="Card holder name"
              id="checkout-cardHolder"
              type="text"
              placeholder="JOHN DOE"
              autoComplete="cc-name"
              error={errors.cardHolder?.message}
              {...register('cardHolder')}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Month (MM)"
                id="checkout-expiryMonth"
                type="text"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                autoComplete="cc-exp-month"
                error={errors.expiryMonth?.message}
                {...register('expiryMonth')}
              />
              <FormInput
                label="Year (YY)"
                id="checkout-expiryYear"
                type="text"
                inputMode="numeric"
                placeholder="YY"
                maxLength={2}
                autoComplete="cc-exp-year"
                error={errors.expiryYear?.message}
                {...register('expiryYear')}
              />
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-cvv" className="text-sm font-medium text-white">
                  CVV
                </label>
                <input
                  id="checkout-cvv"
                  type="password"
                  inputMode="numeric"
                  placeholder="•••"
                  maxLength={4}
                  autoComplete="cc-csc"
                  aria-invalid={!!errors.cvv}
                  aria-describedby={errors.cvv ? 'checkout-cvv-error' : undefined}
                  className={`w-full px-4 py-3 rounded-lg bg-[#1A1A2E] border text-white placeholder-[#A8B2C1] text-sm transition-colors focus:outline-none focus:ring-1 ${
                    errors.cvv
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-[#2A3550] focus:border-[#E8C547] focus:ring-[#E8C547]/30'
                  }`}
                  {...register('cvv')}
                />
                {errors.cvv && (
                  <p id="checkout-cvv-error" role="alert" className="text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.cvv.message}
                  </p>
                )}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-[#A8B2C1] mt-1">
              <svg className="w-4 h-4 text-[#27AE60] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your payment information is encrypted and secure.
            </div>
          </div>
        )}

        {/* PayPal placeholder */}
        {watchedPayment === 'paypal' && (
          <div className="flex flex-col items-center gap-4 py-8 px-6 rounded-lg border border-[#2A3550] bg-[#16213E]">
            <svg className="w-16 h-16 text-[#A8B2C1]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
            </svg>
            <p className="text-[#A8B2C1] text-sm text-center">
              You will be redirected to PayPal to complete your payment after clicking "Place Order".
            </p>
          </div>
        )}
      </section>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider rounded-lg hover:bg-[#D4A800] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Placing Order...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Place Order
          </>
        )}
      </button>
    </form>
  );
}
