/**
 * Product Detail Page — matches shop_screen design.
 * Product data and imagery come from the backend via useProduct(id) and
 * a "Complete the Kit" row from useProducts.
 */
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProduct, useProducts } from '../hooks/useProducts';
import { getProductImage, getProductImages } from '../utils/imageUrl';
import { SIZES } from '../utils/constants';

function CompleteTheKit({ excludeId }) {
  const { products, loading } = useProducts({ limit: 4 });
  const list = (products || []).filter((p) => (p._id || p.id) !== excludeId).slice(0, 3);

  return (
    <section className="mt-16">
      <h2 className="text-display text-2xl text-ink mb-5">Complete the Kit</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-square skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 rounded skeleton" />
                <div className="h-4 w-1/3 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-ink-muted">No related products yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {list.map((r) => {
            const img = getProductImage(r);
            const id = r._id || r.id;
            return (
              <Link
                key={id}
                to={`/product/${id}`}
                className="card overflow-hidden group hover:shadow-card-hover transition-shadow"
              >
                <div className="aspect-square bg-surface-sunken relative">
                  {img && (
                    <img
                      src={img}
                      alt={r.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-ink">{r.name}</h3>
                  <p className="mt-1 font-bold text-ink">${Number(r.price ?? 0).toFixed(0)}</p>
                </div>
              </Link>
            );
          }}
        </div>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <div className="aspect-square rounded-xl skeleton" />
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="aspect-square rounded-lg skeleton" />
          <div className="aspect-square rounded-lg skeleton" />
          <div className="aspect-square rounded-lg skeleton" />
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <div className="h-5 w-32 rounded skeleton" />
        <div className="h-8 w-2/3 rounded skeleton" />
        <div className="h-6 w-24 rounded skeleton" />
        <div className="h-4 w-full rounded skeleton" />
        <div className="h-4 w-5/6 rounded skeleton" />
        <div className="h-12 w-full rounded skeleton mt-6" />
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { addItem: addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [personalize, setPersonalize] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [sizeError, setSizeError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const images = product ? getProductImages(product) : [];
  const sizes = product?.sizes?.length ? product.sizes : SIZES;

  const handleAddToCart = async () => {
    if (!product) return;
    if (!selectedSize) {
      setSizeError('Please select a size');
      return;
    }
    setSizeError('');
    setAddError('');
    setAdding(true);
    try {
      await addToCart({
        productId: product._id || product.id,
        quantity: 1,
        customization: {
          size: selectedSize,
          ...(personalize ? { playerName, playerNumber } : {})
        }
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      setAddError(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page-enter min-h-screen">
      <div className="container-ballers py-8">
        <nav className="text-xs text-ink-muted mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-brand">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product?.name || 'Product'}</span>
        </nav>

        {error ? (
          <div className="card p-10 text-center">
            <p className="text-accent-danger text-sm">
              {typeof error === 'string' ? error : 'Failed to load product.'}
            </p>
            <Link to="/products" className="btn-secondary mt-4">Back to Shop</Link>
          </div>
        ) : loading || !product ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Gallery */}
              <div>
                <div className="aspect-square rounded-xl overflow-hidden bg-surface-sunken flex items-center justify-center">
                  {images[activeImage] ? (
                    <img
                      src={images[activeImage]}
                      alt={`${product.name} - view ${activeImage + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-7xl" aria-hidden="true">👕</span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center bg-surface-sunken ${
                          activeImage === idx ? 'border-brand' : 'border-line hover:border-ink-faint'
                        }`}
                        aria-label={`View image ${idx + 1}`}
                        aria-pressed={activeImage === idx}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="card p-6 lg:p-8">
                {product.kitType && (
                  <span className="badge-edition">{product.kitType.toUpperCase()} KIT</span>
                )}
                <h1 className="text-display text-3xl text-ink mt-3">{product.name}</h1>
                <p className="text-2xl font-bold text-ink mt-2">${Number(product.price ?? 0).toFixed(2)}</p>

                {product.description && (
                  <p className="text-sm text-ink-muted leading-relaxed mt-4">
                    {product.description}
                  </p>
                )}

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-ink">Select Size</h2>
                    <button className="text-xs text-brand hover:underline">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => { setSelectedSize(size); setSizeError(''); }}
                        className={`size-btn ${selectedSize === size ? 'size-btn-selected' : ''}`}
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {sizeError && (
                    <p className="text-accent-danger text-xs mt-2" role="alert">{sizeError}</p>
                  )}
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={personalize}
                      onChange={(e) => setPersonalize(e.target.checked)}
                      className="w-4 h-4 rounded border-line text-brand focus:ring-brand/40"
                    />
                    <span className="text-sm font-semibold text-ink">Personalize</span>
                    <span className="text-xs text-ink-muted">Add a name & number to make it your own (+$15)</span>
                  </label>

                  {personalize && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 20))}
                        placeholder="Name"
                        className="input-field text-sm"
                        aria-label="Player name"
                      />
                      <input
                        type="number"
                        value={playerNumber}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || (Number(v) >= 1 && Number(v) <= 99)) setPlayerNumber(v);
                        }}
                        placeholder="Number"
                        min="1"
                        max="99"
                        className="input-field text-sm"
                        aria-label="Player number"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`btn-primary w-full mt-6 text-base py-4 ${addedToCart ? 'bg-brand-dark' : ''} ${adding ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Add to cart"
                >
                  {adding ? 'Adding...' : addedToCart ? '✓ Added to Cart' : `Add to Cart — $${Number(product.price ?? 0).toFixed(2)}`}
                </button>
                {addError && (
                  <p className="text-accent-danger text-xs mt-2" role="alert">{addError}</p>
                )}
                <p className="text-center text-xs text-ink-muted mt-3">
                  <span aria-hidden="true">🚚</span> Free shipping on orders over $100
                </p>
              </div>
            </div>

            <CompleteTheKit excludeId={product._id || product.id} />
          </>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
