/**
 * CheckoutForm component with Rapyd Elements integration.
 * Multi-section form: Contact Info, Shipping Address, Payment (Rapyd RapydCardElement).
 * Uses React Hook Form + Zod for contact/shipping validation.
 * Uses Rapyd's RapydCardElement for secure PCI-compliant card collection.
 *
 * Checkout Flow:
 *   1. Validate contact/shipping fields with react-hook-form + zod
 *   2. POST /api/orders/create-payment-intent (no body — cart fetched server-side)
 *      -> returns { clientToken, paymentId, orderSummary }
 *   3. rapyd.confirmPayment(clientToken, { elements: { card: cardElement } })
 *   4. On success: POST /api/orders/create { rapydPaymentId, shippingAddress }
 *   5. Clear cart, redirect to /order-success with order state
 *
 * Error Handling:
 *   - card_error / validation_error -> inline error below RapydCardElement
 *   - api_error / network error -> server error banner at top of form
 *   - 3DS / next action -> handled automatically by rapyd.confirmPayment()
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { RapydCardElement, useRapyd } from '@rapyd/client-web';
import { checkoutSchema, COUNTRIES } from '../../utils/validation';
import { FormInput, FormSelect, SectionHeading } from './FormField';
import { useCart } from '../../hooks/useCart';
import { createPaymentIntent, createOrder } from '../../services/ordersApi';

/**
 * @param {object} props
 * @param {function} [props.onOrderSuccess] - Called with order data after successful placement
 * @param {number} [props.orderTotal] - Total order amount for display on submit button
 */
