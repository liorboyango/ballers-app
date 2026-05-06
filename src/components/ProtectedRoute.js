/**
 * ProtectedRoute — wraps routes that require authentication.
 * Redirects unauthenticated users to /login, preserving the intended destination.
 *
 * Usage:
 *   <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';

/**
 * @param {React.ReactNode} children - protected page component
 * @param {string} [redirectTo='/login'] - redirect destination for unauthenticated users
 */
const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loader while verifying stored token
  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    // Preserve the intended URL so we can redirect back after login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
