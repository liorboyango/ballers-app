/**
 * CheckoutForm component with Stripe Elements integration.
 * Multi-section form: Contact Info, Shipping Address, Payment (Stripe CardElement).
 * Uses React Hook Form + Zod for contact/shipping validation.
 * Uses Stripe's CardElement for secure PCI-compliant card collection.
 *
 * Flow:
 *   1. Validate contact/shipping fields with react-hook-form + zod
 *   2. POST /api/orders/create-payment-intent -> get {client_secret}
 *   3. stripe.confirmCardPayment(client_secret, {payment_method: {card: cardElement}})
 *   4. On success: POST /api/orders/create with {paymentIntentId, shippingAddress}
 *   5. Redirect to /order-success/:id
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { checkoutSchema, COUNTRIES } from '../../utils/validation';
import { FormInput, FormSelect, SectionHeading } from './FormField';
import { useCart } from '../../hooks/useCart';
import api from '../../services/api';

/**
 * Stripe CardElement styling to match the dark theme.
 * Colors mirror the existing input styles.
 */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'inherit',
      fontSize: '14px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#A8B2C1' },
      backgroundColor: 'transparent',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

/**
 * @param {object} props
 * @param {function} [props.onOrderSuccess] - Called with order data after successful placement
 * @param {number} [props.orderTotal] - Total order amount for display on submit button
 */
export default function CheckoutForm({ onOrderSuccess, orderTotal }) {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const [serverError, setServerError] = useState('');
  const [cardError, setCardError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  /**
   * Handle Stripe CardElement change events.
   * Shows inline error messages for card validation issues.
   */
  const handleCardChange = (event) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError('');
    }
  };

  /**
   * Main form submission handler.
   * Validates form, creates payment intent, confirms payment with Stripe,
   * then creates the order record on the backend.
   */
  const onSubmit = async (data) => {
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet — disable form submission
      setServerError('Payment system is loading. Please try again in a moment.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setServerError('Card element not found. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    setServerError('');
    setCardError('');

    try {
      // Step 1: Create a PaymentIntent on the backend
      // Backend calculates total from cart to prevent tampering
      let clientSecret;
      try {
        const intentResponse = await api.post('/orders/create-payment-intent', {
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
        });
        clientSecret = intentResponse.data?.client_secret || intentResponse.data?.clientSecret;
      } catch (intentErr) {
        throw new Error(
          intentErr.message || 'Failed to initialize payment. Please try again.'
        );
      }

      if (!clientSecret) {
        throw new Error('Invalid payment response from server. Please try again.');
      }

      // Step 2: Confirm the card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${data.firstName} ${data.lastName}`,
              email: data.email,
              phone: data.phone || undefined,
              address: {
                line1: data.address,
                city: data.city,
                postal_code: data.zip,
                country: data.country,
              },
            },
          },
        }
      );

      if (stripeError) {
        // Handle Stripe-specific errors (card declined, 3DS failure, etc.)
        if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
          setCardError(stripeError.message);
        } else {
          setServerError(
            stripeError.message ||
              'Your payment could not be processed. Please try again.'
          );
        }
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Step 3: Payment succeeded — create the order record on the backend
      let order;
      try {
        const orderResponse = await api.post('/orders/create', {
          paymentIntentId: paymentIntent.id,
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
            method: 'card',
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
          },
        });
        order = orderResponse.data?.order || orderResponse.data;
      } catch (orderErr) {
        // Payment succeeded but order creation failed — still show success
        // The webhook will handle order creation as a fallback
        console.error('Order creation failed after payment:', orderErr);
        order = { paymentIntentId: paymentIntent.id };
      }

      // Step 4: Clear cart and redirect to success
      if (clearCart) clearCart();

      if (onOrderSuccess) {
        onOrderSuccess(order);
      } else {
        navigate(`/order-success/${order?.id || order?._id || ''}`, {
          state: { order },
        });
      }
    } catch (err) {
      const message =
        err.message ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to place order. Please try again.';
      setServerError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Checkout form"
      className="flex flex-col gap-8"
    >
      {/* Server-level error banner */}
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

      {/* ── Section 3: Payment (Stripe) ── */}
      <section aria-labelledby="section-payment">
        <SectionHeading number="3" title="Payment" />

        {/*
         * Credit Card indicator — Stripe only (no PayPal tab per architecture plan).
         * Shows accepted card brands.
         */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#E8C547] bg-[#E8C547]/10 mb-5"
          role="status"
          aria-label="Payment method: Credit Card via Stripe"
        >
          <svg
            className="w-5 h-5 text-[#E8C547] flex-shrink-0"
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
          <span className="text-[#E8C547] text-sm font-medium">Credit Card</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[#A8B2C1]">
            Visa &bull; Mastercard &bull; Amex &bull; Discover
          </span>
        </div>

        {/* Stripe CardElement wrapper */}
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-white"
            id="card-element-label"
            htmlFor="card-element"
          >
            Card details
          </label>

          {/*
           * CardElement wrapper styled to match existing inputs.
           * focus-within ring changes color based on error state.
           * The CardElement renders inside a Stripe-hosted iframe for PCI compliance.
           */}
          <div
            id="card-element"
            className={[
              'w-full px-4 py-3 rounded-lg bg-[#1A1A2E]',
              'border transition-colors focus-within:outline-none focus-within:ring-1',
              cardError
                ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30'
                : 'border-[#2A3550] focus-within:border-[#E8C547] focus-within:ring-[#E8C547]/30',
            ].join(' ')}
            role="group"
            aria-labelledby="card-element-label"
          >
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          </div>

          {/* Inline card error — shown below the CardElement */}
          {cardError && (
            <p
              role="alert"
              className="text-xs text-red-400 flex items-center gap-1 mt-1"
            >
              <svg
                className="w-3 h-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {cardError}
            </p>
          )}

          {/* Card brand logos row */}
          <div
            className="flex items-center gap-2 mt-1"
            aria-label="Accepted card brands"
          >
            <span className="text-xs text-[#A8B2C1] px-2 py-0.5 rounded border border-[#2A3550]">
              Visa
            </span>
            <span className="text-xs text-[#A8B2C1] px-2 py-0.5 rounded border border-[#2A3550]">
              Mastercard
            </span>
            <span className="text-xs text-[#A8B2C1] px-2 py-0.5 rounded border border-[#2A3550]">
              Amex
            </span>
            <span className="text-xs text-[#A8B2C1] px-2 py-0.5 rounded border border-[#2A3550]">
              Discover
            </span>
          </div>

          {/* Security badge — reassures users their card data is safe */}
          <div className="flex items-center gap-2 text-xs text-[#A8B2C1] mt-1">
            <svg
              className="w-4 h-4 text-[#27AE60] flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Secured by{' '}
            <span className="font-semibold text-white">Stripe</span>
            {' '}&mdash; your card is never stored on our servers.
          </div>
        </div>
      </section>

      {/* ── Submit button ── */}
      <button
        type="submit"
        disabled={isSubmitting || !stripe}
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
            Processing...
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
              ? `Place Order \u2014 $${orderTotal.toFixed(2)}`
              : 'Place Order'}
          </>
        )}
      </button>
    </form>
  );
}
