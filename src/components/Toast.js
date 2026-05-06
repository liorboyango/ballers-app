import React, { useEffect } from 'react';

/**
 * Toast notification component
 * Displays a temporary notification message.
 * Positioned bottom-right with gold left border per design spec.
 */
const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeStyles = {
    success: 'border-l-4 border-gold',
    error: 'border-l-4 border-ballers-red',
    info: 'border-l-4 border-blue-400',
    warning: 'border-l-4 border-yellow-400',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-surface ${
        typeStyles[type] || typeStyles.success
      } rounded-lg shadow-2xl px-4 py-3 max-w-sm animate-slide-in-right`}
    >
      <span
        className={`flex-shrink-0 font-bold text-sm ${
          type === 'success'
            ? 'text-gold'
            : type === 'error'
            ? 'text-ballers-red'
            : type === 'warning'
            ? 'text-yellow-400'
            : 'text-blue-400'
        }`}
        aria-hidden="true"
      >
        {iconMap[type]}
      </span>
      <p className="text-white text-sm flex-1">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-ballers-muted hover:text-white transition-colors ml-2"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
