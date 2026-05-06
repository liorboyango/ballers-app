/**
 * App.js
 * Root application component with React Router configuration.
 * Wraps all pages with AuthProvider, CartProvider, and ToastProvider.
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import { LoadingSpinner } from './components/ui';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));

/**
 * Page loading fallback
 */
const PageLoader = () => (
  <div className="min-h-screen bg-navy flex items-center justify-center">
    <LoadingSpinner size="xl" message="Loading..." />
  </div>
);

/**
 * App component
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen bg-navy text-white">
              <Header />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/teams" element={<TeamsPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<LoginPage />} />
                  <Route path="/order-success/:id" element={<OrderSuccessPage />} />
                  <Route path="/order-success" element={<OrderSuccessPage />} />
                  {/* 404 fallback */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-screen bg-navy flex items-center justify-center text-center px-4">
                        <div>
                          <h1 className="font-bebas text-8xl text-gold mb-4">404</h1>
                          <p className="text-ballers-muted text-lg mb-6">Page not found</p>
                          <a href="/" className="px-6 py-3 bg-gold text-navy font-bold uppercase tracking-wider rounded-lg hover:bg-gold-hover transition-colors">
                            Go Home
                          </a>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
