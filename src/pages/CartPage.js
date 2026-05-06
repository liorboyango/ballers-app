/**
 * Cart Page
 * Displays cart items with quantity controls, customization details,
 * and order summary with checkout CTA.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

/**
 * Cart item row component.
 */
function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 py-6 border-b border-ballers-border">
      {/* Product image */}
      <div className="w-20 h-24 bg-navy-deep rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl" aria-hidden="true">👕</span>
        )}
      </div>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <p className="text-ballers-muted text-xs uppercase tracking-widest">{item.teamName}</p>
        <h3 className="font-semibold text-white text-sm leading-tight mt-0.5">{item.name}</h3>

        {/* Customization */}
        {item.customization && (
          <p className="text-ballers-muted text-xs mt-1">
            {item.customization.playerNumber && `#${item.customization.playerNumber}`}
            {item.customization.playerNumber && item.customization.playerName && ' / '}
            {item.customization.playerName}
            {' / '}
          </p>
        )}
        <p className="text-ballers-muted text-xs">
          Size: <span className="text-white">{item.size}</span>
        </p>

        {/* Price & controls */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-gold font-bold">${(item.price * item.quantity).toFixed(2)}</p>

          <div className="flex items-center gap-2">
            {/* Quantity controls */}
            <div className="flex items-center border border-ballers-border rounded-lg overflow-hidden">
              <button
                onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                className="px-3 py-1.5 text-white hover:bg-navy-deep hover:text-gold
                           transition-colors text-sm"
                aria-label={`Decrease quantity of ${item.name}`}
              >
                −
              </button>
              <span
                className="px-3 py-1.5 text-white text-sm border-x border-ballers-border"
                aria-live="polite"
                aria-label={`Quantity: ${item.quantity}`}
              >
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                className="px-3 py-1.5 text-white hover:bg-navy-deep hover:text-gold
                           transition-colors text-sm"
                aria-label={`Increase quantity of ${item.name}`}
              >
                +
              </button>
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeFromCart(item.cartKey)}
              className="p-1.5 text-ballers-muted hover:text-ballers-red transition-colors"
              aria-label={`Remove ${item.name} from cart`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Order summary sidebar.
 */
function OrderSummary({ subtotal, itemCount }) {
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping
  const total = subtotal + shipping;

  return (
    <div className="bg-navy-surface border border-ballers-border rounded-xl p-6 sticky top-24">
      <h2 className="font-bebas text-xl text-white tracking-wider mb-6">ORDER SUMMARY</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-ballers-muted">Subtotal ({itemCount} items)</span>
          <span className="text-white">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ballers-muted">Shipping</span>
          <span className="text-ballers-success font-medium">Free</span>
        </div>
      </div>

      <div className="border-t border-ballers-border mt-4 pt-4">
        <div className="flex justify-between">
          <span className="text-white font-bold uppercase tracking-wider">Total</span>
          <span className="text-gold font-bold text-xl">${total.toFixed(2)}</span>
        </div>
      </div>

      <Link
        to="/checkout"
        className="btn-primary w-full mt-6 text-center block"
      >
        Proceed to Checkout
      </Link>

      <Link
        to="/products"
        className="block text-center text-ballers-muted text-sm mt-4
                   hover:text-gold transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

/**
 * Cart Page - main component.
 */
function CartPage() {
  const { items, itemCount, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="page-enter min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-8xl mb-6" aria-hidden="true">🛒</div>
          <h1 className="font-bebas text-4xl text-white mb-4">YOUR CART IS EMPTY</h1>
          <p className="text-ballers-muted mb-8">
            Looks like you haven't added any kits yet.
          </p>
          <Link to="/products" className="btn-primary text-lg px-8 py-4">
            Shop World Cup Kits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen">
      {/* Page header */}
      <div className="bg-navy-surface border-b border-ballers-border py-8">
        <div className="container-ballers">
          <div className="flex items-center justify-between">
            <h1 className="font-bebas text-section text-white">
              YOUR CART
              <span className="text-ballers-muted text-2xl ml-3">({itemCount} items)</span>
            </h1>
            <button
              onClick={clearCart}
              className="text-ballers-muted text-sm hover:text-ballers-red transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* Cart content */}
      <div className="container-ballers py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div role="list" aria-label="Cart items">
              {items.map((item) => (
                <div key={item.cartKey} role="listitem">
                  <CartItem item={item} />
                </div>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div>
            <OrderSummary subtotal={subtotal} itemCount={itemCount} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
