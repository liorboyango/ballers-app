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
 *   - Order details (ID, status, total, shipping address)
 *   - Continue Shopping CTA
 */
import React, { useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '../components/ui';

/** Format price as USD */
const formatPrice = (amount) =>
  typeof amount === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : null;

const OrderSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();

  // Order data passed via navigation state (from CheckoutPage)
  const stateOrder = location.state?.order;

  // Fetch order from API if we have an ID but no state (e.g., direct URL access)
  const shouldFetch = !!id && !stateOrder;
  const { order: fetchedOrder, loading } = useOrder(shouldFetch ? id : null);

  // Use state order if available, otherwise use fetched order
  const order = stateOrder || fetchedOrder;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Derive display values
  const orderId = order?.id || order?._id || id || null;
  const orderStatus = order?.status || 'confirmed';
  const orderTotal =
    order?.totalAmount ||
    order?.orderSummary?.total ||
    order?.total ||
    null;
  const shippingAddress = order?.shippingAddress || null;
  const paymentIntentId = order?.paymentIntentId || null;

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

              {/* Payment reference (when no order ID yet) */}
              {!orderId && paymentIntentId && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#A8B2C1] flex-shrink-0">Payment Ref</span>
                  <span className="text-white font-mono text-xs text-right break-all">
                    {paymentIntentId}
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between">
                <span className="text-[#A8B2C1]">Status</span>
                <span
                  className={`capitalize font-medium ${
                    orderStatus === 'paid' || orderStatus === 'confirmed' || orderStatus === 'succeeded'
                      ? 'text-green-400'
                      : orderStatus === 'processing' || orderStatus === 'pending'
                      ? 'text-[#E8C547]'
                      : 'text-[#A8B2C1]'
                  }`}
                >
                  {orderStatus === 'succeeded' ? 'Confirmed' : orderStatus}
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
                    {[shippingAddress.address, shippingAddress.city, shippingAddress.zip, shippingAddress.country]
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
