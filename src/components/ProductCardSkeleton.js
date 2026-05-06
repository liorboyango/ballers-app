import React from 'react';

/**
 * ProductCardSkeleton component
 * Displays a pulsing skeleton placeholder while product data is loading.
 */
const ProductCardSkeleton = () => {
  return (
    <div
      className="product-card-skeleton flex flex-col bg-surface border border-ballers-border rounded-xl overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      {/* Image skeleton */}
      <div
        className="bg-navy-deep w-full"
        style={{ aspectRatio: '3/4' }}
      />

      {/* Content skeleton */}
      <div className="p-4 flex flex-col gap-3">
        {/* Team name */}
        <div className="h-3 bg-navy-deep rounded w-1/3" />
        {/* Product name */}
        <div className="h-4 bg-navy-deep rounded w-3/4" />
        <div className="h-4 bg-navy-deep rounded w-1/2" />
        {/* Price */}
        <div className="h-5 bg-navy-deep rounded w-1/4" />
        {/* Sizes */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-8 bg-navy-deep rounded" />
          ))}
        </div>
        {/* Button */}
        <div className="h-10 bg-navy-deep rounded-md mt-1" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
