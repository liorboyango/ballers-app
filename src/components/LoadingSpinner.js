import React from 'react';

/**
 * LoadingSpinner component
 * Accessible loading indicator with customizable size.
 */
const LoadingSpinner = ({ size = 'md', label = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      role="status"
      aria-label={label}
      className="flex items-center justify-center"
    >
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-ballers-border border-t-gold animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
