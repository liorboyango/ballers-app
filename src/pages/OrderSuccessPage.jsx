/**
 * OrderSuccessPage
 * Displayed after a successful order placement.
 *
 * Receives order data via:
 *   1. React Router navigation state (location.state.order) — primary source
 *      (passed from CheckoutPage after successful payment)
 *   2. URL param (:id) + API fetch — fallback for direct URL access
 *
 * Displays:
 *   - Animated checkmark
 *   - Order confirmation message
 *   - Order details (ID, Rapyd payment reference, status, total, shipping)
 *   - Continue Shopping CTA
 */
import React, { useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '../components/ui';

/** Format a number as USD currency string */
const formatPrice = (amount) =>
  typeof amount === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : null;

/**
 * Map Rapyd / backend order statuses to a user-friendly display label
 * and colour class.
 *
 * @param {string} status - Raw order status from API
 * @returns {{ label: string, className: string }}
 */
function getStatusDisplay(status) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'confirmed' || s === 'succeeded' || s === 'activated') {
    return { label: 'Confirmed', className: 'text-green-400' };
  }
  if (s === 'pending' || s === 'processing') {
    return { label: 'Processing', className: 'text-[#E8C547]' };
  }
  if (s === 'shipped') {
    return { label: 'Shipped', className: 'text-blue-400' };
  }
  if (s === 'delivered') {
    return { label: 'Delivered', className: 'text-green-400' };
  }
  if (s === 'payment_failed' || s === 'failed' || s === 'canceled' || s === 'cancelled') {
    return { label: 'Payment Failed', className: 'text-red-400' };
  }
  return { label: status || 'Confirmed', className: 'text-[#A8B2C1]' };
}

const OrderSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();

  // Order data passed via navigation state (from CheckoutPage handleOrderSuccess)
  const stateOrder = location.state?.order;

  // Fetch order from API if we have an ID but no state (e.g., direct URL access
  // after page refresh, or email link to order confirmation page)
  const shouldFetch = !!id && !stateOrder;
  const { order: fetchedOrder, loading } = useOrder(shouldFetch ? id : null);

  // Use state order if available, otherwise use fetched order
  const order = stateOrder || fetchedOrder;

  // Scroll to top on mount for best UX after navigating here
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const orderId = order?.id || order?._id || id || null;
  const orderStatus = order?.status || 'confirmed';
  const statusDisplay = getStatusDisplay(orderStatus);

  const orderTotal =
    order?.totalAmount ||
    order?.orderSummary?.total ||
    order?.total ||
    null;

  const shippingAddress = order?.shippingAddress || null;

  // Rapyd payment reference — shown when no orderId is available yet
  // (e.g., order creation fallback scenario where webhook is still pending)
  const rapydPaymentId = order?.rapydPaymentId || null;

  // Legacy Stripe reference (kept for backwards-compat with old orders)
  const paymentIntentId = order?.paymentIntentId || null;

  // The payment reference to display (prefer rapydPaymentId)
  const paymentRef = rapydPaymentId || paymentIntentId || null;

  return (
    <main
      className="min-h-screen pt-20 pb-16 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
    >
      <div className="max-w-lg mx-auto px-4 text-center w-full">
        {/* ── Animated success checkmark ── */}
        <div
          className="w-24 h-24 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-6"
          aria-hidden="true"
        >
          <svg
            className="w-12 h-12 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* ── Heading ── */}
        <h1
          className="text-5xl font-black text-white tracking-wide mb-3 uppercase"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Order Confirmed!
        </h1>
        <p className="text-[#A8B2C1] text-lg mb-8">
          Thank you for your purchase. Your World Cup kit is on its way!
        </p>

        {/* ── Order details card ── */}
        {loading ? (
          <div className="mb-8">
            <LoadingSpinner size="md" className="mx-auto" />
            <p className="text-[#A8B2C1] text-sm mt-3">Loading order details...</p>
          </div>
        ) : (
          <div
            className="bg-[#16213E] border border-[#2A3550] rounded-2xl p-6 mb-8 text-left"
            role="region"
            aria-label="Order details"
          >
            <h2
              className="font-black text-xl text-white tracking-wide mb-4 uppercase"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Order Details
            </h2>

            <div className="space-y-3 text-sm">
              {/* Order ID */}
              {orderId && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#A8B2C1] flex-shrink-0">Order ID</span>
                  <span className="text-white font-mono text-xs text-right break-all">
                    {orderId}
                  </span>
                </div>
              )}

              {/*
               * Rapyd payment reference — displayed when the order record isn't
               * available yet (e.g., webhook latency) so the user has a reference
               * number to quote if they contact support.
               */}
              {!orderId && paymentRef && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#A8B2C1] flex-shrink-0">Payment Ref</span>
                  <span className="text-white font-mono text-xs text-right break-all">
                    {paymentRef}
                  </span>
                </div>
              )}

              {/* Payment method */}
              <div className="flex justify-between">
                <span className="text-[#A8B2C1]">Payment</span>
                <span className="text-white">Credit Card (Rapyd)</span>
              </div>

              {/* Status */}
              <div className="flex justify-between">
                <span className="text-[#A8B2C1]">Status</span>
                <span className={`capitalize font-medium ${statusDisplay.className}`}>
                  {statusDisplay.label}
                </span>
              </div>

              {/* Total */}
              {orderTotal != null && (
                <div className="flex justify-between">
                  <span className="text-[#A8B2C1]">Total Charged</span>
                  <span className="text-[#E8C547] font-bold">
                    {formatPrice(orderTotal)}
                  </span>
                </div>
              )}

              {/* Shipping address */}
              {shippingAddress && (
                <div className="pt-3 border-t border-[#2A3550]">
                  <p className="text-[#A8B2C1] mb-1">Shipping to</p>
                  <p className="text-white">
                    {[shippingAddress.firstName, shippingAddress.lastName]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                  <p className="text-[#A8B2C1] text-xs mt-0.5">
                    {[
                      shippingAddress.address,
                      shippingAddress.city,
                      shippingAddress.zip,
                      shippingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Confirmation note ── */}
        <p className="text-[#A8B2C1] text-sm mb-8">
          A confirmation email will be sent to{' '}
          <span className="text-white font-medium">
            {order?.shippingAddress?.email || 'your email address'}
          </span>
          . Orders typically ship within 2–3 business days.
        </p>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/products"
            className="px-8 py-3 bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider rounded-lg hover:bg-[#D4A800] transition-colors text-sm"
          >
            Continue Shopping
          </Link>
          <Link
            to="/"
            className="px-8 py-3 border border-[#2A3550] text-[#A8B2C1] rounded-lg hover:border-[#E8C547] hover:text-white transition-colors text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccessPage;
