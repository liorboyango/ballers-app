/**
 * OrderSuccessPage
 * Displayed after a successful order placement.
 */
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '../components/ui';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const { order, loading } = useOrder(id);

  return (
    <main className="min-h-screen bg-navy pt-20 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-bebas text-5xl text-white tracking-wide mb-3">
          Order Confirmed!
        </h1>
        <p className="text-ballers-muted text-lg mb-6">
          Thank you for your purchase. Your World Cup kit is on its way!
        </p>

        {loading ? (
          <LoadingSpinner size="md" className="mx-auto mb-6" />
        ) : order ? (
          <div className="bg-navy-surface border border-ballers-border rounded-xl p-6 mb-8 text-left">
            <h2 className="font-bebas text-xl text-white tracking-wide mb-4">Order Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ballers-muted">Order ID</span>
                <span className="text-white font-mono text-xs">{order.id || id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ballers-muted">Status</span>
                <span className="text-green-400 capitalize">{order.status || 'confirmed'}</span>
              </div>
              {order.totalAmount && (
                <div className="flex justify-between">
                  <span className="text-ballers-muted">Total</span>
                  <span className="text-gold font-bold">${order.totalAmount?.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ) : id ? (
          <div className="bg-navy-surface border border-ballers-border rounded-xl p-6 mb-8">
            <p className="text-ballers-muted text-sm">Order ID: <span className="text-white font-mono">{id}</span></p>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/products"
            className="
              px-8 py-3 bg-gold text-navy font-bold uppercase tracking-wider
              rounded-lg hover:bg-gold-hover transition-colors text-sm
            "
          >
            Continue Shopping
          </Link>
          <Link
            to="/"
            className="
              px-8 py-3 border border-ballers-border text-ballers-muted
              rounded-lg hover:border-gold hover:text-white transition-colors text-sm
            "
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccessPage;
