/**
 * PageLoader Component
 * Full-page loading spinner shown during lazy-loaded page transitions.
 */
import React from 'react';

function PageLoader() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div
          className="w-12 h-12 border-4 border-ballers-border border-t-gold
                     rounded-full animate-spin"
          aria-hidden="true"
        />
        <p className="text-ballers-muted text-sm font-medium uppercase tracking-widest">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default PageLoader;
