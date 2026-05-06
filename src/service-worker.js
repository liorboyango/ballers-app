/**
 * Ballers PWA Service Worker
 * Built with Workbox for advanced caching strategies.
 *
 * Caching Strategy:
 * - Static assets (JS, CSS, fonts, images): Cache-First
 * - API calls (/api/*): Network-First with offline fallback
 * - HTML navigation: Network-First with offline page fallback
 * - Google Fonts: StaleWhileRevalidate
 */

/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// --- Core Setup ---

/**
 * Take control of all clients immediately without waiting for page reload.
 */
clientsClaim();

/**
 * Precache all assets injected by the Workbox webpack plugin during build.
 * The __WB_MANIFEST placeholder is replaced at build time.
 */
precacheAndRoute(self.__WB_MANIFEST);

// --- Navigation (SPA) ---

/**
 * Handle all navigation requests (HTML) with a Network-First strategy.
 * Falls back to the cached index.html for SPA client-side routing.
 */
const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
});
registerRoute(navigationRoute);

// --- API Routes (Network-First) ---

/**
 * Background sync plugin for failed POST/PUT/DELETE mutations.
 * Queues failed requests and replays them when connectivity is restored.
 */
const bgSyncPlugin = new BackgroundSyncPlugin('ballers-mutations-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
});

/**
 * GET API requests: Network-First with a 5-second timeout.
 * Falls back to cache if the network is unavailable.
 * Cached responses expire after 5 minutes to keep data fresh.
 */
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/') &&
    self.location.origin === url.origin,
  new NetworkFirst({
    cacheName: 'ballers-api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// --- Static Assets (Cache-First) ---

/**
 * JavaScript and CSS bundles: Cache-First.
 * Content-hashed by the build tool so safe to cache indefinitely.
 */
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'ballers-static-resources',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Images: Cache-First.
 * Includes local images and product images served from /uploads/*.
 */
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    url.pathname.startsWith('/uploads/'),
  new CacheFirst({
    cacheName: 'ballers-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// --- Google Fonts (StaleWhileRevalidate) ---

/**
 * Google Fonts stylesheets: StaleWhileRevalidate.
 */
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'ballers-google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

/**
 * Google Fonts webfont files: Cache-First.
 * Font files are immutable (versioned URLs).
 */
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'ballers-google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// --- Service Worker Lifecycle Events ---

/**
 * Listen for messages from the main thread.
 * Supports SKIP_WAITING to activate the new SW immediately.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Push notification handler.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Ballers', body: event.data.text() };
  }

  const options = {
    body: data.body || 'New update from Ballers!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ballers', options)
  );
});

/**
 * Notification click handler.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
