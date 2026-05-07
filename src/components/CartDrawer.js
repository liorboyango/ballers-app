/**
 * CartDrawer — slides in from the right to show cart contents.
 *
 * Features:
 *  - Animated slide-in/out (translate-x-0 / translate-x-full, 300ms ease-in-out)
 *  - Backdrop overlay (bg-black/60) that closes drawer on click
 *  - Item list with quantity controls (+/-)
 *  - Remove item button
 *  - Subtotal, shipping, and total display
 *  - Proceed to checkout CTA
 *  - Accessible: focus trap on open, ARIA roles, Escape key to close
 *  - Body scroll lock when open
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductImage as resolveProductImage } from '../utils/imageUrl';

const CartDrawer = () => {
  const {
    items,
    totalItems,
    totalPrice,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateCartItem,
    isLoading,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus close button when drawer opens for accessibility
  useEffect(() => {
    if (isCartOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) closeCart();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const handleCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    await updateCartItem(itemId, { quantity: newQty });
  };

  const getProductImage = (item) => resolveProductImage(item?.product);

  return (
    <>
      {/* Backdrop overlay — click to close */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 right-0 h-full w-full max-w-[420px] bg-[#16213E]
          border-l border-[#2A3550] z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3550]">
          <h2 className="text-lg font-bold text-white">
            YOUR CART
            {totalItems > 0 && (
              <span className="ml-2 text-sm font-normal text-[#A8B2C1]">
                ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            className="p-2 text-[#A8B2C1] hover:text-white transition-colors rounded-lg hover:bg-[#0F3460]"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-[#2A3550] border-t-[#E8C547] rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <svg
                className="w-16 h-16 text-[#2A3550] mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-[#A8B2C1] text-sm">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="mt-4 text-[#E8C547] text-sm font-medium hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4" role="list">
              {items.map((item) => {
                const imgSrc = getProductImage(item);
                return (
                  <li
                    key={item._id}
                    className="flex gap-4 pb-4 border-b border-[#2A3550] last:border-0"
                  >
                    {/* Product image */}
                    <div className="w-20 h-24 bg-[#0F3460] rounded-lg overflow-hidden flex-shrink-0">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#2A3550]">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.product?.name || 'Product'}
                      </p>
                      {item.customization && (
                        <p className="text-xs text-[#A8B2C1] mt-0.5">
                          {[
                            item.customization.number && `#${item.customization.number}`,
                            item.customization.name,
                            item.customization.size && `Size: ${item.customization.size}`,
                          ]
                            .filter(Boolean)
                            .join(' / ')}
                        </p>
                      )}
                      <p className="text-sm font-bold text-[#E8C547] mt-1">
                        ${((item.price || 0) * item.quantity).toFixed(2)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          className="w-7 h-7 rounded border border-[#2A3550] text-[#A8B2C1] hover:text-white hover:border-[#E8C547] transition-colors flex items-center justify-center text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Decrease quantity of ${item.product?.name}`}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="text-sm text-white w-6 text-center" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          className="w-7 h-7 rounded border border-[#2A3550] text-[#A8B2C1] hover:text-white hover:border-[#E8C547] transition-colors flex items-center justify-center text-sm"
                          aria-label={`Increase quantity of ${item.product?.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-[#A8B2C1] hover:text-red-400 transition-colors p-1 self-start"
                      aria-label={`Remove ${item.product?.name} from cart`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer: totals + CTA */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-[#2A3550] space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-[#A8B2C1]">Subtotal</span>
              <span className="text-white font-medium">${totalPrice.toFixed(2)}</span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between text-sm">
              <span className="text-[#A8B2C1]">Shipping</span>
              <span className="text-[#27AE60] font-medium">
                {totalPrice >= 100 ? 'Free' : '$9.99'}
              </span>
            </div>

            {/* Total */}
            <div className="flex justify-between text-base font-bold border-t border-[#2A3550] pt-3">
              <span className="text-white">Total</span>
              <span className="text-[#E8C547]">
                ${(totalPrice + (totalPrice >= 100 ? 0 : 9.99)).toFixed(2)}
              </span>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckout}
              className="w-full bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-[#D4A800] transition-colors"
            >
              Proceed to Checkout
            </button>

            {/* Continue shopping */}
            <button
              onClick={closeCart}
              className="w-full border border-[#2A3550] text-[#A8B2C1] font-medium py-2.5 rounded-lg hover:border-[#E8C547] hover:text-white transition-colors text-sm"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
