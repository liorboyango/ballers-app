/**
 * App.js — Root application component.
 *
 * Sets up:
 *  - React Router for client-side navigation
 *  - Context providers (Auth, Cart, Toast) wrapping all routes
 *  - Lazy-loaded page components for code splitting
 *  - Protected route handling
 *  - Global layout (Header, Footer)
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';
import ProtectedRoute from './components/ProtectedRoute';

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────────
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
 * App component — root of the React application.
 */
function App() {
  return (
    <Router>
      {/* Auth must be outermost so Cart can access auth state */}
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen bg-[#1A1A2E] text-white flex flex-col">
              <Header />
              <main className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/teams" element={<TeamsPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:teamId" element={<ProductsPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected routes — require authentication */}
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback */}
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
