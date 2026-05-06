/**
 * Product Detail Page
 * Shows full product details with image gallery, customization form,
 * size selector, and add-to-cart functionality.
 */
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SIZES } from '../utils/constants';

/**
 * Tab component for product description section.
 */
function ProductTabs() {
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'size-guide', label: 'Size Guide' },
    { id: 'reviews', label: 'Reviews' },
  ];

  const content = {
    details: (
      <div className="text-ballers-muted text-sm leading-relaxed space-y-4">
        <p>
          Official replica kit for the 2026 FIFA World Cup. Made with high-performance
          moisture-wicking fabric for maximum comfort on and off the pitch.
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>100% Polyester performance fabric</li>
          <li>Official World Cup 2026 licensed product</li>
          <li>Authentic team badge and sponsor logos</li>
          <li>Machine washable at 30°C</li>
          <li>Available in sizes XS to XXL</li>
        </ul>
      </div>
    ),
    'size-guide': (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-ballers-muted">
          <thead>
            <tr className="border-b border-ballers-border">
              <th className="text-left py-2 pr-4 text-white">Size</th>
              <th className="text-left py-2 pr-4">Chest (cm)</th>
              <th className="text-left py-2 pr-4">Length (cm)</th>
            </tr>
          </thead>
          <tbody>
            {[['XS', '86-91', '68'], ['S', '91-96', '70'], ['M', '96-101', '72'],
              ['L', '101-106', '74'], ['XL', '106-111', '76'], ['XXL', '111-116', '78']].map(([size, chest, length]) => (
              <tr key={size} className="border-b border-ballers-border/50">
                <td className="py-2 pr-4 text-white font-medium">{size}</td>
                <td className="py-2 pr-4">{chest}</td>
                <td className="py-2 pr-4">{length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    reviews: (
      <div className="text-ballers-muted text-sm">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    ),
  };

  return (
    <div className="mt-12">
      {/* Tab buttons */}
      <div className="flex border-b border-ballers-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium uppercase tracking-wider
                        transition-colors duration-200 border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-gold border-gold'
                : 'text-ballers-muted border-transparent hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6" role="tabpanel">
        {content[activeTab]}
      </div>
    </div>
  );
}

/**
 * Product Detail Page - main component.
 */
function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleDrawer } = useCart();

  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState({ playerName: '', playerNumber: '' });
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState('');

  // Placeholder product data - will be replaced with API data in task 5
  const product = {
    _id: id,
    id,
    name: 'Brazil Home Kit 2026',
    teamName: 'Brazil',
    price: 129.99,
    description: 'Official Brazil home kit for the 2026 FIFA World Cup.',
    images: [],
    sizes: SIZES,
    isNew: true,
    kitType: 'home',
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError('Please select a size');
      return;
    }
    setSizeError('');

    addToCart(
      product,
      selectedSize,
      quantity,
      customization.playerName || customization.playerNumber ? customization : null
    );

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="page-enter min-h-screen">
      <div className="container-ballers py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-ballers-muted mb-8" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/teams" className="hover:text-gold transition-colors">Teams</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/products/${product.id}`} className="hover:text-gold transition-colors">
            {product.teamName}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white">{product.name}</span>
        </nav>

        {/* Product layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image Gallery */}
          <div>
            {/* Main image */}
            <div className="aspect-[4/5] bg-navy-surface border border-ballers-border rounded-xl
                            flex items-center justify-center overflow-hidden">
              {product.images[activeImage] ? (
                <img
                  src={product.images[activeImage]}
                  alt={`${product.name} - view ${activeImage + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <span className="text-8xl" aria-hidden="true">👕</span>
                  <p className="text-ballers-muted text-sm mt-4">Product image coming soon</p>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImage === idx ? 'border-gold' : 'border-ballers-border'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={activeImage === idx}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {product.isNew && <span className="badge-new">NEW</span>}
              <span className="bg-navy-deep text-ballers-muted text-[10px] font-bold uppercase
                               px-2 py-0.5 rounded">
                {product.kitType} kit
              </span>
            </div>

            {/* Team & Product name */}
            <p className="text-ballers-muted text-sm uppercase tracking-widest mb-1">
              {product.teamName}
            </p>
            <h1 className="font-bebas text-4xl text-white tracking-wider">{product.name}</h1>

            {/* Price */}
            <p className="text-gold font-bold text-3xl mt-3">${product.price.toFixed(2)}</p>

            {/* Customization */}
            <div className="jersey-preview mt-6">
              <h2 className="font-bebas text-xl text-white tracking-wider mb-4">CUSTOMIZE</h2>

              {/* Live preview */}
              <div className="text-center mb-4 py-4 border-b border-ballers-border">
                <div className="jersey-number">
                  {customization.playerNumber || '00'}
                </div>
                <div className="text-white font-bold text-lg tracking-widest mt-1">
                  {customization.playerName || 'YOUR NAME'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="playerName" className="block text-sm text-ballers-muted mb-1">
                    Name
                  </label>
                  <input
                    id="playerName"
                    type="text"
                    value={customization.playerName}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      playerName: e.target.value.toUpperCase().slice(0, 20)
                    }))}
                    placeholder="e.g. VINI JR"
                    className="input-field text-sm"
                    maxLength={20}
                    aria-label="Player name for jersey"
                  />
                </div>
                <div>
                  <label htmlFor="playerNumber" className="block text-sm text-ballers-muted mb-1">
                    Number
                  </label>
                  <input
                    id="playerNumber"
                    type="number"
                    value={customization.playerNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (Number(val) >= 1 && Number(val) <= 99)) {
                        setCustomization(prev => ({ ...prev, playerNumber: val }));
                      }
                    }}
                    placeholder="10"
                    className="input-field text-sm"
                    min="1"
                    max="99"
                    aria-label="Player number for jersey"
                  />
                </div>
              </div>
            </div>

            {/* Size selector */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white uppercase tracking-wider text-sm">Size</h2>
                <button className="text-gold text-xs hover:underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(''); }}
                    className={`size-btn ${
                      selectedSize === size ? 'size-btn-selected' : ''
                    }`}
                    aria-pressed={selectedSize === size}
                    aria-label={`Size ${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="text-ballers-red text-sm mt-2" role="alert">{sizeError}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <h2 className="font-semibold text-white uppercase tracking-wider text-sm mb-3">
                Quantity
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-ballers-border rounded-lg text-white
                             hover:border-gold hover:text-gold transition-colors flex items-center justify-center"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-white font-medium w-8 text-center" aria-live="polite">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-ballers-border rounded-lg text-white
                             hover:border-gold hover:text-gold transition-colors flex items-center justify-center"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleAddToCart}
                className={`btn-primary w-full text-lg py-4 ${
                  addedToCart ? 'bg-ballers-success' : ''
                }`}
                aria-label="Add to cart"
              >
                {addedToCart ? '✓ Added to Cart!' : 'ADD TO CART'}
              </button>
              <button
                className="btn-secondary w-full text-lg py-4"
                aria-label="Add to wishlist"
              >
                ♡ WISHLIST
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-ballers-border">
              {[
                { icon: '🏆', text: 'Official Replica' },
                { icon: '🚚', text: 'Free Shipping' },
                { icon: '↩️', text: '30-Day Returns' },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-2 text-ballers-muted text-xs">
                  <span aria-hidden="true">{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product tabs */}
        <ProductTabs />
      </div>
    </div>
  );
}

export default ProductDetailPage;
