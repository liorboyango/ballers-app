/**
 * Checkout Page
 * Multi-section checkout form: contact info, shipping, payment.
 * Includes order summary sidebar.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '../context/CartContext';
import { checkoutSchema, formatCardNumber, formatExpiryDate } from '../utils/validation';

/**
 * Form field component with error display.
 */
function FormField({ label, error, children, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ballers-muted mb-1.5">
        {label}{required && <span className="text-ballers-red ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-ballers-red text-xs mt-1" role="alert">{error}</p>
      )}
    </div>
  );
}

/**
 * Order summary sidebar for checkout.
 */
function CheckoutOrderSummary({ items, subtotal }) {
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="bg-navy-surface border border-ballers-border rounded-xl p-6">
      <h2 className="font-bebas text-xl text-white tracking-wider mb-6">ORDER SUMMARY</h2>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.cartKey} className="flex gap-3">
            <div className="w-12 h-14 bg-navy-deep rounded flex-shrink-0 flex items-center justify-center">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
              ) : (
                <span className="text-xl" aria-hidden="true">👕</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium leading-tight truncate">{item.name}</p>
              <p className="text-ballers-muted text-xs">Size: {item.size} × {item.quantity}</p>
              {item.customization?.playerName && (
                <p className="text-ballers-muted text-xs">{item.customization.playerName}</p>
              )}
            </div>
            <p className="text-gold text-sm font-bold flex-shrink-0">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-ballers-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ballers-muted">Subtotal</span>
          <span className="text-white">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ballers-muted">Shipping</span>
          <span className="text-ballers-success">Free</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-ballers-border">
          <span className="text-white font-bold uppercase tracking-wider">Total</span>
          <span className="text-gold font-bold text-lg">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Checkout Page - main component.
 */
function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
  });

  // Redirect to cart if empty
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="page-enter min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-bebas text-4xl text-white mb-4">YOUR CART IS EMPTY</h1>
          <Link to="/products" className="btn-primary">Shop Now</Link>
        </div>
      </div>
    );
  }

  // Order success state
  if (orderSuccess) {
    return (
      <div className="page-enter min-h-screen flex items-center justify-center">
        <div className="text-center px-4 max-w-md">
          <div className="text-8xl mb-6" aria-hidden="true">🎉</div>
          <h1 className="font-bebas text-4xl text-white mb-4">ORDER PLACED!</h1>
          <p className="text-ballers-muted mb-8">
            Thank you for your order. You'll receive a confirmation email shortly.
          </p>
          <Link to="/" className="btn-primary text-lg px-8 py-4">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Will be replaced with actual API call in task 5
      await new Promise((resolve) => setTimeout(resolve, 1500));
      clearCart();
      setOrderSuccess(true);
    } catch (err) {
      console.error('Order failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-enter min-h-screen">
      {/* Page header */}
      <div className="bg-navy-surface border-b border-ballers-border py-8">
        <div className="container-ballers">
          <h1 className="font-bebas text-section text-white">CHECKOUT</h1>
        </div>
      </div>

      <div className="container-ballers py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-2 space-y-8"
            noValidate
            aria-label="Checkout form"
          >
            {/* 1. Contact Info */}
            <section className="bg-navy-surface border border-ballers-border rounded-xl p-6">
              <h2 className="font-bebas text-xl text-white tracking-wider mb-6">
                1. CONTACT INFO
              </h2>
              <div className="space-y-4">
                <FormField label="Email" error={errors.email?.message} required>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="your@email.com"
                    className="input-field"
                    autoComplete="email"
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="First Name" error={errors.firstName?.message} required>
                    <input
                      {...register('firstName')}
                      type="text"
                      placeholder="John"
                      className="input-field"
                      autoComplete="given-name"
                    />
                  </FormField>
                  <FormField label="Last Name" error={errors.lastName?.message} required>
                    <input
                      {...register('lastName')}
                      type="text"
                      placeholder="Doe"
                      className="input-field"
                      autoComplete="family-name"
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 2. Shipping */}
            <section className="bg-navy-surface border border-ballers-border rounded-xl p-6">
              <h2 className="font-bebas text-xl text-white tracking-wider mb-6">
                2. SHIPPING ADDRESS
              </h2>
              <div className="space-y-4">
                <FormField label="Address" error={errors.address?.message} required>
                  <input
                    {...register('address')}
                    type="text"
                    placeholder="123 Main Street"
                    className="input-field"
                    autoComplete="street-address"
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="City" error={errors.city?.message} required>
                    <input
                      {...register('city')}
                      type="text"
                      placeholder="New York"
                      className="input-field"
                      autoComplete="address-level2"
                    />
                  </FormField>
                  <FormField label="ZIP / Postal Code" error={errors.zipCode?.message} required>
                    <input
                      {...register('zipCode')}
                      type="text"
                      placeholder="10001"
                      className="input-field"
                      autoComplete="postal-code"
                    />
                  </FormField>
                </div>
                <FormField label="Country" error={errors.country?.message} required>
                  <select
                    {...register('country')}
                    className="input-field"
                    autoComplete="country"
                  >
                    <option value="">Select country...</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="BR">Brazil</option>
                    <option value="AR">Argentina</option>
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                    <option value="ES">Spain</option>
                    <option value="PT">Portugal</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="MX">Mexico</option>
                    <option value="JP">Japan</option>
                    <option value="OTHER">Other</option>
                  </select>
                </FormField>
              </div>
            </section>

            {/* 3. Payment */}
            <section className="bg-navy-surface border border-ballers-border rounded-xl p-6">
              <h2 className="font-bebas text-xl text-white tracking-wider mb-6">
                3. PAYMENT
              </h2>
              <div className="space-y-4">
                <FormField label="Card Number" error={errors.cardNumber?.message} required>
                  <input
                    {...register('cardNumber')}
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="input-field"
                    maxLength={19}
                    autoComplete="cc-number"
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      setValue('cardNumber', formatted);
                    }}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Expiry Date" error={errors.expiryDate?.message} required>
                    <input
                      {...register('expiryDate')}
                      type="text"
                      placeholder="MM/YY"
                      className="input-field"
                      maxLength={5}
                      autoComplete="cc-exp"
                      onChange={(e) => {
                        const formatted = formatExpiryDate(e.target.value);
                        setValue('expiryDate', formatted);
                      }}
                    />
                  </FormField>
                  <FormField label="CVV" error={errors.cvv?.message} required>
                    <input
                      {...register('cvv')}
                      type="text"
                      placeholder="123"
                      className="input-field"
                      maxLength={4}
                      autoComplete="cc-csc"
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full text-lg py-4"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'PLACE ORDER'
              )}
            </button>
          </form>

          {/* Order summary */}
          <div>
            <CheckoutOrderSummary items={items} subtotal={subtotal} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
