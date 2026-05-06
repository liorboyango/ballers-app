/**
 * ToastContext — lightweight toast notification system.
 *
 * Provides:
 *  - toasts: array of active toast objects
 *  - showToast(message, type, duration): display a notification
 *  - showSuccess(message): shorthand for success toast
 *  - showError(message): shorthand for error toast
 *  - showInfo(message): shorthand for info toast
 *  - removeToast(id): manually dismiss a toast
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

export const ToastContext = createContext(null);

/** Toast types */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

/**
 * ToastProvider — wraps the app and provides toast notifications.
 * @param {React.ReactNode} children
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Display a toast notification.
   * @param {string} message - notification text
   * @param {string} type - one of TOAST_TYPES values
   * @param {number} duration - auto-dismiss delay in ms (0 = no auto-dismiss)
   * @returns {string} toast id
   */
  const showToast = useCallback(
    (message, type = TOAST_TYPES.INFO, duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  /**
   * Remove a specific toast by id.
   * @param {string} id
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /** Shorthand helpers */
  const showSuccess = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.SUCCESS, duration),
    [showToast]
  );

  const showError = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.ERROR, duration),
    [showToast]
  );

  const showInfo = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.INFO, duration),
    [showToast]
  );

  const showWarning = useCallback(
    (message, duration) => showToast(message, TOAST_TYPES.WARNING, duration),
    [showToast]
  );

  const value = {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * ToastContainer — renders active toasts in the bottom-right corner.
 */
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

/**
 * Individual Toast component.
 */
const Toast = ({ toast, onRemove }) => {
  const typeStyles = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500',
    info: 'border-l-4 border-gold',
    warning: 'border-l-4 border-yellow-500',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const iconColorMap = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-yellow-400',
    warning: 'text-yellow-500',
  };

  return (
    <div
      className={`
        bg-[#16213E] text-white rounded-lg shadow-2xl px-4 py-3
        flex items-start gap-3 animate-slide-in
        ${typeStyles[toast.type] || typeStyles.info}
      `}
      role="alert"
    >
      <span
        className={`text-lg font-bold mt-0.5 flex-shrink-0 ${iconColorMap[toast.type] || iconColorMap.info}`}
        aria-hidden="true"
      >
        {iconMap[toast.type] || iconMap.info}
      </span>
      <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#A8B2C1] hover:text-white transition-colors flex-shrink-0 ml-1"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * useToast hook — access toast context from any component.
 * @returns {object} toast context value
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
