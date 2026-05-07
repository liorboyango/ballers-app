/**
 * ToastContext
 * Provides a global toast notification system.
 * Updated in Task 4 to:
 * - Use light-theme compatible styling (not dark navy) for admin pages
 * - Support 'warning' type with amber styling
 * - Animate in from the right with smooth slide + fade
 * - Render toasts with proper accessible role/aria attributes
 * - Auto-dismiss with configurable duration
 * - Support persistent toasts (duration=0)
 */
import React, { createContext, useState, useCallback, useContext } from 'react';

export const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * ToastProvider component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a toast notification.
   * @param {Object} options
   * @param {string} options.message
   * @param {'success'|'error'|'info'|'warning'} [options.type='info']
   * @param {number} [options.duration=5000] - ms before auto-dismiss; 0 = persistent
   */
  const addToast = useCallback(({ message, type = 'info', duration = 5000 }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [
      ...prev.slice(-4), // keep at most 5 toasts at once
      { id, message, type, duration },
    ]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  /**
   * Remove a toast by ID.
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods
  const toast = {
    success: (message, opts = {}) =>
      addToast({ message, type: 'success', duration: 5000, ...opts }),
    error: (message, opts = {}) =>
      addToast({ message, type: 'error', duration: 7000, ...opts }),
    info: (message, opts = {}) =>
      addToast({ message, type: 'info', duration: 5000, ...opts }),
    warning: (message, opts = {}) =>
      addToast({ message, type: 'warning', duration: 6000, ...opts }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// ─── Toast Container ──────────────────────────────────────────────────────────

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

// ─── Toast Item ───────────────────────────────────────────────────────────────

const TOAST_CONFIG = {
  success: {
    border: 'border-l-green-500',
    bg: 'bg-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    border: 'border-l-red-500',
    bg: 'bg-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    border: 'border-l-brand',
    bg: 'bg-white',
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand',
    titleColor: 'text-brand-700',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const ToastItem = ({ toast, onClose }) => {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <div
      className={`
        flex items-start gap-3
        min-w-[300px] max-w-[420px]
        ${config.bg} ${config.border}
        border border-line border-l-4
        rounded-xl shadow-elevated
        px-4 py-3.5
        animate-toast-in
      `}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {/* Icon */}
      <span
        className={`w-7 h-7 rounded-full ${config.iconBg} ${config.iconColor}
          flex items-center justify-center flex-shrink-0 mt-0.5`}
        aria-hidden="true"
      >
        {config.icon}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm text-ink leading-relaxed pt-0.5">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="
          ml-1 flex-shrink-0 text-ink-faint hover:text-ink
          transition-colors rounded-md p-0.5
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand
        "
        aria-label="Dismiss notification"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// ─── useToast hook ────────────────────────────────────────────────────────────

/**
 * useToast hook — returns { success, error, info, warning } convenience methods.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export default ToastContext;