export default function CheckoutForm({ onOrderSuccess, orderTotal }) {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const rapyd = useRapyd();

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
   * Handle RapydCardElement change events.
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
   * Validates form, creates payment intent, confirms payment with Rapyd,
   * then creates the order record on the backend.
   */
  const onSubmit = async (data) => {
    if (!rapyd) {
      // Rapyd.js has not loaded yet — disable form submission
      setServerError('Payment system is loading. Please try again in a moment.');
      return;
    }

    setIsSubmitting(true);
    setServerError('');
    setCardError('');

    // Build shipping address object (reused in multiple steps)
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
      // ── Step 1: Create a Payment on the backend ──────────────────────────
      // Backend calculates total from the authenticated user's cart to prevent
      // client-side price tampering. No cart data is sent from the client.
      let clientToken;
      let paymentId;
      let orderSummary;

      try {
        const intentData = await createPaymentIntent();
        clientToken = intentData.clientToken;
        paymentId = intentData.paymentId;
        orderSummary = intentData.orderSummary;
      } catch (intentErr) {
        // Surface specific backend error messages (e.g., "Cart is empty", "Item out of stock")
        const message =
          intentErr.message ||
          'Failed to initialize payment. Please try again.';
        throw new Error(message);
      }

      if (!clientToken) {
        throw new Error('Invalid payment response from server. Please try again.');
      }

      // ── Step 2: Confirm the card payment with Rapyd ───────────────────────
      // rapyd.confirmPayment handles 3DS authentication automatically.
      // On 3DS, Rapyd opens a modal for the user to authenticate, then
      // resolves the promise with the final payment status.
      const { error: rapydError, payment } = await rapyd.confirmPayment(
        clientToken,
        {
          elements: {
            card: rapyd.getElement ? rapyd.getElement('card') : undefined,
          },
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
        }
      );

      if (rapydError) {
        // Handle Rapyd-specific errors:
        // - card_error: card declined, insufficient funds, etc.
        // - validation_error: invalid card number, expiry, etc.
        // - api_error: Rapyd API issue
        if (
          rapydError.type === 'card_error' ||
          rapydError.type === 'validation_error'
        ) {
          setCardError(rapydError.message);
        } else {
          setServerError(
            rapydError.message ||
              'Payment could not be processed. Please try again.'
          );
        }
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Verify payment succeeded
      const paymentStatus = payment?.status;
      if (paymentStatus && paymentStatus !== 'SUCCEEDED' && paymentStatus !== 'ACTIVATED') {
        setServerError(
          `Payment status: ${paymentStatus}. Contact support if charged.`
        );
        setIsSubmitting(false);
        return;
      }

      // ── Step 3: Create the order record on the backend ────────────────────
      // Payment succeeded — persist the order. If this fails, the webhook
      // (payment.SUCCEEDED) will create/update the order as a fallback.
      let order = null;
      try {
        const orderResponse = await createOrder({
          rapydPaymentId: paymentId || payment?.id,
          shippingAddress,
        });
        // Normalize order data from various response shapes
        order = orderResponse?.order || orderResponse?.data || orderResponse;
      } catch (orderErr) {
        // Payment succeeded but order creation failed.
        // The webhook will handle order creation as a fallback.
        // We still redirect to success so the user isn't confused.
        console.error('[CheckoutForm] Order creation failed after payment:', orderErr);
        order = {
          rapydPaymentId: paymentId || payment?.id,
          status: paymentStatus || 'SUCCEEDED',
          orderSummary,
        };
      }

      // ── Step 4: Clear cart and redirect to success ─────────────────────────
      if (clearCart) {
        clearCart();
      }

      // Build the success state to pass to the order success page
      const successState = {
        order: {
          ...order,
          // Ensure we always have a rapydPaymentId for reference
          rapydPaymentId: order?.rapydPaymentId || paymentId || payment?.id,
          // Include order summary for display on success page
          orderSummary: order?.orderSummary || orderSummary,
          // Include shipping address for confirmation display
          shippingAddress,
        },
      };

      if (onOrderSuccess) {
        // Parent component handles the redirect (e.g., CheckoutPage)
        onOrderSuccess(successState.order);
      } else {
        // Direct navigation to success page
        const orderId = order?.id || order?._id || '';
        navigate(
          orderId ? `/order-success/${orderId}` : '/order-success',
          { state: successState, replace: true }
        );
      }
    } catch (err) {
      // Catch-all for unexpected errors
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

      {/* ── Section 3: Payment (Rapyd) ── */}
      <section aria-labelledby="section-payment">
        <SectionHeading number="3" title="Payment" />

        {/*
         * Credit Card indicator — Rapyd only (no PayPal tab per architecture plan).
         * Shows accepted card brands.
         */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#E8C547] bg-[#E8C547]/10 mb-5"
          role="status"
          aria-label="Payment method: Credit Card via Rapyd"
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

        {/* Rapyd RapydCardElement wrapper */}
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-white"
            htmlFor="rapyd-card-element"
          >
            Card details
          </label>

          {/*
           * RapydCardElement wrapper styled to match existing inputs.
           * focus-within ring changes color based on error state.
           * The RapydCardElement renders inside a Rapyd-hosted iframe for PCI compliance.
           */}
          <div
            id="rapyd-card-element"
            className={[
              'w-full px-4 py-3 rounded-lg bg-[#1A1A2E]',
              'border transition-colors focus-within:outline-none focus-within:ring-1',
              cardError
                ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30'
                : 'border-[#2A3550] focus-within:border-[#E8C547] focus-within:ring-[#E8C547]/30',
            ].join(' ')}
          >
            <RapydCardElement
              options={{
                style: {
                  base: {
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    '::placeholder': { color: '#A8B2C1' },
                    backgroundColor: 'transparent',
                  },
                  invalid: { color: '#ef4444', iconColor: '#ef4444' },
                },
              }}
              onChange={handleCardChange}
            />
          </div>

          {/* Inline card error — shown below the RapydCardElement */}
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

          {/* Card brand badges */}
          <div
            className="flex items-center gap-2 mt-1"
            aria-label="Accepted card brands"
          >
            {['Visa', 'Mastercard', 'Amex', 'Discover'].map((brand) => (
              <span
                key={brand}
                className="text-xs text-[#A8B2C1] px-2 py-0.5 rounded border border-[#2A3550]"
              >
                {brand}
              </span>
            ))}
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
            <span className="font-semibold text-white">Rapyd</span>
            <span className="text-[#A8B2C1]">&mdash; PCI DSS Level 1</span>
          </div>
        </div>
      </section>

      {/* ── Submit button ── */}
      <button
        type="submit"
        disabled={isSubmitting || !rapyd}
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
