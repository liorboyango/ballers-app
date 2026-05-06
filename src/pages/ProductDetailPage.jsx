/**
 * ProductDetailPage
 * Displays full product details with customization form and add-to-cart.
 * Fetches data from GET /api/products/:id with loading/error states.
 */
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';
import { API_BASE_URL } from '../services/api';
import useCart from '../hooks/useCart';
import { useToast } from '../context/ToastContext';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/**
 * ProductDetailPage component
 */
const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, loading, error, refetch } = useProduct(id);
  const { addItem, loading: cartLoading } = useCart();
  const toast = useToast();

  const [selectedSize, setSelectedSize] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [jerseyName, setJerseyName] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const getImageUrl = (path) =>
    path ? `${API_BASE_URL.replace('/api', '')}${path}` : null;

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.warning('Please select a size');
      return;
    }
    if (jerseyNumber && (parseInt(jerseyNumber) < 1 || parseInt(jerseyNumber) > 99)) {
      toast.warning('Jersey number must be between 1 and 99');
      return;
    }

    setAdding(true);
    try {
      await addItem({
        productId: product._id,
        quantity: 1,
        customization: {
          size: selectedSize,
          number: jerseyNumber ? parseInt(jerseyNumber) : undefined,
          name: jerseyName || undefined,
        },
        product,
        price: product.price,
      });
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-navy pt-20 flex items-center justify-center">
        <LoadingSpinner size="xl" message="Loading product..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-navy pt-20">
        <ErrorMessage message={error} onRetry={refetch} fullPage />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-navy pt-20">
        <EmptyState
          title="Product not found"
          message="This product doesn't exist or has been removed."
          icon="⚽"
          actionLabel="Browse Products"
          actionTo="/products"
        />
      </main>
    );
  }

  const images = product.images || [];
  const mainImage = getImageUrl(images[selectedImageIndex]);
  const availableSizes = product.sizes || SIZES;

  return (
    <main className="min-h-screen bg-navy pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-ballers-muted mb-8" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gold transition-colors">Products</Link>
          {product.team && (
            <>
              <span>/</span>
              <Link
                to={`/products?teamId=${product.team._id}`}
                className="hover:text-gold transition-colors"
              >
                {product.team.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-white truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative bg-navy-surface border border-ballers-border rounded-xl overflow-hidden"
              style={{ paddingBottom: '125%' }}>
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl" role="img" aria-label="jersey">⚽</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`
                      flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors
                      ${selectedImageIndex === idx ? 'border-gold' : 'border-ballers-border hover:border-gold/50'}
                    `}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={selectedImageIndex === idx}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Team & product name */}
            {product.team && (
              <Link
                to={`/products?teamId=${product.team._id}`}
                className="text-ballers-muted text-sm hover:text-gold transition-colors uppercase tracking-wider"
              >
                {product.team.name}
              </Link>
            )}
            <h1 className="font-bebas text-4xl sm:text-5xl text-white tracking-wide">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gold">${product.price?.toFixed(2)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-ballers-muted line-through text-lg">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Customization form */}
            <div className="bg-navy-surface border border-ballers-border rounded-xl p-6 space-y-5">
              <h2 className="font-bebas text-xl text-white tracking-wide">Customize Your Kit</h2>

              {/* Jersey preview */}
              <div className="text-center py-4 border border-ballers-border rounded-lg bg-navy">
                <div
                  className="font-mono text-5xl text-gold"
                  aria-label={`Jersey number: ${jerseyNumber || '?'}`}
                >
                  {jerseyNumber || '?'}
                </div>
                <div className="text-white font-bold text-lg mt-1 uppercase tracking-widest">
                  {jerseyName || 'YOUR NAME'}
                </div>
              </div>

              {/* Jersey number */}
              <div>
                <label htmlFor="jersey-number" className="block text-ballers-muted text-sm mb-2">
                  Jersey Number (1-99)
                </label>
                <input
                  id="jersey-number"
                  type="number"
                  min="1"
                  max="99"
                  placeholder="e.g. 10"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  className="
                    w-full px-4 py-3 bg-navy border border-ballers-border rounded-lg
                    text-white placeholder-ballers-muted
                    focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
                    transition-colors
                  "
                />
              </div>

              {/* Jersey name */}
              <div>
                <label htmlFor="jersey-name" className="block text-ballers-muted text-sm mb-2">
                  Name on Jersey
                </label>
                <input
                  id="jersey-name"
                  type="text"
                  maxLength={20}
                  placeholder="e.g. MESSI"
                  value={jerseyName}
                  onChange={(e) => setJerseyName(e.target.value.toUpperCase())}
                  className="
                    w-full px-4 py-3 bg-navy border border-ballers-border rounded-lg
                    text-white placeholder-ballers-muted uppercase
                    focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30
                    transition-colors
                  "
                />
              </div>

              {/* Size selector */}
              <div>
                <label className="block text-ballers-muted text-sm mb-2">
                  Size <span className="text-ballers-red">*</span>
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        px-4 py-2 border rounded-lg text-sm font-semibold transition-colors
                        ${
                          selectedSize === size
                            ? 'bg-gold text-navy border-gold'
                            : 'border-ballers-border text-ballers-muted hover:border-gold hover:text-white'
                        }
                      `}
                      aria-pressed={selectedSize === size}
                      aria-label={`Size ${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={adding || cartLoading}
                className="
                  w-full py-4 bg-gold text-navy font-bold uppercase tracking-wider
                  rounded-lg hover:bg-gold-hover transition-colors text-base
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
                aria-label="Add to cart"
              >
                {adding ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Adding...
                  </>
                ) : (
                  'Add to Cart'
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 text-xs text-ballers-muted">
              <span className="flex items-center gap-1">
                <span className="text-green-400">✓</span> Official Replica
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-400">✓</span> World Cup 2026 Licensed
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-400">✓</span> Free shipping over $100
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex border-b border-ballers-border">
            {['details', 'size-guide', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors
                  ${
                    activeTab === tab
                      ? 'text-gold border-b-2 border-gold'
                      : 'text-ballers-muted hover:text-white'
                  }
                `}
                aria-selected={activeTab === tab}
                role="tab"
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="py-8 text-ballers-muted" role="tabpanel">
            {activeTab === 'details' && (
              <div className="space-y-3">
                <p>{product.description || 'Official replica kit for World Cup 2026.'}</p>
                {product.kitType && (
                  <p><span className="text-white font-semibold">Kit Type:</span> {product.kitType}</p>
                )}
                {product.material && (
                  <p><span className="text-white font-semibold">Material:</span> {product.material}</p>
                )}
              </div>
            )}
            {activeTab === 'size-guide' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ballers-border">
                      {['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)'].map((h) => (
                        <th key={h} className="text-left py-2 pr-6 text-white font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[['XS', '34-36', '27', '16'], ['S', '36-38', '28', '17'], ['M', '38-40', '29', '18'],
                      ['L', '40-42', '30', '19'], ['XL', '42-44', '31', '20'], ['XXL', '44-46', '32', '21']].map(([s, c, l, sh]) => (
                      <tr key={s} className="border-b border-ballers-border/50">
                        <td className="py-2 pr-6 text-white font-semibold">{s}</td>
                        <td className="py-2 pr-6">{c}</td>
                        <td className="py-2 pr-6">{l}</td>
                        <td className="py-2 pr-6">{sh}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'reviews' && (
              <p className="text-ballers-muted">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetailPage;
