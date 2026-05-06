import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from './CartItem';
import { useCart } from '../hooks/useCart';

/**
 * CartSummary component
 * Displays the cart contents with items, subtotal, shipping, and total.
 * Used in both the cart drawer and the cart page.
 * @param {boolean} showCheckoutButton - Whether to show the checkout CTA
 * @param {boolean} compact - Compact mode for sidebar/drawer
 */
const CartSummary = ({ showCheckoutButton = true, compact = false }) => {
  const { cart, loading, error, clearCart } = useCart();
  const navigate = useNavigate();

  const items = cart?.items || [];
  const totalItems = cart?.totalItems || 0;
  const subtotal = cart?.totalPrice || 0;
  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal + shippingCost;

  if (loading) {
    return (
      <div className="cart-summary-loading" aria-busy="true" aria-label="Loading cart">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3 p-4 border-b border-ballers-border">
            <div className="w-16 h-16 bg-navy-deep rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-navy-deep rounded w-3/4" />
              <div className="h-3 bg-navy-deep rounded w-1/2" />
              <div className="h-4 bg-navy-deep rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-ballers-red/10 border border-ballers-red/30 text-ballers-red rounded-lg p-4 m-4"
        role="alert"
      >
        <p className="font-semibold text-sm">Failed to load cart</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🛒</div>
        <h3 className="text-white font-bold text-lg mb-2">Your cart is empty</h3>
        <p className="text-ballers-muted text-sm mb-6">
          Add some World Cup kits to get started!
        </p>
        <Link
          to="/products"
          className="bg-gold text-navy font-bold uppercase tracking-wider px-6 py-3 rounded-md hover:bg-gold-hover transition-colors text-sm"
        >
          Shop Kits
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-summary flex flex-col h-full">
      {/* Cart Items */}
      <div
        className={`cart-items flex-1 overflow-y-auto ${
          compact ? 'divide-y divide-ballers-border' : ''
        }`}
        aria-label={`Cart items, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
      >
        {items.map((item) => (
          <CartItem key={item._id} item={item} compact={compact} />
        ))}
      </div>

      {/* Order Summary */}
      <div className="cart-totals border-t border-ballers-border pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-ballers-muted">Subtotal ({totalItems} items)</span>
          <span className="text-white font-semibold">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-ballers-muted">Shipping</span>
          <span
            className={shippingCost === 0 ? 'text-green-400 font-semibold' : 'text-white font-semibold'}
          >
            {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>

        {subtotal < 100 && (
          <p className="text-ballers-muted text-xs">
            Add ${(100 - subtotal).toFixed(2)} more for free shipping
          </p>
        )}

        <div className="flex justify-between border-t border-ballers-border pt-3 mt-1">
          <span className="text-white font-bold text-base">Total</span>
          <span className="text-gold font-bold text-lg">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      {showCheckoutButton && (
        <div className="cart-actions mt-4 space-y-2">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-gold text-navy font-bold uppercase tracking-wider py-3.5 rounded-md hover:bg-gold-hover active:scale-95 transition-all duration-200 text-sm"
            aria-label="Proceed to checkout"
          >
            Proceed to Checkout
          </button>
          <Link
            to="/products"
            className="block w-full text-center border border-ballers-border text-white py-3 rounded-md hover:border-gold hover:text-gold transition-colors text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
};

export default CartSummary;
