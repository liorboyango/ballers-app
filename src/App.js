/**
 * Ballers App - Root Component
 * Configures React Router with all application routes.
 * Wraps the app with AuthProvider and CartProvider context.
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';

// Lazy-load pages for code splitting and performance
const HomePage = lazy(() => import('./pages/HomePage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * Main App component with routing and context providers.
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-navy flex flex-col">
            {/* Persistent Header */}
            <Header />

            {/* Main Content */}
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Home */}
                  <Route path="/" element={<HomePage />} />

                  {/* Teams listing */}
                  <Route path="/teams" element={<TeamsPage />} />

                  {/* All products (no team filter) */}
                  <Route path="/products" element={<ProductsPage />} />

                  {/* Products filtered by team */}
                  <Route path="/products/:teamId" element={<ProductsPage />} />

                  {/* Single product detail */}
                  <Route path="/product/:id" element={<ProductDetailPage />} />

                  {/* Shopping cart */}
                  <Route path="/cart" element={<CartPage />} />

                  {/* Checkout */}
                  <Route path="/checkout" element={<CheckoutPage />} />

                  {/* Authentication */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* 404 fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>

            {/* Persistent Footer */}
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
