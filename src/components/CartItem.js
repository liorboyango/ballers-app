import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { getProductImage } from '../utils/imageUrl';

/**
 * CartItem component
 * Displays a single cart item with product image, details, quantity controls, and remove button.
 * Shows customization details (size, number, name).
 */
const CartItem = ({ item, compact = false }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (!item) return null;

  const { _id, product, quantity, price, customization } = item;

  const productName = product?.name || 'Unknown Product';
  const productImage = getProductImage(product) || '/placeholder-kit.png';

  const teamName =
    product?.team && typeof product.team === 'object'
      ? product.team.name || product.team.country || ''
      : '';

  const handleQuantityChange = async (newQty) => {
    if (newQty < 1 || newQty > 99 || updating) return;
    setUpdating(true);
    try {
      await updateCartItem({ itemId: _id, quantity: newQty });
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await removeFromCart(_id);
    } catch (err) {
      console.error('Failed to remove item:', err);
      setRemoving(false);
    }
  };

  return (
    <div
      className={`cart-item flex gap-3 ${
        compact ? 'py-3' : 'py-4'
      } ${removing ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}
      aria-label={`${productName} in cart`}
    >
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={productImage}
          alt={productName}
          className={`object-cover rounded-lg ${
            compact ? 'w-14 h-14' : 'w-20 h-20'
          }`}
          loading="lazy"
          onError={(e) => {
            e.target.src = '/placeholder-kit.png';
          }}
        />
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            {teamName && (
              <p className="text-ballers-muted text-xs uppercase tracking-wider truncate">
                {teamName}
              </p>
            )}
            <h4 className="text-white font-semibold text-sm leading-tight truncate">
              {productName}
            </h4>

            {/* Customization details */}
            {customization && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                {customization.size && (
                  <span className="text-ballers-muted text-xs">
                    Size: <span className="text-white">{customization.size}</span>
                  </span>
                )}
                {customization.number && (
                  <span className="text-ballers-muted text-xs">
                    #{customization.number}
                  </span>
                )}
                {customization.name && (
                  <span className="text-ballers-muted text-xs">
                    {customization.name}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex-shrink-0 text-ballers-muted hover:text-ballers-red transition-colors p-1 rounded"
            aria-label={`Remove ${productName} from cart`}
          >
            <svg
              className="w-4 h-4"
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

        {/* Price & Quantity */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-gold font-bold text-sm">
            ${(price * quantity).toFixed(2)}
          </span>

          {/* Quantity Controls */}
          <div
            className="flex items-center gap-1 border border-ballers-border rounded-lg overflow-hidden"
            aria-label="Quantity controls"
          >
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || updating}
              className="w-7 h-7 flex items-center justify-center text-white hover:bg-navy-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <span
              className="w-8 text-center text-white text-sm font-semibold"
              aria-live="polite"
              aria-label={`Quantity: ${quantity}`}
            >
              {updating ? '...' : quantity}
            </span>

            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 99 || updating}
              className="w-7 h-7 flex items-center justify-center text-white hover:bg-navy-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
