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
 *   - Order details (ID, Airwallex payment reference, status, total, shipping)
 *   - PENDING status banner (async payment methods)
 *   - Continue Shopping CTA
 *
 * Status handling:
 *   - paid / confirmed / succeeded / activated → green "Confirmed" badge
 *   - pending / processing → gold "Processing" badge + informational banner
 *   - shipped / delivered → blue / green badge
 *   - payment_failed / failed / canceled → red badge + support contact
 */
import React, { useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '../components/ui';
import { useTranslation } from '../context/LanguageContext';

const PAYMENT_PROVIDER = 'Airwallex';

/** Format a number as USD currency string */
const formatPrice = (amount) =>
  typeof amount === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : null;

/**
 * Map Airwallex / backend order statuses to a user-friendly display label
 * and colour class.
 *
 * @param {string} status - Raw order status from API
 * @returns {{ label: string, className: string, isPending: boolean, isFailed: boolean }}
 */
function getStatusDisplay(status, t) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'confirmed' || s === 'succeeded' || s === 'activated') {
    return { label: t('checkout.statusConfirmed'), className: 'text-green-400', isPending: false, isFailed: false };
  }
  if (s === 'pending' || s === 'processing') {
    return { label: t('checkout.statusProcessing'), className: 'text-[#E8C547]', isPending: true, isFailed: false };
  }
  if (s === 'shipped') {
    return { label: t('checkout.statusShipped'), className: 'text-blue-400', isPending: false, isFailed: false };
  }
  if (s === 'delivered') {
    return { label: t('checkout.statusDelivered'), className: 'text-green-400', isPending: false, isFailed: false };
  }
  if (
    s === 'payment_failed' ||
    s === 'failed' ||
    s === 'canceled' ||
    s === 'cancelled'
  ) {
    return {
      label: t('checkout.statusFailed'),
      className: 'text-red-400',
      isPending: false,
      isFailed: true,
    };
  }
  return {
    label: status || t('checkout.statusConfirmed'),
    className: 'text-[#A8B2C1]',
    isPending: false,
    isFailed: false,
  };
}

/**
 * Informational banner shown when the payment is still pending confirmation
 * from Airwallex (e.g., bank transfer, 3DS delay, async payment methods).
 * The webhook will update the order status once payment completes.
 */
function PendingPaymentBanner() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 p-4 rounded-lg bg-[#E8C547]/10 border border-[#E8C547]/40 text-sm mb-6"
    >
      <svg
        className="w-5 h-5 text-[#E8C547] flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1
             1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="font-semibold text-[#E8C547]">{t('checkout.pendingTitle')}</p>
        <p className="text-[#A8B2C1] mt-1">
          {t('checkout.pendingMessage')}
        </p>
      </div>
    </div>
  );
}

/**
 * Error banner shown when the order has a failed/cancelled payment status.
 * Provides a support contact reference (the payment ID).
 */
function FailedPaymentBanner({ paymentRef }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 rounded-lg bg-red-900/20 border border-red-500/40 text-sm mb-6"
    >
      <svg
        className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586
             10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0
             001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586
             8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="font-semibold text-red-400">{t('checkout.failedBannerTitle')}</p>
        <p className="text-[#A8B2C1] mt-1">
          {t('checkout.failedBannerMessage')}
          {paymentRef && (
            <span className="font-mono text-white ml-1">{paymentRef}</span>
          )}
        </p>
      </div>
    </div>
  );
}

const OrderSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useTranslation();

  // Order data passed via navigation state (from CheckoutPage handleOrderSuccess)
  const stateOrder = location.state?.order;

  // Fetch order from API if we have an ID but no state (e.g., direct URL access
  // after page refresh, or email link to order confirmation page)
  const shouldFetch = !!id && !stateOrder;
  const { order: fetchedOrder, loading, error: fetchError } = useOrder(shouldFetch ? id : null);

  // Use state order if available, otherwise use fetched order
  const order = stateOrder || fetchedOrder;

  // Scroll to top on mount for best UX after navigating here
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const orderId = order?.id || order?._id || id || null;
  const orderStatus = order?.status || 'confirmed';
  const statusDisplay = getStatusDisplay(orderStatus, t);

  const orderTotal =
    order?.totalAmount ||
    order?.orderSummary?.total ||
    order?.total ||
    null;

  const shippingAddress = order?.shippingAddress || null;

  // Airwallex payment reference — shown when no orderId is available yet
  // (e.g., order creation fallback scenario where webhook is still pending)
  const airwallexPaymentId = order?.airwallexPaymentId || null;

  // Legacy Stripe reference (kept for backwards-compat with old orders)
  const paymentIntentId = order?.paymentIntentId || null;

  // The payment reference to display (prefer airwallexPaymentId)
  const paymentRef = airwallexPaymentId || paymentIntentId || null;

  return (
    <main
      className="min-h-screen pt-20 pb-16 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
    >
      <div className="max-w-lg mx-auto px-4 text-center w-full">
        {/* ── Animated success checkmark ── */}
        <div
          className={[
            'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2',
            statusDisplay.isFailed
              ? 'bg-red-900/30 border-red-500'
              : 'bg-green-900/30 border-green-500',
          ].join(' ')}
          aria-hidden="true"
        >
          {statusDisplay.isFailed ? (
            <svg
              className="w-12 h-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
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
          )}
        </div>

        {/* ── Heading ── */}
        <h1
          className="text-5xl font-black text-white tracking-wide mb-3 uppercase"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {statusDisplay.isFailed ? t('checkout.failedHeading') : t('checkout.successHeading')}
        </h1>
        <p className="text-[#A8B2C1] text-lg mb-8">
          {statusDisplay.isFailed
            ? t('checkout.failedSubtitle')
            : t('checkout.successSubtitle')}
        </p>

        {/* ── Status-specific banners ── */}
        {statusDisplay.isPending && <PendingPaymentBanner />}
        {statusDisplay.isFailed && <FailedPaymentBanner paymentRef={paymentRef} />}

        {/* ── Order details card ── */}
        {loading ? (
          <div className="mb-8">
            <LoadingSpinner size="md" className="mx-auto" />
            <p className="text-[#A8B2C1] text-sm mt-3">{t('checkout.loadingDetails')}</p>
          </div>
        ) : fetchError && !order ? (
          // Show a graceful error state if the API fetch failed and we have no
          // fallback data (e.g., deep-linked order page after session expiry).
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-lg bg-red-900/20 border border-red-500/40 text-sm mb-8 text-left"
          >
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414
                   1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293
                   1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10
                   8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-300">{t('checkout.loadError')}</p>
          </div>
        ) : (
          <div
            className="bg-[#16213E] border border-[#2A3550] rounded-2xl p-6 mb-8 text-left"
            role="region"
            aria-label={t('checkout.orderDetails')}
          >
            <h2
              className="font-black text-xl text-white tracking-wide mb-4 uppercase"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {t('checkout.orderDetails')}
            </h2>

            <div className="space-y-3 text-sm">
              {/* Order ID */}
              {orderId && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#A8B2C1] flex-shrink-0">{t('checkout.orderId')}</span>
                  <span className="text-white font-mono text-xs text-right break-all">
                    {orderId}
                  </span>
                </div>
              )}

              {/*
               * Airwallex payment reference — displayed when:
               *   a) No orderId yet (webhook latency) so user has a reference to quote
               *   b) There is an orderId but this is also available for support use
               * Only shown without an orderId to avoid visual clutter.
               */}
              {!orderId && paymentRef && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#A8B2C1] flex-shrink-0">{t('checkout.paymentRef')}</span>
                  <span className="text-white font-mono text-xs text-right break-all">
                    {paymentRef}
                  </span>
                </div>
              )}

              {/* Payment method */}
              <div className="flex justify-between">
                <span className="text-[#A8B2C1]">{t('checkout.paymentLabel')}</span>
                <span className="text-white">{t('checkout.paymentMethod', { provider: PAYMENT_PROVIDER })}</span>
              </div>

              {/* Status */}
              <div className="flex justify-between">
                <span className="text-[#A8B2C1]">{t('checkout.status')}</span>
                <span className={`capitalize font-medium ${statusDisplay.className}`}>
                  {statusDisplay.label}
                </span>
              </div>

              {/* Total */}
              {orderTotal != null && (
                <div className="flex justify-between">
                  <span className="text-[#A8B2C1]">{t('checkout.totalCharged')}</span>
                  <span className="text-[#E8C547] font-bold">
                    {formatPrice(orderTotal)}
                  </span>
                </div>
              )}

              {/* Shipping address */}
              {shippingAddress && (
                <div className="pt-3 border-t border-[#2A3550]">
                  <p className="text-[#A8B2C1] mb-1">{t('checkout.shippingTo')}</p>
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
          {statusDisplay.isFailed ? (
            <>
              {t('checkout.supportPrefix')}
              <a
                href="mailto:support@ballers.store"
                className="text-[#E8C547] hover:underline"
              >
                support@ballers.store
              </a>
              {paymentRef && (
                <>{t('checkout.supportQuoteRef')}<span className="font-mono text-white">{paymentRef}</span>.</>
              )}
            </>
          ) : (
            <>
              {t('checkout.emailConfirmPrefix')}
              <span className="text-white font-medium">
                {order?.shippingAddress?.email || t('checkout.emailConfirmFallback')}
              </span>
              {t('checkout.emailConfirmSuffix')}
            </>
          )}
        </p>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/products"
            className="px-8 py-3 bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider rounded-lg hover:bg-[#D4A800] transition-colors text-sm"
          >
            {t('checkout.continueShopping')}
          </Link>
          <Link
            to="/"
            className="px-8 py-3 border border-[#2A3550] text-[#A8B2C1] rounded-lg hover:border-[#E8C547] hover:text-white transition-colors text-sm"
          >
            {t('checkout.backToHome')}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccessPage;
