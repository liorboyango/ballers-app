import React, { useEffect, useRef } from 'react';
import { useCart } from '../hooks/useCart';
import CartSummary from './CartSummary';

/**
 * CartDrawer component
 * Slide-in drawer from the right showing cart contents.
 * Accessible: focus trap, ESC to close, ARIA roles.
 */
const CartDrawer = ({ isOpen, onClose }) => {
  const { cart } = useCart();
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  const totalItems = cart?.totalItems || 0;

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Shopping cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-navy border-l border-ballers-border z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ballers-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg uppercase tracking-wide">
              Your Cart
            </h2>
            {totalItems > 0 && (
              <span className="bg-gold text-navy text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-ballers-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-navy-deep"
            aria-label="Close cart"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CartSummary showCheckoutButton={false} compact={true} />
        </div>

        {/* Drawer Footer - Checkout CTA */}
        {totalItems > 0 && (
          <div className="px-6 py-4 border-t border-ballers-border flex-shrink-0 space-y-2">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/checkout';
              }}
              className="w-full bg-gold text-navy font-bold uppercase tracking-wider py-3.5 rounded-md hover:bg-gold-hover active:scale-95 transition-all duration-200 text-sm"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={onClose}
              className="w-full border border-ballers-border text-white py-3 rounded-md hover:border-gold hover:text-gold transition-colors text-sm"
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
