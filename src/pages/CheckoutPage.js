/**
 * CheckoutPage - Full checkout experience.
 * Left column: CheckoutForm (contact, shipping; submits to Rapyd Hosted Checkout).
 * Right column: Order summary with cart items.
 *
 * The displayed totals are estimates from the local cart. The authoritative
 * total is calculated server-side when the Rapyd Checkout session is created.
 */
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/forms/CheckoutForm';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { getProductImage } from '../utils/imageUrl';

/** Format price as USD */
const formatPrice = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

/** Single order summary line item */
function OrderItem({ item }) {
  const imageUrl = getProductImage(item.product);

  return (
    <div className="flex gap-3 py-3 border-b border-[#2A3550] last:border-0">
      {/* Product image */}
      <div className="w-16 h-16 rounded-lg bg-[#1A1A2E] border border-[#2A3550] flex-shrink-0 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.product?.name || 'Kit'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#2A3550]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {item.product?.name || 'Kit'}
        </p>
        {item.customization && (
          <p className="text-[#A8B2C1] text-xs mt-0.5">
            {[item.customization.size, item.customization.number && `#${item.customization.number}`, item.customization.name]
              .filter(Boolean)
              .join(' \u00b7 ')}
          </p>
        )}
        <p className="text-[#A8B2C1] text-xs mt-0.5">Qty: {item.quantity}</p>
      </div>

      {/* Price */}
      <p className="text-[#E8C547] text-sm font-bold flex-shrink-0">
        {formatPrice((item.price || item.product?.price || 0) * item.quantity)}
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items: cartItems, totalPrice, loading: cartLoading } = useCart();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, cartLoading, navigate]);

  const items = cartItems;
  const subtotal = totalPrice || 0;
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A2E' }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-[#E8C547]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[#A8B2C1] text-sm">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-[#A8B2C1] hover:text-white text-sm transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </Link>
          <h1
            className="text-4xl font-black text-white uppercase tracking-wider"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Left: Checkout Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-[#16213E] border border-[#2A3550] rounded-2xl p-6 sm:p-8">
              <CheckoutForm orderTotal={total} />
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-[#16213E] border border-[#2A3550] rounded-2xl p-6 sticky top-24">
              <h2
                className="text-xl font-bold text-white uppercase tracking-wider mb-5"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Order Summary
              </h2>

              {/* Items */}
              <div className="mb-4">
                {items.length === 0 ? (
                  <p className="text-[#A8B2C1] text-sm text-center py-4">Your cart is empty.</p>
                ) : (
                  items.map((item) => (
                    <OrderItem key={item._id || item.id} item={item} />
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-[#2A3550] pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#A8B2C1]">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A8B2C1]">Shipping</span>
                  <span className={shipping === 0 ? 'text-[#27AE60] font-medium' : 'text-white'}>
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A8B2C1]">Tax (8%)</span>
                  <span className="text-white">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-[#2A3550] pt-3 mt-1">
                  <span className="text-white">Total</span>
                  <span className="text-[#E8C547]">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-[#A8B2C1]">
                  <svg className="w-4 h-4 text-[#27AE60] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  SSL encrypted &amp; secure checkout
                </div>
                <div className="flex items-center gap-2 text-xs text-[#A8B2C1]">
                  <svg className="w-4 h-4 text-[#27AE60] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Free returns within 30 days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
