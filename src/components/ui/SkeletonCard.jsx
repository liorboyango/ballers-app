/**
 * SkeletonCard Component
 * Pulsing skeleton placeholder for product cards during loading.
 * Matches the ProductCard dimensions per design spec.
 */
import React from 'react';

/**
 * @param {Object} props
 * @param {'product'|'team'|'order'} [props.variant='product'] - Card variant
 * @param {string} [props.className] - Additional CSS classes
 */
const SkeletonCard = ({ variant = 'product', className = '' }) => {
  if (variant === 'team') {
    return (
      <div
        className={`
          bg-navy-surface border border-ballers-border rounded-xl overflow-hidden
          animate-pulse ${className}
        `}
        aria-hidden="true"
      >
        {/* Flag image placeholder */}
        <div className="w-full h-40 bg-navy-deep" />
        <div className="p-4 space-y-3">
          {/* Team name */}
          <div className="h-6 bg-navy-deep rounded w-3/4" />
          {/* Group */}
          <div className="h-4 bg-navy-deep rounded w-1/3" />
          {/* Kits count */}
          <div className="h-4 bg-navy-deep rounded w-1/2" />
          {/* Button */}
          <div className="h-10 bg-navy-deep rounded mt-2" />
        </div>
      </div>
    );
  }

  if (variant === 'order') {
    return (
      <div
        className={`
          bg-navy-surface border border-ballers-border rounded-xl p-4
          animate-pulse ${className}
        `}
        aria-hidden="true"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="h-5 bg-navy-deep rounded w-1/3" />
          <div className="h-5 bg-navy-deep rounded w-1/4" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-navy-deep rounded w-full" />
          <div className="h-4 bg-navy-deep rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Default: product card skeleton
  return (
    <div
      className={`
        bg-navy-surface border border-ballers-border rounded-xl overflow-hidden
        animate-pulse ${className}
      `}
      aria-hidden="true"
    >
      {/* Badge placeholder */}
      <div className="relative">
        <div className="absolute top-3 left-3 h-5 w-10 bg-navy-deep rounded" />
        {/* Image placeholder - 3:4 ratio */}
        <div className="w-full" style={{ paddingBottom: '133.33%', background: '#0F3460' }} />
      </div>
      <div className="p-4 space-y-3">
        {/* Product name */}
        <div className="h-5 bg-navy-deep rounded w-3/4" />
        {/* Player name */}
        <div className="h-4 bg-navy-deep rounded w-1/2" />
        {/* Price */}
        <div className="h-6 bg-navy-deep rounded w-1/3" />
        {/* Size selectors */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-8 bg-navy-deep rounded" />
          ))}
        </div>
        {/* Add to cart button */}
        <div className="h-10 bg-navy-deep rounded mt-2" />
      </div>
    </div>
  );
};

/**
 * SkeletonGrid - renders multiple skeleton cards in a grid
 * @param {Object} props
 * @param {number} [props.count=6] - Number of skeleton cards
 * @param {'product'|'team'|'order'} [props.variant='product'] - Card variant
 */
export const SkeletonGrid = ({ count = 6, variant = 'product' }) => (
  <div
    className={`
      grid gap-6
      ${variant === 'team'
        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }
    `}
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} variant={variant} />
    ))}
  </div>
);

export default SkeletonCard;
