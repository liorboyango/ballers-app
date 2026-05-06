/**
 * Toast notification system.
 * Provides a ToastProvider and useToast hook for showing
 * success/error/info notifications.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION = 4000;

/**
 * Individual toast notification.
 */
function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: (
      <svg className="w-5 h-5 text-[#27AE60] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borderColors = {
    success: 'border-l-[#27AE60]',
    error: 'border-l-red-500',
    info: 'border-l-blue-500',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 p-4 rounded-lg bg-[#16213E] border border-[#2A3550] border-l-4 ${borderColors[toast.type] || borderColors.info} shadow-xl min-w-[280px] max-w-sm animate-fade-in`}
    >
      {icons[toast.type] || icons.info}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-white text-sm font-semibold">{toast.title}</p>
        )}
        <p className="text-[#A8B2C1] text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#A8B2C1] hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * ToastProvider - Wrap your app with this to enable toasts.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ type: 'success', title, message }),
    error: (message, title) => addToast({ type: 'error', title, message }),
    info: (message, title) => addToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container - bottom right */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast - Hook to access toast notifications.
 * @returns {{ success, error, info }} toast methods
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
