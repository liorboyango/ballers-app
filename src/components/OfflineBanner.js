/**
 * OfflineBanner Component
 *
 * Displays a persistent banner at the top of the screen when the user
 * loses their internet connection. Automatically hides when connectivity
 * is restored.
 */

import React, { useState, useEffect } from 'react';

/**
 * OfflineBanner
 *
 * Uses the browser's `online` and `offline` events to detect connectivity
 * changes and renders an accessible warning banner.
 *
 * @returns {JSX.Element|null}
 */
const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="fixed top-0 left-0 right-0 z-50 bg-[#C0392B] text-white
                 text-center text-sm font-medium py-2 px-4 shadow-lg"
    >
      <span aria-hidden="true">&#128225; </span>
      You're offline &mdash; some features may be unavailable. Cached content is
      still accessible.
    </div>
  );
};

export default OfflineBanner;
