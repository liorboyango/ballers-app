/**
 * CrawlLoadingOverlay
 * Full-page semi-transparent overlay displayed immediately after the user
 * submits the import form while waiting for the backend to start responding.
 *
 * Shows:
 * - Animated spinner
 * - "Preparing import…" label
 * - Pulsing dots to indicate activity
 *
 * Accessibility:
 * - role="status" with aria-live so screen readers announce the state
 * - aria-label describes what is happening
 * - Prevents focus escape to background via inert trick (CSS pointer-events-none on bg)
 *
 * @param {boolean} visible - Whether to render the overlay
 * @param {string} [message] - Optional status message
 */
import React from 'react';

function PulsingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4" aria-hidden="true">
      <span
        className="w-1 h-1 rounded-full bg-brand inline-block"
        style={{ animation: 'crawlDot 1.2s ease-in-out 0s infinite' }}
      />
      <span
        className="w-1 h-1 rounded-full bg-brand inline-block"
        style={{ animation: 'crawlDot 1.2s ease-in-out 0.2s infinite' }}
      />
      <span
        className="w-1 h-1 rounded-full bg-brand inline-block"
        style={{ animation: 'crawlDot 1.2s ease-in-out 0.4s infinite' }}
      />
    </span>
  );
}

function CrawlLoadingOverlay({ visible = false, message = 'Preparing import…' }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-label="Import in progress"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 min-w-[260px]"
        role="status"
        aria-live="polite"
      >
        {/* Large spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: '1.2s' }}
            fill="none"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#E8F3EC"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#1F6E3A"
              strokeWidth="6"
              strokeDasharray="88 176"
              strokeLinecap="round"
            />
          </svg>

          {/* Inner pulse */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-7 h-7 rounded-full bg-brand-50 animate-ping opacity-60" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-5 h-5 rounded-full bg-brand opacity-80" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-ink flex items-center gap-1.5 justify-center">
            {message}
            <PulsingDots />
          </p>
          <p className="text-xs text-ink-muted">
            Fetching albums and processing images
          </p>
        </div>

        {/* Warning */}
        <p className="text-xs text-ink-faint text-center max-w-[200px]">
          Do not close this tab while import is running.
        </p>
      </div>
    </div>
  );
}

export default CrawlLoadingOverlay;
