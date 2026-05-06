/**
 * Ballers App - Entry Point
 * Renders the React app and registers the PWA service worker.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA support
// Change register() to unregister() to disable PWA
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('[SW] Service worker registered successfully:', registration);
  },
  onUpdate: (registration) => {
    console.log('[SW] New content available, please refresh:', registration);
  },
});

// Report web vitals for performance monitoring
reportWebVitals();
