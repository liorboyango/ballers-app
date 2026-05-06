/**
 * 404 Not Found Page
 * Displayed when a route doesn't match any defined routes.
 */
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="page-enter min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 display */}
        <div className="font-bebas text-[120px] leading-none text-gold/20 select-none" aria-hidden="true">
          404
        </div>

        <h1 className="font-bebas text-4xl text-white mt-4 mb-4">PAGE NOT FOUND</h1>
        <p className="text-ballers-muted mb-8">
          Looks like this page went offside. Let's get you back in the game.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/products" className="btn-secondary">
            Shop Kits
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
