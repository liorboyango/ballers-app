/**
 * NotFoundPage — 404 error page.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center px-4">
      <div className="text-center">
        <h1
          className="text-9xl font-black text-[#E8C547] mb-4"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-[#A8B2C1] mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#E8C547] text-[#1A1A2E] font-bold uppercase tracking-wider px-8 py-3 rounded-lg hover:bg-[#D4A800] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
