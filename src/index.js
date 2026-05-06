/**
 * Ballers App - Entry Point
 *
 * Bootstraps the React application and registers the PWA service worker.
 * The service worker enables offline support and asset caching via Workbox.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './styles/globals.css';

// --- App Render ---

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// --- PWA Service Worker Registration ---

/**
 * Register the service worker for PWA capabilities.
 *
 * The service worker (built with Workbox) provides:
 * - Offline support via cached assets and API responses
 * - Cache-First strategy for static assets (JS, CSS, images, fonts)
 * - Network-First strategy for API calls with offline fallback
 * - Background sync for failed mutations
 * - Push notification support
 *
 * Callbacks:
 * - onSuccess: App is ready to work offline (first install)
 * - onUpdate: New version available (prompt user to refresh)
 */
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.info(
      '[Ballers] App is ready to work offline! Service worker registered:',
      registration.scope
    );
    // Dispatch a custom event so components can react (e.g., show a toast)
    window.dispatchEvent(
      new CustomEvent('sw:success', { detail: { registration } })
    );
  },
  onUpdate: (registration) => {
    console.info(
      '[Ballers] New version available! Reload to update.',
      registration.scope
    );
    // Dispatch a custom event so components can show an "Update Available" banner
    window.dispatchEvent(
      new CustomEvent('sw:update', { detail: { registration } })
    );
  },
});
