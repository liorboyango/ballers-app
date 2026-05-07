/**
 * CheckoutCompletePage — handles the redirect back from Rapyd Hosted Checkout.
 *
 * Rapyd appends `checkoutId` to the configured complete_checkout_url. We call
 * the backend's finalize endpoint, which verifies the payment with Rapyd and
 * returns the persisted order. On success we clear the cart and redirect to
 * /order-success with the order in navigation state. On failure we show an
 * error with a retry path back to /checkout.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { finalizeCheckout } from '../services/ordersApi';
import { useCart } from '../hooks/useCart';

export default function CheckoutCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [error, setError] = useState('');
  const ranRef = useRef(false);

  const checkoutId = searchParams.get('checkoutId') || searchParams.get('checkout_id');

  useEffect(() => {
    // StrictMode in development double-invokes effects; guard the network call.
    if (ranRef.current) return;
    ranRef.current = true;

    if (!checkoutId) {
      setError('Missing checkout reference. If you completed payment, please contact support.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const order = await finalizeCheckout({ checkoutId });
        if (cancelled) return;
        if (clearCart) clearCart();
        const orderId = order?.id || order?._id || '';
        navigate(
          orderId ? `/order-success/${orderId}` : '/order-success',
          { state: { order }, replace: true }
        );
      } catch (err) {
        if (cancelled) return;
        const message =
          err.message ||
          err.response?.data?.error ||
          err.response?.data?.message ||
          'We could not confirm your payment. If you were charged, please contact support.';
        setError(message);
      }
    })();

    return () => { cancelled = true; };
  }, [checkoutId, clearCart, navigate]);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
      >
        <div className="max-w-md w-full bg-[#16213E] border border-[#2A3550] rounded-2xl p-8 text-center">
          <h1
            className="text-3xl font-black text-white uppercase tracking-wider mb-3"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Payment Not Confirmed
          </h1>
          <p role="alert" className="text-red-300 text-sm mb-2">{error}</p>
          {checkoutId && (
            <p className="text-xs text-[#A8B2C1] mb-6">
              Reference: <span className="font-mono text-white">{checkoutId}</span>
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Link
              to="/checkout"
              className="w-full py-3 px-6 bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider rounded-lg hover:bg-[#D4A800] transition-colors"
            >
              Try Again
            </Link>
            <Link to="/cart" className="text-[#A8B2C1] hover:text-white text-sm">
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
    >
      <div
        className="flex flex-col items-center gap-4"
        role="status"
        aria-live="polite"
      >
        <svg
          className="animate-spin w-12 h-12 text-[#E8C547]"
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
        <p className="text-white text-base font-medium">Confirming your payment…</p>
        <p className="text-[#A8B2C1] text-sm">Please don't close this window.</p>
      </div>
    </div>
  );
}
