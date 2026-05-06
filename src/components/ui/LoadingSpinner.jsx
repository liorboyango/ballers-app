/**
 * LoadingSpinner Component
 * Displays a spinning loader with optional message.
 * Used for full-page and inline loading states.
 */
import React from 'react';

/**
 * @param {Object} props
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Spinner size
 * @param {string} [props.message] - Optional loading message
 * @param {boolean} [props.fullPage=false] - Center in full page
 * @param {string} [props.className] - Additional CSS classes
 */
const LoadingSpinner = ({ size = 'md', message, fullPage = false, className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`
          ${sizeClasses[size] || sizeClasses.md}
          rounded-full
          border-navy-surface
          border-t-gold
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-ballers-muted text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
