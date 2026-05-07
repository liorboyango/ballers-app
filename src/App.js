/**
 * App.js
 * Root application component with React Router configuration.
 * Wraps all pages with AuthProvider, CartProvider, and ToastProvider.
 *
 * Admin routes are protected by AdminRoute which:
 *  - Redirects unauthenticated users to /login (with 'from' state for return)
 *  - Redirects non-admin users (role !== 'admin') back to /
 *
 * Task 5 additions:
 *  - Added /admin/import shortcut route (redirects to /admin/inventory?tab=supplier-import)
 *    allowing deep links from emails / notifications directly to the import tab.
 */
import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AdminRoute from './components/AdminRoute';
import { LoadingSpinner } from './components/ui';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutCompletePage = lazy(() => import('./pages/CheckoutCompletePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));

const PageLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center">
      <LoadingSpinner size="xl" message={t('common.loading')} />
    </div>
  );
};

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-display text-7xl text-brand mb-3">{t('notFound.title')}</h1>
        <p className="text-ink-muted text-lg mb-6">{t('notFound.message')}</p>
        <Link
          to="/"
          className="btn-primary px-6 py-3"
        >
          {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  );
};

/**
 * Layout switcher — admin routes render without storefront chrome (their own sidebar).
 * CartDrawer is rendered globally so it's accessible from any page.
 */
function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted text-ink">
      {!isAdminRoute && <Header />}
      {/* CartDrawer rendered globally — controlled by CartContext isCartOpen state */}
      {!isAdminRoute && <CartDrawer />}
      <Suspense fallback={<PageLoader />}>
        <div className="flex-1">
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/complete" element={<CheckoutCompletePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />

            {/* ── Admin routes (protected: must be authenticated + role=admin) ── */}
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
            {/*
              Shortcut: /admin/import navigates directly to the supplier import tab.
              Wrapped in AdminRoute so unauthenticated users are redirected to /login.
            */}
            <Route
              path="/admin/import"
              element={
                <AdminRoute>
                  <Navigate
                    to="/admin/inventory?tab=supplier-import"
                    replace
                  />
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
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <AppShell />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
