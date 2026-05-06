/**
 * Service Worker Registration Helper
 *
 * Handles registration and lifecycle management of the Ballers PWA service worker.
 * Provides callbacks for:
 * - onSuccess: Called when the SW is registered and content is cached for offline use
 * - onUpdate: Called when a new SW version is available
 *
 * Usage:
 *   import * as serviceWorkerRegistration from './serviceWorkerRegistration';
 *   serviceWorkerRegistration.register({ onUpdate: handleUpdate });
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

/**
 * Register the service worker.
 *
 * In production, registers the CRA-generated service-worker.js.
 * In development, the SW is not registered to avoid caching issues.
 *
 * @param {Object} [config] - Optional lifecycle callbacks.
 * @param {Function} [config.onSuccess] - Called when SW is installed and content is cached.
 * @param {Function} [config.onUpdate] - Called when a new SW version is available.
 */
export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);

    if (publicUrl.origin !== window.location.origin) {
      // SW won't work if PUBLIC_URL is on a different origin (e.g., CDN)
      console.warn(
        '[SW] Service worker not registered: PUBLIC_URL is on a different origin.'
      );
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = process.env.PUBLIC_URL + '/service-worker.js';

      if (isLocalhost) {
        // Running on localhost: verify the SW still exists
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.info(
            '[SW] This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        // Not localhost: register the service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * Unregister all service workers.
 * Useful for disabling PWA caching during development or debugging.
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.info('[SW] Service worker unregistered.');
      })
      .catch((error) => {
        console.error('[SW] Error unregistering service worker:', error);
      });
  }
}

/**
 * Register a valid service worker and set up lifecycle callbacks.
 *
 * @param {string} swUrl - URL of the service worker script.
 * @param {Object} [config] - Optional lifecycle callbacks.
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available; notify the user
              console.info(
                '[SW] New content is available and will be used when all tabs are closed.'
              );
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content is cached for offline use
              console.info('[SW] Content is cached for offline use.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Error during service worker registration:', error);
    });
}

/**
 * Check if the service worker can be found. If it can't, reload the page.
 * Handles the case where the developer switched from a SW-enabled page to one that isn't.
 *
 * @param {string} swUrl - URL of the service worker script.
 * @param {Object} [config] - Optional lifecycle callbacks.
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.info(
        '[SW] No internet connection found. App is running in offline mode.'
      );
    });
}
