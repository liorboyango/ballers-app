/**
 * CartPage
 * Displays cart items with quantity controls and checkout CTA.
 * Syncs with backend cart API when authenticated.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';
import { API_BASE_URL } from '../services/api';

/**
 * CartItem component
 */
const CartItem = ({ item, onUpdate, onRemove, updating }) => {
  const imageUrl = item.product?.images?.[0]
    ? `${API_BASE_URL.replace('/api', '')}${item.product.images[0]}`
    : null;

  const { customization = {} } = item;

  return (
    <div className="flex gap-4 py-5 border-b border-ballers-border last:border-0">
      {/* Image */}
      <div className="w-20 h-24 flex-shrink-0 bg-navy-deep rounded-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.product?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">⚽</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm truncate">
          {item.product?.name || 'Product'}
        </h3>
        <div className="text-ballers-muted text-xs mt-1 space-y-0.5">
          {customization.size && <p>Size: {customization.size}</p>}
          {customization.number && <p>#{customization.number}</p>}
          {customization.name && <p>Name: {customization.name}</p>}
        </div>
        <p className="text-gold font-bold mt-2">${(item.price * item.quantity).toFixed(2)}</p>
      </div>

      {/* Quantity controls */}
      <div className="flex flex-col items-end gap-3">
        <button
          onClick={() => onRemove(item._id)}
          disabled={updating}
          className="text-ballers-muted hover:text-ballers-red transition-colors text-lg"
          aria-label="Remove item"
        >
          ×
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(item._id, { quantity: Math.max(1, item.quantity - 1) })}
            disabled={updating || item.quantity <= 1}
            className="
              w-7 h-7 rounded border border-ballers-border text-white
              hover:border-gold hover:text-gold transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center text-sm
            "
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item._id, { quantity: item.quantity + 1 })}
            disabled={updating || item.quantity >= 99}
            className="
              w-7 h-7 rounded border border-ballers-border text-white
              hover:border-gold hover:text-gold transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center text-sm
            "
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * CartPage component
 */
const CartPage = () => {
  const { items, totalItems, totalPrice, loading, error, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const shippingCost = totalPrice >= 100 ? 0 : 9.99;
  const orderTotal = totalPrice + shippingCost;

  if (loading) {
    return (
      <main className="min-h-screen bg-navy pt-20 flex items-center justify-center">
        <LoadingSpinner size="xl" message="Loading your cart..." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-bebas text-5xl text-white tracking-wide mb-8">
          Your Cart
          {totalItems > 0 && (
            <span className="text-ballers-muted text-2xl ml-3">({totalItems} items)</span>
          )}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            message="Looks like you haven't added any kits yet. Start shopping!"
            icon="🛒"
            actionLabel="Browse Kits"
            actionTo="/products"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <div className="bg-navy-surface border border-ballers-border rounded-xl p-6">
                {items.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    updating={loading}
                  />
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-navy-surface border border-ballers-border rounded-xl p-6 sticky top-24">
                <h2 className="font-bebas text-2xl text-white tracking-wide mb-5">Order Summary</h2>

                <div className="space-y-3 mb-5">
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
                  {totalPrice < 100 && (
                    <p className="text-xs text-ballers-muted">
                      Add ${(100 - totalPrice).toFixed(2)} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-ballers-border pt-3 flex justify-between">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-gold font-bold text-lg">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: '/checkout' } });
                    } else {
                      navigate('/checkout');
                    }
                  }}
                  className="
                    w-full py-4 bg-gold text-navy font-bold uppercase tracking-wider
                    rounded-lg hover:bg-gold-hover transition-colors text-sm
                  "
                >
                  {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                </button>

                <Link
                  to="/products"
                  className="
                    block text-center mt-3 text-ballers-muted text-sm
                    hover:text-gold transition-colors
                  "
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;
