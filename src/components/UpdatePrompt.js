/**
 * UpdatePrompt Component
 *
 * Displays a non-intrusive banner at the bottom of the screen when a new
 * version of the app is available (detected via the SW update event).
 * The user can click "Refresh" to activate the new service worker immediately.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';

/**
 * UpdatePrompt
 *
 * Listens for the custom `sw:update` event dispatched by serviceWorkerRegistration.js
 * and renders a toast-style banner prompting the user to refresh.
 *
 * @returns {JSX.Element|null}
 */
const UpdatePrompt = () => {
  const { t } = useTranslation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState(null);

  // Listen for SW update events
  useEffect(() => {
    const handleUpdate = (event) => {
      setRegistration(event.detail ? event.detail.registration : null);
      setShowPrompt(true);
    };

    window.addEventListener('sw:update', handleUpdate);
    return () => window.removeEventListener('sw:update', handleUpdate);
  }, []);

  // Activate the new SW and reload
  const handleRefresh = useCallback(() => {
    if (registration && registration.waiting) {
      // Tell the waiting SW to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [registration]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
  }, []);

  if (!showPrompt) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
    >
      <div
        className="bg-[#16213E] border-l-4 border border-[#E8C547] rounded-xl shadow-2xl p-4"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 text-2xl" aria-hidden="true">
            &#x1F504;
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              {t('update.title')}
            </p>
            <p className="text-[#A8B2C1] text-xs mt-1">
              {t('update.message', { brand: t('brand.name') })}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-[#A8B2C1] hover:text-white transition-colors"
            aria-label={t('update.dismiss')}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleRefresh}
            className="flex-1 bg-[#E8C547] text-[#1A1A2E] font-bold text-xs uppercase
                       tracking-wider py-2 px-4 rounded-md hover:bg-[#D4A800]
                       transition-colors focus:outline-none focus:ring-2
                       focus:ring-[#E8C547] focus:ring-offset-2 focus:ring-offset-[#16213E]"
          >
            {t('update.refresh')}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 border border-[#2A3550] text-[#A8B2C1] font-medium text-xs
                       uppercase tracking-wider py-2 px-4 rounded-md
                       hover:border-[#E8C547] hover:text-white transition-colors
                       focus:outline-none focus:ring-2 focus:ring-[#E8C547]
                       focus:ring-offset-2 focus:ring-offset-[#16213E]"
          >
            {t('update.later')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
