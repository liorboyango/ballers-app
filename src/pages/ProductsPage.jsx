/**
 * ProductsPage
 * Displays products with filtering by team, kit type, size, and price.
 * Fetches data from GET /api/products with loading/error states.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useTeam } from '../hooks/useTeams';
import { LoadingSpinner, ErrorMessage, SkeletonGrid, EmptyState } from '../components/ui';
import { API_BASE_URL } from '../services/api';
import useCart from '../hooks/useCart';
import { useToast } from '../context/ToastContext';

const KIT_TYPES = ['home', 'away', 'third'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/**
 * ProductCard component
 */
const ProductCard = ({ product }) => {
  const { addItem, loading: cartLoading } = useCart();
  const toast = useToast();
  const [selectedSize, setSelectedSize] = useState('');
  const [adding, setAdding] = useState(false);

  const imageUrl = product.images?.[0]
    ? `${API_BASE_URL.replace('/api', '')}${product.images[0]}`
    : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!selectedSize) {
      toast.warning('Please select a size first');
      return;
    }
    setAdding(true);
    try {
      await addItem({
        productId: product._id,
        quantity: 1,
        customization: { size: selectedSize },
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

  const availableSizes = product.sizes || SIZES;

  return (
    <Link
      to={`/product/${product._id}`}
      className="
        group block bg-navy-surface border border-ballers-border rounded-xl overflow-hidden
        hover:border-gold hover:shadow-[0_8px_32px_rgba(232,197,71,0.15)]
        hover:scale-[1.02] transition-all duration-300
      "
    >
      {/* Image */}
      <div className="relative" style={{ paddingBottom: '133.33%' }}>
        {product.isNew && (
          <span className="
            absolute top-3 left-3 z-10 px-2 py-0.5
            bg-gold text-navy text-xs font-bold uppercase tracking-wider rounded
          ">
            New
          </span>
        )}
        {product.onSale && (
          <span className="
            absolute top-3 right-3 z-10 px-2 py-0.5
            bg-ballers-red text-white text-xs font-bold uppercase tracking-wider rounded
          ">
            Sale
          </span>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-navy-deep flex items-center justify-center">
            <span className="text-6xl" role="img" aria-label="jersey">⚽</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-base mb-0.5 truncate">{product.name}</h3>
        {product.team?.name && (
          <p className="text-ballers-muted text-sm mb-1">{product.team.name}</p>
        )}
        <p className="text-gold font-bold text-lg mb-3">${product.price?.toFixed(2)}</p>

        {/* Size selector */}
        <div
          className="flex flex-wrap gap-1.5 mb-3"
          onClick={(e) => e.preventDefault()}
          role="group"
          aria-label="Select size"
        >
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={(e) => {
                e.preventDefault();
                setSelectedSize(size);
              }}
              className={`
                px-2 py-1 text-xs border rounded transition-colors
                ${
                  selectedSize === size
                    ? 'bg-gold text-navy border-gold font-bold'
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

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={adding || cartLoading}
          className="
            w-full py-2.5 bg-gold text-navy font-bold uppercase tracking-wider
            rounded-md hover:bg-gold-hover transition-colors text-sm
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          aria-label={`Add ${product.name} to cart`}
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
};

/**
 * ProductsPage component
 */
const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId');

  const [filters, setFilters] = useState({
    teamId: teamId || undefined,
    kitType: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 12,
  });

  const { team } = useTeam(teamId);
  const { products, pagination, loading, error, refetch, setParams } = useProducts(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined))
  );

  useEffect(() => {
    setFilters((prev) => ({ ...prev, teamId: teamId || undefined, page: 1 }));
  }, [teamId]);

  const updateFilter = useCallback(
    (key, value) => {
      const newFilters = { ...filters, [key]: value, page: 1 };
      setFilters(newFilters);
      setParams(Object.fromEntries(Object.entries(newFilters).filter(([, v]) => v !== '' && v !== undefined)));
    },
    [filters, setParams]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      const newFilters = { ...filters, page: newPage };
      setFilters(newFilters);
      setParams(Object.fromEntries(Object.entries(newFilters).filter(([, v]) => v !== '' && v !== undefined)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters, setParams]
  );

  return (
    <main className="min-h-screen bg-navy pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/teams"
            className="text-ballers-muted hover:text-gold transition-colors flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div>
            <h1 className="font-bebas text-4xl sm:text-5xl text-white tracking-wide">
              {team ? `${team.name} Kits` : 'All Kits'}
            </h1>
            {pagination && (
              <p className="text-ballers-muted text-sm">
                {pagination.total} product{pagination.total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-navy-surface border border-ballers-border rounded-xl p-5 space-y-6">
              <h2 className="font-bebas text-xl text-white tracking-wide">Filters</h2>

              {/* Kit Type */}
              <div>
                <h3 className="text-ballers-muted text-xs uppercase tracking-wider mb-3">Kit Type</h3>
                <div className="space-y-2">
                  {KIT_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="kitType"
                        value={type}
                        checked={filters.kitType === type}
                        onChange={() => updateFilter('kitType', filters.kitType === type ? '' : type)}
                        className="accent-gold"
                      />
                      <span className="text-white capitalize text-sm">{type}</span>
                    </label>
                  ))}
                  {filters.kitType && (
                    <button
                      onClick={() => updateFilter('kitType', '')}
                      className="text-ballers-muted text-xs hover:text-gold transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Size */}
              <div>
                <h3 className="text-ballers-muted text-xs uppercase tracking-wider mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => updateFilter('size', filters.size === size ? '' : size)}
                      className={`
                        px-3 py-1.5 text-sm border rounded transition-colors
                        ${
                          filters.size === size
                            ? 'bg-gold text-navy border-gold font-bold'
                            : 'border-ballers-border text-ballers-muted hover:border-gold hover:text-white'
                        }
                      `}
                      aria-pressed={filters.size === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h3 className="text-ballers-muted text-xs uppercase tracking-wider mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="
                      w-full px-3 py-2 bg-navy border border-ballers-border rounded
                      text-white placeholder-ballers-muted text-sm
                      focus:outline-none focus:border-gold
                    "
                    min="0"
                    aria-label="Minimum price"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="
                      w-full px-3 py-2 bg-navy border border-ballers-border rounded
                      text-white placeholder-ballers-muted text-sm
                      focus:outline-none focus:border-gold
                    "
                    min="0"
                    aria-label="Maximum price"
                  />
                </div>
              </div>

              {/* Reset filters */}
              <button
                onClick={() => {
                  const reset = { teamId: teamId || undefined, kitType: '', size: '', minPrice: '', maxPrice: '', page: 1, limit: 12 };
                  setFilters(reset);
                  setParams(Object.fromEntries(Object.entries(reset).filter(([, v]) => v !== '' && v !== undefined)));
                }}
                className="w-full py-2 border border-ballers-border text-ballers-muted rounded hover:border-gold hover:text-white transition-colors text-sm"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {loading ? (
              <SkeletonGrid count={9} variant="product" />
            ) : error ? (
              <ErrorMessage message={error} onRetry={refetch} />
            ) : products.length === 0 ? (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters or browse all teams."
                icon="⚽"
                actionLabel="Browse Teams"
                actionTo="/teams"
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-4 py-2 border border-ballers-border text-ballers-muted rounded hover:border-gold hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      ←
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`
                          w-10 h-10 rounded border transition-colors
                          ${
                            page === pagination.page
                              ? 'bg-gold text-navy border-gold font-bold'
                              : 'border-ballers-border text-ballers-muted hover:border-gold hover:text-white'
                          }
                        `}
                        aria-label={`Page ${page}`}
                        aria-current={page === pagination.page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 border border-ballers-border text-ballers-muted rounded hover:border-gold hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductsPage;
