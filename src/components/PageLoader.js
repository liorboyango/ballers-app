/**
 * PageLoader — full-page loading spinner shown during lazy page loads
 * and auth verification.
 */
import React from 'react';

const PageLoader = () => {
  return (
    <div
      className="min-h-screen bg-[#1A1A2E] flex items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#2A3550]" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E8C547] animate-spin" />
        </div>
        {/* Brand text */}
        <p className="text-[#A8B2C1] text-sm tracking-widest uppercase">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
