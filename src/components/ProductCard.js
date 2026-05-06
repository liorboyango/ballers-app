import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

/**
 * ProductCard component
 * Displays a product with image, name, price, size selector, and add-to-cart button.
 * Follows the Ballers design system: dark navy cards with gold accents.
 */
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  if (!product) return null;

  const {
    _id,
    name,
    price,
    images = [],
    team,
    kitType,
    isNew,
    onSale,
    originalPrice,
    inStock = true,
    slug,
  } = product;

  const imageUrl = images[0]
    ? images[0].startsWith('http')
      ? images[0]
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${images[0]}`
    : '/placeholder-kit.png';

  const teamName =
    typeof team === 'object' ? team?.name || team?.country || '' : '';

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!selectedSize) {
      setError('Please select a size');
      return;
    }
    setError('');
    setAdding(true);
    try {
      await addToCart({
        productId: _id,
        quantity: 1,
        customization: { size: selectedSize },
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setError(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${_id}`);
  };

  return (
    <article
      className="product-card group relative flex flex-col bg-surface border border-ballers-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-gold hover:shadow-gold-glow"
      onClick={handleCardClick}
      aria-label={`${name} - $${price}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {isNew && (
          <span className="badge-new bg-gold text-navy text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            NEW
          </span>
        )}
        {onSale && (
          <span className="badge-sale bg-ballers-red text-white text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            SALE
          </span>
        )}
        {!inStock && (
          <span className="badge-out bg-gray-700 text-ballers-muted text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            OUT OF STOCK
          </span>
        )}
      </div>

      {/* Product Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = '/placeholder-kit.png';
          }}
        />
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-semibold text-sm uppercase tracking-wider">
            View Details
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Team & Kit Type */}
        {teamName && (
          <p className="text-ballers-muted text-xs uppercase tracking-wider">
            {teamName}
            {kitType && ` · ${kitType.charAt(0).toUpperCase() + kitType.slice(1)}`}
          </p>
        )}

        {/* Product Name */}
        <h3 className="text-white font-bold text-base leading-tight line-clamp-2">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-gold font-bold text-lg">${price?.toFixed(2)}</span>
          {onSale && originalPrice && (
            <span className="text-ballers-muted text-sm line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Size Selector */}
        <div
          className="flex flex-wrap gap-1 mt-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Select size"
        >
          {sizes.map((size) => (
            <button
              key={size}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSize(size);
                setError('');
              }}
              className={`size-btn text-xs px-2 py-1 rounded border transition-all duration-150 ${
                selectedSize === size
                  ? 'bg-gold text-navy border-gold font-bold'
                  : 'border-ballers-border text-ballers-muted hover:border-gold hover:text-white'
              }`}
              aria-pressed={selectedSize === size}
              aria-label={`Size ${size}`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-ballers-red text-xs mt-1" role="alert">
            {error}
          </p>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className={`mt-auto w-full py-2.5 rounded-md font-bold uppercase tracking-wider text-sm transition-all duration-200 ${
            !inStock
              ? 'bg-gray-700 text-ballers-muted cursor-not-allowed'
              : added
              ? 'bg-green-600 text-white'
              : 'bg-gold text-navy hover:bg-gold-hover active:scale-95'
          }`}
          aria-label={added ? 'Added to cart' : 'Add to cart'}
        >
          {!inStock ? 'Out of Stock' : adding ? 'Adding...' : added ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
