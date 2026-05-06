/**
 * CheckoutPage
 * Multi-step checkout form with shipping and payment.
 * Submits order to POST /api/orders/create.
 */
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import { useCreateOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '../components/ui';
import { API_BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';

// Checkout form validation schema
const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zip: z.string().min(3, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  paymentMethod: z.enum(['card', 'paypal']),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
}).refine(
  (data) => {
    if (data.paymentMethod === 'card') {
      return data.cardNumber && data.cardHolder && data.expiryMonth && data.expiryYear && data.cvv;
    }
    return true;
  },
  { message: 'Card details are required', path: ['cardNumber'] }
);

/**
 * Form field component
 */
const FormField = ({ label, error, required, children }) => (
  <div>
    <label className="block text-ballers-muted text-sm mb-1.5">
      {label} {required && <span className="text-ballers-red">*</span>}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

/**
 * Input component
 */
const Input = React.forwardRef(({ error, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={`
      w-full px-4 py-3 bg-navy border rounded-lg text-white placeholder-ballers-muted
      focus:outline-none focus:ring-1 transition-colors
      ${error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
        : 'border-ballers-border focus:border-gold focus:ring-gold/30'
      }
    `}
  />
));
Input.displayName = 'Input';

/**
 * CheckoutPage component
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { submitOrder, loading } = useCreateOrder();
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState('card');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'card' },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/checkout' }} replace />;
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const shippingCost = totalPrice >= 100 ? 0 : 9.99;
  const taxAmount = totalPrice * 0.08;
  const orderTotal = totalPrice + shippingCost + taxAmount;

  const onSubmit = async (data) => {
    try {
      const orderData = {
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          address: data.address,
          city: data.city,
          zip: data.zip,
          country: data.country,
          phone: data.phone,
        },
        paymentInfo: {
          method: data.paymentMethod,
          ...(data.paymentMethod === 'card' && {
            cardNumber: data.cardNumber,
            cardHolder: data.cardHolder,
            expiryMonth: data.expiryMonth,
            expiryYear: data.expiryYear,
          }),
        },
      };

      const result = await submitOrder(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${result.order?.id || ''}`);
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-navy pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-bebas text-5xl text-white tracking-wide mb-10">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact info */}
              <section className="bg-navy-surface border border-ballers-border rounded-xl p-6">
                <h2 className="font-bebas text-2xl text-white tracking-wide mb-5">
                  1. Contact Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First Name" error={errors.firstName?.message} required>
                    <Input
                      {...register('firstName')}
                      placeholder="John"
                      error={errors.firstName}
                      autoComplete="given-name"
                    />
                  </FormField>
                  <FormField label="Last Name" error={errors.lastName?.message} required>
                    <Input
                      {...register('lastName')}
                      placeholder="Doe"
                      error={errors.lastName}
                      autoComplete="family-name"
                    />
                  </FormField>
                  <FormField label="Email" error={errors.email?.message} required className="sm:col-span-2">
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="john@example.com"
                      error={errors.email}
                      autoComplete="email"
                    />
                  </FormField>
                </div>
              </section>

              {/* Shipping */}
              <section className="bg-navy-surface border border-ballers-border rounded-xl p-6">
                <h2 className="font-bebas text-2xl text-white tracking-wide mb-5">
                  2. Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Address" error={errors.address?.message} required className="sm:col-span-2">
                    <Input
                      {...register('address')}
                      placeholder="123 Main St"
                      error={errors.address}
                      autoComplete="street-address"
                    />
                  </FormField>
                  <FormField label="City" error={errors.city?.message} required>
                    <Input
                      {...register('city')}
                      placeholder="New York"
                      error={errors.city}
                      autoComplete="address-level2"
                    />
                  </FormField>
                  <FormField label="ZIP Code" error={errors.zip?.message} required>
                    <Input
                      {...register('zip')}
                      placeholder="10001"
                      error={errors.zip}
                      autoComplete="postal-code"
                    />
                  </FormField>
                  <FormField label="Country" error={errors.country?.message} required className="sm:col-span-2">
                    <Input
                      {...register('country')}
                      placeholder="United States"
                      error={errors.country}
                      autoComplete="country-name"
                    />
                  </FormField>
                  <FormField label="Phone (optional)" error={errors.phone?.message}>
                    <Input
                      {...register('phone')}
                      type="tel"
                      placeholder="+1 555 000 0000"
                      error={errors.phone}
                      autoComplete="tel"
                    />
                  </FormField>
                </div>
              </section>

              {/* Payment */}
              <section className="bg-navy-surface border border-ballers-border rounded-xl p-6">
                <h2 className="font-bebas text-2xl text-white tracking-wide mb-5">
                  3. Payment
                </h2>

                {/* Payment method selector */}
                <div className="flex gap-3 mb-5">
                  {['card', 'paypal'].map((method) => (
                    <label
                      key={method}
                      className={`
                        flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors flex-1
                        ${paymentMethod === method
                          ? 'border-gold bg-gold/10 text-white'
                          : 'border-ballers-border text-ballers-muted hover:border-gold/50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        value={method}
                        {...register('paymentMethod')}
                        onChange={() => setPaymentMethod(method)}
                        className="accent-gold"
                      />
                      <span className="capitalize font-semibold text-sm">{method}</span>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Card Number" error={errors.cardNumber?.message} required className="sm:col-span-2">
                      <Input
                        {...register('cardNumber')}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        error={errors.cardNumber}
                        autoComplete="cc-number"
                      />
                    </FormField>
                    <FormField label="Card Holder" error={errors.cardHolder?.message} required className="sm:col-span-2">
                      <Input
                        {...register('cardHolder')}
                        placeholder="JOHN DOE"
                        error={errors.cardHolder}
                        autoComplete="cc-name"
                      />
                    </FormField>
                    <FormField label="Expiry Month" error={errors.expiryMonth?.message} required>
                      <Input
                        {...register('expiryMonth')}
                        placeholder="MM"
                        maxLength={2}
                        error={errors.expiryMonth}
                        autoComplete="cc-exp-month"
                      />
                    </FormField>
                    <FormField label="Expiry Year" error={errors.expiryYear?.message} required>
                      <Input
                        {...register('expiryYear')}
                        placeholder="YYYY"
                        maxLength={4}
                        error={errors.expiryYear}
                        autoComplete="cc-exp-year"
                      />
                    </FormField>
                    <FormField label="CVV" error={errors.cvv?.message} required>
                      <Input
                        {...register('cvv')}
                        placeholder="123"
                        maxLength={4}
                        error={errors.cvv}
                        autoComplete="cc-csc"
                      />
                    </FormField>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-4 bg-navy border border-ballers-border rounded-lg text-center">
                    <p className="text-ballers-muted text-sm">
                      You will be redirected to PayPal to complete your payment.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-navy-surface border border-ballers-border rounded-xl p-6 sticky top-24">
                <h2 className="font-bebas text-2xl text-white tracking-wide mb-5">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const imageUrl = item.product?.images?.[0]
                      ? `${API_BASE_URL.replace('/api', '')}${item.product.images[0]}`
                      : null;
                    return (
                      <div key={item._id} className="flex gap-3">
                        <div className="w-12 h-14 flex-shrink-0 bg-navy-deep rounded overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">⚽</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{item.product?.name}</p>
                          <p className="text-ballers-muted text-xs">
                            {item.customization?.size} {item.customization?.number ? `#${item.customization.number}` : ''}
                          </p>
                          <p className="text-gold text-xs font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-2 border-t border-ballers-border pt-4 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-ballers-muted">Subtotal</span>
                    <span className="text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ballers-muted">Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-400' : 'text-white'}>
                      {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ballers-muted">Tax (8%)</span>
                    <span className="text-white">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ballers-border pt-2">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-gold font-bold text-lg">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full py-4 bg-gold text-navy font-bold uppercase tracking-wider
                    rounded-lg hover:bg-gold-hover transition-colors text-sm
                    disabled:opacity-60 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  "
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CheckoutPage;
