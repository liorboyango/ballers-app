/**
 * App.js
 * Root application component with React Router configuration.
 * Wraps all pages with AuthProvider, CartProvider, and ToastProvider.
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';
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
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));

const PageLoader = () => (
  <div className="min-h-screen bg-surface-muted flex items-center justify-center">
    <LoadingSpinner size="xl" message="Loading..." />
  </div>
);

const NotFound = () => (
  <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
    <div>
      <h1 className="text-display text-7xl text-brand mb-3">404</h1>
      <p className="text-ink-muted text-lg mb-6">Page not found</p>
      <Link
        to="/"
        className="btn-primary px-6 py-3"
      >
        Go Home
      </Link>
    </div>
  </div>
);

/**
 * Layout switcher — admin routes render without storefront chrome (their own sidebar).
 */
function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted text-ink">
      {!isAdminRoute && <Header />}
      <Suspense fallback={<PageLoader />}>
        <div className="flex-1">
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

            {/* Admin (protected) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminOverview />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <AdminInventory />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Suspense>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
