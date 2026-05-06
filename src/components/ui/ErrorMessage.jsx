/**
 * ErrorMessage Component
 * Displays error messages with retry functionality.
 * Used for API error states throughout the app.
 */
import React from 'react';

/**
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} [props.onRetry] - Optional retry callback
 * @param {boolean} [props.fullPage=false] - Center in full page
 * @param {string} [props.className] - Additional CSS classes
 */
const ErrorMessage = ({ message, onRetry, fullPage = false, className = '' }) => {
  const content = (
    <div
      className={`
        flex flex-col items-center justify-center gap-4 p-8
        text-center ${className}
      `}
      role="alert"
    >
      <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">Something went wrong</h3>
        <p className="text-ballers-muted text-sm max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            px-6 py-2 bg-gold text-navy font-bold uppercase tracking-wider
            rounded-md hover:bg-gold-hover transition-colors text-sm
          "
        >
          Try Again
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        {content}
      </div>
    );
  }

  return content;
};

export default ErrorMessage;
