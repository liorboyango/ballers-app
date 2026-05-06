/**
 * ToastContext
 * Provides a global toast notification system.
 * Toasts appear bottom-right with gold left border per design spec.
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
   * Add a toast notification
   * @param {Object} toast - Toast config
   * @param {string} toast.message - Toast message
   * @param {'success'|'error'|'info'|'warning'} [toast.type='info'] - Toast type
   * @param {number} [toast.duration=4000] - Auto-dismiss duration in ms
   */
  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  /**
   * Remove a toast by ID
   * @param {number} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods
  const toast = {
    success: (message, opts = {}) => addToast({ message, type: 'success', ...opts }),
    error: (message, opts = {}) => addToast({ message, type: 'error', ...opts }),
    info: (message, opts = {}) => addToast({ message, type: 'info', ...opts }),
    warning: (message, opts = {}) => addToast({ message, type: 'warning', ...opts }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Toast container - renders all active toasts
 */
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

/**
 * Individual Toast component
 */
const Toast = ({ toast, onClose }) => {
  const typeStyles = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500',
    warning: 'border-l-4 border-yellow-500',
    info: 'border-l-4 border-gold',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const iconColorMap = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-gold',
  };

  return (
    <div
      className={`
        flex items-start gap-3 min-w-[280px] max-w-sm
        bg-navy-surface rounded-lg shadow-xl px-4 py-3
        animate-slide-in-right
        ${typeStyles[toast.type] || typeStyles.info}
      `}
      role="alert"
    >
      <span className={`text-lg font-bold mt-0.5 ${iconColorMap[toast.type] || iconColorMap.info}`}>
        {iconMap[toast.type] || iconMap.info}
      </span>
      <p className="flex-1 text-white text-sm leading-relaxed">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-ballers-muted hover:text-white transition-colors ml-2 text-lg leading-none"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

/**
 * useToast hook
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export default ToastContext;
